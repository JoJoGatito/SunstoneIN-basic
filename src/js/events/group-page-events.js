document.addEventListener('DOMContentLoaded', async function() {
  // Get current group ID from URL
  const groupId = window.location.pathname.split('/').pop().replace('.html', '');
  console.log('Current group ID:', groupId);

  // Performance tracking
  const startTime = performance.now();
  console.log('Starting event load at:', new Date().toISOString());

  // Connection status check
  try {
    const { data: connectionTest, error: connectionError } = await supabase.from('events').select('count').limit(1);
    if (connectionError) {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }
    console.log('Supabase connection successful');
  } catch (error) {
    console.error('Connection test failed:', error);
    showError('Unable to connect to event service. Please try again later.');
    return;
  }

  // Get the events container
  const eventsSection = document.evaluate(
    "//section[.//h2[contains(@class, 'text-yellow-500') and normalize-space(text())='Upcoming Events']]",
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;

  if (!eventsSection) {
    showError('Could not find "Upcoming Events" section');
    return;
  }

  // Function to display events
  function displayEvents(events, queryEndTime) {
    // Clear existing events
    const existingEvents = eventsSection.querySelector('.bg-gray-900');
    if (existingEvents) {
      existingEvents.remove();
    }

    // Sort events by date
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Create date formatter once for consistent formatting
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Display each upcoming event
    events.forEach((event, index) => {
      if (!event.title || !event.date) return;

      const eventDiv = document.createElement('div');
      eventDiv.className = 'bg-gray-900 p-6 rounded-lg' + (index < events.length - 1 ? ' mb-6' : '');
      
      eventDiv.innerHTML = `
        <h3 class="text-xl font-bold text-yellow-500 mb-2">
          ${event.title}
        </h3>
        
        <div class="flex items-center mb-3">
          <i class="far fa-calendar text-yellow-500 mr-2"></i>
          <span>${dateFormatter.format(new Date(event.date))}</span>
          ${event.start_time ? `
            <i class="far fa-clock text-yellow-500 ml-4 mr-2"></i>
            <span>${event.start_time}${event.end_time ? ` - ${event.end_time}` : ''}</span>
          ` : ''}
        </div>
        
        ${event.location ? `
          <div class="flex items-center mb-3">
            <i class="fas fa-map-marker-alt text-yellow-500 mr-2"></i>
            <span>${event.location}</span>
          </div>
        ` : ''}
        
        ${event.description ? `
          <p class="text-gray-300">
            ${event.description}
          </p>
        ` : ''}
      `;

      eventsSection.appendChild(eventDiv);
    });

    // Log detailed performance metrics
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log('Performance metrics:', {
      totalTime: `${totalTime}ms`,
      queryTime: `${queryEndTime - startTime}ms`,
      renderTime: `${endTime - queryEndTime}ms`,
      eventCount: events?.length || 0,
      timestamp: new Date().toISOString()
    });

    // Check performance thresholds
    if (totalTime > 2000) {
      console.warn('Performance warning: Total load time exceeded 2s threshold');
    }
    if (queryEndTime - startTime > 500) {
      console.warn('Performance warning: Query time exceeded 500ms threshold');
    }
  }

  // Function to show error messages
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
    eventsSection.prepend(errorDiv);
  }

  try {
    // Initial fetch of events
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('group_id', groupId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) throw error;

    // Check query performance
    const queryEndTime = performance.now();
    console.log(`Query completed in ${queryEndTime - startTime}ms`);

    if (!events || events.length === 0) {
      eventsSection.innerHTML += `
        <div class="bg-gray-900 p-6 rounded-lg text-center">
          <p class="text-gray-400">No upcoming events scheduled</p>
        </div>
      `;
      return;
    }

    displayEvents(events, queryEndTime);

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('events_channel')
      .on('postgres_changes', 
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `group_id=eq.${groupId}`
        },
        async (payload) => {
          console.log('Real-time update received:', payload);
          
          // Fetch updated events list
          const { data: updatedEvents, error: refreshError } = await supabase
            .from('events')
            .select('*')
            .eq('group_id', groupId)
            .gte('date', new Date().toISOString().split('T')[0])
            .order('date', { ascending: true });

          if (refreshError) {
            showError('Error refreshing events');
            return;
          }

          const refreshQueryEndTime = performance.now();
          displayEvents(updatedEvents, refreshQueryEndTime);
        }
      )
      .subscribe();

    // Cleanup subscription on page unload
    window.addEventListener('unload', () => {
      subscription.unsubscribe();
    });

  } catch (error) {
    const errorMessage = error.message || 'Error loading events';
    showError(errorMessage);
    console.error('Error details:', {
      error,
      timestamp: new Date().toISOString(),
      groupId,
      location: window.location.href,
      type: error.name,
      stack: error.stack
    });
    
    // Report error metrics
    const errorTime = performance.now();
    console.error('Error occurred after:', errorTime - startTime, 'ms');
  }
});