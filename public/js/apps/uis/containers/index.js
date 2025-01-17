// Import all containers
import AddContainer from "./add.container.js";
import ActivityContainer from "./activity.container.js";
import FormContainer from "./form.container.js";
import HighlightsContainer from "./highlights.container.js";
import InfoContainer from "./info.container.js";
import PeopleContainer from "./people.container.js";
import DiscoverPeople from "./people.discover.js";
import StatContainer from "./stat.container.js";
import StoriesContainer from "./stories.container.js";
import TopicsContainer from "./topics.container.js";
import FeedContainer from "./feed.container.js";
import UpdateContainer from "./update.container.js";
import ContentContainer from "./content.container.js";

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
  customElements.define("stories-container", StoriesContainer);
  customElements.define("topics-container", TopicsContainer);
  customElements.define("feed-container", FeedContainer);
  customElements.define("update-container", UpdateContainer);
  customElements.define("content-container", ContentContainer);
}