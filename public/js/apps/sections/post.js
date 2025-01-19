export default class PostSection extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // Get default active tab
    this.active_tab = null;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.render();
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

    const contentMap = {
      'replies': this.getReplies(),
      'likes': this.getUsers()
    };

    const content = contentMap[tabName] || this.getReplies();
    
    this.app.replace(activeTab.getAttribute('url'), { kind: "sub", app: "post", name: tabName, html: content }, tabName);

    activeTab.classList.add("");active
    this.active_tab = activeTab;
  }

  updateContent = (contentContainer, tabName, url) => {
    const contentMap = {
      'replies': this.getReplies(),
      'likes': this.getUsers()
    };

    const content = contentMap[tabName] || this.getReplies();
    contentContainer.innerHTML = content;
    this.app.push(url, { kind: "sub", app: "post", name: tabName, html: content }, tabName);
  }

  handlePopState = event => {
    const state = event.state;
    if (state && state.kind === 'sub' && state.app === 'home') {
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
      ${this.getTab(this.getAttribute('active'))}
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
            <path d="M10.5 8H18.5M10.5 12H13M18.5 12H16M10.5 16H13M18.5 16H16" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 7.5H6C4.11438 7.5 3.17157 7.5 2.58579 8.08579C2 8.67157 2 9.61438 2 11.5V18C2 19.3807 3.11929 20.5 4.5 20.5C5.88071 20.5 7 19.3807 7 18V7.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 3.5H11C10.07 3.5 9.60504 3.5 9.22354 3.60222C8.18827 3.87962 7.37962 4.68827 7.10222 5.72354C7 6.10504 7 6.57003 7 7.5V18C7 19.3807 5.88071 20.5 4.5 20.5H16C18.8284 20.5 20.2426 20.5 21.1213 19.6213C22 18.7426 22 17.3284 22 14.5V9.5C22 6.67157 22 5.25736 21.1213 4.37868C20.2426 3.5 18.8284 3.5 16 3.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Stories</span>
          <span class="count">${this.formatNumber(this.getAttribute("replies"))}</span>
        </li>
        <li class="tab likes ${tab === "likes" ? "active" : ''}" data-name="likes" url="${url}/likes">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M8 13.5H16M8 8.5H12" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.09881 19C4.7987 18.8721 3.82475 18.4816 3.17157 17.8284C2 16.6569 2 14.7712 2 11V10.5C2 6.72876 2 4.84315 3.17157 3.67157C4.34315 2.5 6.22876 2.5 10 2.5H14C17.7712 2.5 19.6569 2.5 20.8284 3.67157C22 4.84315 22 6.72876 22 10.5V11C22 14.7712 22 16.6569 20.8284 17.8284C19.6569 19 17.7712 19 14 19C13.4395 19.0125 12.9931 19.0551 12.5546 19.155C11.3562 19.4309 10.2465 20.0441 9.14987 20.5789C7.58729 21.3408 6.806 21.7218 6.31569 21.3651C5.37769 20.6665 6.29454 18.5019 6.5 17.5" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
          </svg>
          <span class="text">Replies</span>
          <span class="count">${this.formatNumber(this.getAttribute("likes"))}</span>
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
      <replies-feed hash="${this.getAttribute('hash')}" replies="${this.getAttribute('replies')}" page="1" no-preview="true"
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

  getLoader = () => {
    return /* html */`
			<post-loader speed="300"></post-loader>
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

        ul.tabs {
          border-bottom: var(--border);
          display: flex;
          z-index: 1;
          flex-flow: row nowrap;
          gap: 15px;
          padding: 22px 0 10px;
          margin: 0;
          width: 100%;
          list-style: none;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          z-index: 5;
          position: sticky;
          top: 0;
          background: var(--background);
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
          padding: 5px 0;
          border-radius: 12px;
          /*background: var(--gray-background);*/
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: 0.3s;
        }

        ul.tabs > li.tab > span.count,
        ul.tabs > li.tab > svg {
          display: none;
        }

        ul.tabs > li.tab.active {
          background: var(--tab-background);
          padding: 5px 10px;
          display: flex;
          text-align: center;
          color: var(--text-color);
        }

        ul.tabs > li.tab.active > span.count,
        ul.tabs > li.tab.active > svg,
        ul.tabs > li.tab:not(.active):hover > span.count,
        ul.tabs > li.tab:not(.active):hover > svg {
          display: flex;
        }

        /* style hover tab: but don't touch tab with active class */
        ul.tabs > li.tab:not(.active):hover {
          background: var(--tab-background);
          padding: 5px 10px;
          color: var(--text-color);
        }

        ul.tabs > li.tab > svg {
          width: 19px;
          height: 19px;
        }

        ul.tabs > li.tab > .text {
          font-size: 1rem;
          padding: 0 5px 0 0;
          font-weight: 500;
        }

        ul.tabs > li.tab > .count {
          font-size: 0.85rem;
          display: none;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-weight: 500;
          background: var(--accent-linear);
          font-family: var(--font-text), sans-serif;
          color: var(--white-color);
          padding: 1px 7px 2.5px;
          border-radius: 10px;
        }

        @media screen and (max-width: 660px) {
          :host {
            padding: 0;
          }

          .tab-control {
            border-bottom: var(--border);
            margin: 0;
            position: sticky;
            top: 50px;
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          a,.tab-control > ul.tab > li.tab-item,
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