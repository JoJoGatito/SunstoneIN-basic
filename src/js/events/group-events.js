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
 * Formats a time string or timestamp into a clean 12-hour format
 * @param {string} timeStr - The time string to format (could be "4:00 PM" or a timestamp)
 * @returns {string} Formatted time string in 12-hour format
 */
function formatTimeDisplay(timeStr) {
  if (!timeStr) return '';
  
  // If already in 12-hour format with AM/PM, return as is
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    return timeStr;
  }
  
  try {
    let hours, minutes;
    
    // Handle ISO timestamp format (contains T or Z)
    if (timeStr.includes('T') || timeStr.includes('Z')) {
      const dateObj = new Date(timeStr);
      if (!isNaN(dateObj.getTime())) {
        hours = dateObj.getHours();
        minutes = dateObj.getMinutes();
      }
    }
    // Handle 24-hour time format (HH:MM)
    else if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    }
    // If we successfully parsed hours/minutes
    if (!isNaN(hours) && !isNaN(minutes)) {
      // Convert to 12-hour format
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
      const displayMinutes = minutes.toString().padStart(2, '0');
      return `${displayHours}:${displayMinutes} ${period}`;
    }
  } catch (e) {
    console.error('Error formatting time:', e);
  }
  
  // Return original if we couldn't format it
  return timeStr;
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

    // First get all groups - only select columns we know exist
    console.log('[group-events] Fetching groups');
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select('id, name')  // Only select fields we know exist
      .order('id');
    
    console.log('[group-events] Groups response:', { count: groups?.length, error: groupsError?.message });

    if (groupsError) throw groupsError;
    if (!groups) throw new Error('No groups found');

    // Then get all featured upcoming events
    const today = new Date().toISOString().split('T')[0];
    console.log('[group-events] Fetching featured events with date >=', today);
    let events, eventsError;
    
    const { data: featuredEvents, error: featuredEventsError } = await supabase
      .from('events')
      .select('*')
      .eq('is_featured', true)
      .gte('date', today)
      .order('date', { ascending: true });
      
    events = featuredEvents;
    eventsError = featuredEventsError;
      
    console.log('[group-events] Events response:', {
      count: events?.length,
      featured: events?.filter(e => e.is_featured).length,
      error: eventsError?.message
    });
    
    // If no featured events found, try again without the featured filter as fallback
    if (!events || events.length === 0) {
      console.log('[group-events] No featured events found, falling back to any upcoming events');
      const { data: fallbackEvents, error: fallbackError } = await supabase
        .from('events')
        .select('*')
        .gte('date', today)
        .order('date', { ascending: true })
        .limit(5);  // Limit to 5 to avoid too many events
        
      if (!fallbackError && fallbackEvents && fallbackEvents.length > 0) {
        console.log('[group-events] Found fallback events:', fallbackEvents.length);
        // Use fallback events instead
        events = fallbackEvents;
        eventsError = fallbackError;
      }
    }

    if (eventsError) throw eventsError;
    if (!events) throw new Error('No events found');

    // Combine groups with their events - handle various ways events might be linked to groups
    const groupsWithEvents = groups.map(group => {
      // Log what we're processing
      console.log('[group-events] Processing group:', { id: group.id, name: group.name });
      
      // Find events for this group with more flexible matching
      const groupEvents = events.filter(event => {
        if (!event) return false;
        
        // Log what we're checking
        console.log('[group-events] Checking event:', {
          id: event.id,
          title: event.title,
          event_group_id: event.group_id,
          target_group_id: group.id
        });
        
        // Primary match by group_id
        if (String(event.group_id) === String(group.id)) {
          console.log('[group-events] ✅ Matched by group_id');
          return true;
        }
        
        // Secondary match by group_name
        if (event.group_name &&
            String(event.group_name).toLowerCase() === String(group.name).toLowerCase()) {
          console.log('[group-events] ✅ Matched by group_name');
          return true;
        }
        
        return false;
      });
      
      console.log('[group-events] Events found for group:', {
        group_id: group.id,
        count: groupEvents.length
      });
      
      return {
        ...group,
        events: groupEvents
      };
    });

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
          // Instead of creating a bubble, update the existing card event section if it exists
          const eventSection = groupCard.closest('.card-group')?.querySelector('.card-group__event');
          
          if (eventSection) {
            const titleEl = eventSection.querySelector('.card-group__event-title');
            const timeEl = eventSection.querySelector('.card-group__event-time');
            const locationEl = eventSection.querySelector('.card-group__event-location');
            
            const eventDate = new Date(nextEvent.date).toLocaleDateString();
            
            // Update the existing card elements instead of creating a bubble
            if (titleEl) titleEl.textContent = nextEvent.title || 'TBD';
            // Get the time from either time or start_time field
            const timeValue = nextEvent.time || nextEvent.start_time || '';
            const formattedTime = formatTimeDisplay(timeValue);
            
            if (timeEl) timeEl.textContent = `${eventDate}${formattedTime ? ' • ' + formattedTime : ''}`;
            if (locationEl) locationEl.textContent = nextEvent.location || '';
          }
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
        // Instead of creating a bubble, update the existing card event section if it exists
        const eventSection = groupCard.closest('.card-group')?.querySelector('.card-group__event');
        
        if (eventSection) {
          const titleEl = eventSection.querySelector('.card-group__event-title');
          const timeEl = eventSection.querySelector('.card-group__event-time');
          const locationEl = eventSection.querySelector('.card-group__event-location');
          
          // Update the existing card elements instead of creating a bubble
          if (titleEl) titleEl.textContent = nextEvent.title || 'TBD';
          // Get the time from either time or start_time field
          const timeValue = nextEvent.time || nextEvent.start_time || '';
          const formattedTime = formatTimeDisplay(timeValue);
          
          if (timeEl) timeEl.textContent = `${nextEvent.date}${formattedTime ? ' • ' + formattedTime : ''}`;
          if (locationEl) locationEl.textContent = nextEvent.location || '';
        }
      }
    });

    showError('Using local event data. Supabase connection unavailable.');
  } catch (error) {
    console.error('Error in JSON fallback:', error);
    showError('Unable to load events. Please try again later.');
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Clean up any existing event bubbles
  document.querySelectorAll('.group-event-container').forEach(bubble => {
    bubble.parentNode.removeChild(bubble);
  });
  
  // Load group events
  loadGroupEvents();
});

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