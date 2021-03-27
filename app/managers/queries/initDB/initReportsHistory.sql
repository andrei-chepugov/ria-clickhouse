CREATE TABLE IF NOT EXISTS reports.history
(
    `id_user`    String,
    `id_report`  UUID default generateUUIDv4(),
    `name`       String,
    `created_at` Date default now(),
    `request`    String
) ENGINE = MergeTree(created_at, id_report, 8192);