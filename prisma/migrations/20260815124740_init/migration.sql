-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('inexperienced', 'beginner', 'experienced');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('owner', 'member');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('open', 'closed', 'finalized', 'completed');

-- CreateEnum
CREATE TYPE "EntryStatus" AS ENUM ('entered', 'cancelled', 'selected', 'not_selected', 'played');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('draft', 'confirmed', 'void');

-- CreateEnum
CREATE TYPE "TableStatus" AS ENUM ('open', 'locked');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "avatar_url" TEXT,
    "password_hash" TEXT,
    "experience_level" "ExperienceLevel" NOT NULL DEFAULT 'beginner',
    "is_guest" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "owner_user_id" TEXT NOT NULL,
    "season_start_month" INTEGER NOT NULL DEFAULT 9,
    "ranking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "inviteToken" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_memberships" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_rules" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "starting_points" INTEGER NOT NULL DEFAULT 25000,
    "uma_first" INTEGER NOT NULL DEFAULT 20,
    "uma_second" INTEGER NOT NULL DEFAULT 10,
    "uma_third" INTEGER NOT NULL DEFAULT -10,
    "uma_fourth" INTEGER NOT NULL DEFAULT -20,
    "oka_enabled" BOOLEAN NOT NULL DEFAULT true,
    "oka_points" INTEGER NOT NULL DEFAULT 5000,
    "chip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "chip_value" INTEGER NOT NULL DEFAULT 1000,
    "red_dora_chip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ippatsu_chip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ura_dora_chip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "bust_penalty_enabled" BOOLEAN NOT NULL DEFAULT false,
    "bust_penalty_value" INTEGER NOT NULL DEFAULT 0,
    "yakitori_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rounding_rule" TEXT NOT NULL DEFAULT 'asis',
    "tie_rule" TEXT NOT NULL DEFAULT 'seat_order',
    "result_entry_permission" TEXT NOT NULL DEFAULT 'all_members',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizer_user_id" TEXT NOT NULL,
    "event_datetime" TIMESTAMP(3) NOT NULL,
    "entry_deadline" TIMESTAMP(3) NOT NULL,
    "max_tables" INTEGER NOT NULL,
    "beginner_friendly" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "status" "EventStatus" NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "EntryStatus" NOT NULL DEFAULT 'entered',
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),
    "selected_at" TIMESTAMP(3),
    "played_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "event_id" TEXT,
    "table_id" TEXT,
    "hanchan_number" INTEGER,
    "played_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rule_snapshot" TEXT NOT NULL,
    "status" "GameStatus" NOT NULL DEFAULT 'draft',
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "played_date" TIMESTAMP(3) NOT NULL,
    "status" "TableStatus" NOT NULL DEFAULT 'open',
    "created_by_user_id" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "table_members" (
    "id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seat_order" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "table_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "game_results" (
    "id" TEXT NOT NULL,
    "game_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seat_order" INTEGER NOT NULL,
    "final_score" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "raw_score_point" DOUBLE PRECISION NOT NULL,
    "uma_point" DOUBLE PRECISION NOT NULL,
    "oka_point" DOUBLE PRECISION NOT NULL,
    "chip_count" INTEGER NOT NULL DEFAULT 0,
    "chip_point" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "penalty_point" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_ranking_point" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "game_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "groups_inviteToken_key" ON "groups"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "group_memberships_group_id_user_id_key" ON "group_memberships"("group_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_rules_group_id_key" ON "group_rules"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "entries_event_id_user_id_key" ON "entries"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "table_members_table_id_user_id_key" ON "table_members"("table_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "game_results_game_id_user_id_key" ON "game_results"("game_id", "user_id");

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_rules" ADD CONSTRAINT "group_rules_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_user_id_fkey" FOREIGN KEY ("organizer_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "games" ADD CONSTRAINT "games_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_members" ADD CONSTRAINT "table_members_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "table_members" ADD CONSTRAINT "table_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "game_results" ADD CONSTRAINT "game_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
