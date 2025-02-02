export default class AppTopic extends HTMLElement {
  constructor() {
    super();
    this.setTitle(this.getAttribute('name'));
    this.app = window.app;
    this._authenticated = window.hash ? true : false;
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  setTitle = title => {
    document.title = `Topic | ${title}`;
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.enableScroll();
    this.style.display = 'flex';
    this.app.showNav();
    this.checkAndAddHandler();
    this.checkNotificationPermission();
    this.performActions();
    this.openHighlights(document.querySelector('body'));

    const mql = window.matchMedia('(max-width: 660px)');
    this.watchMediaQuery(mql);
  }

  checkAndAddHandler() {
    if (window.wss) {
      window.wss.addMessageHandler(this.boundHandleWsMessage);
    } else {
      setTimeout(this.checkAndAddHandler, 500);
    }
  }

  checkNotificationPermission = async () => {
    if (window.notify && !window.notify.permission) {
      await window.notify.requestPermission();
    }
  }

  disconnectedCallback() {
    this.enableScroll();
    if (window.wss) {
      window.wss.removeMessageHandler(this.boundHandleWsMessage);
    }
  }

  handleWsMessage = message => {
    const data = message.data;

    if (message.type !== 'action') return;

    const userHash = window.hash;
    const hash = this.getAttribute('hash').toUpperCase();
    const authorHash = this.getAttribute('author-hash').toUpperCase();
    const author = this.shadowObj.querySelector('author-wrapper');
    const target = data.hashes.target;

    if (data.action === 'connect' && data.kind === 'user') {
      this.handleConnectAction(data, author, userHash, authorHash);
    } else if (data.kind === 'topic' && target === hash) {
      this.handleTopicAction(data, data.value, userHash);
    }
  }

  sendWsMessage(data) {
    window.wss.sendMessage(data);
  }

  handleConnectAction = (data, author, userHash, authorHash) => {
    const to = data.hashes.to;
    if (to === authorHash) {
      const followers = this.parseToNumber(this.getAttribute('author-followers')) + data.value;
      this.setAttribute('author-followers', followers);
      this.updateFollowers(author, followers);

      if (data.hashes.from === userHash) {
        const value = data.value === 1 ? 'true' : 'false';
        this.setAttribute('author-follow', value);
        if (author) {
          author.setAttribute('user-follow', value);
        }
      }

      if (author) {
        author.setAttribute('reload', 'true');
      }
    }
  }

  handleTopicAction = (data, value, userHash) => {
    if (data.user === userHash) return;

    if (data.action === 'follow') {
      this.updateFollowers(value === 1);
    } else if (data.action === 'subscribe') {
      const subscribers = this.parseToNumber(this.getAttribute('subscribers')) + value;
      this.setAttribute('subscribers', subscribers.toString());
    }
  }

  watchMediaQuery = mql => {
    mql.addEventListener('change', () => {
      this.render();
      this.onPopEvent();
      this.performActions();
      this.openHighlights(document.querySelector('body'));
    });
  }

  openHighlights = body => {
    const statsBtn = this.shadowObj.querySelector('.actions > .action#stats-action');

    if (statsBtn) {
      statsBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        body.insertAdjacentHTML('beforeend', this.getHighlights());
      });
    }
  }

  performActions = () => {
    const outerThis = this;
    const body = document.querySelector('body');
    let hash = this.getAttribute('hash');
    hash = hash.trim().toLowerCase();
    const url = '/t/' + hash;
    const followBtn = this.shadowObj.querySelector('.actions>.action#follow-action');
    const subscribeBtn = this.shadowObj.querySelector('.actions>.action#subscribe-action');

    if (followBtn && subscribeBtn) {
      followBtn.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();

        let action = false;

        if (!this._authenticated) {
          this.openJoin(body);
        } else if (followBtn.classList.contains('following')) {
          action = true;
          outerThis.updateFollowBtn(false, followBtn);
          await this.followTopic(`${url}/follow`, followBtn, action);
        } else {
          outerThis.updateFollowBtn(true, followBtn);
          await this.followTopic(`${url}/follow`, followBtn, action);
        }
      });

      subscribeBtn.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();

        let action = false;

        if (!this._authenticated) {
          this.openJoin(body);
        } else if (subscribeBtn.classList.contains('subscribed')) {
          action = true;
          outerThis.updateSubscribeBtn(false, subscribeBtn);
          await this.subscribeToTopic(`${url}/subscribe`, subscribeBtn, action);
        } else {
          outerThis.updateSubscribeBtn(true, subscribeBtn);
          await this.subscribeToTopic(`${url}/subscribe`, subscribeBtn, action);
        }
      });
    }
  }

  followTopic = async (url, followBtn, followed) => {
    const outerThis = this;
    try {
      const data = await this.api.post(url, { content: 'json' });

      if (data.unverified) {
        const body = document.querySelector('body');
        outerThis.openJoin(body);
        outerThis.updateFollowBtn(followed, followBtn);
      }

      if (!data.success) {
        this.app.showToast(false, data.message);
        outerThis.updateFollowBtn(followed, followBtn);
      } else {
        this.app.showToast(true, data.message);
        outerThis.updateFollowBtn(data.followed, followBtn);
        outerThis.updateFollowers(data.followed);
      }
    } catch (_error) {
      this.app.showToast(false, 'An error occurred!');
      outerThis.updateFollowBtn(followed, followBtn);
    }
  }

  subscribeToTopic = async (url, subscribeBtn, subscribed) => {
    try {
      const data = await this.api.post(url, { content: 'json' });

      // Check if the user is unverified
      if (data.unverified) {
        // Get body
        const body = document.querySelector('body');

        // Open the join popup
        this.openJoin(body);

        // revert the subscribe button
        this.updateSubscribeBtn(subscribed, subscribeBtn);
      }

      // if success is false, show toast message
      if (!data.success) {
        this.app.showToast(false, data.message);

        // revert the subscribe button
        this.updateSubscribeBtn(subscribed, subscribeBtn);
      } else {
        // Show toast message
        this.app.showToast(true, data.message);

        // Check for subscribed boolean
        this.updateSubscribeBtn(data.subscribed, subscribeBtn);

        // update the subscribers attribute
        const value = data.subscribed ? 1 : -1;

        // Get subscribers attribute
        let subscribers = this.parseToNumber(this.getAttribute('subscribers')) + value;

        // if subscribers is less than 0, set it to 0
        subscribers = subscribers < 0 ? 0 : subscribers;

        // Set the subscribers attribute
        this.setAttribute('subscribers', subscribers.toString());
      }
    } catch (_error) {
      // show toast message
      this.app.showToast(false, 'An error occurred while subscribing to the topic');

      // revert the subscribe button
      this.updateSubscribeBtn(subscribed, subscribeBtn);
    }
  }

  updateSubscribeBtn = (subscribed, btn) => {
    if (subscribed) {
      // Change the text to subscribed
      btn.textContent = 'subscribed';

      // remove the subscribe class
      btn.classList.remove('subscribe');

      // add the subscribed class
      btn.classList.add('subscribed');
    }
    else {
      // Change the text to subscribe
      btn.textContent = 'subscribe';

      // remove the subscribed class
      btn.classList.remove('subscribed');

      // add the subscribe class
      btn.classList.add('subscribe');
    }
  }

  updateFollowBtn = (following, btn) => {
    if (following) {
      // Change the text to following
      btn.textContent = 'following';

      // remove the follow class
      btn.classList.remove('follow');

      // add the following class
      btn.classList.add('following');
    }
    else {
      // Change the text to follow
      btn.textContent = 'follow';

      // remove the following class
      btn.classList.remove('following');

      // add the follow class
      btn.classList.add('follow');
    }
  }

  openJoin = body => {
    // Insert getJoin beforeend
    body.insertAdjacentHTML('beforeend', this.getJoin());
  }

  getJoin = () => {
    // get url from the : only the path
    const url = window.location.pathname;

    return /* html */`
      <join-popup register="/join/register" login="/join/login" next="${url}"></join-popup>
    `
  }

  updateFollowers = (followed) => {
    const outerThis = this;
    let value = followed ? 1 : -1;
    // Get followers attribute : convert to number then add value

    let followers = this.parseToNumber(this.getAttribute('followers')) + value;

    // if followers is less than 0, set it to 0
    followers = followers < 0 ? 0 : followers;

    // Set the followers attribute
    this.setAttribute('followers', followers.toString());

    // select the followers element
    const followersStat = outerThis.shadowObj.querySelector('.stats > span.followers');
    if (followersStat) {
      // select no element
      const no = followersStat.querySelector('.no');
      const text = followersStat.querySelector('.text');

      // Update the followers
      no.textContent = this.formatNumber(followers);

      // Update the text
      text.textContent = followers === 1 ? 'follower' : 'followers';
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
        <div class="main-container">
          ${this.getAuthor()}
          ${this.getHeader()}
        </div>
        ${this.getSection()}
      `;
    }
    else {
      return /* html */`
        <section class="main">
          ${this.getHeader()}
          ${this.getSection()}
        </section>
        <section class="side">
          ${this.getAuthor()}
          <topics-container url="/q/trending/topics"></topics-container>
          ${this.getInfo()}
        </section>
      `;
    }
  }

  getStories = () => {
    return /* html */`
      <stories-feed stories="all" url="/U0A89BA6/stories"></stories-feed>
    `
  }

  getHeader = () => {
    let str = this.getAttribute('name');
    // Replace all - with space 
    str = str.replace(/-/g, ' ');

    // capitalize the first letter of the string
    str = str.charAt(0).toUpperCase() + str.slice(1);
    return /*html*/`
      <div class="head">
        <div class="text-content">
          <div class="topic-head">
            <div class="topic">
              <h2> ${str} </h2>
              <p class="info">Discover, read, and contribute to the topic.</p>
            </div>
            ${this.getStats()}
          </div>
          ${this.getActions()}
        </div>
      </div>
    `
  }

  parseContent = content => {
    // Remove all HTML tags
    const noHtmlContent = content.replace(/<\/?[^>]+(>|$)/g, "");
  
    // Split the content by the next line
    const lines = noHtmlContent.split('\n');
  
    // Create a paragraph for each line
    return lines.map(line => `<p>${line}</p>`).join('');
  }

  parseHTML = text => {
    // Create a temporary element to help with parsing
    const tempElement = document.createElement('div');
    
    // Check if the text is encoded (contains &lt; or &gt;)
    if (text.includes('&lt;') || text.includes('&gt;')) {
      // Create a textarea element to decode the HTML entities
      const textarea = document.createElement('textarea');
      textarea.innerHTML = text;
      tempElement.innerHTML = textarea.value;
    } else {
        // Directly set the innerHTML for plain HTML
      tempElement.innerHTML = text;
    }
    
    // Return the parsed HTML
    return tempElement.innerHTML;
  }

  getInfo = () => {
    return /*html*/`
      <info-container docs="/about/docs" new="/about/new"
       feedback="/about/feedback" request="/about/request" code="/about/code" donate="/about/donate" contact="/about/contact" company="https://github.com/aduki-hub">
      </info-container>
    `
  }

  getArticle = () => {
    return /* html */`
      <article class="article">
       ${this.parseHTML(this.innerHTML)}
      </article>
    `
  }

  getSection = () => {
    return /* html */`
      <topic-section hash="${this.getAttribute('hash')}" url="${this.getAttribute('url')}" active="${this.getAttribute('tab')}"
        slug="${this.getAttribute('slug')}" stories="${this.getAttribute('stories')}" page="1"
        stories-url="${this.getAttribute('stories-url')}">
        ${this.getArticle()}
      </topic-section>
    `
  }

  getStats = () => {
    // Get followers
    let followers = this.parseToNumber(this.getAttribute('followers'));

    const followersText = followers === 1 ? 'follower' : 'followers';

    // Get stories
    let stories = this.parseToNumber(this.getAttribute('stories'));

    const storiesText = stories === 1 ? 'story' : 'stories';

    // Format the number
    let formattedStories = this.formatNumber(stories);
    let formattedFollowers = this.formatNumber(followers);

    return /*html*/`
      <div class="stats">
        <span class="followers followers-stat">
          <span class="no">${formattedFollowers}</span>
          <span class="text">${followersText}</span>
        </span>
        <span class="sp">•</span>
        <span class="stories">
          <span class="no">${formattedStories}</span>
          <span class="text">${storiesText}</span>
        </span>
      </div>
    `
  }

  getAuthor = () => {
    let bio = this.getAttribute('author-bio') || 'This author has not provided a bio yet.';
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return /* html */`
			<author-wrapper you="${this.getAttribute('author-you')}" hash="${this.getAttribute('author-hash')}" picture="${this.getAttribute('author-img')}" name="${this.getAttribute('author-name')}"
        stories="${this.getAttribute('author-stories')}" replies="${this.getAttribute('author-replies')}" contact='${this.getAttribute("author-contact")}'
        followers="${this.getAttribute('author-followers')}" following="${this.getAttribute('author-following')}" user-follow="${this.getAttribute('author-follow')}"
        verified="${this.getAttribute('author-verified')}" url="/u/${this.getAttribute('author-hash').toLowerCase()}"
        bio="${bio}">
      </author-wrapper>
		`
  }

  getActions = () => {
    // Get url
    let url = this.getAttribute('url');

    // trim the url and convert to lowercase
    url = url.trim().toLowerCase();
    return /* html */`
      <div class="actions">
        <span class="action stats" id="stats-action">stats</span>
        ${this.checkFollow(this.getAttribute('topic-follow'))}
        ${this.checkSubscribed(this.getAttribute('subscribed'))}
      </div>
    `
  }

  checkFollow = following => {
    if (following === 'true') {
      return /*html*/`
			  <span class="action following" id="follow-action">following</span>
			`
    }
    else {
      return /*html*/`
			  <span class="action follow" id="follow-action">follow</span>
			`
    }
  }

  checkSubscribed = subscribed => {
    if (subscribed === 'true') {
      return /*html*/`
			  <span class="action subscribed" id="subscribe-action">subscribed</span>
			`
    }
    else {
      return /*html*/`
			  <span class="action subscribe" id="subscribe-action">subscribe</span>
			`
    }
  }

  getHighlights = () => {
    return /* html */`
      <topic-popup url="/t/${this.getAttribute('hash').toLowerCase()}/stats" name="${this.getAttribute('name')}" views="${this.getAttribute('views')}"
        followers="${this.getAttribute('followers')}" subscribers="${this.getAttribute('subscribers')}" 
        stories="${this.getAttribute('stories')}">
      </topic-popup>
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
          justify-content: space-between;
          gap: 30px;
        }

        section.main {
          display: flex;
          flex-flow: column;
          align-items: start;
          gap: 0;
          padding: 20px 0 0 0;
          width: calc(55% - 10px);
          min-height: 100vh
        }

        .head {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          width: 100%;
        }

        .text-content {
          display: flex;
          flex-flow: column;
          gap: 15px;
          color: var(--title-color);
        }

        .text-content > .topic-head {
          display: flex;
          flex-flow: column;
          gap: 8px;
        }

        .text-content > .topic-head .topic {
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        .text-content > .topic-head .topic > h2 {
          font-size: 1.4rem;
          font-weight: 600;
          font-family: var(--font-main), sans-serif;
          margin: 0;
          color: var(--title-color);
        }

        .text-content > .topic-head .topic > p.info {
          margin: 0;
          font-size: 0.8rem;
          font-weight: 500;
          font-family: var(--font-text), sans-serif;
          margin: 0;
          color: var(--gray-color);
        }

        .stats {
          padding: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          font-weight: 400;
          color: var(--gray-color);
          font-family: var(--font-mono), monospace;
          font-size: 1rem;
        }

        .stats .sp {
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          margin: -2px 0 0 0;
        }

        .stats > span {
          display: flex;
          font-weight: 400;
          align-items: center;
          gap: 3px;
        }

        .stats > span > .text {
          font-family: var(--font-main), sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .stats > span >  .no {
          font-weight: 500;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.9rem;
        }

        .text-content > .sub-text {
          margin: 8px 0 15px;
          font-size: 1rem;
          color: var(--text-color);
          line-height: 1.3;
          font-family: var(--font-main);
          display: flex;
          flex-flow: column;
          gap: 8px;
        }

        .text-content > .actions {
          width: 100%;
          display: flex;
          flex-flow: row;
          gap: 20px;
          padding: 3px 0;
          margin: 0;
        }

        .text-content > .actions > .action {
          text-decoration: none;
          padding: 5px 10px;
          font-weight: 400;
          background: var(--accent-linear);
          color: var(--white-color);
          font-family: var(--font-main), sans-serif;
          cursor: pointer;
          text-transform: lowercase;
          width: max-content;
          font-size: 0.89rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 10px;
        }

        .text-content > .actions > .action.edit,
        .text-content > .actions > .action.stats,
        .text-content > .actions > .action.following,
        .text-content > .actions > .action.subscribed {
          padding: 5px 10px;
          font-weight: 400;
          background: unset;
          border: var(--action-border);
          color: var(--gray-color);
        }

        div.content-container {
          margin: 0;
          padding: 0;
          display: flex;
          flex-flow: column;
          align-items: start;
          flex-wrap: nowrap;
          gap: 15px;
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

				@media screen and (max-width:660px) {
					:host {
            font-size: 16px;
						padding: 0;
            margin: 0;
            display: flex;
            flex-flow: column;
            justify-content: space-between;
            gap: 0;
					}

          section.main {
            width: 100%;
            padding: 0;
          }

          .text-content > .topic-head {
            padding: 15px 0 0 0;
          }

          .text-content > .actions {
            border-bottom: none;
          }

					.action,
					a {
						cursor: default !important;
          }

          div.main-container {
            display: flex;
            flex-flow: column;
            gap: 0;
            padding: 10px 10px 0;
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