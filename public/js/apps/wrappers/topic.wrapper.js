export default class TopicWrapper extends HTMLElement {
  constructor() {
    super();
    this._authenticated = window.hash ? true : false;
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
    let url = this.getAttribute('url').trim().toLowerCase();
    this.checkAndAddHandler();
    const body = document.querySelector('body');
    this.openTopicPage(url);
    this.performActions();
    this.openHighlights(body);
  }

  checkAndAddHandler() {
    if (window.wss) {
      window.wss.addMessageHandler(this.boundHandleWsMessage);
    } else {
      setTimeout(this.checkAndAddHandler, 500);
    }
  }

  disconnectedCallback() {
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
      const subscribersStat = this.shadowObj.querySelector('.stats > span.subscribers');
      if (subscribersStat) {
        const no = subscribersStat.querySelector('.number');
        const text = subscribersStat.querySelector('.label');
        no.textContent = this.formatNumber(subscribers);
        text.textContent = subscribers === 1 ? 'subscriber' : 'subscribers';
      }
    }
  }

  openHighlights = body => {
    const statsBtn = this.shadowObj.querySelector('.actions>.action#stats-action');
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
    let hash = this.getAttribute('hash').trim().toLowerCase();
    const url = '/t/' + hash;
    const followBtn = this.shadowObj.querySelector('.actions>.action#follow-action');

    if (followBtn) {
      followBtn.addEventListener('click', async e => {
        e.preventDefault();
        e.stopPropagation();
        let action = false;

        if (!this._authenticated) {
          this.openJoin(body);
        } else {
          if (followBtn.classList.contains('following')) {
            action = true;
            outerThis.updateFollowBtn(false, followBtn);
          } else {
            outerThis.updateFollowBtn(true, followBtn);
          }

          await this.followTopic(`${url}/follow`, followBtn, action);
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
    // Get followers attribute : concvert to number then add value

    let followers = this.parseToNumber(this.getAttribute('followers')) + value;

    // if followers is less than 0, set it to 0
    followers = followers < 0 ? 0 : followers;

    // Set the followers attribute
    this.setAttribute('followers', followers.toString());

    // Set topic-follow attribute to true or false based on followed bool
    this.setAttribute('topic-follow', `${followed}`);

    // select the followers element
    const followersStat = outerThis.shadowObj.querySelector('.stats > span.followers');
    if (followersStat) {
      // select no element
      const no = followersStat.querySelector('.number');
      const text = followersStat.querySelector('.label');

      // Update the followers
      no.textContent = this.formatNumber(followers);

      // Update the text
      text.textContent = followers === 1 ? 'follower' : 'followers';
    }
  }

  // Open topic page
  openTopicPage = url => {
    // get a.meta.link
    const content = this.shadowObj.querySelector('a.action.view');

    if(content) { 
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        // Get full post
        const topic =  this.getTopic();
        
        // push the post to the app
        this.pushApp(url, topic);
      })
    }
  }

  pushApp = (url, content) => {
    this.app.push(url, { kind: "app", name: 'topic', html: content }, url);
    // navigate to the content
    this.navigateTo(content);
  }

  navigateTo = content => {
    // navigate to the content
    this.app.navigate(content);
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

  getTemplate() {
    // Show HTML Here
    return `
      ${this.getInfo()}
      ${this.getStyles()}
    `;
  }

  getInfo = () => {
    // Get name and check if it's greater than 20 characters
    let name = this.getAttribute('name');

    // Replace - with space and capitalize first letter of the first word using regex: heath-care becomes Heath care
    name = name.toLowerCase().replace(/-/g, ' ');
    
    // Capitalize the first letter of the first word
    const formattedName = name.replace(/^\w/, c => c.toUpperCase());

    return /* html */ `
      <div class="topic">
        <h4 class="name">
          <span class="name">${formattedName}</span>
        </h4>
        ${this.getDescription()}
        ${this.getStats()}
        <div class="actions">
          ${this.checkFollowing(this.getAttribute('topic-follow'))}
        </div>
      </div>
    `
  }

  getDescription = () => {
    // get innerHTML
    const innerHTML = this.innerHTML;

    // remove tags and &gt; and &lt;
    let description = innerHTML.replace(/<[^>]*>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');

    // Check if the description is greater than 100 characters: replace the rest with ...
    let displayDescription = description.length > 120 ? `${description.substring(0, 120)}...` : description;

    return /* html */ `
      <p class="description">${displayDescription}</p>
    `
  }

  checkFollowing = following => {
    // GET url
    const url = this.getAttribute('url');

    if (following === 'true') {
      return /*html*/` 
        <a href="${url.toLowerCase()}" class="action view" id="view-action">view</a>
        <span class="action following" id="follow-action">following</span>
        <span class="action contribute" id="stats-action">stats</span>
			`
    }
    else {
      return /*html*/`
        <a href="${url.toLowerCase()}" class="action view" id="view-action">view</a>
        <span class="action follow" id="follow-action">follow</span>
        <span class="action contribute" id="stats-action">stats</span>
			`
    }
  }

  getStats = () => {
    // Get total followers & following and parse to integer
    const followers = this.getAttribute('followers') || 0;
    const subscribers = this.getAttribute('subscribers') || 0;

    // Convert the followers & following to a number
    const totalFollowers = this.parseToNumber(followers);
    const totalSubscribers = this.parseToNumber(subscribers);

    //  format the number
    const followersFormatted = this.formatNumber(totalFollowers);
    const subscribersFormatted = this.formatNumber(totalSubscribers);


    return /* html */`
      <div class="stats">
        <span class="stat followers">
          <span class="number">${followersFormatted}</span>
          <span class="label">follower${ totalFollowers === 1 ? '' : 's'}</span>
        </span>
        <span class="sp">•</span>
        <span class="stat subscribers">
          <span class="number">${subscribersFormatted}</span>
          <span class="label">subscriber${ totalSubscribers === 1 ? '' : 's'}</span>
        </span>
      </div>
		`
  }

  getTopic = () => {
    // get url
    let url = this.getAttribute('url');
 
    // trim white spaces and convert to lowercase
    url = url.trim().toLowerCase();

    let apiUrl = `${this.getAttribute('url').toLowerCase()}`;

   return /* html */`
    <app-topic tab="article" hash="${this.getAttribute('hash')}" subscribers="${this.getAttribute('subscribers')}"
      followers="${this.getAttribute('followers')}" views="${this.getAttribute('views')}"
      stories="${this.getAttribute('stories')}" subscribed="${this.getAttribute('subscribed')}" topic-follow="${this.getAttribute('topic-follow')}"
      name="${this.getAttribute('name')}" url="${url}" slug="${this.getAttribute('slug')}"
      stories-url="${apiUrl}/stories" followers-url="${apiUrl}/followers" 
      author-hash="${this.getAttribute('author-hash')}" author-you="${this.getAttribute('author-you')}" author-contact='${this.getAttribute("author-contact")}'
      author-stories="${this.getAttribute('author-stories')}" author-img="${this.getAttribute('author-img')}" 
      author-follow="${this.getAttribute('author-follow')}" author-replies="${this.getAttribute('author-replies')}" 
      author-name="${this.getAttribute('author-name')}" author-followers="${this.getAttribute('author-followers')}" 
      author-following="${this.getAttribute('author-following')}" author-verified="${this.getAttribute('author-verified')}" 
      author-bio="${this.getAttribute('author-bio')}">
      ${this.innerHTML}
    </app-topic>
   `
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
          border-bottom: var(--border);
          padding: 10px 0 15px;
          width: 100%;
          display: flex;
          align-items: center;
          flex-flow: column;
          gap: 8px;
        }

        .topic {
          display: flex;
          width: 100%;
          padding: 0;
          display: flex;
          width: 100%;
          flex-flow: column;
          gap: 0;
        }
        
        .topic > h4.name {
          margin: 0;
          display: flex;
          align-items: center;
          color: var(--title-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1.15rem;
          line-height: 1.3;
          font-weight: 500;
          break-word: break-all;
          word-wrap: break-word;
        }
        
        .topic > .hori > a.hash {
          color: var(--gray-color);
          font-family: var(--font-mono), monospace;
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          display: flex;
          gap: 2px;
          padding: 8px 0 0 0;
          align-items: center;
        }

        p.description {
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.93rem;
          font-weight: 400;
          margin: 0;
          line-height: 1.3;
          padding: 0;
          margin: 5px 0;
        }

        div.actions {
          display: flex;
          flex-flow: row;
          width: 100%;
          gap: 10px;
          margin: 10px 0 0 0;
          padding: 0;
        }
        
        div.actions > .action {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          height: max-content;
          width: max-content;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
          background: var(--accent-linear);
          color: var(--white-color);
          font-weight: 500;
          font-size: 0.9rem;
          line-height: 1.3;
          font-weight: 500;
          font-family: var(--font-text), sans-serif;
          cursor: pointer;
          outline: none;
          border: none;
          text-transform: lowercase;
        }
        
        div.actions > .action.contribute,
        div.actions > .action.view,
        div.actions > .action.following {
          padding: 4px 10px;
          background: none;
          border: var(--border-button);
          color: var(--gray-color);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .stats {
          color: var(--gray-color);
          display: flex;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 5px;
          padding: 0;
          margin: 5px 0;
        }

        .stats > span.sp {
          margin: 0 0 0px 0;
          font-size: 0.8rem;
        }

        .stats > .stat {
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .stats > .stat > .label {
          color: var(--gray-color);
          font-family: var(--font-main), sans-serif;
          text-transform: lowercase;
          font-size: 0.93rem;
          font-weight: 400;
        }

        .stats > .stat > .number {
          color: var(--highlight-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
        }     

        @media screen and (max-width:660px) {
          :host {
            font-size: 16px;
          }

          button.action,
          div.actions > .action,
          a {
            cursor: default !important;
          }
      </style>
    `;
  }
}