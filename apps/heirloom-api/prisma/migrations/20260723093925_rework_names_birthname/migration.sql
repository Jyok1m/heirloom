-- AlterTable
ALTER TABLE "Person" DROP COLUMN "usedName",
DROP COLUMN "usualName",
ADD COLUMN     "birthName" TEXT;
