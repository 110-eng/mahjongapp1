-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "avatar_url" TEXT,
    "experience_level" TEXT NOT NULL DEFAULT 'beginner',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "image_url" TEXT,
    "owner_user_id" TEXT NOT NULL,
    "season_start_month" INTEGER NOT NULL DEFAULT 9,
    "ranking_enabled" BOOLEAN NOT NULL DEFAULT true,
    "inviteToken" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "groups_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_memberships_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "group_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "group_rules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "starting_points" INTEGER NOT NULL DEFAULT 25000,
    "return_points" INTEGER NOT NULL DEFAULT 30000,
    "uma_first" INTEGER NOT NULL DEFAULT 20,
    "uma_second" INTEGER NOT NULL DEFAULT 10,
    "uma_third" INTEGER NOT NULL DEFAULT -10,
    "uma_fourth" INTEGER NOT NULL DEFAULT -20,
    "oka_enabled" BOOLEAN NOT NULL DEFAULT true,
    "chip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "chip_value" INTEGER NOT NULL DEFAULT 100,
    "red_dora_chip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ippatsu_chip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ura_dora_chip_enabled" BOOLEAN NOT NULL DEFAULT false,
    "bust_penalty_enabled" BOOLEAN NOT NULL DEFAULT false,
    "bust_penalty_value" INTEGER NOT NULL DEFAULT 0,
    "yakitori_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rounding_rule" TEXT NOT NULL DEFAULT 'round',
    "tie_rule" TEXT NOT NULL DEFAULT 'seat_order',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "group_rules_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organizer_user_id" TEXT NOT NULL,
    "event_datetime" DATETIME NOT NULL,
    "entry_deadline" DATETIME NOT NULL,
    "max_tables" INTEGER NOT NULL,
    "beginner_friendly" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "events_organizer_user_id_fkey" FOREIGN KEY ("organizer_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'entered',
    "entered_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" DATETIME,
    "selected_at" DATETIME,
    "played_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "entries_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "group_id" TEXT NOT NULL,
    "event_id" TEXT,
    "played_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rule_snapshot" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_by_user_id" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "games_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "games_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "games_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "game_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "seat_order" INTEGER NOT NULL,
    "final_score" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "raw_score_point" REAL NOT NULL,
    "uma_point" REAL NOT NULL,
    "oka_point" REAL NOT NULL,
    "chip_count" INTEGER NOT NULL DEFAULT 0,
    "chip_point" REAL NOT NULL DEFAULT 0,
    "penalty_point" REAL NOT NULL DEFAULT 0,
    "total_ranking_point" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "game_results_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "game_results_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "game_results_game_id_user_id_key" ON "game_results"("game_id", "user_id");
