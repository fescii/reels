export default class UrlPopup extends HTMLElement {
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

    // Close the modal
    if (overlay && btns) {
      this.closePopup(overlay, btns);
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

  getTemplate() {
    // Show HTML Here
    return `
      <div class="overlay"></div>
      <section id="content" class="content">
        ${this.getWelcome()}
      </section>
    ${this.getStyles()}`
  }

  getWelcome() {
    const url = this.getAttribute('url');
    let max = url.length > 50 ? url.substring(0, 50) + '...' : url;
    return /*html*/`
      <div class="welcome">
				<p>You are about to leave the application and visit an external website.</p> 
        <p> We are not responsible for the content of the external website, click continue to visit below address.</p>
        <span class="url">${max}</span>
        <div class="actions">
          <button class="action cancel-btn">Cancel</button>
          <a noopenner="true" blank="true" target="_blank" href="${url}" class="action">Continue</a>
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
          align-items: center;
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
          font-family: var(--font-main), sans-serif;
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
          margin: 10px 0 0;
          width: 100%;
          text-align: center;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
          line-height: 1.4;
          font-size: 1rem;
        }

        .welcome span.url {
          display: flex;
          width: 100%;
          padding: 0;
          text-align: center;
          align-items: center;
          justify-content: center;
          margin: 10px 0 5px;
          font-family: var(--font-read), sans-serif;
          font-size: 0.9rem;
          font-weight: 400;
          border-radius: 5px;
          color: var(--gray-color);
        }

        .welcome > .actions {
          display: flex;
          font-family: var(--font-main), sans-serif;
          width: 100%;
          flex-flow: row;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin: 10px 0 0;
        }
        
        .welcome > .actions > .action {
          border: none;
          background: var(--gray-background);
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          flex-flow: row;
          align-items: center;
          text-transform: capitalize;
          justify-content: center;
          padding: 7px 15px 7px;
          min-width: 100px;
          width: 100px;
          position: relative;
          border-radius: 12px;
          -webkit-border-radius: 12px;
          -moz-border-radius: 12px;
        }

        .welcome > .actions > .action.cancel-btn {
          border: var(--action-border);
          background: none;
          background-color: none;
          color: var(--text-color);
          padding: 6px 15px 6px;
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
            padding: 10px 0 5px;
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
            padding: 5px 15px;
          }

          .welcome  p {
            margin: 5px 0 0;
            font-family: var(--font-main), sans-serif;
            color: var(--text-color);
            line-height: 1.4;
            font-size: 1rem;
          }

          .welcome > .actions {
            margin: 15px 0;
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