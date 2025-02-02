import AuthorWrapper from "./author.wrapper.js"
import PersonWrapper from "./person.wrapper.js"
import ProfileWrapper from "./profile.wrapper.js"
import ShareWrapper from "./share.wrapper.js"
import UserWrapper from "./user.wrapper.js"
import TopicWrapper from "./topic.wrapper.js"
import HoverAuthor from "./hover.author.js"
import VotesWrapper from "./votes.wrapper.js"
import ActionWrapper from "./action.wrapper.js"
import ImagesWrapper from "./images.wrapper.js"
import ImagesSmall from "./images.small.js"
import ImagesUploader from "./images.uploader.js"
import NewsWrapper from "./news.wrapper.js"

export default function wrappers() {
  // Register wrappers
  customElements.define("author-wrapper", AuthorWrapper);
  customElements.define("person-wrapper", PersonWrapper);
  customElements.define("profile-wrapper", ProfileWrapper);
  customElements.define("share-wrapper", ShareWrapper);
  customElements.define("user-wrapper", UserWrapper);
  customElements.define("topic-wrapper", TopicWrapper);
  customElements.define("hover-author", HoverAuthor);
  customElements.define("votes-wrapper", VotesWrapper);
  customElements.define("action-wrapper", ActionWrapper);
  customElements.define("images-wrapper", ImagesWrapper);
  customElements.define("images-small", ImagesSmall);
  customElements.define("images-uploader", ImagesUploader);
  customElements.define("news-wrapper", NewsWrapper);
}