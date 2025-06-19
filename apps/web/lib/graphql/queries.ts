import { gql } from 'graphql-request'

// Show queries
export const GET_SHOWS = gql`
  query GetShows($limit: Int!, $offset: Int, $status: String) {
    shows(limit: $limit, offset: $offset, status: $status) {
      id
      date
      title
      status
      ticketmasterUrl
      viewCount
      artist {
        id
        name
        slug
        imageUrl
      }
      venue {
        id
        name
        city
        state
        country
      }
    }
  }
`

export const GET_SHOW_WITH_SETLIST = gql`
  query GetShowWithSetlist($id: ID!) {
    show(id: $id) {
      id
      date
      title
      status
      ticketmasterUrl
      viewCount
      artist {
        id
        name
        slug
        imageUrl
      }
      venue {
        id
        name
        city
        state
        country
      }
      setlists {
        id
        name
        orderIndex
        setlistSongs {
          id
          position
          voteCount
          song {
            id
            title
            album
            albumImageUrl
            durationMs
            spotifyUrl
          }
        }
      }
    }
  }
`

// Artist queries
export const GET_ARTISTS = gql`
  query GetArtists($limit: Int!, $offset: Int, $search: String) {
    artists(limit: $limit, offset: $offset, search: $search) {
      id
      name
      slug
      imageUrl
      genres
      popularity
      followers
    }
  }
`

export const GET_ARTIST = gql`
  query GetArtist($slug: String!) {
    artistBySlug(slug: $slug) {
      id
      name
      slug
      imageUrl
      genres
      popularity
      followers
      spotifyId
      shows {
        id
        date
        title
        status
        venue {
          id
          name
          city
          state
          country
        }
      }
      songs {
        id
        title
        album
        durationMs
        popularity
        spotifyUrl
        albumImageUrl
      }
    }
  }
`

// Vote mutations
export const CAST_VOTE = gql`
  mutation CastVote($showId: ID!, $setlistSongId: ID!) {
    castVote(showId: $showId, setlistSongId: $setlistSongId) {
      success
      voteId
      newVoteCount
      dailyVotesRemaining
      showVotesRemaining
      message
    }
  }
`

export const ADD_SONG_TO_SETLIST = gql`
  mutation AddSongToSetlist($setlistId: ID!, $input: AddSongToSetlistInput!) {
    addSongToSetlist(setlistId: $setlistId, input: $input) {
      id
      position
      voteCount
      song {
        id
        title
        album
        albumImageUrl
      }
    }
  }
`

// User queries
export const GET_USER_VOTES = gql`
  query GetUserVotes($showId: ID!) {
    userVotes(showId: $showId) {
      setlistSongId
    }
  }
`

export const GET_MY_ARTISTS = gql`
  query GetMyArtists {
    myArtists {
      artist {
        id
        name
        slug
        imageUrl
        genres
      }
      followedAt
    }
  }
`

// Search query
export const SEARCH_ALL = gql`
  query SearchAll($query: String!) {
    search(query: $query, input: { types: ["ARTIST", "SHOW", "SONG", "VENUE"] }) {
      artists {
        id
        name
        slug
        imageUrl
        genres
        popularity
        followers
      }
      shows {
        id
        title
        date
        artist {
          id
          name
          slug
        }
        venue {
          id
          name
          city
          state
        }
        totalVotes
      }
      songs {
        id
        title
        album
        artist {
          id
          name
          slug
        }
      }
      venues {
        id
        name
        city
        state
        country
      }
      totalResults
    }
  }
`