import fp from 'fastify-plugin';
import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { SupabaseClient } from '@supabase/supabase-js';

declare module 'fastify' {
  interface FastifyInstance {
    supabase: SupabaseClient;
    redis: any; // Consider using a more specific type for Redis
  }
}

interface PresencePluginOptions {}

const presencePlugin: FastifyPluginAsync<PresencePluginOptions> = async (
  fastify: FastifyInstance,
  _options
) => {
  if (!fastify.supabase) {
    throw new Error('Supabase client not found. Make sure supabasePlugin is registered before presencePlugin.');
  }
  if (!fastify.redis) {
    throw new Error('Redis client not found. Make sure redis plugin is registered before presencePlugin.');
  }

  // Store presence info in Redis for scalability
  // Key: presence:show:<showId> -> Set of userIds

  // Endpoint to get active users for a show
  fastify.get('/presence/:showId', async (request, reply) => {
    const { showId } = request.params as { showId: string };
    try {
      const userIds = await fastify.redis.smembers(`presence:show:${showId}`);
      reply.send({ showId, activeUsers: userIds.length, userIds });
    } catch (error) {
      fastify.log.error(error, `Error fetching presence for show ${showId}`);
      reply.status(500).send({ error: 'Failed to fetch presence' });
    }
  });

  // Logic to update presence in Redis would typically come from Supabase Realtime events
  // or direct calls from the client when they join/leave a show "channel".
  // For this example, we'll assume another part of the system (e.g., a Supabase Function or client-side hook)
  // updates Redis.

  // Example of how a client might "join" a show's presence tracking
  // This would likely be called from the frontend via an API route or directly if permissions allow
  fastify.post('/presence/:showId/join', async (request, reply) => {
    const { showId } = request.params as { showId: string };
    // @ts-ignore
    const userId = request.user?.id; // Assuming user is available from auth plugin

    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      await fastify.redis.sadd(`presence:show:${showId}`, userId);
      // Optionally set an expiry for the user's presence if they don't send a heartbeat
      // await fastify.redis.expire(`presence:user:${userId}:show:${showId}`, 60 * 5); // 5 minutes
      fastify.log.info(`User ${userId} joined presence for show ${showId}`);

      // Broadcast presence update via Supabase Realtime
      const channel = fastify.supabase.channel(`show:${showId}:presence`);
      await channel.send({
        type: 'broadcast',
        event: 'presence_diff',
        payload: { joins: { [userId]: {} }, leaves: {} },
      });
      // Or, more simply, just notify that count might have changed
      // await fastify.supabase.channel('show-presence-updates').send({ type: 'broadcast', event: 'show_presence_updated', payload: { showId } });


      reply.send({ success: true, message: 'Presence updated' });
    } catch (error) {
      fastify.log.error(error, `Error updating presence for user ${userId} on show ${showId}`);
      reply.status(500).send({ error: 'Failed to update presence' });
    }
  });

   fastify.post('/presence/:showId/leave', async (request, reply) => {
    const { showId } = request.params as { showId: string };
    // @ts-ignore
    const userId = request.user?.id;

    if (!userId) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    try {
      await fastify.redis.srem(`presence:show:${showId}`, userId);
      fastify.log.info(`User ${userId} left presence for show ${showId}`);
      
      // Broadcast presence update
      const channel = fastify.supabase.channel(`show:${showId}:presence`);
      await channel.send({
        type: 'broadcast',
        event: 'presence_diff',
        payload: { joins: {}, leaves: { [userId]: {} } },
      });

      reply.send({ success: true, message: 'Presence removed' });
    } catch (error) {
      fastify.log.error(error, `Error removing presence for user ${userId} on show ${showId}`);
      reply.status(500).send({ error: 'Failed to remove presence' });
    }
  });


  fastify.log.info('Presence plugin loaded');
};

export default fp(presencePlugin);
