export default class FormPassword extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();

    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: "open" });

    // get the url
    this._url = this.getAttribute('api');
    this.app = window.app;
    this.api = this.app.api;
    this.render();
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    // Get the form
    const form = this.shadowObj.querySelector('form');
    // add event listeners to input fields
    this.inputEvents(form);
    // Submit form
    this.submitForm(form);
  }

   disableScroll() {
    // Get the current page scroll position
    let scrollTop = window.scrollY || document.documentElement.scrollTop;
    let scrollLeft = window.scrollX || document.documentElement.scrollLeft;
    document.body.classList.add("stop-scrolling");

    // if any scroll is attempted, set this to the previous value
    window.onscroll = function () {
      window.scrollTo(scrollLeft, scrollTop);
    };
  }

  enableScroll() {
    document.body.classList.remove("stop-scrolling");
    window.onscroll = function () { };
  }

  submitForm = async form => {
    form.addEventListener('submit', async e => {
      e.preventDefault();
      this.handleFormSubmit(form);
    });
  }

  handleFormSubmit = async form => {
    const serverStatus = form.querySelector('.server-status');
    if (serverStatus) serverStatus.remove();

    const actions = form.querySelector('.actions');
    const data = this.getFormData(form);

    if (!this.isFormDataValid(data, actions)) return;

    const button = form.querySelector('.action.next');
    button.innerHTML = this.getButtonLoader();

    try {
      const result = await this.api.patch(this._url, { content: 'json', body: data });
      this.handleServerResponse(result, actions, button);
    } catch (error) {
      this.handleServerError(actions, button);
    }

    this.removeServerStatus();
  }

  getFormData = form => {
    const formData = new FormData(form);
    return {
      old_password: formData.get('current-password').trim(),
      password: formData.get('new-password').trim(),
      confirm_password: formData.get('confirm-password').trim()
    };
  }

  isFormDataValid = (data, actions) => {
    if (!data.old_password || !data.password || !data.confirm_password) {
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'All fields are required'));
      this.removeServerStatus();
      return false;
    }

    const passwordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{6,}$/;
    if (!passwordRegex.test(data.password)) {
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'Password must be at least 6 characters long, contain a number, a special character, and an uppercase letter'));
      this.removeServerStatus();
      return false;
    }

    if (data.password !== data.confirm_password) {
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'New password and confirm password do not match'));
      this.removeServerStatus();
      return false;
    }

    return true;
  }

  handleServerResponse = (result, actions, button) => {
    if (result.success) {
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(true, result.message));
    } else {
      actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, result.message));
    }
    button.innerHTML = '<span class="text">Send</span>';
  }

  handleServerError = (actions, button) => {
    actions.insertAdjacentHTML('beforebegin', this.getServerSuccessMsg(false, 'An error occurred, please try again'));
    button.innerHTML = '<span class="text">Send</span>';
  }

  removeServerStatus = () => {
    const serverStatus = this.shadowObj.querySelector('.server-status');
    if (serverStatus) {
      setTimeout(() => {
        serverStatus.remove();
      }, 5000);
    }
  }

  getServerSuccessMsg = (success, text) => {
    if (!success) {
      return `
        <p class="server-status">${text}</p>
      `
    }
    return `
      <p class="server-status success">${text}</p>
    `
  }

  getButtonLoader() {
    return `
      <span id="btn-loader">
				<span class="loader"></span>
			</span>
    `
  }

  getTemplate() {
    // Show HTML Here
    return `
      ${this.getBody()}
      ${this.getStyles()}
    `;
  }

  getBody = () => {
    return /* html */`
      ${this.getHeader()}
      <form class="fields password" id="password-form">
        <div class="field password">
          <div class="input-group current-password">
            <label for="current-password" class="center">Current password</label>
            <input type="password" name="current-password" id="current-password" placeholder="Enter your current password" />
            <span class="status">Current password is required</span>
          </div>
          <div class="input-group new-password">
            <label for="new-password" class="center">New password</label>
            <input type="password" name="new-password" id="new-password" placeholder="Enter your new password" />
            <span class="status">New password is required</span>
          </div>
          <div class="input-group confirm-password">
            <label for="confirm-password" class="center">Confirm password</label>
            <input type="password" name="confirm-password" id="confirm-password" placeholder="Confirm your new password" />
            <span class="status">Confirm password is required</span>
          </div>
        </div>
        <div class="actions">
          <button type="submit" class="action next">
            <span class="text">Send</span>
          </button>
        </div>
      </form>
    `;
  }

  inputEvents = form => {
    // Get all input fields
    // const currentPassword = form.querySelector('.input-group.current-password');
    const newPassword = form.querySelector('.input-group.new-password');
    const confirmPassword = form.querySelector('.input-group.confirm-password');

    // Add event listeners to input fields
    // this.currentListener(currentPassword);
    this.newListener(newPassword);
    this.confirmListener(confirmPassword);
  }

  addInputListener = (container, message, compareValue = null) => {
    const input = container.querySelector('input');
    const status = container.querySelector('.status');

    input.addEventListener('input', () => {
      // validate input
      const value = input.value.trim();
      if (!value) {
        container.classList.add('failed');
        status.textContent = message;
        status.style.display = 'inline-block';
        return;
      }

      // test input
      const result = this.validateInput(value);
      if (!result.valid) {
        container.classList.add('failed');
        status.textContent = result.message;
        status.style.display = 'inline-block';
      } else {
        // if compareValue is provided, check if values match
        if (compareValue) {
          if (value !== compareValue.value.trim()) {
            container.classList.remove('success');
            container.classList.add('failed');
            status.textContent = 'Passwords do not match with new password';
            status.style.display = 'inline-block';
          } else {
            container.classList.remove('failed');
            container.classList.add('success');
            status.style.display = 'none';
          }
        } else {
          container.classList.remove('failed');
          container.classList.add('success');
          status.style.display = 'none';
        }
      }
    });
  }

  currentListener = container => {
    this.addInputListener(container, 'Current password is required');
  }

  newListener = container => {
    this.addInputListener(container, 'New password is required');
  }

  confirmListener = container => {
    const newPasswordInput = this.shadowObj.querySelector('.input-group.new-password input');
    this.addInputListener(container, 'Confirm password is required', newPasswordInput);
  }

  validateInput = text => {
    // match text with regex:
    // i. at least 6 characters long
    // ii. contains a number
    // iii. contains a special character
    // iv. contains an uppercase letter
    
    // check for at least 6 characters
    if (text.length < 6) {
      return {
        valid: false,
        message: 'Password must be at least 6 characters long'
      }
    }

    // check for a number
    const numberRegex = /\d/;
    if (!numberRegex.test(text)) {
      return {
        valid: false,
        message: 'Password must contain a number'
      }
    }

    // check for a special character
    const specialCharRegex = /[!@#$%^&*]/;
    if (!specialCharRegex.test(text)) {
      return {
        valid: false,
        message: 'Password must contain a special character'
      }
    }

    // check for an uppercase letter
    const upperCaseRegex = /[A-Z]/;
    if (!upperCaseRegex.test(text)) {
      return {
        valid: false,
        message: 'Password must contain an uppercase letter'
      }
    }

    return {
      valid: true,
      message: 'Password is valid'
    }
  }

  getHeader = () => {
    return /* html */`
      <div class="top">
        <h4 class="title">Your password</h4>
        <p class="desc">
          Your password is how you will log in to your account. You can change your password using the form below. You're required to enter your current password, then your new password.
        </p>
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

        *:focus {
          outline: inherit !important;
        }

        *::-webkit-scrollbar {
          -webkit-appearance: none;
        }

        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
          padding: 0;
          margin: 0;
          font-family: inherit;
        }

        p,
        ul,
        ol {
          padding: 0;
          margin: 0;
        }

        a {
          text-decoration: none;
        }

        :host {
          font-size: 16px;
          display: flex;
          flex-flow: column;
          gap: 10px;
          padding: 0;
          width: 100%;
        }

        p.server-status {
          margin: 0;
          width: 100%;
          text-align: start;
          font-family: var(--font-read), sans-serif;
          color: var(--error-color);
          font-weight: 500;
          line-height: 1.4;
          font-size: 1.18rem;
        }

        p.server-status.success {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        @keyframes l38 {
          100% {
            background-position: 100% 0, 100% 100%, 0 100%, 0 0
          }
        }

        #btn-loader {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
        }

        #btn-loader > .loader-alt {
          width: 20px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #18A565 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #21D029 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        #btn-loader > .loader {
          width: 20px;
          aspect-ratio: 1;
          --_g: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g1: no-repeat radial-gradient(farthest-side, #ffffff 94%, #0000);
          --_g2: no-repeat radial-gradient(farthest-side, #df791a 94%, #0000);
          --_g3: no-repeat radial-gradient(farthest-side, #f09c4e 94%, #0000);
          background:    var(--_g) 0 0,    var(--_g1) 100% 0,    var(--_g2) 100% 100%,    var(--_g3) 0 100%;
          background-size: 30% 30%;
          animation: l38 .9s infinite ease-in-out;
          -webkit-animation: l38 .9s infinite ease-in-out;
        }

        .top {
          display: flex;
          flex-flow: column;
          gap: 5px;
          padding: 0;
          width: 100%;
        }

        .top > h4.title {
          display: flex;
          align-items: center;
          color: var(--title-color);
          font-size: 1.3rem;
          font-weight: 500;
          margin: 0;
          padding: 0;
        }

        .top > .desc {
          margin: 0;
          padding: 0 0 5px;
          color: var(--text-color);
          font-size: 1rem;
          font-family: var(--font-main), sans-serif;
        }

        form.fields {
          margin: 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
        }

        form.fields > .field {
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          gap: 20px;
        }

        form.fields.center > .field {
          align-items: center;
        }

        form.fields .field .input-group {
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          color: var(--text-color);
          gap: 5px;
          position: relative;
          transition: border-color 0.3s ease-in-out;
        }

        form.fields .field.bio .input-group {
          width: 100%;
        }

        form.fields .field.bio .input-group.code,
        form.fields .field.bio .input-group.email {
          grid-column: 1/3;
          width: 100%;
        }

        form.fields .field .input-group > svg {
          position: absolute;
          right: 10px;
          top: 38px;
          width: 20px;
          height: 20px;
        }

        form.fields .field .input-group > svg {
          display: none;
        }

        form.fields .field .input-group.success > svg {
          display: inline-block;
        }

        form.fields .field .input-group.failed > svg {
          display: inline-block;
        }

        form.fields .field .input-group.success > svg {
          color: var(--accent-color);
        }

        form.fields .field .input-group.failed > svg {
          color: var(--error-color);
        }

        form.fields label {
          padding: 0 0 5px 0;
          color: var(--text-color);
        }

        form.fields .field.bio label {
          padding: 0 0 0 5px;
        }

        form.fields label {
          color: var(--label-color);
          font-size: 1.1rem;
          font-family: var(--font-main), sans-serif;
          transition: all 0.3s ease-in-out;
          pointer-events: none;
        }

        form.fields .field input {
          border: var(--input-border);
          background-color: var(--background) !important;
          font-size: 1rem;
          width: 100%;
          height: 40px;
          outline: none;
          padding: 10px 12px;
          border-radius: 12px;
          color: var(--text-color);
        }
        
        form.fields .field input:-webkit-autofill,
        form.fields .field input:-webkit-autofill:hover, 
        form.fields .field input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px var(--background) inset;
          -webkit-text-fill-color: var(--text-color) !important;
          transition: background-color 5000s ease-in-out 0s;
          color: var(--text-color) !important;
        }
        
        form.fields .field input:autofill {
          filter: none;
          color: var(--text-color) !important;
        }

        form.fields .field input:focus {
          border: var(--input-border-focus);
        }

        form.fields .field span.wrapper {
          display: flex;
          align-items: center;
          align-items: center;
          gap: 0;
          width: 100%;
        }

        form.fields .field .input-group.success > span.wrapper > input,
        form.fields .field .input-group.success > span.wrapper > input:focus,
        form.fields .field .input-group.success input,
        form.fields .field .input-group.success input:focus {
          border: var(--input-border-focus);
        }

        form.fields .field .input-group.failed > span.wrapper > input,
        form.fields .field .input-group.failed > span.wrapper > input:focus,
        form.fields .field .input-group.failed input,
        form.fields .field .input-group.failed input:focus {
          border: var(--input-border-error);
        }

        form.fields .field .input-group.success span.wrapper > input,
        form.fields .field .input-group.success input {
          color: var(--accent-color);
        }

        form.fields .field .input-group.failed span.wrapper > input,
        form.fields .field .input-group.failed input {
          color: var(--error-color);
        }

        form.fields label.focused {
          top: -10px;
          font-size: 0.9rem;
          background-color: var(--label-focus-background);
          padding: 0 5px;
        }

        form.fields .field span.status {
          color: var(--error-color);
          font-size: 0.95rem;
          display: none;
          padding: 0 0 0 5px;
        }

        form.fields .field .input-group.failed span.status {
          color: var(--error-color);
          font-size: 0.8rem;
          display: inline-block;
        }

        form.fields .field .input-group.success span.status {
          color: var(--accent-color);
          font-size: 0.8rem;
          display: inline-block;
        }

        form.fields .field .input-group.success span.status {
          display: none;
        }

        form.fields .actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          margin: 0 0 0 2px;
        }

        form.fields .actions > .action {
          border: none;
          background: var(--accent-linear);
          font-family: var(--font-main), sans-serif;
          text-decoration: none;
          color: var(--white-color);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          flex-flow: row;
          align-items: center;
          text-transform: capitalize;
          justify-content: center;
          padding: 7px 15px 8px;
          min-height: 35px;
          height: 35px;
          min-width: 60px;
          width: max-content;
          position: relative;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        form.fields .actions > .action.prev svg path {
          fill: var(--text-color);
        }

        form.fields .actions > .action.next {
          color: var(--white-color);
          background: var(--stage-no-linear);
        }

        form.fields .actions > .action.next svg path {
          fill: var(--white-color);
        }

        form.fields .actions > .action.disabled {
          pointer-events: none;
        }

        @media screen and (max-width:600px) {
          ::-webkit-scrollbar {
            -webkit-appearance: none;
          }

          :host {
            padding: 0 10px;
          }

          form.fields .actions > .action {
            cursor: default !important;
          }
        }
      </style>
    `;
  }
}