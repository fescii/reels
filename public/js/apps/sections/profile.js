export default class ProfileSection extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // Get default active tab
    this._active = this.getAttribute('active');

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // Get the content container
    const contentContainer = this.shadowObj.querySelector('div.feeds');
    
    // Get the tabContainer
    const tabContainer = this.shadowObj.querySelector('ul#tab');

    // if content container and tab container exists
    if (contentContainer && tabContainer) {
      this.updateActiveTab(this._active);
      this.activateTab(contentContainer, tabContainer);
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

  updateActiveTab = active => {
    // Select tab with active class
    const tab = this.shadowObj.querySelector(`ul#tab > li.${active}`);

    // select line
    const line = this.shadowObj.querySelector('ul#tab span.line');

    if (tab && line) {
      tab.classList.add('active');

      // Calculate half tab width - 10px
      const tabWidth = (tab.offsetWidth/2) - 20;

      // update line
      line.style.left = `${tab.offsetLeft + tabWidth}px`;
    }
    else {
      // Select the stories tab
      const storiesTab = this.shadowObj.querySelector("ul#tab > li.stories");
      storiesTab.classList.add('active');
    }
  }

  activateTab = (contentContainer, tabContainer) => {
    const outerThis = this;

    if (tabContainer && contentContainer) {
      const line = tabContainer.querySelector('span.line');
      const tabItems = tabContainer.querySelectorAll('li.tab-item');
      let activeTab = tabContainer.querySelector('li.tab-item.active');

      tabItems.forEach(tab => {
        tab.addEventListener('click', e => {
          e.preventDefault()
          e.stopPropagation()

          // Calculate half tab width - 10px
          const tabWidth = (tab.offsetWidth/2) - 20;

          line.style.left = `${tab.offsetLeft + tabWidth}px`;

          if (tab.dataset.element === activeTab.dataset.element) {
            return;
          }
          else {
            activeTab.classList.remove('active');
            tab.classList.add('active');
            activeTab = tab;

            // get current feed
            const currentFeed = outerThis.getCurrentFeed(tab.dataset.element);

            // Updating History State
            window.history.pushState(
              { tab: tab.dataset.element, content: currentFeed},
              tab.dataset.element, `${tab.getAttribute('url')}`
            );

            // update active attribute
            outerThis.setAttribute('active', tab.dataset.element);

            const tabName = tab.dataset.element; 

            if (tabName === "stories") {
              contentContainer.innerHTML = outerThis.getStories();
            } else if (tabName === "replies") {
              contentContainer.innerHTML = outerThis.getReplies();
            } else if (tabName === "followers") {
              contentContainer.innerHTML = outerThis.getFollowers();
            } else if (tabName === "following") {
              contentContainer.innerHTML = outerThis.getFollowing();
            }
          }
        })
      })

      // Update state on window.onpopstate
      window.onpopstate = event => {
        // This event will be triggered when the browser's back button is clicked

        if (event.state) {
          if (event.state.popup) {
            return;
          }
          if (event.state.page) {
            outerThis.updatePage(event.state.content)
          }
          else if (event.state.tab) {
            // Select the state tab
            const tab = outerThis.shadowObj.querySelector(`ul#tab > li.${event.state.tab}`);

            if (tab) {
              activeTab.classList.remove('active');

              tab.classList.add('active');
              activeTab = tab;

              // Calculate half tab width - 10px
              const tabWidth = (tab.offsetWidth/2) - 20;

              // update line 
              line.style.left = `${tab.offsetLeft + tabWidth}px`;

              outerThis.updateState(event.state, contentContainer);

              //Update active attribute
              outerThis.setAttribute('active', event.state.tab);
            }
          }
        }
        else {
          // Select li with class name as current and content Container
          const currentTab = tabContainer.querySelector(`li.tab-item.${this._active}`);
          if (currentTab) {
            activeTab.classList.remove('active');
            activeTab = currentTab;
            currentTab.classList.add('active');
            
            // Calculate half tab width - 10px
            const tabWidth = (currentTab.offsetWidth/2) - 20;

            // Update line
            line.style.left = `${currentTab.offsetLeft + tabWidth}px`;

            outerThis.updateDefault(contentContainer);

            // Update active attribute
            outerThis.setAttribute('active', this._active);
          }
        }
      };
    }
  }

  updatePage = content => {
    // select body
    const body = document.querySelector('body');

    // populate content
    body.innerHTML = content;
  }

  updateState = (state, contentContainer)=> {
    // populate content
    contentContainer.innerHTML = state.content;
  }

  updateDefault = contentContainer => {
    contentContainer.innerHTML = this.getContainer(this._active);
  }

  // get current feed
  getCurrentFeed = tab => {
    switch (tab) {
      case "stories":
        return this.getStories();
      case "replies":
        return this.getReplies();
      case "followers":
        return this.getFollowers();
      case "following":
        return this.getFollowing();
      default:
        return this.getStories();
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
        ${this.getTab()}
        ${this.getContent()}
      </div>
    `
  }

  getContent = () => {
    return /* html */`
      <div class="feeds">
        ${this.getContainer(this._active)}
      </div>
		`
  }

  getTab = () => {
    // Get url 
    let url = this.getAttribute('url');

    // convert url to lowercase
    url = url.toLowerCase();
    return /* html */`
      <div class="tab-control">
        <ul id="tab" class="tab">
          <li url="${url}/stories" data-element="stories" class="tab-item stories">
            <span class="text">Stories</span>
          </li>
          <li url="${url}/replies" data-element="replies" class="tab-item replies">
            <span class="text">Replies</span>
          </li>
          <li url="${url}/followers" data-element="followers" class="tab-item followers">
            <span class="text">Followers</span>
          </li>
          <li url="${url}/following" data-element="following" class="tab-item following">
            <span class="text">Following</span>
          </li>
          <span class="line"></span>
        </ul>
      </div>
    `
  }

  getContainer = active => {
    // Switch active tab
    switch (active) {
      case "stories":
        return this.getStories();
      case "replies":
        return this.getReplies();
      case "followers":
        return this.getFollowers();
      case "following":
        return this.getFollowing();
      default:
        return this.getStories();
    }
  }

  getStories = () => {
    return /*html*/`
      <stories-feed hash="${this.getAttribute('hash')}" stories="${this.getAttribute('stories')}" page="1"
        url="${this.getAttribute('stories-url')}"  kind="user">
      </stories-feed>
    `
  }

  getReplies = () => {
    return /* html */`
      <replies-feed hash="${this.getAttribute('hash')}" replies="${this.getAttribute('replies')}" page="1"
        url="${this.getAttribute('replies-url')}" kind="user">
      </replies-feed>
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

        .tab-control {
          border-bottom: var(--border);
          background-color: var(--background);
          display: flex;
          flex-flow: column;
          gap: 0;
          z-index: 3;
          width: 100%;
          min-width: 100%;
          position: sticky;
          top: 60px;
        }

        .tab-control > .author {
          border-bottom: var(--border);
          padding: 10px 0;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 400;
          color: var(--gray-color);
          font-family: var(--font-mono), monospace;
          font-size: 0.9rem;
        }

        .tab-control > ul.tab {
          height: max-content;
          width: 100%;
          padding: 5px 0 0 0;
          margin: 0;
          list-style-type: none;
          display: flex;
          gap: 0;
          align-items: center;
          max-width: 100%;
          overflow-x: scroll;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .tab-control > ul.tab::-webkit-scrollbar {
          display: none !important;
          visibility: hidden;
        }

        .tab-control > ul.tab > li.tab-item {
          color: var(--gray-color);
          font-family: var(--font-text), sans-serif;
          font-weight: 400;
          padding: 6px 20px 8px 0;
          margin: 0;
          display: flex;
          align-items: center;
          cursor: pointer;
          overflow: visible;
          font-size: 0.95rem;
        }

        .tab-control > ul.tab > li.tab-item > .text {
          font-weight: 500;
          font-size: 1rem;
        }

        .tab-control > ul.tab > li.tab-item:hover > .text {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .tab-control > ul.tab > li.active {
          font-size: 0.95rem;
        }

        .tab-control > ul.tab > li.active > .text {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
          font-family: var(--font-read);
        }

        .tab-control > ul.tab span.line {
          position: absolute;
          z-index: 1;
          background: var(--accent-linear);
          display: inline-block;
          bottom: -3px;
          left: 12px;
          width: 20px;
          min-height: 5px;
          border-top-left-radius: 5px;
          border-top-right-radius: 5px;
          border-bottom-left-radius: 5px;
          border-bottom-right-radius: 5px;
          transition: all 300ms ease-in-out;
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

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          a,
          .stats > .stat {
            cursor: default !important;
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