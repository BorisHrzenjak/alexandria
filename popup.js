document.addEventListener('DOMContentLoaded', () => {
    console.log('Alexandria popup loaded.');
    
    // DOM Elements
    const body = document.body;
    const settingsBtn = document.getElementById('settings-btn');
    const favoritesBtn = document.getElementById('favorites-btn');
    const addPromptBtn = document.getElementById('add-prompt-btn');
    const addPromptModal = document.getElementById('add-prompt-modal');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = addPromptModal.querySelector('.close-btn');
    const savePromptBtn = document.getElementById('save-prompt-btn');
    const promptListUl = document.getElementById('prompt-list');
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const promptTooltip = document.getElementById('prompt-tooltip'); // Get tooltip element
    const copyFeedback = document.getElementById('copy-feedback'); // Get feedback element
    const modalTitle = document.getElementById('modal-title'); // Get modal title element

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
            applyDarkMode(!!result.darkMode);
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
            promptTooltip.style.display = 'none'; // Ensure tooltip is hidden if list is empty
            return;
        }

        promptsToRender.forEach(prompt => {
            const li = document.createElement('li');
            li.classList.add('prompt-item');
            li.dataset.promptId = prompt.id;

            const tagsHtml = prompt.tags.map(tag => `#${escapeHtml(tag)}`).join(' ');
            const categoryHtml = prompt.category ? `<span class="prompt-item-category">${escapeHtml(prompt.category)}</span>` : '';

            li.innerHTML = `
                <div class="prompt-item-content">
                    <span class="prompt-item-title">${escapeHtml(prompt.title)}</span>
                    <div class="prompt-item-details">
                        ${categoryHtml}
                        <span class="prompt-item-tags">${tagsHtml}</span>
                    </div>
                </div>
                <div class="prompt-item-actions">
                    <button class="favorite-btn ${prompt.favorite ? 'favorited' : ''}" title="Favorite">${prompt.favorite ? '🌟' : '⭐'}</button>
                    <button class="edit-btn" title="Edit Prompt">✏️</button> 
                    <button class="delete-btn" title="Delete Prompt">🗑️</button>
                </div>
            `;
            // TODO: Add hover popup functionality

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
            
            // --- Tooltip Hover Logic --- 
            li.addEventListener('mouseenter', (e) => {
                // Use requestAnimationFrame to avoid layout thrashing & ensure element is ready
                requestAnimationFrame(() => {
                    promptTooltip.textContent = prompt.text;
                    promptTooltip.style.display = 'block';
    
                    // Position tooltip relative to the list item
                    const rect = li.getBoundingClientRect();
                    const popupRect = body.getBoundingClientRect(); // Get bounds of the popup window
    
                    let top = rect.bottom + 5; // Position below the item
                    let left = rect.left + 5; // Position slightly indented
    
                    // Adjust if tooltip goes off-screen vertically
                    if (top + promptTooltip.offsetHeight > popupRect.height - 10) { // 10px buffer
                        top = rect.top - promptTooltip.offsetHeight - 5; // Position above
                    }
                    // Adjust if tooltip goes off-screen horizontally
                    if (left + promptTooltip.offsetWidth > popupRect.width - 10) { 
                        left = popupRect.width - promptTooltip.offsetWidth - 10; // Align to right edge
                    }
                    // Ensure left doesn't go negative
                    left = Math.max(5, left);
    
                    promptTooltip.style.top = `${top}px`;
                    promptTooltip.style.left = `${left}px`;
                });
            });

            li.addEventListener('mouseleave', () => {
                promptTooltip.style.display = 'none';
                promptTooltip.textContent = ''; // Clear content
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
            favoritesBtn.classList.remove('active'); 
        }

        getPrompts(prompts => {
            let filteredPrompts = prompts.filter(prompt => {
                const titleMatch = prompt.title.toLowerCase().includes(searchTerm);
                const textMatch = prompt.text.toLowerCase().includes(searchTerm);
                const tagsMatch = prompt.tags.some(tag => tag.toLowerCase().includes(searchTerm));
                const categoryMatch = (selectedCategory === 'all' || prompt.category === selectedCategory);
                const searchMatch = titleMatch || textMatch || tagsMatch || categoryMatch;
                
                return categoryMatch && searchMatch;
            });

            // Apply favorites filter if active
            if (isFavoritesViewActive) {
                filteredPrompts = filteredPrompts.filter(prompt => prompt.favorite === true);
            }

            renderPromptList(filteredPrompts);
        });
    };

    // --- Initial Load --- 
    const loadAndRenderAll = () => {
        getPrompts((prompts) => {
            updateCategoryFilter(prompts); // Update filter before rendering
            filterAndRenderPrompts(); // Render based on initial filters
        });
        loadDarkModePreference();
    };

    loadAndRenderAll(); // Load prompts and dark mode setting when popup opens

    // --- Event Listeners for Filters ---
    searchInput.addEventListener('input', filterAndRenderPrompts);
    categoryFilter.addEventListener('change', filterAndRenderPrompts);

    // --- Modal Handling --- 
    const openModal = (modal) => {
        modal.style.display = 'block';
    };

    const closeModal = (modal) => {
        modal.style.display = 'none';
    };

    settingsBtn.addEventListener('click', () => openModal(settingsModal));

    addPromptBtn.addEventListener('click', () => {
        // Ensure modal is reset to 'Add New' state
        clearModalFields();
        openModal(addPromptModal);
        document.getElementById('prompt-title').focus(); // Focus title field
    });

    const closeBtns = document.querySelectorAll('.modal .close-btn'); // Get all modal close buttons

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Find the closest parent modal and close it
            const modalToClose = btn.closest('.modal');
            if (modalToClose) {
              closeModal(modalToClose);
            }
        });
    });

    // Close modal if clicking outside the content
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) { // Check if click is on the modal background
            closeModal(event.target);
        } 
    });

    // --- Actions --- 
    savePromptBtn.addEventListener('click', () => {
        const title = document.getElementById('prompt-title').value.trim();
        const text = document.getElementById('prompt-text').value.trim();
        const categoryInput = document.getElementById('prompt-category').value.trim();
        const category = categoryInput ? categoryInput.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'General';
        const tags = document.getElementById('prompt-tags').value.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag !== '');

        if (!title || !text) {
            alert('Title and Prompt Text are required.');
            return;
        }

        const editingId = addPromptModal.dataset.editingId;
        let updatedPrompts;

        if (editingId) {
            // --- Editing existing prompt ---
            updatedPrompts = allPrompts.map(p => {
                if (p.id === editingId) {
                    return {
                        ...p, // Preserve existing fields like favorite, createdAt, id
                        title: title,
                        text: text,
                        category: category,
                        tags: tags
                    };
                }
                return p;
            });
        } else {
            // --- Adding new prompt ---
            const newPrompt = {
                id: Date.now().toString(),
                title: title,
                text: text,
                category: category,
                tags: tags,
                favorite: false, // Default for new prompts
                createdAt: new Date().toISOString()
            };
            updatedPrompts = [...allPrompts, newPrompt];
        }

        savePrompts(updatedPrompts, () => {
            // These should run *after* the save is complete
            updateCategoryFilter(updatedPrompts); // Update filter dropdown
            filterAndRenderPrompts(); // Re-render the list
            closeModal(addPromptModal); // Close modal
            clearModalFields(); // Reset modal fields and state
        });
    });

    const deletePrompt = (promptId) => {
        if (!confirm('Are you sure you want to delete this prompt?')) {
            return;
        }
        const updatedPrompts = allPrompts.filter(p => p.id !== promptId);
        savePrompts(updatedPrompts, () => {
            updateCategoryFilter(updatedPrompts); // Update filter dropdown
            filterAndRenderPrompts(); // Re-render the list
        });
    };

    const toggleFavorite = (promptId) => {
        const updatedPrompts = allPrompts.map(p => {
            if (p.id === promptId) {
                return { ...p, favorite: !p.favorite };
            }
            return p;
        });
        savePrompts(updatedPrompts, filterAndRenderPrompts); // Save and re-render
    };

    const copyPromptText = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            console.log('Prompt copied to clipboard!');
            // Show feedback message
            copyFeedback.classList.add('show');
            // Hide after a short delay
            setTimeout(() => {
                copyFeedback.classList.remove('show');
            }, 1500); // 1.5 seconds
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy prompt.');
        });
    };
    
    const openEditModal = (promptId) => {
        const promptToEdit = allPrompts.find(p => p.id === promptId);
        if (!promptToEdit) {
            console.error('Prompt not found for editing:', promptId);
            return;
        }

        // Populate modal fields
        document.getElementById('prompt-title').value = promptToEdit.title;
        document.getElementById('prompt-text').value = promptToEdit.text;
        document.getElementById('prompt-category').value = promptToEdit.category || '';
        document.getElementById('prompt-tags').value = promptToEdit.tags.join(', ');

        // Set modal state for editing
        modalTitle.textContent = 'Edit Prompt';
        savePromptBtn.textContent = 'Update Prompt';
        addPromptModal.dataset.editingId = promptId; // Store the ID being edited

        openModal(addPromptModal);
    };
    
    // --- Utility ---
    function escapeHtml(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
     }

    function clearModalFields() {
        document.getElementById('prompt-title').value = '';
        document.getElementById('prompt-text').value = '';
        document.getElementById('prompt-category').value = '';
        document.getElementById('prompt-tags').value = '';
        // Reset modal state to 'Add New'
        modalTitle.textContent = 'Add New Prompt';
        savePromptBtn.textContent = 'Save Prompt';
        delete addPromptModal.dataset.editingId; // Remove editing state
    }

    // Favorites Button
    favoritesBtn.addEventListener('click', () => {
        isFavoritesViewActive = !isFavoritesViewActive; // Toggle state
        if (isFavoritesViewActive) {
            searchInput.value = ''; // Clear search
            categoryFilter.value = 'all'; // Reset category filter
            favoritesBtn.classList.add('active');
        } else {
            favoritesBtn.classList.remove('active');
        }
        clearModalFields(); // Reset modal state if switching views
        filterAndRenderPrompts(); // Re-render with new filter state
    });

}); // This should be the end of the DOMContentLoaded listener
