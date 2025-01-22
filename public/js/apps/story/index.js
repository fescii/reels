import AppStory from "./story.js";
import TrendingStories from "./trending.js";

export default function story() {
  customElements.define("app-story", AppStory);
  customElements.define("trending-stories", TrendingStories);
}