CREATE TABLE `topic_memories` (
  `topic_key` text PRIMARY KEY NOT NULL,
  `topic_label` text NOT NULL,
  `memory_json` text NOT NULL DEFAULT '{}',
  `session_count` integer NOT NULL DEFAULT 0,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_topic_memories_updated_at` ON `topic_memories` (`updated_at`);
