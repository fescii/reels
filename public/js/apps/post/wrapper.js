export default class PostWrapper extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);
    this.noPreview = this.convertToBoolean(this.getAttribute('no-preview'));
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

  convertToBoolean = value => {
    return value === "true";
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

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
    this.setUpEvents();
  }

  setReply(feed, reply) {
    const previews = this.shadowObj.querySelector('div.previews');

    if (previews) {
      const threadButton = this.getThreadButton();
      if(feed) {
        this.setThreads(previews, threadButton);
        this.openThreads();
      } else {
        const content = this.getReply(reply);
        previews.insertAdjacentHTML('beforeend', content);
      }
    }
  }
  
  setThreads = (previews, content) => {
    // check if threads exist
    const thread = previews.querySelector('div.thread');
    if(thread) return;

    // insert the thread
    previews.insertAdjacentHTML('beforeend', content);
  }

  connectedCallback() {
    this.style.display = 'flex';
  }

  setUpEvents = () => {
    this.styleLastBlock();
    this.checkAndAddHandler();
    this.setupIntersectionObserver();
    this.openReadMore();
    this.openQuickPost()
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
    let kind = this.getAttribute('story');
    if(kind === 'quick') {
      kind = 'story';
    }
    const viewData = {
      type: 'action',
      frontend: true,
      data: {
        kind: kind,
        publish: true,
        hashes: { target: hash },
        action: 'view',
        value: 1
      }
    };

    // send the view data
    this.sendWsMessage(viewData);
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

  open = () => {
    let url = this.getAttribute('url');
    url = url.trim().toLowerCase();
    const post =  this.getFullPost();
    this.pushApp(url, post);
  }

  edit = () => {
    const body = document.querySelector('body');
    const content = this.getEdit();
    window.toBeChanged = this;
    body.insertAdjacentHTML('beforeend', content);
  }

  getEdit = () => {
    return /* html */`
      <post-options kind="${this.getAttribute('story')}" url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}"
        drafted="false" story="false" images="${this.getAttribute('images')}">
        ${this.innerHTML}
      </post-options>
    `;
  }

  // Open quick post
  openQuickPost = () => {
    // get current content
    const content = this.shadowObj.querySelector('#content')

    if(content) {
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        // Open the post
        this.open();
      })
    }
  }

  // Open threads
  openThreads = () => {
    const threadButton = this.shadowObj.querySelector('div.thread > button.thread-button');
    if(threadButton) {
      threadButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        // Open the post
        this.open();
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

  // Get lapse time
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

  openReadMore = () => {
    // Get the read more button
    const readMore = this.shadowObj.querySelector('.content .read-more');

    // Get the content
    const content = this.shadowObj.querySelector('.content');

    // Check if the read more button exists
    if (readMore && content) {
      readMore.addEventListener('click', e => {
        // prevent the default action
        e.preventDefault()

        // prevent the propagation of the event
        e.stopPropagation();

        // Prevent event from reaching any immediate nodes.
        e.stopImmediatePropagation()

        // Toggle the active class
        content.classList.remove('extra');

        // remove the read more button
        readMore.remove();
      });
    }
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
      ${this.getStyles()}
      ${this.getBody()}
    `;
  }

  getBody() {
    return /* html */`
      ${this.getHeader()}
      ${this.getContent()}
      ${this.getImages()}
      ${this.getOn()}
      ${this.getFooter()}
      <div class="previews">
        ${this.getReply(this.getAttribute('kind'))}
      </div>
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

  getContent = () => {
    const mql = window.matchMedia('(max-width: 660px)');
    const content = this.innerHTML;

    // Convert content to str and check length
    const contentStr = content.replace(/<[^>]*>/g, '');
    const contentLength = contentStr.length;

    let chars = 300;

    // Check if its a mobile view
    if (mql.matches) {
      chars = 200;
    }

    // Check if content length is greater than 300
    if (contentLength > 300) {
      return /*html*/`
        <div class="content extra ${chars <= 200 ? 'feed' : ''}" id="content">
          ${content}
          <div class="read-more">
            <span class="action">view more</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
          </div>
        </div>
      `
    }
    else {
      return /*html*/`
        <div class="content" id="content">
          ${content}
        </div>
      `
    }
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

  getPreview = url => {
    return /*html*/`
      <preview-popup url="${url}"></preview-popup> 
    `
  }

  textToBool = text => {
    return text === 'true';
  }

  getReply = kind => {
    if(this.noPreview) return '';
    const feed = this.textToBool(this.getAttribute('feed'))
    if (kind === 'reply') {
      const parent = this.getAttribute('parent');
      let url = `/p/${parent}`;
      return /*html*/`
        <preview-post feed="${feed}" url="${url}" hash="${parent}" preview="quick"></preview-post>
      `
    } else return '';
  }

  getFooter = () => {
    const author = this.getAttribute('author-hash');
    const you = author === this.user;
    const preview = this.noPreview ? 'false' : 'true';
    return /*html*/`
      <action-wrapper you="${you}" preview="${preview}" full="false" kind="${this.getAttribute('story')}" reload="false" likes="${this.getAttribute('likes')}" 
        replies="${this.getAttribute('replies')}" liked="${this.getAttribute('liked')}" wrapper="false" images="${this.getAttribute('images')}"
        hash="${this.getAttribute('hash')}" views="${this.getAttribute('views')}"  url="${this.getAttribute('url')}" summary="Post by - ${this.getAttribute('author-name')}"
        time="${this.getAttribute('time')}" author-hash="${this.getAttribute('author-hash')}">
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
    // create a paragraph with the \n replaced with <br> if there are more than one \n back to back replace them with one <br>
    if (bio.includes('\n')) bio = bio.replace(/\n+/g, '<br>');
    return /* html */`
			<hover-author url="${url}" you="${this.getAttribute('author-you')}" hash="${this.getAttribute('author-hash')}"
        picture="${this.getAttribute('author-img')}" name="${this.getAttribute('author-name')}" contact='${this.getAttribute("author-contact")}'
        posts="${this.getAttribute('author-posts')}" replies="${this.getAttribute('author-replies')}"
        followers="${this.getAttribute('author-followers')}" following="${this.getAttribute('author-following')}" user-follow="${this.getAttribute('author-follow')}"
        verified="${this.getAttribute('author-verified')}">
        ${bio}
      </hover-author>
		`
  }

  getFullPost = () => {
    const kind = this.getAttribute('kind');
    const images = this.getAttribute('images');
    return /* html */`
      <app-post kind="${kind}" tab="replies" url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}" parent="${this.getAttribute('parent')}"
        likes="${this.getAttribute('likes')}" replies="${this.getAttribute('replies')}" preview="full"
        replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}" images='${images}'
        liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}" time="${this.getAttribute('time')}"
        author-posts="${this.getAttribute('author-posts')}" author-replies="${this.getAttribute('author-replies')}" author-contact='${this.getAttribute("author-contact")}'
        author-you="${this.getAttribute('author-you')}" author-hash="${this.getAttribute('author-hash')}" author-url="${this.getAttribute('author-url')}"
        author-img="${this.getAttribute('author-img')}" author-verified="${this.getAttribute('author-verified')}" author-name="${this.getAttribute('author-name')}"
        author-followers="${this.getAttribute('author-followers')}" author-following="${this.getAttribute('author-following')}" author-follow="${this.getAttribute('author-follow')}"
        author-bio="${this.getAttribute('author-bio')}">
        ${this.innerHTML}
      </app-post>
    `
  }

  getImages = () => {
    const images = this.getAttribute('images');
    if(!images || images === 'null') return '';

    const imageArray = images.split(',');

    // if length is greater is less than 1
    if(imageArray.length < 1) return '';

    // return
    return /* html */`
      <images-wrapper images="${images}"></images-wrapper>
    `
  }

  getThreadButton = () => {
    return /* html */`
      <div class="thread">
        <span class="thread-arrow"></span>
        <button class="thread-button">
          <span class="thread-text">View all</span>
        </button>
      </div>
    `
  }

  getFullCss = () => {
    if(this.noPreview) {
      return "padding: 7px 0 5px;"
    } else {
      if(this.getAttribute('story') === 'reply') {
        return "padding: 7px 0 15px;"
      } else {
        return "padding: 7px 0 5px;"
      }
    }
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
          ${this.getFullCss()}
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        .meta {
          width: 100%;
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
          width: 100%;
          display: flex;
          cursor: pointer;
          flex-flow: column;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          line-height: 1.4;
          gap: 0;
          margin: 0;
          padding: 0;
        }

        .content.extra {
          max-height: 200px;
          overflow: hidden;
          position: relative;
        }

        .content.extra.feed {
          max-height: 150px;
        }

        .content.extra .read-more {
          position: absolute;
          bottom: -5px;
          right: 0;
          left: 0;
          width: 100%;
          padding: 5px 0;
          display: flex;
          align-items: end;
          justify-content: center;
          min-height: 80px;
          gap: 3px;
          cursor: pointer;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
          color: var(--gray-color);
          background: var(--fade-linear-gradient);
        }

        .content.extra .read-more svg {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin: 0 0 2px 0;
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
          margin: 0 0 5px;
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

        .content blockquote p {
          margin: 0;
        }

        .content blockquote * {
          margin: 0;
        }

        .content hr {
          border: none;
          background-color: var(--gray-color);
          height: 1px;
          margin: 10px 0;
        }

        .content ul,
        .content ol {
          margin: 5px 0 15px 20px;
          padding: 0 0 0 15px;
          color: inherit;
        }

        .content ul li,
        .content ol li {
          padding: 5px 0;
        }

        .content code {
          background: var(--gray-background);
          padding: 0 5px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          border-radius: 5px;
        }

        .content img {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          border-radius: 5px;
        }

        .content figure {
          max-width: 100% !important;
          height: auto;
          width: max-content;
          padding: 0;
          max-width: 100%;
          display: block;
          margin-block-start: 5px;
          margin-block-end: 5px;
          margin-inline-start: 0 !important;
          margin-inline-end: 0 !important;
        }

        div.previews {
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
          margin: 0;
          padding: 0;
        }

        div.thread {
          width: 100%;
          display: flex;
          position: relative;
          gap: 0;
          margin: 0;
          padding: 8px 0 5px 19px;
        }

        div.thread > button.thread-button {
          width: max-content;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-size: 0.9rem;
          background: none;
          font-family: var(--font-main), sans-serif;
          font-weight: 500;
          color: var(--anchor-color);
          border: none;
          border-radius: 10px;
          cursor: pointer
        }

        div.thread > .thread-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 3px;
          width: 1.8px;
          height: calc(100% - 10px);
          background: var(--action-linear);
          border-radius: 5px;
        }

        @media screen and (max-width:660px) {
          :host {
            font-size: 16px;
            width: 100%;
            border-bottom: var(--border);
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          .meta a.reply-link,
          .meta div.author-name > a,
          a,
          .stats > .stat {
            cursor: default !important;
          }

          .content a {
            cursor: default !important;
          }

          a,
          .content.extra .read-more,
          .replying-to,
          .content,
          div.thread > button.thread-button,
          span.action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}