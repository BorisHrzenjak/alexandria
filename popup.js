document.addEventListener('DOMContentLoaded', () => {
    console.log('Alexandria popup loaded.');
    
    // DOM Elements
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const settingsBtn = document.getElementById('settings-btn');
    const profileBtn = document.getElementById('profile-btn');
    const favoritesBtn = document.getElementById('favorites-btn');
    const createPromptBtn = document.getElementById('create-prompt-btn');
    const allPromptsBtn = document.getElementById('all-prompts-btn');
    const addPromptModal = document.getElementById('add-prompt-modal');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = addPromptModal.querySelector('.close-btn');
    const savePromptBtn = document.getElementById('save-prompt-btn');
    const promptListUl = document.getElementById('prompt-list');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const copyFeedback = document.getElementById('copy-feedback');
    const modalTitle = document.getElementById('modal-title');
    const contentTitle = document.querySelector('.content-title');
    
    // AI Enhancement Elements
    const panelEnhanceBtn = document.getElementById('panel-enhance-btn');
    const modalEnhanceBtn = document.getElementById('modal-enhance-btn');
    const openRouterApiKeyInput = document.getElementById('openrouter-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');

    // Panel Elements
    const promptViewPanel = document.getElementById('prompt-view-panel');
    const panelTitle = document.getElementById('panel-prompt-title');
    const panelText = document.getElementById('panel-prompt-text');
    const panelCloseBtn = document.getElementById('panel-close-btn');
    const panelCopyBtn = document.getElementById('panel-copy-btn');
    const panelKeepBtn = document.getElementById('panel-keep-btn');

    let currentPanelPromptText = ''; // Store text for panel copy button
    let currentPanelPromptId = ''; // Store current prompt ID for save functionality
    let isPromptEnhanced = false; // Track if the prompt has been enhanced

    // State
    let allPrompts = []; // Cache all prompts to avoid frequent storage reads
    let currentSort = 'createdAtDesc'; // Placeholder for future sorting
    let isFavoritesViewActive = false; // State for favorites filter

    // --- Dark Mode --- 
    const applyDarkMode = (isEnabled) => {
        if (isEnabled) {
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
        }
        darkModeToggle.checked = isEnabled;
    };

    const loadDarkModePreference = () => {
        chrome.storage.local.get('darkMode', (result) => {
            // Default to dark mode if not set
            const isDarkMode = result.darkMode === undefined ? true : !!result.darkMode;
            applyDarkMode(isDarkMode);
        });
    };

    const saveDarkModePreference = (isEnabled) => {
        chrome.storage.local.set({ darkMode: isEnabled });
    };

    darkModeToggle.addEventListener('change', () => {
        const isEnabled = darkModeToggle.checked;
        applyDarkMode(isEnabled);
        saveDarkModePreference(isEnabled);
    });

    // --- Storage Functions --- 
    const getPrompts = (callback) => {
        chrome.storage.local.get({ prompts: [] }, (result) => {
            allPrompts = result.prompts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // Sort newest first
            callback(allPrompts);
        });
    };

    const savePrompts = (prompts, callback) => {
        allPrompts = prompts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // Keep cache sorted
        chrome.storage.local.set({ prompts: allPrompts }, () => {
            console.log('Prompts saved.');
            if (callback) callback();
        });
    };

    // --- UI Rendering --- 
    const updateCategoryFilter = (prompts) => {
        const categories = [...new Set(prompts.map(p => p.category).filter(Boolean))].sort(); // Get unique, sorted categories
        const currentSelection = categoryFilter.value;
        
        // Clear existing options except 'All'
        categoryFilter.innerHTML = '<option value="all">All Categories</option>'; 

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });

        // Restore previous selection if it still exists
        if (categories.includes(currentSelection)) {
            categoryFilter.value = currentSelection;
        } else {
            categoryFilter.value = 'all'; // Default back to 'all' if previous selection is gone
        }
    };
    
    const renderPromptList = (promptsToRender) => {
        promptListUl.innerHTML = ''; // Clear existing list

        if (!promptsToRender || promptsToRender.length === 0) {
            promptListUl.innerHTML = '<li class="prompt-item-placeholder">No prompts found. Try adjusting filters or adding a new one!</li>';
            return;
        }

        promptsToRender.forEach(prompt => {
            const li = document.createElement('li');
            li.classList.add('prompt-item');
            li.dataset.promptId = prompt.id;

            const tagsHtml = prompt.tags.length > 0 ? 
                `<div class="prompt-item-meta">
                    ${prompt.tags.map(tag => `<span class="prompt-item-tags">#${escapeHtml(tag)}</span>`).join('')}
                </div>` : '';
                
            const categoryHtml = prompt.category ? 
                `<div class="prompt-item-meta">
                    <span class="prompt-item-category">${escapeHtml(prompt.category)}</span>
                </div>` : '';

            // Create a preview of the prompt text (first 100 chars)
            const previewText = prompt.text.length > 100 ? 
                prompt.text.substring(0, 100) + '...' : 
                prompt.text;

            li.innerHTML = `
                <div class="prompt-item-content">
                    <h4 class="prompt-item-title">${escapeHtml(prompt.title)}</h4>
                    <p class="prompt-item-preview">${escapeHtml(previewText)}</p>
                    ${categoryHtml}
                    ${tagsHtml}
                </div>
                <div class="prompt-item-actions">
                    <button class="prompt-action-btn view-btn" title="View Full Prompt">🔍</button> 
                    <button class="prompt-action-btn favorite-btn ${prompt.favorite ? 'favorited' : ''}" title="Favorite">${prompt.favorite ? '🌟' : '⭐'}</button>
                    <button class="prompt-action-btn edit-btn" title="Edit Prompt">✏️</button> 
                    <button class="prompt-action-btn delete-btn" title="Delete Prompt">🗑️</button>
                </div>
            `;

            // Attach event listeners
            li.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditModal(prompt.id);
            });

            li.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deletePrompt(prompt.id);
            });
            
            li.querySelector('.favorite-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(prompt.id);
            });
            
            li.querySelector('.view-btn').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering li click (copy)
                panelTitle.textContent = prompt.title;
                // Use our custom markdown parser
                try {
                    if (typeof markdownParser !== 'undefined') {
                        panelText.innerHTML = markdownParser.parse(prompt.text);
                    } else {
                        // Fallback if parser is not available
                        panelText.textContent = prompt.text;
                        console.error('Markdown parser not available');
                    }
                } catch (error) {
                    console.error('Error parsing markdown:', error);
                    panelText.textContent = prompt.text; // Fallback to plain text
                }
                currentPanelPromptText = prompt.text; // Store for copy button
                currentPanelPromptId = prompt.id; // Store prompt ID for save functionality
                isPromptEnhanced = false; // Reset enhancement state
                panelKeepBtn.classList.add('hidden'); // Hide keep button initially
                promptViewPanel.classList.add('active');
            });
            
            li.addEventListener('click', () => {
                copyPromptText(prompt.text); 
            });

            promptListUl.appendChild(li);
        });
    };

    // --- Filtering --- 
    const filterAndRenderPrompts = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;

        // Reset favorites view if search or category changes
        if (searchTerm || selectedCategory !== 'all') {
            isFavoritesViewActive = false;
            // Remove active class from favorites button
            if (favoritesBtn) {
                favoritesBtn.classList.remove('active');
                allPromptsBtn.classList.add('active');
            }
        }

        getPrompts(prompts => {
            let filteredPrompts = prompts.filter(prompt => {
                const titleMatch = prompt.title.toLowerCase().includes(searchTerm);
                const textMatch = prompt.text.toLowerCase().includes(searchTerm);
                const tagsMatch = prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                const categoryMatch = (selectedCategory === 'all' || prompt.category === selectedCategory);
                const searchMatch = searchTerm ? (titleMatch || textMatch || tagsMatch) : true;
                
                return categoryMatch && searchMatch;
            });

            // Apply favorites filter if active
            if (isFavoritesViewActive) {
                filteredPrompts = filteredPrompts.filter(prompt => prompt.favorite === true);
                contentTitle.textContent = 'Favorite Prompts';
            } else {
                contentTitle.textContent = 'All Prompts';
            }

            updateCategoryFilter(allPrompts); // Update category dropdown with all available categories
            renderPromptList(filteredPrompts);
        });
    };

    // --- Initial Load ---
    const loadAndRenderAll = () => {
        getPrompts(prompts => {
            updateCategoryFilter(prompts);
            renderPromptList(prompts);
        });
        loadDarkModePreference();
        loadOpenRouterApiKey();
    };
    
    // --- OpenRouter API Integration ---
    const loadOpenRouterApiKey = () => {
        if (window.openRouterApi) {
            window.openRouterApi.getApiKey().then(apiKey => {
                if (openRouterApiKeyInput) {
                    openRouterApiKeyInput.value = apiKey;
                }
            });
        }
    };
    
    // Function to show loading state on buttons
    const setButtonLoading = (button, isLoading) => {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Processing...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    };
    
    // Function to enhance prompt text with AI
    const enhancePromptWithAI = async (promptText, resultCallback, buttonElement) => {
        try {
            console.log('Enhancing prompt:', promptText.substring(0, 50) + '...');
            
            if (!window.openRouterApi) {
                throw new Error('OpenRouter API not available');
            }
            
            const hasKey = await window.openRouterApi.hasApiKey();
            if (!hasKey) {
                alert('Please add your OpenRouter API key in settings first.');
                openModal(settingsModal);
                // Reset button state if provided
                if (buttonElement) {
                    setButtonLoading(buttonElement, false);
                }
                return;
            }
            
            console.log('API key verified, calling enhancePrompt...');
            const enhancedText = await window.openRouterApi.enhancePrompt(promptText);
            console.log('Received enhanced text:', enhancedText.substring(0, 50) + '...');
            
            if (resultCallback && typeof resultCallback === 'function') {
                resultCallback(enhancedText);
            }
        } catch (error) {
            console.error('Error enhancing prompt:', error);
            alert(`Error enhancing prompt: ${error.message}`);
            
            // Reset button state if provided
            if (buttonElement) {
                setButtonLoading(buttonElement, false);
            }
        }
    };

    loadAndRenderAll(); // Load prompts and dark mode setting when popup opens

    // --- Event Listeners for Filters ---
    if (searchInput) {
        searchInput.addEventListener('input', filterAndRenderPrompts);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterAndRenderPrompts);
    }

    // --- Menu Item Handling ---
    const setActiveMenuItem = (activeItem) => {
        // Remove active class from all menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to the clicked menu item
        if (activeItem) {
            activeItem.classList.add('active');
        }
    };

    // Activate All Prompts by default
    if (allPromptsBtn) {
        allPromptsBtn.classList.add('active');
    }

    // --- Modal Handling --- 
    // Get unique tags from all prompts
    const getAllUniqueTags = () => {
        return [...new Set(allPrompts.flatMap(p => p.tags))].sort();
    };

    // --- Autocomplete Functionality ---
    
    // Autocomplete state
    let autocompleteVisible = false;
    let autocompleteFocusIndex = -1;
    let autocompleteItems = [];
    let autocompleteDebounceTimer = null;

    /**
     * Debounce function to limit excessive filtering
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
        if (!tagsInput) return [];
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
        if (!search) return escapeHtml(text);
        const escapedText = escapeHtml(text);
        const escapedSearch = escapeHtml(search);
        const regex = new RegExp(`(${escapedSearch})`, 'gi');
        return escapedText.replace(regex, '<span class="highlight">$1</span>');
    };

    /**
     * Render autocomplete suggestions
     */
    const renderAutocompleteSuggestions = (suggestions, searchTerm = '') => {
        const dropdown = document.getElementById('tags-autocomplete');
        
        if (!dropdown) return;
        
        if (!suggestions || suggestions.length === 0) {
            dropdown.innerHTML = '<div class="autocomplete-no-results">No matching tags found</div>';
            return;
        }

        dropdown.innerHTML = suggestions.map((tag, index) => {
            const highlightedText = highlightMatch(tag, searchTerm);
            return `<div class="autocomplete-item" data-index="${index}" data-tag="${escapeHtml(tag)}" role="option">
                        ${highlightedText}
                    </div>`;
        }).join('');

        // Store suggestions for keyboard navigation
        autocompleteItems = suggestions;

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
        if (dropdown) {
            dropdown.classList.add('show');
            dropdown.setAttribute('aria-hidden', 'false');
        }
        autocompleteVisible = true;
        autocompleteFocusIndex = -1;
    };

    /**
     * Hide autocomplete dropdown
     */
    const hideAutocomplete = () => {
        const dropdown = document.getElementById('tags-autocomplete');
        if (dropdown) {
            dropdown.classList.remove('show');
            dropdown.setAttribute('aria-hidden', 'true');
        }
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
        if (!tagsInput) return;
        
        const currentValue = tagsInput.value;
        const tags = currentValue.split(',').map(tag => tag.trim()).filter(Boolean);
        
        // Remove the last partial tag if it exists
        const lastTag = getLastPartialTag(currentValue);
        if (lastTag) {
            tags.pop(); // Remove the partial tag
        }
        
        // Add the selected tag
        tags.push(selectedTag);
        
        // Join back and add trailing comma and space for next tag
        tagsInput.value = tags.join(', ') + ', ';
        
        // Hide autocomplete and focus back to input
        hideAutocomplete();
        tagsInput.focus();
        
        // Position cursor at the end
        tagsInput.setSelectionRange(tagsInput.value.length, tagsInput.value.length);
        
        // Trigger input event to potentially show autocomplete for next tag
        setTimeout(() => {
            const event = new Event('input', { bubbles: true });
            tagsInput.dispatchEvent(event);
        }, 50);
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

    // Populate dropdowns with existing categories and tags
    const populateDropdowns = () => {
        const existingCategoriesSelect = document.getElementById('existing-categories');
        const existingTagsSelect = document.getElementById('existing-tags');
        
        // Clear existing options
        existingCategoriesSelect.innerHTML = '<option value="">Select existing category</option>';
        existingTagsSelect.innerHTML = '<option value="">Select existing tags</option>';
        
        // Get unique categories and tags
        const categories = [...new Set(allPrompts.map(p => p.category).filter(Boolean))].sort();
        const tags = getAllUniqueTags();
        
        // Populate categories dropdown
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            existingCategoriesSelect.appendChild(option);
        });
        
        // Populate tags dropdown
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            existingTagsSelect.appendChild(option);
        });
    };
    
    // Handle existing tag selection
    document.getElementById('existing-tags').addEventListener('change', (e) => {
        const selectedTag = e.target.value;
        if (!selectedTag) return;
        
        const tagsInput = document.getElementById('prompt-tags');
        const currentTags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
        
        // Only add if not already in the list
        if (!currentTags.includes(selectedTag)) {
            if (currentTags.length > 0 && currentTags[0] !== '') {
                tagsInput.value = currentTags.join(', ') + ', ' + selectedTag;
            } else {
                tagsInput.value = selectedTag;
            }
        }
        
        // Reset the dropdown
        e.target.value = '';
        
        // Hide autocomplete if visible
        hideAutocomplete();
    });

    // --- Autocomplete Event Listeners ---
    
    // Enhanced tags input handling with autocomplete
    const tagsInput = document.getElementById('prompt-tags');

    // Input event for autocomplete
    if (tagsInput) {
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

        // Focus event - show autocomplete if there's already input
        tagsInput.addEventListener('focus', () => {
            if (tagsInput.value.trim()) {
                const event = new Event('input', { bubbles: true });
                tagsInput.dispatchEvent(event);
            }
        });

        // Blur event - hide autocomplete unless clicking on dropdown
        tagsInput.addEventListener('blur', (e) => {
            setTimeout(() => {
                if (!document.querySelector('#tags-autocomplete:hover')) {
                    hideAutocomplete();
                }
            }, 100);
        });
    }

    // Hide autocomplete when clicking outside
    document.addEventListener('click', (e) => {
        const tagsInput = document.getElementById('prompt-tags');
        const autocompleteDropdown = document.getElementById('tags-autocomplete');
        
        if (tagsInput && autocompleteDropdown && 
            !tagsInput.contains(e.target) && 
            !autocompleteDropdown.contains(e.target)) {
            hideAutocomplete();
        }
    });
    
    // Handle existing category selection
    document.getElementById('existing-categories').addEventListener('change', (e) => {
        const selectedCategory = e.target.value;
        if (!selectedCategory) return;
        
        document.getElementById('prompt-category').value = selectedCategory;
        
        // Reset the dropdown
        e.target.value = '';
    });

    // Modal functions
    const openModal = (modal) => {
        modal.classList.add('active');
        populateDropdowns(); // Refresh dropdowns when opening modal
    };
    
    const closeModal = (modal) => {
        modal.classList.remove('active');
    };

    // Open settings modal
    settingsBtn.addEventListener('click', () => {
        setActiveMenuItem(settingsBtn);
        openModal(settingsModal);
    });
    
    // Save OpenRouter API Key
    if (saveApiKeyBtn) {
        saveApiKeyBtn.addEventListener('click', async () => {
            const apiKey = openRouterApiKeyInput.value.trim();
            if (window.openRouterApi) {
                await window.openRouterApi.saveApiKey(apiKey);
                alert(apiKey ? 'API key saved successfully!' : 'API key cleared.');
            }
        });
    }

    // Import/Export functionality
    const exportPromptsBtn = document.getElementById('export-prompts-btn');
    const importPromptsBtn = document.getElementById('import-prompts-btn');
    const importFileInput = document.getElementById('import-file-input');

    // Export prompts to a JSON file
    exportPromptsBtn.addEventListener('click', () => {
        getPrompts(prompts => {
            if (prompts.length === 0) {
                alert('No prompts to export.');
                return;
            }

            // Create a JSON blob
            const promptsJson = JSON.stringify(prompts, null, 2);
            const blob = new Blob([promptsJson], { type: 'application/json' });
            
            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `alexandria-prompts-${new Date().toISOString().split('T')[0]}.json`;
            
            // Trigger download
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        });
    });

    // Trigger file input when import button is clicked
    importPromptsBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    // Handle file selection for import
    importFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedPrompts = JSON.parse(event.target.result);
                
                // Validate imported data structure
                if (!Array.isArray(importedPrompts)) {
                    throw new Error('Invalid format: Expected an array of prompts');
                }
                
                // Check if each prompt has required fields
                const validPrompts = importedPrompts.filter(prompt => {
                    return prompt && 
                           typeof prompt.title === 'string' && 
                           typeof prompt.text === 'string' &&
                           prompt.id;
                });
                
                if (validPrompts.length === 0) {
                    throw new Error('No valid prompts found in the imported file');
                }
                
                // Ask user about import strategy
                const importStrategy = confirm(
                    `Found ${validPrompts.length} prompts to import. Click OK to merge with existing prompts, or Cancel to replace all existing prompts.`
                );
                
                if (importStrategy) {
                    // Merge: Add imported prompts to existing ones
                    getPrompts(existingPrompts => {
                        // Create a map of existing IDs to avoid duplicates
                        const existingIds = new Set(existingPrompts.map(p => p.id));
                        
                        // Add only prompts with unique IDs
                        const newPrompts = [...existingPrompts];
                        let addedCount = 0;
                        
                        validPrompts.forEach(prompt => {
                            // Generate a new ID if the imported one already exists
                            if (existingIds.has(prompt.id)) {
                                prompt.id = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                            }
                            
                            // Ensure timestamps are valid
                            if (!prompt.createdAt) {
                                prompt.createdAt = new Date().toISOString();
                            }
                            if (!prompt.updatedAt) {
                                prompt.updatedAt = new Date().toISOString();
                            }
                            
                            newPrompts.push(prompt);
                            existingIds.add(prompt.id);
                            addedCount++;
                        });
                        
                        // Save merged prompts
                        savePrompts(newPrompts, () => {
                            alert(`Successfully imported ${addedCount} prompts.`);
                            filterAndRenderPrompts();
                        });
                    });
                } else {
                    // Replace: Overwrite all existing prompts
                    // Ensure all prompts have valid timestamps
                    validPrompts.forEach(prompt => {
                        if (!prompt.createdAt) {
                            prompt.createdAt = new Date().toISOString();
                        }
                        if (!prompt.updatedAt) {
                            prompt.updatedAt = new Date().toISOString();
                        }
                    });
                    
                    savePrompts(validPrompts, () => {
                        alert(`Successfully replaced prompts with ${validPrompts.length} imported prompts.`);
                        filterAndRenderPrompts();
                    });
                }
            } catch (error) {
                console.error('Import error:', error);
                alert(`Error importing prompts: ${error.message}`);
            }
            
            // Reset file input
            importFileInput.value = '';
        };
        
        reader.onerror = () => {
            alert('Error reading the file');
            importFileInput.value = '';
        };
        
        reader.readAsText(file);
    });

    // Open add prompt modal from menu
    createPromptBtn.addEventListener('click', () => {
        setActiveMenuItem(createPromptBtn);
        // Ensure modal is reset to 'Add New' state
        modalTitle.textContent = 'Add New Prompt';
        clearModalFields();
        document.getElementById('prompt-title').dataset.promptId = ''; // Clear any existing ID
        openModal(addPromptModal);
    });

    // Close modal buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal);
        });
    });

    // Close panel buttons
    document.querySelectorAll('#panel-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.panel').forEach(panel => {
                panel.classList.remove('active');
                
                // Reset panel state
                currentPanelPromptId = '';
                currentPanelPromptText = '';
                isPromptEnhanced = false;
                panelKeepBtn.classList.add('hidden');
            });
        });
    });

    // Modal enhance button
    if (modalEnhanceBtn) {
        modalEnhanceBtn.addEventListener('click', () => {
            const textInput = document.getElementById('prompt-text');
            const promptText = textInput.value.trim();
            
            if (!promptText) {
                alert('Please enter some prompt text to enhance!');
                return;
            }
            
            setButtonLoading(modalEnhanceBtn, true);
            
            enhancePromptWithAI(promptText, (enhancedText) => {
                textInput.value = enhancedText;
                setButtonLoading(modalEnhanceBtn, false);
            }, modalEnhanceBtn);
        });
    }
    
    // Save prompt button
    savePromptBtn.addEventListener('click', () => {
        const titleInput = document.getElementById('prompt-title');
        const textInput = document.getElementById('prompt-text');
        const categoryInput = document.getElementById('prompt-category');
        const tagsInput = document.getElementById('prompt-tags');
        
        const title = titleInput.value.trim();
        const text = textInput.value.trim();
        const category = categoryInput.value.trim();
        const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
        
        if (!title || !text) {
            alert('Title and prompt text are required!');
            return;
        }
        
        const promptId = titleInput.dataset.promptId;
        
        if (promptId) {
            // Edit existing prompt
            getPrompts(prompts => {
                const index = prompts.findIndex(p => p.id === promptId);
                if (index !== -1) {
                    prompts[index].title = title;
                    prompts[index].text = text;
                    prompts[index].category = category;
                    prompts[index].tags = tags;
                    prompts[index].updatedAt = new Date().toISOString();
                    
                    savePrompts(prompts, () => {
                        closeModal(addPromptModal);
                        filterAndRenderPrompts();
                    });
                }
            });
        } else {
            // Add new prompt
            const newPrompt = {
                id: Date.now().toString(),
                title,
                text,
                category,
                tags,
                favorite: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            getPrompts(prompts => {
                prompts.push(newPrompt);
                savePrompts(prompts, () => {
                    closeModal(addPromptModal);
                    filterAndRenderPrompts();
                });
            });
        }
    });

    // Delete prompt
    const deletePrompt = (promptId) => {
        if (confirm('Are you sure you want to delete this prompt?')) {
            getPrompts(prompts => {
                const updatedPrompts = prompts.filter(p => p.id !== promptId);
                savePrompts(updatedPrompts, filterAndRenderPrompts);
            });
        }
    };

    // Toggle favorite
    const toggleFavorite = (promptId) => {
        getPrompts(prompts => {
            const index = prompts.findIndex(p => p.id === promptId);
            if (index !== -1) {
                prompts[index].favorite = !prompts[index].favorite;
                savePrompts(prompts, filterAndRenderPrompts);
            }
        });
    };

    // Copy prompt text
    const copyPromptText = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            copyFeedback.classList.add('show');
            setTimeout(() => {
                copyFeedback.classList.remove('show');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
    };

    // Panel copy button
    panelCopyBtn.addEventListener('click', () => {
        copyPromptText(currentPanelPromptText);
    });
    
    // Panel keep button - save enhanced prompt
    if (panelKeepBtn) {
        panelKeepBtn.addEventListener('click', () => {
            if (!isPromptEnhanced || !currentPanelPromptId) {
                return; // Do nothing if prompt isn't enhanced or ID is missing
            }
            
            setButtonLoading(panelKeepBtn, true);
            
            // Update the prompt in storage
            getPrompts(prompts => {
                const index = prompts.findIndex(p => p.id === currentPanelPromptId);
                if (index !== -1) {
                    // Update the prompt text with enhanced version
                    prompts[index].text = currentPanelPromptText;
                    prompts[index].updatedAt = new Date().toISOString();
                    
                    // Create a copy of the updated prompt for later reference
                    const updatedPrompt = {...prompts[index]};
                    
                    // Save the updated prompts
                    savePrompts(prompts, () => {
                        console.log('Enhanced prompt saved with ID:', currentPanelPromptId);
                        console.log('Updated prompt text:', currentPanelPromptText.substring(0, 50) + '...');
                        
                        // Show feedback
                        alert('Enhanced prompt saved successfully!');
                        
                        // Hide keep button and reset enhancement state
                        isPromptEnhanced = false;
                        panelKeepBtn.classList.add('hidden');
                        
                        // Force a complete refresh of the UI
                        // 1. Refresh the prompt list
                        filterAndRenderPrompts();
                        
                        // 2. Update the allPrompts cache directly to ensure consistency
                        const cacheIndex = allPrompts.findIndex(p => p.id === currentPanelPromptId);
                        if (cacheIndex !== -1) {
                            allPrompts[cacheIndex] = updatedPrompt;
                        }
                        
                        setButtonLoading(panelKeepBtn, false);
                    });
                } else {
                    alert('Error: Prompt not found.');
                    setButtonLoading(panelKeepBtn, false);
                }
            });
        });
    }
    
    // Panel enhance button
    if (panelEnhanceBtn) {
        panelEnhanceBtn.addEventListener('click', () => {
            if (!currentPanelPromptText) {
                alert('No prompt text to enhance!');
                return;
            }
            
            setButtonLoading(panelEnhanceBtn, true);
            
            enhancePromptWithAI(currentPanelPromptText, (enhancedText) => {
                // Update the panel text with enhanced version
                try {
                    if (typeof markdownParser !== 'undefined') {
                        panelText.innerHTML = markdownParser.parse(enhancedText);
                    } else {
                        panelText.textContent = enhancedText;
                    }
                } catch (error) {
                    console.error('Error parsing markdown:', error);
                    panelText.textContent = enhancedText;
                }
                
                // Update the stored text for copying
                currentPanelPromptText = enhancedText;
                
                // Show the keep button and mark as enhanced
                isPromptEnhanced = true;
                panelKeepBtn.classList.remove('hidden');
                
                setButtonLoading(panelEnhanceBtn, false);
            }, panelEnhanceBtn);
        });
    }

    // Open edit modal
    const openEditModal = (promptId) => {
        getPrompts(prompts => {
            const prompt = prompts.find(p => p.id === promptId);
            if (prompt) {
                modalTitle.textContent = 'Edit Prompt';
                
                const titleInput = document.getElementById('prompt-title');
                const textInput = document.getElementById('prompt-text');
                const categoryInput = document.getElementById('prompt-category');
                const tagsInput = document.getElementById('prompt-tags');
                
                titleInput.value = prompt.title;
                titleInput.dataset.promptId = promptId; // Store ID for save
                textInput.value = prompt.text;
                categoryInput.value = prompt.category || '';
                tagsInput.value = prompt.tags.join(', ');
                
                openModal(addPromptModal);
            }
        });
    };

    // --- Utility ---
    const escapeHtml = (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };


    // Clear modal fields
    const clearModalFields = () => {
        document.getElementById('prompt-title').value = '';
        document.getElementById('prompt-text').value = '';
        document.getElementById('prompt-category').value = '';
        document.getElementById('prompt-tags').value = '';
        document.getElementById('existing-categories').value = '';
        document.getElementById('existing-tags').value = '';
        
        // Hide autocomplete dropdown
        hideAutocomplete();
    };

    // Menu navigation
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
            setActiveMenuItem(favoritesBtn);
            isFavoritesViewActive = true;
            filterAndRenderPrompts();
        });
    }

    if (allPromptsBtn) {
        allPromptsBtn.addEventListener('click', () => {
            setActiveMenuItem(allPromptsBtn);
            isFavoritesViewActive = false;
            filterAndRenderPrompts();
        });
    }

    // Profile button (placeholder for future functionality)
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            setActiveMenuItem(profileBtn);
            alert('Profile functionality will be available in a future update.');
        });
    }
});
