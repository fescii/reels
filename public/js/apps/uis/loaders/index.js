// Import all loaders
import AuthorsLoader from "./authors.loader.js";
import InfoLoader from "./info.loader.js";
import PeopleLoader from "./people.loader.js";
import PostLoader from "./post.loader.js";
import StoryLoader from "./story.loader.js";
import TopicsLoader from "./topics.loader.js";
import TopicLoader from "./topic.loader.js";
import HoverLoader from "./hover.loader.js";


export default function loaders() {
  // Register loaders
  customElements.define("authors-loader", AuthorsLoader);
  customElements.define("info-loader", InfoLoader);
  customElements.define("people-loader", PeopleLoader);
  customElements.define("post-loader", PostLoader);
  customElements.define("story-loader", StoryLoader);
  customElements.define("topics-loader", TopicsLoader);
  customElements.define("topic-loader", TopicLoader);
  customElements.define("hover-loader", HoverLoader);
}