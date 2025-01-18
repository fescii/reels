// import apps
import AppHome from "./home.js";
import all from "./all/index.js";
import feed from "./feed/index.js";

export default function home() {
  // Register apps
  customElements.define("app-home", AppHome);
  all();
  feed();
}