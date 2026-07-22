-- CreateEnum
CREATE TYPE "Religion" AS ENUM ('CATHOLIC', 'JEWISH', 'MUSLIM', 'NEUTRAL');

-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "religion" "Religion" NOT NULL DEFAULT 'NEUTRAL';
