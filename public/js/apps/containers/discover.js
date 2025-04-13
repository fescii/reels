export default class DiscoverPeople extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.url = this.getAttribute('url');
    // add limit query in the url
    this.url = `${this.url}?limit=20`;
    this.app = window.app;
    this.api = this.app.api;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.all = this.getRootNode().host;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // get mql
    const mql = window.matchMedia('(min-width: 700px)');

    const contentContainer = this.shadowObj.querySelector('.people-list');

    this.fetchPeople(contentContainer, mql.matches);
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
        const feedContainer = this.shadowObj.querySelector('.people-list');

        // set the loader
        feedContainer.innerHTML = this.getLoader();

        setTimeout(() => {
          this.fetchPeople(feedContainer);
        }, 1000);
      });
    }
  }

  dispatchComponentLoaded = () => {
    // Dispatch a custom event that parent components can listen for
    const event = new CustomEvent('component-loaded', {
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  fetchPeople = async (contentContainer, mql) => {
    const peopleLoader = this.shadowObj.querySelector('authors-loader');

    try {
      const result = await this.api.get(this.url, { content: 'json' }, { allow: true, duration: 7200 });
      const people = result.people;

      if (result.success) {
        if (people.length === 0) {
          peopleLoader.remove();
          contentContainer.insertAdjacentHTML('beforeend', this.getEmpty());
          // Mark as loaded even when empty, since it's a valid state
          this.setAttribute('data-loaded', 'true');
          return;
        }

        peopleLoader.remove();
        contentContainer.insertAdjacentHTML('beforebegin', this.getTitle());
        contentContainer.insertAdjacentHTML('beforeend', this.mapUsers(people));

        if (mql) {
          this.activateControls(contentContainer);
        }
        
        // Mark as loaded on successful data fetch
        this.setAttribute('data-loaded', 'true');
      } else {
        peopleLoader.remove();
        contentContainer.insertAdjacentHTML('beforeend', this.getEmpty());
        // Don't mark as loaded on non-success - parent will continue polling
      }
    } catch (error) {
      console.log(error)
      peopleLoader.remove();
      contentContainer.insertAdjacentHTML('beforeend', this.getWrongMessage());
      this.activateRefresh();
      
      // Don't mark as loaded on error - parent will continue polling
    }
  }

  activateControls = contentContainer => {
    const leftControl = this.shadowObj.querySelector('.control.left');
    const rightControl = this.shadowObj.querySelector('.control.right');

    if (leftControl && rightControl) {
      leftControl.addEventListener('click', () => {
        contentContainer.scrollTo({
          left: contentContainer.scrollLeft - 300,
          behavior: 'smooth'
        });
      });

      rightControl.addEventListener('click', () => {
        contentContainer.scrollTo({
          left: contentContainer.scrollLeft + 300,
          behavior: 'smooth'
        });
      });
    }
  }

  mapUsers = data => {
    return data.map(user => {
      let bio = user.bio === null ? 'This user has not added a bio yet.' : user.bio;
      
      // create a paragraph with the \n replaced with <br> if there are more than one \n back to back replace them with one <br>
      if (bio.includes('\n')) bio = bio.replace(/\n+/g, '<br>');
      return /*html*/`
				<person-wrapper hash="${user.hash}" you="${user.you}" url="/u/${user.hash}" stories="${user.stories}" replies="${user.replies}" posts="${user.posts}"
          picture="${user.picture}" verified="${user.verified}" name="${user.name}" followers="${user.followers}" contact='${user.contact ? JSON.stringify(user.contact) : null}'
          following="${user.following}" user-follow="${user.is_following}">
          ${bio}
				</person-wrapper>
      `
    }).join('');
  }

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      <link rel="stylesheet" href="/static/css/app/home/people.css">
    `;
  }

  getLoader = () => {
    return `
			<authors-loader speed="300"></authors-loader>
		`
  }

  getBody = () => {
    // get mql
    const mql = window.matchMedia('(min-width: 660px)');
    // language=HTML
    return `
			<div class="people-list">
				${this.getLoader()}
				${this.getControls(mql.matches)}
			</div>
    `;
  }

  getControls = mql => {
    // Check if mql is desktop
    if (mql) {
      return /*html*/`
				<div class="left control">
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
							<path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z"></path>
						</svg>
					</span>
				</div>
				<div class="right control">
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
							<path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06Z"></path>
						</svg>
					</span>
				</div>
			`
    }
    else return '';
  }

  getTitle = () => {
    return /*html*/`
			<div class="title">
				<h2>Discover people</h2>
			</div>
		`
  }

  getEmpty = () => {
    return /* html */`
      <div class="empty">
        <p>No authors recommendation found at the moment.</p>
      </div>
    `
  }

  getWrongMessage = () => {
    return /* html */`
      <div class="finish">
        <h2 class="finish__title">Oops!</h2>
        <p class="desc">
          An error occurred while fetching the recommended authors. Please check your connection and try again.
        </p>
        <button class="finish">Retry</button>
      </div>
    `;
  }
}