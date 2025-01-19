export default class HighlightsContainer extends HTMLElement {
	constructor() {
		// We are not even going to touch this.
		super();

    this._url = this.getAttribute('url');

		// let's create our shadow root
		this.shadowObj = this.attachShadow({ mode: "open" });
    this.app = window.app;
    this.api = this.app.api;
		this.render();
	}

	render() {
		this.shadowObj.innerHTML = this.getTemplate();
	}

	connectedCallback() {
		
		const contentContainer = this.shadowObj.querySelector('div.content');

		this.fetchTopics(contentContainer);
	}

	fetchTopics = (contentContainer) => {
    const outerThis = this;
		const topicsLoader = this.shadowObj.querySelector('post-loader');
    setTimeout(async () => {
      try {
      const response = await this.api.get(this._url, { content: 'json' });
      // check for success response
      if (response.success) {
        // update the content
        const content = outerThis.getHighlights(response.data);
        // remove the loader
        topicsLoader.remove();
        // insert the content
        contentContainer.insertAdjacentHTML('beforeend', content);
      } else {
        // display error message
        const content = outerThis.getEmpty();
        topicsLoader.remove();
        contentContainer.insertAdjacentHTML('beforeend', content);
      }
      } catch (error) {
      // display error message
      const content = outerThis.getEmpty();
      topicsLoader.remove();
      contentContainer.insertAdjacentHTML('beforeend', content);
      }
    }, 2000);
	}

  formatNumber = n => {
    if (n >= 0 && n <= 999) {
      return n.toString();
    } else if (n >= 1000 && n <= 9999) {
      const value = (n / 1000).toFixed(2);
      return `${value}k`;
    } else if (n >= 10000 && n <= 99999) {
      const value = (n / 1000).toFixed(1);
      return `${value}k`;
    } else if (n >= 100000 && n <= 999999) {
      const value = (n / 1000).toFixed(0);
      return `${value}k`;
    } else if (n >= 1000000 && n <= 9999999) {
      const value = (n / 1000000).toFixed(2);
      return `${value}M`;
    } else if (n >= 10000000 && n <= 99999999) {
      const value = (n / 1000000).toFixed(1);
      return `${value}M`;
    } else if (n >= 100000000 && n <= 999999999) {
      const value = (n / 1000000).toFixed(0);
      return `${value}M`;
    } else if (n >= 1000000000) {
      return "1B+";
    }
    else {
      return 0;
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

	getLoader = () => {
		return `
			<post-loader speed="300"></post-loader>
		`
	}

	getBody = () => {
		// language=HTML
		return /* html */`
			<div class="content">
				${this.getLoader()}
			</div>
    `;
	}

  getHighlights = data => {
    // Get the number of followers, views, stories and topics
    const followers = this.parseToNumber(this.getAttribute('followers'));
    const views = data.all;
    const stories = this.parseToNumber(this.getAttribute('stories'));
    const topics = data.topics;

    const replies = this.parseToNumber(this.getAttribute('replies'));

    // get current and last month views
    const currentMonthViews = data.current;
    const lastMonthViews = data.last;

    let name = this.getAttribute('name');

    if (name) {
      name = name.split(' ');

      name = name[0];
      name = name.toLowerCase();
    }
    else {
      name = 'User'
    }

    // calculate the percentage increase or decrease in views
    const percentage = lastMonthViews === 0 ? 100 : ((currentMonthViews - lastMonthViews) / lastMonthViews) * 100;

    let increaseOrDecrease = this.getLevel(name);

    // check if last month views is 0 and this month views is also 0
    if (lastMonthViews > 0 || currentMonthViews > 0) {
      // convert percentage to 1 decimal place if it is a decimal
      const percentageFormatted = percentage % 1 === 0 ? percentage : percentage.toFixed(1);

      // get the increase or decrease in views
      increaseOrDecrease = percentage > 0 ? this.getIncrease(percentageFormatted) : this.getDecrease(Math.abs(percentageFormatted));
    }

    // format the number of followers, views, stories and topics
    const followersFormatted = this.formatNumber(followers);
    const viewsFormatted = this.formatNumber(currentMonthViews);
    const storiesFormatted = this.formatNumber(stories);
    const topicsFormatted = this.formatNumber(topics);

    return /* html */`
      <p class="title">Highlights</p>
      <ul class="info">
        <li class="item">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z"></path>
            </svg>
          </span>
          <span class="link">
            <span class="numbers" id="followers">${followersFormatted}</span> ${followers === 1 ? 'person' : 'people'} follows ${name.toLowerCase()}
          </span>
        </li>
        <li class="item">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M6 2c.306 0 .582.187.696.471L10 10.731l1.304-3.26A.751.751 0 0 1 12 7h3.25a.75.75 0 0 1 0 1.5h-2.742l-1.812 4.528a.751.751 0 0 1-1.392 0L6 4.77 4.696 8.03A.75.75 0 0 1 4 8.5H.75a.75.75 0 0 1 0-1.5h2.742l1.812-4.529A.751.751 0 0 1 6 2Z"></path>
            </svg>
          </span>
          <span class="link">
            <span class="numbers" id="views">${viewsFormatted}</span> content views this month
          </span>
        </li>
        ${increaseOrDecrease}
        <li class="item">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25ZM3.5 6.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 2.25h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1 0-1.5Z"></path>
            </svg>
          </span>
          <span class="link">
            <span class="numbers" id="stories">${storiesFormatted}</span> published ${stories === 1 ? 'story' : 'stories'}/${stories === 1 ? 'post' : 'posts'}
          </span>
        </li>
        <li class="item">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M6.78 1.97a.75.75 0 0 1 0 1.06L3.81 6h6.44A4.75 4.75 0 0 1 15 10.75v2.5a.75.75 0 0 1-1.5 0v-2.5a3.25 3.25 0 0 0-3.25-3.25H3.81l2.97 2.97a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L1.47 7.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"></path>
            </svg>
          </span>
          <span class="link">
            <span class="numbers" id="replies">${replies}</span> replies addded so far
          </span>
        </li>
        <li class="item">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M6.368 1.01a.75.75 0 0 1 .623.859L6.57 4.5h3.98l.46-2.868a.75.75 0 0 1 1.48.237L12.07 4.5h2.18a.75.75 0 0 1 0 1.5h-2.42l-.64 4h2.56a.75.75 0 0 1 0 1.5h-2.8l-.46 2.869a.75.75 0 0 1-1.48-.237l.42-2.632H5.45l-.46 2.869a.75.75 0 0 1-1.48-.237l.42-2.632H1.75a.75.75 0 0 1 0-1.5h2.42l.64-4H2.25a.75.75 0 0 1 0-1.5h2.8l.46-2.868a.75.75 0 0 1 .858-.622ZM9.67 10l.64-4H6.33l-.64 4Z"></path>
            </svg>
          </span>
          <span class="link">
            subscribed to <span class="numbers" id="topics">${topicsFormatted}</span> topic${topics === 1 ? '' : 's'}
          </span>
        </li>
      </ul>
    `
  }

  getIncrease = percentage => {
    return /*html*/`
      <li class="item">
        <span class="icon increase">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M4.53 4.75A.75.75 0 0 1 5.28 4h6.01a.75.75 0 0 1 .75.75v6.01a.75.75 0 0 1-1.5 0v-4.2l-5.26 5.261a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L9.48 5.5h-4.2a.75.75 0 0 1-.75-.75Z"></path>
          </svg>
        </span>
        <span class="link">
          <span class="numbers" id="percentage">${percentage}%</span> increase in views this month
        </span>
      </li>
    `
  }

  getLevel = name => {
    return /*html*/`
      <li class="item">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path>
          </svg>
        </span>
        <span class="link">
          ${name} has no content views yet
        </span>
      </li>
    `
  }

  getDecrease = percentage => {
    return /*html*/`
      <li class="item">
        <span class="icon decrease">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M4.22 4.179a.75.75 0 0 1 1.06 0l5.26 5.26v-4.2a.75.75 0 0 1 1.5 0v6.01a.75.75 0 0 1-.75.75H5.28a.75.75 0 0 1 0-1.5h4.2L4.22 5.24a.75.75 0 0 1 0-1.06Z"></path>
          </svg>
        </span>
        <span class="link">
          <span class="numbers" id="percentage">${percentage}%</span> decrease in views this month
        </span>
      </li>
    `
  }

  getEmpty = () => {
    return /* html */`
      <p class="title">Highlights</p>
      <div class="empty">
        <p>User highlights were not loaded, and error while fetching data</p>
        <p>Try refreshing the page or check your internet connection. If the problem persists, please contact support.</p>
      </div>
    `
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
				  padding: 10px 0 0 0;
				  display: flex;
				  flex-flow: column;
				  gap: 10px;
				}

				div.content {
				  padding: 0;
				  display: flex;
				  flex-flow: row;
				  flex-wrap: wrap;
				  align-items: center;
				  justify-content: start;
				  width: 100%;
          padding: 0;
          gap: 10px;
        }
        
        p.title {
          width: 100%;
          border-bottom: var(--border);
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1.2rem;
          line-height: 1.3;
          font-weight: 600;
          margin: 0;
          display: none;
          padding: 0 0 8px;
        }

        div.empty {
          width: 100%;
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          gap: 8px;
        }

        div.empty > p {
          width: 100%;
          padding: 0;
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1rem;
          font-weight: 400;
        }
        
        ul.info {
          width: 100%;
          padding: 0;
          margin: 0;
          list-style-type: none;
          display: flex;
          flex-flow: column;
          gap: 10px;
        }
        
        ul.info > li.item {
          padding: 0;
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: row;
          align-items: center;
          flex-wrap: nowrap;
          gap: 10px;
        }
        
        ul.info > li.item > .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          width: 26px;
          min-height: 26px;
          min-width: 26px;
          max-height: 26px;
          max-width: 26px;
          padding: 3px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          background-color: var(--gray-background);
          color: var(--gray-color);
          font-size: 0.9rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        ul.info > li.item > .icon > svg {
          height: 15px;
          width: 15px;
        }

        ul.info > li.item > .icon.increase {
          background: var(--accent-linear);
          color: var(--white-color);
        }

        ul.info > li.item > .icon.decrease {
          background: var(--error-linear);
          color: var(--white-color);
        }
        
        ul.info > li.item > .link {
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 400;
          text-decoration: none;
        }
        
        ul.info > li.item > a.link:hover {
          color: var(--text-color);
        }
        
        ul.info > li.item > .link .numbers {
          color: var(--highlight-color);
          font-weight: 600;
          font-family: var(--font-main), sans-serif;
          font-size: 0.95rem;
          display: inline-block;
          margin: 0 0 -2px 0;
        }
        
        ul.info > li.item.last {
          background-color: var(--gray-background);
          padding: 10px;
          margin: 5px 0;
          border-radius: 12px;
          -webkit-border-radius: 12px;
        }

				@media screen and (max-width:660px) {
					:host {
        		font-size: 16px;
					}

					::-webkit-scrollbar {
						-webkit-appearance: none;
					}

					a {
						cursor: default !important;
					}
				}
	    </style>
    `;
	}
}