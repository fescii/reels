// import Router from "./router.js";
import app from "./apps/index.js";
import APIManager from "./api.js";
export default class App extends HTMLElement {
	constructor() {
		super();
		this.preferences();
		this.registerComponents();
		// this.api = new APIManager('https://api.zoanai.com');
		this.api = new APIManager('/api/v1', 9500, 'v1');
		// this.api = new APIManager('http://localhost:3000');
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

	// set hash if user is logged
	setHash = name => {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);

		const cookie = parts.length === 2 ? parts.pop().split(';').shift() : null;

		// add cookie to the window
		window.hash = cookie;
	}

	setTheme = currentTheme =>{
		// Check the current theme
		const htmlElement = document.documentElement;
		const metaThemeColor = document.querySelector("meta[name=theme-color]");

		// Check if the current theme is: system
		if (currentTheme === 'system') {
			// Update the data-theme attribute
			htmlElement.setAttribute('data-theme', currentTheme);

			// Store the preference in local storage
			localStorage.setItem('theme', 'system');

			// Update the theme-color meta tag
			metaThemeColor.setAttribute("content", currentTheme === 'dark' ? '#000000' : '#ffffff');
			return;
		}
		
		// Update the data-theme attribute
		htmlElement.setAttribute('data-theme', currentTheme);
		
		// Store the preference in local storage
		localStorage.setItem('theme', currentTheme);

		// Update the theme-color meta tag
		metaThemeColor.setAttribute("content", currentTheme === 'dark' ? '#000000' : '#ffffff');
	}
	
	preferences() {
		const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

		// listen for theme change
		prefersDarkScheme.addEventListener('change', (event) => {
			// get local storage theme
			const currentTheme = localStorage.getItem('theme') || 'light';

			// if the theme is system
			if (currentTheme === 'system') {
				// set the theme
				setTheme('system');
				return;
			}
		})

		// get theme from local storage
		const currentTheme = localStorage.getItem('theme') || 'light';

		// set the theme
		this.setTheme(currentTheme);

		// set hash
		this.setHash('hash');
	}
}