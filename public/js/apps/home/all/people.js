export default class HomePeople extends HTMLElement {
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

  fetchPeople = async (contentContainer, mql) => {
    const peopleLoader = this.shadowObj.querySelector('authors-loader');

    try {
      const result = await this.api.get(this.url, { content: 'json' }, { allow: true, duration: 7200 });
      const data = result.data;

      if (result.success) {
        if (data.people.length === 0) {
          peopleLoader.remove();
          contentContainer.insertAdjacentHTML('beforeend', this.getEmpty());
          return;
        }

        peopleLoader.remove();
        contentContainer.insertAdjacentHTML('beforebegin', this.getTitle());
        contentContainer.insertAdjacentHTML('beforeend', this.mapUsers(data.people));

        if (mql) {
          this.activateControls(contentContainer);
        }

        this.all.home = {
          last: false,
          next: 4,
          loaded: true
        };
      } else {
        peopleLoader.remove();
        contentContainer.insertAdjacentHTML('beforeend', this.getEmpty());
      }
    } catch (error) {
      console.log(error)
      peopleLoader.remove();
      contentContainer.insertAdjacentHTML('beforeend', this.getWrongMessage());
      this.activateRefresh();
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
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      return /*html*/`
				<person-wrapper hash="${user.hash}" you="${user.you}" url="/u/${user.hash}" stories="${user.stories}" replies="${user.replies}" posts="${user.posts}"
          picture="${user.picture}" verified="${user.verified}" name="${user.name}" followers="${user.followers}" contact='${user.contact ? JSON.stringify(user.contact) : null}'
          following="${user.following}" user-follow="${user.is_following}" bio="${bio}">
				</person-wrapper>
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
				  background-color: var(--background);
					border-bottom: var(--border);
				  padding: 15px 0;
					position: relative;
				  display: flex;
				  flex-flow: column;
				  gap: 15px;
          width: 100%;
          max-width: 100%;
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

				.people-list {
					background-color: var(--background);
					display: flex;
					flex-flow: row;
					padding: 0;
					gap: 20px;
					width: 100%;
          max-width: 100%;
					overflow-x: scroll;
					-ms-overflow-style: none;
					scrollbar-width: none;
				}

				.people-list::-webkit-scrollbar {
					display: none !important;
					visibility: hidden;
					-webkit-appearance: none;
				}

				.control {
					position: absolute;
					z-index: 3;
					opacity: 0;
					top: 20%;
					left: 0;
					width: 40px;
					height: 80%;
					pointer-events: none;
					display: flex;
					align-items: center;
					justify-content: center;
					background: var(--controls-gradient-left);
					transition: all 0.3s ease-in-out;
				}

				.control.right {
					left: unset;
					right: 0;
					background: var(--controls-gradient-right);
				}

				.people-list:hover .control {
					opacity: 1;
					pointer-events: all;
				}

				.control > span {
					cursor: pointer;
					display: flex;
					align-items: center;
					justify-content: center;
					background: var(--accent-linear);
					color: var(--white-color);
					border-radius: 50%;
					width: 30px;
					height: 30px;
					transition: background-color 0.3s;
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

        div.finish > h2.finish__title {
          margin: 10px 0 0 0;
          font-size: 1.25rem;
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
					:host {
        		font-size: 16px;
						padding: 15px 0 10px;
						border-bottom: none;
					}

					a {
						cursor: default !important;
					}

					div.finish > button.finish {
            cursor: default !important;
          }
				}
	    </style>
    `;
  }
}