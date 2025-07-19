// VocabDict Popup Script

document.addEventListener('DOMContentLoaded', () => {
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
    
    function showDictionaryResult(definition) {
        const { word, pronunciations, definitions, synonyms, antonyms, examples } = definition;
        
        let html = `
            <div class="dictionary-result">
                <div class="word-header">
                    <h2 class="word-title">${escapeHtml(word)}</h2>
                    <button class="add-word-btn" title="Add to vocabulary list">+ Add to List</button>
                </div>
        `;
        
        // Pronunciations
        if (pronunciations && pronunciations.length > 0) {
            html += `<div class="pronunciations">`;
            pronunciations.forEach(p => {
                html += `<span class="pronunciation">${p.type}: ${escapeHtml(p.phonetic)}</span>`;
            });
            html += `</div>`;
        }
        
        // Definitions
        if (definitions && definitions.length > 0) {
            html += `<div class="definitions">`;
            definitions.forEach((def, index) => {
                html += `
                    <div class="definition-item">
                        <div class="definition-header">
                            <span class="part-of-speech">${def.partOfSpeech}</span>
                            <span class="definition-number">${index + 1}</span>
                        </div>
                        <p class="definition-meaning">${escapeHtml(def.meaning)}</p>
                `;
                
                if (def.examples && def.examples.length > 0) {
                    html += `<div class="definition-examples">`;
                    def.examples.forEach(example => {
                        html += `<p class="example">"${escapeHtml(example)}"</p>`;
                    });
                    html += `</div>`;
                }
                
                html += `</div>`;
            });
            html += `</div>`;
        }
        
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
            addBtn.addEventListener('click', () => addWordToList(definition));
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
            
            const response = await browser.runtime.sendMessage({
                type: 'add_word',
                payload: {
                    wordData: {
                        word: definition.word,
                        definitions: definition.definitions
                    }
                }
            });
            
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
            console.error('Error adding word:', error);
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
});