export default class HomeAll extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });
    this.app = window.app;
    this.api = this.app.api;
    this.loadedComponents = 0;
    this.componentUrls = [];
    // Add a home object property that child components can access
    this.home = {
      last: false,
      next: 1,
      loaded: false
    };
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const trending = this.getAttribute('trending');
    const people = this.getAttribute('people');
    const recent = this.getAttribute('recent');
    const feed = this.getAttribute('feed');

    this.componentUrls = [
      { component: 'posts-container', url: trending },
      { component: 'discover-people', url: people },
      { component: 'posts-container', url: recent },
      { component: 'posts-feed', url: feed, page: "2" }
    ];
    
    // Start loading the first component immediately
    this.loadNextComponent();
    
    // Set up polling to check for loaded components
    this.checkComponentsInterval = setInterval(() => this.checkLoadedComponents(), 500);
  }

  disconnectedCallback() {
    this.enableScroll();
    window.onscroll = null;
    if (this.checkComponentsInterval) {
      clearInterval(this.checkComponentsInterval);
    }
  }
  
  checkLoadedComponents() {
    // Check if the current component has been loaded successfully
    if (this.loadedComponents < this.componentUrls.length) {
      const container = this.shadowObj.querySelector('.feeds');
      const currentComponentInfo = this.componentUrls[this.loadedComponents];
      const currentComponent = container.querySelector(`${currentComponentInfo.component}[data-loaded="true"]`);
      
      if (currentComponent) {
        console.log(`Component loaded successfully: ${currentComponentInfo.component}`);
        this.loadedComponents++;
        
        // Load the next component if there are more
        if (this.loadedComponents < this.componentUrls.length) {
          this.loadNextComponent();
        } else {
          // All components loaded, clear the interval
          clearInterval(this.checkComponentsInterval);
        }
      }
    } else {
      // All components loaded, clear the interval
      clearInterval(this.checkComponentsInterval);
    }
  }

  loadNextComponent() {
    if (this.loadedComponents >= this.componentUrls.length) return;
    
    const container = this.shadowObj.querySelector('.feeds');
    const currentComponent = this.componentUrls[this.loadedComponents];
    
    console.log(`Loading component ${this.loadedComponents + 1}/${this.componentUrls.length}: ${currentComponent.component}`);
    console.log(`URL for component: ${currentComponent.url}`);
    
    // Create the component HTML with a data-loaded attribute initialized to false
    const component = /* html */`
      <${currentComponent.component} 
        url="${currentComponent.url}" 
        page="${currentComponent.page || ''}"
        data-loaded="false"
      ></${currentComponent.component}>
    `;
    
    // Add component to the DOM
    container.insertAdjacentHTML('beforeend', component);
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

  getTemplate = () => {
    // Show HTML Here
    return /* html */`
      ${this.getBody()}
      <link rel="stylesheet" href="/static/css/app/home/all.css">
    `;
  }

  getBody = () => {
    return /* html */`
      <div class="feeds">
        <!-- Components will be loaded sequentially here -->
      </div>
    `;
  }
}