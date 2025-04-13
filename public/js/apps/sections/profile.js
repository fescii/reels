export default class ProfileSection extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.active_tab = null;
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.app = window.app;
    this.api = this.app.api;
    // Add popstate event listener
    window.addEventListener('popstate', this.handlePopState);
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // Get the content container
    const contentContainer = this.shadowObj.querySelector('div.feeds');
    
    // Get the tabContainer
    const tabContainer = this.shadowObj.querySelector('ul.tabs');

    // if content container and tab container exists
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
    const tabName = this.getAttribute('active') || 'posts';
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

  updateContent = (contentContainer, tabName, url) => {
    const contentMap = {
      'posts': this.getPosts(),
      'replies': this.getReplies(),
      'followers': this.getFollowers(),
      'following': this.getFollowing()
    };

    const content = contentMap[tabName] || this.getReplies();
    contentContainer.innerHTML = content;
    this.app.push(url, { kind: "sub", app: "profile", name: tabName, html: content }, tabName);
  }

  handlePopState = event => {
    const state = event.state;
    if (state && state.kind === 'sub' && state.app === 'profile') {
      this.updateHistory(state.name, state.html)
    }
  }

  updateHistory = (tabName, content) => {
    const contentContainer = this.shadowObj.querySelector('div.feeds');
    const tabs = this.shadowObj.querySelector('ul.tabs');

    try {
      this.active_tab.classList.remove('active');
      const activeTab = tabs.querySelector(`li.${tabName}`);
      activeTab.classList.add('active');
      this.active_tab = activeTab;

      contentContainer.innerHTML = content;

      // update bar underline
      this.updateBarUnderline(activeTab);
    } catch (error) {
      const activeTab = tabs.querySelector('li.posts');
      activeTab.classList.add('active');
      this.active_tab = activeTab;
      contentContainer.innerHTML = this.getPosts()

      // update bar underline
      this.updateBarUnderline(activeTab);
    }
  }

  getTemplate() {
    // Show HTML Here
    return /* html */`
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    return /* html */`
      <div class="content-container">
        <div class="tab-controller">
          ${this.getTab(this.getAttribute('active'))}
        </div>
        ${this.getContent()}
      </div>
    `
  }

  getContent = () => {
    return /* html */`
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
        <li class="tab posts ${tab === "posts" ? "active" : ''}" data-name="posts" url="${url}/posts">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M10.5 8H18.5M10.5 12H13M18.5 12H16M10.5 16H13M18.5 16H16" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 7.5H6C4.11438 7.5 3.17157 7.5 2.58579 8.08579C2 8.67157 2 9.61438 2 11.5V18C2 19.3807 3.11929 20.5 4.5 20.5C5.88071 20.5 7 19.3807 7 18V7.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 3.5H11C10.07 3.5 9.60504 3.5 9.22354 3.60222C8.18827 3.87962 7.37962 4.68827 7.10222 5.72354C7 6.10504 7 6.57003 7 7.5V18C7 19.3807 5.88071 20.5 4.5 20.5H16C18.8284 20.5 20.2426 20.5 21.1213 19.6213C22 18.7426 22 17.3284 22 14.5V9.5C22 6.67157 22 5.25736 21.1213 4.37868C20.2426 3.5 18.8284 3.5 16 3.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Posts</span>
        </li>
        <li class="tab replies ${tab === "replies" ? "active" : ''}" data-name="replies" url="${url}/replies">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M8 13.5H16M8 8.5H12" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.09881 19C4.7987 18.8721 3.82475 18.4816 3.17157 17.8284C2 16.6569 2 14.7712 2 11V10.5C2 6.72876 2 4.84315 3.17157 3.67157C4.34315 2.5 6.22876 2.5 10 2.5H14C17.7712 2.5 19.6569 2.5 20.8284 3.67157C22 4.84315 22 6.72876 22 10.5V11C22 14.7712 22 16.6569 20.8284 17.8284C19.6569 19 17.7712 19 14 19C13.4395 19.0125 12.9931 19.0551 12.5546 19.155C11.3562 19.4309 10.2465 20.0441 9.14987 20.5789C7.58729 21.3408 6.806 21.7218 6.31569 21.3651C5.37769 20.6665 6.29454 18.5019 6.5 17.5" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
          </svg>
          <span class="text">Replies</span>
        </li>
        <li class="tab followers ${tab === "followers" ? "active" : ''}" data-name="followers" url="${url}/followers">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M18.6161 20H19.1063C20.2561 20 21.1707 19.4761 21.9919 18.7436C24.078 16.8826 19.1741 15 17.5 15M15.5 5.06877C15.7271 5.02373 15.9629 5 16.2048 5C18.0247 5 19.5 6.34315 19.5 8C19.5 9.65685 18.0247 11 16.2048 11C15.9629 11 15.7271 10.9763 15.5 10.9312" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
            <path d="M4.48131 16.1112C3.30234 16.743 0.211137 18.0331 2.09388 19.6474C3.01359 20.436 4.03791 21 5.32572 21H12.6743C13.9621 21 14.9864 20.436 15.9061 19.6474C17.7889 18.0331 14.6977 16.743 13.5187 16.1112C10.754 14.6296 7.24599 14.6296 4.48131 16.1112Z" stroke="currentColor" stroke-width="2.0" />
            <path d="M13 7.5C13 9.70914 11.2091 11.5 9 11.5C6.79086 11.5 5 9.70914 5 7.5C5 5.29086 6.79086 3.5 9 3.5C11.2091 3.5 13 5.29086 13 7.5Z" stroke="currentColor" stroke-width="2.0" />
          </svg>
          <span class="text">Followers</span>
        </li>
        <li class="tab following ${tab === "following" ? "active" : ''}" data-name="following" url="${url}/following">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M18.6161 20H19.1063C20.2561 20 21.1707 19.4761 21.9919 18.7436C24.078 16.8826 19.1741 15 17.5 15M15.5 5.06877C15.7271 5.02373 15.9629 5 16.2048 5C18.0247 5 19.5 6.34315 19.5 8C19.5 9.65685 18.0247 11 16.2048 11C15.9629 11 15.7271 10.9763 15.5 10.9312" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
            <path d="M4.48131 16.1112C3.30234 16.743 0.211137 18.0331 2.09388 19.6474C3.01359 20.436 4.03791 21 5.32572 21H12.6743C13.9621 21 14.9864 20.436 15.9061 19.6474C17.7889 18.0331 14.6977 16.743 13.5187 16.1112C10.754 14.6296 7.24599 14.6296 4.48131 16.1112Z" stroke="currentColor" stroke-width="2.0" />
            <path d="M13 7.5C13 9.70914 11.2091 11.5 9 11.5C6.79086 11.5 5 9.70914 5 7.5C5 5.29086 6.79086 3.5 9 3.5C11.2091 3.5 13 5.29086 13 7.5Z" stroke="currentColor" stroke-width="2.0" />
          </svg>
          <span class="text">Following</span>
        </li>
        <span class="bar"></span>
      </ul>
    `;
  }

  getContainer = active => {
    // Switch active tab
    switch (active) {
      case "posts":
        return this.getPosts();
      case "replies":
        return this.getReplies();
      case "followers":
        return this.getFollowers();
      case "following":
        return this.getFollowing();
      default:
        return this.getPosts();
    }
  }

  getPosts = () => {
    return /*html*/`
      <posts-feed hash="${this.getAttribute('hash')}" posts="${this.getAttribute('posts')}" page="1"
        url="${this.getAttribute('posts-url')}"  kind="user">
      </posts-feed>
    `
  }

  getReplies = () => {
    return /* html */`
      <posts-feed hash="${this.getAttribute('hash')}" replies="${this.getAttribute('replies')}" page="1"
        url="${this.getAttribute('replies-url')}" kind="user">
      </posts-feed>
    `
  }

  getFollowers = () => {
    return /*html*/`
      <people-feed hash="${this.getAttribute('hash')}" total="${this.getAttribute('followers')}" page="1"
        url="${this.getAttribute('followers-url')}" kind="followers">
      </people-feed>
    `
  }

  getFollowing = () => {
    return /*html*/`
      <people-feed hash="${this.getAttribute('hash')}" total="${this.getAttribute('following')}" page="1"
        url="${this.getAttribute('following-url')}" kind="following">
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
          min-width: 100%;
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
          background: var(--accent-linear);
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

        @media screen and (max-width: 660px) {
          .tab-control {
            margin: 0;
            position: sticky;
            top: 50px;
          }

          .tab-control > ul.tab > li.tab-item,
					.action,
					a {
						cursor: default !important;
          }

          .feeds {
            padding: 0 10px 30px;
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

          a,
          .stats > .stat {
            cursor: default !important;
          }

          a,
          span.stat,
          ul.tabs > li.tab,
          span.action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}