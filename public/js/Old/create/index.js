// import creates
import CreateTopic from "./topic.js";
import CreatePost from "./post.js";
import CreateArticle from "./article.js";
import EditPost from "./edit-post.js";
import EditArticle from "./edit-article.js";
import CreateReply from "./reply.js";
import ImagesEditor from "./images.js";



export default function create() {
  // Register Create
  customElements.define("create-topic", CreateTopic, { extends: "div" });
  customElements.define("create-post", CreatePost, { extends: "div" });
  customElements.define("create-article", CreateArticle, { extends: "div" });
  customElements.define("edit-post", EditPost, { extends: "div" });
  customElements.define("edit-article", EditArticle, { extends: "div" });
  customElements.define("create-reply", CreateReply, { extends: "div" });
  customElements.define("images-editor", ImagesEditor, { extends: "div" });
}