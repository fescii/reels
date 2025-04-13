export default class StatsPopup extends HTMLElement {
  constructor() {

    // We are not even going to touch this.
    super();

    this._url = this.getAttribute('url');

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: 'open' });
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.disableScroll();

    // Select the close button & overlay
    const overlay = this.shadowObj.querySelector('.overlay');
    const btns = this.shadowObj.querySelectorAll('.cancel-btn'); // Assuming .cancel-btn exists in original getStyles/getTemplate
    const contentContainer = this.shadowObj.querySelector('ul.highlights');

    // Close the modal
    if (overlay && btns && contentContainer) {
      this.closePopup(overlay, btns);
      this.#fetch(contentContainer);
    }
    // Note: Original code didn't explicitly handle the 'else' case here.
  }

  #fetch = (contentContainer) => {
    const outerThis = this;
    const topicsLoader = this.shadowObj.querySelector('.loader-container');
    setTimeout(async () => {
      try {
        const result = await this.api.get(this._url, { content: 'json' });
        if (result.success && result.stats) { // Ensure result.data exists
          // update the content
          // *** Pass necessary attributes to getHighlights (Removed 'topics') ***
          const content = outerThis.getHighlights(
            result.stats,
            this.getAttribute('followers'),
            this.getAttribute('posts'),
            this.getAttribute('replies'),
            // this.getAttribute('topics'), // Removed topics attribute
            this.getAttribute('name')
          );
          // remove the loader
          if (this.shadowObj.contains(topicsLoader)) { // Check if loader still exists
            topicsLoader.remove();
          }
          // insert the content
          contentContainer.insertAdjacentHTML('beforeend', content);
        } else {
          // display error message
          const content = outerThis.getEmpty();
          if (this.shadowObj.contains(topicsLoader)) { topicsLoader.remove(); }
          contentContainer.insertAdjacentHTML('beforeend', content);
        }
      } catch (error) {
        // display error message
        console.error("StatsPopup Error fetching topics:", error); // Log the actual error
        const content = outerThis.getEmpty();
        if (this.shadowObj.contains(topicsLoader)) { topicsLoader.remove(); }
        contentContainer.insertAdjacentHTML('beforeend', content);
      }
    }, 2000);
  }

  formatNumber = n => {
    if (typeof n !== 'number' || isNaN(n)) { return '0'; }
    if (n < 0) { return `-${this.formatNumber(Math.abs(n))}`; }
    if (n >= 0 && n <= 999) { return n.toString(); }
    if (n >= 1000 && n <= 9999) { const v = (n / 1000).toFixed(2); return `${v}k`; }
    if (n >= 10000 && n <= 99999) { const v = (n / 1000).toFixed(1); return `${v}k`; }
    if (n >= 100000 && n <= 999999) { const v = Math.floor(n / 1000); return `${v}k`; }
    if (n >= 1000000 && n <= 9999999) { const v = (n / 1000000).toFixed(2); return `${v}M`; }
    if (n >= 10000000 && n <= 99999999) { const v = (n / 1000000).toFixed(1); return `${v}M`; }
    if (n >= 100000000 && n <= 999999999) { const v = Math.floor(n / 1000000); return `${v}M`; }
    if (n >= 1000000000 && n <= 999999999999) { const v = (n / 1000000000).toFixed(1); return `${v}B`; }
    if (n > 999999999999) { return "1T+"; }
    return '0';
  }

  parseToNumber = num_str => {
    const num = parseInt(num_str, 10);
    if (!isNaN(num) && isFinite(num)) { return num; }
    return 0;
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
    // Show HTML Here (Reverted to original structure)
    return `
      <div class="overlay"></div>
      <section id="content" class="content">
        ${this.getWelcome()}
      </section>
    ${this.getStyles()}` // Assuming getStyles() exists elsewhere and is unchanged
  }

  getWelcome() {
    // Reverted to original structure
    return /* html */`
      <div class="welcome">
        <ul class="highlights">
          ${this.getLoader()}
        </ul>
      </div>
    `
  }


  getHighlights = (data, attrFollowers, attrPosts, attrReplies, /* attrTopics removed */ attrName) => {
    // 1. Consolidate all stats into a single object
    const stats = {
      followers: this.parseToNumber(attrFollowers),
      postsPublished: this.parseToNumber(attrPosts),
      repliesAdded: this.parseToNumber(attrReplies),
      // topicsSubscribed: removed
      views: {
        all: this.parseToNumber(data?.all?.total),
        posts: this.parseToNumber(data?.all?.posts),
        replies: this.parseToNumber(data?.all?.replies),
        issues: this.parseToNumber(data?.all?.issues),       // Added from total
        responses: this.parseToNumber(data?.all?.responses), // Added from total
        currentMonth: this.parseToNumber(data?.current),
        lastMonth: this.parseToNumber(data?.last),
      },
    };

    // 2. Prepare name
    let name = attrName || 'User';
    if (name) {
      const nameParts = name.split(' ');
      name = nameParts[0].toLowerCase();
    } else {
      name = 'user';
    }

    // 3. Calculate percentage change for monthly views (using currentMonth & lastMonth)
    let percentage = 0;
    if (stats.views.lastMonth !== 0) {
      percentage = ((stats.views.currentMonth - stats.views.lastMonth) / stats.views.lastMonth) * 100;
    } else if (stats.views.currentMonth > 0) {
      percentage = 100; // Treat as 100% increase if starting from 0
    } // If both are 0, percentage remains 0

    let increaseOrDecreaseHtml = this.getLevel(name); // Default message

    if (stats.views.lastMonth > 0 || stats.views.currentMonth > 0) { // Only show if there's activity
      const percentageFormatted = percentage % 1 === 0 ? percentage : percentage.toFixed(1);
      if (percentage > 0) {
        increaseOrDecreaseHtml = this.getIncrease(percentageFormatted);
      } else if (percentage < 0) {
        increaseOrDecreaseHtml = this.getDecrease(Math.abs(percentageFormatted));
      }
      // If percentage is 0, the getLevel message remains appropriate
    }

    // 4. Format all numbers for display
    const followersFormatted = this.formatNumber(stats.followers);
    const postsFormatted = this.formatNumber(stats.postsPublished);
    const repliesFormatted = this.formatNumber(stats.repliesAdded);
    // topicsFormatted removed
    const issuesFormatted = this.formatNumber(stats.views.issues);       // Format issues
    const responsesFormatted = this.formatNumber(stats.views.responses); // Format responses
    const viewsAllFormatted = this.formatNumber(stats.views.all);
    const viewsCurrentMonthFormatted = this.formatNumber(stats.views.currentMonth);
    // Optional: Format last month's views if you want to display it explicitly
    // const viewsLastMonthFormatted = this.formatNumber(stats.views.lastMonth);

    // 5. Generate HTML output
    return /* html */`
        <li class="item">
            <span class="icon" title="Followers">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                    <path d="M2 5.5a3.5 3.5 0 1 1 5.898 2.549 5.508 5.508 0 0 1 3.034 4.084.75.75 0 1 1-1.482.235 4 4 0 0 0-7.9 0 .75.75 0 0 1-1.482-.236A5.507 5.507 0 0 1 3.102 8.05 3.493 3.493 0 0 1 2 5.5ZM11 4a3.001 3.001 0 0 1 2.22 5.018 5.01 5.01 0 0 1 2.56 3.012.749.749 0 0 1-.885.954.752.752 0 0 1-.549-.514 3.507 3.507 0 0 0-2.522-2.372.75.75 0 0 1-.574-.73v-.352a.75.75 0 0 1 .416-.672A1.5 1.5 0 0 0 11 5.5.75.75 0 0 1 11 4Zm-5.5-.5a2 2 0 1 0-.001 3.999A2 2 0 0 0 5.5 3.5Z"></path>
                </svg>
            </span>
            <span class="link">
                <span class="numbers" id="followers">${followersFormatted}</span> ${stats.followers === 1 ? 'person follows' : 'people follow'} ${name}
            </span>
        </li>
        <li class="item">
            <span class="icon" title="Published Posts">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                     <path d="M0 3.75C0 2.784.784 2 1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25Zm1.75-.25a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25v-8.5a.25.25 0 0 0-.25-.25ZM3.5 6.25a.75.75 0 0 1 .75-.75h7a.75.75 0 0 1 0 1.5h-7a.75.75 0 0 1-.75-.75Zm.75 2.25h4a.75.75 0 0 1 0 1.5h-4a.75.75 0 0 1 0-1.5Z"></path>
                 </svg>
            </span>
            <span class="link">
                <span class="numbers" id="posts">${postsFormatted}</span> published ${stats.postsPublished === 1 ? 'post' : 'posts'}
            </span>
        </li>
        <li class="item">
            <span class="icon" title="Replies Added">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                    <path d="M6.78 1.97a.75.75 0 0 1 0 1.06L3.81 6h6.44A4.75 4.75 0 0 1 15 10.75v2.5a.75.75 0 0 1-1.5 0v-2.5a3.25 3.25 0 0 0-3.25-3.25H3.81l2.97 2.97a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L1.47 7.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"></path>
                </svg>
            </span>
            <span class="link">
                <span class="numbers" id="replies">${repliesFormatted}</span> ${stats.repliesAdded === 1 ? 'reply' : 'replies'} added
            </span>
        </li>
        <li class="item">
            <span class="icon" title="Publication Issues">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                     <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Z"></path><path d="M7.25 8.75a.75.75 0 0 1 .75-.75h.01a.75.75 0 0 1 .75.75v.01a.75.75 0 0 1-.75.75H8a.75.75 0 0 1-.75-.75ZM8 3.75a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-1.5 0v-2A.75.75 0 0 1 8 3.75Z"></path>
                 </svg>
            </span>
            <span class="link">
                <span class="numbers" id="issues">${issuesFormatted}</span> publication ${stats.views.issues === 1 ? 'issue' : 'issues'}
            </span>
        </li>
         <li class="item">
            <span class="icon" title="Issue Responses">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                     <path d="M1 2.75C1 1.784 1.784 1 2.75 1h10.5c.966 0 1.75.784 1.75 1.75v7.5A1.75 1.75 0 0 1 13.25 12H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 13.543V12H2.75A1.75 1.75 0 0 1 1 10.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h2.5a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h4.75a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"></path>
                </svg>
            </span>
            <span class="link">
                <span class="numbers" id="responses">${responsesFormatted}</span> issue ${stats.views.responses === 1 ? 'response' : 'responses'}
            </span>
        </li>
        <li class="item">
            <span class="icon" title="Total Content Views (All Time)">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M1 2.75A.75.75 0 0 1 1.75 2h12.5a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75H1.75a.75.75 0 0 1-.75-.75Zm.75 10.5h12.5V3.5H1.75Z"></path><path d="M4.5 5.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Zm0 3a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Zm.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5Z"></path></svg>
            </span>
            <span class="link">
                <span class="numbers" id="views-all">${viewsAllFormatted}</span> total content views
            </span>
        </li>
        <li class="item">
            <span class="icon" title="Content Views This Month">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                    <path d="M6 2c.306 0 .582.187.696.471L10 10.731l1.304-3.26A.751.751 0 0 1 12 7h3.25a.75.75 0 0 1 0 1.5h-2.742l-1.812 4.528a.751.751 0 0 1-1.392 0L6 4.77 4.696 8.03A.75.75 0 0 1 4 8.5H.75a.75.75 0 0 1 0-1.5h2.742l1.812-4.529A.751.751 0 0 1 6 2Z"></path>
                </svg>
            </span>
            <span class="link">
                <span class="numbers" id="views-month">${viewsCurrentMonthFormatted}</span> content views this month
            </span>
        </li>
        ${increaseOrDecreaseHtml} <div class="empty"> <p class="italics">
                This is a summary of the user's content and interactions performance on the platform.
            </p>
        </div>
    `;
  }

  // ... (getIncrease remains the same - updated version) ...
  getIncrease = percentage => {
    return /*html*/`
        <li class="item">
            <span class="icon increase" title="Monthly View Change vs Previous Month">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"> <path d="M4.53 4.75A.75.75 0 0 1 5.28 4h6.01a.75.75 0 0 1 .75.75v6.01a.75.75 0 0 1-1.5 0v-4.2l-5.26 5.261a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L9.48 5.5h-4.2a.75.75 0 0 1-.75-.75Z"></path> </svg>
            </span>
            <span class="link">
                <span class="numbers increase" id="percentage">${percentage}%</span> increase in views this month
            </span>
        </li>
    `;
  }

  // ... (getLevel remains the same - updated version) ...
  getLevel = name => {
    return /*html*/`
        <li class="item">
            <span class="icon" title="Monthly View Change vs Previous Month">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"> <path d="M11.93 8.5a4.002 4.002 0 0 1-7.86 0H.75a.75.75 0 0 1 0-1.5h3.32a4.002 4.002 0 0 1 7.86 0h3.32a.75.75 0 0 1 0 1.5Zm-1.43-.75a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0Z"></path> </svg>
            </span>
            <span class="link">
                No significant change in ${name}'s content views this month.
            </span>
        </li>
    `;
  }

  // ... (getDecrease remains the same - updated version) ...
  getDecrease = percentage => {
    return /*html*/`
        <li class="item">
            <span class="icon decrease" title="Monthly View Change vs Previous Month">
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor"> <path d="M4.22 4.179a.75.75 0 0 1 1.06 0l5.26 5.26v-4.2a.75.75 0 0 1 1.5 0v6.01a.75.75 0 0 1-.75.75H5.28a.75.75 0 0 1 0-1.5h4.2L4.22 5.24a.75.75 0 0 1 0-1.06Z"></path> </svg>
            </span>
            <span class="link">
                <span class="numbers decrease" id="percentage">${percentage}%</span> decrease in views this month
            </span>
        </li>
    `;
  }

  getEmpty = () => {
    // Reverted to original version
    return /* html */`
      <div class="empty">
        <p>User highlights were not loaded, and error while fetching data</p>
        <p>Try refreshing the page or check your internet connection. If the problem persists, please contact support.</p>
      </div>
    `
  }

  getLoader() {
    // Reverted to original version
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
          padding: 0;
          margin: 0;
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1rem;
          font-weight: 400;
        }

        div.empty > p.italics {
          font-family: var(--font-main), sans-serif;
        }
        
        ul.highlights {
          width: 100%;
          padding: 0;
          margin: 0;
          list-style-type: none;
          display: flex;
          flex-flow: column;
          gap: 10px;
        }
        
        ul.highlights > li.item {
          padding: 0;
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: row;
          align-items: center;
          flex-wrap: nowrap;
          gap: 10px;
        }
        
        ul.highlights > li.item > .icon {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 26px;
          width: 26px;
          min-height: 26px;
          min-width: 26px;
          max-height: 26px;
          max-width: 26px;
          padding: 3px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
          background-color: var(--gray-background);
          color: var(--gray-color);
          font-size: 0.9rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        ul.highlights > li.item > .icon > svg {
          height: 15px;
          width: 15px;
        }

        ul.highlights > li.item > .icon.increase {
          background: var(--accent-linear);
          color: var(--white-color);
        }

        ul.highlights > li.item > .icon.decrease {
          background: var(--error-linear);
          color: var(--white-color);
        }
        
        ul.highlights > li.item > .link {
          color: var(--text-color);
          font-family: var(--font-main), sans-serif;
          font-size: 1rem;
          font-weight: 400;
          text-decoration: none;
        }
        
        ul.highlights > li.item > a.link:hover {
          color: var(--text-color);
        }
        
        ul.highlights > li.item > .link .numbers {
          color: var(--highlight-color);
          font-weight: 600;
          font-family: var(--font-main), sans-serif;
          font-size: 0.95rem;
          display: inline-block;
          margin: 0 0 -2px 0;
        }
        
        ul.highlights > li.item.last {
          background-color: var(--gray-background);
          padding: 10px;
          margin: 5px 0;
          border-radius: 12px;
          -webkit-border-radius: 12px;
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

          .welcome > .actions .action {
            background: var(--stage-no-linear);
            text-decoration: none;
            padding: 7px 20px 8px;
            cursor: default;
            margin: 10px 0;
            width: 120px;
            cursor: default !important;
            border-radius: 12px;
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