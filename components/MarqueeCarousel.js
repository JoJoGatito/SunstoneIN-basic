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