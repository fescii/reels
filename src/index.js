import ShotVideo from "./shot.js";
import ShotsVideos from "./shots.js";
// import ShotUploader from "./upload.js";

export default function shots() {
  customElements.define('shot-video', ShotVideo, { extends: 'div'});
  customElements.define('shots-videos', ShotsVideos)
  // customElements.define('shot-uploader', ShotUploader);
}