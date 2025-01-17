export default class PostSection extends HTMLElement {
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
    // Select content container
    const contentContainer = this.shadowObj.querySelector('div.feeds');
    // Select the tabContainer
    const tabContainer = this.shadowObj.querySelector('ul#tab');

    // If contentContainer and tabContainer exists
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
      // select replies tab
      const replies = this.shadowObj.querySelector(`ul#tab > li.replies`);
      replies.classList.add('active');
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

            //get current feed
            const currentFeed = outerThis.getCurrentFeed(tab.dataset.element);

            // Updating History State
            window.history.pushState(
              { tab: tab.dataset.element, content: currentFeed},
              tab.dataset.element, `${tab.getAttribute('url')}`
            );

            // Change active attribute
            outerThis.setAttribute('active', tab.dataset.element);

            switch (tab.dataset.element) {
              case "replies":
                contentContainer.innerHTML = outerThis.getReplies();
                break;
              case "likes":
                contentContainer.innerHTML = outerThis.getLikes();
                break;
              default:
                break;
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

              // Update the line
              line.style.left = `${tab.offsetLeft + tabWidth}px`;

              outerThis.updateState(event.state, contentContainer);

              // Update active attribute
              outerThis.setAttribute('active', event.state.tab);
            }
          }
        }
        else {
          // Select li with class name as current and content Container
          const currentTab = outerThis.shadowObj.querySelector(`ul#tab > li.tab-item.${this._active}`);
          if (currentTab) {
            activeTab.classList.remove('active');
            activeTab = currentTab;
            currentTab.classList.add('active');

            // Calculate half tab width - 10px
            const tabWidth = (currentTab.offsetWidth/2) - 20;

            // update line position
            line.style.left = `${currentTab.offsetLeft + tabWidth}px`;


            outerThis.updateDefault(contentContainer);

            // Update active attribute
            outerThis.setAttribute('active', currentTab.dataset.element);
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

  getCurrentFeed = tab => {
    switch (tab) {
      case "replies":
        return this.getReplies();
      case "likes":
        return this.getLikes();
      default:
        return this.getReplies();
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
      ${this.getTab()}
      <div class="feeds">
        ${this.getContainer(this.getAttribute('active'))}
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
          <li url="${url}/replies" data-element="replies" class="tab-item replies">
            <span class="text">Replies</span>
          </li>
          <li url="${url}/likes" data-element="likes" class="tab-item likes">
            <span class="text">Likes</span>
          </li>
          <span class="line"></span>
        </ul>
      </div>
    `
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
    return `
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

        .tab-control {
          border-bottom: var(--border);
          background-color: var(--background);
          display: flex;
          flex-flow: column;
          gap: 0;
          z-index: 3;
          width: 100%;
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
          /* border: var(--border); */
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
          :host {
            padding: 0;
          }

          .tab-control {
            border-bottom: var(--border);
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