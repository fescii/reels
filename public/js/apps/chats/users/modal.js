export default class UsersModal extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({mode: 'open'});
    this.active_tab = null;
    this.render();
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.disableScroll();

    // set up event listeners
    this.setUpEventListeners();
  }

  setUpEventListeners = () => {
    const tabs = this.shadow.querySelector("ul.tabs");
    // Select the close button & overlay
    const overlay = this.shadow.querySelector('.overlay');
    const btns = this.shadow.querySelectorAll('.cancel-btn');

    // Close the modal
    if (overlay && btns) {
      this.closePopup(overlay, btns);
    }
    // if tabs exist, activate the tab controller
    if (tabs) this.activateTabController(tabs);
  }

  activateTabController = tabs => {
    // get the active tab
    this.getOrSetActiveTab(tabs);

    // add click event listener to the tabs
    tabs.querySelectorAll("li").forEach(tab => {
      tab.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        // remove the active class from the active tab
        this.active_tab.classList.remove("active");

        // set the new active tab
        this.active_tab = tab;
        this.active_tab.classList.add("active");

        //TODO: hide the tab content
      });
    });
  }

  getOrSetActiveTab = tabs => {
    // get the active tab
    let activeTab = tabs.querySelector("li.active");

    if (!activeTab) {
      // if no active tab, set the first tab as active
      activeTab = tabs.querySelector("li");
      activeTab.classList.add("active");
      this.active_tab = activeTab;
    }

    // else set the active tab
    this.active_tab = activeTab;
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

  disconnectedCallback() {
    this.enableScroll()
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
  closePopup = (overlay, btns) => {
    overlay.addEventListener('click', e => {
      e.preventDefault();
      this.remove();
    });

    btns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.remove();
      });
    })
  }

  getTemplate() {
    // Show HTML Here
    return /* html */`
      <div class="overlay"></div>
      <section id="content" class="content">
        ${this.getForm()}
        ${this.getTab()}
        <div class="users">
          ${this.getUsers()}
          ${this.getLoader()}
        </div>
      </section>
      ${this.getStyles()}
    `;
  }

  getForm = () => {
    return /*html*/`
      <form action="" method="get" class="search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" class="cancel-btn">
          <path d="M15.28 5.22a.75.75 0 0 1 0 1.06L9.56 12l5.72 5.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 1.06 0Z"></path>
        </svg>
        <div class="contents">
          <input type="text" name="q" id="query" placeholder="Search people" suggest="off" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11.7666" cy="11.7667" r="8.98856" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"  stroke-linejoin="round" />
            <path d="M18.0183 18.4853L21.5423 22.0001" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <button type="submit">Search</button>
        </div>
      </form>
    `
  }

  getTab = () => {
    return /* html */`
      <ul class="tabs">
        <li class="tab active">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M12.5 3H11.5C7.02166 3 4.78249 3 3.39124 4.39124C2 5.78249 2 8.02166 2 12.5C2 16.9783 2 19.2175 3.39124 20.6088C4.78249 22 7.02166 22 11.5 22C15.9783 22 18.2175 22 19.6088 20.6088C21 19.2175 21 16.9783 21 12.5V11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <path d="M22 5.5C22 7.433 20.433 9 18.5 9C16.567 9 15 7.433 15 5.5C15 3.567 16.567 2 18.5 2C20.433 2 22 3.567 22 5.5Z" stroke="currentColor" stroke-width="1.8" />
            <path d="M7 11H11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M7 16H15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">All</span>
          <span class="count">${this.formatNumber(675964)}</span>
        </li>
        <li class="tab">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M5.08069 15.2964C3.86241 16.0335 0.668175 17.5386 2.61368 19.422C3.56404 20.342 4.62251 21 5.95325 21H13.5468C14.8775 21 15.936 20.342 16.8863 19.422C18.8318 17.5386 15.6376 16.0335 14.4193 15.2964C11.5625 13.5679 7.93752 13.5679 5.08069 15.2964Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M13.5 7C13.5 9.20914 11.7091 11 9.5 11C7.29086 11 5.5 9.20914 5.5 7C5.5 4.79086 7.29086 3 9.5 3C11.7091 3 13.5 4.79086 13.5 7Z" stroke="currentColor" stroke-width="1.8" />
            <path d="M17 5L22 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M17 8L22 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M20 11L22 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Followers</span>
          <span class="count">${this.formatNumber(43)}</span>
        </li>
        <li class="tab">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M5.18007 15.2964C3.92249 16.0335 0.625213 17.5386 2.63348 19.422C3.6145 20.342 4.7071 21 6.08077 21H13.9192C15.2929 21 16.3855 20.342 17.3665 19.422C19.3748 17.5386 16.0775 16.0335 14.8199 15.2964C11.8709 13.5679 8.12906 13.5679 5.18007 15.2964Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14 7C14 9.20914 12.2091 11 10 11C7.79086 11 6 9.20914 6 7C6 4.79086 7.79086 3 10 3C12.2091 3 14 4.79086 14 7Z" stroke="currentColor" stroke-width="1.8" />
            <path d="M17 5.71429C17 5.71429 18 6.23573 18.5 7C18.5 7 20 4 22 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">Following</span>
          <span class="count">${this.formatNumber(3)}</span>
        </li>
      </ul>
    `;
  }

  getEmpty = () => {
    return /* html */`
      <div class="empty">
        <h3>No users found!</h3>
        <p>Try searching for a user or check back later.</p>
        ${this.getRetryButton()}
      </div>
    `
  }

  getError = () => {
    return /* html */`
      <div class="error empty">
        <h3>Oops! Something went wrong!</h3>
        <p>Try reloading the page or check your internet connection.</p>
        ${this.getRetryButton()}
      </div>
    `;
  }

  getRetryButton = () => {
    return /* html */`
      <button class="load-more retry">Retry</button>
    `;
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

  getUsers = () => {
    return /* html */`
      <div is="user-item" user-picture="https://api.dicebear.com/9.x/open-peeps/svg?seed=Aidan"
        user-name="Alice Johnson" you="false"
        bio="I have attached the needed documents below!" user-verified="true">
      </div>
      <div is="user-item" user-picture="https://api.dicebear.com/9.x/open-peeps/svg?seed=Oliver"
        user-name="Janet Doerinailsisgsgsgsg" you="true" bio="I'll be there soon, wait for me!"
        user-verified="true">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/men/1.jpg"
        user-name="Michael Scott" you="false"
        bio="That's what she said!, See for yourself!"
        images="https://images.unsplash.com/photo-1733077151673-c834c5613bbc?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D, https://plus.unsplash.com/premium_photo-1733514691529-da25716e449b?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D, https://images.unsplash.com/photo-1719937051176-9b98352a6cf4?q=80&w=1472&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D">
      </div>
      <div is="user-item" user-picture="https://api.dicebear.com/9.x/adventurer/svg?seed=Amaya"
        user-name="Jim Halpert" you="true"
        bio="Pranking Dwight again!" user-verified="true">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/women/9.jpg"
        user-name="Pam Beesly" you="false"
        bio="See you at the office." user-verified="false">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/men/10.jpg"
        user-name="Jim Halpert" you="true"
        bio="Pranking Dwight again!" user-verified="false">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/women/11.jpg"
        user-name="Angela Martin" unread="3" you="false"
        bio="Cat party at my place." user-verified="true">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/men/12.jpg"
        user-name="Dwight Schrute" you="true"
        bio="Bears. Beets. Battlestar Galactica." user-verified="true"> 
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/women/13.jpg"
        user-name="Kelly Kapoor" you="false"
        bio="Fashion show at lunch!" user-verified="false">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/men/14.jpg"
        user-name="Ryan Howard" you="false"
        bio="Just got promoted!" user-verified="false">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/women/15.jpg"
        user-name="Phyllis Vance" you="false"
        bio="Knitting club meeting." user-verified="true">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/men/16.jpg"
        user-name="Stanley Hudson" you="false"
        bio="Did I stutter?"  user-verified="true">
      </div>
      <div is="user-item" user-picture="https://randomuser.me/api/portraits/women/17.jpg"
        user-name="Meredith Palmer" unread="1" you="false"
        bio="Party at my place!" user-verified="false">
      </div>
    `;
  }

  getButton = () => {
    return /* html */`
      <button class="load-more more">More</button>
    `;
  }

  getStyles() {
    return /*css*/`
      <style>
        * {
          box-sizing: border-box !important;
        }

        :host{
          border: none;
          padding: 0;
          justify-self: end;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 100;
          width: 100%;
          min-width: 100vw;
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          left: 0;
        }

        div.overlay {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background-color: var(--modal-background);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }

        div.loader-container {
          position: relative;
          width: 100%;
          height: 250px;
          min-height: 100px;
          padding: 20px 0 0 0;
        }

        #btn-loader {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
        }

        #btn-loader > .loader-alt {
          width: 35px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #18A565 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #21D029 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        #btn-loader > .loader {
          width: 20px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        @keyframes l38 {
          100% {
            background-position: 100% 0, 100% 100%, 0 100%, 0 0
          }
        }

        #content {
          z-index: 1;
          background-color: var(--background);
          padding: 0 15px 15px;
          display: flex;
          flex-flow: column;
          gap: 0;
          width: 600px;
          max-width: 100%;
          max-height: calc(100dvh - 100px);
          height: max-content;
          min-height: calc(100dvh - 100px);
          border-radius: 20px;
          position: relative;
        }

        form.search {
          background: var(--background);
          padding: 0;
          margin: 10px 0 0;
          padding: 10px 0 10px;
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
          position: absolute;
          display: none;
          left: -12px;
          top: calc(50% - 15px);
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
          margin: 0 0 0 25px;
          width: calc(100% - 25px);
          position: relative;
        }

        form.search > svg {
          position: absolute;
          display: flex;
          left: -12px;
          top: calc(50% - 20px);
          color: var(--gray-color);
          cursor: pointer;
          width: 40px;
          height: 40px;
        }

        form.search > .contents > input {
          border: var(--input-border);
          background-color: var(--background) !important;
          display: flex;
          flex-flow: row;
          align-items: center;
          outline: none;
          font-family: var(--font-text);
          color: var(--highlight-color);
          font-size: 1rem;
          padding: 8px 10px 8px 35px;
          gap: 0;
          width: 100%;
          border-radius: 15px;
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

        form.search > .contents > input::placeholder {
          color: var(--gray-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1rem;
          opacity: 0.8;
        }

        form.search > .contents > input:focus {
          border: var(--input-border-focus);
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
          font-family: var(--font-text), sans-serif;
          height: max-content;
          width: max-content;
          padding: 4px 10px;
          font-size: 0.9rem;
          font-weight: 400;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        ul.tabs {
          border-bottom: var(--border);
          display: flex;
          z-index: 1;
          flex-flow: row nowrap;
          gap: 15px;
          padding: 18px 0 10px;
          margin: 0;
          width: 100%;
          list-style: none;
          overflow-x: scroll;
          min-height: max-content;
          scrollbar-width: none;
          -ms-overflow-style: none;
          z-index: 1;
          position: sticky;
          top: 45px;
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
          height: max-content;
          min-height: max-content;
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

        div.empty {
          width: 100%;
          padding: 25px 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        div.empty > h3 {
          /* border: 1px solid red; */
          width: 100%;
          padding: 0;
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1.2rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          text-align: center;
          justify-content: center;
        }

        div.empty > p {
          width: 100%;
          padding: 0;
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-read), sans-serif;
          font-size: 1rem;
          font-weight: 400;
          display: flex;
          align-items: center;
          text-align: center;
          justify-content: center;
        }

        div.empty > p.italics {
          font-family: var(--font-main), sans-serif;
        }

        button.load-more {
          margin: 10px 0;
          border: none;
          cursor: pointer;
          color: var(--white-color);
          background: var(--accent-linear);
          font-family: var(--font-main), sans-serif;
          height: max-content;
          width: max-content;
          padding: 7px 20px;
          font-size: 1rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          border-radius: 12px;
          transition: 0.3s;
        }
        
        div.users {
          width: 100%;
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          gap: 0;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        div.users::-webkit-scrollbar {
          width: 0;
          display: none;
          visibility: hidden;
        }

        @media screen and ( max-width: 850px ){
          #content {
            width: 90%;
          }
        }

        @media screen and ( max-width: 600px ){
          :host {
            border: none;
            background-color: var(--modal-background);
            padding: 0px;
            justify-self: end;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: end;
            gap: 10px;
            z-index: 20;
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            left: 0;
          }

          #content {
            box-sizing: border-box !important;
            padding: 0 10px;
            margin: 0;
            width: 100%;
            max-width: 100%;
            max-height: calc(100dvh - 50px);
            min-height: calc(100dvh - 50px);
            border-radius: 0px;
            border-top: var(--border);
            border-top-right-radius: 15px;
            border-top-left-radius: 15px;
          }

          .welcome {
            width: 100%;
            padding: 0 15px 20px;
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

          .welcome > h2 > span.control,
          .welcome > .actions > .action {
            cursor: default !important;
          }
          
        }
      </style>
    `;
  }
}