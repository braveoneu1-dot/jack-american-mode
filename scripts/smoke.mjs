import assert from "node:assert/strict";
import worker from "../worker/index.js";

const page = await worker.fetch(new Request("https://example.test/"), {}, {});
assert.equal(page.status, 200);
const pageText = await page.text();
const privateName = String.fromCharCode(89,117,105,99,104,105);
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
assert.match(pageText, /jack_private_profile_v1/);
assert.match(pageText, /profileFetch\('\/api\/realtime-token'/);
assert.match(pageText, /id="resetRealtime"/);
assert.match(pageText, /id="refreshApp"/);
assert.match(pageText, /within 30 seconds/);
assert.match(pageText, /Microphone access was blocked/);
assert.match(pageText, /onConversationCreated:conversation/);
assert.match(pageText, /releaseMicPermissionStream\(\)/);
assert.match(pageText, /liveConversation\.setMicMuted\(false\)/);
assert.match(pageText, /MICROPHONE REFRESHED/);
assert.match(pageText, /conversation\.changeInputDevice\(\{\}\)/);
assert.match(pageText, /HTTP '\+response\.status/);
assert.equal(pageText.toLowerCase().includes(privateName.toLowerCase()), false);
for (const match of pageText.matchAll(/<script>([\s\S]*?)<\/script>/g)) new Function(match[1]);
for (const match of pageText.matchAll(/<script type="module">([\s\S]*?)<\/script>/g)) {
  new Function(match[1].replace(/^import[^;]+;\s*/m, ""));
}

const manifestResponse = await worker.fetch(new Request("https://example.test/manifest.webmanifest"), {}, {});
assert.equal(manifestResponse.status, 200);
assert.equal(manifestResponse.headers.get("content-type"), "application/manifest+json; charset=utf-8");
const manifest = await manifestResponse.json();
assert.equal(manifest.display, "standalone");
assert.equal(manifest.short_name, "Jack AM");
assert.equal(manifest.icons[0].src, "/app-icon-v2-192.png");
const iconResponse = await worker.fetch(new Request("https://example.test/app-icon.svg"), {}, {});
assert.equal(iconResponse.status, 200);
assert.match(await iconResponse.text(), /<svg/);
const touchIconResponse = await worker.fetch(new Request("https://example.test/app-icon-v2-180.png"), {}, {});
assert.equal(touchIconResponse.status, 200);
assert.equal(touchIconResponse.headers.get("content-type"), "image/png");
assert.ok((await touchIconResponse.arrayBuffer()).byteLength > 8000);
const serviceWorkerResponse = await worker.fetch(new Request("https://example.test/sw.js"), {}, {});
assert.equal(serviceWorkerResponse.status, 200);
assert.match(await serviceWorkerResponse.text(), /skipWaiting/);

const health = await worker.fetch(new Request("https://example.test/api/health"), { ANTHROPIC_API_KEY: "secret-test-key" }, {});
assert.deepEqual(await health.json(), { configured: true, coachProvider: "Claude fallback", deepSeekConfigured: false, claudeConfigured: true, voiceConfigured: false });
const profileA = "anon_111111111111111111111111111111111111";
const profileB = "anon_222222222222222222222222222222222222";
const profileResponse = await worker.fetch(new Request("https://example.test/api/profile", { headers: { "x-jack-profile-id": profileA } }), {}, {});
assert.equal(profileResponse.status, 200);
assert.deepEqual(Object.keys(await profileResponse.json()).sort(), ["code", "kind"]);
const missingKeyRealtime = await worker.fetch(new Request("https://example.test/api/realtime-token", { method: "POST", headers: { "content-type": "application/json", "x-jack-profile-id": profileA }, body: "{}" }), {}, {});
assert.equal(missingKeyRealtime.status, 503);
assert.equal((await missingKeyRealtime.json()).code, "ELEVENLABS_NOT_CONFIGURED");
const missingProfileRealtime = await worker.fetch(new Request("https://example.test/api/realtime-token", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), { ELEVENLABS_API_KEY: "eleven-secret-test-key" }, {});
assert.equal(missingProfileRealtime.status, 400);
assert.equal((await missingProfileRealtime.json()).code, "PROFILE_REQUIRED");

const originalFetch = globalThis.fetch;
let deepSeekShouldFail = false;
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
    assert.equal(configuration.name, "Jack American Mode Bilingual v2 — american");
    assert.equal(configuration.conversation_config.agent.prompt.llm, "claude-haiku-4-5");
    assert.equal(configuration.conversation_config.agent.prompt.max_tokens, 200);
    assert.equal(configuration.conversation_config.turn.turn_timeout, 4);
    assert.equal(configuration.conversation_config.turn.turn_eagerness, "eager");
    assert.equal(configuration.conversation_config.turn.speculative_turn, true);
    assert.match(configuration.conversation_config.agent.prompt.prompt, /\{\{topic_memory\}\}/);
    assert.match(configuration.conversation_config.agent.prompt.prompt, /both Japanese and natural contemporary American English/);
    assert.deepEqual(configuration.conversation_config.language_presets, {
      ja: { overrides: { agent: { first_message: "やあ。今日は何について話そうか？ 英語でも日本語でも大丈夫だよ。" } } }
    });
    assert.equal(configuration.conversation_config.agent.prompt.built_in_tools.language_detection.params.system_tool_type, "language_detection");
    assert.equal(configuration.conversation_config.tts.voice_id, "voice-american");
    assert.equal(configuration.conversation_config.tts.model_id, "eleven_flash_v2_5");
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
  if (String(_url) === "https://api.deepseek.com/chat/completions") {
    if (deepSeekShouldFail) return new Response(JSON.stringify({ error: "temporary failure" }), { status: 503, headers: { "content-type": "application/json" } });
    const request = JSON.parse(options.body);
    assert.equal(request.model, "deepseek-flash");
    assert.deepEqual(request.response_format, { type: "json_object" });
    assert.deepEqual(request.thinking, { type: "disabled" });
    const supplied = JSON.parse(request.messages[1].content);
    assert.equal(supplied.learner_transcript, "My original answer stays here.");
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      praise: "Clear point.",
      correction: "Use a tighter verb.",
      local_version: "My original answer still lives here, just cleaner.",
      why: "It preserves the meaning while improving the rhythm.",
      spoken_feedback: "Yeah, your point was clear. Tighten the verb, then use this version."
    }) } }] }), { status: 200, headers: { "content-type": "application/json" } });
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
}), { DEEPSEEK_API_KEY: "deepseek-secret-test-key", ANTHROPIC_API_KEY: "secret-test-key" }, {});
assert.equal(coached.status, 200);
const coachedBody = await coached.json();
assert.equal(coachedBody.local_version, "My original answer still lives here, just cleaner.");
assert.match(coachedBody.spoken_feedback, /your point was clear/i);
assert.equal(coachedBody.provider, "deepseek");
deepSeekShouldFail = true;
const fallbackCoached = await worker.fetch(new Request("https://example.test/api/coach", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ transcript: "My original answer stays here.", mode: "personal_review", context: {} })
}), { DEEPSEEK_API_KEY: "deepseek-secret-test-key", ANTHROPIC_API_KEY: "secret-test-key" }, {});
assert.equal(fallbackCoached.status, 200);
assert.equal((await fallbackCoached.json()).provider, "claude-fallback");
deepSeekShouldFail = false;

