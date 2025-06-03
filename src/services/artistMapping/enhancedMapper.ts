import { supabase } from '@/integrations/supabase/client';
import { searchSpotifyArtists } from '../spotify';

interface MappingCandidate {
  spotifyId: string;
  spotifyName: string;
  confidence: number;
  matchFactors: string[];
  genres: string[];
  popularity: number;
}

export class EnhancedArtistMapper {
  // Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim();
  }
  
  private calculateMatchScore(name1: string, name2: string): number {
    const norm1 = this.normalizeName(name1);
    const norm2 = this.normalizeName(name2);
    
    // Exact match
    if (norm1 === norm2) return 1.0;
    
    // Calculate similarity
    const maxLen = Math.max(norm1.length, norm2.length);
    const distance = this.levenshteinDistance(norm1, norm2);
    const similarity = 1 - (distance / maxLen);
    
    // Boost score for partial matches
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return Math.min(similarity + 0.2, 0.95);
    }
    
    // Check for common abbreviations
    if (this.checkAbbreviations(norm1, norm2)) {
      return Math.min(similarity + 0.15, 0.9);
    }
    
    return similarity;
  }
  
  private checkAbbreviations(name1: string, name2: string): boolean {
    const abbreviations = [
      ['and', '&'],
      ['n', 'and'],
      ['feat', 'featuring'],
      ['vs', 'versus']
    ];
    
    for (const [abbr1, abbr2] of abbreviations) {
      const replaced1 = name1.replace(new RegExp(`\\b${abbr1}\\b`, 'g'), abbr2);
      const replaced2 = name2.replace(new RegExp(`\\b${abbr1}\\b`, 'g'), abbr2);
      
      if (replaced1 === name2 || name1 === replaced2) {
        return true;
      }
    }
    
    return false;
  }
  
  private getMatchFactors(name1: string, name2: string): string[] {
    const factors = [];
    const norm1 = this.normalizeName(name1);
    const norm2 = this.normalizeName(name2);
    
    if (norm1 === norm2) factors.push('exact_match');
    if (norm1.includes(norm2) || norm2.includes(norm1)) factors.push('substring_match');
    if (name1.length === name2.length) factors.push('same_length');
    
    const words1 = new Set(norm1.split(' '));
    const words2 = new Set(norm2.split(' '));
    const commonWords = [...words1].filter(w => words2.has(w));
    
    if (commonWords.length > 0) {
      factors.push(`common_words:${commonWords.length}`);
      const wordRatio = commonWords.length / Math.max(words1.size, words2.size);
      if (wordRatio > 0.8) factors.push('high_word_overlap');
    }
    
    if (this.checkAbbreviations(norm1, norm2)) {
      factors.push('abbreviation_match');
    }
    
    return factors;
  }
  
  async mapTicketmasterToSpotify(
    ticketmasterName: string,
    ticketmasterId: string
  ): Promise<string | null> {
    console.log(`Mapping artist: ${ticketmasterName} (TM ID: ${ticketmasterId})`);
    
    // Check if mapping already exists
    const { data: existing } = await supabase
      .from('artists')
      .select('id')
      .eq('ticketmaster_id', ticketmasterId)
      .single();
    
    if (existing) {
      console.log('Mapping already exists');
      return existing.id;
    }
    
    // Search Spotify for artist
    const candidates = await searchSpotifyArtists(ticketmasterName);
    
    if (!candidates || candidates.length === 0) {
      console.log('No Spotify candidates found');
      // Store unmapped artist for manual review
      await this.storeUnmappedArtist(ticketmasterId, ticketmasterName);
      return null;
    }
    
    // Score candidates
    const scoredCandidates: MappingCandidate[] = candidates.map(candidate => ({
      spotifyId: candidate.id,
      spotifyName: candidate.name,
      confidence: this.calculateMatchScore(ticketmasterName, candidate.name),
      matchFactors: this.getMatchFactors(ticketmasterName, candidate.name),
      genres: candidate.genres || [],
      popularity: candidate.popularity || 0
    }));
    
    // Sort by confidence
    scoredCandidates.sort((a, b) => b.confidence - a.confidence);
    
    const bestMatch = scoredCandidates[0];
    console.log(`Best match: ${bestMatch.spotifyName} (confidence: ${bestMatch.confidence})`);
    
    // Only accept high confidence matches automatically
    if (bestMatch.confidence > 0.85) {
      await this.createArtistMapping(
        bestMatch.spotifyId,
        bestMatch.spotifyName,
        ticketmasterName,
        ticketmasterId,
        candidates.find(c => c.id === bestMatch.spotifyId)!
      );
      return bestMatch.spotifyId;
    }
    
    // Store for manual review
    await this.storeMappingCandidate(
      ticketmasterId,
      ticketmasterName,
      bestMatch
    );
    
    // If confidence is reasonably high, still create the mapping
    if (bestMatch.confidence > 0.7) {
      await this.createArtistMapping(
        bestMatch.spotifyId,
        bestMatch.spotifyName,
        ticketmasterName,
        ticketmasterId,
        candidates.find(c => c.id === bestMatch.spotifyId)!
      );
      return bestMatch.spotifyId;
    }
    
    return null;
  }
  
  private async createArtistMapping(
    spotifyId: string,
    spotifyName: string,
    ticketmasterName: string,
    ticketmasterId: string,
    spotifyData: any
  ) {
    const { error } = await supabase
      .from('artists')
      .upsert({
        id: spotifyId,
        name: spotifyName,
        spotify_id: spotifyId,
        ticketmaster_id: ticketmasterId,
        ticketmaster_name: ticketmasterName,
        image_url: spotifyData.images?.[0]?.url,
        popularity: spotifyData.popularity,
        genres: spotifyData.genres,
        spotify_url: spotifyData.external_urls?.spotify,
        followers: spotifyData.followers?.total
      });
      
    if (error) {
      console.error('Failed to create artist mapping:', error);
      throw error;
    }
    
    console.log('Artist mapping created successfully');
  }
  
  private async storeUnmappedArtist(ticketmasterId: string, ticketmasterName: string) {
    // Create table if needed
    const { error } = await supabase
      .from('unmapped_artists')
      .upsert({
        ticketmaster_id: ticketmasterId,
        ticketmaster_name: ticketmasterName,
        attempted_at: new Date().toISOString()
      });
      
    if (error) {
      console.error('Failed to store unmapped artist:', error);
    }
  }
  
  private async storeMappingCandidate(
    ticketmasterId: string,
    ticketmasterName: string,
    candidate: MappingCandidate
  ) {
    // Create table if needed
    const { error } = await supabase
      .from('artist_mapping_candidates')
      .upsert({
        ticketmaster_id: ticketmasterId,
        ticketmaster_name: ticketmasterName,
        spotify_id: candidate.spotifyId,
        spotify_name: candidate.spotifyName,
        confidence_score: candidate.confidence,
        match_factors: candidate.matchFactors,
        status: 'pending_review'
      });
      
    if (error) {
      console.error('Failed to store mapping candidate:', error);
    }
  }
  
  // Batch mapping for multiple artists
  async batchMapArtists(artists: Array<{ ticketmasterId: string; ticketmasterName: string }>) {
    const results = [];
    
    for (const artist of artists) {
      try {
        const spotifyId = await this.mapTicketmasterToSpotify(
          artist.ticketmasterName,
          artist.ticketmasterId
        );
        results.push({ ...artist, spotifyId, success: true });
      } catch (error) {
        results.push({ ...artist, spotifyId: null, success: false, error });
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }
}

// Export singleton instance
export const artistMapper = new EnhancedArtistMapper();