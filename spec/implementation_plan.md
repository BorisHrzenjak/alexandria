# Tag Autocomplete Implementation Plan

## Project Overview
This document outlines the implementation plan for adding autocomplete functionality to the tags input field in the Alexandria Prompt Library Chrome extension. The feature will allow users to start typing in the `input#prompt_tags` field and receive real-time suggestions for existing tags, improving user experience and reducing the need to use the dropdown picker.

## Current State Analysis

### Existing Tag Implementation
- **Storage**: Tags are stored as arrays within prompt objects in Chrome's local storage
- **Data Structure**: Each prompt has a `tags: string[]` property
- **UI Components**:
  - `select#existing-tags` - Dropdown for selecting existing tags
  - `input#prompt_tags` - Text input for manual tag entry
- **Functions**:
  - `getAllUniqueTags()` - Returns sorted array of all unique tags
  - `populateDropdowns()` - Populates tag dropdown options
  - Tag selection handler at line 380-398 in `popup.js`

### Current User Flow
1. User opens "Add New Prompt" or "Edit Prompt" modal
2. User can either:
   - Select from existing tags dropdown (which adds to input)
   - Manually type comma-separated tags in input field
3. Tags are parsed and stored when prompt is saved

## Proposed Enhancement

### Feature Requirements
1. **Real-time Suggestions**: As user types in tags input, show matching existing tags
2. **Fuzzy Matching**: Support partial matching (e.g., "dev" matches "development", "devops")
3. **Keyboard Navigation**: Arrow keys to navigate, Enter to select, Escape to close
4. **Mouse Interaction**: Click to select suggestions
5. **Visual Feedback**: Highlight matching text within suggestions
6. **Performance**: Debounced input handling to avoid excessive filtering
7. **Accessibility**: ARIA labels and proper focus management
8. **Responsive**: Works well within modal constraints

## Technical Implementation Plan

### 1. HTML Structure Modifications (`popup.html`)

**Location**: After line 166 (existing tags input container)

```html
<div class="tags-input-container">
    <select id="existing-tags" class="tag-select">
        <option value="">Select existing tags</option>
        <!-- Tags will be populated dynamically -->
    </select>
    <div class="autocomplete-container">
        <input type="text" id="prompt-tags" placeholder="Type new tags (comma-separated)">
        <div id="tags-autocomplete" class="autocomplete-dropdown" role="listbox" aria-hidden="true">
            <!-- Autocomplete suggestions will be inserted here -->
        </div>
    </div>
</div>
```

### 2. CSS Styling (`styles.css`)

**New Styles to Add**:

```css
/* Autocomplete Container */
.autocomplete-container {
    position: relative;
    display: flex;
    flex-direction: column;
}

/* Autocomplete Dropdown */
.autocomplete-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--modal-content-bg);
    border: 1px solid var(--input-border);
    border-top: none;
    border-radius: 0 0 8px 8px;
    box-shadow: var(--shadow);
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    display: none;
}

.autocomplete-dropdown.show {
    display: block;
}

/* Autocomplete Items */
.autocomplete-item {
    padding: 8px 12px;
    cursor: pointer;
    border-bottom: 1px solid var(--border-color);
    transition: background-color 0.2s ease;
}

.autocomplete-item:last-child {
    border-bottom: none;
}

.autocomplete-item:hover,
.autocomplete-item.focused {
    background-color: var(--button-hover-bg);
}

.autocomplete-item.selected {
    background-color: var(--accent-color);
    color: var(--button-primary-text);
}

/* Highlighted text within suggestions */
.autocomplete-item .highlight {
    background-color: var(--accent-color);
    color: var(--button-primary-text);
    padding: 1px 2px;
    border-radius: 2px;
}

/* Dark mode adjustments */
.dark-mode .autocomplete-item .highlight {
    background-color: var(--accent-color);
    color: var(--button-primary-text);
}

/* No results message */
.autocomplete-no-results {
    padding: 8px 12px;
    color: var(--text-secondary);
    font-style: italic;
    text-align: center;
}
```

### 3. JavaScript Implementation (`popup.js`)

#### 3.1 New Variables and State

**Location**: After line 45 (existing state variables)

```javascript
// Autocomplete state
let autocompleteVisible = false;
let autocompleteFocusIndex = -1;
let autocompleteItems = [];
let autocompleteDebounceTimer = null;
```

#### 3.2 Core Autocomplete Functions

**Location**: After line 849 (utility functions section)

