import { IResolvers } from '@graphql-tools/utils'
import { GraphQLError } from 'graphql'
import bcrypt from 'bcryptjs'

export const userResolvers: IResolvers = {
  Query: {
    me: async (_parent, _args, { user, prisma }) => {
      if (!user) {
        return null
      }

      return prisma.user.findUnique({
        where: { id: user.id },
        include: { user_preferences: true },
      })
    },

    user: async (_parent, { id }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      // TODO: Add admin role check here
      // if (!user.isAdmin) {
      //   throw new GraphQLError('Admin access required', {
      //     extensions: { code: 'FORBIDDEN' },
      //   })
      // }

      const requestedUser = await prisma.user.findUnique({
        where: { id },
        include: { user_preferences: true },
      })

      if (!requestedUser) {
        throw new GraphQLError('User not found', {
          extensions: { code: 'NOT_FOUND' },
        })
      }

      return requestedUser
    },

    isEmailAvailable: async (_parent, { email }, { prisma }) => {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      })

      return !existingUser
    },

    notificationSettings: async (_parent, _args, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const userWithPrefs = await prisma.user.findUnique({
        where: { id: user.id },
        include: { user_preferences: true },
      })

      if (!userWithPrefs?.user_preferences) {
        // Create default preferences if they don't exist
        const defaultPrefs = await prisma.userPreferences.create({
          data: {
            user_id: user.id,
            email_notifications: true,
            push_notifications: false,
            show_completed_shows: false,
            theme: 'SYSTEM',
            favorite_genres: [],
          },
        })

        return defaultPrefs
      }

      return userWithPrefs.user_preferences
    },
  },

  Mutation: {
    updateProfile: async (_parent, { displayName, avatarUrl }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const updateData: any = {}
      if (displayName !== undefined) updateData.display_name = displayName
      if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl

      return prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: { user_preferences: true },
      })
    },

    updatePreferences: async (_parent, { preferences }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      const updateData: any = {}
      
      if (preferences.emailNotifications !== undefined) {
        updateData.email_notifications = preferences.emailNotifications
      }
      if (preferences.pushNotifications !== undefined) {
        updateData.push_notifications = preferences.pushNotifications
      }
      if (preferences.showCompletedShows !== undefined) {
        updateData.show_completed_shows = preferences.showCompletedShows
      }
      if (preferences.theme !== undefined) {
        updateData.theme = preferences.theme
      }
      if (preferences.favoriteGenres !== undefined) {
        updateData.favorite_genres = preferences.favoriteGenres
      }
      if (preferences.defaultLocation !== undefined) {
        updateData.default_location = preferences.defaultLocation
      }

      // Upsert preferences
      await prisma.userPreferences.upsert({
        where: { user_id: user.id },
        update: updateData,
        create: {
          user_id: user.id,
          ...updateData,
          email_notifications: updateData.email_notifications ?? true,
          push_notifications: updateData.push_notifications ?? false,
          show_completed_shows: updateData.show_completed_shows ?? false,
          theme: updateData.theme ?? 'SYSTEM',
          favorite_genres: updateData.favorite_genres ?? [],
        },
      })

      return prisma.user.findUnique({
        where: { id: user.id },
        include: { user_preferences: true },
      })
    },

    connectSpotify: async (_parent, { code, redirectUri }, { user, prisma, services }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      if (!services?.spotify) {
        throw new GraphQLError('Spotify service not available', {
          extensions: { code: 'SERVICE_UNAVAILABLE' },
        })
      }

      try {
        // Exchange code for tokens
        const tokens = await services.spotify.exchangeCodeForTokens(code, redirectUri)
        
        // Get Spotify user profile
        const spotifyProfile = await services.spotify.getUserProfile(tokens.access_token)

        // Update user with Spotify data
        return prisma.user.update({
          where: { id: user.id },
          data: {
            spotify_id: spotifyProfile.id,
            spotify_access_token: tokens.access_token,
            spotify_refresh_token: tokens.refresh_token,
            spotify_token_expires_at: new Date(Date.now() + tokens.expires_in * 1000),
          },
          include: { user_preferences: true },
        })
      } catch (error: any) {
        throw new GraphQLError('Failed to connect Spotify account', {
          extensions: { 
            code: 'EXTERNAL_SERVICE_ERROR',
            details: error.message,
          },
        })
      }
    },

    disconnectSpotify: async (_parent, _args, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      return prisma.user.update({
        where: { id: user.id },
        data: {
          spotify_id: null,
          spotify_access_token: null,
          spotify_refresh_token: null,
          spotify_token_expires_at: null,
        },
        include: { user_preferences: true },
      })
    },

    deleteAccount: async (_parent, { confirmation }, { user, prisma }) => {
      if (!user) {
        throw new GraphQLError('Authentication required', {
          extensions: { code: 'UNAUTHENTICATED' },
        })
      }

      if (confirmation !== user.email) {
        throw new GraphQLError('Invalid confirmation. Please type your email address to confirm.', {
          extensions: { code: 'BAD_REQUEST' },
        })
      }

      try {
        // Delete user and all related data (cascading deletes should handle this)
        await prisma.user.delete({
          where: { id: user.id },
        })

        return {
          success: true,
          user: null,
          message: 'Account deleted successfully',
        }
      } catch (error: any) {
        return {
          success: false,
          user: null,
          message: 'Failed to delete account: ' + error.message,
        }
      }
    },
  },

  User: {
    preferences: async (parent, _args, { prisma }) => {
      let prefs = await prisma.userPreferences.findUnique({
        where: { user_id: parent.id },
      })

      if (!prefs) {
        // Create default preferences if they don't exist
        prefs = await prisma.userPreferences.create({
          data: {
            user_id: parent.id,
            email_notifications: true,
            push_notifications: false,
            show_completed_shows: false,
            theme: 'SYSTEM',
            favorite_genres: [],
          },
        })
      }

      return {
        emailNotifications: prefs.email_notifications,
        pushNotifications: prefs.push_notifications,
        showCompletedShows: prefs.show_completed_shows,
        defaultLocation: prefs.default_location,
        favoriteGenres: prefs.favorite_genres,
        theme: prefs.theme,
      }
    },

    votes: async (parent, { limit = 50, offset = 0 }, { prisma }) => {
      return prisma.vote.findMany({
        where: { user_id: parent.id },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      })
    },

    voteAnalytics: async (parent, { showId }, { prisma }) => {
      const where: any = { user_id: parent.id }
      if (showId) where.show_id = showId

      return prisma.voteAnalytics.findMany({
        where,
        orderBy: { created_at: 'desc' },
      })
    },

    totalVotes: async (parent, _args, { prisma }) => {
      return prisma.vote.count({
        where: { user_id: parent.id },
      })
    },

    joinedDaysAgo: (parent) => {
      const created = new Date(parent.created_at)
      const now = new Date()
      const diffTime = Math.abs(now.getTime() - created.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    },

    isActive: async (parent, _args, { prisma }) => {
      // Consider a user active if they've voted in the last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentVotes = await prisma.vote.count({
        where: {
          user_id: parent.id,
          created_at: { gte: thirtyDaysAgo },
        },
      })

      return recentVotes > 0
    },
  },

  UserPreferences: {
    defaultLocation: (parent) => {
      if (!parent.default_location) return null
      
      // Assuming default_location is stored as JSON
      const location = typeof parent.default_location === 'string' 
        ? JSON.parse(parent.default_location)
        : parent.default_location

      return {
        city: location.city,
        state: location.state,
        country: location.country,
        latitude: location.latitude,
        longitude: location.longitude,
      }
    },
  },
}