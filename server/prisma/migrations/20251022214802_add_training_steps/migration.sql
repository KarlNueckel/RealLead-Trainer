-- CreateTable
CREATE TABLE "TrainingStep" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "score" INTEGER,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrainingStep_userId_path_idx" ON "TrainingStep"("userId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "TrainingStep_userId_path_name_key" ON "TrainingStep"("userId", "path", "name");
