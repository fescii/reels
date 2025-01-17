export default class HoverLoader extends HTMLElement {
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
      <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
        <span class="stats">
          <span class="followers skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="following skeleton"></span>
        </span>
        <span class="text">
          <span class="name skeleton"></span>
          <span class="name skeleton"></span>
          <span class="followers skeleton"></span>
        </span>
        <div class="actions">
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
        </div>
      </div>
    `;
	}

	getStyles() {
		return /*css*/`
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
					display: flex;
					flex-flow: column;
					padding: 0;
					gap: 15px;
					width: 100%;
					min-width: 100%;
          height: max-content;
				}

				.loader {
					padding: 0;
					display: flex;
					width: 100%;
					max-width: 100%;
					flex-flow: column !important;
					gap: 20px;
					align-items: start;
				}

				.loader .skeleton {
					background: var(--loader-gradient);
					background-size: 500% 500%;
					-webkit-animation: Gradient 2.25s ease infinite;
					-moz-animation: Gradient 2.25s ease infinite;
					animation: Gradient 2.25s ease infinite;
				}

				.loader > .head {
					padding: 0;
					margin: 0;
					width: 90%;
					display: flex;
					flex-flow: row;
					align-items: center;
					flex-wrap: nowrap;
					gap: 10px;
				}

				.loader > .head > span.profile {
					display: inline-block;
					height: 32px;
					width: 32px;
					border-radius: 50px;
					-webkit-border-radius: 50px;
					-moz-border-radius: 50px;
				}

				.loader > .head > span.info {
					display: flex;
					flex-flow: column;
					gap: 8px;
					min-width: calc(100% - 45px);
				}

				.loader > .head > .info .name {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 100%;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

				.loader > .head > .info .followers {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 50%;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

        .loader > span.stats {
					display: flex;
					flex-flow: row !important;
					gap: 10px;
					min-width: 90%;
				}

				.loader > span.stats .followers {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 30%;
					height: 9px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

        .loader > span.stats .following {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 30%;
					height: 9px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

				.loader > span.stats .dot {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 9px;
					height: 9px;
					border-radius: 50px;
				}

        .loader > span.text {
					display: flex;
					flex-flow: column;
					gap: 5px;
					min-width: 90%;
				}

				.loader > span.text .name {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 100%;
					height: 5px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

				.loader > span.text .followers {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 70%;
					height: 5px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

        .loader > .actions {
					display: flex;
					flex-flow: row !important;
					gap: 10px;
          margin: 0 0 3px 0;
					min-width: 90%;
				}

				.loader > .actions > .action {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 40px;
					height: 15px;
					border-radius: 50px;
				}

				@keyframes Gradient {
				  0% {
				    background-position: 0 25%;
				    /*opacity: 0.5;*/
				  }
				  50% {
				    background-position: 25% 50%;
				    /*opacity: 0.75;*/
				  }
				  75% {
				    background-position: 50% 75%;
				    /*opacity: 0.75;*/
				  }
				  100% {
				    background-position: 75% 100%;
				    /*opacity: 1;*/
				  }
				}

        @media screen and (max-width:660px) {
          :host {
            font-size: 16px;
            display: flex;
            flex-flow: column;
            padding: 5px 0 3px;
            gap: 20px;
            width: 100%;
            min-width: 100%;
            height: max-content;
          }
        }
	    </style>
    `;
	}
}