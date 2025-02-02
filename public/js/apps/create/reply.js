export default class CreateReply extends HTMLDivElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this.content = null;
    this.editor = null;

    this.hash = this.getAttribute('hash');

    this._url = this.getAttribute('api');

    this.kind = this.getAttribute('kind');
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    // this.shadowObj.innerHTML = this.getTemplate();
    this.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // select the form
    const form = this.querySelector('form');

    // select the section
    const section = this.querySelector('section#content');

    if (form && section) {
      // add event listener to the form
      this.submitForm(form, section);

      this.growTextarea(form);
    }

    const btns = this.querySelectorAll('.cancel-btn');
    const overlay = this.querySelector('.overlay');

    // Close the modal
    if (overlay && btns) {
      this.closePopup(overlay, btns);
    }

    this.disableScroll();
  }

  growTextarea = form => {
    const input = form.querySelector('textarea#editor');
    const actions = form.querySelector('.actions');
    
    if (form && actions) {
      const adjustRows = () => {
        const maxRows = 7;
        const style = window.getComputedStyle(input);
        const lineHeight = parseInt(style.lineHeight, 10);
        
        // Calculate the height offset (padding + border)
        const paddingHeight = parseInt(style.paddingTop, 10) + parseInt(style.paddingBottom, 10);
        const borderHeight = parseInt(style.borderTopWidth, 10) + parseInt(style.borderBottomWidth, 10);
        const offset = paddingHeight + borderHeight;
  
        // Reset the rows to 1 to calculate the new height
        input.rows = 1;
  
        // Calculate the number of rows based on scrollHeight minus the offset
        const newRows = Math.ceil((input.scrollHeight - offset) / lineHeight);
        input.rows = Math.min(maxRows, Math.max(newRows, 1)); // Ensure at least 1 row
  
        // Toggle actions visibility based on input
        if (input.value.trim().length > 0) {
          actions.classList.add('active');
        } else {
          actions.classList.remove('active');
        }
      };
  
      input.addEventListener('input', adjustRows);
      input.addEventListener('paste', adjustRows);
      
      // Initial adjustment on page load
      adjustRows();
    }
  };    

  disconnectedCallback() {
    this.enableScroll();
  }

  closePopup = (overlay, btns) => {
    overlay.addEventListener('click', e => {
      e.preventDefault();
      this.remove();
    });

    btns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.remove();
      });
    })
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

  submitForm = async (form, section) => {
    const outerThis = this;
    // add submit event listener
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const serverStatus = form.querySelector('.server-status');

      // if server status is already showing, remove it
      if (serverStatus) {
        serverStatus.remove();
      }

      const button = form.querySelector('.action.submit');
      const actions = form.querySelector('.actions');

      // show loader inside the button
      button.innerHTML = this.getButtonLoader();
      // disable pointer events
      button.style.pointerEvents = 'none';

      // get the editor data
      const data = new FormData(form)

      const body = {
        content: data.get('editor')
      }

      // validate the editor data
      if (!this.validateData(form, body, actions)) {
        // reset button
        button.innerHTML = '<span class="text">Reply</span>';
        // enable pointer events
        button.style.pointerEvents = 'auto';

        return;
      };

      // get images-uploader: images attribute
      const imagesUploader = form.querySelector('images-uploader');
      let images = imagesUploader.getAttribute('images').split(',');

      images = images.filter(image => image.trim() !== '' && image !== 'null' && image.length > 5);
      
      // if length is greater than 0, add them to the body
      if (images.length > 0) {
        // Construct the body object
        body.images = images;
      }

      body.kind = this.kind;
      body.content = outerThis.processTextAreaInput(body.content)

      try {
        const result = await this.api.put(this._url, { content: 'json', body: JSON.stringify(body) });

        // check if request was successful
        if (result.success) {
          // activate the finish step
          section.innerHTML = this.getFinish();
          this.activateFinish();
        } else {
          // show error message
          actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, result.message));

          // reset button
          button.innerHTML = /* html */`<span class="text">Reply</span>`;
          // enable pointer events
          button.style.pointerEvents = 'auto';
        }
      }
      catch (error) {
        console.error(error);
        // show error message
        actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, 'An error occurred, please try again'));

        // reset button
        button.innerHTML = '<span class="text">Reply</span>';
        // enable pointer events
        button.style.pointerEvents = 'auto';
      }

      // remove success message
      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);
    });
  }

  processTextAreaInput = input => {
    return input
      .split('\n') // Split the input by new lines
      .map(line => line.trim()) // Trim each line to remove spaces
      .filter(line => line.length > 0) // Remove empty lines
      .map(line => `<p>${this.escapeHtml(line)}</p>`)  // Surround each line with <p> tags
      .join(''); // Join the array back into a single string
  }

  escapeHtml = html => {
    const text = document.createTextNode(html);
    const div = document.createElement('div');
    div.appendChild(text);
    return div.innerHTML; // Return the escaped HTML
  }

  validateData = (form, reply, actions) => {
    // check if post reply is valid
    if (!reply) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, "Reply content cannot be empty!"));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // clone the data
    let content = reply;

    if (content.length < 3) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Reply content must be at least 3 characters'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }
      
    return true;
  }

  getServerSuccessMsg = (success, text) => {
    if (!success) {
      return `
        <p class="server-status">${text}</p>
      `
    }
    return `
      <p class="server-status success">${text}</p>
    `
  }

  getTemplate() {
    // Show HTML Here
    return /*html*/`
      <div class="content-wrapper">
        <div class="overlay"></div>
        <section id="content" class="content">
          ${this.getBody()}
        </section>
      </div>
    ${this.getStyles()}`
  }

  getBody = () => {
    return /* html */`
      <reply-post hash="${this.getAttribute('hash')}" preview-title="${this.getAttribute('preview-title')}" time="${this.getAttribute('time')}"
        author-you="${this.getAttribute('author-you')}"
        author-hash="${this.getAttribute('author-hash')}" author-img="${this.getAttribute('author-img')}" author-name="${this.getAttribute('author-name')}"
        author-stories="${this.getAttribute('author-stories')}" author-replies="${this.getAttribute('author-replies')}"
        author-followers="${this.getAttribute('author-followers')}" author-following="${this.getAttribute('author-following')}" author-follow="${this.getAttribute('author-follow')}"
        author-verified="${this.getAttribute('author-verified')}" author-url="${this.getAttribute('author-url')}" author-contact='${this.getAttribute("author-contact")}'
        author-bio="${this.getAttribute('author-bio')}">
        ${this.innerHTML}
      </reply-post>
      <form class="fields" id="topic-form">
        <div class="fields-container">
          ${this.getReplyEditor()}
          ${this.getImagesEditor()}
        </div>
        <div class="actions">
          <span class="hash">${this.hash}</span>
          <div class="buttons">
            <span class="action cancel-btn">
              <span class="text">Cancel</span>
            </span>
            <button type="submit" class="action submit">
              <span class="text">Reply</span>
            </button>
          </div>
        </div>
      </form>
    `;
  }

  getReplyEditor = () => {
    return /* html */`
      <textarea name="editor" id="editor" cols="30" rows="1" placeholder="Type your reply here!" required></textarea>
    `;
  }

  getFinish = () => {
    return /* html */`
      <div class="finish">
        <h2 class="title">You're all set!</h2>  
        <p class="desc">
          Your reply has been successfully created.
          To edit your reply, visit settings page then your content. You can now close this window.
        </p>
        <button class="finish">Close</button>
      </div>
    `;
  }

  activateFinish = () => {
    const button = this.querySelector('section#content button.finish');
    if (button) {
      button.addEventListener('click', e => {
        e.preventDefault();
        
        // close the modal
        this.remove();
      });
    }
  }

  getImagesEditor = () => {
    return /* html */`
      <images-uploader api="/i/upload" multiple="true" accept="image/*" max="10" images=''></images-uploader>
    `;
  }

  getButtonLoader() {
    return /*html*/`
      <span id="btn-loader">
				<span class="loader"></span>
			</span>
    `
  }

  getStyles() {
    return /* css */`
      <style>
        *,
        *:after,
        *:before {
          box-sizing: border-box !important;
          font-family: inherit;
          -webkit-box-sizing: border-box !important;
        }

        *:focus {
          outline: inherit !important;
        }

        *::-webkit-scrollbar {
          -webkit-appearance: none;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          padding: 0;
          margin: 0;
          font-family: inherit;
        }

        p,
        ul,
        ol {
          padding: 0;
          margin: 0;
        }

        a {
          text-decoration: none;
        }

        .content-wrapper {
          border: none;
          padding: 0;
          justify-self: end;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 100;
          width: 100%;
          min-width: 100vw;
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          left: 0;
        }

        div.overlay {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          height: 100%;
          width: 100%;
          background-color: var(--modal-background);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
        }

        #content {
          z-index: 1;
          background-color: var(--background);
          padding: 20px 18px 15px;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: start;
          gap: 0;
          width: 700px;
          height: max-content;
          border-radius: 15px;
          position: relative;
          overflow-y: auto;
        }

        p.server-status {
          margin: 0;
          width: 100%;
          text-align: start;
          font-family: var(--font-read), sans-serif;
          color: var(--error-color);
          font-weight: 500;
          line-height: 1.4;
          font-size: 1.18rem;
        }

        p.server-status.success {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
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
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        @keyframes l38 {
          100% {
            background-position: 100% 0, 100% 100%, 0 100%, 0 0
          }
        }

        span.control svg {
          width: 15px;
          height: 15px;
          color: var(--text-color);
        }

        span.control svg:hover{
          color: var(--error-color);
        }

        .top {
          display: flex;
          flex-flow: column;
          gap: 5px;
          padding: 0;
          width: 100%;
        }

        .top > .desc {
          margin: 0;
          padding: 10px 0 20px;
          color: var(--text-color);
          font-size: 0.95rem;
          font-family: var(--font-main), sans-serif;
        }

        .top > .desc > span {
          display: inline-block;
          margin: 10px 0 5px;
          color: var(--gray-color);
          font-size: 0.85rem;
          font-style: italic;
          font-family: var(--font-read), sans-serif;
        }

        form.fields {
          margin: 5px 0 0 0;
          position: relative;
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 0;
        }

        form.fields::before {
          content: '';
          display: block;
          position: absolute;
          top: -10px;
          left: 2px;
          width: 2px;
          min-height: 10px;
          height: 10px;
          background: var(--action-linear);
          border-radius: 5px;
        }

        form.fields > .fields-container {
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          gap: 0;
        }

        form.fields > .fields-container > .field {
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          gap: 5px;
        }

        form.fields label {
          padding: 0 0 1px 5px;
          color: var(--text-color);
        }

        form.fields label {
          color: var(--label-color);
          margin: 20px 0 0 0;
          font-size: 1.1rem;
          font-family: var(--font-read), sans-serif;
          transition: all 0.3s ease-in-out;
          pointer-events: none;
        }

        form.fields .field input {
          border: var(--input-border);
          border: none;
          transition: border-color 0.3s ease-in-out;
          background: var(--background);
          font-family: var(--font-read), sans-serif;
          font-size: 1rem;
          width: 100%;
          height: 40px;
          outline: none;
          padding: 10px 12px;
          border-radius: 12px;
          color: var(--text-color);
          -webkit-border-radius: 12px;
          -moz-border-radius: 12px;
          -ms-border-radius: 12px;
          -o-border-radius: 12px;
        }

        form.fields .field input {
          border: none;
          border: var(--border);
          font-family: var(--font-read), sans-serif;
          background-color: var(--background) !important;
          font-size: 1rem;
          width: 100%;
          height: 40px;
          outline: none;
          padding: 10px 12px;
          border-radius: 12px;
          color: var(--text-color);
        }
        
        form.fields .field input:-webkit-autofill,
        form.fields .field input:-webkit-autofill:hover, 
        form.fields .field input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px var(--background) inset;
          -webkit-text-fill-color: var(--text-color) !important;
          transition: background-color 5000s ease-in-out 0s;
          color: var(--text-color) !important;
        }
        
        form.fields .field input:autofill {
          filter: none;
          color: var(--text-color) !important;
        }

        form.fields .field input:focus {
          border: var(--input-border-focus);
        }

        form.fields textarea {
          border: none;
          /* border: var(--border); */
          font-family: var(--font-main), sans-serif;
          background: var(--background);
          font-size: 1rem;
          padding: 0 0 7px 0;
          margin: 5px 0 0 0;
          width: 100%;
          resize: none;
          height: auto;
          line-height: 1.5;
          scroll-padding-top: 7px;
          scroll-padding-bottom: 7px;
          gap: 5px;
          font-weight: 400;
          color: var(--text-color);
          scrollbar-width: 3px;
          border-radius: 0;
        }

        form.fields textarea::-webkit-scrollbar {
          width: 3px;
          -webkit-appearance: auto;
        }

        form.fields textarea:focus {
          border: none;
        }

        form.fields .field span.wrapper {
          display: flex;
          align-items: center;
          align-items: center;
          gap: 0;
          width: 100%;
        }

        form.fields .field.success > span.wrapper > input,
        form.fields .field.success > span.wrapper > input:focus,
        form.fields .field.success input,
        form.fields .field.success input:focus {
          border: var(--input-border-focus);
        }

        form.fields .field.failed > span.wrapper > input,
        form.fields .field.failed > span.wrapper > input:focus,
        form.fields .field.failed input,
        form.fields .field.failed input:focus {
          border: var(--input-border-error);
        }

        form.fields .field.success span.wrapper > input,
        form.fields .field.success input {
          color: var(--accent-color);
        }

        form.fields .field.failed span.wrapper > input,
        form.fields .field.failed input {
          color: var(--error-color);
        }

        form.fields label.focused {
          top: -10px;
          font-size: 0.9rem;
          background-color: var(--label-focus-background);
          padding: 0 5px;
        }

        form.fields .field span.status {
          color: var(--error-color);
          font-size: 0.95rem;
          display: none;
          padding: 0 0 0 5px;
        }

        form.fields .field.failed span.status {
          color: var(--error-color);
          font-size: 0.8rem;
          display: inline-block;
        }

        form.fields .field.success span.status {
          color: var(--accent-color);
          font-size: 0.8rem;
          display: inline-block;
        }

        form.fields .field.success span.status {
          display: none;
        }

        form.fields .actions {
          border-top: var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          gap: 20px;
          margin: 0;
          padding: 10px 0 0;
        }

        form.fields .actions.active {
          border-top: var(--input-border-focus);
        }

        form.fields .actions > span.hash {
          color: transparent;
          background: var(--action-linear);
          background-clip: text;
          -webkit-background-clip: text;
          font-family: var(--font-mono), monospace;
          font-size: 0.95rem;
          line-height: 1.5;
          font-weight: 500;
        }

        form.fields .actions > .buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin: 0;
        }

        form.fields .actions .action {
          background: var(--gray-background);
          color: var(--gray-color);
          border: none;
          font-family: var(--font-main), sans-serif;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          flex-flow: row;
          align-items: center;
          text-transform: capitalize;
          justify-content: center;
          padding: 7px 15px 8px;
          min-height: 35px;
          height: 35px;
          min-width: 60px;
          width: max-content;
          position: relative;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        form.fields .actions .action.cancel-btn {
          background: var(--gray-background);
          color: var(--gray-color);
        }

        form.fields .actions.active .action.submit {
          border: none;
          background: var(--accent-linear);
          font-family: var(--font-main), sans-serif;
          text-decoration: none;
          color: var(--white-color);
        }

        form.fields .actions > .action.disabled {
          pointer-events: none;
        }

        div.finish {
          padding: 15px 0;
          width: 100%;
          min-width: 100%;
          height: auto;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }

        div.finish > h2.title {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
        }

        div.finish > p.desc {
          margin: 0;
          font-size: 0.95rem;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
          line-height: 1.4;
          text-align: center;
        }

        div.finish > button.finish {
          border: none;
          background: var(--accent-linear);
          font-family: var(--font-main), sans-serif;
          text-decoration: none;
          color: var(--white-color);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: capitalize;
          justify-content: center;
          padding: 7px 15px 8px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        .ck.ck-editor__main h6,
        .ck.ck-editor__main h5,
        .ck.ck-editor__main h4,
        .ck.ck-editor__main h3,
        .ck.ck-editor__main h1 {
          padding: 0;
          color: var(--title-color);
          font-weight: 500;
          line-height: 1.5;
          margin: 10px 0;
          font-family: var(--font-main), sans-serif;
        }

        .ck.ck-editor__main h6 {
          font-size: initial;
        }

        .ck.ck-editor__main h5 {
          font-size: initial;
        }

        .ck.ck-editor__main h4 {
          font-size: 1.25rem;
        }

        .ck.ck-editor__main h3 {
          font-size: 1.3rem !important;;
        }

        .ck.ck-editor__main h2 {
          font-size: 1.35rem !important;
          color: var(--title-color);
          font-weight: 600;
          line-height: 1.2;
          margin: 0;
          padding: 2px 0 0 13px;
          margin: 20px 0 10px;
          position: relative;
        }

        .ck.ck-editor__main h2:before {
          content: "";
          position: absolute;
          bottom: 10%;
          left: 0;
          width: 2px;
          height: 80%;
          background: var(--action-linear);
          border-radius: 5px;
        }

        .ck.ck-editor__main p {
          margin: 5px 0;
          line-height: 1.4;
        }

        .ck.ck-editor__main a {
          text-decoration: none;
          cursor: pointer;
          color: var(--anchor-color) !important;
        }

        .ck.ck-editor__main a:hover {
          text-decoration: underline;
        }

        .ck.ck-editor__main blockquote {
          margin: 10px 0;
          padding: 5px 15px;
          font-style: italic;
          border-left: 2px solid var(--gray-color);
          background: var(--background);
          color: var(--text-color);
          font-weight: 400;
        }

        .ck.ck-editor__main blockquote:before {
          content: open-quote;
          color: var(--gray-color);
          font-size: 1.5rem;
          line-height: 1;
          margin: 0 0 0 -5px;
        }

        .ck.ck-editor__main blockquote:after {
          content: close-quote;
          color: var(--gray-color);
          font-size: 1.5rem;
          line-height: 1;
          margin: 0 0 0 -5px;
        }

        .ck.ck-editor__main hr {
          border: none;
          background-color: var(--gray-color);
          height: 1px;
          margin: 10px 0;
        }

        .ck.ck-editor__main ul,
        .ck.ck-editor__main ol {
          margin: 5px 0 15px 20px;
          padding: 0 0 0 15px;
          color: inherit;
        }

        .ck.ck-editor__main ul li,
        .ck.ck-editor__main ol li {
          padding: 5px 0;
        }

        .ck.ck-editor__main code {
          background: var(--gray-background);
          padding: 0 5px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          border-radius: 5px;
        }

        .ck.ck-editor__main img {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          border-radius: 5px;
        }

        img {
          max-width: 100%;
          height: auto;
          object-fit: contain;
          border-radius: 5px;
        }

        @media screen and (max-width:600px) {
          .content-wrapper {
            border: none;
            background-color: var(--modal-background);
            padding: 0px;
            justify-self: end;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: end;
            gap: 10px;
            z-index: 20;
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            left: 0;
            min-width: 100dvw;
            min-height: 100dvh;
          }

          #content {
            box-sizing: border-box !important;
            padding: 5px 15px 5px;
            margin: 0;
            position: fixed;
            right: 0;
            left: 0;
            bottom: 0;
            width: 100%;
            max-width: 100%;
            height: max-content;
            border-radius: 0;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            overflow-y: auto;
          }

          #content span.control {
            cursor: default !important;
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          h2.pop-title {
            width: 100%;
            font-size: 1.2rem;
            padding: 10px 10px;
            background-color: var(--gray-background);
            text-align: center;
            border-radius: 12px;
          }

          .top > .desc {
            margin: 0;
            padding: 6px 0 10px;
            font-size: 0.95rem;
            line-height: 1.5;
            font-family: var(--font-main), sans-serif;
          }

          div.finish {
            padding: 25px 0 10px;
            width: 100%;
            min-width: 100%;
            height: auto;
            display: flex;
            flex-flow: column;
            justify-content: center;
            align-items: center;
            gap: 18px;
          }

          div.post-type > div.types {
            width: 100%;
            display: flex;
            flex-flow: column;

            gap: 20px;
          }

          form.fields .actions {
            align-items: center;
            width: 100%;
            gap: 25px;
          }

          form.fields .actions .action.cancel-btn {
            display: none;
          }

          div.finish > button.finish {
            margin: 10px 0 0;
          }

          div.finish > button.finish,
          form.fields .actions .action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}