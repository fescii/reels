// Import all posts
import QuickPost from "./quick.js";
import PollPoll from "./poll.js";
import StoryPost from "./story.js";
import TrendingStory from "./trending.js";
import PreviewPost from "./preview.js";
import ReplyPost from "./reply.js";
import editors from "./editors/index.js";

// Export all posts
export default function posts() {
  // Register posts
  editors();
  customElements.define("quick-post", QuickPost);
  customElements.define("poll-post", PollPoll);
  customElements.define("story-post", StoryPost);
  customElements.define("preview-post", PreviewPost);
  customElements.define("reply-post", ReplyPost);
  customElements.define("trending-story", TrendingStory);
}