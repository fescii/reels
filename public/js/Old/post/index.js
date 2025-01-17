// Import all posts
import QuickPost from "./quick.post.js";
import PollPoll from "./poll.post.js";
import StoryPost from "./story.post.js";
import PreviewPost from "./preview.post.js";
import ReplyPost from "./reply.post.js";

// Export all posts
export default function posts() {
  // Register posts
  customElements.define("quick-post", QuickPost);
  customElements.define("poll-post", PollPoll);
  customElements.define("story-post", StoryPost);
  customElements.define("preview-post", PreviewPost);
  customElements.define("reply-post", ReplyPost);
}