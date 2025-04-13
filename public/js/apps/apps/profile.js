export default class AppProfile extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.setTitle();
    // Check if you is true and convert to boolean
    this._you = this.getAttribute('you') === 'true';
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);
    this.app = window.app;
    this.render();
  }

  setTitle = () => {
    // update title of the document
    document.title = `User | ${this.getAttribute('name')}`;
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  static get observedAttributes() {
    return ['url', 'name', 'username', 'you', 'picture', 'verified', 'contact', 'followers', 'following', 'user-follow', 'tab', 'posts-url', 'replies-url', 'followers-url', 'following-url', 'search-url', 'auth-url'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    return;
  }

  connectedCallback() {
    this.enableScroll();
    this.app.showNav();
    window.scrollTo(0, 0);
    // request user to enable notifications
    this.checkNotificationPermission();

    // connect to the WebSocket
    this.checkAndAddHandler();

    // Watch for media query changes
    const mql = window.matchMedia('(max-width: 660px)');

    // Watch for media query changes
    this.watchMediaQuery(mql);
  }

  checkNotificationPermission = async () => {
    if(window.notify && !window.notify.permission) {
      await window.notify.requestPermission();
    }
  }

  checkAndAddHandler() {
    if (window.wss) {
      window.wss.addMessageHandler(this.boundHandleWsMessage);
      // console.log('WebSocket handler added successfully');
    } else {
      // console.log('WebSocket manager not available, retrying...');
      setTimeout(this.checkAndAddHandler, 500); // Retry after 500ms
    }
  }

  disconnectedCallback() {
    this.enableScroll()
    if (window.wss) {
      window.wss.removeMessageHandler(this.boundHandleWsMessage);
    }
  }

  handleWsMessage = message => {
    // Handle the message in this component
    // console.log('Message received in component:', message);
    const data = message.data;

    if (message.type !== 'action') return;

    const userHash = window.hash;

    const authorHash = this.getAttribute('hash').toUpperCase();

    const author = this.shadowObj.querySelector('profile-wrapper');

    // handle connect action
    if (data.action === 'connect' && data.kind === 'user') {
      this.handleConnectAction(data, author, userHash, authorHash);
    }
  }

  sendWsMessage(data) {
    window.wss.sendMessage(data);
  }

  handleConnectAction = (data, author, userHash, authorHash) => {
    const to = data.hashes.to;
    if(to === authorHash) {
      const followers = this.parseToNumber(this.getAttribute('followers')) + data.value;
      this.setAttribute('followers', followers)
      author.setAttribute('followers', followers);

      if (data.hashes.from === userHash) {
        const value = data.value === 1 ? 'true' : 'false';
        // update user-follow/auth-follow attribute
        this.setAttribute('user-follow', value);
        author.setAttribute('user-follow', value);
      }

      // reload the author component
      author.setAttribute('reload', 'true');
    }
  }

  // watch for mql changes
  watchMediaQuery = mql => {
    mql.addEventListener('change', () => {
      // Re-render the component
      this.render();
    });
  }

  formatNumber = n => {
    if (n >= 0 && n <= 999) {
      return n.toString();
    } else if (n >= 1000 && n <= 9999) {
      const value = (n / 1000).toFixed(2);
      return `${value}k`;
    } else if (n >= 10000 && n <= 99999) {
      const value = (n / 1000).toFixed(1);
      return `${value}k`;
    } else if (n >= 100000 && n <= 999999) {
      const value = (n / 1000).toFixed(0);
      return `${value}k`;
    } else if (n >= 1000000 && n <= 9999999) {
      const value = (n / 1000000).toFixed(2);
      return `${value}M`;
    } else if (n >= 10000000 && n <= 99999999) {
      const value = (n / 1000000).toFixed(1);
      return `${value}M`;
    } else if (n >= 100000000 && n <= 999999999) {
      const value = (n / 1000000).toFixed(0);
      return `${value}M`;
    } else if (n >= 1000000000) {
      return "1B+";
    }
    else {
      return 0;
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

  getDate = isoDateStr => {
    const dateIso = new Date(isoDateStr); // ISO strings with timezone are automatically handled
    let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // userTimezone.replace('%2F', '/')

    // Convert posted time to the current timezone
    const date = new Date(dateIso.toLocaleString('en-US', { timeZone: userTimezone }));

    return `
      ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
    const authorContent = this.getAuthor();

    const mql = window.matchMedia('(max-width: 660px)');
    if (mql.matches) {
      return /* html */`
        ${authorContent}
        ${this.getSection()}
      `;
    }
    else {
      return /* html */`
        <section class="main">
          <div class="body">
            ${authorContent}
            ${this.getSection()}
          </div>
        </section>

        <section class="side">
          ${this.getHighlights()}
          <people-container url="/users/recommended" type="profile"></people-container>
          ${this.getInfo()}
        </section>
      `;
    }
  }

  getAuthor = () => {
    const url = this.getAttribute('url');

    // trim white spaces and convert to lowercase
    let formattedUrl = url.toLowerCase();
    return /* html */`
      <profile-wrapper name="${this.getAttribute('name')}" hash="${this.getAttribute('hash')}" you="${this._you}" replies="${this.getAttribute('replies')}"
        url="${formattedUrl}" picture="${this.getAttribute('picture')}" verified="${this.getAttribute('verified')}" posts="${this.getAttribute('posts')}"
        followers="${this.getAttribute('followers')}" following="${this.getAttribute('following')}" user-follow="${this.getAttribute('user-follow')}"
        contact='${this.getAttribute("contact")}'>
        ${this.innerHTML}
      </profile-wrapper>
    `
  }

  getSection = () => {
    return /* html */`
      <profile-section hash="${this.getAttribute('hash')}" url="${this.getAttribute('url')}" active="${this.getAttribute('tab')}" section-title="Profile" 
        posts-url="${this.getAttribute('posts-url')}" posts="${this.getAttribute('posts')}" contact='${this.getAttribute("contact")}'
        replies-url="${this.getAttribute('replies-url')}" replies="${this.getAttribute('replies')}"
        followers-url="${this.getAttribute('followers-url')}" followers="${this.getAttribute('followers')}"
        following-url="${this.getAttribute('following-url')}" following="${this.getAttribute('following')}">
      </profile-section>
    `
  }

  getHighlights = () => {
    const url = this.getAttribute('url');
  
    // trim white spaces and convert to lowercase
    let formattedUrl = url.toLowerCase();

    return /* html */`
      <highlights-container url="${formattedUrl}/stats" name="${this.getAttribute('name')}"
        followers="${this.getAttribute('followers')}" following="${this.getAttribute('following')}" 
        posts="${this.getAttribute('posts')}" replies="${this.getAttribute('replies')}">
      </highlights-container>
    `
  }

  getInfo = () => {
    return /*html*/`
      <info-container docs="/about/docs" new="/about/new"
       feedback="/about/feedback" request="/about/request" code="/about/code" donate="/about/donate" contact="/about/contact" company="https://github.com/aduki-hub">
      </info-container>
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
          width: 100%;
          justify-content: space-between;
          gap: 30px;
          min-height: 100vh;
        }

        section.main {
          /* border: 1px solid #6b7280; */
          display: flex;
          flex-flow: column;
          align-items: start;
          gap: 0;
          padding: 20px 0 0 0;
          width: calc(55% - 10px);
        }

        .body {
          display: flex;
          flex-flow: column;
          gap: 0;
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

				@media screen and (max-width: 660px) {
					:host {
            font-size: 16px;
						padding: 5px 0 0 0;
            margin: 0;
            display: flex;
            flex-flow: column;
            justify-content: start;
            gap: 0;
					}

          .top {
            display: flex;
            width: 100%;
            flex-flow: row;
            align-items: center;
            gap: 8px;
          }
          
          .tab-control {
            border-bottom: var(--border-mobile);
            margin: 5px 0 5px 0;
            position: sticky;
            top: 50px;
          }

          .actions > .action {
            cursor: default !important;
            display: flex;
            width: calc(50% - 15px);
            padding: 6px 25px;
          }

          .tab-control > ul.tab > li.tab-item,
					.action,
					a {
						cursor: default !important;
          }

          .section.main {
            display: flex;
            flex-flow: column;
            gap: 0;
            width: 100%;
          }

          section.side {
            padding: 0;
            display: none;
            width: 0%;
          }
				}
	    </style>
    `;
  }
}