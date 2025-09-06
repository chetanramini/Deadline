-- CreateEnum
CREATE TYPE "public"."TaskStatus" AS ENUM ('PENDING', 'DONE', 'MISSED', 'AT_RISK');

-- CreateEnum
CREATE TYPE "public"."BlockStatus" AS ENUM ('PLANNED', 'DONE', 'MISSED', 'RESCHEDULED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" VARCHAR(36) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Task" (
    "id" VARCHAR(26) NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "course" TEXT,
    "description" TEXT,
    "dueAt" TIMESTAMPTZ(6) NOT NULL,
    "estHours" SMALLINT NOT NULL,
    "weight" SMALLINT NOT NULL DEFAULT 3,
    "status" "public"."TaskStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Block" (
    "id" VARCHAR(26) NOT NULL,
    "taskId" TEXT NOT NULL,
    "start" TIMESTAMPTZ(6) NOT NULL,
    "end" TIMESTAMPTZ(6) NOT NULL,
    "status" "public"."BlockStatus" NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Task_userId_dueAt_idx" ON "public"."Task"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "Task_userId_status_dueAt_idx" ON "public"."Task"("userId", "status", "dueAt");

-- CreateIndex
CREATE INDEX "Task_userId_course_dueAt_idx" ON "public"."Task"("userId", "course", "dueAt");

-- CreateIndex
CREATE INDEX "Block_taskId_idx" ON "public"."Block"("taskId");

-- CreateIndex
CREATE INDEX "Block_start_end_idx" ON "public"."Block"("start", "end");

-- AddForeignKey
ALTER TABLE "public"."Task" ADD CONSTRAINT "Task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Block" ADD CONSTRAINT "Block_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
