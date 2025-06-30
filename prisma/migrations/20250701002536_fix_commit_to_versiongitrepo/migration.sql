/*
  Warnings:

  - You are about to drop the column `gitRepoId` on the `Commit` table. All the data in the column will be lost.
  - You are about to drop the column `projectVersionId` on the `Commit` table. All the data in the column will be lost.
  - Added the required column `versionGitRepoId` to the `Commit` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Commit" DROP CONSTRAINT "Commit_gitRepoId_fkey";

-- DropForeignKey
ALTER TABLE "Commit" DROP CONSTRAINT "Commit_projectVersionId_fkey";

-- AlterTable
ALTER TABLE "Commit" DROP COLUMN "gitRepoId",
DROP COLUMN "projectVersionId",
ADD COLUMN     "versionGitRepoId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Commit" ADD CONSTRAINT "Commit_versionGitRepoId_fkey" FOREIGN KEY ("versionGitRepoId") REFERENCES "ProjectVersionGitRepo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
