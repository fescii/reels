export default class StoryFeed extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.api = window.app.api;
    this._block = true;
    this._empty = true;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._url = this.getAttribute('url');
    this._kind = this.getAttribute('kind');
    this._query = this.setQuery(this.getAttribute('query'));

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  setQuery = query => !(!query || query === "" || query !== "true");

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const storiesContainer = this.shadowObj.querySelector('.stories');

    // check if the total
    if (storiesContainer) {
      this._block = false;
      this._empty = false;
      this.fetchStories(storiesContainer);
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
    this._empty = true;
    this._block = true;
    this.populateStories(this.getWrongMessage(), storiesContainer);
    this.activateRefresh();
  }

  handleEmptyStories = (storiesContainer) => {
    this._empty = true;
    this._block = true;
    this.populateStories(this.getEmptyMsg(this._kind), storiesContainer);
  }

  handlePartialStories = (stories, storiesContainer) => {
    this._empty = true;
    this._block = true;
    const content = this.mapFields(stories);
    this.populateStories(content, storiesContainer);
    this.populateStories(this.getLastMessage(this._kind), storiesContainer);
  }

  handleFullStories = (stories, storiesContainer) => {
    this._empty = false;
    this._block = false;
    const content = this.mapFields(stories);
    this.populateStories(content, storiesContainer);
    this.scrollEvent(storiesContainer);
  }

  fetchStories = storiesContainer => {
    const outerThis = this;
    const url = this._query ? `${this._url}&page=${this._page}` : `${this._url}?page=${this._page}`;

    if(!this._block && !this._empty) {
      outerThis._empty = true;
      outerThis._block = true;
      setTimeout(() => {
        // fetch the stories
        outerThis.fetching(url, storiesContainer)
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
    window.addEventListener('scroll', function () {
      let margin = document.body.clientHeight - window.innerHeight - 150;
      if (window.scrollY > margin && !outerThis._empty && !outerThis._block) {
        outerThis._page += 1;
        outerThis.populateStories(outerThis.getLoader(), storiesContainer);
        outerThis.fetchStories(storiesContainer);
      }
    });

    // Launch scroll event
    const scrollEvent = new Event('scroll');
    window.dispatchEvent(scrollEvent);
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

  getLoader() {
    return /* html */`
      <div class="loader-container">
        <span id="btn-loader">
          <span class="loader-alt"></span>
        </span>
      </div>
    `
  }

  getBody = () => {
    // language=HTML
    return `
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
          position: relative;
          width: 100%;
          height: 150px;
          padding: 20px 0 0 0;
        }

        #btn-loader {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
        }

        #btn-loader > .loader-alt {
          width: 35px;
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

        #btn-loader > .loader {
          width: 20px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
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