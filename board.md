# Board Members Page Implementation Plan

## Overview
This plan outlines the implementation of a board members showcase page featuring portraits with sun-shaped glowing rays using gradient colors of orange, yellow, and reds.

## Page Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Our Board Members</title>
    <link rel="stylesheet" href="board.css">
</head>
<body>
    <div class="container">
        <header class="board-header">
            <h1>THE HUMANS THAT MADE THIS REALITY</h1>
            <h2>OUR COUNCIL OF LEADERS</h2>
        </header>
        
        <div class="board-grid">
            <!-- Board Member Template (repeat for each member) -->
            <div class="board-member">
                <div class="member-image-container">
                    <div class="sun-image">
                        <div class="rays"></div>
                        <div class="portrait">
                            <img src="assets/images/board/member1.jpg" alt="Board Member 1">
                        </div>
                    </div>
                </div>
                <div class="member-info">
                    <h3 class="member-name">BOARD MEMBER NAME</h3>
                    <h4 class="member-title">POSITION & ROLE</h4>
                    <p class="member-bio">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent id magna facilisis, bibendum enim in, convallis massa. Nulla facilisi. Vivamus eget libero id felis varius feugiat.</p>
                </div>
            </div>
            
            <!-- Additional board members with the same structure -->
        </div>
    </div>
    
    <script src="board.js"></script>
</body>
</html>
```

## CSS Styling

```css
:root {
  --text-color: #333;
  --background-color: #f5f5f7;
  --card-background: #ffffff;
  --transition-speed: 0.5s;
}

body {
  font-family: 'Arial', sans-serif;
  margin: 0;
  padding: 0;
  background-color: var(--background-color);
  color: var(--text-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.board-header {
  text-align: center;
  margin-bottom: 4rem;
}

.board-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.board-header h2 {
  font-size: 1.8rem;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 3rem;
}

.board-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform var(--transition-speed);
}

.member-image-container {
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

/* Sun Image Styling */
.sun-image {
  position: relative;
  width: 220px;
  height: 220px;
  margin-bottom: 1rem;
}

.portrait {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  z-index: 2;
  margin: 35px; /* Centers the 150px portrait in the 220px container */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: transform var(--transition-speed), box-shadow var(--transition-speed);
}

.portrait img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: var(--transition-speed);
}

/* Rays styling with gradient colors */
.rays {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  animation: rotate 20s linear infinite;
}

.rays::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: conic-gradient(
    transparent 0deg,
    transparent 18deg,
    #FF5E00 20deg, /* Orange */
    #FF9500 22deg,
    #FFCC00 24deg, /* Yellow */
    transparent 27deg,
    transparent 43deg,
    #FF3D00 45deg, /* Deep Orange */
    #FF7700 47deg,
    #FFA700 49deg, /* Orange-Yellow */
    transparent 52deg,
    transparent 68deg,
    #FF5E00 70deg, /* Orange */
    #FF9500 72deg,
    #FFCC00 74deg, /* Yellow */
    transparent 77deg,
    transparent 93deg,
    #FF3D00 95deg, /* Deep Orange */
    #FF7700 97deg,
    #FFA700 99deg, /* Orange-Yellow */
    transparent 102deg,
    transparent 118deg,
    #FF5E00 120deg, /* Orange */
    #FF9500 122deg,
    #FFCC00 124deg, /* Yellow */
    transparent 127deg,
    transparent 143deg,
    #FF3D00 145deg, /* Deep Orange */
    #FF7700 147deg,
    #FFA700 149deg, /* Orange-Yellow */
    transparent 152deg,
    transparent 168deg,
    #FF5E00 170deg, /* Orange */
    #FF9500 172deg,
    #FFCC00 174deg, /* Yellow */
    transparent 177deg,
    transparent 193deg,
    #FF3D00 195deg, /* Deep Orange */
    #FF7700 197deg,
    #FFA700 199deg, /* Orange-Yellow */
    transparent 202deg,
    transparent 218deg,
    #FF5E00 220deg, /* Orange */
    #FF9500 222deg,
    #FFCC00 224deg, /* Yellow */
    transparent 227deg,
    transparent 243deg,
    #FF3D00 245deg, /* Deep Orange */
    #FF7700 247deg,
    #FFA700 249deg, /* Orange-Yellow */
    transparent 252deg,
    transparent 268deg,
    #FF5E00 270deg, /* Orange */
    #FF9500 272deg,
    #FFCC00 274deg, /* Yellow */
    transparent 277deg,
    transparent 293deg,
    #FF3D00 295deg, /* Deep Orange */
    #FF7700 297deg,
    #FFA700 299deg, /* Orange-Yellow */
    transparent 302deg,
    transparent 318deg,
    #FF5E00 320deg, /* Orange */
    #FF9500 322deg,
    #FFCC00 324deg, /* Yellow */
    transparent 327deg,
    transparent 343deg,
    #FF3D00 345deg, /* Deep Orange */
    #FF7700 347deg,
    #FFA700 349deg, /* Orange-Yellow */
    transparent 352deg
  );
  border-radius: 50%;
  opacity: 0.8;
  transform: scale(1.05);
  filter: blur(1px);
}

