export class CardGroup {
  constructor() {
    // State
    this.events = {};

    // Detect environment
    this.isGitHubPages = window.location.hostname.includes('github.io');
    this.baseUrl = this.isGitHubPages ? '/Dev-Web' : '';

    // Group data
    this.groupData = [
      { id: "sunstone-youth-group", name: "Sunstone Youth Group", role: "Community Group" },
      { id: "cafeteria-collective", name: "Cafeteria Collective", role: "Community Social" },
      { id: "rock-and-stone", name: "Rock and Stone", role: "Outdoor / Hike" },
      { id: "hue-house", name: "Hue House", role: "POC Group" },
      { id: "disabitch", name: "Disabitch", role: "Accessibility Group" }
    ];

    // Initialize with Supabase
    this.initializeWithEvents().catch((err) => {
      console.warn('[CardGroup] Supabase initialization failed, falling back to local data', err);
      this.initialize();
    });

    // Ensure final fallback
    setTimeout(() => {
      if (!document.querySelector('.group-grid')) {
        this.initialize();
      }
    }, 2000);
  }

  /**
   * Try to populate this.events using Supabase, otherwise populate from local JSON.
   */
  async fetchEvents() {
    // Prefer Supabase if available
    if (typeof window.supabase !== 'undefined') {
      try {
        console.log('[CardGroup] Attempting to fetch events via Supabase');

        // Basic connection/test query
        const { data: testData, error: testError } = await window.supabase
          .from('groups')
          .select('id')
          .limit(1);

        if (testError) {
          throw testError;
        }

        // Fetch groups - only query columns we know exist in Supabase
        const { data: groups, error: groupsError } = await window.supabase
          .from('groups')
          .select('id, name')  // Only select id and name which we know exist
          .order('id');

        console.log('[CardGroup] Groups query response:', { groups, error: groupsError });

        if (groupsError) {
          throw groupsError;
        }

        // Fetch upcoming events (ISO date check)
        const today = new Date().toISOString().split('T');
        const { data: events, error: eventsError } = await window.supabase
          .from('events')
          .select('*')
          .eq('is_featured', true)
          .gte('date', today)
          .order('date', { ascending: true });

        if (eventsError) {
          throw eventsError;
        }

        // Map events to groups - support several possible linking fields
        const eventMap = {};
        groups.forEach((group) => {
          // Use our hardcoded group data to fill in missing info from Supabase
          const groupData = this.groupData.find(g => g.id === group.id);
          if (!groupData) {
            console.log('[CardGroup] Group not found in hardcoded data:', group.id);
            return;
          }
          
          // Create a set of possible key identifiers for this group
          const groupKeyCandidates = new Set();
          if (group.id !== undefined && group.id !== null) groupKeyCandidates.add(String(group.id));
          
          // Add standard page path format based on group id
          const standardPagePath = `groups/${group.id}.html`;
          groupKeyCandidates.add(standardPagePath);
          groupKeyCandidates.add(group.id);  // Add id without the HTML extension

          // find featured events for this group - log each step
          console.log('[CardGroup] Looking for featured events for group:', {
            id: group.id,
            name: group.name,
            possibleKeys: Array.from(groupKeyCandidates)
          });
          
          const groupEvents = events.filter((ev) => {
            if (!ev) return false;
            
            // Log the event details we're checking
            console.log('[CardGroup] Checking event for match:', {
              id: ev.id,
              title: ev.title,
              is_featured: ev.is_featured,
              group_id: ev.group_id
            });
            
            // Primary match: group_id
            if (ev.group_id && groupKeyCandidates.has(String(ev.group_id))) {
              console.log('[CardGroup] ✅ Matched by group_id');
              return true;
            }
            
            // Secondary matches
            if (ev.group_name && String(ev.group_name).toLowerCase() === String(group.name).toLowerCase()) {
              console.log('[CardGroup] ✅ Matched by group_name');
              return true;
            }
            
            return false;
          });
          
          // Log the results
          console.log('[CardGroup] Found events for group:', {
            group_id: group.id,
            count: groupEvents.length,
            titles: groupEvents.map(e => e.title)
          });

          if (groupEvents.length) {
            // take earliest upcoming
            const key = String(group.id) || group.page;
            eventMap[key] = groupEvents;
          }
        });

        // Store map (may be empty)
        this.events = eventMap;
        console.log('[CardGroup] Supabase events mapped', Object.keys(this.events));
        return;
      } catch (err) {
        console.warn('[CardGroup] Supabase fetch failed, will try local JSON', err);
        // fall through to local
      }
    }

    // Fallback: load local events.json
    try {
      const url = `${this.baseUrl}/data/events.json`;
      console.log('[CardGroup] Fetching local events from', url);
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error(`Failed to fetch local events.json: ${resp.status} ${resp.statusText}`);
      }
      const json = await resp.json();
      const eventMap = {};

      if (json && Array.isArray(json.groups)) {
        json.groups.forEach((group) => {
          if (!group || !group.id) return;
          const nextEvent = Array.isArray(group.events) && group.events.length ? group.events : null;
          if (nextEvent) {
            eventMap[group.id] = nextEvent;
          }
        });
      }

      this.events = eventMap;
      console.log('[CardGroup] Local events loaded', Object.keys(this.events));
    } catch (err) {
      console.error('[CardGroup] Failed to load local events.json', err);
      this.events = {};
    }
  }

  /**
   * Try initialization that first fetches events then wires up UI.
   */
  async initializeWithEvents() {
    try {
      await this.fetchEvents();
      // Ensure DOM ready then do UI setup
      if (document.readyState === 'loading') {
        await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve));
      }
      this.initialize();
    } catch (err) {
      console.error('[CardGroup] initializeWithEvents error', err);
      throw err;
    }
  }

  // Create HTML for the grid
  createGridHTML() {
    return `
      ${this.groupData.map(group => {
        const events = this.events[group.id];
        // Get the first event if events is an array, otherwise use as is
        const nextEvent = Array.isArray(events) ? events[0] : events;
        
        console.log(`[CardGroup] Rendering ${group.id}:`,
          nextEvent ? (nextEvent.title || 'Event with no title') : 'No upcoming events');

        return `
          <div class="group-box" data-group-id="${this.escapeHtml(group.id)}">
            <h3 class="group-name">${this.escapeHtml(group.name)}</h3>
            <div class="event-info">
              <div class="event-title">${nextEvent ? this.escapeHtml(nextEvent.title || '') : 'No upcoming events'}</div>
              <div class="event-date">${nextEvent ? this.formatEventDate(nextEvent.date || '') + this.formatEventTime(nextEvent) : ''}</div>
              <div class="event-location">${nextEvent ? this.escapeHtml(nextEvent.location || '') : ''}</div>
            </div>
            <a href="${this.baseUrl}/groups/${this.escapeHtml(group.id)}.html" class="group-link">View Group</a>
          </div>
        `;
      }).join('')}
    `;
  }

  // Core rendering logic
  initialize() {
    try {
      const container = document.querySelector('#group-grid-container .group-grid');
      if (!container) {
        console.warn('[CardGroup] No .group-grid container found');
        return;
      }

      // Generate HTML
      const gridHTML = this.createGridHTML();
      container.innerHTML = gridHTML;

      // Wire up simple link behavior (let native navigation work; keep handlers for analytics or fallback)
      const links = Array.from(container.querySelectorAll('.group-link'));
      links.forEach((link) => {
        // Optional: ensure relative navigation works on GH pages
        link.addEventListener('click', (e) => {
          const href = link.getAttribute('href');
          if (href) {
            // allow default navigation (no preventDefault) but ensure absolute resolution if needed
            // window.location.href = href; // commented to preserve normal behavior
          }
        });
      });

      console.log('[CardGroup] Grid initialized');
    } catch (err) {
      console.error('[CardGroup] initialize error', err);
    }
  }

  /**
   * Helper: format event date string (expects readable date like "June 17, 2025")
   */
  formatEventDate(dateStr) {
    if (!dateStr) return '';
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
      return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(parsed));
    }
    return this.escapeHtml(dateStr);
  }

  /**
   * Helper: format time string to 12-hour format
   * @param {string} timeStr - Time string to format
   * @returns {string} Formatted time in 12-hour format
   */
  formatTimeToTwelveHour(timeStr) {
    if (!timeStr) return '';
    
    // If already in 12-hour format with AM/PM, return as is
    if (timeStr.includes('AM') || timeStr.includes('PM')) {
      return timeStr;
    }
    
    try {
      let hours, minutes;
      
      // Handle ISO timestamp format (contains T or Z)
      if (timeStr.includes('T') || timeStr.includes('Z')) {
        const dateObj = new Date(timeStr);
        if (!isNaN(dateObj.getTime())) {
          hours = dateObj.getHours();
          minutes = dateObj.getMinutes();
        }
      }
      // Handle 24-hour time format (HH:MM)
      else if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
      }
      
      // If we successfully parsed hours/minutes
      if (!isNaN(hours) && !isNaN(minutes)) {
        // Convert to 12-hour format
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
        const displayMinutes = minutes.toString().padStart(2, '0');
        return `${displayHours}:${displayMinutes} ${period}`;
      }
    } catch (e) {
      console.error('Error formatting time:', e);
    }
    
    // Return original if we couldn't format it
    return timeStr;
  }

  /**
   * Helper: format event time (expects start_time/end_time)
   */
  formatEventTime(event) {
    if (!event) return '';
    
    // Get start/end times and format them
    const startRaw = event.start_time || event.start || '';
    const endRaw = event.end_time || event.end || '';
    
    const start = this.formatTimeToTwelveHour(startRaw);
    const end = this.formatTimeToTwelveHour(endRaw);
    
    // Return formatted time string
    if (start && end) return ` — ${this.escapeHtml(start)} - ${this.escapeHtml(end)}`;
    if (start) return ` — ${this.escapeHtml(start)}`;
    return '';
  }

  /**
   * Very small helper to avoid inserting raw HTML from JSON into markup.
   */
  escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"']/g, (s) => {
      switch (s) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return s;
      }
    });
  }
}