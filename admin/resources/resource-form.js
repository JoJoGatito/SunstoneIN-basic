// State variables
let currentUser = null;
let resourceId = null;
let initialSessionCheckComplete = false;

// Initialize when document is ready
async function initializeResourceForm() {
  console.log('[Resource Form] Initializing...');
  
  // Show loading initially
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('form-content').classList.add('hidden');
  document.getElementById('not-authenticated').classList.add('hidden');
  
  try {
    // Wait for both Auth and Supabase to be available
    while (!window.Auth || !window.supabase) {
      console.log('[Resource Form] Waiting for dependencies...');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Wait a moment for auth system to fully initialize
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Get initial session
    console.log('[Resource Form] Checking initial session...');
    const { data: { session }, error } = await window.supabase.auth.getSession();
    console.log('[Resource Form] Initial session check:', {
      hasSession: !!session,
      accessToken: !!session?.access_token,
      user: !!session?.user,
      error: error?.message
    });
    
    // Mark initial session check as complete
    initialSessionCheckComplete = true;
    
    if (error) {
      throw error;
    }
    
    if (!session || !session.access_token || !session.user) {
      console.log('[Resource Form] Invalid initial session, redirecting to login...');
      window.location.href = '../auth/login.html';
      return;
    }
    
    // Setup auth listeners for future changes
    window.supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('[Resource Form] Auth event received:', event, 'Session:', {
        hasSession: !!newSession,
        accessToken: !!newSession?.access_token,
        expiresAt: newSession?.expires_at,
        user: !!newSession?.user
      });
      
      if (event === 'SIGNED_OUT') {
        console.log('[Resource Form] Signed out, redirecting to login...');
        window.location.href = '../auth/login.html';
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        console.log('[Resource Form] Valid auth event, updating state...');
        handleAuthStateChange(newSession);
      }
    });
    
    // Initialize with current session
    handleAuthStateChange(session);
    
    // Set up form submission handler
    document.getElementById('resource-form')?.addEventListener('submit', handleSubmit);
    
    // Set up logout button
    document.getElementById('logout-button')?.addEventListener('click', function() {
      window.supabase.auth.signOut().then(() => {
        window.location.reload();
      });
    });
    
    // Check for resource ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    resourceId = urlParams.get('id');
    
    if (resourceId) {
      document.getElementById('page-title').textContent = 'Edit Resource';
      document.getElementById('save-button-text').textContent = 'Update Resource';
      await loadResource(resourceId);
    }
    
    // Load categories
    await loadCategories();
    
  } catch (error) {
    console.error('[Resource Form] Error during initialization:', error);
    window.location.href = '../auth/login.html';
  }
}

// Handle authentication state changes
function handleAuthStateChange(session) {
  console.log('[Resource Form] Handling auth state change:', {
    hasSession: !!session,
    accessToken: !!session?.access_token,
    expiresAt: session?.expires_at,
    user: !!session?.user,
    currentPath: window.location.pathname,
    initialCheckComplete: initialSessionCheckComplete
  });

  // Skip if initial session check isn't complete yet
  if (!initialSessionCheckComplete) {
    console.log('[Resource Form] Ignoring auth state change before initial check complete');
    return;
  }

  // Hide all states initially
  document.getElementById('loading').classList.remove('hidden');
  document.getElementById('form-content').classList.add('hidden');
  document.getElementById('not-authenticated').classList.add('hidden');
  
  try {
    if (!session?.user || !session?.access_token) {
      console.log('[Resource Form] Invalid session state, redirecting to login...');
      window.location.href = '../auth/login.html';
      return;
    }

    // Verify token expiration
    const tokenExpiry = session.expires_at * 1000; // Convert to milliseconds
    if (tokenExpiry <= Date.now()) {
      console.log('[Resource Form] Session expired, redirecting to login...');
      window.location.href = '../auth/login.html';
      return;
    }

    // Update internal state
    currentUser = session.user;

    // Update UI for authenticated user
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('loading').classList.add('hidden');
    document.getElementById('not-authenticated').classList.add('hidden');
    document.getElementById('form-content').classList.remove('hidden');
    
    console.log('[Resource Form] Authentication successful, user:', currentUser.email);
  } catch (error) {
    console.error('[Resource Form] Error handling auth state:', error);
    window.location.href = '../auth/login.html';
  }
}

