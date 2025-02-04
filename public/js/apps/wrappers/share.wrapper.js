export default class ShareWrapper extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.app = window.app;
    this.parent = this.getRootNode().host;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  convertToBoolean = text => text === 'true';

  connectedCallback() {
    // Copy link
    this.copyLink();

    // Watch for media query changes
    const mql = window.matchMedia('(max-width: 660px)');
    this.openShare(mql.matches);
    this.editContent();
  }

  editContent = () => {
    const share = this.shadowObj.querySelector('.share.overlay');
    const edit = this.shadowObj.querySelector('.option.edit');
    if(!edit) return;

    edit.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      if(share) share.classList.remove('active');
      this.parent.edit();
    });
  }

  // fn to open the share overlay
  openShare = mql => {
    // Get share button
    const shareButton = this.shadowObj.querySelector('div.host');

    // Check if the overlay exists
    if (shareButton) {
      // Get overlay
      const overlay = shareButton.querySelector('.share.overlay');
      const content = shareButton.querySelector('.share > .content');
      const close = shareButton.querySelector('span.close')
      // Add event listener to the share button
      shareButton.addEventListener('click', e => {
        // prevent the default action
        // e.preventDefault()

        // prevent the propagation of the event
        e.stopPropagation();

        // Toggle the overlay
        overlay.classList.add('active');
        // disable scroll

        if (mql) {
          this.disableScroll();
        }

        if (!mql) {
          // add event to run once when the overlay is active: when user click outside the overlay
          document.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
  
            // Check if the target is not the overlay
            if (!content.contains(e.target)) {
              // Remove the active class
              overlay.classList.remove('active');
              this.enableScroll();
            }
          }, { once: true });
        }
        else {
          // add event to run once when the overlay is active: when user click outside the overlay
          close.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
  
            overlay.classList.remove('active');
            this.enableScroll();
          }, { once: true });
        }
      });
    }
  }

  // Handle copy link
  copyLink = () => {
    // Select the copy span: .share-buttons > span.copy
    const copyLink = this.shadowObj.querySelector('.share-buttons > span.copy');

    if (copyLink) {
      copyLink.addEventListener('click', () => {
        // Get the url to copy
        const url = copyLink.getAttribute('url');

        // Copy the url to the clipboard
        this.copyToClipboard(url);
        
        // Show a toast message
        this.app.showToast(true, 'Link copied to clipboard');
      });
    }
  }

  // Perform the copy action using the Clipboard API if failed show a toast message
  copyToClipboard = text => {
    // Use the Clipboard API to copy the url
    navigator.clipboard.writeText(text).then(() => {
      // Show a toast message
      this.app.showToast(true, 'Link copied to clipboard');
    }).catch(() => {
      // Show a toast message
      this.app.showToast(false, 'Failed to copy link to clipboard');
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
    // Show HTML Here
    return `
      ${this.getContent()}
      ${this.getStyles()}
    `;
  }

  getContent = () => {
    return /* html */`
      <div class="host">
        <span class="icon">
          <span class="sp">•</span>
          <span class="sp">•</span>
        </span>
        <div class="share overlay">
          <span class="close"></span>
          <div class="content">
            <span class="pointer"></span>
            ${this.getEditContent(this.convertToBoolean(this.getAttribute('you')))}
            <p class="title">Share on</p>
            ${this.getShareOptions()}
          </div>
        </div>
      </div>
		`
  }

  getEditContent = you => {
    if(!you) return '';

    return /* html */`
      <span class="option edit">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.00016 1.83337C3.3755 1.83337 1.8335 3.37537 1.8335 8.00004C1.8335 12.6247 3.3755 14.1667 8.00016 14.1667C12.6248 14.1667 14.1668 12.6247 14.1668 8.00004" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
          <path fill-rule="evenodd" clip-rule="evenodd" d="M13.0189 2.86915V2.86915C12.3569 2.28315 11.3456 2.34449 10.7596 3.00649C10.7596 3.00649 7.84694 6.29649 6.83694 7.43849C5.8256 8.57982 6.56694 10.1565 6.56694 10.1565C6.56694 10.1565 8.23627 10.6852 9.23227 9.55982C10.2289 8.43449 13.1563 5.12849 13.1563 5.12849C13.7423 4.46649 13.6803 3.45515 13.0189 2.86915Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10.0061 3.86719L12.4028 5.98919" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text">Edit</span>
      </span>
    `;
  }

  getShareOptions = () => {
    // Get summary text of the post
    const summary = this.getAttribute('summary');
    const url = this.getAttribute('url');

    return /* html */`
      <div class="share-buttons" >
        <a class="x"
          href="https://twitter.com/intent/tweet?text=${summary}&url=${url}"
          target="_blank" rel="noopener" title="Share on Twitter">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-twitter-x" viewBox="0 0 16 16">
            <path  d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
          </svg>
        </a>
        <a class="facebook" href="https://www.facebook.com/sharer/sharer.php?u=${url}"
          target="_blank" rel="noopener" title="Share on Facebook">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-facebook" viewBox="0 0 16 16">
            <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
          </svg>
        </a>
        <a class="linkedin" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}"
          target="_blank" rel="noopener" title="Share on LinkedIn">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-linkedin" viewBox="0 0 16 16">
            <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z" />
          </svg>
        </a>
        <a class="whatsapp"
          href="https://wa.me/?text=${url}"
          target="_blank" rel="noopener" title="Share on WhatsApp">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-whatsapp" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
          </svg>
        </a>
        <a class="mail"
          href="mailto:?subject=Check out this awesome story&body=${summary}.. : ${url}"
          target="_blank" rel="noopener" title="Share via Email">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-envelope-paper" viewBox="0 0 16 16">
            <path d="M4 0a2 2 0 0 0-2 2v1.133l-.941.502A2 2 0 0 0 0 5.4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5.4a2 2 0 0 0-1.059-1.765L14 3.133V2a2 2 0 0 0-2-2zm10 4.267.47.25A1 1 0 0 1 15 5.4v.817l-1 .6zm-1 3.15-3.75 2.25L8 8.917l-1.25.75L3 7.417V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1zm-11-.6-1-.6V5.4a1 1 0 0 1 .53-.882L2 4.267zm13 .566v5.734l-4.778-2.867zm-.035 6.88A1 1 0 0 1 14 15H2a1 1 0 0 1-.965-.738L8 10.083zM1 13.116V7.383l4.778 2.867L1 13.117Z" />
          </svg>
        </a>
        <a class="reddit" href="https://reddit.com/submit?url=${url}&title=${summary}"
        target="_blank" rel="noopener" title="Share on Reddit">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-reddit" viewBox="0 0 16 16">
            <path d="M6.167 8a.83.83 0 0 0-.83.83c0 .459.372.84.83.831a.831.831 0 0 0 0-1.661m1.843 3.647c.315 0 1.403-.038 1.976-.611a.23.23 0 0 0 0-.306.213.213 0 0 0-.306 0c-.353.363-1.126.487-1.67.487-.545 0-1.308-.124-1.671-.487a.213.213 0 0 0-.306 0 .213.213 0 0 0 0 .306c.564.563 1.652.61 1.977.61zm.992-2.807c0 .458.373.83.831.83s.83-.381.83-.83a.831.831 0 0 0-1.66 0z" />
           <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.828-1.165c-.315 0-.602.124-.812.325-.801-.573-1.9-.945-3.121-.993l.534-2.501 1.738.372a.83.83 0 1 0 .83-.869.83.83 0 0 0-.744.468l-1.938-.41a.2.2 0 0 0-.153.028.2.2 0 0 0-.086.134l-.592 2.788c-1.24.038-2.358.41-3.17.992-.21-.2-.496-.324-.81-.324a1.163 1.163 0 0 0-.478 2.224q-.03.17-.029.353c0 1.795 2.091 3.256 4.669 3.256s4.668-1.451 4.668-3.256c0-.114-.01-.238-.029-.353.401-.181.688-.592.688-1.069 0-.65-.525-1.165-1.165-1.165" />
          </svg>
        </a>
        <a class="telegram" href="https://t.me/share/url?url=${url}&text=${summary}"
          target="_blank" rel="noopener" title="Share on Telegram">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-telegram" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8.287 5.906q-1.168.486-4.666 2.01-.567.225-.595.442c-.03.243.275.339.69.47l.175.055c.408.133.958.288 1.243.294q.39.01.868-.32 3.269-2.206 3.374-2.23c.05-.012.12-.026.166.016s.042.12.037.141c-.03.129-1.227 1.241-1.846 1.817-.193.18-.33.307-.358.336a8 8 0 0 1-.188.186c-.38.366-.664.64.015 1.088.327.216.589.393.85.571.284.194.568.387.936.629q.14.092.27.187c.331.236.63.448.997.414.214-.02.435-.22.547-.82.265-1.417.786-4.486.906-5.751a1.4 1.4 0 0 0-.013-.315.34.34 0 0 0-.114-.217.53.53 0 0 0-.31-.093c-.3.005-.763.166-2.984 1.09" />
          </svg>
        </a>
        <span class="copy" class="copy-link" url="${url}" title="Copy link">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z" />
          </svg>
        </span>
      </div >
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
          padding: 0;
          margin: 0;
        }

        a {
          text-decoration: none;
        }

        .host {
          position: relative;
          min-height: 35px;
          height: 30px;
          width: max-content;
          position: relative;
          padding: 5px 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 1rem;
          font-weight: 400;
          color: var(--action-color);
          color: var(--gray-color);
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          -ms-border-radius: 50px;
          -o-border-radius: 50px;
        }

        .host:hover {
          background: var(--hover-background);
        }

        span.icon {
          padding: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          width: max-content;
          gap: 0;
          overflow-x: scroll;
          scrollbar-width: none;
          -webkit-scrollbar-width: none;
        }

        span.icon > span.sp {
          font-size: 1.2rem;
        }

        span.pointer {
          position: absolute;
          top: -6px;
          left: calc(50% - 6px);
          width: 12px;
          rotate: 45deg;
          height: 12px;
          cursor: pointer;
          z-index: 1;
          background: var(--background);
          border-left: var(--border);
          border-top: var(--border);
          border-radius: 3px;
        }

        .share {
          display: none;
          position: absolute;
          top: 35px;
          z-index: 4;
          left: calc(50% - 100px);
          padding: 0;
          border: var(--border-button);
          background: var(--background);
          box-shadow: var(--card-box-shadow);
          width: 200px;
          max-width: 200px;
          height: max-content;
          border-radius: 12px;
        }

        .content {
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 5px 12px 15px 12px;
        }

        .share.active {
          display: flex;
        }

        .content > .option.edit {
          margin: 5px 0 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 10px;
          width: 100%;
          color: var(--text-color);
          background: var(--gray-background);
          border-radius: 12px;
        }

        .content > .option.edit > svg  {
          height: 18px;
          width: 18px;
        }

        .content > .option.edit > span.text {
          font-size: 1rem;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
          color: var(--text-color);
        }

        .title {
          border-top: var(--border);
          border-bottom: var(--border);
          color: var(--text-color);
          width: 100%;
          font-size: 1rem;
          font-weight: 600;
          margin: 7px 0; 
          padding: 5px 0;
          text-align: center;
          border-radius: 0;
          font-family: var(--font-text), sans-serif;
          color: var(--text-color);
          font-weight: 500;
        }

        .share-buttons {
          padding: 0;
          width: 100%;
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .share-buttons > span.copy,
        .share-buttons > a {
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          height: 30px;
          width: 30px;
          min-height: 30px;
          min-width: 30px;
          max-height: 30px;
          max-width: 30px;
          padding: 2px;
          margin: 3px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          background: var(--accent-linear);
          color: var(--white-color);
          font-size: 0.9rem;
          font-weight: 500;
          text-transform: capitalize;
        }

        .share-buttons > a.x {
          background: linear-gradient(103.53deg, #1DA1F2 -6.72%, #0A95D7 109.77%);
        }

        .share-buttons > a.facebook {
          background: linear-gradient(103.53deg, #1877F2 -6.72%, #0A5A9C 109.77%);
        }

        .share-buttons > a.linkedin {
          background: linear-gradient(103.53deg, #0077B5 -6.72%, #005684 109.77%);;
        }

        .share-buttons > a.mail {
          background: linear-gradient(103.53deg, #D44638 -6.72%, #D44638 109.77%);
        }

        .share-buttons > a.reddit {
          background: linear-gradient(103.53deg, #FF4500 -6.72%, #FF4500 109.77%);
        }

        .share-buttons > a.telegram {
          background: linear-gradient(103.53deg, #0088CC -6.72%, #0088CC 109.77%);
        }

        .share-buttons > a.whatsapp {
          background: linear-gradient(103.53deg, #25D366 -6.72%, #25D366 109.77%);
        }

        .share-buttons > span.copy > svg,
        .share-buttons > a > svg {
          height: 15px;
          width: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .share-buttons > a.facebook > svg {
          height: 17px;
          width: 17px;
        }

        .share-buttons > a.reddit > svg {
          height: 18px;
          width: 18px;
        }

        .share-buttons > a.telegram > svg {
          height: 18px;
          width: 18px;
        }

        @media screen and (max-width: 660px) {
          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          .host {
            margin: 0;
          }

          .share {
            position: fixed;
            z-index: 80;
            background: transparent;
            background: var(--modal-overlay);
            padding: 0;
            margin: 0;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            min-height: 100dvh;
            min-width: 100dvw;
            height: 100%;
            width: 100%;
            border-radius: 0;
            border: none;
            transition: all 300ms ease-in-out;
          }

          a,
          span.pointer,
          .host,
          .share-buttons > span.copy {
            cursor: default !important;
          }

          .host:hover {
            background: transparent;
          }
  
          .overlay span.close {
            display: flex;
            position: absolute;
            background: var(--modal-overlay);
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
          }

          .share .content {
            display: flex;
            align-items: center;
            justify-content: space-around;
            z-index: 1;
            gap: 0;
            box-shadow: var(--card-box-shadow);
            width: 100%;
            padding: 15px 8px;
            position: absolute;
            bottom: -2px;
            right: 0;
            left: 0;
            background: var(--background);
            border: var(--story-border-mobile);
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            border-top-left-radius: 15px;
            border-top-right-radius: 15px;
          }

          .content > .option.edit {
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 10px;
            width: 100%;
            color: var(--text-color);
            background: var(--gray-background);
            border-radius: 12px;
          }
  
          .content > .option.edit > svg  {
            height: 22px;
            width: 22px;
          }
  
          .content > .option.edit > span.text {
            font-size: 1rem;
            font-weight: 500;
            font-family: var(--font-main), sans-serif;
            color: var(--text-color);
          }
  
          .title {
            border-top: var(--border);
            border-bottom: var(--border);
            color: var(--text-color);
            width: 100%;
            font-size: 1rem;
            font-weight: 600;
            margin: 10px 0; 
            padding: 10px 0;
            text-align: center;
            border-radius: 0;
            font-family: var(--font-text), sans-serif;
            color: var(--text-color);
            font-weight: 500;
          }

          span.pointer {
            display: none;
          }

          .share-buttons > span.copy,
          .share-buttons > a {
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            height: 45px;
            width: 45px;
            min-height: 45px;
            min-width: 45px;
            max-height: 45px;
            max-width: 45px;
            padding: 2px;
            margin: 3px;
          }

          .share-buttons > span.copy > svg,
          .share-buttons > a > svg {
            height: 23px;
            width: 23px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .share-buttons > a.facebook > svg {
            height: 25px;
            width: 25px;
          }

          .share-buttons > a.reddit > svg {
            height: 26px;
            width: 26px;
          }

          .share-buttons > a.telegram > svg {
            height: 26px;
            width: 26px;
          }
        }
      </style>
    `;
  }
}