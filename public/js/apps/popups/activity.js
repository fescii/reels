export default class ActivityPopup extends HTMLElement {
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
    this.disableScroll();
    const btn = this.shadowObj.querySelector('div.header > div.close-btn');
    const contentContainer = this.shadowObj.querySelector('ul.highlights');

    // Close the modal
    if (btn && contentContainer) {
      this.closePopup(btn);
    }
  }

  disconnectedCallback() {
    this.enableScroll()
  }

  convertToBool = str => {
    switch (str) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        return false;
    }
  }

  formatNumber = n => {
    if (n < 1000) return n.toString();
    if (n < 10000) return `${(n / 1000).toFixed(2)}k`;
    if (n < 100000) return `${(n / 1000).toFixed(1)}k`;
    if (n < 1000000) return `${(n / 1000).toFixed(0)}k`;
    if (n < 10000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n < 100000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n < 1000000000) return `${(n / 1000000).toFixed(0)}M`;
    return "1B+";
  }

  parseToNumber = num_str => {
    // Try parsing the string to an integer
    const num = parseInt(num_str);

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

  // close the modal
  closePopup = btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      this.remove();
    });
  }

  getTemplate() {
    return /* html */`
      <section id="content" class="content">
        ${this.getHeader()}
        ${this.getWelcome()}
        <div class="likes">
          ${this.peopleSection()}
        </div>
      </section>
    ${this.getStyles()}`
  }

  getHeader = () => {
    return /* html */`
      <div class="header">
        <div class="close-btn">
          <svg id="Arrow - Left" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.34994 11.9998L19.7502 11.9998" stroke="currentColor" stroke-width="2.0" stroke-linecap="square"></path>
            <path d="M10.8 18.0243L4.74999 12.0003L10.8 5.97534" stroke="currentColor" stroke-width="2.0" stroke-linecap="square"></path>
          </svg>
        </div>
        <span class="text">Activity</span>
      </div>
    `
  }

  getWelcome() {
    return /*html*/`
      <div class="welcome">
				<ul class="highlights">
          ${this.getHighlights()}
        </ul>
			</div>
    `
  }

  peopleSection = () => {
    return /* html */`
      <likes-section kind="${this.getAttribute('story')}" url="${this.getAttribute('url')}" active="likes"
        hash="${this.getAttribute('hash')}" likes="${this.getAttribute('likes')}"
        likes-url="${this.getAttribute('likes-url')}">
      </likes-section>
    `
  }

  getHighlights = () => {
    // Get the number of followers, views, stories and topics
    const likes = this.parseToNumber(this.getAttribute('likes'));
    const you = this.convertToBool(this.getAttribute('liked'));
    const views = this.parseToNumber(this.getAttribute('views'));
    const replies = this.parseToNumber(this.getAttribute('replies'));

    // format the number of followers, views, stories and topics
    const likesFormatted = this.formatNumber(likes);
    const viewsFormatted = this.formatNumber(views);

    // construct you text
    let youText = you ? 'You and ' : '';

    let textContent = `${youText}<span class="numbers">${this.formatNumber(likes - 1)}</span> other ${likes - 1 === 1 ? 'person' : 'people'} likes this`;
    
    if(you && likes === 1) {
      textContent = `You like this content`;
    }
    else if (!you) {
      textContent = `<span class="numbers">${likesFormatted}</span> ${likes === 1 ? 'person' : 'people'} likes this content`;
    }


    return /* html */`
      <li class="item">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"></path>
          </svg>
        </span>
        <span class="link">
          ${textContent}
        </span>
      </li>
      <li class="item">
        <span class="icon increase">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M4.53 4.75A.75.75 0 0 1 5.28 4h6.01a.75.75 0 0 1 .75.75v6.01a.75.75 0 0 1-1.5 0v-4.2l-5.26 5.261a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L9.48 5.5h-4.2a.75.75 0 0 1-.75-.75Z"></path>
          </svg>
        </span>
        <span class="link">
          This content has <span class="numbers" id="views">${viewsFormatted}</span> total ${views === 1 ? 'view' : 'views'}
        </span>
      </li>
      <li class="item">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M6.78 1.97a.75.75 0 0 1 0 1.06L3.81 6h6.44A4.75 4.75 0 0 1 15 10.75v2.5a.75.75 0 0 1-1.5 0v-2.5a3.25 3.25 0 0 0-3.25-3.25H3.81l2.97 2.97a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L1.47 7.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"></path>
          </svg>
        </span>
        <span class="link">
          This content has <span class="numbers" id="replies">${replies === 0 ? 'no' : replies}</span> repl${replies === 1 ? 'y' : 'ies'} so far
        </span>
      </li>
      <div class="empty">
        <p> Views are simply the number of times the this content has been viewed by others.</p>
      </div>
    `
  }

  getLoader() {
    return /* html */`
      <div class="loader-container">
        <span id="btn-loader">
          <span class="loader-alt"></span>
        </span>
      </div>
    `
  }

  getStyles() {
    return /*css*/`
      <style>
        * {
          box-sizing: border-box !important;
        }

        :host {
          border: none;
          background-color: var(--background);
          padding: 0px;
          display: flex;
          flex-flow: column;
          align-items: start;
          gap: 0;
          z-index: 20;
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          left: 0;
          max-height: 100%;
          height: 100%;
          min-height: 100%;
        }

        
        #content::-webkit-scrollbar {
          display: none;
          visibility: hidden;
          width: 0;
        }

        #content {
          box-sizing: border-box !important;
          padding: 0 10px;
          margin: 0;
          width: 100%;
          max-width: 100%;
          max-height: 100%;
          height: 100%;
          min-height: 100%;
          border-radius: 0px;
          border-top: var(--border);
          border-top-right-radius: 15px;
          border-top-left-radius: 15px;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          display: flex;
          flex-flow: column;
        }

        div.likes {
          padding: 0;
          min-width: 100%;
          width: 100%;
        }

        div.header {
          border-bottom: var(--border);
          width: 100%;
          padding: 10px 0;
          margin: 0;
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: start;
          gap: 10px;
          position: sticky;
          top: 0;
          color: var(--text-color);
          background-color: var(--background);
          z-index: 10;
        }

        div.header > div.close-btn {
          display: flex;
          align-items: center;
          gap: 0;
          padding: 0;
        }

        div.header > div.close-btn > svg {
          width: 27px;
          height: 27px;
          display: inline-block;
          margin: 0 0 0 -2px;
        }

        div.header > span.text {
          width: calc(100% - 80px);
          text-align: center;
          font-size: 1.15rem;
          font-weight: 500;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          cursor: pointer;
        }

        .welcome {
          width: 100%;
          padding: 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
        }

        .welcome > h2 {
          width: 100%;
          font-size: 1.2rem;
          margin: 0 0 10px;
          padding: 10px 10px;
          background-color: var(--gray-background);
          text-align: center;
          border-radius: 12px;
        }

        .welcome > .actions {
          width: 100%;
        }

        .welcome > .actions .action {
          background: var(--stage-no-linear);
          text-decoration: none;
          padding: 7px 20px 8px;
          cursor: default;
          margin: 10px 0;
          width: 120px;
          cursor: default !important;
          border-radius: 12px;
        }

        div.empty {
          border-bottom: var(--border);
          width: 100%;
          padding: 0 0 10px;
          margin: 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        div.empty > p {
          width: 100%;
          padding: 0;
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-read), sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
        }

        div.empty > p.italics {
          font-style: italic;
        }

        .welcome > h2 > span.control,
        .welcome > .actions > .action {
          cursor: default !important;
        }
        
        ul.highlights {
          width: 100%;
          padding: 10px 0 0;
          margin: 0;
          list-style-type: none;
          display: flex;
          flex-flow: column;
          gap: 10px;
        }
        
        ul.highlights > li.item {
          padding: 0;
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: row;
          align-items: center;
          flex-wrap: nowrap;
          gap: 10px;
        }
        
        ul.highlights > li.item > .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          width: 26px;
          min-height: 26px;
          min-width: 26px;
          max-height: 26px;
          max-width: 26px;
          padding: 3px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          background-color: var(--gray-background);
          color: var(--gray-color);
          font-size: 0.9rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        ul.highlights > li.item > .icon > svg {
          height: 15px;
          width: 15px;
        }

        ul.highlights > li.item > .icon.increase {
          background: var(--accent-linear);
          color: var(--white-color);
        }

        ul.highlights > li.item > .icon.decrease {
          background: var(--error-linear);
          color: var(--white-color);
        }
        
        ul.highlights > li.item > .link {
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 400;
          text-decoration: none;
        }
        
        ul.highlights > li.item > a.link:hover {
          color: var(--text-color);
        }
        
        ul.highlights > li.item > .link .numbers {
          color: var(--highlight-color);
          font-weight: 600;
          font-family: var(--font-main), sans-serif;
          font-size: 0.95rem;
          display: inline-block;
          margin: 0 0 -2px 0;
        }
        
        ul.highlights > li.item.last {
          background-color: var(--gray-background);
          padding: 10px;
          margin: 5px 0;
          border-radius: 12px;
          -webkit-border-radius: 12px;
        }
      </style>
    `;
  }
}