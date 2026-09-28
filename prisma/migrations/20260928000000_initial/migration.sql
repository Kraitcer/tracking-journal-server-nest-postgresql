-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "profileName" TEXT,
    "password" TEXT,
    "authProvider" TEXT NOT NULL DEFAULT 'local',
    "googleId" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journals" (
    "id" TEXT NOT NULL,
    "journal_id" TEXT,
    "user_id" TEXT,
    "free_days" JSONB NOT NULL DEFAULT '[]',
    "journal_pages" JSONB NOT NULL DEFAULT '[]',
    "start_date" TEXT,
    "end_date" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT,
    "direction" TEXT,
    "type" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "morningPages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "journal_id" TEXT,
    "pageDate" TEXT,
    "display" TEXT,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "selectedProject" TEXT,
    "selectedGoal" TEXT,
    "wakeUpTime" TEXT,
    "wokeUpEnergized" BOOLEAN NOT NULL DEFAULT false,
    "hungryForAction" BOOLEAN NOT NULL DEFAULT false,
    "sleeprRating" INTEGER NOT NULL,
    "todayProjectsAndGoals" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "morningPages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eveningPages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "pageDate" TEXT,
    "layouts" JSONB,
    "isEditing" TEXT NOT NULL DEFAULT 'editing',
    "allGoals" JSONB,
    "journal_id" TEXT,
    "todayGoals" JSONB,
    "todaysTasks" JSONB,
    "gratefulness" JSONB,
    "voteCast" JSONB,
    "yourEngine" JSONB NOT NULL,
    "badTime" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "eveningPages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "projectName" TEXT NOT NULL,
    "date_created" TEXT,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "fetusIndex" JSONB,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FETUS" (
    "id" TEXT NOT NULL,
    "projectID" TEXT,
    "fetusIndex" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FETUS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "descriptions" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "body" JSONB NOT NULL DEFAULT '[]',

    CONSTRAINT "descriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "goalName" TEXT,
    "currentProjectID" TEXT,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT,
    "padMode" TEXT NOT NULL DEFAULT 'goalsPageMain',
    "subTasks" INTEGER NOT NULL DEFAULT 0,
    "creationDate" TEXT,
    "timeSpent" TEXT,
    "dueDate" TEXT,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "taskName" TEXT NOT NULL DEFAULT '',
    "goal_id" TEXT,
    "project_id" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "isEditing" BOOLEAN NOT NULL DEFAULT false,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subTasks" (
    "id" TEXT NOT NULL,
    "subTaskName" TEXT,
    "goal_id" TEXT,
    "task_id" TEXT,
    "project_id" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "padMode" TEXT NOT NULL DEFAULT 'main',
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "subTasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekInReviewPages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "journal_id" TEXT,
    "pageDate" TEXT,
    "isEditing" TEXT NOT NULL DEFAULT 'editing',
    "layouts" JSONB,
    "projects" JSONB NOT NULL DEFAULT '[]',
    "habits" JSONB NOT NULL DEFAULT '[]',
    "moreOrLess" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekInReviewPages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planningNextWeekPages" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "journal_id" TEXT,
    "pageDate" TEXT,
    "isEditing" TEXT NOT NULL DEFAULT 'editing',
    "layouts" JSONB,
    "habits" JSONB NOT NULL DEFAULT '[]',
    "projects" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planningNextWeekPages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freedays" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "journal_id" TEXT,
    "pageDate" TEXT,
    "morningPages" TEXT,
    "eveningPages" TEXT,

    CONSTRAINT "freedays_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "descriptions_entity_entity_id_key" ON "descriptions"("entity", "entity_id");
