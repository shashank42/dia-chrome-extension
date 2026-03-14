How difficult is a project where I need to add a persistent window inside a chrome tab which is basically a chat window with any popular llm where I can highlight any text I can ask questions about the highlighted text. Atttached picture. Might have to fork chrome.




While your attached image shows a highly integrated and custom-built interface (likely not just an extension, but a deeply integrated feature), you can achieve a very similar and robust feature without the extreme difficulty of forking Chrome. The visual in your attachment already *looks* like a split panel, which is precisely how a persistent window would be implemented for this.

Your proposal to highlight text and have it interact with an LLM in a persistent side panel is a moderate-to-high difficulty project, depending on your familiarity with the modern Chrome Extension API.

I have created a diagram that compares two development paths for your idea: your proposed path (forking Chrome) and the *recommended, manageable path* (creating a Side Panel extension).

### Visual Guide: A Stable Architecture for Your Chat Project

Here is a diagram that explains the efficient way to build this feature, using the browser's native capabilities instead of modifying its core. The diagram details how the `Chrome Extension Side Panel API` enables this integration, making the task significantly easier than what you are currently picturing.

### Breaking Down the Development Difficulty

Your project has two main parts: the UI (the persistent side panel) and the LLM integration (the data flow). Let's evaluate the difficulty of your two options.

#### 1. Forking Chrome (Your Initial Idea)

* **Difficulty:** Extremely High (10/10)
* **Analysis:** This is almost always the wrong approach for general feature requests. Google Chrome has millions of lines of code. Making a change that allows you to register a persistent *internal* panel that doesn't conflict with other browser processes is a massive undertaking. You would then have to maintain your own separate browser build forever, or your feature would only work on a unique version of Chrome that no one else has.
* **Result:** A massive, unmaintainable engineering effort for a feature that is already achievable through an API. This is what you see depicted as the "Browser Fork (High Complexity)" path in the diagram's comparison table.

#### 2. The Recommended Path: The Chrome Extension Side Panel API

* **Difficulty:** Moderate (5-6/10 for a new dev, 3-4/10 for an experienced one)
* **Analysis:** This is the correct tool for your requirement. The architecture in the diagram is what you would build. It has three main components:

| Component | Responsibility (Match to Diagram) | Implementation |
| --- | --- | --- |
| **Side Panel (UI)** | `Side Panel Script (Manages the panel)` | Use the standard `chrome.sidePanel` API. This gives you a native, split-screen UI that is persistent across navigation (just like you want). |
| **Highlighter (Integration)** | `Content Script (Injects highlighting UI)` | A small piece of code injected into webpages detects user text selection. When text is highlighted, your extension captures it. |
| **LLM Connector (Logic)** | `Side Panel Script` + `LLM API INTEGRATION` | Your side panel script makes the API call (as shown by the arrows to OpenAI/Google/etc.) using the captured text and displays the response. |

### Summary on Project Difficulty

Creating a feature like this is a standard use-case for modern browser APIs. It is a fantastic intermediate-level project. You get to work with native UI panels, page interactions, and asynchronous API calls to powerful LLMs.

Do not fork Chrome. The path to your desired feature is a well-lit road. If you proceed with this plan, you will gain deep knowledge of:

1. Managing a persistent `chrome.sidePanel`.
2. Data communication between a `content script` (the web page) and your `side panel script`.
3. Securely making asynchronous `fetch` calls to an LLM provider's API.