# Alexandria Chrome Extension - Agent Guidelines

## Project Overview
Alexandria is a Chrome Extension for managing AI prompts. Built with vanilla JavaScript (ES6+), Chrome Storage API, and CSS variables for theming. No build tools, bundlers, or package managers.

## Build/Test/Lint Commands
No automated tooling. Manual development workflow:
- **Load extension**: `chrome://extensions/` → Developer mode → Load unpacked → Select project directory
- **Reload after changes**: Click refresh icon on extension card in `chrome://extensions/`
- **Debug**: Right-click extension popup → Inspect → Console/Network tabs

## Data Schema

### Prompt Object
```javascript
{
    id: "1704067200000",           // Date.now().toString()
    title: "Prompt Title",         // Required string
    text: "Prompt content...",     // Required string
    category: "Coding",            // Optional string
    tags: ["ai", "productivity"],  // Array of strings
    favorite: false,               // Boolean
    createdAt: "2024-01-01T00:00:00.000Z",  // ISO string
    updatedAt: "2024-01-01T00:00:00.000Z"   // ISO string
}
```

## Code Style Guidelines

### JavaScript
- **Language**: ES6+ vanilla JavaScript, no frameworks
- **File Extensions**: `.js` files loaded via `<script>` tags in HTML
- **Variable Declaration**: `const` for non-reassigning, `let` for reassigning, never `var`
- **Functions**: Arrow functions: `const funcName = () => {}`
- **Async**: Use async/await for Chrome Storage API and fetch operations
- **Comments**: JSDoc for public APIs (see markdown-parser.js), inline comments for complex logic
- **DOM Access**: Cache elements at file top; use `document.getElementById()` for single, `querySelectorAll()` for multiple

### Module Pattern
Scripts expose APIs via `window` object:
```javascript
window.openRouterApi = {
    enhancePrompt,
    getApiKey,
    saveApiKey,
    hasApiKey
};
```

### Chrome Storage Patterns
```javascript
const getPrompts = (callback) => {
    chrome.storage.local.get({ prompts: [] }, (result) => {
        allPrompts = result.prompts.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        callback(allPrompts);
    });
};

const savePrompts = (prompts, callback) => {
    chrome.storage.local.set({ prompts: prompts }, () => {
        if (callback) callback();
    });
};
```

### HTML
- **Semantic Elements**: Use HTML5 semantic elements
- **IDs**: kebab-case: `prompt-list`, `add-prompt-modal`, `playground-input`
- **Classes**: Component-based: `.prompt-item`, `.prompt-item-title`, `.sidebar-header`
- **Accessibility**: Include ARIA attributes for interactive elements

### CSS
- **Variables**: Define in `:root` with `-light`/`-dark` suffixes
- **Theming**: Apply via CSS variables, toggle dark mode with `body.dark-mode`
- **Selectors**: Prefer class selectors over tag selectors
- **Layout**: Flexbox for components, CSS Grid for page layout

```css
:root {
    --accent-light: #6366f1;
    --accent-dark: #8b5cf6;
}
body { --accent-color: var(--accent-light); }
body.dark-mode { --accent-color: var(--accent-dark); }
```

### Naming Conventions
- **Variables/Functions**: camelCase: `currentPrompt`, `filterAndRenderPrompts`
- **Constants**: UPPER_SNAKE_CASE: `API_ENDPOINT`
- **IDs/Classes**: kebab-case: `prompt-tags`, `playground-btn`
- **Files**: kebab-case: `popup.js`, `markdown-parser.js`, `openrouter-api.js`

### Error Handling
```javascript
try {
    const data = JSON.parse(responseText);
    if (!data.choices) throw new Error('Invalid API response format');
} catch (e) {
    console.error('Failed to parse response:', e);
    alert('User-friendly error message');
}
```

### Event Handling
- Attach listeners after `DOMContentLoaded`
- Use event delegation for dynamic elements
- Call `e.stopPropagation()` to prevent bubbling

```javascript
promptListUl.addEventListener('click', (e) => {
    if (e.target.matches('.delete-btn')) {
        e.stopPropagation();
        deletePrompt(promptId);
    }
});
```

## File Structure
```
alexandria/
├── manifest.json          # Chrome extension manifest (v3)
├── popup.html             # Main UI structure
├── popup.js               # Main application logic (~1500 lines)
├── styles.css             # All styling with theme variables
├── openrouter-api.js      # OpenRouter API integration
├── markdown-parser.js     # Custom markdown parser utility
├── icons/                 # Extension icons (16, 48, 128px)
└── spec/                  # Implementation plans and documentation
```

## Key Features & Patterns

### Autocomplete (Tags Input)
- Debounced input handling (150ms)
- Keyboard navigation (ArrowUp/Down, Enter, Escape)
- Focus management with visual states

### OpenRouter API Integration
- API key stored in Chrome Storage (never hardcoded)
- Model: `google/gemini-2.5-flash`
- Functions: `enhancePrompt()`, `optimizePromptForModel()`

### Import/Export
- Export: JSON download with timestamped filename
- Import: File validation, merge or replace strategy

### Panel View
- Markdown rendering via `markdownParser.parse()`
- Enhancement state tracking with `isPromptEnhanced` flag
- Keep/Save workflow for enhanced prompts

## Common Tasks

**Add a new feature:**
1. Add DOM elements to popup.html (kebab-case IDs)
2. Cache DOM references at top of popup.js
3. Implement logic following existing patterns
4. Add styles in styles.css using theme variables

**Modify storage data:**
1. Update schema documentation above
2. Handle migration in `getPrompts()` if needed
3. Ensure timestamps are ISO strings

**Add new API endpoint:**
1. Add function to openrouter-api.js
2. Expose via `window.openRouterApi`
3. Check `hasApiKey()` before API calls
4. Handle loading states in UI

## Security
- Never hardcode API keys
- Escape HTML before DOM insertion (use `escapeHtml()` utility)
- Use HTTPS for all external requests
- Validate imported JSON structure before processing
