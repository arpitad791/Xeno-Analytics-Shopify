/*
  Warnings:

  - You are about to drop the `cache_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `job_queue` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

-- DropTable
DROP TABLE "cache_entries";

-- DropTable
DROP TABLE "job_queue";

-- DropEnum
DROP TYPE "JobStatus";

-- CreateIndex
CREATE INDEX "tenants_createdAt_idx" ON "tenants"("createdAt");

-- CreateIndex
CREATE INDEX "users_tenantId_idx" ON "users"("tenantId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");
