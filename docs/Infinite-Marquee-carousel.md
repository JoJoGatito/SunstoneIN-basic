# Infinite Marquee Carousel - Tailwind Version

## 1. HTML Structure

```html
<div class="relative flex overflow-hidden gap-4 rounded-lg select-none">
  <div class="relative flex items-center flex-shrink-0 gap-4 cursor-grab scrollingX">
    <!-- Card 1 -->
    <div class="max-w-md bg-black p-4 rounded-lg text-white border border-gray-800">
      <article class="font-dyslexie">
        <picture class="relative min-w-[200px]">
          <source media="(min-width: 768px)" srcset="1.jpg">
          <img src="1.jpg" alt="" class="w-full h-[340px] rounded-md object-cover object-[50%_15%]">
        </picture>
        <h4 class="text-xl capitalize my-4 text-yellow-500 font-bold">Title 1</h4>
        <article class="short-description">
          <p class="text-sm font-light leading-5 mb-5">Description 1</p>
        </article>
      </article>
    </div>
    
    <!-- Card 2 -->
    <div class="max-w-md bg-black p-4 rounded-lg text-white border border-gray-800">
      <article class="font-dyslexie">
        <picture class="relative min-w-[200px]">
          <source media="(min-width: 768px)" srcset="2.jpg">
          <img src="2.jpg" alt="" class="w-full h-[340px] rounded-md object-cover object-[50%_15%]">
        </picture>
        <h4 class="text-xl capitalize my-4 text-yellow-500 font-bold">Title 2</h4>
        <article class="short-description">
          <p class="text-sm font-light leading-5 mb-5">Description 2</p>
        </article>
      </article>
    </div>
    
    <!-- Add more cards here -->
  </div>
</div>
```

## 2. Animation Styles

Add these styles to your `<style>` tag in your HTML file:

```css
@keyframes scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(calc(-100% - 1rem));
  }
}

.scrollingX {
  animation: scroll 45s linear infinite;
}

/* Pause animation on hover */
.relative:hover .scrollingX {
  animation-play-state: paused;
}

/* Make carousel scrollable on mobile/tablet */
@media (max-width: 1024px) {
  .scrollingX {
    overflow-x: auto;
  }
}
```

## 3. JavaScript Component Implementation

Create a new file in your components directory named `MarqueeCarousel.js`:

```javascript
export default class MarqueeCarousel {
  constructor(element) {
    this.element = element;
    this.scrollingContent = element.querySelector('.scrollingX');
    this.isDragging = false;
    this.startX = 0;
    this.scrollLeft = 0;
    
    this.initEventListeners();
  }
  
  initEventListeners() {
    // Mouse events for drag scrolling
    this.scrollingContent.addEventListener('mousedown', this.onMouseDown.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Touch events for mobile
    this.scrollingContent.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.scrollingContent.addEventListener('touchmove', this.onTouchMove.bind(this));
    this.scrollingContent.addEventListener('touchend', this.onTouchEnd.bind(this));
  }
  
  onMouseDown(e) {
    this.isDragging = true;
    this.startX = e.pageX - this.scrollingContent.offsetLeft;
    this.scrollLeft = this.scrollingContent.scrollLeft;
    this.scrollingContent.style.animationPlayState = 'paused';
    this.scrollingContent.style.cursor = 'grabbing';
  }
  
  onMouseMove(e) {
    if (!this.isDragging) return;
    const x = e.pageX - this.scrollingContent.offsetLeft;
    const walk = (x - this.startX) * 2; // Faster scroll
    this.scrollingContent.scrollLeft = this.scrollLeft - walk;
  }
  
  onMouseUp() {
    this.isDragging = false;
    this.scrollingContent.style.cursor = 'grab';
    this.scrollingContent.style.animationPlayState = 'running';
  }
  
  onTouchStart(e) {
    this.isDragging = true;
    this.startX = e.touches[0].pageX - this.scrollingContent.offsetLeft;
    this.scrollLeft = this.scrollingContent.scrollLeft;
    this.scrollingContent.style.animationPlayState = 'paused';
  }
  
  onTouchMove(e) {
    if (!this.isDragging) return;
    const x = e.touches[0].pageX - this.scrollingContent.offsetLeft;
    const walk = (x - this.startX) * 2;
    this.scrollingContent.scrollLeft = this.scrollLeft - walk;
  }
  
  onTouchEnd() {
    this.isDragging = false;
    this.scrollingContent.style.animationPlayState = 'running';
  }
  
  // Clean up event listeners when component is destroyed
  cleanup() {
    this.scrollingContent.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    this.scrollingContent.removeEventListener('touchstart', this.onTouchStart);
    this.scrollingContent.removeEventListener('touchmove', this.onTouchMove);
    this.scrollingContent.removeEventListener('touchend', this.onTouchEnd);
  }
}
```

## 4. Integration with Site

Import and initialize the component in your script section:

```javascript
import MarqueeCarousel from './components/MarqueeCarousel.js';

// Initialize components after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize marquee carousels
  const carousels = Array.from(document.querySelectorAll('.marquee-wrapper')).map(
    carousel => new MarqueeCarousel(carousel)
  );
  
  // Cleanup on page unload
  window.addEventListener('unload', () => {
    carousels.forEach(carousel => carousel.cleanup && carousel.cleanup());
  });
});
```

## 5. Integration with Group Events

The carousel can be used to display the group cards with their upcoming events, following the current site pattern:

```html
<div class="relative flex overflow-hidden gap-4 rounded-lg select-none">
  <div class="relative flex items-center flex-shrink-0 gap-4 cursor-grab scrollingX">
    <!-- Cafeteria Collective Card -->
    <div class="max-w-md bg-black p-4 rounded-lg text-white border border-gray-800">
      <article class="font-dyslexie">
        <picture class="relative min-w-[200px]">
          <img src="images/Cafeteria card.webp" alt="Cafeteria Collective" class="w-full h-[340px] rounded-md object-cover object-[50%_15%]">
        </picture>
        <div class="group-event-container absolute bottom-[25%] left-[5%] right-[5%] z-10">
          <!-- Events will be loaded here by group-events.js -->
        </div>
      </article>
    </div>
    
    <!-- Rock and Stone Card -->
    <div class="max-w-md bg-black p-4 rounded-lg text-white border border-gray-800">
      <article class="font-dyslexie">
        <picture class="relative min-w-[200px]">
          <img src="images/Rock Stone card.webp" alt="Rock and Stone" class="w-full h-[340px] rounded-md object-cover object-[50%_15%]">
        </picture>
        <div class="group-event-container absolute bottom-[25%] left-[5%] right-[5%] z-10">
          <!-- Events will be loaded here by group-events.js -->
        </div>
      </article>
    </div>
    
    <!-- Add other group cards following the same pattern -->
  </div>
</div>
```

The existing `group-events.js` will handle loading and displaying the upcoming event for each group in their respective containers.