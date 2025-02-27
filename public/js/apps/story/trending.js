export default class TrendingStories extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this._url = this.getAttribute('url');
    this._limit = parseInt(this.getAttribute('limit', 10));
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  convertToBoolean = value => {
    return value === 'true';
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const contentContainer = this.shadowObj.querySelector('.stories');

    this.fetchStories(contentContainer);
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
          this.fetchStories(feedContainer);
        }, 1000);
      });
    }
  }

  fetchStories = async contentContainer => {
    const outerThis = this;
    const url = `${this._url}?limit=${this._limit}`;
    try {
      const data = await this.api.get(url, { content: 'json' });

      if (data.success) {
        if (data.stories.length === 0) {
          const content = outerThis.getEmpty();
          contentContainer.innerHTML = content;
          return;
        }

        const content = outerThis.mapFields(data.stories);
        contentContainer.innerHTML = content;
        outerThis.setLastItem(contentContainer);
      } else {
        const content = outerThis.getEmpty();
        contentContainer.innerHTML = content;
      }
    } catch (error) {
      console.error(error);
      contentContainer.innerHTML = outerThis.getWrongMessage();
      outerThis.activateRefresh();
    }
  }


  mapFields = data => {
    return data.map(story => {
      const author = story.author;
      let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const url = `/p/${story.hash.toLowerCase()}`;
      const images = story.images ? story.images.join(',') : ''; 
      return /*html*/`
        <trending-story story="story" hash="${story.hash}" url="${url}" images="${images}"
          topics="${story.topics.length === 0 ? 'story' : story.topics }" story-title="${story.title}" time="${story.createdAt}" replies-url="${url}/replies" 
          likes-url="${url}/likes" replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" likes="${story.likes}" 
          views="${story.views}" 
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-img="${author.picture}" author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" 
          author-followers="${author.followers}" author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" 
          author-bio="${bio}">
          ${story.content}
        </trending-story>
      `;
    }).join('');
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
    return /*html*/`
      ${this.getTitle()}
			<div class="stories new">
				${this.getLoader()}
      </div>
    `;
  }

  getTitle = () => {
    return /*html*/`
			<div class="title">
				<h2>Most read stories</h2>
			</div>
		`
  }

  getEmpty = () => {
    return /* html */`
    <div class="finish">
      <h2 class="title">Oops!</h2>
      <p class="desc">
        There are no stories available at the moment. Please check back later.
      </p>
      <button class="finish">Retry</button>
    </div>
    `
  }

  getWrongMessage = () => {
    return /* html */`
      <div class="finish">
        <h2 class="title">Oops!</h2>
        <p class="desc">
          An error occurred while fetching the stories. Please check your connection and try again.
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

        div.empty {
          width: 100%;
          padding: 15px 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          gap: 8px;
        }

        div.empty > p {
          width: 100%;
          padding: 15px 0;
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1rem;
          font-weight: 400;
        }

        div.stories {
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