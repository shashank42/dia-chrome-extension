function getXPath(node) {
  if (!node) return "";
  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentNode;
  }
  const parts = [];
  while (node && node.nodeType === Node.ELEMENT_NODE) {
    let index = 1;
    let sibling = node.previousSibling;
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.nodeName === node.nodeName) {
        index++;
      }
      sibling = sibling.previousSibling;
    }
    parts.unshift(`${node.nodeName.toLowerCase()}[${index}]`);
    node = node.parentNode;
  }
  return "/" + parts.join("/");
}

function isInputLike(el) {
  if (!el || !el.nodeName) return false;
  const tag = el.nodeName.toLowerCase();
  return tag === "input" || tag === "textarea" || !!el.isContentEditable;
}

function isInsideInput(node) {
  if (!node) return false;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
  for (let n = node; n && n !== document.body; ) {
    if (n.nodeType === Node.ELEMENT_NODE && isInputLike(n)) return true;
    const parent = n.parentNode;
    if (parent) {
      n = parent;
    } else if (n.nodeType === Node.DOCUMENT_FRAGMENT_NODE && n.host) {
      n = n.host;
    } else {
      break;
    }
  }
  return false;
}

function selectionIsInInput(selection) {
  if (!selection || selection.rangeCount === 0) return false;
  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  if (isInsideInput(anchor) || isInsideInput(focus)) return true;
  try {
    const common = selection.getRangeAt(0).commonAncestorContainer;
    if (isInsideInput(common)) return true;
  } catch (_) {}
  const active = document.activeElement;
  if (active && isInputLike(active)) {
    if (anchor && active.contains(anchor)) return true;
    if (focus && active.contains(focus)) return true;
  }
  return false;
}

let debounceTimer = null;
let captureMode = false;

document.addEventListener("mouseup", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text.length < 2) return;

    const inInput = selectionIsInInput(selection);

    let xpath = "";
    try {
      xpath = getXPath(selection.anchorNode);
    } catch (_) {}

    chrome.runtime.sendMessage({
      type: "TEXT_SELECTED",
      text,
      xpath
    });

    const focusInInput = isInputLike(document.activeElement);
    if (!inInput && !focusInInput) captureMode = true;
  }, 150);
});

document.addEventListener("mousedown", () => {
  if (captureMode) {
    captureMode = false;
    chrome.runtime.sendMessage({ type: "CAPTURE_END" });
  }
});

document.addEventListener("focusin", (e) => {
  if (captureMode && e.target && isInputLike(e.target)) {
    captureMode = false;
    chrome.runtime.sendMessage({ type: "CAPTURE_END" });
  }
});

document.addEventListener("keydown", (e) => {
  if (!captureMode) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;

  if (e.key === "Escape") {
    captureMode = false;
    chrome.runtime.sendMessage({ type: "CAPTURE_END" });
    return;
  }

  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    captureMode = false;
    chrome.runtime.sendMessage({ type: "INPUT_SUBMIT" });
    return;
  }

  if (e.key === "Backspace") {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: "INPUT_BACKSPACE" });
    return;
  }

  if (e.key.length === 1) {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: "INPUT_CHAR", char: e.key });
  }
}, true);
