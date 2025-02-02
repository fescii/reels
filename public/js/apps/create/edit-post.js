import {
	ClassicEditor,
	Autoformat,
	AutoLink,
	Autosave,
	BalloonToolbar,
	BlockQuote,
	Bold,
	Code,
	CodeBlock,
	Essentials,
	HorizontalLine,
	Italic,
	Link,
	List,
	ListProperties,
	Paragraph,
	Strikethrough,
	Underline,
	Undo
} from './ckeditor.js';

const editorConfig = {
	toolbar: {
		items: [
			'bold',
			'italic',
			'underline',
      'link',
			'code',
			'|',
			'bulletedList',
			'numberedList',
			'blockQuote',
      'strikethrough',
		],
		shouldNotGroupWhenFull: false
	},
	plugins: [
		Autoformat,
		AutoLink,
		Autosave,
		BalloonToolbar,
		BlockQuote,
		Bold,
		Code,
		CodeBlock,
		Essentials,
		HorizontalLine,
		Italic,
		Link,
		List,
		ListProperties,
		Paragraph,
		Strikethrough,
		Underline,
		Undo
	],
	balloonToolbar: ['bold', 'italic', '|', 'link', '|', 'blockQuote'],
	fontFamily: {
		supportAllValues: true
	},
	list: {
		properties: {
			styles: true,
			startIndex: true,
			reversed: true
		}
	},
	placeholder: 'Type or paste your content here!',
	style: {
		definitions: [
			{
				name: 'Article category',
				element: 'h3',
				classes: ['category']
			},
			{
				name: 'Title',
				element: 'h2',
				classes: ['document-title']
			},
			{
				name: 'Subtitle',
				element: 'h3',
				classes: ['document-subtitle']
			},
			{
				name: 'Info box',
				element: 'p',
				classes: ['info-box']
			},
			{
				name: 'Side quote',
				element: 'blockquote',
				classes: ['side-quote']
			},
			{
				name: 'Marker',
				element: 'span',
				classes: ['marker']
			},
			{
				name: 'Spoiler',
				element: 'span',
				classes: ['spoiler']
			},
			{
				name: 'Code (dark)',
				element: 'pre',
				classes: ['fancy-code', 'fancy-code-dark']
			},
			{
				name: 'Code (bright)',
				element: 'pre',
				classes: ['fancy-code', 'fancy-code-bright']
			}
		]
	},
	table: {
		contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties']
	},
};

