export default class StatContainer extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this._url = this.getAttribute('api') || '/u/stats';
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  getTemplate = () => {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    // language=HTML
    return /* html */`
      ${this.getHeader()}
			<div class="content">
				${this.getStats()}
      </div>
    `;
  }

  getStats = () =>  {
    return /* html */`
      <month-stat url="${this._url}"></month-stat>
    `;
  }

  getHeader = () => {
    return /* html */`
      <div class="top">
        <h4 class="title">Your stats</h4>
        <p class="desc">
          Your stats are a summary of your interactions on the platform. You can view your stories, replies and likes and it updates on a daily basis.
        </p>
      </div>
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
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          width: 100%;
        }

        .top {
          display: flex;
          flex-flow: column;
          gap: 5px;
          padding: 5px 0 0;
          width: 100%;
        }

        .top > h4.title {
          display: flex;
          align-items: center;
          color: var(--title-color);
          font-size: 1.3rem;
          font-weight: 500;
          margin: 0;
          padding: 0;
        }

        .top > .desc {
          border-bottom: var(--border);
          margin: 0;
          padding: 0 0 10px;
          color: var(--text-color);
          font-size: 1rem;
          font-family: var(--font-main), sans-serif;
        }

        .content {
          display: flex;
          flex-flow: column;
          gap: 10px;
          padding: 0;
          width: 100%;
        }

        @media screen and (max-width:600px) {
          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          .top {
            padding: 0 10px;
          }

          .actions > ul.tab span.line {
            left: 10px;
          }

          .content {
            display: flex;
            flex-flow: column;
            gap: 10px;
            padding: 0 10px 30px;
            width: 100%;
          }

          a,
          .actions > ul.tab > li.tab-item {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}