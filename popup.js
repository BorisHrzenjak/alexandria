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

    // Panel Elements
    const promptViewPanel = document.getElementById('prompt-view-panel');
    const panelTitle = document.getElementById('panel-prompt-title');
    const panelText = document.getElementById('panel-prompt-text');
    const panelCloseBtn = document.getElementById('panel-close-btn');
    const panelCopyBtn = document.getElementById('panel-copy-btn');

    let currentPanelPromptText = ''; // Store text for panel copy button

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
            });
        });
    });

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
