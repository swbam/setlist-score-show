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
      // Store events in database
      await this.prisma.analyticsEvent.createMany({
        data: events.map(event => ({
          event: event.event,
          user_id: event.userId,
          session_id: event.sessionId,
          properties: event.properties,
          created_at: event.timestamp
        }))
      });

      logger.info(`Flushed ${events.length} analytics events`);
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
        show_id: showId,
        created_at: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        setlist_song: {
          include: {
            song: true
          }
        }
      }
    });

    // Get view data from analytics events
    const viewEvents = await this.prisma.analyticsEvent.findMany({
      where: {
        event: 'show_viewed',
        properties: {
          path: ['showId'],
          equals: showId
        },
        created_at: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Calculate metrics
    const uniqueVoters = new Set(votes.map(v => v.user_id)).size;
    const uniqueViewers = new Set(viewEvents.map(e => e.session_id)).size;

    // Calculate voting patterns by hour
    const votesByHour = votes.reduce((acc, vote) => {
      const hour = vote.created_at.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const peakHour = Object.entries(votesByHour)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || '0';

    // Calculate top songs
    const songVotes = votes.reduce((acc, vote) => {
      const songId = vote.setlist_song.song_id;
      if (!acc[songId]) {
        acc[songId] = {
          songId,
          title: vote.setlist_song.song.title,
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
      by: ['user_id'],
      where: { show_id: showId },
      _min: { created_at: true }
    });

    const newUsers = userFirstVotes.filter(u => 
      u._min.created_at && u._min.created_at >= startDate
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
      where: { user_id: userId },
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
      const artistId = vote.show.artist_id;
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
      const day = format(vote.created_at, 'EEEE');
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostActiveDay = Object.entries(votesByDay)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'Monday';

    const votesByHour = votes.reduce((acc, vote) => {
      const hour = vote.created_at.getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const mostActiveHour = parseInt(
      Object.entries(votesByHour)
        .sort(([, a], [, b]) => b - a)[0]?.[0] || '0'
    );

    // Calculate achievements
    const achievements = await this.calculateUserAchievements(userId, votes);

    const showsVoted = new Set(votes.map(v => v.show_id)).size;

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
        unlockedAt: votes[0].created_at,
        description: 'Cast your first vote!'
      });
    }

    // Voting milestones
    const voteMilestones = [10, 50, 100, 500, 1000];
    for (const milestone of voteMilestones) {
      if (votes.length >= milestone) {
        const unlockVote = votes.sort((a, b) => 
          a.created_at.getTime() - b.created_at.getTime()
        )[milestone - 1];
        
        achievements.push({
          type: `votes_${milestone}`,
          unlockedAt: unlockVote.created_at,
          description: `Cast ${milestone} votes`
        });
      }
    }

    // Show diversity achievement
    const uniqueShows = new Set(votes.map(v => v.show_id)).size;
    if (uniqueShows >= 10) {
      achievements.push({
        type: 'show_explorer',
        unlockedAt: now,
        description: 'Voted on 10 different shows'
      });
    }

    // Artist loyalty achievement
    const artistCounts = votes.reduce((acc, vote) => {
      acc[vote.show.artist_id] = (acc[vote.show.artist_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const loyalArtist = Object.entries(artistCounts).find(([, count]) => count >= 20);
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
        (vote.show.date.getTime() - vote.created_at.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilShow > 30;
    });

    if (earlyVotes.length >= 5) {
      achievements.push({
        type: 'early_bird',
        unlockedAt: earlyVotes[4].created_at,
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
    const [votes, users, shows, events] = await Promise.all([
      this.prisma.vote.count({
        where: {
          created_at: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.user.count({
        where: {
          created_at: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.show.count({
        where: {
          created_at: { gte: startDate, lte: endDate }
        }
      }),
      this.prisma.analyticsEvent.groupBy({
        by: ['event'],
        where: {
          created_at: { gte: startDate, lte: endDate }
        },
        _count: true
      })
    ]);

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
        trending_score: { gt: 0 },
        date: { gte: now }
      },
      orderBy: { trending_score: 'desc' },
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
          score: show.trending_score
        }))
      }
    };
  }

  async generateReport(type: 'daily' | 'weekly' | 'monthly') {
    const metrics = await this.getGlobalMetrics(type);
    
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
            created_at: {
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
          displayName: user.display_name || user.email,
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