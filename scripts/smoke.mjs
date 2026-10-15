import assert from "node:assert/strict";
import worker from "../worker/index.js";

const page = await worker.fetch(new Request("https://example.test/"), {}, {});
assert.equal(page.status, 200);
const pageText = await page.text();
assert.match(pageText, /JACK/);
assert.match(pageText, /playPressureNative/);
assert.match(pageText, /Talk like a local/);
assert.match(pageText, /@elevenlabs\/client/);
assert.match(pageText, /WORK · BUDGET/);
assert.match(pageText, /nextBankIndex\('pressure'/);
assert.doesNotMatch(pageText, /pressureIndex=\(pressureIndex\+1\)%conversations\.length/);
assert.match(pageText, /@elevenlabs\/client@1\.10\.0/);
assert.match(pageText, /const iosKickstart=/);
assert.match(pageText, /liveConversation\.sendUserMessage\(iosKickstart\)/);
assert.match(pageText, /setLiveState\('READY','Tap once, then just talk\.'\)/);
assert.match(pageText, /signedUrl:data\.signedUrl,connectionType:'websocket'/);
assert.match(pageText, /manifest\.webmanifest/);
assert.match(pageText, /apple-mobile-web-app-capable/);
assert.match(pageText, /mobile-install/);
for (const match of pageText.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(match[1]);
for (const match of pageText.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)) {
  new Function(match[1].replace(/^import[^;]+;\s*/m, ""));
}

const manifestResponse = await worker.fetch(new Request("https://example.test/manifest.webmanifest"), {}, {});
assert.equal(manifestResponse.status, 200);
assert.equal(manifestResponse.headers.get("content-type"), "application/manifest+json; charset=utf-8");
const manifest = await manifestResponse.json();
assert.equal(manifest.display, "standalone");
assert.equal(manifest.short_name, "Jack");
const iconResponse = await worker.fetch(new Request("https://example.test/app-icon.svg"), {}, {});
assert.equal(iconResponse.status, 200);
assert.match(await iconResponse.text(), /<svg/);
const serviceWorkerResponse = await worker.fetch(new Request("https://example.test/sw.js"), {}, {});
assert.equal(serviceWorkerResponse.status, 200);
assert.match(await serviceWorkerResponse.text(), /skipWaiting/);

const health = await worker.fetch(new Request("https://example.test/api/health"), { ANTHROPIC_API_KEY: "secret-test-key" }, {});
assert.deepEqual(await health.json(), { configured: true, voiceConfigured: false });

const originalFetch = globalThis.fetch;
globalThis.fetch = async (_url, options = {}) => {
  if (String(_url).includes("/v2/voices")) return new Response(JSON.stringify({ voices: [
    { voice_id: "voice-british", name: "Formal Narrator", labels: { accent: "British" } },
    { voice_id: "voice-american", name: "Warm Coach", description: "Natural and conversational", labels: { accent: "American" } }
  ] }), { status: 200, headers: { "content-type": "application/json" } });
  if (String(_url).includes("/text-to-speech/")) {
    assert.match(String(_url), /voice-american/);
    return new Response(new Uint8Array([73, 68, 51]), { status: 200, headers: { "content-type": "audio/mpeg" } });
  }
  if (String(_url).includes("/v1/convai/agents?")) return new Response(JSON.stringify({ agents: [] }), { status: 200, headers: { "content-type": "application/json" } });
  if (String(_url).endsWith("/v1/convai/agents/create")) {
    const configuration = JSON.parse(options.body);
    assert.equal(configuration.name, "Jack American Mode — Mobile Fast");
    assert.equal(configuration.conversation_config.agent.prompt.llm, "claude-haiku-4-5");
    assert.equal(configuration.conversation_config.agent.prompt.max_tokens, 200);
    assert.equal(configuration.conversation_config.turn.turn_timeout, 4);
    assert.equal(configuration.conversation_config.turn.turn_eagerness, "eager");
    assert.equal(configuration.conversation_config.turn.speculative_turn, true);
    assert.match(configuration.conversation_config.agent.prompt.prompt, /\{\{topic_memory\}\}/);
    assert.equal(configuration.conversation_config.tts.voice_id, "voice-american");
    assert.equal(configuration.conversation_config.tts.model_id, "eleven_flash_v2");
    return new Response(JSON.stringify({ agent_id: "agent-jack-realtime" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(_url).includes("/v1/convai/conversation/token")) {
    assert.match(String(_url), /agent-jack-realtime/);
    return new Response(JSON.stringify({ token: "test-conversation-token", conversation_id: "conversation-test" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(_url).includes("/v1/convai/conversation/get-signed-url")) {
    assert.match(String(_url), /agent-jack-realtime/);
    return new Response(JSON.stringify({ signed_url: "wss://api.elevenlabs.io/test-signed-session" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  const request = JSON.parse(options.body);
  const supplied = JSON.parse(request.messages[0].content);
  assert.equal(supplied.learner_transcript, "My original answer stays here.");
  return new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify({
    praise: "Clear point.",
    correction: "Use a tighter verb.",
    local_version: "My original answer still lives here, just cleaner.",
    why: "It preserves the meaning while improving the rhythm.",
    spoken_feedback: "Yeah, your point was clear. Tighten the verb, then use this version."
  }) }] }), { status: 200, headers: { "content-type": "application/json" } });
};
const coached = await worker.fetch(new Request("https://example.test/api/coach", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ transcript: "My original answer stays here.", mode: "personal_review", context: {} })
}), { ANTHROPIC_API_KEY: "secret-test-key" }, {});
assert.equal(coached.status, 200);
const coachedBody = await coached.json();
assert.equal(coachedBody.local_version, "My original answer still lives here, just cleaner.");
assert.match(coachedBody.spoken_feedback, /your point was clear/i);

const voiceHealth = await worker.fetch(new Request("https://example.test/api/health"), {
  ANTHROPIC_API_KEY: "secret-test-key",
  ELEVENLABS_API_KEY: "eleven-secret-test-key"
}, {});
assert.deepEqual(await voiceHealth.json(), { configured: true, voiceConfigured: true });
const spoken = await worker.fetch(new Request("https://example.test/api/speech", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text: "That sounds much more natural." })
}), { ELEVENLABS_API_KEY: "eleven-secret-test-key" }, {});
assert.equal(spoken.status, 200);
assert.equal(spoken.headers.get("content-type"), "audio/mpeg");
const realtime = await worker.fetch(new Request("https://example.test/api/realtime-token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic: "work", transport: "websocket" }) }), {
  ELEVENLABS_API_KEY: "eleven-secret-test-key"
}, {});
assert.equal(realtime.status, 200);
assert.deepEqual(await realtime.json(), { signedUrl: "wss://api.elevenlabs.io/test-signed-session", token: null, conversationId: null, topic: "work", label: "Work", memoryText: "No earlier memory exists for this topic.", hasMemory: false });

