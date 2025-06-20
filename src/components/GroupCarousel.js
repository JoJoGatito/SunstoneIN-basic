export class GroupCarousel {
  constructor() {
    // Store DOM elements
    this.cards = null;
    this.dots = null;
    this.memberName = null;
    this.memberRole = null;
    this.leftArrow = null;
    this.rightArrow = null;

    // Initialize state
    this.currentIndex = 0;
    this.isAnimating = false;
    this.touchStartX = 0;
    this.touchEndX = 0;

    // Event data
    this.events = {};

    // Detect environment
    this.isGitHubPages = window.location.hostname.includes('github.io');
    
    // Group data with proper path resolution
    this.baseUrl = this.isGitHubPages ? '/Dev-Web' : '';
    console.log('[GroupCarousel] Environment:', {
      isGitHubPages: this.isGitHubPages,
      baseUrl: this.baseUrl,
      hostname: window.location.hostname,
      pathname: window.location.pathname
    });
    
    this.groupData = [
      { 
        name: "Cafeteria Collective", 
        role: "Community Group",
        image: `${this.baseUrl}/assets/images/cards/Cafeteria card.webp`,
        link: `${this.baseUrl}/groups/cafeteria-collective.html`
      },
      { 
        name: "Disabitch", 
        role: "Community Group",
        image: `${this.baseUrl}/assets/images/cards/Disabitch card.webp`,
        link: `${this.baseUrl}/groups/disabitch.html`
      },
      { 
        name: "Hue House", 
        role: "Community Group",
        image: `${this.baseUrl}/assets/images/cards/Hue House card.webp`,
        link: `${this.baseUrl}/groups/Hue-House.html`
      },
      { 
        name: "Rock & Stone", 
        role: "Community Group",
        image: `${this.baseUrl}/assets/images/cards/Rock Stone card.webp`,
        link: `${this.baseUrl}/groups/rock-and-stone.html`
      },
      { 
        name: "Sunstone Youth Group", 
        role: "Community Group",
        image: `${this.baseUrl}/assets/images/cards/SYG card.webp`,
        link: `${this.baseUrl}/groups/sunstone-youth-group.html`
      }
    ];

    // Add stylesheet to document instead of inline injection
    this.addCarouselStylesheet();
    
    // First try immediate initialization
    console.log('[GroupCarousel] Attempting immediate initialization');
    this.initializeWithEvents().catch(error => {
      console.warn('[GroupCarousel] Immediate initialization failed, will try on DOMContentLoaded', error);
      
      // Fallback to DOMContentLoaded
      document.addEventListener('DOMContentLoaded', () => {
        console.log('[GroupCarousel] DOMContentLoaded triggered');
        this.initializeWithEvents().catch(error => {
          console.error('[GroupCarousel] Failed to initialize with events, trying without events', error);
          // Final fallback - just render without events
          this.initialize();
        });
      });
    });
    
    // Ultimate fallback - try initialization after a delay
    setTimeout(() => {
      if (!this.cards) {
        console.log('[GroupCarousel] Delayed initialization attempt');
        this.initialize();
      }
    }, 2000);
  }
  
  /**
   * Adds the carousel stylesheet to the document head
   */
  addCarouselStylesheet() {
    const styleId = 'group-carousel-styles';
    if (document.getElementById(styleId)) {
      console.log('[GroupCarousel] Styles already exist');
      return;
    }
    
    console.log('[GroupCarousel] Adding carousel stylesheet');
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = this.getCarouselStyles();
    document.head.appendChild(styleSheet);
    console.log('[GroupCarousel] Stylesheet added to document head');
  }
  
  /**
   * Initialize carousel with Supabase events data
   */
  async initializeWithEvents() {
    console.log('[GroupCarousel] Initializing with events');
    try {
      if (typeof window.supabase === 'undefined') {
        console.warn('[GroupCarousel] Supabase not initialized');
        throw new Error('Supabase not available');
      }
      
      await this.fetchEvents();
      this.initialize();
      return true;
    } catch (error) {
      console.error('[GroupCarousel] Error initializing with events:', error);
      throw error;
    }
  }
  
  /**
   * Main initialization method
   */
  initialize() {
    console.log('[GroupCarousel] Initialize method called');
    
    try {
      // Get the container
      console.log('[GroupCarousel] Looking for carousel container');
      const container = document.querySelector('#carousel-container');
      if (!container) {
        console.error('[GroupCarousel] Could not find #carousel-container element');
        // Log available IDs for debugging
        const allElements = document.querySelectorAll('[id]');
        console.log('[GroupCarousel] Available elements with IDs:', 
          Array.from(allElements).map(el => ({id: el.id, tagName: el.tagName}))
        );
        return;
      }
      console.log('[GroupCarousel] Found carousel container');

      // Insert carousel HTML
      console.log('[GroupCarousel] Creating carousel HTML');
      const carouselHTML = this.createCarouselHTML();
      container.innerHTML = carouselHTML;
      console.log('[GroupCarousel] Carousel HTML inserted');
      
      // Initialize DOM elements
      this.cards = document.querySelectorAll(".card");
      this.dots = document.querySelectorAll(".dot");
      this.memberName = document.querySelector(".member-name");
      this.memberRole = document.querySelector(".member-role");
      this.leftArrow = document.querySelector(".nav-arrow.left");
      this.rightArrow = document.querySelector(".nav-arrow.right");
      
      console.log('[GroupCarousel] DOM elements:', {
        cards: this.cards.length,
        dots: this.dots.length,
        memberName: this.memberName ? 'found' : 'missing',
        memberRole: this.memberRole ? 'found' : 'missing',
        leftArrow: this.leftArrow ? 'found' : 'missing',
        rightArrow: this.rightArrow ? 'found' : 'missing'
      });

      if (!this.cards.length || !this.dots.length || !this.memberName || !this.memberRole || !this.leftArrow || !this.rightArrow) {
        console.error('[GroupCarousel] Could not initialize all required DOM elements');
        return;
      }

      // Add event listeners
      this.setupEventListeners();

      // Initialize carousel state
      this.updateCarousel(0);
      console.log('[GroupCarousel] Initialization complete');
    } catch (error) {
      console.error('[GroupCarousel] Critical initialization error:', error);
    }
  }

  createCarouselHTML() {
    return `
      <div class="carousel-container">
        <button class="nav-arrow left" aria-label="Previous group">‹</button>
        <div class="carousel-track">
          ${this.groupData.map((group, i) => {
            const groupId = group.link.split('/').pop().replace('.html', '');
            const nextEvent = this.events[groupId];
            
            return `
              <div class="card" data-index="${i}" role="button" aria-label="${group.name}">
                <a href="${group.link}">
                  <img src="${group.image}" alt="${group.name}" loading="lazy">
                  ${nextEvent ? `
                    <div class="event-bubble">
                      <div style="font-size: 2em; margin-bottom: 8px;">Next Event</div>
                      <hr style="border: 0; height: 1px; background: black; margin: 8px 0;">
                      ${nextEvent.title}<br>
                      ${nextEvent.time ? `${nextEvent.date}, ${nextEvent.time}` : nextEvent.date}
                    </div>
                  ` : ''}
                </a>
              </div>
            `;
          }).join('')}
        </div>
        <button class="nav-arrow right" aria-label="Next group">›</button>
      </div>

      <div class="member-info">
        <h2 class="member-name">${this.groupData[0].name}</h2>
        <p class="member-role">${this.groupData[0].role}</p>
      </div>

      <div class="dots" role="tablist">
        ${this.groupData.map((_, i) => `
          <div class="dot ${i === 0 ? 'active' : ''}"
               data-index="${i}"
               role="tab"
               aria-selected="${i === 0}"
               aria-label="View ${this.groupData[i].name}">
          </div>
        `).join('')}
      </div>
    `;
  }

  updateCarousel(newIndex) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    this.currentIndex = (newIndex + this.cards.length) % this.cards.length;

    this.cards.forEach((card, i) => {
      const offset = (i - this.currentIndex + this.cards.length) % this.cards.length;

      card.classList.remove(
        "center",
        "left-1",
        "left-2",
        "right-1",
        "right-2",
        "hidden"
      );

      if (offset === 0) {
        card.classList.add("center");
      } else if (offset === 1) {
        card.classList.add("right-1");
      } else if (offset === 2) {
        card.classList.add("right-2");
      } else if (offset === this.cards.length - 1) {
        card.classList.add("left-1");
      } else if (offset === this.cards.length - 2) {
        card.classList.add("left-2");
      } else {
        card.classList.add("hidden");
      }
    });

    this.dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === this.currentIndex);
      dot.setAttribute("aria-selected", i === this.currentIndex);
    });

    this.memberName.style.opacity = "0";
    this.memberRole.style.opacity = "0";

    setTimeout(() => {
      this.memberName.textContent = this.groupData[this.currentIndex].name;
      this.memberRole.textContent = this.groupData[this.currentIndex].role;
      this.memberName.style.opacity = "1";
      this.memberRole.style.opacity = "1";
    }, 300);

    setTimeout(() => {
      this.isAnimating = false;
    }, 800);
  }

  setupEventListeners() {
    this.leftArrow.addEventListener("click", () => {
      this.updateCarousel(this.currentIndex - 1);
    });

    this.rightArrow.addEventListener("click", () => {
      this.updateCarousel(this.currentIndex + 1);
    });

    this.dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        this.updateCarousel(i);
      });
    });

    this.cards.forEach((card, i) => {
      card.addEventListener("click", () => {
        this.updateCarousel(i);
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        this.updateCarousel(this.currentIndex - 1);
      } else if (e.key === "ArrowRight") {
        this.updateCarousel(this.currentIndex + 1);
      }
    });

    document.addEventListener("touchstart", (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    });

    document.addEventListener("touchend", (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe();
    });
  }

  handleSwipe() {
    const swipeThreshold = 50;
    const diff = this.touchStartX - this.touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        this.updateCarousel(this.currentIndex + 1);
      } else {
        this.updateCarousel(this.currentIndex - 1);
      }
    }
  }

  async fetchEvents() {
    console.log('[GroupCarousel] Fetching events from Supabase');
    try {
      // Try minimal database connection to test it works
      const { data: testData, error: testError } = await window.supabase
        .from('groups')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('[GroupCarousel] Supabase connection test failed:', testError);
        throw testError;
      }
      
      console.log('[GroupCarousel] Supabase connection test successful');
      
      // Proceed with actual queries
      const { data: groups, error: groupsError } = await window.supabase
        .from('groups')
        .select('id, name')
        .order('id');

      if (groupsError) {
        console.error('[GroupCarousel] Error fetching groups:', groupsError);
        throw groupsError;
      }
      
      if (!groups || groups.length === 0) {
        console.warn('[GroupCarousel] No groups found in database');
        return;
      }
      
      const { data: events, error: eventsError } = await window.supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (eventsError) {
        console.error('[GroupCarousel] Error fetching events:', eventsError);
        throw eventsError;
      }
      
      if (!events || events.length === 0) {
        console.warn('[GroupCarousel] No upcoming events found');
        return;
      }
      
      // Map events to their groups
      groups.forEach(group => {
        const groupEvents = events.filter(event => event.group_id === group.id);
        if (groupEvents.length > 0) {
          const nextEvent = groupEvents[0]; // First event is the next upcoming one
          this.events[group.id] = nextEvent;
        }
      });
      
      console.log('[GroupCarousel] Events loaded for groups:', Object.keys(this.events).length);
    } catch (error) {
      console.error('[GroupCarousel] Error fetching events:', error);
      throw error;
    }
  }

  getCarouselStyles() {
    return `
      .event-bubble {
        position: absolute;
        bottom: 40px;
        left: 0;
        right: 0;
        color: black;
        padding: 0 12px;
        font-size: clamp(0.85rem, 2vw, 1.1rem);
        line-height: 1.4;
        text-align: center;
        pointer-events: none;
        font-weight: bold;
        z-index: 20;
      }

      @media (max-width: 768px) {
        .event-bubble {
          bottom: 35px;
          font-size: 0.85rem;
        }
        .event-bubble div:first-child {
          font-size: 1.2em;
          margin-bottom: 4px !important;
        }
        .carousel-container {
          height: 350px !important;
          margin: 40px auto 0 !important;
        }
        .card {
          width: 300px !important;
          height: 294px !important;
          transform-origin: center !important;
        }
        .card.center {
          transform: scale(1.05) translateZ(0) !important;
        }
        .card.left-1 {
          transform: translateX(-40px) scale(0.9) translateZ(-50px) !important;
        }
        .card.right-1 {
          transform: translateX(40px) scale(0.9) translateZ(-50px) !important;
        }
        .card.left-2, .card.right-2 {
          display: none !important;
        }
        .nav-arrow.left {
          left: 10px !important;
        }
        .nav-arrow.right {
          right: 10px !important;
        }
      }

      .carousel-container {
        width: 100%;
        max-width: 1200px;
        height: 450px;
        position: relative;
        perspective: 1000px;
        margin: 80px auto 0;
      }

      .carousel-track {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        position: relative;
        transform-style: preserve-3d;
        transition: transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .card {
        position: absolute;
        width: 384px;
        height: 377px;
        background: white;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        cursor: pointer;
      }

      .card a {
        display: block;
        width: 100%;
        height: 100%;
      }

      .card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
      }

      .card.center {
        z-index: 10;
        transform: scale(1.1) translateZ(0);
      }

      .card.center img {
        filter: none;
      }

      .card.left-1 {
        z-index: 5;
        transform: translateX(-70%) translateZ(-100px);
      }

      .card.left-1 img {
        filter: brightness(0.7);
      }

      .card.left-2 {
        z-index: 1;
        transform: translateX(-100%) translateZ(-200px);
      }

      .card.left-2 img {
        filter: brightness(0.5);
      }

      .card.right-1 {
        z-index: 5;
        transform: translateX(70%) translateZ(-100px);
      }

      .card.right-1 img {
        filter: brightness(0.7);
      }

      .card.right-2 {
        z-index: 1;
        transform: translateX(100%) translateZ(-200px);
      }

      .card.right-2 img {
        filter: brightness(0.5);
      }

      .card.hidden {
        opacity: 0;
        transform: translateX(0) translateZ(-300px);
        pointer-events: none;
      }

      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 50px;
        height: 50px;
        background: rgba(0, 0, 0, 0.5);
        border: none;
        border-radius: 50%;
        color: white;
        font-size: 24px;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.3s;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .nav-arrow:hover {
        background: rgba(0, 0, 0, 0.8);
        transform: translateY(-50%) scale(1.1);
      }

      .nav-arrow.left {
        left: 20px;
      }

      .nav-arrow.right {
        right: 20px;
      }

      .member-info {
        text-align: center;
        margin-top: 30px;
      }

      .member-name {
        font-size: 24px;
        font-weight: bold;
        margin: 0;
        transition: opacity 0.3s;
      }

      .member-role {
        font-size: 18px;
        color: #666;
        margin: 5px 0 0;
        transition: opacity 0.3s;
      }

      .dots {
        display: flex;
        justify-content: center;
        margin-top: 20px;
        gap: 10px;
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ccc;
        cursor: pointer;
        transition: background-color 0.3s, transform 0.3s;
      }

      .dot:hover {
        background: #999;
        transform: scale(1.2);
      }

      .dot.active {
        background: #333;
        transform: scale(1.2);
      }
    `;
  }
}