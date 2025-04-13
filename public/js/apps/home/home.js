export default class AppHome extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.setTitle();
    this.app = window.app;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.mql = window.matchMedia('(max-width: 700px)');
    this.active_tab = null;
    this.render();
    window.addEventListener('popstate', this.handlePopState);
  }

  setTitle = () => {
    // update title of the document
    document.title = 'Home | Explore, create and contribute to ideas that can change the world';
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // fetch content
    this.app.showNav();
    const container = this.shadowObj.querySelector('div.feeds > div.content-container');
    const tabs = this.shadowObj.querySelector('ul.tabs');
    if(tabs && container) this.activateTabController(tabs, container);
    this.watchMediaQuery(this.mql);
  }

  disconnectedCallback() {
    this.enableScroll();
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

        // update bar underline
        this.updateBarUnderline(tab);

        // update the content based on the tab
        this.updateContent(contentContainer, tab.getAttribute('data-name'), url);
      });
    });
  }

  getOrSetActiveTab = tabs => {
    const tabName = this.getAttribute('tab') || 'all';
    // get the tab from the attribute or default to 'all'
    let activeTab = tabs.querySelector('li.active');

    if (!activeTab) {
      // if no tab matches the attribute, set the first tab as active
      activeTab = tabs.querySelector(`li.${tabName}`);
    }

    activeTab.classList.add("active");
    this.active_tab = activeTab;

    // update bar underline
    this.updateBarUnderline(activeTab);
  }

  updateContent = (contentContainer, tabName, url) => {
    const contentMap = {
      'all': this.getAll(),
      'stories': this.getStories(),
      'replies': this.getReplies(),
      'users': this.getUsers()
    };

    const content = contentMap[tabName] || this.getAll();
    contentContainer.innerHTML = content;
    this.app.push(url, { kind: "sub", app: "home", name: tabName, html: content }, tabName);
  }

  handlePopState = event => {
    const state = event.state;
    if (state && state.kind === 'sub' && state.app === 'home') {
      this.updateHistory(state.name, state.html)
    }
  }

  updateHistory = (tabName, content) => {
    const contentContainer = this.shadowObj.querySelector('div.feeds > div.content-container');
    const tabs = this.shadowObj.querySelector('ul.tabs');

    try {
      this.active_tab.classList.remove('active');
      const activeTab = tabs.querySelector(`li.${tabName}`);
      activeTab.classList.add('active');
      this.active_tab = activeTab;
      // update bar underline
      this.updateBarUnderline(activeTab);
      contentContainer.innerHTML = content;
    } catch (error) {
      const activeTab = tabs.querySelector('li.all');
      activeTab.classList.add('active');
      this.active_tab = activeTab;
      contentContainer.innerHTML = this.getAll()

      // update bar underline
      this.updateBarUnderline(activeTab);
    }
  }

  updateBarUnderline = activeTab => {
    // select the bar
    const bar = this.shadowObj.querySelector("ul.tabs > span.bar");
    if (!bar) return;

    // get offset width of the active tab
    // const offsetWidth = activeTab.offsetWidth;
    const width = activeTab.getBoundingClientRect().width;
    const left = activeTab.offsetLeft;

    // console.log('offsetWidth', offsetWidth, 'width', width, 'left', left);

    // style the bar based on the active tab and should be centered and 80% of the width of the tab
    bar.style.width = `${width * 0.8}px`;
    bar.style.left = `${left + (width * 0.1)}px`;
  }

  // watch for mql changes
  watchMediaQuery = mql => {
    mql.addEventListener('change', () => {
      // Re-render the component
      this.render();
    });
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

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getAll = () => {
    return /* html */`
      <home-all stories="recent" recent="${this.getAttribute('recent')}" trending="${this.getAttribute('trending')}" following="${this.getAttribute('following')}"
        feed="${this.getAttribute('trending')}" people="${this.getAttribute('authors-trending')}" people-recent="${this.getAttribute('authors-recent')}">
      </home-all>
    `
  }

  getStories = () => {
    return /* html */`
      <stories-feed url="${this.getAttribute('stories')}" page="1"></stories-feed>
    `
  }

  getReplies = () => {
    return /* html */`
      <replies-feed url="${this.getAttribute('replies')}" page="1"></replies-feed>
    `
  }

  getUsers = () => {
    return /* html */`
      <people-feed url="${this.getAttribute('authors-trending')}" page="1"></people-feed>
    `
  }

  getBody = () => {
    if (this.mql.matches) {
      return /* html */`
        <div class="feeds">
          <div class="tab-controller">
            ${this.getTab(this.getAttribute('tab'))}
          </div>
          <div class="content-container">
            ${this.getCurrent(this.getAttribute('tab'))}
          </div>
        <div>
      `;
    }
    else {
      return /* html */`
        <div class="feeds">
          <div class="tab-controller">
            ${this.getTab(this.getAttribute('tab'))}
          </div>
          <div class="content-container">
            ${this.getCurrent(this.getAttribute('tab'))}
          </div>
        </div>
        <div class="side">
          <home-news url="${this.getAttribute('news')}"></home-news>
          ${this.getInfo()}
        </div>
      `;
    }
  }

  getCurrent = tabName => {
    const tabContentMap = {
      'all': this.getAll,
      'stories': this.getStories,
      'replies': this.getReplies,
      'users': this.getUsers
    };

    return (tabContentMap[tabName] || this.getAll).call(this);
  }

  getTab = tab => {
    return /* html */`
      <ul class="tabs">
        <li class="tab all ${tab === "all" ? "active" : ''}" data-name="all" url="/home/all">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M12.5 3H11.5C7.02166 3 4.78249 3 3.39124 4.39124C2 5.78249 2 8.02166 2 12.5C2 16.9783 2 19.2175 3.39124 20.6088C4.78249 22 7.02166 22 11.5 22C15.9783 22 18.2175 22 19.6088 20.6088C21 19.2175 21 16.9783 21 12.5V11.5" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
            <path d="M22 5.5C22 7.433 20.433 9 18.5 9C16.567 9 15 7.433 15 5.5C15 3.567 16.567 2 18.5 2C20.433 2 22 3.567 22 5.5Z" stroke="currentColor" stroke-width="2.0" />
            <path d="M7 11H11" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 16H15" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">All</span>
        </li>
        <li class="tab stories ${tab === "stories" ? "active" : ''}" data-name="stories" url="/home/stories">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M10.5 8H18.5M10.5 12H13M18.5 12H16M10.5 16H13M18.5 16H16" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 7.5H6C4.11438 7.5 3.17157 7.5 2.58579 8.08579C2 8.67157 2 9.61438 2 11.5V18C2 19.3807 3.11929 20.5 4.5 20.5C5.88071 20.5 7 19.3807 7 18V7.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 3.5H11C10.07 3.5 9.60504 3.5 9.22354 3.60222C8.18827 3.87962 7.37962 4.68827 7.10222 5.72354C7 6.10504 7 6.57003 7 7.5V18C7 19.3807 5.88071 20.5 4.5 20.5H16C18.8284 20.5 20.2426 20.5 21.1213 19.6213C22 18.7426 22 17.3284 22 14.5V9.5C22 6.67157 22 5.25736 21.1213 4.37868C20.2426 3.5 18.8284 3.5 16 3.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Stories</span>
        </li>
        <li class="tab replies ${tab === "replies" ? "active" : ''}" data-name="replies" url="/home/replies">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M8 13.5H16M8 8.5H12" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.09881 19C4.7987 18.8721 3.82475 18.4816 3.17157 17.8284C2 16.6569 2 14.7712 2 11V10.5C2 6.72876 2 4.84315 3.17157 3.67157C4.34315 2.5 6.22876 2.5 10 2.5H14C17.7712 2.5 19.6569 2.5 20.8284 3.67157C22 4.84315 22 6.72876 22 10.5V11C22 14.7712 22 16.6569 20.8284 17.8284C19.6569 19 17.7712 19 14 19C13.4395 19.0125 12.9931 19.0551 12.5546 19.155C11.3562 19.4309 10.2465 20.0441 9.14987 20.5789C7.58729 21.3408 6.806 21.7218 6.31569 21.3651C5.37769 20.6665 6.29454 18.5019 6.5 17.5" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
          </svg>
          <span class="text">Replies</span>
        </li>
        <li class="tab users ${tab === "users" ? "active" : ''}" data-name="users" url="/home/users">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M18.6161 20H19.1063C20.2561 20 21.1707 19.4761 21.9919 18.7436C24.078 16.8826 19.1741 15 17.5 15M15.5 5.06877C15.7271 5.02373 15.9629 5 16.2048 5C18.0247 5 19.5 6.34315 19.5 8C19.5 9.65685 18.0247 11 16.2048 11C15.9629 11 15.7271 10.9763 15.5 10.9312" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
            <path d="M4.48131 16.1112C3.30234 16.743 0.211137 18.0331 2.09388 19.6474C3.01359 20.436 4.03791 21 5.32572 21H12.6743C13.9621 21 14.9864 20.436 15.9061 19.6474C17.7889 18.0331 14.6977 16.743 13.5187 16.1112C10.754 14.6296 7.24599 14.6296 4.48131 16.1112Z" stroke="currentColor" stroke-width="2.0" />
            <path d="M13 7.5C13 9.70914 11.2091 11.5 9 11.5C6.79086 11.5 5 9.70914 5 7.5C5 5.29086 6.79086 3.5 9 3.5C11.2091 3.5 13 5.29086 13 7.5Z" stroke="currentColor" stroke-width="2.0" />
          </svg>
          <span class="text">People</span>
        </li>
        <span class="bar"></span>
      </ul>
    `;
  }

  getInfo = () => {
    return /*html*/`
      <info-container docs="/about/docs" new="/about/new"
       feedback="/about/feedback" request="/about/request" code="/about/code" donate="/about/donate" contact="/about/contact" company="https://github.com/aduki-hub">
      </info-container>
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
	        width: 3px;
	      }

	      *::-webkit-scrollbar-track {
	        background: var(--scroll-bar-background);
	      }

	      *::-webkit-scrollbar-thumb {
	        width: 3px;
	        background: var(--scroll-bar-linear);
	        border-radius: 50px;
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
          margin: 0;
          display: flex;
          justify-content: space-between;
          gap: 30px;
        }

        .feeds {
          display: flex;
          flex-flow: column;
          gap: 0;
          width: calc(55% - 15px);
        }

        .content-container {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          width: 100%;
        }

        div.side {
          padding: 25px 0;
          margin: 0;
          background-color: transparent;
          width: calc(45% - 15px);
          height: max-content;
          display: flex;
          flex-flow: column;
          gap: 20px;
          position: sticky;
          top: 0;
          height: 100vh;
          max-height: 100vh;
          overflow-y: scroll;
          scrollbar-width: none;
        }

        div.side::-webkit-scrollbar {
          visibility: hidden;
          display: none;
        }

        div.tab-controller {
          display: flex;
          z-index: 5;
          padding: 10px 0 0;
          margin: 0;
          width: 100%;
          z-index: 5;
          position: sticky;
          top: 0;
          background: var(--background);
        }

        ul.tabs {
          border-bottom: var(--border);
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

        ul.tabs > span.bar {
          display: flex;
          width: 30px;
          height: 4px;
          background: var(--accent-color);
          position: absolute;
          bottom: -1.5px;
          left: 0;
          border-radius: 5px;
          transition: all 0.3s;
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

        ul.tabs > li.tab.active {
          color: var(--text-color);
          padding: 10px 4px;
          display: flex;
          text-align: center;
        }

        ul.tabs > li.tab.active > svg,
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

        @media screen and (max-width:900px) {
         .feeds {
            width: 58%;
          }

          div.side {
            width: 40%;
          }
        }

        @media screen and (max-width: 660px) {
          :host {
            font-size: 16px;
						padding: 0;
            margin: 0;
            display: flex;
            flex-flow: column;
            justify-content: space-between;
            gap: 0;
					}

          .feeds {
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 0 0 50px;
            width: 100%;
          }

          div.tab-controller {
            display: flex;
            z-index: 5;
            padding: 5px 10px 0;
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

          .content-container {
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 0 10px;
            width: 100%;
          }

          div.side {
            padding: 0;
            margin: 0;
            width: 100%;
          }
        }

				@media screen and (max-width:660px) {
					::-webkit-scrollbar {
						-webkit-appearance: none;
					}

					a,
          ul.tabs > li.tab {
						cursor: default !important;
          }
				}
	    </style>
    `;
  }
}