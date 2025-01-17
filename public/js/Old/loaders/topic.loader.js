export default class TopicLoader extends HTMLElement {
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
		return /*html*/`
      <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="name skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="dot skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
        <div class="actions">
					<span class="action skeleton"></span>
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
				</div>
      </div>
      <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="name skeleton"></span>
          <span class="info">
            <span class="followers skeleton"></span>
            <span class="dot skeleton"></span>
            <span class="name skeleton"></span>
          </span>
        </div>
         <div class="actions">
					<span class="action skeleton"></span>
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
				</div>
      </div>
      <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="name skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="dot skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
         <div class="actions">
					<span class="action skeleton"></span>
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
				</div>
      </div>
      <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="name skeleton"></span>
          <span class="info">
            <span class="followers skeleton"></span>
            <span class="dot skeleton"></span>
            <span class="name skeleton"></span>
          </span>
        </div>
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
					padding: 20px 0 15px;
					gap: 20px;
					width: 100%;
					max-width: 100%;
				}

				.loader {
					padding: 0;
					display: flex;
					width: 100%;
					max-width: 100%;
					flex-flow: column;
					gap: 10px;
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
					width: 100%;
					display: flex;
					flex-flow: column;
					align-items: start;
					flex-wrap: nowrap;
					gap: 8px;
				}

				.loader > .head > span.profile {
					display: inline-block;
					height: 8px;
					width: 90%;
					border-radius: 50px;
					-webkit-border-radius: 50px;
					-moz-border-radius: 50px;
				}

        .loader > .head > .name {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 70%;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

				.loader > .head > span.info {
					display: flex;
					flex-flow: row;
					gap: 8px;
					min-width: calc(100% - 45px);
				}

				.loader > .head > .info .name {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 20%;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

        .loader > .head > .info .dot {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 20px;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

				.loader > .head > .info .followers {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 10%;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

				.loader > .actions {
					display: flex;
					flex-flow: row;
					gap: 20px;
				}

				.loader > .actions > .action {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 20%;
					height: 10px;
					border-radius: 4px;
					-webkit-border-radius: 4px;
					-moz-border-radius: 4px;
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
	    </style>
    `;
	}
}