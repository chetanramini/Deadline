-- CreateTable
CREATE TABLE "public"."Preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workStart" INTEGER NOT NULL,
    "workEnd" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Preferences_userId_key" ON "public"."Preferences"("userId");
