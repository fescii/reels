class HistoryManager {
  constructor() {
    // Store reference to the app object
    this.app = window.app;

    // Bind methods to ensure correct 'this' context
    this.handlePopState = this.handlePopState.bind(this);
    this.handleUIUpdate = this.handleUIUpdate.bind(this);

    // Add popstate event listener
    window.addEventListener('popstate', this.handlePopState);
  }

  /**
   * Navigate to a new URL and add it to history
   * @param {string} url - The URL to navigate to
   * @param {Object} state - State object to store with history entry
   * @param {string} title - Title for the new history entry
   */
  push(url, state = {}, title = '') {
    window.history.pushState(state, title, url);
    this.handleUIUpdate({ url, state });
  }

  /**
   * Replace current history entry with new URL
   * @param {string} url - The URL to navigate to
   * @param {Object} state - State object to store with history entry
   * @param {string} title - Title for the new history entry
   */
  replace(url, state = {}, title = '') {
    window.history.replaceState(state, title, url);
    this.handleUIUpdate({ url, state });
  }

  /**
   * Go back in history
   * @param {number} steps - Number of steps to go back (default: 1)
   */
  back(steps = 1) {
    window.history.go(-steps);
  }

  /**
   * Go forward in history
   * @param {number} steps - Number of steps to go forward (default: 1)
   */
  forward(steps = 1) {
    window.history.go(steps);
  }

  /**
   * Handle UI updates based on navigation events
   * @private 
   * @param {Object} data - Navigation event data
   */
  handleUIUpdate({ url, state }) {
    if (this.app && typeof this.app.updateUI === 'function') {
      // Extract route information from URL
      const route = new URL(url, window.location.origin).pathname;

      // Call app's updateUI method with relevant data
      this.app.updateUI({
        route,
        state,
        url,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Get current history state
   * @returns {Object} Current history state
   */
  getCurrentState() {
    return window.history.state;
  }

  /**
   * Get current URL
   * @returns {string} Current URL
   */
  getCurrentUrl() {
    return window.location.href;
  }

  /**
   * Handle popstate events
   * @private
   * @param {PopStateEvent} event - PopState event object
   */
  handlePopState(event) {
    this.handleUIUpdate({
      state: event.state,
      url: window.location.href
    });
  }

  /**
   * Clean up by removing event listeners
   */
  destroy() {
    window.removeEventListener('popstate', this.handlePopState);
  }
}