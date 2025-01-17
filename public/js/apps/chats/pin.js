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

  getContent = () => {
    return /* html */`
      <span class="name">
        <span class="text">${this.getAttribute('user-name')}</span>
        ${this.checkVerified(this.textToBoolean(this.getAttribute('user-verified')))}
      </span>
      <span class="message">${this.getAttribute('last-message')}</span>
    `;
  }

  checkVerified = verified => {
    if (verified) {
      return /* html */`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path id="outer" d="M18.9905 19H19M18.9905 19C18.3678 19.6175 17.2393 19.4637 16.4479 19.4637C15.4765 19.4637 15.0087 19.6537 14.3154 20.347C13.7251 20.9374 12.9337 22 12 22C11.0663 22 10.2749 20.9374 9.68457 20.347C8.99128 19.6537 8.52349 19.4637 7.55206 19.4637C6.76068 19.4637 5.63218 19.6175 5.00949 19C4.38181 18.3776 4.53628 17.2444 4.53628 16.4479C4.53628 15.4414 4.31616 14.9786 3.59938 14.2618C2.53314 13.1956 2.00002 12.6624 2 12C2.00001 11.3375 2.53312 10.8044 3.59935 9.73817C4.2392 9.09832 4.53628 8.46428 4.53628 7.55206C4.53628 6.76065 4.38249 5.63214 5 5.00944C5.62243 4.38178 6.7556 4.53626 7.55208 4.53626C8.46427 4.53626 9.09832 4.2392 9.73815 3.59937C10.8044 2.53312 11.3375 2 12 2C12.6625 2 13.1956 2.53312 14.2618 3.59937C14.9015 4.23907 15.5355 4.53626 16.4479 4.53626C17.2393 4.53626 18.3679 4.38247 18.9906 5C19.6182 5.62243 19.4637 6.75559 19.4637 7.55206C19.4637 8.55858 19.6839 9.02137 20.4006 9.73817C21.4669 10.8044 22 11.3375 22 12C22 12.6624 21.4669 13.1956 20.4006 14.2618C19.6838 14.9786 19.4637 15.4414 19.4637 16.4479C19.4637 17.2444 19.6182 18.3776 18.9905 19Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M9 12.8929C9 12.8929 10.2 13.5447 10.8 14.5C10.8 14.5 12.6 10.75 15 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
    } else return '';
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
          <path id="outer-path2" d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      `;
    }
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
          cursor: pointer;
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
          color: var(--white-color);
          fill: var(--accent-color);
        }

        .head > .messages > svg > path#outer-path2 {
          stroke: var(--accent-color);
          color: var(--accent-color);
        }

        .head > .online-status {
          border: var(--border);
          display: flex;
          background: var(--white-color);
          justify-content: center;
          align-items: center;
          height: 16px;
          width: 16px;
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
          background: var(--gray-color);
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
          font-family: var(--font-main), sans-serif;
          font-weight: 500;
          font-size: 1rem;
          line-height: 1.4;
          color: var(--pin-text-color);
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 5px;
        }

        .content > .name > .text {
          width: max-content;
          max-width: calc(100% - 23px);
          text-align: start;
          gap: 5px;

          /** add ellipsis */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .content > .name > svg {
          min-width: 18px;
          max-width: 18px;
          min-height: 18px;
          max-height: 18px;
          width: 18px;
          height: 18px;
          margin-bottom: -1px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--white-color);
          fill: var(--accent-color);
        }

        .content > .name > svg > path#outer {
          stroke: var(--accent-color);
          color: var(--accent-color);
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
            cursor: default !important;
          }
        }
        
      </style>
    `;
  }
}