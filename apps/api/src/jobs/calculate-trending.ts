import { PrismaClient } from '@setlist/database';
import { logger } from '../lib/logger';
import { subDays, startOfDay } from 'date-fns';

interface TrendingMetrics {
  showId: string;
  viewCount: number;
  voteCount: number;
  uniqueVoters: number;
  avgVotesPerSong: number;
  recentVotes: number;
  recentViews: number;
  daysUntilShow: number;
  trendingScore: number;
}

export class TrendingCalculationJob {
  constructor(private prisma: PrismaClient) {}

  async calculateTrendingScores() {
    logger.info('Starting trending score calculation');
    const startTime = Date.now();

    try {
      // Get all upcoming shows
      const shows = await this.prisma.show.findMany({
        where: {
          date: { gte: new Date() },
          status: { in: ['upcoming', 'ongoing'] }
        },
        include: {
          setlists: {
            include: {
              setlist_songs: true
            }
          },
          _count: {
            select: { 
              votes: true
            }
          }
        }
      });

      logger.info(`Processing ${shows.length} shows`);

      const metrics: TrendingMetrics[] = [];

      for (const show of shows) {
        // Calculate metrics for each show
        const metric = await this.calculateShowMetrics(show);
        metrics.push(metric);
      }

      // Sort by trending score
      metrics.sort((a, b) => b.trendingScore - a.trendingScore);

      // Update database with new scores
      await this.updateTrendingScores(metrics);

      // Refresh materialized view if it exists
      await this.refreshMaterializedView();

      const duration = Date.now() - startTime;
      logger.info(`Trending calculation complete in ${duration}ms`);

      return {
        processed: metrics.length,
        topTrending: metrics.slice(0, 10).map(m => ({
          showId: m.showId,
          score: m.trendingScore,
          votes: m.voteCount,
          views: m.viewCount
        })),
        duration
      };
    } catch (error) {
      logger.error('Failed to calculate trending scores:', error);
      throw error;
    }
  }

