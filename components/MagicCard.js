class MagicCard {
  constructor(element) {
    this.element = element;
    this.init();
  }

  init() {
    // Add required classes
    this.element.classList.add('relative', 'overflow-hidden');
    
    // Create spotlight element
    const spotlight = document.createElement('div');
    spotlight.className = 'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none';
    this.spotlight = spotlight;
    this.element.appendChild(spotlight);

    // Bind events
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.element.addEventListener('mousemove', this.handleMouseMove);
    
    // Add cleanup method
    this.cleanup = () => {
      this.element.removeEventListener('mousemove', this.handleMouseMove);
      if (this.spotlight && this.spotlight.parentNode) {
        this.spotlight.parentNode.removeChild(this.spotlight);
      }
    };
  }

  handleMouseMove(e) {
    const rect = this.element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.spotlight.style.background = `radial-gradient(600px circle at ${x}px ${y}px, rgba(234, 179, 8, 0.15), transparent 40%)`;
  }
}

export default MagicCard;