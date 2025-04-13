import HomeAll from "./all.js";
import HomeNews from "./news.js";
import HomePeople from "./people.js";
import HomeRecent from "./recent.js";
import HomeStories from "./stories.js";
import HomeTopics from "./topics.js";

// registaer all
export default function all(){
  customElements.define('home-all', HomeAll);
  customElements.define('home-stories', HomeStories);
  customElements.define('home-topics', HomeTopics);
  customElements.define('home-people', HomePeople);
  customElements.define('home-recent', HomeRecent);
  customElements.define('home-news', HomeNews);
}