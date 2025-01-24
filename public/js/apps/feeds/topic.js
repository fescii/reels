export default class TopicFeed extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this._block = false;
    this._empty = false;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._url = this.getAttribute('url');
    this._kind = this.getAttribute('kind');
    this._query = this.setQuery(this.getAttribute('query'));
    this.app = window.app;
    this.api = this.app.api;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  setQuery = query => !(!query || query === "" || query !== "true");

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const topicsContainer = this.shadowObj.querySelector('.topics');

    // check if the total
    if (topicsContainer) {
      this.fetchTopics(topicsContainer);
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
        const topicsContainer = this.shadowObj.querySelector('.topics');

        // remove the finish message
        finish.remove();

        // set the loader
        topicsContainer.insertAdjacentHTML('beforeend', this.getLoader());

        setTimeout(() => {
          this.fetchTopics(topicsContainer)
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

  fetching = async (url, topicsContainer) => {
    const outerThis = this;
    try {
      const result = this.api.get(url, { content: 'json' })
      console.log(result)
      if (!result.success) {
        outerThis._empty = true;
        outerThis._block = true;
        outerThis.populateTopics(outerThis.getWrongMessage(), topicsContainer);
        outerThis.activateRefresh();
        return;
      }

      const data = result.data;
      if (data.last && outerThis._page === 1 && data.topics.length === 0) {
        outerThis._empty = true;
        outerThis._block = true;
        outerThis.populateTopics(outerThis.getEmptyMsg(outerThis._kind), topicsContainer);
      }
      else if (data.last && data.topics.length < 10) {
        outerThis._empty = true;
        outerThis._block = true;
        const content = outerThis.mapFields(data.topics);
        outerThis.populateTopics(content, topicsContainer);
        outerThis.populateTopics(outerThis.getLastMessage(outerThis._kind), topicsContainer);
      }
      else {
        outerThis._empty = false;
        outerThis._block = false;

        const content = outerThis.mapFields(data.topics);
        outerThis.populateTopics(content, topicsContainer);
        outerThis.scrollEvent(topicsContainer);
      }
    } catch (error) {
      // console.log(error)
      outerThis._empty = true;
      outerThis._block = true;
      outerThis.populateTopics(outerThis.getWrongMessage(), topicsContainer);
      this.activateRefresh();
    }
  }

  fetchTopics = topicsContainer => {
    const outerThis = this;
    const url = this._query ? `${this._url}&page=${this._page}` : `${this._url}?page=${this._page}`;

    if(!this._block && !this._empty) {
      outerThis._empty = true;
      outerThis._block = true;
      setTimeout(() => {
        // fetch the topics
        outerThis.fetching(url, topicsContainer)
      }, 1000);
    }
  }

  populateTopics = (content, topicsContainer) => {
    // get the loader and remove it
    const loader = topicsContainer.querySelector('.loader-container');
    if (loader){
      loader.remove();
    }

    // insert the content
    topicsContainer.insertAdjacentHTML('beforeend', content);
  }
  
  scrollEvent = topicsContainer => {
    const outerThis = this;
    window.addEventListener('scroll', function () {
      let margin = document.body.clientHeight - window.innerHeight - 150;
      if (window.scrollY > margin && !outerThis._empty && !outerThis._block) {
        outerThis._page += 1;
        outerThis.populateTopics(outerThis.getLoader(), topicsContainer);
        outerThis.fetchTopics(topicsContainer);
      }
    });

    // Launch scroll event
    const scrollEvent = new Event('scroll');
    window.dispatchEvent(scrollEvent);
  }

  mapFields = data => {
    return data.map(topic => {
      const author = topic.topic_author;
      let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const url = `/t/${topic.hash.toLowerCase()}`;
      return /*html*/`
        <topic-wrapper hash="${topic.hash}" name="${topic.name}" slug="${topic.slug}"
          topic-follow="${topic.is_following}" subscribed="${topic.is_subscribed}" url="${url}" views="${topic.views}"
          subscribers="${topic.subscribers}" followers="${topic.followers}" stories="${topic.stories}"
          author-hash="${author.hash}" author-you="${topic.you}" author-url="/u/${author.hash}"
          author-img="${author.picture}" author-verified="${author.verified}" author-name="${author.name}" author-followers="${author.followers}"
          author-following="${author.following}" author-follow="${author.is_following}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-bio="${bio}">
          ${this.topicContent(topic.summary)}
        </topic-wrapper>
      `
    }).join('');
  }

  topicContent = data => {
    if (data.length <= 0 || !data) {
      return /*html*/`
        <div class="finish">
          <p>The topic has no information yet.
            More information will be available once the author(s) adds more content.
          </p>
        </div>
      `;
    }
    else {
      return data
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
        <div class="loader"></div>
      </div>
    `
  }

  getBody = () => {
    // language=HTML
    return `
			<div class="topics">
				${this.getLoader()}
      </div>
    `;
  }

  getEmptyMsg = text => {
    // get the next attribute
   if (text === "feed") {
    return `
      <div class="finish">
        <h2 class="finish__title">No topics</h2>
        <p class="desc">
          There are no topics/posts yet. You can come back later, once available they'll appear here.
        </p>
      </div>
    `
   } 
   else if(text === "search") {
    return `
      <div class="finish">
        <h2 class="finish__title">No topics found!</h2>
        <p class="desc">
          No topics found for this search. You can try searching with a different keyword.
        </p>
      </div>
    `
   }
   else if(text === "topic") {
    return `
      <div class="finish">
        <h2 class="finish__title">No topics found!</h2>
        <p class="desc">
          No topics found for this topic. You can come back later, once available they'll appear here.
        </p>
      </div>
    `
   }
   else {
    return `
      <div class="finish">
        <h2 class="finish__title"> No topics found!</h2>
        <p class="desc">
          No topics found. You can come back later, once available they'll appear here.
        </p>
      </div>
    `
   }
  }

  getLastMessage = text => {
    // get the next attribute
    if (text === "feed") {
      return `
        <div class="finish">
          <h2 class="finish__title">That's all for now!</h2>
          <p class="desc">
            You have reached the end of the topics. You can always come back later to check for new topics.
          </p>
        </div>
      `
    }
    else if(text === "user") {
      return `
        <div class="finish">
          <h2 class="finish__title">That's all for now!</h2>
          <p class="desc">
            You have exhausted all of the user's topics. You can always come back later to check for new topics.
          </p>
        </div>
      `
    }
    else if(text === "search") {
      return `
        <div class="finish">
          <h2 class="finish__title">That's all the results!</h2>
          <p class="desc">
            You have reached the end of the search results. You can try searching with a different keyword.
          </p>
        </div>
      `
    }
    else if(text === "topic") {
      return `
        <div class="finish">
          <h2 class="finish__title">That's all for now!</h2>
          <p class="desc">
            You have reached the end of the related topics. You can always come back later or refresh the page to check for new topics.
          </p>
        </div>
      `
    }
    else {
      return `
        <div class="finish">
          <h2 class="finish__title">That's all!</h2>
          <p class="desc">
            You have reached the end of the topics. You can always come back later or refresh the page to check for new topics.
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
          An error occurred while retrieving topics. Please check your connection and try again.
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

        div.topics {
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