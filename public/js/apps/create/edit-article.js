import {
	ClassicEditor,
	Autoformat,
	AutoLink,
	Autosave,
	BalloonToolbar,
	BlockQuote,
	Bold,
	Code,
	Essentials,
  FileRepository,
	HorizontalLine,
  Heading,
	Italic,
  Image,
  ImageBlock,
	ImageCaption,
	ImageInline,
	ImageInsert,
	ImageInsertViaUrl,
	ImageResize,
	ImageStyle,
	ImageTextAlternative,
	ImageToolbar,
	ImageUpload,
	Link,
	List,
	ListProperties,
	Paragraph,
	Strikethrough,
	Underline,
	Undo
} from './ckeditor.js';

import CustomUploadAdapterPlugin from './upload.js';

const editorConfig = {
	toolbar: {
		items: [
      'heading',
			'bold',
			'underline',
      'italic',
      'link',
      'insertImage',
			'|',
			'bulletedList',
			'numberedList',
			'blockQuote',
      'strikethrough',
			'code',
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
		Essentials,
    FileRepository,
    Heading,
		HorizontalLine,
    Image,
    ImageBlock,
    ImageCaption,
    ImageInline,
    ImageInsert,
    ImageInsertViaUrl,
    ImageResize,
    ImageStyle,
    ImageTextAlternative,
    ImageToolbar,
    ImageUpload,
		Italic,
		Link,
		List,
		ListProperties,
		Paragraph,
		Strikethrough,
		Underline,
		Undo,
    CustomUploadAdapterPlugin
	],
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
  image: {
    toolbar: [
      'imageStyle:inline',
      'imageStyle:block',
      'imageStyle:wrapText',
			'imageStyle:breakText',
      '|',
      'toggleImageCaption',
      'imageTextAlternative',
      'resizeImage'
    ],
  },
	placeholder: 'Type your article content here!',
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

export default class EditArticle extends HTMLDivElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this.editor = null;

    // get innerHTML before it is removed
    this._innerHTML = this.innerHTML;

    this._url = this.getAttribute('api');

    this._option = null;

    this._title = this.getAttribute('story-title');
    this.slug = this.getAttribute('slug');

    this.hash = this.getAttribute('hash');
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

      // activate the title type
      this.activateTitleType(form);

      // activate the slug type
      this.activateSlugType(form);

      // activate the content type
      this.activateContentType(form);
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
        // set the editor data
        editor.setData(this._innerHTML);
        // set the editor
        this.editor = editor;
      })
      .catch(error => {
        console.log('Failed to initialize the editor. Error: ', error);
      });
  }

  activateTitle = form => {
    // select input for title
    const title = form.querySelector('input[name="title"]');

    if (title) {
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

  activateSlug = form => {
    // select input for slug
    const input = form.querySelector('input[name="slug"]');

    if (input) {
      // add an input event listener to slug
      input.addEventListener('input', e => {
        let value = e.target.value;

        if (!value) {
          input.parentElement.classList.remove('success');
          input.parentElement.classList.add('failed');
          input.parentElement.querySelector('span.status').textContent = 'slug is required';
          return;
        }

        // slugify the input
        const slug = this.slugifyInput(value);
        input.value = slug;
        value = slug;

        if (value.length < 3) {
          input.parentElement.classList.remove('success');
          input.parentElement.classList.add('failed');
          input.parentElement.querySelector('span.status').textContent = 'slug must be at least 3 characters';
          return;
        }

        // check if slug is valid
        if (!/^[a-z0-9-]*$/.test(value)) {
          input.parentElement.classList.remove('success');
          input.parentElement.classList.add('failed');
          input.parentElement.querySelector('span.status').textContent = 'slug can only contain letters, numbers, and hyphens and be in lowercase';
          return;
        }

        input.parentElement.classList.remove('failed');
        input.parentElement.classList.add('success');
        input.parentElement.querySelector('span.status').textContent = '';
      });
    }
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
      // declare variables
      let body;
      let url = this._url;

      const serverStatus = form.querySelector('.server-status');

      // if server status is already showing, remove it
      if (serverStatus) {
        serverStatus.remove();
      }

      const button = form.querySelector('.action.submit');
      const actions = form.querySelector('.actions');

      // get and validate form data
      const formData = this.getFormData(form);

      if (formData.postType === 'title') {
        if (!this.validateTitleData(form, formData.title, actions)) {
          return;
        }

        // Construct the body object
        body = {
          title: formData.title
        }

        // update the url
        url = `${url}/title`;

        // show loader inside the button
        const button = form.querySelector('.action.submit');
        button.innerHTML = this.getButtonLoader();
        // disable pointer events
        button.style.pointerEvents = 'none';
      } else if (formData.postType === 'slug') {
        if (!this.validateSlugData(form, formData.slug, actions)) {
          return;
        }

        // Construct the body object
        body = {
          slug: formData.slug
        }

        // update the url
        url = `${url}/slug`;

        // show loader inside the button
        const button = form.querySelector('.action.submit');
        button.innerHTML = this.getButtonLoader();
        // disable pointer events
        button.style.pointerEvents = 'none';
      } else {
        // get data from the editor
        const content = formData.content;

        if (!this.validateContentData(form, content, actions)) {
          return;
        }

        // Construct the body object
        body = {
          content: content
        }

        // update the url
        url = `${url}/content`;

        // show loader inside the button
        const button = form.querySelector('.action.submit');
        button.innerHTML = this.getButtonLoader();
        // disable pointer events
        button.style.pointerEvents = 'none';
      }

      try {
        const result = await this.api.patch(url, { content: 'json', body: JSON.stringify(body) })

        // check if request was successful
        if (result.success) {
          // show success message
          actions.insertAdjacentHTML('beforebegin',
            outerThis.getServerSuccessMsg(true, result.message)
          );

          // add finish message
          outerThis.removeFormAndTopDesc(section);
          if (window.toBeChanged) {
            if (formData.postType === 'title') {
              window.toBeChanged.setAttribute('story-title', formData.title)
            } else if (formData.postType === 'slug') {
              window.toBeChanged.setAttribute('slug', formData.slug)
            } else {
              window.toBeChanged.innerHTML = formData.content;
            }
            window.toBeChanged.setAttribute('reload', 'true')
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

  validateTitleData = (form, title, actions) => {
    // check if title is valid
    if (!title) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Title must be defined!'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // validate if title is at least 2 characters
    if (title.length < 2) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Title must be at least 2 characters'));

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

  validateSlugData = (form, slug, actions) => {
    // check if slug is valid
    if (!slug) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Slug must be defined!'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // validate if slug is at least 3 characters
    if (slug.length < 3) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Slug must be at least 3 characters'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // check if slug is valid
    if (!/^[a-z0-9-]*$/.test(slug)) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Slug can only contain letters, numbers, and hyphens and be in lowercase'));

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

  validateContentData = (form, content, actions) => {
    // check if content is valid
    if (!content) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Content must be defined!'));

      setTimeout(() => {
        const serverStatus = form.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);

      return false;
    }

    // check if content is at least 100 characters
    if (content.length < 100) {
      // show error message
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Content must be at least 100 characters'));

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

  getFormData = form => {
    const postType = this._option;

    if (postType === 'title') {
      const data = new FormData(form);

      return {
        postType: postType,
        title: data.get('title')
      };
    } else if (postType === 'slug') {
      const data = new FormData(form);

      return {
        postType: postType,
        slug: data.get('slug')
      };
    } else {
      // get data from the editor
      const data = this.editor.getData();

      return {
        postType: postType,
        content: this.cleanWysiwygText(data)
      };
    }
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
        ${this.getArticleOptions()}
        <div class="actions active">
          <span class="action-info">Publishing</span>
          <div class="buttons">
            <span class="action cancel-btn">
              <span class="text">Cancel</span>
            </span>
            <button type="submit" class="action submit">
              <span class="text">Next</span>
            </button>
          </div>
        </div>
      </form>
    `;
  }

  getArticleEditor = () => {
    return /* html */`
      <textarea name="editor" id="editor" cols="30" rows="10" placeholder="Type or paste your content hare!"></textarea>
    `;
  }

  getTitleField = () => {
    return /* html */`
      <div class="field">
        <label for="title">Title</label>
        <input type="text" name="title" id="title" placeholder="Enter the title of the article" required  value="${this._title}" />
        <span class="status"></span>
      </div>
    `;
  }

  getSlugField = () => {
    return /* html */`
      <div class="field">
        <label for="slug">Slug</label>
        <input type="text" name="slug" id="slug" placeholder="Enter a unique slug for the article" required value="${this.slug}" />
        <span class="status"></span>
      </div>
    `;
  }

  getArticleOptions = () => {
    return /* html */`
      <div class="post-type">
        <div class="types">
          <div class="type title">
            <h4 class="title">Title</h4>
            <p class="desc">
              Edit the title of the selected article.
            </p>
          </div>
          <div class="type slug">
            <h4 class="title">Slug</h4>
            <p class="desc">
              Edit the slug of the selected article.
            </p>
          </div>
          <div class="type content">
            <h4 class="title">Content</h4>
            <p class="desc">
              Modify the content of the selected article.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  activateTitleType = form => {
    // select post-type
    const postType = form.querySelector('.post-type');
    // select the post type: title
    const titleType = form.querySelector('.post-type > .types > .type.title');
    // select actions
    const actions = form.querySelector('.actions');

    if (titleType && actions && postType) {
      titleType.addEventListener('click', e => {
        e.preventDefault();

        // update the option
        this._option = 'title';

        // get title editor
        const titleEditor = this.getTitleField();

        // Remove the post type
        postType.remove();

        // insert the poll editor
        form.insertAdjacentHTML('afterbegin', titleEditor);

        // activate the poll
        this.activateTitle(form);

        // add display flex to the actions
        actions.style.display = 'flex';
      });
    }
  }

  activateSlugType = form => {
    // select post-type
    const postType = form.querySelector('.post-type');
    // select the post type: slug
    const slugType = form.querySelector('.post-type > .types > .type.slug');
    // select actions
    const actions = form.querySelector('.actions');

    if (slugType && actions && postType) {
      slugType.addEventListener('click', e => {
        e.preventDefault();

        // update the option
        this._option = 'slug';

        // get slug editor
        const slugEditor = this.getSlugField();

        // Remove the post type
        postType.remove();

        // insert the poll editor
        form.insertAdjacentHTML('afterbegin', slugEditor);

        // activate the poll
        this.activateSlug(form);

        // add display flex to the actions
        actions.style.display = 'flex';
      });
    }
  }

  slugifyInput = (input) => {
    return input.replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/gi, '')
      .replace(/-{2,}/g, '-')
      .toLowerCase();
  }

  activateContentType = form => {
    // select post-type
    const postTypeMain = form.querySelector('.post-type');
    // select the post type: content
    const contentType = form.querySelector('.post-type > .types > .type.content');
    // select actions
    const actions = form.querySelector('.actions');

    if (contentType && actions && postTypeMain) {
      contentType.addEventListener('click', e => {
        e.preventDefault();

        // update the option
        this._option = 'content';

        // get content editor
        const contentEditor = this.getArticleEditor();

        // Remove the post type
        postTypeMain.remove();

        // insert the post editor
        form.insertAdjacentHTML('afterbegin', contentEditor);

        // activate the editor
        this.initEditor();

        // add display flex to the actions
        actions.style.display = 'flex';
      });
    }
  }

  getFinish = () => {
    return /* html */`
      <div class="finish">
        <h2 class="title">You're all set!</h2>
        <p class="desc">
          Your changes have been saved successfully, you can view the updated article by visiting the feeds or your profile page.
          You can now close this window.
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
    const form = section.querySelector('form');

    if (form) {
      form.remove();
    }

    // insert the finish message
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
          scrollbar-width: none;
        }

        #content::-webkit-scrollbar {
          visibility: hidden;
          display: none;
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
          gap: 0px;
          padding: 9px 11px;
          border-radius: 12px;
          background: var(--create-background);
          cursor: pointer;
        }

        div.post-type > div.types > div.type:hover {
          background: var(--background);
          border: var(--border);
          padding: 8px 10px;
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

        form.fields label {
          padding: 0 0 1px 5px;
          color: var(--text-color);
        }

        form.fields label {
          color: var(--label-color);
          margin: 20px 0 5px 0;
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
          margin: 0 0 20px;
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
          font-family: var(--font-main), sans-serif;
        }

        .ck.ck-editor__main > .ck-editor__editable {
          color: var(--editor-color);
        }

        .ck.ck-editor__main > .ck-editor__editable a {
          color: var(--anchor-color);
        }

        .ck-editor__editable_inline:not(.ck-comment__input *) {
          font-family: var(--font-main), sans-serif;
          overflow-y: auto;
        }

        .ck-editor__editable_inline {
          max-height: 70vh;
          min-height: 200px;
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

        * {
          line-height: 1.3;
          color: inherit;
          font-family: inherit;
        }

        h6,
        h5,
        h4,
        h3,
        h1 {
          padding: 0;
          color: var(--title-color);
          font-weight: 500;
          line-height: 1.5;
          margin: 10px 0;
          font-family: var(--font-main), sans-serif;
        }

        h6 {
          font-size: initial;
        }

        h5 {
          font-size: initial;
        }

        h4 {
          font-size: 1.25rem;
        }

        h3 {
          font-size: 1.3rem !important;;
        }

        h2 {
          font-size: 1.35rem !important;
          color: var(--title-color);
          font-weight: 600;
          line-height: 1.2;
          margin: 0;
          padding: 2px 0 0 13px;
          margin: 20px 0 10px;
          position: relative;
        }

        h2:before {
          content: "";
          position: absolute;
          bottom: 10%;
          left: 0;
          width: 2px;
          height: 80%;
          background: var(--action-linear);
          border-radius: 5px;
        }

        p {
          margin: 5px 0;
          line-height: 1.4;
        }

        a {
          text-decoration: none;
          cursor: pointer;
          color: var(--anchor-color) !important;
        }

        a:hover {
          text-decoration: underline;
        }

        blockquote {
          margin: 10px 0;
          padding: 5px 15px;
          font-style: italic;
          border-left: 2px solid var(--gray-color);
          background: var(--background);
          color: var(--text-color);
          font-weight: 400;
        }

        blockquote:before {
          content: open-quote;
          color: var(--gray-color);
          font-size: 1.5rem;
          line-height: 1;
          margin: 0 0 0 -5px;
        }

        blockquote:after {
          content: close-quote;
          color: var(--gray-color);
          font-size: 1.5rem;
          line-height: 1;
          margin: 0 0 0 -5px;
        }

        hr {
          border: none;
          background-color: var(--gray-color);
          height: 1px;
          margin: 10px 0;
        }

        ul,
        ol {
          margin: 5px 0 15px 20px;
          padding: 0 0 0 15px;
          color: inherit;
        }

        ul li,
        ol li {
          padding: 5px 0;
        }

        code {
          background: var(--gray-background);
          padding: 0 5px;
          font-family: var(--font-mono);
          font-size: 0.9rem;
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
            padding: 5px 10px 10px;
            margin: 0;
            position: fixed;
            top: 0;
            right: 0;
            left: 0;
            bottom: 0;
            width: 100%;
            max-width: 100%;
            height: 100dvh;
            min-height: 100dvh;
            border-radius: 0;
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
            max-height: calc(100dvh - 100px);
            height: calc(100dvh - 100px);
          }
        }
      </style>
    `;
  }
}