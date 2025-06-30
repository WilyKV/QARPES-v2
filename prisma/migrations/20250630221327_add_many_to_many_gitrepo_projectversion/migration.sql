/*
  Warnings:

  - You are about to drop the column `projectVersionId` on the `GitRepo` table. All the data in the column will be lost.
  - You are about to alter the column `name` on the `GitRepo` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `branch` on the `GitRepo` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to alter the column `lastCommitHash` on the `GitRepo` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - You are about to drop the column `gitRepoId` on the `Procedure` table. All the data in the column will be lost.
  - You are about to drop the column `projectVersionId` on the `Procedure` table. All the data in the column will be lost.
  - Added the required column `versionGitRepoId` to the `Procedure` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GitRepo" DROP CONSTRAINT "GitRepo_projectVersionId_fkey";

-- DropForeignKey
ALTER TABLE "Procedure" DROP CONSTRAINT "Procedure_gitRepoId_fkey";

-- DropForeignKey
ALTER TABLE "Procedure" DROP CONSTRAINT "Procedure_projectVersionId_fkey";

-- AlterTable
ALTER TABLE "GitRepo" DROP COLUMN "projectVersionId",
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "branch" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "lastCommitHash" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "Procedure" DROP COLUMN "gitRepoId",
DROP COLUMN "projectVersionId",
ADD COLUMN     "versionGitRepoId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "ProjectVersionGitRepo" (
    "id" SERIAL NOT NULL,
    "projectVersionId" INTEGER NOT NULL,
    "gitRepoId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectVersionGitRepo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectVersionGitRepo_projectVersionId_gitRepoId_key" ON "ProjectVersionGitRepo"("projectVersionId", "gitRepoId");

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_versionGitRepoId_fkey" FOREIGN KEY ("versionGitRepoId") REFERENCES "ProjectVersionGitRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectVersionGitRepo" ADD CONSTRAINT "ProjectVersionGitRepo_projectVersionId_fkey" FOREIGN KEY ("projectVersionId") REFERENCES "ProjectVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectVersionGitRepo" ADD CONSTRAINT "ProjectVersionGitRepo_gitRepoId_fkey" FOREIGN KEY ("gitRepoId") REFERENCES "GitRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
