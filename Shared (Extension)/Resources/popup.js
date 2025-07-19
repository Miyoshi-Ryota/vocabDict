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
    
    // Search functionality (placeholder for Phase 2)
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (query.length > 0) {
            // Will implement in Phase 2
            console.log('Search for:', query);
        }
    });
    
    // Settings toggles
    const autoAddToggle = document.getElementById('autoAddToggle');
    const reminderToggle = document.getElementById('reminderToggle');
    
    // Load settings
    loadSettings();
    
    async function loadSettings() {
        try {
            const response = await browser.runtime.sendMessage({
                type: 'get_settings',
                payload: {}
            });
            
            if (response.status === 'success') {
                const settings = response.data;
                autoAddToggle.checked = settings.autoAddToList;
                reminderToggle.checked = settings.dailyReviewReminder;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
    
    // Save settings on change
    autoAddToggle.addEventListener('change', () => updateSetting('autoAddToList', autoAddToggle.checked));
    reminderToggle.addEventListener('change', () => updateSetting('dailyReviewReminder', reminderToggle.checked));
    
    async function updateSetting(key, value) {
        try {
            const response = await browser.runtime.sendMessage({
                type: 'get_settings',
                payload: {}
            });
            
            if (response.status === 'success') {
                const settings = response.data;
                settings[key] = value;
                
                await browser.runtime.sendMessage({
                    type: 'update_settings',
                    payload: { settings }
                });
            }
        } catch (error) {
            console.error('Failed to update setting:', error);
        }
    }
});