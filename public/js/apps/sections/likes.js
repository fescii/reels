export default class LikesSection extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.app = window.app;
    this.active_tab = null;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.render();
    // Add popstate event listener
    window.addEventListener('popstate', this.handlePopState);
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
  }

  disableScroll() {
    // Get the current page scroll position
    let scrollTop = window.scrollY || document.documentElement.scrollTop;
    let scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    document.body.classList.add("stop-scrolling");

    // if any scroll is attempted, set this to the previous value
    window.onscroll = function () {
      window.scrollTo(scrollLeft, scrollTop);
    };
  }

  enableScroll() {
    document.body.classList.remove("stop-scrolling");
    window.onscroll = function () { };
  }

  formatNumber(numStr) {
    try {
      const num = parseInt(numStr, 10);
      if (num < 1000) return num;
      if (num < 10000) return `${(num / 1000).toFixed(2)}k`;
      if (num < 100000) return `${(num / 1000).toFixed(1)}k`;
      if (num < 1000000) return `${Math.floor(num / 1000)}k`;
      if (num < 10000000) return `${(num / 1000000).toFixed(2)}M`;
      if (num < 100000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num < 1000000000) return `${Math.floor(num / 1000000)}M`;
      if (num >= 1000000000) return `${Math.floor(num / 1000000000)}B+`;
      return '0';
    } catch (error) {
      return '0';
    }
  }

  getTemplate() {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    let likes = parseInt(this.getAttribute('likes'), 10);
    if(isNaN(likes)) likes = 0;
    const text = likes === 1 ? 'Like' : 'Likes';
    return /* html */`
      <div class="activity-container">
        <h4 class="title">Likes</h4>
        <span class="no">${this.formatNumber(this.getAttribute('likes'))} ${text}</span>
      </div>
      <div class="content-container">
        ${this.getContent()}
      </div>
    `
  }

  getContent = () => {
    return /* html */`
      <div class="feeds">
        ${this.getLikes()}
      </div>
		`
  }

  getLikes = () => {
    return /*html*/`
      <people-feed hash="${this.getAttribute('hash')}" total="${this.getAttribute('likes')}" page="1"
        url="${this.getAttribute('likes-url')}" kind="likes">
      </people-feed>
    `
  }

  getStyles() {
    return /* css */`
      <style>
        *,
        *:after,
        *:before {
          box-sizing: border-box !important;
          font-family: inherit;
          -webkit-box-sizing: border-box !important;
        }

        *:focus {
          outline: inherit !important;
        }

        *::-webkit-scrollbar {
          -webkit-appearance: none;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          padding: 0;
          margin: 0;
          font-family: inherit;
        }

        p,
        ul,
        ol {
          padding: 0;
          margin: 0;
        }

        a {
          text-decoration: none;
        }

        :host {
          font-size: 16px;
          padding: 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0px;
        }

        div.content-container {
          position: relative;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        div.content-container > .feeds {
          width: 100%;
          display: flex;
          flex-flow: column;
          align-items: start;
          gap: 0;
        }

        div.activity-container {
          border-bottom: var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0 10px;
          margin: 0;
          width: 100%;
          background: var(--background);
        }

        div.activity-container > h4.title {
          font-size: 1.1rem;
          font-weight: 500;
          font-family: var(--font-text), sans-serif;
          color: var(--text-color);
        }

        span.action {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 1rem;
          color: var(--text-color);
          cursor: pointer;
        }

        span.no {
          font-size: 1rem;
          color: var(--text-color);
          font-family: var(--font-read), sans-serif;
        }

        @media screen and (max-width: 660px) {
          :host {
            padding: 0 0 30px;
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          div.content-container > .feeds {
            padding: 0;
          }

					a,
          span.stat,
          span.action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}