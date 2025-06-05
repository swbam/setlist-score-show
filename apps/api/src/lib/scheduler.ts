import * as cron from 'node-cron'
import { PrismaClient } from '@setlist/database'
import { SetlistSyncJob } from '../jobs/sync-setlists'
import { SpotifySyncJob } from '../jobs/sync-spotify'
import { TrendingCalculationJob } from '../jobs/calculate-trending'
import { SetlistFmClient } from './setlistfm'
import { SpotifyClient } from './spotify'
import { logger } from './logger'

export class JobScheduler {
  private jobs: cron.ScheduledTask[] = []
  
  constructor(
    private prisma: PrismaClient,
    private setlistFm: SetlistFmClient,
    private spotify: SpotifyClient
  ) {}

  start() {
    logger.info('Starting job scheduler')

    // Sync setlists from yesterday - runs daily at 2 AM
    const setlistSyncJob = cron.schedule('0 2 * * *', async () => {
      logger.info('Running setlist sync job')
      try {
        const job = new SetlistSyncJob(this.prisma, this.setlistFm, this.spotify)
        await job.syncYesterdaysShows()
        logger.info('Setlist sync job completed')
      } catch (error) {
        logger.error('Setlist sync job failed:', error)
      }
    }, {
      timezone: 'America/New_York'
    })

    // Sync Spotify data - runs every 6 hours
    const spotifySyncJob = cron.schedule('0 */6 * * *', async () => {
      logger.info('Running Spotify sync job')
      try {
        const job = new SpotifySyncJob(
          this.prisma,
          process.env.SPOTIFY_CLIENT_ID!,
          process.env.SPOTIFY_CLIENT_SECRET!
        )
        await job.syncArtistCatalogs()
        logger.info('Spotify sync job completed')
      } catch (error) {
        logger.error('Spotify sync job failed:', error)
      }
    })

    // Calculate trending shows - runs every hour
    const trendingJob = cron.schedule('0 * * * *', async () => {
      logger.info('Running trending calculation job')
      try {
        const job = new TrendingCalculationJob(this.prisma)
        await job.calculateTrendingScores()
        logger.info('Trending calculation job completed')
      } catch (error) {
        logger.error('Trending calculation job failed:', error)
      }
    })

    // Start all jobs
    this.jobs = [setlistSyncJob, spotifySyncJob, trendingJob]
    this.jobs.forEach(job => job.start())

    logger.info('Job scheduler started with', this.jobs.length, 'jobs')
  }

  stop() {
    logger.info('Stopping job scheduler')
    this.jobs.forEach(job => job.stop())
    this.jobs = []
  }

  // Run a specific job immediately (useful for testing)
  async runJob(jobName: 'setlist-sync' | 'spotify-sync' | 'trending') {
    logger.info(`Manually running job: ${jobName}`)
    
    try {
      switch (jobName) {
        case 'setlist-sync':
          const setlistJob = new SetlistSyncJob(this.prisma, this.setlistFm, this.spotify)
          await setlistJob.syncYesterdaysShows()
          break
        case 'spotify-sync':
          const spotifyJob = new SpotifySyncJob(
            this.prisma,
            process.env.SPOTIFY_CLIENT_ID!,
            process.env.SPOTIFY_CLIENT_SECRET!
          )
          await spotifyJob.syncArtistCatalogs()
          break
        case 'trending':
          const trendingJob = new TrendingCalculationJob(this.prisma)
          await trendingJob.calculateTrendingScores()
          break
      }
      logger.info(`Job ${jobName} completed successfully`)
    } catch (error) {
      logger.error(`Job ${jobName} failed:`, error)
      throw error
    }
  }
}