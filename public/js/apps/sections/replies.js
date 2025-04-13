export default class RepliesSection extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.app = window.app;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.mql = window.matchMedia('(max-width: 660px)');
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const btn = this.shadowObj.querySelector('.activity-container > span.action');
    if (btn) this.activateActivity(btn);
  }

  addReply = reply => {
    const repliesFeed = this.shadowObj.querySelector('replies-feed');
    if (repliesFeed) repliesFeed.setReply(reply);
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

  activateActivity = btn => {
    if (this.mql.matches) {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        this.disableScroll();
        document.body.insertAdjacentHTML('beforeend', this.getHighlights());
      });
    }
  }

  formatNumber = numStr => {
    try {
      const num = parseInt(numStr);

      // less than a thousand: return the number
      if (num < 1000) return num;

      // less than a 10,000: return the number with a k with two decimal places
      if (num < 10000) return `${(num / 1000).toFixed(2)}k`;

      // less than a 100,000: return the number with a k with one decimal place
      if (num < 100000) return `${(num / 1000).toFixed(1)}k`;

      // less than a million: return the number with a k with no decimal places
      if (num < 1000000) return `${Math.floor(num / 1000)}k`;

      // less than a 10 million: return the number with an m with two decimal places
      if (num < 10000000) return `${(num / 1000000).toFixed(2)}M`;

      // less than a 100 million: return the number with an m with one decimal place
      if (num < 100000000) return `${(num / 1000000).toFixed(1)}M`;

      // less than a billion: return the number with an m with no decimal places
      if (num < 1000000000) return `${Math.floor(num / 1000000)}M`;

      // a billion or more: return the number with a B+
      if (num >= 1000000000) return `${Math.floor(num / 1000000000)}B+`;

      // else return the zero
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
    return /* html */`
      <div class="activity-content">
        <div class="activity-container">
          <h4 class="title">Replies</h4>
          ${this.getAction(this.mql)}
        </div>
        <div class="content-container">
          ${this.getContent()}
        </div>
      </div>
    `
  }

  getAction = mql => {
    let likes = parseInt(this.getAttribute('replies'), 10);
    if(isNaN(likes)) likes = 0;
    const text = likes === 1 ? 'Reply' : 'Replies';
    if (mql.matches) {
      return /* html */`
        <span class="action">
          <span class="text">View activity</span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      `
    } else {
      return /* html */`
        <span class="no">${this.formatNumber(this.getAttribute('replies'))} ${text}</span>
      `
    }
  }

  getHighlights = () => {
    return /* html */`
      <activity-popup name="post" kind="${this.getAttribute('kind')}" hash="${this.getAttribute('hash')}"
        likes="${this.getAttribute('likes')}" liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}"
        replies="${this.getAttribute('replies')}" author-name="${this.getAttribute('author-name')}"
        likes-url="${this.getAttribute('likes-url')}" liked="${this.getAttribute('liked')}">
      </activity-popup>
    `
  }

  getContent = () => {
    return /* html */`
      <div class="feeds">
        ${this.getReplies()}
      </div>
		`
  }

  getReplies = () => {
    return /*html*/`
      <posts-feed section="post" hash="${this.getAttribute('hash')}" replies="${this.getAttribute('replies')}" page="1" no-preview="true"
        url="${this.getAttribute('replies-url')}" kind="${this.getAttribute('kind')}">
      </posts-feed>
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

        div.activity-content {
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        div.activity-container {
          border-top: var(--border);
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

        span.action > span.text {
          font-size: 0.9rem;
          color: var(--text-color);
        }

        div.activity-container > span.action > svg {
          width: 20px;
          height: 20px;
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

          div.activity-content {
            padding: 0 10px;
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