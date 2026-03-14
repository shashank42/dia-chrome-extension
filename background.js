chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "ask-dia",
    title: "Ask Dia about \"%s\"",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "ask-dia") {
    chrome.sidePanel.open({ tabId: tab.id }).then(() => {
      setTimeout(() => {
        chrome.runtime.sendMessage({
          type: "TEXT_SELECTED",
          text: info.selectionText,
          pageUrl: tab.url,
          pageTitle: tab.title
        });
      }, 300);
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab) return;

  if (message.type === "TEXT_SELECTED") {
    message.pageUrl = sender.tab.url;
    message.pageTitle = sender.tab.title;
    chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => {
      chrome.runtime.sendMessage({ ...message, relayed: true });
    });
    return;
  }

  if (
    message.type === "INPUT_CHAR" ||
    message.type === "INPUT_BACKSPACE" ||
    message.type === "INPUT_SUBMIT" ||
    message.type === "CAPTURE_END"
  ) {
    chrome.runtime.sendMessage({ ...message, relayed: true });
  }
});
