import PollPoll from "./poll.js";
// Import all posts
import PostWrapper from "./wrapper.js";
import PreviewPost from "./preview.js";
import editors from "./editors/index.js";

// Export all posts
export default function posts() {
  // Register posts
  editors();
  customElements.define("post-wrapper", PostWrapper);
  customElements.define("poll-post", PollPoll);
  customElements.define("preview-post", PreviewPost);
}