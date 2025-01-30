// Import sections
import PostSection from "./post.js";
import ProfileSection from "./profile.js";
import TopicSection from "./topic.js";
import RepliesSection from "./replies.js";
import LikesSection from "./likes.js";


export default function sections() {
  // Register sections
  customElements.define("post-section", PostSection);
  customElements.define("profile-section", ProfileSection);
  customElements.define("topic-section", TopicSection);
  customElements.define("replies-section", RepliesSection);
  customElements.define("likes-section", LikesSection);
}