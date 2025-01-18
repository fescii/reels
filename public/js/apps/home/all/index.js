import HomeAll from "./all.js";
import HomeStories from "./stories.js";
import HomeTopics from "./topics.js";
import HomeTopics from "./topics.js";
import HomeFeed from "./feed.js"

// registaer all
export default function all(){
  customElements.define('home-all', HomeAll);
  customElements.define('home-stories', HomeStories);
  customElements.define('home-topics', HomeTopics);
  customElements.define('home-people', HomePeople);
  customElements.define('home-feed', HomeFeed);
}