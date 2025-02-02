export default class ContactPopup extends HTMLElement {
  constructor() {

    // We are not even going to touch this.
    super();

    this._url = this.getAttribute('url');

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
    const contentContainer = this.shadowObj.querySelector('div.options');

    // Close the modal
    if (overlay && btns && contentContainer) {
      this.closePopup(overlay, btns);
      this.fetchTopics(contentContainer);
    }
  }

  fetchTopics = (contentContainer) => {
    const outerThis = this;
		const topicsLoader = this.shadowObj.querySelector('.loader-container');
    const str = this.getAttribute('contact');
    // console.log(str)
    let contact= null;
    if (str !== null || str !== '' || str !== 'null') {
      try {
        contact = JSON.parse(str);
      }
      catch (error) {
        console.log(error)
        contact = null;
      }
    }
		setTimeout(() => {
      if (contact === undefined || contact === null) {
        // display error message
        const content = outerThis.getEmpty();
        topicsLoader.remove();
        contentContainer.insertAdjacentHTML('beforeend', content);
        return;
      }
      // update the content
      const content = outerThis.getContactOptions(contact);
      // remove the loader
      topicsLoader.remove();
      // insert the content
      contentContainer.insertAdjacentHTML('beforeend', content);
		}, 2000)
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
				<div class="options">
          ${this.getLoader()}
        </div>
			</div>
    `
  }

  getContactOptions = data => {
    return /* html */`
      ${data.x ? this.getX(data.x) : ''}
      ${data.linkedin ? this.getLinkedIn(data.linkedin) : ''}
      ${data.threads ? this.getThreads(data.threads) : ''}
      ${data.email ? this.getEmail(data.email) : ''}
      ${data.website ? this.getWebsite(data.website) : ''}
      <div class="empty">
        <p class="italics">The above is only contact information shared by the user.</p>
      </div>
		`
  }

  getX = username => {
    return /*html*/`
      <a href="https://x.com/${username}" target="_blank" rel="noopener" class="link x">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-twitter-x" viewBox="0 0 16 16">
            <path  d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
          </svg>
        </span>
        <span class="text">X(Twitter)</span>
      </a>
    `
  }

  getLinkedIn = username => {
    return /*html*/`
      <a href="https://linkedin.com/in/${username}" target="_blank" rel="noopener" class="link linkedin">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-linkedin" viewBox="0 0 16 16">
            <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
          </svg>
        </span>
        <span class="text">LinkedIn</span>
      </a>
    `
  }

  getThreads = username => {
    return /*html*/`
      <a href="https://threads.net/@${username}" target="_blank" rel="noopener" class="link threads">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-threads" viewBox="0 0 16 16">
            <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161"/>
          </svg>
        </span>
        <span class="text">Threads</span>
      </a>
    `
  }

  getEmail = email => {
    return /*html*/`
      <a href="mailto:${email}" class="link email">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-paper" viewBox="0 0 16 16">
            <path d="M4 0a2 2 0 0 0-2 2v1.133l-.941.502A2 2 0 0 0 0 5.4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5.4a2 2 0 0 0-1.059-1.765L14 3.133V2a2 2 0 0 0-2-2zm10 4.267.47.25A1 1 0 0 1 15 5.4v.817l-1 .6zm-1 3.15-3.75 2.25L8 8.917l-1.25.75L3 7.417V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1zm-11-.6-1-.6V5.4a1 1 0 0 1 .53-.882L2 4.267zm13 .566v5.734l-4.778-2.867zm-.035 6.88A1 1 0 0 1 14 15H2a1 1 0 0 1-.965-.738L8 10.083zM1 13.116V7.383l4.778 2.867L1 13.117Z" />
          </svg>
        </span>
        <span class="text">Email</span>
      </a>
    `
  }

  getWebsite = website => {
    return /*html*/`
      <a href="${website}" target="_blank" rel="noopener" class="link website">
        <span class="icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-link-45deg" viewBox="0 0 16 16">
            <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"/>
            <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"/>
          </svg>
        </span>
        <span class="text">Website</span>
      </a>
    `
  }

  getEmpty = () => {
    return /* html */`
      <div class="empty">
        <p>This user hasn't publicly shared any contact information. Note that this information is only available if the user chose to share it publicly.</p>
        <p class="italics">You can still interact with the user via public information on their profile.</p>
      </div>
    `
  }

  getLoader() {
    return /* html */`
      <div class="loader-container">
        <span id="btn-loader">
          <span class="loader-alt"></span>
        </span>
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

        div.loader-container {
          position: relative;
          width: 100%;
          height: 150px;
          padding: 20px 0 0 0;
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

        #btn-loader > .loader-alt {
          width: 35px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #18A565 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #21D029 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        #btn-loader > .loader {
          width: 20px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        @keyframes l38 {
          100% {
            background-position: 100% 0, 100% 100%, 0 100%, 0 0
          }
        }

        #content {
          z-index: 1;
          background-color: var(--background);
          padding: 20px 10px;
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

        div.empty {
          width: 100%;
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          gap: 8px;
        }

        div.empty > p {
          width: 100%;
          text-align: center;
          padding: 0;
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1rem;
          font-weight: 400;
        }

        div.empty > p.italics {
          margin: 5px 0 0 0;
          font-style: italic;
        }
        
        .options {
          width: 100%;
          padding: 5px 0;
          display: flex;
          flex-flow: row;
          flex-wrap: wrap;
          gap: 15px;
          align-items: center;
          justify-content: center;
        }

        .options a.link {
          display: flex;
          flex-flow: row;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin: 5px 8px 0;
          padding: 5px 15px 5px 12px;
          background-color: var(--gray-background);
          border-radius: 12px;
          text-decoration: none;
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1rem;
          font-weight: 400;
        }

        .options a.link > .icon {
          width: 25px;
          height: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .options a.link.x {
          background: linear-gradient(103.53deg, #1DA1F2 -6.72%, #0A95D7 109.77%);
          color: var(--white-color);
        }

        .options a.link.facebook {
          background: linear-gradient(103.53deg, #1877F2 -6.72%, #0A5A9C 109.77%);
          color: var(--white-color);
        }

        .options a.link.linkedin {
          background: linear-gradient(103.53deg, #0077B5 -6.72%, #005684 109.77%);
          color: var(--white-color);
        }

        .options a.link.mail {
          background: linear-gradient(103.53deg, #D44638 -6.72%, #D44638 109.77%);
          color: var(--white-color);
        }

        .share-buttons > a.whatsapp {
          background: linear-gradient(103.53deg, #25D366 -6.72%, #25D366 109.77%);
        }

        .options a.link > .icon svg {
          width: 15px;
          height: 15px;
          color: inherit;
        }

        .options a.link > .text {
          display: flex;
          align-items: center;
          justify-content: center;
          color: inherit;
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

          a {
            cursor: default !important;
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
            padding: 0 15px 20px;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: center;
          }

          .welcome > h2 {
            width: 100%;
            font-size: 1.2rem;
            margin: 0 0 10px;
            padding: 10px 10px;
            background-color: var(--gray-background);
            text-align: center;
            border-radius: 12px;
          }

          .welcome > .actions {
            width: 100%;
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