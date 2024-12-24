export default class PinChat extends HTMLDivElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  getTemplate = () => {
    return /* html */`
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    return /* html */`
      <div class="image">
        ${this.getImage(this.getAttribute('user-profile'))}
      </div>
      <span class="head">
        <span class="messages">
          ${this.getUnread(2)}
        </span>
        <span class="online-status">
          ${this.getActive(true)}
        </span>
      </span>
      <span class="content">
        ${this.getContent()}
      </span>
    `;
  }

  getImage = image => {
    if (!image || image === '' || image === 'null') {
      return /* html */`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
          <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" stroke-width="1.5" />
          <path d="M12 6C14.7614 6 17 8.23858 17 11C17 13.7614 14.7614 16 12 16C9.23858 16 7 13.7614 7 11C7 8.23858 9.23858 6 12 6Z" stroke="currentColor" stroke-width="1.5" />
        </svg>
      `;
    } else {
      return /* html */`
        <img src="${image}" alt="avatar"
      `;
    }
  }

  getUnread = num => {
    if(num > 0) {
      return /* html */`<span class="unread">${num}</span>`;
    } else {
      return /* html */`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
          <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" stroke-width="1.5" />
          <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
    }
  }

  getContent = () => {
    return /* html */`
      <span class="name">${this.getAttribute('user-name')}</span>
      <span class="message">${this.getAttribute('last-message')}</span>
    `;
  }

  getActive = active => {
    if (active) {
      return /* html */`
        <span class="active"></span>
      `;
    } else {
      return '';
    }
  }

  getStyles = () => {
    return /* css */`
      <style>
        :host {
          border: 1px solid red;
          display: flex;
          align-items: center;
          flex-direction: column;
          flex-flow: column;
          justify-content: space-between;
          font-family: var(--font-main), sans-serif;
          font-size: 16px;
          width: 140px;
          height: 150px;
          max-width: 140px;
          max-height: 150px;
          position: relative;
        }

        .image {
          width: 100%;
          height: 100px;
          display: none;
          justify-content: center;
          align-items: center;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 20px;
        }

        .image > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .head {
          border: 1px solid blue;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          height: 20px;
        }

        .head > .messages {
          border: 1px solid green;
          display: flex;
          justify-content: center;
          align-items: center;
          height: max-content;
        }

        .head > .messages > .unread {
          display: flex;
          justify-content: center;
          align-items: center;
          width: max-content;
          min-width: 20px;
          height: 20px;
          background: var(--accent-linear);
          color: var(--white-color);
          font-family: var(--font-main), sans-serif;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .head > .online-status {
          border: var(--border);
          display: flex;
          background: var(--background);
          justify-content: center;
          align-items: center;
          height: 16px;
          width: 16px;
          border-radius: 50%;
        }

        .head > .online-status > .active {
          width: 80%;
          height: 80%;
          border-radius: 50%;
          background: var(--accent-linear);
        }

        .content {
          border: 1px solid yellow;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: start;
          width: 100%;
          max-width: 100%;
          height: 100px;
        }

        .content > .name {
          width: 100%;
          font-size: 1rem;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-weight: 500;
          line-height: 1.4;
          /** add ellipsis */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .content > .message {
          display: inline-block;
          width: 100%;
          font-size: 0.85rem;
          color: var(--gray-color);
          font-family: var(--font-main), sans-serif;
          font-weight: 400;
          /** add ellipsis */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
      </style>
    `;
  }
}