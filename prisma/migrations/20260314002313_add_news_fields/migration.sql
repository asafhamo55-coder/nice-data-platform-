-- AlterTable
ALTER TABLE "news_items" ADD COLUMN     "bookmarked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newsCategory" TEXT NOT NULL DEFAULT 'general',
ADD COLUMN     "relevance" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "sourceIcon" TEXT;
