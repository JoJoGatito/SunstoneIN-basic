/**
 * @fileoverview Special configuration for Supabase on GitHub Pages
 * This script should be included BEFORE the supabase-config.js script
 */

// GitHub Pages environment detection
const isGitHubPages = window.location.hostname.includes('github.io');
console.log('GitHub Pages environment detected:', isGitHubPages);

// Store original fetch function to modify for GitHub Pages
const originalFetch = window.fetch;

if (isGitHubPages) {
  console.log('Applying GitHub Pages specific Supabase configuration');
  
  // Override fetch to handle CORS issues
  window.fetch = function(url, options = {}) {
    // Add debugging for Supabase requests
    if (url && url.toString().includes('supabase.co')) {
      console.log('Supabase request from GitHub Pages:', {
        url: url.toString(),
        method: options.method || 'GET',
        headers: options.headers || {}
      });
      
      // 2025 Update: Let Supabase handle CORS automatically
      // DO NOT manually set Origin header as it may interfere with browser's CORS handling
      // options.headers = options.headers || {};
      // options.headers['Origin'] = window.location.origin;
    }
    
    return originalFetch(url, options)
      .then(response => {
        // Log failed Supabase requests for debugging
        if (!response.ok && url && url.toString().includes('supabase.co')) {
          console.error('Supabase request failed:', {
            url: url.toString(),
            status: response.status,
            statusText: response.statusText
          });
        }
        return response;
      })
      .catch(error => {
        // Enhanced error logging for Supabase requests
        if (url && url.toString().includes('supabase.co')) {
          console.error('Supabase request exception:', {
            url: url.toString(),
            error: error.message,
            stack: error.stack
          });
          
          // Provide clearer error for CORS issues
          if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
            console.error(
              'CORS error detected! As of 2025, Supabase no longer uses dashboard settings for CORS. ' +
              'Checking if this is a preflight issue or needs a proxy...'
            );
            
            // Log request details to help diagnose
            console.error('Request details:', {
              url: url.toString(),
              method: options?.method || 'GET',
              hasCustomHeaders: options?.headers && Object.keys(options.headers).some(h =>
                !['content-type', 'authorization'].includes(h.toLowerCase())
              )
            });
          }
        }
        throw error;
      });
  };
  
  // Ensure localStorage fallback for GitHub Pages
  const storageCache = {};
  
  // Create localStorage wrapper in case it's restricted
  try {
    localStorage.setItem('supabase_test', 'test');
    localStorage.removeItem('supabase_test');
    console.log('LocalStorage is available on GitHub Pages');
  } catch (e) {
    console.warn('LocalStorage not available, using in-memory fallback');
    
    // Override localStorage with in-memory implementation
    Object.defineProperty(window, 'localStorage', {
      value: {
        setItem: function(key, value) {
          storageCache[key] = value;
        },
        getItem: function(key) {
          return storageCache[key] || null;
        },
        removeItem: function(key) {
          delete storageCache[key];
        },
        clear: function() {
          Object.keys(storageCache).forEach(key => delete storageCache[key]);
        }
      },
      writable: false
    });
  }
  
  // Add GitHub Pages domain to Supabase config
  window.GITHUB_PAGES_DOMAIN = window.location.hostname;
}