/**
 * @fileoverview Script to populate test data in Supabase
 */

document.addEventListener('DOMContentLoaded', async function() {
  const results = document.getElementById('results');
  
  function logResult(operation, success, message, details = '') {
    const div = document.createElement('div');
    div.className = `p-4 mb-4 rounded ${success ? 'bg-green-900/20' : 'bg-red-900/20'}`;
    div.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${success ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-2"></i>
        <div>
          <p class="font-bold ${success ? 'text-green-500' : 'text-red-500'}">${operation}</p>
          <p class="text-sm text-gray-300">${message}</p>
          ${details ? `<pre class="mt-2 text-xs text-gray-400 overflow-x-auto">${details}</pre>` : ''}
        </div>
      </div>
    `;
    results.appendChild(div);
  }

  // Test data
  const groups = [
    {
      id: 'sunstone-youth-group',
      name: 'Sunstone Youth Group (SYG)',
      description: 'A safe and empowering space for LGBTQ+ youth',
      icon: '🌟'
    },
    {
      id: 'disabitch',
      name: 'Disabitch',
      description: 'A disability-focused group celebrating neurodiversity',
      icon: '♿'
    },
    {
      id: 'cafeteria-collective',
      name: 'Cafeteria Collective',
      description: 'A vibrant community for trans individuals',
      icon: '🏳️‍⚧️'
    },
    {
      id: 'rock-and-stone',
      name: 'Rock and Stone',
      description: 'An inclusive outdoor and nature group',
      icon: '🏔️'
    },
    {
      id: 'Hue-House',
      name: 'Hue House',
      description: 'A dedicated space for People of Color',
      icon: '🤝'
    }
  ];

  const events = [
    // Sunstone Youth Group Events
    {
      group_id: 'sunstone-youth-group',
      title: 'Youth Game Night',
      date: '2025-06-20',
      time: '6:00 PM - 9:00 PM',
      location: 'Community Center',
      description: 'Join us for board games, video games, and snacks!',
      is_featured: true
    },
    {
      group_id: 'sunstone-youth-group',
      title: 'Art Expression Workshop',
      date: '2025-07-05',
      time: '2:00 PM - 4:00 PM',
      location: 'Art Studio',
      description: 'Express yourself through various art mediums.',
      is_featured: false
    },

    // Disabitch Events
    {
      group_id: 'disabitch',
      title: 'Accessibility Workshop',
      date: '2025-06-25',
      time: '3:00 PM - 5:00 PM',
      location: 'Online',
      description: 'Learn about digital accessibility and inclusive design.',
      is_featured: true
    },
    {
      group_id: 'disabitch',
      title: 'Movie Night & Discussion',
      date: '2025-07-10',
      time: '7:00 PM - 10:00 PM',
      location: 'Community Center',
      description: 'Watch and discuss films about disability representation.',
      is_featured: false
    },

    // Cafeteria Collective Events
    {
      group_id: 'cafeteria-collective',
      title: 'Trans Support Circle',
      date: '2025-06-22',
      time: '6:30 PM - 8:30 PM',
      location: 'Rainbow Room',
      description: 'A safe space for sharing experiences and support.',
      is_featured: true
    },
    {
      group_id: 'cafeteria-collective',
      title: 'Name Change Workshop',
      date: '2025-07-15',
      time: '2:00 PM - 4:00 PM',
      location: 'Legal Aid Office',
      description: 'Get help with legal name change processes.',
      is_featured: false
    },

    // Rock and Stone Events
    {
      group_id: 'rock-and-stone',
      title: 'Beginner Hiking Trip',
      date: '2025-06-28',
      time: '9:00 AM - 2:00 PM',
      location: 'Garden of the Gods',
      description: 'An accessible hiking experience for all skill levels.',
      is_featured: true
    },
    {
      group_id: 'rock-and-stone',
      title: 'Rock Climbing Basics',
      date: '2025-07-20',
      time: '10:00 AM - 1:00 PM',
      location: 'Climbing Gym',
      description: 'Introduction to indoor climbing techniques.',
      is_featured: false
    },

    // Hue House Events
    {
      group_id: 'Hue-House',
      title: 'Cultural Celebration',
      date: '2025-06-30',
      time: '5:00 PM - 9:00 PM',
      location: 'Community Center',
      description: 'Celebrate diverse cultures through food, music, and art.',
      is_featured: true
    },
    {
      group_id: 'Hue-House',
      title: 'BIPOC Business Workshop',
      date: '2025-07-25',
      time: '1:00 PM - 4:00 PM',
      location: 'Business Center',
      description: 'Resources and networking for BIPOC entrepreneurs.',
      is_featured: false
    }
  ];

  try {
    // Step 1: Clear existing data
    logResult('Clearing Data', true, 'Starting data cleanup...');
    
    const { error: clearEventsError } = await supabase
      .from('events')
      .delete()
      .neq('id', 0); // Delete all events
    
    if (clearEventsError) throw clearEventsError;
    
    const { error: clearGroupsError } = await supabase
      .from('groups')
      .delete()
      .neq('id', ''); // Delete all groups
    
    if (clearGroupsError) throw clearGroupsError;
    
    logResult('Data Cleanup', true, 'Successfully cleared existing data');

    // Step 2: Insert groups
    logResult('Inserting Groups', true, 'Starting group insertion...');
    
    const { error: groupsError } = await supabase
      .from('groups')
      .insert(groups);
    
    if (groupsError) throw groupsError;
    
    logResult('Groups Insertion', true, `Successfully inserted ${groups.length} groups`);

    // Step 3: Insert events
    logResult('Inserting Events', true, 'Starting event insertion...');
    
    const { error: eventsError } = await supabase
      .from('events')
      .insert(events);
    
    if (eventsError) throw eventsError;
    
    logResult('Events Insertion', true, `Successfully inserted ${events.length} events`);

    // Final success message
    logResult(
      'Data Population Complete',
      true,
      'Successfully populated test data',
      `Created ${groups.length} groups and ${events.length} events`
    );

  } catch (error) {
    logResult(
      'Error',
      false,
      'Failed to populate test data',
      `Error: ${error.message}\nDetails: ${JSON.stringify(error, null, 2)}`
    );
  }
});