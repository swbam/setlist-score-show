r eview my codebase and the fixes below and implement all to get this app fully working and the db correct

O3-high

SETLIST-SCORE-SHOW

Technical Redesign & Finish-Line Playbook

(Revision 2024-06-14 – supersedes CLAUDE-2.md & CLAUDE.md)

────────────────────────────────────────

0. READ-ME-FIRST

────────────────────────────────────────

• Scope ─ This document replaces the two Claude files and expands them ~5× in depth.

• Target reader ─ A full-stack engineer joining the project cold who must take the repo to production-ready quality.

• Constraints ─ Keep the existing high-level architecture (Node/Express + React + Postgres + Prisma + Socket.IO). No brand-new paradigms unless strictly needed for stability or compliance.

• Deliverables included ─

– Complete data-model w/ SQL & Prisma schema

– Critical bug / tech-debt fixes with ready-to-paste code

– New folder layout, package.json, env guidelines

– Cron, queue & data-sync logic

– API contract & auth rules

– Test strategy & sample tests

────────────────────────────────────────

1. OVERVIEW – “WHY DOES THIS APP EXIST?”

────────────────────────────────────────

The app lets fans vote in real-time on which songs should appear in a band’s upcoming show.

Key capabilities:

1. Pull upcoming tour dates & historical setlists from Setlist.fm ➞ our DB

2. Open a voting window per show; users vote once per track

3. Aggregate votes live, display leaderboard; lock when show starts

4. After show, reconcile actual played songs vs. votes and generate “score”

────────────────────────────────────────

2. HIGH-LEVEL FLOW

────────────────────────────────────────

1. Nightly cron 🌙 pulls new shows → concerts table

2. T-48h cron opens “voting” status for each show

3. Client subscribes via Socket.IO → emits vote events

4. API validates & persists votes (transaction) → broadcast updated tallies

5. At scheduled show-time, cron closes voting → freeze tallies

6. Post-show cron pulls actual setlist → compare & store results

────────────────────────────────────────

3. REVISED FOLDER LAYOUT

────────────────────────────────────────

/apps

/web            ← Next.js front-end

/api            ← Express/TS back-end

/prisma

schema.prisma   ← canonical data model

/scripts

sync-cron.ts    ← all cron jobs (uses Bull queue)

/docs

architecture.md ← THIS file after split

/md-files         ← legacy (keep for reference; no longer source of truth)

/tests

Dockerfile

docker-compose.yml

.env.example

package.json (root workspace w/ yarn workspaces)

────────────────────────────────────────

4. DATABASE – DEFINITIVE SCHEMA

────────────────────────────────────────

A. ER DIAGRAM (textual)

User 1--* Vote *--1 Song

Concert 1--* ConcertSong (*setlist proposals*)

Concert 1--* ActualSong (*post-show import*)

B. Prisma schema.prisma  (ready to paste)

```prisma

datasource db {

provider = "postgresql"

url      = env("DATABASE_URL")

}

generator client {

provider = "prisma-client-js"

}

model User {

id            String   @id @default(uuid())

email         String   @unique

displayName   String

createdAt     DateTime @default(now())

votes         Vote[]

}

model Song {

id          String   @id @default(uuid())

artist      String

title       String

durationSec Int?

createdAt   DateTime @default(now())

@@unique([artist, title])

}

model Concert {

id            String   @id @default(uuid())

extId         String   @unique  // setlist.fm id

city          String

venue         String

date          DateTime

votingOpensAt DateTime

votingClosesAt DateTime

status        ConcertStatus @default(SCHEDULED)

votes         Vote[]

songs         ConcertSong[]

actualSongs   ActualSong[]

}

model ConcertSong {

id        String @id @default(uuid())

concert   Concert @relation(fields: [concertId], references: [id])

concertId String

song      Song    @relation(fields: [songId], references: [id])

songId    String

position  Int?    // suggested ordering

votes     Vote[]

@@unique([concertId, songId])

}

model Vote {

id           String   @id @default(uuid())

user         User     @relation(fields: [userId], references: [id])

userId       String

concertSong  ConcertSong @relation(fields: [concertSongId], references: [id])

concertSongId String

createdAt    DateTime @default(now())

@@unique([userId, concertSongId]) // 1 vote per user per song

}

model ActualSong {

id        String  @id @default(uuid())

concert   Concert @relation(fields: [concertId], references: [id])

concertId String

song      Song    @relation(fields: [songId], references: [id])

songId    String

position  Int

}

enum ConcertStatus {

SCHEDULED

VOTING

LOCKED

OVER

}

```

C. SQL indices generated by Prisma will cover uniqueness & FK; add manual GIN on Vote to speed tallies:

```sql

CREATE INDEX idx_vote_concertSong ON "Vote" ("concertSongId");

```

────────────────────────────────────────

5. CRITICAL FIXES (WITH CODE)

────────────────────────────────────────

#FIX-1  Duplicate Song rows being created by sync script

ROOT CAUSE: Song lookup used case-sensitive equality, missing transaction

PATCH (prisma):

```ts

export async function upsertSong(artist: string, title: string, durationSec?: number) {

return prisma.song.upsert({

where: { artist_title: {artist, title} },   // composite unique

update: { durationSec },

create: { artist, title, durationSec },

});

}

```

Update /scripts/setlist-import.ts to call upsertSong instead of create.

#FIX-2  Vote overwrite / race condition

ROOT CAUSE: Two rapid socket emits causing duplicate insert violating unique; error bubbled to client.

PATCH (socket handler):

```ts

io.on("connection", (socket) => {

socket.on("vote", async ({ concertSongId }) => {

const userId