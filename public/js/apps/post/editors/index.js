import Response from "./response.js";
import PostImages from "./images.js";

// Export all posts
export default function editors() {
  customElements.define("response-post", Response, { extends: "div" });
  customElements.define("post-images", PostImages, { extends: "div" });
}