/**
 * @fileoverview Handles fetching and displaying local events from Supabase
 */

// Track loading and error states
let isLoading = true;
let loadError = null;

/**
 * Initializes the local events display
 */
async function initializeLocalEvents() {
  const eventsContainer = document.querySelector('.grid');
  
  try {
    showLoading(eventsContainer);
    const events = await fetchUpcomingEvents();
    
    if (events.length === 0) {
      showNoEvents(eventsContainer);
    } else {
      displayEvents(events, eventsContainer);
    }
    
  } catch (error) {
    console.error('Error loading events:', error);
    showError(eventsContainer, error);
  }
  
  // Initialize SimpleLightbox for event flyers
  new SimpleLightbox('.event-flyer', {
    captionPosition: 'bottom',
    widthRatio: 0.9,
    heightRatio: 0.9,
    disableScroll: true,
    closeText: '×',
    showCounter: false
  });
}

/**
 * Fetches upcoming events from Supabase
 */
async function fetchUpcomingEvents() {
  const today = new Date().toISOString().split('T')[0];
  
  const { data, error } = await window.supabase
    .from('local_events')
    .select('*')
    .gte('date', today)
    .order('date', { ascending: true });
    
  if (error) throw error;
  return data;
}

/**
 * Formats a date string into Month DD format
 */
function formatEventDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  return { month, day };
}

/**
 * Creates an event card element
 */
function createEventCard(event) {
  const { month, day } = formatEventDate(event.date);
  
  const card = document.createElement('article');
  card.className = 'bg-gray-900 rounded-lg overflow-hidden';
  
  const dateLabel = `Event date: ${new Date(event.date).toLocaleDateString()}`;
  if (event.time) {
    dateLabel += ` at ${event.time}`;
  }
  
  card.innerHTML = `
    <div class="relative">
      <div class="absolute top-4 left-4 bg-yellow-500 text-black font-bold px-3 py-2 rounded z-10" aria-label="${dateLabel}">
        <div class="text-sm">${month}</div>
        <div class="text-xl">${day}</div>
      </div>
      <div class="relative pt-[129.4%] bg-gray-800">
        ${event.image_url ? `
          <a href="${event.image_url}" class="event-flyer">
            <img src="${event.image_url}" alt="${event.title} event flyer" class="absolute inset-0 w-full h-full object-contain">
          </a>
        ` : `
          <div class="absolute inset-0 w-full h-full flex items-center justify-center text-gray-500">
            <i class="fas fa-image text-4xl"></i>
          </div>
        `}
      </div>
    </div>
    <div class="p-6">
      <h3 class="text-xl font-bold text-yellow-500 mb-2">${event.title}</h3>
      ${event.description ? `<p class="text-gray-300 mb-4">${event.description}</p>` : ''}
      <div class="flex items-center text-gray-400">
        <i class="fas fa-clock mr-2"></i>
        <span>${event.time || 'Time TBA'}${event.end_time ? ` - ${event.end_time}` : ''}</span>
      </div>
      <div class="flex items-center text-gray-400 mt-2">
        <i class="fas fa-map-marker-alt mr-2"></i>
        <span>${event.location}</span>
      </div>
      <div class="flex items-center text-gray-400 mt-2">
        <i class="fas fa-users mr-2"></i>
        <span>Community Focus: ${event.community_focus}</span>
      </div>
      <div class="flex items-center text-gray-400 mt-2">
        <i class="fas fa-volume-mute mr-2"></i>
        <span>Sensory-Friendly: ${event.sensory_rating}</span>
      </div>
    </div>
  `;
  
  return card;
}

/**
 * Displays events in the container
 */
function displayEvents(events, container) {
  container.innerHTML = ''; // Clear loading state
  events.forEach(event => {
    container.appendChild(createEventCard(event));
  });
}

/**
 * Shows loading state
 */
function showLoading(container) {
  container.innerHTML = `
    <div class="col-span-full text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
      <p class="mt-4 text-gray-400">Loading events...</p>
    </div>
  `;
}

/**
 * Shows no events message
 */
function showNoEvents(container) {
  container.innerHTML = `
    <div class="col-span-full text-center py-12">
      <i class="fas fa-calendar-times text-4xl text-gray-500 mb-4"></i>
      <p class="text-xl text-gray-400">No upcoming events found</p>
      <p class="mt-2 text-gray-500">Check back soon for new events!</p>
    </div>
  `;
}

/**
 * Shows error message
 */
function showError(container, error) {
  container.innerHTML = `
    <div class="col-span-full text-center py-12">
      <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
      <p class="text-xl text-red-400">Error loading events</p>
      <p class="mt-2 text-gray-500">${error.message || 'Please try again later'}</p>
    </div>
  `;
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeLocalEvents);