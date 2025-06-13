// Load group events
function loadGroupEvents() {
  console.log('Loading group events...');
  const baseUrl = window.location.href.split('/').slice(0, -1).join('/') + '/';
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
      if (!data || !data.groups || !Array.isArray(data.groups)) {
        throw new Error('Invalid JSON structure: missing or malformed groups array');
      }

      // Process each group in the JSON data
      data.groups.forEach(group => {
        try {
          if (!group.id || !group.events) {
            console.error('Invalid group data:', group);
            return;
          }

          const groupCard = document.querySelector(`a[href="groups/${group.id}.html"]`);
          if (!groupCard) {
            console.log(`Group card not found for ${group.id}`);
            return;
          }

          const validEvent = group.events.find(event =>
            event && event.title && event.title.trim() &&
            event.date && event.date.trim()
          );

          if (validEvent) {
            let eventContainer = groupCard.querySelector('.group-event-container');
            if (!eventContainer) {
              eventContainer = document.createElement('div');
              eventContainer.className = 'group-event-container';
              groupCard.appendChild(eventContainer);
            }

            eventContainer.innerHTML = `
              <div class="text-sm md:text-base bg-gray-800 p-3 md:p-4 rounded mt-2">
                <p class="text-yellow-500 font-bold text-base md:text-lg">Next Event: ${validEvent.title}</p>
                <p class="mt-1 text-sm md:text-base">${validEvent.date}${validEvent.time ? ' • ' + validEvent.time : ''}</p>
              </div>
            `;
          }
        } catch (groupError) {
          console.error(`Error processing group ${group.id}:`, groupError);
        }
      });
    })
    .catch(error => {
      console.error('Error loading or processing events:', error);
      const errorDiv = document.createElement('div');
      errorDiv.style.backgroundColor = '#ff000033';
      errorDiv.style.padding = '10px';
      errorDiv.style.margin = '10px';
      errorDiv.style.border = '1px solid red';
      errorDiv.innerHTML = `<strong>Error loading events:</strong> ${error.message}`;
      document.body.prepend(errorDiv);
    });
}

document.addEventListener('DOMContentLoaded', function() {
  // Load group events
  loadGroupEvents();
});