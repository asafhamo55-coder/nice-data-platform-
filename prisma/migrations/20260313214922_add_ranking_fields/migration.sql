-- AlterTable
ALTER TABLE "vendor_categories" ADD COLUMN     "categoryRank" INTEGER,
ADD COLUMN     "categoryScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "overallRank" INTEGER,
ADD COLUMN     "overallScore" DOUBLE PRECISION;
