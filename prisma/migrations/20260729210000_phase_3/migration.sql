CREATE TYPE "RoadmapStatus" AS ENUM ('DRAFT', 'GENERATING', 'ACTIVE', 'COMPLETED', 'ARCHIVED', 'FAILED');
CREATE TYPE "RoadmapVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE "RoadmapDifficulty" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');
CREATE TYPE "LearningTaskType" AS ENUM ('LEARNING', 'PRACTICE', 'PROJECT', 'ASSESSMENT', 'REVIEW');
CREATE TYPE "LearningTaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');
CREATE TYPE "ResourceContentType" AS ENUM ('ROADMAP', 'ARTICLE', 'VIDEO', 'COURSE', 'DOCUMENTATION', 'BOOK', 'REPOSITORY', 'OTHER');

ALTER TABLE "background_jobs" ADD COLUMN "status_message" VARCHAR(250);

CREATE TABLE "roadmaps" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "user_id" UUID NOT NULL, "goal_id" UUID NOT NULL,
  "title" VARCHAR(250) NOT NULL, "status" "RoadmapStatus" NOT NULL DEFAULT 'DRAFT',
  "current_version_number" INTEGER NOT NULL DEFAULT 0, "active_version_number" INTEGER,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMPTZ(3) NOT NULL,
  "deleted_at" TIMESTAMPTZ(3), CONSTRAINT "roadmaps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "roadmap_versions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "roadmap_id" UUID NOT NULL, "generation_job_id" UUID NOT NULL,
  "version" INTEGER NOT NULL, "status" "RoadmapVersionStatus" NOT NULL DEFAULT 'DRAFT', "summary" TEXT NOT NULL,
  "estimated_weeks" INTEGER NOT NULL, "weekly_hours" DECIMAL(4,1) NOT NULL, "difficulty" "RoadmapDifficulty" NOT NULL,
  "assumptions" JSONB NOT NULL, "prerequisites" JSONB NOT NULL, "generation_metadata" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "roadmap_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roadmap_versions_estimate_check" CHECK ("estimated_weeks" > 0 AND "weekly_hours" > 0)
);

CREATE TABLE "roadmap_milestones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "version_id" UUID NOT NULL, "title" VARCHAR(250) NOT NULL,
  "description" TEXT, "order" INTEGER NOT NULL, "estimated_hours" DECIMAL(6,1) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "roadmap_milestones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roadmap_milestones_order_hours_check" CHECK ("order" > 0 AND "estimated_hours" > 0)
);

CREATE TABLE "roadmap_modules" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "milestone_id" UUID NOT NULL, "title" VARCHAR(250) NOT NULL,
  "description" TEXT, "order" INTEGER NOT NULL, "estimated_hours" DECIMAL(6,1) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "roadmap_modules_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roadmap_modules_order_hours_check" CHECK ("order" > 0 AND "estimated_hours" > 0)
);

CREATE TABLE "learning_tasks" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "module_id" UUID NOT NULL, "title" VARCHAR(250) NOT NULL,
  "description" TEXT, "type" "LearningTaskType" NOT NULL, "status" "LearningTaskStatus" NOT NULL DEFAULT 'PENDING',
  "order" INTEGER NOT NULL, "estimated_minutes" INTEGER NOT NULL, "difficulty" "RoadmapDifficulty" NOT NULL,
  "priority" INTEGER NOT NULL DEFAULT 3, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL, CONSTRAINT "learning_tasks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "learning_tasks_values_check" CHECK ("order" > 0 AND "estimated_minutes" > 0 AND "priority" BETWEEN 1 AND 5)
);

CREATE TABLE "task_dependencies" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "task_id" UUID NOT NULL, "prerequisite_id" UUID NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "task_dependencies_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "task_dependencies_not_self_check" CHECK ("task_id" <> "prerequisite_id")
);

