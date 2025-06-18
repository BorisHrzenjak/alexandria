# Playground Feature Implementation Plan

## Overview
Add a new "Playground" menu item that allows users to create and optimize prompts for specific AI models and use cases, leveraging the existing OpenRouter API integration.

## Phase 1: UI Structure & Navigation (2-3 hours)

### 1.1 Menu Integration
- Add "Playground" menu item to sidebar between "All Prompts" and Settings section
- Add playground icon (workshop/lab-style SVG)
- Update menu navigation logic in `popup.js` to handle playground view

### 1.2 Main Playground Interface
- Create new content view in `popup.html` (hidden by default)
- Design form-based UI with sections for:
  - **Purpose Selection**: Dropdown with use cases (Image Generation, Text Generation, Code Generation, etc.)
  - **Model Selection**: Dropdown with popular models (ChatGPT, Claude, Gemini, Flux, SDXL, etc.)
  - **Input Prompt**: Large textarea for user's initial prompt
  - **Optimized Output**: Display area for AI-enhanced prompt
  - **Action Buttons**: Optimize, Save, Copy, Download

## Phase 2: Model-Specific Optimization Logic (3-4 hours)

### 2.1 Enhanced AI Integration
- Extend `openrouter-api.js` with new function `optimizePromptForModel()`
- Create model-specific system prompts for different AI models:
  - **Text Models**: ChatGPT, Claude, Gemini (focus on clarity, context, instructions)
  - **Image Models**: Flux, SDXL, SD 1.5, Ideogram (focus on visual descriptors, style tokens)
  - **Code Models**: GitHub Copilot style (focus on specificity, examples, constraints)

### 2.2 Purpose-Based Templates
- Create starter templates for common use cases:
  - Creative Writing, Technical Documentation, Code Generation
  - Image Prompts, Logo Design, Photo Editing
  - Data Analysis, Problem Solving, etc.

## Phase 3: Core Functionality (4-5 hours)

### 3.1 Prompt Optimization Engine
- Build form handling for purpose + model selection
- Implement AI optimization with model-specific system prompts
- Add loading states and error handling
- Support for multiple optimization iterations

### 3.2 Integration with Existing Systems
- Hook into existing prompt storage system (`getPrompts`, `savePrompts`)
- Add "playground" source tag to saved prompts
- Integrate with existing copy-to-clipboard functionality
- Leverage existing modal/panel patterns for consistency

## Phase 4: Export & Advanced Features (2-3 hours)

### 4.1 Export Options
- Copy to clipboard (existing functionality)
- Download as .txt file
- Download as .md file with metadata (model, purpose, original prompt)

### 4.2 Refinement Tools
- "Try Again" button for re-optimization
- Comparison view (original vs optimized)
- Quick model switching without re-entering prompt

## Phase 5: Styling & Polish (2-3 hours)

### 5.1 UI/UX Enhancement
- Consistent styling with existing design system
- Dark/light theme support
- Responsive layout within 800px width constraint
- Loading animations and feedback

### 5.2 Accessibility & Validation
- Form validation and user feedback
- Keyboard navigation support
- Screen reader compatibility

## Technical Implementation Details

### New Files Needed:
- **No new files** - extend existing `popup.html`, `popup.js`, `styles.css`, `openrouter-api.js`

### Key Functions to Add:
```javascript
// In openrouter-api.js
optimizePromptForModel(prompt, modelType, purpose)
getModelSpecificSystemPrompt(modelType, purpose)

// In popup.js  
showPlaygroundView()
handlePlaygroundOptimization()
handlePlaygroundSave()
handlePlaygroundExport()
```

### Model Categories to Support:
1. **Text Generation**: ChatGPT, Claude, Gemini, DeepSeek
2. **Image Generation**: Flux, SDXL, SD 1.5, Ideogram, DALL-E
3. **Code Generation**: GitHub Copilot, CodeT5, StarCoder
4. **Specialized**: GPT-4V (vision), Whisper (audio), etc.

## Risk Mitigation:
- **API Costs**: Use existing DeepSeek free tier, add usage warnings
- **UI Complexity**: Leverage existing modal/form patterns
- **Performance**: Implement proper loading states and error handling
- **Storage**: Use existing Chrome storage with new "playground" metadata

## Success Metrics:
- Users can optimize prompts for 8+ popular AI models
- Seamless integration with existing prompt library
- Export functionality works reliably
- Maintains performance and UX standards of existing app

**Total Estimated Time: 13-18 hours over 3-4 days**