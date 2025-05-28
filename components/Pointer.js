export default function Pointer() {
  let mouseX = 0;
  let mouseY = 0;
  let destinationX = 0;
  let destinationY = 0;
  let speed = 0.15; // Increased for more responsive movement

  // Create pointer element
  const pointer = document.createElement('div');
  pointer.className = 'custom-pointer';
  document.body.appendChild(pointer);

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .custom-pointer {
      width: 32px;
      height: 32px;
      background: url('../cursors/default-cursor.png') center/contain no-repeat;
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      transition: width 0.2s, height 0.2s, background 0.2s;
      mix-blend-mode: difference;
    }
    
    a:hover ~ .custom-pointer,
    button:hover ~ .custom-pointer {
      width: 40px;
      height: 40px;
      background: url('../cursors/hover-cursor.png') center/contain no-repeat;
    }

    /* Hide default cursor */
    * {
      cursor: none !important;
    }
  `;
  document.head.appendChild(style);

  // Smooth animation
  let animationFrame;
  
  function animate() {
    let distX = destinationX - mouseX;
    let distY = destinationY - mouseY;
    
    mouseX += distX * speed;
    mouseY += distY * speed;

    pointer.style.left = `${mouseX - pointer.offsetWidth / 2}px`;
    pointer.style.top = `${mouseY - pointer.offsetHeight / 2}px`;

    animationFrame = requestAnimationFrame(animate);
  }

  // Cleanup function
  function cleanup() {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    document.removeEventListener('mousemove', handleMouseMove);
  }

  // Add cleanup on page unload
  window.addEventListener('unload', cleanup);

  // Track mouse movement
  document.addEventListener('mousemove', (e) => {
    destinationX = e.clientX;
    destinationY = e.clientY;
  });

  // Start animation
  animate();
}