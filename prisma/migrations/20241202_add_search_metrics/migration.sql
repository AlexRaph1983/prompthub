-- Create SearchMetrics table for tracking search validation statistics
CREATE TABLE "SearchMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "count_saved" INTEGER NOT NULL DEFAULT 0,
    "count_rejected" INTEGER NOT NULL DEFAULT 0,
    "rejection_reasons" TEXT NOT NULL DEFAULT '{}',
    "last_updated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX "SearchMetrics_id_idx" ON "SearchMetrics"("id");

-- Insert initial metrics record
INSERT INTO "SearchMetrics" ("id", "count_saved", "count_rejected", "rejection_reasons", "last_updated")
VALUES ('main', 0, 0, '{}', CURRENT_TIMESTAMP);
