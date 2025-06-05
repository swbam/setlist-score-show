import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { createServer } from '@/apps/api/src/server';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

describe('Voting API Integration Tests', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let supabase: ReturnType<typeof createClient>;
  let authToken: string;
  let testUser: any;
  let testShow: any;
  let testSongs: any[];

  beforeAll(async () => {
    // Create test server
    app = await createServer();
    prisma = new PrismaClient();
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create test user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true
    });

    if (authError) throw authError;

    testUser = await prisma.user.create({
      data: {
        id: authData.user!.id,
        email: 'test@example.com',
        display_name: 'Test User'
      }
    });

    // Generate auth token
    authToken = jwt.sign(
      { sub: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret'
    );

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    // Cleanup
    await cleanupTestData();
    await supabase.auth.admin.deleteUser(testUser.id);
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear votes between tests
    await prisma.vote.deleteMany({
      where: { user_id: testUser.id }
    });
    
    // Reset vote counts
    await prisma.setlistSong.updateMany({
      where: {
        setlist: { show_id: testShow.id }
      },
      data: { vote_count: 0 }
    });
  });

  async function setupTestData() {
    // Create test artist
    const artist = await prisma.artist.create({
      data: {
        name: 'Test Artist',
        slug: 'test-artist',
        spotify_id: 'spotify-test-artist'
      }
    });

    // Create test venue
    const venue = await prisma.venue.create({
      data: {
        name: 'Test Venue',
        city: 'Test City',
        country: 'Test Country'
      }
    });

    // Create test show
    testShow = await prisma.show.create({
      data: {
        artist_id: artist.id,
        venue_id: venue.id,
        title: 'Test Show',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        status: 'upcoming'
      }
    });

    // Create test songs
    testSongs = await Promise.all([
      prisma.song.create({
        data: {
          artist_id: artist.id,
          title: 'Test Song 1',
          album: 'Test Album',
          spotify_id: 'spotify-song-1'
        }
      }),
      prisma.song.create({
        data: {
          artist_id: artist.id,
          title: 'Test Song 2',
          album: 'Test Album',
          spotify_id: 'spotify-song-2'
        }
      }),
      prisma.song.create({
        data: {
          artist_id: artist.id,
          title: 'Test Song 3',
          album: 'Test Album',
          spotify_id: 'spotify-song-3'
        }
      })
    ]);

    // Create setlist
    const setlist = await prisma.setlist.create({
      data: {
        show_id: testShow.id,
        name: 'Main Set'
      }
    });

    // Add songs to setlist
    await Promise.all(
      testSongs.map((song, index) =>
        prisma.setlistSong.create({
          data: {
            setlist_id: setlist.id,
            song_id: song.id,
            position: index + 1
          }
        })
      )
    );
  }

  async function cleanupTestData() {
    await prisma.vote.deleteMany({ where: { user_id: testUser.id } });
    await prisma.setlistSong.deleteMany({
      where: { setlist: { show_id: testShow.id } }
    });
    await prisma.setlist.deleteMany({ where: { show_id: testShow.id } });
    await prisma.show.delete({ where: { id: testShow.id } });
    await prisma.song.deleteMany({
      where: { id: { in: testSongs.map(s => s.id) } }
    });
    await prisma.venue.deleteMany({ where: { id: testShow.venue_id } });
    await prisma.artist.deleteMany({ where: { id: testShow.artist_id } });
    await prisma.user.delete({ where: { id: testUser.id } });
  }

  describe('POST /graphql - castVote mutation', () => {
    it('should successfully cast a vote', async () => {
      const setlistSong = await prisma.setlistSong.findFirst({
        where: {
          setlist: { show_id: testShow.id },
          song_id: testSongs[0].id
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${authToken}`
        },
        payload: {
          query: `
            mutation CastVote($input: VoteInput!) {
              castVote(input: $input) {
                success
                voteId
                newVoteCount
                dailyVotesRemaining
                showVotesRemaining
              }
            }
          `,
          variables: {
            input: {
              showId: testShow.id,
              songId: testSongs[0].id,
              setlistSongId: setlistSong!.id
            }
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.data.castVote.success).toBe(true);
      expect(result.data.castVote.newVoteCount).toBe(1);
      expect(result.data.castVote.dailyVotesRemaining).toBe(49);
      expect(result.data.castVote.showVotesRemaining).toBe(9);

      // Verify vote was created
      const vote = await prisma.vote.findFirst({
        where: {
          user_id: testUser.id,
          setlist_song_id: setlistSong!.id
        }
      });
      expect(vote).toBeTruthy();
    });

    it('should prevent duplicate votes', async () => {
      const setlistSong = await prisma.setlistSong.findFirst({
        where: {
          setlist: { show_id: testShow.id },
          song_id: testSongs[0].id
        }
      });

      // Create first vote
      await prisma.vote.create({
        data: {
          user_id: testUser.id,
          setlist_song_id: setlistSong!.id,
          show_id: testShow.id,
          vote_type: 'up'
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${authToken}`
        },
        payload: {
          query: `
            mutation CastVote($input: VoteInput!) {
              castVote(input: $input) {
                success
                voteId
              }
            }
          `,
          variables: {
            input: {
              showId: testShow.id,
              songId: testSongs[0].id,
              setlistSongId: setlistSong!.id
            }
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('Already voted');
    });

    it('should enforce show vote limit', async () => {
      // Create 10 votes (the limit)
      for (let i = 0; i < 10; i++) {
        const setlistSong = await prisma.setlistSong.findFirst({
          where: {
            setlist: { show_id: testShow.id },
            song_id: testSongs[i % testSongs.length].id
          }
        });

        await prisma.vote.create({
          data: {
            user_id: testUser.id,
            setlist_song_id: setlistSong!.id,
            show_id: testShow.id,
            vote_type: 'up'
          }
        });
      }

      // Try to cast 11th vote
      const setlistSong = await prisma.setlistSong.findFirst({
        where: {
          setlist: { show_id: testShow.id },
          song_id: testSongs[0].id
        }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${authToken}`
        },
        payload: {
          query: `
            mutation CastVote($input: VoteInput!) {
              castVote(input: $input) {
                success
              }
            }
          `,
          variables: {
            input: {
              showId: testShow.id,
              songId: testSongs[0].id,
              setlistSongId: setlistSong!.id
            }
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].message).toContain('Show vote limit reached');
    });
  });

  describe('Query showVotes', () => {
    it('should return current vote counts for a show', async () => {
      // Create some votes
      const setlistSongs = await prisma.setlistSong.findMany({
        where: { setlist: { show_id: testShow.id } }
      });

      await prisma.vote.create({
        data: {
          user_id: testUser.id,
          setlist_song_id: setlistSongs[0].id,
          show_id: testShow.id,
          vote_type: 'up'
        }
      });

      await prisma.setlistSong.update({
        where: { id: setlistSongs[0].id },
        data: { vote_count: 1 }
      });

      const response = await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json'
        },
        payload: {
          query: `
            query GetShowVotes($showId: ID!) {
              show(id: $showId) {
                id
                title
                setlists {
                  setlistSongs {
                    id
                    voteCount
                    song {
                      id
                      title
                    }
                  }
                }
              }
            }
          `,
          variables: {
            showId: testShow.id
          }
        }
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result.data.show.setlists[0].setlistSongs).toHaveLength(3);
      expect(result.data.show.setlists[0].setlistSongs[0].voteCount).toBe(1);
    });
  });

  describe('Real-time updates', () => {
    it('should broadcast vote updates via Supabase', async (done) => {
      const setlistSong = await prisma.setlistSong.findFirst({
        where: {
          setlist: { show_id: testShow.id },
          song_id: testSongs[0].id
        }
      });

      // Subscribe to updates
      const channel = supabase.channel(`show:${testShow.id}`);
      
      channel
        .on('broadcast', { event: 'vote_update' }, (payload) => {
          expect(payload.payload.setlistSongId).toBe(setlistSong!.id);
          expect(payload.payload.newVoteCount).toBe(1);
          channel.unsubscribe();
          done();
        })
        .subscribe();

      // Cast vote
      await app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          'content-type': 'application/json',
          'authorization': `Bearer ${authToken}`
        },
        payload: {
          query: `
            mutation CastVote($input: VoteInput!) {
              castVote(input: $input) {
                success
              }
            }
          `,
          variables: {
            input: {
              showId: testShow.id,
              songId: testSongs[0].id,
              setlistSongId: setlistSong!.id
            }
          }
        }
      });
    });
  });
});