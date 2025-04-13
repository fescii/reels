export default class PeopleFeed extends HTMLElement {
  constructor() {
    super();
    this._block = false;
    this._empty = false;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._total = this.parseToNumber(this.getAttribute('total'));
    this._kind = this.getAttribute('kind');
    this._url = this.getAttribute('url');
    this._isFirstLoad = true; // Added this line
    this.app = window.app;
    this.api = this.app.api;
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.render();
  }

  setQuery = query => !(!query || query === "" || query !== "true");

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const peopleContainer = this.shadowObj.querySelector('.people');

		// check total
		if (peopleContainer) {
      this.fetchPeople(peopleContainer);     
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
        const peopleContainer = this.shadowObj.querySelector('.people');

        // remove the finish message
        finish.remove();

        // set the loader
        peopleContainer.insertAdjacentHTML('beforeend', this.getLoader());

        setTimeout(() => {
          this.fetchPeople(peopleContainer);
        }, 1000);
      });
    }
  }

  activateMoreButton = () => {
    const more = this.shadowObj.querySelector('div.more');
    if (more) {
      const btn = more.querySelector('button.more-btn');
      btn.addEventListener('click', () => {
        // increment the page
        this._page += 1;
        const peopleContainer = this.shadowObj.querySelector('.people');
        more.remove();
        peopleContainer.insertAdjacentHTML('beforeend', this.getLoader());
        setTimeout(() => {
          this.fetchPeople(peopleContainer);
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

  fetching = async (url, peopleContainer) => {
    const outerThis = this;
    try {
      const result = await this.api.get(url, { content: 'json' });
  
      if (!result.success) {
        outerThis.handleFetchError(peopleContainer);
        return;
      }
  
      const people = result.users;
      if (outerThis._page === 1 && people.length === 0) {
        outerThis.handleEmptyResult(peopleContainer);
      } else if (people.length < 10) {
        outerThis.handlePartialResult(people, peopleContainer);
      } else {
        outerThis.handleFullResult(people, peopleContainer);
      }
  
    } catch (error) {
      outerThis.handleFetchError(peopleContainer);
    }
  }
  
  handleFetchError = (peopleContainer) => {
    // Block on error
    this._empty = true;
    this._block = true;
    this.populatePeople(this.getWrongMessage(), peopleContainer);
    this.activateRefresh();
  }
  
  handleEmptyResult = (peopleContainer) => {
    // Block future fetches since we have no content
    this._empty = true;
    this._block = true;
    this.populatePeople(this.getEmptyMsg(this._kind), peopleContainer);
  }
  
  handlePartialResult = (people, peopleContainer) => {
    // Block future fetches since we're at the end
    this._empty = true;
    this._block = true;
    const content = this.mapFields(people);
    this.populatePeople(content, peopleContainer);
    this.populatePeople(this.getLastMessage(this._kind), peopleContainer);
  }
  
  handleFullResult = (people, peopleContainer) => {
    // Unblock for next fetch since we have a full page
    this._block = false;
    this._empty = false;
    const content = this.mapFields(people);
    this.populatePeople(content, peopleContainer);

    // Add the more button
    const moreButton = this.getMoreButton();
    peopleContainer.insertAdjacentHTML('beforeend', moreButton);
    this.activateMoreButton();
  }
  
  fetchPeople = peopleContainer => {
    if (!this._block && !this._empty) {
      // Block further fetches while this one is in progress
      this._block = true;
      const url = `${this._url}?page=${this._page}`;
      setTimeout(() => {
        this.fetching(url, peopleContainer);
      }, 1000);
    }
  }
  
  populatePeople = (content, peopleContainer) => {
    // get the loader and remove it
    const loader = peopleContainer.querySelector('.loader-container');
    if (loader) {
      loader.remove();
    }
  
    // insert the content
    peopleContainer.insertAdjacentHTML('beforeend', content);
  }

  mapFields = data => {
    return data.map(user => {
      let bio = user.bio === null ? 'This user has not added a bio yet.' : user.bio;
      
      // create a paragraph with the \n replaced with <br> if there are more than one \n back to back replace them with one <br>
      if (bio.includes('\n')) bio = bio.replace(/\n+/g, '<br>');
      return /*html*/`
				<user-wrapper hash="${user.hash}" you="${user.you}" url="/u/${user.hash}" posts="${user.posts}" replies="${user.replies}"
          picture="${user.picture}" verified="${user.verified}" name="${user.name}" followers="${user.followers}" contact='${user.contact ? JSON.stringify(user.contact) : null}'
          following="${user.following}" user-follow="${user.is_following}">
          ${bio}
				</user-wrapper>
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
    return /* html */`
			<div class="people">
				${this.getLoader()}
      </div>
    `;
  }

  getEmptyMsg = text => {
    switch (text) {
			case 'likes':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">No Likes found!</h2>
						<p class="desc">
							The post has no likes yet. You can be the first to like it or you can always come back later to check for new likes.
						</p>
					</div>
				`;
			case 'recommended':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">The authors were not found!</h2>
						<p class="desc">
              There are no authors to recommend at the moment. You can always come back later to check for new authors.
						</p>
					</div>
				`
		}
  }

  getLastMessage = text => {
    switch (text) {
			case 'likes':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">No more likes!</h2>
						<p class="desc">
							You have reached the end of people who liked this post. You can always come back later to check for new likes.
						</p>
					</div>
				`
			case 'recommended':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">No more authors!</h2>
						<p class="desc">
							You have reached the end of recommended authors. You can always come back later to check for new authors.
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
          An error occurred while retrieving people. Please check your connection and try again.
        </p>
        <button class="finish">Retry</button>
      </div>
    `;
  }

  getMoreButton = () => {
    return /* html */`
      <div class="more">
        <button class="more-btn">More</button>
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
          min-height: 150px;
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

        div.people {
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

        div.more {
          padding: 10px 0 55px;
          width: 100%;
          min-width: 100%;
          height: auto;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
        }

        div.more > button.more-btn {
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
          div.more > button.more-btn,
          div.finish > button.finish {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}