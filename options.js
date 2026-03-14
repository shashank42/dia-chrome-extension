const PROVIDER_DEFAULTS = {
  openai:  { baseUrl: "https://api.openai.com",  model: "gpt-4o-mini", needsKey: true },
  gemini:  { baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", model: "gemini-3-flash-preview", needsKey: true },
  ollama:  { baseUrl: "http://localhost:11434",   model: "llama3",      needsKey: false },
  custom:  { baseUrl: "",                         model: "",            needsKey: true }
};

const form = document.getElementById("settings-form");
const providerEl = document.getElementById("provider");
const apiKeyEl = document.getElementById("apiKey");
const baseUrlEl = document.getElementById("baseUrl");
const modelEl = document.getElementById("model");
const systemPromptEl = document.getElementById("systemPrompt");
const apikeyField = document.getElementById("apikey-field");
const statusEl = document.getElementById("status");

const DEFAULT_SYSTEM_PROMPT = "You are Dia, a helpful reading assistant. The user highlights text on web pages and asks you questions about it. Be concise, accurate, and helpful. If the user provides highlighted text as context, reference it directly in your answers.";

providerEl.addEventListener("change", () => {
  const defaults = PROVIDER_DEFAULTS[providerEl.value];
  baseUrlEl.value = defaults.baseUrl;
  modelEl.value = defaults.model;
  apikeyField.style.display = defaults.needsKey ? "" : "none";
});

chrome.storage.sync.get({
  provider: "gemini",
  apiKey: "",
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  model: "gemini-3-flash-preview",
  systemPrompt: DEFAULT_SYSTEM_PROMPT
}, (items) => {
  providerEl.value = items.provider;
  apiKeyEl.value = items.apiKey;
  baseUrlEl.value = items.baseUrl;
  modelEl.value = items.model;
  systemPromptEl.value = items.systemPrompt;
  apikeyField.style.display = PROVIDER_DEFAULTS[items.provider]?.needsKey !== false ? "" : "none";
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  chrome.storage.sync.set({
    provider: providerEl.value,
    apiKey: apiKeyEl.value,
    baseUrl: baseUrlEl.value,
    model: modelEl.value,
    systemPrompt: systemPromptEl.value
  }, () => {
    statusEl.textContent = "Saved!";
    statusEl.classList.add("visible");
    setTimeout(() => statusEl.classList.remove("visible"), 2000);
  });
});
