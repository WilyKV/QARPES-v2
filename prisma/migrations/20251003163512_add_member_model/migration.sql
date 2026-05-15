/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `ticketNumber` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ProjectPv` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `TeamMember` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[teamId,memberId]` on the table `TeamMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `environment` to the `Cab` table without a default value. This is not possible if the table is not empty.
  - Added the required column `helpdeskUrl` to the `Cab` table without a default value. This is not possible if the table is not empty.
  - Added the required column `memberId` to the `TeamMember` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- DropIndex (Supprimer d'abord la contrainte unique)
ALTER TABLE "public"."TeamMember" DROP CONSTRAINT IF EXISTS "TeamMember_teamId_userId_key";
DROP INDEX IF EXISTS "public"."TeamMember_teamId_userId_key";

-- AlterTable
ALTER TABLE "Cab" DROP COLUMN "assigneeId",
DROP COLUMN "description",
DROP COLUMN "dueDate",
DROP COLUMN "priority",
DROP COLUMN "ticketNumber",
DROP COLUMN "title",
ADD COLUMN     "environment" TEXT NOT NULL,
ADD COLUMN     "helpdeskUrl" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'cree';

-- AlterTable
ALTER TABLE "ProjectPv" DROP COLUMN "type",
ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'pv_fonctionnel_recette',
ALTER COLUMN "status" SET DEFAULT 'en_cours';

-- AlterTable
ALTER TABLE "ProjectVersion" ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" DROP COLUMN "userId",
ADD COLUMN     "memberId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Member" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" VARCHAR(255),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "sid" TEXT NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE INDEX "sessions_expire_idx" ON "sessions"("expire");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_memberId_key" ON "TeamMember"("teamId", "memberId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
