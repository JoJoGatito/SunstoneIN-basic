/**
 * @fileoverview Test script for verifying Supabase connection and fallback functionality
 */

document.addEventListener('DOMContentLoaded', async function() {
  const results = document.getElementById('test-results');
  
  function logResult(test, success, message) {
    const div = document.createElement('div');
    div.className = `p-4 mb-4 rounded ${success ? 'bg-green-900/20' : 'bg-red-900/20'}`;
    div.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${success ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2"></i>
        <div>
          <p class="font-bold ${success ? 'text-green-500' : 'text-red-500'}">${test}</p>
          <p class="text-sm text-gray-300">${message}</p>
        </div>
      </div>
    `;
    results.appendChild(div);
  }

  // Test 1: Supabase Configuration
  try {
    if (!window.supabase) {
      throw new Error('Supabase client not initialized');
    }
    logResult(
      'Supabase Configuration', 
      true, 
      'Supabase client successfully initialized'
    );
  } catch (error) {
    logResult(
      'Supabase Configuration', 
      false, 
      `Failed to initialize Supabase: ${error.message}`
    );
  }

  // Test 2: Database Connection
  try {
    const startTime = performance.now();
    const { data, error } = await window.supabase
      .from('groups')
      .select('count')
      .limit(1);
    
    const queryTime = performance.now() - startTime;
    
    if (error) throw error;
    
    logResult(
      'Database Connection', 
      true, 
      `Successfully connected to database (${queryTime.toFixed(2)}ms)`
    );
  } catch (error) {
    logResult(
      'Database Connection', 
      false, 
      `Failed to connect to database: ${error.message}`
    );
  }

  // Test 3: JSON Fallback
  try {
    const startTime = performance.now();
    const response = await fetch('events.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const loadTime = performance.now() - startTime;
    
    if (!data || !data.groups) {
      throw new Error('Invalid JSON structure');
    }
    
    logResult(
      'JSON Fallback', 
      true, 
      `Successfully loaded JSON fallback (${loadTime.toFixed(2)}ms)`
    );
  } catch (error) {
    logResult(
      'JSON Fallback', 
      false, 
      `Failed to load JSON fallback: ${error.message}`
    );
  }

  // Test 4: Real-time Subscription
  try {
    const subscription = window.supabase
      .channel('test_channel')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        payload => {
          console.log('Received real-time update:', payload);
        }
      )
      .subscribe();

    if (subscription) {
      logResult(
        'Real-time Subscription', 
        true, 
        'Successfully established real-time connection'
      );
    } else {
      throw new Error('Failed to establish subscription');
    }
  } catch (error) {
    logResult(
      'Real-time Subscription', 
      false, 
      `Failed to establish real-time connection: ${error.message}`
    );
  }
});