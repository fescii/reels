export default class StoryPost extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this._data = this.getSummaryAndWords();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.style.display = 'flex';

    // Check and add handler
    this.checkAndAddHandler();

    // get url
    let url = this.getAttribute('url');

    url = url.trim().toLowerCase();
    // Open Full post
    this.openFullPost(url);

    this.openHighlights(document.body)

    // Open Url
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
  }

  handleWsMessage = message => {
    // Handle the message in this component
    // console.log('Message received in component:', message);
    const data = message.data;

    if (message.type !== 'action') return;

    const user = data?.user;
    const userHash = window.hash;

    const author = this.shadowObj.querySelector('hover-author');

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
      } 
      else if(data.action === 'reply'){
        const replies = this.parseToNumber(this.getAttribute('replies')) + data.value;
        this.setAttribute('replies', replies);
      } 
      else if(data.action === 'view') {
        const views = this.parseToNumber(this.getAttribute('views')) + data.value;
        this.setAttribute('views', views);
      }
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

  sendWsMessage(data) {
    window.wss.sendMessage(data);
  }

  updateFollowers = (element, value) => {
    element.setAttribute('followers', value);
  }

  getSummaryAndWords = () => {
    const mql = window.matchMedia('(max-width: 660px)');
    // get this content
    let content = this.innerHTML.toString();

    // remove all html tags and classes and extra spaces and tabs
    content = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    let summary = content.substring(0, 200);

    if (mql.matches) {
      summary = content.substring(0, 150);
    }

    // return the summary: first 200 characters
    return {
      summary: `${summary}...`,
      words: content.split(' ').length
    };
  }

  openFullPost = url => {
    // get h3 > a.link
    const content = this.shadowObj.querySelector('div.content');
    const title = this.shadowObj.querySelector('h3.title > a.link');
    const openFull = this.shadowObj.querySelector('.actions > .action.view');

    if(content && openFull) {
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        // Get full post
        const post =  this.getFullPost();
  
        // push the post to the app
        this.pushApp(url, post);
      })

      openFull.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        // Get full post
        const post =  this.getFullPost();
        // push the post to the app
        this.pushApp(url, post);
      })

      title.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();

        // Get full post
        const post =  this.getFullPost();
        // push the post to the app
        this.pushApp(url, post);
      });
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

  openHighlights = body => {
    // Get the stats action and subscribe action
    const statsBtn = this.shadowObj.querySelector('.actions > .action.stats');

    // add event listener to the stats action
    if (statsBtn) {
      statsBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        // Open the highlights popup
        body.insertAdjacentHTML('beforeend', this.getHighlights());
      });
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

    // Check if seconds is less than 60: return Just now
    if (seconds < 60) {
      return 'Just now';
    }

    // check if seconds is less than 86400 and dates are equal: Today, 11:30 AM
    if (seconds < 86400 && date.getDate() === currentTime.getDate()) {
      return `
        <span class="name">Today,</span> ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    } else if (seconds < 86400 && date.getDate() !== currentTime.getDate()) {
      return `
        <span class="name">Yesterday,</span> ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }

    // check if seconds is less than 604800: Friday, 11:30 AM
    if (seconds <= 604800) {
      return `
        <span class="name">${date.toLocaleDateString('en-US', { weekday: 'long' })},</span> ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }

    // Check if the date is in the current year and seconds is less than 31536000: Dec 12, 11:30 AM
    if (seconds < 31536000 && date.getFullYear() === currentTime.getFullYear()) {
      return `
        <span class="name">${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })},</span> ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    } else if(seconds < 31536000 && date.getFullYear() !== currentTime.getFullYear()) {
      return `
        <span class="name">${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
      `
    } else {
      return `
        <span class="name">${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
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

  calculateReadTime = () => {
    // get the number of words
    const words = this._data.words;

    // calculate the read time
    const readTime = Math.ceil(words / 150);

    // return the read time
    return readTime;
  }

  getContent = () => {
    // get url
    let url = this.getAttribute('url');
    url = url.trim().toLowerCase();
    return /*html*/`
      <h3 class="title">
        <a href="${url}" class="link">${this.getAttribute('story-title')}</a>
      </h3>
      <div class="content" id="content">
        ${this.getSummery()}
      </div>
		`;
  }

  getImages = () => {
    const imagesText = this.getAttribute('images');
    const text = this.innerHTML.toString();

    const images = this.allImages(imagesText, text);

    // if length is greater is less than 1
    if(images.length < 1) return '';

    // return
    return /* html */`
      <images-wrapper images="${images}"></images-wrapper>
    `
  }

  allImages = (imgs, text) => {
    let images = this.getImagesArray(imgs);

    // find images in the text
    const textImages = this.findImages(text);

    // if images is null return images; else concat the images
    if (!textImages) {
      return images;
    } else {
      // push the text images to the images array
      images.push(...textImages);

      // return filtered images, remove empty strings, and less than 5 in length, and return the images
      return images.filter(img => img.length > 5); 
    }
  }

  findImages = text => {
    // Updated regex to handle various attributes and nested tags
    const imgRegex = /<img\s+(?:[^>]*?\s+)?src\s*=\s*(["'])(.*?)\1/gi;
    const matches = [];
    let match;
  
    // Loop through all matches
    while ((match = imgRegex.exec(text)) !== null) {
      matches.push(match[2]);  // match[2] contains the URL
    }
  
    // Return array of src values or null if no matches found
    return matches.length > 0 ? matches : null;
  }
  
  getImagesArray = images => {
    // if images is null return an empty array
    if (!images) return [];

    // split the images by comma, filter out empty strings, less than in length, and return the images
    return images.split(',').filter(img => img.length > 5);
  }

  getSummery = () => {
    const summary = this._data.summary;

    return /*html*/`
      <div class="summary extra" id="summary">
        <p>${summary}</p>
        <div class="read-more">
        </div>
      </div>
    `
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

  getBody() {
    return `
      ${this.getHeader()}
      ${this.getContent()}
      ${this.getImages()}
      ${this.getOn()}
      ${this.getActions()}
    `;
  }

  getActions = () => {
    const views = this.parseToNumber(this.getAttribute('views'))
    return /*html*/`
      <div class="actions">
        <a href="${this.getAttribute('url')}" class="action view" id="view-action">view</a>
        <span class="action stats" id="close-stats">stats</span>
        <span class="action read plain">
          <span class="no">${this.calculateReadTime()}</span> <span class="text">min read</span>
        </span>
        <span class="action views plain">
          <span class="no">${this.formatNumber(views)}</span> <span class="text">views</span>
        </span>
      </div>
    `
  }

  getCover = () => {
    const images = this.getAttribute('images');
    if (images && images !== 'null') {
      return images.split(',')[0];
    } else {
      return this.findFirstImageSrc(this.innerHTML)
    }
  }

  findFirstImageSrc = text => {
    const imgRegex = /<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/i;
    const match = text.match(imgRegex);
    return match ? match[1] : null;
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
    const images = this.getAttribute('images');
    return /* html */`
      <app-story view="true" story="story" tab="replies" hash="${this.getAttribute('hash')}"  url="${this.getAttribute('url')}" topics="${this.getAttribute('topics')}" 
        story-title="${this.getAttribute('story-title')}" time="${this.getAttribute('time')}" images='${images}'
        replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}"
        likes="${this.getAttribute('likes')}" replies="${this.getAttribute('replies')}" liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}"
        author-you="${this.getAttribute('author-you')}"
        author-stories="${this.getAttribute('author-stories')}" author-replies="${this.getAttribute('author-replies')}"
        author-hash="${this.getAttribute('author-hash')}" author-url="${this.getAttribute('author-url')}" author-contact='${this.getAttribute("author-contact")}'
        author-img="${this.getAttribute('author-img')}" author-verified="${this.getAttribute('author-verified')}" author-name="${this.getAttribute('author-name')}"
        author-followers="${this.getAttribute('author-followers')}" author-following="${this.getAttribute('author-following')}" author-follow="${this.getAttribute('author-follow')}"
        author-bio="${this.getAttribute('author-bio')}">
        ${this.innerHTML}
      </app-story>
    `
  }

  getHTML = () => {
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body.innerHTML;
  }

  getHighlights = () => {
    return /* html */`
      <views-popup name="post"likes="${this.getAttribute('likes')}" liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}"
        replies="${this.getAttribute('replies')}">
      </views-popup>
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
          border-bottom: var(--border);
          font-family: var(--font-main), sans-serif;
          padding: 10px 0 12px;
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        .read-time {
          color: var(--gray-color);
          font-size: 0.95rem;
          font-family: var(--font-main), sans-serif;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 0 0 0;
        }

        .read-time > a.read-full {
          text-decoration: none;
          color: var(--gray-color);
          font-family: var(--font-main),sans-serif;
          border: var(--border);
          font-weight: 500;
          padding: 2.5px 5px 3px 12px;
          border-radius: 10px;
          font-size: 0.93rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .read-time .text .time {
          font-family: var(--font-main), sans-serif;
        }

        .read-time .views {
          font-weight: 500;
        }

        .read-time .views .views-no {
          font-family: var(--font-main), sans-serif;
          font-size: 0.8rem;
        }

        .read-time > span.sp {
          display: inline-block;
          margin: 0 0 -2px;
        }

        .content {
          display: flex;
          position: relative;
          cursor: pointer;
          flex-flow: column;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
          line-height: 1.4;
          gap: 0;
          margin: 0;
          padding: 0;
        }

        .content .read-more {
          position: absolute;
          bottom: -5px;
          right: 0;
          left: 0;
          width: 100%;
          padding: 5px 0;
          display: none;
          align-items: end;
          justify-content: center;
          min-height: 60px;
          gap: 3px;
          cursor: pointer;
          font-weight: 500;
          font-family: var(--font-text), sans-serif;
          color: var(--gray-color);
          background: var(--fade-linear-gradient);
        }

        .content .read-more svg {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin: 0 0 2px 0;
        }

        .content p {
          margin: 0 0 5px 0;
          font-size: 1rem;
          padding: 0;
          line-height: 1.4;
          font-family: var(--font-main), sans-serif;
        }

        .content p:last-of-type {
          margin: 0;
        }

        h3.title {
          color: var(--title-color);
          font-family: var(--font-main), sans-serif;
          margin: 2px 0 7px 0;
          padding: 0;
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.2;
        }

        h3.title > a {
          text-decoration: none;
          color: inherit;
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
          font-size: 0.95rem;
          margin: 0 0 1px 0;
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
          padding: 5px 0 0;
        }

        .meta.bottom-meta > time.time > span.name {
          font-weight: 500;
          /*font-size: 0.9rem;*/
          margin: 0;
          /* font-family: var(--font-read), sans-serif; */
          text-transform: uppercase;
        }

        .actions {
          display: flex;
          font-family: var(--font-main), sans-serif;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 15px;
          margin: 5px 0 3px;
        }
        
        .actions > .action {
          border: var(--border-button);
          text-decoration: none;
          color: var(--gray-color);
          font-size: 0.95rem;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: lowercase;
          justify-content: center;
          padding: 2.5px 10px 2.5px;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        .actions > .action.stats {
          cursor: pointer;
        }

        .actions > .action.plain {
          padding: 0;
          font-weight: 500;
          pointer-events: none;
          font-family: var(--font-text), sans-serif;
          color: var(--gray-color);
          border: none;
          background: none;
        }
        
        .actions > .action.plain > span.no {
          font-family: var(--font-main), sans-serif;
          font-size: 0.9rem;
          color: var(--text-color);
        }

        .actions > .action.plain > span.text {
          display: inline-block;
          padding: 0 0 0 3px;
        }

        @media screen and (max-width:660px) {
          :host {
            font-size: 16px;
            border-bottom: var(--border);
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          .meta a.reply-link,
          .meta div.author-name > a,
          a,
          .content .read-more,
          .content,
          .stats > .stat {
            cursor: default !important;
          }

          .read-time > a.read-full {
            border: var(--border-mobile);
          }
    
          h3.title {
            font-weight: 600;
            line-height: 1.2;
          }

          h3.title > a {
            text-decoration: none;
            color: inherit;
          }

          .actions > .action,
          a {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}