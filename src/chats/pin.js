export default class PinChat extends HTMLDivElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  strToInteger = str => {
    try {
      const num = parseInt(str);

      if (isNaN(num)) {
        return 0;
      }

      return num;
    } catch (error) {
      return 0;
    }
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
        ${this.getImage(this.getAttribute('user-picture'))}
      </div>
      <span class="head">
        <span class="messages">
          ${this.getUnread(this.strToInteger(this.getAttribute('unread')))}
        </span>
        <span class="online-status">
          ${this.getActive(this.textToBoolean(this.getAttribute('active')))}
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
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
          <path d="M12 2.5a5.5 5.5 0 0 1 3.096 10.047 9.005 9.005 0 0 1 5.9 8.181.75.75 0 1 1-1.499.044 7.5 7.5 0 0 0-14.993 0 .75.75 0 0 1-1.5-.045 9.005 9.005 0 0 1 5.9-8.18A5.5 5.5 0 0 1 12 2.5ZM8 8a4 4 0 1 0 8 0 4 4 0 0 0-8 0Z"></path>
        </svg>
      `;
    } else {
      return /* html */`
        <img src="${image}" alt="avatar">
      `;
    }
  }

  getUnread = num => {
    if(num > 0) {
      return /* html */`<span class="unread">${num}</span>`;
    } else {
      return /* html */`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
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
      return /* html */`
        <span class="inactive"></span>
      `;
    }
  }

  textToBoolean = text => {
    return text === 'true' ? true : false;
  }

  getBackground = isEven => {
    return isEven ? 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)' : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)';
  }

  getStyles = () => {
    return /* css */`
      <style>
        :host {
          border: var(--border);
          background: ${this.getBackground(this.textToBoolean(this.getAttribute('is-even')))};
          display: flex;
          align-items: center;
          flex-direction: column;
          flex-flow: column;
          justify-content: space-between;
          font-family: var(--font-main), sans-serif;
          font-size: 16px;
          width: 140px;
          min-width: 140px;
          height: 170px;
          max-width: 140px;
          max-height: 170px;
          position: relative;
          padding: 0;
          border-radius: 10px;
          overflow: hidden;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -khtml-user-select: none;
        }

        .image {
          z-index: 0;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 20px;
          padding: 0;
        }

        .image > img {
          z-index: 2;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image > svg {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: -18px;
          width: 100%;
          height: 100%;
          fill: var(--gray-color);
        }

        .head {
          box-sizing: border-box;
          z-index: 1;
          padding: 12px 5px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          height: 20px;
        }

        .head > .messages {
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
          margin: 5px 0 0 0;
          min-width: 20px;
          height: 20px;
          background: var(--anchor-color);
          color: var(--white-color);
          font-family: var(--font-read), sans-serif;
          border-radius: 20px;
          font-size: 0.9rem;
        }

        .head > .messages > svg {
          display: flex;
          justify-content: center;
          align-items: center;
          width: max-content;
          margin: 5px 0 0 0;
          min-width: 20px;
          height: 20px;
          color: var(--anchor-color);
          fill: var(--background);
        }

        .head > .online-status {
          border: var(--border);
          display: flex;
          background: var(--background);
          justify-content: center;
          align-items: center;
          height: 14px;
          width: 14px;
          border-radius: 50%;
        }

        .head > .online-status > .active {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--accent-linear);
        }

        .head > .online-status > .inactive {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--gray-background);
        }

        .content {
          z-index: 1;
          display: flex;
          background: var(--pin-linear-gradient);
          flex-direction: column;
          justify-content: flex-end;
          align-items: start;
          width: 100%;
          max-width: 100%;
          min-width: 100%;
          height: 100px;
          padding: 5px 8px;
        }

        .content > .name {
          width: 100%;
          background: transparent;
          font-size: 1rem;
          color: var(--pin-text-color);
          font-family: var(--font-read), sans-serif;
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
          background: transparent;
          font-size: 0.85rem;
          color: var(--pin-gray-color);
          font-family: var(--font-read), sans-serif;
          font-weight: 400;
          /** add ellipsis */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media all and (max-width: 660px) {
          :host {
            width: 150px;
            height: 200px;
            max-width: 150px;
            min-width: 150px;
            max-height: 200px;
            min-height: 200px;
          }
        }
        
      </style>
    `;
  }
}