export default class TopicsContainer extends HTMLElement {
	constructor() {
		// We are not even going to touch this.
		super();

		this._url = this.getAttribute('url');

		// let's create our shadow root
		this.shadowObj = this.attachShadow({ mode: "open" });

		this.render();
	}

	render() {
		this.shadowObj.innerHTML = this.getTemplate();
	}

  convertToBoolean = value => {
    return value === 'true';
  }

	connectedCallback() {
		const contentContainer = this.shadowObj.querySelector('div.content');

    // get offline attribute
    const offline = this.convertToBoolean(this.getAttribute('offline'));

    // if offline is true
    if (offline) {
      this.fetchOfflineFeeds(contentContainer);
    } else {
			this.fetchTopics(contentContainer);
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
        const feedContainer = this.shadowObj.querySelector('div.content');

        // set the loader
        feedContainer.innerHTML = this.getLoader();

        setTimeout(() => {
          this.fetchTopics(feedContainer);
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

	fetching = async (url, topicsContainer) => {
    const mql = window.matchMedia('(max-width: 660px)');
    const outerThis = this;
    const options = { 
      method: 'GET',
      // set the cache control to max-age to 2 hours
      "Cache-Control": "max-age=7200",
      "Accept": "application/json"
    }


    try {
      // fetch 
      const result = await outerThis.getCacheData(url, 7200, options)

      // if result is not successful
      if (!result.success) {
        topicsContainer.innerHTML = outerThis.getWrongMessage();
        this.activateRefresh();
        return;
      }
      
      const data = result.data;
  
      if(data.topics.length === 0) {
        topicsContainer.innerHTML = outerThis.getEmptyMsg();
        return;
      }
      
      const content = outerThis.mapFields(data.topics);
      topicsContainer.insertAdjacentHTML('beforebegin', outerThis.getTitle())
      topicsContainer.innerHTML =  content
      outerThis.setLastItem(topicsContainer);

      if (mql.matches) {
        // set next
        window.home = {
          last: false,
          next: 3,
          loaded: true
        }
      }
    } catch (error) {
      // console.log(error)
      topicsContainer.innerHTML = outerThis.getWrongMessage();
      // activate the refresh button
      outerThis.activateRefresh();
    }
  }

  fetchOfflineFeeds = async topicsContainer => {
    const mql = window.matchMedia('(max-width: 660px)');
    const outerThis = this;
    const url = this._url;
    try {
      // fetch from cache
      const result = await outerThis.getOfflineData(url);

      // if result is not successful
      if (!result.success) {
        topicsContainer.innerHTML = outerThis.getWrongMessage();
        this.activateOfflineRefresh();
        return;
      }

      // get the data
      const data = result.data;

      // if topics is empty
      if (data.topics.length === 0) {
        topicsContainer.innerHTML = outerThis.getEmptyMsg();
        this.activateOfflineRefresh();
        return;
      }

      // map the fields
      const content = outerThis.mapFields(data.topics);
      topicsContainer.innerHTML = content;
      outerThis.setLastItem(topicsContainer);
      if(mql.matches) {
        // set next
        window.home = {
          last: false,
          next: 3,
          loaded: true
        }
      }
    } catch (error) {
      // display error message
      topicsContainer.innerHTML = outerThis.getOfflineWrong();

      // activate the refresh button
      outerThis.activateOfflineRefresh();
    }
  }

  getOfflineData = async url => {
    const cacheName = "user-cache";

    try {
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

    } catch (error) {
      // console.error('Error fetching data:', error);
      throw error;
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

  fetchTopics = topicsContainer => {
    const outerThis = this;
    const url = `${this._url}?limit=10`;

    if(!this._block && !this._empty) {
      outerThis.fetching(url, topicsContainer);
    }
  }

  populateTopics = (content, topicsContainer) => {
    // get the loader and remove it
    const loader = topicsContainer.querySelector('topic-loader');
    if (loader){
      loader.remove();
    }

    // insert the content
    topicsContainer.insertAdjacentHTML('beforeend', content);
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
        <div class="empty">
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

  setLastItem = contentContainer => {
    // get last element child (topic)
    const lastItem = contentContainer.lastElementChild;

    // set border-bottom to none
    if (lastItem) {
      lastItem.style.setProperty('border-bottom', 'none');
      lastItem.style.setProperty('padding-bottom', '0');
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
		return `
			<topic-loader speed="300"></topic-loader>
		`
	}

	getBody = () => {
		// get mql for media query: desktop
		return /* html */`
		  <div class="content">
				${this.getLoader()}
			</div>
		`;
	}

	getTitle = () => {
		return /*html*/`
			<div class="title">
				<h2>Most read topics</h2>
			</div>
		`
	}

	getEmptyMsg = () => {
    // get the next attribute
    return /*html*/`
    <div class="empty">
      <div class="title">
        <h2>Most read topics</h2>
      </div>
      <p class="desc">
        No topics was found, you can retry or come back later. Optionally you check your connection.
      </p>
    </div>
    `
  }

  getWrongMessage = () => {
    return /* html */`
      <div class="finish">
        <h2 class="finish__title">Oops!</h2>
        <p class="desc">
          An error occurred while fetching trending topics. Please check your connection and try again.
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
					margin: 0;
				  padding: 0;
				  display: flex;
				  flex-flow: column;
				  gap: 0;
        }

				div.content {
				  margin: 0;
				  padding: 0;
				  display: flex;
				  flex-flow: row;
				  flex-wrap: wrap;
				  align-items: center;
				  justify-content: start;
				  gap: 0;
				  width: 100%;
				}

				.title {
          display: flex;
					width: 100%;
          flex-flow: column;
					padding: 5px 10px 6px;
          margin: 0 0 0 -2px;
          gap: 0;
					background: var(--light-linear);
					border-radius: 7px;
        }

        .title > h2 {
          font-size: 1.5rem;
          font-weight: 500;
          font-family: var(--font-text), sans-serif;
          margin: 0;
          color: var(--text-color);
        }

        .title > p.info {
          margin: 0;
          font-size: 0.9rem;
          font-style: italic;
          font-weight: 400;
          font-family: var(--font-text), sans-serif;
          margin: 0;
          color: var(--text-color);
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

        div.empty {
          padding: 10px 0;
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
          font-size: 1.15rem;
          font-weight: 500;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
        }

        div.empty p.desc,
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
					:host {
        		font-size: 16px;
						padding: 5px 0 10px;
					}

					::-webkit-scrollbar {
						-webkit-appearance: none;
					}

					a,
          div.finish > button.finish {
            cursor: default !important;
          }
				}
	    </style>
    `;
	}
}