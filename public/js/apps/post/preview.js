export default class PreviewPost extends HTMLElement {
  constructor() {
    super();
    this._url = this.getAttribute('url');
    this.post = null;
    this.item = ''; // Consider renaming for clarity if possible (e.g., postDataForApp)
    this.shadowObj = this.attachShadow({ mode: 'open' });
    this.app = window.app;
    this.api = this.app.api;
    this.preview = this.getAttribute('preview'); // e.g., 'full'
    this.feed = this.getAttribute('feed') === 'true';
    this.first = this.getAttribute('first') === 'true';
    this.parent = this.getRootNode().host; // Assumes it's always hosted within another component

    // Cache frequently accessed elements
    this._contentContainer = null;
    this._fetchButton = null;

    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
    // Cache elements after rendering
    this._contentContainer = this.shadowObj.querySelector('div.preview');
    this._fetchButton = this.shadowObj.querySelector('button.fetch');
  }

  // Removed textToBool, using direct comparison in constructor

  connectedCallback() {
    if (this._contentContainer) {
      this._activateFetchButton();
      this._fetchPreview(); // Initial fetch
    }
  }

  // Consolidated activation logic
  _activateFetchButton = () => {
    if (this._fetchButton && this._contentContainer) {
      this._fetchButton.addEventListener('click', this._handleFetchClick);
    }
  }

  _handleFetchClick = (event) => {
    this._stopEvent(event);
    this._fetchPreview();
  }

  _activateStatsButton = (data) => {
    const statsBtn = this.shadowObj.querySelector('.action.stats');
    if (statsBtn) {
      statsBtn.addEventListener('click', (e) => this._handleStatsClick(e, data));
    }
  }

  _handleStatsClick = (e, data) => {
    this._stopEvent(e);
    document.body.insertAdjacentHTML('beforeend', this._getHighlightsPopup(data));
  }

  _getHighlightsPopup = (data) => {
    // Ensure attributes are properly escaped if they contain special characters
    // For simplicity, assuming basic data types here.
    return /* html */`
      <views-popup name="post"
        liked="${data.liked}" views="${data.views}"
        likes="${data.likes}" replies="${data.replies}">
      </views-popup>
    `;
  }

  _fetchPreview = async () => {
    if (!this._contentContainer) return;

    // Show loader
    this._contentContainer.innerHTML = this.getLoader();
    const previewLoader = this.shadowObj.querySelector('#loader-container'); // Needs to be queried after setting innerHTML

    // Check if post data is already available (e.g., from parent or previous fetch)
    if (this.post) {
      this._handleFetchedContent(previewLoader);
      return;
    }

    try {
      // Removed arbitrary setTimeout
      const result = await this.api.get(this._url, { content: 'json' }, { allow: true, duration: 7200 });
      this._handleApiResponse(result, previewLoader);
    } catch (error) {
      this._handleError(previewLoader, error);
    }
  }

  // Consolidated common logic after fetching/having data
  _setupPostDisplay = (postData, previewLoader) => {
    if (previewLoader) previewLoader.remove();
    if (!this._contentContainer) return;

    this.item = postData; // Assuming getPost or mapReply returns the necessary structure
    this._contentContainer.innerHTML = this._populatePost(postData); // Use a consistent population method

    this._activateStatsButton(postData);
    this._activateContentInteractions(postData); // Consolidate interaction setup

    if (postData.kind === 'reply') {
      this._setReply(postData);
    }
  }

  _handleFetchedContent = (previewLoader) => {
    // Assuming this.post is already structured correctly
    // If mapReply was necessary, call it here: this.item = this._mapReply(this.post);
    this._setupPostDisplay(this.post, previewLoader);
  }

  _handleApiResponse = (result, previewLoader) => {
    if (!result || !result.success || !result.post) {
      this._displayError(previewLoader);
      return;
    }

    try {
      this.post = result.post; // Store the fetched post
      // Assuming getPost structures the data correctly for display
      // this.item = this._getPostForDisplay(result.post); // If transformation needed
      this._setupPostDisplay(result.post, previewLoader);
    } catch (error) {
      console.error('Error processing API response:', error);
      this._handleError(previewLoader, error);
    }
  }

  // Renamed for clarity
  _populatePost = (post) => {
    const author = { ...post.author, you: post.you, time: post.createdAt }; // Avoid modifying original post.author
    const postContentHtml = this._getPostContentHtml(post);
    const url = `/p/${post.hash.toLowerCase()}`;
    const images = post.images || (post.kind === 'story' ? this._findImagesInContent(post.content) : null);

    // Add kind class to preview container
    if (this._contentContainer) {
        this._contentContainer.className = 'preview'; // Reset classes
        this._contentContainer.classList.add(post.kind);
        if (this.preview === 'full') {
            this._contentContainer.classList.add('full');
        }
    }


    return /*html*/`
      ${this._getHeader(author)}
      <article class="article">${postContentHtml}</article>
      ${this._getImagesHtml(images)}
      ${this._getTimestampHtml(author.time)}
      ${this._getActionsHtml(post.likes, post.views, url, post.kind)}
    `;
  }

   // Renamed for clarity
  _getPostContentHtml = (post) => {
    const contentStr = post.content.replace(/<[^>]*>/g, ''); // Simple text version for length check
    const contentLength = contentStr.length;
    const mql = window.matchMedia('(max-width: 660px)');
    const chars = mql.matches ? 120 : 150; // Simplified char limit logic

    const needsReadMore = contentLength > chars;
    const readMoreClass = needsReadMore ? `extra ${chars <= 120 ? 'mobile' : ''}` : ''; // Use 120 for mobile check

    return /*html*/`
      <div class="content ${readMoreClass}" id="content">
        ${post.content}
        ${needsReadMore ? `
          <div class="read-more">
            <span class="action">view more</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M12.78 5.22a.749.749 0 0 1 0 1.06l-4.25 4.25a.749.749 0 0 1-1.06 0L3.22 6.28a.749.749 0 1 1 1.06-1.06L8 8.939l3.72-3.719a.749.749 0 0 1 1.06 0Z"></path>
            </svg>
          </div>` : ''}
      </div>
      ${this._getPollHtml(post)}
    `;
  }

  _getPollHtml = (post) => {
    if (post.kind === 'poll') {
      // Ensure attributes are properly handled/escaped if they contain complex data
      const optionsAttr = JSON.stringify(post.poll || []).replace(/'/g, '&apos;');
      return /*html*/`
        <votes-wrapper reload="false" votes="${post.votes || 0}" selected="${post.option || ''}"
          end-time="${post.end || ''}" voted="${post.option ? 'true' : 'false'}" options='${optionsAttr}'
          hash="${post.hash}" kind="poll" url="/p/${post.hash.toLowerCase()}">
        </votes-wrapper>
      `;
    }
    return '';
  }

  _setReply = (parentPost) => {
    if (!parentPost || !parentPost.parent) return;
    const replyHtml = this._getReplyHtml(parentPost);
    if (!replyHtml) return;
    // Ensure parent has the setReply method
    if (this.parent && typeof this.parent.setReply === 'function') {
      this.parent.setReply(this.feed, replyHtml);
    } else {
      console.warn('Parent component does not have setReply method or parent is not set.');
    }
  }

  _getReplyHtml = (post) => {
      if (post.kind === 'reply' && post.parent) {
          let url = `/p/${post.parent.toLowerCase()}`;
          // Pass necessary attributes, ensure hash is correct if needed by preview-post
          return /*html*/`
              <preview-post url="${url}" hash="${post.parent}" preview="${this.preview}" feed="${this.feed}" first="false"></preview-post>
          `;
      }
      return '';
  }


  _displayError = (previewLoader) => {
    if (previewLoader) previewLoader.remove();
    if (!this._contentContainer) return;

    const content = this.getEmpty();
    this._contentContainer.innerHTML = content;
    // Re-select the button inside the error message and activate it
    this._fetchButton = this.shadowObj.querySelector('button.fetch');
    this._activateFetchButton();
    // Activate stats button if present in error template
    const statsBtn = this.shadowObj.querySelector('.action.stats');
     if (statsBtn) {
        // Decide what data to pass for stats in error case, maybe null or empty object
        statsBtn.addEventListener('click', (e) => this._handleStatsClick(e, {}));
     }
  }

  _handleError = (previewLoader, error) => {
    console.error('Error fetching or processing preview:', error);
    this._displayError(previewLoader);
  }

  // --- Event Handling Helpers ---

  _stopEvent = (event) => {
    if (!event) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  // Consolidate activation of interactive elements within the post content
  _activateContentInteractions = (postData) => {
    this._activateReadMore();
    this._activateContentLinks();
    this._activateViewAction(postData);
    this._styleLastBlock(); // Style after content is set
  }


  _activateReadMore = () => {
    const readMore = this.shadowObj.querySelector('.content .read-more');
    const content = this.shadowObj.querySelector('.content'); // Use cached element if possible

    if (readMore && content) {
      readMore.addEventListener('click', (e) => {
        this._stopEvent(e);
        content.classList.remove('extra');
        readMore.remove(); // Remove the button after expanding
      });
    }
  }

  _activateContentLinks = () => {
    const links = this.shadowObj.querySelectorAll('div#content a');
    const body = document.body; // Cache if used frequently elsewhere
    if (!links || links.length === 0) return;

    links.forEach(link => {
      link.addEventListener('click', (event) => {
        this._stopEvent(event);
        const url = link.getAttribute('href');
        // Consider security implications of inserting arbitrary HTML/components
        if (url) {
          let linkPopUp = `<url-popup url="${encodeURIComponent(url)}"></url-popup>`; // Basic encoding
          body.insertAdjacentHTML('beforeend', linkPopUp);
        }
      });
    });
  }

  _activateViewAction = (postData) => {
    const viewButton = this.shadowObj.querySelector('.actions > .action#view-action');
    const contentArea = this.shadowObj.querySelector('.content#content');

    const handleViewClick = (event) => {
        this._stopEvent(event);
        const url = viewButton?.getAttribute('href'); // Use optional chaining
        if (url) {
            // Assuming this.item should be the postData passed to this function
            this._pushAppState(url, postData);
        } else {
            console.warn('View action button or URL not found.');
        }
    };

    if (contentArea) {
        contentArea.addEventListener('click', handleViewClick);
    }

    if (viewButton) {
        viewButton.addEventListener('click', handleViewClick);
    }
}


  _pushAppState = (url, postData) => {
    // Ensure app and push method exist
    if (this.app && typeof this.app.push === 'function') {
      // Pass structured data if needed by the 'story' view
      this.app.push(url, { kind: "app", name: 'story', data: postData }, url);
      this._navigateToAppView(postData); // Pass data if needed by navigate
    } else {
      console.warn('App or app.push method not available.');
    }
  }

  _navigateToAppView = (postData) => {
    // Ensure app and navigate method exist
    if (this.app && typeof this.app.navigate === 'function') {
      this.app.navigate(postData); // Pass data if needed
    } else {
      console.warn('App or app.navigate method not available.');
    }
  }

  // --- Formatting Helpers ---

  _formatNumber = (n) => {
    const num = parseInt(n, 10);
    if (isNaN(num)) return '0'; // Handle non-numeric input

    const ranges = [
      { divider: 1e9, suffix: 'B' }, // Simplified suffix
      { divider: 1e6, suffix: 'M' },
      { divider: 1e3, suffix: 'k' }
    ];

    for (const range of ranges) {
      if (num >= range.divider) {
        // Basic formatting, adjust precision as needed
        const value = num / range.divider;
        // Simple precision: 1 decimal place if value < 10, else integer
        const precision = (value < 10 && value !== Math.floor(value)) ? 1 : 0;
        return `${value.toFixed(precision)}${range.suffix}`;
      }
    }
    return num.toString();
  }

  // --- Styling Helpers ---

  _styleLastBlock = () => {
    const content = this.shadowObj.querySelector('.content#content');
    if (!content) return;

    // More robustly find the last significant block element, ignoring potential empty text nodes
    const lastBlock = Array.from(content.children).reverse().find(el => el.nodeType === 1); // Find last Element node

    if (lastBlock) {
      // Use CSS classes for styling if possible, otherwise direct styles
      lastBlock.style.setProperty('padding-bottom', '0', 'important'); // Use important if necessary
      lastBlock.style.setProperty('margin-bottom', '0', 'important');
    }
  }

  // --- HTML Template Generators ---

  getTemplate() {
    // Initial structure, content added dynamically
    return /*html*/`
      <div class="welcome">
        <div class="preview">
          ${this.getLoader()} <!-- Start with loader -->
        </div>
      </div>
      ${this.getStyles()}
    `;
  }

   _getLapseTime = (isoDateStr) => {
    try {
        const date = new Date(isoDateStr);
        if (isNaN(date.getTime())) {
            return 'Invalid date'; // Handle invalid date strings
        }
        const now = new Date();
        const diffSeconds = Math.round((now - date) / 1000);
        const diffDays = Math.round(diffSeconds / (60 * 60 * 24));

        const timeFormat = { hour: 'numeric', minute: 'numeric', hour12: true };
        const dateFormatShort = { month: 'short', day: 'numeric' };
        const dateFormatLong = { month: 'short', day: 'numeric', year: 'numeric' };
        const weekdayFormat = { weekday: 'short' };

        const timeStr = date.toLocaleTimeString('en-US', timeFormat);

        if (diffSeconds < 60) return 'Just now';
        if (diffSeconds < 3600) return `${Math.round(diffSeconds / 60)}m ago`;
        if (diffSeconds < 86400 && date.getDate() === now.getDate()) return `Today • ${timeStr}`;
        if (diffSeconds < 172800 && date.getDate() === now.getDate() - 1) return `Yesterday • ${timeStr}`;
        if (diffSeconds < 604800) return `${date.toLocaleDateString('en-US', weekdayFormat)} • ${timeStr}`; // Within a week
        if (date.getFullYear() === now.getFullYear()) return `${date.toLocaleDateString('en-US', dateFormatShort)} • ${timeStr}`; // This year

        return `${date.toLocaleDateString('en-US', dateFormatLong)} • ${timeStr}`; // Older
    } catch (e) {
        console.error("Error formatting date:", isoDateStr, e);
        return 'Date unavailable';
    }
}


  // Renamed for clarity
  _getHeader = (author) => {
    return /*html*/`
      <div class="meta top-meta">
        ${this._getAuthorHover(author)}
      </div>
    `;
  }

  // Renamed for clarity
  _getTimestampHtml = (time) => {
    return /*html*/`
      <div class="meta bottom-meta">
        <time class="time" datetime="${time}">
          ${this._getLapseTime(time)}
        </time>
      </div>
    `;
  }

  // Renamed for clarity
  _getActionsHtml = (likes, views, url, kind) => {
    return /*html*/`
      <div class="actions ${kind} ${this.preview || ''}">
        ${this._getArrowHtml(kind, this.first)}
        <a href="${url}" class="action view" id="view-action">view</a>
        <span class="action stats" id="stats-action">stats</span>
        <span class="action likes plain">
          <span class="no">${this._formatNumber(likes)}</span> <span class="text">likes</span>
        </span>
        <span class="action views plain">
          <span class="no">${this._formatNumber(views)}</span> <span class="text">views</span>
        </span>
      </div>
    `;
  }

  // Renamed for clarity
  _getArrowHtml = (kind, first) => {
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
      `;
    }
    return '';
  }


  getEmpty = () => {
    // Reset classes on the container if it exists
    if (this._contentContainer) {
        this._contentContainer.className = 'preview empty-state'; // Use specific class
    }
    return /* html */`
      <div class="empty">
        <p>Could not load preview.</p>
        <div class="actions">
          <button class="fetch last">Retry</button>
          <span class="action stats" id="stats-action">stats</span> <!-- Keep stats? -->
        </div>
      </div>
    `;
  }

  getLoader() {
    return /* html */`
      <div class="loader-container" id="loader-container">
                <div class="loader"></div>
            </div>
    `;
  }

  _getAuthorHover = (author) => {
    const url = `/u/${author.hash?.toLowerCase()}`; // Optional chaining for safety
    let bio = author.bio ? author.bio.replace(/(\r\n|\n|\r)/gm, '<br>') : 'No bio available.'; // Sanitize line breaks
    // Ensure contact is stringified safely
    const contactJson = author.contact ? JSON.stringify(author.contact).replace(/'/g, '&apos;') : 'null';

    return /* html */`
            <hover-author url="${url}" you="${author.you ? 'true' : 'false'}" hash="${author.hash || ''}"
        picture="${author.picture || ''}" name="${author.name || 'Unknown User'}" contact='${contactJson}'
        posts="${author.posts || 0}" replies="${author.replies || 0}"
        followers="${author.followers || 0}" following="${author.following || 0}" user-follow="${author.is_following ? 'true' : 'false'}"
        verified="${author.verified ? 'true' : 'false'}">
        ${bio}
      </hover-author>
        `;
  }

  // Renamed and combined image logic
  _getImagesHtml = (imageArray) => {
    if (!imageArray || imageArray.length === 0) return '';
    // Ensure imageArray is actually an array and join safely
    const imagesAttr = Array.isArray(imageArray) ? imageArray.join(',') : '';
    if (!imagesAttr) return '';

    return /* html */`
      <images-wrapper images="${imagesAttr}"></images-wrapper>
    `;
  }

  // Renamed for clarity
  _findImagesInContent = (text) => {
    if (!text) return [];
    // Regex to find src attribute in img tags
    const imgRegex = /<img\s+[^>]*?src\s*=\s*(["'])(.*?)\1/gi;
    const matches = [];
    let match;
    while ((match = imgRegex.exec(text)) !== null) {
      matches.push(match[2]); // match[2] contains the URL
    }
    return matches;
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