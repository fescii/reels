import StoryFeed from "./stories.js";
import ReplyFeed from "./replies.js";
import UserFeed from "./users.js";

export default function feed() {
  customElements.define('home-stories-feed', StoryFeed);
  customElements.define('home-replies-feed', ReplyFeed);
  customElements.define('home-users-feed', UserFeed);
}