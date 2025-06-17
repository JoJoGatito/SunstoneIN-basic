/**
 * @fileoverview Events management interface for admin dashboard
 * Handles event listing, filtering, sorting, and CRUD operations
 * @version 1.0.0
 */

/**
 * @typedef {Object} EventData
 * @property {number} id - Event ID
 * @property {string} title - Event title
 * @property {string} date - Event date in ISO format
 * @property {string} [time] - Optional event time
 * @property {string} [location] - Optional event location
 * @property {string} [description] - Optional event description
 * @property {number} group_id - Group ID this event belongs to
 * @property {boolean} is_featured - Whether this event is featured
 */

// State management
let allEvents = [];
let filteredEvents = [];
let groups = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentSort = { field: 'date', direction: 'asc' };
let eventToDelete = null;

/**
 * Initializes the events management interface
 */
function initializeEventsList() {
  // Check if we're on the events management page
  const eventsView = document.getElementById('events-view');
  if (!eventsView) return;
  
  // Set up event listeners
  setupEventListeners();
  
  // Check if we should show events view directly
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'events') {
    showEventsView();
  }
}

/**
 * Sets up event listeners for the events management interface
 */
function setupEventListeners() {
  // Navigation events
  document.getElementById('nav-events')?.addEventListener('click', function(e) {
    e.preventDefault();
    showEventsView();
  });
  
  document.getElementById('mobile-nav-events')?.addEventListener('click', function(e) {
    e.preventDefault();
    showEventsView();
  });
  
  document.getElementById('view-all-events')?.addEventListener('click', function(e) {
    e.preventDefault();
    showEventsView();
  });
  
  // Filter and search events
  document.getElementById('event-search')?.addEventListener('input', function() {
    applyFiltersAndSort();
  });
  
  document.getElementById('group-filter')?.addEventListener('change', function() {
    applyFiltersAndSort();
  });
  
  document.getElementById('featured-filter')?.addEventListener('change', function() {
    applyFiltersAndSort();
  });
  
  // Pagination events
  document.getElementById('prev-page')?.addEventListener('click', function() {
    if (currentPage > 1) {
      currentPage--;
      renderEventsTable();
    }
  });
  
  document.getElementById('next-page')?.addEventListener('click', function() {
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      renderEventsTable();
    }
  });
  
  // Sorting events
  document.querySelectorAll('th[data-sort]').forEach(header => {
    header.addEventListener('click', function() {
      const field = this.getAttribute('data-sort');
      
      // Toggle direction if same field, otherwise default to ascending
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
      }
      
      // Update sort icons
      document.querySelectorAll('th[data-sort] .fas').forEach(icon => {
        icon.className = 'fas fa-sort text-gray-500 ml-1';
      });
      
      // Update active sort icon
      const icon = this.querySelector('.fas');
      icon.className = `fas fa-sort-${currentSort.direction === 'asc' ? 'up' : 'down'} text-blue-400 ml-1`;
      
      // Apply the sort
      applyFiltersAndSort();
    });
  });
  
  // Delete modal events
  document.getElementById('delete-cancel')?.addEventListener('click', function() {
    hideDeleteModal();
  });
  
  document.getElementById('delete-confirm')?.addEventListener('click', function() {
    if (eventToDelete) {
      deleteEvent(eventToDelete);
    }
    hideDeleteModal();
  });
  
  // Modal background click to close
  document.getElementById('delete-modal')?.addEventListener('click', function(e) {
    if (e.target === this) {
      hideDeleteModal();
    }
  });
  
  // Add event button
  document.getElementById('add-event-button')?.addEventListener('click', function() {
    if (typeof window.EventForm !== 'undefined' && window.EventForm.showAddEventForm) {
      window.EventForm.showAddEventForm();
    } else {
      // Fallback to standalone form page if modal form not available
      window.location.href = './events/event-form.html';
    }
  });
}

/**
 * Shows the events management view
 */
