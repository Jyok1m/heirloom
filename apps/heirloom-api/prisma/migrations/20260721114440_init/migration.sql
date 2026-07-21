-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'OTHER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "UnionType" AS ENUM ('MARRIAGE', 'CIVIL_UNION', 'PARTNERSHIP', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "Pedigree" AS ENUM ('BIRTH', 'ADOPTED', 'FOSTER', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('BIRTH', 'BAPTISM', 'DEATH', 'BURIAL', 'CREMATION', 'OCCUPATION', 'RESIDENCE', 'EDUCATION', 'EMIGRATION', 'IMMIGRATION', 'NATURALIZATION', 'MARRIAGE', 'MARRIAGE_BANNS', 'ENGAGEMENT', 'DIVORCE', 'ANNULMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO');

-- CreateTable
CREATE TABLE "Tree" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tree_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "gedcomId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "namePrefix" TEXT,
    "nameSuffix" TEXT,
    "nickname" TEXT,
    "sex" "Sex" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Union" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "gedcomId" TEXT,
    "type" "UnionType" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Union_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnionPartner" (
    "unionId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,

    CONSTRAINT "UnionPartner_pkey" PRIMARY KEY ("unionId","personId")
);

-- CreateTable
CREATE TABLE "ChildInUnion" (
    "unionId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "pedigree" "Pedigree" NOT NULL DEFAULT 'BIRTH',

    CONSTRAINT "ChildInUnion_pkey" PRIMARY KEY ("unionId","personId")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "description" TEXT,
    "dateValue" TEXT,
    "dateSort" DATE,
    "place" TEXT,
    "notes" TEXT,
    "personId" TEXT,
    "unionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "gedcomId" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publication" TEXT,
    "repository" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Citation" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "page" TEXT,
    "quality" INTEGER,

    CONSTRAINT "Citation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "treeId" TEXT NOT NULL,
    "gedcomId" TEXT,
    "type" "MediaType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "title" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaLink" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "personId" TEXT,
    "eventId" TEXT,
    "sourceId" TEXT,

    CONSTRAINT "MediaLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Person_treeId_lastName_firstName_idx" ON "Person"("treeId", "lastName", "firstName");

-- CreateIndex
CREATE UNIQUE INDEX "Person_treeId_gedcomId_key" ON "Person"("treeId", "gedcomId");

-- CreateIndex
CREATE UNIQUE INDEX "Union_treeId_gedcomId_key" ON "Union"("treeId", "gedcomId");

-- CreateIndex
CREATE INDEX "UnionPartner_personId_idx" ON "UnionPartner"("personId");

-- CreateIndex
CREATE INDEX "ChildInUnion_personId_idx" ON "ChildInUnion"("personId");

-- CreateIndex
CREATE INDEX "Event_personId_type_idx" ON "Event"("personId", "type");

-- CreateIndex
CREATE INDEX "Event_unionId_type_idx" ON "Event"("unionId", "type");

-- CreateIndex
CREATE INDEX "Event_dateSort_idx" ON "Event"("dateSort");

-- CreateIndex
CREATE UNIQUE INDEX "Source_treeId_gedcomId_key" ON "Source"("treeId", "gedcomId");

-- CreateIndex
CREATE INDEX "Citation_sourceId_idx" ON "Citation"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "Citation_eventId_sourceId_page_key" ON "Citation"("eventId", "sourceId", "page");

-- CreateIndex
CREATE UNIQUE INDEX "Media_treeId_gedcomId_key" ON "Media"("treeId", "gedcomId");

-- CreateIndex
CREATE INDEX "MediaLink_mediaId_idx" ON "MediaLink"("mediaId");

-- CreateIndex
CREATE INDEX "MediaLink_personId_idx" ON "MediaLink"("personId");

-- CreateIndex
CREATE INDEX "MediaLink_eventId_idx" ON "MediaLink"("eventId");

-- CreateIndex
CREATE INDEX "MediaLink_sourceId_idx" ON "MediaLink"("sourceId");

-- AddForeignKey
ALTER TABLE "Person" ADD CONSTRAINT "Person_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Union" ADD CONSTRAINT "Union_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnionPartner" ADD CONSTRAINT "UnionPartner_unionId_fkey" FOREIGN KEY ("unionId") REFERENCES "Union"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnionPartner" ADD CONSTRAINT "UnionPartner_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildInUnion" ADD CONSTRAINT "ChildInUnion_unionId_fkey" FOREIGN KEY ("unionId") REFERENCES "Union"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChildInUnion" ADD CONSTRAINT "ChildInUnion_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_unionId_fkey" FOREIGN KEY ("unionId") REFERENCES "Union"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Citation" ADD CONSTRAINT "Citation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Media" ADD CONSTRAINT "Media_treeId_fkey" FOREIGN KEY ("treeId") REFERENCES "Tree"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLink" ADD CONSTRAINT "MediaLink_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLink" ADD CONSTRAINT "MediaLink_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLink" ADD CONSTRAINT "MediaLink_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLink" ADD CONSTRAINT "MediaLink_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;
