export default class Response extends HTMLDivElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.url = this.getAttribute('url');
    this.app = window.app;
    this.api = this.app.api;
    this.parent = this.getRootNode().host;
    this.render();
  }

  render() {
    this.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const editor = this.querySelector('div#editor');
    if (editor) { 
      this.growTextarea(editor);
      this.activateActions(editor);
      this.submit(editor);
    }
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

  activateActions = editor => {
    const video = editor.querySelector('div.actions-container > div.actions > button.video');
    const image = editor.querySelector('div.actions-container > div.actions > button.image');
    const attachment = editor.querySelector('div.actions-container > div.actions > button.attachment');

    this.addActionListener(video, this.getVideosEditor, editor);
    this.addActionListener(image, this.getImagesEditor, editor);
    this.addActionListener(attachment, this.getAttachmentsEditor, editor);
  }

  submit = editor => {
    const submit = editor.querySelector('form.message-form > button.send');
    if(!submit) return;

    // add event listener to the submit button
    submit.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      // get the message
      const reply = editor.querySelector('form.message-form > textarea#message').value;

      // disable the submit button
      submit.pointerEvents = 'none';
      submit.innerHTML = this.getButtonLoader();

      if(reply.trim().length < 1) {
        const message = editor.querySelector('form.message-form > textarea#message');
        this.app.showToast(false, 'Please enter a reply');
        // focus on the message
        message.focus();
        // enable the submit button
        submit.innerHTML = this.getSendIcon();
        submit.pointerEvents = 'auto';
        return;
      }
      // repy to the post
      this.reply(reply, editor);
    });
  }

  reply = (reply, editor) => {
    const images = this.querySelector('div#upload-images');
 
    const data = {
      content: this.processText(reply),
      kind: 'reply'
    }

    if(images) {
      const imageArray = images.getImages();
      // check if there are images
      if(imageArray.length > 0) {
        data.images = imageArray;
      }
    }

    // handle the reply
    this.handleReply(data, editor);
  }

  handleReply = async (data, editor) => {
    const submit = editor.querySelector('form.message-form > button.send');
    try {
      // send the reply
      const result = await this.api.put(this.url, { body: data, content: 'json' });

      // handle the response
      if (!result.success) {
        this.app.showToast(false, result.message);
        // enable the submit button
        submit.innerHTML = this.getSendIcon();
        submit.pointerEvents = 'auto';
        return;
      }

      // show success message
      this.app.showToast(true, result.message);

      // clear the editor
      this.clearEditor(editor);
      // enable the submit button
      submit.innerHTML = this.getSendIcon();
      submit.pointerEvents = 'auto';
      this.parent.addReply(result.reply);
    } catch (error) {
      // console.error('Error handling reply:', error);
      this.app.showToast(false, 'There was an error posting the reply.');
      // enable the submit button
      submit.innerHTML = this.getSendIcon();
      submit.pointerEvents = 'auto';
    }
  }

  clearEditor = editor => {
    const message = editor.querySelector('form.message-form > textarea#message');
    const images = editor.querySelector('div#upload-images');
    if(message) message.value = '';
    if(images) images.clearImages();

    // add input trigger to adjust the rows
    message.dispatchEvent(new Event('input'));
  }

  processText = text => {
    // separate the text into paragraphs with new lines \n or <br> adding eact to a p tag
    const paragraphs = text.split(/\n|<br>/g);
    let processed = '';
    paragraphs.forEach(p => {
      if(p.trim().length > 0) {
        processed += `<p>${p}</p>`;
      }
    });

    return processed;
  }

  addActionListener = (button, getEditor, editor) => {
    button.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      // show the respective editor
      editor.insertAdjacentHTML('afterbegin', getEditor());
      // close the editor
      this.closeSoon(editor);
    });
  }

  closeSoon = editor => {
    const soon = editor.querySelector('div.coming-soon');
    if(!soon) return;
    const cancel = soon.querySelector('.cancel');

    cancel.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      soon.style.animation = 'hide-soon 0.3s forwards';
    });

    // add timeout to automatically close soon
    setTimeout(() => {
      soon.style.animation = 'hide-soon 0.3s forwards';
      soon.style.display = 'none';
    }, 5000);
  }

  removeHtml = () => {
    const title = this.getAttribute('preview-title')
    const text = this.getHTML();
    let str = text.replace(/<[^>]*>/g, '');

    str = str.trim();
    let filteredTitle = ''
    if (!title || title === null || title === "null" || title === undefined || title === "undefined") {
      filteredTitle = ''
    } else {
      filteredTitle = `<h3>${title}</h3>`
    }

    const content = `<p>${this.trimContent(str)}</p>`;

    return `
      ${filteredTitle}
      ${content}
    `
  }

  trimContent = text => {
    // if text is less than 150 characters
    if (text.length <= 250) return text;

    return text.substring(0, 250) + '...';
  }

  getHTML = () => {
    const text = this.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    return doc.body.innerHTML;
  }

  formatNumber = n => {
    if (n < 1000) return n.toString();
    if (n < 10000) return `${(n / 1000).toFixed(2)}k`;
    if (n < 100000) return `${(n / 1000).toFixed(1)}k`;
    if (n < 1000000) return `${(n / 1000).toFixed(0)}k`;
    if (n < 10000000) return `${(n / 1000000).toFixed(2)}M`;
    if (n < 100000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n < 1000000000) return `${(n / 1000000).toFixed(0)}M`;
    return "1B+";
  }

  parseToNumber = str => {
    // Try parsing the string to an integer
    const num = parseInt(str);

    // Check if parsing was successful
    if (!isNaN(num)) {
      return num;
    } else {
      return 0;
    }
  }

  disableScroll() {
    // Get the current page scroll position
    let scrollTop = window.scrollY || document.documentElement.scrollTop;
    let scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    document.body.classList.add("stop-scrolling");

    // if any scroll is attempted, set this to the previous value
    window.onscroll = function () {
      window.scrollTo(scrollLeft, scrollTop);
    };
  }

  enableScroll() {
    document.body.classList.remove("stop-scrolling");
    window.onscroll = function () { };
  }

  getTemplate() {
    // Show HTML Here
    return /*html*/`
      ${this.getBody()}
      ${this.getStyles()}
    `
  }

  getBody = () => {
    return /* html */`
      ${this.getEditor()}
    `;
  }

  getEditor = () => {
    return /* html */`
      <div class="editor" id="editor">
        <form class="form message-form">
          <div class="actions-container">
            ${this.getActions()}
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
          <textarea name="message" id="message" cols="30" rows="1" placeholder="${this.getAttribute('placeholder')}" required></textarea>
          <button type="submit" class="send" title="Send">
            ${this.getSendIcon()}
          </button>
        </form>
      </div>
    `;
  }

  getSendIcon = () => {
    return /* html */`
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
    `;
  }

  getButtonLoader() {
    return /*html*/`
      <span id="btn-loader">
				<span class="loader"></span>
			</span>
    `
  }

  getActions = () => {
    return /* html */`
      <div class="actions">
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
    `;
  }

  getImagesEditor = () => {
    return /* html */`
      <div is="post-images" class="images" id="upload-images" url="/i/upload"></div>
    `;
  }

  getVideosEditor = () => {
    return /* html */`
      <div class="coming-soon">
        <p class="soon">Soon you'll be able to share videos</p>
        <span class="cancel" title="Cancel">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
    `;
  }

  getAttachmentsEditor = () => {
    return /* html */`
      <div class="coming-soon">
        <p class="soon">Soon you'll be able to share files</p>
        <span class="cancel" title="Cancel">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
            <path d="M6 18L18 6M6 6L18 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </div>
    `;
  }

  getStyles() {
    return /*css*/`
      <style>
        * {
          box-sizing: border-box !important;
        }

        #btn-loader {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
        }

        #btn-loader > .loader {
          width: 20px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #18A565 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #21D029 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background: var(--_g) 0 0,  var(--_g1) 100% 0, var(--_g2) 100% 100%, var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        @keyframes l38 {
          100% {
            background-position: 100% 0, 100% 100%, 0 100%, 0 0
          }
        }

        /* editor */
        div.editor#editor {
          border-top: var(--border);
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

        div.editor#editor > .coming-soon {
          z-index: 0;
          padding: 0;
          border-radius: 15px;
          margin: 0;
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

        div.editor#editor > .coming-soon > .cancel {
          display: flex;
          justify-content: center;
          align-items: center;
          position: absolute;
          cursor: pointer;
          z-index: 1;
          top: 2px;
          right: 5px;
        }

        div.editor#editor > .coming-soon > .cancel > svg {
          width: 16px;
          height: 16px;
          color: var(--error-color);
        }

        div.editor#editor > .coming-soon > .soon {
          font-size: 0.9rem;
          font-weight: 400;
          width: max-content;
          max-width: 100%;
          padding: 8px 0 25px;
          font-family: inherit;
          color: var(--text-color);
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
          position: relative;
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

        @media screen and ( max-width: 660px ) {
          /* reset all cursor: pointer to cursor: default */
          a, button, input, label, select, textarea,
          ul.tabs > li.tab, ul.tabs > li.tab.active,
          div.editor#editor > .coming-soon > .cancel {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}