const voiceHealth = await worker.fetch(new Request("https://example.test/api/health"), {
  ANTHROPIC_API_KEY: "secret-test-key",
  DEEPSEEK_API_KEY: "deepseek-secret-test-key",
  ELEVENLABS_API_KEY: "eleven-secret-test-key"
}, {});
assert.deepEqual(await voiceHealth.json(), { configured: true, coachProvider: "DeepSeek", deepSeekConfigured: true, claudeConfigured: true, voiceConfigured: true });
const spoken = await worker.fetch(new Request("https://example.test/api/speech", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ text: "That sounds much more natural." })
}), { ELEVENLABS_API_KEY: "eleven-secret-test-key" }, {});
assert.equal(spoken.status, 200);
assert.equal(spoken.headers.get("content-type"), "audio/mpeg");
const realtime = await worker.fetch(new Request("https://example.test/api/realtime-token", { method: "POST", headers: { "content-type": "application/json", "x-jack-profile-id": profileA }, body: JSON.stringify({ topic: "work", transport: "websocket" }) }), {
  ELEVENLABS_API_KEY: "eleven-secret-test-key"
}, {});
assert.equal(realtime.status, 200);
assert.deepEqual(await realtime.json(), { signedUrl: "wss://api.elevenlabs.io/test-signed-session", token: null, conversationId: null, topic: "work", label: "Work", memoryText: "No earlier memory exists for this topic.", hasMemory: false, setupNotice: "Created the Jack realtime agent with preferred bilingual settings.", agentSource: "created" });

globalThis.fetch = async url => {
  if (String(url).includes("/v1/convai/agents/missing-agent")) return new Response(JSON.stringify({ detail: { message: "Agent not found" } }), { status: 404, headers: { "content-type": "application/json" } });
  throw new Error("Unexpected request in invalid-agent test: " + url);
};
const invalidAgent = await worker.fetch(new Request("https://example.test/api/realtime-token", { method: "POST", headers: { "content-type": "application/json", "x-jack-profile-id": profileA }, body: JSON.stringify({ topic: "work", transport: "websocket" }) }), {
  ELEVENLABS_API_KEY: "eleven-secret-test-key", ELEVENLABS_AGENT_ID: "missing-agent"
}, {});
assert.equal(invalidAgent.status, 502);
const invalidAgentBody = await invalidAgent.json();
assert.equal(invalidAgentBody.code, "ELEVENLABS_AGENT_ID_INVALID");
assert.equal(invalidAgentBody.providerStatus, 404);

