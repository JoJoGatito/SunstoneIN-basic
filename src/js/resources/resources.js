// State management
let resources = [];
let categories = [];
let currentCategory = 'all';

// DOM Elements
const resourcesGrid = document.getElementById('resources-grid');
const modal = document.getElementById('resource-modal');
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator flex items-center justify-center p-8';
loadingIndicator.innerHTML = `
  <div class="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
`;

/**
 * Displays an error message on the page with optional dismiss button
 * @param {string} message - The error message to display
 */
function showError(message) {
  console.error('Error:', message);
  resourcesGrid.innerHTML = `
    <div class="col-span-full text-center p-8">
      <div class="bg-red-900/20 border border-red-500 text-red-100 p-4 rounded-lg mb-6">
        <div class="flex items-center">
          <i class="fas fa-exclamation-circle mr-2"></i>
          <span>${message}</span>
        </div>
        <button class="mt-2 text-sm text-red-400 hover:text-red-300" onclick="this.parentElement.remove()">
          Dismiss
        </button>
      </div>
    </div>
  `;
}

/**
 * Loads resources from the JSON file as fallback when Supabase is unavailable
 * @returns {Promise<{resources: Array, categories: Array}>} The resources and categories data
 * @throws {Error} If the JSON file cannot be loaded or is invalid
 */
async function loadResourcesFromJson() {
  const baseUrl = window.location.href.split('/').slice(0, -1).join('/') + '/';
  const response = await fetch(baseUrl + 'resources.json');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

/**
 * Loads and displays resources using Supabase
 * Includes real-time updates, performance monitoring, and fallback handling
 * @async
 * @throws {Error} If resources cannot be loaded or displayed
 * @returns {Promise<void>}
 */
async function initializeResources() {
  showLoading();
  console.log('Starting resources load at:', new Date().toISOString());
  const startTime = performance.now();
  let queryEndTime;

  try {
    // Test Supabase connection first
    if (typeof supabase === 'undefined') {
      throw new Error('Supabase not initialized');
    }

    const { data: connectionTest, error: connectionError } = await supabase
      .from('resources')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }
    console.log('Supabase connection successful');

    // First get all categories
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('resource_categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (categoriesError) throw categoriesError;
    if (!categoriesData) throw new Error('No categories found');
    
    categories = categoriesData;
    console.log('Categories loaded:', categories);

    // Then get all resources
    const { data: resourcesData, error: resourcesError } = await supabase
      .from('resources')
      .select('*, category:category_id(name, icon)')
      .eq('is_active', true)
      .order('name');

    if (resourcesError) throw resourcesError;
    if (!resourcesData) throw new Error('No resources found');
    
    // Transform the data to match the expected format
    resources = resourcesData.map(resource => {
      // Only name and description are required
      if (!resource.name || !resource.description) {
        console.error('Resource missing required fields:', resource);
        return null;
      }
      
      return {
        id: resource.id,
        name: resource.name,
        description: resource.description,
        // All other fields are optional
        category: resource.category_id,
        location: resource.location || null,
        website: resource.website || null,
        contact: resource.contact || {},
        hours: resource.hours || {},
        tags: resource.tags || [],
        // Use the joined category data for display
        categoryName: resource.category?.name || 'Unknown',
        categoryIcon: resource.category?.icon || '📍'
      };
    }).filter(Boolean); // Remove any null resources
    
    console.log('Resources loaded:', resources);

    // Log successful Supabase query
    queryEndTime = performance.now();
    console.log(`Supabase query completed in ${queryEndTime - startTime}ms`);
    if (queryEndTime - startTime > 500) {
      console.warn('Performance warning: Query time exceeded 500ms threshold');
    }

    await displayResources();
    initializeFilters();

    // Log detailed performance metrics
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    console.log('Performance metrics:', {
      totalTime: `${totalTime}ms`,
      queryTime: `${queryEndTime - startTime}ms`,
      renderTime: `${endTime - queryEndTime}ms`,
      resourceCount: resources.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error loading or processing resources:', error);
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
    const jsonData = await loadResourcesFromJson();
    if (!jsonData || !jsonData.resources || !jsonData.categories) {
      throw new Error('Invalid JSON data structure');
    }

    // Set state from JSON data
    resources = jsonData.resources;
    categories = jsonData.categories;
    
    await displayResources();
    initializeFilters();
    
    showError('Using local resource data. Supabase connection unavailable.');
  } catch (error) {
    console.error('Error in JSON fallback:', error);
    showError('Unable to load resources. Please try again later.');
  }
}

// Show loading state
function showLoading() {
  resourcesGrid.innerHTML = '';
  resourcesGrid.appendChild(loadingIndicator);
}

// Display resources in the grid
async function displayResources() {
  console.log('Displaying resources...');
  
  // Reset the grid for new content
  resourcesGrid.innerHTML = '';

  // Apply category filter
  const filteredResources = currentCategory === 'all'
    ? resources
    : resources.filter(resource => resource.category === currentCategory);
  
  console.log('Filtered resources:', filteredResources);

  // Clear the grid and show loading state if no resources yet
  if (!filteredResources || filteredResources.length === 0) {
    resourcesGrid.innerHTML = `
      <div class="col-span-full text-center p-8 text-gray-400">
        ${resources.length === 0 ? 'Loading resources...' : 'No resources found for this category.'}
      </div>
    `;
    return;
  }

  // Create resource cards with opacity 0 for transition
  resourcesGrid.innerHTML = filteredResources.map(resource => `
    <article
      id="resource-${resource.id}"
      class="group bg-gray-900 rounded-lg p-6 transition-all duration-300 opacity-0 transform translate-y-4 hover:scale-[1.02]"
      onclick="showResourceDetails('${resource.id}')"
      role="button"
      aria-label="View details for ${resource.name}"
      tabindex="0"
      onkeydown="if(event.key === 'Enter' || event.key === ' ') { event.preventDefault(); showResourceDetails('${resource.id}') }"
    >
      <div class="text-4xl mb-4">${getCategoryIcon(resource.category)}</div>
      <h3 class="text-xl font-bold text-yellow-500 mb-2">${resource.name}</h3>
      <p class="text-gray-300 mb-4">${resource.description}</p>
      <div class="flex flex-wrap gap-2">
        ${resource.tags ? resource.tags.map(tag => `
          <span class="px-3 py-1 bg-gray-800 text-sm rounded-full text-yellow-500">${formatTag(tag)}</span>
        `).join('') : ''}
      </div>
    </article>
  `).join('');

  // Animate in the resources with staggered timing
  filteredResources.forEach((resource, index) => {
    const element = document.getElementById(`resource-${resource.id}`);
    if (element) {
      // Stagger the fade in animations
      setTimeout(() => {
        element.classList.remove('opacity-0', 'translate-y-4');
      }, index * 100);
    }
  });
}

// Initialize category filter buttons
function initializeFilters() {
  const filterButtons = document.querySelectorAll('.category-filter');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Update active state
      filterButtons.forEach(btn => {
        btn.classList.remove('bg-yellow-500', 'text-black');
        btn.classList.add('bg-gray-800', 'text-white');
        btn.setAttribute('aria-pressed', 'false');
      });
      button.classList.remove('bg-gray-800', 'text-white');
      button.classList.add('bg-yellow-500', 'text-black');
      button.setAttribute('aria-pressed', 'true');

      // Update displayed resources
      currentCategory = button.dataset.category;
      displayResources();
    });

    // Keyboard navigation for filters
    button.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        button.click();
      }
    });
  });
}

