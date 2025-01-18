export default class InfoContainer extends HTMLElement {
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
		const contentContainer = this.shadowObj.querySelector('div.content');

		this.fetchTopics(contentContainer);
	}

	fetchTopics = (contentContainer) => {
		const topicsLoader = this.shadowObj.querySelector('info-loader');
		const content = this.getInfo();
		setTimeout(() => {
			topicsLoader.remove();
			contentContainer.insertAdjacentHTML('beforeend', content);
		}, 2000)
	}

	getTemplate = () => {
		// Show HTML Here
		return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
	}

	getLoader = () => {
		return `
			<info-loader speed="300"></info-loader>
		`
	}

	getBody = () => {
		// language=HTML
		return /* html */`
			<div class="content">
				${this.getLoader()}
			</div>
    `;
	}

  getInfo = () => {
		const year = new Date().getFullYear()
    return /*html*/`
      <div class="company">
        <ul class="footer-list">
          <li class="item">
            <a href="/soon" class="item-link">Docs</a>
          </li>
          <li class="item">
            <a href="/soon" class="item-link">What’s New</a>
            <span class="dot"></span>
          </li>
          <li class="item">
            <a href="/soon" class="item-link">Give a feedback </a>
          </li>
          <li class="item">
            <a href="/soon" class="item-link">Request a feature</a>
          </li>
          <li class="item">
            <a href="/soon" class="item-link">Source code</a>
            <span class="dot"></span>
          </li>
          <li class="item">
            <a target="_blank" rel="noopener noreferrer" href="https://www.buymeacoffee.com/femar" class="item-link">Donate</a>
          </li>
          <li class="item">
            <a href="/soon" class="item-link">Contact</a>
          </li>
          <li class="item copy">
            <a href="/soon" class="item-link">&copy ${year} aduki, Inc</a>
          </li>
        </ul>
      </div>
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
					margin: 0;
				  padding: 0;
				  display: flex;
				  flex-flow: column;
				  gap: 10px;
				}

				div.content {
				  padding: 0;
				  display: flex;
				  flex-flow: row;
				  flex-wrap: wrap;
				  align-items: center;
				  justify-content: start;
				  gap: 0;
				  width: 100%;
				}

				.company {
          display: flex;
          flex-flow: column;
          align-items: center;
          gap: 10px;
          max-width: 500px;
        }

        .company >.title {
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .company > ul.footer-list {
          margin: 0;
          list-style-type: none;
          padding: 0 0 0 1px;
          display: flex;
          flex-flow: row;
          flex-wrap: wrap;
          align-items: center;
          justify-content: start;
          gap: 10px;
        }

        .company > ul.footer-list > li.item {
          margin: 0 10px 0 0;
          padding: 0;
          width: max-content;
          position: relative;
        }

        .company > ul.footer-list > li.item > .dot {
          display: inline-block;
          background: var(--accent-linear);
          width: 5px;
          height: 5px;
          position: absolute;
          right: -9px;
          top: 3px;
          border-radius: 5px;
          -webkit-border-radius: 5px;
          -moz-border-radius: 5px;
        }

        .company > ul.footer-list > li.item > a.item-link {
          color: var(--gray-color);
          /* font-size: 0.98rem; */
          text-decoration: none;
          font-weight: 400;
          font-size: 0.9rem;
        }

				.company > ul.footer-list > li.item.copy > a.item-link {
					font-family: var(--font-text), sans-serif;
				}

        .company > ul.footer-list > li.item > a.item-link:hover {
          /* color: var(--accent-color); */
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
          border-bottom: 1px solid var(--accent-color);
        }

				@media screen and (max-width:660px) {
					:host {
        		font-size: 16px;
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