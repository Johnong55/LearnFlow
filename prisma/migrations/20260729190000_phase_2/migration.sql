-- Phase 2: onboarding, routines, availability, skills, and learning goals.
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'OFFICE');
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE "LearningFormat" AS ENUM ('VIDEO', 'TEXT', 'INTERACTIVE', 'PROJECT', 'MENTOR', 'MIXED');
CREATE TYPE "RoutineType" AS ENUM ('SLEEP', 'WORK', 'COMMUTE', 'BREAKFAST', 'LUNCH', 'DINNER', 'EXERCISE', 'HYGIENE', 'FAMILY', 'REST', 'ENTERTAINMENT', 'HOUSEWORK', 'PERSONAL', 'OTHER');
CREATE TYPE "AvailabilityType" AS ENUM ('AVAILABLE', 'UNAVAILABLE', 'PREFERRED');
CREATE TYPE "ConstraintPriority" AS ENUM ('HARD', 'SOFT');
CREATE TYPE "SkillLevel" AS ENUM ('NONE', 'BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE "UserSkillType" AS ENUM ('CURRENT', 'TARGET', 'BOTH');
CREATE TYPE "GoalStatus" AS ENUM ('DRAFT', 'ANALYZING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "GoalPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

ALTER TABLE "user_preferences"
  ADD COLUMN "preferred_study_days" "DayOfWeek"[] NOT NULL DEFAULT ARRAY[]::"DayOfWeek"[],
  ADD COLUMN "preferred_learning_format" "LearningFormat",
  ADD COLUMN "max_daily_learning_minutes" INTEGER NOT NULL DEFAULT 120,
  ADD COLUMN "max_cognitive_load" INTEGER NOT NULL DEFAULT 7;

CREATE TABLE "onboarding_progress" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "current_step" INTEGER NOT NULL DEFAULT 1,
  "personal_profile" JSONB,
  "work_schedule" JSONB,
  "life_routine" JSONB,
  "learning_preferences" JSONB,
  "completed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "onboarding_progress_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "onboarding_progress_user_id_key" ON "onboarding_progress"("user_id");
CREATE INDEX "onboarding_progress_completed_at_idx" ON "onboarding_progress"("completed_at");

CREATE TABLE "routines" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "type" "RoutineType" NOT NULL,
  "title" VARCHAR(150) NOT NULL,
  "weekdays" "DayOfWeek"[] NOT NULL,
  "start_time" VARCHAR(5) NOT NULL,
  "end_time" VARCHAR(5) NOT NULL,
  "is_flexible" BOOLEAN NOT NULL DEFAULT false,
  "constraint_priority" "ConstraintPriority" NOT NULL DEFAULT 'HARD',
  "priority" INTEGER NOT NULL DEFAULT 3,
  "minimum_duration_minutes" INTEGER,
  "preferred_duration_minutes" INTEGER,
  "buffer_before_minutes" INTEGER NOT NULL DEFAULT 0,
  "buffer_after_minutes" INTEGER NOT NULL DEFAULT 0,
  "source" VARCHAR(30) NOT NULL DEFAULT 'USER',
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "routines_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "routines_priority_check" CHECK ("priority" BETWEEN 1 AND 5),
  CONSTRAINT "routines_time_check" CHECK ("start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT "routines_duration_check" CHECK ("minimum_duration_minutes" IS NULL OR "minimum_duration_minutes" > 0),
  CONSTRAINT "routines_preferred_duration_check" CHECK ("preferred_duration_minutes" IS NULL OR "preferred_duration_minutes" > 0)
);
CREATE INDEX "routines_user_id_deleted_at_idx" ON "routines"("user_id", "deleted_at");
CREATE INDEX "routines_user_id_type_idx" ON "routines"("user_id", "type");

CREATE TABLE "availability_rules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "title" VARCHAR(150) NOT NULL,
  "type" "AvailabilityType" NOT NULL,
  "constraint_priority" "ConstraintPriority" NOT NULL DEFAULT 'HARD',
  "weekdays" "DayOfWeek"[] NOT NULL,
  "start_time" VARCHAR(5) NOT NULL,
  "end_time" VARCHAR(5) NOT NULL,
  "effective_from" DATE,
  "effective_until" DATE,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "availability_rules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "availability_rules_time_check" CHECK ("start_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "end_time" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT "availability_rules_dates_check" CHECK ("effective_until" IS NULL OR "effective_from" IS NULL OR "effective_until" >= "effective_from")
);
CREATE INDEX "availability_rules_user_id_deleted_at_idx" ON "availability_rules"("user_id", "deleted_at");
CREATE INDEX "availability_rules_user_id_type_idx" ON "availability_rules"("user_id", "type");

CREATE TABLE "skills" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" VARCHAR(150) NOT NULL,
  "slug" VARCHAR(180) NOT NULL,
  "category" VARCHAR(100),
  "description" TEXT,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");
CREATE INDEX "skills_name_idx" ON "skills"("name");

CREATE TABLE "user_skills" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "type" "UserSkillType" NOT NULL DEFAULT 'CURRENT',
  "current_level" "SkillLevel" NOT NULL DEFAULT 'NONE',
  "target_level" "SkillLevel",
  "confidence_level" INTEGER,
  "last_practiced_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_skills_confidence_check" CHECK ("confidence_level" IS NULL OR "confidence_level" BETWEEN 0 AND 100)
);
CREATE UNIQUE INDEX "user_skills_user_id_skill_id_key" ON "user_skills"("user_id", "skill_id");
CREATE INDEX "user_skills_user_id_deleted_at_idx" ON "user_skills"("user_id", "deleted_at");
CREATE INDEX "user_skills_skill_id_idx" ON "user_skills"("skill_id");

CREATE TABLE "learning_goals" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "skill_id" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "description" TEXT NOT NULL,
  "current_level" "SkillLevel" NOT NULL,
  "target_level" "SkillLevel" NOT NULL,
  "target_date" TIMESTAMPTZ(3) NOT NULL,
  "priority" "GoalPriority" NOT NULL DEFAULT 'MEDIUM',
  "weekly_available_hours" DECIMAL(4,1) NOT NULL,
  "status" "GoalStatus" NOT NULL DEFAULT 'DRAFT',
  "success_criteria" JSONB NOT NULL,
  "user_constraints" JSONB,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3),
  CONSTRAINT "learning_goals_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learning_goals_weekly_hours_check" CHECK ("weekly_available_hours" > 0 AND "weekly_available_hours" <= 168)
);
CREATE INDEX "learning_goals_user_id_status_idx" ON "learning_goals"("user_id", "status");
CREATE INDEX "learning_goals_skill_id_idx" ON "learning_goals"("skill_id");
CREATE INDEX "learning_goals_target_date_idx" ON "learning_goals"("target_date");

ALTER TABLE "onboarding_progress" ADD CONSTRAINT "onboarding_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "routines" ADD CONSTRAINT "routines_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "availability_rules" ADD CONSTRAINT "availability_rules_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT;
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "learning_goals" ADD CONSTRAINT "learning_goals_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE RESTRICT;
