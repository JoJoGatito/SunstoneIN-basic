# Supabase Implementation Plan for Sunstone Inclusivity Network

This guide outlines how to transition from your current JSON-based event system to a Supabase-powered backend while maintaining your existing site structure and design.

## Overview of Current Implementation

The Sunstone Inclusivity Network site currently:
- Uses a central `events.json` file to store event data for all groups
- Displays events on the home page using `group-events.js`
- Shows group-specific events on group pages using `groups/group-page-events.js`
- Maintains a clean, modern design with Tailwind CSS

## Benefits of Supabase Migration

1. **Easier Event Management**: Admin interface for adding/editing events without manual JSON editing
2. **Real-time Updates**: Changes appear immediately without file uploads
3. **Scalability**: Better performance as event volume grows
4. **Improved Security**: Role-based access control
5. **Future-proofing**: Easier to add features like user accounts, comments, RSVPs, etc.

## Phase 1: Supabase Project Setup

### Step 1: Create Supabase Account & Project

1. **Sign up at [supabase.com](https://supabase.com)**
   - Use GitHub login for easier integration
   - Choose your organization name

2. **Create New Project**
   - Click "New Project"
   - Choose organization
   - Project name: `sunstone-inclusivity-network` (or similar)
   - Database password: Generate strong password and save it
   - Region: Choose closest to your users (likely US West or Central)
   - Pricing plan: Start with Free tier

3. **Wait for Setup** (2-3 minutes)
   - Project will initialize with PostgreSQL database
   - Note your project URL and anon key

### Step 2: Database Schema Design

**Navigate to Table Editor in Supabase Dashboard**

```sql
-- Groups table to match current group structure
CREATE TABLE groups (
  id TEXT PRIMARY KEY, -- matches current HTML filename without extension (e.g., "sunstone-youth-group")
  name TEXT NOT NULL,  -- display name (e.g., "Sunstone Youth Group (SYG)")
  description TEXT,    -- brief description of the group
  icon TEXT,           -- emoji or icon class (e.g., "🌟")
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table with structure matching current events.json
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES groups(id),
  title TEXT NOT NULL,
  date TEXT NOT NULL, -- keeping as TEXT to match current format (e.g., "June 10, 2025")
  time TEXT,          -- keeping as TEXT to match current format (e.g., "4:00 PM - 8:00 PM")
  location TEXT,
  description TEXT,
  is_featured BOOLEAN DEFAULT false, -- determines if shown on home page
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources table (for future use with resources.json)
CREATE TABLE resources (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  url TEXT,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
```

### Step 3: Row Level Security (RLS) Policies

```sql
-- Allow public read access to all groups
CREATE POLICY "Groups are viewable by everyone" 
ON groups FOR SELECT 
USING (true);

-- Allow public read access to all events
CREATE POLICY "Events are viewable by everyone" 
ON events FOR SELECT 
USING (true);

-- Allow public read access to public resources
CREATE POLICY "Public resources are viewable by everyone" 
ON resources FOR SELECT 
USING (is_public = true);

-- For admin access (you'll implement this in Phase 3)
-- CREATE POLICY "Admin users can do everything" 
-- ON events FOR ALL 
-- USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');
```

### Step 4: Initial Data Migration

To migrate your existing data to Supabase:

1. **Add Groups Data**:
   ```sql
   INSERT INTO groups (id, name, description, icon) VALUES
   ('sunstone-youth-group', 'Sunstone Youth Group (SYG)', 'A safe and empowering space for LGBTQ+ youth to explore identity and build community.', '🌟'),
   ('disabitch', 'Disabitch', 'A disability-focused group celebrating neurodiversity and advocating for accessibility.', '♿'),
   ('cafeteria-collective', 'Cafeteria Collective', 'A vibrant community for trans individuals to connect, share experiences, and build solidarity.', '🏳️‍⚧️'),
   ('rock-and-stone', 'Rock and Stone', 'An inclusive outdoor and nature group exploring Southern Colorado''s natural beauty together.', '🏔️'),
   ('Hue-House', 'Hue House', 'A dedicated space for People of Color to build community, share experiences, and create change.', '🤝');
   ```

2. **Import Events Data**:
   - Use the Supabase dashboard to import events from your `events.json` file
   - Alternatively, use a SQL script to insert events directly

## Phase 2: Frontend Integration

### Step 1: Install Supabase Client

Add to your HTML head:

```html
<!-- Via CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### Step 2: Create Supabase Config

Create a file called `supabase-config.js`:

```javascript
// supabase-config.js - Store your configuration
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### Step 3: Replace group-events.js

Update `group-events.js` to use Supabase instead of fetching from events.json:

```javascript
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Fetch all groups with their featured events
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        id,
        name,
        icon,
        events (*)
      `)
      .eq('events.is_featured', true);
    
    if (error) throw error;
    
    // Process each group in the data
    groups.forEach(group => {
      // Find the corresponding group card on the page
      const groupCard = document.querySelector(`a[href="groups/${group.id}.html"]`);
      
      if (groupCard && group.events && group.events.length > 0) {
        // Get the first (featured) event
        const event = group.events[0];
        
        // Create a container for the event if it doesn't exist already
        let eventContainer = groupCard.querySelector('.group-event-container');
        if (!eventContainer) {
          eventContainer = document.createElement('div');
          eventContainer.className = 'group-event-container';
          groupCard.appendChild(eventContainer);
        }
        
        // Format the event information
        eventContainer.innerHTML = `
          <div class="text-sm bg-gray-800 p-3 rounded mt-3">
            <p class="text-yellow-500 font-bold">Next Event: ${event.title}</p>
            <p>${event.date}${event.time ? ' • ' + event.time : ''}</p>
          </div>
        `;
      }
    });
  } catch (error) {
    console.error('Error loading events:', error);
    // Error handling similar to current implementation
  }
});
```

### Step 4: Replace group-page-events.js

Update `groups/group-page-events.js` to use Supabase:

```javascript
document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Get current group ID from URL
    const groupId = window.location.pathname.split('/').pop().replace('.html', '');
    console.log('Current group ID:', groupId);
    
    // Fetch events for current group
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('group_id', groupId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    
    // Get the events container
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
    
    // Clear existing events
    const existingEvents = eventsSection.querySelector('.bg-gray-900');
    if (existingEvents) {
      existingEvents.remove();
    }
    
    // Display each upcoming event
    events.forEach((event, index) => {
      const eventDiv = document.createElement('div');
      eventDiv.className = 'bg-gray-900 p-6 rounded-lg' + (index < events.length - 1 ? ' mb-6' : '');
      
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
  } catch (error) {
    console.error('Error loading or processing events:', error);
    // Error handling similar to current implementation
  }
});
```

## Phase 3: Admin Interface

### Step 1: Create Admin Auth System

Create a file called `admin-auth.js`:

```javascript
// Simple authentication system for admin access
class AdminAuth {
  constructor() {
    this.isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
  }

