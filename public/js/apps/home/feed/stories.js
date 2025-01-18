export default class StoryFeed extends HTMLElement {
  constructor() {
    super();
    this.api = window.app.api;
    this._block = true;
    this._empty = true;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._url = this.getAttribute('url');
    this._kind = this.getAttribute('kind');
    this._isFirstLoad = true;
    
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const storiesContainer = this.shadowObj.querySelector('.stories');

    if (storiesContainer) {
      // Reset initial state for first fetch
      this._block = false;
      this._empty = false;
      this.fetchStories(storiesContainer);
    }
  }

  disconnectedCallback() {
    this.removeScrollEvent();
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
        const storiesContainer = this.shadowObj.querySelector('div.stories');

        // remove the finish message
        finish.remove();

        // set the loader
        storiesContainer.insertAdjacentHTML('beforeend', this.getLoader());

        setTimeout(() => {
          this.fetchStories(storiesContainer);
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

  fetching = async (url, storiesContainer) => {
    const outerThis = this;
    try {
      const result = await this.api.get(url, { content: 'json' });

      if (!result.success) {
        outerThis.handleFetchError(storiesContainer);
        return;
      }

      const stories = result.stories;

      if (outerThis._page === 1 && stories.length === 0) {
        outerThis.handleEmptyStories(storiesContainer);
      } else if (stories.length < 10) {
        outerThis.handlePartialStories(stories, storiesContainer);
      } else {
        outerThis.handleFullStories(stories, storiesContainer);
      }
    } catch (error) {
      outerThis.handleFetchError(storiesContainer);
    }
  }

  handleFetchError = (storiesContainer) => {
    // Block on error
    this._empty = true;
    this._block = true;
    this.populateStories(this.getWrongMessage(), storiesContainer);
    this.activateRefresh();
  }

  handleEmptyStories = (storiesContainer) => {
    // Block future fetches since we have no content
    this._empty = true;
    this._block = true;
    this.populateStories(this.getEmptyMsg(this._kind), storiesContainer);
  }

  handlePartialStories = (stories, storiesContainer) => {
    // Block future fetches since we're at the end
    this._empty = true;
    this._block = true;
    
    const content = this.mapFields(stories);
    this.populateStories(content, storiesContainer);
    this.populateStories(this.getLastMessage(this._kind), storiesContainer);
  }

  handleFullStories = (stories, storiesContainer) => {
    // Unblock for next fetch since we have a full page
    this._block = false;
    this._empty = false;
    
    const content = this.mapFields(stories);
    this.populateStories(content, storiesContainer);
    
    // Re-add scroll event after content is loaded
    this.scrollEvent(storiesContainer);
  }

  fetchStories = storiesContainer => {
    if (!this._block && !this._empty) {
      // Set blocks before fetching
      this._block = true;  // Block further fetches while this one is in progress
      
      const url = `${this._url}?page=${this._page}`;
      
      setTimeout(() => {
        this.fetching(url, storiesContainer);
      }, 1000);
    }
  }

  populateStories = (content, storiesContainer) => {
    // get the loader and remove it
    const loader = storiesContainer.querySelector('.loader-container');
    if (loader){
      loader.remove();
    }

    // insert the content
    storiesContainer.insertAdjacentHTML('beforeend', content);
  }

  scrollEvent = storiesContainer => {
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
        if (
          documentHeight - scrollPosition <= threshold && 
          !outerThis._empty && 
          !outerThis._block
        ) {
          outerThis._page += 1;
          outerThis.populateStories(outerThis.getLoader(), storiesContainer);
          outerThis.fetchStories(storiesContainer);
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

  mapFields = data => {
    return data.map(story => {
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
            replies-url="/api/v1${url}/replies" likes-url="/api/v1${url}/likes" images='${images}'
            author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
            author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
            author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
            author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
            author-bio="${bio}">
            ${story.content}
          </quick-post>
        `
      }
      else if(story.kind === "poll") {
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
            topics="${story.topics.length === 0 ? 'story' : story.topics }" story-title="${story.title}" time="${story.createdAt}" replies-url="/api/v1${url}/replies" 
            likes-url="/api/v1${url}/likes" replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" likes="${story.likes}" 
            views="${story.views}" images='${images}'
            author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
            author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
            author-img="${author.picture}" author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" 
            author-followers="${author.followers}" author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" 
            author-bio="${bio}">
            ${story.content}
          </story-post>
        `
      }
    }).join('');
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
    return /* html */`
			<div class="stories">
				${this.getLoader()}
      </div>
    `;
  }

  getEmptyMsg = text => {
    // get the next attribute
   if (text === "feed") {
    return /*html*/`
      <div class="finish">
        <h2 class="finish__title">No stories</h2>
        <p class="desc">
          There are no stories/posts yet. You can come back later, once available they'll appear here.
        </p>
      </div>
    `
   } 
   else if(text === "user") {
    return /*html*/`
      <div class="finish">
        <h2 class="finish__title">No stories or posts</h2>
        <p class="desc">
          The user has not posted any stories yet. You can come back later, once available they'll appear here.
        </p>
      </div>
    `
   } 
   else if(text === "search") {
    return /*html*/`
      <div class="finish">
        <h2 class="finish__title">No stories found!</h2>
        <p class="desc">
          There are no stories/posts found. You can try searching with a different keyword.
        </p>
      </div>
    `
   }
   else if(text === "topic") {
    return /*html*/`
      <div class="finish">
        <h2 class="finish__title">No stories found!</h2>
        <p class="desc">
          No stories/posts found for this topic. You can try coming back later.
        </p>
      </div>
    `
   }
   else {
    return /*html*/`
      <div class="finish">
        <h2 class="finish__title"> No stories found!</h2>
        <p class="desc">
          There are no stories/posts found. You can try coming back later.
        </p>
      </div>
    `
   }
  }

  getLastMessage = text => {
    // get the next attribute
    if (text === "feed") {
      return /*html*/`
        <div class="finish">
          <h2 class="finish__title">That's all for now!</h2>
          <p class="desc">
            You have reached the end of the stories. You can always come back later or refresh the page to check for new stories.
          </p>
        </div>
      `
    }
    else if(text === "user") {
      return /*html*/`
        <div class="finish">
          <h2 class="finish__title">That's all the user's stories!</h2>
          <p class="desc">
            You have exhausted all of the user's stories. You can always come back later to check for new stories.
          </p>
        </div>
      `
    }
    else if(text === "search") {
      return /*html*/`
        <div class="finish">
          <h2 class="finish__title">That's all the results!</h2>
          <p class="desc">
            You have reached the end of the search results. You can try searching with a different keyword.
          </p>
        </div>
      `
    }
    else if(text === "topic") {
      return /*html*/`
        <div class="finish">
          <h2 class="finish__title">That's all the topic stories!</h2>
          <p class="desc">
            You have reached the end of the topic stories. You can come back later to check for new stories.
          </p>
        </div>
      `
    }
    else {
      return /*html*/`
        <div class="finish">
          <h2 class="finish__title">That's all!</h2>
          <p class="desc">
            You have reached the end of the stories. You can always come back later or refresh the page to check for new stories.
          </p>
        </div>
      `
    }
   
  }
  
  getWrongMessage = () => {
    return /* html */`
      <div class="finish">
        <h2 class="finish__title">Something went wrong!</h2>
        <p class="desc">
          An error occurred while retrieving stories. Please check your connection and try again.
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