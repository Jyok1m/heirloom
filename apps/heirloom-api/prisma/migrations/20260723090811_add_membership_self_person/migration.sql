-- AlterTable
ALTER TABLE "TreeMembership" ADD COLUMN     "selfPersonId" TEXT;

-- CreateIndex
CREATE INDEX "TreeMembership_selfPersonId_idx" ON "TreeMembership"("selfPersonId");

-- AddForeignKey
ALTER TABLE "TreeMembership" ADD CONSTRAINT "TreeMembership_selfPersonId_fkey" FOREIGN KEY ("selfPersonId") REFERENCES "Person"("id") ON DELETE SET NULL ON UPDATE CASCADE;
