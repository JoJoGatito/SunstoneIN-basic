/**
 * @fileoverview Loads and displays featured events for each group using Supabase
 * with JSON fallback. Includes real-time updates, performance monitoring,
 * and error handling.
 * @version 3.0.0
 *
 * @typedef {Object} Event
 * @property {string} title - The event title
 * @property {string} date - The event date in ISO format
 * @property {string} [time] - Optional event time
 * @property {boolean} is_featured - Whether this is a featured event
 *
 * @typedef {Object} Group
 * @property {string} id - The group's unique identifier
 * @property {Event[]} events - Array of events associated with the group
 *
 * @typedef {Object} PerformanceMetrics
 * @property {string} totalTime - Total execution time in milliseconds
 * @property {string} queryTime - Database query time in milliseconds
 * @property {string} renderTime - DOM rendering time in milliseconds
 * @property {number} eventCount - Number of events processed
 * @property {string} timestamp - ISO timestamp of the operation
 */

/**
 * Displays an error message on the page with optional dismiss button
 * @param {string} message - The error message to display
 * @param {Object} [options] - Display options
 * @param {boolean} [options.dismissible=true] - Whether the error can be dismissed
 * @param {string} [options.type='error'] - Message type ('error' or 'warning')
 */
function showError(message) {
  console.error('Error:', message);
  const errorDiv = document.createElement('div');
  errorDiv.className = 'bg-red-900/20 border border-red-500 text-red-100 p-4 rounded-lg mb-6';
  errorDiv.innerHTML = `
    <div class="flex items-center">
      <i class="fas fa-exclamation-circle mr-2"></i>
      <span>${message}</span>
    </div>
    <button class="mt-2 text-sm text-red-400 hover:text-red-300" onclick="this.parentElement.remove()">
      Dismiss
    </button>
  `;
  document.body.prepend(errorDiv);
}

/**
 * Loads events from the JSON file as fallback when Supabase is unavailable
 * @returns {Promise<{groups: Group[]}>} The events data grouped by organization
 * @throws {Error} If the JSON file cannot be loaded or is invalid
 */
async function loadEventsFromJson() {
  const baseUrl = window.location.href.split('/').slice(0, -1).join('/') + '/';
  const response = await fetch(baseUrl + 'events.json');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Loads and displays featured events for each group using Supabase
 * Includes real-time updates, performance monitoring, and fallback handling
 * @async
 * @throws {Error} If events cannot be loaded or displayed
 * @returns {Promise<void>}
 */
async function loadGroupEvents() {
  console.log('Starting event load at:', new Date().toISOString());
  const startTime = performance.now();
  let queryEndTime;

  try {
    // Test Supabase connection first
    const { data: connectionTest, error: connectionError } = await supabase
      .from('events')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }
    console.log('Supabase connection successful');

    // Fetch featured events for all groups
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase not initialized');
    }

    // First get all groups
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name')
      .order('id');

    if (groupsError) throw groupsError;
    if (!groups) throw new Error('No groups found');

    // Then get all upcoming events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (eventsError) throw eventsError;
    if (!events) throw new Error('No events found');

    // Combine groups with their events
    const groupsWithEvents = groups.map(group => ({
      ...group,
      events: events
        .filter(event => event.group_id === group.id)
        .slice(0, 1) // Get only the next upcoming event
    }));

    // Log successful Supabase query
    queryEndTime = performance.now();
    console.log(`Supabase query completed in ${queryEndTime - startTime}ms`);
    if (queryEndTime - startTime > 500) {
      console.warn('Performance warning: Query time exceeded 500ms threshold');
    }

    // Process each group
    groupsWithEvents.forEach(group => {
      try {
        if (!group.id || !group.events) {
          console.error('Invalid group data:', group);
          return;
        }

        const groupCard = document.querySelector(`a[href="groups/${group.id}.html"]`);
        if (!groupCard) {
          console.log(`Group card not found for ${group.id}`);
          return;
        }

        // Sort events by date and get the next upcoming event
        const events = group.events.sort((a, b) => new Date(a.date) - new Date(b.date));
        const nextEvent = events[0];

        if (nextEvent) {
          let eventContainer = groupCard.querySelector('.group-event-container');
          if (!eventContainer) {
            eventContainer = document.createElement('div');
            eventContainer.className = 'group-event-container';
            groupCard.appendChild(eventContainer);
          }

          const eventDate = new Date(nextEvent.date).toLocaleDateString();
          eventContainer.innerHTML = `
            <div class="text-sm md:text-base bg-gray-800 p-3 md:p-4 rounded mt-2">
              <p class="text-yellow-500 font-bold text-base md:text-lg">Next Event: ${nextEvent.title}</p>
              <p class="mt-1 text-sm md:text-base">${eventDate}${nextEvent.time ? ' • ' + nextEvent.time : ''}</p>
            </div>
          `;
        }
      } catch (groupError) {
        console.error(`Error processing group ${group.id}:`, groupError);
        console.error('Error details:', {
          error: groupError,
          timestamp: new Date().toISOString(),
          groupId: group.id,
          type: groupError.name,
          stack: groupError.stack
        });
      }
    });

    // Log detailed performance metrics
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log('Performance metrics:', {
      totalTime: `${totalTime}ms`,
      queryTime: `${queryEndTime - startTime}ms`,
      renderTime: `${endTime - queryEndTime}ms`,
      eventCount: groupsWithEvents.reduce((count, group) => count + (group.events?.length || 0), 0),
      timestamp: new Date().toISOString()
    });

    // Check performance thresholds
    if (totalTime > 2000) {
      console.warn('Performance warning: Total load time exceeded 2s threshold');
    }
    if (queryEndTime - startTime > 500) {
      console.warn('Performance warning: Query time exceeded 500ms threshold');
    }

  } catch (error) {
    console.error('Error loading or processing events:', error);
    console.error('Error details:', {
      error,
      timestamp: new Date().toISOString(),
      type: error.name,
      stack: error.stack
    });
    await fallbackToJson();
  }
}

