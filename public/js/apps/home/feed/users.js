export default class UserFeed extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.api = window.app.api;
    this._block = false;
    this._empty = false;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._total = this.parseToNumber(this.getAttribute('total'));
		this._kind = this.getAttribute('kind');
    this._url = this.getAttribute('url');
    this._query = this.setQuery(this.getAttribute('query'));

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  setQuery = query => {
    return query && query !== "" && query === "true";
  }

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
    this._empty = true;
    this._block = true;
    this.populatePeople(this.getWrongMessage(this._kind), peopleContainer);
    this.activateRefresh();
  }

  handleEmptyResult = (peopleContainer) => {
    this._empty = true;
    this._block = true;
    this.populatePeople(this.getEmptyMsg(this._kind), peopleContainer);
  }

  handlePartialResult = (people, peopleContainer) => {
    this._empty = true;
    this._block = true;
    const content = this.mapFields(people);
    this.populatePeople(content, peopleContainer);
    this.populatePeople(this.getLastMessage(this._kind), peopleContainer);
  }

  handleFullResult = (people, peopleContainer) => {
    this._empty = false;
    this._block = false;
    const content = this.mapFields(people);
    this.populatePeople(content, peopleContainer);
    this.scrollEvent(peopleContainer);
  }

  fetchPeople = peopleContainer => {
    const outerThis = this;
    const url = this._query ? `${this._url}&page=${this._page}` : `${this._url}?page=${this._page}`;

    if(!this._block && !this._empty) {
      outerThis._empty = true;
      outerThis._block = true;
      setTimeout(() => {
        // fetch the likes
        outerThis.fetching(url, peopleContainer)
      }, 1000);
    }
  }

  populatePeople = (content, peopleContainer) => {
    // get the loader and remove it
    const loader = peopleContainer.querySelector('.loader-container');
    if (loader){
      loader.remove();
    }

    // insert the content
    peopleContainer.insertAdjacentHTML('beforeend', content);
  }
  
  scrollEvent = peopleContainer => {
    const outerThis = this;
    window.addEventListener('scroll', function () {
      let margin = document.body.clientHeight - window.innerHeight - 150;
      if (window.scrollY > margin && !outerThis._empty && !outerThis._block) {
        outerThis._page += 1;
        outerThis.populatePeople(outerThis.getLoader(), peopleContainer);
        outerThis.fetchPeople(peopleContainer);
      }
    });

    // Launch scroll event
    const scrollEvent = new Event('scroll');
    window.dispatchEvent(scrollEvent);
  }

  mapFields = data => {
    return data.map(user => {
      let bio = user.bio === null ? 'This user has not added a bio yet.' : user.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      return /*html*/`
				<user-wrapper hash="${user.hash}" you="${user.you}" url="/u/${user.hash}" stories="${user.stories}" replies="${user.replies}"
          picture="${user.picture}" verified="${user.verified}" name="${user.name}" followers="${user.followers}" contact='${user.contact ? JSON.stringify(user.contact) : null}'
          following="${user.following}" user-follow="${user.is_following}" bio="${bio}">
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
			case 'followers':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">The author has no followers yet!</h2>
						<p class="desc">
							The user has no followers yet. You can be the first to follow the author or you can always come back later to check for new followers.
						</p>
					</div>
				`
			case 'following':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">The user is not following anyone yet!</h2>
						<p class="desc">
							The user is not following anyone yet. You can always come back later to check.
						</p>
					</div>
				`
      case 'search':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">No user found!</h2>
						<p class="desc">
							The search keyword did not match any user, try searching using a different keyword.
						</p>
					</div>
				`
			default:
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">No data found!</h2>
						<p class="desc">
							No data found. You can always come back later to check for new data.
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
			case 'followers':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">No more followers.</h2>
						<p class="desc">
							You have reached the people who are following this user. You can always come back later to check for new followers.
						</p>
					</div>
				`
			case 'following':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">No more people.</h2>
						<p class="desc">
							You have reached the end of the people who this user is following. You can always come back later to check for new people.
						</p>
					</div>
				`
      case 'search':
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">The end of results</h2>
						<p class="desc">
							You have reached the end of the people who matched the query. You can try searching using different keyword.
						</p>
					</div>
				`
			default:
				return /*html*/`
					<div class="finish">
						<h2 class="finish__title">No more data.</h2>
						<p class="desc">
							You have reached the end of the data. You can always come back later to check for new data.
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