globalThis.fetch = async url => {
  if (String(url).includes("/v1/convai/agents/forbidden-agent")) return new Response(JSON.stringify({ detail: { message: "Missing agents_read permission" } }), { status: 403, headers: { "content-type": "application/json" } });
  throw new Error("Unexpected request in permission test: " + url);
};
const forbiddenAgent = await worker.fetch(new Request("https://example.test/api/realtime-token", { method: "POST", headers: { "content-type": "application/json", "x-jack-profile-id": profileA }, body: JSON.stringify({ topic: "work", transport: "websocket" }) }), {
  ELEVENLABS_API_KEY: "eleven-secret-test-key", ELEVENLABS_AGENT_ID: "forbidden-agent"
}, {});
assert.equal(forbiddenAgent.status, 502);
const forbiddenBody = await forbiddenAgent.json();
assert.equal(forbiddenBody.code, "ELEVENLABS_PERMISSION_DENIED");
assert.equal(forbiddenBody.providerStatus, 403);
assert.match(forbiddenBody.providerMessage, /agents_read/);

globalThis.fetch = async url => {
  if (String(url).includes("/v1/convai/agents/configured-agent")) return new Response(JSON.stringify({ agent_id: "configured-agent" }), { status: 200, headers: { "content-type": "application/json" } });
  if (String(url).includes("/conversation/get-signed-url")) return new Response(JSON.stringify({ detail: { message: "Creator plan minutes exhausted" } }), { status: 429, headers: { "content-type": "application/json" } });
  throw new Error("Unexpected request in signed-url test: " + url);
};
const exhaustedMinutes = await worker.fetch(new Request("https://example.test/api/realtime-token", { method: "POST", headers: { "content-type": "application/json", "x-jack-profile-id": profileA }, body: JSON.stringify({ topic: "work", transport: "websocket" }) }), {
  ELEVENLABS_API_KEY: "eleven-secret-test-key", ELEVENLABS_AGENT_ID: "configured-agent"
}, {});
assert.equal(exhaustedMinutes.status, 503);
const exhaustedBody = await exhaustedMinutes.json();
assert.equal(exhaustedBody.code, "ELEVENLABS_SIGNED_URL_FAILED");
assert.equal(exhaustedBody.providerStatus, 429);
assert.match(exhaustedBody.providerMessage, /minutes exhausted/);

const fallbackWorker = (await import("../worker/index.js?fallback-test")).default;
let createAttempts = 0;
globalThis.fetch = async (url, options = {}) => {
  if (String(url).includes("/v1/convai/agents?")) return new Response(JSON.stringify({ agents: [] }), { status: 200, headers: { "content-type": "application/json" } });
  if (String(url).endsWith("/v1/convai/agents/create")) {
    createAttempts += 1;
    const configuration = JSON.parse(options.body);
    if (createAttempts === 1) {
      assert.equal(configuration.conversation_config.tts.model_id, "eleven_flash_v2_5");
      return new Response(JSON.stringify({ detail: { message: "Unsupported audio output format pcm_48000" } }), { status: 422, headers: { "content-type": "application/json" } });
    }
    assert.equal(configuration.name, "Jack American Mode Safe — voice-id");
    assert.deepEqual(configuration.conversation_config.tts, { voice_id: "fixed-voice-id" });
    return new Response(JSON.stringify({ agent_id: "safe-agent" }), { status: 200, headers: { "content-type": "application/json" } });
  }
  if (String(url).includes("/conversation/get-signed-url")) return new Response(JSON.stringify({ signed_url: "wss://api.elevenlabs.io/safe-session" }), { status: 200, headers: { "content-type": "application/json" } });
  throw new Error("Unexpected request in safe-fallback test: " + url);
};
const safeFallback = await fallbackWorker.fetch(new Request("https://example.test/api/realtime-token", { method: "POST", headers: { "content-type": "application/json", "x-jack-profile-id": profileA }, body: JSON.stringify({ topic: "work", transport: "websocket" }) }), {
  ELEVENLABS_API_KEY: "eleven-secret-test-key", ELEVENLABS_VOICE_ID: "fixed-voice-id"
}, {});
assert.equal(safeFallback.status, 200);
const safeFallbackBody = await safeFallback.json();
assert.equal(safeFallbackBody.agentSource, "safe");
assert.match(safeFallbackBody.setupNotice, /Safe defaults were used/);
assert.equal(createAttempts, 2);

