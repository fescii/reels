// src/router.js
export default class Router {
  constructor() {
    this.routes = new Map();
    this.currentState = null;
  }

  addRoute(path, state) {
    this.routes.set(path, state);
  }

  init() {
    this.handleRouting();
    window.addEventListener('popstate', (event) => {
      this.currentState = event.state;
      this.handleRouting();
    });
  }

  handleRouting() {
    const path = window.location.pathname;
    const route = this.routes.get(path) || this.routes.get('/');
    const content = document.getElementById('app-content');
    
    if (route) {
      const previousContent = content.innerHTML;
      content.innerHTML = route.component;

      this.currentState = {
        ...route.state,
        previousContent
      };
    }
  }

  pushState(url, state = {}) {
    const newState = {
      ...state,
      previousContent: document.getElementById('app-content').innerHTML
    };
    
    history.pushState(newState, null, url);
    this.currentState = newState;
  }

  navigateTo(url, state = {}) {
    this.pushState(url, state);
    this.handleRouting();
  }
}