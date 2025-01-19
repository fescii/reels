export default class ChatImages extends HTMLDivElement {
  constructor() {
    super();
    this.app = window.app;
    this.api = this.app.api;
    this.url = this.getAttribute('url');
    this.uploadCount = this.getImagesLength(this.getAttribute("images"));
    this.maxUploads = 10;
    this.render();
  }

  render() {
    this.innerHTML = this.getTemplate();
    this.setupEventListeners();
    this.initializeImages();
  }

  getImagesLength = images => {
    try {
      return images.split(',').length;
    } catch (error) {
      return 0;
    }
  }

  connectedCallback() {
    // Component connected to the DOM
  }

  disconnectedCallback() {
    // Component disconnected from the DOM
  }

  setupEventListeners() {
    const addButton = this.querySelector('.add');
    const fileInput = this.querySelector('#fileInput');

    addButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', this.handleFileUpload.bind(this));
  }

  initializeImages = () => {
    try {
      let images = this.getAttribute("images").split(',');

      // remove empty strings, null, 'null' and whose length is less than 5
      images = images.filter(image => image.trim() !== '' && image !== 'null' && image.length > 5);
      
      images.forEach(imageUrl => {
        this.addImageToGallery(imageUrl);
      })

      // if uploads are more than the maxUploads, hide the add button
      if (this.uploadCount >= this.maxUploads) {
        this.hideAddButton();
      }
    } catch (error) {
      console.warn('No images to initialize');
    }
  }

  sendDeleteUrl = url => {
    const data = {
      type: 'update',
      frontend: true,
      data: {
        url: url,
        kind: 'delete',
        story: this.getAttribute('kind'),
        hash: this.getAttribute('hash')
      }
    };

    // send the view data
    if (window.wss) {
      window.wss.sendMessage(data);
    } else {
      console.warn('WebSocket connection not available. view information not sent.');
    }
  }

  updateAddedImage = url => {
    try {
      let images = window.toBeChanged.getAttribute('images');
      let imagesArray = [];

      if (images && images !== 'null'){
        imagesArray = images.split(',');
      }

      // filter out the null values and empty strings
      imagesArray = imagesArray.filter(image => image.trim() !== '' && image !== 'null' && image.length > 5);

      // Add the urls to the images array if they are not already there
      if (!imagesArray.includes(url)) {
        imagesArray.push(url);
      }

    } catch (error) {
      console.error('Error updating added image:', error);
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

      const data = await this.api.post(this.url, {
        body: formData,
        content: 'json'
      });

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
      if (error.message === 'Request timed out') {
        // Handle timeou
      } else if (error.message.startsWith('HTTP error!')) {
        // Handle HTTP error
      } else {
        // Handle other errors
      }

      this.app.showToast(false, error.message);

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

    // update the added image
    this.updateAddedImage(imageUrl);
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
      let images = this.getAttribute("images").split(',');
      images.push(imageUrl);
      
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

  getTemplate = () => {
    return /* html */`
      <div class="images">
        ${this.getBody()}
      </div>
      ${this.getStyles()}
    `;
  }

  getServerSuccessMsg = (success, text) => {
    if (!success) {
      return /* html */`
        <p class="server-status">${text}</p>
      `
    }
    return /* html */`
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
        <path d="M11.5085 2.9903C7.02567 2.9903 4.78428 2.9903 3.39164 4.38238C1.99902 5.77447 1.99902 8.015 1.99902 12.4961C1.99902 16.9771 1.99902 19.2176 3.39164 20.6098C4.78428 22.0018 7.02567 22.0018 11.5085 22.0018C15.9912 22.0018 18.2326 22.0018 19.6253 20.6098C21.0179 19.2176 21.0179 16.9771 21.0179 12.4961V11.9958" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <path d="M4.99902 20.9898C9.209 16.2385 13.9402 9.93727 20.999 14.6632" stroke="currentColor" stroke-width="1.5" />
        <path d="M17.9958 1.99829V10.0064M22.0014 5.97728L13.9902 5.99217" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
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
          /* border: var(--border); */
          width: 100%;
          min-width: 100%;
          max-width: 100%;
          display: flex;
          flex-flow: row;
          gap: 10px;
          position: relative;
          justify-content: start;
          align-items: center;
          margin: 0;
          padding: 0;
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
          border: var(--border);
          height: 80px;
          min-height: 80px;
          min-width: 80px;
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