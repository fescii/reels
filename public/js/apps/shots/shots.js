export default class ShotsVideos extends HTMLElement {
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.isScrolling = false;
    this.touchStartY = 0;
    this.currentVideoIndex = 0;
    this.render();
    // Bind methods
    this.handleScroll = this.handleScroll.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    this.setupEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  setupEventListeners() {
    const container = this.shadow.querySelector('.shots');
    if (container) {
      container.addEventListener('scroll', this.handleScroll, { passive: true });
      container.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      container.addEventListener('touchmove', this.handleTouchMove, { passive: false });
      container.addEventListener('touchend', this.handleTouchEnd, { passive: true });
      container.addEventListener('wheel', this.handleWheel, { passive: false });
      // Add keyboard event listener
      document.addEventListener('keydown', this.handleKeyDown);
    }
  }

  removeEventListeners() {
    const container = this.shadow.querySelector('.shots');
    if (container) {
      container.removeEventListener('scroll', this.handleScroll);
      container.removeEventListener('touchstart', this.handleTouchStart);
      container.removeEventListener('touchmove', this.handleTouchMove);
      container.removeEventListener('touchend', this.handleTouchEnd);
      container.removeEventListener('wheel', this.handleWheel);
      // Remove keyboard event listener
      document.removeEventListener('keydown', this.handleKeyDown);
    }
  }

  handleKeyDown(event) {
    // Prevent default behavior for arrow keys
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    
    if (this.isScrolling) return;

    switch (event.code) {
      case 'ArrowUp':
        this.scrollToNextVideo(-1);
        break;
      case 'ArrowDown':
      case 'Space':
        this.scrollToNextVideo(1);
        break;
    }
  }

  scrollToNextVideo(direction) {
    const container = this.shadow.querySelector('.shots');
    const videos = container.querySelectorAll('[is="shot-video"]');
    
    // Calculate next index with bounds checking
    const nextIndex = this.currentVideoIndex + direction;
    if (nextIndex < 0 || nextIndex >= videos.length) return;
    
    this.currentVideoIndex = nextIndex;
    const targetVideo = videos[this.currentVideoIndex];
    
    this.isScrolling = true;
    
    targetVideo.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });

    // Reset scrolling flag after animation
    setTimeout(() => {
      this.isScrolling = false;
    }, 500);
  }

  // Rest of the component code remains the same...
  handleWheel(event) {
    event.preventDefault();
    
    if (this.isScrolling) return;

    const deltaY = event.deltaY;
    const direction = deltaY > 0 ? 1 : -1;
    
    this.scrollToNextVideo(direction);
  }

  handleTouchStart(event) {
    this.touchStartY = event.touches[0].clientY;
  }

  handleTouchMove(event) {
    event.preventDefault();
    
    if (this.isScrolling) return;

    const touchDeltaY = this.touchStartY - event.touches[0].clientY;
    const direction = touchDeltaY > 0 ? 1 : -1;
    
    if (Math.abs(touchDeltaY) > 50) {
      this.scrollToNextVideo(direction);
      this.touchStartY = event.touches[0].clientY;
    }
  }

  handleTouchEnd() {
    this.touchStartY = 0;
  }

  handleScroll() {
    if (this.isScrolling) return;
    
    const container = this.shadow.querySelector('.shots');
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    
    this.currentVideoIndex = Math.round(scrollTop / containerHeight);
  }

  getTemplate() {
    return /* html */`
      <section class="shots-container">
        ${this.getForm()}
        <div class="shots">
          ${this.getShots()}
        </div>
      </section>
      <section class="info-container"> 
        <h1>Shots</h1>
        <p>Scroll to view more shots</p>
      </section>
      ${this.getStyles()}
    `;
  }

  getForm = () => {
    return /*html*/`
      <form action="" method="get" class="search">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
          <path d="M15.28 5.22a.75.75 0 0 1 0 1.06L9.56 12l5.72 5.72a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 1.06 0Z"></path>
        </svg>
        <div class="contents">
          <input type="text" name="q" id="query" placeholder="Search shots" autocomplete="off" />
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11.7666" cy="11.7667" r="8.98856" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"  stroke-linejoin="round" />
            <path d="M18.0183 18.4853L21.5423 22.0001" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <button type="submit">Search</button>
        </div>
      </form>
    `
  }

  getShots = () => {
    return /* html */`
      <div is="shot-video" link="/static/shots/shot2.m3u8" thumb="/static/thumbs/thum.webp"></div>
      <div is="shot-video" link="https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8" thumb="/static/thumbs/thum.webp"></div>
      <div is="shot-video" link="/static/shots/shot9.m3u8" thumb="/static/thumbs/thum.webp"></div>
      <div is="shot-video" link="/static/shots/shot4.m3u8" thumb="/static/thumbs/thum.webp"></div>
      <div is="shot-video" link="/static/shots/shot5.m3u8" thumb="/static/thumbs/thum.webp"></div>
      <div is="shot-video" link="/static/shots/shot6.m3u8" thumb="/static/thumbs/thum.webp"></div>
      <div is="shot-video" link="/static/shots/shot8.m3u8" thumb="/static/thumbs/thum.webp"></div>
      <div is="shot-video" link="/static/shots/shot7.m3u8" thumb="/static/thumbs/thum.webp"></div>
      <div is="shot-video" link="https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8" thumb="/static/thumbs/thum.webp"></div>
    `;
  }

  getStyles = () => {
    return /* css */`
      <style>
        :host {
          border: 1px solid blue;
          display: flex;
          max-width: 100%;
          width: 100%;
          min-width: 100%;
          padding: 0;
          height: 100dvh;
          max-height: 100dvh;
          min-height: 100dvh;
          display: flex;
          flex-flow: row;
          align-items: start;
          justify-content: space-between;
          gap: 20px;
        }

        * {
          box-sizing: border-box;
          font-family: var(--font-main), sans-serif;
        }

        section.shots-container {
          /* border: 1px solid red; */
          display: block;
          max-width: 450px;
          width: 450px;
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: start;
          justify-content: start;
          height: 100%;
          max-height: 100%;
          min-height: 100%;
          position: relative;
        }

        section.info-container {
          border: 1px solid red;
          display: block;
          max-width: calc(100% - 470px);
          width: calc(100% - 470px);
          padding: 0;
          display: flex;
          flex-direction: column;
          align-items: start;
          justify-content: start;
          height: 100%;
          max-height: 100%;
          min-height: 100%;
          position: relative;
        }

        div.shots {
          /* border: 2px solid pink; */
          width: 100%;
          max-width: 100%;
          height: 100%;
          min-height: 100%;
          max-height:  100%;
          overflow-y: scroll;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
          -ms-overflow-style: -ms-autohiding-scrollbar;
          scroll-snap-type: y mandatory;
        }

        div.shots > div {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }

        div.shots::-webkit-scrollbar {
          display: none !important;
          visibility: hidden !important;
        }

        form.search {
          background: transparent;
          padding: 0;
          margin: 0;
          padding: 10px 10px;
          display: flex;
          flex-flow: column;
          align-items: start;
          flex-wrap: nowrap;
          gap: 5px;
          z-index: 6;
          width: 100%;
          position: absolute;
          top: 0;

          /* blur background 
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);*/
        }

        form.search > svg {
          position: absolute;
          display: none;
          left: -12px;
          top: calc(50% - 15px);
          color: var(--text-color);
          cursor: pointer;
          width: 40px;
          height: 40px;
        }

        form.search > svg:hover {
          color: var(--accent-color);
        }

        form.search > .contents {
          background: transparent;
          padding: 0;
          display: flex;
          flex-flow: row;
          align-items: center;
          flex-wrap: nowrap;
          gap: 0;
          margin: 0;
          width: 100%;
          position: relative;
        }

        form.search > .contents > input {
          border: var(--input-border);
          background: transparent;
          display: flex;
          flex-flow: row;
          align-items: center;
          outline: none;
          font-family: var(--font-text);
          color: var(--title-color);
          font-size: 1rem;
          padding: 8px 10px 8px 35px;
          gap: 0;
          width: 100%;
          border-radius: 15px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        form.search > .contents > input:-webkit-autofill,
        form.search > .contents > input:-webkit-autofill:hover, 
        form.search > .contents > input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px transparent inset;
          -webkit-text-fill-color: var(--text-color) !important;
          transition: background-color 5000s ease-in-out 0s;
          color: var(--title-color) !important;
        }
        
        form.search > .contents > input:autofill {
          filter: none;
          color: var(--title-color) !important;
        }

        form.search > .contents > input::placeholder {
          color: var(--text-color);
          font-family: var(--font-text), sans-serif;
          font-size: 1rem;
          opacity: 0.8;
        }

        form.search > .contents > input:focus {
          border: var(--input-border-focus);
          background: transparent;
        }

        form.search > .contents > svg {
          position: absolute;
          height: 18px;
          color: var(--text-color);
          width: 18px;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
        }

        form.search > .contents > button {
          position: absolute;
          right: 10px;
          top: calc(50% - 14px);
          border: none;
          cursor: pointer;
          color: var(--white-color);
          background: var(--accent-linear);
          height: 28px;
          width: max-content;
          padding: 0 10px;
          font-size: 0.9rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        @media screen and (max-width: 660px) {
          :host {
            flex-flow: column;
            gap: 0;
            width: calc(100% + 20px);
            min-width: calc(100% + 20px);
            margin: 0 -10px;
          }

          section.shots-container {
            border: none;
            max-width: 100dvw;
            width: 100dvw;
            min-width: 100dvw;
            padding: 0;
            height: calc(100dvh - 55px);
            max-height: calc(100dvh - 55px);
            min-height: calc(100dvh - 55px);
          }

          div.shots {
            width: 100%;
            max-width: 100%;
            height: 100%;
            max-height: 100%;
          }

          form.search {
            padding: 10px;
          }

          form.search > .contents {
            padding: 0;
            display: flex;
            flex-flow: row;
            align-items: center;
            flex-wrap: nowrap;
            gap: 0;
            margin: 0 0 0 20px;
            width: calc(100% - 20px);
            position: relative;
          }

          form.search > svg {
            position: absolute;
            display: flex;
            left: -10px;
            margin: 0 0 0 5px;
            top: calc(50% - 20px);
            color: var(--text-color);
            cursor: pointer;
            width: 40px;
            height: 40px;
          }
        }
      </style>
    `;
  }
}