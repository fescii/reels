export default class MessagingContainer extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.active_tab = null;
    this.render();
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  connectedCallback() {
  }

  textToBoolean = text => {
    return text === 'true' ? true : false;
  }

  formatNumber = numStr => {
    try {
      const num = parseInt(numStr);

      // less than a thousand: return the number
      if (num < 1000) return num;

      // less than a 10,000: return the number with a k with two decimal places
      if (num < 10000) return `${(num / 1000).toFixed(2)}k`;

      // less than a 100,000: return the number with a k with one decimal place
      if (num < 100000) return `${(num / 1000).toFixed(1)}k`;

      // less than a million: return the number with a k with no decimal places
      if (num < 1000000) return `${Math.floor(num / 1000)}k`;

      // less than a 10 million: return the number with an m with two decimal places
      if (num < 10000000) return `${(num / 1000000).toFixed(2)}M`;

      // less than a 100 million: return the number with an m with one decimal place
      if (num < 100000000) return `${(num / 1000000).toFixed(1)}M`;

      // less than a billion: return the number with an m with no decimal places
      if (num < 1000000000) return `${Math.floor(num / 1000000)}M`;

      // a billion or more: return the number with a B+
      if (num >= 1000000000) return `${Math.floor(num / 1000000000)}B+`;

      // else return the zero
      return '0';
    } catch (error) {
      return '0';
    }
  }

  formatDateTime = str => {
		const date = new Date(str);

		// get th, st, nd, rd for the date
		const day = date.getDate();
		const dayStr = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
		const diff = new Date() - date;

    // if we are in the same minute: Just now
    if (diff < 1000 * 60) {
      return 'Just now';
    }

    // if we are in the same day: HH:MM AM/PM
    if (diff < 1000 * 60 * 60 * 24) {
      return date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true });
    }

    // if we are in the diff is less than 7 days: DAY HH:MM AM/PM
    if (diff < 1000 * 60 * 60 * 24 * 7) {
      return /* html */`
        ${date.toLocaleString('default', { weekday: 'short' })} ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `;
    }

    // if we are in the same month AND year: 12th HH:MM AM/PM
    if (new Date().getMonth() === date.getMonth() && new Date().getFullYear() === date.getFullYear()) {
      return /* html */`
        ${date.getDate()}${dayStr} ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `;
    }

    // if we are in the same year: 12th Jan
    if (new Date().getFullYear() === date.getFullYear()) {
      return /* html */`
        ${date.getDate()}${dayStr} ${date.toLocaleString('default', { month: 'short' })}
      `;
    }

    // if we are in a different year: 12th Jan 2021
		return /* html */`
      ${date.getDate()}${dayStr} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}
    `;
	}

  getTemplate() {
    return /* html */`
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    return /* html */`
      ${this.getHeader()}
    `;
  }

  getHeader = () => {
    return /*html*/`
      <header class="header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M15.28 5.22a.75.75 0 0 1 0 1.06L9.56 12l5.72 5.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 1.06 0Z"></path>
        </svg>
        <div class="contents">
          <div class="profile">
            <div class="avatar">
              ${this.getImage(this.getAttribute('user-picture'))}
            </div>
            <span class="info">
              <span class="name">${this.getAttribute('user-name')}</span>
              <span class="active">
                ${this.getActive(this.textToBoolean(this.getAttribute('active')))}
              </span>
            </span>
          </div>
          <div class="actions">
          </div>
        </div>
      </header>
    `
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

  checkVerified = verified => {
    if (verified) {
      return /* html */`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
        <path d="M18.9905 19H19M18.9905 19C18.3678 19.6175 17.2393 19.4637 16.4479 19.4637C15.4765 19.4637 15.0087 19.6537 14.3154 20.347C13.7251 20.9374 12.9337 22 12 22C11.0663 22 10.2749 20.9374 9.68457 20.347C8.99128 19.6537 8.52349 19.4637 7.55206 19.4637C6.76068 19.4637 5.63218 19.6175 5.00949 19C4.38181 18.3776 4.53628 17.2444 4.53628 16.4479C4.53628 15.4414 4.31616 14.9786 3.59938 14.2618C2.53314 13.1956 2.00002 12.6624 2 12C2.00001 11.3375 2.53312 10.8044 3.59935 9.73817C4.2392 9.09832 4.53628 8.46428 4.53628 7.55206C4.53628 6.76065 4.38249 5.63214 5 5.00944C5.62243 4.38178 6.7556 4.53626 7.55208 4.53626C8.46427 4.53626 9.09832 4.2392 9.73815 3.59937C10.8044 2.53312 11.3375 2 12 2C12.6625 2 13.1956 2.53312 14.2618 3.59937C14.9015 4.23907 15.5355 4.53626 16.4479 4.53626C17.2393 4.53626 18.3679 4.38247 18.9906 5C19.6182 5.62243 19.4637 6.75559 19.4637 7.55206C19.4637 8.55858 19.6839 9.02137 20.4006 9.73817C21.4669 10.8044 22 11.3375 22 12C22 12.6624 21.4669 13.1956 20.4006 14.2618C19.6838 14.9786 19.4637 15.4414 19.4637 16.4479C19.4637 17.2444 19.6182 18.3776 18.9905 19Z" stroke="currentColor" stroke-width="1.8" />
        <path d="M9 12.8929C9 12.8929 10.2 13.5447 10.8 14.5C10.8 14.5 12.6 10.75 15 9.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      `;
    } else return '';
  }

  getActive = active => {
    if (active) {
      return /* html */`
        <span class="online-status">
          <span class="active"></span>
        </span>
        <span class="time online">online</span>
      `;
    } else {
      return /* html */`
        <span class="online-status"></span>
          <span class="inactive"></span>
        </span>
        <span class="time offline">
          <span class="text">Seen</span>
          <span class="date">${this.formatDateTime(this.getAttribute('last-active'))}</span>
        </span>
      `;
    }
  }

  getActions = () => {
    return /* html */`
      <button class="action video">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M11 8L13 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M2 11C2 7.70017 2 6.05025 3.02513 5.02513C4.05025 4 5.70017 4 9 4H10C13.2998 4 14.9497 4 15.9749 5.02513C17 6.05025 17 7.70017 17 11V13C17 16.2998 17 17.9497 15.9749 18.9749C14.9497 20 13.2998 20 10 20H9C5.70017 20 4.05025 20 3.02513 18.9749C2 17.9497 2 16.2998 2 13V11Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M17 8.90585L17.1259 8.80196C19.2417 7.05623 20.2996 6.18336 21.1498 6.60482C22 7.02628 22 8.42355 22 11.2181V12.7819C22 15.5765 22 16.9737 21.1498 17.3952C20.2996 17.8166 19.2417 16.9438 17.1259 15.198L17 15.0941" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
    `;
  }

  getStyles = () => {
    return /* css */`
      <style>
        :host {
          display: flex;
          max-width: 100%;
          width: 100%;
          min-width: 100%;
          padding: 0;
          height: 100dvh;
          max-height: 100vh;
          display: flex;
          flex-direction: row;
          align-items: start;
          justify-content: space-between;
          gap: 20px;
        }

        * {
          box-sizing: border-box;
          font-family: var(--font-main), sans-serif;
        }

        header.header {
          border: thin solid red;
          background: var(--background);
          padding: 0;
          padding: 10px 0 10px;
          display: flex;
          flex-flow: column;
          align-items: start;
          flex-wrap: nowrap;
          gap: 5px;
          margin: 0 0 0 28px;
          z-index: 6;
          width: 100%;
          position: sticky;
          top: 0;
        }

        header.header > svg {
          position: absolute;
          display: flex;
          left: -12px;
          top: calc(50% - 15px);
          color: var(--text-color);
          cursor: pointer;
          width: 40px;
          height: 40px;
        }

        header.header > svg:hover {
          color: var(--accent-color);
        }
       
        @media screen and (max-width: 660px) {
          :host {
            
          }

          /* reset all cursor: pointer to cursor: default */
          a, button, input, label, select, textarea,
          ul.tabs > li.tab, ul.tabs > li.tab.active {
            cursor: default !important;
          }

          form.header > .contents {
            padding: 0;
            display: flex;
            flex-flow: row;
            align-items: center;
            flex-wrap: nowrap;
            gap: 0;
            margin: 0 0 0 28px;
            width: calc(100% - 28px);
            position: relative;
          }

          form.header > svg {
            position: absolute;
            display: flex;
            left: -12px;
            top: calc(50% - 15px);
            color: var(--text-color);
            cursor: pointer;
            width: 40px;
            height: 40px;
          }
        }
      </style>
    `;
  }
}