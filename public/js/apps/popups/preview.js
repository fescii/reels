export default class PreviewPopup extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this._url = this.getAttribute('url');
    this._story = '';
    // let's create our shadow root
    this.shadowObj = this.attachShadow({mode: 'open'});
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.disableScroll();

    // Select the close button & overlay
    const overlay = this.shadowObj.querySelector('.overlay');
    const btns = this.shadowObj.querySelectorAll('.cancel-btn');
    const contentContainer = this.shadowObj.querySelector('div.preview');

    // Close the modal
    if (overlay && btns && contentContainer) {
      this.fetchPreview(contentContainer);
      this.closePopup(overlay, btns);
    }
  }

  fetchPreview = (contentContainer) => {
    const outerThis = this;
		const previewLoader = this.shadowObj.querySelector('.loader-container');
    setTimeout(async () => {
      try {
      const result = await this.api.get(this._url, { content: 'json' });

      // check for success response
      if (result.success) {
        if (result.reply) {
        const reply = result.reply;
        outerThis._story = outerThis.mapReply(reply);
        const replyContent = outerThis.populateReply(reply);
        // remove the loader
        previewLoader.remove();
        // insert the content
        contentContainer.insertAdjacentHTML('beforeend', replyContent);

        // open the story
        this.openStory();

        // open the read more
        this.openReadMore();
        // open the url
        this.openUrl();
        // style lastBlock
        this.styleLastBlock();
        } else if (result.story) {
        const story = result.story;
        outerThis._story = outerThis.mapStory(story);
        // remove the loader
        previewLoader.remove();

        // switch between the different kind of story
        if (story.kind === 'post') {
          const postContent = outerThis.populatePost(story);
          contentContainer.insertAdjacentHTML('beforeend', postContent);
        } else if (story.kind === 'poll') {
          const pollContent = outerThis.populatePoll(story);
          contentContainer.insertAdjacentHTML('beforeend', pollContent);
        } else if (story.kind === 'story') {
          const storyContent = outerThis.populateStory(story);
          contentContainer.insertAdjacentHTML('beforeend', storyContent);
        }

        this.openStory();

        // open the read more
        this.openReadMore();
        // open the url
        this.openUrl();
        // style lastBlock
        this.styleLastBlock();
        } else if (result.user) {
        const user = result.user;
        const bio = user.bio === null ? 'This user has not added a bio yet.' : user.bio;
        const userContent = outerThis.removeHtml(bio, user.name);
        outerThis._story = outerThis.mapUser(user);
        const content = outerThis.getUserContent(userContent, `/u/${user.hash.toLowerCase()}`, user.hash, user.followers, user.following);

        // remove the loader
        previewLoader.remove();

        // insert the content
        contentContainer.insertAdjacentHTML('beforeend', content);

        // open the story
        this.openStory();

        // open the read more
        this.openReadMore();
        // open the url
        this.openUrl();
        // style lastBlock
        this.styleLastBlock();
        } else if (result.topic) {
        const topic = result.topic;
        const topicContent = outerThis.removeHtml(topic.summary, topic.name);
        outerThis._story = outerThis.mapTopic(topic);
        const content = outerThis.getTopicContent(topicContent, `/t/${topic.hash.toLowerCase()}`, topic.author, topic.followers);

        // remove the loader
        previewLoader.remove();

        // insert the content
        contentContainer.insertAdjacentHTML('beforeend', content);

        // open the story
        this.openStory();

        // open the read more
        this.openReadMore();
        // open the url
        this.openUrl();
        // style lastBlock
        this.styleLastBlock();
        } else {
        // display error message
        const content = outerThis.getEmpty();
        previewLoader.remove();
        contentContainer.insertAdjacentHTML('beforeend', content);
        }
      } else {
        // display error message
        const content = outerThis.getEmpty();
        previewLoader.remove();
        contentContainer.insertAdjacentHTML('beforeend', content);
      }
      } catch (error) {
      // display error message
      const content = outerThis.getEmpty();
      previewLoader.remove();
      contentContainer.insertAdjacentHTML('beforeend', content);
      }
    }, 2000);
	}

  populateStory = story => {
    const author = story.author
    author.you = story.you
    author.time = story.createdAt
    const url = `/p/${story.hash.toLowerCase()}`
    const itemContent = this.getStory(story.content, story.title, story.images)
    return this.getContent(itemContent, url, story.author, story.views, story.likes);
  }

  populateReply = reply => {
    const author = reply.author;
    author.you = reply.you;
    author.time = reply.createdAt;
    const url = `/p/${reply.hash.toLowerCase()}`;
    const itemContent = this.getPost(reply.content, reply.images);
    return this.getContent(itemContent, url, reply.author, reply.views, reply.likes);
  }

  populatePost = story => {
    const author = story.author
    author.you = story.you
    author.time = story.createdAt
    const url = `/p/${story.hash.toLowerCase()}`
    const itemContent = this.getPost(story.content, story.images);
    return this.getContent(itemContent, url, story.author, story.views, story.likes);
  }

  populatePoll = story => {
    const author =story.author;
    author.you = story.you;
    author.time = story.createdAt;
    const poll = { 
      hash: story.hash,
      votes: story.votes,
      selected: story.option,
      end: story.end,
      voted: story.option ? 'true' : 'false',
      options: story.poll,
      content: story.content
    }
    const pollContent = this.getPoll(poll);
    const url =`/p/${story.hash.toLowerCase()}`;
    return this.getContent(pollContent, url, story.author, story.views, story.likes);
  }

  getPoll = poll =>  {
    const mql = window.matchMedia('(max-width: 660px)');
    // Remove html tags
    const contentStr = poll.content.replace(/<[^>]*>/g, '');
    const contentLength = contentStr.length;

    let chars = 250;

    // Check if its a mobile view
    if (mql.matches) {
      chars = 200;
    }

    // Check if content length is greater than :chars
    if (contentLength > chars) {
      return /*html*/`
        <div class="post extra ${chars <= 200 ? 'mobile' : ''}" id="post">
          ${poll.content}
          <div class="read-more">
            <span class="action">view more</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
          </div>
        </div>
        <votes-wrapper reload="false" votes="${poll.votes}" selected="${poll.selected}"
          hash="${poll.hash}"
          end-time="${poll.end}" voted="${poll.voted}" options="${poll.options}">
        </votes-wrapper>
      `
    }
    else {
      return /*html*/`
        <div class="post" id="post">
          ${poll.content}
        </div>
        <votes-wrapper reload="false" votes="${poll.votes}" selected="${poll.selected}"
          hash="${poll.hash}"
          end-time="${poll.end}" voted="${poll.voted}" options="${poll.options}">
        </votes-wrapper>
      `
    }
  }

  getStory = (text, title, images)=> {
    let str = this.getHTML();
    str = text.replace(/<[^>]*>/g, '');

    str = str.trim();
    const filteredTitle = title ? `<h3>${title}</h3>` : '';
    const content = `<p>${this.trimContent(str)}</p>`;

    return /*html*/`
      <div class="post" id="post">
        ${filteredTitle}
        ${content}
      </div>
      ${this.getImages(images)}
    `
  }

  removeHtml = (text, title)=> {
    let str = this.getHTML();
    str = text.replace(/<[^>]*>/g, '');
    

    str = str.trim();
    const filteredTitle = title ? `<h3>${title}</h3>` : '';
    const content = `<p>${this.trimContent(str)}</p>`;


    return `
      ${filteredTitle}
      ${content}
    `
  }

  trimContent = text => {
    // if text is less than 150 characters
    if (text.length <= 200) return text;

    // check for mobile view
    const mql = window.matchMedia('(max-width: 660px)');

    // Check if its a mobile view
    if (mql.matches) {
      // return text substring: 150 characters + ...
      return text.substring(0, 200) + '...';
    } else {
      // trim the text to 250 characters
      return text.substring(0, 300) + '...';
    }
  }

  getPost = (content, images) => {
    const mql = window.matchMedia('(max-width: 660px)');
    // Remove html tags
    const contentStr = content.replace(/<[^>]*>/g, '');
    const contentLength = contentStr.length;

    let chars = 250;

    // Check if its a mobile view
    if (mql.matches) {
      chars = 200;
    }

    // Check if content length is greater than: chars
    if (contentLength > chars) {
      return /*html*/`
        <div class="post extra ${chars <= 200 ? 'feed' : ''}" id="post">
          ${content}
          <div class="read-more">
            <span class="action">view more</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
          </div>
        </div>
        ${this.getImages(images)}
      `
    }
    else {
      return /*html*/`
        <div class="post" id="post">
          ${content}
        </div>
        ${this.getImages(images)}
      `
    }
  }

  getHTML = () => {
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body.innerHTML;
  }

  openReadMore = () => {
    // Get the read more button
    const readMore = this.shadowObj.querySelector('.post .read-more');

    // Get the content
    const content = this.shadowObj.querySelector('.post');

    // Check if the read more button exists
    if (readMore && content) {
      readMore.addEventListener('click', e => {
        // prevent the default action
        e.preventDefault()

        // prevent the propagation of the event
        e.stopPropagation();

        // Prevent event from reaching any immediate nodes.
        e.stopImmediatePropagation()

        // Toggle the active class
        content.classList.remove('extra');

        // remove the read more button
        readMore.remove();
      });
    }
  }

  openUrl = () => {
    // get all the links
    const links = this.shadowObj.querySelectorAll('div#post a');
    const body = document.querySelector('body');

    // loop through the links
    if (!links) return;

    links.forEach(link => {
      // add event listener to the link
      link.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        // get the url
        const url = link.getAttribute('href');

        // link pop up
        let linkPopUp = `<url-popup url="${url}"></url-popup>`

        // open the popup
        body.insertAdjacentHTML('beforeend', linkPopUp);
      });
    });
  }

  openStory = () => {
    // get current content
    const content = this.shadowObj.querySelector('.actions > .action#view-action');

    if(content) {
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        let url = content.getAttribute('href');

        // Get full post
        const post =  this._story;
  
        // push the post to the app
        this.pushApp(url, post);
      })
    }
  }

  pushApp = (url, content) => {
    this.app.push(url, { kind: "app", name: 'app', html: content }, url);
    // navigate to the content
    this.navigateTo(content);
  }

  navigateTo = content => {
    // navigate to the content
    this.app.navigate(content);
  }

  mapStory = story => {
    const author = story.author;
    const url = `/p/${story.hash.toLowerCase()}`;
    const images = story.images ? story.images.join(',') : '';
    if (story.kind === "post") {
      return /*html*/`
        <app-post story="quick" tab="replies" url="${url}" hash="${story.hash}" likes="${story.likes}" replies="${story.replies}" 
          replies-url="${url}/replies" likes-url="${url}/likes" images='${images}'
          views="${story.views}"  time="${story.createdAt}" liked="${story.liked ? 'true' : 'false'}" 
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
          author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
          author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
          author-bio="${author.bio === null ? 'This user has not added a bio yet.' : author.bio}">
          ${story.content}
        </app-post>
      `
    }
    else if (story.kind === "poll") {
      return /*html*/`
        <app-post story="poll" tab="replies" url="${url}" hash="${story.hash}" likes="${story.likes}"
          replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" time="${story.createdAt}"
          replies-url="${url}/replies" likes-url="${url}/likes" options='${story.poll}' voted="${story.option ? 'true' : 'false'}" 
          selected="${story.option}" end-time="${story.end}" votes="${story.votes}" 
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-img="${author.picture}" 
          author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
          author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}' 
          author-bio="${author.bio === null ? 'This user has not added a bio yet.' : author.bio}">
          ${story.content}
        </app-post>
      `
    }
    else if (story.kind === "story") {
      return /*html*/`
        <app-story story="story" hash="${story.hash}" url="${url}" tab="replies" topics="${story.topics.length === 0 ? 'story' : story.topics}" 
          story-title="${story.title}" time="${story.createdAt}" replies-url="${url}/replies" images='${images}'
          likes-url="${url}/likes" likes="${story.likes}" replies="${story.replies}" liked="${story.liked ? 'true' : 'false'}" views="${story.views}" 
          author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}" slug="${story.slug}"
          author-hash="${author.hash}" author-you="${story.you ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}' 
          author-img="${author.picture}" author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" 
          author-followers="${author.followers}" author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" 
          author-bio="${author.bio === null ? 'This user has not added a bio yet.' : author.bio}">
          ${story.content}
        </app-story>
      `
    }
  }

  mapReply = reply => {
    const author = reply.author;
    return /*html*/`
      <app-post story="reply" tab="replies" hash="${reply.hash}" url="/p/${reply.hash.toLowerCase()}" likes="${reply.likes}" liked="${reply.liked}"
        replies="${reply.replies}" views="${reply.views}" time="${reply.createdAt}" replies-url="/p/${reply.hash}/replies" 
        parent="${reply.story ? reply.story : reply.reply}" preview="full" likes-url="/p/${reply.hash}/likes" 
        author-url="/u/${author.hash}" author-hash="${author.hash}" author-you="${reply.you}" author-stories="${author.stories}" 
        author-replies="${author.replies}" author-img="${author.picture}" author-verified="${author.verified}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
        author-name="${author.name}" author-followers="${author.followers}" author-following="${author.following}" 
        author-follow="${author.is_following}" author-bio="${author.bio === null ? 'The author has no bio yet!' : author.bio}">
        ${reply.content}
      </app-post>
    `
  }

  mapUser = user => {
    const url = `/u/${user.hash.toLowerCase()}`;
    return /*html*/`
			<app-profile tab="stories" hash="${user.hash}" you="${user.you}" url="${url}" stories="${user.stories}" replies="${user.replies}"
        picture="${user.picture}" verified="${user.verified}" name="${user.name}" followers="${user.followers}" contact='${user.contact ? JSON.stringify(user.contact) : null}'
        following="${user.following}" user-follow="${user.is_following}" bio="${user.bio === null ? 'The author has no bio yet!': user.bio }"
        followers-url="${url}/followers" following-url="${url}/following"
        stories-url="${url}/stories" replies-url="${url}/replies">
			</app-profile>
    `
  }

  mapTopic = topic => {
    const author = topic.topic_author;
    const url = `/t/${topic.hash.toLowerCase()}`;
    return /*html*/`
      <topic-wrapper hash="${topic.hash}" name="${topic.name}" slug="${topic.slug}"
        topic-follow="${topic.is_following}" subscribed="${topic.is_subscribed}" url="${url}" views="${topic.views}"
        subscribers="${topic.subscribers}" followers="${topic.followers}" stories="${topic.stories}"
        author-hash="${author.hash}" author-you="${topic.you}" author-url="/u/${author.hash}"
        author-img="${author.picture}" author-verified="${author.verified}" author-name="${author.name}" author-followers="${author.followers}"
        author-following="${author.following}" author-follow="${author.is_following}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
        author-bio="${author.bio === null ? 'The has not added their bio yet' : author.bio}">
        ${this.topicContent(topic.summary)}
      </topic-wrapper>
    `
  }

  // style the last paragraph or the last block element in content
  styleLastBlock = () => {
    const content = this.shadowObj.querySelector('.post#post');
    if (!content) return;

    const lastBlock = content.lastElementChild;
    if (!lastBlock) return;

    // style the last block
    lastBlock.style.setProperty('padding', '0 0 0');
    lastBlock.style.setProperty('margin', '0 0 0');
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

  disconnectedCallback() {
    this.enableScroll()
  }

  disableScroll() {
    // Get the current page scroll position
    let scrollTop = window.scrollY || document.documentElement.scrollTop;
    let scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    document.body.classList.add("stop-scrolling");

    // if any scroll is attempted, set this to the previous value
    window.onscroll = function() {
      window.scrollTo(scrollLeft, scrollTop);
    };
  }

  enableScroll() {
    document.body.classList.remove("stop-scrolling");
    window.onscroll = function() {};
  }

  // close the modal
  closePopup = (overlay, btns) => {
    overlay.addEventListener('click', e => {
      e.preventDefault();
      this.remove();
    });

    btns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.remove();
      });
    })
  }

  getTemplate() {
    // Show HTML Here
    return /*html*/`
      <div class="overlay"></div>
      <section id="content" class="content">
        ${this.getWelcome()}
      </section>
    ${this.getStyles()}`
  }

  getWelcome() {
    return /*html*/`
      <div class="welcome">
        <div class="preview">
				  ${this.getLoader()}
        </div>
			</div>
    `
  }

  getContent = (content, url, hash, views, likes) => {
    return /*html*/`
      ${content}
      <span class="meta">
        <span class="by">by</span>
        <span class="hash">${hash}</span>
      </span>
      ${this.getActions(likes, views, url)}
    `
  }

  getUserContent = (content, url, hash, followers, following) => {
    return /*html*/`
      ${content}
      <span class="meta">
        <span class="by">@</span>
        <span class="hash">${hash}</span>
      </span>
      ${this.getUserActions(followers, following, url)}
    `
  }

  getTopicContent = (content, url, hash, followers) => {
    return /*html*/`
      ${content}
      <span class="meta">
        <span class="by">by</span>
        <span class="hash">${hash}</span>
      </span>
      ${this.getTopicActions(followers, url)}
    `
  }

  getActions = (likes, views, url) => {
    return /*html*/`
      <div class="actions">
        <a href="${url}" class="action view" id="view-action">view</a>
        <span class="action likes plain">
          <span class="no">${this.formatNumber(likes)}</span> <span class="text">likes</span>
        </span>
        <span class="action views plain">
          <span class="no">${this.formatNumber(views)}</span> <span class="text">views</span>
        </span>
      </div>
    `
  }

  getUserActions = (followers, following, url) => {
    return /*html*/`
      <div class="actions">
        <a href="${url}" class="action view" id="view-action">view</a>
        <span class="action likes plain">
          <span class="no">${this.formatNumber(followers)}</span> <span class="text">followers</span>
        </span>
        <span class="action views plain">
          <span class="no">${this.formatNumber(following)}</span> <span class="text">following</span>
        </span>
      </div>
    `
  }

  getTopicActions = (followers, url) => {
    return /*html*/`
      <div class="actions">
        <a href="${url}" class="action view" id="view-action">view</a>
        <span class="action likes plain">
          <span class="no">${this.formatNumber(followers)}</span> <span class="text">followers</span>
        </span>
      </div>
    `
  }

  getEmpty = () => {
    return /* html */`
      <div class="empty">
        <p>There was an error fetching the preview.</p>
        <p>Try refreshing the page or check your internet connection. If the problem persists, please contact support.</p>
      </div>
    `
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

  getImages = imageArray => {
    // if length is greater is less than 1
    if(!imageArray || imageArray.length < 1) return '';

    // return
    return /* html */`
      <images-wrapper images="${imageArray.join(',')}"></images-wrapper>
    `
  }

  getStyles() {
    return /*css*/`
      <style>
        * {
          box-sizing: border-box !important;
        }

        :host{
          border: none;
          padding: 0;
          justify-self: end;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 100;
          width: 100%;
          min-width: 100vw;
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          left: 0;
        }

        div.overlay {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background-color: var(--modal-background);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
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

        #content {
          z-index: 1;
          background-color: var(--background);
          padding: 20px 10px;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: 700px;
          max-height: 90%;
          height: max-content;
          border-radius: 25px;
          position: relative;
        }

        .preview {
          width: 100%;
          display: flex;
          flex-flow: column;
          color: var(--text-color);
          line-height: 1.4;
          gap: 4px;
          margin: 0;
          padding: 0;
        }

        .preview p,
        .preview h3 {
          margin: 0;
          line-height: 1.2;
        }

        .preview h3 {
          margin: 0 0 5px 0;
        }

        .meta {
          height: max-content;
          display: flex;
          position: relative;
          color: var(--gray-color);
          align-items: center;
          font-family: var(--font-mono),monospace;
          gap: 5px;
          font-size: 0.9rem;
          line-height: 1.5;
        }

        .meta > span.sp {
          margin: 1px 0 0 0;
        }

        .meta > span.by {
          font-weight: 500;
          font-size: 0.93rem;
          margin: 0 0 1px 1px;
        }

        .meta > span.hash {
          background: var(--action-linear);
          font-family: var(--font-mono), monospace;
          font-size: 0.9rem;
          line-height: 1;
          color: transparent;
          font-weight: 600;
          background-clip: text;
          -webkit-background-clip: text;
          -moz-background-clip: text;
        }

        .meta > time.time {
          font-family: var(--font-text), sans-serif;
          font-size: 0.83rem;
          font-weight: 500;
          margin: 1px 0 0 0;
        }

        .preview > p {
          margin: 0 0 5px 0;
          padding: 0;
          line-height: 1.4;
          font-family: var(--font-text), sans-serif;
        }

        .welcome {
          width: 98%;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          row-gap: 0;
        }

        .welcome > h2 {
          width: 100%;
          font-size: 1.35rem;
          font-weight: 600;
          margin: 0 0 10px;
          padding: 10px 10px;
          background-color: var(--gray-background);
          text-align: center;
          border-radius: 12px;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
          font-weight: 500;
          position: relative;
        }

        .welcome > h2 > span.control {
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-flow: column;
          gap: 0px;
          justify-content: center;
          position: absolute;
          top: 50%;
          left: 10px;
          transform: translateY(-50%);
        }

        .welcome > h2 > span.control svg {
          width: 20px;
          height: 20px;
          color: var(--text-color);
        }

        .welcome > h2 > span.control svg:hover{
          color: var(--error-color);
        }

        .post {
          width: 100%;
          display: flex;
          cursor: pointer;
          flex-flow: column;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          line-height: 1.4;
          gap: 0;
          margin: 0;
          padding: 0;
        }

        .post.extra {
          max-height: 200px;
          overflow: hidden;
          position: relative;
        }

        .post.extra.mobile {
          max-height: 120px;
        }

        .post.extra.feed {
          max-height: 150px;
        }

        .post.extra .read-more {
          position: absolute;
          bottom: -5px;
          right: 0;
          left: 0;
          width: 100%;
          padding: 5px 0;
          display: flex;
          align-items: end;
          justify-content: center;
          min-height: 80px;
          gap: 3px;
          cursor: pointer;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
          color: var(--gray-color);
          background: var(--fade-linear-gradient);
        }

        .post.extra .read-more svg {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin: 0 0 2px 0;
        }

        .post h6,
        .post h5,
        .post h4,
        .post h3,
        .post h1 {
          padding: 0;
          font-size: 1.3rem !important;
          color: var(--title-color);
          font-weight: 500;
          line-height: 1.5;
          margin: 5px 0;
        }

        .post p {
          font-size: 1rem;
          margin: 0 0 5px 0;
          line-height: 1.4;
        }

        .post a {
          text-decoration: none;
          cursor: pointer;
          color: var(--anchor-color) !important;
        }

        .post a:hover {
          text-decoration: underline;
        }

        .post blockquote {
          margin: 0;
          padding: 0 0 5px;
          font-style: italic;
          background: var(--background);
          color: var(--text-color);
          font-weight: 400;
          line-height: 1.4;
        }

        .post blockquote p {
          margin: 0;
        }

        .post blockquote * {
          margin: 0;
        }

        .post hr {
          border: none;
          background-color: var(--text-color);
          height: 1px;
          margin: 10px 0;
        }

        .post code {
          background: var(--gray-background);
          padding: 0 5px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          border-radius: 5px;
        }

        .post b,
        .post strong {
          font-weight: 700;
          line-height: 1.4;

        }

        .post ul,
        .post ol {
          margin: 0 0 15px 20px;
          padding: 0 0 0 15px;
          color: inherit;
          line-height: 1.4;
        }

        .post ul li,
        .post ol li {
          margin: 6px 0;
          padding: 0;
          color: inherit;
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
        
        .actions {
          display: flex;
          font-family: var(--font-main), sans-serif;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 20px;
          margin: 10px 0 0;
        }
        
        .actions > .action {
          background: var(--gray-background);
          text-decoration: none;
          color: var(--text-color);
          font-size: 0.95rem;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: lowercase;
          justify-content: center;
          padding: 3px 15px 4px;
          border-radius: 12px;
          -webkit-border-radius: 12px;
          -moz-border-radius: 12px;
        }

        .actions > .action.plain {
          padding: 0;
          font-size: 1rem;
          pointer-events: none;
          font-family: var(--font-text), sans-serif;
          color: var(--gray-color);
          border: none;
          background: none;
        }
        
        .actions > .action.plain > span.no {
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-color);
        }

        .actions > .action.plain > span.text {
          display: inline-block;
          padding: 0 0 0 3px;
        }
        
        @media screen and ( max-width: 850px ){
          #content {
            width: 90%;
          }
        }

        @media screen and ( max-width: 600px ){
          :host {
            border: none;
            background-color: var(--modal-background);
            padding: 0px;
            justify-self: end;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: end;
            gap: 10px;
            z-index: 20;
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            left: 0;
          }

          #content {
            box-sizing: border-box !important;
            padding: 10px 0 10px;
            margin: 0;
            width: 100%;
            max-width: 100%;
            max-height: 100%;
            min-height: max-content;
            border-radius: 0px;
            border-top: var(--border);
            border-top-right-radius: 15px;
            border-top-left-radius: 15px;
          }

          .welcome {
            width: 100%;
            padding: 0 15px 20px;
            display: flex;
            flex-flow: column;
          }

          .welcome > h2 {
            width: 100%;
            font-size: 1.2rem;
            margin: 0 0 10px;
            padding: 10px 10px;
            background-color: var(--gray-background);
            border-radius: 12px;
          }

          .welcome > .actions {
            width: 100%;
          }

          .welcome > .actions .action {
            background: var(--stage-no-linear);
            text-decoration: none;
            padding: 7px 20px 8px;
            cursor: default;
            margin: 10px 0;
            width: 120px;
            cursor: default !important;
            border-radius: 12px;
          }

          button.fetch,
          .content.extra .read-more,
          .actions > .action.close,
          a {
            cursor: default !important;
          }

          .welcome > h2 > span.control,
          .welcome > .actions > .action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}