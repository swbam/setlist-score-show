import { PrismaClient } from '@setlist/database';
import { Redis } from 'ioredis';
import { logger } from '../lib/logger';
import { startOfDay, endOfDay, subDays, format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsEvent {
  event: string;
  userId?: string;
  sessionId: string;
  properties?: Record<string, any>;
  timestamp: Date;
}

interface ShowAnalytics {
  showId: string;
  period: {
    start: Date;
    end: Date;
  };
  metrics: {
    totalViews: number;
    uniqueViewers: number;
    totalVotes: number;
    uniqueVoters: number;
    avgVotesPerUser: number;
    peakVotingHour: string;
    topSongs: Array<{
      songId: string;
      title: string;
      voteCount: number;
      votePercentage: number;
    }>;
    userEngagement: {
      returningUsers: number;
      newUsers: number;
      avgSessionDuration: number;
    };
  };
}

interface UserAnalytics {
  userId: string;
  stats: {
    totalVotes: number;
    showsVoted: number;
    favoriteArtists: Array<{
      artistId: string;
      name: string;
      voteCount: number;
    }>;
    votingPatterns: {
      avgVotesPerShow: number;
      mostActiveDay: string;
      mostActiveHour: number;
    };
    achievements: Array<{
      type: string;
      unlockedAt: Date;
      description: string;
    }>;
  };
}

export class AnalyticsService {
  private eventQueue: AnalyticsEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(
    private prisma: PrismaClient,
    private redis: Redis
  ) {
    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushEvents();
    }, 30000);
  }

  async trackEvent(event: string, data: {
    userId?: string;
    sessionId: string;
    properties?: Record<string, any>;
  }) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      userId: data.userId,
      sessionId: data.sessionId,
      properties: data.properties,
      timestamp: new Date()
    };

    this.eventQueue.push(analyticsEvent);

    // Also track in Redis for real-time metrics
    await this.trackRealtimeMetric(event, data);

    // Flush if queue is getting large
    if (this.eventQueue.length >= 100) {
      await this.flushEvents();
    }
  }

  private async trackRealtimeMetric(event: string, data: any) {
    const key = `analytics:${event}:${format(new Date(), 'yyyy-MM-dd')}`;
    
    try {
      await this.redis.hincrby(key, 'count', 1);
      
      if (data.userId) {
        await this.redis.sadd(`${key}:users`, data.userId);
      }
      
      if (data.properties?.showId) {
        await this.redis.hincrby(`analytics:show:${data.properties.showId}`, event, 1);
      }
      
      // Expire keys after 90 days
      await this.redis.expire(key, 90 * 24 * 60 * 60);
    } catch (error) {
      logger.error('Failed to track realtime metric:', error);
    }
  }

  private async flushEvents() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Store events in database - disabled since AnalyticsEvent model doesn't exist
      // await this.prisma.analyticsEvent.createMany({
      //   data: events.map(event => ({
      //     event: event.event,
      //     userId: event.userId,
      //     sessionId: event.sessionId,
      //     properties: event.properties,
      //     createdAt: event.timestamp
      //   }))
      // });

      logger.info(`Would flush ${events.length} analytics events (disabled)`);
    } catch (error) {
      logger.error('Failed to flush analytics events:', error);
      // Put events back in queue
      this.eventQueue.unshift(...events);
    }
  }

  async getShowAnalytics(showId: string, days: number = 30): Promise<ShowAnalytics> {
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    // Get vote data
    const votes = await this.prisma.vote.findMany({
      where: {
        showId: showId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        setlistSong: {
          include: {
            song: true
          }
        }
      }
    });

    // Get view data from analytics events - placeholder for now since model doesn't exist
    const viewEvents: any[] = [];

    // Calculate metrics
    const uniqueVoters = new Set(votes.map(v => v.userId)).size;
    const uniqueViewers = new Set(viewEvents.map(e => e.sessionId)).size;

    // Calculate voting patterns by hour
    const votesByHour = votes.reduce((acc, vote) => {
      const hour = vote.createdAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(votesByHour)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';

    // Calculate top songs
    const songVotes = votes.reduce((acc, vote) => {
      const songId = vote.setlistSong.songId;
      if (!acc[songId]) {
        acc[songId] = {
          songId,
          title: vote.setlistSong.song.title,
          voteCount: 0
        };
      }
      acc[songId].voteCount++;
      return acc;
    }, {} as Record<string, any>);

    const topSongs = Object.values(songVotes)
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 10)
      .map(song => ({
        ...song,
        votePercentage: (song.voteCount / votes.length) * 100
      }));

    // Calculate user engagement
    const userFirstVotes = await this.prisma.vote.groupBy({
      by: ['userId'],
      where: { showId: showId },
      _min: { createdAt: true }
    });

    const newUsers = userFirstVotes.filter(u => 
      u._min.createdAt && u._min.createdAt >= startDate
    ).length;

    const returningUsers = uniqueVoters - newUsers;

    return {
      showId,
      period: { start: startDate, end: endDate },
      metrics: {
        totalViews: viewEvents.length,
        uniqueViewers,
        totalVotes: votes.length,
        uniqueVoters,
        avgVotesPerUser: uniqueVoters > 0 ? votes.length / uniqueVoters : 0,
        peakVotingHour: `${peakHour}:00`,
        topSongs,
        userEngagement: {
          returningUsers,
          newUsers,
          avgSessionDuration: 0 // Would need session tracking to implement
        }
      }
    };
  }

  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    // Get all user votes
    const votes = await this.prisma.vote.findMany({
      where: { userId: userId },
      include: {
        show: {
          include: {
            artist: true
          }
        }
      }
    });

    // Calculate favorite artists
    const artistVotes = votes.reduce((acc, vote) => {
      const artistId = vote.show.artistId;
      if (!acc[artistId]) {
        acc[artistId] = {
          artistId,
          name: vote.show.artist.name,
          voteCount: 0
        };
      }
      acc[artistId].voteCount++;
      return acc;
    }, {} as Record<string, any>);

    const favoriteArtists = Object.values(artistVotes)
      .sort((a, b) => b.voteCount - a.voteCount)
      .slice(0, 5);

    // Calculate voting patterns
    const votesByDay = votes.reduce((acc, vote) => {
      const day = format(vote.createdAt, 'EEEE');
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveDay = Object.entries(votesByDay)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday';

    const votesByHour = votes.reduce((acc, vote) => {
      const hour = vote.createdAt.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostActiveHour = parseInt(
      Object.entries(votesByHour)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '0'
    );

    // Calculate achievements
    const achievements = await this.calculateUserAchievements(userId, votes);

    const showsVoted = new Set(votes.map(v => v.showId)).size;

    return {
      userId,
      stats: {
        totalVotes: votes.length,
        showsVoted,
        favoriteArtists,
        votingPatterns: {
          avgVotesPerShow: showsVoted > 0 ? votes.length / showsVoted : 0,
          mostActiveDay,
          mostActiveHour
        },
        achievements
      }
    };
  }

  private async calculateUserAchievements(userId: string, votes: any[]) {
    const achievements = [];
    const now = new Date();

    // First vote achievement
    if (votes.length >= 1) {
      achievements.push({
        type: 'first_vote',
        unlockedAt: votes[0].createdAt,
        description: 'Cast your first vote!'
      });
    }

    // Voting milestones
    const voteMilestones = [10, 50, 100, 500, 1000];
    for (const milestone of voteMilestones) {
      if (votes.length >= milestone) {
        const unlockVote = votes.sort((a, b) => 
          a.createdAt.getTime() - b.createdAt.getTime()
        )[milestone - 1];
        
        achievements.push({
          type: `votes_${milestone}`,
          unlockedAt: unlockVote.createdAt,
          description: `Cast ${milestone} votes`
        });
      }
    }

    // Show diversity achievement
    const uniqueShows = new Set(votes.map(v => v.showId)).size;
    if (uniqueShows >= 10) {
      achievements.push({
        type: 'show_explorer',
        unlockedAt: now,
        description: 'Voted on 10 different shows'
      });
    }

    // Artist loyalty achievement
    const artistCounts = votes.reduce((acc, vote) => {
      acc[vote.show.artistId] = (acc[vote.show.artistId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const loyalArtist = Object.entries(artistCounts).find(([, count]) => Number(count) >= 20);
    if (loyalArtist) {
      achievements.push({
        type: 'artist_superfan',
        unlockedAt: now,
        description: `Super fan - 20+ votes for an artist`
      });
    }

    // Early bird achievement (voting on shows > 30 days out)
    const earlyVotes = votes.filter(vote => {
      const daysUntilShow = Math.ceil(
        (vote.show.date.getTime() - vote.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilShow > 30;
    });

    if (earlyVotes.length >= 5) {
      achievements.push({
        type: 'early_bird',
        unlockedAt: earlyVotes[4].createdAt,
        description: 'Early bird - voted on 5 shows 30+ days in advance'
      });
    }

    return achievements;
  }

  async getGlobalMetrics(period: 'day' | 'week' | 'month' = 'day') {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = startOfDay(now);
        endDate = endOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    // Get metrics from database
    const [votes, users, shows] = await Promise.all([
      this.prisma.vote.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.show.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);
    
    const events: any[] = []; // Placeholder since analyticsEvent model doesn't exist

    // Get real-time metrics from Redis
    const redisKeys = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      redisKeys.push(`analytics:*:${format(currentDate, 'yyyy-MM-dd')}`);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get trending shows
    const trendingShows = await this.prisma.show.findMany({
      where: {
        date: { gte: now }
      },
      orderBy: { viewCount: 'desc' }, // Use viewCount instead of non-existent trendingScore
      take: 5,
      include: {
        artist: true,
        venue: true
      }
    });

    return {
      period: { start: startDate, end: endDate },
      metrics: {
        totalVotes: votes,
        newUsers: users,
        newShows: shows,
        events: events.reduce((acc, e) => {
          acc[e.event] = e._count;
          return acc;
        }, {} as Record<string, number>),
        trendingShows: trendingShows.map(show => ({
          id: show.id,
          title: show.title,
          artist: show.artist.name,
          venue: show.venue.name,
          score: show.viewCount // Use viewCount instead of non-existent trendingScore
        }))
      }
    };
  }

  async generateReport(type: 'daily' | 'weekly' | 'monthly') {
    const periodMap = {
      'daily': 'day' as const,
      'weekly': 'week' as const,
      'monthly': 'month' as const
    };
    const metrics = await this.getGlobalMetrics(periodMap[type]);
    
    // Additional detailed metrics for reports
    const topVotedShows = await this.prisma.show.findMany({
      where: {
        date: {
          gte: metrics.period.start,
          lte: metrics.period.end
        }
      },
      orderBy: {
        votes: {
          _count: 'desc'
        }
      },
      take: 10,
      include: {
        artist: true,
        venue: true,
        _count: {
          select: { votes: true }
        }
      }
    });

    const activeUsers = await this.prisma.user.findMany({
      where: {
        votes: {
          some: {
            createdAt: {
              gte: metrics.period.start,
              lte: metrics.period.end
            }
          }
        }
      },
      orderBy: {
        votes: {
          _count: 'desc'
        }
      },
      take: 10,
      include: {
        _count: {
          select: { votes: true }
        }
      }
    });

    return {
      type,
      generatedAt: new Date(),
      period: metrics.period,
      summary: metrics.metrics,
      details: {
        topVotedShows: topVotedShows.map(show => ({
          id: show.id,
          title: show.title,
          artist: show.artist.name,
          venue: show.venue.name,
          voteCount: show._count.votes
        })),
        mostActiveUsers: activeUsers.map(user => ({
          id: user.id,
          displayName: user.displayName || user.email,
          voteCount: user._count.votes
        }))
      }
    };
  }

  destroy() {
    clearInterval(this.flushInterval);
    this.flushEvents();
  }
}