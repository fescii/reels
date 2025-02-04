export default class AppStory extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this._data = this.getSummaryAndWords();
    this.setTitle(this.getAttribute('story-title'));
    this.viewed = false;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);
    this.mql = window.matchMedia('(max-width: 770px)');
    this.app = window.app;
    this.topics = this.getTopics();
    this._content = this.innerHTML
    this.user = window.hash;
    this.render();
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

  setTitle = title => {
    // update title of the document
    document.title = `Story | ${title}`;
  }

  getSummaryAndWords = () => {
    const mql = window.matchMedia('(max-width: 660px)');
    // get this content
    let content = this.innerHTML.toString();

    // remove all html tags and classes and extra spaces and tabs
    content = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

    let summary = content.substring(0, 500);

    if (mql.matches) {
      summary = content.substring(0, 250);
    }

    // return the summary: first 200 characters
    return {
      summary: `${summary}...`,
      words: content.split(' ').length
    };
  }

  getTopics = () => {
    // get the topics
    let topics = this.getAttribute('topics');
    return topics ? topics.split(',') : ['story'];
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  addReply = reply => {
    const repliesSection = this.shadowObj.querySelector('replies-section');
    if (repliesSection) {
      repliesSection.addReply(reply);
    }
  }

  connectedCallback() {
    this.enableScroll();
    this.style.display='flex';
    this.app.hideNav();
    this.openUrl();
    this.checkAndAddHandler();
    this.watchMediaQuery(this.mql);
    this.activateView();
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

    const user = data?.user;
    const userHash = window.hash;

    const hash = this.getAttribute('hash').toUpperCase();
    const authorHash = this.getAttribute('author-hash').toUpperCase();

    const author = this.shadowObj.querySelector('author-wrapper');
    let wrapper = this.shadowObj.querySelector('action-wrapper');

    const target = data.hashes.target;

    // handle connect action
    if (data.action === 'connect' && data.kind === 'user') {
      this.handleConnectAction(data, author, userHash, authorHash);
    }
    else if(hash === target) {
      if (data.action === 'reply') {
        const replies = this.parseToNumber(this.getAttribute('replies')) + data.value;
        this.updateReplies(wrapper, replies);
      }
      else if(data.action === 'view') {
        const views = this.parseToNumber(this.getAttribute('views')) + data.value;
        this.updateViews(wrapper, views);
      }
      else if (data.action === 'like') {
        if(user !== null && user === userHash) {
          return;
        }
        // get likes parsed to number
        const likes = (this.parseToNumber(this.getAttribute('likes')) + data.value);
        // update likes
        this.updateLikes(wrapper, likes);
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
      this.setAttribute('author-followers', followers);
      this.updateFollowers(author, followers);

      if (data.hashes.from === userHash) {
        const value = data.value === 1 ? 'true' : 'false';
        // update user-follow/auth-follow attribute
        this.setAttribute('author-follow', value);
        if(author) {
          author.setAttribute('user-follow', value);
        }
      }

      if(author) {
        author.setAttribute('reload', 'true');
      }
    }
  }

  updateLikes = (element, value) => {
    // update likes in the element and this element
    this.setAttribute('likes', value);
    element.setAttribute('likes', value);
    element.setAttribute('reload', 'true');
  }

  updateViews = (element, value) => {
    // update views in the element and this element
    this.setAttribute('views', value);
    element.setAttribute('views', value);
    element.setAttribute('reload', 'true');
  }

  updateReplies = (element, value) => {
    // update replies in the element and this element
    this.setAttribute('replies', value);
    element.setAttribute('replies', value);
    element.setAttribute('reload', 'true');
  }

  updateFollowers = (element, value) => {
    if (!element) {
      return;
    }
    element.setAttribute('followers', value);
  }

  updateAuthorFollowers = (element, value) => {
    element.setAttribute('author-followers', value);
    element.setAttribute('reload', 'true');
  }

  activateView = () => {
    if (!this.viewed) {
      setTimeout(() => {
        this.sendViewData();
        this.viewed = true;
      }, 5000);
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

  watchMediaQuery = mql => {
    mql.addEventListener('change', () => {
      // Re-render the component
      this.render();
    });
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

  openUrl = () => {
    // get all the links
    const links = this.shadowObj.querySelectorAll('article.article a');
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

  // Get lapse time
  getLapseTime = isoDateStr => {
    const dateIso = new Date(isoDateStr); // ISO strings with timezone are automatically handled
    let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert posted time to the current timezone
    const date = new Date(dateIso.toLocaleString('en-US', { timeZone: userTimezone }));

    return `
      ${date.toLocaleDateString('en-US', { weekday: 'short' })} • ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
    `
  }

  edit = () => {
    // Get the body element
    const body = document.querySelector('body');
    // Get the content of the topic page
    const content = this.getEditBody();
    // set to be deleted:
    window.toBeChanged = this;
    // insert the content into the body
    body.insertAdjacentHTML('beforeend', content);
  }

  getEditBody = () => {
    // Show Post Page Here
    return /* html */`
      <post-options kind="${this.getAttribute('story')}" url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}" images="${this.getAttribute('images')}" published="true"
        drafted="false" story="true" story-title="${this.getAttribute('story-title')}" slug="${this.getAttribute('slug')}">
        ${this.innerHTML}
      </post-options>
    `;
  }

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    if (this.mql.matches) {
      return /* html */`
        <div class="content" id="content-container">
          <div class="feeds">
            <div class="content-wrapper">
              ${this.getAuthor()}
              ${this.getHeader()}
              ${this.getContent()}
              ${this.getMeta()}
              ${this.getStats()}
            </div>
            ${this.repliesSection()}
          </div>
          ${this.getRespone()}
        </div>
      `;
    }
    else {
      return /* html */`
        <div class="content" id="content-container">
          <div class="feeds">
            <div class="content-wrapper">
              ${this.getHeader()}
              ${this.getContent()}
              ${this.getMeta()}
              ${this.getStats()}
            </div>
            ${this.repliesSection()}
          </div>
          ${this.getRespone()}
        </div>
        <section class="side">
          ${this.getAuthor()}
          ${this.peopleSection()}
        </section>
      `;
    }
  }

  getRespone = () => {
    const url = `${this.getAttribute('url').toLowerCase()}/reply`;
    return /* html */`
      <div id="response-container" is="response-post" placeholder="What's your reply?" hash="${this.getAttribute('hash')}" author-hash="${this.getAttribute('author-hash')}" url="${url}" story="${this.getAttribute('story')}"></div>
    `;
  }

  peopleSection = () => {
    return /* html */`
      <likes-section kind="story" url="${this.getAttribute('url')}" active="likes"
        author-hash="${this.getAttribute('author-hash')}" hash="${this.getAttribute('hash')}" likes="${this.getAttribute('likes')}"
        likes-url="${this.getAttribute('likes-url')}">
      </likes-section>
    `
  }

  repliesSection = () => {
    return /* html */`
      <replies-section kind="story" url="${this.getAttribute('url')}" active="${this.getAttribute('tab')}" section-title="Post" 
        author-hash="${this.getAttribute('author-hash')}" hash="${this.getAttribute('hash')}" 
        replies="${this.getAttribute('replies')}" likes="${this.getAttribute('likes')}"
        liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}"
        replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}">
      </replies-section>
    `
  }

  getHeader = () => {
    return /*html*/`
      <div class="head">
        <h1 class="story-title">${this.getAttribute('story-title')}</h1>
        ${this.getHover()}
      </div>
    `
  }

  getHover = () => {
    return /*html*/`
      <div class="top-meta">
        <span class="user-name">${this.getAttribute('author-name')}</span>
        <span class="sp">•</span>
        <span class="read">${this.calculateReadTime()}</span> <span class="text">min read</span>
      </div>
    `
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
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const parsedHTML = doc.body.innerHTML;
  
    return /* html */`
      <article class="article" id="article">
        ${parsedHTML}
      </article>
    `;
  }

  getAuthor = () => {
    const contact = this.getAttribute("author-contact");
    let bio = this.getAttribute('author-bio') || 'This author has not provided a bio yet.';
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return /* html */`
			<author-wrapper hash="${this.getAttribute('author-hash')}" picture="${this.getAttribute('author-img')}" name="${this.getAttribute('author-name')}"
        followers="${this.getAttribute('author-followers')}" following="${this.getAttribute('author-following')}" user-follow="${this.getAttribute('author-follow')}"
        stories="${this.getAttribute('author-stories')}" replies="${this.getAttribute('author-replies')}" contact='${contact}'
        verified="${this.getAttribute('author-verified')}" url="${this.getAttribute('author-url')}" you="${this.getAttribute('author-you')}"
        bio="${bio}">
      </author-wrapper>
		`
  }

  getSection = () => {
    return /* html */`
      <post-section url="${this.getAttribute('url')}" active="${this.getAttribute('tab')}" section-title="Story" 
        author-hash="${this.getAttribute('author-hash')}" hash="${this.getAttribute('hash')}"
        replies="${this.getAttribute('replies')}" likes="${this.getAttribute('likes')}" kind="story"
        replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}">
      </post-section>
    `
  }

  getMeta = () => {
    return /* html */`
      <div class="meta">
        <span class="time">${this.getLapseTime(this.getAttribute('time'))}</span>
      </div>
    `
  }

  getStats = () => {
    const author = this.getAttribute('author-hash');
    const you = author === this.user;
    return /*html*/`
      <action-wrapper you="${you}" full="true" kind="story" reload="false" likes="${this.getAttribute('likes')}" images="${this.getAttribute('images')}"
        replies="${this.getAttribute('replies')}" liked="${this.getAttribute('liked')}" wrapper="true"
        hash="${this.getAttribute('hash')}" views="${this.getAttribute('views')}"  url="${this.getAttribute('url')}" summary="${this.getAttribute('story-title')}"
        preview-title="${this.getAttribute('story-title')}" time="${this.getAttribute('time')}"
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
          display: flex;
          width: 100%;
          gap: 30px;
          min-height: 100vh;
          justify-content: space-between;
        }

        div.content {
          padding: 10px 0 0 0;
          width: calc(55% - 10px);
          display: flex;
          flex-flow: column;
          max-height: max-content;
          justify-content: space-between;
          min-height: 100dvh;
          gap: 0;
        }

        div.feeds {
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        /* Responses */
        div.content section.responses {
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        section.side {
          padding: 25px 0 0 10px;
          margin: 0;
          background-color: transparent;
          width: calc(45% - 10px);
          height: max-content;
          display: flex;
          flex-flow: column;
          gap: 0;
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

        div.head {
          display: flex;
          flex-flow: column;
          gap: 0;
          margin: 0;
        }

        div.head > .topic {
          width: max-content;
          color: var(--gray-color);
          padding: 3px 10px 3px 10px;
          background: var(--light-linear);
          font-family: var(--font-read), sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        div.head > h1.story-title {
          margin: 15px 0 0 0;
          padding: 0;
          font-weight: 600;
          font-size: 1.6rem;
          line-height: 1.2;
          font-family: var(--font-main), sans-serif;
          color: var(--title-color);
        }

        .top-meta {
          border-bottom: var(--border);
          /* border-top: var(--border); */
          margin: 0;
          padding: 0 0 5px;
          display: flex;
          position: relative;
          color: var(--text-color);
          align-items: center;
          font-family: var(--font-mono), monospace;
          gap: 5px;
          font-size: 1rem;
          font-weight: 600;
        }

        .top-meta > span.read {
          font-size: 1rem;
          font-weight: 400;
          font-family: var(--font-text), sans-serif;
        }

        .top-meta > span.text {
          font-size: 1rem;
          font-weight: 400;
          font-family: var(--font-main), sans-serif;
        }

        .top-meta > .sp {
          font-size: 1.35rem;
          color: var(--text-color);
          font-weight: 400;
        }

        .top-meta > span.user-name {
          max-width: 50%;
          /* add ellipsis to the text */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 1rem;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
        }

        .meta {
          border-bottom: var(--border);
          border-top: var(--border);
          margin: 0;
          padding: 10px 0;
          display: flex;
          position: relative;
          color: var(--text-color);
          align-items: center;
          font-family: var(--font-text), sans-serif;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
        }

        .meta > .sp {
          font-size: 1.25rem;
          color: var(--gray-color);
          font-weight: 400;
        }

        .content-wrapper {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
        }

        article.article {
          margin: 3px 0 0;
          font-size: 1.05rem;
          display: flex;
          flex-flow: column;
          color: var(--read-color);
          font-family: var(--font-main), sans-serif;
          gap: 0;
          font-size: 1rem;
          font-weight: 400;
        }

        article.article * {
          font-size: inherit;
          line-height: 1.3;
          color: inherit;
          font-family: inherit;
        }

        article.article h6,
        article.article h5,
        article.article h4,
        article.article h3,
        article.article h1 {
          padding: 0;
          color: var(--title-color);
          font-weight: 500;
          line-height: 1.5;
          margin: 10px 0;
          font-family: var(--font-main), sans-serif;
        }

        article.article h6 {
          font-size: initial;
        }

        article.article h5 {
          font-size: initial;
        }

        article.article h4 {
          font-size: 1.25rem;
        }

        article.article h3 {
          font-size: 1.3rem !important;;
        }

        article.article h2 {
          font-size: 1.35rem !important;
          color: var(--title-color);
          font-weight: 600;
          line-height: 1.2;
          margin: 0;
          padding: 2px 0 0 13px;
          margin: 10px 0 10px;
          position: relative;
        }

        article.article h2:before {
          content: "";
          position: absolute;
          bottom: 10%;
          left: 0;
          width: 2px;
          height: 80%;
          background: var(--action-linear);
          border-radius: 5px;
        }

        article.article .intro p {
          margin: 0 0 5px 0;
          line-height: 1.4;
        }

        article.article p {
          margin: 5px 0;
          line-height: 1.4;
        }

        article.article a {
          text-decoration: none;
          cursor: pointer;
          color: var(--anchor-color) !important;
        }

        article.article a:hover {
          text-decoration: underline;
        }

        article.article blockquote {
          margin: 10px 0;
          padding: 5px 15px;
          font-style: italic;
          border-left: 2px solid var(--gray-color);
          background: var(--background);
          color: var(--text-color);
          font-weight: 400;
        }

        article.article blockquote:before {
          content: open-quote;
          color: var(--gray-color);
          font-size: 1.5rem;
          line-height: 1;
          margin: 0 0 0 -5px;
        }

        article.article blockquote:after {
          content: close-quote;
          color: var(--gray-color);
          font-size: 1.5rem;
          line-height: 1;
          margin: 0 0 0 -5px;
        }

        article.article blockquote p {
          margin: 0;
        }

        article.article blockquote * {
          margin: 0;
        }

        article.article hr {
          border: none;
          background-color: var(--gray-color);
          height: 1px;
          margin: 10px 0;
        }

        article.article ul,
        article.article ol {
          margin: 5px 0 15px 20px;
          padding: 0 0 0 15px;
          color: inherit;
        }

        article.article ul li,
        article.article ol li {
          padding: 5px 0;
        }

        article.article code {
          background: var(--gray-background);
          padding: 0 5px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          border-radius: 5px;
        }

        article.article img {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          border-radius: 5px;
        }

        article.article figure {
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


        /* response */
        div#response-container{
          all: unset;
          border: none;
          position: sticky;
          bottom: 0;
          padding: 0;
          justify-self: end;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 100%;
        }

        @media screen and (max-width:900px) {
          div.content {
            width: 58%;
          }

          section.side {
            width: 40%;
          }
        }

        @media screen and (max-width: 770px) {
					:host {
            font-size: 16px;
						padding: 15px 0 0 0;
            margin: 0;
            display: flex;
            min-height: max-content;
            height: max-content;
            flex-flow: column;
            gap: 0;
					}

          div.content .head {
            margin: 0;
          }

          div.content {
            padding: 0;
            width: 100%;
            display: flex;
            flex-flow: column;
            gap: 0;
          }

          section.side {
            padding: 0;
            display: none;
            width: 0%;
          }
        }

				@media screen and (max-width: 660px) {
					:host {
            font-size: 16px;
						padding: 5px 0 0 0;
            margin: 0;
            display: flex;
            min-height: max-content;
            height: max-content;
            flex-flow: column;
            gap: 0;
					}

          div.content .head {
            margin: 10px 0 0 0;
          }

          div.head > h1.story-title {
            margin: 0;
          }

          .content-wrapper {
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 0 10px;
          }

          div.content {
            width: 100%;
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 0;
          }

					.action,
					a {
						cursor: default !important;
          }

          section.side {
            padding: 0;
            display: none;
            width: 0%;
          }
          a {
            cursor: default !important;
          }

          .meta {
            display: flex;
            position: relative;
            color: var(--text-color);
            align-items: center;
            font-family: var(--font-text), sans-serif;
            font-size: 0.9rem;
            gap: 5px;
            font-weight: 600;
          }

          a,
          span.action {
            cursor: default !important;
          }
				}
	    </style>
    `;
  }
}
