class ScrollProgress {
  constructor() {
    this.init();
  }

  calculateProgress() {
    const winScroll = window.scrollY;
    const height = document.documentElement.scrollHeight - window.innerHeight;
    return height ? (winScroll / height) * 100 : 0;
  }

  init() {
    // Create container element
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.right = '0';
    container.style.height = '2px';
    container.style.backgroundColor = 'rgba(234, 179, 8, 0.2)'; // yellow-500 with transparency
    container.style.zIndex = '100';

    // Create progress bar element
    const progressBar = document.createElement('div');
    progressBar.id = 'scroll-progress-bar';
    progressBar.style.height = '100%';
    progressBar.style.width = '0%';
    progressBar.style.backgroundColor = '#EAB308'; // yellow-500
    progressBar.style.transition = 'width 0.2s ease-out';
    progressBar.style.backgroundImage = 'linear-gradient(to right, #EAB308, #F59E0B, #EAB308)'; // yellow gradient

    // Add progress bar to container
    container.appendChild(progressBar);

    // Add container to document body
    document.body.appendChild(container);

    // Add scroll event listener
    // Throttled scroll handler
    let ticking = false;
    const scrollHandler = () => {
      progressBar.style.width = `${this.calculateProgress()}%`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(scrollHandler);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);

    // Cleanup function
    this.cleanup = () => {
      window.removeEventListener('scroll', onScroll);
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }
}

export default ScrollProgress;