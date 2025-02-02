export default class NotifyPopup extends HTMLElement {
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

    // Select the close button & overlay
    const overlay = this.shadowObj.querySelector('.overlay');
    const btns = this.shadowObj.querySelectorAll('.cancel-btn');

    const notifyBtn = this.shadowObj.querySelector('.notify-btn');

    // Close the modal
    if (overlay && btns) {
      this.closePopup(overlay, btns);
    }

    // Request notification permission
    if (notifyBtn) {
      this.requestNotificationPermission(notifyBtn);
    }
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

  requestNotificationPermission = async btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      // Request permission
      if(window.notify && !window.notify.permission) {
        await window.notify.requestPermission();
      }
      // Close the modal
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
        <h2 class="pop-title">
          <span class="control cancel-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path>
            </svg>
          </span>
          <span class="text">Notification</span>
        </h2>
				<p>
          We would like to send you notifications about new updates and features on this platform.
          You can choose to cancel this action if you don't want to receive notifications.
        </p>
        <div class="actions">
          <span class="cancel-btn action">Cancel</span>
          <span blank="true" class="notify-btn action">Allow</span>
        </div>
			</div>
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
          padding: 20px 10px 20px;
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
          align-items: start;
          justify-content: center;
          row-gap: 0;
        }

        .welcome > h2 {
          width: 100%;
          font-size: 1.5rem;
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
          margin: 10px 0 10px;
          text-align: start;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
          line-height: 1.3;
          font-size: 1rem;
        }

        .welcome p span.url {
          display: inline-block;
          padding: 2px 8px 3px;
          margin: 0 5px;
          width: max-content;
          font-size: 0.8rem;
          font-weight: 400;
          border-radius: 5px;
          background-color: var(--gray-background);
          font-family: var(--font-mono), monospace;
          color: var(--gray-color);
          font-weight: 500;
          border-radius: 5px;
        }

        .welcome > .actions {
          display: flex;
          font-family: var(--font-main), sans-serif;
          width: 100%;
          flex-flow: row;
          align-items: center;
          gap: 20px;
          margin: 10px 0 0;
        }
        
        .welcome > .actions > .action {
          background: var(--accent-linear);
          text-decoration: none;
          color: var(--white-color);
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          width: max-content;
          flex-flow: row;
          align-items: center;
          text-transform: lowercase;
          justify-content: center;
          padding: 4px 15px 5px;
          border-radius: 10px;
          -webkit-border-radius: 10px;
          -moz-border-radius: 10px;
        }

        .welcome > .actions .action.cancel-btn {
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
            padding: 10px 0 10px;
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

          .welcome {
            width: 100%;
            padding: 0 15px;
          }

          .welcome > h2 {
            width: 100%;
            font-size: 1.35rem;
            font-weight: 600;
            margin: 0 0 10px;
            padding: 10px 10px;
            background-color: var(--gray-background);
            border-radius: 12px;
            color: var(--text-color);
            font-weight: 500;
          }

          .welcome  p {
            margin: 4px 0 0;
            color: var(--text-color);
            line-height: 1.3;
            font-size: 1rem;
          }

          .welcome > .actions {
            margin: 18px 0;
            width: 100%;
            gap: 35px;
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