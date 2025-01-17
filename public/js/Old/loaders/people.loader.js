export default class PeopleLoader extends HTMLElement {
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
				<span class="info">
          <span class="name skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="followers skeleton"></span>
        </span>
				<div class="p skeleton"></div>
				<div class="actions">
					<span class="action skeleton"></span>
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
				</div>
      </div>
			 <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
				<span class="info">
          <span class="name skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="followers skeleton"></span>
        </span>
				<div class="p skeleton"></div>
				<div class="actions">
					<span class="action skeleton"></span>
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
				</div>
      </div>
			 <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
				<span class="info">
          <span class="name skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="followers skeleton"></span>
        </span>
				<div class="p skeleton"></div>
				<div class="actions">
					<span class="action skeleton"></span>
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
				</div>
      </div>
			 <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
				<span class="info">
          <span class="name skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="followers skeleton"></span>
        </span>
				<div class="p skeleton"></div>
				<div class="actions">
					<span class="action skeleton"></span>
          <span class="action skeleton"></span>
          <span class="action skeleton"></span>
				</div>
      </div>
			 <div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
				<span class="info">
          <span class="name skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="followers skeleton"></span>
        </span>
				<div class="p skeleton"></div>
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
					padding: 15px 0;
					gap: 25px;
					width: 100%;
					min-width: 100%;
				}

				.loader {
					padding: 0;
					display: flex;
					width: 100%;
					max-width: 100%;
					flex-flow: column !important;
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
					width: 80%;
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

				.loader > span.info {
					display: flex;
					flex-flow: row;
					gap: 8px;
					min-width: calc(100% - 45px);
				}

				.loader > .info .name {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 20%;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

        .loader > .info .dot {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 20px;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

				.loader > .info .followers {
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
					width: 50px;
					height: 10px;
					border-radius: 4px;
					-webkit-border-radius: 4px;
					-moz-border-radius: 4px;
				}

				.loader > .p {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 80%;
					height: 5px;
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