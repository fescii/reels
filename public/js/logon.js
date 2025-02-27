// noinspection RegExpRedundantEscape
import APIManager from "./api.js";
export default class AppLogon extends HTMLElement {
  constructor() {
    // We are not even going to touch this.
    super();
    this.setTitle();

    // check if the user is authenticated
    this._authenticated = window.hash ? true : false;
    this.api = new APIManager('/api/v1', 9500, 'v1');
    // let's create our shadow root
    this.shadowObj = this.attachShadow({ mode: 'open' });

    this._step = 0;

    this._success = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
				<path	d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
			</svg>
    `

    this._failed = `
		  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"	viewBox="0 0 16 16">
				<path	d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293z" />
			</svg>
    `

    this._data = {
      "register": {},
      "login": {},
      "recovery": {},
      "user": {}
    };

    this.render();
  }

  setTitle = () => {
    document.title = 'Pau - Join, Login, Recover, and Explore';
  }

  render() {
    this.shadowObj.innerHTML = this.getTemplate();
  }

  connectedCallback() {
    const outerThis = this;
    const initialName = this.getAttribute('name');
    const contentContainer = this.shadowObj.querySelector('.logon-container');
    if (contentContainer) {
      const contentTitle = contentContainer.querySelector('.head > .logo h2 span.action')
      const stagesContainer = contentContainer.querySelector('.stages');

      // Check if the user is authenticated
      if (outerThis._authenticated) {
        // activate the login
        outerThis.activateLogin(contentContainer, stagesContainer, contentTitle);

        //set content title
        contentTitle.textContent = 'Welcome';
      }
      else {
        if (initialName === 'join') {
          outerThis.activateRegister(contentContainer, stagesContainer, contentTitle);
          outerThis.activateLogin(contentContainer, stagesContainer, contentTitle);
          this.activateForgot(contentContainer, stagesContainer, contentTitle);
        } else if (initialName === 'login') {
          outerThis.loginLoaded(contentContainer, stagesContainer, contentTitle);
        } else if (initialName === 'forgot') {
          outerThis.forgotLoaded(contentContainer, stagesContainer, contentTitle);
        } else if (initialName === 'register') {
          outerThis.registerLoaded(contentContainer, stagesContainer, contentTitle);
        } else {
          outerThis.activateRegister(contentContainer, stagesContainer, contentTitle);
          outerThis.activateLogin(contentContainer, stagesContainer, contentTitle);
          this.activateForgot(contentContainer, stagesContainer, contentTitle);
        }
      }
    }
  }

  setHash = name => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);

    const cookie = parts.length === 2 ? parts.pop().split(';').shift() : null;

    // add cookie to the window
    window.hash = cookie;
  }

  disconnectedCallback() {
    // Remove all event listeners
  }

  loginLoaded = (contentContainer, stagesContainer, contentTitle) => {
    const outerThis = this;

    contentTitle.textContent = 'Login';
    outerThis.changeStages('login', stagesContainer);
    outerThis.nextStep('login', stagesContainer);

    outerThis.submitEvent('login', contentContainer.querySelector('form'));
    outerThis.prevStep('login', stagesContainer, contentContainer)
  }

  registerLoaded = (contentContainer, stagesContainer, contentTitle) => {
    const outerThis = this;

    contentTitle.textContent = 'Register';
    outerThis.changeStages('register', stagesContainer);
    outerThis.nextStep('register', stagesContainer);

    outerThis.submitEvent('register', contentContainer.querySelector('form'));
    outerThis.prevStep('register', stagesContainer, contentContainer)
  }

  forgotLoaded = (contentContainer, stagesContainer, contentTitle) => {
    const outerThis = this;

    contentTitle.textContent = 'Recover';
    outerThis.changeStages('forgot', stagesContainer);
    outerThis.nextStep('forgot', stagesContainer);

    outerThis.submitEvent('forgot', contentContainer.querySelector('form'));
    outerThis.prevStep('forgot', stagesContainer, contentContainer)
  }

  activateRegister(contentContainer, stagesContainer, contentTitle) {
    const loader = this.getLoader();
    const form = this.getRegistrationForm();
    const outerThis = this;
    const registerButton = contentContainer.querySelector('.welcome > a.register');
    if (registerButton) {
      registerButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        contentContainer.insertAdjacentHTML('afterbegin', loader);

        const welcome = contentContainer.querySelector('.welcome');

        setTimeout(() => {
          welcome.remove();
          contentTitle.textContent = 'Register';
          outerThis.changeStages('register', stagesContainer);
          outerThis.nextStep('register', stagesContainer);
          stagesContainer.insertAdjacentHTML('afterend', form);

          // Updating History State
          window.history.pushState(
            { content: form, page: 'register' },
            outerThis.getAttribute('register'), outerThis.getAttribute('register')
          );

          contentContainer.querySelector('#loader-container').remove();

          outerThis.submitEvent('register', contentContainer.querySelector('form'));
          outerThis.prevStep('register', stagesContainer, contentContainer)
        }, 1000);

      })
    }
  }

  activateLogin(contentContainer, stagesContainer, contentTitle) {
    const loader = this.getLoader();
    const form = this.getLoginForm();
    const outerThis = this;
    const loginButton = contentContainer.querySelector('a.login');
    if (loginButton) {
      loginButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();

        contentContainer.insertAdjacentHTML('afterbegin', loader);

        const welcome = contentContainer.querySelector('.welcome');
        const finish = contentContainer.querySelector('.finish');

        setTimeout(() => {
          if (welcome) {
            welcome.remove();
          }
          if (finish) {
            finish.remove();
          }
          contentTitle.textContent = 'Login';
          outerThis.changeStages('login', stagesContainer);
          outerThis.nextStep('login', stagesContainer);
          stagesContainer.insertAdjacentHTML('afterend', form);

          // Remove the loader
          contentContainer.querySelector('#loader-container').remove();

          // Updating History State
          window.history.pushState(
            { content: form, page: 'login' },
            outerThis.getAttribute('login'), outerThis.getAttribute('login')
          );

          outerThis.submitEvent('login', contentContainer.querySelector('form'));
          outerThis.prevStep('login', stagesContainer, contentContainer)
        }, 1000);

      })
    }
  }

  activateForgot(contentContainer, stagesContainer, contentTitle) {
    const loader = this.getLoader();
    const form = this.getForgotForm();
    const outerThis = this;

    const forgotButton = contentContainer.querySelector('.welcome  a.forgot');
    if (forgotButton) {
      forgotButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        
        contentContainer.insertAdjacentHTML('afterbegin', loader);

        const welcome = contentContainer.querySelector('.welcome');

        setTimeout(() => {
          if (welcome) {
            welcome.remove()
          }
          welcome.remove();
          contentTitle.textContent = 'Recover';
          outerThis.changeStages('forgot', stagesContainer);
          outerThis.nextStep('forgot', stagesContainer);
          stagesContainer.insertAdjacentHTML('afterend', form);
          
          // Updating History State
          window.history.pushState(
            { content: form, page: 'forgot' },
            outerThis.getAttribute('forgot'), outerThis.getAttribute('forgot')
          );

          contentContainer.querySelector('#loader-container').remove();

          outerThis.submitEvent('forgot', contentContainer.querySelector('form'));
          outerThis.prevStep('forgot', stagesContainer, contentContainer)
        }, 1000);
      })
    }
  }

  changeStages(stageType, stagesContainer) {
    const stages = stagesContainer.querySelectorAll('.no');

    switch (stageType) {
      case 'register':
        stagesContainer.classList.remove('login', 'welcome-stages', 'forgot');
        stagesContainer.classList.add('register');

        stages.forEach((stage, index) => {
          if (index >= 3) {
            stage.style.display = 'none';
          }
          else {
            stage.style.display = 'inline-block';
          }
        });

        break;

      case 'forgot':
        stagesContainer.classList.remove('login', 'welcome-stages', 'register');
        stagesContainer.classList.add('forgot');

        stages.forEach(stage => {
          stage.style.display = 'inline-block';
        });

        break;

      case 'login':
        stagesContainer.classList.remove('register', 'welcome-stages', 'forgot');
        stagesContainer.classList.add('login');

        stages.forEach((stage, index) => {
          if (index >= 2) {
            stage.style.display = 'none';
          }
        });

        break;

      case 'welcome':
        stagesContainer.classList.remove('register', 'login', 'forgot');
        stagesContainer.classList.add('welcome-stages');

        stages.forEach((stage, index) => {
          if (index === 2 || index === 3) {
            stage.style.display = 'none';
          }
        });

        break;
      default:
        break;
    }
  }

  nextStep(stageType, stagesContainer) {
    const stages = stagesContainer.querySelectorAll('span.stage');

    switch (stageType) {
      case "register":
        if (this._step >= 4) {
          stages[4].classList.remove('active');
          stages[1].classList.add('active');
          this._step = 1;
        }
        else if ((this._step + 1) === 3) {
          stages[stages.length - 1].classList.add('active');
          this._step = (stages.length - 1);
        }
        else {
          stages[this._step + 1].classList.add('active');
          this._step += 1;
        }
        break;
      case "forgot":
        stages[this._step + 1].classList.add('active');
        this._step += 1;
        break;
      case "login":
        if (this._step >= 3) {
          stages[4].classList.remove('active');
          stages[3].classList.remove('active');
          stages[2].classList.remove('active');
          stages[1].classList.add('active');
          this._step = 1;
        }
        else if ((this._step + 1) === 2) {
          stages[stages.length - 1].classList.add('active');
          this._step = (stages.length - 1);
        }
        else {
          stages[this._step + 1].classList.add('active');
          this._step += 1;
        }
        break;
      default:
        break;
    }
  }

  prevStep(stageType, stagesContainer, contentContainer) {
    const outerThis = this;
    const welcome = this.getWelcome();
    const form = contentContainer.querySelector('form.fields');
    const stages = stagesContainer.querySelectorAll('span.stage');
    const contentTitle = contentContainer.querySelector('.head > .logo h2 span.action');

    const prevButton = form.querySelector('.actions > .action.prev ');

    prevButton.addEventListener('click', e => {
      e.preventDefault()

      prevButton.innerHTML = outerThis.getBtnAltLoader();
      prevButton.style.setProperty("pointer-events", 'none');

      if (stageType === "register") {
        if (outerThis._step <= 1) {
          contentTitle.textContent = "Join";
          setTimeout(() => {
            stages[1].classList.remove('active');
            form.remove();
            stagesContainer.insertAdjacentHTML('afterend', welcome)
            outerThis._step = 0;

            outerThis.activateRegister(contentContainer, stagesContainer, contentTitle);
            outerThis.activateLogin(contentContainer, stagesContainer, contentTitle);
            outerThis.activateForgot(contentContainer, stagesContainer, contentTitle);
          }, 1500);
        }
        else if (outerThis._step === 2) {
          setTimeout(() => {
            stages[outerThis._step].classList.remove('active');
            outerThis._step -= 1;
            const currentFields = form.querySelector('.field.password');
            if (currentFields) {
              currentFields.remove();
            }

            form.insertAdjacentHTML('afterbegin', outerThis.getBioFields())
          }, 1500);
        }
      }
      else if (stageType === "forgot") {
        if (outerThis._step <= 1) {
          contentTitle.textContent = "Join";
          setTimeout(() => {
            stages[1].classList.remove('active');
            form.remove();
            stagesContainer.insertAdjacentHTML('afterend', welcome)
            outerThis._step = 0;

            outerThis.activateRegister(contentContainer, stagesContainer, contentTitle);
            outerThis.activateLogin(contentContainer, stagesContainer, contentTitle);
            outerThis.activateForgot(contentContainer, stagesContainer, contentTitle);
          }, 1500);
        }
        else if (outerThis._step === 2) {
          setTimeout(() => {
            stages[outerThis._step].classList.remove('active');
            outerThis._step -= 1;
            const currentFields = form.querySelector('.forgot.code');
            if (currentFields) {
              currentFields.remove();
            }

            form.insertAdjacentHTML('afterbegin', outerThis.getForgotFields())
          }, 1500);
        }
        else if (outerThis._step === 3) {
          setTimeout(() => {
            stages[outerThis._step].classList.remove('active');
            outerThis._step -= 1;
            const currentFields = form.querySelector('.forgot.password');
            if (currentFields) {
              currentFields.remove();
            }

            form.insertAdjacentHTML('afterbegin', outerThis.getCodeField())
          }, 1500);
        }
      }
      else if (stageType === "login") {
        if (this._step <= 1) {
          contentTitle.textContent = "Join";
          setTimeout(() => {
            stages[1].classList.remove('active');
            form.remove();
            stagesContainer.insertAdjacentHTML('afterend', welcome)
            outerThis._step = 0;

            outerThis.activateRegister(contentContainer, stagesContainer, contentTitle);
            outerThis.activateLogin(contentContainer, stagesContainer, contentTitle);
            outerThis.activateForgot(contentContainer, stagesContainer, contentTitle);
          }, 1500);
        }
      }

      setTimeout(() => {
        prevButton.innerHTML = `<span class="text">Back</span>`
        prevButton.style.setProperty("pointer-events", 'auto');
      }, 1500);
    })
  }

  submitEvent(stageType, form) {
    const outerThis = this;
    form.addEventListener('submit', e => {
      e.preventDefault();

      switch (stageType) {
        case 'register':
          if (outerThis._step === 1) {
            outerThis.validateBio(form);
          }
          else if (outerThis._step === 2) {
            outerThis.validatePassword(form);
          }
          break;

        case 'forgot':
          if (outerThis._step === 1) {
            outerThis.validateForgotEmail(form);
          }
          else if (outerThis._step === 2) {
            outerThis.validateForgotCode(form);
          }
          else if (outerThis._step === 3) {
            outerThis.validateForgotPassword(form);
          }
          break;
        case 'login':
          outerThis.validateLogin(form);
          break;
        default:
          break;
      }
    })
  }

  validateLogin(form) {
    const outerThis = this;
    const data = {};
    const submitButton = form.querySelector('.actions > .action.next ');
    const inputField = form.querySelector('.field.login');
    const userKeyGroup = inputField.querySelector('.input-group.user-key');
    const passwordGroup = inputField.querySelector('.input-group.password');

    submitButton.innerHTML = outerThis.getButtonLoader();
    submitButton.style.setProperty("pointer-events", 'none');

    userKeyGroup.classList.remove('success', 'failed');
    passwordGroup.classList.remove('success', 'failed');

    let svg = userKeyGroup.querySelector('svg');
    let passwordSvg = passwordGroup.querySelector('svg');
    let serverMsg = form.querySelector('.server-status');
    if (svg) {
      svg.remove();
    }

    if(passwordSvg) {
      passwordSvg.remove();
    }

    if (serverMsg) {
      serverMsg.remove();
    }

    const userKeyValue = userKeyGroup.querySelector('input').value.trim();
    const passwordValue = passwordGroup.querySelector('input').value.trim();

    const userKeyStatus = userKeyGroup.querySelector('span.status');
    const passwordStatus = passwordGroup.querySelector('span.status');


    if (userKeyValue === '') {
      userKeyStatus.textContent = 'Username or email is required!';
      userKeyGroup.insertAdjacentHTML('beforeend', outerThis._failed);
      userKeyGroup.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Login</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
    else {
      userKeyGroup.insertAdjacentHTML('beforeend', this._success);
      setTimeout(() => {
        userKeyGroup.classList.add('success');
      }, 2000);

      data['email'] = userKeyValue;
    }

    if (passwordValue === '') {
      passwordStatus.textContent = 'Password is required!';
      passwordGroup.insertAdjacentHTML('beforeend', outerThis._failed);
      passwordGroup.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Login</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
    else {
      passwordGroup.insertAdjacentHTML('beforeend', this._success);
      setTimeout(() => {
        passwordGroup.classList.add('success');
      }, 2000);
      data['password'] = passwordValue;
    }

    if (data['email'] && data['password']) {
      //API CALL
      outerThis.performLogin(form, data)
    }
  }

  performLogin = async (form, data) => {
    const outerThis = this;
    const submitButton = form.querySelector('.actions > .action.next ');

    // Call login API
    const {
      result,
      error
    } = await outerThis.apiLogin(data);

    console.log(result)

    // If error occurs
    if (error) {
      const errorMsg = outerThis.getServerMsg('Something went wrong, try again!');
      form.insertAdjacentHTML('afterbegin', errorMsg);

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Login</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }

    // If login is successful
    if (result.success) {
      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');

        outerThis.activateLoginFinish(form.parentElement, result.user.name);
      }, 3000);
    }
    else {
      const errorMsg = outerThis.getServerMsg(result.message);
      form.insertAdjacentHTML('afterbegin', errorMsg);

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Login</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
  }

  apiLogin = async data => {
    const outerThis = this;
    const loginUrl = outerThis.getAttribute('api-login');
    try {
      const result = await this.api.post(loginUrl, { content: 'json', body: data });
      return  {
        result: result,
        error: null
      }
    }
    catch (error) {
      return {
        result: null,
        error: error
      }
    }
  }

  activateBio(form) {
    const stagesContainer = form.parentElement.querySelector('.stages');
    form.firstElementChild.remove()
    this.nextStep('register', stagesContainer);

    form.insertAdjacentHTML('afterbegin', this.getBioFields())
  }

  validateBio(form) {
    const outerThis = this;
    const submitButton = form.querySelector('.actions > .action.next ');
    const inputField = form.querySelector('.field.bio');

    const firstName = inputField.querySelector('.input-group.firstname');
    const lastname = inputField.querySelector('.input-group.lastname');
    const email = inputField.querySelector('.input-group.email');

    submitButton.innerHTML = outerThis.getButtonLoader();
    submitButton.style.setProperty("pointer-events", 'none');


    // Validate names
    if (this.validateName(firstName, submitButton) && this.validateName(lastname, submitButton)) {
      const input = email.querySelector('input').value.trim();

      email.classList.remove('success', 'failed');
      let svg = email.querySelector('svg');
      if (svg) {
        svg.remove();
      }
      const emailStatus = email.querySelector('span.status');

      if (input === '') {
        emailStatus.textContent = 'Enter a valid email!';
        email.insertAdjacentHTML('beforeend', outerThis._failed);
        email.classList.add('failed');

        setTimeout(() => {
          submitButton.innerHTML = `<span class="text">Continue</span>`
          submitButton.style.setProperty("pointer-events", 'auto');
        }, 1000);
      }
      else {
        // no Inspection
        let validRegex = /^[\w.-]+@[\w-]+\.[\w.-]+$/

        if (input.match(validRegex)) {

          // Call the API
          outerThis.checkEmail(form, input, email, emailStatus);
        }
        else {
          emailStatus.textContent = 'Enter a valid email!';
          email.insertAdjacentHTML('beforeend', outerThis._failed);
          email.classList.add('failed');

          setTimeout(() => {
            submitButton.innerHTML = `<span class="text">Continue</span>`
            submitButton.style.setProperty("pointer-events", 'auto');
          }, 1000);
        }
      }
    }
  }

  validateName = (nameElement, submitButton) => {
    const outerThis = this;
    const inputElement = nameElement.querySelector('input')
    const input = nameElement.querySelector('input').value.trim();

    nameElement.classList.remove('success', 'failed');
    let svg = nameElement.querySelector('svg');
    if (svg) {
      svg.remove();
    }
    const nameStatus = nameElement.querySelector('span.status');

    if (input === '') {
      nameStatus.textContent = 'This field is required!';
      nameElement.insertAdjacentHTML('beforeend', outerThis._failed);
      nameElement.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);

      return false;
    }
    else {
      nameStatus.textContent = '';
      nameElement.insertAdjacentHTML('beforeend', this._success);

      if (inputElement.dataset.name === "firstname") {
        this._data.register['first_name'] = input;
      }
      else {
        this._data.register['last_name'] = input;
      }

      nameElement.classList.add('success');

      return true;
    }
  }

  checkEmail = async (form, input, email, emailStatus) =>  {
    const submitButton = form.querySelector('.actions > .action.next');

    // After API call
    const {
      result,
      error
    } = await this.checkIfEmailExists({ email: input });

    // If error occurs
    if (error) {
      const errorMsg = this.getServerMsg('Something went wrong, try again!');
      form.insertAdjacentHTML('afterbegin', errorMsg);

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }

    // If email does not exist
    if (result.success) {
      // Add email to the data object
      this._data.register['email'] = input;

      emailStatus.textContent = result.message;
      email.insertAdjacentHTML('beforeend', this._success);

      email.classList.add('success');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Register</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
        this.activatePassword(form)
      }, 2000);
    }
    else {
      emailStatus.textContent = result.message;
      email.insertAdjacentHTML('beforeend', this._failed);
      email.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
  }

  activatePassword = form => {
    const stagesContainer = form.parentElement.querySelector('.stages');
    form.firstElementChild.remove()
    this.nextStep('register', stagesContainer);

    form.insertAdjacentHTML('afterbegin', this.getPasswordFields())
  }

  validatePassword = async form => {
    const outerThis = this;
    const submitButton = form.querySelector('.actions > .action.next');
    const inputField = form.querySelector('.field.password');

    const password = inputField.querySelector('.input-group.password');
    const repeatPassword = inputField.querySelector('.input-group.repeat-password');

    submitButton.innerHTML = outerThis.getButtonLoader();
    submitButton.style.setProperty("pointer-events", 'none');

    const input = password.querySelector('input').value.trim();
    const inputRepeat = repeatPassword.querySelector('input').value.trim();

    password.classList.remove('success', 'failed');
    repeatPassword.classList.remove('success', 'failed');
    let svg = password.querySelector('svg');
    let svgRepeat = repeatPassword.querySelector('svg');
    let serverMsg = form.querySelector('.server-status');
    if(svg){
      svg.remove();
    }
    if (svgRepeat) {
      svgRepeat.remove();
    }

    if (serverMsg) {
      serverMsg.remove();
    }


    const passwordStatus = password.querySelector('span.status');
    const repeatStatus = repeatPassword.querySelector('span.status');

    if (input === '') {
      passwordStatus.textContent = 'Password is required!';
      password.insertAdjacentHTML('beforeend', outerThis._failed);
      password.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
    else {
      if(this.isPassword(input, password, passwordStatus)){
        if (input === inputRepeat) {
          repeatStatus.textContent = '';
          repeatPassword.insertAdjacentHTML('beforeend', this._success);

          this._data.register['password'] = input;

          // console.log(this._data);

          repeatPassword.classList.add('success');

          // API Call

          const {
            result,
            error
          } = await outerThis.performRegistration(outerThis._data.register);

          if (error) {
            const errorMsg = outerThis.getServerMsg('Something went wrong, try again!');
            form.insertAdjacentHTML('afterbegin', errorMsg);

            setTimeout(() => {
              submitButton.innerHTML = `<span class="text">Continue</span>`
              submitButton.style.setProperty("pointer-events", 'auto');
            }, 1000);
          }

          if (result.success) {
            this.activateFinish(form.parentElement, result.user);
          }
          else {
            const errorMsg = outerThis.getServerMsg(result.message);
            form.insertAdjacentHTML('afterbegin', errorMsg);

            setTimeout(() => {
              submitButton.innerHTML = `<span class="text">Continue</span>`
              submitButton.style.setProperty("pointer-events", 'auto');
            }, 1000);
          }
        }
        else {
          repeatStatus.textContent = 'Passwords must match be equal!';
          repeatPassword.insertAdjacentHTML('beforeend', outerThis._failed);
          repeatPassword.classList.add('failed');

          setTimeout(() => {
            submitButton.innerHTML = `<span class="text">Continue</span>`
            submitButton.style.setProperty("pointer-events", 'auto');
          }, 1000);
        }
      }
      else {
        setTimeout(() => {
          submitButton.innerHTML = `<span class="text">Continue</span>`
          submitButton.style.setProperty("pointer-events", 'auto');
        }, 1000);
      }
    }
  }

  performRegistration = async data => {
    const outerThis = this;
    const registerUrl = outerThis.getAttribute('api-register');
    try {
      const body = JSON.stringify(data);

      const result = await this.api.put(registerUrl, { content: 'json', body });

      return  {
        result: result,
        error: null
      }
    }
    catch (error) {
      return {
        result: null,
        error: error
      }
    }
  }

  checkIfEmailExists = async data => {
    const outerThis = this;
    const checkEmailUrl = outerThis.getAttribute('api-check-email');
    try {
      const body = JSON.stringify(data);
      const result = await this.api.post(checkEmailUrl, { content: 'json', body });

      return {
        result: result,
        error: null
      }
    }
    catch (error) {
      return {
        result: null,
        error: error
      }
    }
  }

  isPassword(input, password, passwordStatus) {
    const outerThis = this;
    // Regular expressions for each criterion
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const digitRegex = /[0-9]/;
    const specialSymbolRegex = /[^A-Za-z0-9]/;

    // Check each criterion
    if (input.length < 6) {
      passwordStatus.textContent = "Password must be at least 6 characters long.";
      password.insertAdjacentHTML('beforeend', outerThis._failed);
      password.classList.add('failed');

      return false;
    }
    else if (!uppercaseRegex.test(input)) {
      passwordStatus.textContent = "Password must contain at least one uppercase letter.";
      password.insertAdjacentHTML('beforeend', outerThis._failed);
      password.classList.add('failed');

      return false;
    }
    else if (!lowercaseRegex.test(input)) {
      passwordStatus.textContent = "Password must contain at least one lowercase letter.";
      password.insertAdjacentHTML('beforeend', outerThis._failed);
      password.classList.add('failed');

      return false;
    }
    else if (!digitRegex.test(input)) {
      passwordStatus.textContent = "Password must contain at least one digit.";
      password.insertAdjacentHTML('beforeend', outerThis._failed);
      password.classList.add('failed');

      return false;
    }
    else if (!specialSymbolRegex.test(input)) {
      passwordStatus.textContent = "Password must contain at least one special symbol.";
      password.insertAdjacentHTML('beforeend', outerThis._failed);
      password.classList.add('failed');

      return false;
    }
    else {
      passwordStatus.textContent = '';
      password.insertAdjacentHTML('beforeend', this._success);

      password.classList.add('success');

      return true;
    }
  }

  activateForgotCode(form) {
    const stagesContainer = form.parentElement.querySelector('.stages');
    const currentEl = form.querySelector('.field.forgot.email')
    if (currentEl) {
      currentEl.remove();
    }
    this.nextStep('forgot', stagesContainer);


    form.insertAdjacentHTML('afterbegin', this.getCodeField())
  }

  activateForgotPassword(form) {
    const stagesContainer = form.parentElement.querySelector('.stages');
    const currentEl = form.querySelector('.field.forgot.code')
    if (currentEl) {
      currentEl.remove();
    }
    // Select and remove server message
    let serverMsg = form.querySelector('.server-status');
    if (serverMsg) {
      serverMsg.remove();
    }
    this.nextStep('forgot', stagesContainer);


    form.insertAdjacentHTML('afterbegin', this.getResetPasswordFields())
  }

  validateForgotEmail(form) {
    const outerThis = this;
    const submitButton = form.querySelector('.actions > .action.next ');

    submitButton.innerHTML = outerThis.getButtonLoader();
    submitButton.style.setProperty("pointer-events", 'none');

    const email = form.querySelector('.input-group.email');

    const input = email.querySelector('input').value.trim();

    email.classList.remove('success', 'failed');
    let svg = email.querySelector('svg');
    if (svg) {
      svg.remove();
    }
    const emailStatus = email.querySelector('span.status');

    if (input === '') {
      emailStatus.textContent = 'Enter a valid email!';
      email.insertAdjacentHTML('beforeend', outerThis._failed);
      email.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
    else {
      // no Inspection
      let validRegex = /^[\w.-]+@[\w-]+\.[\w.-]+$/

      if (input.match(validRegex)) {

        // Call the API
        outerThis.checkForgotEmail(form, input, email, emailStatus);
      }
      else {
        emailStatus.textContent = 'Enter a valid email!';
        email.insertAdjacentHTML('beforeend', outerThis._failed);
        email.classList.add('failed');

        setTimeout(() => {
          submitButton.innerHTML = `<span class="text">Continue</span>`
          submitButton.style.setProperty("pointer-events", 'auto');
        }, 1000);
      }
    }
  }

  validateForgotCode(form) {
    const outerThis = this;
    const submitButton = form.querySelector('.actions > .action.next ');

    const codeInput = form.querySelector('.input-group.code');

    submitButton.innerHTML = outerThis.getButtonLoader();
    submitButton.style.setProperty("pointer-events", 'none');

    const codeStatus = codeInput.querySelector('span.status');

    codeInput.classList.remove('success', 'failed');
    let svg = codeInput.querySelector('svg');
    if (svg) {
      svg.remove();
    }


    // Validate code
    const input = codeInput.querySelector('input').value.trim();

    if (input.length >= 6) {

      // Call the API
      outerThis.checkCode(form, input, codeInput, codeStatus);
    }
    else {
      codeStatus.textContent = 'Code value cant be less than 6 chars long!';
      codeInput.insertAdjacentHTML('beforeend', outerThis._failed);
      codeInput.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
  }

  validateForgotPassword(form) {
    const outerThis = this;
    const submitButton = form.querySelector('.actions > .action.next');
    const inputField = form.querySelector('.field.password');

    // Select and remove server message
    let serverMsg = form.querySelector('.server-status');
    if (serverMsg) {
      serverMsg.remove();
    }

    const password = inputField.querySelector('.input-group.password');
    const repeatPassword = inputField.querySelector('.input-group.repeat-password');

    submitButton.innerHTML = outerThis.getButtonLoader();
    submitButton.style.setProperty("pointer-events", 'none');

    const input = password.querySelector('input').value.trim();
    const inputRepeat = repeatPassword.querySelector('input').value.trim();

    password.classList.remove('success', 'failed');
    repeatPassword.classList.remove('success', 'failed');
    let svg = password.querySelector('svg');
    let svgRepeat = repeatPassword.querySelector('svg');
    if (svg && svgRepeat) {
      svg.remove();
      svgRepeat.remove();
    }


    const passwordStatus = password.querySelector('span.status');
    const repeatStatus = repeatPassword.querySelector('span.status');

    if (input === '') {
      passwordStatus.textContent = 'Password is required!';
      password.insertAdjacentHTML('beforeend', outerThis._failed);
      password.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);

      return;
    }
    
    if (this.isPassword(input, password, passwordStatus)) {
      if (input === inputRepeat) {
        repeatStatus.textContent = "";
        repeatPassword.insertAdjacentHTML("beforeend", this._success);

        this._data.recovery["password"] = input;

        repeatPassword.classList.add("success");

        // API Call
        this.activateForgotFinish(form.parentElement);
      } else {
        repeatStatus.textContent = "Passwords must match be equal!";
        repeatPassword.insertAdjacentHTML("beforeend", outerThis._failed);
        repeatPassword.classList.add("failed");

        setTimeout(() => {
          submitButton.innerHTML = `<span class="text">Continue</span>`;
          submitButton.style.setProperty("pointer-events", "auto");
        }, 1000);
      }
    } else {
      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`;
        submitButton.style.setProperty("pointer-events", "auto");
      }, 1000);
    }
  }

  checkForgotEmail = async (form, input, email, emailStatus) => {
    const submitButton = form.querySelector('.actions > .action.next');

    // After API call
    const {
      result,
      error
    } = await this.apiForget({ email: input });

    // If error occurs
    if (error) {
      const errorMsg = this.getServerMsg('Something went wrong, try again!');
      form.insertAdjacentHTML('afterbegin', errorMsg);

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }

    // If email does not exist
    if (!result.success) {
      emailStatus.textContent = result.message;
      email.insertAdjacentHTML('beforeend', this._failed);
      email.classList.add('failed');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
    else {
      // Add email to the data object
      this._data.recovery['email'] = input;

      // Add returned user to the local object
      this._data.user = result.user;

      const errorMsg = this.getServerSuccessMsg(result.message);
      form.insertAdjacentHTML('afterbegin', errorMsg);


      emailStatus.textContent = result.message;
      email.insertAdjacentHTML('beforeend', this._success);

      email.classList.add('success');

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
        this.activateForgotCode(form)
      }, 2000);
    }
  }

  apiForget = async data => {
    const outerThis = this;
    const url = outerThis.getAttribute('api-forgot-password');
    try {
      const body = JSON.stringify(data);
      const result = await this.api.post(url, { content: 'json', body });

      return {
        result: result,
        error: null
      }
    }
    catch (error) {
      return {
        result: null,
        error: error
      }
    }
  }

  apiVerify = async data => {
    const outerThis = this;
    const url = outerThis.getAttribute('api-verify-token');
    try {
      const body = JSON.stringify(data);
      const result = await this.api.post(url, { content: 'json', body });

      return {
        result: result,
        error: null
      }
    }
    catch (error) {
      return {
        result: null,
        error: error
      }
    }
  }

  apiResetPassword = async data => {
    const outerThis = this;
    const url = outerThis.getAttribute('api-reset-password');
    try {
      const body = JSON.stringify(data);
      const result = await this.api.patch(url, { content: 'json', body });

      return {
        result: result,
        error: null
      }
    }
    catch (error) {
      return {
        result: null,
        error: error
      }
    }
  }

  checkCode = async (form, input, codeInput, codeStatus) => {
    const outerThis = this;
    const submitButton = form.querySelector('.actions > .action.next');


    // After API call
    const {
      result,
      error
    } = await this.apiVerify({ token: input, email: outerThis._data.recovery['email'] });

    // If error occurs
    if (error) {
      const errorMsg = this.getServerMsg('Something went wrong, try again!');
      form.insertAdjacentHTML('afterbegin', errorMsg);

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }

    // If verification is successful
    if (result.success) {
      codeStatus.textContent = result.message;
      codeInput.insertAdjacentHTML('beforeend', this._success);

      setTimeout(() => {
        codeInput.classList.add('success');
      }, 1000);

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
        this.activateForgotPassword(form)
      }, 2000);
    }
    else {
      codeStatus.textContent = result.message;
      codeInput.insertAdjacentHTML('beforeend', this._failed);

      setTimeout(() => {
        submitButton.innerHTML = `<span class="text">Continue</span>`
        submitButton.style.setProperty("pointer-events", 'auto');
      }, 1000);
    }
  }

  activateFinish(contentContainer, data) {
    const outerThis = this;
    const stagesContainer = contentContainer.querySelector('.stages');
    const contentTitle = contentContainer.querySelector('.head > .logo h2 span.action');
    const finish = this.getRegSuccess(data);
    const form = contentContainer.querySelector('form');

    setTimeout(() => {
      form.remove();
      outerThis.nextStep('register', stagesContainer);
      stagesContainer.insertAdjacentHTML('afterend', finish)

      outerThis.activateLogin(contentContainer, stagesContainer, contentTitle);
    }, 1000);
  }

  activateLoginFinish(contentContainer, name) {
    const outerThis = this;
    // get the next attribute
    const next = this.getAttribute('next') || '/home';

    const stagesContainer = contentContainer.querySelector('.stages');
    const finish = this.getLoginSuccess(name);
    const form = contentContainer.querySelector('form');

    setTimeout(() => {
      form.remove();
      outerThis.nextStep('login', stagesContainer);
      stagesContainer.insertAdjacentHTML('afterend', finish)

      // redirect user after 5 seconds
      outerThis.redirectUser(next);
    }, 1000);
  }

  redirectUser = async url => {
    // set window user(hash)
    this.setHash('hash');

    // destroy the current user-cache
    const userCache  = 'user-cache';

    // delete cache: user-cache
    await caches.delete(userCache);

    // set 5 seconds timeout before redirecting
    setTimeout(() => {
      window.location.replace(url);
    }, 5000);
  }

  activateForgotFinish = async contentContainer => {
    const outerThis = this;
    const stagesContainer = contentContainer.querySelector('.stages');
    const contentTitle = contentContainer.querySelector('.head > .logo h2 span.action');
    const form = contentContainer.querySelector('form');

    // construct data for reset password
    if(!outerThis._data.recovery.email || !outerThis._data.recovery.password) {
      // Show error message
      const errorMsg = outerThis.getServerMsg('Some fields are missing!');
      form.insertAdjacentHTML('afterbegin', errorMsg);
    }

    const resetData = {
      email: outerThis._data.recovery.email,
      password: outerThis._data.recovery.password
    }

    // Call the api for resetting the password
    const {
      result,
      error
    } = await outerThis.apiResetPassword(resetData);

    // If error occurs
    if (error) {
      const errorMsg = outerThis.getServerMsg('Something went wrong, try again!');
      form.insertAdjacentHTML('afterbegin', errorMsg);
    }

    // If reset is successful
    if (result.success) {
      const finish = this.getForgotSuccess(result.user.name);
      setTimeout(() => {
        form.remove();
        outerThis.nextStep('forgot', stagesContainer);
        stagesContainer.insertAdjacentHTML('afterend', finish)

        outerThis.activateLogin(contentContainer, stagesContainer, contentTitle);
      }, 1000);
    }
    else {
      const errorMsg = outerThis.getServerMsg(result.message);
      form.insertAdjacentHTML('afterbegin', errorMsg);
    }
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

  getTemplate() {
    return `
      <div class="logon-container">
        ${this.getHeader()}
        ${this.getStages()}
        ${this.initialInterface(this.getAttribute('name'))}
        ${this.getFooter()}
      </div>

      ${this.getStyles()}
    `
  }

  initialInterface = (startName) => {
    const outerThis = this;
    // check if the user is already logged in
    if (this._authenticated) {
      return outerThis.getAlreadyLoggedIn('You are already logged in!');
    }

    switch (startName) {
      case 'join':
        return outerThis.getWelcome()
      case 'login':
        return outerThis.getLoginForm();
      case 'register':
        return outerThis.getRegistrationForm();
      case 'forgot':
        return outerThis.getForgotForm();
      default:
        return outerThis.getWelcome();
    }
  }

  getLoader() {
    return `
      <div id="loader-container">
				<div class="loader"></div>
			</div>
    `
  }

  getButtonLoader() {
    return `
      <span id="btn-loader">
				<span class="loader"></span>
			</span>
    `
  }

  getBtnAltLoader() {
    return `
      <span id="btn-loader">
				<span class="loader-alt"></span>
			</span>
    `
  }

  getHeader() {
    return `
      <div class="head">
				<div class="logo">
					<h2 class="main">
						<span class="action">Join</span> - Pau</h2>
					<span class="slogan">Create and contribute to ideas that can change the world.</span>
				</div>
			</div>
    `
  }

  getStages() {
    return `
      <div class="stages welcome-stages">
				<span class="no stage first active">1</span>
				<span class="no stage second">2</span>
				<span class="no stage third">3</span>
        <span class="no stage fourth">4</span>
				<span class="stage done">
					<span class="left"></span>
					<span class="right"></span>
				</span>
			</div>
    `
  }

  getWelcome() {
    return /*html*/`
      <div class="welcome">
				<p>
					Connect with vibrant minds and share or contribute to ideas that can change the world.
          Join our community today, and start sharing your thoughts.
				</p>
				<a href="${this.getAttribute('login')}" class="login">Login</a>
				<a href="${this.getAttribute('register')}" class="register">Register</a>
        <p class="forgot">
          Forgot your password? <a href="${this.getAttribute('forgot')}" class="forgot">Click here</a>
        </p>
				<div class="info">
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill"
						viewBox="0 0 16 16">
						<path
							d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
					</svg>
					By continuing you indicate that you agree to <a href="/soon" class="aduki">aduki's</a> <a href="/soon">Terms of Service</a> and <a href="">Privacy
						Policy</a>.
				</div>
			</div>
    `
  }

  getRegSuccess(data) {
    return /*html*/`
      <div class="finish">
        <h2 class="title">Welcome!</h2>
				<p>
					Dear ${data.name} your account has been created successfully. Please log in into your account to start sharing great ideas.
				</p>
				<a href="/login/" class="login">Login</a>
			</div>
    `
  }

  getLoginSuccess = name => {
    // get the next attribute
    const next = this.getAttribute('next') || '/home';

    const display = next.length > 30 ? next.substring(0, 30) + '..' : next;

    return /*html*/`
      <div class="finish login-success">
        <p>Welcome</p>
        <h2 class="title">${name}</h2>
        <p class="next">
          You've successfully login into your account. You will be redirected to <span class="url">${display}</span> in 5 seconds. 
          Or you can click <a href="${next}">here</a> to continue.
        </p>
			</div>
    `
  }

  getAlreadyLoggedIn = name => {
    // get the next attribute
    const next = this.getAttribute('next') || '/home';
    return /*html*/`
      <div class="welcome login-success">
        <h2 class="title">${name}</h2>
        <p class="next">
          You can continue to with this account or login into another account. Please note that: <span class="warn">This will remove the current session.</span>
        </p>
        <a href="${this.getAttribute('login')}" class="login">Login</a>
				<a href="${next}" class="continue">Continue</a>
			</div>
    `
  }

  getForgotSuccess = name => {
    return /*html*/`
      <div class="finish">
        <h2 class="title">Success!</h2>
				<p>
					Dear ${name} your password has been successfully reset. Please log in into your account.
				</p>
				<a href="/join/login/" class="login">Login</a>
			</div>
    `
  }

  getRegistrationForm() {
    return /* html */`
      <form class="fields initial">
				${this.getBioFields()}
				<div class="actions">
					<button type="button" class="action prev">
						<span class="text">Back</span>
					</button>
					<button type="submit" class="action next">
						<span class="text">Continue</span>
					</button>
				</div>
			</form>
    `
  }

  getServerMsg = text => {
    return /*html*/`
      <p class="server-status">${text}</p>
    `
  }

  getServerSuccessMsg = text => {
    return /*html*/`
      <p class="server-status success">${text}</p>
    `
  }

  getBioFields() {
    return /*html*/`
      <div class="field bio">
				<div class="input-group firstname">
					<label for="firstname" class="center">First name</label>
					<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
						<path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
					</svg>
					<input data-name="firstname" type="text" name="firstname" id="firstname" placeholder="e.g John" required>
					<span class="status">First name is required</span>
				</div>
				<div class="input-group lastname">
					<label for="lastname" class="center">Last name</label>
					<input data-name="lastname" type="text" name="lastname" id="lastname" placeholder="e.g Doe" required>
					<span class="status">Last name is required</span>
				</div>
				<div class="input-group email">
					<label for="email" class="center">Email</label>
					<input data-name="Email" type="email" name="email" id="email" placeholder="e.g john@example.com" required>
					<span class="status">Email is required</span>
				</div>
			</div>
    `
  }

  getPasswordFields() {
    return /*html*/`
      <div class="field password bio">
				<div class="input-group password">
					<label for="password" class="center">Password</label>
					<input data-name="password" type="password" name="password" id="password" placeholder="Enter your password" required>
					<span class="status">Password is required</span>
				</div>
				<div class="input-group repeat-password">
					<label for="password2" class="center">Repeat password</label>
					<input data-name="password2" type="password" name="password2" id="password2" placeholder="Repeat your password" required>
					<span class="status">Password is required</span>
				</div>
			</div>
    `
  }

  getForgotForm() {
    return /*html*/`
      <form class="fields initial">
				${this.getForgotFields()}
				<div class="actions">
					<button type="button" class="action prev">
						<span class="text">Back</span>
					</button>
					<button type="submit" class="action next">
						<span class="text">Continue</span>
					</button>
				</div>
			</form>
    `
  }

  getForgotFields = () => {
    return `
      <div class="field forgot bio email">
				<div class="input-group email">
					<label for="email" class="center">Your email</label>
					<input data-name="Email" type="email" name="email" id="email" placeholder="e.g john@example.com" required>
					<span class="status">Email is required</span>
				</div>
			</div>
    `
  }

  getCodeField = () => {
    return `
      <div class="field forgot bio code">
        <div class="input-group code">
          <label for="code" class="center">Verify code</label>
          <input data-name="code" type="text" name="code" id="code" placeholder="Enter code sent to your email" required>
          <span class="status">Code is required</span>
        </div>
      </div>
    `
  }

  getResetPasswordFields = () => {
    return `
      <div class="field password bio forgot">
				<div class="input-group password">
					<label for="password" class="center">New Password</label>
					<input data-name="password" type="password" name="password" id="password" placeholder="Enter your new password" required>
					<span class="status">Password is required</span>
				</div>
				<div class="input-group repeat-password">
					<label for="password2" class="center">Repeat password</label>
					<input data-name="password2" type="password" name="password2" id="password2" placeholder="Repeat your password" required>
					<span class="status">Password is required</span>
				</div>
			</div>
    `
  }

  getLoginForm() {
    return `
      <form class="fields initial bio">
				<div class="field login bio">
					<div class="input-group user-key">
						<label for="email" class="center">Email</label>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
							<path
								d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
						</svg>
						<input data-name="email" type="email" name="email" id="email" placeholder="e.g john@example.com"
							required>
						<span class="status">Username or email is required</span>
					</div>
					<div class="input-group password">
						<label for="password" class="center">Password</label>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
							<path
								d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
						</svg>
						<input data-name="password" type="password" name="password" id="password" placeholder="Your password"
							required>
						<span class="status">Password is required</span>
					</div>
				</div>
				<div class="actions">
					<button type="button" class="action prev">
						<span class="text">Back</span>
					</button>
					<button type="submit" class="action next">
						<span class="text">Login</span>
					</button>
				</div>
			</form>
    `
  }

  getFooter() {
    const newDate = new Date(Date.now());
    return `
      <ul class="footer">
				<li>
					<span class="dot"></span>
					<a href="" class="copyright">
						<span class="copy">&copy;</span>
						<span class="year">${newDate.getFullYear()}</span>
						aduki Inc.
					</a>
				</li>
				<li>
					<span class="dot"></span>
					<a href="">About</a>
				</li>
				<li>
					<span class="dot"></span>
					<a href="">Community</a>
				</li>
				<li>
					<span class="dot"></span>
					<a href="">What's new</a>
				</li>
				<li>
					<span class="dot"></span>
					<a href="">Terms</a>
				</li>
			</ul>
    `
  }

  getStyles() {
    return /*css*/`
      <style>
        * {
          box-sizing: border-box !important;
        }
        *,
        *:after,
        *:before {
          box-sizing: border-box;
          font-family: var(--font-read), sans-serif;
        }

        *:focus {
          outline: inherit !important;
        }

        *::-webkit-scrollbar {
          width: 3px;
        }

        *::-webkit-scrollbar-track {
          background: #DDDDD7;
        }

        *::-webkit-scrollbar-thumb {
          width: 3px;
          background: linear-gradient(#53595f, #627ea0);
          border-radius: 50px;
        }

        :host{
          width: 100%;
          min-height: 100vh;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-position: 100%;
          background-size: 1rem 1rem;
          background-color: var(--logon-background);
          background-image: var(--logon-image);
        }

        #loader-container {
          position: absolute;
          top: 0;
          left: 0;
          bottom: 0;
          right: 0;
          z-index: 5;
          background-color: var(--loader-background);
          backdrop-filter: blur(1px);
          -webkit-backdrop-filter: blur(1px);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: inherit;
          -webkit-border-radius: inherit;
          -moz-border-radius: inherit;
        }

        #loader-container > .loader {
          width: 35px;
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

        .logon-container {
          background: var(--logon-background);
          z-index: 3;
          padding: 20px;
          width: 700px;
          height: max-content;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          box-shadow: var(--logon-shadow);
          border-radius: 10px;
          position: relative;
        }

        .logon-container > .head {
          background-color: transparent;
          margin: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          font-family: var(--font-text), sans-serif;
        }

        .logon-container > .head > .logo {
          max-height: max-content;
          position: relative;
          padding: 0;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
          gap: 5px;
        }

        .logon-container >.head>.logo h2 {
          margin: 0;
          padding: 0;
          line-height: 1.4;
          font-weight: 600;
          font-size: 1.8rem;
          color: transparent;
          background: var(--stage-no-linear);
          background-clip: text;
          -webkit-background-clip: text;
          font-family: var(--font-main), monospace;
        }

        .logon-container > .head > .logo span.slogan {
          margin: 0;
          width: 100%;
          color: var(--gray-color);
          line-height: 1.4;
          font-family: var(--font-main), sans-serif;
          font-weight: 400;
          font-size: 0.9rem;
          text-align: center;
        }

        .logon-container > .stages {
          background-color: transparent;
          height: max-content;
          width: max-content;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin: 10px 0 10px 0;
        }

        .logon-container > .stages span.done {
          background: var(--stage-done-linear);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        .logon-container>.stages span.done > span {
          display: inline-block;
          height: 3px;
          width: 8px;
          position: absolute;
          background-color: var(--white-color);
          border-radius: 5px;
          -webkit-border-radius: 5px;
          -moz-border-radius: 5px;
        }

        .logon-container>.stages span.done > span.left {
          top: 15px;
          left: 7px;
          rotate: 45deg;
        }

        .logon-container>.stages span.done > span.right {
          rotate: -45deg;
          left: 11px;
          width: 14px;
        }

        .logon-container>.stages span.done.active {
          background: var(--stage-active-linear);
        }

        .logon-container > .stages span.no {
          text-align: center;
          font-weight: 600;
          font-size: 1.2rem;
          padding: 3px 2px 0 2px;
          background: var(--stage-done-linear);
          color: var(--white-color);
          width: 30px;
          height: 30px;
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        .logon-container > .stages.login span.no.fourth,
        .logon-container > .stages.login span.no.third {
          display: none;
        }

        .logon-container > .stages.welcome-stages span.no.fourth,
        .logon-container > .stages.welcome-stages span.no.third {
          display: none;
        }

        .logon-container > .stages.register span.no.fourth,
        .logon-container > .stages.register span.no.third {
          display: none;
        }

        .logon-container > .stages.forgot span.no.fourth,
        .logon-container > .stages.forgot span.no.third {
          display: none;
        }

        .logon-container > .stages span.no.active {
          background: var(--stage-no-linear);
        }

        .logon-container > .welcome {
          width: 98%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          row-gap: 10px;
          justify-content: center;
        }

        .logon-container > .finish {
          width: 90%;
          display: flex;
          flex-flow: column;
          align-items: center;
          justify-content: center;
        }

        .logon-container > .login-success > h2,
        .logon-container > .finish > h2 {
          grid-column: 1/3;
          margin: 10px 0;
          font-family: var(--font-text), sans-serif;
          text-align: center;
          color: var(--title-color);
          line-height: 1.4;
          font-size: 1.5rem;
        }

        p.server-status {
          grid-column: 1/3;
          margin: 0;
          order: 0;
          text-align: center;
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

        .logon-container > .finish  p,
        .logon-container>.welcome  p {
          grid-column: 1/3;
          margin: 0;
          text-align: center;
          font-family: var(--font-read), sans-serif;
          color: var(--highlight-color);
          line-height: 1.4;
          font-size: 1.15rem;
        }

        .logon-container > .finish  p.next > .url,
        .logon-container>.welcome  p.next > .url {
          background: var(--gray-background);
          color: var(--gray-color);
          padding: 2px 5px;
          font-size: 0.95rem;
          font-weight: 400;
          border-radius: 5px;
        }

        .logon-container > .welcome  p.next > a,
        .logon-container > .finish  p.next > a {
          text-decoration: none;
          font-weight: 500;
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .logon-container > .welcome  p.next .warn {
          color: var(--error-color);
          font-weight: 500;
          font-size: 0.9rem;
          background: var(--gray-background);
          padding: 2px 5px;
          border-radius: 5px;
        }

        .logon-container > .finish > a,
        .logon-container >.welcome > a {
          background: var(--stage-no-linear);
          text-decoration: none;
          padding: 10px 20px;
          cursor: pointer;
          margin: 20px 0;
          width: 150px;
          justify-self: center;
          text-align: center;
          color: var(--white-color);
          border: none;
          font-size: 1.15rem;
          font-weight: 500;
          border-radius: 15px;
        }

        .logon-container > .welcome > a:last-of-type {
          background: var(--stage-active-linear);
        }

        .logon-container >.welcome > .info {
          grid-column: 1/3;
          text-align: center;
          color: var(--text-color);
          line-height: 1.4;
        }
        
        .logon-container > .welcome > .info svg {
          margin: 0 0 -3px 0;
          color: var(--accent-color);
          width: 18px;
          height: 18px;
        }

        .logon-container > .welcome > .info .aduki {
          color: transparent;
          background: var(--stage-no-linear);
          background-clip: text;
          -webkit-background-clip: text;
          font-weight: 400;
        }

        .logon-container>.welcome>.info a {
          color: var(--gray-color);
          font-size: 1em;
        }

        .logon-container>.welcome>.info a:hover {
          color: transparent;
          text-decoration: underline;
          background: var(--stage-active-linear);
          background-clip: text;
          -webkit-background-clip: text;

        }

        .logon-container >.welcome > p.forgot {
          grid-column: 1/3;
          text-align: center;
          margin: 0 0 10px 0;
          color: var(--text-color);
          line-height: 1.4;
        }

        .logon-container > .welcome > p.forgot a {
          color: var(--gray-color);
          text-decoration: none;
          font-size: 1em;
        }

        .logon-container > .welcome > p.forgot a:hover {
          color: transparent;
          background: var(--accent-linear);
          background-clip: text;
          -webkit-background-clip: text;
        }

        .logon-container > .fields {
          margin: 0 0 20px 0;
          width: 100%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: center;
          gap: 20px;
        }

        .logon-container > .fields .field.bio{
          display: grid;
          grid-template-columns: 1fr 1fr;
          justify-content: center;
          column-gap: 20px;
          row-gap: 20px;
        }

        .logon-container > .fields > .field {
          width: 90%;
          display: flex;
          flex-flow: column;
          justify-content: center;
          align-items: start;
          gap: 2px;
        }

        .logon-container > .fields.center > .field {
          align-items: center;
        }

        .logon-container > .fields .field .input-group {
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

        .logon-container > .fields .field.bio .input-group {
          width: 100%;
        }

        .logon-container > .fields .field.bio .input-group.code,
        .logon-container > .fields .field.bio .input-group.email {
          grid-column: 1/3;
          width: 100%;
        }

        .logon-container > .fields .field .input-group > svg {
          position: absolute;
          right: 10px;
          top: 38px;
          width: 20px;
          height: 20px;
        }

        .logon-container > .fields .field .input-group > svg {
          display: none;
        }

        .logon-container > .fields .field .input-group.success > svg {
          display: inline-block;
        }
        .logon-container > .fields .field  .input-group.failed > svg {
          display: inline-block;
        }

        .logon-container > .fields .field .input-group.success > svg {
          color: var(--accent-color);
        }

        .logon-container > .fields .field  .input-group.failed > svg {
          color: var(--error-color);
        }

        .logon-container > .fields label {
          padding: 0 0 5px 0;
          color: var(--highlight-color);
          font-weight: 500;
          color: var(--text-color);
        }

        .logon-container > .fields .field.bio label{
          padding: 0 0 0 5px;
        }

        .logon-container > .fields label {
          color: var(--text-color);
          font-size: 1.1rem;
          font-family: var(--font-main),sans-serif;
          transition: all 0.3s ease-in-out;
          pointer-events: none;
        }

        .logon-container > .fields .field input {
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
        
        .logon-container > .fields .field input:-webkit-autofill,
        .logon-container > .fields .field input:-webkit-autofill:hover, 
        .logon-container > .fields .field input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px var(--background) inset;
          -webkit-text-fill-color: var(--text-color) !important;
          transition: background-color 5000s ease-in-out 0s;
          color: var(--text-color) !important;
        }
        
        .logon-container > .fields .field input:autofill {
          filter: none;
          color: var(--text-color) !important;
        }

        .logon-container > .fields .field input:focus {
          border: var(--input-border-focus);
        }

        .logon-container > .fields .field  .input-group.success input,
        .logon-container > .fields .field  .input-group.success input:focus {
          border: var(--input-border-focus);
        }

        .logon-container > .fields .field  .input-group.failed input,
        .logon-container > .fields .field  .input-group.failed input:focus {
          border: var(--input-border-error);
        }

        .logon-container > .fields .field  .input-group.success input {
          color: var(--accent-color);
        }

        .logon-container > .fields .field .input-group.failed input {
          color: var(--error-color);
        }

        .logon-container > .fields label.focused {
          top: -10px;
          font-size: 0.9rem;
          background-color: var(--label-focus-background);
          padding: 0 5px;
        }

        .logon-container > .fields .field span.status {
          color: var(--error-color);
          font-size: 0.95rem;
          display: none;
          padding: 0 0 0 5px;
        }

        .logon-container > .fields .field .input-group.failed span.status {
          color: var(--error-color);
          font-size: 0.8rem;
          display: inline-block;
        }

        .logon-container > .fields .field  .input-group.success span.status {
          color: var(--accent-color);
          font-size: 0.8rem;
          display: inline-block;
        }

        .logon-container > .fields .field  .input-group.success span.status {
          display: none;
        }

        .logon-container > .fields .actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 90%;
          margin: 20px 0 0 0;
        }

        .logon-container > .fields .actions > .action {
          display: flex;
          flex-flow: row;
          justify-content: center;
          align-items: center;
          gap: 5px;
          border: none;
          border-radius: 15px;
          font-family: var(--font-main), sans-serif;
          line-height: 1.2;
          font-size: 1.2rem;
          font-weight: 500;
          color: var(--highlight-color);
          width: 120px;
          padding: 8px 10px;
          height: 40px;
          cursor: pointer;
          position: relative;
          -webkit-border-radius: 15px;
          -moz-border-radius: 15px;
        }

        .logon-container > .fields .actions > .action.prev {
          background: var(--gray-background);
        }

        .logon-container > .fields .actions > .action.prev svg path {
          fill: var(--text-color);
        }

        .logon-container > .fields .actions > .action.next {
          color: var(--white-color);
          background: var(--stage-no-linear);
        }

        .logon-container >.fields .actions > .action.next svg path {
          fill: var(--white-color);
        }

        .logon-container>.fields .actions>.action.disabled {
          pointer-events: none;
        }

        /* Logon Footer */
        .logon-container >.footer {
          border-top: var(--story-border);
          margin: 10px 0 0 0;
          width: 100%;
          padding: 10px 0 10px 0;
          display: flex;
          flex-flow: row;
          justify-content: center;
          align-items: center;
          gap: 15px;
        }

        .logon-container > .footer > li {
          display: flex;
          flex-flow: row;
          justify-content: center;
          align-items: center;
          gap: 5px;
          font-family: var(--font-read), sans-serif;
          color: var(--gray-color);
          cursor: pointer;
        }

        .logon-container > .footer > li span.dot {
          display: inline-block;
          margin: 2px 0 0 0;
          width: 5px;
          height: 5px;
          background-color: var(--gray-color);
          border-radius: 50px;
          -webkit-border-radius: 50px;
          -moz-border-radius: 50px;
        }

        .logon-container > .footer > li a {
          color: inherit;
          line-height: 1.4;
          text-decoration: none;
          font-size: 1rem;
          font-weight: 400;
        }

        .logon-container > .footer > li:hover {
          color: var(--anchor-color);
          text-decoration: underline;
        }

        .logon-container > .footer > li:hover span.dot {
          background-color: var(--anchor-color);
        }

        .logon-container > .footer > li a.copyright {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          font-family: var(--font-read), sans-serif;
        }

        .logon-container > .footer > li a.copyright .year {
          font-family: var(--font-read), sans-serif;
          font-size: 1em;
          padding: 0 5px 0 2px;
          font-weight: 400;
        }

        @media screen and (max-width:700px) {

          :host {
            width: 100%;
            min-height: 100vh;
            height: 100%;
            display: flex;
            align-items: start;
            justify-content: center;
            background-color: var(--background);
            background-position: unset;
            background-size: unset;
            background-image: unset;
          }

          .logon-container > .head {
            background-color: transparent;
            margin: 20px 0 0 0;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0;
            font-family: var(--font-text), sans-serif;
          }

          .logon-container > .stages {
            background-color: transparent;
            height: max-content;
            width: max-content;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin: 0 0 20px 0;
          }

          .logon-container {
            background: var(--background);
            box-shadow: unset;
            z-index: 3;
            padding: 20px 10px;
            width: 100%;
            height: max-content;
            display: flex;
            flex-flow: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
            border-radius: 0;
            position: relative;
          }

          .logon-container > .welcome {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            row-gap: 10px;
            justify-content: center;
          }

          .logon-container > .finish > a,
          .logon-container > .welcome > a {
            background: var(--stage-no-linear);
            text-decoration: none;
            padding: 8px 20px;
            cursor: default;
            margin: 20px 0;
            width: 130px;
          }

          .logon-container > .finish  p,
          .logon-container>.welcome  p {
            font-size: 1rem;
          }

          .logon-container > .fields .actions > .action {
            cursor: default;
          }

          .logon-container > .fields .field.bio{
            display: flex;
            flex-flow: column;
            gap: 20px;
          }

          .logon-container > .welcome > .info {
            margin: 20px 0 0 0;
            font-size: 0.9rem;
          }

          .logon-container > .welcome > .info svg {
            margin: 0 0 -3px 0;
            color: var(--accent-color);
            width: 14px;
            height: 14px;
          }

          .logon-container > .footer {
            margin: 10px 0 0 0;
            display: flex;
            flex-flow: row;
            flex-wrap: wrap;
            justify-content: center;
            align-items: center;
            gap: 0;
          }

          .logon-container > .footer > li {
            display: flex;
            margin: 5px 10px 0 0;
            cursor: default;
          }

          .logon-container > .footer > li a {
            color: inherit;
            line-height: 1.4;
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 400;
          }

          .logon-container > .footer > li:first-of-type {
            order: 5;
          }
        }
      </style>
    `;
  }
}