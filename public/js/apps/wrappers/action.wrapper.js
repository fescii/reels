export default class ActionWrapper extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // check if the user is authenticated
    this._authenticated = window.hash ? true : false;
    this.app = window.app;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.noWrite = this.textToBool(this.getAttribute('no-write'));
    this.parent = this.getRootNode().host;
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  // observe the attributes
  static get observedAttributes() {
    return ['reload', 'likes', 'views', 'replies', 'liked'];
  }

  // listen for changes in the attributes
  attributeChangedCallback(name, oldValue, newValue) {
    // check if old value is not equal to new value
    if (name==='reload') {
      if(newValue === 'true') {
        // set the value of reload to false
        this.setAttribute('reload', 'false');
        this.reRender();
      }
    }
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  textToBool = text => {
    return text === 'true' ? true : false;
  }

  reRender = () => {
    this.render();
    // like post
    this.likePost();
    const liked = this.convertToBool(this.getAttribute('liked'))
    const body = document.querySelector('body');
    this.scrollLikes(liked);
    this.activateReplyButton();
    this.openHighlights(body);
  }

  connectedCallback() {
    // like post
    this.likePost();
    const liked = this.convertToBool(this.getAttribute('liked'))
    const body = document.querySelector('body');
    this.scrollLikes(liked);
    this.activateReplyButton();
    this.openHighlights(body);
  }

  updateViews = (element, value) => {
    // update views in the element and this element
    this.setAttribute('views', value);
    element.textContent = value;
  }

  updateReplies = (element, value) => {
    // update replies in the element and this element
    this.setAttribute('replies', value);
    element.textContent = value;
  }

  setAttributes = (name, value) => {
    this.parent.setAttribute(name, value);
  }

  openHighlights = body => {
    // Get the stats action and subscribe action
    const statsBtn = this.shadowObj.querySelector('.stats > .stat.views');

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

  convertToBool = str => {
    return str === 'true';
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
    this.parent.edit();
  }

  activateReplyButton = () => {
    const replyButton = this.shadowObj.querySelector('span.action.write');
    if(!replyButton) return;
    replyButton.addEventListener('click', e => {
      e.preventDefault();
      this.parent.open();
    });
  }
  
  performActions = async (likeBtn, liked) => {
    let baseUrl = this.getAttribute('url');
    const url = `${baseUrl}/like`;
    await this.like(url, likeBtn, liked);
  }

  like = async (url, likeBtn, liked) => {
    const outerThis = this;
    try {
      const data = await this.api.post(url, { content: 'json' });

      // If data has unverified, open the join popup
      if (data.unverified) {
      // Get body
      const body = document.querySelector('body');

      // Open the join popup
      outerThis.openJoin(body);

      // revert the like button
      outerThis.updateLikeBtn(likeBtn, liked);
      }

      // if success is false, show toast message
      if (!data.success) {
      this.app.showToast(false, data.message);

      // revert the like button
      outerThis.updateLikeBtn(likeBtn, liked);
      } else {
      // Show toast message
      this.app.showToast(true, data.message);

      // check the data.liked
      if (data.liked !== liked) {
        // revert the like button
        outerThis.updateLikeBtn(likeBtn, data.liked ? false : true); 
      }
      }
    } catch (_error) {
      // show toast message
      this.app.showToast(false, 'An error occurred!');

      // revert the like button
      outerThis.updateLikeBtn(likeBtn, liked);
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

  updateLikeBtn = (btn, liked) => {
    const svg = btn.querySelector("svg");

    // Toggle the active class
    btn.classList.toggle("true");

    // Parse the likes to an integer
    const totalLikes = this.parseToNumber(this.getAttribute("likes"));

    // add scaling to the svg: reduce the size of the svg
    svg.style.transform = "scale(0.8)";

    // Add a transition to the svg
    svg.style.transition = "transform 0.2s ease-in-out";

    this.scrollLikes(liked ? false : true);

    // Check if the user has liked the post
    if (liked) {
      // Set the new value of likes
      this.setAttribute("likes", totalLikes - 1);

      // Set the new value of liked
      this.setAttribute("liked", "false");

      // replace the svg with the new svg
      setTimeout(() => {
        svg.innerHTML = `
              <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"></path>
            `;
        // scale the svg back to 1
        svg.style.transform = "scale(1)";
      }, 200);
    } else {
      // Set the new value of likes
      this.setAttribute("likes", totalLikes + 1);

      // Set the new value of liked
      this.setAttribute("liked", "true");

      // replace the svg with the new svg
      setTimeout(() => {
        svg.innerHTML = `
              <path d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.066 22.066 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.044 5.231-3.886 6.818a22.094 22.094 0 0 1-3.433 2.414 7.152 7.152 0 0 1-.31.17l-.018.01-.008.004a.75.75 0 0 1-.69 0Z"></path>
            `;

        // scale the svg back to 1
        svg.style.transform = "scale(1)";
      }, 200);
    }
  }

  // fn to like a post
  likePost = () => {
    const outerThis = this;
    // Select like button
    const likeButton = this.shadowObj.querySelector('.action.like');

    const body = document.querySelector('body');

    // If like button, add event listener
    if (likeButton) {
      // Get the svg node
      const svg = likeButton.querySelector('svg');

      likeButton.addEventListener('click', async e => {
        // prevent the default action
        e.preventDefault()

        // prevent the propagation of the event
        e.stopPropagation();

        // check if the user is authenticated
        // Check if the user is authenticated
        if (!outerThis._authenticated) {
          // Open the join popup
          outerThis.openJoin(body);

          // prevent this function from proceeding
          return;
        } 

        // Toggle the active class
        likeButton.classList.toggle('true');

        // Get the current like status
        const liked = outerThis.convertToBool(this.getAttribute('liked'));

        // Parse the likes to an integer
        const totalLikes = this.parseToNumber(this.getAttribute('likes'));

        // add scaling to the svg: reduce the size of the svg
        svg.style.transform = 'scale(0.8)';

        // Add a transition to the svg
        svg.style.transition = 'transform 0.2s ease-in-out';

        // Check if the user has liked the post
        if (liked) {
          // Set the new value of likes
          this.setAttribute('likes', totalLikes - 1);
          outerThis.setAttributes('likes', totalLikes - 1)

          // Set the new value of liked
          this.setAttribute('liked', 'false');
          outerThis.setAttributes('liked', 'false');

          // replace the svg with the new svg
          setTimeout(() => {
            svg.innerHTML = `
              <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"></path>
            `;
            // scale the svg back to 1
            svg.style.transform = 'scale(1)';
          }, 200);

          // perform like
          await outerThis.performActions(likeButton, false);
        }
        else {
          // Set the new value of likes
          this.setAttribute('likes', totalLikes + 1);
          outerThis.setAttributes('likes', totalLikes + 1);

          // Set the new value of liked
          this.setAttribute('liked', 'true');
          outerThis.setAttributes('liked', 'true');

          // replace the svg with the new svg
          setTimeout(() => {
            svg.innerHTML = `
              <path d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.066 22.066 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.044 5.231-3.886 6.818a22.094 22.094 0 0 1-3.433 2.414 7.152 7.152 0 0 1-.31.17l-.018.01-.008.004a.75.75 0 0 1-.69 0Z"></path>
            `;

            // scale the svg back to 1
            svg.style.transform = 'scale(1)';
          }, 200);

          // perform like
          await outerThis.performActions(likeButton, true)
        }
        // Scroll the likes
        this.scrollLikes(liked ? false : true);
      });
    }
  }

  // fn to scroll likes numbers: bring the appropriate number into view
  scrollLikes = liked => {
    // Get the numbers container
    const numbers = this.shadowObj.querySelector('.numbers.likes');

    // Get the previous and next elements
    if (numbers) {
      const prevElement = numbers.querySelector('#prev');
      const nextElement = numbers.querySelector('#next');

      // Check if the elements exist
      if (prevElement && nextElement) {
        // Get the height of the container
        const containerHeight = numbers.clientHeight;

        // Get the height of the previous and next elements
        // const prevHeight = prevElement.clientHeight;
        const nextHeight = nextElement.clientHeight;

        // If the user has liked the post, scroll to the next element
        if (liked) {
          // Scroll to the next element
          // numbers.scrollTo({ top: nextElement.offsetTop - containerHeight + nextHeight, behavior: 'smooth' });
          // numbers.scrollTo({ top: nextElement.offsetTop - containerHeight + nextHeight, behavior: 'smooth' });

          // Scroll to the next element using custom scrollTo
          this.scrollTo(numbers, nextElement.offsetTop - containerHeight + nextHeight, 200);
        }
        else {
          // Scroll to the top of the container
          // numbers.scrollTo({ top: 0, behavior: 'smooth' });

          // Scroll to the top of the container using custom scrollTo
          this.scrollTo(numbers, 0, 200);
        }
      }
    }
  }

  // Define the easeInOutQuad function for smoother scrolling
  easeInOutQuad = (t, b, c, d) => {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  };

  // Create a custom smooth scrollTo to accommodate chrome and other browsers
  scrollTo = (element, to, duration) => {
    const outThis = this;

    // Get the current scroll position
    let start = element.scrollTop,
      change = to - start,
      currentTime = 0,
      increment = 20;

    // Create the animation
    const animateScroll = function () {
      currentTime += increment;
      let val = outThis.easeInOutQuad(currentTime, start, change, duration);
      element.scrollTop = val;
      if (currentTime < duration) {
        setTimeout(animateScroll, increment);
      }
    };
    animateScroll();
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

  getTemplate = () => {
    // Show HTML Here
    return /* html */`
      ${this.getStats()}
      <link rel="stylesheet" href="/static/css/theme.css">
      ${this.getStyles()}
    `;
  }

  getStats = () => {
    const preview = this.getAttribute('preview');
    const kind = this.getAttribute('kind');
    let className = kind === "reply" && preview === 'true' ? "preview" : '';
    return /* html */`
      <div class="actions stats ${className}">
        ${this.getArrow(this.getAttribute('kind'), this.getAttribute('preview'))}
        ${this.getWrite()}
        ${this.getLike(this.getAttribute('liked'))}
        ${this.getViews()}
        ${this.getShare()}
      </div>
		`
  }

  getArrow = (kind, preview) => {
    if (preview === "false") return '';
    if (kind === 'reply') {
      return /*html*/`
        <span class="reply arrow">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
            <defs>
              <linearGradient id="gradient" gradientTransform="rotate(0)">
                <stop offset="0%" stop-color="var(--action-linear-start)" />
                <stop offset="100%" stop-color="var(--action-linear-end)" />
              </linearGradient>
            </defs>
            <path fill="url(#gradient)" d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      `
    }
    else  return '';
  }

  getWrite = () => {
    let write = this.noWrite ? 'no-write' : 'write';
    return /*html*/`
      <span class="action ${write}">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M8.5 14.5H15.5M8.5 9.5H12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M14.1706 20.8905C18.3536 20.6125 21.6856 17.2332 21.9598 12.9909C22.0134 12.1607 22.0134 11.3009 21.9598 10.4707C21.6856 6.22838 18.3536 2.84913 14.1706 2.57107C12.7435 2.47621 11.2536 2.47641 9.8294 2.57107C5.64639 2.84913 2.31441 6.22838 2.04024 10.4707C1.98659 11.3009 1.98659 12.1607 2.04024 12.9909C2.1401 14.536 2.82343 15.9666 3.62791 17.1746C4.09501 18.0203 3.78674 19.0758 3.30021 19.9978C2.94941 20.6626 2.77401 20.995 2.91484 21.2351C3.05568 21.4752 3.37026 21.4829 3.99943 21.4982C5.24367 21.5285 6.08268 21.1757 6.74868 20.6846C7.1264 20.4061 7.31527 20.2668 7.44544 20.2508C7.5756 20.2348 7.83177 20.3403 8.34401 20.5513C8.8044 20.7409 9.33896 20.8579 9.8294 20.8905C11.2536 20.9852 12.7435 20.9854 14.1706 20.8905Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
        </svg>
        ${this.getReplies()}
      </span>
    `
  }

  getReplies = () => {
    const replies = this.getAttribute('replies') || 0;
    const totalReplies = this.parseToNumber(replies);
    const opinionsFormatted = this.formatNumber(totalReplies);
    return /*html*/`
      <span class="numbers">
        <span id="prev">${opinionsFormatted}</span>
      </span>
    `
  }

  getViews = () => {
    // Get total views and parse to integer
    const views = this.getAttribute('views') || 0;
    const totalViews = this.parseToNumber(views);
    const viewsFormatted = this.formatNumber(totalViews);

    return /*html*/`
      <span class="stat views">
        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="4.48" width="1.5" height="11.52" fill="currentColor"/>
          <rect x="7" y="0.32" width="1.5" height="15.68" fill="currentColor"/>
          <rect x="12" y="7.68" width="1.5" height="8.32" fill="currentColor"/>
        </svg>
        <span class="views-numbers">${viewsFormatted}</span>
      </span>
    `
  }

  getLike = liked => {
    if (liked === 'true') {
      return /*html*/`
        <span class="action like true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M7.655 14.916v-.001h-.002l-.006-.003-.018-.01a22.066 22.066 0 0 1-3.744-2.584C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.044 5.231-3.886 6.818a22.094 22.094 0 0 1-3.433 2.414 7.152 7.152 0 0 1-.31.17l-.018.01-.008.004a.75.75 0 0 1-.69 0Z"></path>
          </svg>
          <span class="numbers likes">
            ${this.getLikeNumbers()}
          </span>
        </span>
			`
    }
    else {
      return /*html*/`
        <span class="action like">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"></path>
          </svg>
          <span class="numbers likes">
            ${this.getLikeNumbers()}
          </span>
        </span>
			`
    }
  }

  getLikeNumbers = () => {
    // Get total likes and parse to integer
    const likes = this.getAttribute('likes') || 0;
    const totalLikes = this.parseToNumber(likes);
    const likesFormatted = this.formatNumber(totalLikes);
    const liked = this.getAttribute('liked') || 'false';
    if (liked === 'true') {
      // next value is the current value
      const nextValue = likesFormatted;

      // Get the previous value by subtracting 1, if the value is less than 0, return 0: wrap in formatNumber
      const prevValue = this.formatNumber(totalLikes - 1 >= 0 ? totalLikes - 1 : 0);


      // Return the HTML for prev and next values
      return /*html*/`
        <span id="prev">${prevValue}</span>
        <span id="next">${nextValue}</span>
      `
    }
    else {
      // next value is the current value + 1
      const nextValue = this.formatNumber(totalLikes + 1);

      // the previous value is the current value
      const prevValue = likesFormatted;

      // Return the HTML for prev and next values
      return /*html*/`
        <span id="prev">${prevValue}</span>
        <span id="next">${nextValue}</span>
      `
    }
  }

  getShare = () => {
    // Get url to share
    const url = this.getAttribute('url');
    let host = window.location.protocol + '//' + window.location.host;
    const shareUrl = `${host}${url}`;
    const title = this.getAttribute('summary');
    return /* html */`
      <share-wrapper url="${shareUrl.toLowerCase()}" summary="${title}" you="${this.getAttribute('you')}"></share-wrapper>
    `
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
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
        }

        .actions.stats {
          padding: 0;
          margin: 0 0 0 0;
          display: flex;
          flex-flow: row;
          align-items: center;
          gap: 0;
        }

        span.write.action,
        span.no-write.action {
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          font-family: var(--font-text) sans-serif;
          font-size: 0.95rem;
          justify-content: start;
          gap: 5px;
          padding: 5px 7px;
          height: 30px;
          border-radius: 50px;
          font-weight: 500;
          font-size: 1rem;
          color: var(--gray-color);
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          -ms-border-radius: 50px;
          -o-border-radius: 50px;
        }

        span.write.action > svg,
        span.no-write.action > svg {
          width: 17px;
          height: 17px;
          margin: -1px 0 0;
        }

        span.write.action span.line,
        span.no-write.action span.line {
          background: var(--accent-linear);
          position: absolute;
          top: 30px;
          left: 18px;
          display: none;
          width: 3px;
          height: 16px;
          border-radius: 5px;
        }

        span.write.action.open span.line,
        span.no-write.action.open span.line {
          display: inline-block;
        }

        span.write.action.open,
        span.no-write.action.open {
          color: var(--accent-color);
        }

        span.write.action.open > span.numbers,
        span.no-write.action.open > span.numbers {
          color: transparent;
          background: var(--accent-linear);
          font-weight: 500;
          background-clip: text;
          -webkit-background-clip: text;
        }

        span.stat,
        span.action {
          min-height: 35px;
          height: 30px;
          width: max-content;
          position: relative;
          padding: 5px 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 1rem;
          font-weight: 400;
          color: var(--action-color);
          color: var(--gray-color);
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          -ms-border-radius: 50px;
          -o-border-radius: 50px;
        }

        .reply.arrow {
          all: unset;
          z-index: 4;
          margin: 3px 0 0 -6.5px;
        }

        span:first-of-type {
          margin: 0 0 0 -8px;
        }

        .actions.preview > span.action.write {
          margin: 0 0 0 -4.5px;
        }

        span.play:hover,
        span.stat:hover,
        span.action:hover {
          background: var(--hover-background);
        }

        .action span.numbers {
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 500;
        }

        .action span {
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          font-size: 1rem;
          font-weight: 400;
        }

        .action > .numbers {
          height: 21px;
          min-height: 21px;
          padding: 0;
          margin: 0;
          display: flex;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
          scrollbar-width: none;
          gap: 0;
          align-items: start;
          justify-content: start;
          flex-flow: column;
          transition: height 0.5s ease, min-height 0.5s ease; 
          -ms-overflow-style: none;
          scrollbar-width: none;
          will-change: transform;
        }

        span > .numbers::-webkit-scrollbar {
          display: none !important;
          visibility: hidden;
        }

        span > .numbers > span {
          scroll-snap-align: start;
          transition: height 0.5s ease, min-height 0.5s ease;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 21px;
          min-height: 21px;
          padding: 3px 0;
          margin: 0;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
          font-size: 0.95rem;
        }

        span.true > .numbers > span,
        span.active > .numbers > span {
          color: transparent;
          background: var(--second-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        span.up > .numbers > span {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        span.down > .numbers > span {
          color: transparent;
          background: var(--error-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .stat > .views-numbers {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          margin: 0 0 -1.5px 0;
          font-size: 0.95rem;
          font-weight: 400;
          font-family: var(--font-main), sans-serif;
        }

        span svg {
          color: inherit;
          width: 16px;
          height: 16px;
        }

        .reply.arrow > svg {
          width: 20px;
          height: 20px;
          rotate: 90deg;
        }

        span.action.like svg {
          margin: -1px 0 0 0;
          width: 16px;
          height: 16px;
          transition: transform 0.5s ease;
        }

        span.stat.views svg {
          color: inherit;
          width: 16px;
          height: 16px;
          margin: -3px 0 0 0;
        }

        span.stat.up svg {
          color: var(--accent-color);
        }

        span.stat.down svg {
          color: var(--error-color);
        }

        span.true svg,
        span.active svg {
          color: var(--alt-color);
        }

        @media screen and (max-width: 660px) {
          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          :host {
            padding: 0;
          }

          a,
          span.stat,
          span.action {
            cursor: default !important;
          }

          span.play:hover,
          span.stat:hover,
          span.action:hover {
            background: none;
          }
        }
      </style>
    `;
  }
}