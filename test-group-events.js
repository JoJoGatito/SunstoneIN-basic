/**
 * @fileoverview Test script for verifying group events functionality
 */

document.addEventListener('DOMContentLoaded', async function() {
  const results = document.getElementById('test-results');
  
  function logResult(test, success, message, details = '') {
    const div = document.createElement('div');
    div.className = `p-4 mb-4 rounded ${success ? 'bg-green-900/20' : 'bg-red-900/20'}`;
    div.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${success ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2"></i>
        <div>
          <p class="font-bold ${success ? 'text-green-500' : 'text-red-500'}">${test}</p>
          <p class="text-sm text-gray-300">${message}</p>
          ${details ? `<pre class="mt-2 text-xs text-gray-400 overflow-x-auto">${details}</pre>` : ''}
        </div>
      </div>
    `;
    results.appendChild(div);
  }

  // Test 1: Featured Events Query
  try {
    const startTime = performance.now();
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        id,
        events (*)
      `)
      .eq('events.is_featured', true);
    
    if (error) throw error;

    const queryTime = performance.now() - startTime;
    const eventCount = groups.reduce((count, group) => count + (group.events?.length || 0), 0);
    
    logResult(
      'Featured Events Query',
      true,
      `Successfully fetched featured events (${queryTime.toFixed(2)}ms)`,
      `Found ${eventCount} featured events across ${groups.length} groups`
    );
  } catch (error) {
    logResult(
      'Featured Events Query',
      false,
      `Failed to fetch featured events: ${error.message}`
    );
  }

  // Test 2: Group-Specific Events
  try {
    const groupId = 'sunstone-youth-group';
    const startTime = performance.now();
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('group_id', groupId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    const queryTime = performance.now() - startTime;
    
    logResult(
      'Group-Specific Events',
      true,
      `Successfully fetched events for ${groupId} (${queryTime.toFixed(2)}ms)`,
      `Found ${events.length} upcoming events`
    );
  } catch (error) {
    logResult(
      'Group-Specific Events',
      false,
      `Failed to fetch group events: ${error.message}`
    );
  }

  // Test 3: Real-time Event Updates
  try {
    const testGroupId = 'sunstone-youth-group';
    let updateReceived = false;

    const subscription = supabase
      .channel('test_events')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `group_id=eq.${testGroupId}`
        },
        payload => {
          updateReceived = true;
          console.log('Received event update:', payload);
        }
      )
      .subscribe();

    // Wait briefly to ensure subscription is established
    await new Promise(resolve => setTimeout(resolve, 1000));

    logResult(
      'Real-time Event Updates',
      true,
      'Successfully subscribed to event updates',
      `Monitoring changes for group: ${testGroupId}`
    );
  } catch (error) {
    logResult(
      'Real-time Event Updates',
      false,
      `Failed to subscribe to updates: ${error.message}`
    );
  }

  // Test 4: JSON Fallback for Events
  try {
    const startTime = performance.now();
    const response = await fetch('events.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const loadTime = performance.now() - startTime;

    // Validate JSON structure
    if (!data.groups || !Array.isArray(data.groups)) {
      throw new Error('Invalid JSON structure: missing groups array');
    }

    const eventCount = data.groups.reduce((count, group) => 
      count + (group.events?.length || 0), 0);

    logResult(
      'Events JSON Fallback',
      true,
      `Successfully loaded events from JSON (${loadTime.toFixed(2)}ms)`,
      `Found ${eventCount} events across ${data.groups.length} groups`
    );
  } catch (error) {
    logResult(
      'Events JSON Fallback',
      false,
      `Failed to load events from JSON: ${error.message}`
    );
  }

  // Test 5: Performance Monitoring
  try {
    const metrics = {
      totalLoadTime: 0,
      queryTimes: [],
      renderTimes: [],
      eventCounts: []
    };

    // Simulate multiple queries to test performance
    for (let i = 0; i < 3; i++) {
      const startTime = performance.now();
      
      const { data: groups, error } = await supabase
        .from('groups')
        .select(`
          id,
          events (*)
        `)
        .eq('events.is_featured', true);

      if (error) throw error;

      const queryTime = performance.now() - startTime;
      metrics.queryTimes.push(queryTime);
      
      const eventCount = groups.reduce((count, group) => 
        count + (group.events?.length || 0), 0);
      metrics.eventCounts.push(eventCount);
    }

    const avgQueryTime = metrics.queryTimes.reduce((a, b) => a + b, 0) / metrics.queryTimes.length;

    logResult(
      'Performance Monitoring',
      avgQueryTime < 500, // Success if average query time is under 500ms
      `Average query time: ${avgQueryTime.toFixed(2)}ms`,
      `Query times: ${metrics.queryTimes.map(t => t.toFixed(2)).join(', ')}ms\n` +
      `Event counts: ${metrics.eventCounts.join(', ')}`
    );
  } catch (error) {
    logResult(
      'Performance Monitoring',
      false,
      `Failed to measure performance: ${error.message}`
    );
  }
});