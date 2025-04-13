export default class AppSearch extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    // Get default tab
    this.active_tab = null;
    // get query
    this._query = this.getAttribute('query');
    //Get url in lowercase
    this._url = this.getAttribute('url').trim().toLowerCase();
    this._active = null;
    this.app = window.app;
    this.api = this.app.api;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    window.addEventListener('popstate', this.handlePopState);
    this.setTitle();
    this.render();
  }

  setQuery = () => {
    // Check if query q is in the url and update the query
    const url = new URL(window.location.href);
    const q = url.searchParams.get('q');

    if (q !== '' && q !== null && q !== 'null') {
      // update query
      this._query = q;
      this.setAttribute('query', q);
    }
    else {
      const query = this.getAttribute('query');

      if (query !== '' && query !== null && query !== 'null') {
        // update query
        this._query = query;
      }
      else {
        // update query
        this._query = null;
      }
    }
  }

  updateInput = form => {
    // update input value
    if(this._query) {
      form.querySelector('input').value = this._query;
      this.setKey(form);
    }
  }

  setTitle = () => {
    // update title of the document
    if (this._query) {
      document.title = `Search | ${this._query}`;
    }
    else {
      document.title = 'Search | Discover and connect with people, topics and stories';
    }
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.enableScroll();
    this.app.showNav();

    // Activate tab
    const contentContainer = this.shadowObj.querySelector('div.content-container');
    const tabContainer = this.shadowObj.querySelector('ul.tabs');
    const form = this.shadowObj.querySelector('form.search');

    // activate popstate
    this.activateOnPopState();
  
    if (contentContainer && tabContainer && form) {
      this.activateTabController(tabContainer, contentContainer);
      this.activateForm(form, tabContainer, contentContainer);
      this.updateInput(form);

      const svgBtn = form.querySelector('svg');
      if(svgBtn){
        this.activateBackButton(svgBtn);
      }
    }

    // watch for mql changes
    const mql = window.matchMedia('(max-width: 660px)');

    this.watchMediaQuery(mql, contentContainer);
  }

  disconnectedCallback() {
    this.enableScroll()
  }

  // watch for mql changes
  watchMediaQuery = mql => {
    mql.addEventListener('change', () => {
      // Re-render the component
      this.render();

      const contentContainer = this.shadowObj.querySelector('div.content-container');
      const tabContainer = this.shadowObj.querySelector('ul.tabs');
      const form = this.shadowObj.querySelector('form.search');
    
      if (contentContainer && tabContainer && form) {
        this.activateTabController(tabContainer, contentContainer);
        this.activateForm(form, tabContainer, contentContainer);
        this.updateInput(form);
      }
    });
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

  activateForm = (form, tabContainer, contentContainer) => {
    const outerThis = this;
    form.addEventListener('submit', e => {
      e.preventDefault();
      e.stopPropagation();

      const query = form.querySelector('input').value;

      if (query.trim() === '') {
        return;
      }

      // update query
      outerThis._query = query;

      // update query attribute
      this.setAttribute('query', outerThis._query);

      // update title of the document
      document.title = `Search query -  ${query}`;

      // update url
      this._url = `/search?q=${query}`;

      // add query to the url: only the query not history or state
      this.app.push(`/search?q=${query}`, { kind: "sub", app: "search", name: query, type: 'query' }, `/search?q=${query}`);

      // update setKey
      this.setKey(form);

      // get tab container
      let tab;
      if(this.active_tab) {
        tab = this.active_tab.dataset.name;
      } else {
        tab = 'stories';
      }
      outerThis.setAttribute('tab', 'stories');
      outerThis.removeActiveTab(tabContainer, tab);
      this.setAttribute('url', outerThis._url);
      contentContainer.innerHTML = outerThis.getContainer(tab);

      // update tab underline
      outerThis.updateBarUnderline(tabContainer.querySelector(`li.tab.${tab}`));
    });
  }

  removeActiveTab = (tabContainer, name) => {
    // remove active tab
    const activeTab = tabContainer.querySelector('li.tab.active');
    // select the active tab
    const selectedTab = tabContainer.querySelector(`li.tab.${name}`);
    if (activeTab) {
      activeTab.classList.remove('active');
      selectedTab.classList.add('active');
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
      'topics': this.getTopics(),
      'stories': this.getStories(),
      'replies': this.getReplies(),
      'people': this.getPeople()
    };

    const content = contentMap[tabName] || this.getStories();
    contentContainer.innerHTML = content;
    this.app.push(url, { kind: "sub", app: "search", name: tabName, html: content }, tabName);
  }

  handlePopState = event => {
    const state = event.state;
    if (state && state.kind === 'sub' && state.app === 'search') {
      this.updateHistory(state.name, state.type);
    }
  }

  updateHistory = (name, type) => {
    const tabContainer = this.shadowObj.querySelector('ul.tabs');
    const contentContainer = this.shadowObj.querySelector('div.content-container');
    const form = this.shadowObj.querySelector('form.search');

    if (type === 'query') {
      this._query = name;
      this.setKey(form);
      this.updateContent(contentContainer, this.active_tab.dataset.name, this.active_tab.getAttribute('url'));
    } else {
      const tab = tabContainer.querySelector(`li.tab.${name}`);

      if (tab) {
        // Remove active class from current active tab
        if (this.active_tab) {
          this.active_tab.classList.remove('active');
        }

        // Set new active tab
        this.active_tab = tab;
        this.active_tab.classList.add('active');

        // update bar underline
        this.updateBarUnderline(tab);

        // Update content based on the new active tab
        this.updateContent(contentContainer, name, tab.getAttribute('url'));
      }
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

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  activateBackButton = btn => {
    btn.addEventListener('click', () => {
      // check window history is greater or equal to 1
      if (window.history.length >= 1) {
        // check if the history has state
        if (window.history.state) {
          // go back
          window.history.back();
        }
        else {
          // redirect to home
          window.location.href = '/home';
        }
      }
    });
  }

  activateOnPopState = () => {
    const outerThis = this;
    // Update state on window.onpopstate
    window.onpopstate = event => {
      if (event.state) {
        if (event.state.popup) {
          return;
        }

        if (event.state.page) {
          outerThis.updatePage(event.state.content)
        }
      }
    };
  }

  updatePage = content => {
    // select body
    const body = document.querySelector('body');

    // populate content
    body.innerHTML = content;
  }

  setKey = form => {
    const key = this.shadowObj.querySelector('p.search > span.key');

    if (key) {
      if (this._query) {
        key.textContent = this._query;
      }
      else {
        key.parentElement.remove();
      }
    }
    else if (this._query) {
      const html = /* html */`<p class="search">Showing results for <span class="key">${this._query}</span></p>`;
    
      form.insertAdjacentHTML('afterend', html);
    }
    
  }

  getBody = () => {
    const mql = window.matchMedia('(max-width: 660px)');
    if (mql.matches) {
      return /* html */`
        ${this.getForm()}
        <div class="tab-controller">
          ${this.getTab(this.getAttribute('tab'))}
        </div>
        <div class="content-container">
          ${this.getContainer(this._tab)}
        </div>
      `;
    }
    else {
      return /* html */`
        <section class="main">
          ${this.getForm()}
          <div class="tab-controller">
            ${this.getTab(this.getAttribute('tab'))}
          </div>
          <div class="content-container">
            ${this.getContainer(this._tab)}
          </div>
        </section>

        <section class="side">
          <topics-container url="/q/trending/topics"></topics-container>
          ${this.getInfo()}
        </section>
      `;
    }
  }

  getForm = () => {
    return /*html*/`
      <form action="" method="get" class="search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M15.28 5.22a.75.75 0 0 1 0 1.06L9.56 12l5.72 5.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 1.06 0Z"></path>
        </svg>
        <div class="contents">
          <input type="text" name="q" id="query" placeholder="What's your query?">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11.7666" cy="11.7667" r="8.98856" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"  stroke-linejoin="round" />
            <path d="M18.0183 18.4853L21.5423 22.0001" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <button type="submit">Search</button>
        </div>
      </form>
    `
  }

  getContainer = active => {
    const contentMap = {
      'stories': this.getStories,
      'replies': this.getReplies,
      'people': this.getPeople,
      'topics': this.getTopics
    };

    return (contentMap[active] || this.getStories).call(this);
  }

  getTopics = () => {
    const trending = this.getAttribute('trending-topics');
    const topics = this.getAttribute('topics-url');
    return /*html*/`
      <topics-feed page="1"
        url="${this._query ? topics + '?q=' + this._query : trending}" ${this._query ? 'query="true"' : ''}
        kind="search">
      </topics-feed>
    `
  }

  getStories = () => {
    const trending = this.getAttribute('trending-stories');
    const stories = this.getAttribute('stories-url');
    return /*html*/`
      <stories-feed page="1"
        url="${this._query ? stories + '?q=' + this._query : trending}" ${this._query ? 'query="true"' : ''}
        kind="search">
      </stories-feed>
    `
  }

  getReplies = () => {
    const replies = this.getAttribute('replies-url');
    const trending = this.getAttribute('trending-replies');
    return /* html */`
      <replies-feed page="1"
        url="${this._query ? replies + '?q=' + this._query : trending}" ${this._query ? 'query="true"' : ''}
        kind="search">
      </replies-feed>
    `
  }

  getPeople = () => {
    const people = this.getAttribute('people-url');
    const trending = this.getAttribute('trending-people');
    return /*html*/`
      <people-feed page="1"
        url="${this._query ? people + '?q=' + this._query : trending}" ${this._query ? 'query="true"' : ''}
        kind="search">
      </people-feed>
    `
  }

  getInfo = () => {
    return /*html*/`
      <info-container docs="/about/docs" new="/about/new"
       feedback="/about/feedback" request="/about/request" code="/about/code" donate="/about/donate" contact="/about/contact" company="https://github.com/aduki-hub">
      </info-container>
    `
  }

  getTab = tab => {
    return /* html */`
      <ul class="tabs">
        <li class="tab stories ${tab === "stories" ? "active" : ''}" data-name="stories">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M10.5 8H18.5M10.5 12H13M18.5 12H16M10.5 16H13M18.5 16H16" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 7.5H6C4.11438 7.5 3.17157 7.5 2.58579 8.08579C2 8.67157 2 9.61438 2 11.5V18C2 19.3807 3.11929 20.5 4.5 20.5C5.88071 20.5 7 19.3807 7 18V7.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M16 3.5H11C10.07 3.5 9.60504 3.5 9.22354 3.60222C8.18827 3.87962 7.37962 4.68827 7.10222 5.72354C7 6.10504 7 6.57003 7 7.5V18C7 19.3807 5.88071 20.5 4.5 20.5H16C18.8284 20.5 20.2426 20.5 21.1213 19.6213C22 18.7426 22 17.3284 22 14.5V9.5C22 6.67157 22 5.25736 21.1213 4.37868C20.2426 3.5 18.8284 3.5 16 3.5Z" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Stories</span>
        </li>
        <li class="tab replies ${tab === "replies" ? "active" : ''}" data-name="replies">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M8 13.5H16M8 8.5H12" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M6.09881 19C4.7987 18.8721 3.82475 18.4816 3.17157 17.8284C2 16.6569 2 14.7712 2 11V10.5C2 6.72876 2 4.84315 3.17157 3.67157C4.34315 2.5 6.22876 2.5 10 2.5H14C17.7712 2.5 19.6569 2.5 20.8284 3.67157C22 4.84315 22 6.72876 22 10.5V11C22 14.7712 22 16.6569 20.8284 17.8284C19.6569 19 17.7712 19 14 19C13.4395 19.0125 12.9931 19.0551 12.5546 19.155C11.3562 19.4309 10.2465 20.0441 9.14987 20.5789C7.58729 21.3408 6.806 21.7218 6.31569 21.3651C5.37769 20.6665 6.29454 18.5019 6.5 17.5" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" />
          </svg>
          <span class="text">Replies</span>
        </li>
        <li class="tab topics ${tab === "topics" ? "active" : ''}" data-name="topics">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <ellipse cx="18" cy="10" rx="4" ry="8" stroke="currentColor" stroke-width="2.0" />
            <path d="M18 2C14.8969 2 8.46512 4.37761 4.77105 5.85372C3.07942 6.52968 2 8.17832 2 10C2 11.8217 3.07942 13.4703 4.77105 14.1463C8.46512 15.6224 14.8969 18 18 18" stroke="currentColor" stroke-width="2.0" />
            <path d="M11 22L9.05674 20.9303C6.94097 19.7657 5.74654 17.4134 6.04547 15" stroke="currentColor" stroke-width="2.0" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Topics</span>
        </li>
        <li class="tab people ${tab === "people" ? "active" : ''}" data-name="people">
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

        section.main {
          display: flex;
          flex-flow: column;
          align-items: start;
          gap: 0;
          padding: 0;
          width: calc(55% - 10px);
          min-height: 100vh;
        }

        p.search {
          font-size: 1.15rem;
          font-weight: 500;
          color: var(--text-color);
          font-family: var(--font-text);
          margin: 5px 0;
        }

        p.search > span.key {
          font-weight: 500;
          color: transparent;
          background: var(--second-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        p.search > span.key:before {
          content: open-quote;
          color: var(--gray-color);
          font-size: 1rem;
          line-height: 1;
        }

        p.search > span.key:after {
          content: close-quote;
          color: var(--gray-color);
          font-size: 1rem;
          line-height: 1;
        }

        form.search {
          background: var(--background);
          padding: 0;
          padding: 22px 0 10px;
          display: flex;
          flex-flow: column;
          align-items: start;
          flex-wrap: nowrap;
          gap: 5px;
          z-index: 6;
          width: 100%;
          position: sticky;
          top: 0;
        }

        form.search > svg {
          display: none;
          position: absolute;
          left: -12px;
          top: calc(50% - 15px);
          color: var(--text-color);
          cursor: pointer;
          width: 40px;
          height: 40px;
        }

        form.search > svg:hover {
          color: var(--accent-color);
        }

        form.search > .contents {
          padding: 0;
          display: flex;
          flex-flow: row;
          align-items: center;
          flex-wrap: nowrap;
          gap: 0;
          margin: 0;
          width: 100%;
          position: relative;
        }

        form.search > .contents > input {
          border: var(--border-mobile);
          background-color: var(--background) !important;
          display: flex;
          flex-flow: row;
          align-items: center;
          font-family: var(--font-text);
          color: var(--highlight-color);
          font-size: 1rem;
          padding: 8px 10px 8px 35px;
          gap: 0;
          width: 100%;
          border-radius: 18px;
          -webkit-border-radius: 18px;
          -moz-border-radius: 18px;
          -ms-border-radius: 18px;
          -o-border-radius: 18px;
        }
        
        form.search > .contents > input:-webkit-autofill,
        form.search > .contents > input:-webkit-autofill:hover, 
        form.search > .contents > input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px var(--background) inset;
          -webkit-text-fill-color: var(--text-color) !important;
          transition: background-color 5000s ease-in-out 0s;
          color: var(--highlight-color) !important;
        }
        
        form.search > .contents > input:autofill {
          filter: none;
          color: var(--highlight-color) !important;
        }

        form.search > .contents > svg {
          position: absolute;
          height: 18px;
          color: var(--gray-color);
          width: 18px;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
        }

        form.search > .contents > button {
          position: absolute;
          right: 10px;
          top: calc(50% - 14px);
          border: none;
          cursor: pointer;
          color: var(--white-color);
          background: var(--accent-linear);
          height: 28px;
          width: max-content;
          padding: 0 10px;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        div.tab-controller {
          display: flex;
          z-index: 5;
          padding: 0;
          margin: 0;
          width: 100%;
          z-index: 5;
          position: sticky;
          top: 65px;
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

        div.content-container {
          padding: 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          flex-wrap: nowrap;
          gap: 15px;
          width: 100%;
        }

        section.side {
          padding: 25px 0;
          width: calc(45% - 10px);
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

        section.side::-webkit-scrollbar {
          visibility: hidden;
          display: none;
        }

        @media screen and (max-width:900px) {
          section.main {
            width: 58%;
          }

          section.side {
            width: 40%;
          }
        }

				@media screen and (max-width:660px) {
					:host {
            font-size: 16px;
						padding: 0;
            margin: 0;
            display: flex;
            flex-flow: column;
            justify-content: space-between;
            gap: 0;
					}

					::-webkit-scrollbar {
						-webkit-appearance: none;
					}

          ul.tabs > li.tab,
          form.search > .contents > button,
          button,
					a {
						cursor: default !important;
          }

          form.search {
            /* border: 1px solid red; */
            background: var(--background);
            padding: 0;
            padding: 12px 10px 0;
            display: flex;
            flex-flow: column;
            align-items: start;
            flex-wrap: nowrap;
            gap: 5px;
            z-index: 6;
            width: 100%;
            position: sticky;
            top: 0;
          }

          form.search > svg {
            /* border: 1px solid red; */
            display: inline-block;
            position: absolute;
            left: -5px;
            top: unset;
            bottom: 0;
            color: var(--text-color);
            cursor: default !important;
            width: 42px;
            height: 42px;
          }

          form.search > .contents {
            padding: 0;
            display: flex;
            flex-flow: row;
            align-items: center;
            flex-wrap: nowrap;
            gap: 0;
            margin: 0 0 0 25px;
            width: calc(100% - 25px);
          }

          form.search > .contents > input {
            padding: 10px 10px 10px 35px;
            width: 100%;
            border-radius: 18px;
            -webkit-border-radius: 18px;
            -moz-border-radius: 18px;
            -ms-border-radius: 18px;
            -o-border-radius: 18px;
          }

          .section.main {
            display: flex;
            flex-flow: column;
            gap: 0;
            width: 100%;
          }

          div.tab-controller {
            display: flex;
            z-index: 5;
            padding: 10px 10px 0;
            margin: 0;
            width: 100%;
            z-index: 5;
            position: sticky;
            top: 50px;
            background: var(--background);
          }

          div.content-container {
            padding: 0 10px 35px;
          }

          p.search {
            font-size: 1.15rem;
            font-weight: 500;
            color: var(--text-color);
            font-family: var(--font-text);
            margin: 18px 0 0;
            padding: 0 10px;
          }

          section.side {
            padding: 0;
            display: none;
            width: 100%;
          }
				}
	    </style>
    `;
  }
}