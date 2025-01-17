export default class PreviewPost extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this._url = this.getAttribute('url');

    this._story = null;
    this._reply = null;
    this._item = '';

    // let's create our shadow root
    this.shadowObj = this.attachShadow({mode: 'open'});

    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const contentContainer = this.shadowObj.querySelector('div.preview');

    // Close the modal
    if (contentContainer) {
      this.activateBtn(contentContainer);
      this.activateFetchPreview(contentContainer);
    }
  }

  activateFetchPreview = contentContainer => {
    this.fetchPreview(contentContainer);
  }

  activateBtn = contentContainer => {
    const btn = this.shadowObj.querySelector('button.fetch');

    if (btn && contentContainer) {
      btn.addEventListener('click', event => {
        event.preventDefault();
        this.fetchPreview(contentContainer);
      })
    }
  }

  activateCloseBtn = contentContainer => {
    const outerThis = this;
    const closeBtn = this.shadowObj.querySelector('.action.close');

    if (closeBtn && contentContainer) {
      closeBtn.addEventListener('click', event => {
        event.preventDefault();
        contentContainer.innerHTML = /*html*/`<button class="fetch">Preview</button>`;

        // activate the button
        outerThis.activateBtn(contentContainer);
      });
    }
  }

  fetchPreview = contentContainer => {
    const outerThis = this;
    // Add the loader
    contentContainer.innerHTML = this.getLoader();
		const previewLoader = this.shadowObj.querySelector('#loader-container');

    // Check if reply or story is already fetched
    if (this._story || this._reply) {
      // remove the loader
      previewLoader.remove();

      if(this._story) {
        // set this._item
        this._item = this.mapStory(this._story);

        // switch kind of story
        switch(this._story.kind) {
          case 'post':
            contentContainer.innerHTML = outerThis.populatePost(this._story);
            break;
          case 'poll':
            contentContainer.innerHTML = outerThis.populatePoll(this._story);
            break;
          case 'story':
            contentContainer.innerHTML = outerThis.populateStory(this._story);
            break;
        }
      } else {
        // set this._item
        this._item = this.mapReply(this._reply);
        contentContainer.innerHTML = outerThis.populateReply(this._reply);
      }

      // activate the close button
      outerThis.activateCloseBtn(contentContainer);

      // open the story
      this.openStory();

      // open the read more
      this.openReadMore();
      // open the url
      this.openUrl();
      // style lastBlock
      this.styleLastBlock()
      return;
    }

		setTimeout(async () => {
      // fetch the user stats
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          // Set cookie age to 2 hours
          'Cache-Control': 'public, max-age=7200'
        }
      };

      try {
        const result = await this.getCacheData(this._url, 7200, options)

        // check if not successful
        if (!result.success) {
          // display error message
          const content = outerThis.getEmpty();
          previewLoader.remove();
          contentContainer.innerHTML = content;;

          // activate close button
          outerThis.activateCloseBtn(contentContainer);

          // activate the button
          outerThis.activateBtn(contentContainer);

          return;
        }

        // check if story
        if (result.story) {
          const story = result.story;
          outerThis._story = story;

          // set this._item
          this._item = this.mapStory(story);

          // remove the loader
          previewLoader.remove();

          // switch kind of story
          switch(story.kind) {
            case 'post':
              contentContainer.innerHTML = outerThis.populatePost(story);
              break;
            case 'poll':
              contentContainer.innerHTML = outerThis.populatePoll(story);
              break;
            case 'story':
              contentContainer.innerHTML = outerThis.populateStory(story);
              break;
          }

          // activate the close button
          outerThis.activateCloseBtn(contentContainer);

          // open the story
          this.openStory();

          // open the read more
          this.openReadMore();
          // open the url
          this.openUrl();

          // style lastBlock
          this.styleLastBlock()
        }
        else if (result.reply) {
          const reply = result.reply;
          outerThis._reply = reply;

          // set this._item
          this._item = this.mapReply(reply);
          
          // remove the loader
          previewLoader.remove();

          // insert the content
          contentContainer.innerHTML = outerThis.populateReply(reply);

          // activate the close button
          outerThis.activateCloseBtn(contentContainer);

          // open the story
          this.openStory();

          // open the read more
          this.openReadMore();
          // open the url
          this.openUrl();
          // style lastBlock
          this.styleLastBlock()
        }
        else {
          // display error message
          const content = outerThis.getEmpty();
          previewLoader.remove();
          contentContainer.innerHTML = content;;

          // activate close button
          outerThis.activateCloseBtn(contentContainer);

          // activate the button
          outerThis.activateBtn(contentContainer);
        }
      } catch (error) {
        // display error message
        const content = outerThis.getEmpty();
        previewLoader.remove();
        contentContainer.innerHTML = content;;

        // activate close button
        outerThis.activateCloseBtn(contentContainer);

        // activate the button
        outerThis.activateBtn(contentContainer);
      }
		}, 100)
	}

  fetchWithTimeout = async (url, options = {}, timeout = 9500) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
  
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw new Error(`Network error: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  getCacheData = async (url, maxAge, options = {}) => {
    const cacheName = "user-cache";
  
    try {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(url);
  
      if (cachedResponse) {
        const cachedData = await cachedResponse.json();
        const cacheTime = cachedData.timestamp;
  
        // Check if cache is still valid
        if (Date.now() - cacheTime < maxAge) {
          return cachedData.data;
        }
      }
  
      // If cache doesn't exist or is expired, fetch new data
      const networkResponse = await this.fetchWithTimeout(url, options);
      const data = await networkResponse.clone().json();
  
      // Store the new data in cache with a timestamp
      const cacheData = {
        data: data,
        timestamp: Date.now()
      };
      
      const cacheResponse = new Response(JSON.stringify(cacheData));
      await cache.put(url, cacheResponse);
  
      return data;
    } catch (error) {
      throw error;
    }
  }

  populateStory = story => {
    const author = story.story_author
    author.you = story.you
    author.time = story.createdAt
    const url = `/p/${story.hash.toLowerCase()}`
    const itemContent = this.removeHtml(story.content, story.title)
    return this.getContent(itemContent, url, story.views, story.likes, author);
  }

  populateReply = reply => {
    const author = reply.reply_author;
    author.you = reply.you;
    author.time = reply.createdAt;
    const url = `/r/${reply.hash.toLowerCase()}`;
    const itemContent = this.getPost(reply.content);
    return this.getContent(itemContent, url, reply.views, reply.likes, author);
  }

  populatePost = story => {
    const author = story.story_author
    author.you = story.you
    author.time = story.createdAt
    const url = `/p/${story.hash.toLowerCase()}`
    const itemContent = this.getPost(story.content);
    return this.getContent(itemContent, url, story.views, story.likes, author);
  }

  populatePoll = story => {
    const author =story.story_author;
    author.you = story.you;
    author.time = story.createdAt;
    const poll = { 
      hash: story.hash,
      votes: story.votes,
      selected: story.option,
      end: story.end,
      voted: story.option ? 'true' : 'false',
      options: story.poll,
      content: story.content
    }
    const pollContent = this.getPoll(poll);
    const url =`/p/${story.hash.toLowerCase()}`;
    return this.getContent(pollContent, url, story.views, story.likes, author);
  }

  getPoll = poll =>  {
    const mql = window.matchMedia('(max-width: 660px)');
    // Remove html tags
    const contentStr = poll.content.replace(/<[^>]*>/g, '');
    const contentLength = contentStr.length;

    let chars = 250;

    // Check if its a mobile view
    if (mql.matches) {
      chars = 200;
    }

    // Check if content length is greater than :chars
    if (contentLength > chars) {
      return /*html*/`
        <div class="content extra ${chars <= 200 ? 'mobile' : ''}" id="content">
          ${poll.content}
          <div class="read-more">
            <span class="action">view more</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
          </div>
        </div>
        <votes-wrapper reload="false" votes="${poll.votes}" selected="${poll.selected}"
          hash="${poll.hash}"
          end-time="${poll.end}" voted="${poll.voted}" options="${poll.options}">
        </votes-wrapper>
      `
    }
    else {
      return /*html*/`
        <div class="content" id="content">
          ${poll.content}
        </div>
        <votes-wrapper reload="false" votes="${poll.votes}" selected="${poll.selected}"
          hash="${poll.hash}"
          end-time="${poll.end}" voted="${poll.voted}" options="${poll.options}">
        </votes-wrapper>
      `
    }
  }

  removeHtml = (text, title)=> {
    let str = text.replace(/<[^>]*>/g, '');

    str = str.trim();
    const filteredTitle = title ? `<h3>${title}</h3>` : '';
    const content = `<p>${this.trimContent(str)}</p>`;

    return `
      ${filteredTitle}
      ${content}
    `
  }

  trimContent = text => {
    // if text is less than 150 characters
    if (text.length <= 200) return text;


    // check for mobile view
    const mql = window.matchMedia('(max-width: 660px)');

    // Check if its a mobile view
    if (mql.matches) {
      // return text substring: 150 characters + ...
      return text.substring(0, 200) + '...';
    } else {
      // trim the text to 250 characters
      return text.substring(0, 300) + '...';
    }
  }

  getPost = content => {
    const mql = window.matchMedia('(max-width: 660px)');
    // Remove html tags
    const contentStr = content.replace(/<[^>]*>/g, '');
    const contentLength = contentStr.length;

    let chars = 250;

    // Check if its a mobile view
    if (mql.matches) {
      chars = 200;
    }

    // Check if content length is greater than: chars
    if (contentLength > chars) {
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

  getHTML = () => {
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body.innerHTML;
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

  openStory = () => {
    // Get the body
    const body = document.querySelector('body');

    // get current content
    const content = this.shadowObj.querySelector('.actions > .action#view-action');

    if(body && content) {
      content.addEventListener('click', event => {
        event.preventDefault();

        let url = content.getAttribute('href');

        // Get full post
        const post =  this._item;
  
        // replace and push states
        this.replaceAndPushStates(url, body, post);

        body.innerHTML = post;
      })
    }
  }

  replaceAndPushStates = (url, body, post) => {
    // get the first custom element in the body
    const firstElement = body.firstElementChild;

    // convert the custom element to a string
    const elementString = firstElement.outerHTML;

    // Replace the content with the current url and body content
    // get window location
    const pageUrl = window.location.href;
    window.history.replaceState(
      { page: 'page', content: elementString },
      url, pageUrl
    );

    // Updating History State
    window.history.pushState(
      { page: 'page', content: post},
      url, url
    );
  }

  mapStory = story => {
    const author = story.story_author;
    const url = `/p/${story.hash.toLowerCase()}`;
    const images = story.images ? story.images.join(',') : null;
    if (story.kind === "post") {
      return /*html*/`
        <app-post story="quick" tab="replies" url="${url}" hash="${story.hash}" likes="${story.likes}" replies="${story.replies}" 
          replies-url="/api/v1${url}/replies" likes-url="/api/v1${url}/likes" images='${images}'
          views="${story.views}"  time="${story.createdAt}" liked="${story.liked ? 'true' : 'false'}" 
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
          author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
          author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-bio="${author.bio === null ? 'This user has not added a bio yet.' : author.bio}">
          ${story.content}
        </app-post>
      `
    }
    else if (story.kind === "poll") {
      return /*html*/`
        <app-post story="poll" tab="replies" url="${url}" hash="${story.hash}" likes="${story.likes}"
          replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" time="${story.createdAt}"
          replies-url="/api/v1${url}/replies" likes-url="/api/v1${url}/likes" options='${story.poll}' voted="${story.option ? 'true' : 'false'}" 
          selected="${story.option}" end-time="${story.end}" votes="${story.votes}" 
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
          author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
          author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}' 
          author-bio="${author.bio === null ? 'This user has not added a bio yet.' : author.bio}">
          ${story.content}
        </app-post>
      `
    }
    else if (story.kind === "story") {
      return /*html*/`
        <app-story story="story" hash="${story.hash}" url="${url}" tab="replies" topics="${story.topics.length === 0 ? 'story' : story.topics}" 
          story-title="${story.title}" time="${story.createdAt}" replies-url="/api/v1${url}/replies" images='${images}'
          likes-url="/api/v1${url}/likes" likes="${story.likes}" replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" 
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}' 
          author-img="${author.picture}" author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" 
          author-followers="${author.followers}" author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" 
          author-bio="${author.bio === null ? 'This user has not added a bio yet.' : author.bio}">
          ${story.content}
        </app-story>
      `
    }
  }

  mapReply = reply => {
    const author = reply.reply_author;
    const images = reply.images ? reply.images.join(',') : null;
    return /*html*/`
      <app-post story="reply" tab="replies" hash="${reply.hash}" url="/r/${reply.hash.toLowerCase()}" likes="${reply.likes}" liked="${reply.liked}"
        replies="${reply.replies}" views="${reply.views}" time="${reply.createdAt}" replies-url="/api/v1/r/${reply.hash}/replies" 
        parent="${reply.story ? reply.story : reply.reply}" preview="full" likes-url="/api/v1/r/${reply.hash}/likes" images='${images}'
        author-url="/u/${author.hash}" author-hash="${author.hash}" author-you="${reply.you}" author-stories="${author.stories}" 
        author-replies="${author.replies}" author-img="${author.picture}" author-verified="${author.verified}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
        author-name="${author.name}" author-followers="${author.followers}" author-following="${author.following}" 
        author-follow="${author.is_following}" author-bio="${author.bio === null ? 'The author has no bio yet!' : author.bio}">
        ${reply.content}
      </app-post>
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

  disableScroll() {
    // Get the current page scroll position
    let scrollTop = window.scrollY || document.documentElement.scrollTop;
    let scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    document.body.classList.add("stop-scrolling");

    // if any scroll is attempted, set this to the previous value
    window.onscroll = function() {
      window.scrollTo(scrollLeft, scrollTop);
    };
  }

  enableScroll() {
    document.body.classList.remove("stop-scrolling");
    window.onscroll = function() {};
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

  getTemplate() {
    const className = this.getClass(this.getAttribute('preview'));
    // const parent = this.getAttribute('hash');
    const kind = this.getAttribute('preview');
    // Show HTML Here
    return /*html*/`
      <div class="welcome">
        ${this.getReplyingTo(kind)}
        <div class="preview ${className}">
          <button class="fetch">Preview</button>
        </div>
      </div>
      ${this.getStyles()}
    `
  }

  getReplyingTo = kind => {
    if (kind === 'full') {
      return /*html*/`
        <div class="replying-to">
          <span class="meta-reply">
            <span class="text">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="16px" height="16px" fill="currentColor">
                <path d="M88.2 309.1c9.8-18.3 6.8-40.8-7.5-55.8C59.4 230.9 48 204 48 176c0-63.5 63.8-128 160-128s160 64.5 160 128s-63.8 128-160 128c-13.1 0-25.8-1.3-37.8-3.6c-10.4-2-21.2-.6-30.7 4.2c-4.1 2.1-8.3 4.1-12.6 6c-16 7.2-32.9 13.5-49.9 18c2.8-4.6 5.4-9.1 7.9-13.6c1.1-1.9 2.2-3.9 3.2-5.9zM0 176c0 41.8 17.2 80.1 45.9 110.3c-.9 1.7-1.9 3.5-2.8 5.1c-10.3 18.4-22.3 36.5-36.6 52.1c-6.6 7-8.3 17.2-4.6 25.9C5.8 378.3 14.4 384 24 384c43 0 86.5-13.3 122.7-29.7c4.8-2.2 9.6-4.5 14.2-6.8c15.1 3 30.9 4.5 47.1 4.5c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176zM432 480c16.2 0 31.9-1.6 47.1-4.5c4.6 2.3 9.4 4.6 14.2 6.8C529.5 498.7 573 512 616 512c9.6 0 18.2-5.7 22-14.5c3.8-8.8 2-19-4.6-25.9c-14.2-15.6-26.2-33.7-36.6-52.1c-.9-1.7-1.9-3.4-2.8-5.1C622.8 384.1 640 345.8 640 304c0-94.4-87.9-171.5-198.2-175.8c4.1 15.2 6.2 31.2 6.2 47.8l0 .6c87.2 6.7 144 67.5 144 127.4c0 28-11.4 54.9-32.7 77.2c-14.3 15-17.3 37.6-7.5 55.8c1.1 2 2.2 4 3.2 5.9c2.5 4.5 5.2 9 7.9 13.6c-17-4.5-33.9-10.7-49.9-18c-4.3-1.9-8.5-3.9-12.6-6c-9.5-4.8-20.3-6.2-30.7-4.2c-12.1 2.4-24.7 3.6-37.8 3.6c-61.7 0-110-26.5-136.8-62.3c-16 5.4-32.8 9.4-50 11.8C279 439.8 350 480 432 480z"/>
              </svg>
              <span class="reply">Replying to</span>
            </span>
          </span>
        </div>
      `
    } else return '';
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

    // Check if seconds is less than 60: return Just now
    if (seconds < 60) {
      return 'Just now';
    }
    // check if seconds is less than 86400: return time AM/PM
    if (seconds < 86400) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    }

    // check if seconds is less than 604800: return day and time
    if (seconds <= 604800) {
      return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: true });
    }

    // Check if the date is in the current year:: return date and month short 2-digit year without time
    if (date.getFullYear() === currentTime.getFullYear()) {
      return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', });
    }
    else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  }

  getContent = (content, url, views, likes, author) => {
    return /*html*/`
      <p>${content}</p>
      ${this.getImages(this._story ? this._story.images : this._reply.images)}
      <span class="meta">
        <span class="by">by</span>
        ${this.getAuthorHover(author)}
        <span class="sp">•</span>
        <time class="time" datetime="${author.time}">
          ${this.getLapseTime(author.time)}
        </time>
      </span>
      ${this.getActions(likes, views, url)}
    `
  }

  getActions = (likes, views, url) => {
    return /*html*/`
      <div class="actions">
        <a href="${url}" class="action view" id="view-action">view</a>
        <span class="action close" id="close-action">close</span>
        <span class="action likes plain">
          <span class="no">${this.formatNumber(likes)}</span> <span class="text">likes</span>
        </span>
        <span class="action views plain">
          <span class="no">${this.formatNumber(views)}</span> <span class="text">views</span>
        </span>
      </div>
    `
  }

  getEmpty = () => {
    return /* html */`
      <div class="empty">
        <p>An error has occurred.</p>
        <div class="actions">
          <button class="fetch last">Retry</button>
          <span class="action close" id="close-action">close</span>
        </div>
      </div>
    `
  }

  getFullCss = preview => {
    if (preview === 'full') {
      return "padding: 10px 0;"
    } else {
      return "padding: 0;"
    }
  }

  getClass = preview => {
    return preview === 'full' ? '' : 'feed';
  }

  getLoader() {
    return `
      <div id="loader-container">
				<div class="loader"></div>
			</div>
    `
  }

  getAuthorHover = author => {
    const url = `/u/${author.hash.toLowerCase()}`;
    let bio = author.bio ? author.bio : 'This user has not added a bio yet.';
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return /* html */`
			<hover-author url="${url}" you="${author.you ? 'true' : 'false'}" hash="${author.hash}"
        picture="${author.picture}" name="${author.name}" contact="${author.contact ? JSON.stringify(author.contact) : null}"
        stories="${author.stories}" replies="${author.replies}"
        followers="${author.followers}" following="${author.following}" user-follow="${author.is_following ? 'true' : 'false'}"
        verified="${author.verified ? 'true' : 'false'}" bio="${bio}">
      </hover-author>
		`
  }

  getImages = imageArray => {
    // if length is greater is less than 1
    if(!imageArray || imageArray.length < 1) return '';

    // return
    return /* html */`
      <images-wrapper images="${imageArray.join(',')}"></images-wrapper>
    `
  }

  getStyles() {
    return /*css*/`
      <style>
        * {
          box-sizing: border-box !important;
        }

        :host{
          border: none;
          padding: 0;
          ${this.getFullCss(this.getAttribute('preview'))}
          justify-self: end;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          min-width: 100%;
        }

        #loader-container {
          padding: 10px 0;
          width: 50px;
          background-color: var(--loader-background);
          backdrop-filter: blur(1px);
          -webkit-backdrop-filter: blur(1px);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
          -webkit-border-radius: inherit;
          -moz-border-radius: inherit;
        }

        #loader-container > .loader {
          width: 20px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #18A565 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #21D029 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        @keyframes l38 {
          100% {
            background-position: 100% 0, 100% 100%, 0 100%, 0 0
          }
        }

        .welcome {
          width: 100%;
          height: max-content;
          position: relative;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .preview {
          width: 100%;
          position: relative;
          display: flex;
          flex-flow: column;
          color: var(--text-color);
          line-height: 1.4;
          gap: 0;
          margin: 0;
          padding: 0 0 0 16px;
        }

        .preview.feed {
          padding: 0 0 0 16px;
        }

        .preview::before {
          content: '';
          display: block;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 4px;
          width: 1.5px;
          height: calc(100% - 10px);
          background: var(--action-linear);
          border-radius: 5px;
        }

        .preview p,
        .preview h3 {
          margin: 0;
          font-family: var(--font-read), sans-serif;
          line-height: 1.2;
        }

        .preview h3 {
          margin: 0 0 5px;
          font-family: var(--font-main), sans-serif;
          color: var(--title-color);
          font-size: 1.1rem;
          font-weight: 500;
        }

        .content {
          width: 100%;
          display: flex;
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

        .content.extra.mobile {
          max-height: 120px;
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
          margin: 0 0 5px 0;
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
          margin: 0;
          padding: 0 0 5px;
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

        figure {
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

        .replying-to {
          position: relative;
          text-decoration: none;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: start;
          gap: 0;
          margin: 0 0 3px;
          padding: 0;
        }
        
        .replying-to > .meta-reply {
          display: flex;
          width: max-content;
          align-items: start;
          color: var(--gray-color);
          flex-flow: column;
          font-size: 1rem;
          gap: 2px;
        }
        
        .replying-to > .meta-reply > .text {
          display: flex;
          align-items: center;
          justify-content: start;
          gap: 5px;
        }

        .replying-to > .meta-reply > .text > .reply {
          display: flex;
          font-size: 0.89rem;
          font-family: var(--font-read), sans-serif;
          padding: 0;
          font-weight: 400;
        }
        
        .replying-to > .meta-reply > .text > svg {
          color: var(--gray-color);
          width: 16px;
          height: 16px;
          display: inline-block;
          margin: 0 0 0 0;
        }
        
        .replying-to > .meta-reply .parent {
          background: var(--action-linear);
          font-family: var(--font-mono), monospace;
          font-size: 0.8rem;
          line-height: 1;
          color: transparent;
          font-weight: 600;
          background-clip: text;
          -webkit-background-clip: text;
          -moz-background-clip: text;
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

        .meta > span.hash {
          background: var(--action-linear);
          font-family: var(--font-mono), monospace;
          font-size: 0.9rem;
          line-height: 1;
          color: transparent;
          font-weight: 600;
          background-clip: text;
          -webkit-background-clip: text;
          -moz-background-clip: text;
        }

        .meta > time.time {
          font-family: var(--font-text), sans-serif;
          font-size: 0.83rem;
          font-weight: 500;
          margin: 1px 0 0 0;
        }

        div.empty {
          width: 100%;
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          gap: 10px;
        }

        div.empty > p {
          width: max-content;
          padding: 0;
          margin: 5px 0 0 0;
          color: var(--error-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 500;
        }

        div.empty > .actions {
          margin: 0;
        }

        button.fetch {
          width: max-content;
          margin: 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px 10px 3px;
          font-size: 0.9rem;
          font-family: var(--font-main), sans-serif;
          font-weight: 500;
          background: var(--accent-linear);
          color: var(--white-color);
          border: none;
          border-radius: 10px;
          cursor: pointer
        }

        button.fetch.last {
          margin: 0 0 5px;
        }

        .preview.feed button.fetch {
          margin: 5px 0 3px 0;
          padding: 3px 10px 4px;
          border-radius: 7px;
          font-size: 0.8rem;
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
          font-size: 0.9rem;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: lowercase;
          justify-content: center;
          padding: 1px 10px 2px;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        .actions > .action.close {
          color: var(--error-color);
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
        
        @media screen and ( max-width: 850px ){
          #content {
            width: 90%;
          }
        }

        @media screen and ( max-width: 660px ) {
          :host {
            border: none;
            ${this.getFullCss(this.getAttribute('preview'))}
            justify-self: end;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            min-width: 100%;
          }

          .preview::before {
            content: '';
            display: block;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            left: 4.5px;
            width: 1.5px;
            height: calc(100% - 10px);
            background: var(--action-linear);
            border-radius: 5px;
          }

          button.fetch,
          .content.extra .read-more,
          .actions > .action.close,
          a {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}