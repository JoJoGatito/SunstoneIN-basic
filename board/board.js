document.addEventListener('DOMContentLoaded', () => {
  // Get all board member elements
  const boardMembers = document.querySelectorAll('.board-member');
  
  // Add slight randomization to each sun ray for variety
  boardMembers.forEach(member => {
    const rays = member.querySelector('.rays');
    
    // Random initial rotation for variety
    const initialRotation = Math.floor(Math.random() * 360);
    rays.style.transform = `rotate(${initialRotation}deg)`;
    
    // Random animation duration between 18-25s
    const animationDuration = 18 + Math.floor(Math.random() * 7);
    rays.style.animationDuration = `${animationDuration}s`;
    
    // Random animation direction
    const direction = Math.random() > 0.5 ? 'normal' : 'reverse';
    rays.style.animationDirection = direction;
  });
  
  // Optional: Add entrance animations when scrolling
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        
        // Stagger animation of children elements
        const portrait = entry.target.querySelector('.portrait');
        const info = entry.target.querySelector('.member-info');
        
        setTimeout(() => {
          portrait.classList.add('animate');
        }, 100);
        
        setTimeout(() => {
          info.classList.add('animate');
        }, 300);
      }
    });
  }, {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
  });
  
  boardMembers.forEach(member => {
    observer.observe(member);
  });
});