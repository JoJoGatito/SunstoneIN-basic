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
  console.log("Events view element found:", !!eventsView);
  if (!eventsView) {
    console.error("Events view element not found - event management features will not work");
    return;
  }
  
  // Set up event listeners
  setupEventListeners();
  
  // Check if we should show events view directly
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('view') === 'events') {
    console.log("URL parameter 'view=events' detected, showing events view");
    showEventsView();
  }
}

/**
 * Sets up event listeners for the events management interface
 */
function setupEventListeners() {
  // Navigation events
  const navEvents = document.getElementById('nav-events');
  console.log("Nav events element found:", !!navEvents);
  navEvents?.addEventListener('click', function(e) {
    console.log("View events clicked");
    e.preventDefault();
    showEventsView();
  });
  
  const mobileNavEvents = document.getElementById('mobile-nav-events');
  console.log("Mobile nav events element found:", !!mobileNavEvents);
  mobileNavEvents?.addEventListener('click', function(e) {
    console.log("Mobile view events clicked");
    e.preventDefault();
    showEventsView();
  });
  
  const viewAllEvents = document.getElementById('view-all-events');
  console.log("View all events element found:", !!viewAllEvents);
  viewAllEvents?.addEventListener('click', function(e) {
    console.log("View all events clicked");
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
  
  // Add event button - DIRECT LINK METHOD
  const addEventButton = document.getElementById('add-event-button');
  console.log("Add event button found:", !!addEventButton);
  addEventButton?.addEventListener('click', function() {
    console.log("Add event button clicked");
    
    // Skip modal method completely and use direct navigation for reliability
    console.log("Using direct navigation to event form page");
    window.location.href = './events/event-form.html';
  });
}

/**
 * Shows the events management view
 */
function showEventsView() {
  console.log("showEventsView called");
  
  // Update URL to reflect the view
  const url = new URL(window.location);
  url.searchParams.set('view', 'events');
  window.history.pushState({}, '', url);
  
  // Update UI
  const dashboardView = document.getElementById('dashboard-view');
  const eventsView = document.getElementById('events-view');
  
  console.log("Dashboard view element found:", !!dashboardView);
  console.log("Events view element found:", !!eventsView);
  
  if (dashboardView) dashboardView.classList.add('hidden');
  if (eventsView) eventsView.classList.remove('hidden');
  
  // Add missing "Add Event" button if it doesn't exist
  const addButtonContainer = document.querySelector('#events-view .mb-6');
  console.log("Add button container found:", !!addButtonContainer);
  
  if (!addButtonContainer || !document.getElementById('add-event-button')) {
    console.log("Creating missing add event button container");
    const headerContainer = document.createElement('div');
    headerContainer.className = 'mb-6 flex items-center justify-between';
    headerContainer.innerHTML = `
      <h2 class="text-2xl font-bold">Events Management</h2>
      <button id="add-event-button" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center">
        <i class="fas fa-plus mr-2"></i>
        <span>Add Event</span>
      </button>
    `;
    
    // Insert at the beginning of events-view
    if (eventsView && eventsView.firstChild) {
      eventsView.insertBefore(headerContainer, eventsView.firstChild);
    } else if (eventsView) {
      eventsView.appendChild(headerContainer);
    }
    
    // Re-attach the event listener
    const newAddButton = document.getElementById('add-event-button');
    if (newAddButton) {
      console.log("Re-attaching add event button listener");
      newAddButton.addEventListener('click', function() {
        console.log("Add event button clicked");
        console.log("EventForm available:", typeof window.EventForm !== 'undefined');
        if (typeof window.EventForm !== 'undefined' && window.EventForm.showAddEventForm) {
          console.log("Using modal form for adding event");
          window.EventForm.showAddEventForm();
        } else {
          console.log("Falling back to standalone form page");
          window.location.href = './events/event-form.html';
        }
      });
    }
  }
  
  const headerTitle = document.querySelector('header h2');
  console.log("Header title element found:", !!headerTitle);
  if (headerTitle) headerTitle.textContent = 'Events Management';
  
  // Update navigation highlight
  document.querySelectorAll('nav a').forEach(link => {
    link.classList.remove('bg-gray-700', 'text-white');
    link.classList.add('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
  });
  
  document.getElementById('nav-events')?.classList.add('bg-gray-700', 'text-white');
  document.getElementById('nav-events')?.classList.remove('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
  
  document.getElementById('mobile-nav-events')?.classList.add('bg-gray-700', 'text-white');
  document.getElementById('mobile-nav-events')?.classList.remove('text-gray-300', 'hover:bg-gray-700', 'hover:text-white');
  
  // Ensure the events table structure exists
  ensureEventsTableExists(eventsView);
  
  // Load events data if not already loaded
  if (allEvents.length === 0) {
    loadEventsData();
  } else {
    // If events are already loaded, make sure the table is rendered
    renderEventsTable();
  }
  
  // Close mobile menu if open
  document.getElementById('mobile-sidebar')?.classList.add('hidden');
}

/**
 * Ensures the events table structure exists in the events view
 * @param {HTMLElement} eventsView - The events view container
 */
function ensureEventsTableExists(eventsView) {
  if (!eventsView) return;
  
  // Check if filters and table already exist
  const filtersExist = !!document.querySelector('#events-view .bg-gray-800.rounded-lg.p-4.mb-6');
  const tableExist = !!document.querySelector('#events-view .bg-gray-800.rounded-lg.overflow-hidden');
  
  console.log("Events filters exist:", filtersExist);
  console.log("Events table exists:", tableExist);
  
  if (!filtersExist) {
    console.log("Creating missing filters section");
    const filtersSection = document.createElement('div');
    filtersSection.className = 'bg-gray-800 rounded-lg p-4 mb-6';
    filtersSection.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Search -->
        <div class="col-span-1 md:col-span-2">
          <label for="event-search" class="block text-sm font-medium text-gray-400 mb-1">Search</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fas fa-search text-gray-500"></i>
            </div>
            <input id="event-search" type="text" class="bg-gray-700 border-gray-600 text-white w-full pl-10 pr-4 py-2 rounded-md focus:ring-blue-500 focus:border-blue-500">
          </div>
        </div>
        
        <!-- Group Filter -->
        <div>
          <label for="group-filter" class="block text-sm font-medium text-gray-400 mb-1">Group</label>
          <select id="group-filter" class="bg-gray-700 border-gray-600 text-white w-full py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500">
            <option value="">All Groups</option>
          </select>
        </div>
        
        <!-- Featured Filter -->
        <div>
          <label for="featured-filter" class="block text-sm font-medium text-gray-400 mb-1">Status</label>
          <select id="featured-filter" class="bg-gray-700 border-gray-600 text-white w-full py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500">
            <option value="">All Events</option>
            <option value="true">Featured Only</option>
            <option value="false">Not Featured</option>
          </select>
        </div>
      </div>
    `;
    eventsView.appendChild(filtersSection);
    
    // Re-attach event listeners for filters
    document.getElementById('event-search')?.addEventListener('input', function() {
      applyFiltersAndSort();
    });
    
    document.getElementById('group-filter')?.addEventListener('change', function() {
      applyFiltersAndSort();
    });
    
    document.getElementById('featured-filter')?.addEventListener('change', function() {
      applyFiltersAndSort();
    });
  }
  
  if (!tableExist) {
    console.log("Creating missing events table");
    const tableSection = document.createElement('div');
    tableSection.className = 'bg-gray-800 rounded-lg overflow-hidden';
    tableSection.innerHTML = `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-700">
          <thead class="bg-gray-700">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" data-sort="title">
                <div class="flex items-center">
                  <span>Event Name</span>
                  <span class="ml-1"><i class="fas fa-sort text-gray-500"></i></span>
                </div>
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" data-sort="date">
                <div class="flex items-center">
                  <span>Date/Time</span>
                  <span class="ml-1"><i class="fas fa-sort text-gray-500"></i></span>
                </div>
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" data-sort="group">
                <div class="flex items-center">
                  <span>Group</span>
                  <span class="ml-1"><i class="fas fa-sort text-gray-500"></i></span>
                </div>
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer" data-sort="featured">
                <div class="flex items-center">
                  <span>Featured</span>
                  <span class="ml-1"><i class="fas fa-sort text-gray-500"></i></span>
                </div>
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody id="events-table" class="bg-gray-800 divide-y divide-gray-700">
            <tr class="animate-pulse">
              <td colspan="5" class="px-6 py-4 text-center text-gray-400">Loading events...</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Pagination -->
      <div class="bg-gray-700 px-4 py-3 flex items-center justify-between">
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-400">
              Showing <span id="page-start">-</span> to <span id="page-end">-</span> of <span id="total-events-count">-</span> events
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button id="prev-page" class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700">
                <span class="sr-only">Previous</span>
                <i class="fas fa-chevron-left"></i>
              </button>
              <span id="pagination-numbers" class="relative inline-flex items-center px-4 py-2 border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400">
                Page <span id="current-page">1</span>
              </span>
              <button id="next-page" class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-600 bg-gray-800 text-sm font-medium text-gray-400 hover:bg-gray-700">
                <span class="sr-only">Next</span>
                <i class="fas fa-chevron-right"></i>
              </button>
            </nav>
          </div>
        </div>
      </div>
    `;
    eventsView.appendChild(tableSection);
    
    // Re-attach event listeners for table sorting and pagination
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
  }
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
      // Improved date sorting logic with validation
      let dateA = new Date(0); // Default to epoch start
      let dateB = new Date(0);
      
      if (aValue && !isNaN(new Date(aValue).getTime())) {
        dateA = new Date(aValue);
      }
      
      if (bValue && !isNaN(new Date(bValue).getTime())) {
        dateB = new Date(bValue);
      }
      
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
    // Log the date value to help debug the issue
    console.log(`Event ID ${event.id} date value:`, event.date);
    
    // Improved date parsing with validation
    let formattedDate = 'Invalid date';
    try {
      if (event.date) {
        // Try to parse the date more safely
        const dateObj = new Date(event.date);
        
        // Check if date is valid before formatting
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toLocaleDateString();
        } else {
          console.error(`Invalid date format for event ${event.id}:`, event.date);
        }
      } else {
        console.error(`Missing date for event ${event.id}`);
      }
    } catch (error) {
      console.error(`Error parsing date for event ${event.id}:`, error);
    }
    
    const row = document.createElement('tr');
    row.className = 'hover:bg-gray-700';
    row.setAttribute('data-event-id', event.id);
    
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-white">${event.title}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-300">${formattedDate}</div>
        <div class="text-sm text-gray-400">
          ${event.time ? event.time : 'No time specified'}
          ${event.time && event.end_time ? ' - ' + event.end_time : ''}
        </div>
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
      console.log("Edit button clicked for event:", eventId);
      
      console.log("EventForm available:", typeof window.EventForm !== 'undefined');
      console.log("showEditEventForm method available:",
        typeof window.EventForm !== 'undefined' && !!window.EventForm.showEditEventForm);
      
      // DEBUG: Check if form container exists
      const formContainer = document.getElementById('event-form-container');
      console.log("Form container exists:", !!formContainer);
      console.log("Form container HTML:", formContainer ? formContainer.outerHTML.substring(0, 100) + '...' : 'N/A');
      
      try {
        if (typeof window.EventForm !== 'undefined' && window.EventForm.showEditEventForm) {
          console.log("Using modal form for editing event");
          // Call the function directly but handle any errors
          window.EventForm.showEditEventForm(eventId);
          
          // DEBUG: Check form visibility after attempting to show it
          setTimeout(() => {
            const formContainer = document.getElementById('event-form-container');
            console.log("Form container visible after edit call:", formContainer && !formContainer.classList.contains('hidden'));
          }, 500);
        } else {
          console.log("Falling back to standalone form page");
          window.location.href = `./events/event-form.html?id=${eventId}`;
        }
      } catch (error) {
        console.error("Error showing edit form:", error);
        console.error("Error details:", error.message, error.stack);
        // Fallback to standalone form page if any error occurs
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