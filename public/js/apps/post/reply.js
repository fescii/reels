export default class ReplyPost extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    
    // let's create our shadow root
    this.shadowObj = this.attachShadow({mode: 'open'});

    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
  }

  removeHtml = () => {
    const title = this.getAttribute('preview-title')
    const text = this.getHTML();
    let str = text.replace(/<[^>]*>/g, '');

    str = str.trim();
    let filteredTitle = ''
    if(!title || title === null || title === "null" || title === undefined || title ==="undefined") {
      filteredTitle = ''
    } else {
      filteredTitle = `<h3>${title}</h3>`
    }

    const content = `<p>${this.trimContent(str)}</p>`;

    return `
      ${filteredTitle}
      ${content}
    `
  }

  trimContent = text => {
    // if text is less than 150 characters
    if (text.length <= 250) return text;

    return text.substring(0, 250) + '...';
  }

  getHTML = () => {
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body.innerHTML;
  }
  
  formatNumber = n => {
    if (n >= 0 && n <= 999) {
      return n.toString();
    } else if (n >= 1000 && n <= 9999) {
      const value = (n / 1000).toFixed(2);
      return `${value}k`;
    } else if (n >= 10000 && n <= 99999) {
      const value = (n / 1000).toFixed(1);
      return `${value}k`;
    } else if (n >= 100000 && n <= 999999) {
      const value = (n / 1000).toFixed(0);
      return `${value}k`;
    } else if (n >= 1000000 && n <= 9999999) {
      const value = (n / 1000000).toFixed(2);
      return `${value}M`;
    } else if (n >= 10000000 && n <= 99999999) {
      const value = (n / 1000000).toFixed(1);
      return `${value}M`;
    } else if (n >= 100000000 && n <= 999999999) {
      const value = (n / 1000000).toFixed(0);
      return `${value}M`;
    } else if (n >= 1000000000) {
      return "1B+";
    }
    else {
      return 0;
    }
  }

  parseToNumber = str => {
    // Try parsing the string to an integer
    const num = parseInt(str);

    // Check if parsing was successful
    if (!isNaN(num)) {
      return num;
    } else {
      return 0;
    }
  }

  disableScroll() {
    // Get the current page scroll position
    let scrollTop = window.scrollY || document.documentElement.scrollTop;
    let scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    document.body.classList.add("stop-scrolling");

    // if any scroll is attempted, set this to the previous value
    window.onscroll = function() {
      window.scrollTo(scrollLeft, scrollTop);
    };
  }

  enableScroll() {
    document.body.classList.remove("stop-scrolling");
    window.onscroll = function() {};
  }

  getTemplate() {
    // Show HTML Here
    return /*html*/`
      <div class="welcome">
        <div class="preview">
          ${this.getContent()}
        </div>
      </div>
      ${this.getStyles()}
    `
  }

  getLapseTime = isoDateStr => {
    const dateIso = new Date(isoDateStr); // ISO strings with timezone are automatically handled
    let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert posted time to the current timezone
    const date = new Date(dateIso.toLocaleString('en-US', { timeZone: userTimezone }));

    // Get the current time
    const currentTime = new Date();

    // Get the difference in time
    const timeDifference = currentTime - date;

    // Get the seconds
    const seconds = timeDifference / 1000;

    // Check if seconds is less than 60: return Just now
    if (seconds < 60) {
      return 'Just now';
    }
    // check if seconds is less than 86400: return time AM/PM
    if (seconds < 86400) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    }

    // check if seconds is less than 604800: return day and time
    if (seconds <= 604800) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: true });
    }

    // Check if the date is in the current year:: return date and month short 2-digit year without time
    if (date.getFullYear() === currentTime.getFullYear()) {
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', });
    }
    else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  getContent = () => {
    return /*html*/`
      <p>${this.removeHtml()}</p>
      <span class="meta">
        <span class="by">by</span>
        ${this.getAttribute("author-hash")}
        <span class="sp">•</span>
        <time class="time" datetime="${this.getAttribute('time')}">
          ${this.getLapseTime(this.getAttribute('time'))}
        </time>
      </span>
    `
  }

  getEmpty = () => {
    return /* html */`
      <div class="empty">
        <p>An error has occurred.</p>
        <div class="actions">
          <button class="fetch last">Retry</button>
          <span class="action close" id="close-action">close</span>
        </div>
      </div>
    `
  }

  getStyles() {
    return /*css*/`
      <style>
        * {
          box-sizing: border-box !important;
        }

        :host{
          border: none;
          padding: 0;
          justify-self: end;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-width: 100%;
        }

        .welcome {
          width: 100%;
          height: max-content;
          position: relative;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .preview {
          width: 100%;
          position: relative;
          display: flex;
          flex-flow: column;
          color: var(--text-color);
          line-height: 1.2;
          gap: 0;
          margin: 0;
          padding: 0;
        }

        .preview p,
        .preview h3 {
          margin: 0 0 5px;
          font-family: var(--font-read), sans-serif;
          line-height: 1.2;
        }

        .preview h3 {
          margin: 0 0 5px;
          font-family: var(--font-main), sans-serif;
          color: var(--title-color);
          font-size: 1.1rem;
          font-weight: 500;
        }

        .meta {
          height: max-content;
          display: flex;
          position: relative;
          color: var(--gray-color);
          align-items: center;
          font-family: var(--font-mono),monospace;
          gap: 5px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .meta > span.sp {
          margin: 1px 0 0 0;
        }

        .meta > span.by {
          font-weight: 500;
          font-size: 0.93rem;
          margin: 0 0 1px 1px;
        }

        .meta > span.hash {
          background: var(--action-linear);
          font-family: var(--font-mono), monospace;
          font-size: 0.9rem;
          line-height: 1;
          color: transparent;
          font-weight: 600;
          background-clip: text;
          -webkit-background-clip: text;
          -moz-background-clip: text;
        }

        .meta > time.time {
          font-family: var(--font-text), sans-serif;
          font-size: 0.83rem;
          font-weight: 500;
          margin: 1px 0 0 0;
        }

        @media screen and ( max-width: 660px ) {
          :host {
            border: none;
            justify-self: end;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            min-width: 100%;
          }

          button.fetch,
          .actions > .action.close,
          a {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}