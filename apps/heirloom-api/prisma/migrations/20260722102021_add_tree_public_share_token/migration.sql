-- AlterTable
ALTER TABLE "Tree" ADD COLUMN     "publicShareToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tree_publicShareToken_key" ON "Tree"("publicShareToken");
