/**
 * @fileoverview Event form component for creating and editing events
 * Handles form validation, Supabase integration, and UI interactions
 * @version 1.0.0
 */

/**
 * @typedef {Object} EventData
 * @property {number} [id] - Event ID (absent for new events)
 * @property {string} title - Event title
 * @property {string} date - Event date in ISO format
 * @property {string} [time] - Optional event time
 * @property {string} [location] - Optional event location
 * @property {string} [description] - Optional event description
 * @property {number} group_id - Group ID this event belongs to
 * @property {boolean} is_featured - Whether this event is featured
 */

// State management
let currentEvent = null;
let allGroups = [];
let isEditMode = false;
let formVisible = false;

/**
 * Initializes the event form component
 */
function initializeEventForm() {
  // Check if the events view exists
  const eventsView = document.getElementById('events-view');
  if (!eventsView) return;
  
  // Create the form container if it doesn't exist
  if (!document.getElementById('event-form-container')) {
    createFormContainer();
  }
  
  // Set up event listeners
  setupFormEventListeners();
  
  // Load groups data for the dropdown
  loadGroupsData();
}

/**
 * Creates the form container and appends it to the events view
 */
function createFormContainer() {
  const container = document.createElement('div');
  container.id = 'event-form-container';
  container.className = 'hidden';
  
  // Add the form HTML
  container.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
      <div class="bg-gray-800 rounded-lg max-w-2xl w-full p-6 overflow-y-auto max-h-[90vh]">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold" id="form-title">Add New Event</h3>
          <button id="close-form" class="text-gray-400 hover:text-gray-200">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="event-form" class="space-y-4">
          <input type="hidden" id="event-id">
          
          <!-- Title Field -->
          <div>
            <label for="event-title" class="block text-sm font-medium text-gray-400 mb-1">Event Title <span class="text-red-500">*</span></label>
            <input type="text" id="event-title" class="bg-gray-700 border-gray-600 text-white w-full py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
            <p id="title-error" class="mt-1 text-sm text-red-500 hidden">Please enter a title</p>
          </div>
          
          <!-- Date & Time Fields -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label for="event-date" class="block text-sm font-medium text-gray-400 mb-1">Date <span class="text-red-500">*</span></label>
              <input type="date" id="event-date" class="bg-gray-700 border-gray-600 text-white w-full py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
              <p id="date-error" class="mt-1 text-sm text-red-500 hidden">Please select a date</p>
            </div>
            <div>
              <label for="event-time" class="block text-sm font-medium text-gray-400 mb-1">Time</label>
              <input type="time" id="event-time" class="bg-gray-700 border-gray-600 text-white w-full py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
          
          <!-- Location Field -->
          <div>
            <label for="event-location" class="block text-sm font-medium text-gray-400 mb-1">Location</label>
            <input type="text" id="event-location" class="bg-gray-700 border-gray-600 text-white w-full py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500">
          </div>
          
          <!-- Group Selection -->
          <div>
            <label for="event-group" class="block text-sm font-medium text-gray-400 mb-1">Group <span class="text-red-500">*</span></label>
            <select id="event-group" class="bg-gray-700 border-gray-600 text-white w-full py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
              <option value="">Select a group</option>
              <!-- Groups will be populated dynamically -->
            </select>
            <p id="group-error" class="mt-1 text-sm text-red-500 hidden">Please select a group</p>
          </div>
          
          <!-- Featured Toggle -->
          <div class="flex items-center">
            <input type="checkbox" id="event-featured" class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-600 rounded bg-gray-700">
            <label for="event-featured" class="ml-2 block text-sm text-gray-400">Featured Event</label>
          </div>
          
          <!-- Description Field -->
          <div>
            <label for="event-description" class="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea id="event-description" rows="4" class="bg-gray-700 border-gray-600 text-white w-full py-2 px-3 rounded-md focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>
          
          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button type="button" id="cancel-button" class="bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md">
              Cancel
            </button>
            <button type="submit" id="save-button" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center">
              <span id="save-button-text">Save Event</span>
              <span id="save-spinner" class="ml-2 hidden">
                <i class="fas fa-spinner fa-spin"></i>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  document.body.appendChild(container);
}