  private async calculateShowMetrics(show: any): Promise<TrendingMetrics> {
    const now = new Date();
    const showDate = new Date(show.date);
    const daysUntilShow = Math.max(0, Math.ceil((showDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Get vote statistics
    const voteStats = await this.prisma.vote.aggregate({
      where: { show_id: show.id },
      _count: true
    });

    const uniqueVoters = await this.prisma.vote.findMany({
      where: { show_id: show.id },
      distinct: ['user_id']
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = subDays(now, 7);
    
    const recentVotes = await this.prisma.vote.count({
      where: {
        show_id: show.id,
        created_at: { gte: sevenDaysAgo }
      }
    });

    // Calculate average votes per song
    const totalSongs = show.setlists.reduce((acc: number, setlist: any) => 
      acc + setlist.setlist_songs.length, 0
    );
    
    const totalVotes = show.setlists.reduce((acc: number, setlist: any) => 
      acc + setlist.setlist_songs.reduce((songAcc: number, song: any) => 
        songAcc + song.vote_count, 0
      ), 0
    );

    const avgVotesPerSong = totalSongs > 0 ? totalVotes / totalSongs : 0;

    // Calculate trending score with weighted factors
    const trendingScore = this.calculateTrendingScore({
      viewCount: show.view_count || 0,
      voteCount: voteStats._count || 0,
      uniqueVoters: uniqueVoters.length,
      avgVotesPerSong,
      recentVotes,
      recentViews: 0, // Would need view tracking to implement
      daysUntilShow
    });

    return {
      showId: show.id,
      viewCount: show.view_count || 0,
      voteCount: voteStats._count || 0,
      uniqueVoters: uniqueVoters.length,
      avgVotesPerSong,
      recentVotes,
      recentViews: 0,
      daysUntilShow,
      trendingScore
    };
  }

  private calculateTrendingScore(metrics: Omit<TrendingMetrics, 'showId' | 'trendingScore'>): number {
    const {
      viewCount,
      voteCount,
      uniqueVoters,
      avgVotesPerSong,
      recentVotes,
      recentViews,
      daysUntilShow
    } = metrics;

    // Time decay factor - shows closer in time are more relevant
    let timeMultiplier = 1;
    if (daysUntilShow <= 7) {
      timeMultiplier = 2.0;
    } else if (daysUntilShow <= 30) {
      timeMultiplier = 1.5;
    } else if (daysUntilShow <= 90) {
      timeMultiplier = 1.0;
    } else {
      timeMultiplier = 0.5;
    }

    // Recency boost - recent activity is more valuable
    const recencyScore = (recentVotes * 2) + recentViews;

    // Engagement score - unique voters matter more than total votes
    const engagementScore = (uniqueVoters * 3) + (voteCount * 0.5) + (avgVotesPerSong * 2);

    // Visibility score
    const visibilityScore = Math.log10(viewCount + 1) * 10;

    // Combined score with weights
    const baseScore = (
      (visibilityScore * 0.2) +
      (engagementScore * 0.5) +
      (recencyScore * 0.3)
    );

    return baseScore * timeMultiplier;
  }

  private async updateTrendingScores(metrics: TrendingMetrics[]) {
    // Batch update trending scores
    const updates = metrics.map(metric => 
      this.prisma.show.update({
        where: { id: metric.showId },
        data: { 
          trending_score: metric.trendingScore,
          updated_at: new Date()
        }
      })
    );

    await this.prisma.$transaction(updates);
    logger.info(`Updated trending scores for ${metrics.length} shows`);
  }

  private async refreshMaterializedView() {
    try {
      // Refresh the materialized view if it exists
      await this.prisma.$executeRaw`REFRESH MATERIALIZED VIEW CONCURRENTLY trending_shows`;
      logger.info('Refreshed trending_shows materialized view');
    } catch (error) {
      // View might not exist, which is fine
      logger.debug('Could not refresh materialized view:', error);
    }
  }

  async getTopTrendingShows(limit: number = 10) {
    const shows = await this.prisma.show.findMany({
      where: {
        date: { gte: new Date() },
        status: { in: ['upcoming', 'ongoing'] },
        trending_score: { gt: 0 }
      },
      orderBy: {
        trending_score: 'desc'
      },
      take: limit,
      include: {
        artist: true,
        venue: true,
        _count: {
          select: {
            votes: true
          }
        }
      }
    });

    return shows.map(show => ({
      id: show.id,
      title: show.title,
      date: show.date,
      artist: {
        id: show.artist.id,
        name: show.artist.name,
        image_url: show.artist.image_url
      },
      venue: {
        id: show.venue.id,
        name: show.venue.name,
        city: show.venue.city
      },
      trendingScore: show.trending_score,
      voteCount: show._count.votes,
      viewCount: show.view_count
    }));
  }

  async analyzeVotingTrends(showId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Get daily vote counts
    const dailyVotes = await this.prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as vote_count,
        COUNT(DISTINCT user_id) as unique_voters
      FROM votes
      WHERE show_id = ${showId}
        AND created_at >= ${startDate}
        AND created_at <= ${endDate}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get top voted songs
    const topSongs = await this.prisma.setlistSong.findMany({
      where: {
        setlist: {
          show_id: showId
        }
      },
      orderBy: {
        vote_count: 'desc'
      },
      take: 10,
      include: {
        song: true
      }
    });

    // Get voting velocity (votes per hour for last 24 hours)
    const oneDayAgo = subDays(endDate, 1);
    const hourlyVotes = await this.prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', created_at) as hour,
        COUNT(*) as vote_count
      FROM votes
      WHERE show_id = ${showId}
        AND created_at >= ${oneDayAgo}
      GROUP BY DATE_TRUNC('hour', created_at)
      ORDER BY hour ASC
    `;

    return {
      showId,
      period: { start: startDate, end: endDate },
      dailyVotes,
      topSongs: topSongs.map(ss => ({
        songId: ss.song_id,
        title: ss.song.title,
        voteCount: ss.vote_count,
        position: ss.position
      })),
      votingVelocity: hourlyVotes,
      summary: {
        totalVotes: dailyVotes.reduce((sum: number, day: any) => sum + Number(day.vote_count), 0),
        uniqueVoters: await this.prisma.vote.findMany({
          where: {
            show_id: showId,
            created_at: { gte: startDate }
          },
          distinct: ['user_id']
        }).then(votes => votes.length),
        avgVotesPerDay: dailyVotes.length > 0 
          ? dailyVotes.reduce((sum: number, day: any) => sum + Number(day.vote_count), 0) / dailyVotes.length
          : 0
      }
    };
  }
}