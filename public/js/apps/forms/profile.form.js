import ImageProcessor from "./image.js";
export default class FormProfile extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.processor = new ImageProcessor({ maxSize: 800, quality: 0.9 });
    this._url = this.getAttribute('api');
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.activateForm()

    // get the form
    const form = this.shadowObj.querySelector('form.fields');

    // submit form
    this.submitForm(form);
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

  activateForm = () => {
    const previewContainer = this.shadowObj.querySelector('.image-preview')

    if(previewContainer) {
      const image = previewContainer.querySelector('input[type="file"]');
      image.addEventListener('change', (event) => {
        // console.log('Changed')
        // Get the selected files.
        const imageFiles = event.target.files;

        // Count the number of files selected.
        const imageFilesLength = imageFiles.length;

        //If at least one image is selected, then proceed to display the preview.
        if (imageFilesLength > 0) {
          // Get the image path.
          const imageSrc = URL.createObjectURL(imageFiles[0]);

          //  Add the image as background image.
          previewContainer.style.backgroundImage = `url(${imageSrc})`;
        }
      });
    }
  }

  submitForm = async form => {
    form.addEventListener('submit', this.handleSubmit);
  }

  handleSubmit = async e => {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('.action.next');
    const actions = form.querySelector('.actions');
    const file = form.querySelector('#profile-image').files[0];

    this.clearServerStatus(form);
    this.showLoader(button);

    if (!file) {
      this.showServerStatus(form, false, 'Please select an image');
      this.resetButton(button);
      return;
    }

    try {
      const formData = await this.prepareFormData(file);
      const response = await this.sendFormData(formData);
      const result = await response.json();

      this.showServerStatus(form, result.success, result.message);
    } catch (error) {
      this.showServerStatus(form, false, 'An error occurred, please try again');
    } finally {
      this.resetButton(button);
      this.removeServerStatusAfterDelay(form);
    }
  }

  clearServerStatus = form => {
    const serverStatus = form.querySelector('.server-status');
    if (serverStatus) {
      serverStatus.remove();
    }
  }

  showLoader = button => {
    button.innerHTML = this.getButtonLoader();
  }

  resetButton = button => {
    button.innerHTML = '<span class="text">Send</span>';
  }

  showServerStatus = (form, success, message) => {
    const actions = form.querySelector('.actions');
    actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(success, message));
  }

  removeServerStatusAfterDelay = form => {
    setTimeout(() => {
      this.clearServerStatus(form);
    }, 5000);
  }

  prepareFormData = async file => {
    // const { blob } = await this.resizeImage(file);
    const { blob } = await this.processor.processImage(file);
    const formData = new FormData();
    formData.append('file', blob, 'file.webp');
    return formData;
  }

  sendFormData = formData => {
    const options = {
      method: 'PATCH',
      body: formData
    };
    return this.fetchWithTimeout(`/api/v1${this._url}`, options, 10000);
  }

  // Function to resize image and crop to square
  resizeImage = async file => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const maxSize = 300;
          canvas.width = maxSize;
          canvas.height = maxSize;
          const aspectRatio = img.width / img.height;
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;
          if (aspectRatio > 1) {
            sourceX = (img.width - img.height) / 2;
            sourceWidth = img.height;
          } else {
            sourceY = (img.height - img.width) / 2;
            sourceHeight = img.width;
          }
          ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, maxSize, maxSize);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({ blob, width: maxSize, height: maxSize });
              } else {
                reject(new Error('Failed to create blob'));
              }
            },
            'image/webp',
            0.9
          );
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = event.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  fetchWithTimeout = async (url, options = {}, timeout = 9500) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
  
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw new Error(`Network error: ${error.message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  getServerSuccessMsg = (success, text) => `
    <p class="server-status${success ? ' success' : ''}">${text}</p>
  `;

  getButtonLoader() {
    return `
      <span id="btn-loader">
				<span class="loader"></span>
			</span>
    `
  }

  getTemplate() {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    return /* html */`
      ${this.getHeader()}
      <form class="fields picture">
        <div class="image-preview">
          <label for="profile-image">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z"></path>
            </svg>
          </label>
          <input type="file" id="profile-image" accept="image/*" />
        </div>
        <div class="actions">
          <button type="submit" class="action next">
            <span class="text">Send</span>
          </button>
        </div>
      </form>
    `;
  }

  getHeader = () => {
    return /* html */`
      <div class="top">
        <h4 class="title">Your picture</h4>
        <p class="desc">
          Your profile picture is how people will recognize you on the platform. You can use a photo of yourself or an avatar. <br>
          <span>Note that the image will be cropped to a square and resized to 300x300 pixels, and may take time to reflect everywhere due to local cache.<span>
        </p>
      </div>
    `;
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

        :host {
          font-size: 16px;
          display: flex;
          flex-flow: column;
          gap: 10px;
          padding: 0;
          width: 100%;
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

        @keyframes l38 {
          100% {
            background-position: 100% 0, 100% 100%, 0 100%, 0 0
          }
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

        #btn-loader > .loader-alt {
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

        #btn-loader > .loader {
          width: 20px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        .top {
          display: flex;
          flex-flow: column;
          gap: 5px;
          padding: 0;
          width: 100%;
        }

        .top > h4.title {
          display: flex;
          align-items: center;
          color: var(--title-color);
          font-size: 1.3rem;
          font-weight: 500;
          margin: 0;
          padding: 0;
        }

        .top > .desc {
          margin: 0;
          padding: 0 0 5px;
          color: var(--text-color);
          font-size: 1rem;
          font-family: var(--font-main), sans-serif;
        }

        .top > .desc > span {
          margin: 0;
          color: var(--gray-color);
          font-size: 0.85rem;
          line-height: 1.5;
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

        form.fields > .field {
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          gap: 20px;
        }

        form.fields.center > .field {
          align-items: center;
        }

        form.fields .field .input-group {
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          color: var(--text-color);
          gap: 5px;
          position: relative;
          transition: border-color 0.3s ease-in-out;
        }

        form.fields .field.bio .input-group {
          width: 100%;
        }

        form.fields .field.bio .input-group.code,
        form.fields .field.bio .input-group.email {
          grid-column: 1/3;
          width: 100%;
        }

        form.fields .field .input-group > svg {
          position: absolute;
          right: 10px;
          top: 38px;
          width: 20px;
          height: 20px;
        }

        form.fields label {
          padding: 0 0 5px 0;
          color: var(--text-color);
        }

        form.fields .field.bio label {
          padding: 0 0 0 5px;
        }

        form.fields label {
          color: var(--label-color);
          font-size: 1.1rem;
          font-family: var(--font-main), sans-serif;
          transition: all 0.3s ease-in-out;
          pointer-events: none;
        }

        form.fields .field input {
          border: var(--input-border);
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

        form.fields .field span.wrapper {
          display: flex;
          align-items: center;
          align-items: center;
          gap: 0;
          width: 100%;
        }

        form.fields .field .input-group.success > span.wrapper > input,
        form.fields .field .input-group.success > span.wrapper > input:focus,
        form.fields .field .input-group.success input,
        form.fields .field .input-group.success input:focus {
          border: var(--input-border-focus);
        }

        form.fields .field .input-group.failed > span.wrapper > input,
        form.fields .field .input-group.failed > span.wrapper > input:focus,
        form.fields .field .input-group.failed input,
        form.fields .field .input-group.failed input:focus {
          border: var(--input-border-error);
        }

        form.fields .field .input-group.success span.wrapper > input,
        form.fields .field .input-group.success input {
          color: var(--accent-color);
        }

        form.fields .field .input-group.failed span.wrapper > input,
        form.fields .field .input-group.failed input {
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
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          margin: 0 0 0 2px;
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

        form.fields.picture > .image-preview {
          border: var(--input-border);
          position: relative;
          width: 200px;
          height: 200px;
          min-width: 200px;
          min-height: 200px;
          object-fit: cover;
          display: flex;
          align-items: center;
          overflow: hidden;
          justify-content: center;
          background-image: url(${this.getAttribute('profile-image')});
          background-repeat: no-repeat !important;
          background-position: 100%;
          background-size: cover;
          border-radius: 50%;
          -webkit-border-radius: 50%;
          -moz-border-radius: 50%;
          -ms-border-radius: 50%;
          -o-border-radius: 50%;
        }

        form.fields.picture > .image-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: none;
          border-radius: 20px;
        }

        form.fields.picture > .image-preview input + label {
          display: inline-block;
          width: max-content;
          height: 30px;
          margin-bottom: 0;
          border-radius: 100%;
          background-color: #ffffff45;
          border: 1px solid transparent;
          box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.12);
          cursor: pointer;
          position: absolute;
          right: calc(50% - 20px);
          top: calc(50% - 20px);
          transform: translateY(-50%);
          font-weight: normal;
        }

        form.fields.picture > .image-preview input {
          opacity: 0;
        }

        form.fields.picture > .image-preview label {
          position: absolute;
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          top: calc(50% - 20px);
          padding: 7px 12px;
          z-index: 1;
          margin: 0;
          text-align: center;
          background: var(--accent-linear);
          color: var(--white-color);
          font-size: 1rem;
          font-family: var(--font-main), sans-serif;
          font-weight: 500;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        form.fields.picture > .image-preview label svg {
          width: 20px;
          height: 20px;
        }

        @media screen and (max-width:600px) {
          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          :host {
            padding: 0 10px;
          }

          form.fields .actions > .action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}