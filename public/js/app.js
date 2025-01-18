import uis from "./apps/apps.js"
import APIManager from "./api.js";
export default class AppMain extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.content = this.getContent()
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    // register components
    this.registerComponents();
    this.preferences();
    this.api = new APIManager('/api/v1', 9500, 'v1');
    window.app = this;
    this.mql = window.matchMedia('(max-width: 660px)');
    this.render();
  }

  getContent = () => {
    const content = this.innerHTML;
    this.innerHTML = '';
    return content;
  }

  getCurrentCountry = () => {
    // get the current country using location API
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
          .then(response => response.json())
          .then(data => {
            const country = data.countryName;
            /* set the country code in local storage */
            localStorage.setItem('country', country);
          })
          .catch(error => {
            console.error('Error:', error);
          });
      });
    }
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
    // watch for media query changes
    this.watchMeta();
  }

  // noinspection JSMethodCanBeStatic
  connectedCallback() {
    this.setUpEvents()
  }

  setUpEvents = () => {
    // set display to flex
    this.style.setProperty('display', 'flex')
    const container = this.shadowObj.querySelector('section.flow');

    if(container) this.setContent(container);

    // request user to enable notifications
    this.checkNotificationPermission();
  }

  checkNotificationPermission = async () => {
    if(window.notify && !window.notify.permission) {
      await window.notify.requestPermission();
    }
  }

  watchMeta = () => {
    this.mql.addEventListener('change', e => {
      this.render();
      this.setUpEvents();
    })
  }

  showToast = (success, message) => {
    // check if the toast is already open
    const toastEl = document.querySelector('#toast');
    if (toastEl) toastEl.remove();

    // create the toast element
    const toast = this.getToast(success, message);

    // append the toast to the body
    document.body.insertAdjacentHTML('beforeend', toast);

    // add the show class to the toast
    const addedToast = document.querySelector('#toast');
    addedToast.classList.add('show');

    // remove the toast after 5 seconds
    setTimeout(() => {
      addedToast.classList.remove('show');
      setTimeout(() => {
        addedToast.remove();
      }, 300);
    }, 5000);
  }

  navigate = () => {
    // navigate to the new page
    this.shadowObj.innerHTML = html;
    this.setUpEvents();
  }

  /**
   * Navigate to a new URL and add it to history
   * @param {string} url - The URL to navigate to
   * @param {Object} state - State object to store with history entry
   * @param {string} title - Title for the new history entry
   */
  push(url, state = {}, title = '') {
    window.history.pushState(state, title, url);
    this.handleUIUpdate({ url, state });
  }

  /**
   * Replace current history entry with new URL
   * @param {string} url - The URL to navigate to
   * @param {Object} state - State object to store with history entry
   * @param {string} title - Title for the new history entry
   */
  replace(url, state = {}, title = '') {
    window.history.replaceState(state, title, url);
    this.handleUIUpdate({ url, state });
  }

  disconnectedCallback() {
    this.enableScroll();
    // clear window.home
    window.home = null;
  }

  registerComponents = () => {
    // Register all components here
    uis('Apps registered');
  }

  // set hash if user is logged
	setHash = name => {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);

		const cookie = parts.length === 2 ? parts.pop().split(';').shift() : null;

		// add cookie to the window
		window.hash = cookie;
	}

	setTheme = currentTheme =>{
		// Check the current theme
		const htmlElement = document.documentElement;
		const metaThemeColor = document.querySelector("meta[name=theme-color]");

		// Check if the current theme is: system
		if (currentTheme === 'system') {
			// Update the data-theme attribute
			htmlElement.setAttribute('data-theme', currentTheme);

			// Store the preference in local storage
			localStorage.setItem('theme', 'system');

			// Update the theme-color meta tag
			metaThemeColor.setAttribute("content", currentTheme === 'dark' ? '#000000' : '#ffffff');
			return;
		}
		
		// Update the data-theme attribute
		htmlElement.setAttribute('data-theme', currentTheme);
		
		// Store the preference in local storage
		localStorage.setItem('theme', currentTheme);

		// Update the theme-color meta tag
		metaThemeColor.setAttribute("content", currentTheme === 'dark' ? '#000000' : '#ffffff');
	}
	
	preferences() {
		const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

		// listen for theme change
		prefersDarkScheme.addEventListener('change', (event) => {
			// get local storage theme
			const currentTheme = localStorage.getItem('theme') || 'light';

			// if the theme is system
			if (currentTheme === 'system') {
				// set the theme
				setTheme('system');
				return;
			}
		})

		// get theme from local storage
		const currentTheme = localStorage.getItem('theme') || 'light';

		// set the theme
		this.setTheme(currentTheme);

		// set hash
		this.setHash('hash');
	}

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    const mql = window.matchMedia('(max-width: 660px)');
    if (mql.matches) {
      return /* html */`
        <section class="flow">
          ${this.getLoader()}
        </section>
        <section class="nav">
          ${this.getMobileNav()}
        </section>
      `;
    }
    else {
      return /* html */`
        <section class="nav">
          ${this.getMainNav()}
        </section>
        <section class="flow">
          ${this.getLoader()}
        </section>
      `;
    }
  }

  setContent = container => {
    setTimeout(() => {
      // set the content
      container.innerHTML = this.content;
    }, 3000);
  }

  getMainNav = () => {
    return /* html */`
      <ul class="logo nav">
        <li class="logo">
          <a href="/">
            <img src="/static/img/favi.png" alt="Logo"/>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Zoanai</span>
          </span>
        </li>
      </ul>
      <ul class="main nav">
        <li class="home">
          <a href="/">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M12 17H12.009" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20 8.5V13.5C20 17.2712 20 19.1569 18.8284 20.3284C17.6569 21.5 15.7712 21.5 12 21.5C8.22876 21.5 6.34315 21.5 5.17157 20.3284C4 19.1569 4 17.2712 4 13.5V8.5" stroke="currentColor" stroke-width="1.8" />
              <path d="M22 10.5L17.6569 6.33548C14.9902 3.77849 13.6569 2.5 12 2.5C10.3431 2.5 9.00981 3.77849 6.34315 6.33548L2 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Home</span>
          </span>
        </li>
        <li class="messages active">
          <a href="/messages">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M7.5 12H13.5M7.5 8H10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8.5 20C9.55038 20.8697 10.8145 21.4238 12.2635 21.5188C13.4052 21.5937 14.5971 21.5936 15.7365 21.5188C16.1288 21.4931 16.5565 21.4007 16.9248 21.251C17.3345 21.0845 17.5395 21.0012 17.6437 21.0138C17.7478 21.0264 17.8989 21.1364 18.2011 21.3563C18.7339 21.744 19.4051 22.0225 20.4005 21.9986C20.9038 21.9865 21.1555 21.9804 21.2681 21.7909C21.3808 21.6013 21.2405 21.3389 20.9598 20.8141C20.5706 20.0862 20.324 19.2529 20.6977 18.5852C21.3413 17.6315 21.8879 16.5021 21.9678 15.2823C22.0107 14.6269 22.0107 13.9481 21.9678 13.2927C21.9146 12.4799 21.7173 11.7073 21.4012 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12.345 17.4868C15.9006 17.2526 18.7328 14.4069 18.9658 10.8344C19.0114 10.1353 19.0114 9.41131 18.9658 8.71219C18.7328 5.13969 15.9006 2.29401 12.345 2.05985C11.132 1.97997 9.86553 1.98013 8.65499 2.05985C5.09943 2.29401 2.26725 5.13969 2.0342 8.71219C1.9886 9.41131 1.9886 10.1353 2.0342 10.8344C2.11908 12.1356 2.69992 13.3403 3.38372 14.3576C3.78076 15.0697 3.51873 15.9586 3.10518 16.735C2.807 17.2948 2.65791 17.5747 2.77762 17.7769C2.89732 17.9791 3.16472 17.9856 3.69951 17.9985C4.75712 18.024 5.47028 17.7269 6.03638 17.3134C6.35744 17.0788 6.51798 16.9615 6.62862 16.9481C6.73926 16.9346 6.957 17.0234 7.39241 17.2011C7.78374 17.3608 8.23812 17.4593 8.65499 17.4868C9.86553 17.5665 11.132 17.5666 12.345 17.4868Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Messages</span>
          </span>
        </li>
        <li class="shots">
          <a href="/shots">
            <!--<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            </svg>-->
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.0413 2 17.7655 3.35767 19.5996 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20 2.5V6H16.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M15.9453 12.3577C15.7686 12.9844 14.9333 13.4273 13.2629 14.3131C11.648 15.1693 10.8406 15.5975 10.1899 15.4254C9.9209 15.3542 9.6758 15.2191 9.47812 15.0329C9 14.5827 9 13.7094 9 11.9629C9 10.2163 9 9.34307 9.47812 8.89284C9.6758 8.7067 9.9209 8.57157 10.1899 8.50042C10.8406 8.32833 11.648 8.75646 13.2629 9.61272C14.9333 10.4985 15.7686 10.9414 15.9453 11.5681C16.0182 11.8268 16.0182 12.099 15.9453 12.3577Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Shots</span>
          </span>
        </li>
      </ul>
      <ul class="second nav">
        <li class="comics">
          <a href="/comics">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M18 12.5743C18 12.2721 18 12.1209 18.0416 11.9862C18.1626 11.5947 18.4814 11.4428 18.8009 11.2838C19.1599 11.1049 19.3395 11.0155 19.5174 10.9998C19.7193 10.9819 19.9217 11.0295 20.0943 11.1354C20.3232 11.2759 20.4828 11.5427 20.6462 11.7597C21.4008 12.7619 21.7782 13.263 21.9162 13.8155C22.0277 14.2614 22.0277 14.7279 21.9162 15.1738C21.7148 15.9797 21.0786 16.6554 20.6077 17.2807C20.3668 17.6007 20.2464 17.7606 20.0943 17.8539C19.9217 17.9598 19.7193 18.0074 19.5174 17.9895C19.3395 17.9738 19.1599 17.8844 18.8009 17.7055C18.4814 17.5465 18.1626 17.3946 18.0416 17.0031C18 16.8684 18 16.7172 18 16.415V12.5743Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M5.99978 12.5745C5.99978 12.1937 5.99 11.8517 5.70853 11.584C5.60615 11.4867 5.47041 11.419 5.19896 11.2839C4.83986 11.1051 4.66031 11.0157 4.4824 10.9999C3.94863 10.9527 3.66145 11.3511 3.35363 11.7598C2.59897 12.762 2.22164 13.263 2.08357 13.8156C1.97214 14.2615 1.97214 14.7278 2.08357 15.1738C2.28495 15.9797 2.92117 16.6553 3.3921 17.2806C3.68894 17.6748 3.9725 18.0345 4.4824 17.9894C4.66031 17.9737 4.83986 17.8843 5.19896 17.7055C5.47041 17.5702 5.60615 17.5026 5.70853 17.4053C5.99 17.1377 5.99978 16.7955 5.99978 16.4149V12.5745Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M19.9991 10.9958V9.87129C19.9991 5.52383 16.4176 1.99951 11.9996 1.99951C7.58152 1.99951 4 5.52383 4 9.87129V10.9958" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="round" />
              <path d="M11.9977 13.4592C10.752 12.8002 7.99771 11.6788 6.73429 12.0203C6.49453 12.1204 5.99805 12.4652 5.99805 13.6189L6.09383 19.5962C6.09975 19.9659 6.38606 20.2689 6.74809 20.32C7.98052 20.4942 10.0798 20.9935 11.9977 22.0002M11.9977 13.4592V22.0002M11.9977 13.4592C13.2434 12.8002 15.9988 11.6788 17.2623 12.0203C17.502 12.1204 17.9985 12.4652 17.9985 13.6189L17.9027 19.5962C17.8968 19.9659 17.6105 20.2689 17.2485 20.32C16.016 20.4942 13.9156 20.9935 11.9977 22.0002" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Comics</span>
          </span>
        </li>
        <li class="create">
          <a href="/create">
            <svg width="24" id="outside" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22.0001C4.617 22.0001 2 19.3831 2 12.0001C2 4.61712 4.617 2.00012 12 2.00012C12.414 2.00012 12.75 2.33612 12.75 2.75012C12.75 3.16412 12.414 3.50012 12 3.50012C5.486 3.50012 3.5 5.48612 3.5 12.0001C3.5 18.5141 5.486 20.5001 12 20.5001C18.514 20.5001 20.5 18.5141 20.5 12.0001C20.5 11.5861 20.836 11.2501 21.25 11.2501C21.664 11.2501 22 11.5861 22 12.0001C22 19.3831 19.383 22.0001 12 22.0001Z" fill="currentColor"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M19.2365 9.38606L20.2952 8.19072C21.4472 6.88972 21.3252 4.89472 20.0252 3.74172C19.3952 3.18372 18.5812 2.90372 17.7452 2.95572C16.9052 3.00672 16.1352 3.38272 15.5772 4.01272L9.6932 10.6607C7.8692 12.7187 9.1172 15.4397 9.1712 15.5547C9.2602 15.7437 9.4242 15.8877 9.6232 15.9497C9.6802 15.9687 10.3442 16.1717 11.2192 16.1717C12.2042 16.1717 13.4572 15.9127 14.4092 14.8367L19.0774 9.56571C19.1082 9.54045 19.1374 9.51238 19.1646 9.4815C19.1915 9.45118 19.2155 9.41925 19.2365 9.38606ZM10.4082 14.5957C11.0352 14.7097 12.4192 14.8217 13.2862 13.8427L17.5371 9.04299L15.0656 6.85411L10.8172 11.6557C9.9292 12.6567 10.2122 13.9917 10.4082 14.5957ZM16.0596 5.73076L18.5322 7.91938L19.1722 7.19672C19.7752 6.51472 19.7122 5.46872 19.0312 4.86572C18.7002 4.57372 18.2712 4.42472 17.8362 4.45272C17.3962 4.48072 16.9932 4.67672 16.7002 5.00672L16.0596 5.73076Z" fill="currentColor"></path>
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Create</span>
          </span>
        </li>
        <li class="search">
          <a href="/search">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M17.5 17.5L22 22" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20C15.9706 20 20 15.9706 20 11Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Search</span>
          </span>
        </li>
      </ul>
      <ul class="third nav">
        <li class="articles">
          <a href="/articles">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M18 15V9C18 6.17157 18 4.75736 17.1213 3.87868C16.2426 3 14.8284 3 12 3H8C5.17157 3 3.75736 3 2.87868 3.87868C2 4.75736 2 6.17157 2 9V15C2 17.8284 2 19.2426 2.87868 20.1213C3.75736 21 5.17157 21 8 21H20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M6 8L14 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M6 12L14 12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M6 16L10 16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M18 8H19C20.4142 8 21.1213 8 21.5607 8.43934C22 8.87868 22 9.58579 22 11V19C22 20.1046 21.1046 21 20 21C18.8954 21 18 20.1046 18 19V8Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Articles</span>
          </span>
        </li>
        <li class="topics">
          <a href="/topics">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M15.6 8.40033V12.9003C15.6 14.3915 16.8088 15.6003 18.3 15.6003C19.7912 15.6003 21 14.3915 21 12.9003V12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C14.0265 21 15.8965 20.3302 17.4009 19.2M15.6 12.0003C15.6 13.9886 13.9882 15.6003 12 15.6003C10.0118 15.6003 8.4 13.9886 8.4 12.0003C8.4 10.0121 10.0118 8.40033 12 8.40033C13.9882 8.40033 15.6 10.0121 15.6 12.0003Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Topics</span>
          </span>
        </li>
        <li class="apis">
          <a href="/apis">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M17 8L18.8398 9.85008C19.6133 10.6279 20 11.0168 20 11.5C20 11.9832 19.6133 12.3721 18.8398 13.1499L17 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M7 8L5.16019 9.85008C4.38673 10.6279 4 11.0168 4 11.5C4 11.9832 4.38673 12.3721 5.16019 13.1499L7 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M14.5 4L9.5 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">APIs</span>
          </span>
        </li>
      </ul>
      <ul class="user nav">
        <li class="updates">
          <a href="/updates">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
              <path d="M22 5.5C22 7.433 20.433 9 18.5 9C16.567 9 15 7.433 15 5.5C15 3.567 16.567 2 18.5 2C20.433 2 22 3.567 22 5.5Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M21.9506 11C21.9833 11.3289 22 11.6625 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.3375 2 12.6711 2.01672 13 2.04938" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M8 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8 15H16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Updates</span>
          </span>
        </li>
        <li class="themes">
          <a href="/themes">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
              <path d="M14 19L11.1069 10.7479C9.76348 6.91597 9.09177 5 8 5C6.90823 5 6.23652 6.91597 4.89309 10.7479L2 19M4.5 12H11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M21.9692 13.9392V18.4392M21.9692 13.9392C22.0164 13.1161 22.0182 12.4891 21.9194 11.9773C21.6864 10.7709 20.4258 10.0439 19.206 9.89599C18.0385 9.75447 17.1015 10.055 16.1535 11.4363M21.9692 13.9392L19.1256 13.9392C18.6887 13.9392 18.2481 13.9603 17.8272 14.0773C15.2545 14.7925 15.4431 18.4003 18.0233 18.845C18.3099 18.8944 18.6025 18.9156 18.8927 18.9026C19.5703 18.8724 20.1955 18.545 20.7321 18.1301C21.3605 17.644 21.9692 16.9655 21.9692 15.9392V13.9392Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Themes</span>
          </span>
        </li>
        <li class="settings">
          <a href="/settings">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
              <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
          </a>
          <span class="tooltip">
            <span class="arrow"></span>
            <span class="text">Settings</span>
          </span>
        </li>
      </ul>
    `;
  }

  getMobileNav = () => {
    return /* html */`
      <div class="mobile-nav">
        <div class="icons">
          <span class="icon home active">
            <span class="bar"></span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="injected-svg" data-src="https://cdn.hugeicons.com/icons/home-05-twotone-rounded.svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" color="currentColor">
              <path opacity="0.4" d="M12 17H12.009" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M20 8.5V13.5C20 17.2712 20 19.1569 18.8284 20.3284C17.6569 21.5 15.7712 21.5 12 21.5C8.22876 21.5 6.34315 21.5 5.17157 20.3284C4 19.1569 4 17.2712 4 13.5V8.5" stroke="currentColor" stroke-width="1.8"></path>
              <path d="M22 10.5L17.6569 6.33548C14.9902 3.77849 13.6569 2.5 12 2.5C10.3431 2.5 9.00981 3.77849 6.34315 6.33548L2 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
            <span class="text">Home</span>
          </span>
          <span class="icon shots">
            <span class="bar"></span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="injected-svg" data-src="https://cdn.hugeicons.com/icons/replay-twotone-rounded.svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" color="currentColor">
              <path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C15.0413 2 17.7655 3.35767 19.5996 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M20 2.5V6H16.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path opacity="0.4" d="M15.9453 12.3577C15.7686 12.9844 14.9333 13.4273 13.2629 14.3131C11.648 15.1693 10.8406 15.5975 10.1899 15.4254C9.9209 15.3542 9.6758 15.2191 9.47812 15.0329C9 14.5827 9 13.7094 9 11.9629C9 10.2163 9 9.34307 9.47812 8.89284C9.6758 8.7067 9.9209 8.57157 10.1899 8.50042C10.8406 8.32833 11.648 8.75646 13.2629 9.61272C14.9333 10.4985 15.7686 10.9414 15.9453 11.5681C16.0182 11.8268 16.0182 12.099 15.9453 12.3577Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
           <span class="text">Shots</span>
          </span>
          <span class="icon create">
						<span class="bar"></span>
						<svg id="create" width="24" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path opacity="0.4" d="M12.0002 3.14612C5.06324 3.14612 2.75024 5.45912 2.75024 12.3961C2.75024 19.3331 5.06324 21.6461 12.0002 21.6461C18.9372 21.6461 21.2502 19.3331 21.2502 12.3961" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M19.5285 4.69988V4.69988C18.5355 3.82088 17.0185 3.91288 16.1395 4.90588C16.1395 4.90588 11.7705 9.84088 10.2555 11.5539C8.73853 13.2659 9.85053 15.6309 9.85053 15.6309C9.85053 15.6309 12.3545 16.4239 13.8485 14.7359C15.3435 13.0479 19.7345 8.08888 19.7345 8.08888C20.6135 7.09588 20.5205 5.57888 19.5285 4.69988Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M15.009 6.19678L18.604 9.37978" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
						<span class="text">Create</span>
					</span>
          <span class="icon comics">
            <span class="bar"></span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="injected-svg" data-src="https://cdn.hugeicons.com/icons/collections-bookmark-twotone-rounded.svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" color="currentColor">
              <path d="M16.9017 6.12874C18 7.25748 18 9.07416 18 12.7075V14.2925C18 17.9258 18 19.7425 16.9017 20.8713C15.8033 22 14.0355 22 10.5 22C6.96447 22 5.1967 22 4.09835 20.8713C3 19.7425 3 17.9258 3 14.2925V12.7075C3 9.07416 3 7.25748 4.09835 6.12874C5.1967 5 6.96447 5 10.5 5C14.0355 5 15.8033 5 16.9017 6.12874Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path opacity="0.4" d="M7.5 5.5V10.3693C7.5 11.3046 7.5 11.7722 7.78982 11.9396C8.35105 12.2638 9.4038 11.1823 9.90375 10.8567C10.1937 10.6678 10.3387 10.5734 10.5 10.5734C10.6613 10.5734 10.8063 10.6678 11.0962 10.8567C11.5962 11.1823 12.6489 12.2638 13.2102 11.9396C13.5 11.7722 13.5 11.3046 13.5 10.3693V5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M9 2H11C15.714 2 18.0711 2 19.5355 3.46447C21 4.92893 21 7.28595 21 12V18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <span class="text">Comics</span>
          </span>
          <span class="icon messages">
            <span class="bar"></span>
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="injected-svg" data-src="https://cdn.hugeicons.com/icons/message-multiple-01-twotone-rounded.svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" color="currentColor">
              <path d="M7.5 12H13.5M7.5 8H10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path opacity="0.4" d="M8.5 20C9.55038 20.8697 10.8145 21.4238 12.2635 21.5188C13.4052 21.5937 14.5971 21.5936 15.7365 21.5188C16.1288 21.4931 16.5565 21.4007 16.9248 21.251C17.3345 21.0845 17.5395 21.0012 17.6437 21.0138C17.7478 21.0264 17.8989 21.1364 18.2011 21.3563C18.7339 21.744 19.4051 22.0225 20.4005 21.9986C20.9038 21.9865 21.1555 21.9804 21.2681 21.7909C21.3808 21.6013 21.2405 21.3389 20.9598 20.8141C20.5706 20.0862 20.324 19.2529 20.6977 18.5852C21.3413 17.6315 21.8879 16.5021 21.9678 15.2823C22.0107 14.6269 22.0107 13.9481 21.9678 13.2927C21.9146 12.4799 21.7173 11.7073 21.4012 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path d="M12.345 17.4868C15.9006 17.2526 18.7328 14.4069 18.9658 10.8344C19.0114 10.1353 19.0114 9.41131 18.9658 8.71219C18.7328 5.13968 15.9006 2.29401 12.345 2.05985C11.132 1.97997 9.86553 1.98013 8.65499 2.05985C5.09943 2.29401 2.26725 5.13968 2.0342 8.71219C1.9886 9.41131 1.9886 10.1353 2.0342 10.8344C2.11908 12.1356 2.69992 13.3403 3.38372 14.3576C3.78076 15.0697 3.51873 15.9586 3.10518 16.735C2.807 17.2948 2.65791 17.5747 2.77762 17.7769C2.89732 17.9791 3.16472 17.9856 3.69951 17.9985C4.75712 18.024 5.47028 17.7269 6.03638 17.3134C6.35744 17.0788 6.51798 16.9615 6.62862 16.9481C6.73926 16.9346 6.957 17.0234 7.39241 17.2011C7.78374 17.3608 8.23812 17.4593 8.65499 17.4868C9.86553 17.5665 11.132 17.5666 12.345 17.4868Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"></path>
            </svg>
            <span class="text">Chats</span>
          </span>
				  <span class="icon more">
				    <span class="bar"></span>
				    <!--<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="injected-svg" data-src="https://cdn.hugeicons.com/icons/menu-circle-twotone-rounded.svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" color="currentColor">
              <path d="M10 6C10 3.79086 8.20914 2 6 2C3.79086 2 2 3.79086 2 6C2 8.20914 3.79086 10 6 10C8.20914 10 10 8.20914 10 6Z" stroke="currentColor" stroke-width="1.8"></path>
              <path opacity="0.4" d="M10 18C10 15.7909 8.20914 14 6 14C3.79086 14 2 15.7909 2 18C2 20.2091 3.79086 22 6 22C8.20914 22 10 20.2091 10 18Z" stroke="currentColor" stroke-width="1.8"></path>
              <path opacity="0.4" d="M22 6C22 3.79086 20.2091 2 18 2C15.7909 2 14 3.79086 14 6C14 8.20914 15.7909 10 18 10C20.2091 10 22 8.20914 22 6Z" stroke="currentColor" stroke-width="1.8"></path>
              <path d="M22 18C22 15.7909 20.2091 14 18 14C15.7909 14 14 15.7909 14 18C14 20.2091 15.7909 22 18 22C20.2091 22 22 20.2091 22 18Z" stroke="currentColor" stroke-width="1.8"></path>
            </svg>-->
            <svg id="more" width="24" height="25" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M6.46875 14.8472C8.38425 14.8472 9.9375 16.4 9.9375 18.3159C9.9375 20.2314 8.38425 21.7847 6.46875 21.7847C4.55287 21.7847 3 20.2314 3 18.3159C3 16.4004 4.55325 14.8472 6.46875 14.8472Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M18.0312 14.8472C19.9467 14.8472 21.5 16.4 21.5 18.3159C21.5 20.2314 19.9467 21.7847 18.0312 21.7847C16.1154 21.7847 14.5625 20.2314 14.5625 18.3159C14.5625 16.4004 16.1158 14.8472 18.0312 14.8472Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
              <path opacity="0.4" fill-rule="evenodd" clip-rule="evenodd" d="M12.25 3.28467C14.1655 3.28467 15.7188 4.83754 15.7188 6.75342C15.7188 8.66892 14.1655 10.2222 12.25 10.2222C10.3341 10.2222 8.78125 8.66892 8.78125 6.75342C8.78125 4.83792 10.3345 3.28467 12.25 3.28467Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
						<span class="text">More</span>
					</span>
					<!--<span class="icon profile">
            <div class="avatar">
              <img src="https://randomuser.me/api/portraits/men/10.jpg" alt="avatar" />
            </div>
            <span class="text">Profile</span>
					</span>-->
      </div>
    `;
  }

  getChatApp = () => {
    return /* html */`
      <chat-app all="628" unread="3" requests="2"></chat-app>
    `;
  }

  getShots = () => {
    return /* html */`
      <shots-videos api="/shots/fyp" name="For You" type="fyp"></shots-videos>
    `;
  }

  getFooter = () => {
    const year = new Date().getFullYear();
    return /*html*/`
      <footer class="footer">
        <p class="copyright">Copyright &copy;<span class="year">${year}</span><span class="company"> Thealcohesion</span>. All rights reserved.</p>
        <ul class="links">
          <li><a href="/terms">Terms of Service</a></li>
          <li><a href="/white-paper">White Paper</a></li>
          <li><a href="/privacy">Privacy</a></li>
          <li><a href="/contact">Contact</a></li>
        </ul>
      </footer>
    `;
  }

  getToast = (status, text) => {
    return /* html */`
      <div id="toast" class="${status === true ? 'success' : 'error'}">
        <div id="img">${status === true ? this.getSuccesToast() : this.getErrorToast()}</div>
        <div id="desc">${text}</div>
      </div>
    `;
  }

  getSuccesToast = () => {
    return /* html */`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="injected-svg" data-src="https://cdn.hugeicons.com/icons/checkmark-circle-02-solid-standard.svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" color="currentColor">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M11.75 22.5C5.81294 22.5 1 17.6871 1 11.75C1 5.81294 5.81294 1 11.75 1C17.6871 1 22.5 5.81294 22.5 11.75C22.5 17.6871 17.6871 22.5 11.75 22.5ZM16.5182 9.39018C16.8718 8.9659 16.8145 8.33534 16.3902 7.98177C15.9659 7.62821 15.3353 7.68553 14.9818 8.10981L10.6828 13.2686L8.45711 11.0429C8.06658 10.6524 7.43342 10.6524 7.04289 11.0429C6.65237 11.4334 6.65237 12.0666 7.04289 12.4571L10.0429 15.4571C10.2416 15.6558 10.5146 15.7617 10.7953 15.749C11.076 15.7362 11.3384 15.606 11.5182 15.3902L16.5182 9.39018Z" fill="currentColor"></path>
      </svg>
    `;
  }

  getErrorToast = () => {
    return /* html */`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="injected-svg" data-src="https://cdn.hugeicons.com/icons/cancel-circle-solid-standard.svg" xmlns:xlink="http://www.w3.org/1999/xlink" role="img" color="currentColor">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M1.25 12C1.25 17.9371 6.06294 22.75 12 22.75C17.9371 22.75 22.75 17.9371 22.75 12C22.75 6.06294 17.9371 1.25 12 1.25C6.06294 1.25 1.25 6.06294 1.25 12ZM8.29293 8.29286C8.68348 7.90235 9.31664 7.90239 9.70714 8.29293L12 10.586L14.2929 8.29293C14.6834 7.90239 15.3165 7.90235 15.7071 8.29286C16.0976 8.68336 16.0976 9.31652 15.7071 9.70707L13.4141 12.0003L15.7065 14.2929C16.097 14.6835 16.097 15.3166 15.7064 15.7071C15.3159 16.0976 14.6827 16.0976 14.2922 15.7071L12 13.4146L9.70779 15.7071C9.31728 16.0976 8.68412 16.0976 8.29357 15.7071C7.90303 15.3166 7.90299 14.6835 8.2935 14.2929L10.5859 12.0003L8.29286 9.70707C7.90235 9.31652 7.90239 8.68336 8.29293 8.29286Z" fill="currentColor"></path>
      </svg>
    `;
  }

  getLoader = () => {
    return /* html */`
      <div class="loader-container">
        <div id="loader" class="loader"></div>
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
	        font-family: inherit;
	      }

	      a {
	        text-decoration: none;
	      }

	      :host {
          font-size: 16px;
          padding: 0;
          margin: 0;
          display: flex;
          gap: 20px;
        }

        div.loader-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
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

        section.nav {
          width: 200px;
          display: flex;
          flex-flow: column;
          gap: 5px;
          padding: 10px 0 0 0;
          height: 100dvh;
          max-height: 100dvh;
          overflow-y: scroll;
          scrollbar-width: none;
          position: sticky;
          top: 0;
        }

        section.nav::-webkit-scrollbar {
          visibility: hidden;
          display: none;
        }

        section.nav > ul.nav {
          border-top: var(--border);
          padding: 10px 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          width: 100%;
          gap: 5px;
        }

        section.nav > ul.nav.logo {
          border: none;
        }

        section.nav > ul.nav > li {
          /*border: thin solid black;*/
          padding: 0;
          width: 100%;
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          color: var(--text-color);
          transition: all 0.3s ease;
          border-radius: 7px;
        }

        section.nav > ul.nav > li:hover,
        section.nav > ul.nav > li.active {
          color: var(--accent-color);
        }

        section.nav > ul.nav > li > a {
          padding: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0;
          color: inherit;
          border-radius: 7px;
        }

        section.nav > ul.nav > li.active {
          background: var(--tab-background);
        }

        section.nav > ul.nav > li > a > svg {
          width: 24px;
          height: 24px;
        }

        section.nav > ul.nav > li.logout {
          /*border: var(--input-border);*/
          color: var(--error-color);
        }

        section.nav > ul.nav > li.logo {
          gap: 10px;
        }

        section.nav > ul.nav > li.logo > a {
          width: 25px;
          height: 25px;
          border-radius: 50%;
          margin: 0;
          padding: 0;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        section.nav > ul.nav > li.logo > a > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        section.nav > ul.nav > li > span.tooltip > span.text {
          color: inherit;
          font-family: var(--font-text), sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
        }

        section.nav > ul.nav > li.logo > span.tooltip > span.text {
          font-family: var(--font-read), sans-serif;
          font-size: 1.35rem;
          color: transparent;
          background: var(--accent-linear);
          font-weight: 600;
          background-clip: text;
          -webkit-backdrop-clip: text;
          text-transform: uppercase;
        }

        section.flow {
          /* border: thin solid green; */
          width: calc(100% - 220px);
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
        }

        footer.footer > p {
          margin: 0;
          padding: 0;
          font-family: var(--font-read), sans-serif;
          font-size: 1rem;
          color: var(--gray-color);
        }

        footer.footer > p > span.year,
        footer.footer > p > span.company {
          font-size: 0.9rem;
          font-family: var(--font-text), sans-serif;
        }

        footer.footer > ul.links {
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: row;
          gap: 10px;
        }

        footer.footer > ul.links > li {
          padding: 0;
          margin: 0;
          list-style-type: none;
        }

        footer.footer > ul.links > li > a {
          font-family: var(--font-read), sans-serif;
          font-size: 0.9rem;
          color: var(--gray-color);
        }

        footer.footer > ul.links > li > a:hover {
          color: var(--anchor-color);
        }

        @media screen and (max-width: 1000px)  {
          section.nav {
            width: 150px;
          }

          section.flow {
            width: calc(100% - 170px);
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 0;
          }
        }

        @media screen and (max-width: 900px) {
          section.nav {
            position: fixed;
            background: var(--background);
            /* border-right: var(--border);*/
            z-index: 10;
            top: 0;
            left: 10px;
            padding: 0;
            width: 50px;
            overflow: visible;
          }

          section.nav > ul.nav {
            justify-content: center;
            align-items: center;
            width: 100%;
            height: max-content;
          }

          section.nav > ul.nav.logo {
            height: 56px;
            padding: 22px 0 0 0;
          }

          section.nav > ul.nav > li {
            width: max-content;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0;
            padding: 0 3px;
            z-index: 10;
            position: relative;
          }

          section.nav > ul.nav > li > span.tooltip {
            position: absolute;
            top: 50%;
            left: 48px;
            transform: translateY(-50%);
            border: var(--border);
            background: var(--background);
            display: none;
            z-index: 10;
            padding: 0 5px 0 3px;
            border-radius: 8px;
          }

          section.nav > ul.nav > li:hover > span.tooltip {
            display: flex;
          }

          section.nav > ul.nav > li > span.tooltip > span.arrow {
            display: inline-block;
            width: 10px;
            height: 10px;
            background: var(--background);
            rotate: 45deg;
            border: var(--border);
            border-right: none;
            border-top: none;
            position: absolute;
            top: calc(50% - 5px);
            left: -5px;
          }

          section.nav > ul.nav > li > span.tooltip > span.text {
            padding: 5px;
            margin: 0;
            font-family: var(--font-text), sans-serif;
            font-size: 0.9rem;
            font-weight: 400;
            color: inherit;
          }
  
          section.nav > ul.nav > li.logo > span.tooltip > span.text {
            font-family: var(--font-text), sans-serif;
            font-size: 0.9rem;
            color: inherit;
            background: unset;
            font-weight: 600;
            background-clip: unset;
            -webkit-backdrop-clip: unset;
            text-transform: unset;
          }

          section.flow {
            width: calc(100% - 60px);
            margin: 0 0 0 60px;
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 0;
            height: 100dvh;
          }
        }

				@media screen and (max-width: 660px) {
					:host {
            font-size: 16px;
						padding: 0;
            margin: 0;
            height: max-content;
            display: flex;
            flex-flow: column;
            justify-content: space-between;
            gap: 0;
					}
					
					::-webkit-scrollbar {
						-webkit-appearance: none;
					}
					
					a {
						cursor: default !important;
          }
          
					section.nav {
						border-top: var(--border);
						box-shadow: var(--footer-shadow);
						width: 100%;
						display: flex;
						padding: 0;
						flex-flow: row;
						gap: 0;
						position: fixed;
						bottom: 0;
						top: unset;
						height: 55px;
						left: 0;
						right: 0;
						z-index: 10;
						background: var(--background);
					}
					
					section.nav > div.mobile-nav {
						width: 100%;
						display: flex;
						flex-flow: row;
						justify-content: space-between;
						align-items: center;
						padding: 0 10px;
						height: 100%;
						gap: 0;
						position: relative;
					}
					
					section.nav > div.mobile-nav > div.icons {
						display: flex;
						flex-flow: row;
						justify-content: space-between;
						align-items: center;
						gap: 0;
						width: 100%;
						height: 100%;
						position: relative;
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon {
						display: flex;
						flex-flow: column;
						justify-content: center;
						align-items: center;
						gap: 0;
						width: max-content;
						height: 100%;
						color: var(--icon-color);
						position: relative;
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon > span.bar {
						display: none;
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon.active > span.bar {
						display: inline-block;
            display: none;
						width: 80%;
						height: 3px;
						border-radius: 5px;
						position: absolute;
						background: var(--accent-linear);
						top: 0;
						left: 50%;
						z-index: 11;
						transform: translateX(-50%);
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon.active {
						color: var(--accent-color);
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon > svg {
						width: 26px;
						height: 26px;
            min-width: 26px;
            min-height: 26px;
						color: inherit;
					}

          section.nav > div.mobile-nav > div.icons > span.icon > svg#create,
          section.nav > div.mobile-nav > div.icons > span.icon > svg#more {
            width: 28px;
            height: 28px;
          }
					
					section.nav > div.mobile-nav > div.icons > span.icon > span.text {
						font-size: 0.8rem;
						font-family: var(--font-read), sans-serif;
						color: inherit;
						display: flex;
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon.active > span.text {
						font-family: var(--font-text), sans-serif;
						font-weight: 500;
            color: transparent;
            background: var(--accent-linear);
            -webkit-background-clip: text;
            background-clip: text;
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon.profile {
						display: flex;
						flex-flow: column;
						justify-content: center;
						align-items: center;
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon.profile > div.avatar {
						width: 30px;
						height: 30px;
						border-radius: 50%;
						overflow: hidden;
					}
					
					section.nav > div.mobile-nav > div.icons > span.icon.profile > div.avatar > img {
						width: 100%;
						height: 100%;
						object-fit: cover;
					}
					
					/* Feeds */
					section.flow {
						width: 100%;
            margin: 0;
            padding: 0;
						display: flex;
						flex-flow: column;
						gap: 0;
            min-height: 100dvh;
						padding: 0 0;
					}
				}
	    </style>
    `;
  }
}