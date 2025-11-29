-- CreateTable
CREATE TABLE "Gem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "files" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "intervalMinutes" INTEGER,
    "dailyTimes" TEXT,
    "dailyTime" TEXT,
    "timezone" TEXT DEFAULT 'America/New_York',
    "lastRun" BIGINT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_gemId_fkey" FOREIGN KEY ("gemId") REFERENCES "Gem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
