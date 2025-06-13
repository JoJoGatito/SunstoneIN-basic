## HTML

```html
<!-- Begin Dropdown Menu -->
<div class="swanky">
  <div class="swanky_wrapper">
    <input type="radio" name="radio" id="Donate">
    <label for="Donate">
      <span>Donate</span>
      <div class="lil_arrow"></div>
      <div class="bar"></div>
      <div class="swanky_wrapper__content">
        <ul>
          <li onclick="window.location.href='https://opencollective.com/sunstone-inclusivity-network'">Support Our Mission</li>
        </ul>
      </div>
    </label>

    <input type="radio" name="radio" id="Events">
    <label for="Events">
      <span>Local Events</span>
      <div class="lil_arrow"></div>
      <div class="bar"></div>
      <div class="swanky_wrapper__content">
        <ul>
          <li onclick="window.location.href='local-events.html'">View Events</li>
        </ul>
      </div>
    </label>

    <input type="radio" name="radio" id="Resources">
    <label for="Resources">
      <span>Local Resources</span>
      <div class="lil_arrow"></div>
      <div class="bar"></div>
      <div class="swanky_wrapper__content">
        <ul>
          <li onclick="window.location.href='resources.html'">View Resources</li>
        </ul>
      </div>
    </label>

    <input type="radio" name="radio" id="Groups">
    <label for="Groups">
      <span>Groups</span>
      <div class="lil_arrow"></div>
      <div class="bar"></div>
      <div class="swanky_wrapper__content">
        <ul>
          <li onclick="window.location.href='groups/cafeteria-collective.html'">Cafeteria Collective</li>
          <li onclick="window.location.href='groups/disabitch.html'">Disabitch</li>
          <li onclick="window.location.href='groups/Hue-House.html'">Hue House</li>
          <li onclick="window.location.href='groups/rock-and-stone.html'">Rock & Stone</li>
          <li onclick="window.location.href='groups/sunstone-youth-group.html'">Sunstone Youth Group</li>
        </ul>
      </div>
    </label>

    <input type="radio" name="radio" id="Discord">
    <label for="Discord">
      <span>Discord</span>
      <div class="lil_arrow"></div>
      <div class="bar"></div>
      <div class="swanky_wrapper__content">
        <ul>
          <li onclick="window.location.href='https://discord.gg/5XeapVWHVv'">Join Our Community</li>
        </ul>
      </div>
    </label>
  </div>
</div>
```

## CSS

```css
/* Reset */
ul {
  padding: 0;
  margin: 0;
}

li {
  list-style-type: none;
}

input[type='radio'] {
  display: none;
}

label {
  cursor: pointer;
}

::-webkit-scrollbar {
  display: none;
}

/* Main Styles */
.swanky {
  perspective: 600px;
  width: 225px;
  position: relative;
  margin: auto;
  height: 360px;
}

.swanky_wrapper {
  width: 225px;
  height: auto;
  overflow: hidden;
  border-radius: 4px;
  background: #2a394f;
}

/* Label Styles */
.swanky_wrapper label {
  padding: 25px;
  float: left;
  height: 72px;
  border-bottom: 1px solid #293649;
  position: relative;
  width: 100%;
  color: rgb(239, 244, 250);
  transition: text-indent 0.15s, height 0.3s;
  box-sizing: border-box;
}

.swanky_wrapper label span {
  position: relative;
  top: -3px;
}

.swanky_wrapper label:hover {
  background: rgb(33, 46, 65);
  border-bottom: 1px solid #2A394F;
  text-indent: 4px;
}

.swanky_wrapper label:hover .bar {
  width: 100%;
}

/* Bar Animation */
.bar {
  width: 0px;
  transition: width 0.15s;
  height: 2px;
  position: absolute;
  display: block;
  background: rgb(53, 87, 137);
  bottom: 0;
  left: 0;
}

/* Arrow Styles */
.lil_arrow {
  width: 5px;
  height: 5px;
  transition: transform 0.8s;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  border-top: 2px solid #F5B041;
  border-right: 2px solid #F5B041;
  float: right;
  position: relative;
  top: 6px;
  right: 2px;
  transform: rotate(45deg);
}

/* Content Styles */
.swanky_wrapper__content {
  position: absolute;
  display: none;
  overflow: hidden;
  left: 0;
  width: 100%;
}

.swanky_wrapper__content li {
  width: 100%;
  opacity: 0;
  left: -100%;
  background: #F5B041;
  padding: 25px 0px;
  text-indent: 25px;
  box-shadow: 0px 0px #126CA1 inset;
  transition: box-shadow 0.3s, text-indent 0.3s;
  position: relative;
  color: #2a394f;
  cursor: pointer;
}

.swanky_wrapper__content li:hover {
  background: #F39C12;
  box-shadow: 3px 0px #D68910 inset;
  transition: box-shadow 0.3s linear, text-indent 0.3s linear;
  text-indent: 31px;
}

/* Radio Button States */
input[type='radio']:checked + label .swanky_wrapper__content {
  display: block;
  top: 68px;
  border-bottom: 1px solid rgb(33, 46, 65);
}

input[type='radio']:checked + label > .lil_arrow {
  transition: transform 0.8s;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  transform: rotate(135deg);
  border-top: 2px solid #F5B041;
  border-right: 2px solid #F5B041;
}

input[type='radio']:checked + label {
  height: auto;
  background: #212e41;
  text-indent: 4px;
  transition-property: height;
  transition-duration: 0.6s;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

input[type='radio']:checked + label .bar {
  width: 0;
}

/* Animation for List Items */
@keyframes in {
  from {
    left: -100%;
    opacity: 0;
  }
  to {
    left: 0;
    opacity: 1;
  }
}

input[type='radio']:checked + label li:nth-of-type(1) {
  animation: in 0.15s 0.575s forwards;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

input[type='radio']:checked + label li:nth-of-type(2) {
  animation: in 0.15s 0.7s forwards;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

input[type='radio']:checked + label li:nth-of-type(3) {
  animation: in 0.15s 0.825s forwards;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

input[type='radio']:checked + label li:nth-of-type(4) {
  animation: in 0.15s 0.95s forwards;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

input[type='radio']:checked + label li:nth-of-type(5) {
  animation: in 0.15s 1.075s forwards;
  transition-timing-function: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}