// Load categories from Supabase
async function loadCategories() {
  try {
    const { data: categories, error } = await window.supabase
      .from('resource_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (error) throw error;
    
    const categorySelect = document.getElementById('resource-category');
    categorySelect.innerHTML = '<option value="">Select a category</option>';
    
    categories?.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = `${category.icon} ${category.name}`;
      categorySelect.appendChild(option);
    });
    
  } catch (error) {
    console.error('Error loading categories:', error);
    showToast('Error loading categories: ' + (error.message || 'Unknown error'), 'error');
  }
}

// Load existing resource for editing
async function loadResource(id) {
  try {
    const { data: resource, error } = await window.supabase
      .from('resources')
      .select('*, resource_categories(name)')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    if (!resource) {
      showToast('Resource not found', 'error');
      return;
    }
    
    // Populate form fields
    document.getElementById('resource-id').value = resource.id;
    document.getElementById('resource-name').value = resource.name;
    document.getElementById('resource-category').value = resource.category_id;
    document.getElementById('resource-description').value = resource.description;
    document.getElementById('resource-active').checked = resource.is_active;
    
    // Populate contact information
    if (resource.contact) {
      document.getElementById('contact-email').value = resource.contact.email || '';
      document.getElementById('contact-phone').value = resource.contact.phone || '';
    }
    
    // Populate hours information
    if (resource.hours) {
      document.getElementById('hours-weekday').value = resource.hours.weekday || '';
      document.getElementById('hours-weekend').value = resource.hours.weekend || '';
    }
    
  } catch (error) {
    console.error('Error loading resource:', error);
    showToast('Error loading resource: ' + (error.message || 'Unknown error'), 'error');
  }
}

// Handle form submission
async function handleSubmit(event) {
  event.preventDefault();
  
  // Clear previous error messages
  document.querySelectorAll('.text-red-500').forEach(el => el.classList.add('hidden'));
  
  // Get form values
  const name = document.getElementById('resource-name').value.trim();
  const categoryId = document.getElementById('resource-category').value;
  const description = document.getElementById('resource-description').value.trim();
  const isActive = document.getElementById('resource-active').checked;
  
  // Validate required fields
  let hasError = false;
  
  if (!name) {
    document.getElementById('name-error').classList.remove('hidden');
    hasError = true;
  }
  
  if (!categoryId) {
    document.getElementById('category-error').classList.remove('hidden');
    hasError = true;
  }
  
  if (!description) {
    document.getElementById('description-error').classList.remove('hidden');
    hasError = true;
  }
  
  // Validate contact information
  const email = document.getElementById('contact-email').value.trim();
  const phone = document.getElementById('contact-phone').value.trim();
  
  if (!email && !phone) {
    document.getElementById('contact-error').classList.remove('hidden');
    hasError = true;
  }
  
  if (hasError) return;
  
  // Show loading state
  const saveButton = document.getElementById('save-button');
  const saveSpinner = document.getElementById('save-spinner');
  saveButton.disabled = true;
  saveSpinner.classList.remove('hidden');
  
  try {
    // Prepare resource data
    const resourceData = {
      name,
      category_id: categoryId,
      description,
      is_active: isActive,
      contact: {
        email: email || null,
        phone: phone || null
      },
      hours: {
        weekday: document.getElementById('hours-weekday').value.trim() || null,
        weekend: document.getElementById('hours-weekend').value.trim() || null
      }
    };
    
    if (!resourceId) {
      // Create new resource
      resourceData.created_by = currentUser.id;
    }
    
    // Save to Supabase
    const { error } = await window.supabase
      .from('resources')
      [resourceId ? 'update' : 'insert'](resourceData)
      [resourceId ? 'eq' : 'select']('id', resourceId);
      
    if (error) throw error;
    
    // Show success message and redirect
    showToast(`Resource ${resourceId ? 'updated' : 'created'} successfully`);
    setTimeout(() => {
      window.location.href = '../dashboard.html';
    }, 1500);
    
  } catch (error) {
    console.error('Error saving resource:', error);
    showToast('Error saving resource: ' + (error.message || 'Unknown error'), 'error');
    
    // Reset button state
    saveButton.disabled = false;
    saveSpinner.classList.add('hidden');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
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