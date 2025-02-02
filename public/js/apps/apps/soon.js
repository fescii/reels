export default class AppSoon extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.app = window.app;
    this.api = this.app.api;
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.mql = window.matchMedia('(max-width: 660px)');
    this.setTitle();
    this.render();
  }

  setTitle = () => {
    // update title of the document
    document.title = 'Soon | This feature is coming soon';
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.enableScroll();
    this.app.showNav();
    this.watchMql();
  }

  watchMql = () => {
    this.mql.addEventListener('change', (e) => {
      this.render();
    });
  }

  disconnectedCallback() {
    this.enableScroll()
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

  getBody = () => {
    const mql = window.matchMedia('(max-width: 660px)');
    if (mql.matches) {
      return /* html */`
        ${this.getSoon()}
      `;
    }
    else {
      return /* html */`
        <section class="main">
          ${this.getSoon()}
        </section>

        <section class="side">
          <trending-stories url="/h/trend" limit="10"></trending-stories>
          ${this.getInfo()}
        </section>
      `;
    }
  }

  getSoon = () =>  {
    return /* html */`
      <div class="soon">
      <div class="top">
        <h4 class="title">Coming Soon!</h4>
        <p class="desc">
        This feature is currently under development and will be available soon. Stay tuned for updates!
        </p>
      </div>
      <div class="donate">
        <h4 class="title">Support Us</h4>
        <p class="desc">
        If you like our work and would like to support us, you can donate to help us keep the lights on. We appreciate your support.
        </p>
        <a href="https://buymeacoffee.com/femar" target="_blank" rel="noopener">Donate</a>
      </div>
      </div>
    `;
  }

  getInfo = () => {
    return /*html*/`
      <info-container docs="/about/docs" new="/about/new"
       feedback="/about/feedback" request="/about/request" code="/about/code" donate="/about/donate" contact="/about/contact" company="https://github.com/aduki-hub">
      </info-container>
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
          padding: 0;
          margin: 0;
          display: flex;
          justify-content: space-between;
          gap: 30px;
        }

        section.main {
          display: flex;
          flex-flow: column;
          align-items: start;
          gap: 0;
          padding: 20px 0;
          width: calc(55% - 10px);
          min-height: 100vh;
        }

        /* soon */
        div.soon {
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          height: 70vh;
        }

        div.soon .top {
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        div.soon .top .title {
          font-size: 1.35rem;
          font-weight: 500;
          text-align: center;
          font-family: var(--font-text), sans-serif;
          color: var(--text-color);
        }

        div.soon .top .desc {
          font-size: 1rem;
          text-align: center;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          line-height: 1.4;
        }

        div.soon .donate {
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        div.soon .donate .title {
          font-size: 1.35rem;
          font-weight: 500;
          text-align: center;
          font-family: var(--font-text), sans-serif;
          color: var(--text-color);
        }

        div.soon .donate .desc {
          font-size: 0.9rem;
          text-align: center;
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          line-height: 1.4;
        }

        div.soon .donate a {
          font-size: 1rem;
          text-decoration: none;
          padding: 6px 25px;
          width: max-content;
          border-radius: 10px;
          background: var(--accent-linear);
          color: var(--white-color);
        }
        
        section.side {
          padding: 25px 0;
          width: calc(45% - 10px);
          display: flex;
          flex-flow: column;
          gap: 20px;
          position: sticky;
          top: 0;
          height: 100vh;
          max-height: 100vh;
          overflow-y: scroll;
          scrollbar-width: none;
        }

        section.side::-webkit-scrollbar {
          visibility: hidden;
          display: none;
        }


				@media screen and (max-width:660px) {
					:host {
            font-size: 16px;
						padding: 20px 10px;
            margin: 0;
            display: flex;
            flex-flow: column;
            justify-content: space-between;
            gap: 0;
					}

					::-webkit-scrollbar {
						-webkit-appearance: none;
					}
,
          button,
					a {
						cursor: default !important;
          }

          div.themes > .themes-container > .theme button,
          svg {
            cursor: default !important;
          }

          .section.main {
            display: flex;
            flex-flow: column;
            gap: 0;
            width: 100%;
          }

          div.content-container {
            padding: 0 10px 35px;
          }

          section.side {
            padding: 0;
            display: none;
            width: 100%;
          }
				}
	    </style>
    `;
  }
}