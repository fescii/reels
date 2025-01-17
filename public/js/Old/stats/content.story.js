export default class ContentStory extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  // observe the attributes
  static get observedAttributes() {
    return ['reload', 'images'];
  }

  // listen for changes in the attributes
  attributeChangedCallback(name, oldValue, newValue) {
    // check if old value is not equal to new value
    if (name === 'reload') {
      this.render();
    } else if (name === 'images') {
      this.addOrEditImages(newValue);
    }
  }

  addOrEditImages = images => {
    const imageWrapper = this.shadowObj.querySelector('images-wrapper');
    const content = this.shadowObj.querySelector('.content');
    // if images is null , empty or is 'null': remove the images
    if (!images || images === 'null' || images === '') {
      if (imageWrapper) imageWrapper.remove();
      return;
    }

    // if images is not null, empty or is not 'null': add the images
    if (!imageWrapper && content) {
      content.insertAdjacentHTML('afterend', `<images-wrapper images="${images}"></images-wrapper>`);
    } else {
      imageWrapper.setAttribute('images', images);
    }
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
    // open post 
    this.openPost();

    // activate edit button
    this.activateEditButton();

    // style last block
    this.styleLastBlock();

    // open read more
    this.openReadMore();

    // open url
    this.openUrl();
  }

  connectedCallback() {
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

  openPost = () => {
    // get url
    let url = this.getAttribute('url');

    url = url.trim().toLowerCase();

    // Get the body
    const body = document.querySelector('body');

    // get current content
    const content = this.shadowObj.querySelector('.actions>.action#view-action')

    if(body && content) {
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        // Get full post
        const post =  this.getFullPost(this.getAttribute('kind'));

        // replace and push states
        this.replaceAndPushStates(url, body, post);

        body.innerHTML = post;
      })
    }
  }

  activateEditButton = () => {
    // Get the body element
    const body = document.querySelector('body');
    // Get the edit button
    const editButton = this.shadowObj.querySelector('.actions>.action#edit-action');
    if(!editButton) return;
    // Add an event listener to the post button
    editButton.addEventListener('click', e => {
      e.preventDefault();
      // Get the content of the topic page
      const content = this.getEdit();

      // set to be deleted:
      window.toBeChanged = this;

      // insert the content into the body
      body.insertAdjacentHTML('beforeend', content);
    });
  }

  getEdit = () => {
    const drafted = this.getAttribute('published').trim() === 'false' ? 'true' : 'false';
    // Show Post Page Here
    return /* html */`
      <post-options kind="${this.getAttribute('kind')}" url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}" images="${this.getAttribute('images')}" published="${this.getAttribute('published')}"
        drafted="${drafted}" story="true" story-title="${this.getAttribute('story-title')}" slug="${this.getAttribute('slug')}">
        ${this.innerHTML}
      </post-options>
    `;
  }

  replaceAndPushStates = (url, body, post) => {
    // get the first custom element in the body
    const firstElement = body.firstElementChild;

    // convert the custom element to a string
     const elementString = firstElement.outerHTML;

    // get window location
    const pageUrl = window.location.href;
    window.history.replaceState(
      { page: 'page', content: elementString },
      url, pageUrl
    );

    // Updating History State
    window.history.pushState(
      { page: 'page', content: post},
      url, url
    );
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

  getTemplate() {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    const likes = this.parseToNumber(this.getAttribute('likes'));
    const views = this.parseToNumber(this.getAttribute('views'));
    return /* html */`
      ${this.getContent(this.getAttribute('kind'))}
      ${this.getActions(likes, views)}
    `;
  }

  getContent = story => {
    if (story === 'poll') {
      return this.getPoll();
    } else if (story === 'post') {
      return this.getPost();
    } else if (story === 'story') {
      return this.getStory();
    }
  }

  getPoll = () =>  {
    const mql = window.matchMedia('(max-width: 660px)');
    // Remove html tags
    const contentStr = this.innerHTML.replace(/<[^>]*>/g, '');
    const contentLength = contentStr.length;

    let chars = 250;

    // Check if its a mobile view
    if (mql.matches) {
      chars = 200;
    }

    // Check if content length is greater than :chars
    if (contentLength > chars) {
      return /*html*/`
        <div class="content extra ${chars <= 200 ? 'mobile' : ''}" id="content">
          ${this.innerHTML}
          <div class="read-more">
            <span class="action">view more</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
          </div>
        </div>
        ${this.getVotesWrapper()}
      `
    }
    else {
      return /*html*/`
        <div class="content" id="content">
          ${this.innerHTML}
        </div>
        ${this.getVotesWrapper()}
      `
    }
  }

  getVotesWrapper = () => {
    return /*html*/`
      <votes-wrapper reload="false" votes="${this.getAttribute('votes')}" selected="${this.getAttribute('selected')}"
        hash="${this.getAttribute('hash')}" end-time="${this.getAttribute('end-time')}" voted="${this.getAttribute('voted')}"
        options="${this.getAttribute('options')}">
      </votes-wrapper>
    `
  }

  getStory = () => {
    let images = this.getAttribute('images');
    images = images  && images !== 'null' ? images.split(',') : [];
    let str = this.getHTML();
    let title = this.getAttribute('story-title');
    str = str.replace(/<[^>]*>/g, '');

    str = str.trim();
    const filteredTitle = title && title !== 'null' ? `<h3 class="story-title">${title}</h3>` : '';
    const content = `<p>${this.trimContent(str)}</p>`;

    return /*html*/`
      <div class="content" id="content">
        ${filteredTitle}
        ${content}
      </div>
      ${this.getImages(images)}
    `
  }

  getHTML = () => {
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body.innerHTML;
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

  getPost = () => {
    const mql = window.matchMedia('(max-width: 660px)');
    let images = this.getAttribute('images');
    images = images  && images !== 'null' ? images.split(',') : [];
    // Remove html tags
    const contentStr = this.innerHTML.replace(/<[^>]*>/g, '');
    const contentLength = contentStr.length;

    let chars = 250;

    // Check if its a mobile view
    if (mql.matches) {
      chars = 200;
    }

    // Check if content length is greater than: chars
    if (contentLength > chars) {
      return /*html*/`
        <div class="content extra ${chars <= 200 ? 'feed' : ''}" id="content">
          ${this.innerHTML}
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
        <div class="content" id="content">
          ${this.innerHTML}
        </div>
        ${this.getImages(images)}
      `
    }
  }

  getImages = imageArray => {
    // if length is greater is less than 1
    if(!imageArray || imageArray.length < 1) return '';

    // return
    return /* html */`
      <images-wrapper images="${imageArray.join(',')}"></images-wrapper>
    `
  }

  styleLastBlock = () => {
    const content = this.shadowObj.querySelector('.content#content');
    if (!content) return;

    const lastBlock = content.lastElementChild;
    if (!lastBlock) return;

    // style the last block
    lastBlock.style.setProperty('padding', '0 0 0');
    lastBlock.style.setProperty('margin', '0 0 0');
  }

  openReadMore = () => {
    // Get the read more button
    const readMore = this.shadowObj.querySelector('.content .read-more');

    // Get the content
    const content = this.shadowObj.querySelector('.content');

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
    const links = this.shadowObj.querySelectorAll('div#content a');
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

  getActions = (likes, views) => {
    const viewUrl = this.getAttribute('url');
    const editUrl = viewUrl + '/edit';
    return /*html*/`
      <div class="actions">
        ${this.checkPublished(this.getAttribute('published'), viewUrl, editUrl, likes, views)}
      </div>
    `
  }

  checkPublished = (published, url, editUrl, likes, views) => {
    if(published === 'true') {
      return /*html*/`
        <a href="${editUrl}" class="action edit" id="edit-action">edit</a>
        <a href="${url}" class="action view" id="view-action">view</a>
        <span class="action likes plain">
          <span class="no">${this.formatNumber(likes)}</span> <span class="text">${likes === 1 ? 'like' : 'likes'}</span>
        </span>
        <span class="action views plain">
          <span class="no">${this.formatNumber(views)}</span> <span class="text">${views === 1 ? 'view' : 'views'}</span>
        </span>
      `
    }
    else {
      return /*html*/`
        <a href="${editUrl}" class="action edit" id="edit-action">edit</a>
        <span class="action draft plain">Drafted</span>
      `
    }
  }

  getFullPost = kind => {
    const parent = this.getAttribute('parent');
    let text = parent ? `parent="${parent}"` : '';
    const images = this.getAttribute('images');
    if (kind === "poll") {
      return /* html */`
        <app-post story="poll" tab="replies" url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}"
          likes="${this.getAttribute('likes')}" replies="${this.getAttribute('replies')}"
          replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}"
          options='${this.getAttribute("options")}' voted="${this.getAttribute('voted')}" selected="${this.getAttribute('selected')}"
          end-time="${this.getAttribute('end-time')}" votes="${this.getAttribute('votes')}" author-contact='${this.getAttribute("author-contact")}'
          liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}" time="${this.getAttribute('time')}"
          author-you="${this.getAttribute('author-you')}" author-stories="${this.getAttribute('author-stories')}" author-replies="${this.getAttribute('author-replies')}"
          author-hash="${this.getAttribute('author-hash')}" author-url="${this.getAttribute('author-url')}"
          author-img="${this.getAttribute('author-img')}" author-verified="${this.getAttribute('author-verified')}" author-name="${this.getAttribute('author-name')}"
          author-followers="${this.getAttribute('author-followers')}" author-following="${this.getAttribute('author-following')}" author-follow="${this.getAttribute('author-follow')}"
          author-bio="${this.getAttribute('author-bio')}">
          ${this.innerHTML}
        </app-post>
      `
    } else if(kind === "post"){
      return /* html */`
        <app-post story="quick" tab="replies" url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}"
          likes="${this.getAttribute('likes')}" replies="${this.getAttribute('replies')}" ${text} images='${images}'
          replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}"
          liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}" time="${this.getAttribute('time')}"
          author-stories="${this.getAttribute('author-stories')}" author-replies="${this.getAttribute('author-replies')}" author-contact='${this.getAttribute("author-contact")}'
          author-you="${this.getAttribute('author-you')}" author-hash="${this.getAttribute('author-hash')}" author-url="${this.getAttribute('author-url')}"
          author-img="${this.getAttribute('author-img')}" author-verified="${this.getAttribute('author-verified')}" author-name="${this.getAttribute('author-name')}"
          author-followers="${this.getAttribute('author-followers')}" author-following="${this.getAttribute('author-following')}" author-follow="${this.getAttribute('author-follow')}"
          author-bio="${this.getAttribute('author-bio')}">
          ${this.innerHTML}
        </app-post>
      `
    } else if(kind === "story"){
      return /* html */`
        <app-story  story="story" tab="replies" hash="${this.getAttribute('hash')}"  url="${this.getAttribute('url')}" topics="${this.getAttribute('topics')}" 
          story-title="${this.getAttribute('story-title')}" time="${this.getAttribute('time')}"
          replies-url="${this.getAttribute('replies-url')}" likes-url="${this.getAttribute('likes-url')}"
          likes="${this.getAttribute('likes')}" replies="${this.getAttribute('replies')}" liked="${this.getAttribute('liked')}" views="${this.getAttribute('views')}"
          author-you="${this.getAttribute('author-you')}" images='${images}'
          author-stories="${this.getAttribute('author-stories')}" author-replies="${this.getAttribute('author-replies')}"
          author-hash="${this.getAttribute('author-hash')}" author-url="${this.getAttribute('author-url')}" author-contact='${this.getAttribute("author-contact")}'
          author-img="${this.getAttribute('author-img')}" author-verified="${this.getAttribute('author-verified')}" author-name="${this.getAttribute('author-name')}"
          author-followers="${this.getAttribute('author-followers')}" author-following="${this.getAttribute('author-following')}" author-follow="${this.getAttribute('author-follow')}"
          author-bio="${this.getAttribute('author-bio')}">
          ${this.innerHTML}
        </app-story>
      `
    }
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
          -webkit-appearance: none;
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
          gap: 5px;
          padding: 10px 0;
          border-bottom: var(--border);
          width: 100%;
        }

        .content {
          width: 100%;
          display: flex;
          flex-flow: column;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          line-height: 1.4;
          gap: 0;
          margin: 0;
          padding: 0;
        }

        .content.extra {
          max-height: 200px;
          overflow: hidden;
          position: relative;
        }

        .content.extra.feed {
          max-height: 150px;
        }

        .content.extra .read-more {
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

        .content.extra .read-more svg {
          display: inline-block;
          width: 16px;
          height: 16px;
          margin: 0 0 2px 0;
        }

        .content h6,
        .content h5,
        .content h4,
        .content h3,
        .content h1 {
          padding: 0;
          font-size: 1.2rem !important;
          color: var(--title-color);
          font-weight: 500;
          line-height: 1.5;
          margin: 5px 0;
        }

        .content p {
          font-size: 1rem;
          margin: 0 0 5px;
          line-height: 1.4;
        }

        .content a {
          text-decoration: none;
          cursor: pointer;
          color: var(--anchor-color) !important;
        }

        .content a:hover {
          text-decoration: underline;
        }

        .content blockquote {
          margin: 2px 0;
          padding: 5px 0;
          font-style: italic;
          background: var(--background);
          color: var(--text-color);
          font-weight: 400;
          line-height: 1.4;
        }

        .content blockquote p {
          margin: 0;
        }

        .content blockquote * {
          margin: 0;
        }

        .content hr {
          border: none;
          background-color: var(--text-color);
          height: 1px;
          margin: 10px 0;
        }

        .content code {
          background: var(--gray-background);
          padding: 0 5px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          border-radius: 5px;
        }

        .content b,
        .content strong {
          font-weight: 700;
          line-height: 1.4;

        }

        .content ul,
        .content ol {
          margin: 5px 0 15px 20px;
          padding: 0 0 0 15px;
          color: inherit;
          line-height: 1.4;
        }

        .content ul li,
        .content ol li {
          margin: 6px 0;
          padding: 0;
          color: inherit;
        }

        .content > h3.story-title {
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          line-height: 1.5;
          font-size: 1.15rem;
          font-weight: 500;
        }

        .actions {
          display: flex;
          font-family: var(--font-main), sans-serif;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 15px;
          margin: 5px 0 0 0;
        }
        
        .actions > .action {
          border: var(--border-button);
          text-decoration: none;
          color: var(--gray-color);
          font-size: 0.9rem;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: lowercase;
          justify-content: center;
          padding: 1.5px 10px 2.5px;
          border-radius: 10px;
        }

        .actions > .action.edit {
          border: none;
          background: var(--gray-background);
          color: var(--text-color);
          font-size: 0.9rem;
          padding: 2.5px 12px 3.5px;
        }

        .actions > .action.publish {
          text-transform: capitalize;
          padding: 2.5px 10px 3.5px;
        }

        .actions > .action.plain {
          padding: 0;
          font-weight: 500;
          pointer-events: none;
          font-family: var(--font-text), sans-serif;
          color: var(--gray-color);
          border: none;
          background: none;
          padding: 2.5px 0 3.5px 0;
        }

        .actions > .action.plain.draft {
          text-transform: capitalize;
          font-family: var(--font-main), sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-color);
          padding: 2.5px 0 3.5px 0;
        }
        
        .actions > .action.plain > span.no {
          font-family: var(--font-main), sans-serif;
          font-size: 0.85rem;
          color: var(--text-color);
        }

        .actions > .action.plain > span.text {
          display: inline-block;
          padding: 0 0 0 3px;
        }

        @media screen and (max-width:660px) {
          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          .actions {
            width: 100%;
          }

          .actions > .action.plain > span.no {
            font-family: var(--font-main), sans-serif;
            font-size: 0.8rem;
            color: var(--text-color);
          }

          button.fetch,
          .content.extra .read-more,
          .actions > .action.close,
          a {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}