// State management
let currentEvent = null;
let isEditMode = false;
let imageFile = null;

/**
 * Initializes the local event form component
 */
function initializeLocalEventForm() {
  console.log("initializeLocalEventForm called");
  
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
  
  document.getElementById('event-location')?.addEventListener('input', function() {
    validateField('event-location', 'location-error');
  });
  
  document.getElementById('community-focus')?.addEventListener('change', function() {
    validateField('community-focus', 'community-focus-error');
  });
  
  document.getElementById('sensory-rating')?.addEventListener('change', function() {
    validateField('sensory-rating', 'sensory-rating-error');
  });

  // Set up image upload handling
  const imageInput = document.getElementById('event-image-input');
  const dropZone = imageInput?.closest('div');
  const imagePreview = document.getElementById('image-preview');
  const previewImg = document.getElementById('preview-img');

  // Handle file selection
  imageInput?.addEventListener('change', function(e) {
    handleImageSelection(e.target.files[0]);
  });

  // Handle drag and drop
  dropZone?.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('border-blue-500');
  });

  dropZone?.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('border-blue-500');
  });

  dropZone?.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('border-blue-500');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelection(file);
    }
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
    document.getElementById('page-title').textContent = 'Edit Local Event';
    document.getElementById('save-button-text').textContent = 'Update Event';
  }
}

/**
 * Handles image file selection
 */
function handleImageSelection(file) {
  if (!file) return;
  
  const allowedTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    showToast('Please upload a WebP, PNG, JPG, or GIF file', 'error');
    return;
  }
  
  imageFile = file;
  const reader = new FileReader();
  
  reader.onload = function(e) {
    const preview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    
    preview.classList.remove('hidden');
    previewImg.src = e.target.result;
  };
  
  reader.readAsDataURL(file);
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
  const isLocationValid = validateField('event-location', 'location-error');
  const isCommunityFocusValid = validateField('community-focus', 'community-focus-error');
  const isSensoryRatingValid = validateField('sensory-rating', 'sensory-rating-error');
  
  return isTitleValid && isDateValid && isLocationValid && 
         isCommunityFocusValid && isSensoryRatingValid;
}

/**
 * Uploads an image to Supabase Storage
 */
async function uploadEventImage(file) {
  if (!file) return null;
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;
  
  const { data, error } = await window.supabase.storage
    .from('local-event-images')
    .upload(filePath, file);
    
  if (error) throw error;
  
  const { data: { publicUrl } } = window.supabase.storage
    .from('local-event-images')
    .getPublicUrl(filePath);
    
  return publicUrl;
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
  
  // Show loading state
  toggleSaveButton(true);
  
  try {
    // Upload image if present
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadEventImage(imageFile);
    }
    
    // Get raw date value
    const dateInput = document.getElementById('event-date').value;
    console.log("Raw date input:", dateInput);
    
    // Parse the date with timezone awareness
    const parsedDate = new Date(dateInput + 'T12:00:00');
    console.log("Parsed date object:", parsedDate);
    
    // Format for Supabase (YYYY-MM-DD)
    const formattedDate = parsedDate.toISOString().split('T')[0];
    console.log("Formatted date for Supabase:", formattedDate);
    
    const eventData = {
      title: document.getElementById('event-title').value.trim(),
      date: formattedDate,
      start_time: document.getElementById('event-time').value || null,
      end_time: document.getElementById('event-end-time').value || null,
      location: document.getElementById('event-location').value.trim(),
      description: document.getElementById('event-description').value.trim() || null,
      community_focus: document.getElementById('community-focus').value,
      sensory_rating: document.getElementById('sensory-rating').value,
      image_url: imageUrl
    };
    
    console.log("Submitting event data:", JSON.stringify(eventData));
    
    // Save to Supabase
    if (isEditMode) {
      const { data, error } = await window.supabase
        .from('local_events')
        .update(eventData)
        .eq('id', currentEvent.id)
        .select();
        
      if (error) throw error;
      showToast('Event updated successfully', 'success');
    } else {
      const { data, error } = await window.supabase
        .from('local_events')
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
 * Loads event data for editing
 */
async function loadEvent(eventId) {
  try {
    const { data: event, error } = await window.supabase
      .from('local_events')
      .select('*')
      .eq('id', eventId)
      .single();
      
    if (error) throw error;
    
    currentEvent = event;
    
    // Populate form fields
    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-date').value = event.date || '';
    document.getElementById('event-time').value = event.start_time || '';
    document.getElementById('event-end-time').value = event.end_time || '';
    document.getElementById('event-location').value = event.location || '';
    document.getElementById('community-focus').value = event.community_focus || '';
    document.getElementById('sensory-rating').value = event.sensory_rating || '';
    document.getElementById('event-description').value = event.description || '';

    // Show image preview if exists
    if (event.image_url) {
      const preview = document.getElementById('image-preview');
      const previewImg = document.getElementById('preview-img');
      preview.classList.remove('hidden');
      previewImg.src = event.image_url;
    }
    
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