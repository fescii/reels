export default class ActivityContainer extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.activateTab();
  }

  activateTab = () => {
    const outerThis = this;
    const tab = this.shadowObj.querySelector('ul#tab');
    const contentContainer = this.shadowObj.querySelector('.content');

    if (tab && contentContainer) {
      const line = tab.querySelector('span.line');
      const tabItems = tab.querySelectorAll('li.tab-item');
      let activeTab = tab.querySelector('li.tab-item.active');

      tabItems.forEach((tab, index) => {
        tab.addEventListener('click', e => {
          e.preventDefault()
          e.stopPropagation()

          // Calculate half tab width - 10px
          const tabWidth = (tab.offsetWidth / 2) - 20;

          if (index === 0) {
            line.style.left = '0';
          }
          else {
            line.style.left = `${tab.offsetLeft + tabWidth}px`;
          }

          if (tab.dataset.element === activeTab.dataset.element) {
            return;
          }
          else {
            activeTab.classList.remove('active');
            tab.classList.add('active');
            activeTab = tab;
            const url = tab.getAttribute('url');
            contentContainer.innerHTML = outerThis.getAll(url);
          }
        })
      })
    }
  }

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    // language=HTML
    return `
      ${this.getHeader()}
      ${this.getTab()}
			<div class="content">
				${this.getAll(this.getAttribute('api-all'))}
      </div>
    `;
  }

  getAll = url => {
    return /* html */`
			<activity-feed url="${url}" page="1" limit="10"></activity-feed>
		`
  }

  getHeader = () => {
    return /* html */`
      <div class="top">
        <h4 class="title">Your activity</h4>
        <p class="desc">
          Your activity is a summary of your interactions on the platform. You can view your stories, replies and likes.
        </p>
      </div>
    `;
  }

  getTab = () => {
    return /* html */`
      <div class="actions">
        <ul id="tab" class="tab">
          <li data-element="all" class="tab-item all active" url="${this.getAttribute('api-all')}">
            <span class="text">All</span>
          </li>
          <li data-element="stories" class="tab-item stories" url="${this.getAttribute('api-stories')}">
            <span class="text">Stories</span>
          </li>
          <li data-element="replies" class="tab-item replies" url="${this.getAttribute('api-replies')}">
            <span class="text">Replies</span>
          </li>
          <li data-element="people" class="tab-item people" url="${this.getAttribute('api-users')}">
            <span class="text">People</span>
          </li>
          <span class="line"></span>
        </ul>
      </div>
    `;
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
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          width: 100%;
        }

        .top {
          display: flex;
          flex-flow: column;
          gap: 5px;
          padding: 5px 0 0;
          width: 100%;
        }

        .top > h4.title {
          display: flex;
          align-items: center;
          color: var(--title-color);
          font-size: 1.3rem;
          font-weight: 500;
          margin: 0;
          padding: 0;
        }

        .top > .desc {
          margin: 0;
          padding: 0;
          color: var(--text-color);
          font-size: 1rem;
          font-family: var(--font-main), sans-serif;
        }

        .actions {
          background-color: var(--background);
          display: flex;
          flex-flow: column;
          gap: 0;
          z-index: 3;
          padding: 10px 0 0;
          width: 100%;
          position: sticky;
          top: 0;
        }

        .actions > ul.tab {
          border-bottom: var(--border);
          height: max-content;
          width: 100%;
          padding: 0;
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

        .actions > ul.tab::-webkit-scrollbar {
          display: none !important;
          visibility: hidden;
        }

        .actions > ul.tab > li.tab-item {
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

        .actions > ul.tab > li.tab-item > .text {
          font-weight: 500;
          font-size: 1rem;
        }

        .actions > ul.tab > li.tab-item:hover > .text {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .actions > ul.tab > li.active {
          font-size: 0.95rem;
        }

        .actions > ul.tab > li.active > .text {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
          font-family: var(--font-read);
        }

        .actions > ul.tab span.line {
          position: absolute;
          z-index: 1;
          background: var(--accent-linear);
          display: inline-block;
          bottom: -2.5px;
          left: 0;
          width: 20px;
          min-height: 5px;
          border-top-left-radius: 5px;
          border-top-right-radius: 5px;
          border-bottom-left-radius: 5px;
          border-bottom-right-radius: 5px;
          transition: all 300ms ease-in-out;
        }

        .content {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          width: 100%;
        }

        @media screen and (max-width:600px) {

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          .top {
            padding: 0 10px;
          }

          .actions {
            position: sticky;
            width: 100%;
            padding: 10px 10px 0;
            top: 0;
          }

          .actions > ul.tab span.line {
            left: 10px;
          }

          .content {
            display: flex;
            flex-flow: column;
            gap: 10px;
            padding: 0 10px;
            width: 100%;
          }

          a,
          .actions > ul.tab > li.tab-item {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}