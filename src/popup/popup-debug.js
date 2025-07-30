// Debug script for popup
document.addEventListener('DOMContentLoaded', function() {
    const debug = document.getElementById('debug');
    
    // Step 2: Check if external JavaScript works
    debug.innerHTML = '<p>Step 2: External JavaScript works!</p>';
    
    // Step 3: Check browser API
    if (typeof browser !== 'undefined') {
        debug.innerHTML += '<p>Step 3: browser API available!</p>';
    } else if (typeof chrome !== 'undefined') {
        debug.innerHTML += '<p>Step 3: chrome API available!</p>';
        window.browser = chrome;
    } else {
        debug.innerHTML += '<p style="color:red">Step 3: No browser API found!</p>';
    }
    
    // Step 4: Try to access storage
    try {
        if (window.browser && browser.storage) {
            debug.innerHTML += '<p>Step 4: Storage API available!</p>';
            
            // Step 5: Try to actually use storage
            browser.storage.local.get('test').then(result => {
                debug.innerHTML += '<p>Step 5: Storage access works!</p>';
            }).catch(err => {
                debug.innerHTML += '<p style="color:red">Step 5: Storage error: ' + err.message + '</p>';
            });
        }
    } catch (e) {
        debug.innerHTML += '<p style="color:red">Step 4: Storage error: ' + e.message + '</p>';
    }
    
    // Step 6: Check if we can load external files
    debug.innerHTML += '<p>Step 6: If you see this, external JS files work!</p>';
});