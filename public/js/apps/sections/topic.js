export default class TopicSection extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this.active_tab = null;
    // let's create our shadow root
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
    const contentContainer = this.shadowObj.querySelector('div.feeds');
    const tabContainer = this.shadowObj.querySelector('ul.tabs');

    if(contentContainer && tabContainer) {
      // if content container and tab container exists
      setTimeout(() => {
        if (contentContainer && tabContainer) {
          this.activateTabController(tabContainer, contentContainer)
        }
      }, 100);
    }

    // Open url
    this.openUrl();
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
    const tabName = this.getAttribute('active') || 'all';
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
      'article':  this.getArticle(),
      'stories': this.getStories()
    };

    const content = contentMap[tabName] || this.getArticle();
    contentContainer.innerHTML = content;
    this.app.push(url, { kind: "sub", app: "topic", name: tabName, html: content }, tabName);
    this.openUrl();
  }

  handlePopState = event => {
    const state = event.state;
    if (state && state.kind === 'sub' && state.app === 'topic') {
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
      // update bar underline
      this.updateBarUnderline(activeTab);
      contentContainer.innerHTML = content;
    } catch (error) {
      const activeTab = tabs.querySelector('li.article');
      activeTab.classList.add('active');
      this.active_tab = activeTab;
      contentContainer.innerHTML = this.getArticle()

      // update bar underline
      this.updateBarUnderline(activeTab);
    }
    this.openUrl();
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

  openUrl = () => {
    // get all the links
    const links = this.shadowObj.querySelectorAll('.feeds > article a');
    const body = document.querySelector('body');

    // loop through the links
    if (!links) return;
    
    links.forEach(link => {
      // add event listener to the link
      link.addEventListener('click', event => {
        event.preventDefault();
        // get the url
        const url = link.getAttribute('href');

        // link pop up
        let linkPopUp = `<url-popup url="${url}"></url-popup>`

        // open the popup
        body.insertAdjacentHTML('beforeend', linkPopUp);
      });
    });
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
      <div class="tab-controller">
        ${this.getTab(this.getAttribute('active'))}
      </div>
      <div class="feeds">
        ${this.getContent(this.getAttribute('active'))}
      </div>
    `
  }

  getTab = tab => {
    let url = this.getAttribute('url');
    url = url.toLowerCase();
    return /* html */`
      <ul class="tabs">
        <li class="tab article ${tab === "article" ? "active" : ''}" data-name="article" url="${url}/article">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M12.5 3H11.5C7.02166 3 4.78249 3 3.39124 4.39124C2 5.78249 2 8.02166 2 12.5C2 16.9783 2 19.2175 3.39124 20.6088C4.78249 22 7.02166 22 11.5 22C15.9783 22 18.2175 22 19.6088 20.6088C21 19.2175 21 16.9783 21 12.5V11.5" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
            <path d="M22 5.5C22 7.433 20.433 9 18.5 9C16.567 9 15 7.433 15 5.5C15 3.567 16.567 2 18.5 2C20.433 2 22 3.567 22 5.5Z" stroke="currentColor" stroke-width="2.0" />
            <path d="M7 11H11" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 16H15" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Article</span>
        </li>
        <li class="tab stories ${tab === "stories" ? "active" : ''}" data-name="stories" url="${url}/stories">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M10.5 8H18.5M10.5 12H13M18.5 12H16M10.5 16H13M18.5 16H16" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 7.5H6C4.11438 7.5 3.17157 7.5 2.58579 8.08579C2 8.67157 2 9.61438 2 11.5V18C2 19.3807 3.11929 20.5 4.5 20.5C5.88071 20.5 7 19.3807 7 18V7.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 3.5H11C10.07 3.5 9.60504 3.5 9.22354 3.60222C8.18827 3.87962 7.37962 4.68827 7.10222 5.72354C7 6.10504 7 6.57003 7 7.5V18C7 19.3807 5.88071 20.5 4.5 20.5H16C18.8284 20.5 20.2426 20.5 21.1213 19.6213C22 18.7426 22 17.3284 22 14.5V9.5C22 6.67157 22 5.25736 21.1213 4.37868C20.2426 3.5 18.8284 3.5 16 3.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Stories</span>
        </li>
        <span class="bar"></span>
      </ul>
    `;
  }

  getContent = active => {
    const contentMap = {
      'article': this.getArticle(),
      'stories': this.getStories()
    };
    return contentMap[active] || this.getArticle();
  }

  getArticle = () => {
    return this.innerHTML;
  }

  getStories = () => {
    return /*html*/`
      <stories-feed hash="${this.getAttribute('slug')}" stories="${this.getAttribute('stories')}" page="1"
        url="${this.getAttribute('stories-url')}"  kind="topic">
      </stories-feed>
    `
  }

  getLoader = () => {
    return /* html */`
			<story-loader speed="300"></story-loader>
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
          gap: 0;
        }

        .feeds {
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

        article.article {
          margin: 15px 0;
          display: flex;
          flex-flow: column;
          color: var(--read-color);
          font-family: var(--font-main), sans-serif;
          gap: 10px;
          font-size: 1rem;
          font-weight: 400;
        }

        div.feeds {
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          margin: 0;
        }

        article.article * {
          font-size: 1.05rem;
          line-height: 1.3;
          color: inherit;
          font-family: inherit;
        }

        article.article > .section {
          margin: 0 0 10px 0;
          padding: 0;
          display: flex;
          flex-flow: column;
        }

        article.article > .section > h2.title {
          font-size: 1.35rem !important;
          color: var(--title-color);
          font-weight: 600;
          line-height: 1.2;
          margin: 0;
          padding: 2px 0 0 13px;
          position: relative;
        }

        article.article > .section h2.title:before {
          content: "";
          position: absolute;
          bottom: 10%;
          left: 0;
          width: 3px;
          height: 80%;
          background: var(--accent-linear);
          border-radius: 5px;
        }

        article.article h6,
        article.article h5,
        article.article h4,
        article.article h3,
        article.article h1 {
          padding: 0 !important;
          font-size: 1.25rem !important;
          color: var(--title-color);
          font-weight: 500;
          line-height: 1.5;
          margin: 10px 0;
        }

        article.article .intro p {
          margin: 0 0 5px 0;
          line-height: 1.4;
        }

        article.article p {
          margin: 5px 0;
          line-height: 1.4;
        }

        article.article a {
          text-decoration: none;
          cursor: pointer;
          color: var(--anchor-color) !important;
        }

        article.article a:hover {
          text-decoration: underline;
        }

        article.article blockquote {
          margin: 10px 0;
          padding: 5px 15px;
          font-style: italic;
          border-left: 2px solid var(--gray-color);
          background: var(--background);
          color: var(--text-color);
          font-weight: 400;
        }

        article.article blockquote:before {
          content: open-quote;
          color: var(--gray-color);
          font-size: 1.5rem;
          line-height: 1;
          margin: 0;
        }

        article.article blockquote:after {
          content: close-quote;
          color: var(--gray-color);
          font-size: 1.5rem;
          line-height: 1;
          margin: 0;
        }

        article.article hr {
          border: none;
          background-color: var(--gray-color);
          height: 1px;
          margin: 10px 0;
        }

        article.article b,
        article.article strong {
          font-weight: 500;

        }

        article.article ul,
        article.article ol {
          margin: 5px 0 15px 20px;
          padding: 0 0 0 15px;
          color: inherit;
        }

        article.article div.last,
        article.article div.empty {
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 15px 0;
          padding: 15px 10px;
          background: var(--gray-background);
          border-radius: 15px;
        }

        article.article > div.empty > h2 {
          font-size: 1.3rem;
          font-weight: 700;
          margin: 0;
          color: var(--title-color);
        }

        article.article div.last > p,
        article.article > div.empty > p {
          font-size: 1rem;
          margin: 0;
          text-align: center;
          font-family: var(--font-text), sans-serif;
          color: var(--text-color);
        }

        article.article div.last > a,
        article.article > div.empty > a {
          padding: 5px 20px;
          margin: 5px 0 0 0;
          font-size: 1rem;
          font-weight: 500;
          border-radius: 12px;
          cursor: pointer;
          color: var(--white-color) !important;
          background: var(--accent-linear) !important;
          background-clip: text;
          -webkit-background-clip: text;
        }

        article.article > div.empty > a:hover {
          text-decoration: none;
        }

        @media screen and (max-width: 660px) {
          .tab-control > ul.tab > li.tab-item,
					.action,
					a {
						cursor: default !important;
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          div.tab-controller {
            display: flex;
            z-index: 5;
            padding: 0 10px;
            margin: 0;
            width: 100%;
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

          div.feeds {
            width: 100%;
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 0 10px 60px;
            margin: 0;
          }

          article.article {
            margin: 0;
            padding: 10px 0;
            height: max-content;
            display: flex;
            flex-flow: column;
            color: var(--read-color);
            font-family: var(--font-main), sans-serif;
            gap: 10px;
            font-size: 1rem;
            font-weight: 400;
          }

          a,
          .stats > .stat,
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