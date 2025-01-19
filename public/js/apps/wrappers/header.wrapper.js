export default class HeaderWrapper extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // check if the user is authenticated
    this._authenticated = window.hash ? true : false;

    this._user = null;
    this._unverified = false;

    this.fetchUpdate();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  // add attribute to watch for changes
  static get observedAttributes() {
    return ['section', 'type'];
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  // check for attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      // check if the attribute is section
      if (name === 'section') {
        // select the title element
        const title = this.shadowObj.querySelector('h3.name');
        // update the title
        title.textContent = newValue;
      }
    }
  }

  connectedCallback() {
    const body = document.querySelector('body');
    // select the back svg
    const back = this.shadowObj.querySelector('nav.nav > .left svg');

    const links = this.shadowObj.querySelectorAll('div.links > a.link');

    if(links) {
      this.updateActive(links)
    }

    if (back) {
      // activate the back button
      this.activateBackButton(back);
    }

    this.handleUserClick(body);
  }

  disconnectedCallback() {
    this.enableScroll();
  }

  // handle icons click
  handleUserClick = body => {
    const outerThis = this;
    // get a.meta.link
    const links = this.shadowObj.querySelectorAll('div.links > a.link');

    if(body && links) { 
      links.forEach(link => {
        link.addEventListener('click', event => {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();

          const name = link.getAttribute('name');
          const url = link.getAttribute('href');

          try {
            if (name === 'logon') {
              // replace and push states
              this.replaceAndPushStates(url, body, outerThis.getLogon(document.location.pathname));
            } else if(name === 'updates'){
              // replace and push states
              this.replaceAndPushStates(url, body, outerThis.getUser(outerThis._user, 'updates'));
            } else if(name === 'profile'){
              // replace and push states
              this.replaceAndPushStates(url, body, outerThis.getUser(outerThis._user, ''));
            } else if(name === 'search') {
              // replace and push states
              this.replaceAndPushStates(url, body, outerThis.getSearch());
            } else if (name === 'home') {
              // replace and push states
              this.replaceAndPushStates(url, body, outerThis.getHome());
            }
          } catch (error) {
            // console.log(error)
            outerThis.navigateToUser(url);
          }
        })
      })
    }
  }

  updateActive = links  => {
    const current = window.location.pathname;
    for(let i=0; i<links.length; i++) {
      const link = links[i];
      const name = link.getAttribute('href');

      if (current === name) {
        link.classList.add('active')
      }
    }
  }

  // Replace and push states
  replaceAndPushStates = (url, body, profile) => {
    // Replace the content with the current url and body content
    // get the first custom element in the body
    const firstElement = body.firstElementChild;

    // convert the custom element to a string
     const elementString = firstElement.outerHTML;
    // get window location
    const pageUrl = window.location.href;
    window.history.replaceState(
      { page: 'page', content: elementString },
      url, pageUrl
    );

    // Updating History State
    window.history.pushState(
      { page: 'page', content: profile},
      url, url
    );

    // update the body content
    body.innerHTML = profile;
  }

  getNext = () => {
    const body = document.querySelector('body');
    const firstElement = body.firstElementChild;

    // convert the custom element to a string
    return firstElement.outerHTML;
  }

  fetchUpdate = () => {
    const outerThis = this;
		// fetch the user stats
    const options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // set the cache control to max-age to 1 day
        "Cache-Control": "max-age=86400",
        "Accept": "application/json"
      }
    }

    const url = '/u/author/info'

    this.getCacheData(url, 86400, options)
      .then(result => {
        if (result.unverified) {
          outerThis._unverified = true;
          return;
        }
        // check for success response
        if (result.success) {
          if(!result.user) {
            // display empty message
            outerThis._user = null;
            return;
          }

          outerThis._user = result.user;
        }
        else {
          outerThis._user = null;
        }
      })
      .catch(error => {
        console.log(error);
        outerThis._user = null;
      });
	}

  navigateToUser = href => {
    window.location.href = href;
    return;
  }

  fetchWithTimeout = async (url, options = {}, timeout = 9500) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
  
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw new Error(`Network error: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  getCacheData = async (url, maxAge, options = {}) => {
    const cacheName = "user-cache";
  
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(url);
  
      if (cachedResponse) {
        const cachedData = await cachedResponse.json();
        const cacheTime = cachedData.timestamp;
  
        // Check if cache is still valid
        if (Date.now() - cacheTime < maxAge) {
          return cachedData.data;
        }
      }
  
      // If cache doesn't exist or is expired, fetch new data
      const networkResponse = await this.fetchWithTimeout(url, options);
      const data = await networkResponse.clone().json();
  
      // Store the new data in cache with a timestamp
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      
      const cacheResponse = new Response(JSON.stringify(cacheData));
      await cache.put(url, cacheResponse);
  
      return data;
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  };

  activateBackButton = btn => {
    btn.addEventListener('click', () => {
      // check window history is greater or equal to 1
      if (window.history.length >= 1) {
        // check if the history has state
        if (window.history.state) {
          // go back
          window.history.back();
          // console.log(window.history.state);
        }
        else {
          // redirect to home
          window.location.href = '/home';
        }
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

  getTemplate() {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    const title = this.getAttribute('section');
    return /* html */`
      <nav data-expanded="false" class="nav">
        ${this.getContent(title)}
      </nav>
    `
  }

  getContent = title => {
    // mql to check for mobile
    const mql = window.matchMedia('(max-width: 660px)');
    return /* html */ `
      ${this.getTitle(this.getAttribute('type'), mql.matches)}
      ${this.getTopIcons(this._authenticated)}
    `
  }

  getTopIcons = authenticated => {
    if (authenticated) {
      return /* html */ `
        <div class="links">
          <a href="/home" class="link discover" name="home" title="Home">
            <!--<svg width="21" height="22" viewBox="0 0 21 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.65722 19.7714V16.7047C7.6572 15.9246 8.29312 15.2908 9.08101 15.2856H11.9671C12.7587 15.2856 13.4005 15.9209 13.4005 16.7047V16.7047V19.7809C13.4003 20.4432 13.9343 20.9845 14.603 21H16.5271C18.4451 21 20 19.4607 20 17.5618V17.5618V8.83784C19.9898 8.09083 19.6355 7.38935 19.038 6.93303L12.4577 1.6853C11.3049 0.771566 9.6662 0.771566 8.51342 1.6853L1.96203 6.94256C1.36226 7.39702 1.00739 8.09967 1 8.84736V17.5618C1 19.4607 2.55488 21 4.47291 21H6.39696C7.08235 21 7.63797 20.4499 7.63797 19.7714V19.7714" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>-->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M6.906.664a1.749 1.749 0 0 1 2.187 0l5.25 4.2c.415.332.657.835.657 1.367v7.019A1.75 1.75 0 0 1 13.25 15h-3.5a.75.75 0 0 1-.75-.75V9H7v5.25a.75.75 0 0 1-.75.75h-3.5A1.75 1.75 0 0 1 1 13.25V6.23c0-.531.242-1.034.657-1.366l5.25-4.2Zm1.25 1.171a.25.25 0 0 0-.312 0l-5.25 4.2a.25.25 0 0 0-.094.196v7.019c0 .138.112.25.25.25H5.5V8.25a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v5.25h2.75a.25.25 0 0 0 .25-.25V6.23a.25.25 0 0 0-.094-.195Z"></path>
            </svg>        
          </a>
          <a href="/user" class="link profile" name="profile" title="User">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M8 0a8.2 8.2 0 0 1 .701.031C9.444.095 9.99.645 10.16 1.29l.288 1.107c.018.066.079.158.212.224.231.114.454.243.668.386.123.082.233.09.299.071l1.103-.303c.644-.176 1.392.021 1.82.63.27.385.506.792.704 1.218.315.675.111 1.422-.364 1.891l-.814.806c-.049.048-.098.147-.088.294.016.257.016.515 0 .772-.01.147.038.246.088.294l.814.806c.475.469.679 1.216.364 1.891a7.977 7.977 0 0 1-.704 1.217c-.428.61-1.176.807-1.82.63l-1.102-.302c-.067-.019-.177-.011-.3.071a5.909 5.909 0 0 1-.668.386c-.133.066-.194.158-.211.224l-.29 1.106c-.168.646-.715 1.196-1.458 1.26a8.006 8.006 0 0 1-1.402 0c-.743-.064-1.289-.614-1.458-1.26l-.289-1.106c-.018-.066-.079-.158-.212-.224a5.738 5.738 0 0 1-.668-.386c-.123-.082-.233-.09-.299-.071l-1.103.303c-.644.176-1.392-.021-1.82-.63a8.12 8.12 0 0 1-.704-1.218c-.315-.675-.111-1.422.363-1.891l.815-.806c.05-.048.098-.147.088-.294a6.214 6.214 0 0 1 0-.772c.01-.147-.038-.246-.088-.294l-.815-.806C.635 6.045.431 5.298.746 4.623a7.92 7.92 0 0 1 .704-1.217c.428-.61 1.176-.807 1.82-.63l1.102.302c.067.019.177.011.3-.071.214-.143.437-.272.668-.386.133-.066.194-.158.211-.224l.29-1.106C6.009.645 6.556.095 7.299.03 7.53.01 7.764 0 8 0Zm-.571 1.525c-.036.003-.108.036-.137.146l-.289 1.105c-.147.561-.549.967-.998 1.189-.173.086-.34.183-.5.29-.417.278-.97.423-1.529.27l-1.103-.303c-.109-.03-.175.016-.195.045-.22.312-.412.644-.573.99-.014.031-.021.11.059.19l.815.806c.411.406.562.957.53 1.456a4.709 4.709 0 0 0 0 .582c.032.499-.119 1.05-.53 1.456l-.815.806c-.081.08-.073.159-.059.19.162.346.353.677.573.989.02.03.085.076.195.046l1.102-.303c.56-.153 1.113-.008 1.53.27.161.107.328.204.501.29.447.222.85.629.997 1.189l.289 1.105c.029.109.101.143.137.146a6.6 6.6 0 0 0 1.142 0c.036-.003.108-.036.137-.146l.289-1.105c.147-.561.549-.967.998-1.189.173-.086.34-.183.5-.29.417-.278.97-.423 1.529-.27l1.103.303c.109.029.175-.016.195-.045.22-.313.411-.644.573-.99.014-.031.021-.11-.059-.19l-.815-.806c-.411-.406-.562-.957-.53-1.456a4.709 4.709 0 0 0 0-.582c-.032-.499.119-1.05.53-1.456l.815-.806c.081-.08.073-.159.059-.19a6.464 6.464 0 0 0-.573-.989c-.02-.03-.085-.076-.195-.046l-1.102.303c-.56.153-1.113.008-1.53-.27a4.44 4.44 0 0 0-.501-.29c-.447-.222-.85-.629-.997-1.189l-.289-1.105c-.029-.11-.101-.143-.137-.146a6.6 6.6 0 0 0-1.142 0ZM11 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.5 8a1.5 1.5 0 1 0-3.001.001A1.5 1.5 0 0 0 9.5 8Z"></path>
            </svg>
          </a>
          <a href="/user/updates" class="link updates" name="updates" title="Updates">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Zm5-3.5A3.5 3.5 0 0 0 4.5 5v2.947c0 .346-.102.683-.294.97l-1.703 2.556a.017.017 0 0 0-.003.01l.001.006c0 .002.002.004.004.006l.006.004.007.001h10.964l.007-.001.006-.004.004-.006.001-.007a.017.017 0 0 0-.003-.01l-1.703-2.554a1.745 1.745 0 0 1-.294-.97V5A3.5 3.5 0 0 0 8 1.5Z"></path>
            </svg>
            <!--<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M9.504.43a1.516 1.516 0 0 1 2.437 1.713L10.415 5.5h2.123c1.57 0 2.346 1.909 1.22 3.004l-7.34 7.142a1.249 1.249 0 0 1-.871.354h-.302a1.25 1.25 0 0 1-1.157-1.723L5.633 10.5H3.462c-1.57 0-2.346-1.909-1.22-3.004L9.503.429Zm1.047 1.074L3.286 8.571A.25.25 0 0 0 3.462 9H6.75a.75.75 0 0 1 .694 1.034l-1.713 4.188 6.982-6.793A.25.25 0 0 0 12.538 7H9.25a.75.75 0 0 1-.683-1.06l2.008-4.418.003-.006a.036.036 0 0 0-.004-.009l-.006-.006-.008-.001c-.003 0-.006.002-.009.004Z"></path>
            </svg>-->
          </a>
          <a href="/search" class="link search" name="search" title="Search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11.7666" cy="11.7667" r="8.98856" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M18.0183 18.4853L21.5423 22.0001" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
        </div>
      `
    }
    else {
      return /* html */ `
        <div class="links">
          <a href="/join/login" class="link signin" name="logon">
            <span class="text">Sign in</span>
          </a>
          <a href="" class="link search" name="search" title="Search">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11.7666" cy="11.7667" r="8.98856" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M18.0183 18.4853L21.5423 22.0001" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
        </div>
      `
    }
  }

  getTitle = (type, mql) => {
    const section = this.getAttribute('section');

    switch (type) {
      case 'home':
        return /*html*/`
          <div class="left home">
            <h3 class="name">${section}</h3>
          </div>
        `
      case 'user':
        if (mql) {
          return /*html*/`
            <div class="left user">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
              </svg>
              <h3 class="name">${section}</h3>
            </div>
          `
        }
        else {
          return /*html*/`
            <div class="left user">
              <h3 class="name">${section}</h3>
            </div>
          `
        }
      default:
        return /*html*/`
          <div class="left">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z"></path>
            </svg>
            <h3 class="name">${section}</h3>
          </div>
        `
    }
  }

  getHome = () => {
    return /* html */ `
      <app-home url="/home" recent-url="/h/recent" feeds-url="/h/feeds"
        trending-people="/q/trending/people" trending-url="/h/trending">
      </app-home>
    `
  }

  getLogon = next => {
    return /* html */ `
      <app-logon
        name="join" next="${next}" api-login="/a/login"
        api-register="/a/register" api-check-email="/a/check-email"
        api-forgot-password="/a/forgot-password" api-verify-token="/a/verify-token"
        api-reset-password="/a/reset-password" join-url="/join" login="/join/login"
        register="/join/register" forgot="/join/recover">
        ${this.getNext()}
      </app-logon>
    `
  }

  getSearch = () => {
    return /* html */ `
      <app-search url="/search" query="" page="1" tab="stories" stories-url="/q/stories"
        replies-url="/q/replies" people-url="/q/people" topics-url="/q/topics"
        trending-stories="/q/trending/stories" trending-people="/q/trending/people"
        trending-topics="/q/trending/topics" trending-replies="/q/trending/replies">
      </app-search>
    `
  }

  getUser = (data, current) => {
    // console.log(data)
    if(!data) throw new Error("User not found");

    const url = `/u/${data.hash.toLowerCase()}`;
    const contact = data.contact ? JSON.stringify(data.contact) : null;
    let bio = data.bio ? data.bio : 'This user has not added a bio yet.';
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');

    return /*html*/ `
      <app-user hash="${data.hash}" home-url="/home" current="${current}" 
        verified="${data.verified}" email="${data.email}" stories-url="${url}/stories" 
        replies-url="${url}/replies" stories="${data.stories}" replies="${data.replies}"
        user-link="${data.contact?.link}" user-email="${data.contact?.email}" 
        user-x="${data.contact?.x}" user-threads="${data.contact?.threads}" user-linkedin="${data.contact?.linkedin}" 
        user-username="${data.hash}" user-you="true" user-url="${url}" user-img="${data.picture}"  user-verified="${data.verified}" 
        user-name="${data.name}" user-followers="${data.followers}" user-contact='${contact}' user-following="${data.following}" 
        user-follow="false" user-bio="${bio}">
      </app-user>
    `;
  }

  getStyles() {
    const kind = this.getAttribute('type');
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
          width: 100%;
          height: max-content;
          background-color: var(--background);
          gap: 0;
          display: block;
          position: sticky;
          top: 0;
          z-index: 10;
          margin: ${kind === 'story' ? '0' : '0 0 10px'};
        }

        nav.nav {
          border-bottom: var(--border);
          color: var(--title-color);
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 10px;
          height: 60px;
          max-height: 60px;
          padding: 22px 0 8px;
        }

        nav.nav.short {
          border-bottom: none;
          max-height: 10px;
          padding: 0;
          margin: 0 0 10px;
        }

        nav.nav > .left {
          color: var(--title-color);
          display: flex;
          flex-flow: row;
          align-items: center;
          gap: 10px;
        }

        nav.nav > .left h3 {
          margin: 0;
          font-family: var(--font-main), sans-serif;
          font-size: 1.3rem;
          font-weight: 600;
        }

        nav.nav > .left.home h3 {
          margin: 0 0 -2px 0;
          padding: 0 0 0 2px;
          font-weight: 600;
          color: transparent;
          font-size: 1.5rem;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
          font-family: var(--read-text);
        }

        nav.nav > .left svg {
          color: var(--title-color);
          cursor: pointer;
          width: 28px;
          height: 28px;
          margin: 0 0 0 -3px;
        }

        nav.nav > .left > svg:hover {
          color: var(--accent-color);
        }

        nav.nav > .links {
          padding: 0 10px 0 0;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          width: max-content;
          gap: 15px;
        }

        nav.nav > .links > a.link {
          text-decoration: none;
          color: var(--gray-color);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        nav.nav > .links > a.link.updates:hover,
        nav.nav > .links > a.link.discover:hover,
        nav.nav > .links > a.link.profile:hover,
        nav.nav > .links > a.link.search:hover {
          transition: color 0.3s ease-in-out;
          -webkit-transition: color 0.3s ease-in-out;
          -moz-transition: color 0.3s ease-in-out;
          -ms-transition: color 0.3s ease-in-out;
          -o-transition: color 0.3s ease-in-out;
          color: var(--accent-color);
        }

        nav.nav > .links > a.link.active {
          transition: color 0.3s ease-in-out;
          -webkit-transition: color 0.3s ease-in-out;
          -moz-transition: color 0.3s ease-in-out;
          -ms-transition: color 0.3s ease-in-out;
          -o-transition: color 0.3s ease-in-out;
          color: var(--accent-color);
        }

        nav.nav > .links a.link.search a svg {
          margin: 0;
          width: 22px;
          height: 22px;
          margin: 0 0 -3px 0;
        }

        nav.nav > .links > a.link.discover > svg {
          width: 22px;
          height: 22px;
          margin: 1px 0 0 0;
        }

        nav.nav > .links > a.link.updates > svg{
          width: 23px;
          height: 23px;
          margin: 1px 0 0 0;
        }

        nav.nav > .links > a.link.profile > svg {
          width: 23px;
          height: 23px;
          margin: 1px 0 0 0;
        }

        nav.nav > .links > a.link.signin {
          border: var(--action-border);
          font-weight: 600;
          padding: 5px 15px 5px;
          font-family: var(--font-read);
          border-radius: 12px;
          -webkit-border-radius: 12px;
          -moz-border-radius: 12px;
          -ms-border-radius: 12px;
          -o-border-radius: 12px;
        }

        @media screen and (max-width: 660px) {
          :host {
            width: 100dvw;
            min-width: 100vw;
            font-size: 16px;
            margin: 0 -10px;
            padding: 0 10px;
          }

          nav.nav {
            border-bottom: var(--border);
            height: 50px;
            max-height: 50px;
            padding: 10px 0;
          }


          nav.nav > .left {
            gap: 5px;
            width: calc(100% - 130px);
          }

          nav.nav > .left h3 {
            margin: 0;
            font-family: var(--font-main), sans-serif;
            font-size: 1.2rem;
            font-weight: 600;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
          }

          nav.nav > .links {
            width: 130px;
            padding: 0;
          }

          nav.nav > .links > a.link.signin {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          a,
          nav.nav > .left svg,
          .stats > .stat {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}