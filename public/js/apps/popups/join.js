export default class JoinPopup extends HTMLElement {
  constructor() {

    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({mode: 'open'});

    this.render();

  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    
    this.disableScroll();

    // Const body element
    const body = document.querySelector('body');

    // Handle action click
    this.handleActionClick(body);

    // Select the close button & overlay
    const overlay = this.shadowObj.querySelector('div.overlay');

    // Close the modal
    if (overlay) {
      this.closePopup(overlay);
    }
  }

  // Open user profile
  handleActionClick = (body) => {
    const outerThis = this;
    // get a.meta.link
    const actions = this.shadowObj.querySelectorAll('.actions > a.action');

    if(body && actions) { 
      actions.forEach(content => {
        content.addEventListener('click', event => {
          event.preventDefault();

          // get join
          const join = outerThis.getJoin(content.dataset.name);

          // get url
          let url = content.dataset.name === 'login' ? outerThis.getAttribute('login') : outerThis.getAttribute('register');

          if (content.dataset.name === 'forgot') {
            url = '/join/recover';   
          }
          
          // replace and push states
          outerThis.replaceAndPushStates(url, body, join);

          body.innerHTML = join;
        })
      })
    }
  }

  replaceAndPushStates = (url, body, join) => {
     // get the first custom element in the body
     const firstElement = body.firstElementChild;

     // convert the custom element to a string
     const elementString = firstElement.outerHTML;

    // get window location
    const pageUrl = window.location.href;
    window.history.replaceState(
      { page: 'page', content: elementString },
      url, pageUrl
    );

    // Updating History State
    window.history.pushState(
      { page: 'page', content: join},
      url, url
    );
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
    window.onscroll = function() {
      window.scrollTo(scrollLeft, scrollTop);
    };
  }

  enableScroll() {
    document.body.classList.remove("stop-scrolling");
    window.onscroll = function() {};
  }

  // close the modal
  closePopup = overlay => {
    overlay.addEventListener('click', e => {
      e.preventDefault();
      this.remove();
    });
  }

  getTemplate() {
    // Show HTML Here
    return /*html*/`
      <div class="overlay"></div>
      <section id="content" class="content">
        ${this.getWelcome()}
      </section>
    ${this.getStyles()}`
  }

  getWelcome() {
    return /*html*/`
      <div class="welcome">
				<p>Please note that you need to be logged in order to perform certain actions on this platform.</p>
        <p>Although you can still view content, you will not be able to interact with it.</p>
        <div class="actions">
          <a data-name="login" href="${this.getAttribute('login')}?next=${this.getAttribute('next')}" class="login action">Login</a>
          <a data-name="register" href="${this.getAttribute('register')}?next=${this.getAttribute('next')}" class="register action">Register</a>
          <a data-name="forgot" href="/join/recover?next=${this.getAttribute('next')}" class="recover action">Recover</a>
        </div>
			</div>
    `
  }

  getJoin = action => {
   return /* html */`
    <app-logon name="${action}" next="${this.getAttribute('next')}" api-login="/a/login" 
      api-register="/a/register" api-check-email="/a/check-email" 
      api-forgot-password="/a/forgot-password" api-verify-token="/a/verify-token" 
      api-reset-password="/a/reset-password" join-url="/join" login="/join/login" 
      register="/join/register" forgot="/join/recover">
    </app-logon>
   `
  }

  getStyles() {
    return /*css*/`
      <style>
        * {
          box-sizing: border-box !important;
        }

        :host{
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
          padding: 15px 10px 15px;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 0;
          width: 700px;
          max-height: 90%;
          height: max-content;
          border-radius: 25px;
          position: relative;
        }

        .welcome {
          width: 98%;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          row-gap: 0;
        }

        .welcome > h2 {
          width: 100%;
          font-size: 1.35rem;
          font-weight: 600;
          margin: 0 0 10px;
          padding: 10px 10px;
          background-color: var(--gray-background);
          text-align: center;
          border-radius: 12px;
          font-family: var(--font-read), sans-serif;
          color: var(--text-color);
          font-weight: 500;
          position: relative;
        }

        .welcome > h2 > span.control {
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

        .welcome > h2 > span.control svg {
          width: 20px;
          height: 20px;
          color: var(--text-color);
        }

        .welcome > h2 > span.control svg:hover{
          color: var(--error-color);
        }

        .welcome  p {
          width: 100%;
          margin: 0;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
          line-height: 1.5;
          font-size: 1rem;
        }

        .welcome > .actions {
          margin: 10px 0 5px;
          width: 100%;
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: start;
          gap: 30px;
        }

        .welcome > .actions a {
          text-decoration: none;
          background: none;
          border: var(--action-border);
          text-decoration: none;
          padding: 6px 12px 6px;
          font-size: 1rem;
          cursor: pointer;
          margin: 0;
          width: max-content;
          justify-self: center;
          text-align: center;
          color: var(--text-color);
          font-weight: 500;
          border-radius: 12px;
        }

        .welcome > .actions a.login {
          padding: 7.5px 15px 7.5px;
          border: none;
          background: var(--gray-background);
          color: var(--text-color);
        }

        @media screen and ( max-width: 850px ){
          #content {
            width: 90%;
          }
        }
        @media screen and ( max-width: 600px ){
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
            padding: 15px 0 10px;
            margin: 0;
            width: 100%;
            max-width: 100%;
            max-height: 90%;
            min-height: max-content;
            border-radius: 0px;
            border-top: var(--border);
            border-top-right-radius: 10px;
            border-top-left-radius: 10px;
          }

          .welcome {
            width: 100%;
            gap: 5px;
            padding: 0 10px;
          }

          .welcome > h2 {
            margin: 0 0 10px;
          }

          .welcome > .actions {
            margin: 9px 0 17px;
            width: 100%;
            display: flex;
            flex-flow: row;
            align-items: center;
            justify-content: start;
            gap: 30px;
          }

          .welcome > .actions a {
            margin: 0;
          }

          .welcome > h2 > span.control,
          .welcome > .actions > .action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}