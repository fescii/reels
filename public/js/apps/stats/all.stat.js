export default class AllStat extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    this._up  = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M4.53 4.75A.75.75 0 0 1 5.28 4h6.01a.75.75 0 0 1 .75.75v6.01a.75.75 0 0 1-1.5 0v-4.2l-5.26 5.261a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L9.48 5.5h-4.2a.75.75 0 0 1-.75-.75Z"></path>
      </svg>
    `;

    this._down = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
        <path d="M4.22 4.179a.75.75 0 0 1 1.06 0l5.26 5.26v-4.2a.75.75 0 0 1 1.5 0v6.01a.75.75 0 0 1-.75.75H5.28a.75.75 0 0 1 0-1.5h4.2L4.22 5.24a.75.75 0 0 1 0-1.06Z"></path>
      </svg>
    `;

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  formatNumber = n => {
    if (n < 1000) {
      return n.toString();
    } else if (n < 10000) {
      return `${(n / 1000).toFixed(2)}k`;
    } else if (n < 100000) {
      return `${(n / 1000).toFixed(1)}k`;
    } else if (n < 1000000) {
      return `${(n / 1000).toFixed(0)}k`;
    } else if (n < 10000000) {
      return `${(n / 1000000).toFixed(2)}M`;
    } else if (n < 100000000) {
      return `${(n / 1000000).toFixed(1)}M`;
    } else if (n < 1000000000) {
      return `${(n / 1000000).toFixed(0)}M`;
    } else {
      return "1B+";
    }
  }

  calculatePercentageChange = (last, current) => {
    // Calculate the difference between the new and old values
    const difference = current - last;
    let percentageChange  = 0;
    // check if last is zero
    if (last === 0 && current > 0) {
      percentageChange = 100
    }
    else if(last === 0 && current === 0) {
      percentageChange = 0
    }
    else {
      // Calculate the percentage change
      percentageChange = (difference / Math.abs(last)) * 100;
    }

    // Round the result to two decimal places
    let roundedPercentageChange = Math.round(percentageChange * 100) / 100;

    // Format the result as a signed float with two decimal places
    const formattedPercentageChange = roundedPercentageChange.toFixed(2);

    // Convert the formatted string back to a number
    const percentageChangeNumber = parseFloat(formattedPercentageChange);

    return percentageChangeNumber;
  }

  parseToNumber = num_str => {
    // Try parsing the string to an integer
    const num = parseInt(num_str);

    // Check if parsing was successful
    if (!isNaN(num)) {
      return num;
    } else {
      return 0;
    }
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
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    return /* html */`
      ${this.getHeader()}
      <div class="content">
        ${this.getAll()}
        ${this.getStories()}
        ${this.getOpinion()}
      </div>
    `;
  }

  getHeader = () => {
    return /* html */`
      <div class="title">
        <h4 class="text">All contents</h4>
        <span class="desc"> Summary of all engagements</span>
      </div>
    `
  }

  getAll = () => {
    let icon = ''
    const lastAll = this.parseToNumber(this.getAttribute('all-last'));
    const currentAll = this.parseToNumber(this.getAttribute('all'));

    const percentageChange = this.calculatePercentageChange(lastAll, currentAll);

    // if percentageChange is negative, we need to make it positive
    const percentage = Math.abs(percentageChange);

    if (percentageChange > 0) {
      icon = /* html */`
        <span class="change up">
          ${this._up}
          <span class="percentage">${this.formatNumber(percentage)}%</span>
        </span>
      `;

    }
    else {
      icon = /* html */`
        <span class="change down">
          ${this._down}
          <span class="percentage">${this.formatNumber(percentage)}%</span>
        </span>
      `;
    }

    return /* html */`
      <div class="main">
        <div class="views">
          <div class="text">
            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16" width="16" height="16">
              <path d="M8.75 1.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V2.25a.75.75 0 0 1 .75-.75Zm-3.5 3a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Zm7 0a.75.75 0 0 1 .75.75v7.5a.75.75 0 0 1-1.5 0v-7.5a.75.75 0 0 1 .75-.75Z"></path>
            </svg>
            <h2 class="no">
              ${this.formatNumber(currentAll)}
            </h2>
          </div>
          <span class="desc">All stats</span>
        </div>
        <div class="compared">
          ${icon}
          <span class="info">This month</span>
        </div>
      </div>
    `
  }

  getStories = () => {
    let icon = '';
    const lastStory = this.parseToNumber(this.getAttribute('stories-last'));
    const currentStory = this.parseToNumber(this.getAttribute('stories'));
    const percentageChange = this.calculatePercentageChange(lastStory, currentStory);
    // if percentageChange is negative, we need to make it positive
    const percentage = Math.abs(percentageChange);

    if (percentageChange > 0) {
      icon = /* html */`
        <span class="change up">
          ${this._up}
          <span class="percentage">${this.formatNumber(percentage)}%</span>
        </span>
      `;

    }
    else {
      icon = /* html */`
        <span class="change down">
          ${this._down}
          <span class="percentage">${this.formatNumber(percentage)}%</span>
        </span>
      `;
    }

    return /* html */`
      <div class="main">
        <div class="views">
          <div class="text">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M7.75 14A1.75 1.75 0 0 1 6 12.25v-8.5C6 2.784 6.784 2 7.75 2h6.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14Zm-.25-1.75c0 .138.112.25.25.25h6.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25h-6.5a.25.25 0 0 0-.25.25ZM4.9 3.508a.75.75 0 0 1-.274 1.025.249.249 0 0 0-.126.217v6.5c0 .09.048.173.126.217a.75.75 0 0 1-.752 1.298A1.75 1.75 0 0 1 3 11.25v-6.5c0-.649.353-1.214.874-1.516a.75.75 0 0 1 1.025.274ZM1.625 5.533h.001a.249.249 0 0 0-.126.217v4.5c0 .09.048.173.126.217a.75.75 0 0 1-.752 1.298A1.748 1.748 0 0 1 0 10.25v-4.5a1.748 1.748 0 0 1 .873-1.516.75.75 0 1 1 .752 1.299Z"></path>
            </svg>
            <h2 class="no">
              ${this.formatNumber(currentStory)}
            </h2>
          </div>
          <span class="desc">All stories</span>
        </div>
        <div class="compared">
          ${icon}
          <span class="info">This month</span>
        </div>
      </div>
    `
  }

  getOpinion = () => {
    let icon = '';
    const lastOpinion = this.parseToNumber(this.getAttribute('replies-last'));
    const currentOpinion = this.parseToNumber(this.getAttribute('replies'));

    const percentageChange = this.calculatePercentageChange(lastOpinion, currentOpinion);

    // if percentageChange is negative, we need to make it positive
    const percentage = Math.abs(percentageChange);

    // if percentageChange is more than 1k

    if (percentageChange > 0) {
      icon = /* html */`
        <span class="change up">
          ${this._up}
          <span class="percentage">${this.formatNumber(percentage)}%</span>
        </span>
      `;

    }
    else {
      icon = /* html */`
        <span class="change down">
          ${this._down}
          <span class="percentage">${this.formatNumber(percentage)}%</span>
        </span>
      `;
    }

    return /* html */`
      <div class="main">
        <div class="views">
          <div class="text">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" width="16px" height="16px" fill="currentColor">
              <path d="M88.2 309.1c9.8-18.3 6.8-40.8-7.5-55.8C59.4 230.9 48 204 48 176c0-63.5 63.8-128 160-128s160 64.5 160 128s-63.8 128-160 128c-13.1 0-25.8-1.3-37.8-3.6c-10.4-2-21.2-.6-30.7 4.2c-4.1 2.1-8.3 4.1-12.6 6c-16 7.2-32.9 13.5-49.9 18c2.8-4.6 5.4-9.1 7.9-13.6c1.1-1.9 2.2-3.9 3.2-5.9zM0 176c0 41.8 17.2 80.1 45.9 110.3c-.9 1.7-1.9 3.5-2.8 5.1c-10.3 18.4-22.3 36.5-36.6 52.1c-6.6 7-8.3 17.2-4.6 25.9C5.8 378.3 14.4 384 24 384c43 0 86.5-13.3 122.7-29.7c4.8-2.2 9.6-4.5 14.2-6.8c15.1 3 30.9 4.5 47.1 4.5c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176zM432 480c16.2 0 31.9-1.6 47.1-4.5c4.6 2.3 9.4 4.6 14.2 6.8C529.5 498.7 573 512 616 512c9.6 0 18.2-5.7 22-14.5c3.8-8.8 2-19-4.6-25.9c-14.2-15.6-26.2-33.7-36.6-52.1c-.9-1.7-1.9-3.4-2.8-5.1C622.8 384.1 640 345.8 640 304c0-94.4-87.9-171.5-198.2-175.8c4.1 15.2 6.2 31.2 6.2 47.8l0 .6c87.2 6.7 144 67.5 144 127.4c0 28-11.4 54.9-32.7 77.2c-14.3 15-17.3 37.6-7.5 55.8c1.1 2 2.2 4 3.2 5.9c2.5 4.5 5.2 9 7.9 13.6c-17-4.5-33.9-10.7-49.9-18c-4.3-1.9-8.5-3.9-12.6-6c-9.5-4.8-20.3-6.2-30.7-4.2c-12.1 2.4-24.7 3.6-37.8 3.6c-61.7 0-110-26.5-136.8-62.3c-16 5.4-32.8 9.4-50 11.8C279 439.8 350 480 432 480z"/>
            </svg>
            <h2 class="no">
              ${this.formatNumber(currentOpinion)}
            </h2>
          </div>
          <span class="desc">All replies</span>
        </div>
        <div class="compared">
          ${icon}
          <span class="info">This month</span>
        </div>
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

        :host {
          font-size: 16px;
          border-bottom: var(--border);
          margin: 10px 0 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          gap: 10px;
          justify-content: center;
          padding: 0 0 10px;
        }

        .title {
          display: flex;
          position: relative;
          flex-flow: column;
          padding: 6px 0;
          gap: 0;
          justify-content: center;
          color: var(--text-color);
        }

        .title time {
          position: absolute;
          right: 10px;
          color: var(--gray-color);
          font-family: var(--font-mono), monospace;
          border: var(--input-border);
          padding: 2px 10px;
          border-radius: 5px;
          -webkit-border-radius: 5px;
          -moz-border-radius: 5px;
          -ms-border-radius: 5px;
          -o-border-radius: 5px;
        }

        .title > h4 {
          color: var(--text-color);
          font-size: 1.2rem;
          font-weight: 600;
          font-family: var(--font-main), sans-serif;
          margin: 0;
        }

        .title > span.desc {
          color: var(--gray-color);
          font-size: 0.9rem;
          font-family: var(--font-text), sans-serif;
        }

        .content {
          display: flex;
          flex-flow: row;
          justify-content: space-between;
          gap: 20px;
          padding: 6px 0;
          width: 100%;
        }

        .content > .main {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
        }

        .content > .main .views {
          display: flex;
          width: max-content;
          flex-flow: column;
          align-items: center;
          gap: 0;
          padding: 0;
        }

        .content > .main .views .text {
          display: flex;
          flex-flow: row;
          align-items: center;
          gap: 5px;
          color: var(--text-color);
        }

        .content > .main .views .text svg {
          width: 25px;
          height: 25px;
        }

        .content > .main .views .text > h2 {
          color: var(--text-color);
          font-size: 1.25rem;
          font-weight: 600;
          font-family: var(--font-text), sans-serif;
          margin: 0;
        }

        .content > .main .views .desc {
          color: var(--gray-color);
          font-size: 0.9rem;
          font-family: var(--font-read), sans-serif;
        }

        .content > .main .compared {
          display: flex;
          flex-flow: column;
          gap: 0;
          padding: 0;
          margin: 20px 0 0 0;
        }

        .content > .main .compared > .change {
          display: flex;
          flex-flow: row;
          gap: 2px;
          padding: 0;
          align-items: center;
        }

        .content > .main .compared > .change.up {
          color: var(--accent-alt);
        }

        .content > .main .compared > .change.down {
          color: var(--error-color);
        }

        .content > .main .compared > .change.up .percentage {
          color: transparent;
          font-family: var(--font-text), sans-serif;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .content > .main .compared > .change .percentage {
          /* color: var(--text-color); */
          font-size: 1.05rem;
          font-weight: 500;
          font-family: var(--font-text), sans-serif;
          text-transform: uppercase;
          margin: 0;
        }

        .content > .main .compared > .change svg {
          width: 20px;
          height: 20px;
        }

        .content > .main .compared span.info {
          color: var(--gray-color);
          font-size: 0.9rem;
          font-family: var(--font-text), sans-serif;
          font-style: italic;
        }

        @media screen and (max-width:600px) {
          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          :host {
            gap: 0;
            padding: 0 0 10px;
          }

          .title {
            display: flex;
            position: relative;
            flex-flow: column;
            padding: 0 0 6px;
            gap: 0;
            justify-content: center;
            color: var(--text-color);
          }

        }
      </style>
    `;
  }
}