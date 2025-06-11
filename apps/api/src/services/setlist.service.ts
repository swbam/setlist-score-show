import { PrismaClient } from '@setlist/database'
import { logger } from '../lib/logger'

export class SetlistService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Creates an initial setlist for a new show with 5 random songs from the artist's catalog
   */
  async createInitialSetlist(showId: string, artistId: string): Promise<void> {
    try {
      logger.info(`Creating initial setlist for show ${showId}, artist ${artistId}`)

      // Check if setlist already exists
      const existingSetlist = await this.prisma.setlist.findFirst({
        where: { showId }
      })

      if (existingSetlist) {
        logger.info(`Setlist already exists for show ${showId}`)
        return
      }

      // Get artist's song catalog
      const songs = await this.prisma.song.findMany({
        where: { artistId },
        orderBy: { popularity: 'desc' }
      })

      if (songs.length === 0) {
        logger.warn(`No songs found for artist ${artistId}`)
        return
      }

      // Select 5 varied songs (mix of popular and deep cuts)
      const selectedSongs = this.selectVariedSongs(songs, 5)

      if (selectedSongs.length === 0) {
        logger.warn(`Could not select songs for artist ${artistId}`)
        return
      }

      // Create the setlist
      const setlist = await this.prisma.setlist.create({
        data: {
          showId,
          name: 'Main Set',
          orderIndex: 0,
          isEncore: false
        }
      })

      // Add songs to setlist with initial vote count of 0
      await Promise.all(
        selectedSongs.map((song, index) =>
          this.prisma.setlistSong.create({
            data: {
              setlistId: setlist.id,
              songId: song.id,
              position: index + 1,
              voteCount: 0
            }
          })
        )
      )

      logger.info(`Created initial setlist for show ${showId} with ${selectedSongs.length} songs`)
    } catch (error) {
      logger.error(`Failed to create initial setlist for show ${showId}:`, error)
      throw error
    }
  }

  /**
   * Selects varied songs from an artist's catalog
   * Ensures a mix of popular hits and deeper cuts
   */
  private selectVariedSongs(songs: any[], count: number): any[] {
    if (songs.length <= count) {
      return songs
    }

    const selected: any[] = []
    const totalSongs = songs.length

    // Take top 2 most popular songs
    const popularSongs = songs.slice(0, Math.min(10, Math.floor(totalSongs * 0.3)))
    selected.push(...this.getRandomSongs(popularSongs, Math.min(2, count)))

    // Take 2-3 songs from middle popularity range
    const midRangeStart = Math.floor(totalSongs * 0.3)
    const midRangeEnd = Math.floor(totalSongs * 0.7)
    const midRangeSongs = songs.slice(midRangeStart, midRangeEnd)
    const midCount = Math.min(2, count - selected.length)
    if (midCount > 0 && midRangeSongs.length > 0) {
      selected.push(...this.getRandomSongs(midRangeSongs, midCount))
    }

    // Fill remaining slots with random songs from entire catalog
    const remaining = count - selected.length
    if (remaining > 0) {
      const availableSongs = songs.filter(song => 
        !selected.some(s => s.id === song.id)
      )
      selected.push(...this.getRandomSongs(availableSongs, remaining))
    }

    return selected.slice(0, count)
  }

  /**
   * Gets random songs from an array
   */
  private getRandomSongs(songs: any[], count: number): any[] {
    if (songs.length <= count) {
      return [...songs]
    }

    const shuffled = [...songs].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  /**
   * Adds a song to an existing setlist
   */
  async addSongToSetlist(setlistId: string, songId: string): Promise<void> {
    try {
      // Check if song is already in setlist
      const existingSong = await this.prisma.setlistSong.findFirst({
        where: {
          setlistId,
          songId
        }
      })

      if (existingSong) {
        throw new Error('Song is already in the setlist')
      }

      // Get current max position
      const maxPosition = await this.prisma.setlistSong.aggregate({
        where: { setlistId },
        _max: { position: true }
      })

      const newPosition = (maxPosition._max.position || 0) + 1

      // Add song to setlist
      await this.prisma.setlistSong.create({
        data: {
          setlistId,
          songId,
          position: newPosition,
          voteCount: 0
        }
      })

      logger.info(`Added song ${songId} to setlist ${setlistId} at position ${newPosition}`)
    } catch (error) {
      logger.error(`Failed to add song to setlist:`, error)
      throw error
    }
  }

  /**
   * Removes a song from a setlist
   */
  async removeSongFromSetlist(setlistId: string, songId: string): Promise<void> {
    try {
      const setlistSong = await this.prisma.setlistSong.findFirst({
        where: {
          setlistId,
          songId
        }
      })

      if (!setlistSong) {
        throw new Error('Song not found in setlist')
      }

      // Delete the setlist song
      await this.prisma.setlistSong.delete({
        where: { id: setlistSong.id }
      })

      // Reorder remaining songs
      await this.reorderSetlistSongs(setlistId)

      logger.info(`Removed song ${songId} from setlist ${setlistId}`)
    } catch (error) {
      logger.error(`Failed to remove song from setlist:`, error)
      throw error
    }
  }

  /**
   * Reorders setlist songs to fill gaps in positions
   */
  private async reorderSetlistSongs(setlistId: string): Promise<void> {
    const songs = await this.prisma.setlistSong.findMany({
      where: { setlistId },
      orderBy: { position: 'asc' }
    })

    // Update positions to be sequential
    await Promise.all(
      songs.map((song, index) =>
        this.prisma.setlistSong.update({
          where: { id: song.id },
          data: { position: index + 1 }
        })
      )
    )
  }

  /**
   * Gets setlist with songs ordered by vote count
   */
  async getSetlistWithVotes(showId: string) {
    return this.prisma.setlist.findFirst({
      where: { showId },
      include: {
        setlistSongs: {
          include: {
            song: {
              include: {
                artist: true
              }
            }
          },
          orderBy: [
            { voteCount: 'desc' },
            { position: 'asc' }
          ]
        }
      }
    })
  }

  /**
   * Updates vote counts for setlist songs (called after voting)
   */
  async updateVoteCounts(setlistId: string): Promise<void> {
    try {
      // Get all setlist songs with their vote counts
      const setlistSongs = await this.prisma.setlistSong.findMany({
        where: { setlistId },
        include: {
          votes: true
        }
      })

      // Update vote counts
      await Promise.all(
        setlistSongs.map(song =>
          this.prisma.setlistSong.update({
            where: { id: song.id },
            data: { voteCount: song.votes.length }
          })
        )
      )

      logger.info(`Updated vote counts for setlist ${setlistId}`)
    } catch (error) {
      logger.error(`Failed to update vote counts:`, error)
      throw error
    }
  }
}