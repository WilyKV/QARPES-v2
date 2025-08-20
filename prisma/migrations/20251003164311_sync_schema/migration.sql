/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `ticketNumber` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Cab` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ProjectPv` table. All the data in the column will be lost.
  - Added the required column `environment` to the `Cab` table without a default value. This is not possible if the table is not empty.
  - Added the required column `helpdeskUrl` to the `Cab` table without a default value. This is not possible if the table is not empty.
  - Made the column `memberId` on table `TeamMember` required. This step will fail if there are existing NULL values in that column.

*/
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
ALTER TABLE "TeamMember" ALTER COLUMN "memberId" SET NOT NULL;

-- CreateTable
CREATE TABLE "sessions" (
    "sid" TEXT NOT NULL,
    "sess" JSONB NOT NULL,
    "expire" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("sid")
);

-- CreateIndex
CREATE INDEX "sessions_expire_idx" ON "sessions"("expire");
