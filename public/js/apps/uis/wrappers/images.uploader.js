export default class ImagesUploader extends HTMLElement {
  constructor() {
    super();
    this.api = this.getAttribute("api");
    this.uploadCount = 0;
    this.maxUploads = 10;
    this.render();
  }

  render() {
    this.innerHTML = this.getTemplate();
    this.setupEventListeners();
  }

  connectedCallback() {
    // Component connected to the DOM
  }

  setupEventListeners() {
    const addButton = this.querySelector('.add');
    const fileInput = this.querySelector('#fileInput');

    addButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', this.handleFileUpload.bind(this));
  }

  sendDeleteUrl = url => {
    const data = {
      type: 'update',
      frontend: true,
      data: {
        url: url,
        kind: 'delete'
      }
    };

    // send the view data
    if (window.wss) {
      window.wss.sendMessage(data);
    } else {
      console.warn('WebSocket connection not available. view information not sent.');
    }
  }

  async handleFileUpload(event) {
    const imagesContainer = this.querySelector('div.images');
    if (this.uploadCount >= this.maxUploads) {
      imagesContainer.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'You have reached the maximum uploads'));
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const addDiv = this.querySelector('div.add');

    // check file size: uploads more than 1MB to be downsized/downgraded

    try {
      // add loader to the addDiv
      addDiv.innerHTML = this.getButtonLoader();

      // display pointer-events: none on the addDiv
      addDiv.style.pointerEvents = 'none';

      const webpBlob = await this.convertToWebP(file);
      const formData = new FormData();
      formData.append('file', webpBlob, 'image.webp');

      const response = await this.fetchWithTimeout(this.api, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        this.addImageToGallery(data.url);
        this.addImageToAttribute(data.url);
        this.uploadCount++;
        
        if (this.uploadCount >= this.maxUploads) {
          this.hideAddButton();
        } else {
          addDiv.innerHTML = this.getSvg();
          addDiv.style.pointerEvents = 'all';
        }
      } else {
        imagesContainer.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, data.message));
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      imagesContainer.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, error.message));

      // remove message after 3 seconds
      setTimeout(() => {
        const serverStatus = this.querySelector('.server-status');
        if (serverStatus) {
          serverStatus.remove();
        }
      }, 3000);

      // remove loader and show add button
      addDiv.innerHTML = this.getSvg();
      addDiv.style.pointerEvents = 'all';
    }
  }

  async convertToWebP(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Only downscale if the image is larger than 1MB
        if (file.size > 1024 * 1024) {
          const aspectRatio = width / height;
          const maxWidth = 1280;
          const maxHeight = 1280;

          if (width > maxWidth || height > maxHeight) {
            if (aspectRatio > 1) {
              // Landscape image
              width = maxWidth;
              height = width / aspectRatio;
            } else {
              // Portrait image
              height = maxHeight;
              width = height * aspectRatio;
            }
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP
        canvas.toBlob((blob) => {
          // Generate a unique filename
          const filename = `image_${Date.now()}.webp`;
          resolve(new File([blob], filename, { type: 'image/webp' }));
        }, 'image/webp', 0.9); // Increased quality to 0.9
      };
      img.src = URL.createObjectURL(file);
    });
  }

  addImageToGallery(imageUrl) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'image-container loading';
    imageDiv.innerHTML = `<img src="${imageUrl}" alt="Post Image" loading="lazy"> ${this.getButtonLoader()} ${this.getCancel()}`;
    this.querySelector('.add').insertAdjacentElement('beforebegin', imageDiv);

    // add load listener to the image
    this.addImageLoadListener(imageDiv.querySelector('img'));

    // add remove listener to the cancel button
    this.removeFromGallery(imageDiv.querySelector('.cancel-btn'));
  }

  removeFromGallery = btn => {
    btn.addEventListener('click', () => {
      const imageDiv = btn.parentElement;
      const imageUrl = imageDiv.querySelector('img').src;

      // remove image from gallery
      imageDiv.remove();

      // remove image from attribute
      this.removeImageFromAttribute(imageUrl);

      // decrement upload count
      this.uploadCount--;

      // show add button
      this.showAddButton();

      // send delete url to server
      this.sendDeleteUrl(imageUrl);
    })
  }

  removeImageFromAttribute = imageUrl => {
    // get images attribute: array
    let images = this.getAttribute("images").split(',');
    const index = images.indexOf(imageUrl);
    images.splice(index, 1);

    // remove empty strings, null, 'null' and whose length is less than 5
    images = images.filter(image => image.trim() !== '' && image !== 'null' && image.length > 5);

    // set images attribute: array
    this.setAttribute("images", images.join(','));
  }

  addImageToAttribute(imageUrl) {
    try {
      // get images attribute: array
      let images = this.getAttribute("images").split(',');
      images.push(imageUrl);

      // remove empty strings, null, 'null' and whose length is less than 5
      images = images.filter(image => image.trim() !== '' && image !== 'null' && image.length > 5);

      // set images attribute: array
      this.setAttribute("images", images.join(','));
    } catch (error) {
      console.error('Error adding image to attribute:', error);
    }
  }

  hideAddButton() {
    const addButton = this.querySelector('.add');
    addButton.style.display = 'none';
  }

  showAddButton() {
    const addButton = this.querySelector('.add');
    addButton.innerHTML = this.getSvg();
    addButton.style.pointerEvents = 'all';
    addButton.style.display = 'flex';
  }

  addImageLoadListener = img => {
    img.addEventListener('load', () => {
      // remove loader and blur(.loading) class)
			img.parentElement.classList.remove('loading');
			const loader = img.parentElement.querySelector('#btn-loader');
			if(loader) { loader.remove(); }
    });
    img.addEventListener('error', () => {
      img.parentElement.classList.add('error');
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
  }

  getTemplate = () => {
    return `
      <div class="images">
        ${this.getBody()}
      </div>
      ${this.getStyles()}
    `;
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

  getBody = () => {
    return /* html */`
      <div class="add">
        ${this.getSvg()}
        <input type="file" id="fileInput" accept=".avif, image/*, image/webp, image/avif" style="display: none;">
      </div>
    `;
  }

  getSvg = () => {
    return /* svg */`
      <svg id="Image" width="24" height="24" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M8.58093 11.8089C7.30893 11.8089 6.27393 10.7739 6.27393 9.50187C6.27393 8.22787 7.30893 7.19287 8.58093 7.19287C9.85393 7.19387 10.8889 8.22987 10.8889 9.50187C10.8889 10.7739 9.85293 11.8089 8.58093 11.8089ZM8.57993 8.69287C8.13593 8.69287 7.77393 9.05487 7.77393 9.50187C7.77393 9.94687 8.13593 10.3089 8.58093 10.3089C9.02693 10.3089 9.38893 9.94687 9.38893 9.50187C9.38893 9.05587 9.02593 8.69387 8.57993 8.69287Z" fill="currentColor"/>
        <path d="M6.06878 17.604C5.95678 17.604 5.84178 17.579 5.73478 17.525C5.36478 17.34 5.21478 16.892 5.39778 16.522C5.50278 16.311 6.46278 14.468 8.06378 14.468C8.88778 14.468 9.49078 14.916 9.97578 15.278C10.4478 15.628 10.7568 15.843 11.1598 15.843C11.4448 15.839 12.1838 14.95 12.5808 14.471C13.4278 13.451 14.3048 12.395 15.4218 12.395C17.3358 12.395 18.5258 14.94 18.6548 15.23C18.8228 15.608 18.6538 16.05 18.2758 16.219C17.9008 16.39 17.4548 16.22 17.2848 15.842C16.9998 15.207 16.1678 13.895 15.4218 13.895C15.0097 13.895 14.2454 14.8147 13.7384 15.4247L13.7348 15.429C12.9178 16.414 12.1458 17.343 11.1598 17.343C10.2398 17.343 9.59678 16.865 9.08078 16.481C8.65278 16.164 8.37578 15.968 8.06378 15.968C7.52878 15.968 6.94178 16.792 6.74078 17.19C6.60878 17.453 6.34378 17.604 6.06878 17.604Z" fill="currentColor"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M2 12.396C2 19.779 4.617 22.396 12 22.396C19.383 22.396 22 19.779 22 12.396C22 5.013 19.383 2.396 12 2.396C4.617 2.396 2 5.013 2 12.396ZM3.5 12.396C3.5 5.882 5.486 3.896 12 3.896C18.514 3.896 20.5 5.882 20.5 12.396C20.5 18.91 18.514 20.896 12 20.896C5.486 20.896 3.5 18.91 3.5 12.396Z" fill="currentColor"/>
      </svg>
    `;
  }

  getCancel = () => {
    return /* svg */`
      <span class="cancel-btn">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
        </svg>
      </span>
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
	        width: 3px;
	      }

	      *::-webkit-scrollbar-track {
	        background: var(--scroll-bar-background);
	      }

	      *::-webkit-scrollbar-thumb {
	        width: 3px;
	        background: var(--scroll-bar-linear);
	        border-radius: 50px;
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

        p.server-status {
          margin: 0;
          width: 100%;
          text-align: start;
          font-family: var(--font-read), sans-serif;
          color: var(--error-color);
          font-weight: 500;
          line-height: 1.5;
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

	      div.images {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-flow: row;
          gap: 10px;
          position: relative;
          justify-content: start;
          align-items: center;
          margin: 0;
          padding: 10px 0;
          overflow-x: scroll;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        ::-webkit-scrollbar {
          display: none !important;
          visibility: hidden;
        }
        
        div.images > .image-container {
					border: var(--border);
					position: relative;
					display: flex;
					justify-content: center;
					align-items: center;
					position: relative;
					cursor: pointer;
					overflow: hidden;
					height: 80px;
					min-width: 60px;
					border-radius: 12px;
				}

				div.images > .image-container.error {
					border: var(--input-border-error);
				}

        div.images > .image-container.loading img {
					filter: blur(8px);
				}

				div.images > .image-container > img {
					height: 100%;
					width: auto;
					min-width: 60px;
					max-height: 80px;
					object-fit: cover;
					object-position: center;
					border-radius: 12px;
					overflow: hidden;
					transition: transform 0.4s ease-in-out;
				}

        div.images > .image-container > span.cancel-btn {
          position: absolute;
          top: 5px;
          right: 5px;
          padding: 0;
          cursor: pointer;
          display: flex;
          flex-flow: column;
          gap: 0px;
          justify-content: center;
        }

        div.images > .image-container > span.cancel-btn svg {
          width: 15px;
          height: 15px;
          color: var(--error-color);
        }

				div.images > .image-container:hover img {
					transform: scale(1.3);
				}
        
        div.images > div.add {
          height: 50px;
          min-width: 50px;
          background: var(--gray-background);
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          max-height: 60px;
          box-shadow: var(--image-shadow);
          border-radius: 12px;
        }
        
        div.images > div.add > svg {
          height: 30px;
          width: 30px;
          color: var(--gray-color);
          transition: all 0.3s ease;
        }
        
        div.images > div.add:hover svg {
          color: var(--accent-color);
        }

				@media screen and (max-width:660px) {
					:host {
        		font-size: 16px;
					}

					::-webkit-scrollbar {
						-webkit-appearance: none;
					}

          div.image-container,
          div.images > div.add,
					a {
						cursor: default !important;
					}
				}
	    </style>
    `;
	}
}