/**
 * Sets up event listeners for the form
 */
function setupFormEventListeners() {
  // Close form button
  document.getElementById('close-form')?.addEventListener('click', closeForm);
  
  // Cancel button
  document.getElementById('cancel-button')?.addEventListener('click', closeForm);
  
  // Form submission
  document.getElementById('event-form')?.addEventListener('submit', handleFormSubmit);
  
  // Add validation listeners to required fields
  document.getElementById('event-title')?.addEventListener('input', function() {
    validateField('event-title', 'title-error');
  });
  
  document.getElementById('event-date')?.addEventListener('input', function() {
    validateField('event-date', 'date-error');
  });
  
  document.getElementById('event-group')?.addEventListener('change', function() {
    validateField('event-group', 'group-error');
  });
}

/**
 * Validates a single field
 * @param {string} fieldId - The ID of the field to validate
 * @param {string} errorId - The ID of the error message element
 * @returns {boolean} - Whether the field is valid
 */
function validateField(fieldId, errorId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(errorId);
  
  if (!field.value.trim()) {
    errorElement.classList.remove('hidden');
    return false;
  } else {
    errorElement.classList.add('hidden');
    return true;
  }
}

/**
 * Validates the entire form
 * @returns {boolean} - Whether the form is valid
 */
function validateForm() {
  const isTitleValid = validateField('event-title', 'title-error');
  const isDateValid = validateField('event-date', 'date-error');
  const isGroupValid = validateField('event-group', 'group-error');
  
  return isTitleValid && isDateValid && isGroupValid;
}

/**
 * Handles the form submission
 * @param {Event} e - The submission event
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  
  // Validate the form
  if (!validateForm()) {
    return;
  }
  
  // Show loading state
  toggleSaveButton(true);
  
  try {
    // Gather form data
    const eventData = {
      title: document.getElementById('event-title').value.trim(),
      date: document.getElementById('event-date').value,
      time: document.getElementById('event-time').value || null,
      location: document.getElementById('event-location').value.trim() || null,
      description: document.getElementById('event-description').value.trim() || null,
      group_id: parseInt(document.getElementById('event-group').value),
      is_featured: document.getElementById('event-featured').checked
    };
    
    // Add ID if in edit mode
    if (isEditMode && currentEvent?.id) {
      eventData.id = currentEvent.id;
    }
    
    // Save to Supabase
    if (isEditMode) {
      await updateEvent(eventData);
    } else {
      await createEvent(eventData);
    }
    
    // Success - close form and refresh list
    closeForm();
    
    // Show success message
    showToast(`Event ${isEditMode ? 'updated' : 'created'} successfully`, 'success');
    
    // Refresh the events list
    if (typeof window.EventsList !== 'undefined' && window.EventsList.loadEventsData) {
      window.EventsList.loadEventsData();
    }
    
  } catch (error) {
    console.error('Error saving event:', error);
    showToast('Error saving event: ' + (error.message || 'Unknown error'), 'error');
    toggleSaveButton(false);
  }
}

/**
 * Toggles the save button's loading state
 * @param {boolean} isLoading - Whether the button should show loading state
 */
function toggleSaveButton(isLoading) {
  const saveButton = document.getElementById('save-button');
  const saveSpinner = document.getElementById('save-spinner');
  
  if (isLoading) {
    saveButton.disabled = true;
    saveButton.classList.add('opacity-75');
    saveSpinner.classList.remove('hidden');
  } else {
    saveButton.disabled = false;
    saveButton.classList.remove('opacity-75');
    saveSpinner.classList.add('hidden');
  }
}

/**
 * Creates a new event in Supabase
 * @param {EventData} eventData - The event data to save
 * @returns {Promise<Object>} The created event
 */
