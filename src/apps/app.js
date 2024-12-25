import apps from "./apps.js"
export default class AppMain extends HTMLElement {
	constructor() {
		// We are not even going to touch this.
		super();
		// let's create our shadow root
		this.shadowObj = this.attachShadow({ mode: "open" });
		// register components
		this.registerComponents();
		this.render();
	}

  getCurrentCountry = () => {
    // get the current country using location API
    if('geolocation' in navigator) {
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
	}
	
	// noinspection JSMethodCanBeStatic
	connectedCallback() {
		// Watch for media query changes
		const mql = window.matchMedia('(max-width: 660px)');
		this.switchTheme(mql);
    this.hideShowMobileHeader(mql);
	}
	
	disconnectedCallback() {
		this.enableScroll();
		// clear window.home
		window.home = null;
	}
	
	registerComponents = () => {
		// Register all components here
		apps('Apps registered');
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
          contact
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
          <div class="feeds">
            <div class="feeds-wrapper">
              <div class="content-wrapper">
                container
              </div>
              ${this.getFooter()}
            </div>
          </div>
          <div class="side">
            ${this.getSideHeader()}
          </div>
        </section>
      `;
		}
	}

	
	getSideHeader = () => {
		return /* html */`
      <ul class="header">
        <li class="item cart">
          <a href="/cart">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M3.87289 17.0194L2.66933 9.83981C2.48735 8.75428 2.39637 8.21152 2.68773 7.85576C2.9791 7.5 3.51461 7.5 4.58564 7.5H19.4144C20.4854 7.5 21.0209 7.5 21.3123 7.85576C21.6036 8.21152 21.5126 8.75428 21.3307 9.83981L20.1271 17.0194C19.7282 19.3991 19.5287 20.5889 18.7143 21.2945C17.9 22 16.726 22 14.3782 22H9.62182C7.27396 22 6.10003 22 5.28565 21.2945C4.47127 20.5889 4.27181 19.3991 3.87289 17.0194Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M17.5 7.5C17.5 4.46243 15.0376 2 12 2C8.96243 2 6.5 4.46243 6.5 7.5" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </a>
        </li>
        <li class="item contacts">
          <a href="/contacts">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <rect x="4" y="2" width="17.5" height="20" rx="4" stroke="currentColor" stroke-width="1.8" />
              <path d="M10.59 13.7408C9.96125 14.162 8.31261 15.0221 9.31674 16.0983C9.80725 16.624 10.3536 17 11.0404 17H14.9596C15.6464 17 16.1928 16.624 16.6833 16.0983C17.6874 15.0221 16.0388 14.162 15.41 13.7408C13.9355 12.7531 12.0645 12.7531 10.59 13.7408Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M15 9C15 10.1046 14.1046 11 13 11C11.8954 11 11 10.1046 11 9C11 7.89543 11.8954 7 13 7C14.1046 7 15 7.89543 15 9Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M5 6L2.5 6M5 12L2.5 12M5 18H2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
        </li>
        <li class="item notifications">
          <a href="/notifications">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M2.52992 14.7696C2.31727 16.1636 3.268 17.1312 4.43205 17.6134C8.89481 19.4622 15.1052 19.4622 19.5679 17.6134C20.732 17.1312 21.6827 16.1636 21.4701 14.7696C21.3394 13.9129 20.6932 13.1995 20.2144 12.5029C19.5873 11.5793 19.525 10.5718 19.5249 9.5C19.5249 5.35786 16.1559 2 12 2C7.84413 2 4.47513 5.35786 4.47513 9.5C4.47503 10.5718 4.41272 11.5793 3.78561 12.5029C3.30684 13.1995 2.66061 13.9129 2.52992 14.7696Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8 19C8.45849 20.7252 10.0755 22 12 22C13.9245 22 15.5415 20.7252 16 19" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
        </li>
        <li class="item messages">
          <a href="/messages">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M21.9598 10.9707C22.0134 11.8009 22.0134 12.6607 21.9598 13.4909C21.6856 17.7332 18.3536 21.1125 14.1706 21.3905C12.7435 21.4854 11.2536 21.4852 9.8294 21.3905C9.33896 21.3579 8.8044 21.2409 8.34401 21.0513C7.83177 20.8403 7.5756 20.7348 7.44544 20.7508C7.31527 20.7668 7.1264 20.9061 6.74868 21.1846C6.08268 21.6757 5.24367 22.0285 3.99943 21.9982C3.37026 21.9829 3.05568 21.9752 2.91484 21.7351C2.77401 21.495 2.94941 21.1626 3.30021 20.4978C3.78674 19.5758 4.09501 18.5203 3.62791 17.6746C2.82343 16.4666 2.1401 15.036 2.04024 13.4909C1.98659 12.6607 1.98659 11.8009 2.04024 10.9707C2.31441 6.72838 5.64639 3.34913 9.8294 3.07107C11.0318 2.99114 11.2812 2.97856 12.5 3.03368" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M22 5.5C22 7.433 20.433 9 18.5 9C16.567 9 15 7.433 15 5.5C15 3.567 16.567 2 18.5 2C20.433 2 22 3.567 22 5.5Z" stroke="currentColor" stroke-width="1.8" />
            </svg>
          </a>
        </li>
      </ul>
    `;
	}
	
	getMainNav = () => {
		return /* html */`
      <div class="icons-nav">
        <div class="top">
          <div class="logo">
            <a href="/">L</a>
          </div>
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
            <li class="active wallet">
              <a href="/wallet">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <rect width="24" height="24" fill="none" />
                  <path d="M3 8.5H15C17.8284 8.5 19.2426 8.5 20.1213 9.37868C21 10.2574 21 11.6716 21 14.5V15.5C21 18.3284 21 19.7426 20.1213 20.6213C19.2426 21.5 17.8284 21.5 15 21.5H9C6.17157 21.5 4.75736 21.5 3.87868 20.6213C3 19.7426 3 18.3284 3 15.5V8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="round" />
                  <path d="M15 8.49833V4.1103C15 3.22096 14.279 2.5 13.3897 2.5C13.1336 2.5 12.8812 2.56108 12.6534 2.67818L3.7623 7.24927C3.29424 7.48991 3 7.97203 3 8.49833" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Wallet</span>
              </span>
            </li>
            <li class="investment">
              <a href="/investment">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <path d="M14 18C18.4183 18 22 14.4183 22 10C22 5.58172 18.4183 2 14 2C9.58172 2 6 5.58172 6 10C6 14.4183 9.58172 18 14 18Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M13.1669 20.9689C12.063 21.6239 10.7742 22 9.3975 22C5.31197 22 2 18.688 2 14.6025C2 13.2258 2.37607 11.937 3.03107 10.8331" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Investment</span>
              </span>
            <li class="funding">
              <a href="/funding">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <path d="M20.9427 16.8354C20.2864 12.8866 18.2432 9.94613 16.467 8.219C15.9501 7.71642 15.6917 7.46513 15.1208 7.23257C14.5499 7 14.0592 7 13.0778 7H10.9222C9.94081 7 9.4501 7 8.87922 7.23257C8.30834 7.46513 8.04991 7.71642 7.53304 8.219C5.75682 9.94613 3.71361 12.8866 3.05727 16.8354C2.56893 19.7734 5.27927 22 8.30832 22H15.6917C18.7207 22 21.4311 19.7734 20.9427 16.8354Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M7.25662 4.44287C7.05031 4.14258 6.75128 3.73499 7.36899 3.64205C8.00392 3.54651 8.66321 3.98114 9.30855 3.97221C9.89237 3.96413 10.1898 3.70519 10.5089 3.33548C10.8449 2.94617 11.3652 2 12 2C12.6348 2 13.1551 2.94617 13.4911 3.33548C13.8102 3.70519 14.1076 3.96413 14.6914 3.97221C15.3368 3.98114 15.9961 3.54651 16.631 3.64205C17.2487 3.73499 16.9497 4.14258 16.7434 4.44287L15.8105 5.80064C15.4115 6.38146 15.212 6.67187 14.7944 6.83594C14.3769 7 13.8373 7 12.7582 7H11.2418C10.1627 7 9.6231 7 9.20556 6.83594C8.78802 6.67187 8.5885 6.38146 8.18945 5.80064L7.25662 4.44287Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                  <path d="M13.6267 12.9186C13.4105 12.1205 12.3101 11.4003 10.9892 11.9391C9.66829 12.4778 9.45847 14.2113 11.4565 14.3955C12.3595 14.4787 12.9483 14.2989 13.4873 14.8076C14.0264 15.3162 14.1265 16.7308 12.7485 17.112C11.3705 17.4932 10.006 16.8976 9.85742 16.0517M11.8417 10.9927V11.7531M11.8417 17.2293V17.9927" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Funding</span>
              </span>
            </li>
            <li class="action">
              <a href="/action-centers">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <path d="M3 11C3 7.25027 3 5.3754 3.95491 4.06107C4.26331 3.6366 4.6366 3.26331 5.06107 2.95491C6.3754 2 8.25027 2 12 2C15.7497 2 17.6246 2 18.9389 2.95491C19.3634 3.26331 19.7367 3.6366 20.0451 4.06107C21 5.3754 21 7.25027 21 11V13C21 16.7497 21 18.6246 20.0451 19.9389C19.7367 20.3634 19.3634 20.7367 18.9389 21.0451C17.6246 22 15.7497 22 12 22C8.25027 22 6.3754 22 5.06107 21.0451C4.6366 20.7367 4.26331 20.3634 3.95491 19.9389C3 18.6246 3 16.7497 3 13V11Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M16 9.5L8 9.5M13.5 14.5H10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Action Centers</span>
              </span>
            </li>
            <li class="formation">
              <a href="/formation">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <rect width="24" height="24" fill="none" />
                  <path d="M2 14C2 11.1911 2 9.78661 2.67412 8.77772C2.96596 8.34096 3.34096 7.96596 3.77772 7.67412C4.78661 7 6.19108 7 9 7H15C17.8089 7 19.2134 7 20.2223 7.67412C20.659 7.96596 21.034 8.34096 21.3259 8.77772C22 9.78661 22 11.1911 22 14C22 16.8089 22 18.2134 21.3259 19.2223C21.034 19.659 20.659 20.034 20.2223 20.3259C19.2134 21 17.8089 21 15 21H9C6.19108 21 4.78661 21 3.77772 20.3259C3.34096 20.034 2.96596 19.659 2.67412 19.2223C2 18.2134 2 16.8089 2 14Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M16 7C16 5.11438 16 4.17157 15.4142 3.58579C14.8284 3 13.8856 3 12 3C10.1144 3 9.17157 3 8.58579 3.58579C8 4.17157 8 5.11438 8 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M6 11L6.65197 11.202C10.0851 12.266 13.9149 12.266 17.348 11.202L18 11M12 12V14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Formation</span>
              </span>
            </li>
            <li class="offices">
              <a href="/offices">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <path d="M14 22V8C14 5.17157 14 3.75736 13.1213 2.87868C12.2426 2 10.8284 2 8 2C5.17157 2 3.75736 2 2.87868 2.87868C2 3.75736 2 5.17157 2 8V16C2 18.8284 2 20.2426 2.87868 21.1213C3.75736 22 5.17157 22 8 22H14Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M6.5 11H5.5M10.5 11H9.5M6.5 7H5.5M6.5 15H5.5M10.5 7H9.5M10.5 15H9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M18.5 15H17.5M18.5 11H17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M18 8H14V22H18C19.8856 22 20.8284 22 21.4142 21.4142C22 20.8284 22 19.8856 22 18V12C22 10.1144 22 9.17157 21.4142 8.58579C20.8284 8 19.8856 8 18 8Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Offices</span>
              </span>
            </li>
            <li class="market">
              <a href="/market">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <path d="M5 20L7.41286 17.5871M7.41286 17.5871C8.21715 18.3914 9.32826 18.8889 10.5556 18.8889C13.0102 18.8889 15 16.899 15 14.4444C15 11.9898 13.0102 10 10.5556 10C8.10096 10 6.11111 11.9898 6.11111 14.4444C6.11111 15.6717 6.60857 16.7829 7.41286 17.5871Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <path d="M3 15.1877C2.36394 14.0914 2 12.8191 2 11.4623C2 7.34099 5.35786 4 9.5 4H14.5C18.6421 4 22 7.34099 22 11.4623C22 14.7114 19.913 17.4756 17 18.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Market</span>
              </span>
            </li>
            <li class="tools">
              <a href="/tools">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <circle cx="6.25" cy="6.25" r="4.25" stroke="currentColor" stroke-width="1.8" />
                  <path d="M18 9.35714V10.5M18 9.35714C16.9878 9.35714 16.0961 8.85207 15.573 8.08517M18 9.35714C19.0122 9.35714 19.9039 8.85207 20.427 8.08517M18 3.64286C19.0123 3.64286 19.9041 4.148 20.4271 4.915M18 3.64286C16.9877 3.64286 16.0959 4.148 15.5729 4.915M18 3.64286V2.5M21.5 4.21429L20.4271 4.915M14.5004 8.78571L15.573 8.08517M14.5 4.21429L15.5729 4.915M21.4996 8.78571L20.427 8.08517M20.4271 4.915C20.7364 5.36854 20.9167 5.91364 20.9167 6.5C20.9167 7.08643 20.7363 7.63159 20.427 8.08517M15.5729 4.915C15.2636 5.36854 15.0833 5.91364 15.0833 6.5C15.0833 7.08643 15.2637 7.63159 15.573 8.08517" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
                  <circle cx="17.75" cy="17.75" r="4.25" stroke="currentColor" stroke-width="1.8" />
                  <circle cx="6.25" cy="17.75" r="4.25" stroke="currentColor" stroke-width="1.8" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Tools</span>
              </span>
            </li>
          </ul>
        </div>
        <div class="bottom">
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
            <li class="appearance">
              <a href="/appearance">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
                  <path d="M14 19L11.1069 10.7479C9.76348 6.91597 9.09177 5 8 5C6.90823 5 6.23652 6.91597 4.89309 10.7479L2 19M4.5 12H11.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M21.9692 13.9392V18.4392M21.9692 13.9392C22.0164 13.1161 22.0182 12.4891 21.9194 11.9773C21.6864 10.7709 20.4258 10.0439 19.206 9.89599C18.0385 9.75447 17.1015 10.055 16.1535 11.4363M21.9692 13.9392L19.1256 13.9392C18.6887 13.9392 18.2481 13.9603 17.8272 14.0773C15.2545 14.7925 15.4431 18.4003 18.0233 18.845C18.3099 18.8944 18.6025 18.9156 18.8927 18.9026C19.5703 18.8724 20.1955 18.545 20.7321 18.1301C21.3605 17.644 21.9692 16.9655 21.9692 15.9392V13.9392Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Appearance</span>
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
            <li class="avatar account">
              <a href="/account">
                <img src="https://a03-static.s3.eu-north-1.amazonaws.com/u0258103538917264.webp" alt="avatar" />
              </a>
              <span class="tooltip">
                <span class="arrow"></span>
                <span class="text">Logout</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div class="details-nav">
        <div class="title">
          <span class="text">My Wallet</span>
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" color="currentColor" fill="none">
              <path d="M15.1528 4.28405C13.9789 3.84839 13.4577 2.10473 12.1198 2.00447C12.0403 1.99851 11.9603 1.99851 11.8808 2.00447C10.5429 2.10474 10.0217 3.84829 8.8478 4.28405C7.60482 4.74524 5.90521 3.79988 4.85272 4.85239C3.83967 5.86542 4.73613 7.62993 4.28438 8.84747C3.82256 10.0915 1.89134 10.6061 2.0048 12.1195C2.10506 13.4574 3.84872 13.9786 4.28438 15.1525C4.73615 16.37 3.83962 18.1346 4.85272 19.1476C5.90506 20.2001 7.60478 19.2551 8.8478 19.7159C10.0214 20.1522 10.5431 21.8954 11.8808 21.9955C11.9603 22.0015 12.0403 22.0015 12.1198 21.9955C13.4575 21.8954 13.9793 20.1521 15.1528 19.7159C16.3704 19.2645 18.1351 20.1607 19.1479 19.1476C20.2352 18.0605 19.1876 16.2981 19.762 15.042C20.2929 13.8855 22.1063 13.3439 21.9958 11.8805C21.8957 10.5428 20.1525 10.021 19.7162 8.84747C19.2554 7.60445 20.2004 5.90473 19.1479 4.85239C18.0955 3.79983 16.3958 4.74527 15.1528 4.28405Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M12.2422 16V12C12.2422 11.5286 12.2422 11.2929 12.0957 11.1464C11.9493 11 11.7136 11 11.2422 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M11.9922 8H12.0012" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    `;
	}
	
	getMobileNav = () => {
		return /* html */`
      <div class="mobile-nav">
        <div class="icons">
          <span class="icon home active">
            <span class="bar"></span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M12 17H12.009" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20 8.5V13.5C20 17.2712 20 19.1569 18.8284 20.3284C17.6569 21.5 15.7712 21.5 12 21.5C8.22876 21.5 6.34315 21.5 5.17157 20.3284C4 19.1569 4 17.2712 4 13.5V8.5" stroke="currentColor" stroke-width="1.8" />
              <path d="M22 10.5L17.6569 6.33548C14.9902 3.77849 13.6569 2.5 12 2.5C10.3431 2.5 9.00981 3.77849 6.34315 6.33548L2 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            <span class="text">Home</span>
          </span>
          <span class="icon wallet">
            <span class="bar"></span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <rect width="24" height="24" fill="none" />
              <path d="M3 8.5H15C17.8284 8.5 19.2426 8.5 20.1213 9.37868C21 10.2574 21 11.6716 21 14.5V15.5C21 18.3284 21 19.7426 20.1213 20.6213C19.2426 21.5 17.8284 21.5 15 21.5H9C6.17157 21.5 4.75736 21.5 3.87868 20.6213C3 19.7426 3 18.3284 3 15.5V8.5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" stroke-linejoin="round" />
              <path d="M15 8.49833V4.1103C15 3.22096 14.279 2.5 13.3897 2.5C13.1336 2.5 12.8812 2.56108 12.6534 2.67818L3.7623 7.24927C3.29424 7.48991 3 7.97203 3 8.49833" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
           <span class="text">Wallet</span>
          </span>
          <span class="icon investment">
            <span class="bar"></span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M14 18C18.4183 18 22 14.4183 22 10C22 5.58172 18.4183 2 14 2C9.58172 2 6 5.58172 6 10C6 14.4183 9.58172 18 14 18Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              <path d="M13.1669 20.9689C12.063 21.6239 10.7742 22 9.3975 22C5.31197 22 2 18.688 2 14.6025C2 13.2258 2.37607 11.937 3.03107 10.8331" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            </svg>
            <span class="text">Invest</span>
          </span>
          <span class="icon offices">
            <span class="bar"></span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
							<path d="M14 22V8C14 5.17157 14 3.75736 13.1213 2.87868C12.2426 2 10.8284 2 8 2C5.17157 2 3.75736 2 2.87868 2.87868C2 3.75736 2 5.17157 2 8V16C2 18.8284 2 20.2426 2.87868 21.1213C3.75736 22 5.17157 22 8 22H14Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							<path d="M6.5 11H5.5M10.5 11H9.5M6.5 7H5.5M6.5 15H5.5M10.5 7H9.5M10.5 15H9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							<path d="M18.5 15H17.5M18.5 11H17.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
							<path d="M18 8H14V22H18C19.8856 22 20.8284 22 21.4142 21.4142C22 20.8284 22 19.8856 22 18V12C22 10.1144 22 9.17157 21.4142 8.58579C20.8284 8 19.8856 8 18 8Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
            <span class="text">Offices</span>
          </span>
				  <span class="icon more">
				    <span class="bar"></span>
				    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
							<path d="M15.5 6.5C15.5 8.433 13.933 10 12 10C10.067 10 8.5 8.433 8.5 6.5C8.5 4.567 10.067 3 12 3C13.933 3 15.5 4.567 15.5 6.5Z" stroke="currentColor" stroke-width="1.8" />
							<path d="M22 17.5C22 19.433 20.433 21 18.5 21C16.567 21 15 19.433 15 17.5C15 15.567 16.567 14 18.5 14C20.433 14 22 15.567 22 17.5Z" stroke="currentColor" stroke-width="1.8" />
							<path d="M9 17.5C9 19.433 7.433 21 5.5 21C3.567 21 2 19.433 2 17.5C2 15.567 3.567 14 5.5 14C7.433 14 9 15.567 9 17.5Z" stroke="currentColor" stroke-width="1.8" />
						</svg>
						<span class="text">More</span>
					</span>
					<span class="icon settings">
						<span class="bar"></span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" stroke="currentColor" stroke-width="1.8" />
              <path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
						</svg>
						<span class="text">Settings</span>
					</span>
					<!-- <span class="icon profile">
            <div class="avatar">
              <img src="https://randomuser.me/api/portraits/men/10.jpg" alt="avatar" />
            </div>
            <span class="text">Profile</span>
					</span>-->
      </div>
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

        section.nav {
          width: 300px;
          display: flex;
          flex-flow: row;
          gap: 5px;
          padding: 0;
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

        section.nav > div.icons-nav {
          padding: 0;
          display: flex;
          height: 100%;
          gap: 50px;
          flex-flow: column;
          justify-content: space-between;
          align-items: center;
          width: 40px;
        }

        section.nav > div.icons-nav > div.top,
        section.nav > div.icons-nav > div.bottom {
          display: flex;
          flex-flow: column;
          align-items: center;
          gap: 0;
          width: 100%;
          min-width: 100%;
        }

        section.nav > div.icons-nav > div.top > div.logo {
          padding: 10px 0;
        }

        section.nav > div.icons-nav  ul.nav {
          padding: 0;
          margin: 10px 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          width: 100%;
          gap: 5px;
        }

        section.nav > div.icons-nav  ul.nav > li {
          padding: 0;
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 5px;
          position: relative;
          color: var(--icon-color);
          transition: all 0.3s ease;
        }

        section.nav > div.icons-nav  ul.nav > li:hover,
        section.nav > div.icons-nav  ul.nav > li.active {
          color: var(--action-color);
        }

        section.nav > div.icons-nav ul.nav > li > a {
          padding: 5px;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0;
          color: inherit;
          border-radius: 7px;
        }

        section.nav > div.icons-nav ul.nav > li.active > a {
          background: var(--nav-background);
        }

        section.nav > div.icons-nav ul.nav > li > a > svg {
          width: 22px;
          height: 22px;
        }

        section.nav > div.icons-nav ul.nav > li.avatar > a {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          padding: 0;
          overflow: hidden;
          border: var(--input-border);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        section.nav > div.icons-nav ul.nav > li.avatar > a > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }

        section.nav > div.icons-nav ul.nav > li > span.tooltip {
          position: absolute;
          background: var(--background);
          z-index: 10;
          top: calc(50% - 10px);
          left: calc(100% + 5px);
          color: var(--gray-color);
          display: none;
          max-width: 150px;
          align-items: center;
          justify-content: center;
          padding: 2px 7px 3px 5px;
          box-shadow: var(--box-shadow);
          height: 26px;
          border: var(--border);
          border-radius: 7px;
          transition: all 0.3s ease;
        }

        section.nav > div.icons-nav ul.nav > li:hover > span.tooltip {
          display: flex;
        }

        section.nav > div.icons-nav ul.nav > li.active > span.tooltip {
          color: var(--action-color);
        }

        section.nav > div.icons-nav ul.nav > li > span.tooltip > span.arrow {
          position: absolute;
          background: var(--background);
          display: inline-block;
          width: 10px;
          height: 10px;
          top: calc(50% - 5px);
          left: -5px;
          border-left: var(--border);
          border-top: var(--border);
          rotate: -45deg;
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }

        section.nav > div.icons-nav ul.nav > li > span.tooltip > span.text {
          color: inherit;
          font-family: var(--font-text), sans-serif;
          font-size: 0.95rem;

          /* add ellipsis */
          white-space: nowrap;
          overflow: hidden;
        }

        section.nav > div.details-nav {
          padding: 0;
          margin: 0;
          width: calc(100% - 40px);
          height: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
          overflow-y: scroll;
          scrollbar-width: none;
        }

        section.nav > div.details-nav::-webkit-scrollbar {
          visibility: hidden;
          display: none;
        }

        section.nav > div.details-nav > div.title {
          padding: 0 0 0 10px;
          height: 55px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: var(--border);
        }

        section.nav > div.details-nav > div.title > span.text {
          font-family: var(--font-text), sans-serif;
          font-size: 1.2rem;
          line-height: 1.5rem;
          color: var(--text-color);
          font-weight: 500;
        }

        section.nav > div.details-nav > div.title > span.icon {
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          color: var(--icon-color);
        }

        section.nav > div.details-nav > div.title > span.icon:hover {
          color: var(--action-color);
        }

        section.nav > div.details-nav > div.title > span.icon > svg {
          width: 20px;
          height: 20px;
        }

        section.nav > div.details-nav > div.container {
          padding: 10px 0;
          display: flex;
          flex-flow: column;
          gap: 10px;
          width: 100%;
        }

        section.flow {
          /* border: thin solid green; */
          width: calc(100% - calc(300px + 20px));
          display: flex;
          flex-flow: row;
          gap: 0;
          padding: 0 10px;
        }

        section.flow > div.feeds {
          padding: 0;
          width: 52%;
          min-width: 550px;
          display: flex;
          flex-flow: column;
          gap: 0;
          align-items: center;
          justify-content: start;
        }

        section.flow > div.side {
          padding: 0 10px;
          margin: 0;
          background-color: transparent;
          width: 50%;
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

        section.flow > div.side::-webkit-scrollbar {
          visibility: hidden;
          display: none;
        }

        section.flow > div.feeds > form.search {
          padding: 15px 0 10px 0;
          background: var(--background);
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          z-index: 6;
          width: 100%;
          position: sticky;
          top: 0;
        }

        section.flow > div.feeds > form.search > svg {
          position: absolute;
          left: -12px;
          top: calc(50% - 15px);
          color: var(--text-color);
          cursor: pointer;
          width: 40px;
          height: 40px;
        }

        section.flow > div.feeds > form.search > svg:hover {
          color: var(--accent-color);
        }

        section.flow > div.feeds > form.search > .contents {
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

        section.flow > div.feeds > form.search > .contents > input {
          border: var(--input-border);
          background-color: var(--background) !important;
          display: flex;
          flex-flow: row;
          align-items: center;
          font-family: var(--font-text),sans-serif;
          color: var(--text-color);
          font-size: 1rem;
          padding: 8px 10px 8px 35px;
          gap: 0;
          width: 100%;
          border-radius: 12px;
        }
        
        section.flow > div.feeds > form.search > .contents > input:-webkit-autofill,
        section.flow > div.feeds > form.search > .contents > input:-webkit-autofill:hover, 
        section.flow > div.feeds > form.search > .contents > input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px var(--background) inset;
          -webkit-text-fill-color: var(--text-color) !important;
          transition: background-color 5000s ease-in-out 0s;
          color: var(--text-color) !important;
        }
        
        section.flow > div.feeds > form.search > .contents > input:-webkit-autofill {
          filter: none;
          color: var(--text-color) !important;
        }

        section.flow > div.feeds > form.search > .contents > svg {
          position: absolute;
          height: 18px;
          color: var(--gray-color);
          width: 18px;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
        }

        section.flow > div.feeds > form.search > .contents > button {
          position: absolute;
          right: 10px;
          top: calc(50% - 13px);
          border: none;
          cursor: pointer;
          color: var(--white-color);
          font-family: var(--font-text), sans-serif;
          background: var(--accent-linear);
          height: 26px;
          width: max-content;
          padding: 0 10px;
          font-size: 0.9rem;
          font-weight: 400;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          border-radius: 10px;
        }

        section.flow > div.feeds > div.feeds-wrapper {
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: space-between;
          gap: 0;
          width: 100%;
          min-height: calc(100vh - 55px);
        }

        section.flow > div.feeds > div.feeds-wrapper > div.content-wrapper {
          display: flex;
          flex-flow: column;
          gap: 20px;
          min-height: calc(100vh - 180px);
          width: 100%;
        }

        footer.footer {
          border-top: var(--border);
          display: flex;
          flex-flow: column;
          align-items: start;
          justify-content: start;
          gap: 5px;
          width: 100%;
          padding: 10px 0 20px 0;
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

        section.flow >  div.side > ul.header {
          padding: 10px 0 5px 0;
          height: 55px;
          margin: 0;
          list-style-type: none;
          width: 100%;
          display: flex;
          align-items: end;
          justify-content: end;
          gap: 20px;
        }

        section.flow >  div.side > ul.header > li.item {
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          position: relative;
          color: var(--icon-color);
          transition: all 0.3s ease;
        }

        section.flow >  div.side > ul.header > li.item:hover,
        section.flow >  div.side > ul.header > li.item.active {
          color: var(--action-color);
        }

        section.flow >  div.side > ul.header > li.item > a {
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0;
          color: inherit;
        }
        
        section.flow >  div.side > ul.header > li.item > a > svg {
          width: 24px;
          height: 24px;
          color: inherit;
        }

        @media screen and (max-width:900px) {
         .feeds {
            width: 58%;
          }

          div.side {
            width: 40%;
          }
        }

				@media screen and (max-width:660px) {
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
						/*border-top: var(--border);*/
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
						width: 100%;
						height: 2px;
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
						color: inherit;
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
						display: flex;
						flex-flow: column;
						gap: 0;
						height: max-content;
						padding: 50px 0 55px 0;
					}
					
					/* Feeds > Header */
					header.mobile-header {
						border-bottom: var(--border);
						box-shadow: var(--header-shadow);
						display: flex;
						flex-flow: row;
						justify-content: space-between;
						align-items: center;
						padding: 0 10px;
						height: 50px;
						background: var(--background);
						position: fixed;
						top: 0;
						left: 0;
						right: 0;
						width: 100%;
						z-index: 10;
					}
					
					header.mobile-header > div.left {
						display: flex;
						flex-flow: row;
						align-items: center;
						gap: 0;
						margin-left: -9px;
					}
					
					header.mobile-header > div.left > span.icon {
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
					
					header.mobile-header > div.left > span.icon > svg {
						min-width: 30px;
						max-width: 30px;
						height: 30px;
					}
					
					header.mobile-header > div.left > h2.title {
						font-family: var(--font-text), sans-serif;
						font-size: 1.2rem;
						font-weight: 500;
						margin: 0;
						color: var(--text-color);
					}
					
					header.mobile-header > ul.links {
						padding: 0;
						margin: 0;
						display: flex;
						flex-flow: row;
						gap: 20px;
						height: 100%;
						list-style-type: none;
						align-items: center;
						justify-content: center;
					}
					
					header.mobile-header > ul.links > li.item {
						padding: 0;
						margin: 0;
						list-style-type: none;
						display: flex;
						align-items: center;
						justify-content: center;
					}
					
					header.mobile-header > ul.links > li.item > a {
						font-family: var(--font-read), sans-serif;
						font-size: 0.9rem;
						color: var(--gray-color);
					}
					
					header.mobile-header > ul.links > li.item > a:hover {
						color: var(--anchor-color);
					}
					
					header.mobile-header > ul.links > li.item > a > svg {
						width: 22px;
						height: 22px;
						color: inherit;
					}
					
					header.mobile-header > ul.links > li.item.theme {
						position: relative;
						padding: 0;
						width: max-content;
						gap: 5px;
						display: flex;
						justify-content: center;
						align-items: center;
					}
					
					header.mobile-header > ul.links > li.item.theme >  span.icon {
						color: var(--gray-color);
						display: flex;
						justify-content: center;
						align-items: center;
					}
					
					header.mobile-header > ul.links > li.item.theme > span.icon svg {
						width: 22px;
						height: 22px;
						color: inherit;
					}
					
					header.mobile-header > ul.links > li.item.theme >  span.icon.light {
            display: none;
          }
				}
	    </style>
    `;
	}
}