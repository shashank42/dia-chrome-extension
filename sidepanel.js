const chatArea = document.getElementById("chat-area");
const chatInput = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const clearBtn = document.getElementById("clear-btn");
const settingsBtn = document.getElementById("settings-btn");
const contextChip = document.getElementById("context-chip");
const contextText = document.getElementById("context-text");
const contextDismiss = document.getElementById("context-dismiss");
const welcome = document.getElementById("welcome");

let currentContext = null;
let conversationHistory = [];
let isStreaming = false;

const DEFAULT_SETTINGS = {
  provider: "gemini",
  apiKey: "",
  baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  model: "gemini-3-flash-preview",
  systemPrompt: "You are Dia, a helpful reading assistant. The user highlights text on web pages and asks you questions about it. Be concise, accurate, and helpful. If the user provides highlighted text as context, reference it directly in your answers."
};

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, resolve);
  });
}

// --- Markdown rendering ---

if (typeof marked !== "undefined") {
  marked.setOptions({ breaks: true, gfm: true });
}

function renderMarkdown(text) {
  if (typeof marked !== "undefined") {
    return marked.parse(text);
  }
  return text.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
}

// --- Chat UI ---

function removeWelcome() {
  if (welcome) welcome.style.display = "none";
}

function addMessage(role, content, contextSnippet) {
  removeWelcome();
  const div = document.createElement("div");
  div.className = `message ${role}`;

  if (contextSnippet && role === "user") {
    const quote = document.createElement("div");
    quote.className = "quote";
    quote.textContent = contextSnippet.length > 300
      ? contextSnippet.slice(0, 300) + "…"
      : contextSnippet;
    div.appendChild(quote);
  }

  const body = document.createElement("div");
  if (role === "assistant") {
    body.innerHTML = renderMarkdown(content);
  } else {
    body.textContent = content;
  }
  div.appendChild(body);

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

function createStreamingMessage() {
  removeWelcome();
  const div = document.createElement("div");
  div.className = "message assistant";

  const indicator = document.createElement("div");
  indicator.className = "typing-indicator";
  indicator.innerHTML = "<span></span><span></span><span></span>";
  div.appendChild(indicator);

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
  return div;
}

function updateStreamingMessage(div, fullText) {
  div.innerHTML = renderMarkdown(fullText);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function addErrorMessage(text) {
  const div = document.createElement("div");
  div.className = "message error";
  div.textContent = text;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// --- Context bar ---

function showContext(text) {
  currentContext = text;
  contextText.textContent = text;
  contextChip.classList.remove("hidden");
}

function hideContext() {
  currentContext = null;
  contextChip.classList.add("hidden");
}

contextDismiss.addEventListener("click", hideContext);

// --- LLM Streaming ---

async function streamLLM(messages) {
  const settings = await getSettings();

  if (!settings.apiKey && settings.provider !== "ollama") {
    addErrorMessage("No API key configured. Click the gear icon to add one.");
    return;
  }

  let baseUrl = settings.baseUrl.replace(/\/+$/, "");
  const url = `${baseUrl}/v1/chat/completions`;

  const headers = { "Content-Type": "application/json" };
  if (settings.apiKey) {
    headers["Authorization"] = `Bearer ${settings.apiKey}`;
  }

  const body = {
    model: settings.model,
    messages,
    stream: true
  };

  isStreaming = true;
  sendBtn.disabled = true;

  const msgDiv = createStreamingMessage();
  let fullText = "";

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`API error ${resp.status}: ${errText.slice(0, 200)}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") break;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            updateStreamingMessage(msgDiv, fullText);
          }
        } catch (_) {}
      }
    }

    if (!fullText) {
      msgDiv.remove();
      addErrorMessage("No response received from the model.");
    }

    conversationHistory.push({ role: "assistant", content: fullText });
  } catch (err) {
    msgDiv.remove();
    addErrorMessage(err.message);
  } finally {
    isStreaming = false;
    sendBtn.disabled = false;
  }
}

// --- Send message ---

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || isStreaming) return;

  const contextSnippet = currentContext;
  let userContent = text;

  if (contextSnippet) {
    userContent = `[Highlighted text from the page]:\n"${contextSnippet}"\n\n${text}`;
  }

  addMessage("user", text, contextSnippet);
  chatInput.value = "";
  autoResize();
  hideContext();

  conversationHistory.push({ role: "user", content: userContent });

  const settings = await getSettings();
  const messages = [
    { role: "system", content: settings.systemPrompt || DEFAULT_SETTINGS.systemPrompt },
    ...conversationHistory
  ];

  await streamLLM(messages);
}

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// --- Auto-resize textarea ---

function autoResize() {
  chatInput.style.height = "auto";
  chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + "px";
}

chatInput.addEventListener("input", autoResize);

// --- Clear conversation ---

clearBtn.addEventListener("click", () => {
  conversationHistory = [];
  currentContext = null;
  contextChip.classList.add("hidden");
  chatArea.innerHTML = "";
  if (welcome) {
    welcome.style.display = "";
    chatArea.appendChild(welcome);
  }
});

// --- Settings ---

settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

// --- Receive messages from content script ---

chrome.runtime.onMessage.addListener((message) => {
  if (!message.relayed) return;

  if (message.type === "TEXT_SELECTED" && message.text) {
    showContext(message.text);
    chatInput.value = "";
    autoResize();
    return;
  }

  if (message.type === "INPUT_CHAR" && message.char) {
    chatInput.value += message.char;
    autoResize();
    return;
  }

  if (message.type === "INPUT_BACKSPACE") {
    chatInput.value = chatInput.value.slice(0, -1);
    autoResize();
    return;
  }

  if (message.type === "INPUT_SUBMIT") {
    sendMessage();
    return;
  }

  if (message.type === "CAPTURE_END") {
    return;
  }
});
