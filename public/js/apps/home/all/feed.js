export default class HomeFeed extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this._isFirstLoad = true;
    this._block = false;
    this._empty = false;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._url = this.getAttribute('url');
    this.all = this.getRootNode().host;
    this.app = window.app;
    this.api = this.app.api;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // set next
    this.all.home = {
      last: true,
      next: 5,
      loaded: true
    }
    const feedContainer = this.shadowObj.querySelector('.stories');

    // check if the total
    if (feedContainer) {
      this.fetchFeeds(feedContainer);
    }
  }

  disconnectedCallback() {
    this.removeScrollEvent();
    const finish = this.shadowObj.querySelector('.finish');
    if (finish) {
      const btn = finish.querySelector('button.finish');
      btn.removeEventListener('click', this.activateRefresh);
    }
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
        const feedContainer = this.shadowObj.querySelector('div.stories');

        // remove the finish message
        finish.remove();

        // set the loader
        feedContainer.insertAdjacentHTML('beforeend', this.getLoader());

        setTimeout(() => {
          this.fetchFeeds(feedContainer);
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
    // Remove the scroll event
    this.removeScrollEvent();
    try {
      const result = await this.api.get(url, { content: 'json' });
      if (result.success) {
        this.handleFetchSuccess(result.data, feedContainer);
      } else {
        this.handleFetchFailure(feedContainer);
      }
    } catch (error) {
      this.handleFetchFailure(feedContainer);
    }
  }

  handleFetchSuccess = (data, feedContainer) => {
    // First page with no content
    if (data.last && this._page === 1 && data.stories.length === 0 && data.replies.length === 0) {
      this._empty = true;
      this._block = true;
      this.populateFeeds(this.getEmptyMsg(), feedContainer);
    } 
    // Last page with some content
    else if (data.stories.length < 6 && data.replies.length < 6) {
      this._empty = true;
      this._block = true;
      const content = this.mapFeeds(data.stories, data.replies);
      this.populateFeeds(content, feedContainer);
      this.populateFeeds(this.getLastMessage(), feedContainer);
    } 
    // Normal page with content, more might be available
    else {
      this._block = false;  // Unblock for next fetch
      this._empty = false;  // More content might be available
      const content = this.mapFeeds(data.stories, data.replies);
      this.populateFeeds(content, feedContainer);
    }
    
    // Re-add scroll event after content is loaded
    this.scrollEvent(feedContainer);
  }

  handleFetchFailure = feedContainer => {
    this._empty = true;
    this._block = true;
    this.populateFeeds(this.getWrongMessage(), feedContainer);
    // activate the refresh button
    this.activateRefresh();
  }

  fetchFeeds = feedContainer => {
    if (!this._block && !this._empty) {
      // Set blocks before fetching
      this._block = true;  // Block further fetches while this one is in progress
      
      const url = `${this._url}?page=${this._page}`;
      
      setTimeout(async () => {
        await this.fetching(url, feedContainer);
      }, 2000);
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

  scrollEvent = feedContainer => {
    const outerThis = this;
    if (!this._scrollEventAdded) {
      this._scrollEventAdded = true;
      
      const onScroll = () => {
        // Get scroll position and page height
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        // Calculate threshold (e.g., 150px from bottom)
        const threshold = 150;
        
        // Only fetch if:
        // 1. We're near the bottom
        // 2. Not already fetching (_empty is false)
        // 3. Not blocked from fetching (_block is false)
        // 4. Not at the last page
        if (
          documentHeight - scrollPosition <= threshold && 
          !outerThis._empty && 
          !outerThis._block
        ) {
          outerThis._page += 1;
          outerThis.populateFeeds(outerThis.getLoader(), feedContainer);
          outerThis.fetchFeeds(feedContainer);
        }
      };

      // Store the function reference for cleanup
      this.onScroll = onScroll;
      window.addEventListener('scroll', onScroll);
      
      // Don't automatically trigger the scroll event on first load
      if (!this._isFirstLoad) {
        const scrollEvent = new Event('scroll');
        window.dispatchEvent(scrollEvent);
      }
      this._isFirstLoad = false;
    }
  }

  removeScrollEvent = () => {
    if (this.onScroll) {
      window.removeEventListener('scroll', this.onScroll);
      this._scrollEventAdded = false;
    }
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
    const images = story.images ? story.images.join(',') : null;
    if (story.kind === "post") {
      return /*html*/`
        <quick-post story="quick" url="${url}" hash="${story.hash}" likes="${story.likes}" images='${images}'
          replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" time="${story.createdAt}" 
          replies-url="${url}/replies" likes-url="${url}/likes" 
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
          voted="${story.option ? 'true' : 'false'}" selected="${story.option}" end-time="${story.end}" 
          options='${story.poll}' votes="${story.votes}" likes-url="${url}/likes" replies-url="${url}/replies" 
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
        <story-post story="story" hash="${story.hash}" url="${url}" images='${images}'
          topics="${story.topics.length === 0 ? 'story' : story.topics}" story-title="${story.title}" time="${story.createdAt}" replies-url="${url}/replies" 
          likes-url="${url}/likes" replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" likes="${story.likes}" 
          views="${story.views}" 
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
    const images = reply.images ? reply.images.join(',') : null;
    return /*html*/`
      <quick-post story="reply" hash="${reply.hash}" url="/r/${reply.hash.toLowerCase()}" likes="${reply.likes}" replies="${reply.replies}" liked="${reply.liked}"
        views="${reply.views}" time="${reply.createdAt}" replies-url="/r/${reply.hash}/replies" likes-url="/r/${reply.hash}/likes"
        author-hash="${author.hash}" author-you="${reply.you}" author-url="/u/${author.hash}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
        author-stories="${author.stories}" author-replies="${author.replies}" parent="${reply.story ? reply.story : reply.reply}" images='${images}'
        author-img="${author.picture}" author-verified="${author.verified}" author-name="${author.name}" author-followers="${author.followers}"
        author-following="${author.following}" author-follow="${author.is_following}" author-bio="${bio}">
        ${reply.content}
      </quick-post>
    `
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
        <h2 class="finish__title">Feed is not available!</h2>
        <p class="desc">
          There are no feeds available for this feed. You can always come back later or refresh the page to check for new feeds.
        </p>
      </div>
    `
  }

  getLastMessage = () => {
    // get the next attribute
    return /*html*/`
      <div class="finish">
        <h2 class="finish__title">That's all for now!</h2>
        <p class="desc">
         That's it, you have exhausted our feeds for now. You can always come back later or refresh the page to check for new feeds.
        </p>
      </div>
    `
  }

  getWrongMessage = () => {
    return /* html */`
      <div class="finish">
        <h2 class="finish__title">Oops!</h2>
        <p class="desc">
          An error occurred while retrieving the feeds. Please check your connection and try again.
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
          padding: 0;
        }

        div.loader-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 200px;
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

        div.stories {
          padding: 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        div.finish {
          padding: 10px 0 40px;
          width: 100%;
          min-width: 100%;
          height: auto;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }

        div.finish > h2.finish__title {
          margin: 10px 0 0 0;
          font-size: 1rem;
          font-weight: 500;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
        }

        div.finish > p.desc {
          margin: 0;
          font-size: 0.85rem;
          font-family: var(--font-read), sans-serif;
          color: var(--gray-color);
          line-height: 1.4;
          text-align: center;
        }

        div.finish > button.finish {
          border: none;
          background: var(--accent-linear);
          font-family: var(--font-main), sans-serif;
          text-decoration: none;
          color: var(--white-color);
          margin: 10px 0 0;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: capitalize;
          justify-content: center;
          padding: 7px 18px 8px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        @media screen and (max-width:660px) {
          a,
          div.finish > button.finish {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}