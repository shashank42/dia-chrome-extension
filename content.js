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

let debounceTimer = null;
let captureMode = false;

document.addEventListener("mouseup", () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();
    if (text.length < 2) return;

    let xpath = "";
    try {
      xpath = getXPath(selection.anchorNode);
    } catch (_) {}

    chrome.runtime.sendMessage({
      type: "TEXT_SELECTED",
      text,
      xpath
    });

    captureMode = true;
  }, 150);
});

document.addEventListener("mousedown", () => {
  if (captureMode) {
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
