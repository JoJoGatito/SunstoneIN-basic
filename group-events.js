// Carousel functionality
function initializeCarousel() {
  console.log('Initializing carousel...');
  const marqueeContent = document.querySelector('.marquee-content');
  if (!marqueeContent) return;

  // Clone items for infinite scroll
  const items = Array.from(marqueeContent.children);
  items.forEach(item => {
    const clone = item.cloneNode(true);
    marqueeContent.appendChild(clone);
  });

  // Enhanced drag scroll functionality
  let isDragging = false;
  let startX;
  let startScrollLeft;
  let animationPaused = false;

  const startDragging = (e) => {
    console.log('Marquee: startDragging called', e.target.tagName, e.currentTarget.className);
    isDragging = true;
    marqueeContent.style.cursor = 'grabbing';
    startX = e.type === 'mousedown' ? e.pageX : e.touches[0].pageX;
    startScrollLeft = marqueeContent.scrollLeft;
    
    // Pause animation while dragging
    if (!animationPaused) {
      marqueeContent.style.animationPlayState = 'paused';
      animationPaused = true;
    }
  };

  const stopDragging = () => {
    isDragging = false;
    marqueeContent.style.cursor = 'grab';
    
    // Resume animation after dragging
    if (window.innerWidth > 767) {
      marqueeContent.style.animationPlayState = 'running';
      animationPaused = false;
    }
  };

  const drag = (e) => {
    if (!isDragging) return;
    console.log('Marquee: drag event', isDragging);
    e.preventDefault();
    const x = e.type === 'mousemove' ? e.pageX : e.touches[0].pageX;
    const walk = (x - startX) * 2; // Multiply by 2 for faster drag response
    marqueeContent.scrollLeft = startScrollLeft - walk;
  };

  // Mouse events
  marqueeContent.addEventListener('mousedown', startDragging);
  document.addEventListener('mousemove', drag, { passive: false });
  document.addEventListener('mouseup', stopDragging);
  
  // Touch events
  marqueeContent.addEventListener('touchstart', startDragging, { passive: true });
  marqueeContent.addEventListener('touchmove', drag, { passive: false });
  marqueeContent.addEventListener('touchend', stopDragging);
  
  // Prevent click events while dragging
  marqueeContent.addEventListener('click', (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Enhanced cleanup function
  return () => {
    marqueeContent.removeEventListener('mousedown', startDragging);
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDragging);
    marqueeContent.removeEventListener('touchstart', startDragging);
    marqueeContent.removeEventListener('touchmove', drag);
    marqueeContent.removeEventListener('touchend', stopDragging);
    marqueeContent.removeEventListener('click', stopDragging, true);
  };
}
// Load group events
function loadGroupEvents() {
  console.log('Loading group events...');
  const baseUrl = window.location.href.split('/').slice(0, -1).join('/') + '/';
  console.log('Attempting to fetch events.json from:', baseUrl + 'events.json');
  
  fetch(baseUrl + 'events.json')
    .then(response => {
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.groups || !Array.isArray(data.groups)) {
        throw new Error('Invalid JSON structure: missing or malformed groups array');
      }

      // Process each group in the JSON data
      data.groups.forEach(group => {
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

          const validEvent = group.events.find(event =>
            event && event.title && event.title.trim() &&
            event.date && event.date.trim()
          );

          if (validEvent) {
            let eventContainer = groupCard.querySelector('.group-event-container');
            if (!eventContainer) {
              eventContainer = document.createElement('div');
              eventContainer.className = 'group-event-container';
              groupCard.appendChild(eventContainer);
            }

            eventContainer.innerHTML = `
              <div class="text-sm md:text-base bg-gray-800 p-3 md:p-4 rounded mt-2">
                <p class="text-yellow-500 font-bold text-base md:text-lg">Next Event: ${validEvent.title}</p>
                <p class="mt-1 text-sm md:text-base">${validEvent.date}${validEvent.time ? ' • ' + validEvent.time : ''}</p>
              </div>
            `;
          }
        } catch (groupError) {
          console.error(`Error processing group ${group.id}:`, groupError);
        }
      });
    })
    .catch(error => {
      console.error('Error loading or processing events:', error);
      const errorDiv = document.createElement('div');
      errorDiv.style.backgroundColor = '#ff000033';
      errorDiv.style.padding = '10px';
      errorDiv.style.margin = '10px';
      errorDiv.style.border = '1px solid red';
      errorDiv.innerHTML = `<strong>Error loading events:</strong> ${error.message}`;
      document.body.prepend(errorDiv);
    });
}

document.addEventListener('DOMContentLoaded', function() {
  // Initialize carousel
  const cleanupCarousel = initializeCarousel();

  // Load group events
  loadGroupEvents();

  // Cleanup on page unload
  window.addEventListener('unload', () => {
    if (cleanupCarousel) cleanupCarousel();
  });

  // Fetch the events JSON file
  const baseUrl = window.location.href.split('/').slice(0, -1).join('/') + '/';
  console.log('Attempting to fetch events.json from:', baseUrl + 'events.json');
  fetch(baseUrl + 'events.json')
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers].map(h => h.join(': ')).join(', '));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data || !data.groups || !Array.isArray(data.groups)) {
        throw new Error('Invalid JSON structure: missing or malformed groups array');
      }

      // Process each group in the JSON data
      data.groups.forEach(group => {
        try {
          // Validate group data
          if (!group.id || !group.events) {
            console.error('Invalid group data:', group);
            return;
          }

          // Find the corresponding group card on the page using the group ID
          const groupCard = document.querySelector(`a[href="groups/${group.id}.html"]`);
          if (!groupCard) {
            console.log(`Group card not found for ${group.id}`);
            return;
          }

          // Get the first event with non-empty title and date
          const validEvent = group.events.find(event => 
            event && event.title && event.title.trim() && 
            event.date && event.date.trim()
          );

          if (validEvent) {
            // Create or update the event container
            let eventContainer = groupCard.querySelector('.group-event-container');
            if (!eventContainer) {
              eventContainer = document.createElement('div');
              eventContainer.className = 'group-event-container';
              groupCard.appendChild(eventContainer);
            }

            // Format the event information using the same structure as Youth Group card
            eventContainer.innerHTML = `
              <div class="text-sm md:text-base bg-gray-800 p-3 md:p-4 rounded mt-2">
                <p class="text-yellow-500 font-bold text-base md:text-lg">Next Event: ${validEvent.title}</p>
                <p class="mt-1 text-sm md:text-base">${validEvent.date}${validEvent.time ? ' • ' + validEvent.time : ''}</p>
              </div>
            `;
          }
        } catch (groupError) {
          console.error(`Error processing group ${group.id}:`, groupError);
        }
      });
    })
    .catch(error => {
      console.error('Error loading or processing events:', error);
      // Display error on page for easier debugging
      const errorDiv = document.createElement('div');
      errorDiv.style.backgroundColor = '#ff000033';
      errorDiv.style.padding = '10px';
      errorDiv.style.margin = '10px';
      errorDiv.style.border = '1px solid red';
      errorDiv.innerHTML = `<strong>Error loading events:</strong> ${error.message}`;
      document.body.prepend(errorDiv);
    });
});