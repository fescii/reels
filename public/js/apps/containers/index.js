import ActivityContainer from "./activity.container.js";
// Import all containers
import AddContainer from "./add.container.js";
import DiscoverPeople from "./discover.js";
import FormContainer from "./form.container.js";
import HighlightsContainer from "./highlights.container.js";
import InfoContainer from "./info.container.js";
import PeopleContainer from "./people.container.js";
import PostsContainer from "./posts.js";
import StatContainer from "./stat.container.js";
import TopicsContainer from "./topics.container.js";
import UpdateContainer from "./update.container.js";

// Export all containers
export default function containers() {
  // Register containers
  customElements.define("add-container", AddContainer);
  customElements.define("activity-container", ActivityContainer);
  customElements.define("form-container", FormContainer);
  customElements.define("highlights-container", HighlightsContainer);
  customElements.define("info-container", InfoContainer);
  customElements.define("people-container", PeopleContainer);
  customElements.define("discover-people", DiscoverPeople);
  customElements.define("stat-container", StatContainer);
  customElements.define("posts-container", PostsContainer);
  customElements.define("topics-container", TopicsContainer);
  customElements.define("update-container", UpdateContainer);
}