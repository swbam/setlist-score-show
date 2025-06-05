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
        include: { userPreferences: true },
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
        include: { userPreferences: true },
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
        include: { userPreferences: true },
      })

      if (!userWithPrefs?.userPreferences) {
        // Create default preferences if they don't exist
        const defaultPrefs = await prisma.userPreferences.create({
          data: {
            userId: user.id,
            emailNotifications: true,
            pushNotifications: false,
            showCompletedShows: false,
            theme: 'SYSTEM',
            favoriteGenres: [],
          },
        })

        return defaultPrefs
      }

      return userWithPrefs.userPreferences
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
      if (displayName !== undefined) updateData.displayName = displayName
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl

      return prisma.user.update({
        where: { id: user.id },
        data: updateData,
        include: { userPreferences: true },
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
        updateData.emailNotifications = preferences.emailNotifications
      }
      if (preferences.pushNotifications !== undefined) {
        updateData.pushNotifications = preferences.pushNotifications
      }
      if (preferences.showCompletedShows !== undefined) {
        updateData.showCompletedShows = preferences.showCompletedShows
      }
      if (preferences.theme !== undefined) {
        updateData.theme = preferences.theme
      }
      if (preferences.favoriteGenres !== undefined) {
        updateData.favoriteGenres = preferences.favoriteGenres
      }
      if (preferences.defaultLocation !== undefined) {
        updateData.defaultLocation = preferences.defaultLocation
      }

      // Upsert preferences
      await prisma.userPreferences.upsert({
        where: { userId: user.id },
        update: updateData,
        create: {
          userId: user.id,
          ...updateData,
          emailNotifications: updateData.emailNotifications ?? true,
          pushNotifications: updateData.pushNotifications ?? false,
          showCompletedShows: updateData.showCompletedShows ?? false,
          theme: updateData.theme ?? 'SYSTEM',
          favoriteGenres: updateData.favoriteGenres ?? [],
        },
      })

      return prisma.user.findUnique({
        where: { id: user.id },
        include: { userPreferences: true },
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
            spotifyId: spotifyProfile.id,
            spotifyAccessToken: tokens.access_token,
            spotifyRefreshToken: tokens.refresh_token,
            spotifyTokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          },
          include: { userPreferences: true },
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
          spotifyId: null,
          spotifyAccessToken: null,
          spotifyRefreshToken: null,
          spotifyTokenExpiresAt: null,
        },
        include: { userPreferences: true },
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
        where: { userId: parent.id },
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
            favoriteGenres: [],
          },
        })
      }

      return {
        emailNotifications: prefs.emailNotifications,
        pushNotifications: prefs.pushNotifications,
        showCompletedShows: prefs.showCompletedShows,
        defaultLocation: prefs.defaultLocation,
        favoriteGenres: prefs.favoriteGenres,
        theme: prefs.theme,
      }
    },

    votes: async (parent, { limit = 50, offset = 0 }, { prisma }) => {
      return prisma.vote.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      })
    },

    voteAnalytics: async (parent, { showId }, { prisma }) => {
      const where: any = { userId: parent.id }
      if (showId) where.showId = showId

      return prisma.voteAnalytics.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      })
    },

    totalVotes: async (parent, _args, { prisma }) => {
      return prisma.vote.count({
        where: { userId: parent.id },
      })
    },

    joinedDaysAgo: (parent) => {
      const created = new Date(parent.createdAt)
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
          userId: parent.id,
          createdAt: { gte: thirtyDaysAgo },
        },
      })

      return recentVotes > 0
    },
  },

  UserPreferences: {
    defaultLocation: (parent) => {
      if (!parent.defaultLocation) return null
      
      // Assuming defaultLocation is stored as JSON
      const location = typeof parent.defaultLocation === 'string' 
        ? JSON.parse(parent.defaultLocation)
        : parent.defaultLocation

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