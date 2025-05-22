document.addEventListener('DOMContentLoaded', function() {
  // Get current group ID from URL
  const groupId = window.location.pathname.split('/').pop().replace('.html', '');
  console.log('Current group ID:', groupId);

  // Fetch the events JSON file
  const baseUrl = window.location.href.split('/').slice(0, -2).join('/') + '/';
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
      if (!data || !data.groups) {
        throw new Error('Invalid JSON structure: missing groups array');
      }

      // Find the current group's data
      const group = data.groups.find(g => g.id === groupId);
      if (!group) {
        throw new Error(`Group ${groupId} not found in events.json`);
      }

      // Get the events container by finding the section that contains the "Upcoming Events" heading
      console.log('Finding events section...');
      const eventsSection = document.evaluate(
        "//section[.//h2[contains(@class, 'text-yellow-500') and normalize-space(text())='Upcoming Events']]",
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;

      if (!eventsSection) {
        throw new Error('Could not find "Upcoming Events" section');
      }
      const existingEvents = eventsSection.querySelector('.bg-gray-900');
      if (existingEvents) {
        existingEvents.remove();
      }

      // Display each upcoming event
      group.events.forEach((event, index) => {
        if (!event.title || !event.date) return;

        const eventDiv = document.createElement('div');
        eventDiv.className = 'bg-gray-900 p-6 rounded-lg' + (index < group.events.length - 1 ? ' mb-6' : '');
        
        eventDiv.innerHTML = `
          <h3 class="text-xl font-bold text-yellow-500 mb-2">
            ${event.title}
          </h3>
          
          <div class="flex items-center mb-3">
            <i class="far fa-calendar text-yellow-500 mr-2"></i>
            <span>${event.date}</span>
            ${event.time ? `
              <i class="far fa-clock text-yellow-500 ml-4 mr-2"></i>
              <span>${event.time}</span>
            ` : ''}
          </div>
          
          ${event.location ? `
            <div class="flex items-center mb-3">
              <i class="fas fa-map-marker-alt text-yellow-500 mr-2"></i>
              <span>${event.location}</span>
            </div>
          ` : ''}
          
          ${event.description ? `
            <p class="text-gray-300">
              ${event.description}
            </p>
          ` : ''}
        `;

        eventsSection.appendChild(eventDiv);
      });
    })
    .catch(error => {
      console.error('Error loading or processing events:', error);
      // Display error on page for debugging
      const errorDiv = document.createElement('div');
      errorDiv.style.backgroundColor = '#ff000033';
      errorDiv.style.padding = '10px';
      errorDiv.style.margin = '10px';
      errorDiv.style.border = '1px solid red';
      errorDiv.innerHTML = `<strong>Error loading events:</strong> ${error.message}`;
      document.body.prepend(errorDiv);
    });
});