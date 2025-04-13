export default class HomeStories extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.app = window.app;
    this.api = this.app.api;
    this.url = this.getAttribute('url');
    this.mql = window.matchMedia('(max-width: 7000px)');
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.all = this.getRootNode().host;
    this.render();
  }

  convertToBoolean = value => {
    return value === 'true';
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // re fetch the content
    const feedContainer = this.shadowObj.querySelector('.stories');
    this.fetchStories(feedContainer);
  }

  activateRefresh = () => {
    const finish = this.shadowObj.querySelector('.finish');
    if (finish) {
      const btn = finish.querySelector('button.finish');
      btn.addEventListener('click', () => {
        // unblock the fetching
        this._block = false;
        this._empty = false;
        const feedContainer = this.shadowObj.querySelector('.stories');

        // set the loader
        feedContainer.innerHTML = this.getLoader();

        setTimeout(() => {
          this.fetchStories(feedContainer);
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

  fetchStories = async contentContainer => {
    const outerThis = this;

    try {
      const data = await this.api.get(this.url, { content: 'json' });

      // if data.success is false, display error message
      if (!data.success) {
        // display error message
        contentContainer.innerHTML = outerThis.getWrongMessage();

        // activate the refresh button
        outerThis.activateRefresh();
        
        // Notify that component has loaded even with error
        this.dispatchComponentLoaded();
        return;
      }


      // check for success response
      if(data.stories.length === 0) {
        // display empty message
        const content = outerThis.getEmpty();
        contentContainer.innerHTML = content;
        
        // Notify that component has loaded with empty content
        this.dispatchComponentLoaded();
        return;
      }

      // update the content
      const content = outerThis.mapFields(data.stories);
      contentContainer.innerHTML = content;
      // set the last item border-bottom to none
      outerThis.setLastItem(contentContainer);

      // Notify that component has successfully loaded
      this.dispatchComponentLoaded();
    } catch (error) {
      console.log(error)
      // display error message
      contentContainer.innerHTML = outerThis.getWrongMessage();

      // activate the refresh button
      outerThis.activateRefresh();
      
      // Notify that component has loaded even with error
      this.dispatchComponentLoaded();
    };
	}

  mapFields = data => {
    return data.map(story => {
      const author = story.author;
      let bio = author.bio === null ? 'This user has not added a bio yet.' : author.bio;
      // replace all " and ' with &quot; and &apos; to avoid breaking the html
      bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
      const url = `/p/${story.hash.toLowerCase()}`;
      const images = story.images ? story.images.join(',') : ''; 
      if (story.kind === "post") {
        return /*html*/`
          <post-wrapper story="quick" url="${url}" hash="${story.hash}" likes="${story.likes}" 
            replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" time="${story.createdAt}" 
            replies-url="${url}/replies" likes-url="${url}/likes" images="${images}"
            author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
            author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
            author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
            author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}' 
            author-bio="${bio}">
            ${story.content}
          </post-wrapper>
        `
      }
      else if(story.kind === "poll") {
        return /*html*/`
          <poll-post story="poll" url="${url}" hash="${story.hash}" likes="${story.likes}" images="${images}"
            replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" time="${story.createdAt}" 
            voted="${story.option ? 'true' : 'false'}" selected="${story.option}" end-time="${story.end}" replies-url="${url}/replies" 
            likes-url="${url}/likes" options='${story.poll}' votes="${story.votes}" 
            author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
            author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
            author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
            author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
            author-bio="${bio}">
            ${story.content}
          </poll-post>
        `
      }
      else if (story.kind === "story") {
        return /*html*/`
          <story-post story="story" hash="${story.hash}" url="${url}" images="${images}"
            topics="${story.topics.length === 0 ? 'story' : story.topics }" story-title="${story.title}" time="${story.createdAt}" replies-url="${url}/replies" 
            likes-url="${url}/likes" replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" likes="${story.likes}" 
            views="${story.views}" slug="${story.slug}"
            author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
            author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
            author-img="${author.picture}" author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" 
            author-followers="${author.followers}" author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" 
            author-bio="${bio}">
            ${story.content}
          </story-post>
        `
      }
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
      <link rel="stylesheet" href="/static/css/app/home/stories.css">
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
			<div class="stories new">
				${this.getLoader()}
      </div>
    `;
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
}