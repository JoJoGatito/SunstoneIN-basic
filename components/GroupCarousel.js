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

    // Group data
    this.groupData = [
      { 
        name: "Cafeteria Collective", 
        role: "Community Group",
        image: "images/Cafeteria card.webp",
        link: "groups/cafeteria-collective.html"
      },
      { 
        name: "Disabitch", 
        role: "Community Group",
        image: "images/Disabitch card.webp",
        link: "groups/disabitch.html"
      },
      { 
        name: "Hue House", 
        role: "Community Group",
        image: "images/Hue House card.webp",
        link: "groups/Hue-House.html"
      },
      { 
        name: "Rock & Stone", 
        role: "Community Group",
        image: "images/Rock Stone card.webp",
        link: "groups/rock-and-stone.html"
      },
      { 
        name: "Sunstone Youth Group", 
        role: "Community Group",
        image: "images/SYG card.webp",
        link: "groups/sunstone-youth-group.html"
      }
    ];

    // Initialize after DOM content is loaded
    document.addEventListener('DOMContentLoaded', () => {
      // First fetch events, then initialize carousel
      this.fetchEvents().then(() => {
        console.log('Events loaded, initializing carousel');
        this.initialize();
      });
    });
  }
initialize() {
  // Inject styles first
  this.injectStyles();

  // Get the container
  const container = document.querySelector('#carousel-container');
  if (!container) {
    console.error('Could not find #our-groups-section');
    return;
  }

    // Insert carousel HTML
    container.innerHTML = this.createCarouselHTML();
    
    // Force a reflow to ensure styles are applied
    container.offsetHeight;

    // Initialize DOM elements
    this.cards = document.querySelectorAll(".card");
    this.dots = document.querySelectorAll(".dot");
    this.memberName = document.querySelector(".member-name");
    this.memberRole = document.querySelector(".member-role");
    this.leftArrow = document.querySelector(".nav-arrow.left");
    this.rightArrow = document.querySelector(".nav-arrow.right");

    if (!this.cards.length || !this.dots.length || !this.memberName || !this.memberRole || !this.leftArrow || !this.rightArrow) {
      console.error('Could not initialize all required DOM elements');
      return;
    }

    // Add event listeners
    this.setupEventListeners();

    // Initialize carousel state
    this.updateCarousel(0);

  }

  createCarouselHTML() {
    return `
      <div class="carousel-container">
        <button class="nav-arrow left" aria-label="Previous group">‹</button>
        <div class="carousel-track">
          ${this.groupData.map((group, i) => {
            const groupId = group.link.split('/').pop().replace('.html', '');
            const nextEvent = this.events[groupId];
            console.log(`Group ${group.name} (${groupId}) event:`, nextEvent);
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
      console.log(`Card ${i} (${this.groupData[i].name}) - offset: ${offset}`);

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
        console.log(`Adding hidden class to card ${i} (${this.groupData[i].name}) with offset ${offset}`);
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
    console.log('Fetching events...');
    try {
      const response = await fetch('events.json');
      const data = await response.json();
      console.log('Events data:', data);
      
      // Create a map of group ID to their next event
      data.groups.forEach(group => {
        if (group.events && group.events.length > 0 && group.events[0].title) {
          const groupId = group.id;
          console.log(`Adding event for ${groupId}:`, group.events[0]);
          this.events[groupId] = group.events[0];
        }
      });
      
      console.log('Processed events:', this.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }

  injectStyles() {
    const styles = `
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
      }

      @media (max-width: 768px) {
        .event-bubble {
          bottom: 20px;
          font-size: 0.85rem;
        }
        .event-bubble div:first-child {
          font-size: 1.5em;
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

      .card.left-2 {
        z-index: 1;
        transform: translateX(-120px) scale(0.8) translateZ(-300px);
        opacity: 0.7;
      }

      .card.left-2 img {
        filter: grayscale(100%);
      }

      .card.left-1 {
        z-index: 5;
        transform: translateX(-70px) scale(0.9) translateZ(-100px);
        opacity: 0.9;
      }

      .card.left-1 img {
        filter: grayscale(100%);
      }

      .card.right-1 {
        z-index: 5;
        transform: translateX(70px) scale(0.9) translateZ(-100px);
        opacity: 0.9;
      }

      .card.right-1 img {
        filter: grayscale(100%);
      }

      .card.right-2 {
        z-index: 1;
        transform: translateX(120px) scale(0.8) translateZ(-300px);
        opacity: 0.7;
      }

      .card.right-2 img {
        filter: grayscale(100%);
      }

      .card.hidden {
        opacity: 0;
        pointer-events: none;
      }

      .member-info {
        text-align: center;
        margin-top: 40px;
        transition: all 0.5s ease-out;
      }

      .member-name {
        color: #eab308;
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 10px;
        position: relative;
        display: inline-block;
      }

      .member-name::before,
      .member-name::after {
        content: "";
        position: absolute;
        top: 100%;
        width: 100px;
        height: 2px;
        background: #eab308;
      }

      .member-name::before {
        left: -120px;
      }

      .member-name::after {
        right: -120px;
      }

      .member-role {
        color: #848696;
        font-size: 1.5rem;
        font-weight: 500;
        opacity: 0.8;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        padding: 10px 0;
        margin-top: -15px;
        position: relative;
      }

      .dots {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 60px;
      }

      .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: rgba(234, 179, 8, 0.2);
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .dot.active {
        background: #eab308;
        transform: scale(1.2);
      }

      .nav-arrow {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(234, 179, 8, 0.6);
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 20;
        transition: all 0.3s ease;
        font-size: 1.5rem;
        border: none;
        outline: none;
        padding-bottom: 4px;
      }

      .nav-arrow:hover {
        background: rgba(234, 179, 8, 0.8);
        transform: translateY(-50%) scale(1.1);
      }

      .nav-arrow.left {
        left: -150px;
        padding-right: 3px;
      }

      .nav-arrow.right {
        right: -150px;
        padding-left: 3px;
      }

      @media (min-width: 1024px) {
        .nav-arrow.left {
          left: -150px;
        }

        .nav-arrow.right {
          right: -150px;
        }
      }

      @media (max-width: 768px) {
        .card {
          width: 280px;
          height: 275px;
        }

        .card.left-2 {
          transform: translateX(-90px) scale(0.8) translateZ(-300px);
        }

        .card.left-1 {
          transform: translateX(-50px) scale(0.9) translateZ(-100px);
        }

        .card.right-1 {
          transform: translateX(50px) scale(0.9) translateZ(-100px);
        }

        .card.right-2 {
          transform: translateX(90px) scale(0.8) translateZ(-300px);
        }

        .member-name {
          font-size: 2rem;
        }

        .member-role {
          font-size: 1.2rem;
        }

        .member-name::before,
        .member-name::after {
          width: 50px;
        }

        .member-name::before {
          left: -70px;
        }

        .member-name::after {
          right: -70px;
        }

        .nav-arrow {
          display: none;
        }
      }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}