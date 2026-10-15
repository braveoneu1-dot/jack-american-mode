export const topicMemories = {
  table: "topic_memories",
  columns: {
    topicKey: "topic_key",
    topicLabel: "topic_label",
    memoryJson: "memory_json",
    sessionCount: "session_count",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
} as const;

export const conversationTopics = {
  table: "conversation_topics",
  columns: {
    topicKey: "topic_key",
    topicLabel: "topic_label",
    createdAt: "created_at",
  },
} as const;
