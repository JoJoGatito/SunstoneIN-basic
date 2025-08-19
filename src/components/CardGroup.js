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

        // Fetch groups - attempt to get fields that may help mapping
        const { data: groups, error: groupsError } = await window.supabase
          .from('groups')
          .select('id, name, slug, page')
          .order('id');

        if (groupsError) {
          throw groupsError;
        }

        // Fetch upcoming events (ISO date check)
        const today = new Date().toISOString().split('T')[0];
        const { data: events, error: eventsError } = await window.supabase
          .from('events')
          .select('*')
          .gte('date', today)
          .order('date', { ascending: true });

        if (eventsError) {
          throw eventsError;
        }

        // Map events to groups - support several possible linking fields
        const eventMap = {};
        groups.forEach((group) => {
          const groupKeyCandidates = new Set();
          if (group.id !== undefined && group.id !== null) groupKeyCandidates.add(String(group.id));
          if (group.slug) groupKeyCandidates.add(String(group.slug));
          if (group.page) {
            const parts = String(group.page).split('/');
            const basename = parts[parts.length - 1].replace('.html', '');
            groupKeyCandidates.add(basename);
            groupKeyCandidates.add(String(group.page));
          }

          // find earliest event for this group
          const groupEvents = events.filter((ev) => {
            if (!ev) return false;
            if (ev.group_id && groupKeyCandidates.has(String(ev.group_id))) return true;
            if (ev.group_slug && groupKeyCandidates.has(String(ev.group_slug))) return true;
            if (ev.group_page && groupKeyCandidates.has(String(ev.group_page))) return true;
            if (ev.group_name && String(ev.group_name).toLowerCase() === String(group.name).toLowerCase()) return true;
            return false;
          });

          if (groupEvents.length) {
            // take earliest upcoming
            const key = String(group.id) || group.slug || group.page;
            eventMap[key] = groupEvents[0];
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
          const nextEvent = Array.isArray(group.events) && group.events.length ? group.events[0] : null;
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
        const nextEvent = this.events[group.id];

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
   * Helper: format event time (expects start_time/end_time)
   */
  formatEventTime(event) {
    if (!event) return '';
    const start = event.start_time || event.start || '';
    const end = event.end_time || event.end || '';
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
        case "'": return '&apos;';
        default: return s;
      }
    });
  }
}