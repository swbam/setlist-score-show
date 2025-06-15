-- CreateTable
CREATE TABLE "artist_sync_queue" (
    "id" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "sync_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "error_message" TEXT,

    CONSTRAINT "artist_sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "artist_sync_queue_artist_id_idx" ON "artist_sync_queue"("artist_id");

-- CreateIndex
CREATE INDEX "artist_sync_queue_status_idx" ON "artist_sync_queue"("status");

-- CreateIndex
CREATE INDEX "artist_sync_queue_sync_type_idx" ON "artist_sync_queue"("sync_type");

-- AddForeignKey
ALTER TABLE "artist_sync_queue" ADD CONSTRAINT "artist_sync_queue_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE; 