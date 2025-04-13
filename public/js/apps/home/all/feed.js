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
    const feedContainer = this.shadowObj.querySelector('.stories');

    // check if the total
    if (feedContainer) {
      this.fetchFeeds(feedContainer);
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

  dispatchComponentLoaded = () => {
    // Dispatch a custom event that parent components can listen for
    const event = new CustomEvent('component-loaded', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  fetching = async (url, feedContainer) => {
    // Remove the scroll event
    this.removeScrollEvent();
    try {
      const result = await this.api.get(url, { content: 'json' });
      if (result.success) {
        this.handleFetchSuccess(result.posts, feedContainer);
      } else {
        this.handleFetchFailure(feedContainer);
      }
    } catch (error) {
      console.log(error);
      this.handleFetchFailure(feedContainer);
    }
  }

  handleFetchSuccess = (posts, feedContainer) => {
    // First page with no content
    if (this._page === 1 && posts.length === 0) {
      this._empty = true;
      this._block = true;
      this.populateFeeds(this.getEmptyMsg(), feedContainer);
    } 
    // Last page with some content
    else if (posts.length < 10) {
      this._empty = true;
      this._block = true;
      const content = this.#feeds(posts);
      this.populateFeeds(content, feedContainer);
      this.populateFeeds(this.getLastMessage(), feedContainer);
    } 
    // Normal page with content, more might be available
    else {
      this._block = false;  // Unblock for next fetch
      this._empty = false;  // More content might be available
      const content = this.#feeds(posts);
      this.populateFeeds(content, feedContainer);
    }
    
    // Re-add scroll event after content is loaded
    this.scrollEvent(feedContainer);
    
    // Mark as successfully loaded
    this.setAttribute('data-loaded', 'true');
  }

  handleFetchFailure = feedContainer => {
    this._empty = true;
    this._block = true;
    this.populateFeeds(this.getWrongMessage(), feedContainer);
    // activate the refresh button
    this.activateRefresh();
    
    // Don't mark as loaded on error - parent will continue polling
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
    // Don't need to mark as loaded if already blocked - parent will continue polling
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

  #feeds = feed => {
    return feed.map(post => {
      const author = post.author;
      let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const images = post.images ? post.images.join(',') : null;
      const preview = this.section === "post" ? `no-preview="true"` : `preview="false"`;
      return /*html*/`
        <post-wrapper kind="${post.kind}" feed="true" ${preview} hash="${post.hash}" url="/r/${post.hash}" 
          likes="${post.likes}" replies="${post.replies}" liked="${post.liked}" views="${post.views}" 
          replies-url="/post/${post.hash}/replies" likes-url="/post/${post.hash}/likes" images='${images}'
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

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      <link rel="stylesheet" href="/static/css/app/home/feed.css">
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
}