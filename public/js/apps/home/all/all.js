export default class HomeAll extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.home = null;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // fetch content
    const container = this.shadowObj.querySelector('.feeds');
    this.fetchContent(container);
  }

  disconnectedCallback() {
    this.enableScroll();
    // clear window.home
    this.home = null;
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

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }
  
  fetchContent = container => {
    let intervalId;
  
    const fetchLogic = (getContentFunction) => {
      if (!this.home) return;
      
      if (this.home.last === true) {
        clearInterval(intervalId);
        return;
      }
      
      if (this.home.loaded) {
        container.insertAdjacentHTML('beforeend', getContentFunction(this.home.next));
      }

      // set loaded to false
      this.home.loaded = false;
    };
  
    intervalId = setInterval(() => fetchLogic(this.getStepContent), 500);
  };

  getStepContent = step => {
    if (step === 1) {
      return /* html */`
        <home-stories stories="recent" url="${this.getAttribute('recent-api')}"></home-stories>
      `
    } else if (step === 2) {
      return /* html */`
        <home-topics url="${this.getAttribute('topics-api')}"></home-topics>
      `
    } else if (step === 3) {
      return /* html */`
        <home-people url="${this.getAttribute('people-api')}"></home-people>
      `
    } else if (step === 4) {
      return /* html */`
        <home-feed url="${this.getAttribute('feed-api')}" page="1"></home-feed>
      `
    } else return '';
  }

  getBody = () => {
    return /* html */`
      <div class="feeds">
        <home-recent url="${this.getAttribute('trending-api')}"></home-recent>
      <div>
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
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          justify-content: space-between;
          gap: 0;
        }

        .feeds {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          width: 100%;
        }

				@media screen and (max-width:660px) {
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