async function createEvent(eventData) {
  const { data, error } = await window.supabase
    .from('events')
    .insert([eventData])
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Updates an existing event in Supabase
 * @param {EventData} eventData - The event data to update
 * @returns {Promise<Object>} The updated event
 */
async function updateEvent(eventData) {
  const { id, ...updateData } = eventData;
  
  const { data, error } = await window.supabase
    .from('events')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

/**
 * Loads groups data for the dropdown
 * @async
 */
async function loadGroupsData() {
  try {
    const { data, error } = await window.supabase
      .from('groups')
      .select('id, name')
      .order('name');
      
    if (error) throw error;
    
    allGroups = data || [];
    
    // Populate the group dropdown
    const groupSelect = document.getElementById('event-group');
    
    // Clear existing options except the first one
    while (groupSelect.options.length > 1) {
      groupSelect.remove(1);
    }
    
    // Add groups
    allGroups.forEach(group => {
      const option = document.createElement('option');
      option.value = group.id;
      option.textContent = group.name;
      groupSelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading groups data:', error);
    showToast('Error loading groups: ' + (error.message || 'Unknown error'), 'error');
  }
}

/**
 * Shows the event form for creating a new event
 */
function showAddEventForm() {
  isEditMode = false;
  currentEvent = null;
  
  // Update form title
  document.getElementById('form-title').textContent = 'Add New Event';
  document.getElementById('save-button-text').textContent = 'Save Event';
  
  // Reset form fields
  document.getElementById('event-id').value = '';
  document.getElementById('event-title').value = '';
  document.getElementById('event-date').value = new Date().toISOString().split('T')[0]; // Today's date
  document.getElementById('event-time').value = '';
  document.getElementById('event-location').value = '';
  document.getElementById('event-group').value = '';
  document.getElementById('event-featured').checked = false;
  document.getElementById('event-description').value = '';
  
  // Clear validation errors
  document.querySelectorAll('.text-red-500').forEach(el => el.classList.add('hidden'));
  
  // Show the form
  document.getElementById('event-form-container').classList.remove('hidden');
  formVisible = true;
}

/**
 * Shows the event form for editing an existing event
 * @param {number} eventId - The ID of the event to edit
 */
async function showEditEventForm(eventId) {
  try {
    // Fetch the event data
    const { data: event, error } = await window.supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (error) throw error;
    
    isEditMode = true;
    currentEvent = event;
    
    // Update form title
    document.getElementById('form-title').textContent = 'Edit Event';
    document.getElementById('save-button-text').textContent = 'Update Event';
    
    // Populate form fields
    document.getElementById('event-id').value = event.id;
    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-date').value = event.date || '';
    document.getElementById('event-time').value = event.time || '';
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-group').value = event.group_id || '';
    document.getElementById('event-featured').checked = event.is_featured || false;
    document.getElementById('event-description').value = event.description || '';
    
    // Clear validation errors
    document.querySelectorAll('.text-red-500').forEach(el => el.classList.add('hidden'));
    
    // Show the form
    document.getElementById('event-form-container').classList.remove('hidden');
    formVisible = true;
    
  } catch (error) {
    console.error('Error loading event for editing:', error);
    showToast('Error loading event: ' + (error.message || 'Unknown error'), 'error');
  }
}

/**
 * Closes the event form
 */
function closeForm() {
  document.getElementById('event-form-container').classList.add('hidden');
  formVisible = false;
  toggleSaveButton(false);
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, info)
 */
function showToast(message, type = 'info') {
  // Use the existing showToast function if available
  if (typeof window.EventsList !== 'undefined' && typeof window.EventsList.showToast === 'function') {
    window.EventsList.showToast(message, type);
    return;
  }
  
  // If not available, create a simple alert
  alert(message);
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeEventForm);

// Export the API
window.EventForm = {
  showAddEventForm,
  showEditEventForm,
  closeForm,
  isFormVisible: () => formVisible
};