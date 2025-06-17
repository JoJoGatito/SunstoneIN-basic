/**
 * @fileoverview Diagnostic script to debug Supabase connection issues with GitHub Pages
 */

document.addEventListener('DOMContentLoaded', async function() {
  // Create a diagnostic container
  const debugContainer = document.createElement('div');
  debugContainer.id = 'supabase-debug';
  debugContainer.style.cssText = 'position: fixed; bottom: 10px; right: 10px; width: 400px; max-height: 500px; overflow-y: auto; background: rgba(0,0,0,0.8); color: #eee; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; z-index: 9999; border: 1px solid #555;';
  document.body.appendChild(debugContainer);
  
  function logDebug(message, type = 'info') {
    const colors = {
      info: '#88f',
      success: '#8f8',
      error: '#f88',
      warning: '#ff8'
    };
    
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    const entry = document.createElement('div');
    entry.style.borderBottom = '1px solid #333';
    entry.style.padding = '4px 0';
    entry.innerHTML = `<span style="color:${colors[type]}">[${type.toUpperCase()}]</span> ${message}`;
    debugContainer.appendChild(entry);
    debugContainer.scrollTop = debugContainer.scrollHeight;
  }

  // Check 1: Environment
  logDebug(`Running on: ${window.location.href}`);
  logDebug(`Is GitHub Pages: ${window.location.href.includes('github.io')}`);
  logDebug(`Protocol: ${window.location.protocol}`);
  
  // Check 2: Supabase Availability
  if (typeof supabase === 'undefined') {
    logDebug('Supabase client is not defined!', 'error');
    
    // Check if the script was loaded
    const supabaseScripts = Array.from(document.querySelectorAll('script')).filter(
      script => script.src && script.src.includes('supabase')
    );
    
    if (supabaseScripts.length === 0) {
      logDebug('No Supabase scripts found in the page', 'error');
    } else {
      supabaseScripts.forEach(script => {
        logDebug(`Found Supabase script: ${script.src}`);
      });
    }
    
    return;
  } else {
    logDebug('Supabase client is defined', 'success');
  }
  
  // Check 3: Supabase Configuration
  try {
    logDebug('Checking Supabase configuration...');
    logDebug(`Supabase URL configured: ${SUPABASE_URL}`);
    logDebug(`Supabase key length: ${SUPABASE_ANON_KEY.length} chars`);
  } catch (error) {
    logDebug(`Configuration error: ${error.message}`, 'error');
  }
  
  // Check 4: Connection test
  try {
    logDebug('Testing Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('events')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      logDebug(`Connection test failed: ${connectionError.message}`, 'error');
      
      // Analyze error
      if (connectionError.message.includes('CORS')) {
        logDebug('CORS issue detected - GitHub Pages domain likely not allowed in Supabase', 'error');
      }
      
      if (connectionError.message.includes('permission denied')) {
        logDebug('RLS policy issue detected - Anonymous access might be restricted', 'error');
      }
      
      if (connectionError.message.includes('network')) {
        logDebug('Network error - Check browser console for more details', 'error');
      }
    } else {
      logDebug('Connection test succeeded!', 'success');
    }
  } catch (error) {
    logDebug(`Error during connection test: ${error.message}`, 'error');
  }
  
  // Check 5: RLS Policies
  try {
    logDebug('Testing RLS policies...');
    const tables = ['events', 'groups'];
    
    for (const table of tables) {
      logDebug(`Testing read access to ${table} table...`);
      const { data, error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
      
      if (error) {
        logDebug(`Cannot read from ${table}: ${error.message}`, 'error');
      } else {
        logDebug(`Successfully read from ${table} table`, 'success');
      }
    }
  } catch (error) {
    logDebug(`Error testing RLS: ${error.message}`, 'error');
  }
  
  // Check 6: Browser Capabilities
  try {
    logDebug('Checking browser capabilities...');
    
    if (window.isSecureContext) {
      logDebug('Running in secure context', 'success');
    } else {
      logDebug('Not running in secure context - may cause issues', 'warning');
    }
    
    if (window.localStorage) {
      try {
        localStorage.setItem('supabase_test', 'test');
        localStorage.removeItem('supabase_test');
        logDebug('LocalStorage is available', 'success');
      } catch (e) {
        logDebug('LocalStorage is not available - may affect auth', 'warning');
      }
    }
  } catch (error) {
    logDebug(`Error checking browser: ${error.message}`, 'error');
  }
  
  // Add a toggle button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Toggle Debug Panel';
  toggleButton.style.cssText = 'position: fixed; bottom: 10px; right: 10px; z-index: 10000; padding: 5px 10px; background: #444; color: #fff; border: none; border-radius: 3px;';
  document.body.appendChild(toggleButton);
  
  toggleButton.addEventListener('click', function() {
    if (debugContainer.style.display === 'none') {
      debugContainer.style.display = 'block';
      toggleButton.style.bottom = '520px';
    } else {
      debugContainer.style.display = 'none';
      toggleButton.style.bottom = '10px';
    }
  });
  
  // Initially hide the debug container
  toggleButton.click();
});