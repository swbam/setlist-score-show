import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test artists
  const artists = await Promise.all([
    prisma.artist.upsert({
      where: { spotifyId: '0TnOYISbd1XYRBk9myaseg' },
      update: {},
      create: {
        spotifyId: '0TnOYISbd1XYRBk9myaseg',
        setlistfmMbid: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
        name: 'The Beatles',
        slug: 'the-beatles',
        genres: ['rock', 'pop', 'classic rock'],
        popularity: 85,
        followers: 30000000,
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb4293f8f2e9f3d3f3d3f3d3f3',
      },
    }),
    prisma.artist.upsert({
      where: { spotifyId: '3WrFJ7ztbogyGnTHbHJFl2' },
      update: {},
      create: {
        spotifyId: '3WrFJ7ztbogyGnTHbHJFl2',
        setlistfmMbid: '83d91898-7763-47d7-b03b-b92132375c47',
        name: 'Led Zeppelin',
        slug: 'led-zeppelin',
        genres: ['rock', 'hard rock', 'classic rock'],
        popularity: 82,
        followers: 20000000,
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb4293f8f2e9f3d3f3d3f3d3f3',
      },
    }),
    prisma.artist.upsert({
      where: { spotifyId: '6FBDaR13swtiWwGhX1WQsP' },
      update: {},
      create: {
        spotifyId: '6FBDaR13swtiWwGhX1WQsP',
        setlistfmMbid: '5b11f4ce-a62d-471e-81fc-a69a8278c7da',
        name: 'Nirvana',
        slug: 'nirvana',
        genres: ['grunge', 'alternative rock', 'rock'],
        popularity: 80,
        followers: 15000000,
        imageUrl: 'https://i.scdn.co/image/ab6761610000e5eb4293f8f2e9f3d3f3d3f3d3f3',
      },
    }),
  ])

  console.log(`✅ Created ${artists.length} artists`)

  // Create test venues
  const venues = await Promise.all([
    prisma.venue.upsert({
      where: { ticketmasterId: 'KovZpZAEkEEA' },
      update: {},
      create: {
        ticketmasterId: 'KovZpZAEkEEA',
        setlistfmId: '33d62cf9',
        name: 'Madison Square Garden',
        address: '4 Pennsylvania Plaza',
        city: 'New York',
        state: 'NY',
        country: 'United States',
        postalCode: '10001',
        latitude: 40.7505,
        longitude: -73.9934,
        timezone: 'America/New_York',
        capacity: 20000,
      },
    }),
    prisma.venue.upsert({
      where: { ticketmasterId: 'KovZpZAJ6nlA' },
      update: {},
      create: {
        ticketmasterId: 'KovZpZAJ6nlA',
        setlistfmId: '4bd63fc4',
        name: 'The Forum',
        address: '3900 W Manchester Blvd',
        city: 'Inglewood',
        state: 'CA',
        country: 'United States',
        postalCode: '90305',
        latitude: 33.9583,
        longitude: -118.3417,
        timezone: 'America/Los_Angeles',
        capacity: 17500,
      },
    }),
  ])

  console.log(`✅ Created ${venues.length} venues`)

  // Create test shows
  const futureDate = new Date()
  futureDate.setMonth(futureDate.getMonth() + 2)

  const shows = await Promise.all([
    prisma.show.create({
      data: {
        artistId: artists[0].id,
        venueId: venues[0].id,
        date: futureDate,
        title: 'The Beatles Reunion Tour',
        tourName: 'Get Back Tour 2025',
        status: 'scheduled',
        ticketmasterUrl: 'https://www.ticketmaster.com/event/123',
      },
    }),
    prisma.show.create({
      data: {
        artistId: artists[1].id,
        venueId: venues[1].id,
        date: new Date(futureDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        title: 'Led Zeppelin Celebration Day',
        tourName: 'Celebration Tour 2025',
        status: 'scheduled',
        ticketmasterUrl: 'https://www.ticketmaster.com/event/456',
      },
    }),
  ])

  console.log(`✅ Created ${shows.length} shows`)

  // Create songs for artists
  const beatlesSongs = await Promise.all([
    prisma.song.create({
      data: {
        artistId: artists[0].id,
        spotifyId: '0aym2LBJBk9DAYuHHutrIl',
        title: 'Hey Jude',
        album: 'The Beatles 1967-1970',
        popularity: 78,
        durationMs: 431333,
      },
    }),
    prisma.song.create({
      data: {
        artistId: artists[0].id,
        spotifyId: '2EqlS6tkEnglzr7tkKAAYD',
        title: 'Come Together',
        album: 'Abbey Road',
        popularity: 75,
        durationMs: 259946,
      },
    }),
    prisma.song.create({
      data: {
        artistId: artists[0].id,
        spotifyId: '3BQHpFgAp4l80e1XslIjNI',
        title: 'Yesterday',
        album: 'Help!',
        popularity: 71,
        durationMs: 125666,
      },
    }),
  ])

  const zeppelinSongs = await Promise.all([
    prisma.song.create({
      data: {
        artistId: artists[1].id,
        spotifyId: '5CQ30WqJwcep0pYcV4AMNc',
        title: 'Stairway to Heaven',
        album: 'Led Zeppelin IV',
        popularity: 82,
        durationMs: 482830,
      },
    }),
    prisma.song.create({
      data: {
        artistId: artists[1].id,
        spotifyId: '0QwZfbw26QeUoIy82Z2jYp',
        title: 'Kashmir',
        album: 'Physical Graffiti',
        popularity: 70,
        durationMs: 517068,
      },
    }),
  ])

  console.log(`✅ Created ${beatlesSongs.length + zeppelinSongs.length} songs`)

  // Create setlists for shows
  const setlist1 = await prisma.setlist.create({
    data: {
      showId: shows[0].id,
      name: 'Main Set',
      orderIndex: 0,
    },
  })

  const setlist2 = await prisma.setlist.create({
    data: {
      showId: shows[1].id,
      name: 'Main Set',
      orderIndex: 0,
    },
  })

  // Add songs to setlists
  await Promise.all([
    ...beatlesSongs.map((song, index) =>
      prisma.setlistSong.create({
        data: {
          setlistId: setlist1.id,
          songId: song.id,
          position: index + 1,
          voteCount: Math.floor(Math.random() * 100),
        },
      })
    ),
    ...zeppelinSongs.map((song, index) =>
      prisma.setlistSong.create({
        data: {
          setlistId: setlist2.id,
          songId: song.id,
          position: index + 1,
          voteCount: Math.floor(Math.random() * 100),
        },
      })
    ),
  ])

  console.log('✅ Created setlist songs')

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: '123e4567-e89b-12d3-a456-426614174000', // Fixed UUID for testing
      email: 'test@example.com',
      displayName: 'Test User',
      preferences: {
        theme: 'dark',
        favoriteGenres: ['rock', 'alternative'],
        notificationsEnabled: true,
      },
    },
  })

  console.log('✅ Created test user')

  // Refresh materialized views
  await prisma.$executeRaw`REFRESH MATERIALIZED VIEW trending_shows`

  console.log('✅ Database seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })