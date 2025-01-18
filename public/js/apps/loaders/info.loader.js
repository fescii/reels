export default class InfoLoader extends HTMLElement {
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
			<div class="loader author">
				<span class="head">
					<span class="start skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="start skeleton"></span>
				</span>
		  </div>
		  <div class="loader actions">
		    <span class="head">
					<span class="start skeleton"></span>
					<span class="dot skeleton"></span>
					<span class="start skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="start skeleton"></span>
          <span class="dot skeleton"></span>
				</span>
      </div>
      <div class="loader author">
				<span class="head">
          <span class="dot skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="start skeleton"></span>
					<span class="start skeleton"></span>
				</span>
		  </div>
		  <div class="loader actions">
		    <span class="head">
					<span class="start skeleton"></span>
					<span class="dot skeleton"></span>
					<span class="start skeleton"></span>
          <span class="dot skeleton"></span>
          <span class="start skeleton"></span>
				</span>
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
				  display: flex;
				  flex-flow: column;
					padding: 0;
				  gap: 0;
				  width: 100%;
				}

				.loader {
				  padding: 8px 0;
				  display: flex;
				  flex-flow: column;
				  gap: 6px;
				  width: 100%;
				  max-width: 100%;
				}

				.loader .skeleton {
				  background: var(--loader-gradient);
				  background-size: 500% 500%;
				  -webkit-animation: Gradient 2.25s ease infinite;
				  -moz-animation: Gradient 2.25s ease infinite;
				  animation: Gradient 2.25s ease infinite;
				}

				.loader > .foot,
				.loader > .head {
				  /*border: var(--input-border);*/
				  padding: 0;
				  margin: 0;
				  display: flex;
				  flex-flow: row;
				  align-items: center;
				  flex-wrap: nowrap;
				  gap: 10px;
				  width: 100%;
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
				  min-width: 40%;
				}

				.loader > .foot >  span.end,
				.loader > .head >  span.start {
				  min-width: 35%;
				}

				.loader  span.dot {
				  display: inline-block;
				  min-width: 15px;
				  height: 8px;
				  border-radius: 3px;
				  -webkit-border-radius: 3px;
				  -moz-border-radius: 3px;
				}

				.loader.actions > .head >  span.start {
          min-width: 20%;
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