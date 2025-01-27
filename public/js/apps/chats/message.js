export default class Message extends HTMLDivElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.app = window.app;
    this.active_tab = null;
    this.editable = this.textToBoolean(this.getAttribute('you'));
    this.mql = window.matchMedia('(max-width: 660px)');
    this.container = this.app = this.getRootNode().host;
    this.reactions = this.getReaction(this.getAttribute('reactions'));
    this.render();
  }

  getReaction = str => {
    if (!str || str === '' || str === 'null') {
      return {
        from: null,
        to: null,
      }
    }
    try {
      let reaction = JSON.parse(str);
      // validate the reactions in [like, love, laugh, wow, sad, angry]
      if (!['like', 'love', 'laugh', 'wow', 'sad', 'angry'].includes(reaction?.from)) {
        reaction.from = null;
      }
      if (!['like', 'love', 'laugh', 'wow', 'sad', 'angry'].includes(reaction?.to)) {
        reaction.to = null;
      }
      return {
        from: reaction?.from,
        to: reaction?.to,
      }
    } catch (error) {
      console.log('Error:', error);
      return {
        from: null,
        to: null,
      }
    }
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.setupEditAction();
    this.showActionsDropdown();
    this.initalizeCopy(this.mql);
    this.openDesktopReactions(this.mql);
    this.handleReply(this.mql);
  }

  openDesktopReactions = mql => {
    const you = this.textToBoolean(this.getAttribute('you'));
    if (!mql.matches) {
      // select react action button and reactions container
      const react = this.shadow.querySelector('.content > .message > .actions > .action.react');
      const reactions = this.shadow.querySelector('.content > .message > .desktop-reactions');
      if(react && reactions) {
        react.addEventListener('click', e => {
          e.preventDefault();
          e.stopPropagation();

          // show the reactions
          reactions.style.opacity = '0';
          // add animation to the reactions
          reactions.style.transition = 'all 0.3s ease-in-out';
          reactions.style.display = 'flex';
          setTimeout(() => {
            reactions.style.opacity = '1';
          }, 100);

          // add event listeners to the reactions
          this.reactToMessage(reactions, you, 'desktop');

          // add click outside event listener to close the reactions
          document.addEventListener('click', e => {
            if (e.target !== react && e.target !== reactions) {
              reactions.style.opacity = '0';
              setTimeout(() => {
                reactions.style.display = 'none';
              }, 300);
            }
          })
        });
      }
    } else {
      const reactionsContainer = this.shadow.querySelector('.actions-dropdown');
      if(reactionsContainer) {
        // react to message
        this.reactToMessage(reactionsContainer, you, 'mobile');
      }
    }
  }

  reactToMessage = (reactionsContainer, you, kind) => {
    // get the reactions elements
    const reactionElements = reactionsContainer.querySelectorAll('.reaction');

    // add event listeners to the reactions
    reactionElements.forEach(reaction => {
      reaction.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const reactionData = reaction.dataset.reaction;

        // if the reaction is already active, remove it
        if(you && this.reactions.from === reactionData) {
          this.reactions.from = null;
          this.updateReactions(reactionsContainer, reactionData, { action: 'remove', kind: kind });
        } else if(!you && this.reactions.to === reactionData) {
          this.reactions.to = null;
          this.updateReactions(reactionsContainer, reactionData, { action: 'remove', kind: kind });
        } else {
          // if the reaction is not active, add it
          if(you) {
            this.reactions.from = reactionData;
            this.updateReactions(reactionsContainer, reactionData, { action: 'add', kind: kind });
          } else {
            this.reactions.to = reactionData;
            this.updateReactions(reactionsContainer, reactionData, { action: 'add', kind: kind });
          }
        }

        // if(kind === 'desktop') {
        //   // close the container
        //   reactionsContainer.style.transition = 'all 0.3s ease-in-out';
        //   reactionsContainer.style.opacity = '0';
        //   setTimeout(() => {
        //     reactionsContainer.style.display = 'none';
        //   }, 300);
        // }
      });
    })
  }

  updateReactions = (container, reaction, data) => {
    const updatedReaction = (nodes, reaction) => {
      nodes.forEach(node => {
        node.classList.remove('active');
        if(node.dataset.reaction === reaction) {
          node.classList.add('active');
        }
      });
    }

    const removeReaction = (nodes, reaction) => {
      nodes.forEach(node => {
        if(node.dataset.reaction === reaction) {
          node.classList.remove('active');
        }
      });
    }

    // update the reactions: active or remove
    const reactions = container.querySelectorAll('.reaction');
    if(reactions) {
      if(data.action === 'remove') {
        removeReaction(reactions, reaction);
      } else {
        updatedReaction(reactions, reaction);
      }
    }

    // close container
    if (data.kind === 'desktop') {
      // console.log('Closing container');
      container.style.opacity = '0';
      setTimeout(() => {
        container.style.display = 'none';
      }, 300);
    } else {
      // close context menu
      // this.container.openedContextNode = null;
      // container.style.display = 'none';
      this.closeContextMenu();
    }

    // update the message reactions
    this.updateMessageReactions();
  }

  updateMessageReactions = () => {
    // update the message reactions
    this.setAttribute('reactions', JSON.stringify(this.reactions));

    // select the message reactions
    const content = this.shadow.querySelector('.content');
    const text = content.querySelector('.content > .message > .text');
    const messageReactions = text.querySelector('.user-reactions');
    if(messageReactions) {
      // remove the current reactions
      messageReactions.remove();
    }

    //update content class: reacted or not
    if(this.reactions.from || this.reactions.to) {
      content.classList.add('reacted');
      // insert the new reactions
      text.insertAdjacentHTML('beforeend', this.getUserReactions(this.reactions));
    } else {
      content.classList.remove('reacted');
    }
  }

  initalizeCopy = mql => {
    if(mql.matches) {
      const btn = this.shadow.querySelector('.actions-dropdown > .actions-container > .actions > span.action.copy');
      if(btn) this.handleCopy(btn, true);
    } else {
      const btn = this.shadow.querySelector('.content > .message > .actions > .action.copy');
      if(btn) this.handleCopy(btn, false);
    }
  }

  handleCopy = (btn, mobile) => {
    // add events to copy buttons
    btn.addEventListener('click', async e => {
      e.stopImmediatePropagation();
      e.preventDefault();
      e.stopPropagation();
      try {
        const text = this.removeHTMLTags(this.innerHTML);
        navigator.clipboard.writeText(text);
        await this.app.showToast(true, 'Message copied to clipboard');
      } catch (error) {
        await this.app.showToast(false, 'Failed to copy message');
      }

      // if mobile, close the dropdown
      if(mobile) this.closeContextMenu();
    });
  }

  closeContextMenu = () => {
    this.container.openedContextNode = null;
    const actionsDropdown = this.shadow.querySelector('.actions-dropdown');
    if(actionsDropdown) actionsDropdown.style.display = 'none';
  }

  /* on right click the div.content, show the actions dropdown */
  showActionsDropdown = () => {
    // add right click event listener to the div.content
    this.shadow.querySelector('.content > .message > .text').addEventListener('contextmenu', e => {
      e.preventDefault();
      const openedContextNode = this.container.openedContextNode;

      // get the actions dropdown
      const actionsDropdown = this.shadow.querySelector('.actions-dropdown');

      // if openedContextNode is not null close it
      if(openedContextNode) {
        openedContextNode.closeContextMenu()
      }

      // if the openedContextNode is the same as this, set it to null and return
      if(openedContextNode === this) return;

      this.container.openedContextNode = this;

      // check how (this) is positioned from to or bottom
      const top = e.clientY;
      const bottom = window.innerHeight - e.clientY;

      // if the bottom is less than 200px, show the dropdown at the top
      if (bottom > 350) {
        actionsDropdown.style.top = '25px';
        actionsDropdown.style.bottom = 'unset';
      } else {
        actionsDropdown.style.top = 'unset';
        actionsDropdown.style.bottom = '25px'
      }

      // show the actions dropdown
      actionsDropdown.style.display = 'flex';

      // add click outside dropdown event listener to cloase the dropdown
      document.addEventListener('click', e => {
        if (e.target !== actionsDropdown && e.target !== this.shadow.querySelector('.actions-dropdown .actions-container')) {
          this.closeContextMenu();
          actionsDropdown.style.display = 'none';
          this.container.openedContextNode = null;
        }
      }, { once: true });
    });
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

  handleReply = mql => {
    // get the reply action button
    const you = this.textToBoolean(this.getAttribute('you'));
    
    if (!mql.matches) {
      const actions = this.shadow.querySelector('.content > .message > .actions');

      // call the reply function
      this.replyToMessage(actions, you, 'desktop');
    } else {
      const actions = this.shadow.querySelector('.actions-dropdown');
      // call the reply function
      this.replyToMessage(actions, you, 'mobile');
    }
  }

  replyToMessage = (container, you, kind) => {
    const reply = container.querySelector('.action.reply');
    if (reply) {
      reply.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const data = {
          id: 43,
          user: this.getAttribute('user-name').split(' ')[0],
          you: you,
          text: this.removeHTMLTags(this.innerHTML),
        }

        this.container.setReply(data);

        // close container
        if (kind === 'mobile') {
          this.closeContextMenu();
        }
        });
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
    const dateIso = new Date(str); // ISO strings with timezone are automatically handled
    let userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert posted time to the current timezone
    const date = new Date(dateIso.toLocaleString('en-US', { timeZone: userTimezone }));

    // Get the current time
    const currentTime = new Date();

    // Get the difference in time
    const timeDifference = currentTime - date;

    // Get the seconds
    const seconds = timeDifference / 1000;

    // Check if seconds is less than 60: return Just now
    if (seconds < 60) {
      return 'Just now';
    }
    // check if seconds is less than 86400: return time AM/PM
    if (seconds < 86400) {
      const isToday = date.getDate() === currentTime.getDate();
      if (isToday) {
        return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
      } else {
        return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
      }
    }

    // check if seconds is less than 604800: return day and time
    if (seconds <= 604800) {
      // return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: true });
      return `${date.toLocaleDateString('en-US', { weekday: 'short' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
    }

    // Check if the date is in the current year:: return date and month short 2-digit year without time
    if (date.getFullYear() === currentTime.getFullYear()) {
      return `${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
    }
    else {
      return `${date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: '2-digit' })} at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}`;
    }
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
    const reacted = this.reactions.from || this.reactions.to ? 'reacted' : '';
    if (you) {
      return /* html */`
        <div class="content ${reacted} ${you} ${reply}">
          ${this.getMessageContent(you)}
        </div>
      `;
    } else {
      return /* html */`
        <div class="content ${you} ${reply} ${reacted}">
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
        ${this.getInlineActions(this.mql)}
        ${this.getDesktopReactions(this.mql)}
        ${this.getActionsDropdown(this.mql)}
        <div class="time">
          <span class="date">${this.formatDateTime(this.getAttribute('datetime'))}</span>
          <span class="sp">•</span>
          ${this.getStatus(you, this.getAttribute('status'))}
        </div>
      </div>
    `;
  }

  getInlineActions = mql => {
    if (!mql.matches) {
      return /* html */`
        <div class="actions">
          ${this.getActions()}
        </div>
      `;
    } else {
      return '';
    }
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
        <div class="message-text">
          ${this.innerHTML}
          ${this.getUnread(this.textToBoolean(this.getAttribute('you')), this.getAttribute('status'))}
        </div>
        ${this.getAttachements()}
        ${this.getImages()}
        ${this.getUserReactions(this.reactions)}
      </div>
    `;
  }

  removeHTMLTags = str => {
    // remove html tags like: <, >, &gt;, &lt; and all attributes
    return str.replace(/(<([^>]+)>)/gi, '')
      .replace(/&lt;/g, '').replace(/&gt;/g, '')
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
          ${this.getStatusIcon('sent')}
        </span>
      `;
    } else if (status === 'delivered') {
      return /* html */`
        <span class="tick delivered">
          ${this.getStatusIcon('delivered')}
        </span>
      `;
    } else if (status === 'seen') {
      return /* html */`
        <span class="tick read">
          ${this.getStatusIcon('seen')}
        </span>
      `;
    } else {
      return '';
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

  getDesktopReactions = mql => {
    if (!mql.matches) {
      const reactions = this.reactions;
      const you = this.textToBoolean(this.getAttribute('you'));
      return /* html */`
        <div class="desktop-reactions">
          <span class="reaction like ${this.checkActiveReaction(reactions, 'like', you)}" data-reaction="like" data-content="&#128077;">&#128077;</span>
          <span class="reaction love ${this.checkActiveReaction(reactions, 'love', you)}" data-reaction="love" data-content="&#128525;">&#128525;</span>
          <span class="reaction laugh ${this.checkActiveReaction(reactions, 'laugh', you)}" data-reaction="laugh" data-content="&#128514;">&#128514;</span>
          <span class="reaction wow ${this.checkActiveReaction(reactions, 'wow', you)}" data-reaction="wow" data-content="&#128558;">&#128558;</span>
          <span class="reaction sad ${this.checkActiveReaction(reactions, 'sad', you)}" data-reaction="sad" data-content="&#128546;">&#128546;</span>
          <span class="reaction angry ${this.checkActiveReaction(reactions, 'angry', you)}" data-reaction="angry" data-content="&#128544;">&#128544;</span>
        </div>
      `;
    }

    return '';
  }

  getActionsDropdown = mql => {
    // if mql does not match, return nothing
    if (!mql.matches) return '';
    const reactions = this.reactions;
    const you = this.textToBoolean(this.getAttribute('you'));
    const dateTime = this.getAttribute('datetime');
    return /* html */`
      <div class="actions-dropdown">
        <div class="actions-container">
          <div class="reactions">
            <span class="reaction like ${this.checkActiveReaction(reactions, 'like', you)}" data-reaction="like" data-content="&#128077;">&#128077;</span>
            <span class="reaction love ${this.checkActiveReaction(reactions, 'love', you)}" data-reaction="love" data-content="&#128525;">&#128525;</span>
            <span class="reaction laugh ${this.checkActiveReaction(reactions, 'laugh', you)}" data-reaction="laugh" data-content="&#128514;">&#128514;</span>
            <span class="reaction wow ${this.checkActiveReaction(reactions, 'wow', you)}" data-reaction="wow" data-content="&#128558;">&#128558;</span>
            <span class="reaction sad ${this.checkActiveReaction(reactions, 'sad', you)}" data-reaction="sad" data-content="&#128546;">&#128546;</span>
            <span class="reaction angry ${this.checkActiveReaction(reactions, 'angry', you)}" data-reaction="angry" data-content="&#128544;">&#128544;</span>
          </div>
          <div class="actions">
            <span class="action reply" data-action="reply">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
                <path d="M21.7109 9.3871C21.8404 9.895 21.9249 10.4215 21.9598 10.9621C22.0134 11.7929 22.0134 12.6533 21.9598 13.4842C21.6856 17.7299 18.3536 21.1118 14.1706 21.3901C12.7435 21.485 11.2536 21.4848 9.8294 21.3901C9.33896 21.3574 8.8044 21.2403 8.34401 21.0505C7.83177 20.8394 7.5756 20.7338 7.44544 20.7498C7.31527 20.7659 7.1264 20.9052 6.74868 21.184C6.08268 21.6755 5.24367 22.0285 3.99943 21.9982C3.37026 21.9829 3.05568 21.9752 2.91484 21.7349C2.77401 21.4946 2.94941 21.1619 3.30021 20.4966C3.78674 19.5739 4.09501 18.5176 3.62791 17.6712C2.82343 16.4623 2.1401 15.0305 2.04024 13.4842C1.98659 12.6533 1.98659 11.7929 2.04024 10.9621C2.31441 6.71638 5.64639 3.33448 9.8294 3.05621C10.2156 3.03051 10.6067 3.01177 11 3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M8.5 15H15.5M8.5 10H12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M14 4.5L22 4.5M14 4.5C14 3.79977 15.9943 2.49153 16.5 2M14 4.5C14 5.20023 15.9943 6.50847 16.5 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <span class="text">Reply</span>
            </span>
            <span class="action copy" data-action="copy">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
                <path d="M17.0235 3.03358L16.0689 2.77924C13.369 2.05986 12.019 1.70018 10.9555 2.31074C9.89196 2.9213 9.53023 4.26367 8.80678 6.94841L7.78366 10.7452C7.0602 13.4299 6.69848 14.7723 7.3125 15.8298C7.92652 16.8874 9.27651 17.247 11.9765 17.9664L12.9311 18.2208C15.631 18.9401 16.981 19.2998 18.0445 18.6893C19.108 18.0787 19.4698 16.7363 20.1932 14.0516L21.2163 10.2548C21.9398 7.57005 22.3015 6.22768 21.6875 5.17016C21.0735 4.11264 19.7235 3.75295 17.0235 3.03358Z" stroke="currentColor" stroke-width="1.8" />
                <path d="M16.8538 7.43306C16.8538 8.24714 16.1901 8.90709 15.3714 8.90709C14.5527 8.90709 13.889 8.24714 13.889 7.43306C13.889 6.61898 14.5527 5.95904 15.3714 5.95904C16.1901 5.95904 16.8538 6.61898 16.8538 7.43306Z" stroke="currentColor" stroke-width="1.8" />
                <path d="M12 20.9463L11.0477 21.2056C8.35403 21.9391 7.00722 22.3059 5.94619 21.6833C4.88517 21.0608 4.52429 19.6921 3.80253 16.9547L2.78182 13.0834C2.06006 10.346 1.69918 8.97731 2.31177 7.89904C2.84167 6.96631 4 7.00027 5.5 7.00015" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
              </svg>
              <span class="text">Copy</span>
            </span>
            ${this.getDropDownYouActions(you, dateTime)}
          </div>
        </div>
      </div>
    `;
  }

  checkActiveReaction = (reactions, str, you) => {
    if (typeof reactions !== 'object' || !reactions) return '';
    
    // if message is yours, check if the reaction is from you:: return active
    if (you && reactions.from === str) return 'active';

    // if message is not yours, check if the reaction is to you:: return active
    if (!you && reactions.to === str) return 'active';

    return '';
  }

  getUserReactions = reactions => {
    if (!reactions) return '';
    if(reactions.from === null && reactions.to === null) return '';
    return /* html */`
      <span class="user-reactions">
        ${this.getActiveEmojis(reactions)}
      </span>
    `;
  }

  getActiveEmojis = reactions => {
    if (!reactions) return '';
    if (reactions.from !== null && reactions.to !== null) {
      if(reactions.from === reactions.to) {
        return /* html */`
          <span class="user-reaction ${reactions.from}">
            <span class="emoji">${this.getReactionEmoji(reactions.from)}</span>
            <span class="count">2</span>
          </span>
        `;
      } else {
        return /* html */`
          <span class="user-reaction ${reactions.from} ${reactions.to}">
            <span class="emoji">${this.getReactionEmoji(reactions.from)}</span>
            <span class="emoji">${this.getReactionEmoji(reactions.to)}</span>
          </span>
        `;
      }
    } else if(reactions.from !== null) {
      return /* html */`
        <span class="user-reaction ${reactions.from}">
          <span class="emoji">${this.getReactionEmoji(reactions.from)}</span>
          <span class="count">1</span>
        </span>
      `;
    } else if(reactions.to !== null) {
      return /* html */`
        <span class="user-reaction ${reactions.to}">
          <span class="emoji">${this.getReactionEmoji(reactions.to)}</span>
          <span class="count">1</span>
        </span>
      `;
    } else {
      return '';
    }
  }

  getReactionEmoji = reaction => {
    if (reaction === 'like') return '&#128077;';
    if (reaction === 'love') return '&#128525;';
    if (reaction === 'laugh') return '&#128514;';
    if (reaction === 'wow') return '&#128558;';
    if (reaction === 'sad') return '&#128546;';
    if (reaction === 'angry') return '&#128544;';
    return '';
  }

  getDropDownYouActions = (you, dateTime) => {
    if (!you) return '';
    return /* html */`
      ${this.getDropDownEdit(dateTime)}
      <span class="action delete" data-action="delete">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
          <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M9.5 16.5L9.5 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
          <path d="M14.5 16.5L14.5 10.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
        </svg>
        <span class="text">Delete</span>
      </span>
    `;
  }

  getDropDownEdit = date => {
    // if the date is less than 15 minutes ago, show the edit action
    try {
      date = new Date(date);
      const diff = new Date() - date;

      if (diff < 1000 * 60 * 15) {
        return /* html */`
          <span class="action edit" data-action="edit">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M21.9165 10.5001C21.9351 10.6557 21.9495 10.8127 21.9598 10.9708C22.0134 11.801 22.0134 12.6608 21.9598 13.491C21.6856 17.7333 18.3536 21.1126 14.1706 21.3906C12.7435 21.4855 11.2536 21.4853 9.82937 21.3906C9.33893 21.358 8.80437 21.241 8.34398 21.0514C7.83174 20.8404 7.57557 20.7349 7.44541 20.7509C7.31524 20.7669 7.12637 20.9062 6.74865 21.1847C6.08265 21.6758 5.24364 22.0286 3.9994 21.9983C3.37023 21.983 3.05565 21.9753 2.91481 21.7352C2.77398 21.4951 2.94938 21.1627 3.30018 20.4979C3.78671 19.5759 4.09498 18.5204 3.62788 17.6747C2.8234 16.4667 2.14007 15.0361 2.04021 13.491C1.98656 12.6608 1.98656 11.801 2.04021 10.9708C2.31438 6.7285 5.64636 3.34925 9.82937 3.07119C11.0318 2.99126 12.2812 2.97868 13.5 3.0338" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M8.49997 15.0001H15.5M8.49997 10.0001H11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M20.8683 2.43946L21.5607 3.13183C22.1465 3.71761 22.1465 4.66736 21.5607 5.25315L17.9333 8.94881C17.6479 9.23416 17.2829 9.42652 16.8863 9.50061L14.6381 9.98865C14.2832 10.0657 13.9671 9.75054 14.0431 9.39537L14.5216 7.16005C14.5957 6.76336 14.7881 6.39836 15.0734 6.11301L18.747 2.43946C19.3328 1.85368 20.2825 1.85368 20.8683 2.43946Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            <span class="text">Edit</span>
          </span>
        `;
      } else return '';
    } catch (error) {
      return '';
    }
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
         <a href="${attachement.link}" target="_blank"
           title="${attachement.name}" size="${attachement.size}" type="${attachement.type}" download>
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

          /* disable user selection */
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -khtml-user-select: none;
        }

        .content {
          width: max-content;
          max-width: 72%;
          width: 72%;
          padding: 5px 0;
          cursor: pointer;
          display: flex;
          flex-flow: row;
          align-items: start;
          justify-content: start;
          position: relative;
          gap: 0;
        }

        .content.you {
          justify-content: flex-end;
          align-items: end;
          flex-flow: row;
        }

        .content.reply {
          padding: 45px 0 0 0;
        }

        .content:hover > .message > .time,
        .content > .message:hover > .actions {
          display: flex;
        } 

        .content > .avatar {
          display: none;
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
          /* max-width: calc(100% - 40px); */
          max-width: 100%;
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
          top: -15px;
          left: 0;
          padding: 0;
          display: none;
          flex-direction: row;
          align-items: center;
          gap: 0;
          border-radius: 15px;
        }

        .content.reply > .message > .actions {
          top: 25px;
        }

        .content.you > .message > .actions {
          left: unset;
          right: 0;
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
          left: 0;
          padding: 5px 10px;
          background: var(--chat-hover);
          border-radius: 10px;
          color: inherit;
          font-family: var(--font-main), sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          box-shadow: var(--shadow);
        }

        .content.you > .message > .actions > .action > .info {
          left: unset;
          right: 0;
        }

        .content > .message > .actions > .action:hover > .info {
          display: flex;
        }

        .content > .message > .actions > .action > .info > .arrow {
          position: absolute;
          top: 100%;
          left: 20px;
          display: inline-block;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 5px solid transparent;
          border-right: 5px solid transparent;
          border-top: 5px solid var(--chat-hover);
        }

        .content.you > .message > .actions > .action > .info > .arrow {
          left: unset;
          right: 10px;
        }

        .content > .message > .actions > .action > svg {
          width: 22px;
          height: 22px;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }

        .content > .message > .desktop-reactions {
          z-index: 1;
          position: absolute;
          top: -15px;
          left: 0;
          display: none;
          flex-direction: row;
          align-items: center;
          background: var(--background);
          box-shadow: var(--box-shadow);
          justify-content: start;
          gap: 0;
          border: var(--border);
          padding: 0;
          border-radius: 15px;
        }

        .content.reply > .message > .desktop-reactions {
          top: 25px;
        }

        .content.you > .message > .desktop-reactions {
          left: unset;
          right: 0;
        }

        .content > .message > .desktop-reactions > .reaction {
          display: flex;
          flex-flow: row;
          gap: 0;
          font-size: 1.58rem;
          padding: 5px 6px;
          height: max-content;
          border-radius: 15px;
          cursor: pointer;
        }

        .content > .message > .desktop-reactions > .reaction.active,
        .content > .message > .desktop-reactions > .reaction:hover {
          background: var(--tab-background);
          color: var(--accent-color);
        }

        .content > .message > .text {
          background: var(--chat-background);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: start;
          gap: 0;
          margin: 0;
          padding: 0;
          border-radius: 15px;
          width: max-content;
          max-width: 100%;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          line-height: 1.4;
          position: relative;
        }

        .content > .message > .text > .message-text {
          box-sizing: border-box;
          /* border: 1px solid red; */
          padding: 6px 10px;
        }

        .content.reacted > .message > .text > .message-text {
          padding: 6px 10px 7px;
        }

        .content.you > .message > .text > .message-text {
          padding: 6px 10px 6px;
        }

        .content.you.reacted > .message > .text > .message-text {
          padding: 7px 10px 8px;
        }

        .content.reply > .message > .text {
          border-top-left-radius: 0;
        }

        .content.reply.you > .message > .text {
          border-top-right-radius: 0;
          border-top-left-radius: 15px;
        }

        .content.you > .message > .text {
          color: var(--white-color);
          background-color: var(--accent-color);
          background-image: var(--message-background);
          background-attachment: fixed;
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

        .content > .message > .text > .message-text > span.tick {
          /* border: 1px solid red; */
          float: right;
          display: inline-block;
          margin: 6px 0 0 5px;
          margin-right: -5px;
        }

        .content > .message > .text > .message-text > span.tick svg {
          /* border: 1px solid blue; */
          display: flex;
          align-items: flex-end;
          justify-content: center;
          color: var(--white-color);
        }

        .content > .message > .text > .message-text > span.tick.read > svg {
          color: var(--white-color);
          fill: var(--accent-color);
        }

        .content > .message > .text > .message-text > span.tick.delivered > svg {
          color: var(--accent-color);
          fill: none;
        }

        .content > .message > .text > .message-text > span.tick.delivered > svg {
          color: var(--white-color);
        }

        /* user-reactions */
        .content > .message > .text > .user-reactions {
          border: none;
          border: 2px solid var(--background);
          display: flex;
          flex-flow: row nowrap;
          align-items: center;
          gap: 2px;
          padding: 3px 6px;
          position: absolute;
          left: 0;
          min-width: max-content;
          bottom: -23px;
          background: var(--chat-background);
          color: var(--gray-color);
          z-index: 1;
          border-radius: 15px;
        }

        .content.you > .message > .text > .user-reactions {
          left: unset;
          right: 0;
        }

        .content > .message > .text > .user-reactions > .user-reaction {
          display: flex;
          flex-flow: row nowrap;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .content > .message > .text > .user-reactions > .user-reaction > span.count {
          font-size: 1rem;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
          color: var(--gray-color);
        }

        .content > .message > .text > .user-reactions > .user-reaction > span.emoji {
          font-size: 1rem;
          display: inline-block;
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
          /*text-transform: capitalize;*/
          color: var(--gray-color);
        }

        .content.you > .message > .time {
          /* border: 1px solid var(--accent-color); */
          padding: 0 7px 0 4px;
        }

        .content.reacted > .message > .time {
          margin: 20px 0 0 0;
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
          max-width: calc(100% - 10px);
          flex-direction: column;
          gap: 4px;
          left: 0;
          position: absolute;
          top: -12px;
        }

        .content.you > .message > .reply {
          align-self: flex-end;
          align-items: end;
        }

        .content.you > .message > .reply {
          left: unset;
          right: 0;
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

        /* actions dropdown */
        .content > .message > .actions-dropdown {
          /*border: var(--border);*/
          display: none;
          flex-flow: column;
          position: absolute;
          top: 25px;
          left: 0;
          width: max-content;
          height: max-content;
          border-radius: 15px;
          z-index: 1;
        }

        .content.you > .message > .actions-dropdown {
          left: unset;
          right: 0;
        }

        .content > .message > .actions-dropdown > .actions-container {
          display: flex;
          flex-flow: column;
          gap: 12px;
          padding: 0;
          border-radius: 15px;
        }

        .content > .message > .actions-dropdown > .actions-container > .reactions {
          display: flex;
          flex-flow: row;
          align-items: center;
          background: var(--background);
          box-shadow: var(--box-shadow);
          justify-content: start;
          gap: 0;
          border: var(--border);
          padding: 0;
          border-radius: 15px;
        }

        .content > .message > .actions-dropdown > .actions-container > .reactions > .reaction {
          display: flex;
          flex-flow: row;
          gap: 0;
          font-size: 1.58rem;
          padding: 5px 6px;
          height: max-content;
          border-radius: 15px;
          cursor: pointer;
        }

        .content > .message > .actions-dropdown > .actions-container > .reactions > .reaction.active {
          background: var(--tab-background);
          color: var(--accent-color);
        }

        .content > .message > .actions-dropdown > .actions-container > .actions {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          background: var(--background);
          border-radius: 15px;
          border: var(--border);
          box-shadow: var(--box-shadow);
          overflow: hidden;
        }

        .content > .message > .actions-dropdown > .actions-container > .actions > span.action {
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: start;
          gap: 8px;
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          padding: 10px 8px;
          cursor: pointer;
          border-radius: 0;
        }

        .content > .message > .actions-dropdown > .actions-container > .actions > span.action:hover {
         /* background: var(--tab-background);
          color: var(--accent-color);*/
        }

        /* images & attachments */
        .content > .message > .text > .images {
          display: flex;
          justify-content: start;
          align-items: center;
          width: 100%;
          gap: 5px;
          margin: 0;
          padding: 0 10px 9px;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .content > .message > .text > .images::-webkit-scrollbar {
          display: none;
          visibility: hidden;
        }

        .content > .message > .text > .images > .image {
          width: max-content;
          height: 40px;
          min-width: 40px;
          max-width: 40px;
          min-height: 40px;
          max-height: 40px;
          border-radius: 10px;
          overflow: hidden;
        }

        .content > .message > .text > .images > .image > img {
          width: auto;
          height: 100%;
          object-fit: cover;
        }

        .content > .message > .text > .attachements {
          display: flex;
          flex-direction: row;
          justify-content: start;
          flex-wrap: wrap;
          align-items: start;
          width: 100%;
          max-width: 100%;
          gap: 5px;
          padding: 0 10px 9px;
          margin: 0;
        }

        .content > .message > .text > .attachements > a {
          width: max-content;
          display: flex;
          justify-content: start;
          align-items: center;
          gap: 5px;
          text-decoration: none;
          color: var(--anchor-color);
          font-family: var(--font-read), sans-serif;
          font-size: 0.85rem;
          background: var(--attachement-background);
          border-radius: 8px;
          padding: 2.5px 7px;

          /** add ellipsis */
          white-space: nowrap;
        }

        @media screen and (max-width: 660px) {
          :host {
            
          }

          /* reset all cursor: pointer to cursor: default */
          a, button, input, label, select, textarea,
          ul.tabs > li.tab, ul.tabs > li.tab.active,
          .content > .message > .actions > .action,
          .content > .message > .actions-dropdown > .actions-container > .reactions > .reaction,
          .content > .message > .actions-dropdown > .actions-container > .actions > span.action,
          .content,
          .content > .message > .text a,
          .content > .message,
          :host {
            cursor: default !important;
          }

          .content {
            width: max-content;
            max-width: 85%;
            width: 85%;
            gap: 8px;
          }

          .content > .message > .text > span.tick {
            float: right;
            display: inline-block;
            margin: 4px 0 0 5px;
          }

          .content > .message > .text > span.tick svg {
            width: 16px;
            height: 16px;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            color: var(--gray-color);
          }
        }
      </style>
    `;
  }
}