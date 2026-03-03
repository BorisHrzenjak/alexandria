# Alexandria - Feature Upgrades

### 1. Context-Aware Injector (Inline Auto-Complete)
Instead of requiring users to open the extension popup every time, allow them to type a shortcut trigger (e.g., `/prompt:`) directly into any text box on the web (like ChatGPT, Claude, or an email draft). A lightweight overlay would appear, allowing them to instantly search and inject the prompt without breaking their workflow.

### 2. Dynamic Web Context Variables
Expand the variable system to include built-in macro variables like `{selected_text}`, `{current_url}`, or `{page_content}`. When a prompt is triggered, the extension automatically grabs the highlighted text or the contents of the active browser tab and passes it into the prompt. This is incredibly useful for instantly summarizing or refactoring text from a web page.

### 3. Prompt Chaining & Workflows
Allow users to link individual prompts into a sequence to create mini-pipelines. For example, a "Blog Post Creator" workflow could consist of three chained prompts: *Prompt 1 (Generate Outline)* -> *Prompt 2 (Draft Content based on Outline)* -> *Prompt 3 (Review and Polish)*. This elevates the app from a simple storage locker to a productivity engine.

### 4. Cloud Sync & Backup
Currently, prompts seem to rely on local storage and manual import/export. Adding automatic cloud synchronization (via Google Drive, GitHub Gists, or a lightweight custom backend) would ensure that power users have seamless access to their curated libraries across their desktop, laptop, and work machines without manual effort.

### 5. Version History for Prompts
Prompt engineering is highly iterative. If a user tweaks a prompt and it suddenly performs worse, they need a way to go back. Adding simple version control (saving the state of a prompt every time it gets edited or "Enhanced with AI") allows users to experiment safely and revert to previous iterations that yielded better LLM outputs.

### 6. A/B Testing & Evaluation
Allow users to create variants of a single prompt (Variant A vs. Variant B). By associating a simple thumbs-up/thumbs-down metric with these variants after they are used, the dashboard could actually tell the user mathematically which prompt framing yields the best results with their target models.

### 7. Community Prompts / Shared Workspaces
Introduce a "Discover" tab where users can browse, preview, and instantly import highly-rated prompts from a curated public directory. Alternatively, add "Team Workspaces" so teams can share a unified repository of brand-aligned prompts. 

### 8. Keyboard-First Navigation Commands (Command Palette)
Power users hate taking their hands off the keyboard. Implementing a global shortcut (like `Cmd/Ctrl + Shift + P`) that opens a Spotlight-like universal search bar would allow users to instantly find a prompt, fill its variables, and copy it—all in a few keystrokes.
