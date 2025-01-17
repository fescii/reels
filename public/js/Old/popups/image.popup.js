export default class ImagePopup extends HTMLElement {
  constructor() {
    super();
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.imagesLength = this.getAttribute("images").split(",").length;
    this.index = this.parseToNumber(this.getAttribute("current"));
    this.render();
    this.isScrolling = false;
    this.targetScrollLeft = 0;
    this.handlePopState = this.handlePopState.bind(this);
    this.preventContextMenu = this.preventContextMenu.bind(this);
    this.preventTouchHold = this.preventTouchHold.bind(this);
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const btns = this.shadowObj.querySelectorAll('.cancel-btn');
    const overlay = this.shadowObj.querySelector('.overlay');

    if (overlay && btns) {
      this.closePopup(overlay, btns);
    }

    this.addImageLoadListeners();
    this.scrollToCurrentImage();
    this.setupScrolling();
    this.disableScroll();
    this.setupBackButtonHandler();
    this.setupDownloadPrevention();
  }

  disconnectedCallback() {
    this.enableScroll();
    this.removeBackButtonHandler();
    this.removeDownloadPrevention();
  }

  setupDownloadPrevention() {
    const imagesContainer = this.shadowObj.querySelector('.images');
    imagesContainer.addEventListener('contextmenu', this.preventContextMenu);
    imagesContainer.addEventListener('touchstart', this.preventTouchHold);
    
    // Prevent drag & drop
    imagesContainer.addEventListener('dragstart', (e) => e.preventDefault());
  }

  removeDownloadPrevention() {
    const imagesContainer = this.shadowObj.querySelector('.images');
    imagesContainer.removeEventListener('contextmenu', this.preventContextMenu);
    imagesContainer.removeEventListener('touchstart', this.preventTouchHold);
  }

  preventContextMenu(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  preventTouchHold(e) {
    const touch = e.touches[0];
    let touchHoldTimer;

    const clearTouchHoldTimer = () => {
      if (touchHoldTimer) {
        clearTimeout(touchHoldTimer);
      }
    };

    touchHoldTimer = setTimeout(() => {
      e.preventDefault();
      e.stopPropagation();
    }, 500); // Adjust this value to change the hold duration

    const touchEnd = () => {
      clearTouchHoldTimer();
      document.removeEventListener('touchend', touchEnd);
      document.removeEventListener('touchmove', touchMove);
    };

    const touchMove = (moveEvent) => {
      if (
        Math.abs(moveEvent.touches[0].pageX - touch.pageX) > 10 ||
        Math.abs(moveEvent.touches[0].pageY - touch.pageY) > 10
      ) {
        clearTouchHoldTimer();
      }
    };

    document.addEventListener('touchend', touchEnd);
    document.addEventListener('touchmove', touchMove);
  }

  setupBackButtonHandler() {
    // Push a new state to the history when the popup opens
    history.pushState({ popup: true }, '');

    // Add event listener for popstate
    // window.addEventListener('popstate', this.handlePopState.bind(this));
    window.onpopstate = this.handlePopState.bind(this);
  }

  removeBackButtonHandler() {
    window.removeEventListener('popstate', this.handlePopState.bind(this));
  }

  handlePopState(event) {
    // Prevent other popstate event handlers from being called
    event.stopImmediatePropagation();

    // Close the popup when the back button is pressed
    this.remove();
  }

  closeAndRemove() {
    // Remove the event listener before closing
    this.removeBackButtonHandler();
    
    // Remove the state we added when opening the popup
    // history.back();
    
    // Remove the popup from the DOM
    this.remove();
  }

  closePopup = (overlay, btns) => {
    overlay.addEventListener('click', e => {
      e.preventDefault();
      this.closeAndRemove();
      // Remove the state we added when opening the popup
      history.back();  closePopup = (overlay, btns) => {
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
    });

    btns.forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        this.closeAndRemove();
        // Remove the state we added when opening the popup
        history.back();
      });
    })

    // remove the popup when the user presses the escape key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        this.closeAndRemove();
        // Remove the state we added when opening the popup
        history.back();
      }
    });
  }

  scrollToCurrentImage() {
    const imagesContainer = this.shadowObj.querySelector('.images');
    const imageWidth = imagesContainer.offsetWidth;
    this.smoothScroll(imagesContainer, (this.index - 1) * imageWidth);
  }

  setupScrolling() {
    const imagesContainer = this.shadowObj.querySelector('.images');
    let startX;
    let scrollLeft;

    imagesContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].pageX - imagesContainer.offsetLeft;
      scrollLeft = imagesContainer.scrollLeft;
    });

    imagesContainer.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const x = e.touches[0].pageX - imagesContainer.offsetLeft;
      const walk = (x - startX) * 2;
      imagesContainer.scrollLeft = scrollLeft - walk;
    });

    imagesContainer.addEventListener('touchend', () => {
      this.snapToNearestImage(imagesContainer);
    });

    imagesContainer.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaX > 0) {
        this.scrollToNextImage(imagesContainer);
      } else if (e.deltaX < 0) {
        this.scrollToPreviousImage(imagesContainer);
      }
    });

    // Add keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        this.scrollToNextImage(imagesContainer);
      } else if (e.key === 'ArrowLeft') {
        this.scrollToPreviousImage(imagesContainer);
      }
    });
  }

  snapToNearestImage(container) {
    const imageWidth = container.offsetWidth;
    const scrollPosition = container.scrollLeft;
    const imageIndex = Math.round(scrollPosition / imageWidth);
    this.smoothScroll(container, imageIndex * imageWidth);
  }

  scrollToNextImage(container) {
    const imageWidth = container.offsetWidth;
    const currentIndex = Math.floor(container.scrollLeft / imageWidth);
    if (currentIndex < this.imagesLength - 1) {
      this.smoothScroll(container, (currentIndex + 1) * imageWidth);
    }
  }

  scrollToPreviousImage(container) {
    const imageWidth = container.offsetWidth;
    const currentIndex = Math.ceil(container.scrollLeft / imageWidth);
    if (currentIndex > 0) {
      this.smoothScroll(container, (currentIndex - 1) * imageWidth);
    }
  }

  smoothScroll(container, target) {
    this.isScrolling = true;
    this.targetScrollLeft = target;
    
    const startScrollLeft = container.scrollLeft;
    const distance = this.targetScrollLeft - startScrollLeft;
    const duration = 300; // milliseconds
    let startTime = null;

    const animation = (currentTime) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = this.easeInOutQuad(timeElapsed, startScrollLeft, distance, duration);
      container.scrollLeft = run;
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        container.scrollLeft = this.targetScrollLeft;
        this.isScrolling = false;
        this.index = Math.round(this.targetScrollLeft / container.offsetWidth) + 1;
      }
    };

    requestAnimationFrame(animation);
  }

  easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
  }

  parseToNumber = num_str => {
    // Try parsing the string to an integer
    const num = parseInt(num_str);

    // Check if parsing was successful
    if (!isNaN(num)) {
      return num;
    } else {
      return 0;
    }
  }

  addImageLoadListeners() {
    const images = this.shadowObj.querySelectorAll('img');
    images.forEach(img => {
      img.addEventListener('load', () => {
				// remove loader and blur(.loading) class)
				img.parentElement.classList.remove('loading');
				const loader = img.parentElement.querySelector('#btn-loader');
				if(loader) { loader.remove(); }
      });
      img.addEventListener('error', () => {
        img.parentElement.classList.add('error');
      });
    });
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
    const imagesArrayStr = this.getAttribute("images");
		const images = imagesArrayStr.split(",");
    return /*html*/`
      <div class="overlay"></div>
      <section id="content" class="content">
        <span class="control cancel-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
          </svg>
        </span>
        <div class="images">
          ${this.getBody(images)}
        </div>
      </section>
      ${this.getStyles()}
    `
  }

  getBody = images => {
    return images.map(image => {
      return /* html */`
        <div class="image-container loading">
          <img src="${image}" alt="Post Image" loading="lazy" draggable="false">
          ${this.getButtonLoader()}
        </div>
      `;
    }).join("");
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
          padding: 20px;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: start;
          gap: 10px;
          width: 700px;
          height: 90%;
          min-height: 400px;
          max-height: 90%;
          height: max-content;
          border-radius: 15px;
          position: relative;
          overflow-y: auto;
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
          width: 35px;
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

        span.control {
          background: var(--gray-background);
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          z-index: 10;
          justify-content: center;
          position: absolute;
          top: 10px;
          right: 10px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }

        span.control svg {
          width: 20px;
          height: 20px;
          color: var(--text-color);
        }

        span.control svg:hover{
          color: var(--error-color);
        }

        div.images {
					width: max-content;
					margin: 0;
          min-width: 100%;
          width: 100%;
          height: 100%;
          max-height: 100%;
					gap: 0;
					position: relative;
					justify-content: start;
					align-items: center;
					margin: 0;
          display: flex;
          overflow-x: scroll;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        div.images::-webkit-scrollbar {
          display: none !important;
          visibility: hidden;
        }
				
				.image-container {
          flex: 0 0 100%;
          scroll-snap-align: start;
					position: relative;
					display: flex;
					justify-content: center;
					align-items: center;
					position: relative;
					overflow: hidden;
					max-height: 100%;
					min-width: 100%;
          max-width: 100%;
          min-height: 100%;
				}

				.image-container.loading img {
					filter: blur(8px);
				}

				.image-container.error {
					border: var(--input-border-error);
				}

				.image-container > img {
					height: auto;
					width: 100%;
          max-width: 100%;
          overflow: hidden;
					object-fit: cover;
          object-position: contain;
          overflow: hidden;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
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
            gap: 0;
            z-index: 20;
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            left: 0;
          }

          #content {
            box-sizing: border-box !important;
            padding: 0;
            margin: 0;
            position: fixed;
            right: 0;
            top: 0;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 100%;
            min-width: 100%;
            max-width: 100%;
            max-height: 100%;
            min-height: 100%;
            border-radius: 0px;
          }

          #content span.control {
            cursor: default !important;
          }

          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

					a {
						cursor: default !important;
					}
        }
      </style>
    `;
  }
}