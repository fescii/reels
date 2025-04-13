export default class PostsContainer extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.url = `${this.getAttribute('url')}?page=1&limit=10`;
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
      if (this._page === 1 && result.posts.length === 0) {
        this.populateFeeds(this.getEmptyMsg(), feedContainer);
      } else {
        const content = this.#feeds(result.posts);
        this.populateFeeds(content, feedContainer);
        this.setLastItem(feedContainer);
      }
      
      // Mark the component as successfully loaded
      this.setAttribute('data-loaded', 'true');
    } else {
      this.handleFetchError(feedContainer);
    }
  }

  handleFetchError = (feedContainer) => {
    this.populateFeeds(this.getWrongMessage(), feedContainer);
    // activate the refresh button
    this.activateRefresh();
    
    // Don't mark as loaded on error - parent will check for data-loaded="true"
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
    // No need to mark as loaded if already blocked - parent component will continue to poll
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

  #feeds = feed => {
    return feed.map(post => {
      const author = post.author;
      let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const images = post.images ? post.images.join(',') : null;
      const preview = this.section === "post" ? `no-preview="true"` : `preview="false"`;
      return /*html*/`
        <post-wrapper kind="${post.kind}" feed="true" ${preview} hash="${post.hash}" url="/p/${post.hash}" 
          likes="${post.likes}" replies="${post.replies}" liked="${post.liked}" views="${post.views}" 
          replies-url="/p/${post.hash}/replies" likes-url="/p/${post.hash}/likes" images='${images}'
          time="${post.createdAt}" options='${post.poll}' votes="${post.votes}"
          author-hash="${author.hash}" author-you="${post.you}" author-url="/u/${author.hash}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-stories="${author.stories}" author-replies="${author.replies}" parent="${post.parent}"
          author-img="${author.picture}" author-verified="${author.verified}" author-name="${author.name}" author-followers="${author.followers}"
          author-following="${author.following}" author-follow="${author.is_following}" author-bio="${bio}">
          ${post.content}
        </post-wrapper>
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
      <link rel="stylesheet" href="/static/css/app/home/recent.css">
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
}