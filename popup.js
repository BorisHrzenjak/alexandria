document.addEventListener('DOMContentLoaded', () => {
    console.log('Alexandria popup loaded.');

    // Set version badge from manifest
    const versionBadge = document.getElementById('version-badge');
    const settingsVersion = document.getElementById('settings-version');
    if (chrome.runtime && chrome.runtime.getManifest) {
        const manifest = chrome.runtime.getManifest();
        if (versionBadge) versionBadge.textContent = 'v' + manifest.version;
        if (settingsVersion) settingsVersion.textContent = 'v' + manifest.version;
    }

    // DOM Elements
    const body = document.body;
    const sidebar = document.getElementById('sidebar');
    const settingsBtn = document.getElementById('settings-btn');
    const profileBtn = document.getElementById('profile-btn');
    const favoritesBtn = document.getElementById('favorites-btn');
    const createPromptBtn = document.getElementById('create-prompt-btn');
    const allPromptsBtn = document.getElementById('all-prompts-btn');
    const playgroundBtn = document.getElementById('playground-btn');
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

    // Playground Elements
    const playgroundContainer = document.getElementById('playground-container');
    const promptListContainer = document.querySelector('.prompt-list-container');
    const playgroundPurposeSelect = document.getElementById('playground-purpose');
    const playgroundInstructionsTextarea = document.getElementById('playground-instructions');
    const playgroundInputTextarea = document.getElementById('playground-input');
    const playgroundOptimizeBtn = document.getElementById('playground-optimize-btn');
    const playgroundClearBtn = document.getElementById('playground-clear-btn');
    const playgroundOverlayActions = document.getElementById('playground-overlay-actions');
    const playgroundCopyBtn = document.getElementById('playground-copy-btn');
    const playgroundSaveBtn = document.getElementById('playground-save-btn');
    const playgroundDownloadBtn = document.getElementById('playground-download-btn');
    const playgroundRetryBtn = document.getElementById('playground-retry-btn');
    const playgroundRestoreBtn = document.getElementById('playground-restore-btn');
    const playgroundManageUsecasesBtn = document.getElementById('playground-manage-usecases-btn');

    // Custom Use Cases Modal Elements
    const customUsecasesModal = document.getElementById('custom-usecases-modal');
    const customUsecaseNameInput = document.getElementById('custom-usecase-name');
    const customUsecaseInstructionsInput = document.getElementById('custom-usecase-instructions');
    const addCustomUsecaseBtn = document.getElementById('add-custom-usecase-btn');
    const customUsecasesList = document.getElementById('custom-usecases-list');

    // AI Enhancement Elements
    const panelEnhanceBtn = document.getElementById('panel-enhance-btn');
    const modalEnhanceBtn = document.getElementById('modal-enhance-btn');
    const openRouterApiKeyInput = document.getElementById('openrouter-api-key');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const modelPicker = document.getElementById('model-picker');

    // Panel Elements
    const promptViewPanel = document.getElementById('prompt-view-panel');
    const panelTitle = document.getElementById('panel-prompt-title');
    const panelText = document.getElementById('panel-prompt-text');
    const panelCloseBtn = document.getElementById('panel-close-btn');
    const panelCopyBtn = document.getElementById('panel-copy-btn');
    const panelKeepBtn = document.getElementById('panel-keep-btn');
    const panelHistoryBtn = document.getElementById('panel-history-btn');

    // History Panel Elements
    const historyPanel = document.getElementById('history-panel');
    const historyPanelContent = document.getElementById('history-panel-content');
    const historyPanelCloseBtn = document.getElementById('history-panel-close-btn');
    const historyBackBtn = document.getElementById('history-back-btn');

    // Enhancement Diff Panel Elements
    const enhanceDiffPanel = document.getElementById('enhance-diff-panel');
    const enhanceDiffOriginal = document.getElementById('enhance-diff-original');
    const enhanceDiffEnhanced = document.getElementById('enhance-diff-enhanced');
    const enhanceDiffCloseBtn = document.getElementById('enhance-diff-close-btn');
    const enhanceKeepBtn = document.getElementById('enhance-keep-btn');
    const enhanceRestoreBtn = document.getElementById('enhance-restore-btn');
    const enhanceCancelBtn = document.getElementById('enhance-cancel-btn');

    // State variables for enhancement diff
    let pendingEnhancedText = '';
    let originalTextBeforeEnhance = '';

    let currentPanelPromptText = ''; // Store text for panel copy button
    let currentPanelPromptId = ''; // Store current prompt ID for save functionality
    let isPromptEnhanced = false; // Track if the prompt has been enhanced

    // State
    let allPrompts = []; // Cache all prompts to avoid frequent storage reads
    let currentSort = 'createdAtDesc'; // Placeholder for future sorting
    let isFavoritesViewActive = false; // State for favorites filter

    // Playground State
    let currentOptimizedPrompt = ''; // Store the current optimized prompt
    let currentOriginalPrompt = ''; // Store the original prompt for comparison

    // Custom Use Cases State
    let customUseCases = []; // Store custom use cases from storage

    // --- Theme Management ---
    const validThemes = ['tokyo-night', 'dracula', 'one-dark-pro', 'github-dark', 'monokai', 'nord', 'ayu-dark', 'night-owl', 'catppuccin', 'github-light'];
    
    const applyTheme = (themeName) => {
        // Validate theme name
        if (!themeName || !validThemes.includes(themeName)) {
            themeName = 'tokyo-night';
        }
        
        // Remove all theme attributes from body
        document.body.removeAttribute('data-theme');
        
        // Apply selected theme to body
        document.body.setAttribute('data-theme', themeName);
        
        // Update theme option UI
        document.querySelectorAll('.theme-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio && radio.value === themeName) {
                option.classList.add('active');
                radio.checked = true;
            } else {
                option.classList.remove('active');
                if (radio) radio.checked = false;
            }
        });
    };

    const loadThemePreference = () => {
        chrome.storage.local.get('theme', (result) => {
            const theme = result.theme || 'tokyo-night';
            // Validate theme
            if (!validThemes.includes(theme)) {
                applyTheme('tokyo-night');
            } else {
                applyTheme(theme);
            }
        });
    };

    const saveThemePreference = (theme) => {
        if (validThemes.includes(theme)) {
            chrome.storage.local.set({ theme: theme });
        }
    };

    // Theme selector - use change event on radio inputs
    document.querySelectorAll('.theme-option input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const theme = e.target.value;
            applyTheme(theme);
            saveThemePreference(theme);
        });
    });

    // --- Storage Functions --- 
    const getPrompts = (callback) => {
        chrome.storage.local.get({ prompts: [] }, (result) => {
            const prompts = result.prompts || [];
            
            // Migration: ensure all prompts have versions array with initial version
            prompts.forEach(prompt => {
                if (!prompt.versions || !Array.isArray(prompt.versions)) {
                    prompt.versions = [{
                        text: prompt.text,
                        timestamp: prompt.createdAt,
                        reason: 'created'
                    }];
                }
            });
            
            allPrompts = prompts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // Sort newest first
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

    // Create a new version of a prompt
    const createVersion = (promptId, newText, reason) => {
        return new Promise((resolve) => {
            getPrompts(prompts => {
                const index = prompts.findIndex(p => p.id === promptId);
                if (index === -1) {
                    resolve(false);
                    return;
                }

                const prompt = prompts[index];
                
                // Don't create version if text hasn't changed
                if (prompt.text === newText) {
                    resolve(true);
                    return;
                }

                // Initialize versions array if it doesn't exist
                if (!prompt.versions || !Array.isArray(prompt.versions)) {
                    prompt.versions = [{
                        text: prompt.text,
                        timestamp: prompt.createdAt,
                        reason: 'created'
                    }];
                }

                // Add new version
                prompt.versions.unshift({
                    text: newText,
                    timestamp: new Date().toISOString(),
                    reason: reason
                });

                // Keep only last 10 versions
                if (prompt.versions.length > 10) {
                    prompt.versions = prompt.versions.slice(0, 10);
                }

                // Update prompt text
                prompt.text = newText;
                prompt.updatedAt = new Date().toISOString();

                savePrompts(prompts, () => {
                    console.log(`Version created for prompt ${promptId}: ${reason}`);
                    resolve(true);
                });
            });
        });
    };

    // Get versions for a specific prompt
    const getPromptVersions = (promptId) => {
        return new Promise((resolve) => {
            getPrompts(prompts => {
                const prompt = prompts.find(p => p.id === promptId);
                resolve(prompt ? (prompt.versions || []) : []);
            });
        });
    };

    // Restore a specific version
    const restoreVersion = (promptId, versionIndex) => {
        return new Promise((resolve) => {
            getPrompts(prompts => {
                const index = prompts.findIndex(p => p.id === promptId);
                if (index === -1) {
                    resolve(false);
                    return;
                }

                const prompt = prompts[index];
                const versions = prompt.versions || [];
                
                if (versionIndex < 0 || versionIndex >= versions.length) {
                    resolve(false);
                    return;
                }

                const versionToRestore = versions[versionIndex];
                
                // Create a new version for the restore action
                versions.unshift({
                    text: versionToRestore.text,
                    timestamp: new Date().toISOString(),
                    reason: 'restored'
                });

                // Keep only last 10 versions
                if (versions.length > 10) {
                    prompt.versions = versions.slice(0, 10);
                }

                // Update prompt text to restored version
                prompt.text = versionToRestore.text;
                prompt.updatedAt = new Date().toISOString();

                savePrompts(prompts, () => {
                    console.log(`Version restored for prompt ${promptId}`);
                    resolve(true);
                });
            });
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
                    <button class="prompt-action-btn view-btn" title="View Full Prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    </button>
                    <button class="prompt-action-btn favorite-btn ${prompt.favorite ? 'favorited' : ''}" title="Favorite">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${prompt.favorite ? '#f59e0b' : 'none'}" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </button>
                    <button class="prompt-action-btn edit-btn" title="Edit Prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="prompt-action-btn delete-btn" title="Delete Prompt">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
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
        loadThemePreference();
        loadOpenRouterApiKey();
        chrome.storage.local.get('selectedModel', (result) => {
            if (result.selectedModel && window.openRouterApi) {
                window.openRouterApi.setModel(result.selectedModel);
            }
        });
        chrome.storage.local.get({ customUseCases: [] }, (result) => {
            customUseCases = result.customUseCases || [];
            populatePurposeDropdown();
        });
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

    // Load saved model
    const loadSelectedModel = () => {
        chrome.storage.local.get('selectedModel', (result) => {
            if (modelPicker && result.selectedModel) {
                modelPicker.value = result.selectedModel;
                if (window.openRouterApi) {
                    window.openRouterApi.setModel(result.selectedModel);
                }
            }
        });
    };

    // Fetch available models from OpenRouter
    const fetchOpenRouterModels = async () => {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models');
            const data = await response.json();
            
            if (data.data && Array.isArray(data.data)) {
                // Sort models - popular ones first, then alphabetically
                const popularModels = [
                    'google/gemini-2.5-flash',
                    'openai/gpt-4o',
                    'openai/gpt-4o-mini',
                    'anthropic/claude-3.5-sonnet',
                    'meta-llama/llama-3.1-70b-instruct',
                    'meta-llama/llama-3.1-8b-instruct',
                    'mistralai/mistral-7b-instruct',
                    'qwen/qwen-2.5-72b-instruct'
                ];
                
                const sortedModels = data.data.sort((a, b) => {
                    const aIndex = popularModels.indexOf(a.id);
                    const bIndex = popularModels.indexOf(b.id);
                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                    if (aIndex !== -1) return -1;
                    if (bIndex !== -1) return 1;
                    return a.id.localeCompare(b.id);
                });
                
                // Clear and populate the dropdown
                modelPicker.innerHTML = '';
                
                sortedModels.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.id;
                    option.textContent = model.id;
                    modelPicker.appendChild(option);
                });
                
                // Restore saved selection
                chrome.storage.local.get('selectedModel', (result) => {
                    if (result.selectedModel) {
                        modelPicker.value = result.selectedModel;
                    }
                });
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
            modelPicker.innerHTML = '<option value="google/gemini-2.5-flash">Google Gemini 2.5 Flash (Default)</option>';
        }
    };

    // Save model when changed
    if (modelPicker) {
        modelPicker.addEventListener('change', () => {
            const selectedModel = modelPicker.value;
            chrome.storage.local.set({ selectedModel: selectedModel }, () => {
                if (window.openRouterApi) {
                    window.openRouterApi.setModel(selectedModel);
                }
            });
        });
    }

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

    // Close modal when clicking outside
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.modal.active').forEach(modal => {
            if (e.target === modal) {
                closeModal(modal);
            }
        });
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal);
            });
        }
    });

    // Open settings modal
    settingsBtn.addEventListener('click', () => {
        setActiveMenuItem(settingsBtn);
        openModal(settingsModal);
        fetchOpenRouterModels();
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
                
                // Reset enhancement diff state
                pendingEnhancedText = '';
                originalTextBeforeEnhance = '';
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
            // Edit existing prompt - create a version before saving
            createVersion(promptId, text, 'edited').then(() => {
                getPrompts(prompts => {
                    const index = prompts.findIndex(p => p.id === promptId);
                    if (index !== -1) {
                        prompts[index].title = title;
                        prompts[index].category = category;
                        prompts[index].tags = tags;
                        prompts[index].updatedAt = new Date().toISOString();

                        savePrompts(prompts, () => {
                            closeModal(addPromptModal);
                            filterAndRenderPrompts();
                        });
                    }
                });
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
                updatedAt: new Date().toISOString(),
                versions: [{
                    text: text,
                    timestamp: new Date().toISOString(),
                    reason: 'created'
                }]
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

    // Variable System State
    let currentVariablePromptText = '';
    let foundVariables = [];

    // Extract variables from text: matches {variableName}
    const extractVariables = (text) => {
        const regex = /{([^{}]+)}/g;
        const variables = new Set();
        let match;

        while ((match = regex.exec(text)) !== null) {
            variables.add(match[1]);
        }

        return Array.from(variables);
    };

    // Render variable inputs in the modal
    const renderVariableInputs = (variables) => {
        const container = document.getElementById('variable-inputs-container');
        container.innerHTML = '';

        variables.forEach(variable => {
            const group = document.createElement('div');
            group.className = 'variable-input-group';

            const label = document.createElement('label');
            label.innerHTML = `Value for <span class="variable-name">{${escapeHtml(variable)}}</span>:`;
            label.htmlFor = `var-${variable}`;

            const input = document.createElement('input');
            input.type = 'text';
            input.id = `var-${variable}`;
            input.dataset.variable = variable;
            input.placeholder = `Enter value for ${variable}...`;

            // Auto-focus the first input
            if (variables.indexOf(variable) === 0) {
                setTimeout(() => input.focus(), 100);
            }

            // Allow Enter key to submit if it's the last input
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && variables.indexOf(variable) === variables.length - 1) {
                    processVariableCopy();
                }
            });

            group.appendChild(label);
            group.appendChild(input);
            container.appendChild(group);
        });
    };

    // Process the variables and copy
    const processVariableCopy = () => {
        let finalText = currentVariablePromptText;
        const inputs = document.querySelectorAll('#variable-inputs-container input');

        inputs.forEach(input => {
            const variable = input.dataset.variable;
            const value = input.value.trim();
            const escapedVariable = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`{${escapedVariable}}`, 'g');
            finalText = finalText.replace(regex, value);
        });

        navigator.clipboard.writeText(finalText).then(() => {
            closeModal(document.getElementById('variable-input-modal'));
            showCopyFeedback();
            // Track usage if we have the ID (stored below)
            if (processVariableCopy.targetPromptId) {
                incrementUsage(processVariableCopy.targetPromptId);
                processVariableCopy.targetPromptId = null; // Reset
            }
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
    };

    // Show copy feedback (reused)
    const showCopyFeedback = () => {
        copyFeedback.classList.add('show');
        setTimeout(() => {
            copyFeedback.classList.remove('show');
        }, 2000);
    };

    // Copy prompt text (Modified to handle variables and tracking)
    const copyPromptText = (text, promptId = null) => { // Added promptId param
        const variables = extractVariables(text);

        let targetId = promptId;
        // If promptId is not passed, try to find it in allPrompts by text (fallback)
        if (!targetId) {
            const found = allPrompts.find(p => p.text === text);
            if (found) targetId = found.id;
        }

        const proceedWithCopy = (txt) => {
            navigator.clipboard.writeText(txt).then(() => {
                showCopyFeedback();
                if (targetId) incrementUsage(targetId); // Track usage!
            }).catch(err => {
                console.error('Failed to copy text: ', err);
                alert('Failed to copy to clipboard');
            });
        };

        if (variables.length > 0) {
            // Variables found - open modal
            currentVariablePromptText = text;
            foundVariables = variables;
            // Store targetId in the function object to pass it to the callback
            processVariableCopy.targetPromptId = targetId;

            renderVariableInputs(variables);
            openModal(document.getElementById('variable-input-modal'));
        } else {
            // No variables - standard copy
            proceedWithCopy(text);
        }
    };

    // Variable Modal Event Listeners
    document.getElementById('copy-with-values-btn')?.addEventListener('click', processVariableCopy);

    document.getElementById('copy-raw-btn')?.addEventListener('click', () => {
        navigator.clipboard.writeText(currentVariablePromptText).then(() => {
            closeModal(document.getElementById('variable-input-modal'));
            showCopyFeedback();
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard');
        });
    });

    // Panel copy button
    panelCopyBtn.addEventListener('click', () => {
        copyPromptText(currentPanelPromptText);
    });

    // Panel keep button - save enhanced prompt
    if (panelKeepBtn) {
        panelKeepBtn.addEventListener('click', async () => {
            if (!isPromptEnhanced || !currentPanelPromptId) {
                return;
            }

            setButtonLoading(panelKeepBtn, true);

            const success = await createVersion(currentPanelPromptId, currentPanelPromptText, 'enhanced');
            
            if (success) {
                alert('Enhanced prompt saved successfully!');
                
                isPromptEnhanced = false;
                panelKeepBtn.classList.add('hidden');
                
                filterAndRenderPrompts();
                
                // Refresh the current panel view with updated text
                getPrompts(prompts => {
                    const prompt = prompts.find(p => p.id === currentPanelPromptId);
                    if (prompt) {
                        try {
                            if (typeof markdownParser !== 'undefined') {
                                panelText.innerHTML = markdownParser.parse(prompt.text);
                            } else {
                                panelText.textContent = prompt.text;
                            }
                        } catch (error) {
                            console.error('Error parsing markdown:', error);
                            panelText.textContent = prompt.text;
                        }
                    }
                });
            } else {
                alert('Error saving enhanced prompt.');
            }
            
            setButtonLoading(panelKeepBtn, false);
        });
    }

    // Panel enhance button - show diff view instead of immediately applying
    if (panelEnhanceBtn) {
        panelEnhanceBtn.addEventListener('click', () => {
            if (!currentPanelPromptText) {
                alert('No prompt text to enhance!');
                return;
            }

            // Store original text before enhancing
            originalTextBeforeEnhance = currentPanelPromptText;

            setButtonLoading(panelEnhanceBtn, true);

            enhancePromptWithAI(currentPanelPromptText, (enhancedText) => {
                // Store pending enhanced text
                pendingEnhancedText = enhancedText;

                // Show the diff view
                enhanceDiffOriginal.textContent = originalTextBeforeEnhance;
                enhanceDiffEnhanced.textContent = enhancedText;
                
                enhanceDiffPanel.classList.add('active');
                promptViewPanel.classList.remove('active');

                setButtonLoading(panelEnhanceBtn, false);
            }, panelEnhanceBtn);
        });
    }

    // History panel button - open history panel
    if (panelHistoryBtn) {
        panelHistoryBtn.addEventListener('click', () => {
            if (!currentPanelPromptId) return;

            getPromptVersions(currentPanelPromptId).then(versions => {
                renderHistoryPanel(versions);
                historyPanel.classList.add('active');
                promptViewPanel.classList.remove('active');
            });
        });
    }

    // Render history panel with versions
    const renderHistoryPanel = (versions) => {
        if (!versions || versions.length === 0) {
            historyPanelContent.innerHTML = '<div class="history-empty">No version history available.</div>';
            return;
        }

        const formatDate = (isoString) => {
            const date = new Date(isoString);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        };

        const getReasonBadge = (reason) => {
            const badges = {
                'created': '<span class="history-badge created">Created</span>',
                'edited': '<span class="history-badge edited">Edited</span>',
                'enhanced': '<span class="history-badge enhanced">Enhanced</span>',
                'restored': '<span class="history-badge restored">Restored</span>'
            };
            return badges[reason] || `<span class="history-badge">${reason}</span>`;
        };

        historyPanelContent.innerHTML = versions.map((version, index) => {
            const preview = version.text.length > 80 ? version.text.substring(0, 80) + '...' : version.text;
            return `
                <div class="history-item" data-index="${index}">
                    <div class="history-item-header">
                        <span class="history-item-date">${formatDate(version.timestamp)}</span>
                        ${getReasonBadge(version.reason)}
                    </div>
                    <div class="history-item-preview">${escapeHtml(preview)}</div>
                    <div class="history-item-actions">
                        <button class="history-view-btn" data-index="${index}">View</button>
                        <button class="history-restore-btn" data-index="${index}">Restore</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add event listeners to history item buttons
        historyPanelContent.querySelectorAll('.history-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                const version = versions[index];
                alert('Version ' + (index + 1) + ':\n\n' + version.text);
            });
        });

        historyPanelContent.querySelectorAll('.history-restore-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const index = parseInt(e.target.dataset.index);
                if (confirm('Restore this version as the current prompt?')) {
                    const success = await restoreVersion(currentPanelPromptId, index);
                    if (success) {
                        alert('Version restored successfully!');
                        // Refresh the prompt view
                        getPrompts(prompts => {
                            const prompt = prompts.find(p => p.id === currentPanelPromptId);
                            if (prompt) {
                                currentPanelPromptText = prompt.text;
                                try {
                                    if (typeof markdownParser !== 'undefined') {
                                        panelText.innerHTML = markdownParser.parse(prompt.text);
                                    } else {
                                        panelText.textContent = prompt.text;
                                    }
                                } catch (error) {
                                    panelText.textContent = prompt.text;
                                }
                            }
                        });
                        // Refresh history
                        getPromptVersions(currentPanelPromptId).then(v => renderHistoryPanel(v));
                        filterAndRenderPrompts();
                    }
                }
            });
        });
    };

    // History panel close button
    if (historyPanelCloseBtn) {
        historyPanelCloseBtn.addEventListener('click', () => {
            historyPanel.classList.remove('active');
            promptViewPanel.classList.add('active');
        });
    }

    // History panel back button
    if (historyBackBtn) {
        historyBackBtn.addEventListener('click', () => {
            historyPanel.classList.remove('active');
            promptViewPanel.classList.add('active');
        });
    }

    // Enhancement diff panel handlers
    if (enhanceKeepBtn) {
        enhanceKeepBtn.addEventListener('click', async () => {
            // Apply the enhanced version
            currentPanelPromptText = pendingEnhancedText;
            
            // Update the panel view
            try {
                if (typeof markdownParser !== 'undefined') {
                    panelText.innerHTML = markdownParser.parse(pendingEnhancedText);
                } else {
                    panelText.textContent = pendingEnhancedText;
                }
            } catch (error) {
                panelText.textContent = pendingEnhancedText;
            }

            // Mark as enhanced and show keep button
            isPromptEnhanced = true;
            panelKeepBtn.classList.remove('hidden');

            // Close diff panel and show prompt panel
            enhanceDiffPanel.classList.remove('active');
            promptViewPanel.classList.add('active');

            // Clear pending data
            pendingEnhancedText = '';
            originalTextBeforeEnhance = '';
        });
    }

    if (enhanceRestoreBtn) {
        enhanceRestoreBtn.addEventListener('click', () => {
            // Restore original text
            currentPanelPromptText = originalTextBeforeEnhance;
            
            // Update the panel view
            try {
                if (typeof markdownParser !== 'undefined') {
                    panelText.innerHTML = markdownParser.parse(originalTextBeforeEnhance);
                } else {
                    panelText.textContent = originalTextBeforeEnhance;
                }
            } catch (error) {
                panelText.textContent = originalTextBeforeEnhance;
            }

            // Close diff panel and show prompt panel
            enhanceDiffPanel.classList.remove('active');
            promptViewPanel.classList.add('active');

            // Clear pending data
            pendingEnhancedText = '';
            originalTextBeforeEnhance = '';
        });
    }

    if (enhanceCancelBtn) {
        enhanceCancelBtn.addEventListener('click', () => {
            // Close diff panel and show prompt panel without changes
            enhanceDiffPanel.classList.remove('active');
            promptViewPanel.classList.add('active');

            // Clear pending data
            pendingEnhancedText = '';
            originalTextBeforeEnhance = '';
        });
    }

    if (enhanceDiffCloseBtn) {
        enhanceDiffCloseBtn.addEventListener('click', () => {
            enhanceDiffPanel.classList.remove('active');
            promptViewPanel.classList.add('active');

            // Clear pending data
            pendingEnhancedText = '';
            originalTextBeforeEnhance = '';
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

    // --- View Management ---
    const showPromptList = () => {
        promptListContainer.style.display = 'block';
        playgroundContainer.style.display = 'none';
        const dc = document.getElementById('dashboard-container');
        if (dc) dc.style.display = 'none';
        const contentHeader = document.querySelector('.content-header');
        if (contentHeader) contentHeader.style.display = 'flex';
    };

    const showPlayground = () => {
        promptListContainer.style.display = 'none';
        playgroundContainer.style.display = 'flex';
        const dc = document.getElementById('dashboard-container');
        if (dc) dc.style.display = 'none';
        const contentHeader = document.querySelector('.content-header');
        if (contentHeader) contentHeader.style.display = 'none';
    };

    // --- Playground Functionality ---
    const clearPlaygroundForm = () => {
        playgroundPurposeSelect.value = '';
        playgroundModelSelect.value = '';
        playgroundInputTextarea.value = '';
        playgroundInputTextarea.classList.remove('optimized');
        playgroundOverlayActions.style.display = 'none';
        currentOptimizedPrompt = '';
        currentOriginalPrompt = '';
    };

    const showPlaygroundLoading = (isLoading) => {
        if (isLoading) {
            playgroundOptimizeBtn.disabled = true;
            playgroundOptimizeBtn.dataset.originalText = playgroundOptimizeBtn.textContent;
            playgroundOptimizeBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                Processing...
            `;
            playgroundInputTextarea.value = 'Optimizing your prompt...';
            playgroundInputTextarea.disabled = true;
        } else {
            playgroundOptimizeBtn.disabled = false;
            playgroundOptimizeBtn.innerHTML = playgroundOptimizeBtn.dataset.originalText || `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
                Optimize Prompt
            `;
            playgroundInputTextarea.disabled = false;
        }
    };

    const restoreOriginalPrompt = () => {
        if (currentOriginalPrompt) {
            playgroundInputTextarea.value = currentOriginalPrompt;
            playgroundInputTextarea.classList.remove('optimized');
            playgroundOverlayActions.style.display = 'none';
            currentOptimizedPrompt = '';
        }
    };

    const optimizePlaygroundPrompt = async () => {
        const purpose = playgroundPurposeSelect.value;
        const customInstructions = playgroundInstructionsTextarea.value.trim();
        const inputText = playgroundInputTextarea.value.trim();

        // Validation
        if (!purpose) {
            alert('Please select a use case.');
            return;
        }
        if (!inputText) {
            alert('Please enter a prompt to optimize.');
            return;
        }

        try {
            showPlaygroundLoading(true);
            currentOriginalPrompt = inputText;

            if (!window.openRouterApi) {
                throw new Error('OpenRouter API not available');
            }

            const hasKey = await window.openRouterApi.hasApiKey();
            if (!hasKey) {
                alert('Please add your OpenRouter API key in settings first.');
                openModal(settingsModal);
                showPlaygroundLoading(false);
                return;
            }

            console.log('Optimizing prompt for purpose:', purpose, 'custom instructions:', customInstructions);
            const optimizedText = await window.openRouterApi.optimizePromptForModel(inputText, purpose, customInstructions);
            console.log('Received optimized text:', optimizedText.substring(0, 50) + '...');

            currentOptimizedPrompt = optimizedText;
            playgroundInputTextarea.value = optimizedText;
            playgroundInputTextarea.classList.add('optimized');
            playgroundOverlayActions.style.display = 'flex';
            showPlaygroundLoading(false);

        } catch (error) {
            console.error('Error optimizing prompt:', error);
            alert(`Error optimizing prompt: ${error.message}`);
            showPlaygroundLoading(false);
        }
    };

    const savePlaygroundPrompt = () => {
        if (!currentOptimizedPrompt) {
            alert('No optimized prompt to save.');
            return;
        }

        const purpose = playgroundPurposeSelect.value;
        const customInstructions = playgroundInstructionsTextarea.value.trim();
        const timestamp = new Date().toISOString();

        const title = `${purpose.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Prompt`;

        const newPrompt = {
            id: Date.now().toString(),
            title,
            text: currentOptimizedPrompt,
            category: 'Playground',
            tags: ['playground', purpose, 'optimized'],
            favorite: false,
            createdAt: timestamp,
            updatedAt: timestamp,
            metadata: {
                originalPrompt: currentOriginalPrompt,
                useCase: purpose,
                customInstructions: customInstructions,
                source: 'playground'
            }
        };

        getPrompts(prompts => {
            prompts.push(newPrompt);
            savePrompts(prompts, () => {
                alert('Prompt saved to library!');
                console.log('Playground prompt saved:', newPrompt);
            });
        });
    };

    const downloadPlaygroundPrompt = (format = 'txt') => {
        if (!currentOptimizedPrompt) {
            alert('No optimized prompt to download.');
            return;
        }

        const purpose = playgroundPurposeSelect.value;
        const customInstructions = playgroundInstructionsTextarea.value.trim();
        const timestamp = new Date().toISOString().split('T')[0];

        let content, filename, mimeType;

        if (format === 'md') {
            content = `# Optimized Prompt

**Use Case:** ${purpose.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
${customInstructions ? `**Custom Instructions:** ${customInstructions}` : ''}
**Created:** ${new Date().toLocaleDateString()}

## Original Prompt
\`\`\`
${currentOriginalPrompt}
\`\`\`

## Optimized Prompt
\`\`\`
${currentOptimizedPrompt}
\`\`\`

---
*Generated with Alexandria Prompt Library*`;
            filename = `optimized-prompt-${timestamp}.md`;
            mimeType = 'text/markdown';
        } else {
            content = currentOptimizedPrompt;
            filename = `optimized-prompt-${timestamp}.txt`;
            mimeType = 'text/plain';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;

        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    // Menu navigation
    if (favoritesBtn) {
        favoritesBtn.addEventListener('click', () => {
            setActiveMenuItem(favoritesBtn);
            isFavoritesViewActive = true;
            showPromptList();
            filterAndRenderPrompts();
        });
    }

    if (allPromptsBtn) {
        allPromptsBtn.addEventListener('click', () => {
            setActiveMenuItem(allPromptsBtn);
            isFavoritesViewActive = false;
            showPromptList();
            filterAndRenderPrompts();
        });
    }

    if (playgroundBtn) {
        playgroundBtn.addEventListener('click', () => {
            setActiveMenuItem(playgroundBtn);
            showPlayground();
        });
    }

    // Profile button (placeholder for future functionality)
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            setActiveMenuItem(profileBtn);
            alert('Profile functionality will be available in a future update.');
        });
    }

    // --- Playground Event Listeners ---
    if (playgroundOptimizeBtn) {
        playgroundOptimizeBtn.addEventListener('click', optimizePlaygroundPrompt);
    }

    if (playgroundClearBtn) {
        playgroundClearBtn.addEventListener('click', clearPlaygroundForm);
    }

    if (playgroundCopyBtn) {
        playgroundCopyBtn.addEventListener('click', () => {
            copyPromptText(currentOptimizedPrompt);
        });
    }

    if (playgroundSaveBtn) {
        playgroundSaveBtn.addEventListener('click', savePlaygroundPrompt);
    }

    if (playgroundDownloadBtn) {
        playgroundDownloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Show a simple context menu or just default to .md format
            const format = confirm('Download as Markdown? (Cancel for plain text)') ? 'md' : 'txt';
            downloadPlaygroundPrompt(format);
        });
    }

    if (playgroundRetryBtn) {
        playgroundRetryBtn.addEventListener('click', optimizePlaygroundPrompt);
    }

    if (playgroundRestoreBtn) {
        playgroundRestoreBtn.addEventListener('click', restoreOriginalPrompt);
    }

    if (playgroundManageUsecasesBtn) {
        playgroundManageUsecasesBtn.addEventListener('click', () => {
            loadCustomUseCases();
            openModal(customUsecasesModal);
        });
    }

    if (playgroundPurposeSelect) {
        playgroundPurposeSelect.addEventListener('change', (e) => {
            const value = e.target.value;
            if (value.startsWith('custom-')) {
                const id = value.replace('custom-', '');
                const customUC = customUseCases.find(uc => uc.id === id);
                if (customUC) {
                    playgroundInstructionsTextarea.value = customUC.instructions;
                }
            }
        });
    }

    if (addCustomUsecaseBtn) {
        addCustomUsecaseBtn.addEventListener('click', addCustomUseCase);
    }

    // Custom Use Cases Functions
    function loadCustomUseCases() {
        chrome.storage.local.get({ customUseCases: [] }, (result) => {
            customUseCases = result.customUseCases || [];
            renderCustomUseCasesList();
        });
    }

    const saveCustomUseCases = (callback) => {
        chrome.storage.local.set({ customUseCases: customUseCases }, () => {
            if (callback) callback();
        });
    };

    function addCustomUseCase() {
        const name = customUsecaseNameInput.value.trim();
        const instructions = customUsecaseInstructionsInput.value.trim();

        if (!name || !instructions) {
            alert('Please enter both a name and instructions for the custom use case.');
            return;
        }

        const id = Date.now().toString();
        customUseCases.push({ id, name, instructions });
        saveCustomUseCases(() => {
            customUsecaseNameInput.value = '';
            customUsecaseInstructionsInput.value = '';
            renderCustomUseCasesList();
            populatePurposeDropdown();
        });
    }

    const deleteCustomUseCase = (id) => {
        if (!confirm('Delete this custom use case?')) return;
        
        customUseCases = customUseCases.filter(uc => uc.id !== id);
        saveCustomUseCases(() => {
            renderCustomUseCasesList();
            populatePurposeDropdown();
        });
    };

    const renderCustomUseCasesList = () => {
        if (!customUsecasesList) return;

        if (customUseCases.length === 0) {
            customUsecasesList.innerHTML = '<p class="empty-message">No custom use cases yet. Add one above!</p>';
            return;
        }

        customUsecasesList.innerHTML = customUseCases.map(uc => `
            <div class="custom-usecase-item">
                <div class="custom-usecase-info">
                    <div class="custom-usecase-name">${escapeHtml(uc.name)}</div>
                    <div class="custom-usecase-instructions">${escapeHtml(uc.instructions)}</div>
                </div>
                <button class="custom-usecase-delete" data-id="${uc.id}" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3,6 5,6 21,6"></polyline>
                        <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2v2"></path>
                    </svg>
                </button>
            </div>
        `).join('');

        customUsecasesList.querySelectorAll('.custom-usecase-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteCustomUseCase(id);
            });
        });
    };

    function populatePurposeDropdown() {
        if (!playgroundPurposeSelect) return;

        const defaultOptions = [
            { value: '', label: 'Select use case...' },
            { value: 'text-generation', label: 'Text Generation' },
            { value: 'creative-writing', label: 'Creative Writing' },
            { value: 'code-generation', label: 'Code Generation' },
            { value: 'image-generation', label: 'Image Generation' },
            { value: 'data-analysis', label: 'Data Analysis' },
            { value: 'problem-solving', label: 'Problem Solving' },
            { value: 'technical-writing', label: 'Technical Writing' },
            { value: 'marketing-copy', label: 'Marketing Copy' },
            { value: 'educational', label: 'Educational Content' }
        ];

        let html = defaultOptions.map(opt =>
            `<option value="${opt.value}">${opt.label}</option>`
        ).join('');

        if (customUseCases.length > 0) {
            html += '<optgroup label="Custom">';
            customUseCases.forEach(uc => {
                html += `<option value="custom-${uc.id}">${escapeHtml(uc.name)}</option>`;
            });
            html += '</optgroup>';
        }

        playgroundPurposeSelect.innerHTML = html;
    }

    // --- Usage Tracking & Dashboard ---

    // Increment usage for a prompt
    const incrementUsage = (promptId) => {
        if (!promptId) return; // Should not happen but safety check

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const now = new Date().toISOString();

        // 1. Update Global Stats
        chrome.storage.local.get({ usageStats: {} }, (result) => {
            let stats = result.usageStats || {};
            if (!stats.dailyUsage) stats.dailyUsage = {};

            // Increment daily count
            stats.dailyUsage[today] = (stats.dailyUsage[today] || 0) + 1;

            // 2. Update Prompt Stats (in memory and storage)
            const promptIndex = allPrompts.findIndex(p => p.id === promptId);
            if (promptIndex !== -1) {
                const prompt = allPrompts[promptIndex];
                prompt.usageCount = (prompt.usageCount || 0) + 1;
                prompt.lastUsed = now;

                // Save both changes
                chrome.storage.local.set({
                    prompts: allPrompts,
                    usageStats: stats
                }, () => {
                    console.log('Usage tracked for prompt:', prompt.title);
                });
            }
        });
    };

    // Render Dashboard
    const renderDashboard = () => {
        const dashboardContainer = document.getElementById('dashboard-container');
        if (!dashboardContainer) return;

        // Fetch global stats for graph
        chrome.storage.local.get({ usageStats: {} }, (result) => {
            const stats = result.usageStats || {};
            const dailyUsage = stats.dailyUsage || {};

            // --- 1. Hero Stats ---
            const totalPrompts = allPrompts.length;
            const totalUsage = allPrompts.reduce((sum, p) => sum + (p.usageCount || 0), 0);
            const favoritesCount = allPrompts.filter(p => p.favorite).length;
            
            // Count unique categories and tags
            const categories = new Set(allPrompts.map(p => p.category).filter(Boolean));
            const tags = new Set(allPrompts.flatMap(p => p.tags || []));

            // Calculate time-based stats
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            
            // Start of today (midnight)
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            // Start of this week (Sunday)
            const dayOfWeek = now.getDay();
            const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
            
            // Start of this month
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            const monthKey = today.substring(0, 7);
            const weekStartStr = startOfWeek.toISOString().split('T')[0];
            
            // Initialize counters
            let monthPrompts = 0;
            let monthUsed = 0;
            let weekPrompts = 0;
            let weekUsed = 0;
            
            // Calculate prompts created this month/week
            allPrompts.forEach(p => {
                const created = new Date(p.createdAt);
                if (created >= startOfMonth) {
                    monthPrompts++;
                }
                if (created >= startOfWeek) {
                    weekPrompts++;
                }
            });
            
            // Calculate usage this month/week from dailyUsage
            Object.entries(dailyUsage).forEach(([date, count]) => {
                if (date.startsWith(monthKey)) {
                    monthUsed += count;
                }
                if (date >= weekStartStr) {
                    weekUsed += count;
                }
            });

            // Categories this month
            const monthCategories = new Set(
                allPrompts
                    .filter(p => new Date(p.createdAt) >= startOfMonth)
                    .map(p => p.category)
                    .filter(Boolean)
            ).size;
            
            // Categories this week
            const weekCategories = new Set(
                allPrompts
                    .filter(p => new Date(p.createdAt) >= startOfWeek)
                    .map(p => p.category)
                    .filter(Boolean)
            ).size;
            
            const statTotalPrompts = document.getElementById('stat-total-prompts');
            const statTotalUsage = document.getElementById('stat-total-usage');
            const statFavorites = document.getElementById('stat-favorites');
            const statCategories = document.getElementById('stat-categories');
            const statTags = document.getElementById('stat-tags');
            const statMonthPrompts = document.getElementById('stat-month-prompts');
            const statMonthUsed = document.getElementById('stat-month-used');
            const statMonthCategories = document.getElementById('stat-month-categories');
            const statWeekPrompts = document.getElementById('stat-week-prompts');
            const statWeekUsed = document.getElementById('stat-week-used');
            const statWeekCategories = document.getElementById('stat-week-categories');

            if (statTotalPrompts) statTotalPrompts.textContent = totalPrompts;
            if (statTotalUsage) statTotalUsage.textContent = totalUsage.toLocaleString();
            if (statFavorites) statFavorites.textContent = favoritesCount;
            if (statCategories) statCategories.textContent = categories.size;
            if (statTags) statTags.textContent = tags.size;
            if (statMonthPrompts) statMonthPrompts.textContent = monthPrompts;
            if (statMonthUsed) statMonthUsed.textContent = monthUsed;
            if (statMonthCategories) statMonthCategories.textContent = monthCategories;
            if (statWeekPrompts) statWeekPrompts.textContent = weekPrompts;
            if (statWeekUsed) statWeekUsed.textContent = weekUsed;
            if (statWeekCategories) statWeekCategories.textContent = weekCategories;

            // --- 2. Activity Chart (Last 7 Days) ---
            const chartContainer = document.getElementById('activity-chart');
            if (chartContainer) {
                const dates = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    dates.push(d.toISOString().split('T')[0]);
                }

                // Find max for scaling
                const maxUsage = Math.max(...dates.map(d => dailyUsage[d] || 0), 5);

                chartContainer.innerHTML = dates.map(date => {
                    const count = dailyUsage[date] || 0;
                    const heightPercent = Math.max((count / maxUsage) * 100, 8);
                    const dateObj = new Date(date);
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                    
                    return `
                        <div class="activity-bar-wrapper">
                            <div class="activity-bar-stack" title="${count} uses">
                                <div class="activity-bar created" style="height: ${heightPercent}%;"></div>
                            </div>
                            <span class="activity-bar-date">${dayName}</span>
                        </div>
                    `;
                }).join('');
            }

            // --- 3. Categories ---
            const categoryCounts = {};
            allPrompts.forEach(p => {
                const cat = p.category || 'Uncategorized';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });

            const categoryContainer = document.getElementById('category-bars');
            if (categoryContainer) {
                const sortedCategories = Object.entries(categoryCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 6);
                
                const maxCat = Math.max(...Object.values(categoryCounts), 1);
                
                if (sortedCategories.length === 0) {
                    categoryContainer.innerHTML = '<div class="empty-state">No categories yet</div>';
                } else {
                    categoryContainer.innerHTML = sortedCategories.map(([cat, count]) => {
                        const widthPercent = (count / maxCat) * 100;
                        return `
                            <div class="category-bar">
                                <span class="category-bar-label">${escapeHtml(cat)}</span>
                                <div class="category-bar-track">
                                    <div class="category-bar-fill" style="width: ${widthPercent}%;"></div>
                                </div>
                                <span class="category-bar-value">${count}</span>
                            </div>
                        `;
                    }).join('');
                }
            }

            // --- 4. Tags ---
            const tagCounts = {};
            allPrompts.forEach(p => {
                (p.tags || []).forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            });

            const tagsContainer = document.getElementById('tags-cloud');
            if (tagsContainer) {
                const sortedTags = Object.entries(tagCounts)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10);
                
                if (sortedTags.length === 0) {
                    tagsContainer.innerHTML = '<div class="empty-state">No tags yet</div>';
                } else {
                    tagsContainer.innerHTML = sortedTags.map(([tag, count]) => {
                        return `<span class="tag-pill">${escapeHtml(tag)} <span class="tag-pill-count">${count}</span></span>`;
                    }).join('');
                }
            }

            // --- 5. Recent Prompts ---
            const recentContainer = document.getElementById('recent-prompts-list');
            if (recentContainer) {
                const recentPrompts = [...allPrompts]
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                    .slice(0, 8);

                if (recentPrompts.length === 0) {
                    recentContainer.innerHTML = '<li class="empty-state">No prompts yet</li>';
                } else {
                    recentContainer.innerHTML = recentPrompts.map(p => {
                        const date = new Date(p.createdAt);
                        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        return `
                            <li data-prompt-id="${p.id}">
                                <span class="prompt-list-mini-title">${escapeHtml(p.title)}</span>
                                <span class="prompt-list-mini-date">${dateStr}</span>
                            </li>
                        `;
                    }).join('');

                    // Add click handlers
                    recentContainer.querySelectorAll('li[data-prompt-id]').forEach(li => {
                        li.addEventListener('click', () => {
                            const promptId = li.dataset.promptId;
                            const prompt = allPrompts.find(p => p.id === promptId);
                            if (prompt) {
                                panelTitle.textContent = prompt.title;
                                try {
                                    if (typeof markdownParser !== 'undefined') {
                                        panelText.innerHTML = markdownParser.parse(prompt.text);
                                    } else {
                                        panelText.textContent = prompt.text;
                                    }
                                } catch (error) {
                                    panelText.textContent = prompt.text;
                                }
                                currentPanelPromptText = prompt.text;
                                currentPanelPromptId = prompt.id;
                                isPromptEnhanced = false;
                                panelKeepBtn.classList.add('hidden');
                                promptViewPanel.classList.add('active');
                            }
                        });
                    });
                }
            }
        });
    };

    // Wire up Dashboard Button
    const dashboardBtn = document.getElementById('dashboard-btn');
    const dashboardContainer = document.getElementById('dashboard-container');

    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            setActiveMenuItem(dashboardBtn);

            // Hide other views
            promptListContainer.style.display = 'none';
            playgroundContainer.style.display = 'none';

            // Hide content header (search bar)
            const contentHeader = document.querySelector('.content-header');
            if (contentHeader) contentHeader.style.display = 'none';

            // Show Dashboard
            dashboardContainer.style.display = 'flex';

            // Render data
            renderDashboard();
        });
    }

});
