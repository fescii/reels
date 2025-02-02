export default class AppThemes extends HTMLElement {
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
    document.title = 'Themes | Custumize the want the app look';
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.enableScroll();
    this.app.showNav();
    this.watchMql();
    this.activateThemeIcons();
  }

  watchMql = () => {
    this.mql.addEventListener('change', (e) => {
      this.render();
    });
  }

  activateThemeIcons = () => {
    const btns = this.shadowObj.querySelectorAll('div.themes > .themes-container > .theme > button');
    if (btns) {
      // select the other btn and remove activated class
      btns.forEach(btn => {
        btn.addEventListener('click', event => {
          event.preventDefault();
          const currentTheme = btn.getAttribute('name');
          this.setTheme(currentTheme);
  
          // select the other btn and remove activated class
          btns.forEach(btnInner => {
            btnInner.classList.remove('activated');
            btnInner.textContent = 'Activate';
          });
  
          // update 
          btn.classList.toggle('activated');
          btn.textContent = 'Activated'
        });
      });
    }
  }

  setTheme = currentTheme =>{
    // Check the current theme
    const htmlElement = document.documentElement;
    const metaThemeColor = document.querySelector("meta[name=theme-color]");

    // Check if the current theme is: system
    if (currentTheme === 'system') {
      // Get the system theme
      currentTheme = this.getSystemTheme();

      // Update the data-theme attribute
      htmlElement.setAttribute('data-theme', currentTheme);

      // Store the preference in local storage
      localStorage.setItem('theme', 'system');

      // Update the theme-color meta tag
      metaThemeColor.setAttribute("content", currentTheme === 'dark' ? '#000000' : '#ffffff');
      return;
    }
    
    // Update the data-theme attribute
    htmlElement.setAttribute('data-theme', currentTheme);
    
    // Store the preference in local storage
    localStorage.setItem('theme', currentTheme);

    // Update the theme-color meta tag
    metaThemeColor.setAttribute("content", currentTheme === 'dark' ? '#000000' : '#ffffff');
  }

  getSystemTheme = () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
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
        ${this.getThemes()}
      `;
    }
    else {
      return /* html */`
        <section class="main">
          ${this.getThemes()}
        </section>

        <section class="side">
          <trending-stories url="/h/trend" limit="10"></trending-stories>
          ${this.getInfo()}
        </section>
      `;
    }
  }

  getThemes = () =>  {
    // get theme from local storage
    const theme = localStorage.getItem('theme') || 'light';

    return /* html */`
      <div class="themes">
        <div class="top">
          <h4 class="title">Your themes</h4>
          <p class="desc">
            Choose a theme that suits your preference. You can switch between light and dark themes at any time.<br>
            <span>Note that in the near future, we will be adding more themes to choose from, and will also allow you to create or customize your own theme.</span>
          </p>
        </div>
        <div class="themes-container">
          ${this.getCurrentTheme(theme)}
        </div>
        <p class="soon">
          More themes will appear here once they are available. Stay tuned for updates and exciting announcements.
        </p>
      </div>
    `;
  }

  getCurrentTheme = data => {
    if (data === 'dark') {
      return /*html*/`
        <div class="theme">
          <h4 class="name">Light</h4>
          <p class="description">Light background, dark-colored text, improves readability.</p>
          <button class="btn" name="light">Activate</button>
        </div>
        <div class="theme">
          <h4 class="name">Dark</h4>
          <p class="description">Dark background, light-colored text, reduces eye strain.
          </p>
          <button class="btn activated" name="dark">Activated</button>
        </div>
        <div class="theme">
          <h4 class="name">System</h4>
          <p class="description">Set the app's theme based on your system settings.</p>
          <button class="btn" name="system">Activate</button>
        </div>
      `
    } else if (data === 'system') {
      return /*html*/`
        <div class="theme">
          <h4 class="name">Light</h4>
          <p class="description">Light background, dark-colored text, improves readability.</p>
          <button class="btn" name="light">Activate</button>
        </div>
        <div class="theme">
          <h4 class="name">Dark</h4>
          <p class="description">Dark background, light-colored text, reduces eye strain.</p>
          <button class="btn" name="dark">Activate</button>
        </div>
        <div class="theme">
          <h4 class="name">System</h4>
          <p class="description">Set the app's theme based on your system settings.</p>
          <button class="btn activated" name="system">Activated</button>
        </div>
      `
    }
    else {
      return /*html*/`
        <div class="theme">
          <h4 class="name">Light</h4>
          <p class="description">Light background, dark-colored text, improves readability.</p>
          <button class="btn activated" name="light">Activated</button>
        </div>
        <div class="theme">
          <h4 class="name">Dark</h4>
          <p class="description">Dark background, light-colored text, reduces eye strain.
          </p>
          <button class="btn" name="dark">Activate</button>
        </div>
        <div class="theme">
          <h4 class="name">System</h4>
          <p class="description">Set the app's theme based on your system settings.</p>
          <button class="btn" name="system">Activate</button>
        </div>
      `
    }
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

        div.themes {
          display: flex;
          flex-flow: column;
          padding: 0;
          width: 100%;
          height: max-content;
          gap: 10px;
          min-height: max-content;
          height: max-content;
        }

        div.themes > .top > h4.title {
          display: flex;
          align-items: center;
          color: var(--title-color);
          font-size: 1.3rem;
          font-weight: 500;
          margin: 0;
          padding: 0;
        }

        div.themes > .top > .desc {
          margin: 0;
          padding: 10px 0 0;
          color: var(--text-color);
          line-height: 1.2;
          font-size: 1rem;
          font-family: var(--font-main), sans-serif;
        }

        div.themes > .top > .desc > span {
          display: inline-block;
          margin: 10px 0 5px;
          color: var(--gray-color);
          font-size: 0.85rem;
          font-style: italic;
          font-family: var(--font-read), sans-serif;
        }

        div.themes > .themes-container {
          display: flex;
          color: var(--text-color);
          padding: 0;
          gap: 20px;
          width: 100%;
          min-height: max-content;
          height: 100%;
        }

        div.themes > .themes-container > .theme {
          display: flex;
          flex-flow:column;
          justify-content: space-between;
          color: var(--text-color);
          padding: 0;
          gap: 5px;
          width: 100%;
          height: 100%;
        }

        div.themes > .themes-container > .theme h4.name {
          margin: 0;
          font-weight: 600;
          font-size: 1.15rem;
          color: var(--title-color);
        }

        div.themes > .themes-container > .theme p.description {
          margin: 0 0 5px;
          font-size: 0.95rem;
          color: var(--gray-color);
        }

        div.themes > .themes-container > .theme button {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px 15px 5px;
          height: max-content;
          width: max-content;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
          background: var(--accent-linear);
          color: var(--white-color);
          font-weight: 500;
          font-size: 0.9rem;
          line-height: 1.3;
          font-weight: 500;
          font-family: var(--font-text), sans-serif;
          cursor: pointer;
          outline: none;
          border: none;
          text-transform: capitalize;
        }

        div.themes > .themes-container > .theme button.activated {
          background: none;
          padding: 4px 10px 5px;
          color: var(--highlight-color);
          background-color: var(--gray-background);
        }

        div.themes p.soon {
          margin: 5px 0;
          padding: 10px 0;
          color: var(--gray-color);
          font-size: 0.85rem;
          font-style: italic;
          font-family: var(--font-read), sans-serif;
          border-top: var(--border);
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

        div.themes > .themes-container {
          flex-flow: column;
          gap: 0;
        }

        div.themes > .themes-container > .theme {
          display: flex;
          flex-flow:column;
          color: var(--text-color);
          margin: 0 0 5px;
          padding: 10px 0;
          gap: 5px;
          width: 100%;
          min-height: max-content;
          height: 100%;
          border-top: var(--border);
        }

        div.themes > .themes-container > .theme:last-of-type {
          margin: 0;
          padding: 10px 0 0;
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

          ul.tabs > li.tab,
          form.search > .contents > button,
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