// Import all feeds
import ActivityFeed from "./activity.feed.js";
import PeopleFeed from "./people.feed.js";
import StoriesFeed from "./stories.feed.js";
import RepliesFeed from "./replies.feed.js";
import StatFeed from "./stat.feed.js";
import TopicFeed from "./topic.feed.js";
import HomeFeed from "./home.feed.js";
import UpdateFeed from "./update.feed.js";
import ContentFeed from "./content.feed.js";


export default function feeds() {
  // Register feeds
  customElements.define("activity-feed", ActivityFeed);
  customElements.define("people-feed", PeopleFeed);
  customElements.define("stories-feed", StoriesFeed);
  customElements.define("replies-feed", RepliesFeed);
  customElements.define("stat-feed", StatFeed);
  customElements.define("topics-feed", TopicFeed);
  customElements.define("home-feed", HomeFeed);
  customElements.define("update-feed", UpdateFeed);
  customElements.define("content-feed", ContentFeed);
}