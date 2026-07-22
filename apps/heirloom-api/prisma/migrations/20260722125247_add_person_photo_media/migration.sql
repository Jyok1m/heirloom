-- AlterTable
ALTER TABLE "Person" ADD COLUMN     "photoMediaId" TEXT;

-- CreateIndex
CREATE INDEX "Person_photoMediaId_idx" ON "Person"("photoMediaId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_photoMediaId_fkey" FOREIGN KEY ("photoMediaId") REFERENCES "Media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
