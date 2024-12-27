export default class Message extends HTMLDivElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.active_tab = null;
    this.editable = this.textToBoolean(this.getAttribute('you'));
    this.render();
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.setupEditAction();
  }

  setupEditAction = () => {
    if (this.editable) {
      const editableTimeout = setInterval(() => {
        this.updateEditAction(this.getAttribute('datetime'));
        if (!this.editable) clearInterval(editableTimeout);
      }, 1000);
    }
  }

  updateEditAction = date => {
    const editAction = this.shadow.querySelector('.action.edit');
    if (!editAction) return;

    try {
      date = new Date(date);
      const diff = new Date() - date;

      if (diff < 1000 * 60 * 15) {
        // console.log(`Editable in: ${Math.floor((1000 * 60 * 15 - diff) / 1000)} seconds`);
        this.editable = true;
        editAction.style.display = 'flex';
      } else {
        this.editable = false;
        editAction.style.display = 'none';
      }
    } catch (error) {
      editAction.style.display = 'none';
    }
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
      ${this.getMessage()}
      ${this.getStyles()}
    `;
  }

  getMessage = () => {
    const you = this.textToBoolean(this.getAttribute('you')) ? 'you' : '';
    const reply = this.getAttribute('kind');
    if (you) {
      return /* html */`
        <div class="content ${you} ${reply}">
          ${this.getMessageContent(you)}
          ${this.getAvatar()}
        </div>
      `;
    } else {
      return /* html */`
        <div class="content ${you} ${reply}">
          ${this.getAvatar()}
          ${this.getMessageContent(you)}

        </div>
      `;
    }
  }

  getMessageContent = you => {
    return /* html */`
      <div class="message">
        ${this.getReply()}
        ${this.getTextMessge()}
        <div class="actions">
          ${this.getActions()}
        </div>
        <div class="time">
          <span class="date">${this.formatDateTime(this.getAttribute('datetime'))}</span>
          <span class="sp">•</span>
          ${this.getStatus(you, this.getAttribute('status'))}
        </div>
      </div>
    `;
  }

  getStatus = (you, status) => {
    if (!you) return /* html */`<span class="status secured">Secured</span>`;

    if (status === 'sent') return /* html */`<span class="status sent">Sent</span>`;

    if (status === 'delivered') return /* html */`<span class="status delivered">Delivered</span>`;

    if (status === 'seen') return /* html */`<span class="status seen">Seen</span>`;

    return /* html */`<span class="status secured">Secured</span>`;
  }

  getTextMessge = () => {
    return /* html */`
      <div class="text">
        ${this.innerHTML}
        ${this.getUnread(this.textToBoolean(this.getAttribute('you')), this.getAttribute('status'))}
      </div>
    `;
  }

  getReply = () => {
    const kind = this.getAttribute('kind');
    const replyText = this.getAttribute('reply-text');

    // if both are null or empty, return nothing
    if (!kind || kind === '' || !replyText || replyText === '') return '';

    const replyUser = this.getAttribute('reply-to');
    const toYou = this.textToBoolean(this.getAttribute('to-you'));
    const you = this.textToBoolean(this.getAttribute('you'));

    let text = '';
    if (toYou && you) {
      text = 'You replied to yourself';
    } else if (toYou && !you) {
      text = `${replyUser} replied to you`;
    } else if (!toYou && you) {
      text = `You replied to ${replyUser}`;
    } else {
      text = `${replyUser} replied to their message`;
    }

    return /* html */`
      <div class="reply">
        <div class="head">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M21.7109 9.3871C21.8404 9.895 21.9249 10.4215 21.9598 10.9621C22.0134 11.7929 22.0134 12.6533 21.9598 13.4842C21.6856 17.7299 18.3536 21.1118 14.1706 21.3901C12.7435 21.485 11.2536 21.4848 9.8294 21.3901C9.33896 21.3574 8.8044 21.2403 8.34401 21.0505C7.83177 20.8394 7.5756 20.7338 7.44544 20.7498C7.31527 20.7659 7.1264 20.9052 6.74868 21.184C6.08268 21.6755 5.24367 22.0285 3.99943 21.9982C3.37026 21.9829 3.05568 21.9752 2.91484 21.7349C2.77401 21.4946 2.94941 21.1619 3.30021 20.4966C3.78674 19.5739 4.09501 18.5176 3.62791 17.6712C2.82343 16.4623 2.1401 15.0305 2.04024 13.4842C1.98659 12.6533 1.98659 11.7929 2.04024 10.9621C2.31441 6.71638 5.64639 3.33448 9.8294 3.05621C10.2156 3.03051 10.6067 3.01177 11 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14 4.5L22 4.5M14 4.5C14 3.79977 15.9943 2.49153 16.5 2M14 4.5C14 5.20023 15.9943 6.50847 16.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">${text}</span>
        </div>
        <div class="reply-text">
          ${replyText}
        </div>
      </div>
    `;
  }

  getUnread = (you, status) => {
    if(!you) return '';

    if (status === 'sent') {
      return /* html */`
        <span class="tick sent">
          ${this.getStatusIcon()}
        </span>
      `;
    } else if (status === 'delivered') {
      return /* html */`
        <span class="tick delivered">
          ${this.getStatusIcon()}
        </span>
      `;
    } else if (status === 'seen') {
      return /* html */`
        <span class="tick read">
          ${this.getStatusIcon()}
        </span>
      `;
    } else {
      return '';
    }
  }

  getStatusIcon = ()  => {
    return /* html */`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
        <path id="outer" d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" stroke-width="1.8" />
        <path d="M8 12.5L10.5 15L16 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    `;
  }

  getAvatar = () => {
    return /*html*/`
      <div class="avatar">
        ${this.getImage(this.getAttribute('user-picture'))}
      </div>
    `
  }

  getImage = image => {
    if (!image || image === '' || image === 'null') {
      return /* html */`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
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

  getActions = () => {
    return /* html */`
      <div class="action react">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8 15C8.91212 16.2144 10.3643 17 12 17C13.6357 17 15.0879 16.2144 16 15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.00897 9L8 9M16 9L15.991 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        ${this.getActionInfo('React')}
      </div>
      <div class="action reply">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M21.7109 9.3871C21.8404 9.895 21.9249 10.4215 21.9598 10.9621C22.0134 11.7929 22.0134 12.6533 21.9598 13.4842C21.6856 17.7299 18.3536 21.1118 14.1706 21.3901C12.7435 21.485 11.2536 21.4848 9.8294 21.3901C9.33896 21.3574 8.8044 21.2403 8.34401 21.0505C7.83177 20.8394 7.5756 20.7338 7.44544 20.7498C7.31527 20.7659 7.1264 20.9052 6.74868 21.184C6.08268 21.6755 5.24367 22.0285 3.99943 21.9982C3.37026 21.9829 3.05568 21.9752 2.91484 21.7349C2.77401 21.4946 2.94941 21.1619 3.30021 20.4966C3.78674 19.5739 4.09501 18.5176 3.62791 17.6712C2.82343 16.4623 2.1401 15.0305 2.04024 13.4842C1.98659 12.6533 1.98659 11.7929 2.04024 10.9621C2.31441 6.71638 5.64639 3.33448 9.8294 3.05621C10.2156 3.03051 10.6067 3.01177 11 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M14 4.5L22 4.5M14 4.5C14 3.79977 15.9943 2.49153 16.5 2M14 4.5C14 5.20023 15.9943 6.50847 16.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        ${this.getActionInfo('Reply')}
      </div>
      <div class="action copy">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M17.0235 3.03358L16.0689 2.77924C13.369 2.05986 12.019 1.70018 10.9555 2.31074C9.89196 2.9213 9.53023 4.26367 8.80678 6.94841L7.78366 10.7452C7.0602 13.4299 6.69848 14.7723 7.3125 15.8298C7.92652 16.8874 9.27651 17.247 11.9765 17.9664L12.9311 18.2208C15.631 18.9401 16.981 19.2998 18.0445 18.6893C19.108 18.0787 19.4698 16.7363 20.1932 14.0516L21.2163 10.2548C21.9398 7.57005 22.3015 6.22768 21.6875 5.17016C21.0735 4.11264 19.7235 3.75295 17.0235 3.03358Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M16.8538 7.43306C16.8538 8.24714 16.1901 8.90709 15.3714 8.90709C14.5527 8.90709 13.889 8.24714 13.889 7.43306C13.889 6.61898 14.5527 5.95904 15.3714 5.95904C16.1901 5.95904 16.8538 6.61898 16.8538 7.43306Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M12 20.9463L11.0477 21.2056C8.35403 21.9391 7.00722 22.3059 5.94619 21.6833C4.88517 21.0608 4.52429 19.6921 3.80253 16.9547L2.78182 13.0834C2.06006 10.346 1.69918 8.97731 2.31177 7.89904C2.84167 6.96631 4 7.00027 5.5 7.00015" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        ${this.getActionInfo('Copy')}
      </div>
      ${this.getYouActions(this.textToBoolean(this.getAttribute('you')))}
    `;
  }

  getYouActions = you => {
    if (!you) return '';
    return /* html */`
      ${this.getEditAction(this.getAttribute('datetime'))}
      <div class="action delete">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M9.5 16.5L9.5 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M14.5 16.5L14.5 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        ${this.getActionInfo('Delete')}
      </div>
    `;
  }

  getEditAction = date => {
    // if the date is less than 15 minutes ago, show the edit action
    try {
      date = new Date(date);
      const diff = new Date() - date;

      if (diff < 1000 * 60 * 15) {
        return /* html */`
          <div class="action edit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M21.9165 10.5001C21.9351 10.6557 21.9495 10.8127 21.9598 10.9708C22.0134 11.801 22.0134 12.6608 21.9598 13.491C21.6856 17.7333 18.3536 21.1126 14.1706 21.3906C12.7435 21.4855 11.2536 21.4853 9.82937 21.3906C9.33893 21.358 8.80437 21.241 8.34398 21.0514C7.83174 20.8404 7.57557 20.7349 7.44541 20.7509C7.31524 20.7669 7.12637 20.9062 6.74865 21.1847C6.08265 21.6758 5.24364 22.0286 3.9994 21.9983C3.37023 21.983 3.05565 21.9753 2.91481 21.7352C2.77398 21.4951 2.94938 21.1627 3.30018 20.4979C3.78671 19.5759 4.09498 18.5204 3.62788 17.6747C2.8234 16.4667 2.14007 15.0361 2.04021 13.491C1.98656 12.6608 1.98656 11.801 2.04021 10.9708C2.31438 6.7285 5.64636 3.34925 9.82937 3.07119C11.0318 2.99126 12.2812 2.97868 13.5 3.0338" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8.49997 15.0001H15.5M8.49997 10.0001H11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20.8683 2.43946L21.5607 3.13183C22.1465 3.71761 22.1465 4.66736 21.5607 5.25315L17.9333 8.94881C17.6479 9.23416 17.2829 9.42652 16.8863 9.50061L14.6381 9.98865C14.2832 10.0657 13.9671 9.75054 14.0431 9.39537L14.5216 7.16005C14.5957 6.76336 14.7881 6.39836 15.0734 6.11301L18.747 2.43946C19.3328 1.85368 20.2825 1.85368 20.8683 2.43946Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            ${this.getActionInfo('Edit')}
          </div>
        `;
      } else return '';
    } catch (error) {
      return '';
    }
  }

  getActionInfo = text => {
    return /* html */`
      <span class="info">
        <span class="arrow"></span>
        <span class="text">${text}</span>
      </span>
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
          padding: 10px 0;
          display: flex;
          flex-flow: row;
          position: relative;
          align-items: end;
          justify-content: ${this.textToBoolean(this.getAttribute('you')) ? 'flex-end' : 'flex-start'};
          gap: 0;
        }

        * {
          box-sizing: border-box;
          font-family: var(--font-main), sans-serif;
        }

        .content {
          width: max-content;
          max-width: 72%;
          width: 72%;
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-flow: row;
          align-items: start;
          justify-content: start;
          position: relative;
          gap: 8px;
        }

        .content.you {
          justify-content: flex-end;
          align-items: end;
          flex-flow: row;
        }

        .content.reply {
          padding: 40px 0 0 0;
        }

        .content:hover > .message > .time,
        .content:hover > .message > .actions {
          display: flex;
        } 

        .content > .avatar {
          display: flex;
          flex-direction: column;
          align-items: start;
          align-self: flex-end;
          margin: 0 0 23px 0;
          padding: 0;
          gap: 0;
          width: 30px;
          height: 30px;
          min-width: 30px;
          min-height: 30px;
          max-width: 30px;
          max-height: 30px;
          position: relative;
          overflow: hidden;
          border-radius: 50%;
        }

        .content > .avatar > img {
          border-radius: 50%;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          color: var(--gray-color);
          object-fit: cover;
        }

        .content > .avatar > svg {
          width: 100%;
          height: 100%;
          padding: 5px;
          display: flex;
          background: var(--gray-background);
          color: var(--gray-color);
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }

        .content > .message {
          /* border: 1px solid red; */
          display: flex;
          flex-direction: column;
          align-items: start;
          gap: 5px;
          max-width: calc(100% - 40px);
          width: max-content;
          position: static;
        }

        .content.you > .message {
          align-items: end;
        }

        .content > .message > .actions {
          z-index: 1;
          border: var(--border);
          background: var(--background);
          position: absolute;
          top: -10px;
          left: 37px;
          padding: 0;
          display: none;
          flex-direction: row;
          align-items: center;
          gap: 0;
          border-radius: 15px;
        }

        .content.you > .message > .actions {
          left: unset;
          right: 37px;
        }

        .content > .message > .actions > .action {
          padding: 5px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0;
          padding: 7px;
          color: var(--gray-color);
          cursor: pointer;
          border-radius: 15px;
          position: relative;
        }

        .content > .message > .actions > .action:hover {
          background: var(--tab-background);
          color: var(--accent-color);
        }

        .content > .message > .actions > .action > .info {
          display: none;
          position: absolute;
          top: -35px;
          left: 50%;
          transform: translateX(-50%);
          padding: 5px 10px;
          background: var(--chat-hover);
          border-radius: 10px;
          color: inherit;
          font-family: var(--font-main), sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          box-shadow: var(--shadow);
        }

        .content > .message > .actions > .action:hover > .info {
          display: flex;
        }

        .content > .message > .actions > .action > .info > .arrow {
          position: absolute;
          top: 100%;
          left: 50%;
          display: inline-block;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid var(--chat-hover);
        }

        .content > .message > .actions > .action > svg {
          width: 22px;
          height: 22px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }

        .content > .message > .text {
          background: var(--chat-background);
          box-sizing: border-box;
          gap: 5px;
          margin: 0;
          padding: 5px 10px;
          border-radius: 15px;
          width: max-content;
          max-width: 100%;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          line-height: 1.4;
          position: relative;
        }

        .content.you > .message > .text {
          padding: 5px 9px 5px 12px;
        }

        .content.you > .message > .text {
          /*background: var(--you-background);*/
          color: var(--white-color);
          background-color: var(--accent-color);
          background-image: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%);
          /*background-image: linear-gradient(rgb(255, 143, 178) 0%, rgb(167, 151, 255) 50%, rgb(0, 229, 255) 100%);*/
          background-attachment: fixed;
          /*background-image: linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%);*/
        }

        .content > .message > .text  strong,
        .content > .message > .text b {
          font-weight: 600;
        }

        .content > .message > .text em,
        .content > .message > .text i {
          font-style: italic;
        }

        .content > .message > .text code {
          background: var(--gray-background);
          color: var(--text-color);
          font-size: 0.9rem;
          font-family: var(--font-mono), monospace;
          padding: 2px 5px;
          border-radius: 5px;
        }

        .content > .message > .text pre {
          background: var(--gray-background);
          color: var(--text-color);
          font-size: 0.9rem;
          font-family: var(--font-mono), monospace;
          padding: 10px;
          border-radius: 5px;
          overflow: auto;
        }

        .content > .message > .text a {
          color: var(--anchor-color);
          text-decoration: none;
          cursor: pointer;
        }

        .content > .message > .text a:hover {
          text-decoration: underline;
        }

        .content > .message > .text > span.tick {
          float: right;
          display: inline-block;
          margin: 2px 0 0 5px;
        }

        .content > .message > .text > span.tick svg {
          width: 20px;
          height: 20px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          color: var(--gray-color);
        }

        .content.you > .message > .text > span.tick svg {
          color: var(--chat-you-svg);
        }

        .content > .message > .text > span.tick.read > svg {
          color: var(--white-color);
          fill: var(--accent-color);
        }

        .content > .message > .text > span.tick.delivered > svg {
          color: var(--accent-color);
          fill: none;
        }

        .content.you > .message > .text > span.tick.delivered > svg {
          color: var(--white-color);
        }

        .content > .message > .text > span.tick.read > svg #outer {
          stroke: var(--accent-color);
        }

        .content > .message > .time {
          padding: 0 3.5px;
          width: max-content;
          display: flex;
          align-items: center;
          text-align: center;
          gap: 5px;
          font-family: var(--font-read), sans-serif;
          font-weight: 500;
          font-size: 0.8rem;
          text-transform: capitalize;
          color: var(--gray-color);
        }

        .content.you > .message > .time {
          /* border: 1px solid var(--accent-color); */
          padding: 0 7px 0 4px;
        }

        .content > .message > .time > .status.delivered,
        .content > .message > .time > .status.seen {
          background-color: var(--accent-color);
          color: transparent;
          background-clip: text;
          -webkit-background-clip: text;
        }

        .content > .message > .time > .sp {
          font-size: 0.95rem;
          text-align: center;
          display: inline-block;
          margin: 0 0 1px 0;
        }

        .content > .message > .reply {
          z-index: 0;
          padding: 0;
          border-radius: 15px;
          margin: 5px 0 0 0;
          width: max-content;
          display: flex;
          max-width: 100%;
          flex-direction: column;
          gap: 4px;
          left: 38px;
          position: absolute;
          top: -15px;
        }

        .content.you > .message > .reply {
          align-self: flex-end;
          align-items: end;
        }

        .content.you > .message > .reply {
          left: unset;
          right: 38px;
        }

        .content > .message > .reply > .head {
          display: flex;
          align-items: center;
          gap: 5px;
          opacity: 0.8;
          color: var(--gray-color);
          font-family: var(--font-read), sans-serif;
        }

        .content > .message > .reply > .head > svg {
          width: 16px;
          height: 16px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }

        .content > .message > .reply > .head > .text {
          font-size: 0.95rem;
          font-weight: 400;
          font-family: inherit;
        }

        .content > .message > .reply > .reply-text {
          font-size: 0.9rem;
          font-weight: 400;
          width: max-content;
          max-width: 100%;
          background: #f8f8f8;
          padding: 8px 10px 25px;
          font-family: inherit;
          color: var(--gray-color);
          border-radius: 15px;
          /* add ellipsis to the text */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      
        @media screen and (max-width: 660px) {
          :host {
            
          }

          /* reset all cursor: pointer to cursor: default */
          a, button, input, label, select, textarea,
          ul.tabs > li.tab, ul.tabs > li.tab.active {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}