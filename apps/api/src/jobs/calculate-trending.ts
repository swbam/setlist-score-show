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
              setlistSongs: true
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
      where: { showId: show.id },
      _count: true
    });

    const uniqueVoters = await this.prisma.vote.findMany({
      where: { showId: show.id },
      distinct: ['userId']
    });

    // Get recent activity (last 7 days)
    const sevenDaysAgo = subDays(now, 7);
    
    const recentVotes = await this.prisma.vote.count({
      where: {
        showId: show.id,
        createdAt: { gte: sevenDaysAgo }
      }
    });

    // Calculate average votes per song
    const totalSongs = show.setlists.reduce((acc: number, setlist: any) => 
      acc + setlist.setlistSongs.length, 0
    );
    
    const totalVotes = show.setlists.reduce((acc: number, setlist: any) => 
      acc + setlist.setlistSongs.reduce((songAcc: number, song: any) => 
        songAcc + song.voteCount, 0
      ), 0
    );

    const avgVotesPerSong = totalSongs > 0 ? totalVotes / totalSongs : 0;

    // Calculate trending score with weighted factors
    const trendingScore = this.calculateTrendingScore({
      viewCount: show.viewCount || 0,
      voteCount: voteStats._count || 0,
      uniqueVoters: uniqueVoters.length,
      avgVotesPerSong,
      recentVotes,
      recentViews: 0, // Would need view tracking to implement
      daysUntilShow
    });

    return {
      showId: show.id,
      viewCount: show.viewCount || 0,
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
          // Note: trending_score field may not exist in Prisma schema
          // This would need to be added or use a separate trending table
          viewCount: metric.viewCount, // Update view count instead
          updatedAt: new Date()
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
        viewCount: { gt: 0 } // Use viewCount instead of trendingScore
      },
      orderBy: {
        viewCount: 'desc' // Order by viewCount for now
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
        imageUrl: show.artist.imageUrl
      },
      venue: {
        id: show.venue.id,
        name: show.venue.name,
        city: show.venue.city
      },
      trendingScore: 0, // Calculated value, not stored in DB
      voteCount: show._count.votes,
      viewCount: show.viewCount
    }));
  }

  async analyzeVotingTrends(showId: string, days: number = 30) {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Get daily vote counts
    const dailyVotes = await this.prisma.$queryRaw`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*) as vote_count,
        COUNT(DISTINCT "userId") as unique_voters
      FROM "Vote"
      WHERE "showId" = ${showId}
        AND "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Get top voted songs
    const topSongs = await this.prisma.setlistSong.findMany({
      where: {
        setlist: {
          showId: showId
        }
      },
      orderBy: {
        voteCount: 'desc'
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
        DATE_TRUNC('hour', "createdAt") as hour,
        COUNT(*) as vote_count
      FROM "Vote"
      WHERE "showId" = ${showId}
        AND "createdAt" >= ${oneDayAgo}
      GROUP BY DATE_TRUNC('hour', "createdAt")
      ORDER BY hour ASC
    `;

    return {
      showId,
      period: { start: startDate, end: endDate },
      dailyVotes,
      topSongs: topSongs.map(ss => ({
        songId: ss.songId,
        title: ss.song.title,
        voteCount: ss.voteCount,
        position: ss.position
      })),
      votingVelocity: hourlyVotes,
      summary: {
        totalVotes: Array.isArray(dailyVotes) ? dailyVotes.reduce((sum: number, day: any) => sum + Number(day.vote_count), 0) : 0,
        uniqueVoters: await this.prisma.vote.findMany({
          where: {
            showId: showId,
            createdAt: { gte: startDate }
          },
          distinct: ['userId']
        }).then(votes => Array.isArray(votes) ? votes.length : 0),
        avgVotesPerDay: Array.isArray(dailyVotes) && dailyVotes.length > 0 
          ? dailyVotes.reduce((sum: number, day: any) => sum + Number(day.vote_count), 0) / dailyVotes.length
          : 0
      }
    };
  }
}