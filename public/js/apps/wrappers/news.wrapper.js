export default class NewsWrapper extends HTMLElement {
  constructor() {
    super();
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.activateActions();
  }

  activateActions = () => {
    const viewAction = this.shadowObj.querySelector('#view-action');
    const sourceAction = this.shadowObj.querySelector('#source-action');

    if(!viewAction || !sourceAction) return;

    viewAction.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.openUrl(viewAction.getAttribute('href'));
    });

    sourceAction.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      this.openUrl(sourceAction.getAttribute('href'));
    });
  }

  openUrl = url => {
    let linkPopUp = `<url-popup url="${url}"></url-popup>`

    // open the popup
    document.body.insertAdjacentHTML('beforeend', linkPopUp);
  }

  // Get lapse time
  getLapseTime = isoDateStr => {
    const dateIso = new Date(isoDateStr); // ISO strings with timezone are automatically handled
    let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert posted time to the current timezone
    const date = new Date(dateIso.toLocaleString('en-US', { timeZone: userTimezone }));

    // Get the current time
    const currentTime = new Date();

    // Get the difference in time
    const timeDifference = currentTime - date;

    // Get the seconds
    const seconds = timeDifference / 1000;

    // check if seconds is less than 604800: Friday, 11:30 AM
    if (seconds <= 604800) {
      return `
        ${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    }

    // Check if the date is in the current year and seconds is less than 31536000: Dec 12, 11:30 AM
    if (seconds < 31536000 && date.getFullYear() === currentTime.getFullYear()) {
      return `
        ${date.toLocaleDateString('en-US', { weekday: 'short' })}, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
    } else {
      return `
        ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} • ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `
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
    // Get name and check if it's greater than 20 characters
    let name = this.getAttribute('news-title');
    // Replace - with space and capitalize first letter of the first word using regex: heath-care becomes Heath care
    name = name.toLowerCase().replace(/-/g, ' ');
    
    // Capitalize the first letter of the first word
    const formattedName = name.replace(/^\w/, c => c.toUpperCase());

    return /* html */ `
      <div class="topic">
        <div class="header">
          <h4 class="name">
            <span class="name">${formattedName}</span>
          </h4>
          <p class="top-desc">${this.getAttribute('description') ? this.getAttribute('description') : this.getContent()}</p>
        </div>
        <!--<div class="content">
          <div class="image"><img src="${this.getAttribute('image')}" alt="${this.getAttribute('news-title')}"></div>
          <p class="description">${this.getContent()}</p>
        </div>-->
        ${this.getOn()}
        <div class="actions">
          ${this.getActions()}
        </div>
      </div>
    `
  }

  getContent = () => {
    // get innerHTML
    const innerHTML = this.getAttribute('content');
    innerHTML.trim();
    if (!innerHTML || innerHTML.length <= 0 || innerHTML === null || innerHTML === "null") return '';
    // remove tags and &gt; and &lt;
    let description = innerHTML.replace(/<[^>]*>/g, '').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
    // Check if the description is greater than 100 characters: replace the rest with ...
    let displayDescription = description.length > 120 ? `${description.substring(0, 120)}...` : description;

    return displayDescription;
  }

  getActions = () => {
    const url = this.getAttribute('url');
    // extract source url from the url in format of https://www.example.com || https://example.com || https://sub.domain.ext || https://domain.ext
    const source = url.match(/https?:\/\/(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z0-9-]+)/)[0];
    return /*html*/` 
      <a href="${url}" class="action view" id="view-action">view</a>
      <a href="${source}" class="action source" id="source-action">source</a>
		`
  }

  getOn = () => {
    return /*html*/`
      <div class="meta bottom-meta">
        <span class="source">${this.getAttribute('source')}</span>
        <span class="sp">•</span>
        <time class="time" datetime="${this.getAttribute('time')}">
          ${this.getLapseTime(this.getAttribute('time'))}
        </time>
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
          border-bottom: var(--border);
          padding: 10px 0 15px;
          width: 100%;
          display: flex;
          align-items: center;
          flex-flow: column;
          gap: 8px;
        }

        .topic {
          display: flex;
          width: 100%;
          padding: 0;
          display: flex;
          width: 100%;
          flex-flow: column;
          gap: 0;
        }

        .topic > .header {
          display: flex;
          width: 100%;
          flex-flow: column;
          gap: 0;
          padding: 0;
        }
        
        .topic > .header > h4.name {
          margin: 0;
          display: flex;
          align-items: center;
          color: var(--title-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1.15rem;
          line-height: 1.3;
          font-weight: 500;
          break-word: break-all;
          word-wrap: break-word;
        }
        
        .topic > .header > p.top-desc {
          color: var(--gray-color);
          font-family: var(--font-read), sans-serif;
          font-size: 0.85rem;
          font-weight: 400;
          text-decoration: none;
          display: flex;
          gap: 2px;
          padding: 2px 0 0 0;
          align-items: center;
        }

        div.content {
          display: flex;
          width: 100%;
          flex-flow: row;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 8px 0 0;
        }

        div.content > .image {
          display: none;
          width: 100%;
          align-items: center;
          justify-content: center;
          width: 70px;
          min-width: 70px;
          height: 70px;
          gap: 0;
          padding: 0;
        }

        div.content > .image > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        div.content > p.description {
          width: calc(100% - 80px);
          width: 100%;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.93rem;
          font-weight: 400;
          margin: 0;
          line-height: 1.3;
          padding: 0;
          margin: 5px 0;
        }

        .meta.bottom-meta {
          margin:  0;
          padding: 5px 0 0;
          display: flex;
          position: relative;
          color: var(--gray-color);
          align-items: center;
          font-family: var(--font-read), sans-serif;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .meta.bottom-meta > .sp {
          font-size: 1.25rem;
          color: var(--gray-color);
          font-weight: 400;
        }

        div.actions {
          display: flex;
          flex-flow: row;
          width: 100%;
          gap: 10px;
          margin: 10px 0 0 0;
          padding: 0;
        }
        
        div.actions > .action {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          height: max-content;
          width: max-content;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
          background: var(--accent-linear);
          color: var(--white-color);
          font-weight: 500;
          font-size: 0.9rem;
          line-height: 1.3;
          font-weight: 500;
          font-family: var(--font-text), sans-serif;
          cursor: pointer;
          outline: none;
          border: none;
          text-transform: lowercase;
        }
        
        div.actions > .action.contribute,
        div.actions > .action.view,
        div.actions > .action.source {
          padding: 4px 10px;
          background: none;
          border: var(--border-button);
          color: var(--gray-color);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .stats {
          color: var(--gray-color);
          display: flex;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 5px;
          padding: 0;
          margin: 5px 0;
        }

        .stats > span.sp {
          margin: 0 0 0px 0;
          font-size: 0.8rem;
        }

        .stats > .stat {
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .stats > .stat > .label {
          color: var(--gray-color);
          font-family: var(--font-main), sans-serif;
          text-transform: lowercase;
          font-size: 0.93rem;
          font-weight: 400;
        }

        .stats > .stat > .number {
          color: var(--highlight-color);
          font-family: var(--font-main), sans-serif;
          font-size: 0.9rem;
          font-weight: 500;
        }     

        @media screen and (max-width:660px) {
          :host {
            font-size: 16px;
          }

          button.action,
          div.actions > .action,
          a {
            cursor: default !important;
          }
      </style>
    `;
  }
}