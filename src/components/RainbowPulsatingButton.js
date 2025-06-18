export class RainbowPulsatingButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const button = document.createElement('button');
    button.innerHTML = `
      <div class="content">
        <slot></slot>
      </div>
      <div class="background"></div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      button {
        position: relative;
        display: flex;
        cursor: pointer;
        align-items: center;
        justify-content: center;
        border-radius: 0.5rem;
        padding: 1rem 2rem;
        text-align: center;
        min-width: 200px;
        border: none;
        overflow: hidden;
      }

      .content {
        position: relative;
        z-index: 2;
        color: black;
        font-weight: 900;
        font-size: 1.25rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .background {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, #ff0000, #ffa500, #ffff00, #008000, #0000ff, #4b0082, #ee82ee);
        background-size: 200% 100%;
        animation: rainbow 3s linear infinite, pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes rainbow {
        0% { background-position: 0% 50%; }
        100% { background-position: 200% 50%; }
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }

      /* Hover effect */
      button:hover {
        transform: scale(1.05);
        transition: transform 0.2s ease;
      }

      button:active {
        transform: scale(0.95);
      }
    `;

    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(button);

    // Copy classes from host element to button
    if (this.hasAttribute('class')) {
      button.className = this.getAttribute('class');
    }

    // Copy onclick from host element to button
    if (this.hasAttribute('onclick')) {
      button.setAttribute('onclick', this.getAttribute('onclick'));
    }
  }
}