export default class HeaderContainer extends HTMLElement {
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
    this.expandLists();
    this.activateSlide();
    this.watchMql();
  }

  watchMql = () => {
    const outerThis = this;
    const mql = window.matchMedia('(max-width: 660px)');

    mql.addEventListener('change', _e => {
      outerThis.render()

      outerThis.expandLists();
      outerThis.activateSlide();
    })
  }

  activateSlide = () => {
    const self = this;
    // Mobile Switcher
    const mobileCheckbox = this.shadowObj.querySelector('.nav input.nav-input');
    const mobileOptions = this.shadowObj.querySelector('ul.left');

    // console.log(mobileCheckbox);
    // console.log(mobileOptions);

    if (mobileCheckbox && mobileOptions) {
      mobileCheckbox.addEventListener('change', (event) => {
        if (event.currentTarget.checked) {
          // console.log(mobileOptions);
          mobileOptions.style.setProperty('left', 0);
          self.disableScroll();
        }
        else {
          mobileOptions.style.setProperty('left', '-115%');
          self.enableScroll();
        }
      })
    }
  }

  expandLists = () => {
    const mql = window.matchMedia('(max-width: 600px)');
    if (mql.matches) {
      const expandableHeaderLinks = this.shadowObj.querySelectorAll('ul.left > li.link.options-link');
      let activeLink = this.shadowObj.querySelector('ul.left > li.link.options-link.active');
      if (expandableHeaderLinks) {
        expandableHeaderLinks.forEach(link => {
          // const options = link.querySelector('div.drop-down');
          link.addEventListener('click', event => {
            // event.preventDefault();

            if (activeLink) {
              if (activeLink.dataset.name !== link.dataset.name) {
                activeLink.classList.remove('active');
              }
            }

            // console.log(isActive);
            link.classList.toggle('active');
            activeLink = link;
          })
        });
      }
    }
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

  getBody() {
    const mql = window.matchMedia('(max-width: 660px)');
    return `
      ${this.getNav(mql)}
      ${this.getLogo()}
      ${this.getLeft()}
      ${this.getRight()}
    `;
  }

  getNav = mql => {
    if (mql.matches) {
      return /* html */`
        <div class="nav">
          <input class="nav-input" type="checkbox" />
          <svg>
            <use xlink:href="#menu" />
            <use xlink:href="#menu" />
          </svg>

          <svg xmlns="http://www.w3.org/2000/svg" style="display: none;">
            <symbol xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 56" id="menu">
              <path d="M48.33,45.6H18a14.17,14.17,0,0,1,0-28.34H78.86a17.37,17.37,0,0,1,0,34.74H42.33l-21-21.26L47.75,4" />
            </symbol>
          </svg>
        </div>
      `;
    }
    else {
      return '';
    }
  }

  getLogo = () => {
    return `
			<h2 class="site-name">Pau</h2>
		`
  }

  getLeft = () => {
    return /*html*/`
      <ul class="left">
        ${this.getLeftAccount()}
        ${this.getLeftArticles()}
        ${this.getLeftResources()}
        <li class="link icon about">
          <a href="/about" class="link-item">About</a>
        </li>
        <li class="link icon donate">
          <a href="https://www.buymeacoffee.com/femar" class="link-item">Donate</a>
        </li>
      </ul>
    ` 
  }

  getLeftAccount = () => {
    return /* html */`
      <div class="account out">
        <a href="/join/login" class="login">Login</a>
        <a href="/join/register" class="signup">Sign Up</a>
      </div>
    `
  }

  getLeftProfile = () => {
    return /*html*/`
        <li class="item bulk create">
          <a href="/create" class="link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22.0001C4.617 22.0001 2 19.3831 2 12.0001C2 4.61712 4.617 2.00012 12 2.00012C12.414 2.00012 12.75 2.33612 12.75 2.75012C12.75 3.16412 12.414 3.50012 12 3.50012C5.486 3.50012 3.5 5.48612 3.5 12.0001C3.5 18.5141 5.486 20.5001 12 20.5001C18.514 20.5001 20.5 18.5141 20.5 12.0001C20.5 11.5861 20.836 11.2501 21.25 11.2501C21.664 11.2501 22 11.5861 22 12.0001C22 19.3831 19.383 22.0001 12 22.0001Z" fill="currentColor" />
              <path fill-rule="evenodd" clip-rule="evenodd" d="M19.2365 9.38606L20.2952 8.19072C21.4472 6.88972 21.3252 4.89472 20.0252 3.74172C19.3952 3.18372 18.5812 2.90372 17.7452 2.95572C16.9052 3.00672 16.1352 3.38272 15.5772 4.01272L9.6932 10.6607C7.8692 12.7187 9.1172 15.4397 9.1712 15.5547C9.2602 15.7437 9.4242 15.8877 9.6232 15.9497C9.6802 15.9687 10.3442 16.1717 11.2192 16.1717C12.2042 16.1717 13.4572 15.9127 14.4092 14.8367L19.0774 9.56571C19.1082 9.54045 19.1374 9.51238 19.1646 9.4815C19.1915 9.45118 19.2155 9.41925 19.2365 9.38606ZM10.4082 14.5957C11.0352 14.7097 12.4192 14.8217 13.2862 13.8427L17.5371 9.04299L15.0656 6.85411L10.8172 11.6557C9.9292 12.6567 10.2122 13.9917 10.4082 14.5957ZM16.0596 5.73076L18.5322 7.91938L19.1722 7.19672C19.7752 6.51472 19.7122 5.46872 19.0312 4.86572C18.7002 4.57372 18.2712 4.42472 17.8362 4.45272C17.3962 4.48072 16.9932 4.67672 16.7002 5.00672L16.0596 5.73076Z" fill="currentColor" />
            </svg>
            <span class="content">
              <h5 class="name">Create</h5>
              <span class="text">Stories, topics, and more</span>
            </span>
          </a>
        </li>
        <li class="item bulk">
          <a href="${this.getAttribute('apk')}" class="link" download>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M11.8792 2.00012C12.2934 2.00012 12.6292 2.33591 12.6292 2.75012V14.7911C12.6292 15.2053 12.2934 15.5411 11.8792 15.5411C11.4649 15.5411 11.1292 15.2053 11.1292 14.7911V2.75012C11.1292 2.33591 11.4649 2.00012 11.8792 2.00012Z" fill="currentColor"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M8.43389 11.333C8.72739 11.0407 9.20226 11.0416 9.49455 11.3351L11.8791 13.7295L14.2637 11.3351C14.556 11.0416 15.0309 11.0407 15.3244 11.333C15.6179 11.6253 15.6188 12.1001 15.3266 12.3936L12.4106 15.3216C12.2698 15.4629 12.0786 15.5424 11.8791 15.5424C11.6797 15.5424 11.4885 15.4629 11.3477 15.3216L8.43172 12.3936C8.13943 12.1001 8.1404 11.6253 8.43389 11.333Z" fill="currentColor"/>
              <path fill-rule="evenodd" clip-rule="evenodd" d="M15.6234 7.18998C15.6614 6.77751 16.0266 6.47398 16.4391 6.51201C18.2864 6.68233 19.7854 7.12906 20.7549 8.43727C21.6845 9.69156 22.0002 11.5813 22.0002 14.2588C22.0002 17.8083 21.4434 19.9905 19.6199 21.1104C18.7508 21.6442 17.6745 21.8801 16.4424 21.9947C15.2152 22.1088 13.741 22.1088 12.0319 22.1088H11.9686C10.259 22.1088 8.78452 22.1088 7.55723 21.9947C6.3251 21.8801 5.24883 21.6442 4.37983 21.1104C2.55651 19.9905 2.00024 17.8081 2.00024 14.2588C2.00024 11.5814 2.3157 9.69163 3.24515 8.43731C4.2146 7.12903 5.71369 6.68232 7.5614 6.512C7.97387 6.47398 8.33906 6.77753 8.37708 7.19C8.4151 7.60246 8.11155 7.96765 7.69909 8.00567C5.96679 8.16535 5.02589 8.55365 4.45034 9.33036C3.83479 10.1611 3.50024 11.6063 3.50024 14.2588C3.50024 17.8096 4.09847 19.1772 5.16491 19.8323C5.74079 20.186 6.5432 20.3939 7.69617 20.5011C8.84641 20.6081 10.2528 20.6088 12.0002 20.6088C13.7472 20.6088 15.1533 20.6081 16.3035 20.5011C17.4563 20.3939 18.2588 20.186 18.8349 19.8322C19.9016 19.1771 20.5002 17.8094 20.5002 14.2588C20.5002 11.6063 20.1655 10.1611 19.5498 9.33041C18.9741 8.55362 18.0331 8.16535 16.3014 8.00567C15.8889 7.96764 15.5854 7.60244 15.6234 7.18998Z" fill="currentColor"/>
            </svg>
            <span class="content">
              <h5 class="name">Download</h5>
              <span class="text">Download android app</span>
            </span>
          </a>
        </li>
      `
  }

  getLeftArticles = () => {
    return /* html */`
      <li data-name="articles" class="link articles options-link">
        <span class="link-item">
          <span class="text">All</span>
          <svg height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0607 6.74999L11.5303 7.28032L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L5.53032 6.21966L7.99999 8.68933L10.4697 6.21966L11 5.68933L12.0607 6.74999Z" fill="currentColor"></path>
          </svg>
        </span>
        <div class="drop-down">
          <span class="arrow"></span>
          <ul class="main">
            <h4 class="title">Home</h4>
            <li class="item icon">
              <a href="/home" class="link">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 576 512">
                  <path d="M352 120c0-13.3 10.7-24 24-24H552c13.3 0 24 10.7 24 24V296c0 13.3-10.7 24-24 24s-24-10.7-24-24V177.9L337 369c-9.4 9.4-24.6 9.4-33.9 0l-111-111L41 409c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9L175 207c9.4-9.4 24.6-9.4 33.9 0l111 111L494.1 144H376c-13.3 0-24-10.7-24-24z" />
                </svg>
                <span class="content">
                  <h5 class="name">Popular</h5>
                  <span class="text">Stories, topics, and users</span>
                </span>
              </a>
            </li>
            <li class="item icon">
              <a href="mailto:isfescii@gmail.com" class="link icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-paper" viewBox="0 0 16 16">
                  <path d="M4 0a2 2 0 0 0-2 2v1.133l-.941.502A2 2 0 0 0 0 5.4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5.4a2 2 0 0 0-1.059-1.765L14 3.133V2a2 2 0 0 0-2-2zm10 4.267.47.25A1 1 0 0 1 15 5.4v.817l-1 .6zm-1 3.15-3.75 2.25L8 8.917l-1.25.75L3 7.417V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1zm-11-.6-1-.6V5.4a1 1 0 0 1 .53-.882L2 4.267zm13 .566v5.734l-4.778-2.867zm-.035 6.88A1 1 0 0 1 14 15H2a1 1 0 0 1-.965-.738L8 10.083zM1 13.116V7.383l4.778 2.867L1 13.117Z" />
                </svg>
                <span class="content">
                  <h5 class="name">Contact</h5>
                  <span class="text">Send me an email</span>
                </span>
              </a>
            </li>
            <li class="item bulk icon">
              <a href="/search" class="link">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11.7666" cy="11.7667" r="8.98856" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M18.0183 18.4853L21.5423 22.0001" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span class="content">
                  <h5 class="name">Search</h5>
                  <span class="text">Search any contents</span>
                </span>
              </a>
            </li>
            <li class="item bulk icon">
              <a href="/soon" class="link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-feather" viewBox="0 0 16 16">
                  <path d="M15.807.531c-.174-.177-.41-.289-.64-.363a3.8 3.8 0 0 0-.833-.15c-.62-.049-1.394 0-2.252.175C10.365.545 8.264 1.415 6.315 3.1S3.147 6.824 2.557 8.523c-.294.847-.44 1.634-.429 2.268.005.316.05.62.154.88q.025.061.056.122A68 68 0 0 0 .08 15.198a.53.53 0 0 0 .157.72.504.504 0 0 0 .705-.16 68 68 0 0 1 2.158-3.26c.285.141.616.195.958.182.513-.02 1.098-.188 1.723-.49 1.25-.605 2.744-1.787 4.303-3.642l1.518-1.55a.53.53 0 0 0 0-.739l-.729-.744 1.311.209a.5.5 0 0 0 .443-.15l.663-.684c.663-.68 1.292-1.325 1.763-1.892.314-.378.585-.752.754-1.107.163-.345.278-.773.112-1.188a.5.5 0 0 0-.112-.172M3.733 11.62C5.385 9.374 7.24 7.215 9.309 5.394l1.21 1.234-1.171 1.196-.027.03c-1.5 1.789-2.891 2.867-3.977 3.393-.544.263-.99.378-1.324.39a1.3 1.3 0 0 1-.287-.018Zm6.769-7.22c1.31-1.028 2.7-1.914 4.172-2.6a7 7 0 0 1-.4.523c-.442.533-1.028 1.134-1.681 1.804l-.51.524zm3.346-3.357C9.594 3.147 6.045 6.8 3.149 10.678c.007-.464.121-1.086.37-1.806.533-1.535 1.65-3.415 3.455-4.976 1.807-1.561 3.746-2.36 5.31-2.68a8 8 0 0 1 1.564-.173"/>
                </svg>
                <span class="content">
                  <h5 class="name">Contribute</h5>
                  <span class="text">Help us write code and docs</span>
                </span>
              </a>
            </li>
          </ul>
          <ul class="main">
            <h4 class="title">You</h4>
            ${this.getLeftProfile()}
          </ul>
        </div>
      </li>
    `
  }

  getLeftResources = () => {
    return /* html */`
      <li data-name="resources" class="link options-link resources">
        <span class="link-item">
          <span class="text">Tools</span>
          <svg height="16" stroke-linejoin="round" viewBox="0 0 16 16" width="16" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M12.0607 6.74999L11.5303 7.28032L8.7071 10.1035C8.31657 10.4941 7.68341 10.4941 7.29288 10.1035L4.46966 7.28032L3.93933 6.74999L4.99999 5.68933L5.53032 6.21966L7.99999 8.68933L10.4697 6.21966L11 5.68933L12.0607 6.74999Z" fill="currentColor"></path>
          </svg>
        </span>
        <div class="drop-down">
          <span class="arrow"></span>
          <ul class="main">
            <h4 class="title">Tools</h4>
            <li class="item icon">
              <a href="/soon" class="link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-code-slash" viewBox="0 0 16 16">
                  <path d="M10.478 1.647a.5.5 0 1 0-.956-.294l-4 13a.5.5 0 0 0 .956.294zM4.854 4.146a.5.5 0 0 1 0 .708L1.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0m6.292 0a.5.5 0 0 0 0 .708L14.293 8l-3.147 3.146a.5.5 0 0 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0" />
                </svg>
                <span class="content">
                  <h5 class="name">Integration</h5>
                  <span class="text">Consume our APIs</span>
                </span>
              </a>
            </li>
            <li class="item journal">
              <a href="/soon" class="link">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 640 512">
                  <path d="M168 56a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zm80 0A56 56 0 1 0 136 56a56 56 0 1 0 112 0zM179.3 160H224V320H160V164c6-2.6 12.5-4 19.3-4zM160 496V352h64V496c0 8.8 7.2 16 16 16s16-7.2 16-16V160H400c8.8 0 16-7.2 16-16s-7.2-16-16-16H352V48c0-8.8 7.2-16 16-16H592c8.8 0 16 7.2 16 16V272c0 8.8-7.2 16-16 16H368c-8.8 0-16-7.2-16-16V192H320v80c0 26.5 21.5 48 48 48H592c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48H368c-26.5 0-48 21.5-48 48v80H243.1 179.3c-29.5 0-56.7 16.3-70.6 42.3L49.9 280.5c-4.2 7.8-1.2 17.5 6.6 21.7s17.5 1.2 21.7-6.6L128 202.2V496c0 8.8 7.2 16 16 16s16-7.2 16-16z" />
                </svg>
                <span class="content">
                  <h5 class="name">Feature</h5>
                  <span class="text">Request a feature</span>
                </span>
              </a>
            </li>
            <li class="item feedback">
              <a href="/soon" class="link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat-quote" viewBox="0 0 16 16">
                <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
                <path d="M7.066 6.76A1.665 1.665 0 0 0 4 7.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 0 0 .6.58c1.486-1.54 1.293-3.214.682-4.112zm4 0A1.665 1.665 0 0 0 8 7.668a1.667 1.667 0 0 0 2.561 1.406c-.131.389-.375.804-.777 1.22a.417.417 0 0 0 .6.58c1.486-1.54 1.293-3.214.682-4.112z"/>
              </svg>
                <span class="content">
                  <h5 class="name">Feedback</h5>
                  <span class="text">Leave your feedback</span>
                </span>
              </a>
            </li>
            <li class="item icon">
              <a href="/soon" class="link">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-book" viewBox="0 0 16 16">
                  <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783" />
                </svg>
                <span class="content">
                  <h5 class="name">Docs</h5>
                  <span class="text">Find help quickly</span>
                </span>
              </a>
            </li>
          </ul>
          <ul class="main">
            <h4 class="title">Company</h4>
            <li class="item icon">
              <a href="/soon" class="link icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-paper" viewBox="0 0 16 16">
                  <path d="M4 0a2 2 0 0 0-2 2v1.133l-.941.502A2 2 0 0 0 0 5.4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5.4a2 2 0 0 0-1.059-1.765L14 3.133V2a2 2 0 0 0-2-2zm10 4.267.47.25A1 1 0 0 1 15 5.4v.817l-1 .6zm-1 3.15-3.75 2.25L8 8.917l-1.25.75L3 7.417V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1zm-11-.6-1-.6V5.4a1 1 0 0 1 .53-.882L2 4.267zm13 .566v5.734l-4.778-2.867zm-.035 6.88A1 1 0 0 1 14 15H2a1 1 0 0 1-.965-.738L8 10.083zM1 13.116V7.383l4.778 2.867L1 13.117Z" />
                </svg>
                <span class="content">
                  <h5 class="name">Newsletter</h5>
                  <span class="text">Subscribe to our newsletter</span>
                </span>
              </a>
            </li>
            <li class="item icon">
              <a href="/soon" class="link">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 448 512">
                  <path d="M0 56C0 42.7 10.7 32 24 32c234.2 0 424 189.8 424 424c0 13.3-10.7 24-24 24s-24-10.7-24-24C400 248.3 231.7 80 24 80C10.7 80 0 69.3 0 56zM64 432a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm0-80a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM24 176c154.6 0 280 125.4 280 280c0 13.3-10.7 24-24 24s-24-10.7-24-24c0-128.1-103.9-232-232-232c-13.3 0-24-10.7-24-24s10.7-24 24-24z" />
                </svg>
                <span class="content">
                  <h5 class="name">RSS</h5>
                  <span class="text">Open rss feeds</span>
                </span>
              </a>
            </li>
          </ul>
        </div>
      </li>
    `
  }

  getRight = () => {
    return /* html */`
        <ul class="right">
          <li class="link icon signin">
            <a href="/join" class="link-item">Sign in</a>
          </li>
          <li class="link icon search">
            <a href="/search" class="link-item">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11.7666" cy="11.7667" r="8.98856" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                  stroke-linejoin="round" />
                <path d="M18.0183 18.4853L21.5423 22.0001" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"
                  stroke-linejoin="round" />
              </svg>
            </a>
          </li>
        </ul>
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

        ul,
        ol {
          padding: 0;
          margin: 0;
        }

        a {
          text-decoration: none;
        }

        *:focus {
          outline: inherit !important;
        }

        *::-webkit-scrollbar {
          -webkit-appearance: none;
        }

        :host {
          font-size: 16px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 30px;
          min-height: 60px;
          height: 60px;
          position: sticky;
          z-index: 5;
          top: 0;
          background-color: var(--background);
        }

        h2.site-name {
          margin: 0;
          font-weight: 700;
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
          font-family: var(--font-text);
        }

        /* Nav */
        .nav {
          z-index: inherit;
          background: none;
          max-width: 50px;
          max-height: 40px;
          position: relative;
          margin-left: -7px;
          cursor: default !important;
          display: none;
          justify-content: start;
          align-items: start;
        }

        .nav * {
          display: flex;
          cursor: default !important;
        }

        .nav svg {
          fill: none;
          height: 40px;
          stroke: var(--text-color);
          stroke-width: 7px;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .nav svg use:nth-of-type(1) {
          opacity: 1;
          stroke-dashoffset: 221;
          stroke-dasharray: 46 249;
          transition: stroke-dashoffset 0.12s linear 0.2s, stroke-dasharray 0.12s linear 0.2s, opacity 0s linear 0.2s;
        }

        .nav svg use:nth-of-type(2) {
          animation: stroke-animation-reverse 1.2s ease-out forwards;
        }

        .nav input.nav-input {
          position: absolute;
          height: 100%;
          width: 100%;
          z-index: 2;
          cursor: pointer;
          opacity: 0;
        }

        .nav input.nav-input:checked + svg use:nth-of-type(1) {
          stroke-dashoffset: 175;
          stroke-dasharray: 0 295;
          opacity: 0;
          transition: stroke-dashoffset 0.07s linear 0.07s, stroke-dasharray 0.07s linear 0.07s, opacity 0s linear 0.14s;
        }

        .nav input.nav-input:checked + svg use:nth-of-type(2) {
          animation: stroke-animation 1.2s ease-out forwards;
        }

        @keyframes stroke-animation {
          0% {
            stroke-dashoffset: 295;
            stroke-dasharray: 25 270;
          }

          50% {
            stroke-dashoffset: 68;
            stroke-dasharray: 59 236;
          }

          65% {
            stroke-dashoffset: 59;
            stroke-dasharray: 59 236;
          }

          100% {
            stroke-dashoffset: 68;
            stroke-dasharray: 59 236;
          }
        }

        @keyframes stroke-animation-reverse {
          0% {
            stroke-dashoffset: 68;
            stroke-dasharray: 59 236;
          }

          50% {
            stroke-dashoffset: 290;
            stroke-dasharray: 25 270;
          }

          65% {
            stroke-dashoffset: 295;
            stroke-dasharray: 25 270;
          }

          100% {
            stroke-dashoffset: 290;
            stroke-dasharray: 25 270;
          }
        }

        ul {
          height: 100%;
          display: flex;
          align-items: center;
          gap: 25px;
        }


        ul.left {
          position: relative
        }

        ul.left > .account {
          display: none;
        }

        ul > li.link {
          color: var(--text-color);
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          list-style-type: none;
          gap: 6px;
          font-weight: 500;
        }

        ul > li.logout {
          display: none;
        }

        ul > li.link.active,
        ul > li.link:hover {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        ul > li.link span.link-item,
        ul > li.link a {
          color: inherit;
          cursor: pointer;
          font-family: inherit;
          text-decoration: none;
        }

        ul > li.link span.link-item svg,
        ul > li.link a svg {
          margin: 0 0 -2px 0;
          width: 15px;
          height: 15px;
        }

        ul > li.link span.link-item svg,
        ul > li.link a svg {
          transition: all 300ms ease-in-out;
          -webkit-transition: all 300ms ease-in-out;
          -moz-transition: all 300ms ease-in-out;
          -ms-transition: all 300ms ease-in-out;
          -o-transition: all 300ms ease-in-out;
        }

        ul > li.link span.link-item svg,
        ul > li.link.active > a > svg,
        ul > li.link:hover  > a > svg {
          color: var(--accent-color);
        }

        ul.right {
          position: relative;
          gap: 15px;
        }

        ul.right > li.link.search a svg {
          margin: 0 0 0 0;
          width: 25px;
          height: 25px;
        }

        ul.right > li.link.signin > a {
          border: var(--border-mobile);
          padding: 4px 15px;
          font-family: var(--font-read);
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
          -ms-border-radius: 10px;
          -o-border-radius: 10px;
        }


        ul.right > li.link.profile > a {
          width: 30px;
          height: 30px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-family: var(--font-read);
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          -ms-border-radius: 50px;
          -o-border-radius: 50px;
        }

        ul.right > li.link.profile > a img{
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          -ms-border-radius: 50px;
          -o-border-radius: 50px;
        }

        ul > li.link a span.text {
          font-family: inherit;
        }


        /* Dropdown */
        ul > li.link > div.drop-down {
          border: var(--border);
          background-color: var(--background);
          padding: 15px 0;
          position: absolute;
          left: -180px;
          top: 60px;
          width: 530px;
          color: var(--gray-color);
          display: none;
          align-items: center;
          flex-flow: column;
          gap: 15px;
          justify-content: space-evenly;
          list-style-type: none;
          box-shadow: 0 0 0 1px #ffffff25, 0 2px 2px #0000000a, 0 8px 16px -4px #0000000a;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        ul > li.link:hover > div.drop-down,
        ul > li.link.active > div.drop-down {
          display: flex;
          transition: all 300ms ease-in-out;
          -webkit-transition: all 300ms ease-in-out;
          -moz-transition: all 300ms ease-in-out;
          -ms-transition: all 300ms ease-in-out;
          -o-transition: all 300ms ease-in-out;
        }

        ul > li.link.active span.link-item svg,
        ul > li.link:hover span.link-item svg {
          rotate: 180deg;
        }

        ul > li.link > div.drop-down > span.arrow {
          border: var(--border);
          border-bottom: none;
          border-right: none;
          background-color: var(--background);
          position: absolute;
          left: 120px;
          top: -7px;
          width: 14px;
          height: 14px;
          rotate: 45deg;
          color: var(--gray-color);
          display: flex;
          border-radius: 1px;
          -webkit-border-radius: 1px;
          -moz-border-radius: 1px;
        }

        ul > li.link.articles > div.drop-down > span.arrow {
          left: 185px;
        }

        ul > li.link.resources > div.drop-down > span.arrow {
          left: 265px;
        }

        ul > li.link a span.text {
          font-family: inherit;
        }

        ul > li.link > div.drop-down > ul.main {
          /* border: 1px solid red; */
          width: 100%;
          margin: 0;
          padding: 0 10px;
          list-style-type: none;
          display: grid;
          grid-template-columns: 1fr 1fr;
          column-gap: 0;
          row-gap: 10px;
        }


        ul > li.link > div.drop-down ul * {
          transition: all 300ms ease-in-out;
          -webkit-transition: all 300ms ease-in-out;
          -moz-transition: all 300ms ease-in-out;
          -ms-transition: all 300ms ease-in-out;
          -o-transition: all 300ms ease-in-out;
        }

        ul > li.link > div.drop-down ul:last-of-type {
          border-top: var(--border);
          padding: 15px 10px 0 10px;
        }


        ul > li.link > div.drop-down ul > h4.title {
          grid-column: 1/3;
          padding: 0 0 0 10px;
          font-weight: 400;
        }

        ul > li.link > div.drop-down ul > li {
          width: 100%;
          color: var(--gray-color);
          font-weight: 400;
          padding: 3px 8px 5px;
          font-size: 0.9rem;
          border-radius: 5px;
          -webkit-border-radius: 5px;
          -moz-border-radius: 5px;
        }

        ul > li.link > div.drop-down ul > li:hover {
          background-color: var(--hover-background);
        }

        ul > li.link > div.drop-down ul > li a {
          width: 100%;
          font-weight: 400;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        ul > li.link > div.drop-down ul > li a:hover svg {
          color: inherit;
        }

        ul > li.link > div.drop-down ul > li svg {
          width: 24px;
          height: 24px;
        }

        ul > li.link > div.drop-down ul > li.icon svg {
          width: 20px;
          height: 20px;
        }

        ul > li.link > div.drop-down ul > li a span.content {
          display: flex;
          flex-flow: column;
          line-height: 1.5;
        }

        ul > li.link > div.drop-down ul > li a span.content h5 {
          font-weight: 500;
          font-size: 1rem;
          color: var(--title-color);
        }

        @media screen and (max-width: 660px) {
          :host {
            font-size: 16px;
            z-index: 10;
            padding: 0;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }

          h2.site-name {
            position: unset;
            margin: 0;
          }

          a {
            cursor: default !important;
          }

          .nav {
            display: flex;
          }

          ul.left {
            background-color: var(--background);
            position: fixed;
            left: calc(100% + 15px);
            flex-flow: column;
            z-index: 5;
            top: 60px;
            bottom: 0;
            width: 100%;
            height: calc(var(--vh-height, 100vh) - 60px);
            max-height: calc(var(--vh-height, 100vh) - 60px);
            min-height: calc(var(--vh-height, 100vh) - 60px);
            align-items: stretch;
            justify-content: start;
            gap: 0;
            padding: 10px 15px;
            overflow-y: scroll;
            -ms-overflow-style: none;
            scrollbar-width: none;
            transition: all 500ms ease-in-out;
            -webkit-transition: all 500ms ease-in-out;
            -moz-transition: all 500ms ease-in-out;
            -ms-transition: all 500ms ease-in-out;
            -o-transition: all 500ms ease-in-out;
          }

          ul.left::-webkit-scrollbar {
            display: none !important;
            visibility: hidden;
          }

          ul.left > .account {
            display: flex;
            flex-flow: column;
            width: 100%;
            padding: 0;
            gap: 0;
          }

          ul.left > .account.out {
            padding: 0 0 15px 0;
          }

          ul.left > li.logout > a,
          ul.left > .account > a {
            display: flex;
            flex-flow: column;
            margin: 8px 0;
            width: 100%;
            font-weight: 500;
            border-radius: 10px;
            -webkit-border-radius: 10px;
            -moz-border-radius: 10px;
            -ms-border-radius: 10px;
            -o-border-radius: 10px;
          }

          ul.left > .account > a.login {
            border: var(--border);
            padding: 10px 0;
            color: var(--title-color);
            text-align: center;
          }

          ul.left > .account > a.signup {
            border: none;
            padding: 10px 0;
            color: var(--white-color);
            text-align: center;
            background: var(--accent-linear);
          }

          ul.left > li.logout {
            list-style-type: none;
            display: flex;
            position: absolute;
            bottom: 20px;
            left: 15px;
            right: 15px;
            font-weight: 600;
          }

          ul.left > li.logout.active {
            bottom: -100px;
          }

          ul.left > .account > a.donate,
          ul.left > li.logout > a,
          ul.left > .account > a.settings,
          ul.left > .account > a.profile {
            border: var(--border-header);
            color: var(--title-color);
            padding: 2px 5px 2px 10px;
            min-height: 40px;
            height: 40px;
            display: flex;
            flex-flow: row;
            align-items: center;
            justify-content: space-between;
          }

          ul.left > li.logout > a {
            border: var(--border);
          }

          ul.left > .account > a.donate > svg,
          ul.left > li.logout > a svg,
          ul.left > .account > a.settings svg {
            color: var(--gray-color);
            width: 28px;
            height: 28px;
          }

          ul.left > .account > a.profile span.image {
            width: 30px;
            height: 30px;
            overflow: hidden;
            border-radius: 50px;
            -webkit-border-radius: 50px;
            -moz-border-radius: 50px;
            -ms-border-radius: 50px;
            -o-border-radius: 50px;
          }

          ul.left > .account > a.profile span.image img {
            width: 100%;
            height: 100%;
            overflow: hidden;
            object-fit: cover;
            border-radius: 50px;
            -webkit-border-radius: 50px;
            -moz-border-radius: 50px;
            -ms-border-radius: 50px;
            -o-border-radius: 50px;
          }

          ul.left > li.logout > a > span.text,
          ul.left > .account > a > span.text {
            font-weight: 600;
            color: var(--title-color);
            text-align: center;
          }

          ul.left > li.logout > a > span.text,
          ul.left > li.logout > a > svg,
          ul.left > li.logout > a {
            color: var(--text-color) !important;
          }

          ul.left > li.link {
            border-bottom: var(--border);
            min-width: 100%;
            width: 100%;
            margin: 0;
            padding: 10px 0;
            height: max-content;
            display: flex;
            flex-flow: column;
            align-items: start;
            justify-content: center;
          }

          ul.left > li.link.active,
          ul.left > li.link:hover {
            background: unset;
            background-clip: unset;
            -webkit-background-clip: unset;
          }

          ul.left > li.link span.link-item svg{
            color: var(--text-color);
          }

          ul.left > li.link:hover span.link-item svg {
            rotate: unset;
          }

          ul.left > li.link span.link-item {
            display: flex;
            align-items: stretch;
            justify-content: space-between;
          }

          ul.left > li.link a {
            color: var(--text-color);
            cursor: default;
            font-family: inherit;
          }

          ul.left > li.link a {
            color: var(--title-color);
            font-weight: 600;
            cursor: default;
            font-family: inherit;
          }

          ul.left > li.link span.link-item > span.text {
            color: var(--title-color);
            font-weight: 600;
            margin: 0;
            cursor: default;
            font-family: inherit;
          }

          ul.left > li.link span.link-item svg {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 2px 0 0 0;
          }

          ul.left > li.link > div.drop-down {
            border: none;
            display: none;
            padding: 10px 0 0 0;
            min-width: 100%;
            width: 100%;
            position: unset;
            left: unset;
            top: unset;
            width: unset;
            color: var(--text-color);
            align-items: center;
            flex-flow: column;
            gap: 0;
            justify-content: space-evenly;
            list-style-type: none;
            box-shadow: none;
            border-radius: 0;
          }

          ul.left > li.link.active > div.drop-down {
            display: flex;
          }

          ul.left > li.link.active span.link-item svg {
            rotate: 180deg;
          }

          ul.left > li.link > div.drop-down * {
            transition: all 500ms ease-in-out;
            -webkit-transition: all 500ms ease-in-out;
            -moz-transition: all 500ms ease-in-out;
            -ms-transition: all 500ms ease-in-out;
            -o-transition: all 500ms ease-in-out;
          }

          ul.left > li.link > div.drop-down > span.arrow {
            display: none;
          }

          ul.left > li.link > div.drop-down > ul.main {
            width: 100%;
            margin: 0;
            padding: 0;
            gap: 0;
            display: flex;
            flex-flow: column;
            align-items: start;
          }

          ul.left > li.link > div.drop-down ul:last-of-type {
            border: flex;
            padding: 10px 0 0 0;
          }

          ul.left > li.link > div.drop-down ul > h4.title {
            display: none;
          }

          ul.left > li.link > div.drop-down ul.main > li {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            margin: 0;
            padding: 8px 0;
          }

          ul.left > li.link > div.drop-down ul.main > li > a {
            color: var(--title-color);
            padding: 0;
            padding: 0 10px;
            display: flex;
            flex-flow: row;
            align-items: center;
            justify-content: space-between;
            border-radius: 10px;
            -webkit-border-radius: 10px;
            -moz-border-radius: 10px;
            -ms-border-radius: 10px;
            -o-border-radius: 10px;
          }

          ul.left > li.link > div.drop-down ul.main > li:nth-of-type(odd) {
            background-color: var(--gray-background);
          }

          ul > li.link > div.drop-down ul > li:hover {
            background-color: unset;
          }

          ul > li.link > div.drop-down ul > li svg {
            color: var(--gray-color);
            display: none;
            width: 30px;
            height: 30px;
            margin: -2px 0 0 -8px;
          }

          ul > li.link > div.drop-down ul > li.bulk svg {
            margin-bottom: -5px;
          }

          ul > li.link > div.drop-down ul > li.authors svg {
            margin-bottom: -10px;
          }

          ul > li.link > div.drop-down ul > li.icon svg {
            width: 30px;
            height: 30px;
            padding: 4px;
          }

          ul > li.link > div.drop-down ul > li.create svg {
            padding: 2px;
          }

          ul > li.link > div.drop-down ul > li a span.content {
            margin: 0;
            display: flex;
            flex-flow: column;
            line-height: 1.5;
            gap: 0;
            width: 100%;
          }

          ul > li.link > div.drop-down ul > li a span.content h5 {
            font-weight: 600;
            font-size: 1rem;
            color: var(--text-color);
          }

          ul > li.link > div.drop-down ul > li a span.content span.text {
            display: flex;
          }

          ul > li.link.theme > .options span.option,
          ul > li.link span.link-item,
          a {
            cursor: default !important;
            text-decoration: none;
          }

        }
      </style>
    `;
  }
}