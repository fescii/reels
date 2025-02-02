export default class PollPost extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);

    this.viewTimer = null;
    this.hasBeenViewed = false;
    this.observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.5, // Consider the post visible when 50% is in view
    };
    this.app = window.app;
    this.api = this.app.api;
    this.user = window.hash;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
    this.setUpEvents();
  }

  // observe the attributes
  static get observedAttributes() {
    return ['reload', 'images'];
  }

  // listen for changes in the attributes
  attributeChangedCallback(name, oldValue, newValue) {
    // check if old value is not equal to new value
    if (name === 'reload') {
      this.render();
    } else if (name === 'images') {
      this.render();
    }
  }

  connectedCallback() {
    this.style.display = 'flex';
  }

  setUpEvents = () => {
    this.styleLastBlock();
    this.checkAndAddHandler();
    this.setupIntersectionObserver();
    this.openPollPost();
    this.openUrl();
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
    if (window.wss) {
      window.wss.removeMessageHandler(this.boundHandleWsMessage);
    }

    if (this.observer) {
      this.observer.disconnect();
    }
    this.clearViewTimer();
  }

  handleWsMessage = message => {
    // Handle the message in this component
    // console.log('Message received in component:', message);
    const data = message.data;

    if (message.type !== 'action') return;

    const user = data?.user;
    const userHash = window.hash;

    const author = this.shadowObj.querySelector('hover-author');
    const actionWrapper = this.shadowObj.querySelector('action-wrapper');
    const voteEl = this.shadowObj.querySelector('votes-wrapper');

    const hash = this.getAttribute('hash').toUpperCase();
    const authorHash = this.getAttribute('author-hash').toUpperCase();

    const target = data.hashes.target;

    if (data.action === 'connect' && data.kind === 'user') {
      this.handleConnectAction(data, author, userHash, authorHash);
    } else if (target === hash) {
      if (data.action === 'like') {
        if(user !== null && user === userHash) {
          return;
        }
        // get likes parsed to number
        const likes = (this.parseToNumber(this.getAttribute('likes')) + data.value);
        // update likes
        this.setAttribute('likes', likes);
        // update likes in the action wrapper
        actionWrapper.setAttribute('likes', likes);
        actionWrapper.setAttribute('reload', 'true');
      } 
      else if(data.action === 'reply'){
        const replies = this.parseToNumber(this.getAttribute('replies')) + data.value;
        this.setAttribute('replies', replies);
        actionWrapper.setAttribute('replies', replies);
        actionWrapper.setAttribute('reload', 'true');
      } 
      else if(data.action === 'view') {
        const views = this.parseToNumber(this.getAttribute('views')) + data.value;
        this.setAttribute('views', views);
        actionWrapper.setAttribute('views', views);
        actionWrapper.setAttribute('reload', 'true');
      } else if (data.action === 'vote') {
        if(user !== null && user === userHash) {
          return;
        }
        // update vote
        voteEl.setAttribute('vote', data.value);
      }
    }
  }

  sendWsMessage(data) {
    if (window.wss) {
      window.wss.sendMessage(data);
    } else {
      console.warn('WebSocket connection not available. view information not sent.');
    }
  }

  handleConnectAction = (data, author, userHash, authorHash) => {
    const to = data.hashes.to;
    if(to === authorHash) {
      const followers = this.parseToNumber(this.getAttribute('author-followers')) + data.value;
      this.setAttribute('author-followers', followers)
      this.updateFollowers(author, this.getAttribute('author-followers'));

      if (data.hashes.from === userHash) {
        const value = data.value === 1 ? 'true' : 'false';
  
        // update user-follow/auth-follow attribute
        this.setAttribute('author-follow', value);
        author.setAttribute('user-follow', value);
      }

      author.setAttribute('reload', 'true');
    }
  }

  updateFollowers = (element, value) => {
    element.setAttribute('followers', value);
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.startViewTimer();
        } else {
          this.clearViewTimer();
        }
      });
    }, this.observerOptions);

    this.observer.observe(this);
  }

  startViewTimer() {
    if (this.hasBeenViewed) return;

    this.viewTimer = setTimeout(() => {
      this.sendViewData();
      this.hasBeenViewed = true;
    }, 5000); // 5 seconds
  }

  clearViewTimer() {
    if (this.viewTimer) {
      clearTimeout(this.viewTimer);
      this.viewTimer = null;
    }
  }

  sendViewData() {
    const authorHash = this.getAttribute('author-hash').toUpperCase();
    // check if the author is the user
    if (authorHash === window.hash) return;

    const hash = this.getAttribute('hash').toUpperCase();
    const viewData = {
      type: 'action',
      frontend: true,
      data: {
        kind: 'story',
        publish: true,
        hashes: { target: hash },
        action: 'view',
        value: 1
      }
    };

    // send the view data
    this.sendWsMessage(viewData);
  }

  openPollPost = () => {
    // get url
    let url = this.getAttribute('url');
    url = url.trim().toLowerCase();
    // get current content
    const content = this.shadowObj.querySelector('#content')
    if(content) {
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Get full post
        const post =  this.getFullPost();

        // push the post to the app
        this.pushApp(url, post);
      })
    }
  }

  pushApp = (url, content) => {
    this.app.push(url, { kind: "app", name: 'story', html: content }, url);
    // navigate to the content
    this.navigateTo(content);
  }

  navigateTo = content => {
    // navigate to the content
    this.app.navigate(content);
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

  edit = () => {
    // Get the body element
    const body = document.querySelector('body');

    // Get the content of the topic page
    const content = this.getEdit();
    // set to be deleted:
    window.toBeChanged = this;
    // insert the content into the body
    body.insertAdjacentHTML('beforeend', content);
  }

  getEdit = () => {
    // Show Post Page Here
    return /* html */`
      <post-options kind="${this.getAttribute('story')}" url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}"
        drafted="false" story="false" images="${this.getAttribute('images')}">
        ${this.innerHTML}
      </post-options>
    `;
  }

  // style the last paragraph or the last block element in content
  styleLastBlock = () => {
    const content = this.shadowObj.querySelector('.content#content');
    if (!content) return;

    const lastBlock = content.lastElementChild;
    if (!lastBlock) return;

    // style the last block
    lastBlock.style.setProperty('padding', '0 0 0');
    lastBlock.style.setProperty('margin', '0 0 0');
  }

  formatNumber = n => {
    if (n < 1000) return n.toString();
    if (n < 10000) return `${(n / 1000).toFixed(2)}k`;
    if (n < 100000) return `${(n / 1000).toFixed(1)}k`;
    if (n < 1000000) return `${(n / 1000).toFixed(0)}k`;
    if (n < 10000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n < 100000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n < 1000000000) return `${(n / 1000000).toFixed(0)}M`;
    return "1B+";
  }

  parseToNumber = str => {
    // Try parsing the string to an integer
    const num = parseInt(str);

    // Check if parsing was successful
    if (!isNaN(num)) {
      return num;
    } else {
      return 0;
    }
  }

  numberWithCommas = x => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  getLapseTime = isoDateStr => {
    const dateIso = new Date(isoDateStr); // ISO strings with timezone are automatically handled
    let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert posted time to the current timezone
    const date = new Date(dateIso.toLocaleString('en-US', { timeZone: userTimezone }));

    // Get the current time
    const currentTime = new Date();

    // Get the difference in time
    const timeDifference = currentTime - date;

    // Get the seconds
    const seconds = timeDifference / 1000;

    // check if seconds is less than 86400 and dates are equal: Today, 11:30 AM
    if (seconds < 86400 && date.getDate() === currentTime.getDate()) {
      return `
        Today • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    } else if (seconds < 86400 && date.getDate() !== currentTime.getDate()) {
      return `
        Yesterday • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }

    // check if seconds is less than 604800: Friday, 11:30 AM
    if (seconds <= 604800) {
      return `
        ${date.toLocaleDateString('en-US', { weekday: 'short' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }

    // Check if the date is in the current year and seconds is less than 31536000: Dec 12, 11:30 AM
    if (seconds < 31536000 && date.getFullYear() === currentTime.getFullYear()) {
      return `
        ${date.toLocaleDateString('en-US', { weekday: 'short' })} • ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    } else {
      return `
        ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }
  }

  openUrl = () => {
    // get all the links
    const links = this.shadowObj.querySelectorAll('div#content a');
    const body = document.querySelector('body');

    // loop through the links
    if (!links) return;

    links.forEach(link => {
      // add event listener to the link
      link.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        // get the url
        const url = link.getAttribute('href');

        // link pop up
        let linkPopUp = `<url-popup url="${url}"></url-popup>`

        // open the popup
        body.insertAdjacentHTML('beforeend', linkPopUp);
      });
    });
  }

  getTemplate() {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody() {
    return `
      ${this.getHeader()}
      ${this.getContent()}
      ${this.getPoll()}
      ${this.getOn()}
      ${this.getFooter()}
    `;
  }

  getHeader = () => {
    return /*html*/`
      <div class="meta top-meta">
        ${this.getAuthorHover()}
      </div>
    `
  }

  getOn = () => {
    return /*html*/`
      <div class="meta bottom-meta">
        <time class="time" datetime="${this.getAttribute('time')}">
          ${this.getLapseTime(this.getAttribute('time'))}
        </time>
      </div>
    `
  }

  getPoll = () =>  {
    return /*html*/`
      <votes-wrapper reload="false" votes="${this.getAttribute('votes')}" selected="${this.getAttribute('selected')}"
        hash="${this.getAttribute('hash')}"
        end-time="${this.getAttribute('end-time')}" voted="${this.getAttribute('voted')}" options="${this.getAttribute('options')}">
      </votes-wrapper>
    `
  }

  getContent = () => {
    return `
      <div class="content" id="content">
        ${this.innerHTML}
      </div>
    `
  }

  getFooter = () => {
    const author = this.getAttribute('author-hash');
    const you = author === this.user;
    return /*html*/`
      <action-wrapper you="${you}" full="false" kind="story" reload="false" likes="${this.getAttribute('likes')}" 
        replies="${this.getAttribute('replies')}" liked="${this.getAttribute('liked')}" wrapper="false"
        hash="${this.getAttribute('hash')}" views="${this.getAttribute('views')}" url="${this.getAttribute('url')}" summary="Post by - ${this.getAttribute('author-name')}"
        preview-title="" time="${this.getAttribute('time')}" images="${this.getAttribute('images')}" 
        author-hash="${this.getAttribute('author-hash')}">
        ${this.getHTML()}
      </action-wrapper>
    `
  }

  getHTML = () => {
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body.innerHTML;
  }

  getAuthorHover = () => {
    let url = this.getAttribute('author-url');
    url = url.trim().toLowerCase();
    let bio = this.getAttribute('author-bio') || 'This author has not provided a bio yet.';
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return /* html */`
			<hover-author url="${url}" you="${this.getAttribute('author-you')}" hash="${this.getAttribute('author-hash')}"
        picture="${this.getAttribute('author-img')}" name="${this.getAttribute('author-name')}" contact='${this.getAttribute("author-contact")}'
        stories="${this.getAttribute('author-stories')}" replies="${this.getAttribute('author-replies')}"
        followers="${this.getAttribute('author-followers')}" following="${this.getAttribute('author-following')}" user-follow="${this.getAttribute('author-follow')}"
        verified="${this.getAttribute('author-verified')}" bio="${bio}">
      </hover-author>
		`
  }

  getFullPost = () => {
    return /* html */`
      <app-post story="poll" tab="replies" url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}"
        likes="${this.getAttribute('likes')}" replies="${this.getAttribute('replies')}"
        replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}"
        options='${this.getAttribute("options")}' voted="${this.getAttribute('voted')}" selected="${this.getAttribute('selected')}"
        end-time="${this.getAttribute('end-time')}" votes="${this.getAttribute('votes')}"
        liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}" time="${this.getAttribute('time')}"
        author-you="${this.getAttribute('author-you')}" author-stories="${this.getAttribute('author-stories')}" author-replies="${this.getAttribute('author-replies')}"
        author-hash="${this.getAttribute('author-hash')}" author-url="${this.getAttribute('author-url')}" author-contact='${this.getAttribute("author-contact")}'
        author-img="${this.getAttribute('author-img')}" author-verified="${this.getAttribute('author-verified')}" author-name="${this.getAttribute('author-name')}"
        author-followers="${this.getAttribute('author-followers')}" author-following="${this.getAttribute('author-following')}" author-follow="${this.getAttribute('author-follow')}"
        author-bio="${this.getAttribute('author-bio')}">
        ${this.innerHTML}
      </app-post>
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
          -webkit-appearance: none;
        }

        a {
          text-decoration: none;
        }

        :host {
          font-size: 16px;
          border-bottom: var(--border);
          font-family: var(--font-main), sans-serif;
          padding: 10px 0 8px;
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        .meta {
          height: max-content;
          display: flex;
          position: relative;
          color: var(--gray-color);
          align-items: center;
          font-family: var(--font-mono),monospace;
          gap: 5px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .meta > span.sp {
          margin: 1px 0 0 0;
        }

        .meta > span.by {
          font-weight: 500;
          font-size: 0.93rem;
          margin: 0 0 1px 1px;
        }

        .meta > time.time {
          font-family: var(--font-read), sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          margin: 1px 0 0 0;
        }

        .meta a.link {
          text-decoration: none;
          color: transparent;
          background-image: var(--action-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .meta  a.author-link {
          text-decoration: none;
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .meta.top-meta {
          width: 100%;
        }

        .meta.bottom-meta {
          margin:  0;
          padding: 5px 0 0;
          display: flex;
          position: relative;
          color: var(--gray-color);
          align-items: center;
          font-family: var(--font-text), sans-serif;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
        }

        .meta.bottom-meta > .sp {
          font-size: 1.25rem;
          color: var(--gray-color);
          font-weight: 400;
        }

        .content {
          display: flex;
          cursor: pointer;
          flex-flow: column;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
          line-height: 1.4;
          gap: 0;
          margin: 0;
          padding: 0;
        }

        .content h6,
        .content h5,
        .content h4,
        .content h3,
        .content h1 {
          padding: 0;
          font-size: 1.3rem !important;
          color: var(--title-color);
          font-weight: 500;
          line-height: 1.5;
          margin: 5px 0;
        }

        .content p {
          font-size: 1rem;
          margin: 5px 0;
          line-height: 1.4;
        }

        .content a {
          text-decoration: none;
          cursor: pointer;
          color: var(--anchor-color) !important;
        }

        .content a:hover {
          text-decoration: underline;
        }

        .content blockquote {
          margin: 2px 0;
          padding: 5px 0;
          font-style: italic;
          background: var(--background);
          color: var(--text-color);
          font-weight: 400;
          line-height: 1.4;
        }

        .content blockquote p {
          margin: 0;
        }

        .content blockquote * {
          margin: 0;
        }

        .content hr {
          border: none;
          background-color: var(--text-color);
          height: 1px;
          margin: 10px 0;
        }

        .content code {
          background: var(--gray-background);
          padding: 0 5px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          border-radius: 5px;
        }

        .content b,
        .content strong {
          font-weight: 700;
          line-height: 1.4;

        }

        .content ul,
        .content ol {
          margin: 5px 0 15px 20px;
          padding: 0 0 0 15px;
          color: inherit;
          line-height: 1.4;
        }

        .content ul li,
        .content ol li {
          margin: 6px 0;
          padding: 0;
          color: inherit;
        }

        @media screen and (max-width: 660px) {
          :host {
            font-size: 16px;
            border-bottom: var(--border);
            font-family: var(--font-main), sans-serif;
            margin: 0;
            width: 100%;
            display: flex;
            flex-flow: column;
            gap: 0;
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          #content,
          .content {
            cursor: unset;
          }

          .meta a.reply-link,
          .meta div.author-name > a,
          a,{
            cursor: default !important;
          }

          .content a {
            cursor: default !important;
          }

          a,
          span.stat,
          span.action,
          .content , #content,{
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}