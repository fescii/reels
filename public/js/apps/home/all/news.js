export default class HomeNews extends HTMLElement {
	constructor() {
		// We are not even going to touch this.
		super();
		this.url = this.getAttribute('url');
    this.app = window.app;
    this.api = this.app.api;
    this.all = this.getRootNode().host;
    this.mql = window.matchMedia('(max-width: 660px)');
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
    
		this.fetchNews(contentContainer);
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
          this.fetchNews(feedContainer);
        }, 1000);
      });
    }
  }

  fetching = (url, newsContainer) => {
    const outerThis = this;

    this.api.get(url, { content: 'json' }, { allow: true, duration: 7200 })
    .then(result => {
      if (!result.success) {
        this.handleFetchError(newsContainer);
        return;
      }

      const all = result.news;

      // get only top 10 news
      const news = all.slice(0, 10);

      if (news.length === 0) {
        newsContainer.innerHTML = outerThis.getEmptyMsg();
        return;
      }

      this.handleFetchSuccess(news, newsContainer);
    })
    .catch(_error => {
      // console.log(error)
      this.handleFetchError(newsContainer);
    });
  }

  handleFetchError = (newsContainer) => {
    newsContainer.innerHTML = this.getWrongMessage();
    this.activateRefresh();
  }

  handleFetchSuccess = (news, newsContainer) => {
    const content = this.mapFields(news);
    newsContainer.insertAdjacentHTML('beforebegin', this.getTitle());
    newsContainer.innerHTML = content;

    this.all.home = {
      last: false,
      next: 2,
      loaded: true
    };
  }

  fetchNews = newsContainer => {
    const outerThis = this;

    if(!this._block && !this._empty) {
      outerThis.fetching(this.url, newsContainer);
    }
  }

  
  mapFields = data => {
    return data.map(article => {
      return /*html*/`
        <news-wrapper news-title="${article.title}" url="${article.url}" image="${article.urlToImage}" time="${article.publishedAt}"
          description="${article.description}" author="${article.author}" source="${article.source.name}"
          content='${article.content}'>
        </news-wrapper>
      `
    }).join('');
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
				<h2>Headlines</h2>
			</div>
		`
	}

	getEmptyMsg = () => {
    // get the next attribute
    return /*html*/`
    <div class="empty">
      <div class="title">
        <h2>Headlines</h2>
      </div>
      <p class="desc">
        There are no headlines available at the moment. Please check back later.
      </p>
    </div>
    `
  }

  getWrongMessage = () => {
    return /* html */`
      <div class="finish">
        <h2 class="finish__title">Oops!</h2>
        <p class="desc">
          There was an error getting the latest news. Please check your internet connection and try again.
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
          You are offline. Please check your internet connection and try again.
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
						padding: 5px 0 0;
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