-- CreateTable
CREATE TABLE "public"."Student" (
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "grade" INTEGER,
    "favoriteSubject" TEXT,
    "mockExamScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "public"."ChatSession" (
    "id" TEXT NOT NULL,
    "studentEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "sessionNotes" TEXT,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChatMessage" (
    "id" BIGSERIAL NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "tokensEstimated" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DailyStudentMetric" (
    "studentEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "summaryDate" DATE NOT NULL,
    "sessionsCount" INTEGER NOT NULL DEFAULT 0,
    "userMessagesCount" INTEGER NOT NULL DEFAULT 0,
    "assistantMessagesCount" INTEGER NOT NULL DEFAULT 0,
    "totalTokenEstimate" INTEGER NOT NULL DEFAULT 0,
    "totalDurationSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyStudentMetric_pkey" PRIMARY KEY ("studentEmail","subject","summaryDate")
);

-- CreateIndex
CREATE INDEX "ChatSession_studentEmail_subject_idx" ON "public"."ChatSession"("studentEmail", "subject");

-- CreateIndex
CREATE INDEX "ChatSession_startedAt_idx" ON "public"."ChatSession"("startedAt");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_createdAt_idx" ON "public"."ChatMessage"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "ChatMessage_role_idx" ON "public"."ChatMessage"("role");

-- AddForeignKey
ALTER TABLE "public"."ChatSession" ADD CONSTRAINT "ChatSession_studentEmail_fkey" FOREIGN KEY ("studentEmail") REFERENCES "public"."Student"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DailyStudentMetric" ADD CONSTRAINT "DailyStudentMetric_studentEmail_fkey" FOREIGN KEY ("studentEmail") REFERENCES "public"."Student"("email") ON DELETE CASCADE ON UPDATE CASCADE;
