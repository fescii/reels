export default class ProfileWrapper extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // check if the user is authenticated
    this._authenticated = window.hash ? true : false;

    // Get if the user is the current user
    this._you = this.getAttribute('you') === 'true';
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.parent = this.getRootNode().host;
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  // observe the attributes
  static get observedAttributes() {
    return ['followers', 'user-follow', 'reload'];
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  // listen for changes in the attributes
  attributeChangedCallback(name, oldValue, newValue) {
    // check if old value is not equal to new value
    if (name==='reload' && newValue === 'true') {
      this.setAttribute('reload', 'false');
      // get the followers element
      const followers = this.shadowObj.querySelector('.stats > span.followers > .number');

      // Update the followers
      if(followers) {
        const totalFollowers = this.parseToNumber(this.getAttribute('followers'));
        followers.textContent = totalFollowers >= 0 ? this.formatNumber(totalFollowers) : '0';
      }

      // get the follow button
      const followBtn = this.shadowObj.querySelector('.actions > .action#follow-action');

      // Update the follow button
      if(followBtn) {
        this.updateFollowBtn(this.textToBoolean(this.getAttribute('user-follow')), followBtn);
      }
    }  
  }

  connectedCallback() {
    // perform actions
    this.performActions();

    // open highlights
    this.openHighlights();
    this.openContact();
    this.openSettings();
  }

  textToBoolean = text => {
    return text === 'true' ? true : false;
  }

  setAttributes = (name, value) => {
    this.parent.setAttribute(name, value);
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

  // Open user profile
  openSettings = () => {
    const outerThis = this;
    // get a.meta.link
    const content = this.shadowObj.querySelector('.actions > a.action.edit');

    if(content) { 
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        const url = content.getAttribute('href');
        try {
          const profile =  outerThis.getEdit();
          // push the post to the app
        this.pushApp(url, profile);
        } catch (error) {
          window.location.href = url;
        }
      })
    }
  }

  pushApp = (url, content) => {
    this.app.push(url, { kind: "app", name: 'user', html: content }, url);
    // navigate to the content
    this.navigateTo(content);
  }

  navigateTo = content => {
    // navigate to the content
    this.app.navigate(content);
  }

  openHighlights = () => {
    // Get body
    const body = document.querySelector('body');
    // Get the stats action and subscribe action
    const statsBtn = this.shadowObj.querySelector('.actions>.action#highlights-action');

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

  openContact = () => {
    // Get body
    const body = document.querySelector('body');
    // Get the social action and subscribe action
    const socialBtn = this.shadowObj.querySelector('.actions>.action#socials-action');

    // add event listener to the social action
    if (socialBtn) {
      socialBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        // Open the highlights popup
        body.insertAdjacentHTML('beforeend', this.getContact());
      });
    }
  }

  // perform actions
  performActions = () => {
    const outerThis = this;
    // get body 
    const body = document.querySelector('body');

    // get url to 
    let hash = this.getAttribute('hash');
    // trim and convert to lowercase
    hash = hash.trim().toLowerCase();

    // base api
    const url = '/u/' + hash;

    // Get the follow action and subscribe action
    const followBtn = this.shadowObj.querySelector('.actions>.action#follow-action');

    // add event listener to the follow action
    if (followBtn) {
      followBtn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        let action = false;

        // Check if the user is authenticated
        if (!this._authenticated) {
          // Open the join popup
          this.openJoin(body);
        } 
        else {
          // Update the follow button
          if (followBtn.classList.contains('following')) {
            action = true;
            outerThis.updateFollowBtn(false, followBtn);
          }
          else {
            outerThis.updateFollowBtn(true, followBtn);
          }

          // Follow the topic
          this.followUser(`${url}/follow`, followBtn, action);
        }
      });
    }
  }

  followUser = async (url, followBtn, followed) => {
    const outerThis = this;
    try {
      const data = await this.api.patch(url, { content: 'json' });

      if (data.unverified) {
        const body = document.querySelector('body');
        outerThis.openJoin(body);
        outerThis.updateFollowBtn(followed, followBtn);
      } else if (!data.success) {
        this.app.showToast(false, data.message);
        outerThis.updateFollowBtn(followed, followBtn);
      } else {
        this.app.showToast(true, data.message);
        outerThis.updateFollowBtn(data.followed, followBtn);
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
    // Get followers attribute : convert to number then add value

    let followers = this.parseToNumber(this.getAttribute('followers')) + value;

    // if followers is less than 0, set it to 0
    followers = followers < 0 ? 0 : followers;

    // set user follow attribute
    this.setAttribute('user-follow', followed.toString());

    // Set the followers attribute
    // this.setAttribute('followers', followers.toString());

    // this.setAttributes('followers', followers)

    this.setAttributes('user-follow', followed.toString());

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

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getContent()}
      ${this.getStyles()}
    `;
  }

  getContent = () => {
    return /* html */`
      ${this.getHeader()}
      ${this.getBio(this.innerHTML)}
      ${this.getActions()}
		`
  }

  getHeader = () => {
    // Get name and check if it's greater than 20 characters
    const name = this.getAttribute('name');

    // Check if the name is greater than 20 characters: replace the rest with ...
    let displayName = name.length > 25 ? `${name.substring(0, 25)}..` : name;

    return /* html */ `
      <div class="top">
        ${this.getPicture(this.getAttribute('picture'))}
        <div class="info">
          <div class="name">
            <h4 class="name">
              <span class="name">${displayName}</span>
            </h4>
            <span class="username">
              <span class="text">${this.getAttribute('hash')}</span>
            </span>
          </div>
          ${this.getStats()}
        </div>
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

  checkVerified = verified => {
    if (verified === 'true') {
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
    else {
      return ''
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

  getActions = () => {
    // You is true
    if (this._you) {
      return /*html*/`
        <div class="actions">
          <span class="action highlights" id="highlights-action">stats</span>
          <a href="/user/name" class="action edit" id="edit-action">Edit</a>
          <span class="action socials" id="socials-action">socials</span>
        </div>
      `
    }
    else {
      return /*html*/`
        <div class="actions">
          <span class="action highlights" id="highlights-action">stats</span>
          ${this.checkFollowing(this.getAttribute('user-follow'))}
          <span class="action socials" id="socials-action">socials</span>
        </div>
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

  getHighlights = () => {
    // get url
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

  getContact = () => {
    // get url
    const url = this.getAttribute('url');
  
    // trim white spaces and convert to lowercase
    let formattedUrl = url.toLowerCase();

    return /* html */`
      <contact-popup url="${formattedUrl}/contact" name="${this.getAttribute('name')}" contact='${this.getAttribute("contact")}'></contact-popup>
    `
  }

  getEdit = () => {
    const url = this.getAttribute('url');
    const str = this.getAttribute('contact');
    let contact= {};
    if (str !== null || str !== '' || str !== 'null') {
      try {
        contact = JSON.parse(str);
      }
      catch (error) {
        contact = {};
      }
    }
    let bio = this.getAttribute('author-bio') || 'This author has not provided a bio yet.';
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return /*html*/`
      <app-user hash="${this.getAttribute('hash')}" home-url="/home" current="name" verified="${this.getAttribute('verified')}"
        posts-url="${url}/posts" replies-url="${url}/replies" posts="${this.getAttribute('posts')}" replies="${this.getAttribute('replies')}" 
        user-link="${contact?.link ? contact.link : ''}" user-email="${contact?.email ? contact.email : ''}" user-x="${contact?.x ? contact.x : ''}" 
        user-threads="${contact?.threads ? contact.threads : ''}" user-linkedin="${contact.linkedin ? contact.linkedin : ''}" email="${contact?.email ? contact.email : ''}" 
        user-username="${this.getAttribute('hash')}" user-contact='${str}'
        user-you="true" user-url="${url}" user-img="${this.getAttribute('picture')}" user-verified="${this.getAttribute('verified')}"
        user-name="${this.getAttribute('name')}" user-followers="${this.getAttribute('followers')}" user-following="${this.getAttribute('following')}"
        user-follow="${this.getAttribute('user-follow')}" user-bio="${bio}">
      </app-user>
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
          padding: 0;
          width: 100%;
          min-width: 100%;
          display: flex;
          flex-flow: column;
          align-items: start;
          gap: 0px;
        }

        .top {
          display: flex;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 8px;
        }

        .top > .avatar {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          min-width: 100px;
          min-height: 100px;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
        }

        .top > .avatar.svg {
          background: var(--gray-background);
        }

        .top > .avatar > .svg-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
        }

        .top > .avatar > .svg-avatar svg {
          width: 50px;
          height: 50px;
          color: var(--gray-color);
          display: inline-block;
          margin: 0 0 5px 0;
        }

        .top > .avatar > img {
          width: 99px;
          height: 99px;
          object-fit: cover;
          overflow: hidden;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
        }

        .top > .avatar > svg {
          position: absolute;
          bottom: 0px;
          right: -5px;
          width: 35px;
          height: 35px;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }

        .top > .avatar > svg path#top {
          color: var(--background);
        }

        .top > .info {
          display: flex;
          flex-flow: column;
          padding: 5px 0 0 10px;
          gap: 10px;
          align-items: start;
          justify-content: center;
          align-content: center;
          width: calc(100% - 100px);
          max-width: calc(100% - 100px);
          height: 100px;
          max-height: 100px;
        }

        .top > .info > .name {
          display: flex;
          justify-content: center;
          flex-flow: column;
          gap: 0;
        }

        .top > .info > .name > h4.name {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--text-color);
          font-family: var(--font-read), sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .top > .info > .name > span.username {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
          font-family: var(--font-mono), monospace;
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          display: flex;
          gap: 2px;
          align-items: center;
        }

        .top > .info > .name > span.username svg {
          color: var(--gray-color);
          width: 15px;
          height: 15px;
          margin: 2px 0 0 0;
        }

        .top > .info > .name > span.username:hover {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .top > .info > .name > span.username:hover svg {
          color: var(--accent-color);
        }

        .stats {
          color: var(--gray-color);
          display: flex;
          margin: 10px 0 5px 0;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 5px;
        }

        .stats > .stat {
          display: flex;
          flex-flow: row;
          align-items: center;
          gap: 3px;
        }

        .stats > .stat > .label {
          color: var(--gray-color);
          font-family: var(--font-main), sans-serif;
          text-transform: lowercase;
          font-size: 0.9rem;
          font-weight: 400;
        }

        .stats > .stat > .number {
          color: var(--highlight-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.84rem;
          font-weight: 500;
        }

        div.bio {
          margin: 8px 0;
          color: var(--gray-color);
          font-family: var(--font-read), sans-serif;
          font-size: 1rem;
          font-weight: 400;
          line-height: 1.5;
          width: 100%;
          text-align: start;
        }

        .actions {
          border-bottom: var(--border);
          width: 100%;
          display: flex;
          flex-flow: row;
          gap: 20px;
          padding: 3px 0 15px 0;
          margin: 0;
        }

        .actions > .action {
          text-decoration: none;
          padding: 4px 12px;
          font-weight: 500;
          background: var(--accent-linear);
          color: var(--white-color);
          font-family: var(--font-main), sans-serif;
          cursor: pointer;
          width: max-content;
          text-transform: lowercase;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 12px;
        }

        .actions > .action.donate {
          background: var(--second-linear);
        }

        .actions > .action.you {
          text-transform: capitalize;
          padding: 5px 12px;
          cursor: default;
          pointer-events: none;
          border: none;
          color: var(--gray-color);
          background: var(--gray-background);
        }

        .actions > .action.edit,
        .actions > .action.socials,
        .actions > .action.following,
        .actions > .action.settings {
          padding: 5px 12px;
          background: unset;
          border: var(--action-border);
          color: var(--gray-color);
        }

        .actions > .action.highlights {
          background: var(--gray-background);
          color: var(--gray-color);
          padding: 5px 12px;
        }

        @media screen and (max-width: 660px) {
          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          :host {
            padding: 0 10px;
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

          .top > .avatar {
            width: 80px;
            height: 80px;
            min-width: 80px;
            min-height: 80px;
            border-radius: 50%;
            -webkit-border-radius: 50%;
            -moz-border-radius: 50%;
          }
  
          .top > .avatar > img {
            width: 100%;
            height: 100%;
          }
  
          .top > .avatar > .icon {
            background: var(--background);
            position: absolute;
            bottom: 0;
            right: 0;
            width: 25px;
            height: 25px;
            z-index: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
          }
          
          .top > .avatar > .icon svg {
            width: 18px;
            height: 18px;
            color: var(--accent-color);
          }
  
          .top > .info {
            display: flex;
            flex-flow: column;
            padding: 0 0 0 10px;
            gap: 10px;
          }

          .top > .info > .name > h4.name {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 5px;
            color: var(--text-color);
            font-family: var(--font-text), sans-serif;
            font-size: 1.3rem;
            font-weight: 600;
          }

          .stats {
            margin: 0 5px 0 0;
            width: 100%;
            gap: 5px;
          }
        }
      </style>
    `;
  }
}