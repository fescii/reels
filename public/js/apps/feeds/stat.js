export default class StatFeed extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this._kind = this.getAttribute('kind');

    this._block = false;
    this._empty = false;
    this._page = this.parseToNumber(this.getAttribute('page'));
    this._url = this.getAttribute('api');
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const contentContainer = this.shadowObj.querySelector('.activities');

    this.fetchFeeds(contentContainer);

    // watch event 
    setTimeout(() => {
      this.scrollEvent(contentContainer);
    }, 3000);
  }

  activateRefresh = () => {
    const outerThis = this;
    const finish = this.shadowObj.querySelector('.finish');
    if (finish) {
      const btn = finish.querySelector('button.finish');
      btn.addEventListener('click', () => {
        // unblock the fetching
        outerThis._block = false;
        outerThis._empty = false;
        
        // re fetch the content
        const feedContainer = outerThis.shadowObj.querySelector('.activities');

        // select finish
        const finishContainer =  feedContainer.querySelector('div.finish');

        if (finishContainer) {
          finishContainer.remove()
        }

        // set the loader
        feedContainer.insertAdjacentHTML('beforeend', outerThis.getLoader())

        setTimeout(() => {
          outerThis.fetchFeeds(feedContainer)
        }, 1000);
      });
    }
  }

  fetching = async (url, feedContainer) => {
    const outerThis = this;

    try {
      const data = await this.api.get(url, { content: 'json' })

      if (!data.success) {
        outerThis._empty = true;
        outerThis._block = true;
        outerThis.populateFeeds(outerThis.getWrongMessage(), feedContainer);
        outerThis.activateRefresh();
        return;
      }

      if (data.stories) {
        if (data.stories.length === 0 && outerThis._page === 1) {
          outerThis._empty = true;
          outerThis._block = true;
          outerThis.populateFeeds(outerThis.getEmptyMsg(), feedContainer);
        } else if (data.stories.length < 10) {
          outerThis._empty = true;
          outerThis._block = true;
          const content = outerThis.mapStories(data.stories);
          outerThis.populateFeeds(content, feedContainer);
          outerThis.populateFeeds(outerThis.getLastMessage(), feedContainer)
        }
        else {
          outerThis._empty = false;
          outerThis._block = false;
          const content = outerThis.mapStories(data.stories);
          outerThis.populateFeeds(content, feedContainer);
        }
      }
      else if (data.replies) {
        if (data.replies.length === 0 && outerThis._page === 1) {
          outerThis._empty = true;
          outerThis._block = true;
          outerThis.populateFeeds(outerThis.getEmptyMsg(), feedContainer);
        } else if (data.replies.length < 10) {
          outerThis._empty = true;
          outerThis._block = true;
          const content = outerThis.mapReplies(data.replies);
          outerThis.populateFeeds(content, feedContainer);
          outerThis.populateFeeds(outerThis.getLastMessage(), feedContainer)
        }
        else {
          outerThis._empty = false;
          outerThis._block = false;
          const content = outerThis.mapReplies(data.replies);
          outerThis.populateFeeds(content, feedContainer);
        }
      } else {
        throw new Error("Stories or replies are not defined!");
      }
    } catch (error) {
      // console.log(error)
      outerThis._empty = true;
      outerThis._block = true;
      outerThis.populateFeeds(outerThis.getWrongMessage(), feedContainer);
      outerThis.activateRefresh();
    }
  }

  fetchFeeds = feedContainer => {
    const outerThis = this;
    const url = `${this._url}?page=${this._page}`;

    if (!this._block && !this._empty) {
      outerThis._empty = true;
      outerThis._block = true;
      setTimeout(() => {
        // fetch the stories
        outerThis.fetching(url, feedContainer)
      }, 2000);
    }
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
    window.addEventListener('scroll', function () {
      let margin = document.body.clientHeight - window.innerHeight - 150;
      if (window.scrollY > margin && !outerThis._empty && !outerThis._block) {
        outerThis._page += 1;
        outerThis.populateFeeds(outerThis.getLoader(), feedContainer);
        outerThis.fetchFeeds(feedContainer);
      }
    });

    // Launch scroll event
    const scrollEvent = new Event('scroll');
    window.dispatchEvent(scrollEvent);
  }

  mapStories= stories => {
    return stories.map(story => {
      const author = story.story_author;
      let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const url = `/p/${story.hash.toLowerCase()}`;
      const vote = story.kind === "poll" ? `
        voted="${story.option ? 'true' : 'false'}" selected="${story.option}" end-time="${story.end}" 
        options='${story.poll}' votes="${story.votes}" 
      ` : '';
      const images = story.images ? story.images.join(',') : null;
      return /*html*/`
        <stat-story kind="${story.kind}" url="${url}" hash="${story.hash}" likes="${story.likes}" images='${images}'
          replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" time="${story.createdAt}" 
          replies-url="${url}/replies" likes-url="${url}/likes" story-title="${story.title}"
          topics="${story.topics.length === 0 ? 'story' : story.topics}" ${vote} author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
          author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
          author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" 
          author-bio="${bio}">
          ${story.content}
        </stat-story>
      `
    }).join('');
  }

  mapReplies = replies => {
    return replies.map(reply => {
      const author = reply.reply_author;
      let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const images = reply.images ? reply.images.join(',') : null;
      return /*html*/`
        <stat-reply kind="reply" hash="${reply.hash}" url="/r/${reply.hash.toLowerCase()}" likes="${reply.likes}" replies="${reply.replies}" liked="${reply.liked}"
          views="${reply.views}" time="${reply.createdAt}" replies-url="/r/${reply.hash}/replies" likes-url="/r/${reply.hash}/likes"
          author-hash="${author.hash}" author-you="${reply.you}" author-url="/u/${author.hash}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-stories="${author.stories}" author-replies="${author.replies}" parent="${reply.story ? reply.story : reply.reply}" images='${images}'
          author-img="${author.picture}" author-verified="${author.verified}" author-name="${author.name}" author-followers="${author.followers}"
          author-following="${author.following}" author-follow="${author.is_following}" author-bio="${bio}">
          ${reply.content}
        </stat-reply>
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
        <div class="loader"></div>
      </div>
    `
  }

  getBody = () => {
    // language=HTML
    return `
			<div class="activities">
				${this.getLoader()}
      </div>
    `;
  }

  getEmptyMsg = () => {
    // get the next attribute
    return /*html*/`
      <div class="finish">
        <h2 class="finish__title">You have not created any ${this._kind} yet!</h2>
        <p class="desc">
         You can always create a new ${this._kind}, check homepage for more details.
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
          That's it, you have reached the end of your ${this._kind}.
        </p>
      </div>
    `
  }

  getWrongMessage = () => {
    // get the next attribute
    return /*html*/`
      <div class="finish">
        <h2 class="finish__title">Something went wrong!</h2>
        <p class="desc">
         An error occurred while fetching your stats feed. Please check your connection and try again.
        </p>
        <button class="finish">Retry</button>
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
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 5px 0 10px;
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

        .activities {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          width: 100%;
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
          a,
          div.finish > button.finish {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}