  async login(password) {
    // For development - replace with proper auth later
    const ADMIN_PASSWORD = 'your-secure-password';
    
    if (password === ADMIN_PASSWORD) {
      this.isAuthenticated = true;
      localStorage.setItem('admin_authenticated', 'true');
      return true;
    }
    return false;
  }

  logout() {
    this.isAuthenticated = false;
    localStorage.removeItem('admin_authenticated');
  }

  checkAuth() {
    if (!this.isAuthenticated) {
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  }
}

const adminAuth = new AdminAuth();
```

### Step 2: Create Admin Login Page

Create `admin-login.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login - Sunstone Inclusivity Network</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://www.dyslexiefont.com/css/dyslexie.css" rel="stylesheet" type="text/css"/>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { dyslexie: ["Dyslexie", "sans-serif"] },
        },
      },
    };
  </script>
</head>
<body class="bg-black text-white font-dyslexie">
  <div class="min-h-screen flex items-center justify-center">
    <div class="bg-gray-900 p-8 rounded-lg w-full max-w-md">
      <h1 class="text-2xl font-bold text-yellow-500 mb-6 text-center">Admin Login</h1>
      
      <form id="loginForm" class="space-y-4">
        <div>
          <label for="password" class="block text-sm font-medium mb-1">Password</label>
          <input type="password" id="password" class="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" required>
        </div>
        
        <button type="submit" class="w-full bg-yellow-500 text-black font-bold py-2 px-4 rounded hover:bg-yellow-400 transition-colors">
          Log In
        </button>
        
        <p id="errorMessage" class="text-red-500 text-sm hidden"></p>
      </form>
      
      <div class="mt-4 text-center">
        <a href="index.html" class="text-sm text-gray-400 hover:text-white">Return to Home</a>
      </div>
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-config.js"></script>
  <script src="admin-auth.js"></script>
  <script>
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const errorMsg = document.getElementById('errorMessage');
      
      try {
        const success = await adminAuth.login(password);
        if (success) {
          window.location.href = 'admin.html';
        } else {
          errorMsg.textContent = 'Invalid password';
          errorMsg.classList.remove('hidden');
        }
      } catch (error) {
        errorMsg.textContent = 'An error occurred. Please try again.';
        errorMsg.classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
```

### Step 3: Create Admin Dashboard

Create `admin.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Dashboard - Sunstone Inclusivity Network</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" rel="stylesheet"/>
  <link href="https://www.dyslexiefont.com/css/dyslexie.css" rel="stylesheet" type="text/css"/>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { dyslexie: ["Dyslexie", "sans-serif"] },
        },
      },
    };
  </script>
