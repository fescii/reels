// Import all feeds
import ActivityFeed from "./activity.js";
import StoriesFeed from "./stories.js";
import RepliesFeed from "./replies.js";
import StatFeed from "./stat.js";
import TopicFeed from "./topic.js";
import UpdateFeed from "./update.js";
import users from "./users/index.js";


export default function feeds() {
  // Register feeds
  users();
  customElements.define("activity-feed", ActivityFeed);
  customElements.define("stories-feed", StoriesFeed);
  customElements.define("replies-feed", RepliesFeed);
  customElements.define("stat-feed", StatFeed);
  customElements.define("topics-feed", TopicFeed);
  customElements.define("update-feed", UpdateFeed);
}