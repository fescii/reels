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
  Heading,
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
  height: 500,
	toolbar: {
		items: [
      'heading',
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
  heading: {
		options: [
				{
					model: 'paragraph',
					title: 'Paragraph',
					class: 'ck-heading_paragraph',
				},
				{
					model: 'heading2',
					view: 'h2',
					title: 'Heading 2',
					class: 'ck-heading_heading2',
				},
				{
					model: 'heading3',
					view: 'h3',
					title: 'Heading 3',
					class: 'ck-heading_heading3',
				},
				{
					model: 'heading4',
					view: 'h4',
					title: 'Heading 4',
					class: 'ck-heading_heading4',
				},
			],
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
    Heading,
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
	balloonToolbar: ['bold', 'italic', '|', 'link', '|', 'blockQuote', 'highlight'],
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
	placeholder: 'Type your topic content here!',
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

export default class CreateTopic extends HTMLDivElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this.name = null;
    this.slug = null;
    this.summary = null;
    this.editor = null;

    this.step = 1;

    // let's create our shadow root
    // this.shadowObj = this.attachShadow({ mode: "open" });

    this._url = this.getAttribute('api');
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

      // validate the slug
      this.validateForm(form);
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
    ClassicEditor.create(this.querySelector('textarea#editor'), editorConfig)
    .then(editor => {
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

      const button = form.querySelector('.action.next');
      const actions = form.querySelector('.actions');

      // show loader inside the button
      button.innerHTML = this.getButtonLoader();
      // disable pointer events
      button.style.pointerEvents = 'none';

      if (this.step === 1) {
        // validate the form
        const isValid = this.validateStepOne(form, actions);

        if (!isValid) {
          return;
        } else {
          this.checkIfTopicExists(form, button, actions);
          return;
        }
      }

      // get the editor data
      const data = this.editor.getData();

      // validate the editor data
      if (!this.validateStepTwo(form, data, actions)) return;

      try {
        const url = '/t/add';

        const result = await this.api.put(url, { content: 'json', body: JSON.stringify({
          slug: this.slug,
          name: this.name,
          summary: this.summary
        }) });

        // check if request was successful
        if (result.success) {
          // activate the finish step
          section.innerHTML = this.getFinish();
          this.activateFinish();
        } else {
          // show error message
          actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, result.message));

          // reset button
          button.innerHTML = '<span class="text">Create</span>';
          // enable pointer events
          button.style.pointerEvents = 'auto';
        }
      }
      catch (error) {
        console.error(error);
        // show error message
        actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, 'An error occurred, please try again'));

        // reset button
        button.innerHTML = '<span class="text">Create</span>';
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

  checkIfTopicExists = async (form, button, actions) => {
    const url  = '/t/check/topic';

    try {
      const result = await this.api.post(url, { content: 'json', body: JSON.stringify({
        slug: this.slug,
        name: this.name
      }) });

      if (result.success) {
        // activate the next step
        // replace the current fields with the editor
        form.querySelector('.fields-container').innerHTML = this.getSummaryEditor();
        this.initEditor();

        // restore button
        button.innerHTML = '<span class="text">Create</span>';
        // enable pointer events
        button.style.pointerEvents = 'auto';
        this.step = 2;
      } else {
        // show error message
        actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, result.message));

        // restore button
        button.innerHTML = '<span class="text">Next</span>';
        // enable pointer events
        button.style.pointerEvents = 'auto';

        // remove success message
        setTimeout(() => {
          const serverStatus = form.querySelector('.server-status');
          if (serverStatus) {
            serverStatus.remove();
          }
        }, 5000);
      }
    }
    catch (error) {
      console.error(error);
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'An error occurred, please try again'));

      // restore button
      button.innerHTML = '<span class="text">Next</span>';
      // enable pointer events
      button.style.pointerEvents = 'auto';

      // remove success message
      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);
    }
  }

  validateStepOne = (form, actions) => {
    const outerThis = this;
    // get and validate form data
    const formData = new FormData(form);

    // get form data
    const data = {
      slug: formData.get('slug'),
      name: formData.get('title'),
    };

    // check if form data is valid
    if (!data.slug) {
      
      const errorMsg = 'slug must be defined!';

      // show error message
      actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, errorMsg));
      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // validate slug
    if (data.slug.length < 3) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, 'slug must be at least 3 characters'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // validate slug: only letters, numbers, and hyphens and lower case
    if(!/^[a-z0-9-]*$/.test(data.slug)) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, 'slug can only contain letters, numbers, and hyphens and lowercase'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // validate title and not less than 2 characters
    if (!data.name || data.name.length < 2) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', outerThis.getServerSuccessMsg(false, 'title must be at least 2 characters'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // set the data
    this.name = data.name;
    this.slug = data.slug;

    return true;
  }

  validateStepTwo = (form, summary, actions) => {
    const outerThis = this;
    // check if post summary is valid
    if (!summary) {
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
    let content = summary;

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

    // set the data
    this.summary = summary;
      
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
      ${this.getHeader()}
      <form class="fields" id="topic-form">
        <div class="fields-container">
          ${this.getFields()}
        </div>
        <div class="actions">
          <span class="action-info">Creating a new topic</span>
          <button type="submit" class="action next">
            <span class="text">Next</span>
          </button>
        </div>
      </form>
    `;
  }

  getFields = () => {
    return /* html */`
      <div class="field">
        <label for="title">Name</label>
        <input type="text" name="title" id="title" placeholder="Enter the title of the topic" required />
        <span class="status"></span>
      </div>
      <div class="field">
        <label for="slug">Slug</label>
        <input type="text" name="slug" id="slug" placeholder="Enter a unique slug for the topic" required />
        <span class="status"></span>
      </div>
    `;
  }

  getSummaryEditor = () => {
    return /* html */`
      <textarea name="editor" id="editor" cols="30" rows="10" placeholder="Type your topic content here!"></textarea>
    `;
  }

  getFinish = () => {
    return /* html */`
      <div class="finish">
        <h2 class="title">Topic Created!</h2>
        <p class="desc">
          Your topic has been successfully created and will appear in the feeds. You can now close this modal using the button below.
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

  validateForm = form => {
    const input = form.querySelector('input[name="slug"]');
    const title = form.querySelector('input[name="title"]');

    if (input && title) {
      // add an input event listener
      input.addEventListener('input', e => {
        const value = e.target.value;

        if (!value) {
          input.parentElement.classList.remove('success');
          input.parentElement.classList.add('failed');
          input.parentElement.querySelector('span.status').textContent = 'slug is required';
          return;
        }

        if (value.length < 3) {
          input.parentElement.classList.remove('success');
          input.parentElement.classList.add('failed');
          input.parentElement.querySelector('span.status').textContent = 'slug must be at least 3 characters';
          return;
        }

        if(!/^[a-z0-9-]*$/.test(value)) {
          input.parentElement.classList.remove('success');
          input.parentElement.classList.add('failed');
          input.parentElement.querySelector('span.status').textContent = 'slug can only contain letters, numbers, and hyphens and be in lowercase';
          return;
        }

        input.parentElement.classList.remove('failed');
        input.parentElement.classList.add('success');
        input.parentElement.querySelector('span.status').textContent = '';
      });

      // add an input event listener to title
      title.addEventListener('input', e => {
        const value = e.target.value;

        if (!value) {
          title.parentElement.classList.remove('success');
          title.parentElement.classList.add('failed');
          title.parentElement.querySelector('span.status').textContent = 'title is required';
          return;
        }

        // check for length
        if (value.length < 2) {
          title.parentElement.classList.remove('success');
          title.parentElement.classList.add('failed');
          title.parentElement.querySelector('span.status').textContent = 'title must be at least 2 characters';
          return;
        }

        title.parentElement.classList.remove('failed');
        title.parentElement.classList.add('success');
        title.parentElement.querySelector('span.status').textContent = '';
      });
    }
  }

  getHeader = () => {
    return /* html */`
      <h2 class="pop-title">
        <span class="control cancel-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
          </svg>
        </span>
        <span class="text">Create a topic</span>
      </h2>
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
          gap: 15px;
          width: 700px;
          max-height: 90%;
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
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
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
          border: var(--border);
          font-family: var(--font-read), sans-serif;
          background: var(--background);
          font-size: 1rem;
          padding: 10px 12px;
          margin: 0;
          width: 100%;
          resize: none;
          height: 120px;
          gap: 5px;
          font-weight: 400;
          color: var(--text-color);
          -ms-overflow-style: none;
          scrollbar-width: none;
          border-radius: 12px;
        }

        form.fields textarea::-webkit-scrollbar {
          display: none !important;
          visibility: hidden;
        }

        form.fields textarea:focus {
          border: var(--input-border-focus);
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
          margin: 0 0 0 2px;
          padding: 15px 0 0;
        }

        form.fields .actions > span.action-info {
          color: var(--gray-color);
          font-size: 0.95rem;
          font-family: var(--font-read), sans-serif;
          font-weight: 400;
          line-height: 1.5;
        }

        form.fields .actions > .action {
          border: none;
          background: var(--accent-linear);
          font-family: var(--font-main), sans-serif;
          text-decoration: none;
          color: var(--white-color);
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

        form.fields .actions > .action.cancel-btn {
          background: var(--gray-background);
          fill: var(--text-color);
          /*text-transform: lowercase;*/
        }

        form.fields .actions > .action.prev svg path {
          fill: var(--text-color);
        }

        form.fields .actions > .action.next {
          color: var(--white-color);
          background: var(--stage-no-linear);
        }

        form.fields .actions > .action.next svg path {
          fill: var(--white-color);
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
          max-height: 250px;
          height: 250px;
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
          height: calc(90dvh - 205px);
          font-family: var(--font-text), sans-serif;
          overflow-y: auto;
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
            padding: 20px 10px 15px 10px;
            margin: 0;
            width: 100%;
            max-width: 100%;
            max-height: 100%;
            min-height: 100%;
            border-radius: 0;
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

          div.finish > button.finish {
            margin: 10px 0 0;
          }

          form.fields > .field.polls > div.remove > span.remove-poll,
          form.fields > .field.polls > .poll-inputs > span.add-option,
          div.finish > button.finish,
          form.fields .actions > .action {
            cursor: default !important;
          }

          .ck-editor__editable_inline:not(.ck-comment__input *) {
            height: calc(100dvh - 215px);
            overflow-y: auto;
          }
        }
      </style>
    `;
  }
}