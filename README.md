# TheSet - Concert Setlist Voting Platform

TheSet is a web application that allows music fans to vote on setlists for upcoming concerts and compare fan-created setlists with actual performed setlists.

## Features

- 🎵 **Spotify Integration**: Login with Spotify to access personalized artist dashboard
- 🎫 **Ticketmaster Integration**: Real-time concert and venue information
- 🗳️ **Live Voting**: Vote on songs you want to hear at upcoming shows
- 📊 **Setlist Comparison**: Compare fan predictions with actual performed setlists
- 🔄 **Real-time Updates**: Live voting updates via Supabase Realtime
- 📱 **Mobile Responsive**: Works seamlessly across all devices

## Tech Stack

- **Frontend**: React with TypeScript and Vite
- **Styling**: Tailwind CSS with ShadCN UI components
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth with Spotify OAuth
- **State Management**: React Query
- **Real-time**: Supabase Realtime

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Supabase account and project
- Spotify Developer account (for API credentials)
- Ticketmaster Developer account (for API credentials)

### Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update `.env` with your credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/setlist-score-show-1.git
cd setlist-score-show-1
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up your Supabase database with the required tables (see Database Schema section)

4. Run the development server:
```bash
npm run dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

## Database Schema

The application requires the following tables in your Supabase database:

- `users` - User profiles
- `artists` - Artist information from Spotify
- `venues` - Venue information from Ticketmaster
- `shows` - Concert/show information
- `songs` - Song catalog for artists
- `setlists` - Fan-created setlists
- `setlist_songs` - Songs in setlists with vote counts
- `votes` - Individual user votes
- `played_setlists` - Actual performed setlists
- `played_setlist_songs` - Songs in performed setlists
- `user_artists` - User's followed artists

## API Integrations

### Spotify API
- Used for artist data and song catalogs
- Requires Client ID and Client Secret

### Ticketmaster API
- Used for concert and venue information
- Requires API Key

### Setlist.fm API
- Used for actual performed setlists
- Requires API Key

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
