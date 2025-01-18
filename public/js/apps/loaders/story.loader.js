export default class StoryLoader extends HTMLElement {
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
		return /* html */`
			<div class="loader">
				<span class="head">
					<span class="start skeleton"></span>
					<span class="dot skeleton"></span>
					<span class="end skeleton"></span>
				</span>
			  <div class="body thin skeleton"></div>
			  <span class="overlap skeleton"></span>
		  </div>
		  <div class="loader">
		    <div class="body skeleton"></div>
		    <span class="foot">
					<span class="start skeleton"></span>
					<span class="dot skeleton"></span>
					<span class="end skeleton"></span>
				</span>
		  </div>
		  <div class="loader">
				<span class="head">
					<span class="start skeleton"></span>
					<span class="dot skeleton"></span>
					<span class="end skeleton"></span>
				</span>
			  <div class="body thin skeleton"></div>
			  <span class="overlap skeleton"></span>
		  </div>
		  <div class="loader">
		    <span class="foot">
					<span class="start skeleton"></span>
					<span class="dot skeleton"></span>
					<span class="end skeleton"></span>
				</span>
			  <div class="body skeleton"></div>
		  </div>
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
				  padding: 10px 0;
				  display: flex;
				  flex-flow: column;
				  gap: 5px;
				  width: 100%;
					min-width: 100%;
				}

				.loader {
				  padding: 10px 0;
				  display: flex;
				  flex-flow: column;
				  gap: 6px;
				  /*max-width: 400px;*/
				  width: 100%;
				  min-width: 100%;
				}

				.loader .skeleton {
				  background: var(--loader-gradient);
				  background-size: 500% 500%;
				  -webkit-animation: Gradient 2.25s ease infinite;
				  -moz-animation: Gradient 2.25s ease infinite;
				  animation: Gradient 2.25s ease infinite;
				}

				.loader > .foot,
				.loader > .head{
				  /*border: var(--input-border);*/
				  padding: 0;
				  margin: 0;
				  display: flex;
				  flex-flow: row;
				  align-items: center;
				  flex-wrap: nowrap;
				  gap: 10px;
				  width: 70%;
				  max-width: 100%;
				}
				.loader  span.end,
				.loader  span.start {
				  display: inline-block;
				  height: 8px;
				  /*background-color: #6b728050;*/
				  border-radius: 3px;
				  -webkit-border-radius: 3px;
				  -moz-border-radius: 3px;
				}

				.loader > .foot >  span.start,
				.loader > .head >  span.end {
				  min-width: 65%;
				}

				.loader > .foot >  span.end,
				.loader > .head >  span.start {
				  min-width: 25%;
				}

				.loader  span.dot {
				  display: inline-block;
				  min-width: 15px;
				  height: 8px;
				  border-radius: 3px;
				  -webkit-border-radius: 3px;
				  -moz-border-radius: 3px;
				}

				.loader > .body {
				  /*border: var(--input-border);*/
				  margin: 0;
				  padding: 0;
				  width: 100%;
				  height: 8px;
				  border-radius: 3px;
				  -webkit-border-radius: 3px;
				  -moz-border-radius: 3px;
				}

				.loader > .overlap {
				  /*border: var(--input-border);*/
				  margin: 0;
				  padding: 0;
				  width: 100%;
				  height: 8px;
				  border-radius: 3px;
				  -webkit-border-radius: 3px;
				  -moz-border-radius: 3px;
				}

				.loader > .full {
				  /*border: var(--input-border);*/
				  margin: 0;
				  padding: 0;
				  width: 100%;
				  height: 8px;
				  border-radius: 3px;
				  -webkit-border-radius: 3px;
				  -moz-border-radius: 3px;
				}

				.loader > .body.thin {
					height: 10px;
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
          .loader {
            width: 100%;
            max-width: 100%;
          }
        }
	    </style>
    `;
	}
}