/* Adding a second layer for more complex rays */
.rays::after {
  content: '';
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: radial-gradient(
    circle at center,
    rgba(255, 204, 0, 0.3) 0%,
    rgba(255, 153, 0, 0.2) 40%,
    rgba(255, 102, 0, 0.1) 60%,
    transparent 70%
  );
  border-radius: 50%;
  z-index: 0;
  filter: blur(5px);
}

/* Rotation animation for rays */
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Subtle pulsating effect */
@keyframes pulse {
  0% {
    transform: scale(1.05);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.05);
    opacity: 0.7;
  }
}

.member-info {
  text-align: center;
  padding: 0 1rem;
}

.member-name {
  font-size: 1.5rem;
  margin: 0 0 0.5rem;
}

.member-title {
  font-size: 1.1rem;
  font-weight: 400;
  color: #666;
  margin: 0 0 1rem;
}

.member-bio {
  font-size: 0.9rem;
  line-height: 1.6;
}

/* Hover Effects - Enhanced glow and slight scale */
.board-member:hover .rays::before {
  animation: pulse 2s ease infinite;
  filter: blur(0.5px);
  opacity: 1;
}

.board-member:hover .portrait {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 153, 0, 0.4);
}

/* Responsive Design */
@media (max-width: 768px) {
  .board-header h1 {
    font-size: 1.8rem;
  }
  
  .board-header h2 {
    font-size: 1.4rem;
  }
  
  .board-grid {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .sun-image {
    width: 200px;
    height: 200px;
  }
  
  .portrait {
    width: 130px;
    height: 130px;
    margin: 35px;
  }
  
  .member-bio {
    font-size: 0.85rem;
  }
}
```

## JavaScript for Animation Effects

```javascript
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
```

## Visual Features

1. **Sun-Shaped Design**:
   - Circular portrait in the center
   - Radiating rays using gradient colors (orange, yellow, red)
   - Continuous slow rotation animation for rays
   - Subtle pulsating effect on hover

2. **Color Treatment**:
   - Full-color portraits (no grayscale effect)
   - Vibrant gradient rays with oranges, yellows, and reds
   - Soft glow effect around the entire sun shape

3. **Animation Effects**:
   - Slow rotation of sun rays (randomized per member)
   - Pulsating effect on hover
   - Slight scaling of portrait on hover
   - Enhanced glow effect on hover

4. **Mobile Responsiveness**:
   - Grid layout adjusts to different screen sizes
   - Single column layout on mobile
   - Appropriate sizing adjustments for smaller screens

## Implementation Steps

1. Create HTML structure with placeholder content for board members
2. Implement CSS styling with sun-shaped design and gradient rays
3. Add JavaScript for animation effects and interaction
4. Test responsiveness across different device sizes
5. Replace placeholder content with actual board member information

## Additional Considerations

- For best performance, optimize image sizes before loading
- Consider preloading images to prevent layout shifts
- For accessibility, ensure sufficient color contrast for text content
- Add ARIA attributes for screen readers where appropriate