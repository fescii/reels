export default class AuthorsLoader extends HTMLElement {
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
        <div class="action skeleton"></div>
      </div>
			<div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
        <div class="action skeleton"></div>
      </div>
			<div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
        <div class="action skeleton"></div>
      </div>
			<div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
        <div class="action skeleton"></div>
      </div>
			<div class="loader">
        <div class="head">
          <span class="profile skeleton"></span>
          <span class="info">
            <span class="name skeleton"></span>
            <span class="followers skeleton"></span>
          </span>
        </div>
        <div class="action skeleton"></div>
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
					flex-flow: row;
          flex-wrap: nowrap;
					padding: 15px 0;
					gap: 15px;
					width: 100%;
					min-width: 100%;
          overflow-x: scroll;
          scrollbar-width: none;
          -ms-overflow-style: none;
				}

        :host::-webkit-scrollbar {
          display: none;
          visibility: hidden;
        }

				.loader {
					padding: 0;
					display: flex;
					width: 156px;
          min-width: 156px;
          height: 160px;
          max-height: 160px;
					flex-flow: column !important;
					gap: 0;
					align-items: center;
					justify-content: space-between;
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
          height: max-content;
					display: flex;
					flex-flow: column;
					align-items: center;
          justify-content: center;
					flex-wrap: nowrap;
					gap: 10px;
				}

				.loader > .head > span.profile {
					display: inline-block;
					width: 80px;
          height: 80px;
					border-radius: 50px;
					-webkit-border-radius: 50px;
					-moz-border-radius: 50px;
				}

				.loader > .head > span.info {
					display: flex;
					flex-flow: column;
          align-items: center;
          justify-content: center;
					gap: 8px;
					min-width: 90%;
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
					width: 80%;
					height: 8px;
					border-radius: 3px;
					-webkit-border-radius: 3px;
					-moz-border-radius: 3px;
				}

				.loader > .action {
					display: inline-block;
					margin: 0;
					padding: 0;
					width: 60%;
					height: 20px;
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