function showEventsView() {
  // Update URL to reflect the view
  const url = new URL(window.location);
  url.searchParams.set('view', 'events');
  window.history.pushState({}, '', url);
  
  // Update UI
  document.getElementById('dashboard-view').classList.add('hidden');
  document.getElementById('events-view').classList.remove('hidden');
  document.querySelector('header h2').textContent = 'Events Management';
  
  // Update navigation highlight
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.remove('bg-gray-700', 'text-white');
    link.classList.add('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
  });
  
  document.getElementById('nav-events')?.classList.add('bg-gray-700', 'text-white');
  document.getElementById('nav-events')?.classList.remove('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
  
  document.getElementById('mobile-nav-events')?.classList.add('bg-gray-700', 'text-white');
  document.getElementById('mobile-nav-events')?.classList.remove('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
  
  // Load events data if not already loaded
  if (allEvents.length === 0) {
    loadEventsData();
  }
  
  // Close mobile menu if open
  document.getElementById('mobile-sidebar')?.classList.add('hidden');
}

/**
 * Shows the dashboard view
 */
function showDashboardView() {
  // Update URL to reflect the view
  const url = new URL(window.location);
  url.searchParams.delete('view');
  window.history.pushState({}, '', url);
  
  // Update UI
  document.getElementById('dashboard-view').classList.remove('hidden');
  document.getElementById('events-view').classList.add('hidden');
  document.querySelector('header h2').textContent = 'Dashboard';
  
  // Update navigation highlight
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.remove('bg-gray-700', 'text-white');
    link.classList.add('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
  });
  
  document.querySelector('a[href="./index.html"]')?.classList.add('bg-gray-700', 'text-white');
  document.querySelector('a[href="./index.html"]')?.classList.remove('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
  
  // Close mobile menu if open
  document.getElementById('mobile-sidebar')?.classList.add('hidden');
}

/**
 * Loads events data from Supabase
 * @async
 */
async function loadEventsData() {
  try {
    // Clear table and show loading state
    document.getElementById('events-table').innerHTML = `
      <tr class="animate-pulse">
        <td colspan="5" class="px-6 py-4 text-center text-gray-400">Loading events...</td>
      </tr>
    `;
    
    // Fetch all groups first
    const { data: groupsData, error: groupsError } = await window.supabase
      .from('groups')
      .select('id, name')
      .order('name');
      
    if (groupsError) throw groupsError;
    
    groups = groupsData || [];
    
    // Populate group filter dropdown
    const groupFilter = document.getElementById('group-filter');
    groupFilter.innerHTML = '<option value="">All Groups</option>';
    
    groups.forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      groupFilter.appendChild(option);
    });
    
    // Fetch all events
    const { data: eventsData, error: eventsError } = await window.supabase
      .from('events')
      .select('*, groups(name)')
      .order('date', { ascending: false });
      
    if (eventsError) throw eventsError;
    
    allEvents = eventsData.map(event => ({
      ...event,
      group_name: event.groups?.name || 'Unknown Group'
    })) || [];
    
    // Apply initial filtering and sorting
    applyFiltersAndSort();
    
  } catch (error) {
    console.error('Error loading events data:', error);
    document.getElementById('events-table').innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-4 text-center text-red-400">
          Error loading events: ${error.message || 'Unknown error'}
        </td>
      </tr>
    `;
  }
}

/**
 * Applies filters and sorting to events data
 */
function applyFiltersAndSort() {
  const searchTerm = document.getElementById('event-search').value.toLowerCase();
  const groupFilter = document.getElementById('group-filter').value;
  const featuredFilter = document.getElementById('featured-filter').value;
  
  // Apply filters
  filteredEvents = allEvents.filter(event => {
    // Search term filter
    const matchesSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm) || 
      event.description?.toLowerCase().includes(searchTerm) || 
      event.location?.toLowerCase().includes(searchTerm) ||
      event.group_name.toLowerCase().includes(searchTerm);
      
    // Group filter
    const matchesGroup = groupFilter === '' || event.group_id.toString() === groupFilter;
    
    // Featured filter
    const matchesFeatured = featuredFilter === '' || 
      (featuredFilter === 'true' && event.is_featured) || 
      (featuredFilter === 'false' && !event.is_featured);
      
    return matchesSearch && matchesGroup && matchesFeatured;
  });
  
  // Apply sorting
  filteredEvents.sort((a, b) => {
    const aValue = a[currentSort.field];
    const bValue = b[currentSort.field];
    
    if (currentSort.field === 'date') {
      const dateA = new Date(aValue);
      const dateB = new Date(bValue);
      return currentSort.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
    if (currentSort.field === 'group') {
      const groupA = a.group_name.toLowerCase();
      const groupB = b.group_name.toLowerCase();
      return currentSort.direction === 'asc' 
        ? groupA.localeCompare(groupB) 
        : groupB.localeCompare(groupA);
    }
    
    if (currentSort.field === 'featured') {
      return currentSort.direction === 'asc' 
        ? (a.is_featured ? 1 : 0) - (b.is_featured ? 1 : 0)
        : (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
    }
    
    // Default string comparison for other fields
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return currentSort.direction === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    }
    
    // Fallback for other types
    return currentSort.direction === 'asc' 
      ? (aValue > bValue ? 1 : -1) 
      : (aValue < bValue ? 1 : -1);
  });
  
  // Reset to first page when filters change
  currentPage = 1;
  
  // Update the table
  renderEventsTable();
}

/**
 * Renders the events table with current data
 */
function renderEventsTable() {
  const tableBody = document.getElementById('events-table');
  const totalEvents = filteredEvents.length;
  
  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalEvents);
  const eventsToShow = filteredEvents.slice(startIndex, endIndex);
  
  // Update pagination info
  document.getElementById('page-start').textContent = totalEvents === 0 ? 0 : startIndex + 1;
  document.getElementById('page-end').textContent = endIndex;
  document.getElementById('total-events-count').textContent = totalEvents;
  document.getElementById('current-page').textContent = currentPage;
  
  // Enable/disable pagination buttons
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = endIndex >= totalEvents;
  
  // Update button styling
  document.getElementById('prev-page').classList.toggle('opacity-50', currentPage === 1);
  document.getElementById('next-page').classList.toggle('opacity-50', endIndex >= totalEvents);
  
  // Clear the table
  tableBody.innerHTML = '';
  
  // Check if no events to display
  if (eventsToShow.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="5" class="px-6 py-4 text-center text-gray-400">
          No events found. Try adjusting your filters.
        </td>
      </tr>
    `;
    return;
  }
  
  // Add events to the table
  eventsToShow.forEach(event => {
    const date = new Date(event.date);
    const formattedDate = date.toLocaleDateString();
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-700';
    row.setAttribute('data-event-id', event.id);
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-white">${event.title}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-300">${formattedDate}</div>
        <div class="text-sm text-gray-400">${event.time || 'No time specified'}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-300">${event.group_name}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${event.is_featured ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-300'}">
          ${event.is_featured ? 'Featured' : 'Not Featured'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex justify-end space-x-2">
          <button class="edit-event-btn text-blue-400 hover:text-blue-300" data-event-id="${event.id}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-event-btn text-red-400 hover:text-red-300" data-event-id="${event.id}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
  
  // Add event listeners for delete buttons
  document.querySelectorAll('.delete-event-btn').forEach(button => {
    button.addEventListener('click', function() {
      const eventId = this.getAttribute('data-event-id');
      showDeleteModal(eventId);
    });
  });
  
  // Add event listeners for edit buttons
  document.querySelectorAll('.edit-event-btn').forEach(button => {
    button.addEventListener('click', function() {
      const eventId = this.getAttribute('data-event-id');
      
      if (typeof window.EventForm !== 'undefined' && window.EventForm.showEditEventForm) {
        window.EventForm.showEditEventForm(eventId);
      } else {
        // Fallback to standalone form page if modal form not available
        window.location.href = `./events/event-form.html?id=${eventId}`;
      }
    });
  });
}

/**
 * Shows the delete confirmation modal
 * @param {string|number} eventId - The ID of the event to delete
 */
function showDeleteModal(eventId) {
  const modal = document.getElementById('delete-modal');
  modal.classList.remove('hidden');
  
  // Find the event to delete
  eventToDelete = allEvents.find(event => event.id.toString() === eventId.toString());
  
  if (eventToDelete) {
    // Update modal text with event name
    modal.querySelector('p').textContent = `Are you sure you want to delete "${eventToDelete.title}"? This action cannot be undone.`;
  }
}

/**
 * Hides the delete confirmation modal
 */
function hideDeleteModal() {
  const modal = document.getElementById('delete-modal');
  modal.classList.add('hidden');
  eventToDelete = null;
}

/**
 * Deletes an event from Supabase
 * @async
 * @param {Object} event - The event to delete
 */
async function deleteEvent(event) {
  try {
    // Delete the event from Supabase
    const { error } = await window.supabase
      .from('events')
      .delete()
      .eq('id', event.id);
      
    if (error) throw error;
    
    // Remove from local data
    allEvents = allEvents.filter(e => e.id !== event.id);
    
    // Update the table
    applyFiltersAndSort();
    
    // Show success toast
    showToast('Event deleted successfully', 'success');
    
  } catch (error) {
    console.error('Error deleting event:', error);
    showToast('Error deleting event: ' + (error.message || 'Unknown error'), 'error');
  }
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast ('success', 'error', etc)
 */
function showToast(message, type = 'info') {
  // Check if toast container exists, create if not
  let toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 z-50 flex flex-col space-y-2';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300 flex items-center ${
    type === 'success' ? 'bg-green-800 text-green-100' : 
    type === 'error' ? 'bg-red-800 text-red-100' : 
    'bg-blue-800 text-blue-100'
  }`;
  
  // Add icon based on type
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' : 
               'information-circle';
               
  toast.innerHTML = `
    <i class="fas fa-${icon} mr-2"></i>
    <span>${message}</span>
  `;
  
  // Add to container
  toastContainer.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.add('translate-y-0', 'opacity-100');
  }, 10);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      toast.remove();
      
      // Remove container if empty
      if (toastContainer.children.length === 0) {
        toastContainer.remove();
      }
    }, 300);
  }, 3000);
}

// Initialize the events management interface when DOM is ready
document.addEventListener('DOMContentLoaded', initializeEventsList);

// Export API
window.EventsList = {
  showEventsView,
  showDashboardView,
  refreshEvents: loadEventsData
};