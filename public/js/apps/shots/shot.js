export default class ShotVideo extends HTMLDivElement {
  constructor() {
    super();
    this.video = this.getAttribute('link');
    this.thumbnail = this.getAttribute('thumb');
    this.shadow = this.attachShadow({ mode: 'open' });
    this.quality = 'auto';
    this.isVisible = false;
    this.currentHls = null;
    this.hasThumbnail = true;
    this.wasPlaying = false; // Track if video was playing before tab switch
    this.render();
    
    // Binding methods
    this.handleIntersection = this.handleIntersection.bind(this);
    this.handleVideoEnd = this.handleVideoEnd.bind(this);
    this.togglePlayPause = this.togglePlayPause.bind(this);
    this.handleNetworkChange = this.handleNetworkChange.bind(this);
    this.handleVideoLoad = this.handleVideoLoad.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  }

  async connectedCallback() {
    this.setupIntersectionObserver();
    this.setupEventListeners();
    this.setupNetworkObserver();
    this.setupVisibilityObserver();
    await this.initializeHls();

    // check if the current video is in the viewport
    const videoElement = this.shadow.querySelector('video');
    if (videoElement) {
      const rect = videoElement.getBoundingClientRect();
      if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
        this.isVisible = true;
        videoElement.play().catch(error => {
          console.warn('Autoplay was prevented:', error);
        });
      }
    }
  }

  disconnectedCallback() {
    this.observer.disconnect();
    this.cleanup();
    // Remove visibility change listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  setupVisibilityObserver() {
    // Add visibility change listener
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  handleVisibilityChange() {
    const videoElement = this.shadow.querySelector('video');
    
    if (document.hidden) {
      // Tab is hidden
      this.wasPlaying = !videoElement.paused;
      if (!videoElement.paused) {
        videoElement.pause();
      }
      
      // If using HLS, we can reduce buffer size to save memory
      if (this.currentHls) {
        this.currentHls.config.maxBufferLength = 2;
      }
    } else {
      // Tab is visible again
      if (this.wasPlaying && this.isVisible) {
        videoElement.play().catch(error => {
          console.warn('Failed to resume playback:', error);
        });
      }
      
      // Restore normal buffer size
      if (this.currentHls) {
        this.currentHls.config.maxBufferLength = 30;
      }
    }
  }

  setupEventListeners() {
    const videoElement = this.shadow.querySelector('video');
    const videoContainer = this.shadow.querySelector('.video-container');
    
    videoElement.addEventListener('ended', this.handleVideoEnd);
    videoElement.addEventListener('waiting', this.showLoading);
    videoElement.addEventListener('canplay', this.hideLoading);
    videoElement.addEventListener('loadeddata', this.handleVideoLoad);
    videoContainer.addEventListener('click', this.togglePlayPause);
    videoElement.addEventListener('error', this.handleVideoError.bind(this));

    // Add blur/focus handlers for window
    window.addEventListener('blur', () => {
      if (!videoElement.paused) {
        this.wasPlaying = true;
        videoElement.pause();
      }
    });

    window.addEventListener('focus', () => {
      if (this.wasPlaying && this.isVisible && !document.hidden) {
        videoElement.play().catch(error => {
          console.warn('Failed to resume playback:', error);
        });
      }
    });
  }

  handleVideoLoad() {
    if (this.hasThumbnail) {
      const thumbnailContainer = this.shadow.querySelector('.thumbnail');
      if (thumbnailContainer) {
        thumbnailContainer.style.display = 'none';
        // adjust video opacity
        const videoElement = this.shadow.querySelector('video');

        videoElement.classList.add('loaded');
      }
    }
  }

  async initializeHls() {
    try {
      if (Hls.isSupported()) {
        this.currentHls = new Hls({
          maxBufferSize: 0,
          maxBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: true,
          progressive: true,
          startLevel: -1, // Auto quality selection
          // Add adaptive quality settings
          autoLevelCapping: -1,
          autoLevelEnabled: true,
          abrEwmaDefaultEstimate: 500000,
          abrEwmaFastLive: 3,
          abrEwmaSlowLive: 9,
        });

        const videoElement = this.shadow.querySelector('video');
        this.currentHls.loadSource(this.video);
        this.currentHls.attachMedia(videoElement);

        // Handle quality changes
        this.currentHls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          console.log(`Quality changed to level: ${data.level}`);
        });

        // Handle quality loading
        this.currentHls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          const qualities = data.levels.map(level => ({
            bitrate: level.bitrate,
            width: level.width,
            height: level.height,
          }));
          // console.log('Available qualities:', qualities);
          this.adjustQualityBasedOnNetwork();
        });

      } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for Safari
        const videoElement = this.shadow.querySelector('video');
        videoElement.src = this.video;
      }
    } catch (error) {
      console.warn('HLS initialization failed, falling back to native video:', error);
      const videoElement = this.shadow.querySelector('video');
      videoElement.src = this.video;
    }
  }

  setupNetworkObserver() {
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', this.handleNetworkChange);
    }
    this.adjustQualityBasedOnNetwork();
  }

  adjustQualityBasedOnNetwork() {
    if (!this.currentHls || !navigator.connection) return;
    
    const connection = navigator.connection;
    const effectiveType = connection.effectiveType;
    const downlink = connection.downlink; // Mbps

    // Adjust quality based on network conditions
    if (effectiveType === '4g' && downlink > 5) {
      this.currentHls.autoLevelCapping = -1; // Allow all qualities
    } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 2)) {
      // Cap at middle quality
      const middleLevel = Math.floor(this.currentHls.levels.length / 2);
      this.currentHls.autoLevelCapping = middleLevel;
    } else {
      // Use lowest quality for slow connections
      this.currentHls.autoLevelCapping = 0;
    }
  }

  handleNetworkChange() {
    this.adjustQualityBasedOnNetwork();
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(this.handleIntersection, {
      threshold: 0.5,
      rootMargin: '50px 0px'
    });
    this.observer.observe(this);
  }

  handleVideoError(error) {
    console.error('Video playback error:', error);
    this.hideLoading();
    // Implement retry logic or fallback
    // retry after 5 seconds
    setTimeout(() => {
      this.currentHls.startLoad();
    }, 5000);
  }

  cleanup() {
    if (this.currentHls) {
      this.currentHls.destroy();
      this.currentHls = null;
    }

    const videoElement = this.shadow.querySelector('video');
    if (videoElement) {
      videoElement.removeAttribute('src');
      videoElement.load();
    }

    if ('connection' in navigator) {
      navigator.connection.removeEventListener('change', this.handleNetworkChange);
    }

    // Remove window blur/focus listeners
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    
    // Remove visibility change listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  render() {
    this.shadow.innerHTML = this.getTemplate();
  }

  withCommas = x => {
		return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

  showLoading = () => {
    const loadingIcon = this.shadow.querySelector('.loading-icon');
    if (loadingIcon) loadingIcon.style.display = 'flex';
  }

  hideLoading = () => {
    const loadingIcon = this.shadow.querySelector('.loading-icon');
    if (loadingIcon) loadingIcon.style.display = 'none';
  }

  togglePlayPause() {
    const videoElement = this.shadow.querySelector('video');
    if (videoElement.paused) {
      videoElement.play().catch(error => {
        console.warn('Play was prevented:', error);
      });
    } else {
      videoElement.pause();
    }
  }

  handleIntersection(entries) {
    const [entry] = entries;
    const videoElement = this.shadow.querySelector('video');

    this.isVisible = entry.isIntersecting;

    if (entry.isIntersecting && !document.hidden) {
      videoElement.play().catch(error => {
        console.warn('Autoplay was prevented:', error);
      });
    } else {
      videoElement.pause();
    }
  }

  handleVideoEnd() {
    const videoElement = this.shadow.querySelector('video');
    
    // Check if still in viewport before replaying
    const entries = this.observer.takeRecords();
    const [entry] = entries;

    if (!entries.length || entry.isIntersecting) {
      videoElement.currentTime = 0;
      videoElement.play();
    }
  }

  formatNumber = str => {
    try {
      const num = parseInt(str);

      // if number is not a number return 0
      if(isNaN(num)) return '0';

      // less than a thousand: return the number
			if (num < 1000) return num;
			
			// less than a 10,000: return the number with a k with two decimal places
			if (num < 10000) return this.withCommas(num);
			
			// less than a 100,000: return the number with a k with one decimal place
			if (num < 100000) return `${(num / 1000).toFixed(1)}k`;
			
			// less than a million: return the number with a k with no decimal places
			if (num < 1000000) return `${Math.floor(num / 1000)}k`;
			
			// less than a 10 million: return the number with an m with two decimal places
			if (num < 10000000) return `${(num / 1000000).toFixed(2)}M`;
			
			// less than a 100 million: return the number with an m with one decimal place
			if (num < 100000000) return `${Math.floor(num / 1000000)}M`;
			
			// less than a billion: return the number with an m with no decimal places
			if (num < 1000000000) return `${Math.floor(num / 1000000)}M`;
			
			// a billion or more: return the number with a B+
			if (num >= 1000000000) return `${Math.floor(num / 1000000000)}B+`;
	
    } catch (error) {
      return '0'
    }
  }

  getTemplate() {
    return /* html */`
      ${this.getVideoContainer()}
      ${this.getActions()}
      ${this.getFooter()}
      ${this.getStyles()}
    `;
  }

  getVideoContainer() {
    return /* html */`
      <div class="video-container">
        ${this.hasThumbnail ? this.getThumbnail() : ''}
        ${this.getLoader()}
        <video 
          width="100%" 
          preload="metadata"
          playsinline
          poster="${this.thumbnail}"
          disablePictureInPicture>
        </video>
      </div>
    `;
  }

  getLoader() {
    return /* html */`
      <div class="loading-icon">
        <span id="btn-loader">
          <span class="loader-alt"></span>
        </span>
      </div>
    `
  }

  getThumbnail() {
    return /* html */`
      <div class="thumbnail">
        <img src="${this.thumbnail}" alt="Video thumbnail" />
      </div>
    `;
  }

  getFooter = () => {
    return /* html */`
      <div class="footer">
        ${this.getUser()}
        ${this.getSummary()}
      </div>
    `;
  }

  getUser = () => {
    return /* html */`
      <div class="user">
        <span class="avatar">
        <!-- <img src="https://avatar.iran.liara.run/public/22" alt="Avatar" /> -->
          <img src="https://xsgames.co/randomusers/avatar.php?g=female" alt="Avatar" />
        </span>
        <span class="info">
          <span class="name">Janet Johnson</span>
          <span class="username">UBA6J8HC532</span>
        </span>
      </div>
    `;
  }

  getSummary = () => {
    return /* html */`
      <div class="summary">
        <span class="summary-text">
          This is a new summary text about the following shot, I wrote it. it represnt the content of the shot in a few lines.
        </span>
        <span class="read-more">Read more</span>
      </div>
    `;
  }

  getActions = () => {
    return /* html */`
      <span class="actions">
        <span class="action like active">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M19.4626 3.99415C16.7809 2.34923 14.4404 3.01211 13.0344 4.06801C12.4578 4.50096 12.1696 4.71743 12 4.71743C11.8304 4.71743 11.5422 4.50096 10.9656 4.06801C9.55962 3.01211 7.21909 2.34923 4.53744 3.99415C1.01807 6.15294 0.221721 13.2749 8.33953 19.2834C9.88572 20.4278 10.6588 21 12 21C13.3412 21 14.1143 20.4278 15.6605 19.2834C23.7783 13.2749 22.9819 6.15294 19.4626 3.99415Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </span>
          <span class="number">${this.formatNumber(97641)}</span>
        </span>
        <span class="action comment">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M20 9C19.2048 5.01455 15.5128 2 11.0793 2C6.06549 2 2 5.85521 2 10.61C2 12.8946 2.93819 14.9704 4.46855 16.5108C4.80549 16.85 5.03045 17.3134 4.93966 17.7903C4.78982 18.5701 4.45026 19.2975 3.95305 19.9037C5.26123 20.1449 6.62147 19.9277 7.78801 19.3127C8.20039 19.0954 8.40657 18.9867 8.55207 18.9646C8.65392 18.9492 8.78659 18.9636 9 19.0002" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M11 16.2617C11 19.1674 13.4628 21.5234 16.5 21.5234C16.8571 21.5238 17.2132 21.4908 17.564 21.425C17.8165 21.3775 17.9428 21.3538 18.0309 21.3673C18.119 21.3807 18.244 21.4472 18.4938 21.58C19.2004 21.9558 20.0244 22.0885 20.8169 21.9411C20.5157 21.5707 20.31 21.1262 20.2192 20.6496C20.1642 20.3582 20.3005 20.075 20.5046 19.8677C21.4317 18.9263 22 17.6578 22 16.2617C22 13.356 19.5372 11 16.5 11C13.4628 11 11 13.356 11 16.2617Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="number">${this.formatNumber(3487)}</span>
        </span>
        <span class="action bookmark">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M4 17.9808V9.70753C4 6.07416 4 4.25748 5.17157 3.12874C6.34315 2 8.22876 2 12 2C15.7712 2 17.6569 2 18.8284 3.12874C20 4.25748 20 6.07416 20 9.70753V17.9808C20 20.2867 20 21.4396 19.2272 21.8523C17.7305 22.6514 14.9232 19.9852 13.59 19.1824C12.8168 18.7168 12.4302 18.484 12 18.484C11.5698 18.484 11.1832 18.7168 10.41 19.1824C9.0768 19.9852 6.26947 22.6514 4.77285 21.8523C4 21.4396 4 20.2867 4 17.9808Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span class="number">${this.formatNumber(394)}</span>
        </span>
        <span class="action share">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M11.922 4.79004C16.6963 3.16245 19.0834 2.34866 20.3674 3.63261C21.6513 4.91656 20.8375 7.30371 19.21 12.078L18.1016 15.3292C16.8517 18.9958 16.2267 20.8291 15.1964 20.9808C14.9195 21.0216 14.6328 20.9971 14.3587 20.9091C13.3395 20.5819 12.8007 18.6489 11.7231 14.783C11.4841 13.9255 11.3646 13.4967 11.0924 13.1692C11.0134 13.0742 10.9258 12.9866 10.8308 12.9076C10.5033 12.6354 10.0745 12.5159 9.21705 12.2769C5.35111 11.1993 3.41814 10.6605 3.0909 9.64127C3.00292 9.36724 2.97837 9.08053 3.01916 8.80355C3.17088 7.77332 5.00419 7.14834 8.6708 5.89838L11.922 4.79004Z" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </span>
          <span class="number">${this.formatNumber(718)}</span>
        </span>
        <span class="action more">
          <span class="icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none">
              <path d="M15.5 6.5C15.5 8.433 13.933 10 12 10C10.067 10 8.5 8.433 8.5 6.5C8.5 4.567 10.067 3 12 3C13.933 3 15.5 4.567 15.5 6.5Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M22 17.5C22 19.433 20.433 21 18.5 21C16.567 21 15 19.433 15 17.5C15 15.567 16.567 14 18.5 14C20.433 14 22 15.567 22 17.5Z" stroke="currentColor" stroke-width="1.5" />
              <path d="M9 17.5C9 19.433 7.433 21 5.5 21C3.567 21 2 19.433 2 17.5C2 15.567 3.567 14 5.5 14C7.433 14 9 15.567 9 17.5Z" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </span>
        </span>
      </span>
    `
  }

  getStyles = () => {
    return /* css */`
      <style> 
        :host {
          /* border: 2px solid green; */
          display: block;
          width: 100%;
          max-width: 100%;
          height: 100%;
          max-height: 100%;
          min-height: 100%;
          display: flex;
          gap: 10px;
          padding: 0;
          flex-direction: column;
          justify-content: space-between;
          align-items: start;
          justify-content: flex-end;
          position: relative;
          background: var(--shot-linear-gradient);
          overflow: hidden;
        }

        * {
          box-sizing: border-box;
          font-family: var(--font-main), sans-serif;

          /* disable user selection */
          user-select: none;
        }

        .footer {
          z-index: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: start;
          padding: 0 60px 10px 10px;
          background: var(--shot-linear-gradient);
        }

        .footer > .topics {
          margin: 0 0 10px 0;
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 1rem;
          overflow-x: scroll;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .footer > .topics::-webkit-scrollbar {
          display: none;
          visiblity: hidden;
        }

        .footer > .topics > .topic {
          background: var(--accent-linear);
          color: var(--white-color);
          padding: 4px 8px;
          border-radius: 8px;
          font-family: var(--font-read), sans-serif;
          font-size: 1rem;
          border: none;
        }

        .footer > .user {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          width: 100%;
          gap: 10px;
          margin: 0 0 10px 0;
        }

        .footer > .user > .avatar {
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 0 0 5px #00000033;
        }

        .footer > .user > .avatar > img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .footer > .user > .info {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
          margin: 0;
        }

        .footer > .user > .info > .name {
          font-size: 1rem;
          font-weight: 500;
          font-family: var(--font-main), sans-serif;
          color: var(--white-color);
          text-shadow: 0 0 2px #00000033;
        }

        .footer > .user > .info > .username {
          font-size: 0.85rem;
          color: var(--shot-title-color);
          font-family: var(--font-mono), monospace;
          text-shdow: 0 0 2px #00000033;
        }

        .footer > .summary {
          display: inline;
          width: 100%;
          margin: 0;
          font-size: 0.95rem;
          color: var(--shot-title-color);
          font-family: var(--font-read), sans-serif;
        }

        .footer > .summary > .summary-text {
          font-family: var(--font-read), sans-serif;
          text-shadow: 0 0 2px #00000033;
        }

        .footer > .summary > .read-more {
          color: var(--accent-color);
          cursor: pointer;
          text-transform: lowercase;
          text-shadow: 0 0 2px #00000033;
        }

        /* Actions */
        .actions {
          z-index: 2;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          position: absolute;
          bottom: 10px;
          right: 5px;
          width: 50px;
          max-width: 50px;
        }

        .actions > .action {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 5px;
          padding: 0.5rem;
          cursor: pointer;
        }

        .actions > .action > .icon {
          box-shadow: 0 0 5px #00000033;
          width: 40px;
          height: 40px;
          min-width: 40px;
          min-height: 40px;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: var(--shot-background);
          background-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
        }

        .actions > .action.active > .icon {
          background-color: var(--shot-active-background);
          color: var(--alt-color);
        }

        .actions > .action > .icon > svg {
          width: 20px;
          height: 20px;
          color: var(--shot-title-color);
        }

        .actions > .action.active > .icon > svg {
          color: var(--alt-color);
        }

        .actions > .action.active > .icon > svg path {
          fill: var(--alt-color);
          color: var(--alt-color);
        }

        .actions > .action > .number {
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--white-color);
          text-shadow: 0 0 2px #00000033;
        }

        .video-container {
          z-index: 0;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loading-icon {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          width: 100%;
          display: none;
          justify-content: center;
          align-items: center;
          background-color: rgba(0,0,0,0.5);
          z-index: 3;
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

        video {
          position: absolute;
          right: 0;
          left: 0;
          width: 100%;
          min-width: 100%;
          height: auto;
          max-height: 100%;
          object-fit: cover;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease-in-out;
        }

        .thumbnail {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          background: var(--background);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        video.loaded {
          opacity: 1;
        }

        @media screen and (max-width: 660px) {
          :host {
            height: 100%;
            max-height: 100%;
            min-height: 100%;
          }

          /* reset all cursor: pointer to default !important */
          a, button, input, label, select, textarea,
          .actions > .action,
          .footer > .summary > .read-more {
            cursor: default !important;
          }
        }

      </style>
    `
  }
}