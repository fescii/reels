// import Router from "./router.js";
import app from "./apps/index.js";
export default class App extends HTMLElement {
	constructor() {
		super();
		this.registerComponents();
	}
	
	// noinspection JSUnusedGlobalSymbols
	connectedCallback() {
		this.render();
	}
	
	addRoute(path, state) {
		this.routes.set(path, state);
	}
	
	getRoute(path) {
		return this.routes.get(path);
	}
	
	registerComponents() {
		app('Apps registered');
	}
	
	render() {
		// this.innerHTML = this.getRoute(window.location.pathname);
		this.innerHTML = '<app-main></app-main>';
	}
	
	initializeRoutes() {
		this.addRoute('/', '<app-main></app-main>');
		this.addRoute('/about', '<about-page>About page</about-page>');
		this.addRoute('/contact', '<contact-page>Contact page</contact-page>');
	}
}