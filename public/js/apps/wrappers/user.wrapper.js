export default class UserWrapper extends HTMLElement {
  constructor() {
    super();

    this._you = this.getAttribute('you') === 'true';
    this._authenticated = window.hash ? true : false;
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.boundHandleWsMessage = this.handleWsMessage.bind(this);
    this.checkAndAddHandler = this.checkAndAddHandler.bind(this);
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  static get observedAttributes() {
    return ["hash", "picture", "name", "followers", "following", "user-follow", "verified", "url", "reload"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    const followers = this.shadowObj.querySelector('.stats > span.followers > .number');
    const followBtn = this.shadowObj.querySelector('.actions > .action#follow-action');
    if (name === 'reload' && newValue === 'true') {
      this.setAttribute('reload', 'false');
      if (followers) {
        const totalFollowers = this.parseToNumber(this.getAttribute('followers'));
        followers.textContent = totalFollowers >= 0 ? this.formatNumber(totalFollowers) : '0';
      }
      if (followBtn) {
        this.updateFollowBtn(this.textToBoolean(this.getAttribute('user-follow')), followBtn);
      }
    }
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    let url = this.getAttribute('url').trim().toLowerCase();
    this.checkAndAddHandler();
    const body = document.querySelector('body');
    this.handleUserClick(url);
    this.handleActionClick(url);
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
    const authorHash = this.getAttribute('hash').toUpperCase();
    if (data.action === 'connect' && data.kind === 'user') {
      this.handleConnectAction(data, userHash, authorHash);
    }
  }

  handleConnectAction = (data, userHash, authorHash) => {
    const to = data.hashes.to;
    if (to === authorHash) {
      const followers = this.parseToNumber(this.getAttribute('followers')) + data.value;
      this.setAttribute('followers', followers);
      if (data.hashes.from === userHash) {
        const value = data.value === 1 ? 'true' : 'false';
        this.setAttribute('user-follow', value);
      }
      this.setAttribute('reload', 'true');
    }
  }

  sendWsMessage(data) {
    window.wss.sendMessage(data);
  }

  updateFollowersEl = (element, value) => {
    element.setAttribute('followers', value);
  }

  textToBoolean = text => {
    return text === 'true';
  }

  openHighlights = body => {
    const statsBtn = this.shadowObj.querySelector('.actions>.action#highlights-action');
    if (statsBtn) {
      statsBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        body.insertAdjacentHTML('beforeend', this.getHighlights());
      });
    }
  }

  handleUserClick = url => {
    const content = this.shadowObj.querySelector('a#username');
    const profile = this.getProfile();
    if (content) {
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        // push the post to the app
        this.pushApp(url, profile);
      });
    }
  }

  handleActionClick = url => {
    const content = this.shadowObj.querySelector('a.action.view');
    const profile = this.getProfile();
    if (content) {
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        // push the post to the app
        this.pushApp(url, profile);
      });
    }
  }

  pushApp = (url, content) => {
    this.app.push(url, { kind: "app", name: 'profile', html: content }, url);
    // navigate to the content
    this.navigateTo(content);
  }

  navigateTo = content => {
    // navigate to the content
    this.app.navigate(content);
  }

  performActions = () => {
    const body = document.querySelector('body');
    let hash = this.getAttribute('hash').trim().toLowerCase();
    const url = '/u/' + hash;
    const followBtn = this.shadowObj.querySelector('.actions>.action#follow-action');
    if (followBtn) {
      followBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        let action = false;
        if (!this._authenticated) {
          this.openJoin(body);
        } else {
          if (followBtn.classList.contains('following')) {
            action = true;
            this.updateFollowBtn(false, followBtn);
          } else {
            this.updateFollowBtn(true, followBtn);
          }
          this.followUser(`${url}/follow`, followBtn, action);
        }
      });
    }
  }

  followUser = async (url, followBtn, followed) => {
    try {
      const data = await this.api.patch(url, { content: 'json' });
      if (data.unverified) {
        const body = document.querySelector('body');
        this.openJoin(body);
        this.updateFollowBtn(followed, followBtn);
      }
      if (!data.success) {
        this.app.showToast(false, data.message);
        this.updateFollowBtn(followed, followBtn);
      } else {
        this.app.showToast(true, data.message);
        this.updateFollowBtn(data.followed, followBtn);
        this.updateFollowers(data.followed);
      }
    } catch (_error) {
      this.app.showToast(false, 'An error occurred!');
      this.updateFollowBtn(followed, followBtn);
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
      const no = followersStat.querySelector('.number');
      const text = followersStat.querySelector('.label');

      // Update the followers
      no.textContent = this.formatNumber(followers);

      // Update the text
      text.textContent = followers === 1 ? 'follower' : 'followers';
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

  getTemplate() {
    // Show HTML Here
    return `
      ${this.getUser()}
      ${this.getStyles()}
    `;
  }

  getUser = () => {
    // Get name and check if it's greater than 20 characters
    const name = this.getAttribute('name');

    // GET url
    let url = this.getAttribute('url');

    // trim white spaces and convert to lowercase
    url = url.trim().toLowerCase();

    // Check if the name is greater than 20 characters: replace the rest with ...
    let displayName = name.length > 20 ? `${name.substring(0, 20)}..` : name;

    return /* html */ `
      <div class="author">
        <div class="author-info">
          ${this.getPicture(this.getAttribute('picture'))}
          <div class="name">
            <h4 class="name">
              <span class="name">${displayName}</span>
            </h4>
            <a href="${url}" class="username" id="username">
              <span class="text">${this.getAttribute('hash')}</span>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <path d="M4.53 4.75A.75.75 0 0 1 5.28 4h6.01a.75.75 0 0 1 .75.75v6.01a.75.75 0 0 1-1.5 0v-4.2l-5.26 5.261a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L9.48 5.5h-4.2a.75.75 0 0 1-.75-.75Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
      ${this.getBio(this.innerHTML)}
      ${this.getStats()}
      <div class="actions">
        ${this.checkYou(this._you)}
      </div>
    `
  }

  getPicture = picture => {
    // check if picture is empty || null || === "null"
    if (picture === '' || picture === null || picture === 'null') {
      return /*html*/`
        <div class="avatar svg">
          <div class="svg-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"></path>
            </svg>
          </div>
          ${this.checkVerified(this.getAttribute('verified'))}
        </div>
      `
    }
    else {
      return /*html*/`
        <div class="avatar">
          <img src="${picture}" alt="Author picture">
          ${this.checkVerified(this.getAttribute('verified'))}
        </div>
      `
    }
  }

  getBio = bio => {
    // check if bio is empty
    if (bio === '' || bio === null || bio === 'null') {
      return 'The user has no bio';
    }
    else {
      return /*html*/`
        <div class="bio">${bio}</div>
      `
    }
  }

  checkVerified = verified => {
    if (verified !== 'true') return '';
    return /*html*/`
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.3592 1.41412C15.9218 0.966482 15.3993 0.610789 14.8224 0.367944C14.2455 0.125098 13.6259 0 13 0C12.3741 0 11.7545 0.125098 11.1776 0.367944C10.6007 0.610789 10.0782 0.966482 9.64079 1.41412L8.62993 2.45091L7.18354 2.43304C6.55745 2.42563 5.93619 2.54347 5.35631 2.77964C4.77642 3.01581 4.24962 3.36554 3.80687 3.80826C3.36413 4.25098 3.01438 4.77775 2.77819 5.3576C2.542 5.93744 2.42415 6.55866 2.43156 7.18472L2.44781 8.63102L1.41421 9.64181C0.966543 10.0792 0.610827 10.6017 0.367967 11.1785C0.125106 11.7554 0 12.3749 0 13.0008C0 13.6267 0.125106 14.2462 0.367967 14.8231C0.610827 15.3999 0.966543 15.9224 1.41421 16.3598L2.44944 17.3706L2.43156 18.8169C2.42415 19.443 2.542 20.0642 2.77819 20.644C3.01438 21.2239 3.36413 21.7506 3.80687 22.1934C4.24962 22.6361 4.77642 22.9858 5.35631 23.222C5.93619 23.4582 6.55745 23.576 7.18354 23.5686L8.62993 23.5523L9.64079 24.5859C10.0782 25.0335 10.6007 25.3892 11.1776 25.6321C11.7545 25.8749 12.3741 26 13 26C13.6259 26 14.2455 25.8749 14.8224 25.6321C15.3993 25.3892 15.9218 25.0335 16.3592 24.5859L17.3701 23.5507L18.8165 23.5686C19.4426 23.576 20.0638 23.4582 20.6437 23.222C21.2236 22.9858 21.7504 22.6361 22.1931 22.1934C22.6359 21.7506 22.9856 21.2239 23.2218 20.644C23.458 20.0642 23.5758 19.443 23.5684 18.8169L23.5522 17.3706L24.5858 16.3598C25.0335 15.9224 25.3892 15.3999 25.632 14.8231C25.8749 14.2462 26 13.6267 26 13.0008C26 12.3749 25.8749 11.7554 25.632 11.1785C25.3892 10.6017 25.0335 10.0792 24.5858 9.64181L23.5506 8.63102L23.5684 7.18472C23.5758 6.55866 23.458 5.93744 23.2218 5.3576C22.9856 4.77775 22.6359 4.25098 22.1931 3.80826C21.7504 3.36554 21.2236 3.01581 20.6437 2.77964C20.0638 2.54347 19.4426 2.42563 18.8165 2.43304L17.3701 2.44929L16.3592 1.41412Z" 
            fill="currentColor" id="top"/>
        <path d="M15.3256 4.97901C15.0228 4.6691 14.661 4.42285 14.2616 4.25473C13.8623 4.08661 13.4333 4 13 4C12.5667 4 12.1377 4.08661 11.7384 4.25473C11.339 4.42285 10.9772 4.6691 10.6744 4.97901L9.97457 5.69678L8.97322 5.68441C8.53977 5.67928 8.10967 5.76086 7.70821 5.92437C7.30675 6.08787 6.94204 6.32999 6.63553 6.63649C6.32901 6.94298 6.08688 7.30767 5.92336 7.70911C5.75985 8.11054 5.67826 8.54061 5.68339 8.97403L5.69464 9.97532L4.97907 10.6751C4.66914 10.9779 4.42288 11.3396 4.25475 11.739C4.08661 12.1383 4 12.5673 4 13.0006C4 13.4339 4.08661 13.8628 4.25475 14.2621C4.42288 14.6615 4.66914 15.0232 4.97907 15.326L5.69577 16.0258L5.68339 17.0271C5.67826 17.4605 5.75985 17.8906 5.92336 18.292C6.08688 18.6935 6.32901 19.0581 6.63553 19.3646C6.94204 19.6711 7.30675 19.9133 7.70821 20.0768C8.10967 20.2403 8.53977 20.3218 8.97322 20.3167L9.97457 20.3055L10.6744 21.021C10.9772 21.3309 11.339 21.5771 11.7384 21.7453C12.1377 21.9134 12.5667 22 13 22C13.4333 22 13.8623 21.9134 14.2616 21.7453C14.661 21.5771 15.0228 21.3309 15.3256 21.021L16.0254 20.3043L17.0268 20.3167C17.4602 20.3218 17.8903 20.2403 18.2918 20.0768C18.6932 19.9133 19.058 19.6711 19.3645 19.3646C19.671 19.0581 19.9131 18.6935 20.0766 18.292C20.2402 17.8906 20.3217 17.4605 20.3166 17.0271L20.3054 16.0258L21.0209 15.326C21.3309 15.0232 21.5771 14.6615 21.7453 14.2621C21.9134 13.8628 22 13.4339 22 13.0006C22 12.5673 21.9134 12.1383 21.7453 11.739C21.5771 11.3396 21.3309 10.9779 21.0209 10.6751L20.3042 9.97532L20.3166 8.97403C20.3217 8.54061 20.2402 8.11054 20.0766 7.70911C19.9131 7.30767 19.671 6.94298 19.3645 6.63649C19.058 6.32999 18.6932 6.08787 18.2918 5.92437C17.8903 5.76086 17.4602 5.67928 17.0268 5.68441L16.0254 5.69566L15.3256 4.97901ZM15.6485 11.7113L12.2732 15.0864C12.2209 15.1388 12.1588 15.1803 12.0905 15.2087C12.0222 15.2371 11.9489 15.2517 11.8749 15.2517C11.8009 15.2517 11.7276 15.2371 11.6593 15.2087C11.5909 15.1803 11.5289 15.1388 11.4766 15.0864L9.78893 13.3988C9.73662 13.3465 9.69513 13.2844 9.66683 13.2161C9.63852 13.1478 9.62395 13.0745 9.62395 13.0006C9.62395 12.9266 9.63852 12.8534 9.66683 12.785C9.69513 12.7167 9.73662 12.6546 9.78893 12.6023C9.84123 12.55 9.90333 12.5085 9.97166 12.4802C10.04 12.4519 10.1132 12.4373 10.1872 12.4373C10.2612 12.4373 10.3344 12.4519 10.4028 12.4802C10.4711 12.5085 10.5332 12.55 10.5855 12.6023L11.8749 13.8927L14.8519 10.9147C14.9576 10.8091 15.1008 10.7498 15.2502 10.7498C15.3996 10.7498 15.5429 10.8091 15.6485 10.9147C15.7542 11.0204 15.8135 11.1636 15.8135 11.313C15.8135 11.4624 15.7542 11.6056 15.6485 11.7113Z" 
            fill="url(#gradient)" id="bottom"/>
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="1" gradientUnits="userSpaceOnUse">
            <stop offset="-6.72%" stop-color="var(--accent-color)" />
            <stop offset="109.77%" stop-color="var(--accent-alt)" />
          </linearGradient>
        </defs>
      </svg>
		`
  }

  // check is the current user: you === true
  checkYou = you => {
    // get url
    let url = this.getAttribute('url');

    // trim white spaces and convert to lowercase
    url = url.trim().toLowerCase();

    if (you) {
      return /*html*/`
        <span class="action you" id="you-action">you</span>
        <span class="action highlights" id="highlights-action">stats</span>
        <a href="${url}" class="action view" id="view-action">view</a>
      `
    }
    else {
      return /*html*/`
        <a href="${url}" class="action view" id="view-action">view</a>
        ${this.checkFollowing(this.getAttribute('user-follow'))}
        <span class="action highlights" id="highlights-action">stats</span>
      `
    }
  }

  checkFollowing = following => {
    if (following === 'true') {
      return /*html*/`
        <span class="action following" id="follow-action">Following</span>
      `
    }
    else {
      return /*html*/`
        <span class="action follow" id="follow-action">Follow</span>
      `
    }
  }

  getStats = () => {
    // Get total followers & following and parse to integer
    const followers = this.getAttribute('followers') || 0;
    const following = this.getAttribute('following') || 0;

    // Convert the followers & following to a number
    const totalFollowers = this.parseToNumber(followers);
    const totalFollowing = this.parseToNumber(following);

    //  format the number
    const followersFormatted = this.formatNumber(totalFollowers);
    const followingFormatted = this.formatNumber(totalFollowing);


    return /* html */`
      <div class="stats">
        <span class="stat followers">
          <span class="number">${followersFormatted}</span>
          <span class="label">${totalFollowers === 1 ? 'follower' : 'followers'}</span>
        </span>
        <span class="sp">•</span>
        <span class="stat following">
          <span class="number">${followingFormatted}</span>
          <span class="label">following</span>
        </span>
      </div>
		`
  }

  getProfile = () => {
    let url = this.getAttribute('url');
    url = url.trim().toLowerCase();

   return /* html */`
      <app-profile tab="posts" you="${this.getAttribute('you')}" url="${url}"
        posts-url="${url}/posts" replies-url="${url}/replies" posts="${this.getAttribute('posts')}" replies="${this.getAttribute('replies')}"
        followers-url="${url}/followers" following-url="${url}/following"
        hash="${this.getAttribute('hash')}" picture="${this.getAttribute('picture')}" verified="${this.getAttribute('verified')}"
        name="${this.getAttribute('name')}" followers="${this.getAttribute('followers')}" contact='${this.getAttribute("contact")}'
        following="${this.getAttribute('following')}" user-follow="${this.getAttribute('user-follow')}">
        ${this.innerHTML}
      </app-profile>
   `
  }

  getHighlights = () => {
    const url = this.getAttribute('url');
    // trim white spaces and convert to lowercase
    let formattedUrl = url.toLowerCase();

    return /* html */`
      <stats-popup url="${formattedUrl}/stats" name="${this.getAttribute('name')}"
        followers="${this.getAttribute('followers')}" following="${this.getAttribute('following')}" 
        posts="${this.getAttribute('posts')}" replies="${this.getAttribute('replies')}">
      </stats-popup>
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
          padding: 10px 0;
          width: 100%;
          display: flex;
          align-items: center;
          flex-flow: column;
          gap: 10px;
        }

        .author {
          display: flex;
          width: 100%;
          flex-flow: column;
          align-items: start;
        }
        
        .author-info {
          display: flex;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 10px;
        }
        
        .author-info > .avatar {
          position: relative;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
        }

        .author-info > .avatar.svg {
          background: var(--gray-background);
        }
        
        .author-info > .avatar > img {
          width: 100%;
          height: 100%;
          overflow: hidden;
          object-fit: cover;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
        }

        .author-info > .avatar.svg > .svg-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
        }

        .author-info > .avatar.svg > .svg-avatar > svg {
          width: 26px;
          height: 26px;
          color: var(--gray-color);
          display: flex;
          margin: 0 0 2px 0;
        }
        
        .author-info > .avatar > svg {
          position: absolute;
          bottom: 0px;
          right: -7px;
          width: 25px;
          height: 25px;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .author-info > .avatar > svg path#top {
          color: var(--background);
        }
        
        .author-info > .name {
          display: flex;
          justify-content: center;
          flex-flow: column;
          gap: 0;
        }
        
        .author-info > .name > h4.name {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 3px;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 500;
        }
        
        .author-info > .name > a.username {
          color: var(--gray-color);
          font-family: var(--font-mono), monospace;
          font-size: 0.8rem;
          font-weight: 500;
          text-decoration: none;
          display: flex;
          gap: 2px;
          align-items: center;
        }
        
        .author-info > .name > a.username svg {
          color: var(--gray-color);
          width: 15px;
          height: 15px;
          margin: 2px 0 0 0;
        }
        
        .author-info > .name > a.username:hover {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }
        
        .author-info > .name > a.username:hover svg {
          color: var(--accent-color);
        }

        div.bio {
          color: var(--gray-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          line-height: 1.5;
          width: 100%;
          text-align: start;
        }

        .stats {
          color: var(--gray-color);
          display: flex;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 10px;
        }

        .stats > .stat {
          display: flex;
          flex-flow: row;
          align-items: center;
          gap: 5px;
        }

        .stats > .stat > .label {
          color: var(--gray-color);
          font-family: var(--font-main), sans-serif;
          text-transform: lowercase;
          font-size: 0.9rem;
          font-weight: 400;
        }

        .stats > .stat > .number {
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .actions {
          display: flex;
          font-family: var(--font-main), sans-serif;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 12px;
          padding: 0;
        }
        
        .actions > .action {
          border: var(--action-border);
          padding: 3px 12px 4px;
          background: none;
          font-family: var(--font-main), sans-serif;
          border: var(--border-mobile);
          color: var(--gray-color);
          font-weight: 400;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: lowercase;
          text-align: center;
          justify-content: center;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        .actions > .action.you {
          text-transform: capitalize;
          padding: 3px 12px 4px;
          cursor: default;
          pointer-events: none;
          border: none;
          background: var(--gray-background);
        }
        
        .actions > .action.follow {
          border: none;
          padding: 3px 12px 4px;
          font-weight: 500;
          background: var(--accent-linear);
          color: var(--white-color);
        }

        @media screen and (max-width:660px) {
          :host {
            font-size: 16px;
          }

          .actions > .action,
          a {
            cursor: default !important;
          }
      </style>
    `;
  }
}