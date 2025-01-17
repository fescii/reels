// Import sections
import PostSection from "./post.section.js";
import ProfileSection from "./profile.section.js";
import TopicSection from "./topic.section.js";


export default function sections() {
  // Register sections
  customElements.define("post-section", PostSection);
  customElements.define("profile-section", ProfileSection);
  customElements.define("topic-section", TopicSection);
}