/**
 * Fallback to JSON data when Supabase is unavailable
 * @async
 */
async function fallbackToJson() {
  try {
    const jsonData = await loadEventsFromJson();
    if (!jsonData || !jsonData.groups) {
      throw new Error('Invalid JSON data structure');
    }

    // Process JSON data
    jsonData.groups.forEach(group => {
      if (!group.id || !group.events) return;

      const groupCard = document.querySelector(`a[href="groups/${group.id}.html"]`);
      if (!groupCard) return;

      // Start of current day for consistent comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingEvents = group.events.filter(event => {
        const eventDate = new Date(event.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
      }).sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA - dateB;
      });

      const nextEvent = upcomingEvents[0];
      if (nextEvent) {
        let eventContainer = groupCard.querySelector('.group-event-container');
        if (!eventContainer) {
          eventContainer = document.createElement('div');
          eventContainer.className = 'group-event-container';
          groupCard.appendChild(eventContainer);
        }

        eventContainer.innerHTML = `
          <div class="text-sm md:text-base bg-gray-800 p-3 md:p-4 rounded mt-2">
            <p class="text-yellow-500 font-bold text-base md:text-lg">Next Event: ${nextEvent.title}</p>
            <p class="mt-1 text-sm md:text-base">${nextEvent.date}${nextEvent.time ? ' • ' + nextEvent.time : ''}</p>
          </div>
        `;
      }
    });

    showError('Using local event data. Supabase connection unavailable.');
  } catch (error) {
    console.error('Error in JSON fallback:', error);
    showError('Unable to load events. Please try again later.');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', loadGroupEvents);

// Set up real-time subscription
const subscription = supabase
  .channel('featured_events')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'events',
      filter: 'is_featured=eq.true'
    },
    async (payload) => {
      console.log('Real-time update received:', payload);
      try {
        await loadGroupEvents();
      } catch (error) {
        console.error('Error handling real-time update:', error);
      }
    }
  )
  .subscribe((status) => {
    console.log('Subscription status:', status);
  });

// Cleanup subscription on page unload
window.addEventListener('unload', () => {
  subscription?.unsubscribe();
});