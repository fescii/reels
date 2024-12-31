export default class ChatItem extends HTMLDivElement {
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
      // check if dates are the same
      if (new Date().getDate() === date.getDate()) {
        // if we are in the same hour: 36m ago
        if (diff < 1000 * 60 * 60) {
          return `${Math.floor(diff / 1000 / 60)}m Ago`;
        }

        // if we are in the same day: 6h ago
        if (diff < 1000 * 60 * 60 * 24) {
          return `${Math.floor(diff / 1000 / 60 / 60)}h Ago`;
        }

        return /* html */`
          ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true }).toUpperCase()}
        `;
      } else {
        return /* html */`
          ${date.toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true }).toUpperCase()}
        `;
      }
    }

    // if we are in the diff is less than 7 days: DAY AT HH:MM AM/PM
    if (diff < 1000 * 60 * 60 * 24 * 7) {
      return /* html */`
        ${date.toLocaleString('default', { weekday: 'short' })}
      `;
    }

    // if we are in the same month AND year: 12th APR AT HH:MM AM/PM
    if (new Date().getMonth() === date.getMonth() && new Date().getFullYear() === date.getFullYear()) {
      return /* html */`
        ${date.getDate()}${dayStr} ${date.toLocaleString('default', { month: 'short' })}
      `;
    }

    // if we are in the same year: 12th Jan at 11:59 PM
    if (new Date().getFullYear() === date.getFullYear()) {
      return /* html */`
        ${date.getDate()}${dayStr} ${date.toLocaleString('default', { month: 'short' })}
      `;
    }

    // if we are in a different year: 12th Jan 2021 at 11:59 PM
		return /* html */`
      ${date.getDate()}${dayStr} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}
    `;
	}
  
  getLapseTime = date => {
    try {
      date = new Date(date);
      const now = new Date();
      const diff = now - date;
      const seconds = diff / 1000;
      const minutes = seconds / 60;
      const hours = minutes / 60;
      const days = hours / 24;
      const weeks = days / 7;
      const months = weeks / 4;
      const years = months / 12;

      if (seconds < 60) {
        return `${Math.floor(seconds)}s`;
      } else if (minutes < 60) {
        return `${Math.floor(minutes)}m`;
      } else if (hours < 24) {
        return `${Math.floor(hours)}h`;
      } else if (days < 7) {
        return `${Math.floor(days)}d`;
      } else if (weeks < 4) {
        return `${Math.floor(weeks)}w`;
      } else if (months < 12) {
        return `${Math.floor(months)}mo`;
      } else {
        return `${Math.floor(years)}y`;
      }
    } catch (error) {
      return 'Today';
    }
  }

  getTemplate = () => {
    return /* html */`
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    let unread = this.strToInteger(this.getAttribute('unread')) > 0 ? 'unread' : '';
    const opened = this.textToBoolean(this.getAttribute('opened')) ? 'opened' : '';
    const recieved = this.textToBoolean(this.getAttribute('recieved'));
    const you = this.textToBoolean(this.getAttribute('you'));
    if (you) unread = '';
    return /* html */`
      <div class="wrapper ${unread} ${opened}">
        <div class="image">
          <span class="online-status">
            ${this.getActive(this.textToBoolean(this.getAttribute('active')))}
          </span>
          <div class="avatar">
            ${this.getImage(this.getAttribute('user-picture'))}
          </div>
        </div>
        <div class="content">
          <span class="head">
            <span class="name">
              <span class="text">${this.getAttribute('user-name')}</span>
              ${this.checkVerified(this.textToBoolean(this.getAttribute('user-verified')))}
            </span>
            <span class="time">${this.formatDateTime(this.getAttribute('datetime'))}</span>
          </span>
          <span class="text">
            ${this.getUnread(you,this.strToInteger(this.getAttribute('unread')), recieved)}
            ${this.getYou(this.textToBoolean(this.getAttribute('you')))}
            <span class="message">${this.getAttribute('message')}</span>
            ${this.getUnreadMessages(you, this.strToInteger(this.getAttribute('unread')))}
          </span>
          ${this.getAttachements()}
          ${this.getImages()}
        </div>
      </div>
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

  getUnreadMessages = (you, unread) => {
    if (!you && unread > 0) {
      return /* html */`
        <span class="unread-no">${unread}</span>
      `;
    } else {
      return '';
    }
  }

  getUnread = (you, num, recieved) => {
    if(!you) return '';

    if (recieved) {
      return /* html */`
        <span class="tick recieved">
          ${this.getStatusIcon('delivered')}
        </span>
      `;
    } 

    if(num > 0 ) {
      return /* html */`
      <span class="tick unread">
        ${this.getStatusIcon('sent')}
      </span>
      `;
    } else {
      return /* html */`
      <span class="tick read">
        ${this.getStatusIcon('seen')}
      </span>
      `;
    }
  }

  getStatusIcon = kind  => {
    const icons = {
      sent: this.getSentIcon(),
      delivered: this.getDeliveredIcon(),
      seen: this.getSeenIcon(),
      sending: this.getSendingIcon(),
    }
    return icons[kind];
  }

  getDeliveredIcon = () => {
    return /* html */`
      <svg width="22" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#messagestatus-delivered__a)" fill="currentColor"><path d="M6 0c.67 0 1.316.11 1.918.313-.36.26-.695.552-1 .873a4.9 4.9 0 1 0 0 9.628c.305.321.64.614 1 .873A6 6 0 1 1 6 0Z"/><path d="m4.19 5.92.899 1.199c.09.556.244 1.09.456 1.595a.55.55 0 0 1-.735-.134l-1.5-2a.55.55 0 0 1 .88-.66Zm10.109-2.382a.55.55 0 0 1 .163.76l-2.75 4.25a.55.55 0 0 1-.902.032l-1.5-2a.55.55 0 0 1 .88-.66l1.027 1.369 2.321-3.588a.55.55 0 0 1 .76-.163Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M6 6a6 6 0 1 1 12 0A6 6 0 0 1 6 6Zm6-4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Z"/></g><defs><clipPath id="messagestatus-delivered__a"><path fill="#fff" d="M0 0h18v12H0z"/></clipPath></defs></svg>
    `;
  }

  getSeenIcon = () => {
    return /* html */`
      <svg width="22" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#messagestatus-read__a)" fill="currentColor"><path d="M6 .25c.688 0 1.348.12 1.96.342A6.74 6.74 0 0 0 5.34 7.1l-.123.189L4.19 5.92a.55.55 0 1 0-.88.66l1.5 2a.55.55 0 0 0 .902-.031l.022-.034a6.77 6.77 0 0 0 2.225 2.893A5.75 5.75 0 1 1 6 .25Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 .25a5.75 5.75 0 1 0 0 11.5 5.75 5.75 0 0 0 0-11.5Zm2.299 3.288a.55.55 0 0 1 .163.76l-2.75 4.25a.55.55 0 0 1-.902.032l-1.5-2a.55.55 0 1 1 .88-.66l1.027 1.369 2.321-3.588a.55.55 0 0 1 .76-.163Z"/></g><defs><clipPath id="messagestatus-read__a"><path fill="#fff" d="M0 0h18v12H0z"/></clipPath></defs></svg>
    `;
  }

  getSendingIcon = () => {
    return /* html */`
      <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#messagestatus-sending__a)" fill="currentColor"><path d="M6.188 1.104a4.858 4.858 0 0 0-.376 0 .55.55 0 1 1-.042-1.1c.153-.006.307-.005.461 0a.55.55 0 1 1-.043 1.1ZM8.055.922a.55.55 0 0 1 .743-.23c.136.072.27.149.4.231a.55.55 0 1 1-.587.93 4.86 4.86 0 0 0-.326-.188.55.55 0 0 1-.23-.743Zm-4.11.001a.55.55 0 0 1-.23.743c-.112.059-.22.121-.326.188a.55.55 0 1 1-.586-.931 5.45 5.45 0 0 1 .4-.23.55.55 0 0 1 .742.23Zm6.374 1.707a.55.55 0 0 1 .758.173c.082.13.159.263.23.4a.55.55 0 1 1-.973.512 4.858 4.858 0 0 0-.188-.327.55.55 0 0 1 .173-.758Zm-8.637 0a.55.55 0 0 1 .172.76c-.068.106-.13.215-.189.325a.55.55 0 0 1-.973-.513c.072-.136.149-.27.232-.4a.55.55 0 0 1 .758-.172ZM.576 5.24a.55.55 0 0 1 .528.572 4.858 4.858 0 0 0 0 .377.55.55 0 1 1-1.1.042 5.958 5.958 0 0 1 0-.462.55.55 0 0 1 .572-.528Zm10.849 0a.55.55 0 0 1 .57.53c.007.153.007.307 0 .461a.55.55 0 0 1-1.099-.043 4.873 4.873 0 0 0 0-.377.55.55 0 0 1 .53-.57ZM.923 8.055a.55.55 0 0 1 .743.23c.059.112.121.22.188.327a.55.55 0 1 1-.931.585 5.955 5.955 0 0 1-.23-.4.55.55 0 0 1 .23-.742Zm10.155 0a.55.55 0 0 1 .23.743 5.994 5.994 0 0 1-.231.4.55.55 0 0 1-.93-.587 5.08 5.08 0 0 0 .188-.326.55.55 0 0 1 .743-.23ZM2.63 10.318a.55.55 0 0 1 .76-.172c.106.068.215.13.325.189a.55.55 0 1 1-.513.973 5.952 5.952 0 0 1-.4-.232.55.55 0 0 1-.171-.758Zm6.74.001a.55.55 0 0 1-.172.758 5.45 5.45 0 0 1-.4.23.55.55 0 1 1-.512-.973c.111-.059.22-.121.326-.188a.55.55 0 0 1 .758.173Zm-4.129 1.105a.55.55 0 0 1 .571-.528c.126.005.252.005.377 0a.55.55 0 1 1 .042 1.1 5.975 5.975 0 0 1-.462 0 .55.55 0 0 1-.528-.572Z"/></g><defs><clipPath id="messagestatus-sending__a"><path fill="#fff" d="M0 0h12v12H0z"/></clipPath></defs></svg>
    `;
  }

  getSentIcon = () => {
    return /* html */`
      <svg width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#messagestatus-sent__a)" fill="currentColor"><path d="M8.462 4.299a.55.55 0 0 0-.924-.598L5.217 7.29 4.19 5.92a.55.55 0 0 0-.88.66l1.5 2a.55.55 0 0 0 .902-.031l2.75-4.25Z"/><path fill-rule="evenodd" clip-rule="evenodd" d="M6 0a6 6 0 1 0 0 12A6 6 0 0 0 6 0ZM1.1 6a4.9 4.9 0 1 1 9.8 0 4.9 4.9 0 0 1-9.8 0Z"/></g><defs><clipPath id="messagestatus-sent__a"><path fill="#fff" d="M0 0h12v12H0z"/></clipPath></defs></svg>
    `;
  }

  getYou = you => {
    if (you) {
      return /* html */`
        <span class="you">You:</span>
      `;
    } else {
      return '';
    }
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

  getImages = () => {
   const images = this.imagesArray();

    if (images.length < 1) return '';

    const innerImages = images.map(image => {
      return /* html */`
        <div class="image">
          <img src="${image}" alt="Image attachment">
        </div>
      `;
    }).join('');

    return /* html */`
      <div class="images">
        ${innerImages}
      </div>
    `;
  }

  imagesArray = () => {
    const images = this.getAttribute('images');

    if (!images || images === '' || images === 'null') {
      return [];
    } else {
      try {
        return images.split(',');
      } catch (error) {
        // console.error('Error parsing images', error);
        return [];
      }
    }
  }

  getAttachements = () => {
    const attachements = this.attachementsArray();

    if (attachements.length < 1) return '';

    const innerAttachements = attachements.map(attachement => {
      return /* html */`
        <a href="${attachement.link}" target="_blank" download
          title="${attachement.name}" size="${attachement.size}" type="${attachement.type}">
          ${attachement.name}
        </a>
      `;
    }).join('');

    return /* html */`
      <div class="attachements">
        ${innerAttachements}
      </div>
    `;
  }

  attachementsArray = () => {
    const attachements = this.getAttribute('attachments');

    if (!attachements || attachements === '' || attachements === 'null') {
      return [];
    } else {
      try {
        return JSON.parse(attachements);
      } catch (error) {
        // console.error('Error parsing attachments', error);
        return [];
      }
    }
  }

  getStyles = () => {
    return /* css */`
      <style>
        :host {
          /* border: 1px solid blue;*/
          display: flex;
          font-family: var(--font-main), sans-serif;
          font-size: 16px;
          width: 100%;
          display: flex;
          justify-content: start;
          align-items: center;
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

        .wrapper {
          display: flex;
          align-items: start;
          justify-content: space-between;
          width: 100%;
          cursor: pointer;
          gap: 10px;
          padding: 10px 0;
          transition: all 0.3s ease;
        }

        .wrapper.opened {
          padding: 10px 5px 10px 8px;
          border-radius: 10px;
          position: relative;
        }

        .wrapper.opened::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          width: 2px;
          height: 80%;
          transition: all 0.3s ease;
          transform: translateY(-50%);
          background: var(--action-linear);
          border-radius: 10px;
        }

        .wrapper:hover {
          background: var(--chat-background);
          border-radius: 10px;
          padding: 10px 5px;
        }

        .wrapper > .image {
          border: var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 45px;
          height: 45px;
          min-width: 45px;
          min-height: 45px;
          border-radius: 50px;
          position: relative;
        }

        .wrapper > .image > .avatar {
          width: 100%;
          height: 100%;
          min-width: 100%;
          max-width: 100%;
          min-height: 100%;
          max-height: 100%;
          border-radius: 50px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .wrapper > .image > .avatar > img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        .wrapper > .image > .avatar > svg {
          width: 80%;
          height: 80%;
          display: flex;
          justify-content: center;
          align-items: center;
          fill: var(--gray-color);
        }

        .wrapper > .image > .online-status {
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
          position: absolute;
          top: 0;
          right: -2px;
        }

        .wrapper > .image > .online-status > .active {
          width: 8px;
          height: 8px;
          max-width: 8px;
          max-height: 8px;
          min-width: 8px;
          min-height: 8px;
          border-radius: 50%;
          background: var(--accent-linear);
        }

        .wrapper > .image > .online-status > .inactive {
          width: 8px;
          height: 8px;
          max-width: 8px;
          max-height: 8px;
          min-width: 8px;
          min-height: 8px;
          border-radius: 50%;
          background: var(--gray-color);
        }

        .wrapper > .content {
          display: flex;
          flex-direction: column;
          width: calc(100% - 60px);
          max-width: calc(100% - 60px);
          min-width: calc(100% - 60px);
          gap: 0;
          position: relative;
        }

        .wrapper > .content > .head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          max-width: 100%;
          gap: 5px;
        }

        .wrapper > .content > .head > .name {
          font-family: var(--font-main), sans-serif;
          width: calc(100% - 105px);
          max-width: calc(100% - 105px);
          min-width: calc(100% - 105px);
          font-weight: 500;
          font-size: 1.08rem;
          line-height: 1.4;
          color: var(--text-color);
          display: flex;
          justify-content: start;
          align-items: center;
          flex-flow: row nowrap;
          gap: 3px;
        }

        .wrapper > .content > .head > .name > .text {
          width: max-content;
          max-width: calc(100% - 23px);
          text-align: start;
          gap: 0;

          /** add ellipsis */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wrapper > .content > .head > .name > svg {
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

        .wrapper > .content > .head > .name > svg > path#outer {
          stroke: var(--accent-color);
          color: var(--accent-color);
        }

        .wrapper.unread > .content > .head > .name {
          font-weight: 600;
          color: var(--title-color);
        }

        .wrapper > .content > .head > .time {
          min-width: 100px;
          text-align: end;
          max-width: 100px;
          font-family: var(--font-read), sans-serif;
          font-weight: 500;
          font-size: 0.85rem;
          /* text-transform: uppercase;*/
          color: var(--gray-color);
        }

        .wrapper.unread > .content > .head > .time {
          font-weight: 600;
          color: var(--text-color);
        }

        .wrapper > .content > .text {
          display: flex;
          justify-content: start;
          align-items: center;
          width: 100%;
          gap: 0;
        }

        .wrapper > .content > .text > .unread-no {
          font-family: var(--font-read), sans-serif;
          font-weight: 500;
          font-size: 0.85rem;
          color: var(--white-color);
          background: var(--accent-linear);
          border-radius: 20px;
          padding: 2px 5px;
          min-width: 20px;
          width: max-content;
          display: flex;
          justify-content: center;
          align-items: center;
          text-align: center;
          position: absolute;
          bottom: 0;
          right: 0;
        }

        .wrapper > .content > .text > .tick {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 6px 0 0 0;
        }

        .wrapper > .content > .text > .tick > svg {
          width: 100%;
          height: 100%;
          color: var(--accent-color);
        }

        .wrapper > .content > .text > .tick.unread > svg {
          color: var(--gray-color);
        }

        .wrapper > .content > .text > .tick.recieved > svg {
          color: var(--gray-color);
          fill: none;
        }

        .wrapper > .content > .text > .tick.unread > svg #outer {
          stroke: var(--accent-color);
        }

        .wrapper > .content > .text > .you {
          font-family: var(--font-main), sans-serif;
          font-weight: 500;
          font-size: 1rem;
          color: var(--gray-color);
        }

        .wrapper.unread > .content > .text > .you {
          font-weight: 600;
          color: var(--title-color);
        }

        .wrapper > .content > .text > .message {
          font-family: var(--font-main), sans-serif;
          font-weight: 400;
          font-size: 1rem;
          padding-left: 2px;
          color: var(--gray-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wrapper.unread > .content > .text > .message {
          font-weight: 500;
          color: var(--text-color);
        }

        .wrapper > .content > .images {
          display: flex;
          justify-content: start;
          align-items: center;
          width: 100%;
          gap: 5px;
          margin-top: 5px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .wrapper > .content > .images::-webkit-scrollbar {
          display: none;
          visibility: hidden;
        }

        .wrapper > .content > .images > .image {
          width: max-content;
          height: 40px;
          min-width: 40px;
          max-width: 40px;
          min-height: 40px;
          max-height: 40px;
          border-radius: 10px;
          overflow: hidden;

          /* disable pointer events */
          pointer-events: none;
        }

        .wrapper > .content > .images > .image > img {
          width: auto;
          height: 100%;
          object-fit: cover;
        }

        .wrapper > .content > .attachements {
          display: flex;
          flex-direction: row nowrap;
          justify-content: start;
          align-items: start;
          width: 100%;
          gap: 5px;
          margin-top: 5px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .wrapper > .content > .attachements::-webkit-scrollbar {
          display: none;
          visibility: hidden;
        }

        .wrapper > .content > .attachements > a {
          width: max-content;
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 5px;
          text-decoration: none;
          color: var(--gray-color);
          font-family: var(--font-read), sans-serif;
          font-size: 0.85rem;
          background: var(--gray-background);
          border-radius: 8px;
          padding: 2.5px 7px;

          /** add ellipsis */
          white-space: nowrap;
          pointer-events: none;
        }

        @media all and (max-width: 660px) {
          :host {
          }

          .wrapper.opened {
            padding: 10px 0;
            border-radius: 0;
            position: relative;
          }

          .wrapper:hover {
            background: unset;
            border-radius: 0;
            padding: 10px 0;
          }
  
          .wrapper.opened::before {
            all: unset;
          }

          /* reset all cursor: pointer to cursor: default */
          a, a:visited, a:link, a:hover, a:active,
          button, button:active, button:focus, button:hover,
          .wrapper {
            cursor: default !important;
          }

          .wrapper > .content > .head > .time {
            min-width: 100px;
            text-align: end;
            max-width: 100px;
            font-family: var(--font-read), sans-serif;
            font-weight: 500;
            font-size: 0.7rem;
            color: var(--gray-color);
          }

          .wrapper > .content > .head > .name > svg {
            min-width: 16px;
            max-width: 16px;
            min-height: 16px;
            max-height: 16px;
            width: 16px;
            height: 16px;
            margin-bottom: -1px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: var(--white-color);
            fill: var(--accent-color);
          }

          .wrapper > .image > .online-status {
            border: var(--border);
            display: flex;
            background: var(--background);
            justify-content: center;
            align-items: center;
            text-align: center;
            height: 12px;
            width: 12px;
            min-width: 12px;
            min-height: 12px;
            max-width: 12px;
            max-height: 12px;
            border-radius: 50%;
            padding: 3px;
            position: absolute;
            bottom: 0;
            top: unset;
            right: -1px;
          }
  
          .wrapper > .image > .online-status > .active {
            width: 6px;
            height: 6px;
            max-width: 6px;
            max-height: 6px;
            min-width: 6px;
            min-height: 6px;
            border-radius: 50%;
            background: var(--accent-linear);
          }
  
          .wrapper > .image > .online-status > .inactive {
            width: 6px;
            height: 6px;
            max-width: 6px;
            max-height: 6px;
            min-width: 6px;
            min-height: 6px;
            border-radius: 50%;
            background: var(--gray-color);
          }
        }
      </style>
    `;
  }
}