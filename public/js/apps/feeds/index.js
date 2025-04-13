// Import all feeds
import ActivityFeed from "./activity.js";
import PeopleFeed from "./people.js";
import PostFeed from "./posts.js";
import UpdateFeed from "./update.js";
import users from "./users/index.js";

export default function feeds() {
  // Register feeds
  users();
  customElements.define("activity-feed", ActivityFeed);
  customElements.define("posts-feed", PostFeed);
  customElements.define("update-feed", UpdateFeed);
  customElements.define("people-feed", PeopleFeed);
}