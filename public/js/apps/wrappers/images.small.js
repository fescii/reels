export default class ImagesSmall extends HTMLElement {
	constructor() {
		// We are not even going to touch this.
		super();

		// let's create our shadow root
		this.shadowObj = this.attachShadow({ mode: "open" });

		this.render();
	}

	// observe the attributes
  static get observedAttributes() {
    return ['images'];
  }

  // listen for changes in the attributes
  attributeChangedCallback(name, oldValue, newValue) {
    // check if old value is not equal to new value
    if (name === 'images') {
      this.render();
    }
  }

	render() {
		this.shadowObj.innerHTML = this.getTemplate();
		this.addImageLoadListeners();
	}

	connectedCallback() {
	}

	clickImage = img => {
		const current = img.getAttribute("index");
		img.addEventListener("click", e => {
			e.preventDefault();

			this.openImagePopup(current);
		})
	}

	addImageLoadListeners() {
    const images = this.shadowObj.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('load', () => {
				// change loaded attribute to true
				img.setAttribute('loaded', 'true');
				// remove loader and blur(.loading) class)
				img.parentElement.classList.remove('loading');
				const loader = img.parentElement.querySelector('#btn-loader');
				if(loader) { loader.remove(); }

				// add click event listener
				this.clickImage(img);
      });
      img.addEventListener('error', () => {
        img.parentElement.classList.add('error');
      });
    });
  }

	openImagePopup = current => {
		const body = document.querySelector("body");
		const popup = this.getImagePopup(current);

		if(body && popup) {
			// insert popup before body end
			body.insertAdjacentHTML("beforeend", popup);
		}
	}

	getTemplate = () => {
		const imagesArrayStr = this.getAttribute("images");
		const images = imagesArrayStr.split(",");
		// Show HTML Here
		return `
			<div class="images">
      	${this.getBody(images)}
			</div>
      ${this.getStyles()}
    `;
	}

	getBody = images => {
		const total = images.length;
		return images.map((image, index) => {
			return /* html */`
				<div class="image-container loading ${total === 1 ? "single" : "multi"}">
					<img src="${image}" index="${index + 1}" alt="Post Image" loading="lazy" loaded="false" />
					${this.getButtonLoader()}
				</div>
			`;
		}).join("");
	}

	getImagePopup = current => {
		return /* html */`
			<image-popup images="${this.getAttribute('images')}" current="${current}"></image-popup>
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

	      :host {
        	font-size: 16px;
					width: 100%;
					max-width: 100%;
					margin: 0;
				  padding: 10px 0 3px;
					display: flex;
					flex-flow: row;
					gap: 0;
					position: relative;
					justify-content: start;
					align-items: center;
					margin: 0;
          overflow-x: scroll;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        ::-webkit-scrollbar {
          display: none !important;
          visibility: hidden;
        }

        #btn-loader {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
        }

        #btn-loader > .loader {
          width: 30px;
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
					width: max-content;
					margin: 0;
					display: flex;
					flex-flow: row;
					gap: 9px;
					position: relative;
					justify-content: start;
					align-items: center;
					margin: 0;
        }
				
				.image-container {
					border: var(--border);
					position: relative;
					display: flex;
					justify-content: center;
					align-items: center;
					position: relative;
					cursor: pointer;
					overflow: hidden;
					height: 100px;
					max-width: 80px;
					width: 80px;
					border-radius: 12px;
				}

				.image-container.loading img {
					filter: blur(8px);
				}

				.image-container.error {
					border: var(--input-border-error);
				}

				.image-container > img {
					height: 100%;
					width: 100%;
					object-fit: cover;
					object-position: center;
					border-radius: 12px;
					overflow: hidden;
					transition: transform 0.4s ease-in-out;
				}

				.image-container:hover img {
					/*transform: scale(1.3);*/
				}

				@media screen and (max-width:660px) {
					:host {
        		font-size: 16px;
						margin-left: -10px;
						margin-right: -10px;
						width: calc(100% + 20px);
						max-width: calc(100% + 20px);
						padding: 10px 10px 3px;
					}

					::-webkit-scrollbar {
						-webkit-appearance: none;
					}

					div.image-container,
					a {
						cursor: default !important;
					}
				}
	    </style>
    `;
	}
}