const savedMemoryRows = new Map();
const memoryDb = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async first() { return savedMemoryRows.get(values[0] + ":" + values[1]) || null; },
          async run() {
            assert.match(sql, /INSERT INTO profile_topic_memories/);
            const key = values[0] + ":" + values[1];
            const previous = savedMemoryRows.get(key);
            savedMemoryRows.set(key, { memory_json: values[3], session_count: (previous?.session_count || 0) + 1, updated_at: values[6] });
            return { success: true };
          }
        };
      }
    };
  }
};
globalThis.fetch = async (_url, options = {}) => {
  assert.equal(String(_url), "https://api.deepseek.com/chat/completions");
  assert.equal(options.headers.authorization, "Bearer deepseek-secret-test-key");
  const request = JSON.parse(options.body);
  assert.equal(request.model, "deepseek-flash");
  assert.deepEqual(request.response_format, { type: "json_object" });
  assert.deepEqual(request.thinking, { type: "disabled" });
  const supplied = JSON.parse(request.messages[1].content);
  assert.equal(supplied.topic, "Work");
  return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
    summary: `${privateName} discussed a difficult deadline and wants to revisit the outcome.`,
    personal_details: ["Works in accounting"], opinions: [], open_threads: ["How the deadline turned out"],
    english_patterns: ["Compress long explanations"], learned_phrases: ["raise the flag"]
  }) } }] }), { status: 200, headers: { "content-type": "application/json" } });
};
const savedMemory = await worker.fetch(new Request("https://example.test/api/memory", {
  method: "POST", headers: { "content-type": "application/json", "x-jack-profile-id": profileA }, body: JSON.stringify({ topic: "work", turns: [
    { speaker: "Learner", text: "I had a rough deadline at work." }, { speaker: "Jack", text: "How did it turn out?" }
  ] })
}), { DB: memoryDb, DEEPSEEK_API_KEY: "deepseek-secret-test-key" }, {});
assert.equal(savedMemory.status, 200);
const savedMemoryBody = await savedMemory.json();
assert.equal(savedMemoryBody.memory.open_threads[0], "How the deadline turned out");
assert.equal(savedMemoryBody.memory.summary.toLowerCase().includes(privateName.toLowerCase()), false);
assert.match(savedMemoryBody.memory.summary, /the learner discussed/i);
const loadedMemory = await worker.fetch(new Request("https://example.test/api/memory?topic=work", { headers: { "x-jack-profile-id": profileA } }), { DB: memoryDb }, {});
assert.equal(loadedMemory.status, 200);
assert.equal((await loadedMemory.json()).sessionCount, 1);
const isolatedMemory = await worker.fetch(new Request("https://example.test/api/memory?topic=work", { headers: { "x-jack-profile-id": profileB } }), { DB: memoryDb }, {});
assert.equal(isolatedMemory.status, 200);
assert.equal((await isolatedMemory.json()).memory, null);

const customTopics = [];
const topicsDb = {
  prepare(sql) {
    return {
      bind(...values) {
        return {
          async all() { return { results: customTopics.filter(row => row.profile_id === values[0]).reverse() }; },
          async first() {
            if (/lower\(topic_label\)/.test(sql)) return customTopics.find(row => row.profile_id === values[0] && row.topic_label.toLowerCase() === String(values[1]).toLowerCase()) || null;
            if (/FROM profile_conversation_topics/.test(sql)) return customTopics.find(row => row.profile_id === values[0] && row.topic_key === values[1]) || null;
            return null;
          },
          async run() {
            assert.match(sql, /INSERT INTO profile_conversation_topics/);
            customTopics.push({ profile_id: values[0], topic_key: values[1], topic_label: values[2], created_at: values[3] });
            return { success: true };
          }
        };
      }
    };
  }
};
const createdTopic = await worker.fetch(new Request("https://example.test/api/topics", {
  method: "POST", headers: { "content-type": "application/json", "x-jack-profile-id": profileA }, body: JSON.stringify({ label: "Tesla" })
}), { DB: topicsDb }, {});
assert.equal(createdTopic.status, 201);
const createdTopicBody = await createdTopic.json();
assert.match(createdTopicBody.topic.key, /^custom-tesla-/);
const listedTopics = await worker.fetch(new Request("https://example.test/api/topics", { headers: { "x-jack-profile-id": profileA } }), { DB: topicsDb }, {});
assert.deepEqual((await listedTopics.json()).topics[0].label, "Tesla");
const isolatedTopics = await worker.fetch(new Request("https://example.test/api/topics", { headers: { "x-jack-profile-id": profileB } }), { DB: topicsDb }, {});
assert.deepEqual((await isolatedTopics.json()).topics, []);
globalThis.fetch = originalFetch;
console.log("Worker smoke test passed");
