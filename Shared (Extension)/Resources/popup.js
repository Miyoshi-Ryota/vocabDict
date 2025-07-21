// VocabDict Popup Script

document.addEventListener('DOMContentLoaded', async () => {
    // Check for pending lookup word from context menu
    try {
        const stored = await browser.storage.local.get(['pendingLookupWord', 'pendingLookupTimestamp']);
        if (stored.pendingLookupWord && stored.pendingLookupTimestamp) {
            // Check if the word is recent (within last 5 seconds)
            const age = Date.now() - stored.pendingLookupTimestamp;
            if (age < 5000) {
                console.log('VocabDict Popup: Found pending lookup word:', stored.pendingLookupWord);
                
                // Clear the pending word
                await browser.storage.local.remove(['pendingLookupWord', 'pendingLookupTimestamp']);
                
                // Trigger lookup
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = stored.pendingLookupWord;
                    searchInput.dispatchEvent(new Event('input'));
                }
            }
        }
    } catch (error) {
        console.error('VocabDict Popup: Error checking pending word:', error);
    }
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Theme handling
    const themeButtons = document.querySelectorAll('.theme-btn');
    let currentTheme = localStorage.getItem('vocabdict-theme') || 'auto';
    
    // Set initial theme
    applyTheme(currentTheme);
    updateThemeButtons(currentTheme);
    
    themeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            currentTheme = theme;
            localStorage.setItem('vocabdict-theme', theme);
            applyTheme(theme);
            updateThemeButtons(theme);
        });
    });
    
    function applyTheme(theme) {
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }
    
    function updateThemeButtons(activeTheme) {
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === activeTheme);
        });
    }
    
    // Dictionary search functionality
    const searchInput = document.getElementById('searchInput');
    const dictionaryContent = document.querySelector('#dictionary .placeholder');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Debounce search
        searchTimeout = setTimeout(() => {
            if (query.length > 0) {
                performDictionarySearch(query);
            } else {
                showDictionaryPlaceholder();
            }
        }, 300);
    });
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query.length > 0) {
                performDictionarySearch(query);
            }
        }
    });
    
    async function performDictionarySearch(word) {
        try {
            showDictionaryLoading();
            
            const response = await browser.runtime.sendMessage({
                type: 'lookup_word',
                payload: { word: word }
            });
            
            if (response.status === 'success') {
                showDictionaryResult(response.data);
            } else {
                showDictionaryError(response.error || 'Search failed');
            }
        } catch (error) {
            console.error('Dictionary search error:', error);
            showDictionaryError('Unable to search dictionary');
        }
    }
    
    function showDictionaryLoading() {
        dictionaryContent.innerHTML = `
            <div class="dictionary-loading">
                <div class="loading-spinner"></div>
                <p>Searching dictionary...</p>
            </div>
        `;
    }
    
    /**
     * Render word header with title and add button
     * @param {string} word - The word to display
     * @returns {string} HTML string
     */
    function renderWordHeader(word) {
        return `
            <div class="word-header">
                <h2 class="word-title">${escapeHtml(word)}</h2>
                <button class="add-word-btn" title="Add to vocabulary list">+ Add to List</button>
            </div>
        `;
    }
    
    /**
     * Render pronunciations section
     * @param {Array} pronunciations - Array of pronunciation objects
     * @returns {string} HTML string
     */
    function renderPronunciations(pronunciations) {
        if (!pronunciations || pronunciations.length === 0) return '';
        
        const pronunciationHTML = pronunciations
            .map(p => `<span class="pronunciation">${p.type}: ${escapeHtml(p.phonetic)}</span>`)
            .join('');
            
        return `<div class="pronunciations">${pronunciationHTML}</div>`;
    }
    
    /**
     * Render definitions section
     * @param {Array} definitions - Array of definition objects
     * @returns {string} HTML string
     */
    function renderDefinitions(definitions) {
        if (!definitions || definitions.length === 0) return '';
        
        const definitionsHTML = definitions.map((def, index) => `
            <div class="definition-item">
                <div class="definition-header">
                    <span class="part-of-speech">${def.partOfSpeech}</span>
                    <span class="definition-number">${index + 1}</span>
                </div>
                <p class="definition-meaning">${escapeHtml(def.meaning)}</p>
                ${renderExamples(def.examples)}
            </div>
        `).join('');
        
        return `<div class="definitions">${definitionsHTML}</div>`;
    }
    
    /**
     * Render examples for a definition
     * @param {Array} examples - Array of example sentences
     * @returns {string} HTML string
     */
    function renderExamples(examples) {
        if (!examples || examples.length === 0) return '';
        
        const examplesHTML = examples
            .map(example => `<p class="example">"${escapeHtml(example)}"</p>`)
            .join('');
            
        return `<div class="definition-examples">${examplesHTML}</div>`;
    }
    
    /**
     * Display dictionary search result
     * @param {Object} definition - The word definition object
     */
    function showDictionaryResult(definition) {
        const { word, pronunciations, definitions, synonyms, antonyms, examples } = definition;
        
        let html = `
            <div class="dictionary-result">
                ${renderWordHeader(word)}
                ${renderPronunciations(pronunciations)}
                ${renderDefinitions(definitions)}
        `;
        
        // Continue building HTML in next part
        
        // Synonyms and Antonyms
        if ((synonyms && synonyms.length > 0) || (antonyms && antonyms.length > 0)) {
            html += `<div class="word-relations">`;
            
            if (synonyms && synonyms.length > 0) {
                html += `
                    <div class="word-group">
                        <h4>Synonyms</h4>
                        <div class="word-tags">
                            ${synonyms.map(syn => `<span class="word-tag synonym">${escapeHtml(syn)}</span>`).join('')}
                        </div>
                    </div>
                `;
            }
            
            if (antonyms && antonyms.length > 0) {
                html += `
                    <div class="word-group">
                        <h4>Antonyms</h4>
                        <div class="word-tags">
                            ${antonyms.map(ant => `<span class="word-tag antonym">${escapeHtml(ant)}</span>`).join('')}
                        </div>
                    </div>
                `;
            }
            
            html += `</div>`;
        }
        
        // Additional examples
        if (examples && examples.length > 0) {
            html += `
                <div class="additional-examples">
                    <h4>Examples</h4>
                    ${examples.map(ex => `<p class="example">"${escapeHtml(ex)}"</p>`).join('')}
                </div>
            `;
        }
        
        html += `</div>`;
        dictionaryContent.innerHTML = html;
        
        // Add event listener for add button
        const addBtn = dictionaryContent.querySelector('.add-word-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                addWordToList(definition);
            });
        }
        
        // Add click listeners for synonym/antonym tags
        const wordTags = dictionaryContent.querySelectorAll('.word-tag');
        wordTags.forEach(tag => {
            tag.addEventListener('click', () => {
                const word = tag.textContent;
                searchInput.value = word;
                performDictionarySearch(word);
            });
        });
    }
    
    function showDictionaryError(error) {
        dictionaryContent.innerHTML = `
            <div class="dictionary-error">
                <div class="error-icon">❌</div>
                <p class="error-message">${escapeHtml(error)}</p>
                <p class="error-suggestion">Try a different word or check your spelling.</p>
            </div>
        `;
    }
    
    function showDictionaryPlaceholder() {
        dictionaryContent.innerHTML = `
            <div class="placeholder-icon">📚</div>
            <p>Search for English words to see definitions, examples, and more.</p>
        `;
    }
    
    async function addWordToList(definition) {
        
        try {
            const addBtn = dictionaryContent.querySelector('.add-word-btn');
            if (addBtn) {
                addBtn.disabled = true;
                addBtn.textContent = 'Adding...';
            }
            
            const messagePayload = {
                type: 'add_word_to_list',
                payload: {
                    wordData: {
                        word: definition.word,
                        definitions: definition.definitions
                    }
                }
            };
            
            const response = await browser.runtime.sendMessage(messagePayload);
            
            if (response.status === 'success') {
                if (addBtn) {
                    addBtn.textContent = '✓ Added';
                    addBtn.style.background = '#34C759';
                    addBtn.style.color = 'white';
                    
                    setTimeout(() => {
                        addBtn.textContent = '+ Add to List';
                        addBtn.style.background = '';
                        addBtn.style.color = '';
                        addBtn.disabled = false;
                    }, 2000);
                }
            } else {
                throw new Error(response.error || 'Failed to add word');
            }
        } catch (error) {
            console.error('DEBUG: Exception caught:', error);
            const addBtn = dictionaryContent.querySelector('.add-word-btn');
            if (addBtn) {
                addBtn.textContent = 'Error';
                addBtn.disabled = false;
                setTimeout(() => {
                    addBtn.textContent = '+ Add to List';
                }, 2000);
            }
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Settings toggles
    const autoAddToggle = document.getElementById('autoAddToggle');
    const reminderToggle = document.getElementById('reminderToggle');
    
    // Local settings cache to prevent race conditions
    let currentSettings = {};
    
    // Load settings
    loadSettings();
    
    async function loadSettings() {
        try {
            const response = await browser.runtime.sendMessage({
                type: 'get_settings',
                payload: {}
            });
            
            if (response && response.status === 'success') {
                currentSettings = response.data;
                autoAddToggle.checked = currentSettings.autoAddToList;
                reminderToggle.checked = currentSettings.dailyReviewReminder;
            } else {
                console.warn('Settings response:', response);
                // Use default settings
                currentSettings = {
                    autoAddToList: true,
                    dailyReviewReminder: false
                };
                autoAddToggle.checked = currentSettings.autoAddToList;
                reminderToggle.checked = currentSettings.dailyReviewReminder;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            // Use default settings on error
            currentSettings = {
                autoAddToList: true,
                dailyReviewReminder: false
            };
            autoAddToggle.checked = currentSettings.autoAddToList;
            reminderToggle.checked = currentSettings.dailyReviewReminder;
        }
    }
    
    // Save settings on change
    autoAddToggle.addEventListener('change', () => updateSetting('autoAddToList', autoAddToggle.checked));
    reminderToggle.addEventListener('change', () => updateSetting('dailyReviewReminder', reminderToggle.checked));
    
    async function updateSetting(key, value) {
        try {
            // Update local cache to prevent race conditions
            currentSettings[key] = value;
            
            await browser.runtime.sendMessage({
                type: 'update_settings',
                payload: { settings: currentSettings }
            });
        } catch (error) {
            console.error('Failed to update setting:', error);
            // Reload settings to sync with backend if update failed
            loadSettings();
        }
    }
    
    // Vocabulary Lists functionality
    let currentLists = [];
    let currentWords = [];
    
    async function loadVocabularyLists() {
        try {
            // Get all lists
            const listsResponse = await browser.runtime.sendMessage({
                type: 'get_all_lists',
                payload: {}
            });
            
            if (listsResponse.status === 'success') {
                currentLists = listsResponse.data;
                
                // Get all words
                const wordsResponse = await browser.runtime.sendMessage({
                    type: 'get_all_words',
                    payload: {}
                });
                
                if (wordsResponse.status === 'success') {
                    currentWords = wordsResponse.data;
                    renderVocabularyLists();
                }
            }
        } catch (error) {
            console.error('Failed to load vocabulary lists:', error);
        }
    }
    
    function renderVocabularyLists() {
        const listsContainer = document.getElementById('lists');
        
        if (currentLists.length === 0) {
            // Show empty state
            listsContainer.innerHTML = `
                <div class="placeholder">
                    <div class="placeholder-icon">📝</div>
                    <p>Your vocabulary lists will appear here.</p>
                    <p>Add words from dictionary searches to build your lists.</p>
                </div>
            `;
            return;
        }
        
        // Build lists HTML
        let html = '<div class="lists-container">';
        
        currentLists.forEach(list => {
            // Count words in this list
            const wordsInList = currentWords.filter(word => 
                list.wordIds.includes(word.id)
            );
            
            html += `
                <div class="list-card" data-list-id="${list.id}">
                    <div class="list-header">
                        <h3 class="list-name">${escapeHtml(list.name)}</h3>
                        <span class="word-count">${wordsInList.length} words</span>
                    </div>
                    ${list.description ? `<p class="list-description">${escapeHtml(list.description)}</p>` : ''}
                    <div class="list-words">
                        ${wordsInList.length > 0 ? renderWordsList(wordsInList, list.id) : '<p class="empty-list">No words yet</p>'}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        listsContainer.innerHTML = html;
        
        // Add event listeners for word removal
        listsContainer.querySelectorAll('.remove-word-btn').forEach(btn => {
            btn.addEventListener('click', handleRemoveWord);
        });
    }
    
    function renderWordsList(words, listId) {
        let html = '<div class="words-list">';
        
        words.forEach(word => {
            const primaryDef = word.definitions[0];
            html += `
                <div class="word-item" data-word-id="${word.id}">
                    <div class="word-info">
                        <span class="word-text">${escapeHtml(word.word)}</span>
                        <span class="word-definition">${escapeHtml(primaryDef.meaning)}</span>
                    </div>
                    <button class="remove-word-btn" data-word-id="${word.id}" data-list-id="${listId}" title="Remove from list">×</button>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    }
    
    async function handleRemoveWord(e) {
        const wordId = e.target.dataset.wordId;
        const listId = e.target.dataset.listId;
        
        try {
            const response = await browser.runtime.sendMessage({
                type: 'remove_word_from_list',
                payload: { wordId, listId }
            });
            
            if (response.status === 'success') {
                // Reload lists to update UI
                await loadVocabularyLists();
                
                // Show success feedback
                const wordItem = e.target.closest('.word-item');
                wordItem.style.opacity = '0';
                setTimeout(() => {
                    wordItem.remove();
                }, 300);
            }
        } catch (error) {
            console.error('Failed to remove word:', error);
        }
    }
    
    // Load lists when lists tab is clicked
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.dataset.tab === 'lists') {
                loadVocabularyLists();
            }
        });
    });
});