```javascript
// --- Autocomplete Functionality ---

/**
 * Debounce function to limit API calls
 */
const debounce = (func, wait) => {
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(autocompleteDebounceTimer);
            func(...args);
        };
        clearTimeout(autocompleteDebounceTimer);
        autocompleteDebounceTimer = setTimeout(later, wait);
    };
};

/**
 * Get autocomplete suggestions based on current input
 */
const getAutocompleteSuggestions = (inputValue) => {
    if (!inputValue || inputValue.length < 1) {
        return [];
    }

    const allTags = getAllUniqueTags();
    const currentTags = getCurrentTags();
    const lastTag = getLastPartialTag(inputValue);

    if (!lastTag) {
        return [];
    }

    // Filter tags that match the partial input and aren't already selected
    return allTags.filter(tag => {
        const matchesInput = tag.toLowerCase().includes(lastTag.toLowerCase());
        const notAlreadySelected = !currentTags.includes(tag);
        return matchesInput && notAlreadySelected;
    }).slice(0, 10); // Limit to 10 suggestions
};

/**
 * Get currently entered tags from input
 */
const getCurrentTags = () => {
    const tagsInput = document.getElementById('prompt-tags');
    return tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
};

/**
 * Get the last partial tag being typed
 */
const getLastPartialTag = (inputValue) => {
    const tags = inputValue.split(',');
    const lastTag = tags[tags.length - 1].trim();
    return lastTag;
};

/**
 * Highlight matching text in suggestion
 */
const highlightMatch = (text, search) => {
    if (!search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
};

/**
 * Render autocomplete suggestions
 */
const renderAutocompleteSuggestions = (suggestions, searchTerm = '') => {
    const dropdown = document.getElementById('tags-autocomplete');
    
    if (!suggestions || suggestions.length === 0) {
        dropdown.innerHTML = '<div class="autocomplete-no-results">No matching tags found</div>';
        return;
    }

    dropdown.innerHTML = suggestions.map((tag, index) => {
        const highlightedText = highlightMatch(tag, searchTerm);
        return `<div class="autocomplete-item" data-index="${index}" data-tag="${tag}" role="option">
                    ${highlightedText}
                </div>`;
    }).join('');

    // Add click listeners to items
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
            selectAutocompleteItem(item.dataset.tag);
        });
    });
};

/**
 * Show autocomplete dropdown
 */
const showAutocomplete = () => {
    const dropdown = document.getElementById('tags-autocomplete');
    dropdown.classList.add('show');
    dropdown.setAttribute('aria-hidden', 'false');
    autocompleteVisible = true;
    autocompleteFocusIndex = -1;
};

/**
 * Hide autocomplete dropdown
 */
const hideAutocomplete = () => {
    const dropdown = document.getElementById('tags-autocomplete');
    dropdown.classList.remove('show');
    dropdown.setAttribute('aria-hidden', 'true');
    autocompleteVisible = false;
    autocompleteFocusIndex = -1;
    clearAutocompleteFocus();
};

/**
 * Handle autocomplete navigation with keyboard
 */
const navigateAutocomplete = (direction) => {
    const items = document.querySelectorAll('#tags-autocomplete .autocomplete-item');
    if (items.length === 0) return;

    // Clear previous focus
    clearAutocompleteFocus();

    // Calculate new index
    if (direction === 'down') {
        autocompleteFocusIndex = Math.min(autocompleteFocusIndex + 1, items.length - 1);
    } else if (direction === 'up') {
        autocompleteFocusIndex = Math.max(autocompleteFocusIndex - 1, -1);
    }

    // Apply focus to new item
    if (autocompleteFocusIndex >= 0) {
        items[autocompleteFocusIndex].classList.add('focused');
    }
};

/**
 * Clear all autocomplete focus states
 */
const clearAutocompleteFocus = () => {
    document.querySelectorAll('#tags-autocomplete .autocomplete-item').forEach(item => {
        item.classList.remove('focused');
    });
};

/**
 * Select an autocomplete item
 */
const selectAutocompleteItem = (selectedTag) => {
    const tagsInput = document.getElementById('prompt-tags');
    const currentValue = tagsInput.value;
    const tags = currentValue.split(',').map(tag => tag.trim());
    
    // Replace the last partial tag with the selected one
    tags[tags.length - 1] = selectedTag;
    
    // Join back and add trailing comma and space for next tag
    tagsInput.value = tags.join(', ') + ', ';
    
    // Hide autocomplete and focus back to input
    hideAutocomplete();
    tagsInput.focus();
    
    // Trigger input event to update autocomplete for next tag
    const event = new Event('input', { bubbles: true });
    tagsInput.dispatchEvent(event);
};

/**
 * Handle autocomplete input with debouncing
 */
const handleAutocompleteInput = debounce((event) => {
    const inputValue = event.target.value;
    const lastTag = getLastPartialTag(inputValue);
    
    if (!lastTag || lastTag.length < 1) {
        hideAutocomplete();
        return;
    }

    const suggestions = getAutocompleteSuggestions(inputValue);
    
    if (suggestions.length > 0) {
        renderAutocompleteSuggestions(suggestions, lastTag);
        showAutocomplete();
    } else {
        hideAutocomplete();
    }
}, 150); // 150ms debounce delay
```

#### 3.3 Event Listeners Integration

**Location**: Replace existing tags input event handling (around line 380-398)