let savedMemoryRow = null;
const memoryDb = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async first() { return savedMemoryRow; },
          async run() {
            assert.match(sql, /INSERT INTO topic_memories/);
            savedMemoryRow = { memory_json: values[2], session_count: (savedMemoryRow?.session_count || 0) + 1, updated_at: values[4] };
            return { success: true };
          }
        };
      }
    };
  }
};
globalThis.fetch = async () => new Response(JSON.stringify({ content: [{ type: "text", text: JSON.stringify({
  summary: "Yuichi discussed a difficult deadline and wants to revisit the outcome.",
  personal_details: ["Works in accounting"], opinions: [], open_threads: ["How the deadline turned out"],
  english_patterns: ["Compress long explanations"], learned_phrases: ["raise the flag"]
}) }] }), { status: 200, headers: { "content-type": "application/json" } });
const savedMemory = await worker.fetch(new Request("https://example.test/api/memory", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ topic: "work", turns: [
    { speaker: "Yuichi", text: "I had a rough deadline at work." }, { speaker: "Jack", text: "How did it turn out?" }
  ] })
}), { DB: memoryDb, ANTHROPIC_API_KEY: "secret-test-key" }, {});
assert.equal(savedMemory.status, 200);
assert.equal((await savedMemory.json()).memory.open_threads[0], "How the deadline turned out");
const loadedMemory = await worker.fetch(new Request("https://example.test/api/memory?topic=work"), { DB: memoryDb }, {});
assert.equal(loadedMemory.status, 200);
assert.equal((await loadedMemory.json()).sessionCount, 1);

const customTopics = [];
const topicsDb = {
  prepare(sql) {
    return {
      async all() { return { results: [...customTopics].reverse() }; },
      bind(...values) {
        return {
          async first() {
            if (/lower\(topic_label\)/.test(sql)) return customTopics.find(row => row.topic_label.toLowerCase() === String(values[0]).toLowerCase()) || null;
            if (/FROM conversation_topics/.test(sql)) return customTopics.find(row => row.topic_key === values[0]) || null;
            return null;
          },
          async run() {
            assert.match(sql, /INSERT INTO conversation_topics/);
            customTopics.push({ topic_key: values[0], topic_label: values[1], created_at: values[2] });
            return { success: true };
          }
        };
      }
    };
  }
};
const createdTopic = await worker.fetch(new Request("https://example.test/api/topics", {
  method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ label: "Tesla" })
}), { DB: topicsDb }, {});
assert.equal(createdTopic.status, 201);
const createdTopicBody = await createdTopic.json();
assert.match(createdTopicBody.topic.key, /^custom-tesla-/);
const listedTopics = await worker.fetch(new Request("https://example.test/api/topics"), { DB: topicsDb }, {});
assert.deepEqual((await listedTopics.json()).topics[0].label, "Tesla");
globalThis.fetch = originalFetch;
console.log("Worker smoke test passed");
