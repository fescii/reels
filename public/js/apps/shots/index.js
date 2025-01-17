import ShotVideo from "./shot.js";
import ShotsVideos from "./shots.js";

export default function shots() {
  customElements.define('shot-video', ShotVideo, { extends: 'div'});
  customElements.define('shots-videos', ShotsVideos)
}