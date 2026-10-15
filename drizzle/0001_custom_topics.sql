CREATE TABLE `conversation_topics` (
  `topic_key` text PRIMARY KEY NOT NULL,
  `topic_label` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_conversation_topics_created_at` ON `conversation_topics` (`created_at`);
