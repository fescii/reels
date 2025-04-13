export default class PostOptions extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this.editor = null;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this._option = this.capitalizeFirstLetter(this.getAttribute('kind'));
    this.hash = this.getAttribute('hash').toLowerCase();
    this.kind = this.getAttribute('kind');
    this.drafted = this.convertToBool(this.getAttribute('drafted'));
    this.removeApi  = `/p/${this.hash}/remove`;
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  capitalizeFirstLetter = string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // select section
    const section = this.shadowObj.querySelector('section.content');
    if (section) {
      // activate the edit button
      this.activateEditButton();
      // activate the publish button
      this.activatePublishButton();
      // activate the delete button
      this.activateDeleteButton();
    }
    
    const btns = this.shadowObj.querySelectorAll('.cancel-btn');
    const overlay = this.shadowObj.querySelector('.overlay');

    // Close the modal
    if (overlay && btns) {
      this.closePopup(overlay, btns);
    }

    this.disableScroll();
  }

  disconnectedCallback() {
    this.enableScroll();
  }

  convertToBool = str => {
		return str === 'true' ? true : false;
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

  activateEditButton = () => {
    // Get the body element
    const body = document.querySelector('body');
    // Get the edit button
    const editButton = this.shadowObj.querySelector('div.post-type > div.types > div.type.edit');
    if(!editButton) return;
    // Add an event listener to the post button
    editButton.addEventListener('click', e => {
      e.preventDefault();
      // Get the content of the topic page
      const content = this.kind === 'story' ? this.getArticleEdit() : this.getEdit();

      // insert the content into the body
      body.insertAdjacentHTML('beforeend', content);

      // Remove the current popup
      this.remove();
    });
  }

  getEdit = () => {
    const hash = this.getAttribute('hash').toLowerCase();
    const api = `/p/${hash}/edit/content`;
    // Show Post Page Here
    return /* html */`
      <div is="edit-post" api="${api}" method="PUT" kind="${this.getAttribute('kind')}" images="${this.getAttribute('images')}"
        url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}" published="${this.getAttribute('published')}">
        ${this.innerHTML}
      </div>
    `;
  }

  getArticleEdit = () => {
    const hash = this.getAttribute('hash').toLowerCase();
    const api = `/s/${hash}/edit`;
    // Show Post Page Here
    return /* html */`
      <div is="edit-article" api="${api}" method="PUT" kind="${this.kind}" story-title="${this.getAttribute('story-title')}" slug="${this.getAttribute('slug')}"
        url="${this.getAttribute('url')}" hash="${this.getAttribute('hash')}"  images="${this.getAttribute('images')}">
        ${this.innerHTML}
      </div>
    `;
  }

  activatePublishButton = () => {
    const publishButton = this.shadowObj.querySelector('div.post-type > div.types > div.type.publish');
    if(!publishButton) return;
    publishButton.addEventListener('click', e => {
      e.preventDefault();
      const content = this.getPublish();
      this.shadowObj.querySelector('div.fields').innerHTML = content;
      this.activatePublishAction(this.shadowObj.querySelector('div.finish.publish'));
    });
  }

  activatePublishAction = publish => {
    const button = publish.querySelector('button.finish.publish');
    if (button) {
      button.addEventListener('click', e => {
        e.preventDefault();

        // disable pointer events
        button.style.pointerEvents = 'none';

        const section = this.shadowObj.querySelector('section.content');

        this.publishPost(section, button);
      });
    }
  }

  publishPost = async (section, button) => {
    button.innerHTML = this.getButtonLoader();
    const url = `/s/${this.hash}/publish`;

    try {
      const data = await this.api.patch(url, { content: 'json' })
      if (data.success) {
        // select fields container
        const fields = this.shadowObj.querySelector('div.fields')

        // replace the fields with the finish message
        fields.innerHTML = this.getFinish('publish');
        // activate the finish button
        this.activateFinish(this.shadowObj.querySelector('div.finish'));

        if(window.toBeChanged) {
          window.toBeChanged.setAttribute('published', 'true')
          window.toBeChanged.setAttribute('reload', 'true')
          window.toBeChanged = null;
        }
      } else {
        // show error message
        button.innerHTML = 'Publish';
        // enable pointer events
        button.style.pointerEvents = 'auto';

        const status = this.getServerSuccessMsg(data.success, data.message);
      
        // insert the status message before the button
        button.insertAdjacentHTML('beforebegin', status);

        // remove success message
        setTimeout(() => {
          const serverStatus = section.querySelector('.server-status');
          if (serverStatus) {
            serverStatus.remove();
          }
        }, 5000);
      }
    } catch (error) {
      // show error message
      button.innerHTML = 'Publish';
      // enable pointer events
      button.style.pointerEvents = 'auto';

      const status = this.getServerSuccessMsg(false, 'An error occurred. Please try again later.');
      
      // insert the status message before the button
      button.insertAdjacentHTML('beforebegin', status);

      setTimeout(() => {
        const serverStatus = section.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);
    }
  }

  activateDeleteButton = () => {
    const deleteButton = this.shadowObj.querySelector('div.post-type > div.types > div.type.delete');
    if(!deleteButton) return;
    deleteButton.addEventListener('click', e => {
      e.preventDefault();
      const content = this.getDelete();
      this.shadowObj.querySelector('div.fields').innerHTML = content;
      this.activateDeleteAction(this.shadowObj.querySelector('div.finish.delete'));
    });
  }

  activateDeleteAction = del => {
    const button = del.querySelector('button.finish.delete');
    if (button) {
      button.addEventListener('click', e => {
        e.preventDefault();

        // disable pointer events
        button.style.pointerEvents = 'none';

        const section = this.shadowObj.querySelector('section.content');

        this.deletePost(section, button);
      });
    }
  }

  deletePost = async (section, button) => {
    button.innerHTML = this.getButtonLoader();

    try {
      const data = await this.api.delete(this.removeApi, { content: 'json', body })
      if (data.success) {
        // replace the fields with the finish message
        section.innerHTML = this.getFinish('delete');
        // activate the finish button
        this.activateFinish(this.shadowObj.querySelector('div.finish'));
        if(window.toBeChanged) {
          window.toBeChanged.remove();
          window.toBeChanged = null;
        }
      } else {
        // show error message
        button.innerHTML = 'Delete';
        // enable pointer events
        button.style.pointerEvents = 'auto';

        const status = this.getServerSuccessMsg(data.success, data.message);
      
        // insert the status message before the button
        button.insertAdjacentHTML('beforebegin', status);

        setTimeout(() => {
          const serverStatus = section.querySelector('.server-status');
          if (serverStatus) {
            serverStatus.remove();
          }
        }, 5000);
      }
    } catch (error) {
      // show error message
      button.innerHTML = 'Delete';
      // enable pointer events
      button.style.pointerEvents = 'auto';

      const status = this.getServerSuccessMsg(false, 'An error occurred. Please try again later.');
      
      // insert the status message before the button
      button.insertAdjacentHTML('beforebegin', status);

      setTimeout(() => {
        const serverStatus = section.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 5000);
    }
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
      <div class="overlay"></div>
      <section id="content" class="content">
        ${this.getBody()}
      </section>
      ${this.getStyles()}
    `
  }

  getBody = () => {
    return /* html */`
      <div class="fields" id="fields-container">
        ${this.getOptions()}
      </div>
    `;
  }

  getOptions = () => {
    return /* html */`
      <div class="post-type">
        <div class="types">
          <div class="type edit">
            <h4 class="title">Edit</h4>
            <p class="desc">
              Make changes to the ${this._option} contents.
            </p>
          </div>
          ${this.getPublished(this.convertToBool(this.getAttribute('story')))}
          <div class="type delete">
            <h4 class="title">Delete</h4>
            <p class="desc">
              Remove this ${this._option} from the platform.
            </p>
          </div>
        </div>
      </div>
    `;
  }

  getPublished = story => {
    if (story) {
      if (this.drafted) {
        return /*html*/`
          <div class="type publish" data-name="publish">
            <h4 class="title">Publish</h4>
            <p class="desc">
              This will make the story appear public.
            </p>
          </div>
        `
      } else return '';
    } else return '';
  }

  getPublish = () => {
    return /* html */`
      <div class="finish publish">
        <h2 class="title">Please confirm</h2>
        <p class="desc">
          Your ${this._option.toLowerCase()} will be made publicly available to everyone on this platform.
          Your ${this._option.toLowerCase()} may also appear in web search.
        </p>
        <button class="finish publish">Publish</button>
      </div>
    `;
  }

  getDelete = () => {
    return /* html */`
      <div class="finish delete">
        <h2 class="title">Please confirm</h2>
        <p class="desc">
          Your are about to remove the ${this._option.toLowerCase()} completely from the Platform.
          Once this ${this._option.toLowerCase()} removed, you cannot recover it.
        </p>
        <button class="finish delete">Delete</button>
      </div>
    `;
  }

  getFinish = action => {
    if (action === 'publish') {
      return /* html */`
        <div class="finish">
          <h2 class="title">Published</h2>
          <p class="desc">
            Your ${this._option.toLowerCase()} has been successfully published.
            To view the ${this._option.toLowerCase()}, go to the feeds or from your profile.
          </p>
          <button class="finish">Close</button>
        </div>
      `;
    } else if (action === 'delete') {
      return /* html */`
        <div class="finish">
          <h2 class="title">Deleted</h2>
          <p class="desc">
            Your ${this._option.toLowerCase()} has been deleted successfully.
            The ${this._option.toLowerCase()} is no longer available on the platform.
          </p>
          <button class="finish">Close</button>
        </div>
      `;
    } else {
      return /* html */`
        <div class="finish">
          <h2 class="title">You're all set!</h2>
          <p class="desc">
            Your action has been successfully completed.
            You can now close this dialog.
          </p>
          <button class="finish">Close</button>
        </div>
      `;
    }
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
          font-family: inherit;
        }

        a {
          text-decoration: none;
        }

        :host {
          border: none;
          padding: 0;
          justify-self: end;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 90;
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
          padding: 15px 10px;
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
          text-align: center;
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

        h2.pop-title > span.text:first-letter {
          text-transform: capitalize;
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

        div.fields {
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
          gap: 5px;
          padding: 10px;
          border-radius: 12px;
          background: var(--create-background);
          cursor: pointer;
        }

        div.post-type > div.types > div.type:hover {
          background: var(--background);
          border: var(--border);
          padding: 9px;
        }

        div.post-type > div.types > div.type > h4.title {
          margin: 0;
          padding: 0;
          font-size: 1.1rem;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
        }

        div.post-type > div.types > div.type.delete > h4.title{
          color: var(--error-color);
        }

        div.post-type > div.types > div.type > p.desc {
          margin: 0;
          padding: 5px 0;
          font-size: 0.85rem;
          font-family: var(--font-read), sans-serif;
          color: var(--gray-color);
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
          position: relative;
          min-width: 50px;
          min-height: 40px;
          width: max-content;
          padding: 7px 15px 8px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        div.finish > button.finish.delete {
          border: none;
          background: var(--error-linear);
          color: var(--white-color);
        }

        @media screen and (max-width:600px) {
          :host {
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
          }

          #content {
            box-sizing: border-box !important;
            padding: 5px 10px 10px 10px;
            margin: 0;
            width: 100%;
            max-width: 100%;
            max-height: 90%;
            min-height: max-content;
            border-radius: 0px;
            border-top: var(--border);
            border-top-right-radius: 15px;
            border-top-left-radius: 15px;
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

          div.post-type > div.types > div.type {
            width: 100%;
            display: flex;
            flex-flow: column;
            gap: 2px;
            cursor: default !important;
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

          div.fields .actions {
            align-items: center;
            width: 100%;
            gap: 25px;
          }

          div.finish > button.finish {
            margin: 10px 0 0;
          }

          div.finish > button.finish,
          div.fields .actions > .action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}