export default class EditPost extends HTMLDivElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this.editor = null;

    // get innerHTML before it is removed
    this._innerHTML = this.innerHTML;

    this._url = this.getAttribute('api');

    this._option = this.getAttribute('kind');
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    // this.shadowObj.innerHTML = this.getTemplate();
    this.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // select section
    const section = this.querySelector('section.content');

    // select the form
    const form = this.querySelector('form');

    if (form && section) {
      // add event listener to the form
      this.submitForm(form, section);

      this.activatePostType();
    }
    
    const btns = this.querySelectorAll('.cancel-btn');
    const overlay = this.querySelector('.overlay');

    // Close the modal
    if (overlay && btns) {
      this.closePopup(overlay, btns);
    }

    this.disableScroll();
  }

  initEditor() {
    ClassicEditor.create(this.querySelector('#editor'), editorConfig)
    .then(editor => {
      // set data to the editor
      editor.setData(this._innerHTML);
      this.editor = editor;
    })
    .catch(error => {
      console.log('Failed to initialize the editor. Error: ', error);
    });
  }

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

      // get and validate form data
      const formData = this.getFormData(form);

      if (!this.validatePostData(form, formData, actions)) {
        return;
      }

      // Construct the body object
      let body = {
        content: formData.content
      }

      button.innerHTML = this.getButtonLoader();
      // disable pointer events
      button.style.pointerEvents = 'none'

      // get images-uploader: images attribute
      const imagesUploader = form.querySelector('div.images-editor');
      let images = imagesUploader ? imagesUploader.getAttribute('images').split(',') : [];

      // filter out empty strings, null, 'null' or whose length is <5
      images = images.filter(img => img && img !== 'null' && img.length > 5);

      // check if images length is greater than 0
      if (images.length > 0) {
        body.images = images;
      }

      try {
        const result = await this.api.patch(this._url, { content: 'json', body: JSON.stringify(body) });

        // check if request was successful
        if (result.success) {
          // show success message
          actions.insertAdjacentHTML('beforebegin', 
            outerThis.getServerSuccessMsg(true, 'Post created successfully')
          );

          // add finish message
          outerThis.removeFormAndTopDesc(section);

          if(window.toBeChanged) {
            window.toBeChanged.innerHTML = body.content;
            window.toBeChanged.setAttribute('reload', 'true');
            window.toBeChanged = null;
          }
        } else {
          // show error message
          actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, result.message));

          // reset button
          button.innerHTML = '<span class="text">Post</span>';
          // enable pointer events
          button.style.pointerEvents = 'auto';
        }
      }
      catch (error) {
        // show error message
        actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, 'An error occurred, please try again'));

        // reset button
        button.innerHTML = '<span class="text">Post</span>';
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

  validatePostData = (form, data, actions) => {
    // console.log(data);
    // check if post data is valid
    if (!data.content) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Post content must be defined!'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // clone the data
    let content = data.content;

    // validate post content: count length without html tags
    content = content.replace(/<[^>]*>?/gm, '');

    if (content.length < 3) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Post content must be at least 3 characters'));

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

  getFormData = () => {
    // get data from the editor
    const data = this.editor.getData();

    return {
      content: this.cleanWysiwygText(data)
    };
  }

  cleanWysiwygText(input) {
    let cleanedText = input;

    // Step 1: Remove whitespace between tags
    cleanedText = cleanedText.replace(/>\s+</g, '><');

    // Step 2: Remove empty tags and tags with only &nbsp; or whitespace
    cleanedText = cleanedText.replace(/<(\w+)>(\s|&nbsp;)*<\/\1>/g, '');

    // Step 3: Remove <br> tags immediately after opening tags
    cleanedText = cleanedText.replace(/<(\w+)><br>/g, '<$1>');

    // Additional step: Remove <br> tags immediately before closing tags
    cleanedText = cleanedText.replace(/<br><\/(\w+)>/g, '</$1>');

    // Preserve <br> tags in the middle of content
    cleanedText = cleanedText.replace(/>(\s*<br>\s*)+</g, '><br><');

    return cleanedText;
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
      ${this.getStyles()}
    `
  }

  getBody = () => {
    return /* html */`
      <form class="fields post" id="post-form">
        ${this.getPostEditor()} 
        ${this.getImagesEditor(this.getAttribute('kind'))}
        <div class="actions active">
          <span class="action-info">Publishing</span>
          <div class="buttons">
            <span class="action cancel-btn">
              <span class="text">Cancel</span>
            </span>
            <button type="submit" class="action submit">
              <span class="text">Post</span>
            </button>
          </div>
        </div>
      </form>
    `;
  }

  getPostEditor = () => {
    return /* html */`
      <textarea name="editor" id="editor" cols="30" rows="10" placeholder="Type or paste your content hare!"></textarea>
    `;
  }

  getImagesEditor = kind => {
    // if kind is poll return: empty string
    if (kind === 'poll') {
      return '';
    } else {
      return /* html */`
        <div is="images-editor" class="images-editor" hash="${this.getAttribute('hash')}" kind="${this.getAttribute('kind')}"
          api="/i/upload" multiple="true" accept="image/*" max="10" images='${this.getAttribute('images')}'>
        </div>
      `;
    }
  }

  activatePostType = ()=> {
    // activate the editor
    this.initEditor();
  }

  getFinish = () => {
    return /* html */`
      <div class="finish">
        <h2 class="title">You're all set!</h2>
        <p class="desc">
          Your ${this._option.toLowerCase()} has been successfully edited and published to the feeds.
          You can now close this modal using the button below.
        </p>
        <button class="finish">Close</button>
      </div>
    `;
  }

  activateFinish = finish => {
    const button = finish.querySelector('button.finish');
    if (button) {
      button.addEventListener('click', e => {
        e.preventDefault();
        this.remove();
      });
    }
  }

  removeFormAndTopDesc = section => {
    section.innerHTML = this.getFinish();

    const finish = this.querySelector('div.finish');

    // activate the finish button
    this.activateFinish(finish);
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
      <link rel="stylesheet" href="/static/css/ckeditor.css">
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
          font-family: inherit;
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
          padding: 20px;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: start;
          gap: 10px;
          width: 700px;
          max-height: 95%;
          height: 90%;
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

        h2.pop-title {
          width: 100%;
          font-size: 1.35rem;
          font-weight: 600;
          margin: 0;
          padding: 10px 10px;
          background-color: var(--gray-background);
          text-align: center;
          border-radius: 12px;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
          font-weight: 500;
          position: relative;
        }

        h2.pop-title > span.control {
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-flow: column;
          gap: 0px;
          justify-content: center;
          position: absolute;
          top: 50%;
          left: 10px;
          transform: translateY(-50%);
        }

        h2.pop-title > span.control svg {
          width: 21px;
          height: 21px;
          color: var(--text-color);
        }

        h2.pop-title > span.control svg:hover{
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
          margin: 0;
          width: 100%;
          min-width: 100%;
          height: auto;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 0;
        }

        form.fields div.images-editor {
          width: 100%;
          min-width: 100%;
        }

        div.post-type {
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 15px;
          padding: 10px 0;
        }

        div.post-type > h2.title {
          width: 100%;
          margin: 0;
          padding: 0;
          font-size: 1.25rem;
          text-align: center;
          font-weight: 500;
          text-transform: capitalize;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
        }

        div.post-type > div.types {
          width: 100%;
          display: flex;
          flex-flow: row;
          gap: 20px;
        }

        div.post-type > div.types > div.type {
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 5px;
          padding: 10px;
          border-radius: 12px;
          background: var(--create-background);
          cursor: pointer;
        }

        div.post-type > div.types > div.type:hover {
          background: var(--background);
          border: var(--border);
        }

        div.post-type > div.types > div.type > h4.title {
          margin: 0;
          padding: 0;
          font-size: 1.1rem;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
        }

        div.post-type > div.types > div.type > p.desc {
          margin: 0;
          padding: 5px 0;
          font-size: 0.85rem;
          font-family: var(--font-read), sans-serif;
          color: var(--gray-color);
        }

        form.fields > .field {
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          gap: 0;
        }

        form.fields > .field.polls {
          padding: 10px 0 0 0;
        }

        form.fields > .field.polls > span.title {
          display: none;
          margin: 0;
          padding: 0 0 10px 3px;
          color: var(--text-color);
          font-size: 1rem;
          font-weight: 600;
          font-family: var(--font-main), sans-serif;
        }

        form.fields > .field.polls > .poll-inputs {
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          gap: 15px;
        }

        form.fields > .field.polls > .poll-inputs.texts {
          margin: 0 0 18px;
        }

        form.fields > .field.polls > div.remove {
          width: 100%;
          display: flex;
          flex-flow: row;
          justify-content: end;
          align-items: center;
          gap: 0;
          padding: 8px 0 20px;
        }

        form.fields > .field.polls > div.remove > span.remove-poll {
          width: max-content;
          padding: 0 5px;
          display: flex;
          cursor: pointer;
          font-family: var(--font-read), sans-serif;
          font-size: 0.95rem;
          font-weight: 400;
          color: var(--gray-color);
        }

        form.fields > .field.polls > .poll-inputs > span.add-option {
          /*border: var(--border);*/
          background: var(--gray-background);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 500;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          cursor: pointer;
          height: 40px;
          border-radius: 12px;
          color: var(--gray-color);
          -webkit-border-radius: 12px;
          -moz-border-radius: 12px;
          -ms-border-radius: 12px;
          -o-border-radius: 12px;
        }

        form.fields > .field.polls > .poll-inputs > span.add-option:hover {
          color: var(--accent-color);
        }

        form.fields .field input {
          border: var(--input-border);
          background: var(--background);
          font-family: var(--font-read), sans-serif;
          font-size: 0.95rem;
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
          display: inline-block;
          border: var(--border);
          font-family: var(--font-read), sans-serif;
          background-color: var(--background) !important;
          font-size: 1rem;
          width: 100%;
          min-width: 100%;
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
          /* border: var(--input-border-focus); */
          border: var(--border);
        }

        form.fields textarea {
          border: none;
          /* border: var(--border); */
          font-family: var(--font-read), sans-serif;
          background: var(--background);
          font-size: 1rem;
          padding: 10px 5px;
          margin: 0;
          width: 100%;
          resize: none;
          height: auto;
          line-height: 1.5;
          gap: 5px;
          font-weight: 400;
          color: var(--text-color);
          scrollbar-width: 3px;
          border-radius: 12px;
        }

        form.fields textarea::-webkit-scrollbar {
          width: 3px;
          -webkit-appearance: auto;
        }

        form.fields textarea:focus {
          /*border: var(--input-border-focus);*/
          border: none;
        }

        form.fields .field span.wrapper {
          display: flex;
          align-items: center;
          align-items: center;
          gap: 0;
          width: 100%;
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

        form.fields .field .input-group.failed span.status {
          color: var(--error-color);
          font-size: 0.8rem;
          display: inline-block;
        }

        form.fields .field .input-group.success span.status {
          color: var(--accent-color);
          font-size: 0.8rem;
          display: inline-block;
        }

        form.fields .field .input-group.success span.status {
          display: none;
        }

        form.fields .actions {
          border-top: var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          height: max-content;
          gap: 20px;
          margin: 0;
          padding: 10px 0 0;
        }

        form.fields .actions.active {
          border-top: var(--input-border-focus);
        }

        form.fields .actions > span.action-info {
          color: var(--gray-color);
          font-size: 0.95rem;
          font-family: var(--font-read), sans-serif;
          font-weight: 400;
          line-height: 1.5;
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

        #editor {
          min-width: 100%;
          width: 100%;
          overflow-y: auto;
          font-family: var(--font-text), sans-serif;
        }

        .ck.ck-editor__main > .ck-editor__editable {
          color: var(--editor-color);
        }

        .ck.ck-editor__main > .ck-editor__editable a {
          color: var(--anchor-color);
        }

        .ck-editor__editable_inline:not(.ck-comment__input *) {
          font-family: var(--font-text), sans-serif;
          overflow-y: auto;
        }

        .ck-editor__editable_inline {
          max-height: 350px;
        }

        .ck-body-wrapper {
          display: none;
          opacity: 0;
          visibility: hidden;
        }

        .ck.ck-reset.ck-editor {
          display: -webkit-box;
          display: -moz-box;
          display: -ms-flexbox;
          display: -webkit-flex;
          display: flex;
          -webkit-flex-direction: column;
          -moz-flex-direction: column;
          -ms-flex-direction: column;
          flex-direction: column;
        }

        .ck-focused, .ck.ck-editor__editable:not(.ck-editor__nested-editable).ck-focused {
          border: none;
          border: none;
          outline: none !important;
          -moz-outline: none !important;
          -webkit-outline: none !important;
          -ms-outline: none !important;
          -webkit-box-shadow: none;
          -moz-box-shadow: none;
          box-shadow: none
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

        figure {
          max-width: 100% !important;
          height: auto;
          width: max-content;
          padding: 0;
          max-width: 100%;
          display: block;
          margin-block-start: 5px;
          margin-block-end: 5px;
          margin-inline-start: 0 !important;
          margin-inline-end: 0 !important;
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
            padding: 5px 10px 10px;
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
            padding: 25px 0;
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

          div.finish > button.finish {
            margin: 10px 0 0;
          }

          form.fields > .field.polls > div.remove > span.remove-poll,
          form.fields > .field.polls > .poll-inputs > span.add-option,
          div.post-type > div.types > div.type,
          div.finish > button.finish,
          form.fields .actions .action,
          div.finish > button.finish {
            cursor: default !important;
          }

          .ck-editor__editable_inline:not(.ck-comment__input *) {
            overflow-y: auto;
          }

          .ck-editor__editable_inline {
            max-height: 300px;
          }
        }
      </style>
    `;
  }
}