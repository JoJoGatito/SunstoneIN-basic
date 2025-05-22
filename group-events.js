document.addEventListener('DOMContentLoaded', function() {
  // Fetch the events JSON file
  const baseUrl = window.location.href.split('/').slice(0, -1).join('/') + '/';
  console.log('Attempting to fetch events.json from:', baseUrl + 'events.json');
  fetch(baseUrl + 'events.json')
    .then(response => {
      console.log('Response status:', response.status);
      console.log('Response headers:', [...response.headers].map(h => h.join(': ')).join(', '));
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
          // Validate group data
          if (!group.id || !group.events) {
            console.error('Invalid group data:', group);
            return;
          }

          // Find the corresponding group card on the page using the group ID
          const groupCard = document.querySelector(`a[href="groups/${group.id}.html"]`);
          if (!groupCard) {
            console.log(`Group card not found for ${group.id}`);
            return;
          }

          // Get the first event with non-empty title and date
          const validEvent = group.events.find(event => 
            event && event.title && event.title.trim() && 
            event.date && event.date.trim()
          );

          if (validEvent) {
            // Create or update the event container
            let eventContainer = groupCard.querySelector('.group-event-container');
            if (!eventContainer) {
              eventContainer = document.createElement('div');
              eventContainer.className = 'group-event-container';
              groupCard.appendChild(eventContainer);
            }

            // Format the event information using the same structure as Youth Group card
            eventContainer.innerHTML = `
              <div class="text-sm bg-gray-800 p-3 rounded mt-3">
                <p class="text-yellow-500 font-bold">Next Event: ${validEvent.title}</p>
                <p>${validEvent.date}${validEvent.time ? ' • ' + validEvent.time : ''}</p>
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
      // Display error on page for easier debugging
      const errorDiv = document.createElement('div');
      errorDiv.style.backgroundColor = '#ff000033';
      errorDiv.style.padding = '10px';
      errorDiv.style.margin = '10px';
      errorDiv.style.border = '1px solid red';
      errorDiv.innerHTML = `<strong>Error loading events:</strong> ${error.message}`;
      document.body.prepend(errorDiv);
    });
});