// Show resource details in modal
window.showResourceDetails = function(resourceId) {
  const resource = resources.find(r => r.id === resourceId);
  if (!resource) return;

  const modalTitle = document.getElementById('modal-title');
  const modalContent = document.getElementById('modal-content');

  modalTitle.textContent = resource.name;
  modalContent.innerHTML = `
    <div class="space-y-4">
      <div class="mb-6">
        <div class="flex flex-wrap gap-2 mb-4">
          ${resource.tags ? resource.tags.map(tag => `
            <span class="px-3 py-1 bg-gray-800 text-sm rounded-full text-yellow-500">${formatTag(tag)}</span>
          `).join('') : ''}
        </div>
        <p class="text-gray-300">${resource.description}</p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-bold text-yellow-500 mb-2">Contact Information</h3>
          <div class="space-y-2 text-gray-300">
            ${resource.location ? `<p><i class="fas fa-map-marker-alt w-6"></i> ${resource.location}</p>` : ''}
            ${resource.contact.phone ? `<p><i class="fas fa-phone w-6"></i> ${resource.contact.phone}</p>` : ''}
            ${resource.contact.email ? `<p><i class="fas fa-envelope w-6"></i> ${resource.contact.email}</p>` : ''}
            ${resource.website ? `
              <p><i class="fas fa-globe w-6"></i>
                <a href="${resource.website}"
                  class="text-yellow-500 hover:text-yellow-400 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit ${resource.name} website (opens in new tab)"
                >${resource.website}</a>
              </p>
            ` : ''}
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-yellow-500 mb-2">Hours</h3>
          <div class="space-y-1 text-gray-300">
            ${resource.hours && Object.keys(resource.hours).length > 0 ? 
              Object.entries(resource.hours).map(([day, hours]) => `
                <p><span class="capitalize w-24 inline-block">${day}:</span> ${hours}</p>
              `).join('') : 
              '<p>Hours not specified</p>'
            }
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.classList.add('modal-open');

  // Focus management
  const closeButton = modal.querySelector('button');
  closeButton.focus();

  // Store the element that had focus before opening modal
  modal.dataset.lastFocus = document.activeElement.id;
}

// Close modal
window.closeModal = function() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.classList.remove('modal-open');

  // Return focus to the element that opened the modal
  const lastFocus = modal.dataset.lastFocus;
  if (lastFocus) {
    const element = document.getElementById(lastFocus);
    if (element) element.focus();
  }
}

// Helper function to get category icon
function getCategoryIcon(categoryId) {
  const category = categories.find(c => c.id === categoryId);
  return category ? category.icon : '📍';
}

// Helper function to format tag names
function formatTag(tag) {
  return tag.split('-').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// Keyboard accessibility
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
    closeModal();
  }
});

// Trap focus within modal when open
modal.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab') return;

  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  if (e.shiftKey) {
    if (document.activeElement === firstFocusable) {
      e.preventDefault();
      lastFocusable.focus();
    }
  } else {
    if (document.activeElement === lastFocusable) {
      e.preventDefault();
      firstFocusable.focus();
    }
  }
});

// Set up real-time subscription
if (typeof supabase !== 'undefined') {
  const subscription = supabase
    .channel('resources_changes')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'resources'
      },
      async (payload) => {
        console.log('Real-time update received:', payload);
        try {
          await initializeResources();
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
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeResources);