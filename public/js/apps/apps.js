import shots from "./shots/index.js";
import chats from "./chats/index.js";
import home from "./home/index.js";
import uis from "./uis/index.js";

export default function apps(text) {
  shots();
  chats();
  home();
  uis();
  console.log(text);
}