export default class HomeRecent extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.url = `${this.getAttribute('url')}?page=1&limit=6`;
    this.app = window.app;
    this.api = this.app.api;
    this.all = this.getRootNode().host;
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
      const feed = result.feed;
      if (this._page === 1 && feed.length === 0) {
        this.populateFeeds(this.getEmptyMsg(), feedContainer);
      } else {
        const content = this.mapFeeds(feed);
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

  populateFeeds = (content, feedContainer) => {
    // get the loader and remove it
    const loader = feedContainer.querySelector('.loader-container');
    if (loader) {
      loader.remove();
    }

    // insert the content
    feedContainer.insertAdjacentHTML('beforeend', content);
  }

  mapFeeds = feed => feed.map(item => 
    item.type === "reply" ? this.mapReply(item) : this.mapStory(item)
  ).join('');

  #sanitizeBio = bio => (bio || 'This user has not added a bio yet.')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  #authorAttributes = author => ({
    "author-url": `/u/${author.hash}`,
    "author-stories": author.stories,
    "author-replies": author.replies,
    "author-hash": author.hash,
    "author-you": author.you,
    "author-img": author.picture,
    "author-verified": author.verified,
    "author-name": author.name,
    "author-followers": author.followers,
    "author-following": author.following,
    "author-follow": author.is_following,
    "author-contact": author.contact ? JSON.stringify(author.contact) : null,
    "author-bio": this.#sanitizeBio(author.bio)
  });

  #storyAttributes = (story, url) => ({
    url,
    hash: story.hash,
    likes: story.likes,
    replies: story.replies,
    liked: story.liked,
    views: story.views,
    time: story.createdAt,
    "replies-url": `${url}/replies`,
    "likes-url": `${url}/likes`,
    images: story.images?.join(',') || ''
  });

  mapStory = story => {
    const author = this.#authorAttributes(story.author);
    const url = `/post/${story.hash.toLowerCase()}`;
    const baseAttrs = { ...this.#storyAttributes(story, url), ...author };

    const templates = {
      post: /*html*/`
        <quick-post story="quick" ${this.#attrsToString(baseAttrs)}>
          ${story.content}
        </quick-post>
      `,
      poll: /*html*/`
        <poll-post story="poll" 
          ${this.#attrsToString({
            ...baseAttrs,
            voted: story.option ? 'true' : 'false',
            selected: story.option,
            endTime: story.end,
            options: story.poll,
            votes: story.votes
          })}>
          ${story.content}
        </poll-post>
      `,
      story: /*html*/`
        <story-post story="story" 
          ${this.#attrsToString({
            ...baseAttrs,
            topics: story.topics,
            storyTitle: story.title,
            slug: story.slug
          })}>
          ${story.content}
        </story-post>
      `
    };

    return templates[story.kind] || '';
  };

  mapReply = reply => {
    const author = this.#authorAttributes(reply.author);
    const baseAttrs = {
      ...this.#storyAttributes(reply, `/reply/${reply.hash.toLowerCase()}`),
      ...author,
      feed: "true",
      parent: reply.story || reply.reply
    };

    return /*html*/`
      <quick-post story="reply" ${this.#attrsToString(baseAttrs)}>
        ${reply.content}
      </quick-post>
    `;
  };

  #attrsToString = attrs => Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

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