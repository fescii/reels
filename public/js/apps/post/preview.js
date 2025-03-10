export default class PreviewPost extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this._url = this.getAttribute('url');
    this.post = null;
    this.item = '';
    // let's create our shadow root
    this.shadowObj = this.attachShadow({mode: 'open'});
    this.app = window.app;
    this.api = this.app.api;
    this.preview = this.getAttribute('preview');
    this.feed = this.textToBool(this.getAttribute('feed'))
    this.first = this.textToBool(this.getAttribute('first'));
    this.parent = this.getRootNode().host;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  textToBool = text => {
    return text === 'true';
  }

  connectedCallback() {
    const contentContainer = this.shadowObj.querySelector('div.preview');

    // Close the modal
    if (contentContainer) {
      this.activateBtn(contentContainer);
      this.activateFetchPreview(contentContainer);
    }
  }

  activateFetchPreview = contentContainer => {
    this.fetchPreview(contentContainer);
  }

  activateBtn = contentContainer => {
    const btn = this.shadowObj.querySelector('button.fetch');

    if (btn && contentContainer) {
      btn.addEventListener('click', event => {
        event.preventDefault();
        this.fetchPreview(contentContainer);
      })
    }
  }

  activateStatsBtn = data => {
    const closeBtn = this.shadowObj.querySelector('.action.stats');
    if (closeBtn) this.openHighlights(closeBtn, data);
  }

  openHighlights = (btn, data) => {
    const body = document.body;
    if (btn) {
      btn.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        body.insertAdjacentHTML('beforeend', this.getHighlights(data));
      });
    }
  }

  getHighlights = data => {
    return /* html */`
      <views-popup name="post"
        liked="${data.liked}" views="${data.views}"
        likes="${data.likes}" replies="${data.replies}">
      </views-popup>
    `
  }

  fetchPreview = contentContainer => {
    // Add the loader
    contentContainer.innerHTML = this.getLoader();
    const previewLoader = this.shadowObj.querySelector('#loader-container');

    // Check if post is set
    if (this.post) {
      this.handleFetchedContent(contentContainer, previewLoader);
      return;
    }

    setTimeout(async () => {
      try {
        const result = await this.api.get(this._url, { content: 'json' }, { allow: true, duration: 7200 });
        this.handleApiResponse(result, contentContainer, previewLoader);
      } catch (error) {
        this.handleError(contentContainer, previewLoader, error);
      }
    }, 100);
  }

  handleFetchedContent = (contentContainer, previewLoader) => {
    previewLoader.remove();
    this.item = this.mapReply(this.post);
    contentContainer.innerHTML = this.populateReply(this.post);
    if(this.post.kind === 'reply') this.setReply('reply', this.post);

    this.activateStatsBtn(this.item);
    this.openStory();
    this.openReadMore();
    this.openUrl();
    this.styleLastBlock();
  }

  handleApiResponse = (result, contentContainer, previewLoader) => {
    if (!result.success) {
      this.displayError(contentContainer, previewLoader);
      return;
    }

    try {
      this.post = result.post;
      this.item = this.getPost(result.post);
      previewLoader.remove();
      contentContainer.innerHTML = this.populatePost(result.post);
      this.activateStatsBtn(result.post);
      this.openStory();
      this.openReadMore();
      this.openUrl();
      this.styleLastBlock();
      if(result.post.kind === 'reply') this.setReply('reply', result.post);
    } catch (error) {
      console.error(error)
      this.handleError(contentContainer, previewLoader, error);
    }
  }

  populateContent = (story, contentContainer) => {
    const contentMap = {
      post: this.populatePost,
      poll: this.populatePoll,
      story: this.populateStory
    };

    const populateFunction = contentMap[post.kind];
    if (populateFunction) {
      contentContainer.innerHTML = populateFunction.call(this, story);
    }

    this.activateStatsBtn(story);
    this.openStory();
    this.openReadMore();
    this.openUrl();
    this.styleLastBlock();
  }

  setReply = (kind, parent) => {
    if(!parent) return;
    const reply = this.getReply(kind, parent);
    if (!reply || reply === '') return;
    this.parent.setReply(this.feed, reply);
  }

  displayError = (contentContainer, previewLoader) => {
    const content = this.getEmpty();
    previewLoader.remove();
    contentContainer.innerHTML = content;
    this.activateBtn(contentContainer);
  }

  handleError = (contentContainer, previewLoader, error) => {
    console.error('Error fetching preview:', error);
    this.displayError(contentContainer, previewLoader);
  }

  populatePost = post => {
    const author = post.author;
    author.you = post.you;
    author.time = post.createdAt;
    const postContent = this.getPost(post);
    const url =`/post/${post.hash.toLowerCase()}`;
    return this.getContent(postContent, url, post.views, post.likes, author, post.kind);
  }

  getPost = post =>  {
    const mql = window.matchMedia('(max-width: 660px)');
    const contentStr = post.content.replace(/<[^>]*>/g, '');
    const contentLength = contentStr.length;
    let chars = 150;
    // Check if its a mobile view
    if (mql.matches) chars = 120;

    // Check if content length is greater than :chars
    if (contentLength > chars) {
      return /*html*/`
        <div class="content extra ${chars <= 200 ? 'mobile' : ''}" id="content">
          ${post.content}
          <div class="read-more">
            <span class="action">view more</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
          </div>
        </div>
        ${this.getPoll(post)}
      `
    }
    else {
      return /*html*/`
        <div class="content" id="content">
          ${post.content}
        </div>
        ${this.getPoll(post)}
      `
    }
  }

  getPoll = post => {
    if(post.kind === 'poll') {
      return /*html*/`
        <votes-wrapper reload="false" votes="${post.votes}" selected="${post.option}" 
          end-time="${post.end}" voted="${post.option ? 'true' : 'false'}" options='${post.poll}'
          hash="${post.hash}" kind="poll" url="/post/${post.hash.toLowerCase()}">
        </votes-wrapper>
      `;
    } else return '';
  }

  removeHtml = (text, title)=> {
    let str = text.replace(/<[^>]*>/g, '');

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
    if (text.length <= 150) return text;

    // check for mobile view
    const mql = window.matchMedia('(max-width: 660px)');

    // Check if its a mobile view
    if (mql.matches) {
      // return text substring: 150 characters + ...
      return text.substring(0, 180) + '...';
    } else {
      // trim the text to 250 characters
      return text.substring(0, 200) + '...';
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
    const links = this.shadowObj.querySelectorAll('div#content a');
    const body = document.querySelector('body');
    if (!links) return;
    links.forEach(link => {
      link.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const url = link.getAttribute('href');
        let linkPopUp = `<url-popup url="${url}"></url-popup>`
        body.insertAdjacentHTML('beforeend', linkPopUp);
      });
    });
  }

  openStory = () => {
    // get current content
    const btn = this.shadowObj.querySelector('.actions > .action#view-action');
    const content = this.shadowObj.querySelector('.content#content');
    if(content) {
      content.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        let url = btn.getAttribute('href');
        const post =  this.item;
        this.pushApp(url, post);
      })
    }

    // get the button
    if (btn) {
      btn.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        let url = btn.getAttribute('href');
        const post =  this.item;
        this.pushApp(url, post);
      })
    }
  }

  pushApp = (url, content) => {
    this.app.push(url, { kind: "app", name: 'story', html: content }, url);
    // navigate to the content
    this.navigateTo(content);
  }

  navigateTo = content => {
    // navigate to the content
    this.app.navigate(content);
  }

  mapStory = post => {
    const author = post.author;
    const url = `/post/${post.hash.toLowerCase()}`;
    const images = post.images ? post.images.join(',') : null;
    return /*html*/`
      <app-post story="quick" tab="replies" url="${url}" hash="${post.hash}" likes="${post.likes}" replies="${post.replies}" 
        replies-url="${url}/replies" likes-url="${url}/likes" images='${images}'
        views="${post.views}"  time="${post.createdAt}" liked="${post.liked ? 'true' : 'false'}" 
        author-url="/u/${author.hash}" author-stories="${author.stories}" author-replies="${author.replies}"
        author-hash="${author.hash}" author-you="${post.you ? 'true' : 'false'}" author-img="${author.picture}" 
        author-verified="${author.verified ? 'true' : 'false'}" author-name="${author.name}" author-followers="${author.followers}" 
        author-following="${author.following}" author-follow="${author.is_following ? 'true' : 'false'}" author-contact='${author.contact ? JSON.stringify(author.contact) : null}'
        author-bio="${author.bio === null ? 'This user has not added a bio yet.' : author.bio}" ${this.getPollOptions(post)}>
        ${post.content}
      </app-post>
    `
  }

  getPollOptions = post => {
    if(post.kind === 'poll') {
      return /*html*/`  options='${post.poll}' voted="${post.option ? 'true' : 'false'}" 
      selected="${post.option}" end-time="${post.end}" votes="${post.votes}" `;
    } else return '';
  }

  formatNumber = n => {
    n = this.parseToNumber(n);
    const ranges = [
      { divider: 1e9, suffix: 'B+' },
      { divider: 1e6, suffix: 'M', thresholds: [1e6, 1e7, 1e8] },
      { divider: 1e3, suffix: 'k', thresholds: [1e3, 1e4, 1e5] }
    ];

    const { divider, suffix, thresholds } = ranges.find(({ divider }) => n >= divider) || {};
    if (!divider) return n.toString();

    const value = n / divider;
    const precision = thresholds ? 
      (n >= thresholds[2] ? 0 : n >= thresholds[1] ? 1 : 2) : 2;

    return `${value.toFixed(precision)}${suffix}`;
  }

  parseToNumber(str) {
    return parseInt(str, 10) || 0;
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

  // style the last paragraph or the last block element in content
  styleLastBlock = () => {
    const content = this.shadowObj.querySelector('.content#content');
    if (!content) return;

    const lastBlock = content.lastElementChild;
    if (!lastBlock) return;

    // style the last block
    lastBlock.style.setProperty('padding', '0 0 0');
    lastBlock.style.setProperty('margin', '0 0 0');
  }

  getTemplate() {
    // Show HTML Here
    return /*html*/`
      <div class="welcome">
        <div class="preview">
          <button class="fetch">Preview</button>
        </div>
      </div>
      ${this.getStyles()}
    `
  }

  getLapseTime = isoDateStr => {
    const date = new Date(isoDateStr);
    const currentTime = new Date();
    const seconds = (currentTime - date) / 1000;

    // check if seconds is less than 86400 and dates are equal: Today, 11:30 AM
    if (seconds < 86400 && date.getDate() === currentTime.getDate()) {
      return `
        Today • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    } else if (seconds < 86400 && date.getDate() !== currentTime.getDate()) {
      return `
        Yesterday • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }

    // check if seconds is less than 604800: Friday, 11:30 AM
    if (seconds <= 604800) {
      return `
        ${date.toLocaleDateString('en-US', { weekday: 'short' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }

    // Check if the date is in the current year and seconds is less than 31536000: Dec 12, 11:30 AM
    if (seconds < 31536000 && date.getFullYear() === currentTime.getFullYear()) {
      return `
        ${date.toLocaleDateString('en-US', { weekday: 'short' })} • ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    } else {
      return `
        ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }
  }

  getContent = (content, url, views, likes, author, kind) => {
    const preview = this.shadowObj.querySelector('div.preview');
    if (preview) {
      preview.classList.add(kind);
      if(this.preview === 'full') preview.classList.add('full');
    }
    const images = this.post.images ? this.post.images : null;

    return /*html*/`
      ${this.getHeader(author)}
      <article class="article">${content}</article>
      ${this.getImages(kind, images)}
      ${this.getOn(author.time)}
      ${this.getActions(likes, views, url, kind)}
    `
  }

  getHeader = author => {
    return /*html*/`
      <div class="meta top-meta">
        ${this.getAuthorHover(author)}
      </div>
    `
  }

  getOn = time => {
    return /*html*/`
      <div class="meta bottom-meta">
        <time class="time" datetime="${time}">
          ${this.getLapseTime(time)}
        </time>
      </div>
    `
  }

  getActions = (likes, views, url, kind) => {
    return /*html*/`
      <div class="actions ${kind} ${this.preview}">
        ${this.getArrow(kind, this.first)}
        <a href="${url}" class="action view" id="view-action">view</a>
        <span class="action stats" id="stats-action">stats</span>
        <span class="action likes plain">
          <span class="no">${this.formatNumber(likes)}</span> <span class="text">likes</span>
        </span>
        <span class="action views plain">
          <span class="no">${this.formatNumber(views)}</span> <span class="text">views</span>
        </span>
      </div>
    `
  }

  getArrow = (kind, first) => {
    if (kind === 'reply' || this.preview === 'full') {
      return /*html*/`
        <span class="action arrow ${first ? 'first' : ''}"> 
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
            <defs>
              <linearGradient id="gradient" gradientTransform="rotate(0)">
                <stop offset="0%" stop-color="var(--action-linear-start)" />
                <stop offset="100%" stop-color="var(--action-linear-end)" />
              </linearGradient>
            </defs>
            <path fill="url(#gradient)" d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      `
    }
    else  return '';
  }

  getReply = (kind, parent) => {
    if (kind === 'reply') {
      let url = `/post/${parent.hash.toLowerCase()}`;
      return /*html*/`
        <preview-post url="${url}" hash="${parent}" preview="${this.preview}"></preview-post>
      `
    } else return '';
  }

  getEmpty = () => {
    const preview = this.shadowObj.querySelector('div.preview');
    if(preview) preview.classList.remove('reply');
    return /* html */`
      <div class="empty">
        <p>An error has occurred.</p>
        <div class="actions">
          <button class="fetch last">Retry</button>
          <span class="action stats" id="stats-action">stats</span>
        </div>
      </div>
    `
  }

  getLoader() {
    return /* html */`
      <div class="loader-container" id="loader-container">
				<div class="loader"></div>
			</div>
    `
  }

  getAuthorHover = author => {
    const url = `/u/${author.hash.toLowerCase()}`;
    let bio = author.bio ? author.bio : 'This user has not added a bio yet.';
    // replace all " and ' with &quot; and &apos; to avoid breaking the html
    bio = bio.replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    return /* html */`
			<hover-author url="${url}" you="${author.you ? 'true' : 'false'}" hash="${author.hash}"
        picture="${author.picture}" name="${author.name}" contact="${author.contact ? JSON.stringify(author.contact) : null}"
        stories="${author.stories}" replies="${author.replies}"
        followers="${author.followers}" following="${author.following}" user-follow="${author.is_following ? 'true' : 'false'}"
        verified="${author.verified ? 'true' : 'false'}" bio="${bio}">
      </hover-author>
		`
  }

  getImages = (kind, imageArray) => {
    if(kind === 'story') return this.getStoryImages(this._post.content);
    // if length is greater is less than 1
    if(!imageArray || imageArray.length < 1) return '';

    // return
    return /* html */`
      <images-wrapper images="${imageArray.join(',')}"></images-wrapper>
    `
  }

  getStoryImages = text => {
    const images = this.allImages(text);

    // if length is greater is less than 1
    if(images.length < 1) return '';

    // return
    return /* html */`
      <images-wrapper images="${images}"></images-wrapper>
    `
  }

  allImages = text => {
    // find images in the text
    const textImages = this.findImages(text);

    // if images is null return images; else concat the images
    if (!textImages) return [];
    return textImages.join(','); 
  }

  findImages = text => {
    // Updated regex to handle various attributes and nested tags
    const imgRegex = /<img\s+(?:[^>]*?\s+)?src\s*=\s*(["'])(.*?)\1/gi;
    const matches = [];
    let match;
    while ((match = imgRegex.exec(text)) !== null) {
      matches.push(match[2]);  // match[2] contains the URL
    }
  
    // Return array of src values or null if no matches found
    return matches.length > 0 ? matches : null;
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
          width: 100%;
          min-width: 100%;
        }

        div.loader-container {
          display: flex;
          align-items: center;
          justify-content: start;
          width: 100%;
          min-height: 50px;
          padding: 0 0 0 12px;
          height: 50px;
          min-width: 100%;
        }

        div.loader-container > .loader {
          width: 12px;
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

        .welcome {
          width: 100%;
          height: max-content;
          position: relative;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .preview {
          width: 100%;
          position: relative;
          display: flex;
          flex-flow: column;
          color: var(--text-color);
          line-height: 1.4;
          gap: 0;
          margin: 0;
          padding: 0 0 0 19px;
        }

        .preview::before {
          content: '';
          display: block;
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          left: 3px;
          width: 1.8px;
          height: calc(100% - 10px);
          background: var(--action-linear);
          border-radius: 5px;
        }

        .preview.reply::before {
          top: calc(50% - 18px);
          transform: translateY(-50%);
          height: calc(100% - 40px);
        }

        .preview.full::before {
          top: calc(50% - 16px);
          transform: translateY(-50%);
          height: calc(100% - 40px);
        }

        .preview article.article {
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 0;
          margin: 0;
          padding: 0;
          font-family: var(--font-main), sans-serif;
        }

        .preview p,
        .preview h3 {
          margin: 0;
          font-family: var(--font-main), sans-serif;
          line-height: 1.2;
        }

        .preview h3 {
          margin: 0 0 5px;
          font-family: var(--font-main), sans-serif;
          color: var(--title-color);
          font-size: 1.1rem;
          font-weight: 500;
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

        .content.extra.mobile {
          max-height: 120px;
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
          font-size: 1.3rem !important;
          color: var(--title-color);
          font-weight: 500;
          line-height: 1.5;
          margin: 5px 0;
        }

        .content p {
          font-size: 1rem;
          margin: 0 0 5px 0;
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
          margin: 0;
          padding: 0 0 5px;
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

        figure {
          max-width: 100% !important;
          height: auto;
          width: max-content;
          padding: 0;
          max-width: 100%;
          display: block;
          margin-block-start: 5px;
          margin-block-end: 5px;
          margin-inline-start: 0 !important;
          margin-inline-end: 0 !important;
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
          font-size: 0.95rem;
          margin: 0 0 1px 0;
        }

        .meta > time.time {
          font-family: var(--font-read), sans-serif;
          font-size: 0.8rem;
          font-weight: 500;
          margin: 1px 0 0 0;
        }

        .meta a.link {
          text-decoration: none;
          color: transparent;
          background-image: var(--action-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .meta.top-meta {
          width: 100%;
        }

        .meta  a.author-link {
          text-decoration: none;
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }
        
        .meta.bottom-meta {
          margin:  0;
          padding: 5px 0 0;
          display: flex;
          position: relative;
          color: var(--gray-color);
          align-items: center;
          font-family: var(--font-text), sans-serif;
          gap: 8px;
          font-size: 1rem;
          font-weight: 600;
        }

        .meta.bottom-meta > .sp {
          font-size: 1.25rem;
          color: var(--gray-color);
          font-weight: 400;
        }

        div.empty {
          width: 100%;
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          gap: 10px;
        }

        div.empty > p {
          width: max-content;
          padding: 0;
          margin: 5px 0 0 0;
          color: var(--error-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 500;
        }

        div.empty > .actions {
          margin: 0;
        }

        button.fetch {
          width: max-content;
          margin: 10px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2px 10px 3px;
          font-size: 0.9rem;
          font-family: var(--font-main), sans-serif;
          font-weight: 500;
          background: var(--accent-linear);
          color: var(--white-color);
          border: none;
          border-radius: 10px;
          cursor: pointer
        }

        button.fetch.last {
          margin: 0 0 5px;
        }

        .preview.feed button.fetch {
          margin: 5px 0 3px 0;
          padding: 3px 10px 4px;
          border-radius: 7px;
          font-size: 0.8rem;
        }
        
        .actions {
          display: flex;
          font-family: var(--font-main), sans-serif;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 15px;
          margin: 5px 0 3px;
        }

        .actions.reply,
        .actions.full {
          position: relative;
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
          padding: 1px 10px 2px;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        .actions > .action.close {
          color: var(--error-color);
          cursor: pointer;
        }

        .actions > .action.plain {
          padding: 0;
          font-weight: 500;
          pointer-events: none;
          font-family: var(--font-text), sans-serif;
          color: var(--gray-color);
          border: none;
          background: none;
        }
        
        .actions > .action.plain > span.no {
          font-family: var(--font-main), sans-serif;
          font-size: 0.9rem;
          color: var(--text-color);
        }

        .actions > .action.plain > span.text {
          display: inline-block;
          padding: 0 0 0 3px;
        }

        .actions > .action.arrow {
          all: unset;
          top: 2px;
          position: absolute;
          left: -25px;
        }

        .actions > .action.arrow svg {
          width: 20px;
          height: 20px;
          rotate: 90deg;
        }
        
        @media screen and ( max-width: 850px ){
          #content {
            width: 90%;
          }
        }

        @media screen and ( max-width: 660px ) {
          :host {
            border: none;
            justify-self: end;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            width: 100%;
            min-width: 100%;
          }

          .preview::before {
            content: '';
            display: block;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            left: 3px;
            width: 1.8px;
            height: calc(100% - 10px);
            background: var(--action-linear);
            border-radius: 5px;
          }

          .preview.reply::before {
            top: calc(50% - 18px);
            transform: translateY(-50%);
            /*transform: translateY(calc(-50% - 30px));*/
            height: calc(100% - 40px);
          }

          .preview.full::before {
            top: calc(50% - 16px);
            transform: translateY(-50%);
            height: calc(100% - 40px);
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