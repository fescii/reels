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
          ${this.getChatApp()}
        </section>
      `;
		}
	}
	
	getMainNav = () => {
		return /* html */`
      <div class="icons-nav">
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
        <ul class="logout nav">
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

  getChatApp = () => {
    return /* html */`
      <chat-app all="628" unread="3" requests="2"></chat-app>
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
          width: 200px;
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
          gap: 10px;
          flex-flow: column;
          justify-content: start;
          align-items: start;
          width: 100%;
        }

        section.nav > div.icons-nav > div.logo {
          padding: 10px 0;
        }

        section.nav > div.icons-nav  ul.nav {
          border-top: var(--border);
          padding: 10px 0 0 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          width: 100%;
          gap: 5px;
        }

        section.nav > div.icons-nav  ul.nav > li {
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

        section.nav > div.icons-nav  ul.nav > li:hover,
        section.nav > div.icons-nav  ul.nav > li.active {
          color: var(--accent-color);
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

        section.nav > div.icons-nav ul.nav > li.active {
          background: var(--tab-background);
        }

        section.nav > div.icons-nav ul.nav > li > a > svg {
          width: 24px;
          height: 24px;
        }

        section.nav > div.icons-nav ul.nav > li.avatar {
          /*border: var(--input-border);*/
          width: 100%;
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 8px;
          margin: 10px 0;
          padding: 0 0 0 2px;
          cursor: pointer;
          color: var(--error-color);
          border-radius: 7px;
        }

        section.nav > div.icons-nav ul.nav > li.avatar > a {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          margin: 0;
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

        section.nav > div.icons-nav ul.nav > li > span.tooltip > span.text {
          color: inherit;
          font-family: var(--font-text), sans-serif;
          font-size: 1.05rem;
          font-weight: 400;
        }

        section.flow {
         /* border: thin solid green;*/
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
						padding: 0 0 55px 0;
					}
				}
	    </style>
    `;
	}
}