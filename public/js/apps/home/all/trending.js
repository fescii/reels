export default class HomeRecent extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this.url = this.getAttribute('url');
    this.api = window.app.api;
    this.all = this.getRootNode().host;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  convertToBoolean = value => {
    return value === 'true' ? true : false;
  }

  connectedCallback() {
    const feedContainer = this.shadowObj.querySelector('.stories');

    this.fetchFeeds(feedContainer);
  }

  activateRefresh = () => {
    const finish = this.shadowObj.querySelector('.finish');
    if (finish) {
      const btn = finish.querySelector('button.finish');
      btn.addEventListener('click', () => {
        // unblock the fetching
        this._block = false;
        this._empty = false;
        
        // re fetch the content
        const feedContainer = this.shadowObj.querySelector('.stories');

        // set the loader
        feedContainer.innerHTML = this.getLoader();

        setTimeout(() => {
          this.fetchFeeds(feedContainer);
        }, 1000);
      });
    }
  }

  activateOfflineRefresh = () => {
    const finish = this.shadowObj.querySelector('.finish');
    if (finish) {
      const btn = finish.querySelector('button.finish');
      btn.addEventListener('click', () => {
        // unblock the fetching
        this._block = false;
        this._empty = false;
        
        // re fetch the content
        const feedContainer = this.shadowObj.querySelector('.stories');

        // set the loader
        feedContainer.innerHTML = this.getLoader();

        setTimeout(() => {
          this.fetchOfflineFeeds(feedContainer);
        }, 1000);
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

  fetching = async (url, feedContainer) => {
    try {
      const result = await this.api.get(url, { content: 'json' }, { allow: true, duration: 1800 });

      this.handleFetchResult(result, feedContainer);
    } catch (error) {
      console.log(error)
      this.handleFetchError(feedContainer);
    }
  }

  handleFetchResult = (result, feedContainer) => {
    if (result.success) {
      const data = result.data;
      if (data.last && this._page === 1 && data.stories.length === 0 && data.replies.length === 0) {
        this.populateFeeds(this.getEmptyMsg(), feedContainer);
      } else {
        const content = this.mapFeeds(data.stories, data.replies);
        this.populateFeeds(content, feedContainer);
        this.setLastItem(feedContainer);
      }

      // set next
      this.all.home = {
        last: false,
        next: 1,
        loaded: true
      }
    } else {
      this.handleFetchError(feedContainer);
    }
  }

  handleFetchError = (feedContainer) => {
    this.populateFeeds(this.getWrongMessage(), feedContainer);
    // activate the refresh button
    this.activateRefresh();
  }

  fetchFeeds = feedContainer => {
    const outerThis = this;
    const url = this.url;

    if (!this._block && !this._empty) {
      outerThis._empty = true;
      outerThis._block = true;
      // fetch the stories
      outerThis.fetching(url, feedContainer);
    }
  }

  fetchOfflineFeeds = async feedContainer => {
    const outerThis = this;
    const url = this.url;
    try {
      // fetch from cache
      const result = await outerThis.getOfflineData(url);

      // check if it was not success:
      if (!result.success) {
        outerThis.populateFeeds(outerThis.getWrongMessage(), feedContainer);
        // activate the refresh button
        outerThis.activateOfflineRefresh();
        return;
      }

      // get the data
      const data = result.data;

      if (data.last && data.stories.length === 0 && data.replies.length === 0) {
        outerThis.populateFeeds(outerThis.getEmptyMsg(), feedContainer);
        return;
      }

      const content = outerThis.mapFeeds(data.stories, data.replies);

      outerThis.populateFeeds(content, feedContainer);
      outerThis.setLastItem(feedContainer);

      // set next
      window.home = {
        last: false,
        next: 1,
        loaded: true
      }
    } catch (error) {
      outerThis.populateFeeds(outerThis.getOfflineWrong(), feedContainer);
      // activate the refresh button
      outerThis.activateOfflineRefresh();
    }
  }

  populateFeeds = (content, feedContainer) => {
    // get the loader and remove it
    const loader = feedContainer.querySelector('.loader-container');
    if (loader) {
      loader.remove();
    }

    // insert the content
    feedContainer.insertAdjacentHTML('beforeend', content);
  }

  mapFeeds = (stories, replies) => {
    const outerThis = this;
    let content = '';
    
    // Check if the stories is empty and replies is not empty
    if (stories.length === 0 && replies.length > 0) {
      content = replies.map(reply => outerThis.mapReply(reply)).join('');
    }
    else if (stories.length > 0 && replies.length === 0) {
      content = stories.map(story => outerThis.mapStory(story)).join('');
    }
    else {
      // for each story follow by a reply, if there is any(i.e): append ine story and one reply if either is available else append the other
      // check the longest array
      if (stories.length >= replies.length) {
        for (let i = 0; i < stories.length; i++) {
          content += outerThis.mapStory(stories[i]);
          if (replies[i]) {
            content += outerThis.mapReply(replies[i]);
          }
        }
      }
      else {
        for (let i = 0; i < replies.length; i++) {
          if (stories[i]) {
            content += outerThis.mapStory(stories[i]);
          }
          content += outerThis.mapReply(replies[i]);
        }
      }
    }

    return content;
  }

  mapStory = story => {
    const author = story.story_author;
    let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const url = `/p/${story.hash.toLowerCase()}`;
    const images = story.images ? story.images.join(',') : '';
    if (story.kind === "post") {
      return /*html*/`
        <quick-post story="quick" url="${url}" hash="${story.hash}" likes="${story.likes}" 
          replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" time="${story.createdAt}" 
          replies-url="/api/v1${url}/replies" likes-url="/api/v1${url}/likes" images="${images}"
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
          author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
          author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-bio="${bio}">
          ${story.content}
        </quick-post>
      `
    }
    else if (story.kind === "poll") {
      return /*html*/`
        <poll-post story="poll" url="${url}" hash="${story.hash}" likes="${story.likes}" 
          replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" time="${story.createdAt}" 
          voted="${story.option ? 'true' : 'false'}" selected="${story.option}" end-time="${story.end}" replies-url="/api/v1${url}/replies" 
          likes-url="/api/v1${url}/likes" options='${story.poll}' votes="${story.votes}" 
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
          author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
          author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-bio="${bio}">
          ${story.content}
        </poll-post>
      `
    }
    else if (story.kind === "story") {
      return /*html*/`
        <story-post story="story" hash="${story.hash}" url="${url}" 
          topics="${story.topics.length === 0 ? 'story' : story.topics}" story-title="${story.title}" time="${story.createdAt}" replies-url="/api/v1${url}/replies" 
          likes-url="/api/v1${url}/likes" replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" likes="${story.likes}" 
          views="${story.views}" images="${images}"
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-img="${author.picture}" author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" 
          author-followers="${author.followers}" author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" 
          author-bio="${bio}">
          ${story.content}
        </story-post>
      `
    }
  }

  mapReply = reply => {
    const author = reply.reply_author;
    let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const images = reply.images ? reply.images.join(',') : '';
    return /*html*/`
      <quick-post story="reply" hash="${reply.hash}" url="/r/${reply.hash.toLowerCase()}" likes="${reply.likes}" replies="${reply.replies}" liked="${reply.liked}"
        views="${reply.views}" time="${reply.createdAt}" replies-url="/api/v1/r/${reply.hash}/replies" likes-url="/api/v1/r/${reply.hash}/likes" images="${images}"
        author-hash="${author.hash}" author-you="${reply.you}" author-url="/u/${author.hash}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
        author-stories="${author.stories}" author-replies="${author.replies}" parent="${reply.story ? reply.story : reply.reply}"
        author-img="${author.picture}" author-verified="${author.verified}" author-name="${author.name}" author-followers="${author.followers}"
        author-following="${author.following}" author-follow="${author.is_following}" author-bio="${bio}">
        ${reply.content}
      </quick-post>
    `
  }

  getOfflineData = async url => {
    const cacheName = "user-cache";

    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(url);

    if (cachedResponse) {
      const cachedData = await cachedResponse.json();
      // return the data
      return cachedData.data;
    } else {
      // throw an error
      throw new Error('No data available');
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
      console.error('Error fetching data:', error);
      throw error;
    }
  };

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
  };

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

  setLastItem = contentContainer => {
    // get last element child (can be a story or a reply)
    const lastItem = contentContainer.lastElementChild;

    // set border-bottom to none
    if (lastItem) {
      lastItem.style.setProperty('border-bottom', 'none');
    }
  }

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getLoader = () => {
    return /* html */`
      <div class="loader-container">
        <div id="loader" class="loader"></div>
      </div>
    `;
  }

  getBody = () => {
    // language=HTML
    return `
			<div class="stories">
				${this.getLoader()}
      </div>
    `;
  }

  getEmptyMsg = () => {
    // get the next attribute
    return /*html*/`
      <div class="finish">
        <h2 class="title">No feeds!</h2>
        <p class="desc">
          There are no feeds available for this feed. You can always come back later or refresh the page to check for new feeds.
        </p>
      </div>
    `
  }

  getWrongMessage = () => {
    return /* html */`
      <div class="finish">
        <h2 class="title">Something went wrong!</h2>
        <p class="desc">
          There was an error fetching the feeds. Please retry using the button below, or check your internet connection.
        </p>
        <button class="finish">Retry</button>
      </div>
    `;
  }

  getOfflineWrong = () => {
    return /* html */`
      <div class="finish">
        <h2 class="title">Something went wrong!</h2>
        <p class="desc">
          There was an error getting offline feeds. Please you need to be online to fetch the feeds.
        </p>
        <button class="finish">Retry</button>
      </div>
    `;
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
          width: 100%;
          min-height: 300px;
          padding: 0;
        }

        div.loader-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          min-height: 300px;
          min-width: 100%;
        }

        div.loader-container > .loader {
          width: 20px;
          aspect-ratio: 1;
          border-radius: 50%;
          background: var(--accent-linear);
          display: grid;
          animation: l22-0 2s infinite linear;
        }

        div.loader-container > .loader:before {
          content: "";
          grid-area: 1/1;
          margin: 15%;
          border-radius: 50%;
          background: var(--second-linear);
          transform: rotate(0deg) translate(150%);
          animation: l22 1s infinite;
        }

        div.loader-container > .loader:after {
          content: "";
          grid-area: 1/1;
          margin: 15%;
          border-radius: 50%;
          background: var(--accent-linear);
          transform: rotate(0deg) translate(150%);
          animation: l22 1s infinite;
        }

        div.loader-container > .loader:after {
          animation-delay: -.5s
        }

        @keyframes l22-0 {
          100% {transform: rotate(1turn)}
        }

        @keyframes l22 {
          100% {transform: rotate(1turn) translate(150%)}
        }

        .empty {
          width: 100%;
          padding: 10px 0 30px;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
        }

        .last {
          width: 100%;
          padding: 10px 0 30px;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
        }

        .last > h2,
        .empty > h2 {
          width: 100%;
          margin: 5px 0;
          text-align: start;
          font-family: var(--font-text), sans-serif;
          color: var(--text-color);
          line-height: 1.4;
          font-size: 1.2rem;
        }

        .last p,
        .empty p {
          width: 100%;
          margin: 0;
          text-align: start;
          font-family: var(--font-read), sans-serif;
          color: var(--gray-color);
          line-height: 1.4;
          font-size: 0.95rem;
        }

        .last p.next > .url,
        .empty  p.next > .url {
          background: var(--gray-background);
          color: var(--gray-color);
          padding: 2px 5px;
          font-size: 0.95rem;
          font-weight: 400;
          border-radius: 5px;
        }

        .last p.next > .warn,
        .empty  p.next .warn {
          color: var(--error-color);
          font-weight: 500;
          font-size: 0.9rem;
          background: var(--gray-background);
          padding: 2px 5px;
          border-radius: 5px;
        }

        div.stories {
          padding: 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        div.finish {
          padding: 50px 0 20px;
          width: 100%;
          min-width: 100%;
          height: auto;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 12px;
        }

        div.finish > h2.title {
          margin: 10px 0 0 0;
          font-size: 1.15rem;
          font-weight: 500;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
        }

        div.finish > p.desc {
          margin: 0;
          font-size: 0.85rem;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
          line-height: 1.4;
          text-align: center;
        }

        div.finish > button.finish {
          border: none;
          background: var(--accent-linear);
          font-family: var(--font-main), sans-serif;
          text-decoration: none;
          color: var(--white-color);
          margin: 3px 0 0;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: capitalize;
          justify-content: center;
          padding: 5px 15px 6px;
          border-radius: 12px;
          -webkit-border-radius: 12px;
          -moz-border-radius: 12px;
        }

        @media screen and (max-width:660px) {
          .last {
            width: 100%;
            padding: 15px 0;
            border-bottom: var(--border);
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: center;
          }

          .empty {
            width: 100%;
            padding: 20px 0;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: center;
          }

          div.finish > button.finish {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}