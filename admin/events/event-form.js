// State management
let currentEvent = null;
let allGroups = [];
let isEditMode = false;

/**
 * Initializes the event form component
 */
function initializeEventForm() {
  console.log("initializeEventForm called");
  
  // Set up form submission
  const eventForm = document.getElementById('event-form');
  console.log("Event form found:", !!eventForm);
  eventForm?.addEventListener('submit', handleFormSubmit);
  
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
  
  // Set up auth listeners
  window.supabase.auth.onAuthStateChange((event, session) => {
    handleAuthStateChange(session);
  });
  
  // Check current session
  window.supabase.auth.getSession().then(({ data: { session } }) => {
    handleAuthStateChange(session);
  });
  
  // Check if we're in edit mode (has ID in URL)
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');
  
  if (eventId) {
    isEditMode = true;
    document.getElementById('page-title').textContent = 'Edit Event';
    document.getElementById('save-button-text').textContent = 'Update Event';
  }
}

/**
 * Handles authentication state changes
 */
function handleAuthStateChange(session) {
  const currentUser = session?.user || null;
  
  if (currentUser) {
    // User is authenticated
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('not-authenticated').classList.add('hidden');
    document.getElementById('form-content').classList.remove('hidden');
    
    // Load groups for dropdown
    loadGroups();
    
    // If in edit mode, load event data
    if (isEditMode) {
      const urlParams = new URLSearchParams(window.location.search);
      const eventId = urlParams.get('id');
      if (eventId) {
        loadEvent(eventId);
      }
    }
  } else {
    // User is not authenticated
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('form-content').classList.add('hidden');
    document.getElementById('not-authenticated').classList.remove('hidden');
  }
}

/**
 * Validates a single field
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
 */
function validateForm() {
  const isTitleValid = validateField('event-title', 'title-error');
  const isDateValid = validateField('event-date', 'date-error');
  const isGroupValid = validateField('event-group', 'group-error');
  
  return isTitleValid && isDateValid && isGroupValid;
}

/**
 * Handles form submission
 */
async function handleFormSubmit(e) {
  e.preventDefault();
  console.log("Form submission started");
  
  // Validate the form
  if (!validateForm()) {
    console.log("Form validation failed - stopping submission");
    return;
  }
  
  // Double-check group selection specifically
  const groupValue = document.getElementById('event-group').value;
  if (!groupValue || groupValue === "") {
    console.error("Group validation failed despite form validation passing");
    document.getElementById('group-error').classList.remove('hidden');
    showToast('Please select a group for this event', 'error');
    return;
  }
  
  // Show loading state
  toggleSaveButton(true);
  
  try {
    // Get date value - already in YYYY-MM-DD format from input[type="date"]
    const dateInput = document.getElementById('event-date').value;
    
    // Use the date directly since database column is now proper DATE type
    const formattedDate = dateInput;
    
    const eventData = {
      title: document.getElementById('event-title').value.trim(),
      date: formattedDate,
      // Time inputs already return proper 24hr format (HH:mm)
      start_time: document.getElementById('event-time').value || null,
      end_time: document.getElementById('event-end-time').value || null,
      location: document.getElementById('event-location').value.trim() || null,
      description: document.getElementById('event-description').value.trim() || null,
      group_id: groupValue,
      is_featured: document.getElementById('event-featured').checked
    };
    
    console.log("Submitting event data:", JSON.stringify(eventData));
    
    // Save to Supabase
    if (isEditMode) {
      const { data, error } = await window.supabase
        .from('events')
        .update(eventData)
        .eq('id', currentEvent.id)
        .select();
        
      if (error) throw error;
      showToast('Event updated successfully', 'success');
    } else {
      const { data, error } = await window.supabase
        .from('events')
        .insert([eventData])
        .select();
        
      if (error) throw error;
      showToast('Event created successfully', 'success');
    }
    
    // Redirect back to events list
    setTimeout(() => {
      window.location.href = '../dashboard.html';
    }, 1000);
    
  } catch (error) {
    console.error('Error saving event:', error);
    showToast('Error saving event: ' + (error.message || 'Unknown error'), 'error');
    toggleSaveButton(false);
  }
}

/**
 * Loads groups for the dropdown
 */
async function loadGroups() {
  try {
    const { data: groups, error } = await window.supabase
      .from('groups')
      .select('id, name')
      .order('name');
      
    if (error) throw error;
    
    allGroups = groups || [];
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
    console.error('Error loading groups:', error);
    showToast('Error loading groups: ' + (error.message || 'Unknown error'), 'error');
  }
}

/**
 * Loads event data for editing
 */
async function loadEvent(eventId) {
  try {
    const { data: event, error } = await window.supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (error) throw error;
    
    currentEvent = event;
    
    // Populate form fields
    document.getElementById('event-title').value = event.title || '';
    // Date comes from DB as YYYY-MM-DD, which is exactly what input[type="date"] expects
    document.getElementById('event-date').value = event.date || '';
    // Times come from DB as HH:mm, which is exactly what input[type="time"] expects
    document.getElementById('event-time').value = event.start_time || '';
    document.getElementById('event-end-time').value = event.end_time || '';
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('event-group').value = event.group_id || '';
    document.getElementById('event-featured').checked = event.is_featured || false;
    document.getElementById('event-description').value = event.description || '';
    
  } catch (error) {
    console.error('Error loading event:', error);
    showToast('Error loading event: ' + (error.message || 'Unknown error'), 'error');
  }
}

/**
 * Toggles the save button's loading state
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
 * Shows a toast notification
 */
function showToast(message, type = 'success') {
  let toastContainer = document.getElementById('toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed bottom-4 right-4 z-50';
    document.body.appendChild(toastContainer);
  }
  
  const toast = document.createElement('div');
  toast.className = `px-4 py-3 rounded-lg shadow-lg ${
    type === 'success' ? 'bg-green-800 text-green-100' : 
    type === 'error' ? 'bg-red-800 text-red-100' : 
    'bg-blue-800 text-blue-100'
  }`;
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-circle' : 
               'information-circle';
               
  toast.innerHTML = `
    <i class="fas fa-${icon} mr-2"></i>
    <span>${message}</span>
  `;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
    if (toastContainer.children.length === 0) {
      toastContainer.remove();
    }
  }, 3000);
}