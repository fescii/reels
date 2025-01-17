// Extending the functionality of the span element
export default class CustomSpan extends HTMLSpanElement {
  constructor() {
    super('span');

    // render the element
    this.render();

    // set styles
    this.setStyles();
  }

  // attributes to watch for
  static get observedAttributes() {
    return ['width'];
  }

  // render the element
  render() {
    this.innerHTML = this.getTemplate();
  }

  // connected callback
  connectedCallback() {
  }

  // attribute change callback
  attributeChangedCallback(name, oldValue, newValue) {
    this.setStyles();
  }

  // get the template
  getTemplate() {
    return `
      ${this.innerHTML}
    `;
  }

  // Set styles
  setStyles() {
    // set display property to inline-block
    this.style.display = 'inline-block';

    // set width based on the attribute
    this.style.width = this.getAttribute('width') || 'auto';
  }
}