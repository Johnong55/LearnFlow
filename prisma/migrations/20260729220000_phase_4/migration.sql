-- CreateEnum
CREATE TYPE "CalendarEventType" AS ENUM ('APPOINTMENT', 'WORK', 'PERSONAL', 'MEDICAL', 'FAMILY', 'TRAVEL', 'OTHER');

-- CreateEnum
CREATE TYPE "StudySessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED', 'SKIPPED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "StudySessionSource" AS ENUM ('GENERATED', 'REBALANCED', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReschedulingMode" AS ENUM ('BALANCED', 'DEADLINE_FOCUSED', 'LOW_STRESS');

-- CreateEnum
CREATE TYPE "SchedulingConflictStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" "CalendarEventType" NOT NULL DEFAULT 'PERSONAL',
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "is_fixed" BOOLEAN NOT NULL DEFAULT true,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "location" VARCHAR(250),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "start_at" TIMESTAMPTZ(3) NOT NULL,
    "end_at" TIMESTAMPTZ(3) NOT NULL,
    "planned_minutes" INTEGER NOT NULL,
    "actual_minutes" INTEGER,
    "status" "StudySessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "source" "StudySessionSource" NOT NULL DEFAULT 'GENERATED',
    "started_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "deleted_at" TIMESTAMPTZ(3),

    CONSTRAINT "study_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduling_conflicts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "roadmap_id" UUID NOT NULL,
    "task_id" UUID,
    "code" VARCHAR(100) NOT NULL,
    "reason" TEXT NOT NULL,
    "details" JSONB,
    "status" "SchedulingConflictStatus" NOT NULL DEFAULT 'OPEN',
    "resolved_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "scheduling_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "calendar_events_user_id_start_at_idx" ON "calendar_events"("user_id", "start_at");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_end_at_idx" ON "calendar_events"("user_id", "end_at");

-- CreateIndex
CREATE INDEX "calendar_events_user_id_deleted_at_idx" ON "calendar_events"("user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_start_at_idx" ON "study_sessions"("user_id", "start_at");

-- CreateIndex
CREATE INDEX "study_sessions_user_id_status_start_at_idx" ON "study_sessions"("user_id", "status", "start_at");

-- CreateIndex
CREATE INDEX "study_sessions_task_id_status_idx" ON "study_sessions"("task_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "study_sessions_task_id_start_at_end_at_key" ON "study_sessions"("task_id", "start_at", "end_at");

-- CreateIndex
CREATE INDEX "scheduling_conflicts_user_id_status_created_at_idx" ON "scheduling_conflicts"("user_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "scheduling_conflicts_roadmap_id_status_idx" ON "scheduling_conflicts"("roadmap_id", "status");

-- CreateIndex
CREATE INDEX "scheduling_conflicts_task_id_idx" ON "scheduling_conflicts"("task_id");

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "learning_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling_conflicts" ADD CONSTRAINT "scheduling_conflicts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling_conflicts" ADD CONSTRAINT "scheduling_conflicts_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduling_conflicts" ADD CONSTRAINT "scheduling_conflicts_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "learning_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
