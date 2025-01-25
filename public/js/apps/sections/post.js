export default class PostSection extends HTMLElement {
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
    // Select content container
    const contentContainer = this.shadowObj.querySelector('div.content-container > div.feeds');
    // Select the tabContainer
    const tabContainer = this.shadowObj.querySelector('ul.tabs');

    // If contentContainer and tabContainer exists
    if (contentContainer && tabContainer) {
      this.activateTabController(tabContainer, contentContainer)
    }
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

  activateTabController = (tabs, contentContainer) => {
    // get the active tab
    this.getOrSetActiveTab(tabs);

    // add click event listener to the tabs
    tabs.querySelectorAll("li").forEach(tab => {
      tab.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();

        if(this.active_tab.dataset.name === tab.dataset.name) return;

        // remove the active class from the active tab
        this.active_tab.classList.remove("active");

        // set the new active tab
        this.active_tab = tab;
        this.active_tab.classList.add("active");
        const url = tab.getAttribute('url');

        // update the content based on the tab
        this.updateContent(contentContainer, tab.getAttribute('data-name'), url);
      });
    });
  }

  getOrSetActiveTab = tabs => {
    const tabName = this.getAttribute('active') || 'all';
    // get the tab from the attribute or default to 'all'
    let activeTab = tabs.querySelector('li.active');

    if (!activeTab) {
      // if no tab matches the attribute, set the first tab as active
      activeTab = tabs.querySelector(`li.${tabName}`);
    }

    activeTab.classList.add("active");
    this.active_tab = activeTab;
  }

  updateContent = (contentContainer, tabName, url) => {
    const contentMap = {
      'replies': this.getReplies(),
      'likes': this.getLikes()
    };

    const content = contentMap[tabName] || this.getReplies();
    contentContainer.innerHTML = content;
    this.app.push(url, { kind: "sub", app: "post", name: tabName, html: content }, tabName);
  }

  handlePopState = event => {
    const state = event.state;
    if (state && state.kind === 'sub' && state.app === 'post') {
      this.updateHistory(state.name, state.html)
    }
  }

  updateHistory = (tabName, content) => {
    const contentContainer = this.shadowObj.querySelector('div.content-container > div.feeds');
    const tabs = this.shadowObj.querySelector('ul.tabs');

    try {
      this.active_tab.classList.remove('active');
      const activeTab = tabs.querySelector(`li.${tabName}`);
      activeTab.classList.add('active');
      this.active_tab = activeTab;

      contentContainer.innerHTML = content;
    } catch (error) {
      console.log(error)
      const activeTab = tabs.querySelector('li.all');
      activeTab.classList.add('active');
      this.active_tab = activeTab;
      contentContainer.innerHTML = this.getAll()
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
      <div class="content-container">
        ${this.getContent()}
      </div>
    `
  }

  getContent = () => {
    return /* html */`
      <div class="tab-controller">
        ${this.getTab(this.getAttribute('active'))}
      </div>
      <div class="feeds">
        ${this.getContainer(this.getAttribute('active'))}
      </div>
		`
  }


  getTab = tab => {
    // Get url 
    let url = this.getAttribute('url');

    // convert url to lowercase
    url = url.toLowerCase();

    return /* html */`
      <ul class="tabs">
        <li class="tab replies ${tab === "replies" ? "active" : ''}" data-name="replies" url="${url}/replies">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M8 13.5H16M8 8.5H12" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.09881 19C4.7987 18.8721 3.82475 18.4816 3.17157 17.8284C2 16.6569 2 14.7712 2 11V10.5C2 6.72876 2 4.84315 3.17157 3.67157C4.34315 2.5 6.22876 2.5 10 2.5H14C17.7712 2.5 19.6569 2.5 20.8284 3.67157C22 4.84315 22 6.72876 22 10.5V11C22 14.7712 22 16.6569 20.8284 17.8284C19.6569 19 17.7712 19 14 19C13.4395 19.0125 12.9931 19.0551 12.5546 19.155C11.3562 19.4309 10.2465 20.0441 9.14987 20.5789C7.58729 21.3408 6.806 21.7218 6.31569 21.3651C5.37769 20.6665 6.29454 18.5019 6.5 17.5" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
          </svg>
          <span class="text">Replies</span>
          <span class="bar"></span>
        </li>
        <li class="tab likes ${tab === "likes" ? "active" : ''}" data-name="likes" url="${url}/likes">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M18.6161 20H19.1063C20.2561 20 21.1707 19.4761 21.9919 18.7436C24.078 16.8826 19.1741 15 17.5 15M15.5 5.06877C15.7271 5.02373 15.9629 5 16.2048 5C18.0247 5 19.5 6.34315 19.5 8C19.5 9.65685 18.0247 11 16.2048 11C15.9629 11 15.7271 10.9763 15.5 10.9312" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
            <path d="M4.48131 16.1112C3.30234 16.743 0.211137 18.0331 2.09388 19.6474C3.01359 20.436 4.03791 21 5.32572 21H12.6743C13.9621 21 14.9864 20.436 15.9061 19.6474C17.7889 18.0331 14.6977 16.743 13.5187 16.1112C10.754 14.6296 7.24599 14.6296 4.48131 16.1112Z" stroke="currentColor" stroke-width="2.0" />
            <path d="M13 7.5C13 9.70914 11.2091 11.5 9 11.5C6.79086 11.5 5 9.70914 5 7.5C5 5.29086 6.79086 3.5 9 3.5C11.2091 3.5 13 5.29086 13 7.5Z" stroke="currentColor" stroke-width="2.0" />
          </svg>
          <span class="text">Likes</span>
          <span class="bar"></span>
        </li>
      </ul>
    `;
  }

  getContainer = active => {
    // Switch between replies and likes
    switch (active) {
      case "replies":
        return this.getReplies();
      case "likes":
        return this.getLikes();
      default:
        return this.getReplies();
    }
  }

  getReplies = () => {
    return /*html*/`
      <replies-feed section="post" hash="${this.getAttribute('hash')}" replies="${this.getAttribute('replies')}" page="1" no-preview="true"
        url="${this.getAttribute('replies-url')}" kind="${this.getAttribute('kind')}">
      </replies-feed>
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

        div.tab-controller {
          display: flex;
          z-index: 5;
          padding: 0;
          margin: 0;
          width: 100%;
          z-index: 5;
          position: sticky;
          top: 0;
          background: var(--background);
        }

        ul.tabs {
          border-bottom: var(--border);
          border-top: var(--border);
          display: flex;
          flex-flow: row nowrap;
          gap: 15px;
          padding: 0;
          margin: 0;
          width: 100%;
          list-style: none;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        ul.tabs::-webkit-scrollbar {
          display: none;
          visibility: hidden;
        }

        ul.tabs > li.tab {
          display: flex;
          flex-flow: row;
          align-items: center;
          gap: 5px;
          padding: 10px 0;
          color: var(--gray-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        ul.tabs > li.tab > span.count,
        ul.tabs > li.tab > svg {
          display: none;
        }

        ul.tabs > li.tab > span.bar {
          display: none;
          width: 100%;
          height: 4px;
          background: var(--accent-color);
          position: absolute;
          bottom: 0;
          left: 0;
          border-radius: 12px 12px 0 0;
        }

        ul.tabs > li.tab.active {
          color: var(--text-color);
          padding: 10px 4px 12px;
          display: flex;
          text-align: center;
        }

        ul.tabs > li.tab.active > svg,
        ul.tabs > li.tab.active > span.bar,
        ul.tabs > li.tab:not(.active):hover > span.bar,
        ul.tabs > li.tab:not(.active):hover > svg {
          display: flex;
        }

        /* style hover tab: but don't touch tab with active class */
        ul.tabs > li.tab:not(.active):hover {
          padding: 10px 2px;
          color: var(--text-color);
        }

        ul.tabs > li.tab > svg {
          display: none;
          margin-bottom: -2px;
          width: 17px;
          height: 17px;
        }

        ul.tabs > li.tab > .text {
          font-size: 0.95rem;
          font-family: var(--font-text), sans-serif;
          padding: 0 2px 0 0;
          font-weight: 500;
        }

        ul.tabs > li.tab > .count {
          font-size: 0.95rem;
          display: none;
          margin-bottom: -2px;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-weight: 500;
          background: var(--text-color);
          font-family: var(--font-text), sans-serif;
          color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          padding: 0;
          border-radius: 10px;
        }

        @media screen and (max-width: 660px) {
          :host {
            padding: 0 0 30px;
          }

          div.tab-controller {
            display: flex;
            z-index: 5;
            padding: 0 10px;
            margin: 0;
            width: 100%;
            z-index: 5;
            position: sticky;
            top: 0;
            background: var(--background);
          }

          ul.tabs > li.tab:not(.active):hover > span.count,
          ul.tabs > li.tab:not(.active):hover > span.bar,
          ul.tabs > li.tab:not(.active):hover > svg {
            /* unset hover effect on mobile */
            display: none;
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          div.content-container > .feeds {
            padding: 0 10px;
          }

					.action,
          ul.tabs > li.tab,
          .stats > .stat,
          span.stat,
          span.action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}