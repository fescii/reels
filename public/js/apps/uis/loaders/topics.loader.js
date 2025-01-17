export default class TopicsLoader extends HTMLElement {
	constructor() {
		// We are not even going to touch this.
		super();

		// let's create our shadow root
		this.shadowObj = this.attachShadow({ mode: "open" });

		this.render();
	}

	render() {
		this.shadowObj.innerHTML = this.getTemplate();
	}

	connectedCallback() {
		
	}

	getTemplate() {
		// Show HTML Here
		return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
	}

	getBody() {
		return `
      <span class="topic one skeleton"></span>
      <span class="topic two skeleton"></span>
      <span class="topic three skeleton"></span>
      <span class="topic four skeleton"></span>
      <span class="topic five skeleton"></span>
      <span class="topic six skeleton"></span>
      <span class="topic seven skeleton"></span>
      <span class="topic eight skeleton"></span>
      <span class="topic nine skeleton"></span>
      <span class="topic ten skeleton"></span>
      <span class="topic eleven skeleton"></span>
    `;
	}

	getStyles() {
		return /* css */`
	    <style>
	      *,
	      *:after,
	      *:before {
	        box-sizing: border-box !important;
	        font-family: inherit;
	        -webkit-box-sizing: border-box !important;
	      }
	
	      :host {
        	font-size: 16px;
					padding: 8px 0 0;
					display: flex;
					flex-flow: row;
					flex-wrap: wrap;
					gap: 15px;
					width: 100%;
				}
					
				.topic {
					display: inline-block;
					width: 25%;
					height: 17px;
					border-radius: 50px;
					-webkit-border-radius: 50px;
					-moz-border-radius: 50px;
				}
					
				.topic:nth-of-type(odd) {
					width: 20%;
				}
					
				.topic.seven,
				.topic.five {
					width: 40%;
				}
					
				.skeleton {
					background: var(--loader-gradient);
					background-size: 500% 500%;
					-webkit-animation: Gradient 2.25s ease infinite;
					-moz-animation: Gradient 2.25s ease infinite;
					animation: Gradient 2.25s ease infinite;
				}
					
				@keyframes Gradient {
					0% {
						background-position: 0 25%;
					}
					50% {
						background-position: 25% 50%;
					}
					75% {
						background-position: 50% 75%;
					}
					100% {
						background-position: 75% 100%;
					}
				}
	    </style>
    `;
	}
}