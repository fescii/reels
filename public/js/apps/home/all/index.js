import HomeAll from "./all.js";
import HomeNews from "./news.js";

// registaer all
export default function all(){
  customElements.define('home-all', HomeAll);
  customElements.define('home-news', HomeNews);
}