```javascript
// Enhanced tags input handling with autocomplete
const tagsInput = document.getElementById('prompt-tags');

// Input event for autocomplete
tagsInput.addEventListener('input', handleAutocompleteInput);

// Keyboard navigation for autocomplete
tagsInput.addEventListener('keydown', (e) => {
    if (!autocompleteVisible) return;

    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            navigateAutocomplete('down');
            break;
        case 'ArrowUp':
            e.preventDefault();
            navigateAutocomplete('up');
            break;
        case 'Enter':
            e.preventDefault();
            if (autocompleteFocusIndex >= 0) {
                const focusedItem = document.querySelector('#tags-autocomplete .autocomplete-item.focused');
                if (focusedItem) {
                    selectAutocompleteItem(focusedItem.dataset.tag);
                }
            }
            break;
        case 'Escape':
            e.preventDefault();
            hideAutocomplete();
            break;
        case 'Tab':
            // Allow normal tab behavior but hide autocomplete
            hideAutocomplete();
            break;
    }
});

// Hide autocomplete when clicking outside
document.addEventListener('click', (e) => {
    const tagsInput = document.getElementById('prompt-tags');
    const autocompleteDropdown = document.getElementById('tags-autocomplete');
    
    if (!tagsInput.contains(e.target) && !autocompleteDropdown.contains(e.target)) {
        hideAutocomplete();
    }
});

// Focus/blur events
tagsInput.addEventListener('focus', () => {
    // Show autocomplete if there's already input
    if (tagsInput.value.trim()) {
        const event = new Event('input', { bubbles: true });
        tagsInput.dispatchEvent(event);
    }
});

tagsInput.addEventListener('blur', (e) => {
    // Don't hide if user is clicking on autocomplete dropdown
    setTimeout(() => {
        if (!document.querySelector('#tags-autocomplete:hover')) {
            hideAutocomplete();
        }
    }, 100);
});
```

## Implementation Timeline

### Phase 1: Core Functionality (Day 1)
- [ ] Add HTML structure for autocomplete dropdown
- [ ] Implement basic CSS styling
- [ ] Add core JavaScript functions for suggestion filtering
- [ ] Basic show/hide functionality

### Phase 2: User Experience (Day 2)
- [ ] Add keyboard navigation (arrow keys, Enter, Escape)
- [ ] Implement click selection
- [ ] Add text highlighting in suggestions
- [ ] Debounced input handling

### Phase 3: Polish & Integration (Day 3)
- [ ] Ensure proper integration with existing tag dropdown
- [ ] Add accessibility features (ARIA labels)
- [ ] Dark mode styling adjustments
- [ ] Edge case handling and bug fixes

### Phase 4: Testing & Refinement (Day 4)
- [ ] Test with various tag combinations
- [ ] Performance testing with large tag datasets
- [ ] Cross-browser compatibility checks
- [ ] User experience refinements

## Testing Strategy

### Unit Testing Scenarios
1. **Basic Functionality**
   - Autocomplete shows when typing partial tag
   - Suggestions filter correctly based on input
   - Selected tags are properly added to input

2. **Edge Cases**
   - Empty input handling
   - No matching tags scenario
   - Duplicate tag prevention
   - Very long tag names
   - Special characters in tags

3. **User Interactions**
   - Keyboard navigation works correctly
   - Mouse clicks select proper tags
   - Focus/blur behavior is appropriate
   - Integration with existing dropdown

4. **Performance**
   - Debouncing prevents excessive filtering
   - Large tag datasets don't cause lag
   - Memory usage remains reasonable

## Future Enhancement Opportunities

1. **Advanced Matching**: Implement fuzzy search algorithms for better matching
2. **Tag Categories**: Group suggestions by categories or frequency
3. **Recent Tags**: Prioritize recently used tags in suggestions
4. **Tag Analytics**: Track tag usage patterns for better suggestions
5. **Bulk Operations**: Allow selecting multiple suggestions at once
6. **Keyboard Shortcuts**: Add shortcuts for common tag operations

## Risk Assessment

### Low Risk
- CSS styling conflicts (easily resolved)
- Minor UX adjustments needed

### Medium Risk
- Performance with large tag datasets (mitigated by debouncing and limiting results)
- Accessibility compliance (addressed through proper ARIA implementation)

### High Risk
- Browser compatibility issues (mitigated through progressive enhancement)
- Integration conflicts with existing tag system (resolved through careful testing)

## Success Criteria

1. **Functional**: Autocomplete suggestions appear and work correctly
2. **Performance**: No noticeable lag when typing
3. **Accessible**: Screen readers can navigate suggestions
4. **Intuitive**: Users can quickly understand and use the feature
5. **Compatible**: Works alongside existing tag selection methods
6. **Robust**: Handles edge cases gracefully

This implementation plan provides a comprehensive roadmap for adding tag autocomplete functionality while maintaining compatibility with the existing codebase and ensuring a smooth user experience.