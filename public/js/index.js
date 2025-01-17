import app from './app.js';
export default function createApp(node) {
	customElements.define('main-app', app);
	const appElement = document.createElement('main-app');
	window.app = appElement;
	node.appendChild(appElement);
	
	// add app to widow object
	window.app = appElement;
	
	return appElement;
}