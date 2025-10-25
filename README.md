# Alexandria Chrome Extension

A personal AI prompt management tool that helps you organize, categorize, and quickly access your frequently used prompts.

![image](https://github.com/user-attachments/assets/22b57b01-1cdb-4ef1-9422-6fe01a8c70bb)



## Features

- **Prompt Management**: Save, edit, and delete your AI prompts
- **Categories**: Organize prompts into customizable categories
- **Favorites**: Mark frequently used prompts as favorites
- **Dark Mode**: Toggle between light and dark themes
- **Quick Copy**: Click any prompt to copy its text to clipboard
- **Search & Filter**: Find prompts by text, tags, or category
- **Hover Preview**: Hover over prompts to view full content
- **Import/Export**: Transfer all prompts as JSON files
- **OpenRouter API Integration**: Connect to OpenRouter API for access to various AI models
- **Markdown Support**: Write and view prompts with Markdown formatting
- **Chat History**: Save and review your conversation history with AI models
- **Template Variables**: Create dynamic prompts with customizable variables
- **Bulk Operations**: Perform actions on multiple prompts simultaneously
- **Cloud Sync**: Synchronize your prompts across devices
- **Custom Shortcuts**: Configure keyboard shortcuts for common actions
- **Analytics Dashboard**: Track prompt usage and performance metrics

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon to open Alexandria
2. Use the "New Prompt" button to add new prompts
3. Click any prompt to copy its text to clipboard
4. Use the star (⭐) button to favorite prompts
5. Filter prompts using the search box and category dropdown
6. Export/Import prompts via the Settings menu for backup or transfer

## Development

This extension uses:
- Chrome's Storage API for data persistence
- Vanilla JavaScript for functionality, including:
  - `openrouter-api.js` for OpenRouter API communication
  - `markdown-parser.js` for Markdown rendering
- CSS variables for theming
- JSON import/export for data portability

To contribute:
1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

MIT
