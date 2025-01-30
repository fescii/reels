export default class AppPost extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.setTitle();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);
    this.render();
  }

  setTitle = () => {
    // update title of the document
    document.title = `Post | by ${this.getAttribute('author-name')}`;
  }

  setReply = (reply) => {
    const previews = this.shadowObj.querySelector('div.previews');

    if (previews) {
      previews.insertAdjacentHTML('afterbegin', reply);
    }
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // Change style to flex
    this.style.display='flex';
    this.openUrl();
    // request user to enable notifications
    this.checkNotificationPermission();
    // connect to the WebSocket
    this.checkAndAddHandler();
    // mql query at: 660px
    const mql = window.matchMedia('(max-width: 660px)');
    this.watchMediaQuery(mql);
    // scroll the window to the top and set height to 100vh
    window.scrollTo(0, 0);
  }

  checkNotificationPermission = async () => {
    if(window.notify && !window.notify.permission) {
      await window.notify.requestPermission();
    }
  }

  checkAndAddHandler() {
    this.enableScroll();
    if (window.wss) {
      window.wss.addMessageHandler(this.boundHandleWsMessage);
      // console.log('WebSocket handler added successfully');
    } else {
      // console.log('WebSocket manager not available, retrying...');
      setTimeout(this.checkAndAddHandler, 500); // Retry after 500ms
    }
  }

  disconnectedCallback() {
    this.enableScroll();
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
    const wrapper = this.shadowObj.querySelector('action-wrapper');
    const VotesWrapper = this.shadowObj.querySelector('poll-wrapper');
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
      else if (data.action === 'vote') {
        if(user !== null && user === userHash) {
          return;
        }
        // update likes
        this.updateVote(VotesWrapper, data.value);
      }
    }
  }

  sendWsMessage(data) {
    window.wss.sendMessage(data);
  }

  handleConnectAction = (data, author, userHash, authorHash) => {
    const to = data.hashes.to;
    if(to === authorHash) {
      const followers = this.parseToNumber(this.getAttribute('author-followers')) + data.value;
      this.setAttribute('author-followers', followers)
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

  updateVote = (element, value) => {
    if(element) {
      element.setAttribute('vote', value);
      element.setAttribute('reload', 'true');
    }
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
    element.setAttribute('reload', 'true');
  }

  updateAuthorFollowers = (element, value) => {
    element.setAttribute('author-followers', value);
    element.setAttribute('reload', 'true');
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

  watchMediaQuery = mql => {
    mql.addEventListener('change', () => {

      this.render();
    });
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

  disableScroll() {
    // Get the current page scroll position
    let scrollTop = window.scrollY || document.documentElement.scrollTop;
    let scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    document.body.classList.add("stop-scrolling");

    // if any scroll is attempted, set this to the previous value
    window.onscroll = function () {
      window.scrollTo(scrollLeft, scrollTop);
    }
  }

  enableScroll() {
    document.body.classList.remove("stop-scrolling");
    window.onscroll = function () { };
  }

  getTemplate = () => {
    // Show HTML Here
    return /* html */`
      <div class="container">
        ${this.getBody()}
      </div>
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    // Get story type
    const story = this.getAttribute('story');
    const mql = window.matchMedia('(max-width: 660px)');
    if (mql.matches) {
      return /* html */`
        <div class="content-container">
          <div class="previews">
            ${this.getReply(this.getAttribute('story'))}
          </div>
          ${this.getAuthorOption(story)}
          ${this.getContent()}
          ${this.getPost(story)}
          ${this.repliesSection()}
        </div>
      `;
    }
    else {
      return /* html */`
        <div class="feeds">
          <div class="content-container">
            <div class="previews">
              ${this.getReply(this.getAttribute('story'))}
            </div>
            ${this.getHeader()}
            ${this.getContent()}
            ${this.getPost(story)}
            ${this.repliesSection()}
          </div>
        </div>
        <div class="side">
          ${this.getAuthor()}
          ${this.peopleSection()}
        </div>
      `;
    }
  }

  getContent = () => {
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    const parsedHTML = doc.body.innerHTML;
  
    return /* html */`
      <div class="content" id="content">
        ${parsedHTML}
      </div>
    `;
  }

  getPost = story => {
    switch (story) {
      case 'poll':
        return /*html */`
          ${this.getPoll()}
          ${this.getMeta()}
          ${this.getStats(story)}
        `
      default:
        return /* html */`
          ${this.getImages()}
          ${this.getMeta()}
          ${this.getStats(story)}
        `
    }
  }

  peopleSection = () => {
    return /* html */`
      <post-section kind="${this.getAttribute('story')}" url="${this.getAttribute('url')}" active="likes"
        author-hash="${this.getAttribute('author-hash')}" hash="${this.getAttribute('hash')}" likes="${this.getAttribute('likes')}"
        likes-url="${this.getAttribute('likes-url')}">
      </post-section>
    `
  }

  repliesSection = () => {
    return /* html */`
      <replies-section kind="${this.getAttribute('story')}" url="${this.getAttribute('url')}" active="${this.getAttribute('tab')}" section-title="Post" 
        author-hash="${this.getAttribute('author-hash')}" hash="${this.getAttribute('hash')}" 
        replies="${this.getAttribute('replies')}" likes="${this.getAttribute('likes')}"
        replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}">
      </replies-section>
    `
  }

  getAuthorOption = kind => {
    if(kind === 'reply') {
      return this.getHeader();
    } else {
      return this.getAuthor();
    }
  }

  getHeader = () => {
    return /*html*/`
      <div class="top-meta">
        ${this.getAuthorHover()}
      </div>
    `
  }

  getAuthorHover = () => {
    let url = `/u/${this.getAttribute('author-hash').toLowerCase()}`;
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

  getAuthor = () => {
    let bio = this.getAttribute('author-bio') || 'This author has not provided a bio yet.';
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return /* html */`
			<author-wrapper you="${this.getAttribute('author-you')}" hash="${this.getAttribute('author-hash')}" picture="${this.getAttribute('author-img')}" name="${this.getAttribute('author-name')}"
        stories="${this.getAttribute('author-stories')}" replies="${this.getAttribute('author-replies')}"
        followers="${this.getAttribute('author-followers')}" following="${this.getAttribute('author-following')}" user-follow="${this.getAttribute('author-follow')}" contact='${this.getAttribute("author-contact")}'
        verified="${this.getAttribute('author-verified')}" url="/u/${this.getAttribute('author-hash').toLowerCase()}"
        bio="${bio}">
      </author-wrapper>
		`
  }

  getPoll = () =>  {
    return /*html*/`
      <votes-wrapper reload="false" votes="${this.getAttribute('votes')}" selected="${this.getAttribute('selected')}"
        hash="${this.getAttribute('hash')}" wrapper="true"
        end-time="${this.getAttribute('end-time')}" voted="${this.getAttribute('voted')}" options="${this.getAttribute('options')}">
      </votes-wrapper>
    `
  }

  getMeta = () => {
    return /* html */`
      <div class="meta">
        <span class="time">${this.getLapseTime(this.getAttribute('time'))}</span>
      </div>
    `
  }

  getStats = story =>  {
    return /*html*/`
      <action-wrapper preview="false" full="true" kind="${story}" reload="false" likes="${this.getAttribute('likes')}"
        replies="${this.getAttribute('replies')}" liked="${this.getAttribute('liked')}" wrapper="true" images="${this.getAttribute('images')}"
        hash="${this.getAttribute('hash')}" views="${this.getAttribute('views')}" url="${this.getAttribute('url')}" summary="Post by - ${this.getAttribute('author-name')}"
        preview-title="" time="${this.getAttribute('time')}" author-hash="${this.getAttribute('author-hash')}">
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

  getReply = story => {
    if (story === 'reply') {
      const parent = this.getAttribute('parent').toUpperCase();
      let url = parent.startsWith('P') ? `/p/${parent.toLowerCase()}/preview` : `/r/${parent.toLowerCase()}/preview`;
      return /*html*/`
        <preview-post url="${url}" hash="${parent}" preview="full" first="true"></preview-post>
      `
    } else return '';
  }

  getStyles() {
    return /*css*/`
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
          flex-flow: column;
          gap: 0;
        }

        .container {
          display: flex;
          justify-content: space-between;
          gap: 30px;
          min-height: 100dvh;
        }

        .feeds {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 20px 0 0 0;
          width: calc(55% - 10px);
        }

        div.side {
          padding: 0;
          margin: 25px 0;
          width: calc(45% - 10px);
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

        div.side::-webkit-scrollbar {
          visibility: hidden;
          display: none;
        }

        .meta {
          border-bottom: var(--border);
          border-top: var(--border);
          margin: 10px 0 0 0;
          padding: 10px 0;
          display: flex;
          position: relative;
          color: var(--text-color);
          align-items: center;
          font-family: var(--font-main), sans-serif;
          gap: 5px;
          font-size: 1rem;
          font-weight: 600;
        }

        .top-meta {
          margin: 0;
          padding: 10px 0 0;
          display: flex;
          position: relative;
          color: var(--text-color);
          align-items: center;
          font-family: var(--font-text), sans-serif;
          gap: 5px;
          font-size: 1rem;
          font-weight: 600;
        }

        .meta > .sp {
          font-size: 1rem;
          color: var(--gray-color);
          font-weight: 400;
        }

        .content-container {
          display: flex;
          flex-flow: column;
          gap: 0;
          width: 100%;
        }

        .content {
          display: flex;
          font-size: 1.05rem; 
          flex-flow: column;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
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

        .content code {
          background: var(--gray-background);
          padding: 0 5px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          border-radius: 5px;
        }

        @media screen and (max-width:900px) {
          .feeds {
            width: 58%;
          }

          div.side {
            width: 40%;
          }
        }

        div.previews {
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
          margin: 0;
          padding: 0;
        }

				@media screen and (max-width: 660px) {
					:host {
            font-size: 16px;
            padding: 10px 0;
					}

          .container {
            display: flex;
            flex-flow: column;
            justify-content: flex-start;
            gap: 0;
            padding: 0;
            min-height: max-content;
          }

          .content-container {
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 0 10px;
            width: 100%;
          }

					::-webkit-scrollbar {
						-webkit-appearance: none;
					}
					a {
						cursor: default !important;
          }

          .feeds {
            display: flex;
            flex-flow: column;
            gap: 0;
            width: 100%;
          }

          .content {
            display: flex;
            flex-flow: column;
            color: var(--text-color);
            line-height: 1.5;
            gap: 0;
            margin: 0;
          }

          div.side {
            padding: 0;
            width: 100%;
          }

          .meta {
            display: flex;
            position: relative;
            color: var(--text-color);
            align-items: center;
            font-family: var(--font-main), sans-serif;
            font-size: 0.9rem;
            gap: 5px;
            font-weight: 600;
          }

          a,
          .stats > .stat {
            cursor: default !important;
          }

          a,
          span.stat,
          span.action {
            cursor: default !important;
          }

          .content a {
            cursor: default !important;
          }

          .stats.actions > span.play:hover,
          .stats.actions > span.stat:hover,
          .stats.actions > span.action:hover {
            background: none;
          }
				}
	    </style>
    `;
  }
}