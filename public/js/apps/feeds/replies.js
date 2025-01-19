export default class ReplyFeed extends HTMLElement {
  constructor() {
    super();
    this._block = false;
    this._empty = false;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._url = this.getAttribute('url');
    this._kind = this.getAttribute('kind');
    this._isFirstLoad = true;
    this.app = window.app;
    this.api = this.app.api;
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.render();
  }

  convertToBoolean = value => {
    return value === "true";
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const repliesContainer = this.shadowObj.querySelector('.replies');

    // check if the container exists
    if (repliesContainer) {
      this.fetchReplies(repliesContainer);
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
        const repliesContainer = this.shadowObj.querySelector('div.replies');

        // remove the finish message
        finish.remove();

        // set the loader
        repliesContainer.insertAdjacentHTML('beforeend', this.getLoader());

        setTimeout(() => {
          this.fetchReplies(repliesContainer);
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

  fetching = async(url, repliesContainer) => {
    const outerThis = this;
    try {
      const result = await this.api.get(url, { content: 'json' });

      if(!result.success) {
        outerThis.handleFetchError(repliesContainer);
        return;
      }

      const replies = result.replies;
      if (outerThis._page === 1 && replies.length === 0) {
        outerThis.handleEmptyReplies(repliesContainer);
      }
      else if (replies.length < 10) {
        outerThis.handlePartialReplies(replies, repliesContainer);
      }
      else {
        outerThis.handleFullReplies(replies, repliesContainer);
      }
    } catch (error) {
      outerThis.handleFetchError(repliesContainer);
    }
  }

  handleFetchError = (repliesContainer) => {
    // Block on error
    this._empty = true;
    this._block = true;
    this.populateReplies(this.getWrongMessage(), repliesContainer);
    this.activateRefresh();
  }

  handleEmptyReplies = (repliesContainer) => {
    // Block future fetches since we have no content
    this._empty = true;
    this._block = true;
    this.populateReplies(this.getEmptyMsg(this._kind), repliesContainer);
  }

  handlePartialReplies = (replies, repliesContainer) => {
    // Block future fetches since we're at the end
    this._empty = true;
    this._block = true;
    
    const content = this.mapFields(replies);
    this.populateReplies(content, repliesContainer);
    this.populateReplies(this.getLastMessage(this._kind), repliesContainer);
  }

  handleFullReplies = (replies, repliesContainer) => {
    // Unblock for next fetch since we have a full page
    this._block = false;
    this._empty = false;
    
    const content = this.mapFields(replies);
    this.populateReplies(content, repliesContainer);
    
    // Re-add scroll event after content is loaded
    this.scrollEvent(repliesContainer);
  }

  fetchReplies = repliesContainer => {
    if (!this._block && !this._empty) {
      // Set blocks before fetching
      this._block = true;  // Block further fetches while this one is in progress
      
      const url = `${this._url}?page=${this._page}`;
      
      setTimeout(() => {
        this.fetching(url, repliesContainer);
      }, 1000);
    }
  }

  populateReplies = (content, repliesContainer) => {
    // get the loader and remove it
    const loader = repliesContainer.querySelector('.loader-container');
    if (loader){
      loader.remove();
    }

    // insert the content
    repliesContainer.insertAdjacentHTML('beforeend', content);
  }

  scrollEvent = repliesContainer => {
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
          outerThis.populateReplies(outerThis.getLoader(), repliesContainer);
          outerThis.fetchReplies(repliesContainer);
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
    return data.map(reply => {
      const author = reply.reply_author;
      let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const images = reply.images ? reply.images.join(',') : null;
      return /*html*/`
        <quick-post story="reply" hash="${reply.hash}" url="/r/${reply.hash}" likes="${reply.likes}" replies="${reply.replies}" liked="${reply.liked}"
          views="${reply.views}" time="${reply.createdAt}" replies-url="/r/${reply.hash}/replies" likes-url="/r/${reply.hash}/likes" images='${images}'
          author-hash="${author.hash}" author-you="${reply.you}" author-url="/u/${author.hash}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-stories="${author.stories}" author-replies="${author.replies}" parent="${reply.story ? reply.story : reply.reply}" no-preview="false"
          author-img="${author.picture}" author-verified="${author.verified}" author-name="${author.name}" author-followers="${author.followers}"
          author-following="${author.following}" author-follow="${author.is_following}" author-bio="${bio}">
          ${reply.content}
        </quick-post>
      `
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
    return `
			<div class="replies">
				${this.getLoader()}
      </div>
    `;
  }

  getEmptyMsg = text => {
    // get the next attribute
   if (text === "post") {
    return `
      <div class="finish">
        <h2 class="finish__title">No replies found!</h2>
        <p class="desc">
          The post has no replies yet. You can be the first one to reply or come back later, once available they'll appear here.
        </p>
      </div>
    `
   }
   else if(text === "reply") {
    return `
      <div class="finish">
        <h2 class="finish__title">No replies found!</h2>
        <p class="desc">
          The reply has no replies yet. You can be the first one to reply or come back later, once available they'll appear here.
        </p>
      </div>
    `
   }
   else if(text === "story") {
    return `
      <div class="finish">
        <h2 class="finish__title">No replies found!</h2>
        <p class="desc">
          The story has no replies yet. You can be the first one to reply or come back later, once available they'll appear here.
        </p>
      </div>
    `
   }
   else if(text === "search") {
    return `
      <div class="finish">
        <h2 class="title">No replies found!</h2>
        <p class="finish__title">
          There are no replies found for this search. You can try a different searching using a different keyword.
        </p>
      </div>
    `
   }
   else if(text === "user") {
    return `
      <div class="finish">
        <h2 class="finish__title">No replies found!</h2>
        <p class="desc">
          The user has no replies yet. You can come back later, once available they'll appear here.
        </p>
      </div>
    `
   } else {
    return `
      <div class="finish">
        <h2 class="finish__title">No replies found!</h2>
        <p class="desc">
          There are no replies yet. You can come back later, once available they'll appear here.
        </p>
      </div>
    `
   }
  }

  getLastMessage = text => {
    // get the next attribute
    if (text === "post") {
      return `
        <div class="finish">
          <h2 class="finish__title">No more replies!</h2>
          <p class="desc">
            You have exhausted all of the post's replies. You can add a new reply or come back later to check for new replies.
          </p>
        </div>
      `
    } 
    else if(text === "reply") {
      return `
        <div class="finish">
          <h2 class="finish__title">No more replies!</h2>
          <p class="desc">
            You have exhausted all of the reply's replies. You can add a new reply or come back later to check for new replies.
          </p>
        </div>
      `
    }
    else if(text === "story") {
      return `
        <div class="finish">
          <h2 class="finish__title">No more replies!</h2>
          <p class="desc">
            You have exhausted all of the story's replies. You can add a new reply or come back later to check for new replies.
          </p>
        </div>
      `
    }
    else if(text === "search") {
      return `
        <div class="finish">
          <h2 class="finish__title">No more replies!</h2>
          <p class="desc">
            You have exhausted all of the search's results. You can try a different search using a different keyword.
          </p>
        </div>
      `
    }
    else if(text === "user") {
      return `
        <div class="finish">
          <h2 class="finish__title">No more replies!</h2>
          <p class="desc">
            You have exhausted all of the user's replies. You can always come back later to check for new replies.
          </p>
        </div>
      `
    }
    else {
      return `
        <div class="finish">
          <h2 class="finish__title">No more replies!</h2>
          <p class="desc">
            You have reached the end of the replies. You can always come back later to check for new replies.
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
          An error occurred while retrieving replies. Please check your connection and try again.
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

        div.replies {
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