export default class RepliesFeed extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this._block = false;
    this._empty = false;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._url = this.getAttribute('url');
    this._kind = this.getAttribute('kind');
    this._query = this.setQuery(this.getAttribute('query'));
    this._noPreview = this.convertToBoolean(this.getAttribute('no-preview'));

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  setQuery = query => !(!query || query === "" || query !== "true");

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
      const response = await this.fetchWithTimeout(url);
      const result = await response.json();

      if(!result.success) {
        outerThis._empty = true;
        outerThis._block = true;
        outerThis.populateReplies(outerThis.getWrongMessage(), repliesContainer);
        outerThis.activateRefresh();
        return;
      }

      const data = result.data;
      if (data.last && outerThis._page === 1 && data.replies.length === 0) {
        outerThis._empty = true;
        outerThis._block = true;
        outerThis.populateReplies(outerThis.getEmptyMsg(outerThis._kind), repliesContainer);
      }
      else if (data.last && data.replies.length < 10) {
        outerThis._empty = true;
        outerThis._block = true;
        const content = outerThis.mapFields(data.replies);
        outerThis.populateReplies(content, repliesContainer);
        outerThis.populateReplies(outerThis.getLastMessage(outerThis._kind), repliesContainer);
      }
      else {
        outerThis._empty = false;
        outerThis._block = false;

        const content = outerThis.mapFields(data.replies);
        outerThis.populateReplies(content, repliesContainer);
        outerThis.scrollEvent(repliesContainer);
      }
    } catch (error) {
      // console.log(error)
      outerThis._empty = true;
      outerThis._block = true;
      outerThis.populateReplies(outerThis.getWrongMessage(), repliesContainer);
      this.activateRefresh();
    }
  }

  fetchReplies = repliesContainer => {
    const outerThis = this;
    const url = this._query ? `${this._url}&page=${this._page}` : `${this._url}?page=${this._page}`;

    if(!this._block && !this._empty) {
      outerThis._empty = true;
      outerThis._block = true;
      setTimeout(() => {
        // fetch the replies
        outerThis.fetching(url, repliesContainer)
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
    window.addEventListener('scroll', function () {
      let margin = document.body.clientHeight - window.innerHeight - 150;
      if (window.scrollY > margin && !outerThis._empty && !outerThis._block) {
        outerThis._page += 1;
        outerThis.populateReplies(outerThis.getLoader(), repliesContainer);
        outerThis.fetchReplies(repliesContainer);
      }
    });

    // Launch scroll event
    const scrollEvent = new Event('scroll');
    window.dispatchEvent(scrollEvent);
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
          views="${reply.views}" time="${reply.createdAt}" replies-url="/api/v1/r/${reply.hash}/replies" likes-url="/api/v1/r/${reply.hash}/likes" images='${images}'
          author-hash="${author.hash}" author-you="${reply.you}" author-url="/u/${author.hash}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-stories="${author.stories}" author-replies="${author.replies}" parent="${reply.story ? reply.story : reply.reply}" no-preview="${this._noPreview ? 'true' : 'false'}"
          author-img="${author.picture}" author-verified="${author.verified}" author-name="${author.name}" author-followers="${author.followers}"
          author-following="${author.following}" author-follow="${author.is_following}" author-bio="${bio}">
          ${reply.content}
        </quick-post>
      `
    }).join('');
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