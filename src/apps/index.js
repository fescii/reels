import AppMain from "./app.js";

export default function app(text) {
  customElements.define('app-main', AppMain);
  console.log(text);
}