</head>
<body class="bg-black text-white font-dyslexie">
  <nav class="bg-gray-900 p-4">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <div>
        <a href="index.html" class="text-yellow-500 hover:text-yellow-400">
          <i class="fas fa-arrow-left mr-2"></i>Back to Main Page
        </a>
      </div>
      <div>
        <button id="logoutBtn" class="text-gray-400 hover:text-white">
          <i class="fas fa-sign-out-alt mr-2"></i>Logout
        </button>
      </div>
    </div>
  </nav>

  <div class="max-w-7xl mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-yellow-500 mb-8">Admin Dashboard</h1>
    
    <!-- Tabs -->
    <div class="mb-8 border-b border-gray-700">
      <div class="flex">
        <button class="tab-btn py-2 px-4 border-b-2 border-yellow-500 text-yellow-500" data-tab="events">
          Events
        </button>
        <button class="tab-btn py-2 px-4 border-b-2 border-transparent hover:text-yellow-400" data-tab="groups">
          Groups
        </button>
        <button class="tab-btn py-2 px-4 border-b-2 border-transparent hover:text-yellow-400" data-tab="resources">
          Resources
        </button>
      </div>
    </div>
    
    <!-- Event Tab Content -->
    <div class="tab-content" id="eventsTab">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold">Manage Events</h2>
        <button id="newEventBtn" class="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400">
          <i class="fas fa-plus mr-2"></i>New Event
        </button>
      </div>
      
      <!-- Event Form (hidden by default) -->
      <div id="eventForm" class="bg-gray-900 p-6 rounded-lg mb-8 hidden">
        <h3 class="text-xl font-bold text-yellow-500 mb-4" id="formTitle">Add New Event</h3>
        
        <form id="eventFormElement" class="space-y-4">
          <input type="hidden" id="eventId">
          
          <div>
            <label for="groupSelect" class="block text-sm font-medium mb-1">Group</label>
            <select id="groupSelect" class="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" required>
              <!-- Groups will be loaded here -->
            </select>
          </div>
          
          <div>
            <label for="eventTitle" class="block text-sm font-medium mb-1">Event Title</label>
            <input type="text" id="eventTitle" class="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" required>
          </div>
          
          <div>
            <label for="eventDate" class="block text-sm font-medium mb-1">Date (e.g., June 10, 2025)</label>
            <input type="text" id="eventDate" class="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white" required>
          </div>
          
          <div>
            <label for="eventTime" class="block text-sm font-medium mb-1">Time (e.g., 4:00 PM - 8:00 PM)</label>
            <input type="text" id="eventTime" class="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white">
          </div>
          
          <div>
            <label for="eventLocation" class="block text-sm font-medium mb-1">Location</label>
            <input type="text" id="eventLocation" class="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white">
          </div>
          
          <div>
            <label for="eventDescription" class="block text-sm font-medium mb-1">Description</label>
            <textarea id="eventDescription" rows="4" class="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"></textarea>
          </div>
          
          <div class="flex items-center">
            <input type="checkbox" id="isFeatured" class="mr-2">
            <label for="isFeatured">Feature on Home Page</label>
          </div>
          
          <div class="flex space-x-4">
            <button type="submit" class="bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400">
              Save Event
            </button>
            <button type="button" id="cancelEventBtn" class="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">
              Cancel
            </button>
          </div>
        </form>
      </div>
      
      <!-- Events List -->
      <div id="eventsList" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Events will be loaded here -->
      </div>
    </div>
    
    <!-- Groups Tab Content (hidden by default) -->
    <div class="tab-content hidden" id="groupsTab">
      <h2 class="text-2xl font-bold mb-6">Manage Groups</h2>
      <!-- Groups management UI here -->
    </div>
    
    <!-- Resources Tab Content (hidden by default) -->
    <div class="tab-content hidden" id="resourcesTab">
      <h2 class="text-2xl font-bold mb-6">Manage Resources</h2>
      <!-- Resources management UI here -->
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-config.js"></script>
  <script src="admin-auth.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Check authentication
      if (!adminAuth.checkAuth()) return;
      
      // Tab switching logic
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          // Update active tab button
          document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('border-yellow-500', 'text-yellow-500');
            b.classList.add('border-transparent');
          });
          btn.classList.remove('border-transparent');
          btn.classList.add('border-yellow-500', 'text-yellow-500');
          
          // Show active tab content
          const tabId = btn.getAttribute('data-tab');
          document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('hidden');
          });
          document.getElementById(tabId + 'Tab').classList.remove('hidden');
        });
      });
      
      // Logout button
      document.getElementById('logoutBtn').addEventListener('click', () => {
        adminAuth.logout();
        window.location.href = 'admin-login.html';
      });
      
      // Load groups for dropdown
      loadGroups();
      
      // Load events
      loadEvents();
      
      // Event form toggle
      document.getElementById('newEventBtn').addEventListener('click', () => {
        document.getElementById('formTitle').textContent = 'Add New Event';
        document.getElementById('eventFormElement').reset();
        document.getElementById('eventId').value = '';
        document.getElementById('eventForm').classList.remove('hidden');
      });
      
      document.getElementById('cancelEventBtn').addEventListener('click', () => {
        document.getElementById('eventForm').classList.add('hidden');
      });
      
      // Event form submission
      document.getElementById('eventFormElement').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEvent();
      });
    });
    
    async function loadGroups() {
      try {
        const { data: groups, error } = await supabase
          .from('groups')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        
        const select = document.getElementById('groupSelect');
        select.innerHTML = groups.map(group => 
          `<option value="${group.id}">${group.name}</option>`
        ).join('');
      } catch (error) {
        console.error('Error loading groups:', error);
      }
    }
    
    async function loadEvents() {
      try {
        const { data: events, error } = await supabase
          .from('events')
          .select(`
            *,
            groups (id, name)
          `)
          .order('date');
        
        if (error) throw error;
        
        const container = document.getElementById('eventsList');
        container.innerHTML = events.map(event => `
          <div class="bg-gray-900 p-6 rounded-lg">
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-xl font-bold text-yellow-500">${event.title}</h3>
              <div class="flex space-x-2">
                <button class="text-gray-400 hover:text-white" onclick="editEvent(${event.id})">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="text-gray-400 hover:text-white" onclick="deleteEvent(${event.id})">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <p class="text-sm text-gray-400 mb-2">Group: ${event.groups.name}</p>
            <p class="mb-1">${event.date}${event.time ? ' • ' + event.time : ''}</p>
            ${event.location ? `<p class="mb-1">${event.location}</p>` : ''}
            ${event.description ? `<p class="text-sm text-gray-300 mt-2">${event.description}</p>` : ''}
            ${event.is_featured ? '<span class="mt-2 inline-block bg-yellow-500 text-xs text-black px-2 py-1 rounded">Featured</span>' : ''}
          </div>
        `).join('');
      } catch (error) {
        console.error('Error loading events:', error);
      }
    }
    
    async function saveEvent() {
      try {
        const eventId = document.getElementById('eventId').value;
        const eventData = {
          group_id: document.getElementById('groupSelect').value,
          title: document.getElementById('eventTitle').value,
          date: document.getElementById('eventDate').value,
          time: document.getElementById('eventTime').value,
          location: document.getElementById('eventLocation').value,
          description: document.getElementById('eventDescription').value,
          is_featured: document.getElementById('isFeatured').checked
        };
        
        let result;
        if (eventId) {
          // Update existing event
          result = await supabase
            .from('events')
            .update(eventData)
            .eq('id', eventId);
        } else {
          // Create new event
          result = await supabase
            .from('events')
            .insert(eventData);
        }
        
        if (result.error) throw result.error;
        
        // Hide form and reload events
        document.getElementById('eventForm').classList.add('hidden');
        loadEvents();
      } catch (error) {
        console.error('Error saving event:', error);
        alert('Error saving event: ' + error.message);
      }
    }
    
    async function editEvent(id) {
      try {
        const { data: event, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        // Fill form with event data
        document.getElementById('eventId').value = event.id;
        document.getElementById('groupSelect').value = event.group_id;
        document.getElementById('eventTitle').value = event.title;
        document.getElementById('eventDate').value = event.date;
        document.getElementById('eventTime').value = event.time || '';
        document.getElementById('eventLocation').value = event.location || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('isFeatured').checked = event.is_featured;
        
        // Show form and update title
        document.getElementById('formTitle').textContent = 'Edit Event';
        document.getElementById('eventForm').classList.remove('hidden');
      } catch (error) {
        console.error('Error loading event for edit:', error);
      }
    }
    
    async function deleteEvent(id) {
      if (confirm('Are you sure you want to delete this event?')) {
        try {
          const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          
          loadEvents();
        } catch (error) {
          console.error('Error deleting event:', error);
          alert('Error deleting event: ' + error.message);
        }
      }
    }
  </script>
</body>
</html>
```

## Phase 4: Implementation Strategy

### Step 1: Initial Setup and Testing

1. Create Supabase project and set up schema
2. Create `supabase-config.js` with your project URL and anon key
3. Add initial test data
4. Create a test page to verify Supabase connection works

### Step 2: Admin Interface Implementation

1. Create admin login page
2. Create admin dashboard
3. Test event creation, editing and deletion
4. Verify events appear in Supabase database

### Step 3: Public Interface Migration

1. Create new versions of `group-events.js` and `group-page-events.js` that use Supabase
2. Test on a development version of the site
3. Verify events display correctly on home page and group pages

### Step 4: Full Deployment

1. Update references in all HTML files to include Supabase client
2. Deploy updated JS files
3. Verify everything works on the live site
4. Remove the old `events.json` file once migration is complete

## Security Considerations

1. **API Key Safety**: The anon key is safe to use in frontend code
2. **RLS Policies**: Protect your data with properly configured policies
3. **Admin Authentication**: Start with simple password protection, upgrade to proper auth later
4. **CORS Settings**: Configure Supabase to allow requests from your domain

## Future Enhancements

Once the basic Supabase implementation is working, you can easily add:

1. **User Authentication**: Allow multiple admin users with different permissions
2. **File Storage**: Add images for events and groups
3. **Real-time Updates**: Implement live updates when events change
4. **Event Registration**: Allow users to RSVP to events
5. **Comments/Interaction**: Add social features to events
6. **Analytics**: Track page views and event popularity

## Migration Support Tools

Here's a simple utility to help migrate your existing JSON data to Supabase:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supabase Migration Tool</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-config.js"></script>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    textarea { width: 100%; height: 200px; }
    button { padding: 10px 20px; margin: 10px 0; }
    .result { margin-top: 20px; padding: 10px; background: #f0f0f0; }
  </style>
</head>
<body>
  <h1>Supabase Migration Tool</h1>
  <p>Use this tool to migrate your events.json data to Supabase.</p>
  
  <h2>Step 1: Paste your events.json content</h2>
  <textarea id="jsonInput"></textarea>
  
  <h2>Step 2: Migrate Data</h2>
  <button id="migrateBtn">Migrate to Supabase</button>
  
  <div id="result" class="result"></div>
  
  <script>
    document.getElementById('migrateBtn').addEventListener('click', async function() {
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = 'Processing...';
      
      try {
        // Parse JSON input
        const jsonData = JSON.parse(document.getElementById('jsonInput').value);
        
        // Process groups first
        resultDiv.innerHTML += '<p>Migrating groups...</p>';
        for (const group of jsonData.groups) {
          const { data, error } = await supabase
            .from('groups')
            .upsert({
              id: group.id,
              name: group.name,
              description: '', // Add description if available
              icon: '' // Add icon if available
            });
          
          if (error) throw error;
        }
        
        // Process events
        resultDiv.innerHTML += '<p>Migrating events...</p>';
        let eventCount = 0;
        
        for (const group of jsonData.groups) {
          for (const event of group.events) {
            if (event.title && event.date) {
              const { data, error } = await supabase
                .from('events')
                .insert({
                  group_id: group.id,
                  title: event.title,
                  date: event.date,
                  time: event.time || '',
                  location: event.location || '',
                  description: event.description || '',
                  is_featured: event === group.events[0] // First event is featured
                });
              
              if (error) throw error;
              eventCount++;
            }
          }
        }
        
        resultDiv.innerHTML += `<p>Migration complete! Migrated ${eventCount} events.</p>`;
      } catch (error) {
        resultDiv.innerHTML = `<p style="color: red">Error: ${error.message}</p>`;
        console.error('Migration error:', error);
      }
    });
  </script>
</body>
</html>
```

## Conclusion

This implementation plan provides a path to migrate your site from static JSON files to a dynamic Supabase backend while maintaining your existing design and user experience. The migration can be done incrementally, allowing you to test each component before fully deploying.

Once completed, you'll have a much more powerful and flexible system for managing events and other content on your site, while making it easier for non-technical contributors to add and update information.