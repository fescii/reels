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

    // if we are in the same day: Today at HH:MM AM/PM
    if (diff < 1000 * 60 * 60 * 24) {
      return /* html */`
        Today at ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `;
    }

    // if we are in the diff is less than 7 days: DAY AT HH:MM AM/PM
    if (diff < 1000 * 60 * 60 * 24 * 7) {
      return /* html */`
        ${date.toLocaleString('default', { weekday: 'short' })} at ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `;
    }

    // if we are in the same month AND year: 12th APR AT HH:MM AM/PM
    if (new Date().getMonth() === date.getMonth() && new Date().getFullYear() === date.getFullYear()) {
      return /* html */`
        ${date.getDate()}${dayStr} ${date.toLocaleString('default', { month: 'short' })} at ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `;
    }

    // if we are in the same year: 12th Jan at 11:59 PM
    if (new Date().getFullYear() === date.getFullYear()) {
      return /* html */`
        ${date.getDate()}${dayStr} ${date.toLocaleString('default', { month: 'short' })} at ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}
      `;
    }

    // if we are in a different year: 12th Jan 2021 at 11:59 PM
		return /* html */`
      ${date.getDate()}${dayStr} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()} at ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })}
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
              <span class="name">
                <span class="text">${this.getAttribute('user-name')}</span>
                ${this.checkVerified(this.textToBoolean(this.getAttribute('user-verified')))}
              </span>
              <span class="active">
                ${this.getActive(this.textToBoolean(this.getAttribute('active')))}
              </span>
            </span>
          </div>
          <div class="actions">
            ${this.getActions()}
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
        <path id="outer" d="M18.9905 19H19M18.9905 19C18.3678 19.6175 17.2393 19.4637 16.4479 19.4637C15.4765 19.4637 15.0087 19.6537 14.3154 20.347C13.7251 20.9374 12.9337 22 12 22C11.0663 22 10.2749 20.9374 9.68457 20.347C8.99128 19.6537 8.52349 19.4637 7.55206 19.4637C6.76068 19.4637 5.63218 19.6175 5.00949 19C4.38181 18.3776 4.53628 17.2444 4.53628 16.4479C4.53628 15.4414 4.31616 14.9786 3.59938 14.2618C2.53314 13.1956 2.00002 12.6624 2 12C2.00001 11.3375 2.53312 10.8044 3.59935 9.73817C4.2392 9.09832 4.53628 8.46428 4.53628 7.55206C4.53628 6.76065 4.38249 5.63214 5 5.00944C5.62243 4.38178 6.7556 4.53626 7.55208 4.53626C8.46427 4.53626 9.09832 4.2392 9.73815 3.59937C10.8044 2.53312 11.3375 2 12 2C12.6625 2 13.1956 2.53312 14.2618 3.59937C14.9015 4.23907 15.5355 4.53626 16.4479 4.53626C17.2393 4.53626 18.3679 4.38247 18.9906 5C19.6182 5.62243 19.4637 6.75559 19.4637 7.55206C19.4637 8.55858 19.6839 9.02137 20.4006 9.73817C21.4669 10.8044 22 11.3375 22 12C22 12.6624 21.4669 13.1956 20.4006 14.2618C19.6838 14.9786 19.4637 15.4414 19.4637 16.4479C19.4637 17.2444 19.6182 18.3776 18.9905 19Z" stroke="currentColor" stroke-width="1.8" />
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
        <span class="online-status">
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
      <button class="action video" title="Call">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M11 8L13 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M2 11C2 7.70017 2 6.05025 3.02513 5.02513C4.05025 4 5.70017 4 9 4H10C13.2998 4 14.9497 4 15.9749 5.02513C17 6.05025 17 7.70017 17 11V13C17 16.2998 17 17.9497 15.9749 18.9749C14.9497 20 13.2998 20 10 20H9C5.70017 20 4.05025 20 3.02513 18.9749C2 17.9497 2 16.2998 2 13V11Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M17 8.90585L17.1259 8.80196C19.2417 7.05623 20.2996 6.18336 21.1498 6.60482C22 7.02628 22 8.42355 22 11.2181V12.7819C22 15.5765 22 16.9737 21.1498 17.3952C20.2996 17.8166 19.2417 16.9438 17.1259 15.198L17 15.0941" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
      </button>
      <button class="action favorite" title="Favorites">
        <svg class="large" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M13.7276 3.44418L15.4874 6.99288C15.7274 7.48687 16.3673 7.9607 16.9073 8.05143L20.0969 8.58575C22.1367 8.92853 22.6167 10.4206 21.1468 11.8925L18.6671 14.3927C18.2471 14.8161 18.0172 15.6327 18.1471 16.2175L18.8571 19.3125C19.417 21.7623 18.1271 22.71 15.9774 21.4296L12.9877 19.6452C12.4478 19.3226 11.5579 19.3226 11.0079 19.6452L8.01827 21.4296C5.8785 22.71 4.57865 21.7522 5.13859 19.3125L5.84851 16.2175C5.97849 15.6327 5.74852 14.8161 5.32856 14.3927L2.84884 11.8925C1.389 10.4206 1.85895 8.92853 3.89872 8.58575L7.08837 8.05143C7.61831 7.9607 8.25824 7.48687 8.49821 6.99288L10.258 3.44418C11.2179 1.51861 12.7777 1.51861 13.7276 3.44418Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="action search" title="Search">
        <svg class="large" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M12 3.00366C11.4383 3.01203 10.3789 3.03449 9.8294 3.07102C5.64639 3.34908 2.31441 6.72832 2.04024 10.9707C1.98659 11.8009 1.98659 12.6606 2.04024 13.4908C2.1401 15.0359 2.82343 16.4665 3.62791 17.6746C4.09501 18.5203 3.78674 19.5758 3.30021 20.4978C2.94941 21.1625 2.77401 21.4949 2.91484 21.735C3.05568 21.9752 3.37026 21.9828 3.99943 21.9981C5.24367 22.0284 6.08268 21.6757 6.74868 21.1846C7.1264 20.906 7.31527 20.7668 7.44544 20.7508C7.5756 20.7347 7.83177 20.8403 8.34401 21.0512C8.8044 21.2408 9.33896 21.3579 9.8294 21.3905C11.2536 21.4851 12.7435 21.4853 14.1706 21.3905C18.3536 21.1124 21.6856 17.7332 21.9598 13.4908C21.9915 13.0001 22.0044 12.4991 21.9987 11.9999" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M20.2649 7.27042L22 9M21.1714 5.08571C21.1714 3.38152 19.7899 2 18.0857 2C16.3815 2 15 3.38152 15 5.08571C15 6.78991 16.3815 8.17143 18.0857 8.17143C19.7899 8.17143 21.1714 6.78991 21.1714 5.08571Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="action more" title="More">
        <svg class="large" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M12.2422 17V12C12.2422 11.5286 12.2422 11.2929 12.0957 11.1464C11.9493 11 11.7136 11 11.2422 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M11.992 8H12.001" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
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
          border-bottom: var(--border);
          background: var(--background);
          padding: 0;
          padding: 15px 0 10px;
          display: flex;
          flex-flow: column;
          align-items: start;
          flex-wrap: nowrap;
          gap: 5px;
          margin: 0;
          z-index: 6;
          width: 100%;
          position: sticky;
          top: 0;
        }

        header.header > svg {
          position: absolute;
          display: none;
          left: -12px;
          margin: 2px 0 0;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-color);
          cursor: pointer;
          width: 40px;
          height: 40px;
          justify-content: center;
          align-items: center;
        }

        header.header > svg:hover {
          color: var(--accent-color);
        }

        header.header > .contents {
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: space-between;
          flex-wrap: nowrap;
          gap: 10px;
          margin: 0;
          width: 100%;
          position: relative;
        }

        header.header > .contents > .profile {
          width: calc(100% - 100px);
          min-width: calc(100% - 140px);
          max-width: calc(100% - 140px);
          display: flex;
          flex-flow: row;
          align-items: center;
          flex-wrap: nowrap;
          gap: 10px;
        }

        header.header > .contents > .profile > .avatar {
          border: var(--border);
          width: 45px;
          height: 45px;
          max-width: 45px;
          max-height: 45px;
          min-width: 45px;
          min-height: 45px;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        header.header > .contents > .profile > .avatar > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        header.header > .contents > .profile > .avatar > svg {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 80%;
          height: 80%;
          fill: var(--gray-color);
        }

        header.header > .contents > .profile > .info {
          width: calc(100% - 55px);
          min-width: calc(100% - 55px);
          max-width: calc(100% - 55px);
          display: flex;
          flex-flow: column;
          align-items: start;
          flex-wrap: nowrap;
          gap: 0;
        }

        header.header > .contents > .profile > .info > .name {
          font-family: var(--font-main), sans-serif;
          width: 100%;
          min-width: 100%;
          max-width: 100%;
          font-family: var(--font-text), sans-serif;
          font-weight: 500;
          font-size: 1.08rem;
          line-height: 1.4;
          color: var(--text-color);
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 5px;
        }

        header.header > .contents > .profile > .info > .name > .text {
          width: max-content;
          max-width: calc(100% - 23px);
          text-align: start;
          gap: 5px;

          /** add ellipsis */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        header.header > .contents > .profile > .info > .name > svg {
          width: 18px;
          height: 18px;
          margin-bottom: -1px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: var(--white-color);
          fill: var(--accent-color);
        }

        header.header > .contents > .profile > .info > .name > svg > path#outer {
          stroke: var(--accent-color);
          color: var(--accent-color);
        }

        header.header > .contents > .profile > .info > .active {
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 5px;
        }

        header.header > .contents > .profile > .info > .active > .online-status {
          border: var(--border);
          display: flex;
          background: var(--background);
          justify-content: center;
          align-items: center;
          text-align: center;
          height: 14px;
          width: 14px;
          min-width: 14px;
          min-height: 14px;
          max-width: 14px;
          max-height: 14px;
          border-radius: 50%;
          padding: 3px;
          margin-bottom: -1px;
        }

        header.header > .contents > .profile > .info > .active > .online-status > .active {
          width: 8px;
          height: 8px;
          max-width: 8px;
          max-height: 8px;
          min-width: 8px;
          min-height: 8px;
          border-radius: 50%;
          background: var(--accent-linear);
        }

        header.header > .contents > .profile > .info > .active > .online-status > .inactive {
          width: 8px;
          height: 8px;
          max-width: 8px;
          max-height: 8px;
          min-width: 8px;
          min-height: 8px;
          border-radius: 50%;
          background: var(--gray-color);
        }

        header.header > .contents > .profile > .info > .active > .time {
          font-family: var(--font-read), sans-serif;
          font-weight: 500;
          font-size: 0.85rem;
          text-transform: uppercase;
          color: var(--gray-color);
        }

        header.header > .contents > .profile > .info > .active > .time.online {
          color: var(--accent-color);
          text-transform: capitalize;
          font-family: var(--font-text), sans-serif;
        }

        header.header > .contents > .profile > .info > .active > .time.offline {
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 5px;
        }

        header.header > .contents > .profile > .info > .active > .time.offline > .text {
          display: none;
          justify-content: start;
          align-items: center;
          font-family: var(--font-text), sans-serif;
          gap: 5px;
          text-transform: capitalize;
        }

        header.header > .contents > .profile > .info > .active > .time.offline > .date {
          font-family: var(--font-text), sans-serif;
          font-weight: 400;
          font-size: 0.85rem;
          color: var(--gray-color);
        }

        header.header > .contents > .actions {
          margin-bottom: -5px;
          width: 130px;
          min-width: 130px;
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: end;
          flex-wrap: nowrap;
          gap: 10px;
        }

        header.header > .contents > .actions > button {
          border: none;
          display: flex;
          background: var(--background);
          justify-content: center;
          align-items: center;
          padding: 0;
          cursor: pointer;
          color: var(--text-color);
        }

        header.header > .contents > .actions > button:hover {
          color: var(--accent-color);
        }

        header.header > .contents > .actions > button > svg {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 24px;
        }

        header.header > .contents > .actions > button > svg.large {
          width: 22px;
          height: 22px;
        }
       
        @media screen and (max-width: 660px) {
          :host {
            
          }

          /* reset all cursor: pointer to cursor: default */
          a, button, input, label, select, textarea,
          ul.tabs > li.tab, ul.tabs > li.tab.active {
            cursor: default !important;
          }

          header.header {
            border-bottom: var(--border);
            background: var(--background);
            padding: 0;
            padding: 15px 0 10px;
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
            margin: 2px 0 0;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-color);
            cursor: default !important;
            width: 40px;
            height: 40px;
            display: flex;
            justify-content: center;
            align-items: center;
          }
  
          header.header > svg:hover {
            color: var(--accent-color);
          }
  
          header.header > .contents {
            display: flex;
            flex-flow: row;
            align-items: center;
            justify-content: space-between;
            flex-wrap: nowrap;
            gap: 10px;
            margin: 0 0 0 28px;
            width: calc(100% - 28px);
            position: relative;
          }
        }
      </style>
    `;
  }
}