export default class AppUser extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.setTitle();
    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);
    this._open = this.setOpen(this.getAttribute('current'));
    this._current = this.getAttribute('current') || 'stats';
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    // Add popstate event listener
    window.addEventListener('popstate', this.handlePopState);
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  setTitle = () => {
    // update title of the document
    document.title = 'Account | Manage your account settings, and view your stats';
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  setOpen = current => {
    if(current === '' || current === null || !current) {
      return true;
    }

    return false;
  }

  connectedCallback() {
    this.enableScroll();
    this.app.showNav();
    // Add this component handler to the window wss object
    this.checkAndAddHandler();
    // Check if the display is greater than 600px using mql
    const mql = window.matchMedia('(max-width: 660px)');

    // update the current tab
    this.updateCurrent(this._current);

    const tabContainer = this.shadowObj.querySelector('section.tab');
    const contentContainer = this.shadowObj.querySelector('div.content-container');

    // get url
    let url = this.getAttribute('user-url');

    url = url.trim().toLowerCase();

    // select the button
    const btn = this.shadowObj.querySelector('section.tab > div.header > svg');

    // Watch for media query changes
    this.watchMediaQuery(mql)

    // get tab where class is this._current
    let currentTab = tabContainer.querySelector(`li.${this._current}`);

    if(!currentTab) {
      currentTab = tabContainer.querySelector('li.tab-item.stats');
      this._current = 'stats';
    }

    if (currentTab && tabContainer && contentContainer && btn) {
      // Activate the tab
      this.activateTab(mql.matches, tabContainer, contentContainer);

      // activate the button
      this.activateBtn(mql.matches, contentContainer, tabContainer, btn);

      // populate the current contents
      this.populateCurrent(tabContainer, contentContainer);

      this.activateCloseTabs(mql.matches, btn, contentContainer, tabContainer);
    }

    if (url) {
      // Open user profile
      this.handleUserClick(url);
    }
  }

  logout = async () => {
    // unsubscribe from push notifications
    try {
      await this.handleUserLogout();
    } catch (error) {
      console.error('Error unsubscribing from push notifications', error);
    }

    // remove theme from local storage
    localStorage.removeItem('theme');

    // destroy the current user-cache
    const userCache  = 'user-cache';

    // delete cache: user-cache
    await caches.delete(userCache);

    // remove the user  from the window object
    window.hash = null;

    // redirect to home page
    window.location.href = '/logout';
  }

  // Assuming you have a service worker registered and the user is logged out
  handleUserLogout = async () => {
    // Check if the service worker is registered
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        // Check for existing push subscription
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
          // Unsubscribe from push notifications
          const successfulUnsubscribe = await subscription.unsubscribe();

          if (successfulUnsubscribe) {
            console.log('Successfully unsubscribed from push notifications.');
            // Optionally, remove the subscription from your server
            await this.removeSubscriptionFromServer();
          } else {
            console.error('Failed to unsubscribe from push notifications.');
          }
        } else {
          console.log('No existing subscription found.');
        }
      } else {
        console.log('Service worker not registered.');
      }
    } else {
      console.log('Service workers are not supported in this browser.');
    }
  }

  removeSubscriptionFromServer = async () => {
    try {
      const response = await this.api.post('/push/unsubscribe', { content: 'json' });
      const result = await response.json();
      console.log('Subscription removed from server:', result);
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  checkAndAddHandler() {
    if (window.wss) {
      window.wss.addMessageHandler(this.boundHandleWsMessage);
      console.log('WebSocket handler added successfully');
    } else {
      console.log('WebSocket manager not available, retrying...');
      setTimeout(this.checkAndAddHandler, 500); // Retry after 500ms
    }
  }

  disconnectedCallback() {
    this.enableScroll();
    if (window.wss) {
      window.wss.removeMessageHandler(this.boundHandleWsMessage);
    }
  }

  handleWsMessage = message => {
    // Handle the message in this component
    // console.log('Message received in component:', data);
    if (message.type !== 'action') return;
  }

  sendWsMessage(data) {
    window.wss.sendMessage(data);
  }

  // Open user profile
  handleUserClick = url => {
    // get a.meta.link
    const content = this.shadowObj.querySelector('section.tab > div.header > .name > a.username');

    // Get full post
    const profile =  this.getProfile();

    if(content) { 
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        
        // push the post to the app
        this.pushApp(url, profile);;
      })
    }
  }

  pushApp = (url, content) => {
    this.app.push(url, { kind: "app", name: 'profile', html: content }, url);
    // navigate to the content
    this.navigateTo(content);
  }

  navigateTo = content => {
    // navigate to the content
    this.app.navigate(content);
  }

  activateBtn = (mql, contentContainer, tabContainer, btn) => {
    // select all tabs
    const tabs = tabContainer.querySelectorAll('ul.tab');

    if(!btn || !tabs) return;

    // add event listener to button
    btn.addEventListener('click', () => {
        
      // check for mobile view
      if (mql) {
        // open tabs
        this.openCloseTabs(tabs, btn, contentContainer, tabContainer);
      }
      else {
        // go back in history if history is available or go to home
        window.history.back();
      }
    });
  }

  activateCloseTabs = (mql, btn, contentContainer, tabContainer) => {
    const tabs = tabContainer.querySelectorAll('ul.tab')
    // Check if open is true
    if (mql && this._open) {
      // add gap to the tab container
      tabContainer.style.setProperty('gap', '10px');

      tabs.forEach(tab => {
        // set max-height to max-content
        tab.style.setProperty('max-height', 'max-content');
      });

      // display content container to none
      contentContainer.style.setProperty('display', 'none');

      // rotate the button
      btn.style.setProperty('transform', 'rotate(180deg)');

      // Update open to true
      this._open = true;
    }
  }

  openCloseTabs = (tabs, btn, contentContainer, tabContainer) => {
    // Check if open is true
    if (this._open) {
      // add gap to the tab container
      tabContainer.style.setProperty('gap', '0');

      // close all tabs
      tabs.forEach(tab => {
        // set max-height to zero
        tab.style.setProperty('max-height', '0');
      });

      // display content container to flex
      contentContainer.style.setProperty('display', 'flex');

      // rotate the button
      btn.style.setProperty('transform', 'rotate(0deg)');

      // Update open to false
      this._open = false;
    }
    else {
      // add gap to the tab container
      tabContainer.style.setProperty('gap', '10px');

      tabs.forEach(tab => {
        // set max-height to max-content
        tab.style.setProperty('max-height', 'max-content');
      });

      // display content container to none
      contentContainer.style.setProperty('display', 'none');

      // rotate the button
      btn.style.setProperty('transform', 'rotate(180deg)');

      // Update open to true
      this._open = true;
    }
  }

  updateCurrent = current => {
    // select current tab
    const tab = this.shadowObj.querySelector(`section.tab li.${current}`);

    // if tab is available
    if (tab) {
      // add active class to tab
      tab.classList.add('active');
    }
  }

  activateTab = (mql, tabContainer, contentContainer) => {
    const outerThis = this;

    // select all tab
    const tabSections = tabContainer.querySelectorAll('ul.tab');

    // select btn 
    let btn = tabContainer.querySelector('div.header > svg');

    const tabItems = tabContainer.querySelectorAll('li.tab-item');
    let activeTab = tabContainer.querySelector('li.tab-item.active');
    if(!activeTab) activeTab = tabContainer.querySelector('li.tab-item.stats');

    tabItems.forEach(tab => {
      tab.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        // stop immediate propagation
        e.stopImmediatePropagation();

        // Check for mobile view
        if (mql) {
          // Open all tabs
          outerThis.openCloseTabs(tabSections, btn, contentContainer, tabContainer);
        }

        if (tab.dataset.name !== activeTab.dataset.name) {
          activeTab.classList.remove('active');

          // Update current attribute
          this.setAttribute('current', tab.dataset.name);

          // Add loader
          contentContainer.innerHTML = this.getLoader();

          tab.classList.add('active');
          activeTab = tab;

          // Change content
          this.changeContent(tab, contentContainer);
        }
      })
    });
  }

  handlePopState = event => {
    const tabContainer = this.shadowObj.querySelector('section.tab');
    const contentContainer = this.shadowObj.querySelector('div.content-container');
    let activeTab = tabContainer.querySelector('li.active');
    const outerThis = this;
    const state = event.state;
    if (state && state.kind === 'sub' && state.app === 'user') {
      // Select the state tab
      const tab = tabContainer.querySelector(`li.${state.name}`);

      if (tab) {
        activeTab.classList.remove('active');

        //Update status
        this._status = false;

        // Update current attribute
        this.setAttribute('current', tab.dataset.name);

        tab.classList.add('active');
        activeTab = tab;

        // Remove any child elements of the content container which is not section
        const children = Array.from(contentContainer.children);
        if (children) {
          children.forEach(child => {
            if (!child.classList.contains('remains')) {
              child.remove();
            }
          })
        }

        outerThis.updateState(event.state.name, contentContainer);
      }
    }
  }

  updateState = (name, contentContainer)=> {
    // populate content
    this.populateContent(name, contentContainer);
  }

  watchMediaQuery = mql => {
    const outerThis = this;
    mql.addEventListener('change', () => {
      // select the button
    
      outerThis.render();

      // update the current tab
      outerThis.updateCurrent(outerThis._current);

      const btn = outerThis.shadowObj.querySelector('section.tab > div.header > svg');
      const tabContainer = outerThis.shadowObj.querySelector('section.tab');
      const contentContainer = outerThis.shadowObj.querySelector('div.content-container');

      // Populate the current contents
      outerThis.populateCurrent(tabContainer, contentContainer);

      // Activate the tab
      outerThis.activateTab(mql.matches, tabContainer, contentContainer);

      // activate the button
      this.activateBtn(mql.matches, contentContainer, tabContainer, btn);
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

  changeContent = (tab, contentContainer) =>  {
    const outerThis = this;

    // Select loader
    const loader = this.shadowObj.querySelector('#loader-container');

    setTimeout(() => {
      if (loader) {
        loader.remove();
      }

      // Populate Content
      outerThis.populateContent(tab.dataset.name, contentContainer);

      this.app.push(tab.getAttribute('url'), { kind: "sub", app: "user", name: tab.dataset.name }, tab.dataset.name);
    }, 300);
  }

  populateCurrent = (tabContainer, contentContainer) =>  {
    const outerThis = this;

    // Select li with class name as current and content Container
    const currentItem = tabContainer.querySelector(`li.${this._current}`);
    // console.log("Reached", currentItem);
    // If selection is available
    if(currentItem) {
      currentItem.classList.add('active');

      // Select loader
      const loader = this.shadowObj.querySelector('#loader-container');

      // Set timeout to remove loader
      setTimeout(() => {
        if(loader) {
          loader.remove();
        }

        // Populate Content
        outerThis.populateContent(outerThis._current, contentContainer);
      }, 100)
    }
  }

  populateContent = (name, contentContainer) => {
    const contentMap = {
      'stats': this.getStats,
      'name': this.getFormName,
      'bio': this.getFormBio,
      'picture': this.getFormProfile,
      'socials': this.getFormSocial,
      'email': this.getFormEmail,
      'privacy': this.getSoon,
      'password': this.getFormPassword,
      'topics': this.getSoon,
      'activity': this.getActivity,
      'logout': this.logout
    };

    const contentFunction = contentMap[name] || this.getStats;

    if (name === 'logout') {
      contentFunction.call(this);
    } else {
      contentContainer.innerHTML = contentFunction.call(this);
    }
  }

  getDate = (isoTimeString) => {
    const currentDate = new Date();
    const targetDate = new Date(isoTimeString);

    const diffYears = currentDate.getFullYear() - targetDate.getFullYear();
    const diffMonths = currentDate.getMonth() - targetDate.getMonth();

    let formattedString = "Since ";

    // Build the formatted string based on the time difference
    if (diffYears > 0 || diffMonths >= 12) {
      formattedString += targetDate.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric'
      });
    } else if (diffMonths > 0) {
      formattedString += targetDate.toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric'
      });
    } else {
      formattedString += "Now";
    }

    return formattedString;
  }

  getLoader() {
    return /* html */`
      <div id="loader-container" class="loader-container">
				<div class="loader"></div>
			</div>
    `
  }

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    const isMobile = window.matchMedia('(max-width: 660px)').matches;
    const tabSection = this.getTab();
    const loader = this.getLoader();

    return /* html */`
      <main class="profile">
        ${isMobile ? `
          <section class="content">
            ${tabSection}
            <div class="content-container">
              ${loader}
            </div>
          </section>
        ` : `
          ${tabSection}
          <section class="content">
            <div class="content-container">
              ${loader}
            </div>
          </section>
        `}
      </main>
    `;
  }

  checkVerified = verified => {
    if (verified === 'true') {
      return /*html*/`
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.3592 1.41412C15.9218 0.966482 15.3993 0.610789 14.8224 0.367944C14.2455 0.125098 13.6259 0 13 0C12.3741 0 11.7545 0.125098 11.1776 0.367944C10.6007 0.610789 10.0782 0.966482 9.64079 1.41412L8.62993 2.45091L7.18354 2.43304C6.55745 2.42563 5.93619 2.54347 5.35631 2.77964C4.77642 3.01581 4.24962 3.36554 3.80687 3.80826C3.36413 4.25098 3.01438 4.77775 2.77819 5.3576C2.542 5.93744 2.42415 6.55866 2.43156 7.18472L2.44781 8.63102L1.41421 9.64181C0.966543 10.0792 0.610827 10.6017 0.367967 11.1785C0.125106 11.7554 0 12.3749 0 13.0008C0 13.6267 0.125106 14.2462 0.367967 14.8231C0.610827 15.3999 0.966543 15.9224 1.41421 16.3598L2.44944 17.3706L2.43156 18.8169C2.42415 19.443 2.542 20.0642 2.77819 20.644C3.01438 21.2239 3.36413 21.7506 3.80687 22.1934C4.24962 22.6361 4.77642 22.9858 5.35631 23.222C5.93619 23.4582 6.55745 23.576 7.18354 23.5686L8.62993 23.5523L9.64079 24.5859C10.0782 25.0335 10.6007 25.3892 11.1776 25.6321C11.7545 25.8749 12.3741 26 13 26C13.6259 26 14.2455 25.8749 14.8224 25.6321C15.3993 25.3892 15.9218 25.0335 16.3592 24.5859L17.3701 23.5507L18.8165 23.5686C19.4426 23.576 20.0638 23.4582 20.6437 23.222C21.2236 22.9858 21.7504 22.6361 22.1931 22.1934C22.6359 21.7506 22.9856 21.2239 23.2218 20.644C23.458 20.0642 23.5758 19.443 23.5684 18.8169L23.5522 17.3706L24.5858 16.3598C25.0335 15.9224 25.3892 15.3999 25.632 14.8231C25.8749 14.2462 26 13.6267 26 13.0008C26 12.3749 25.8749 11.7554 25.632 11.1785C25.3892 10.6017 25.0335 10.0792 24.5858 9.64181L23.5506 8.63102L23.5684 7.18472C23.5758 6.55866 23.458 5.93744 23.2218 5.3576C22.9856 4.77775 22.6359 4.25098 22.1931 3.80826C21.7504 3.36554 21.2236 3.01581 20.6437 2.77964C20.0638 2.54347 19.4426 2.42563 18.8165 2.43304L17.3701 2.44929L16.3592 1.41412Z" 
            fill="currentColor" id="top"/>
          <path d="M15.3256 4.97901C15.0228 4.6691 14.661 4.42285 14.2616 4.25473C13.8623 4.08661 13.4333 4 13 4C12.5667 4 12.1377 4.08661 11.7384 4.25473C11.339 4.42285 10.9772 4.6691 10.6744 4.97901L9.97457 5.69678L8.97322 5.68441C8.53977 5.67928 8.10967 5.76086 7.70821 5.92437C7.30675 6.08787 6.94204 6.32999 6.63553 6.63649C6.32901 6.94298 6.08688 7.30767 5.92336 7.70911C5.75985 8.11054 5.67826 8.54061 5.68339 8.97403L5.69464 9.97532L4.97907 10.6751C4.66914 10.9779 4.42288 11.3396 4.25475 11.739C4.08661 12.1383 4 12.5673 4 13.0006C4 13.4339 4.08661 13.8628 4.25475 14.2621C4.42288 14.6615 4.66914 15.0232 4.97907 15.326L5.69577 16.0258L5.68339 17.0271C5.67826 17.4605 5.75985 17.8906 5.92336 18.292C6.08688 18.6935 6.32901 19.0581 6.63553 19.3646C6.94204 19.6711 7.30675 19.9133 7.70821 20.0768C8.10967 20.2403 8.53977 20.3218 8.97322 20.3167L9.97457 
            20.3055L10.6744 21.021C10.9772 21.3309 11.339 21.5771 11.7384 21.7453C12.1377 21.9134 12.5667 22 13 22C13.4333 22 13.8623 21.9134 14.2616 21.7453C14.661 21.5771 15.0228 21.3309 15.3256 21.021L16.0254 20.3043L17.0268 20.3167C17.4602 20.3218 17.8903 20.2403 18.2918 20.0768C18.6932 19.9133 19.058 19.6711 19.3645 19.3646C19.671 19.0581 19.9131 18.6935 20.0766 18.292C20.2402 17.8906 20.3217 17.4605 20.3166 17.0271L20.3054 16.0258L21.0209 15.326C21.3309 15.0232 21.5771 14.6615 21.7453 14.2621C21.9134 13.8628 22 13.4339 22 13.0006C22 12.5673 21.9134 12.1383 21.7453 11.739C21.5771 11.3396 21.3309 10.9779 21.0209 10.6751L20.3042 9.97532L20.3166 8.97403C20.3217 8.54061 20.2402 8.11054 20.0766 7.70911C19.9131 7.30767 19.671 6.94298 19.3645 6.63649C19.058 6.32999 18.6932 6.08787 18.2918 5.92437C17.8903 5.76086 17.4602 5.67928 17.0268 5.68441L16.0254 5.69566L15.3256 4.97901ZM15.6485 11.7113L12.2732 15.0864C12.2209 15.1388 12.1588 15.1803 12.0905 15.2087C12.0222 15.2371 11.9489 15.2517 11.8749 15.2517C11.8009 15.2517 11.7276 15.2371 11.6593 15.2087C11.5909 15.1803 11.5289 15.1388 11.4766 15.0864L9.78893 13.3988C9.73662 13.3465 9.69513 13.2844 9.66683 13.2161C9.63852 13.1478 9.62395 13.0745 9.62395 13.0006C9.62395 12.9266 9.63852 12.8534 9.66683 12.785C9.69513 12.7167 9.73662 12.6546 9.78893 12.6023C9.84123 12.55 9.90333 12.5085 9.97166 12.4802C10.04 12.4519 10.1132 12.4373 10.1872 12.4373C10.2612 12.4373 10.3344 12.4519 10.4028 12.4802C10.4711 12.5085 10.5332 12.55 10.5855 12.6023L11.8749 13.8927L14.8519 10.9147C14.9576 10.8091 15.1008 10.7498 15.2502 10.7498C15.3996 10.7498 15.5429 10.8091 15.6485 10.9147C15.7542 11.0204 15.8135 11.1636 15.8135 11.313C15.8135 11.4624 15.7542 11.6056 15.6485 11.7113Z" 
            fill="currentColor" id="bottom"/>
        </svg>
			`
    }
    else {
      return ''
    }
  }

  getFormName = () =>  {
    // Get name and split it into first and last name if there two spaces combine the rest
    const name = this.getAttribute('user-name');
    const nameArray = name.split(' ');
    let firstName = nameArray[0];
    let lastName = nameArray[1];
    if (nameArray.length > 2) {
      for (let i = 2; i < nameArray.length; i++) {
        lastName += ` ${nameArray[i]}`;
      }
    }

    return /* html */`
      <name-form  method="PATCH" url="/user/name" api="/u/edit/name"
        first-name="${firstName}" last-name="${lastName}">
      </name-form>
    `;
  }

  getFormBio = () =>  {
    return /* html */`
      <bio-form method="PATCH" url="/user/bio" api="/u/edit/bio"
        bio="${this.getAttribute('user-bio')}">
      </bio-form>
    `;
  }

  getFormProfile = () =>  {
    return /* html */`
      <profile-form method="PATCH" url="/user/profile" api="/u/edit/profile"
        profile-image="${this.getAttribute('user-img')}">
      </profile-form>
    `;
  }

  getFormSocial = () =>  {
    const socials = {
      email: this.getAttribute('user-email') || '',
      x: this.getAttribute('user-x') || '',
      threads: this.getAttribute('user-threads') || '',
      linkedin: this.getAttribute('user-linkedin') || '',
      link: this.getAttribute('user-link') || ''
    }
    return /* html */`
      <social-form method="PATCH" url="/user/socials" api="/u/edit/contact"
        email="${socials.email}" x="${socials.x}"
        threads="${socials.threads}" linkedin="${socials.linkedin}" link="${socials.link}">
      </social-form>
    `;
  }

  getFormEmail = () =>  {
    return /* html */`
      <email-form method="PATCH" url="/user/email" api="/u/edit/email"
        email="${this.getAttribute('email')}">
      </email-form>
    `;
  }

  getFormPassword = () =>  {
    return /* html */`
      <password-form method="PATCH" url="/user/password" api="/u/edit/password">
      </password-form>
    `;
  }

  getActivity = () =>  {
    return /* html */`
      <activity-container url="/user/activity" api-all="/c/all" api-users="/c/users"
        api-posts="/c/posts" api-replies="/c/replies" api-topics="/c/topics">
      </activity-container>
    `;
  }

  getStats = () =>  {
    return /* html */`
      <stat-container url="/user/stats" api="/u/stats" posts-stats="/user/stats/posts" replies-stats="/user/stats/replies"></stat-container>
    `;
  }

  getSoon = () => {
    return /* html */`
      <div class="privacy coming-soon">
      <h3 class="title">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M.143 2.31a.75.75 0 0 1 1.047-.167l14.5 10.5a.75.75 0 1 1-.88 1.214l-2.248-1.628C11.346 13.19 9.792 14 8 14c-1.981 0-3.67-.992-4.933-2.078C1.797 10.832.88 9.577.43 8.9a1.619 1.619 0 0 1 0-1.797c.353-.533.995-1.42 1.868-2.305L.31 3.357A.75.75 0 0 1 .143 2.31Zm1.536 5.622A.12.12 0 0 0 1.657 8c0 .021.006.045.022.068.412.621 1.242 1.75 2.366 2.717C5.175 11.758 6.527 12.5 8 12.5c1.195 0 2.31-.488 3.29-1.191L9.063 9.695A2 2 0 0 1 6.058 7.52L3.529 5.688a14.207 14.207 0 0 0-1.85 2.244ZM8 3.5c-.516 0-1.017.09-1.499.251a.75.75 0 1 1-.473-1.423A6.207 6.207 0 0 1 8 2c1.981 0 3.67.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.11.166-.248.365-.41.587a.75.75 0 1 1-1.21-.887c.148-.201.272-.382.371-.53a.119.119 0 0 0 0-.137c-.412-.621-1.242-1.75-2.366-2.717C10.825 4.242 9.473 3.5 8 3.5Z"></path>
        </svg>
        <span class="text">Coming soon!</span>
      </h3>
      <p class="info">
        We are working on this feature. It will be available soon. Thank you for your patience!
      </p>
      </div>
    `
  }

  getTab = () =>  {
    return /* html */`
      <section class="tab remains">
        ${this.getHeader()}
        <ul class="tab public">
          <li url="/user/stats" class="tab-item stats" data-name="stats">
            <span class="line"></span>
            <a href="/user/stats" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="16" height="16">
                <path d="M9.533.753V.752c.217 2.385 1.463 3.626 2.653 4.81C13.37 6.74 14.498 7.863 14.498 10c0 3.5-3 6-6.5 6S1.5 13.512 1.5 10c0-1.298.536-2.56 1.425-3.286.376-.308.862 0 1.035.454C4.46 8.487 5.581 8.419 6 8c.282-.282.341-.811-.003-1.5C4.34 3.187 7.035.75 8.77.146c.39-.137.726.194.763.607ZM7.998 14.5c2.832 0 5-1.98 5-4.5 0-1.463-.68-2.19-1.879-3.383l-.036-.037c-1.013-1.008-2.3-2.29-2.834-4.434-.322.256-.63.579-.864.953-.432.696-.621 1.58-.046 2.73.473.947.67 2.284-.278 3.232-.61.61-1.545.84-2.403.633a2.79 2.79 0 0 1-1.436-.874A3.198 3.198 0 0 0 3 10c0 2.53 2.164 4.5 4.998 4.5Z"></path>
              </svg>
              <span class="text">Your stats</span>
            </a>
          </li>
          <li url="/user/name" class="tab-item name" data-name="name">
            <span class="line"></span>
            <a href="/user/name" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 512 512" width="16px" height="16px">
                <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208c13.3 0 24 10.7 24 24s-10.7 24-24 24C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256v28c0 50.8-41.2 92-92 92c-31.1 0-58.7-15.5-75.3-39.2C322.7 360.9 291.1 376 256 376c-66.3 0-120-53.7-120-120s53.7-120 120-120c28.8 0 55.2 10.1 75.8 27c4.3-6.6 11.7-11 20.2-11c13.3 0 24 10.7 24 24v80 28c0 24.3 19.7 44 44 44s44-19.7 44-44V256c0-114.9-93.1-208-208-208zm72 208a72 72 0 1 0 -144 0 72 72 0 1 0 144 0z"/>
              </svg>
              <span class="text">Your name</span>
            </a>
          </li>
          <li url="/user/bio" class="tab-item bio" data-name="bio">
            <span class="line"></span>
            <a href="/user/bio" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor"  width="16px" height="16px" viewBox="0 0 512 512">
                <path d="M441.2 59.1L453.1 71c9.4 9.4 9.4 24.6 0 33.9L432 126.1 386.3 80.4l20.8-21.1c9.4-9.5 24.6-9.5 34.1-.1zM231.9 236.8L352.6 114.5 398.1 160 276.6 281.6c-3.3 3.3-7.5 5.6-12 6.5L215 298.5l10.4-49.7c.9-4.5 3.2-8.7 6.4-11.9zM373 25.5L197.7 203.1c-9.7 9.8-16.4 22.3-19.2 35.8l-18 85.7c-1.7 7.9 .8 16.2 6.5 21.9s14 8.2 21.9 6.5l85.5-17.9c13.7-2.9 26.3-9.7 36.1-19.6L487.1 138.9c28.1-28.1 28.1-73.7 0-101.8L475.1 25.2C446.9-3.1 401-2.9 373 25.5zm-48.3-7.9C302.9 11.4 279.8 8 256 8C119 8 8 119 8 256S119 504 256 504c13.3 0 24-10.7 24-24s-10.7-24-24-24C145.5 456 56 366.5 56 256S145.5 56 256 56c9.7 0 19.3 .7 28.7 2l40-40.4zM454.1 228.4c1.2 9 1.9 18.2 1.9 27.6c0 57.4-46.6 104-104 104c-13.3 0-24 10.7-24 24s10.7 24 24 24c83.9 0 152-68.1 152-152c0-23.6-3.3-46.4-9.4-68l-40.4 40.5z"/>
              </svg>
              <span class="text">Your bio</span>
            </a>
          </li>
          <li url="/user/picture" class="tab-item picture"  data-name="picture">
            <span class="line"></span>
            <a href="/user/picture" class="tab-link">
              <svg aria-hidden="true" height="16" fill="currentColor" viewBox="0 0 16 16" width="16">
                <path d="M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 1 5.123 0ZM10.5 5a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
              </svg>
              <span class="text">Your picture</span>
            </a>
          </li>
          <li url="/user/socials" class="tab-item socials" data-name="socials">
            <span class="line"></span>
            <a href="/user/socials" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 640 512">
                <path d="M580.3 267.2c56.2-56.2 56.2-147.3 0-203.5C526.8 10.2 440.9 7.3 383.9 57.2l-6.1 5.4c-10 8.7-11 23.9-2.3 33.9s23.9 11 33.9 2.3l6.1-5.4c38-33.2 95.2-31.3 130.9 4.4c37.4 37.4 37.4 98.1 0 135.6L433.1 346.6c-37.4 37.4-98.2 37.4-135.6 0c-35.7-35.7-37.6-92.9-4.4-130.9l4.7-5.4c8.7-10 7.7-25.1-2.3-33.9s-25.1-7.7-33.9 2.3l-4.7 5.4c-49.8 57-46.9 142.9 6.6 196.4c56.2 56.2 147.3 56.2 203.5 0L580.3 267.2zM59.7 244.8C3.5 301 3.5 392.1 59.7 448.2c53.6 53.6 139.5 56.4 196.5 6.5l6.1-5.4c10-8.7 11-23.9 2.3-33.9s-23.9-11-33.9-2.3l-6.1 5.4c-38 33.2-95.2 31.3-130.9-4.4c-37.4-37.4-37.4-98.1 0-135.6L207 165.4c37.4-37.4 98.1-37.4 135.6 0c35.7 35.7 37.6 92.9 4.4 130.9l-5.4 6.1c-8.7 10-7.7 25.1 2.3 33.9s25.1 7.7 33.9-2.3l5.4-6.1c49.9-57 47-142.9-6.5-196.5c-56.2-56.2-147.3-56.2-203.5 0L59.7 244.8z" />
              </svg>
              <span class="text">Your socials</span>
            </a>
          </li>
        </ul>
        <ul class="tab security">
          <span class="title">Security</span>
          <li url="/user/email" class="tab-item email"  data-name="email">
            <span class="line"></span>
            <a href="/user/email" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16px" height="16px" viewBox="0 0 512 512">
                <path d="M64 112c-8.8 0-16 7.2-16 16v22.1L220.5 291.7c20.7 17 50.4 17 71.1 0L464 150.1V128c0-8.8-7.2-16-16-16H64zM48 212.2V384c0 8.8 7.2 16 16 16H448c8.8 0 16-7.2 16-16V212.2L322 328.8c-38.4 31.5-93.7 31.5-132 0L48 212.2zM0 128C0 92.7 28.7 64 64 64H448c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128z" />
              </svg>
              <span class="text">Your email</span>
            </a>
          </li>
          <li url="/user/privacy" class="tab-item privacy" data-name="privacy">
            <span class="line"></span>
            <a href="/user/privacy" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16px" height="16px" viewBox="0 0 512 512">
                <path
                  d="M73 127L256 49.4 439 127c5.9 2.5 9.1 7.8 9 12.8c-.4 91.4-38.4 249.3-186.3 320.1c-3.6 1.7-7.8 1.7-11.3 0C102.4 389 64.5 231.2 64 139.7c0-5 3.1-10.2 9-12.8zM457.7 82.8L269.4 2.9C265.2 1 260.7 0 256 0s-9.2 1-13.4 2.9L54.3 82.8c-22 9.3-38.4 31-38.3 57.2c.5 99.2 41.3 280.7 213.6 363.2c16.7 8 36.1 8 52.8 0C454.8 420.7 495.5 239.2 496 140c.1-26.2-16.3-47.9-38.3-57.2zM160 154.4V272c0 53 43 96 96 96s96-43 96-96V154.4c0-5.8-4.7-10.4-10.4-10.4h-.2c-3.4 0-6.5 1.6-8.5 4.3l-40 53.3c-3 4-7.8 6.4-12.8 6.4H232c-5 0-9.8-2.4-12.8-6.4l-40-53.3c-2-2.7-5.2-4.3-8.5-4.3h-.2c-5.8 0-10.4 4.7-10.4 10.4zM216 256a16 16 0 1 1 0 32 16 16 0 1 1 0-32zm64 16a16 16 0 1 1 32 0 16 16 0 1 1 -32 0z" />
              </svg>
              <span class="text">Your privacy</span>
            </a>
          </li>
          <li url="/user/password" class="tab-item password" data-name="password">
            <span class="line"></span>
            <a href="/user/password" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16px" height="16px" viewBox="0 0 512 512">
                <path d="M73 127L256 49.4 439 127c5.9 2.5 9.1 7.8 9 12.8c-.4 91.4-38.4 249.3-186.3 320.1c-3.6 1.7-7.8 1.7-11.3 0C102.4 389 64.5 231.2 64 139.7c0-5 3.1-10.2 9-12.8zM457.7 82.8L269.4 2.9C265.2 1 260.7 0 256 0s-9.2 1-13.4 2.9L54.3 82.8c-22 9.3-38.4 31-38.3 57.2c.5 99.2 41.3 280.7 213.6 363.2c16.7 8 36.1 8 52.8 0C454.8 420.7 495.5 239.2 496 140c.1-26.2-16.3-47.9-38.3-57.2zM312 208c0-30.9-25.1-56-56-56s-56 25.1-56 56c0 22.3 13.1 41.6 32 50.6V328c0 13.3 10.7 24 24 24s24-10.7 24-24V258.6c18.9-9 32-28.3 32-50.6z" />
              </svg>
              <span class="text">Your password</span>
            </a>
          </li>
        </ul>
        <ul class="tab activity">
          <span class="title">Activity</span>
          <li url="/user/activity" class="tab-item activity" data-name="activity">
            <span class="line"></span>
            <a href="/user/activity" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="16" height="16">
                <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
              </svg>
              <span class="text">Your activity</span>
            </a>
          </li>
          <li url="/user/topics" class="tab-item topics" data-name="topics">
            <span class="line"></span>
            <a href="/user/topics" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="16" height="16">
                <path
                  d="M0 2.75C0 1.783.784 1 1.75 1h8.5c.967 0 1.75.783 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.457 1.457 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25Zm1.75-.25a.25.25 0 0 0-.25.25v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.189L6.22 8.72a.747.747 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25Zm12.5 2h-.5a.75.75 0 0 1 0-1.5h.5c.967 0 1.75.783 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.457 1.457 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 1 1 1.06-1.06l2.22 2.219V11.25a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25Zm-5.47.28-3 3a.747.747 0 0 1-1.06 0l-1.5-1.5a.749.749 0 1 1 1.06-1.06l.97.969L7.72 3.72a.749.749 0 1 1 1.06 1.06Z">
                </path>
              </svg>
              <span class="text">Your topics</span>
            </a>
          </li>
        </ul>
        <ul class="tab preference">
          <span class="title">Account</span>
          <li url="/user/logout" class="tab-item logout" data-name="logout">
            <span class="line"></span>
            <a href="/user/logout" class="tab-link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M2 2.75C2 1.784 2.784 1 3.75 1h2.5a.75.75 0 0 1 0 1.5h-2.5a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 0 1.5h-2.5A1.75 1.75 0 0 1 2 13.25Zm10.44 4.5-1.97-1.97a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.97-1.97H6.75a.75.75 0 0 1 0-1.5Z"></path>
              </svg>
              <span class="text">Logout</span>
            </a>
          </li>
        </ul>
      </section>
    `;
  }

  getHeader = () => {
    // Get name and check if it's greater than 20 characters
    const name = this.getAttribute('user-name')

    return /* html */`
      <div class="header remains">
        ${this.getIcon()}
        <div class="profile">
          ${this.getPicture(this.getAttribute('user-img'))}
        </div>
        <div class="name">
          <h4 class="name">${name}</h4>
          <a href="${this.getAttribute('user-url')}" class="username">
            <span class="text">${this.getAttribute('user-username')}</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M4.53 4.75A.75.75 0 0 1 5.28 4h6.01a.75.75 0 0 1 .75.75v6.01a.75.75 0 0 1-1.5 0v-4.2l-5.26 5.261a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L9.48 5.5h-4.2a.75.75 0 0 1-.75-.75Z" />
            </svg>
          </a>
        </div>
      </div>
    `
  }

  getPicture = picture => {
    // check if picture is empty || null || === "null"
    if (picture === '' || picture === null || picture === 'null') {
      return /*html*/`
        <div class="avatar svg">
          <div class="svg-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"></path>
            </svg>
          </div>
          ${this.checkVerified(this.getAttribute('verified'))}
        </div>
      `
    }
    else {
      return /*html*/`
        <div class="avatar">
          <img src="${picture}" alt="Author picture" async lazy="true">
          ${this.checkVerified(this.getAttribute('verified'))}
        </div>
      `
    }
  }

  getIcon = () => {
    // check for mobile
    const isMobile = window.matchMedia('(max-width: 660px)').matches;

    if (isMobile) {
      return /* html */`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
        </svg>
      `
    }
    else {
      return /* html */`
        <svg class="top-btn" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"></path>
        </svg>
      `
    }
  }

  getProfile = () => {
    // get url
    let url = this.getAttribute('user-url');
 
    // trim white spaces and convert to lowercase
    url = url.trim().toLowerCase();

   return /* html */`
    <app-profile tab="posts" you="true" url="${url}" tab="posts"
      posts-url="${this.getAttribute('posts-url')}" replies-url="${this.getAttribute('replies-url')}"
      posts="${this.getAttribute('posts')}" replies="${this.getAttribute('replies')}"
      followers-url="${url}/followers" following-url="${url}/following" contact='${this.getAttribute("user-contact")}'
      hash="${this.getAttribute('hash')}" picture="${this.getAttribute('user-img')}" verified="${this.getAttribute('user-verified')}"
      name="${this.getAttribute('user-name')}" followers="${this.getAttribute('user-followers')}"
      following="${this.getAttribute('user-following')}" user-follow="${this.getAttribute('user-follow')}" bio="${this.getAttribute('user-bio')}">
    </app-profile>
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
          flex-flow: column;
          gap: 0px;
        }

        .top-nav {
          border-bottom: var(--border);
          color: var(--title-color);
          display: flex;
          flex-flow: row;
          align-items: center;
          background-color: var(--background);
          padding: 0;
          gap: 0;
          max-height: 50px;
          min-height: 50px;
          margin: 0 0 5px;
          gap: 0;
          width: 100%;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .top-nav h3 {
          display: flex;
          flex-flow: row;
          align-items: center;
          margin: 0;
          padding: 0;
          font-family: var(--font-main), sans-serif;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .top-nav svg {
          cursor: pointer;
          width: 35px;
          height: 35px;
          margin: 0 0 0 -8px;
        }

        div.loader-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 150px;
          min-width: 100%;
        }

        div.loader-container > .loader {
          width: 20px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: var(--accent-linear);
          display: grid;
          animation: l22-0 2s infinite linear;
        }

        div.loader-container > .loader:before {
          content: "";
          grid-area: 1/1;
          margin: 15%;
          border-radius: 50%;
          background: var(--second-linear);
          transform: rotate(0deg) translate(150%);
          animation: l22 1s infinite;
        }

        div.loader-container > .loader:after {
          content: "";
          grid-area: 1/1;
          margin: 15%;
          border-radius: 50%;
          background: var(--accent-linear);
          transform: rotate(0deg) translate(150%);
          animation: l22 1s infinite;
        }

        div.loader-container > .loader:after {
          animation-delay: -.5s
        }

        @keyframes l22-0 {
          100% {transform: rotate(1turn)}
        }

        @keyframes l22 {
          100% {transform: rotate(1turn) translate(150%)}
        }

        main.profile {
          padding: 0;
          margin: 0;
          display: flex;
          align-items: flex-start;
          flex-flow: row-reverse;
          justify-content: space-between;
          gap: 30px;
          min-height: 100vh;
        }

        section.tab {
          padding: 0 0 30px 0;
          width: 25%;
          display: flex;
          background-color: var(--background);
          flex-flow: column;
          position: sticky;
          top: 0;
          gap: 10px;
          height: max-content;
          max-height: 100vh;
          overflow-y: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        section.tab::-webkit-scrollbar {
          display: none;
          visibility: hidden;
        }

        section.tab > div.header {
          display: flex;
          width: 100%;
          border-bottom: var(--border);
          background-color: var(--background);
          gap: 7px;
          width: 100%;
          max-width: 100%;
          padding: 15px 0 10px 0;
          margin: 0 0 5px;
          max-height: max-content;
          display: flex;
          align-items: center;
          position: sticky;
          top: 0;
          z-index: 5;
        }

        section.tab > div.header > svg {
          cursor: pointer;
          display: none;
          color: var(--title-color);
          width: 35px;
          height: 35px;
          margin: 0 0 0 -5px;
        }

        section.tab > div.header > svg:hover {
          color: var(--accent-color);
        }

        section.tab > div.header > .profile {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin: 0;
          width: 45px;
          height: 45px;
          min-width: 45px;
          min-height: 45px;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
          -ms-border-radius: 50%;
          -o-border-radius: 50%;
        }

        section.tab > div.header > .profile .avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-width: 100%;
          min-height: 100%;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
        }

        section.tab > div.header > .profile .avatar.svg {
          background: var(--gray-background);
          max-width: 45px;
          max-height: 45px;
        }

        section.tab > div.header > .profile .avatar img {
          width: 100%;
          height: 100%;
          overflow: hidden;
          object-fit: cover;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
          -ms-border-radius: 50%;
          -o-border-radius: 50%;
        }

         section.tab > div.header > .profile .avatar .svg-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
        }

        section.tab > div.header > .profile .avatar .svg-avatar svg {
          width: 30px;
          height: 30px;
          color: var(--gray-color);
          display: inline-block;
          margin: 0 0 5px 0;
        }

        section.tab > div.header > .profile .avatar > svg {
          position: absolute;
          bottom: -2px;
          right: -4px;
          width: 23px;
          height: 23px;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        section.tab > div.header > .profile .avatar > svg path#top {
          color: var(--background);
        }
        
        section.tab > div.header > .profile .avatar > svg path#bottom {
          color: var(--alt-color);
        }

        section.tab > div.header > .name {
          margin: 0;
          display: flex;
          justify-content: center;
          flex-flow: column;
          gap: 3px;
          width: calc(100% - 52px);
          max-width: calc(100% - 52px);
        }

        section.tab > div.header > .name > h4.name {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--title-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 500;
          /** add ellipsis */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        section.tab > div.header > .name > a.username {
          color: var(--gray-color);
          font-family: var(--font-mono), monospace;
          font-size: 0.9rem;
          font-weight: 500;
          width: max-content;
          text-decoration: none;
          display: flex;
          gap: 2px;
          align-items: center;
        }

        section.tab > div.header > .name > a.username:hover {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        section.tab > div.header > .name > a.username:hover svg {
          color: var(--accent-color);
        }

        section.tab > ul.tab {
          border-top: var(--border-mobile);
          list-style-type: none;
          width: 100%;
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        section.tab > ul.tab.public {
          border: none;
        }

        section.tab > ul.tab > li.tab-item {
          position: relative;
          padding: 0;
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          margin: 0;
          width: 100%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: start;
        }

        section.tab > ul.tab > span.title {
          color: var(--highlight-color);
          display: inline-block;
          padding: 15px 10px 6px 10px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        section.tab > ul.tab > li.tab-item > span.line {
          position: absolute;
          display: none;
          left: -10px;
          top: calc(40% / 2);
          width: 4px;
          height: 60%;
          background: var(--accent-linear);
          border-radius: 5px;
          -webkit-border-radius: 5px;
          -moz-border-radius: 5px;
          -ms-border-radius: 5px;
          -o-border-radius: 5px;
        }

        section.tab > ul.tab > li.tab-item.active > span.line {
          display: inline-block;
        }

        section.tab > ul.tab > li.tab-item > a.tab-link {
          width: 100%;
          display: flex;
          align-items: center;
          text-decoration: none;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          padding: 7px 10px 6px 10px;
          gap: 10px;
          border-radius: 9px;
          -webkit-border-radius: 9px;
          -moz-border-radius: 9px;
          -ms-border-radius: 9px;
          -o-border-radius: 9px;
        }

        section.tab > ul.tab > li.tab-item.logout > a.tab-link {
          color: var(--error-color);
        }

        section.tab > ul.tab > li.tab-item > a.tab-link:hover {
          background: var(--tab-background);
        }
        section.tab > ul.tab > li.tab-item.active > a.tab-link {
          background-color: var(--tab-background);
          color: var(--highlight-color);
        }

        section.tab > ul.tab > li.tab-item.active.logout > a.tab-link {
          color: var(--error-color);
        }

        section.content {
          display: flex;
          position: relative;
          flex-flow: column;
          align-items: start;
          gap: 0;
          padding: 15px 0 0 0;
          width: 70%;
        }

        section.content > div.content-container {
          display: flex;
          flex-flow: column;
          position: relative;
          padding: 0;
          margin: 0;
          width: 100%;
          min-height: 70vh;
        }

        div.coming-soon {
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          padding: 0;
          width: 100%;
          min-height: max-content;
          height: 100%;
        }

        div.coming-soon > .title {
          color: var(--title-color);
          font-family: var(--title-main), sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0 0 10px 0;
          line-height: 1.5;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
        }

        div.coming-soon > .title svg {
          color: var(--error-color);
          width: 25px;
          height: 25px;
          margin: 0 0 10px 0;
        }

        div.coming-soon > .title span.text {
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: inherit;
          font-weight: 600;
          text-align: center;
        }

        div.coming-soon > p.info {
          color: var(--gray-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          margin: 0 0 10px 0;
          font-weight: 400;
          line-height: 1.5;
          text-align: center;
        }

				@media screen and (max-width: 900px) {
          section.tab {
            padding: 0;
            width: 33%;
          }
          section.content {
            width: 62%;
          }
        }

				@media screen and (max-width: 660px) {
					:host {
            font-size: 16px;
            padding: 0;
					}

          main.profile {
            padding: 0;
            width: 100%;
            margin: 0;
            display: flex;
            flex-flow: column;
            justify-content: start;
            gap: 0;
            min-height: max-content;
            height: max-content;
            max-height: max-content;
          }

           section.content {
            display: flex;
            flex-flow: column;
            align-items: start;
            min-height: 100vh;
            padding: 0 0 60px 0;
            gap: 0;
            width: 100%;
          }

          section.tab {
            padding: 0 10px;
            width: 100%;
            min-width: 100%;
            max-height: max-content;
            display: flex;
            flex-flow: column;
            gap: 0;
            height: max-content;
            position: unset;
          }
  
          section.tab > ul.tab > span.title {
            color: var(--text-color);
            display: inline-block;
            padding: 5px 10px;
            font-size: 0.9rem;
            font-weight: 600;
          }

          section.tab > div.header > .name {
            margin: 0 0 0 5px;
            display: flex;
            justify-content: center;
            flex-flow: column;
            gap: 0;
            width: calc(100% - 90px);
            max-width: calc(100% - 90px);
          }

          section.tab > div.header {
            padding: 10px 0;
            border-bottom: var(--border);
            display: flex;
            position: relative;
          }

          section.tab > div.header > svg {
            transition: all 0.3s ease-in-out;
            display: inline-block;
            position: absolute;
            cursor: default !important;
            right: 10px;
            top: 18px;
            width: 23px;
            height: 23px;
            margin: 0 0 0 -5px;
          }

          section.tab > ul.tab {
            border-top: var(--border);
            transition: all 0.5s ease;
            border: none;
            max-height: 0;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          section.tab > ul.tab > li.tab-item,
          a {
            cursor: default !important;
          }

          div.coming-soon {
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: center;
            margin: 15px 0 0 0;
            padding: 20px 10px;
            width: 100%;
            min-height: max-content;
            height: 100%;
          }
				}
	    </style>
    `;
  }
}