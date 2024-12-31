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
      <div class="shots">
        ${this.getShots()}
      </div>
      ${this.getStyles()}
    `;
  }

  getShots = () => {
    return /* html */`
      <div is="shot-video" link="../shots/shot4.m3u8" thumb="../thumbs/thum.webp"></div>
      <div is="shot-video" link="https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8" thumb="../thumbs/thum.webp"></div>
      <div is="shot-video" link="../shots/shot9.m3u8" thumb="../thumbs/thum.webp"></div>
      <div is="shot-video" link="../shots/shot4.m3u8" thumb="../thumbs/thum.webp"></div>
      <div is="shot-video" link="../shots/shot5.m3u8" thumb="../thumbs/thum.webp"></div>
      <div is="shot-video" link="../shots/shot6.m3u8" thumb="../thumbs/thum.webp"></div>
      <div is="shot-video" link="../shots/shot8.m3u8" thumb="../thumbs/thum.webp"></div>
      <div is="shot-video" link="../shots/shot7.m3u8" thumb="../thumbs/thum.webp"></div>
      <div is="shot-video" link="https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8" thumb="../thumbs/thum.webp"></div>
    `;
  }

  getStyles = () => {
    return /* css */`
      <style>
        :host {
          border: 1px solid red;
          display: block;
          max-width: 450px;
          width: 450px;
          padding: 39px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: start;
          height: 100dvh;
          max-height: 100dvh;
          min-height: 100dvh;
        }

        * {
          box-sizing: border-box;
          font-family: var(--font-main), sans-serif;
        }

        div.shots {
          width: 100%;
          max-width: 100%;
          height: 100%;
          min-height: 100%;
          max-height: 100%;
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

        @media screen and (max-width: 660px) {
          :host {
            width: 100dvw;
            margin: 0 -10px;
            border: none;
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
        }
      </style>
    `;
  }
}