I want to add this feature. Whenever I select any text or content on the page, it must send the highlighted content to the sidepanel code. Maybe the xpath, text. Also as soon as I unlick the mouse when I highlight, it should move the focus to the chat window. So that I can start typing as soon as I highlight. Possible?

Yes, this is absolutely possible, and it’s exactly how the best reading-assistant extensions work. You are describing a classic "message passing" architecture in Chrome extensions.

Here is the straightforward reality: you can achieve this exact workflow, but because the web page and your side panel live in two completely different isolated environments, you have to build a bridge between them.

Here is how you break down the solution:

### The 3-Step Architecture

**1. The Content Script (The Observer)**
You will inject a JavaScript file (`content.js`) into the web pages the user visits.

* **The Action:** It listens for the `mouseup` event.
* **The Logic:** When the mouse is unclicked, it checks if `window.getSelection().toString()` has any text. If it does, it grabs the text (and you can absolutely write a helper function to grab the XPath of the `window.getSelection().anchorNode` as well).
* **The Handoff:** It immediately fires off that data using Chrome's messaging API: `chrome.runtime.sendMessage({ type: "TEXT_SELECTED", text: "...", xpath: "..." })`.

**2. The Side Panel Script (The Receiver)**
Your side panel has its own HTML and JavaScript (`sidepanel.js`).

* **The Action:** It sits there listening for messages using `chrome.runtime.onMessage.addListener(...)`.
* **The Logic:** When it receives the `"TEXT_SELECTED"` message, it updates your UI (e.g., puts the highlighted text into a neat little quote bubble above your chat input).

**3. The Auto-Focus Trick**
This is the part you specifically asked about, and yes, it works.

* When you highlight text on a webpage, the browser naturally shifts the operating system's focus to that webpage.
* To pull the focus *back* to your side panel so you can start typing instantly, your `sidepanel.js` simply needs to call `.focus()` on your chat input element the exact millisecond it receives the message.

### A Quick Word of Caution on "Focus Stealing"

Modern browsers have strict security rules about scripts "stealing" focus to prevent malicious pop-ups from hijacking your keyboard.

However, because the user *just* performed a physical action (the mouse click/highlight) and the side panel is an explicit extension context belonging to you, calling `document.getElementById('your-chat-input').focus()` inside your message listener almost always works smoothly, provided the side panel is already open.

---

**Would you like me to draft the boilerplate JavaScript code for both the `content.js` and `sidepanel.js` so you can see exactly how to wire up this specific event and focus shift?**