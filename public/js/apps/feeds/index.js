// Import all feeds
import ActivityFeed from "./activity.js";
import PeopleFeed from "./people.js";
import StoriesFeed from "./stories.js";
import RepliesFeed from "./replies.js";
import StatFeed from "./stat.js";
import TopicFeed from "./topic.js";
import UpdateFeed from "./update.js";
import ContentFeed from "./content.js";


export default function feeds() {
  // Register feeds
  customElements.define("activity-feed", ActivityFeed);
  customElements.define("people-feed", PeopleFeed);
  customElements.define("stories-feed", StoriesFeed);
  customElements.define("replies-feed", RepliesFeed);
  customElements.define("stat-feed", StatFeed);
  customElements.define("topics-feed", TopicFeed);
  customElements.define("update-feed", UpdateFeed);
  customElements.define("content-feed", ContentFeed);
}