import MagicCard from './components/MagicCard.js';

// State management
let resources = [];
let categories = [];
let currentCategory = 'all';
let magicCards = new Map(); // Store MagicCard instances

// DOM Elements
const resourcesGrid = document.getElementById('resources-grid');
const modal = document.getElementById('resource-modal');
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'loading-indicator flex items-center justify-center p-8';
loadingIndicator.innerHTML = `
  <div class="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent"></div>
`;

// Fetch and initialize resources
async function initializeResources() {
  showLoading();
  try {
    console.log('Fetching resources...');
    const response = await fetch('resources.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    console.log('Loaded data:', data);
    resources = data.resources;
    categories = data.categories;
    console.log('Resources:', resources);
    console.log('Categories:', categories);
    await displayResources();
    initializeFilters();
  } catch (error) {
    console.error('Error loading resources:', error);
    showError('Failed to load resources. Please try again later.');
  }
}

// Show loading state
function showLoading() {
  resourcesGrid.innerHTML = '';
  resourcesGrid.appendChild(loadingIndicator);
}

// Show error state
function showError(message) {
  resourcesGrid.innerHTML = `
    <div class="text-center p-8">
      <p class="text-red-500 mb-4">${message}</p>
      <button 
        onclick="initializeResources()"
        class="px-4 py-2 bg-yellow-500 text-black rounded hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
      >
        Try Again
      </button>
    </div>
  `;
}

// Display resources in the grid
async function displayResources() {
  console.log('Displaying resources...');
  
  // Cleanup existing MagicCard instances
  magicCards.forEach(card => card.cleanup());
  magicCards.clear();

  // Apply category filter
  const filteredResources = currentCategory === 'all'
    ? resources
    : resources.filter(resource => resource.category === currentCategory);
  
  console.log('Filtered resources:', filteredResources);

  // Clear the grid and show loading state if no resources yet
  resourcesGrid.innerHTML = '';
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
      class="magic-card group bg-gray-900 rounded-lg p-6 transition-all duration-300 opacity-0 transform translate-y-4 hover:scale-102"
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
        ${resource.tags.map(tag => `
          <span class="px-3 py-1 bg-gray-800 text-sm rounded-full text-yellow-500">${formatTag(tag)}</span>
        `).join('')}
      </div>
    </article>
  `).join('');

  // Initialize MagicCard for each resource and animate in
  filteredResources.forEach((resource, index) => {
    const element = document.getElementById(`resource-${resource.id}`);
    if (element) {
      magicCards.set(resource.id, new MagicCard(element));
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
          ${resource.tags.map(tag => `
            <span class="px-3 py-1 bg-gray-800 text-sm rounded-full text-yellow-500">${formatTag(tag)}</span>
          `).join('')}
        </div>
        <p class="text-gray-300">${resource.description}</p>
      </div>
      
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <h3 class="text-lg font-bold text-yellow-500 mb-2">Contact Information</h3>
          <div class="space-y-2 text-gray-300">
            <p><i class="fas fa-map-marker-alt w-6"></i> ${resource.contact.address}</p>
            <p><i class="fas fa-phone w-6"></i> ${resource.contact.phone}</p>
            <p><i class="fas fa-envelope w-6"></i> ${resource.contact.email}</p>
            <p><i class="fas fa-globe w-6"></i>
              <a href="${resource.contact.website}"
                class="text-yellow-500 hover:text-yellow-400 underline"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit ${resource.name} website (opens in new tab)"
              >${resource.contact.website}</a>
            </p>
          </div>
        </div>

        <div>
          <h3 class="text-lg font-bold text-yellow-500 mb-2">Hours</h3>
          <div class="space-y-1 text-gray-300">
            ${Object.entries(resource.hours).map(([day, hours]) => `
              <p><span class="capitalize w-24 inline-block">${day}:</span> ${hours}</p>
            `).join('')}
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

// Cleanup function for page unload
function cleanup() {
  magicCards.forEach(card => card.cleanup());
  magicCards.clear();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeResources);
// Cleanup on page unload
window.addEventListener('unload', cleanup);