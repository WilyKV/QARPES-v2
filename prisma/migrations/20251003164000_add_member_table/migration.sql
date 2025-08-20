-- CreateTable Member
CREATE TABLE IF NOT EXISTS "Member" (
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

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Member_userId_key" ON "Member"("userId");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Modifier TeamMember: supprimer userId et ajouter memberId
-- D'abord, supprimer la contrainte unique existante
ALTER TABLE "TeamMember" DROP CONSTRAINT IF EXISTS "TeamMember_teamId_userId_key";

-- Supprimer la clé étrangère existante
ALTER TABLE "TeamMember" DROP CONSTRAINT IF EXISTS "TeamMember_userId_fkey";

-- Ajouter la colonne memberId (nullable temporairement)
ALTER TABLE "TeamMember" ADD COLUMN IF NOT EXISTS "memberId" INTEGER;

-- Supprimer la colonne userId (après avoir copié les données si nécessaire)
ALTER TABLE "TeamMember" DROP COLUMN IF EXISTS "userId";

-- Ajouter la clé étrangère vers Member
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Créer la nouvelle contrainte unique
CREATE UNIQUE INDEX IF NOT EXISTS "TeamMember_teamId_memberId_key" ON "TeamMember"("teamId", "memberId");
