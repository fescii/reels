export default class MessagingContainer extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.active_tab = null;
    this.openedContextNode = null;
    this.expanded = false;
    this.reply = null;
    this.render();
  }

  setOpenedContextNode = node => {
    this.openedContextNode = node;
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.scrollMessages();
    const editor = this.shadow.querySelector('.editor');
    this.growTextarea(editor);
    this.dispatchVisualViewportResize();
  }

  disconnectedCallback() {
    // remove event listeners
    window.visualViewport?.removeEventListener('resize', this.adjustContentHeight);
  }

  setReply = data => {
    const editor = this.shadow.querySelector('.editor');
    
    if(editor) {
      // select textarea
      const textarea = editor.querySelector('textarea#message');
      // select existing reply element
      const reply = editor.querySelector('.reply');

      // if reply element exists, remove it
      if (reply) {
        reply.remove();
      }

      // set the reply data
      this.reply = data;
      editor.insertAdjacentHTML('afterbegin', this.getReply(data));
      this.activateReplyCancel(editor);

      // focus on the textarea
      textarea.focus();
    }
  }

  activateReplyCancel = editor => {
    const reply = editor.querySelector('.reply');

    if (reply) {
      const cancel = reply.querySelector('.cancel');

      cancel.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.reply = null;
        reply.remove();
      });
    }
  }

  scrollMessages = () => {
    const messages = this.shadow.querySelector('main.main');
    messages.scrollTop = messages.scrollHeight;
  }

  growTextarea = editor => {
    const form = editor.querySelector('form');
    const input = form.querySelector('textarea#message');
    const actionsContainer = form.querySelector('.actions-container');
    const actions = actionsContainer.querySelector('div.actions');
    const expand = actionsContainer.querySelector('div.expand');
    // select expand icon(svg)
    const icon = expand.querySelector('svg');
    
    const adjustRows = () => {
      const maxRows = 5;
      const style = window.getComputedStyle(input);
      const lineHeight = parseInt(style.lineHeight, 10);

      // rotate the expand button
      icon.style.transform = 'rotate(0deg)';
      
      // Calculate the height offset (padding + border)
      const paddingHeight = parseInt(style.paddingTop, 10) + parseInt(style.paddingBottom, 10);
      const borderHeight = parseInt(style.borderTopWidth, 10) + parseInt(style.borderBottomWidth, 10);
      const offset = paddingHeight + borderHeight;

      // Reset the rows to 1 to calculate the new height
      input.rows = 1;

      // Calculate the number of rows based on scrollHeight minus the offset
      let newRows = Math.floor((input.scrollHeight - offset) / lineHeight);
      input.rows = Math.min(maxRows, Math.max(newRows, 1)); // Ensure at least 1 row

      // Toggle actions visibility based on input
      if (input.value.trim().length > 0) {
        // hide actions in animation width
        actions.style.animation = 'hide-actions 0.3s forwards';
        actions.style.width = '0';

        // show expand button
        expand.style.opacity = '0';
        expand.style.animation = 'show-expand 0.3s forwards';
        expand.style.display = 'flex';
        expand.style.opacity = '1';

        // adjust the width of the input
        input.style.setProperty('width', 'calc(100% - 80px)')
        // input.style.setProperty('min-width', 'calc(100% - 80px)')
        // input.style.setProperty('max-width', 'calc(100% - 80px)')

        // scroll to the bottom
        this.scrollMessages();
      } else {
        // hide expand button
        expand.style.animation = 'hide-expand 0.3s forwards';
        expand.style.opacity = '0';
        expand.style.display = 'none';

        // show actions in animation width
        actions.style.animation = 'show-actions 0.3s forwards';
        actions.style.width = '100px';
        actions.style.display = 'flex';
        actions.style.opacity = '1';

        // shrink the input
        input.style.setProperty('width', 'calc(100% - 150px)')
        // input.style.setProperty('min-width', 'calc(100% - 150px)')
        // input.style.setProperty('max-width', 'calc(100% - 150px)')
      }
    };

    input.addEventListener('input', adjustRows);
    input.addEventListener('paste', adjustRows);

    // click on expand button
    expand.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if (this.expanded) {
        // hide actions in animation width with expand button
        actions.style.animation = 'hide-actions 0.3s forwards';

        // remove .one-line class from the input
        input.classList.remove('one-line');

        // adjust the width of the input
        input.width = 'calc(100% - 80px)';

        // trigger input event to adjust the rows
        input.dispatchEvent(new Event('input'));

        // show expand button
        expand.style.opacity = '1';
        expand.style.animation = 'show-expand 0.3s forwards';

        // rotate the expand button
        icon.style.transform = 'rotate(0deg)';
        this.expanded = false;
        return;
      } else {
        // show actions in animation width with expand button
        actions.style.animation = 'show-actions 0.3s forwards';
        actions.style.width = '100px';
        actions.style.display = 'flex';
        actions.style.opacity = '1';

        // add .one-line class to the input
        input.classList.add('one-line');
        input.rows = 1;
        input.style.setProperty('width', 'calc(100% - 170px)');
        // rotate the expand button
        icon.style.transform = 'rotate(180deg)';
        this.expanded = true;
        return;
      }
    })
    
    // Initial adjustment on page load
    adjustRows();
  }

  adjustContentHeight = () => {
    // const editor = this.shadow.querySelector('.editor');
    const header = this.shadow.querySelector('.header');
    const content = this.shadow.querySelector('main.main');
    const messages = content.querySelector('.messages');
    // const docElement = document.documentElement;
    if (window.visualViewport) {
      // console.log('Visual Viewport Height: ', window.visualViewport.height);
      const viewportHeight = window.visualViewport.height;
      const headerHeight = header.offsetHeight;
      const messagesHeight = messages.offsetHeight;

      // window.alert(`Viewport Height: ${viewportHeight}, Header Height: ${headerHeight}, Messages Height: ${messagesHeight}, Editor Height: ${editorHeight}`);

      // if the messages height is less than the viewport height - (header height + editor height)
      if (messagesHeight) {
        // set content height to viewport height - (header height + editor height)
        content.style.height = `${viewportHeight - headerHeight}px`;
        content.style.setProperty('max-height', `${viewportHeight - headerHeight}px`);
        content.style.setProperty('min-height', `${viewportHeight - headerHeight}px`);

        // make it scrollable
        content.style.overflowY = 'scroll';

        // style body max-height
        document.body.style.setProperty('max-height', `${viewportHeight}px`)
        document.body.style.setProperty('height', `${viewportHeight}px`)
        document.body.style.setProperty('min-height', `${viewportHeight}px`)

        // scroll to the bottom
        this.scrollMessages();

        // hide scrollbar
        content.style.scrollbarWidth = 'none';
        content.style.msOverflowStyle = 'none';
        content.style.overflow = '-moz-scrollbars-none';
      }
    } else {
      console.error('Visual Viewport is not supported');
    }
  }

  dispatchVisualViewportResize = () => {
    window.visualViewport?.addEventListener('resize', this.adjustContentHeight);
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
      <main class="main">
        <div class="messages">
          ${this.getMessages()}
        </div>
        ${this.getEditor()}
      </main>
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
      <button class="action search" title="Search">
        <svg class="large" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M12 3.00366C11.4383 3.01203 10.3789 3.03449 9.8294 3.07102C5.64639 3.34908 2.31441 6.72832 2.04024 10.9707C1.98659 11.8009 1.98659 12.6606 2.04024 13.4908C2.1401 15.0359 2.82343 16.4665 3.62791 17.6746C4.09501 18.5203 3.78674 19.5758 3.30021 20.4978C2.94941 21.1625 2.77401 21.4949 2.91484 21.735C3.05568 21.9752 3.37026 21.9828 3.99943 21.9981C5.24367 22.0284 6.08268 21.6757 6.74868 21.1846C7.1264 20.906 7.31527 20.7668 7.44544 20.7508C7.5756 20.7347 7.83177 20.8403 8.34401 21.0512C8.8044 21.2408 9.33896 21.3579 9.8294 21.3905C11.2536 21.4851 12.7435 21.4853 14.1706 21.3905C18.3536 21.1124 21.6856 17.7332 21.9598 13.4908C21.9915 13.0001 22.0044 12.4991 21.9987 11.9999" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M20.2649 7.27042L22 9M21.1714 5.08571C21.1714 3.38152 19.7899 2 18.0857 2C16.3815 2 15 3.38152 15 5.08571C15 6.78991 16.3815 8.17143 18.0857 8.17143C19.7899 8.17143 21.1714 6.78991 21.1714 5.08571Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button class="action info" title="More">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" stroke-width="1.8" />
          <path d="M12.2422 17V12C12.2422 11.5286 12.2422 11.2929 12.0957 11.1464C11.9493 11 11.7136 11 11.2422 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M11.992 8H12.001" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    `;
  }

  getMessages = () => {
    return /* html */`
      ${this.getDisclaimer()}
      <div is="message-item" class="message" user-name="John Doe" user-picture="https://randomuser.me/api/portraits/men/1.jpg" datetime="2024-12-24T12:00:00Z"
        you="false" verified="true" status="seen" active="true" kind="message"
        reactions='{ "from": null, "to": "love" }'
        attachments='[
          {
            "name": "Meeting Notes.pdf",
            "size": "1.2MB",
            "type": "pdf",
            "link": "https://example.com/meeting-notes.pdf"
          },
          {
            "name": "Design Mockup.png",
            "size": "2.4MB",
            "type": "image",
            "link": "https://example.com/design-mockup.png"
          },
          {
            "name": "Project Proposal.docx",
            "size": "3.6MB",
            "type": "doc",
            "link": "https://example.com/project-proposal.docx"
          }
          ]'>
        This is a message from John Doe, Please reply as soon as possible.
      </div>
      <div is="message-item" class="message" user-name="Jane Doe" user-picture="https://randomuser.me/api/portraits/women/12.jpg" datetime="2024-12-24T12:00:00Z"
        you="true" verified="false" status="seen" active="false" kind="message"
        reactions='{ "from": "angry", "to": null }'
        images="https://images.unsplash.com/photo-1733077151673-c834c5613bbc?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D, https://plus.unsplash.com/premium_photo-1733514691529-da25716e449b?q=80&w=1471&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D, https://images.unsplash.com/photo-1719937051176-9b98352a6cf4?q=80&w=1472&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D">
        This is a message from Jane Doe, Please reply as soon as possible.
      </div>
      <div is="message-item" class="message" user-name="John Doe" user-picture="https://randomuser.me/api/portraits/women/12.jpg" datetime="2024-12-24T12:00:00Z"
        you="false" verified="true" status="delivered" active="true" kind="reply" to-you="true" reply-to="John" reply-text="This is a message from Jane Doe, Please reply as soon as possible."
        reactions='{ "from": "love", "to": "love" }'>
        OMG! WWE is coming to town, are you ready?
      </div>
      <div is="message-item" class="message" user-name="John Doe" user-picture="https://randomuser.me/api/portraits/men/1.jpg" datetime="2024-12-24T12:00:00Z"
        you="false" verified="true" status="delivered" active="true" kind="message">
        This is a message from John Doe, Please reply as soon as possible.
      </div>
      <div is="message-item" class="message" user-name="Jane Doe" user-picture="https://randomuser.me/api/portraits/women/12.jpg" datetime="2024-12-24T12:00:00Z"
        you="true" verified="false" status="seen" active="false" kind="message"
        reactions='{ "from": "love", "to": "love" }'>
        Thanks! I will reply as soon as possible.
      </div>
      <div is="message-item" class="message" user-name="John Doe" user-picture="https://randomuser.me/api/portraits/men/1.jpg" datetime="2024-12-24T12:00:00Z"
        you="false" verified="true" status="delivered" active="true" kind="reply" to-you="false" reply-to="John" reply-text="This is a message from Jane Doe, Please reply as soon as possible.">
        OMG! WWE is coming to town, are you ready?
      </div>
      <div is="message-item" class="message" user-name="Jane Doe" user-picture="https://randomuser.me/api/portraits/women/12.jpg" datetime="2024-12-26T02:49:00Z"
        you="true" verified="false" status="delivered" active="false" kind="message">
        Did you get the news, apparently there is a new update on the way.
      </div>
      <div is="message-item" class="message" user-name="Jane Doe" user-picture="https://randomuser.me/api/portraits/women/12.jpg" datetime="2024-12-27T17:12:00Z"
        you="true" verified="false" status="sent" active="false" kind="reply" to-you="false" reply-to="John" reply-text="OMG! WWE is coming to town, are you ready?">
        Rickoshea!!!!
      </div>
      <div is="message-item" class="message" user-name="John Doe" user-picture="https://randomuser.me/api/portraits/men/1.jpg" datetime="2025-01-23T17:12:00Z"
        you="false" verified="true" status="seen" active="true" kind="message">
        Ok
      </div>
      <div is="message-item" class="message" user-name="John Doe" user-picture="https://randomuser.me/api/portraits/women/12.jpg" datetime="2025-01-27T10:47:00Z"
        you="true" verified="true" status="sent" active="false" kind="reply" to-you="true" reply-to="Jane" reply-text="Rickoshea!!!!"
        reactions='{ "from": "angry", "to": "love" }'>
        okay
      </div>
      ${this.getTyping()}
    `;
  }

  getDisclaimer = () => {
    return /* html */`
      <div class="disclaimer">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M22 13.4908C21.7253 17.7331 18.3866 21.1124 14.1951 21.3904C12.7652 21.4853 11.2722 21.4851 9.84518 21.3904C9.35376 21.3578 8.81812 21.2408 8.3568 21.0512C7.84352 20.8402 7.58684 20.7347 7.45641 20.7507C7.32598 20.7667 7.13674 20.906 6.75825 21.1845C6.09091 21.6756 5.25021 22.0284 4.00346 21.9981C3.37302 21.9828 3.0578 21.9751 2.91669 21.735C2.77557 21.4949 2.95132 21.1625 3.30283 20.4977C3.79035 19.5757 4.09923 18.5202 3.63119 17.6745C2.82509 16.4665 2.14038 15.0359 2.04032 13.4908C1.98656 12.6606 1.98656 11.8008 2.04032 10.9706C2.31504 6.72826 5.65374 3.34901 9.84518 3.07095C10.7223 3.01277 11.6242 2.99027 12.5212 3.0036" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M8.5 14.9999H15.5M8.5 9.99988H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M16.7374 5.17553L16.7374 3.78517C16.7374 3.5798 16.746 3.37188 16.8196 3.1801C17.0155 2.66962 17.5346 2.00085 18.4795 2.00085C19.4245 2.00085 19.9639 2.66962 20.1598 3.1801C20.2335 3.37188 20.242 3.5798 20.242 3.78517L20.242 5.17553M16.8069 10.9984H20.1929C21.1898 10.9984 21.9979 10.1918 21.9979 9.19686V7.19551C21.9979 6.20053 21.1898 5.39394 20.1929 5.39394H16.8069C15.8101 5.39394 15.002 6.20053 15.002 7.19551V9.19686C15.002 10.1918 15.8101 10.9984 16.8069 10.9984Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <span>Messages and calls are end-to-end encrypted. No one outside of this chat can read or listen to them.</span>
      </div>
    `;
  }

  getTyping = () => {
    return /* html */`
      <div class="typing-container">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;
  }

  getEditor = () => {
    return /* html */`
      <div class="editor" id="editor">
        <form class="form message-form">
          <div class="actions-container">
            <div class="actions">
              <button class="action attachment" title="Attachment" type="button">
                <svg id="small" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <defs>
                    <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#18a565" />
                      <stop offset="100%" style="stop-color:#21d029" />
                    </linearGradient>
                  </defs>
                  <path d="M9.14339 10.691L9.35031 10.4841C11.329 8.50532 14.5372 8.50532 16.5159 10.4841C18.4947 12.4628 18.4947 15.671 16.5159 17.6497L13.6497 20.5159C11.671 22.4947 8.46279 22.4947 6.48405 20.5159C4.50532 18.5372 4.50532 15.329 6.48405 13.3503L6.9484 12.886" stroke="url(#strokeGradient)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                  <path d="M17.0516 11.114L17.5159 10.6497C19.4947 8.67095 19.4947 5.46279 17.5159 3.48405C15.5372 1.50532 12.329 1.50532 10.3503 3.48405L7.48405 6.35031C5.50532 8.32904 5.50532 11.5372 7.48405 13.5159C9.46279 15.4947 12.671 15.4947 14.6497 13.5159L14.8566 13.309" stroke="url(#strokeGradient)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                </svg>
              </button>
              <button class="action image" title="Image" type="button">
                <svg id="small" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <defs>
                    <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#18a565" />
                      <stop offset="100%" style="stop-color:#21d029" />
                    </linearGradient>
                  </defs>
                  <circle cx="7.5" cy="7.5" r="1.5" stroke="url(#strokeGradient)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                  <path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" stroke="url(#strokeGradient)" stroke-width="1.8" fill="none"/>
                  <path d="M5 21C9.37246 15.775 14.2741 8.88406 21.4975 13.5424" stroke="url(#strokeGradient)" stroke-width="1.8" fill="none"/>
                </svg>
              </button>
              <button class="action video" title="Video" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <defs>
                    <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#18a565" />
                      <stop offset="100%" style="stop-color:#21d029" />
                    </linearGradient>
                  </defs>
                  <path d="M11 8L13 8" stroke="url(#strokeGradient)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                  <path d="M2 11C2 7.70017 2 6.05025 3.02513 5.02513C4.05025 4 5.70017 4 9 4H10C13.2998 4 14.9497 4 15.9749 5.02513C17 6.05025 17 7.70017 17 11V13C17 16.2998 17 17.9497 15.9749 18.9749C14.9497 20 13.2998 20 10 20H9C5.70017 20 4.05025 20 3.02513 18.9749C2 17.9497 2 16.2998 2 13V11Z" stroke="url(#strokeGradient)" stroke-width="1.8" fill="none"/>
                  <path d="M17 8.90585L17.1259 8.80196C19.2417 7.05623 20.2996 6.18336 21.1498 6.60482C22 7.02628 22 8.42355 22 11.2181V12.7819C22 15.5765 22 16.9737 21.1498 17.3952C20.2996 17.8166 19.2417 16.9438 17.1259 15.198L17 15.0941" stroke="url(#strokeGradient)" stroke-width="1.8" stroke-linecap="round" fill="none"/>
                </svg>
              </button>
            </div>
            <div class="expand">
              <button class="action expand" title="Expand" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <defs>
                    <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#18a565" />
                      <stop offset="100%" style="stop-color:#21d029" />
                    </linearGradient>
                  </defs>
                  <path d="M9.00005 6C9.00005 6 15 10.4189 15 12C15 13.5812 9 18 9 18" stroke="url(#strokeGradient)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                </svg>
              </button>
            </div>
          </div>
          <textarea name="message" id="message" cols="30" rows="1" placeholder="Message" required></textarea>
          <button type="submit" class="send" title="Send">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <defs>
                <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style="stop-color:#18a565" />
                  <stop offset="100%" style="stop-color:#21d029" />
                </linearGradient>
              </defs>
              <path d="M2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12Z" fill="url(#circleGradient)" />
              <path d="M16 12L12 16L8 12" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M12 8V16" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </form>
      </div>
    `;
  }

  getReply = ({id: _id, user: replyUser, you: toYou, text: replyText}) => {
    // if both are null or empty, return nothing
    if (!replyText || replyText.trim() === '' || replyText.trim().length === 0) return '';

    let text = '';
    if (toYou) {
      text = 'Replying to yourself';
    } else {
      text = `Replying to ${replyUser}`;
    } 

    return /* html */`
      <div class="reply">
        <span class="cancel" title="Cancel">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <div class="head">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M21.7109 9.3871C21.8404 9.895 21.9249 10.4215 21.9598 10.9621C22.0134 11.7929 22.0134 12.6533 21.9598 13.4842C21.6856 17.7299 18.3536 21.1118 14.1706 21.3901C12.7435 21.485 11.2536 21.4848 9.8294 21.3901C9.33896 21.3574 8.8044 21.2403 8.34401 21.0505C7.83177 20.8394 7.5756 20.7338 7.44544 20.7498C7.31527 20.7659 7.1264 20.9052 6.74868 21.184C6.08268 21.6755 5.24367 22.0285 3.99943 21.9982C3.37026 21.9829 3.05568 21.9752 2.91484 21.7349C2.77401 21.4946 2.94941 21.1619 3.30021 20.4966C3.78674 19.5739 4.09501 18.5176 3.62791 17.6712C2.82343 16.4623 2.1401 15.0305 2.04024 13.4842C1.98659 12.6533 1.98659 11.7929 2.04024 10.9621C2.31441 6.71638 5.64639 3.33448 9.8294 3.05621C10.2156 3.03051 10.6067 3.01177 11 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M14 4.5L22 4.5M14 4.5C14 3.79977 15.9943 2.49153 16.5 2M14 4.5C14 5.20023 15.9943 6.50847 16.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text">${text}</span>
        </div>
        <div class="summary">
          ${replyText}
        </div>
      </div>
    `;
  }

  getImagesEditor = () => {
    return /* html */`
      <div is="chat-images" class="images" id="images" url="/s/add"></div>
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
          flex-direction: column;
          align-items: start;
          justify-content: space-between;
          gap: 0;
        }

        * {
          box-sizing: border-box;
          font-family: var(--font-main), sans-serif;
        }

        header.header {
          box-sizing: border-box;
          border-bottom: var(--border);
          background: var(--background);
          padding: 0;
          padding: 15px 0 10px;
          height: 70px;
          max-height: 70px;
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
          width: calc(100% - 120px);
          min-width: calc(100% - 120px);
          max-width: calc(100% - 120px);
          display: flex;
          flex-flow: row;
          align-items: center;
          flex-wrap: nowrap;
          gap: 10px;
        }

        header.header > .contents > .profile > .avatar {
          border: var(--border);
          width: 40px;
          height: 40px;
          max-width: 40px;
          max-height: 40px;
          min-width: 40px;
          min-height: 40px;
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
          width: calc(100% - 50px);
          min-width: calc(100% - 50px);
          max-width: calc(100% - 50px);
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
          font-size: 1rem;
          line-height: 1.4;
          color: var(--text-color);
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 2px;
        }

        header.header > .contents > .profile > .info > .name > .text {
          width: max-content;
          max-width: calc(100% - 28px);
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
          margin-bottom: 0px;
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
          /* border: var(--border);*/
          width: 100px;
          min-width: 100px;
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: end;
          flex-wrap: nowrap;
          gap: 15px;
        }

        header.header > .contents > .actions > button {
          border: none;
          display: flex;
          background: var(--background);
          justify-content: center;
          align-items: center;
          padding: 0;
          cursor: pointer;
          color: var(--gray-color);
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
          color: var(--accent-color);
        }

        header.header > .contents > .actions > button > svg.large {
          width: 23px;
          height: 23px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 0 3px;
        }

        main.main {
          /* border: 2px solid red; */
          display: flex;
          flex-flow: column;
          align-items: start;
          justify-content: space-between;
          gap: 0;
          padding: 0;
          height: calc(100dvh - 70px);
          min-height: calc(100vh - 70px);
          max-height: calc(100vh - 70px);
          width: 100%;
          overflow-y: scroll;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        main.main::-webkit-scrollbar {
          display: none;
          visibility: hidden;
        }

        main.main > .messages {
          display: flex;
          flex-flow: column;
          align-items: start;
          justify-content: start;
          width: 100%;
          max-width: 100%;
          min-width: 100%;
          gap: 10px;
          padding: 10px 0 30px;
        }

        main.main > .messages > div.disclaimer {
          display: inline-block;
          gap: 5px;
          width: 70%;
          align-self: center;
          padding: 5px 10px;
          background: var(--background);
          color: var(--gray-color);
          font-size: 0.9rem;
          font-weight: 400;
          font-family: var(--font-read), sans-serif;
          text-align: center;
          margin: 0 0 10px;
        }

        main.main > .messages > div.disclaimer > svg {
          width: 16px;
          height: 16px;
          color: var(--accent-color);
          display: inline-block;
          margin-bottom: -2px;
        }

        .typing-container {
          align-items: center;
          display: flex;
          justify-content: center;
          gap: 0.25rem;
          width: max-content;
          /*background: rgb(226 232 240);*/
          border-radius: 15px;
          padding: 7px 20px;
          margin: 5px 0 20px;
        }

        .typing-container .dot {
          border-radius: 50%;
          height: 8px;
          width: 8px;
          background: var(--typing-color);
          opacity: 0;
          animation: blink 1s infinite;
        }
        .typing-container .dot:nth-child(1) {
          animation-delay: 0.3333s;
        }
        .typing-container .dot:nth-child(2) {
          animation-delay: 0.6666s;
        }
        .typing-container .dot:nth-child(3) {
          animation-delay: 0.9999s;
        }
      
        @keyframes blink {
          50% {
            opacity: 1;
          }
        }

        /* editor */
        div.editor#editor {
          /* border: 1px solid red; */
          display: flex;
          flex-flow: column;
          align-items: start;
          justify-content: end;
          position: sticky;
          bottom: 0;
          z-index: 5;
          gap: 0;
          width: 100%;
          margin: 0;
          padding: 5px 0;
          background: var(--background);
        }

        div.editor#editor > .reply {
          z-index: 0;
          padding: 0;
          border-radius: 15px;
          margin: 5px 0 0 0;
          width: max-content;
          display: flex;
          max-width: 100%;
          flex-direction: column;
          gap: 4px;
          left: 10px;
          width: calc(100% - 10px);
          margin-bottom: -20px;
          position: relative;
        }

        div.editor#editor > .reply > .cancel {
          display: flex;
          justify-content: center;
          align-items: center;
          position: absolute;
          cursor: pointer;
          z-index: 1;
          top: 2px;
          right: 5px;
        }

        div.editor#editor > .reply > .cancel > svg {
          width: 16px;
          height: 16px;
          color: var(--error-color);
        }

        div.editor#editor > .reply > .head {
          display: flex;
          align-items: center;
          gap: 5px;
          opacity: 0.8;
          color: var(--gray-color);
          font-family: var(--font-read), sans-serif;
        }

        div.editor#editor > .reply > .head > svg {
          width: 16px;
          height: 16px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }

        div.editor#editor > .reply > .head > .text {
          font-size: 0.95rem;
          font-weight: 400;
          font-family: inherit;
        }

        .reply > .summary {
          font-size: 0.9rem;
          font-weight: 400;
          width: max-content;
          max-width: 100%;
          background: var(--reply-background);
          padding: 8px 10px 25px;
          font-family: inherit;
          color: var(--gray-color);
          border-radius: 15px;
          /* add ellipsis to the text */
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        div.editor#editor > form.message-form {
          display: flex;
          flex-flow: row;
          align-items: flex-end;
          justify-content: space-between;
          background: var(--background);
          z-index: 1;
          gap: 0;
          padding: 0;
          margin: 0;
          width: 100%;
        }

        div.editor#editor > form.message-form > div.actions-container {
          /* border: 1px solid red; */
          padding: 0 0 2px;
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: max-content;
        }

        div.editor#editor > form.message-form > div.actions-container > div.actions {
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: start;
          width: 100px;
          margin: 0 3px 0 0;
          overflow: hidden;
          gap: 5px;
        }

        div.editor#editor > form.message-form > div.actions-container > div.actions > button {
          border: none;
          display: flex;
          background: var(--background);
          justify-content: center;
          align-items: center;
          padding: 0;
          cursor: pointer;
          width: 30px;
          height: 30px;
          color: var(--gray-color);
        }

        div.actions-container > div.actions > button > svg {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 23px;
          height: 23px;
          color: var(--accent-color);
        }

        div.actions-container > div.actions > button > svg.small {
          width: 20px;
          height: 22px;
        }

        div.actions-container > div.expand  {
          display: none;
          justify-content: center;
          align-items: center;
          width: 25px;
          max-width: 25px;
          height: 25px;
          min-width: 25px;
          margin: 0;
          max-height: 25px;
        }

        div.actions-container > div.expand > button {
          border: none;
          display: flex;
          background: transparent;
          justify-content: center;
          align-items: center;
          padding: 0;
          cursor: pointer;
          color: var(--gray-color);
        }

        div.actions-container > div.expand > button > svg {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 24px;
          height: 24px;
          color: var(--accent-color);
        }

        div.editor#editor > form.message-form > textarea {
          border: var(--input-border);
          font-family: var(--font-main), sans-serif;
          background: var(--background);
          font-size: 1rem;
          padding: 5px 10px;
          outline: none;
          margin: 0;
          width: calc(100% - 140px);
          /*min-width: calc(100% - 140px);
          max-width: calc(100% - 140px);*/
          resize: none;
          height: auto;
          line-height: 1.5;
          scroll-padding-top: 7px;
          scroll-padding-bottom: 7px;
          transition: linear 0.2s;
          gap: 5px;
          font-weight: 400;
          color: var(--text-color);
          scrollbar-width: 3px;
          border-radius: 15px;
        }

        div.editor#editor > form.message-form > textarea.one-line {
          width: calc(100% - 170px);

          /* hide overflow */
          overflow: hidden;
        }

        div.editor#editor > form.message-form > textarea::placeholder {
          color: var(--gray-color);
          font-weight: 400;
          font-size: 1rem;
          font-family: var(--font-main), sans-serif;
        }

        div.editor#editor > form.message-form > textarea::-webkit-scrollbar {
          width: 3px;
          -webkit-appearance: auto;
        }

        div.editor#editor > form.message-form > textarea:focus {
          border: var(--input-border-focus);
        }

        div.editor#editor > form.message-form > button.send {
          border: none;
          display: flex;
          background: var(--background);
          justify-content: center;
          align-items: center;
          padding: 0;
          cursor: pointer;
          width: 40px;
          height: 40px;
          color: var(--gray-color);
        }

        div.editor#editor > form.message-form > button.send > svg {
          display: flex;
          justify-content: end;
          align-items: flex-end;
          margin-bottom: -4px;
          width: 34px;
          height: 34px;
          fill: var(--accent-color);
          color: var(--accent-color);
          rotate: 180deg;
        }

        div.editor#editor > form.message-form > button.send > svg > path#outer  {
          /*fill: var(--white-color);
          color: var(--white-color);*/
          stroke: var(--white-color);
        }

        @keyframes show-actions {
          from {
            width: 0;
            opacity: 0;
            visibility: hidden;
          }
          to {
            width: 100px;
            opacity: 1;
            visibility: visible;
          }
        }
        
        @keyframes hide-actions {
          from {
            width: 100px;
            opacity: 1;
            visibility: visible;
          }
          to {
            width: 0;
            opacity: 0;
            visibility: hidden;
          }
        }
        
        @keyframes show-expand {
          from {
            width: 0;
            opacity: 0;
            visibility: hidden;
            transform: translateX(-10px);
          }
          to {
            width: calc(100% - 90px);
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
          }
        }
        
        @keyframes hide-expand {
          from {
            width: calc(100% - 90px);
            opacity: 1;
            visibility: visible;
            transform: translateX(0);
          }
          to {
            width: 0;
            opacity: 0;
            visibility: hidden;
            transform: translateX(-10px);
          }
        }

        @media screen and (max-width: 768px) {
          header.header > svg {
            position: absolute;
            left: -15px;
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
            margin: 0 0 0 20px;
            width: calc(100% - 20px);
            position: relative;
          }
        }
       
        @media screen and (max-width: 660px) {
          :host {
            /* border: 2px solid green; */
            height: unset;
            max-height: unset;
            min-height: unset;
            width: 100%;
            min-width: 100%;
            max-width: 100%;
          }

          /* reset all cursor: pointer to cursor: default */
          a, button, input, label, select, textarea,
          ul.tabs > li.tab, ul.tabs > li.tab.active,
          div.editor#editor > .reply > .cancel {
            cursor: default !important;
          }

          header.header {
            border-bottom: var(--border);
            background: var(--background);
            padding: 0;
            padding: 10px 0 10px;
            display: flex;
            flex-flow: column;
            align-items: start;
            flex-wrap: nowrap;
            height: 60px;
            max-height: 60px;
            gap: 5px;
            margin: 0;
            z-index: 6;
            width: 100%;
            position: sticky;
            top: 0;
          }

          main.main {
            /* border: 2px solid blue; */
            max-height: calc(100dvh - 60px);
            height: calc(100dvh - 60px);
            min-height: calc(100dvh - 60px);
            width: 100%;
          }

          main.main > .messages {
            padding: 10px 0 0;
            /* border: 2px solid red; */
            width: 100%;
            height: max-content;
          }

          main.main > .messages > div.disclaimer {
            width: 100%;
            font-size: 0.8rem;
          }

          main.main > .messages > div.disclaimer > svg {
            width: 14px;
            height: 14px;
            margin-bottom: -2.5px;
          }
        }
      </style>
    `;
  }
}