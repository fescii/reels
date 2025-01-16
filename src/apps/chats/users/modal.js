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
        ${this.getWelcome()}
      </section>
      ${this.getStyles()}
    `;
  }

  getWelcome() {
    return /* html */`
      <div class="welcome">
				<ul class="highlights">
          ${this.getLoader()}
        </ul>
			</div>
    `
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
            <path d="M21.9598 10.9707C22.0134 11.8009 22.0134 12.6607 21.9598 13.4909C21.6856 17.7332 18.3536 21.1125 14.1706 21.3905C12.7435 21.4854 11.2536 21.4852 9.8294 21.3905C9.33896 21.3579 8.8044 21.2409 8.34401 21.0513C7.83177 20.8403 7.5756 20.7348 7.44544 20.7508C7.31527 20.7668 7.1264 20.9061 6.74868 21.1846C6.08268 21.6757 5.24367 22.0285 3.99943 21.9982C3.37026 21.9829 3.05568 21.9752 2.91484 21.7351C2.77401 21.495 2.94941 21.1626 3.30021 20.4978C3.78674 19.5758 4.09501 18.5203 3.62791 17.6746C2.82343 16.4666 2.1401 15.036 2.04024 13.4909C1.98659 12.6607 1.98659 11.8009 2.04024 10.9707C2.31441 6.72838 5.64639 3.34913 9.8294 3.07107C11.0318 2.99114 11.2812 2.97856 12.5 3.03368" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M22 5.5C22 7.433 20.433 9 18.5 9C16.567 9 15 7.433 15 5.5C15 3.567 16.567 2 18.5 2C20.433 2 22 3.567 22 5.5Z" stroke="currentColor" stroke-width="1.8" />
          </svg>
          <span class="text">Followers</span>
          <span class="count">${this.formatNumber(43)}</span>
        </li>
        <li class="tab">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M21.7109 9.3871C21.8404 9.895 21.9249 10.4215 21.9598 10.9621C22.0134 11.7929 22.0134 12.6533 21.9598 13.4842C21.6856 17.7299 18.3536 21.1118 14.1706 21.3901C12.7435 21.485 11.2536 21.4848 9.8294 21.3901C9.33896 21.3574 8.8044 21.2403 8.34401 21.0505C7.83177 20.8394 7.5756 20.7338 7.44544 20.7498C7.31527 20.7659 7.1264 20.9052 6.74868 21.184C6.08268 21.6755 5.24367 22.0285 3.99943 21.9982C3.37026 21.9829 3.05568 21.9752 2.91484 21.7349C2.77401 21.4946 2.94941 21.1619 3.30021 20.4966C3.78674 19.5739 4.09501 18.5176 3.62791 17.6712C2.82343 16.4623 2.1401 15.0305 2.04024 13.4842C1.98659 12.6533 1.98659 11.7929 2.04024 10.9621C2.31441 6.71638 5.64639 3.33448 9.8294 3.05621C10.2156 3.03051 10.6067 3.01177 11 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14 4.5L22 4.5M14 4.5C14 3.79977 15.9943 2.49153 16.5 2M14 4.5C14 5.20023 15.9943 6.50847 16.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
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
        <p>User highlights were not loaded, and error while fetching data</p>
        <p>Try refreshing the page or check your internet connection. If the problem persists, please contact support.</p>
      </div>
    `
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
          height: 150px;
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
          padding: 0 15px;
          display: flex;
          flex-flow: column;
          gap: 0;
          width: 600px;
          max-width: 100%;
          max-height: calc(100dvh - 100px);
          height: max-content;
          min-height: calc(100dvh - 100px);
          border-radius: 25px;
          position: relative;
        }

        .welcome {
          width: 98%;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          row-gap: 0;
        }

        .welcome > h2 {
          width: 100%;
          font-size: 1.35rem;
          font-weight: 600;
          margin: 0 0 10px;
          padding: 10px 10px;
          background-color: var(--gray-background);
          text-align: center;
          border-radius: 12px;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
          font-weight: 500;
          position: relative;
        }

        .welcome > h2 > span.control {
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-flow: column;
          gap: 0px;
          justify-content: center;
          position: absolute;
          top: 50%;
          left: 10px;
          transform: translateY(-50%);
        }

        .welcome > h2 > span.control svg {
          width: 20px;
          height: 20px;
          color: var(--text-color);
        }

        .welcome > h2 > span.control svg:hover{
          color: var(--error-color);
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
          overflow-x: auto;
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
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          gap: 8px;
        }

        div.empty > p {
          width: 100%;
          padding: 0;
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1rem;
          font-weight: 400;
        }

        div.empty > p.italics {
          font-family: var(--font-main), sans-serif;
        }
        
        ul.highlights {
          width: 100%;
          padding: 0;
          margin: 0;
          list-style-type: none;
          display: flex;
          flex-flow: column;
          gap: 10px;
        }
        
        ul.highlights > li.item {
          padding: 0;
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: row;
          align-items: center;
          flex-wrap: nowrap;
          gap: 10px;
        }
        
        ul.highlights > li.item > .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          width: 26px;
          min-height: 26px;
          min-width: 26px;
          max-height: 26px;
          max-width: 26px;
          padding: 3px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          background-color: var(--gray-background);
          color: var(--gray-color);
          font-size: 0.9rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        ul.highlights > li.item > .icon > svg {
          height: 15px;
          width: 15px;
        }

        ul.highlights > li.item > .icon.increase {
          background: var(--accent-linear);
          color: var(--white-color);
        }

        ul.highlights > li.item > .icon.decrease {
          background: var(--error-linear);
          color: var(--white-color);
        }
        
        ul.highlights > li.item > .link {
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 400;
          text-decoration: none;
        }
        
        ul.highlights > li.item > a.link:hover {
          color: var(--text-color);
        }
        
        ul.highlights > li.item > .link .numbers {
          color: var(--highlight-color);
          font-weight: 600;
          font-family: var(--font-main), sans-serif;
          font-size: 0.95rem;
          display: inline-block;
          margin: 0 0 -2px 0;
        }
        
        ul.highlights > li.item.last {
          background-color: var(--gray-background);
          padding: 10px;
          margin: 5px 0;
          border-radius: 12px;
          -webkit-border-radius: 12px;
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
            padding: 5px 0 0 0;
            margin: 0;
            width: 100%;
            max-width: 100%;
            max-height: 90%;
            min-height: max-content;
            border-radius: 0px;
            border-top: var(--mobile-border);
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