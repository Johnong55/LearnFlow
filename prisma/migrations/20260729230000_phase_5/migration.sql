-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('SCHEDULE_CHANGED', 'DEADLINE_RISK', 'PROGRESS_SUMMARY', 'SYSTEM');

-- AlterTable
ALTER TABLE "study_sessions" ADD COLUMN     "accumulated_seconds" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_resumed_at" TIMESTAMPTZ(3),
ADD COLUMN     "paused_at" TIMESTAMPTZ(3),
ADD COLUMN     "skip_reason" VARCHAR(500);

-- CreateTable
CREATE TABLE "session_feedback" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "session_id" UUID,
    "difficulty_rating" INTEGER,
    "focus_level" INTEGER,
    "actual_minutes" INTEGER,
    "took_longer_than_expected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "session_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progress_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "goal_id" UUID NOT NULL,
    "roadmap_id" UUID NOT NULL,
    "period_start" TIMESTAMPTZ(3) NOT NULL,
    "period_end" TIMESTAMPTZ(3) NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "planned_minutes" INTEGER NOT NULL,
    "actual_minutes" INTEGER NOT NULL,
    "task_completion_rate" DECIMAL(5,2) NOT NULL,
    "milestone_completion_rate" DECIMAL(5,2) NOT NULL,
    "schedule_adherence_rate" DECIMAL(5,2) NOT NULL,
    "current_streak" INTEGER NOT NULL,
    "weekly_consistency" DECIMAL(5,2) NOT NULL,
    "estimated_completion_date" TIMESTAMPTZ(3),
    "schedule_variance_days" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "progress_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" VARCHAR(200) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "read_at" TIMESTAMPTZ(3),
    "sent_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_feedback_session_id_key" ON "session_feedback"("session_id");

-- CreateIndex
CREATE INDEX "session_feedback_user_id_created_at_idx" ON "session_feedback"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "session_feedback_task_id_created_at_idx" ON "session_feedback"("task_id", "created_at");

-- CreateIndex
CREATE INDEX "progress_snapshots_user_id_created_at_idx" ON "progress_snapshots"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "progress_snapshots_goal_id_created_at_idx" ON "progress_snapshots"("goal_id", "created_at");

-- CreateIndex
CREATE INDEX "progress_snapshots_roadmap_id_created_at_idx" ON "progress_snapshots"("roadmap_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "progress_snapshots_goal_id_snapshot_date_key" ON "progress_snapshots"("goal_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "notifications_user_id_status_created_at_idx" ON "notifications"("user_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "learning_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_feedback" ADD CONSTRAINT "session_feedback_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "study_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "learning_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progress_snapshots" ADD CONSTRAINT "progress_snapshots_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
