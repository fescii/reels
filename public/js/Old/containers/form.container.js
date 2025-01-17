export default class FormContainer extends HTMLElement {
	constructor() {
		// We are not even going to touch this.
		super();

		// let's create our shadow root
		this.shadowObj = this.attachShadow({ mode: "open" });

		this.render();
	}

	render() {
		this.shadowObj.innerHTML = this.getTemplate();
	}

	connectedCallback() {

    this.expandTextArea();
	}

  expandTextArea = () => {
    const replyTextarea = this.shadowObj.querySelector('textarea');
    if (replyTextarea) {
      replyTextarea.addEventListener('input', () => {
        replyTextarea.style.height = 'auto';
        const height = replyTextarea.scrollHeight;
        if (height <= 60) {
          replyTextarea.style.height = `38px`;
        }
        else if (height <= 100) {
          replyTextarea.style.height = `${height + 10}px`;
        }
        else {
          replyTextarea.style.height = `100px`;
        }
      });
    }
  }

	getTemplate = () => {
		// Show HTML Here
		return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
	}

	getBody = () => {
		return /* html */`
      <form action="" class="reply">
        <textarea name="reply" placeholder="What's your reply?" id="reply"></textarea>
        <div class="footer">
          <div class="actions">
            <span class="action at" title="Mention">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 512 512">
                <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208c13.3 0 24 10.7 24 24s-10.7 24-24 24C114.6 512 0 397.4 0 256S114.6 0 256 0S512 114.6 512 256v28c0 50.8-41.2 92-92 92c-31.1 0-58.7-15.5-75.3-39.2C322.7 360.9 291.1 376 256 376c-66.3 0-120-53.7-120-120s53.7-120 120-120c28.8 0 55.2 10.1 75.8 27c4.3-6.6 11.7-11 20.2-11c13.3 0 24 10.7 24 24v80 28c0 24.3 19.7 44 44 44s44-19.7 44-44V256c0-114.9-93.1-208-208-208zm72 208a72 72 0 1 0 -144 0 72 72 0 1 0 144 0z"/>
              </svg>
            </span>
            <span class="action poll" title="Poll">
              <svg viewBox="0 0 24 24"  fill="currentColor">
                <g>
                  <path d="M6 5c-1.1 0-2 .895-2 2s.9 2 2 2 2-.895 2-2-.9-2-2-2zM2 7c0-2.209 1.79-4 4-4s4 1.791 4 4-1.79 4-4 4-4-1.791-4-4zm20 1H12V6h10v2zM6 15c-1.1 0-2 .895-2 2s.9 2 2 2 2-.895 2-2-.9-2-2-2zm-4 2c0-2.209 1.79-4 4-4s4 1.791 4 4-1.79 4-4 4-4-1.791-4-4zm20 1H12v-2h10v2zM7 7c0 .552-.45 1-1 1s-1-.448-1-1 .45-1 1-1 1 .448 1 1z"></path>
                </g>
              </svg>
            </span>
            <span class="action link" title="Link">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 640 512">
                <path d="M580.3 267.2c56.2-56.2 56.2-147.3 0-203.5C526.8 10.2 440.9 7.3 383.9 57.2l-6.1 5.4c-10 8.7-11 23.9-2.3 33.9s23.9 11 33.9 2.3l6.1-5.4c38-33.2 95.2-31.3 130.9 4.4c37.4 37.4 37.4 98.1 0 135.6L433.1 346.6c-37.4 37.4-98.2 37.4-135.6 0c-35.7-35.7-37.6-92.9-4.4-130.9l4.7-5.4c8.7-10 7.7-25.1-2.3-33.9s-25.1-7.7-33.9 2.3l-4.7 5.4c-49.8 57-46.9 142.9 6.6 196.4c56.2 56.2 147.3 56.2 203.5 0L580.3 267.2zM59.7 244.8C3.5 301 3.5 392.1 59.7 448.2c53.6 53.6 139.5 56.4 196.5 6.5l6.1-5.4c10-8.7 11-23.9 2.3-33.9s-23.9-11-33.9-2.3l-6.1 5.4c-38 33.2-95.2 31.3-130.9-4.4c-37.4-37.4-37.4-98.1 0-135.6L207 165.4c37.4-37.4 98.1-37.4 135.6 0c35.7 35.7 37.6 92.9 4.4 130.9l-5.4 6.1c-8.7 10-7.7 25.1 2.3 33.9s25.1 7.7 33.9-2.3l5.4-6.1c49.9-57 47-142.9-6.5-196.5c-56.2-56.2-147.3-56.2-203.5 0L59.7 244.8z"/>
              </svg>
            </span>
            <span class="action emoji" title="Emoji">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" width="16" height="16" viewBox="0 0 512 512">
                <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm177.6 62.1C192.8 334.5 218.8 352 256 352s63.2-17.5 78.4-33.9c9-9.7 24.2-10.4 33.9-1.4s10.4 24.2 1.4 33.9c-22 23.8-60 49.4-113.6 49.4s-91.7-25.5-113.6-49.4c-9-9.7-8.4-24.9 1.4-33.9s24.9-8.4 33.9 1.4zM144.4 208a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm192-32a32 32 0 1 1 0 64 32 32 0 1 1 0-64z"/>
              </svg>
            </span>
            <span class="action schedule" title=Schedule">
              <svg viewBox="0 0 24 24"  fill="currentColor">
                <g>
                  <path d="M6 3V2h2v1h6V2h2v1h1.5C18.88 3 20 4.119 20 5.5v2h-2v-2c0-.276-.22-.5-.5-.5H16v1h-2V5H8v1H6V5H4.5c-.28 0-.5.224-.5.5v12c0 .276.22.5.5.5h3v2h-3C3.12 20 2 18.881 2 17.5v-12C2 4.119 3.12 3 4.5 3H6zm9.5 8c-2.49 0-4.5 2.015-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.01-4.5-4.5-4.5zM9 15.5C9 11.91 11.91 9 15.5 9s6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5S9 19.09 9 15.5zm5.5-2.5h2v2.086l1.71 1.707-1.42 1.414-2.29-2.293V13z"></path>
                </g>
              </svg>
            </span>
            <span class="action code" title="Code">
              <svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" fill="currentColor" viewBox="0 0 640 512">
                <path d="M399.1 1.1c-12.7-3.9-26.1 3.1-30 15.8l-144 464c-3.9 12.7 3.1 26.1 15.8 30s26.1-3.1 30-15.8l144-464c3.9-12.7-3.1-26.1-15.8-30zm71.4 118.5c-9.1 9.7-8.6 24.9 1.1 33.9L580.9 256 471.6 358.5c-9.7 9.1-10.2 24.3-1.1 33.9s24.3 10.2 33.9 1.1l128-120c4.8-4.5 7.6-10.9 7.6-17.5s-2.7-13-7.6-17.5l-128-120c-9.7-9.1-24.9-8.6-33.9 1.1zm-301 0c-9.1-9.7-24.3-10.2-33.9-1.1l-128 120C2.7 243 0 249.4 0 256s2.7 13 7.6 17.5l128 120c9.7 9.1 24.9 8.6 33.9-1.1s8.6-24.9-1.1-33.9L59.1 256 168.4 153.5c9.7-9.1 10.2-24.3 1.1-33.9z"/>
              </svg>
            </span>
          </div>
          <button type="submit">Reply</button>
        </div>
      </form>
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
          background-color: var(--background);
          border-bottom: ${this.getAttribute('full') === "true" ? 'var(--border)' : 'none'};
          padding: ${this.getAttribute('full') === "true" ? '0 0 15px 0' : '0'};
          display: flex;
          flex-flow: column;
          gap: 0;
        }

        form.reply {
          padding: 0;
          margin: 0;
          display: flex;
          flex-flow: column;
          gap: 0;
          font-size: 1rem;
          font-weight: 400;
          color: var(--gray-color);
          position: relative;
        }

        form.reply > textarea {
          border: none;
          background-color: var(--background) !important;
          padding: 4px 0 0 2px;
          margin: 0;
          width: calc(100% - 35px);
          resize: none;
          height: 45px;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 1rem;
          font-weight: 400;
          color: var(--text-color);
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        form.reply > textarea::-webkit-scrollbar {
          display: none !important;
          visibility: hidden;
        }

        form.reply .footer {
          padding: 0;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        form.reply .footer > .actions {
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        form.reply .footer * {
          transition: all 300ms ease-in-out;
          -webkit-transition: all 300ms ease-in-out;
          -moz-transition: all 300ms ease-in-out;
          -ms-transition: all 300ms ease-in-out;
          -o-transition: all 300ms ease-in-out;
        }

        form.reply .footer > .actions > .action {
          /* border: var(--input-border); */
          cursor: pointer;
          padding: 0;
          color: var(--gray-color);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        form.reply .footer > .actions > .action > svg {
          /* border: var(--input-border); */
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: inherit;
          width: 20px;
          height: 20px;
        }

        form.reply .footer > .actions > .action:hover {
          /* border: var(--input-border); */
          color: var(--accent-color);
        }

        form.reply .footer > button {
          border: none;
          cursor: pointer;
          color: var(--white-color);
          background: var(--accent-linear);
          height: 30px;
          width: 60px;
          padding: 0;
          font-size: 0.9rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

				@media screen and (max-width:660px) {
					:host {
            font-size: 16px;
					}

          div.options > span {
            border: var(--border-mobile);
          }
				}
	    </style>
    `;
	}
}