CREATE TABLE "roadmap_sources" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "version_id" UUID NOT NULL, "title" VARCHAR(500) NOT NULL,
  "url" VARCHAR(2048) NOT NULL, "description" TEXT, "source_domain" VARCHAR(255) NOT NULL,
  "published_at" TIMESTAMPTZ(3), "retrieved_at" TIMESTAMPTZ(3) NOT NULL,
  "content_type" "ResourceContentType" NOT NULL, "relevance_score" DECIMAL(4,3) NOT NULL,
  "credibility_score" DECIMAL(4,3) NOT NULL, "language" VARCHAR(20) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "roadmap_sources_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roadmap_sources_scores_check" CHECK ("relevance_score" BETWEEN 0 AND 1 AND "credibility_score" BETWEEN 0 AND 1)
);

CREATE TABLE "roadmap_module_sources" (
  "module_id" UUID NOT NULL, "source_id" UUID NOT NULL,
  CONSTRAINT "roadmap_module_sources_pkey" PRIMARY KEY ("module_id", "source_id")
);

CREATE UNIQUE INDEX "roadmaps_goal_id_key" ON "roadmaps"("goal_id");
CREATE INDEX "roadmaps_user_id_status_idx" ON "roadmaps"("user_id", "status");
CREATE INDEX "roadmaps_goal_id_idx" ON "roadmaps"("goal_id");
CREATE UNIQUE INDEX "roadmap_versions_generation_job_id_key" ON "roadmap_versions"("generation_job_id");
CREATE INDEX "roadmap_versions_roadmap_id_status_idx" ON "roadmap_versions"("roadmap_id", "status");
CREATE UNIQUE INDEX "roadmap_versions_roadmap_id_version_key" ON "roadmap_versions"("roadmap_id", "version");
CREATE INDEX "roadmap_milestones_version_id_idx" ON "roadmap_milestones"("version_id");
CREATE UNIQUE INDEX "roadmap_milestones_version_id_order_key" ON "roadmap_milestones"("version_id", "order");
CREATE INDEX "roadmap_modules_milestone_id_idx" ON "roadmap_modules"("milestone_id");
CREATE UNIQUE INDEX "roadmap_modules_milestone_id_order_key" ON "roadmap_modules"("milestone_id", "order");
CREATE INDEX "learning_tasks_module_id_status_idx" ON "learning_tasks"("module_id", "status");
CREATE UNIQUE INDEX "learning_tasks_module_id_order_key" ON "learning_tasks"("module_id", "order");
CREATE INDEX "task_dependencies_prerequisite_id_idx" ON "task_dependencies"("prerequisite_id");
CREATE UNIQUE INDEX "task_dependencies_task_id_prerequisite_id_key" ON "task_dependencies"("task_id", "prerequisite_id");
CREATE INDEX "roadmap_sources_version_id_idx" ON "roadmap_sources"("version_id");
CREATE INDEX "roadmap_sources_source_domain_idx" ON "roadmap_sources"("source_domain");
CREATE UNIQUE INDEX "roadmap_sources_version_id_url_key" ON "roadmap_sources"("version_id", "url");
CREATE INDEX "roadmap_module_sources_source_id_idx" ON "roadmap_module_sources"("source_id");

ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmaps" ADD CONSTRAINT "roadmaps_goal_id_fkey" FOREIGN KEY ("goal_id") REFERENCES "learning_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmap_versions" ADD CONSTRAINT "roadmap_versions_roadmap_id_fkey" FOREIGN KEY ("roadmap_id") REFERENCES "roadmaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmap_versions" ADD CONSTRAINT "roadmap_versions_generation_job_id_fkey" FOREIGN KEY ("generation_job_id") REFERENCES "background_jobs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "roadmap_milestones" ADD CONSTRAINT "roadmap_milestones_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "roadmap_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmap_modules" ADD CONSTRAINT "roadmap_modules_milestone_id_fkey" FOREIGN KEY ("milestone_id") REFERENCES "roadmap_milestones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "learning_tasks" ADD CONSTRAINT "learning_tasks_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "roadmap_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "learning_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "task_dependencies" ADD CONSTRAINT "task_dependencies_prerequisite_id_fkey" FOREIGN KEY ("prerequisite_id") REFERENCES "learning_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmap_sources" ADD CONSTRAINT "roadmap_sources_version_id_fkey" FOREIGN KEY ("version_id") REFERENCES "roadmap_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmap_module_sources" ADD CONSTRAINT "roadmap_module_sources_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "roadmap_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "roadmap_module_sources" ADD CONSTRAINT "roadmap_module_sources_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "roadmap_sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
