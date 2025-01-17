import CustomSpan from "./span.element";

export default function elements() {
  // Register custom elements
  customElements.define("custom-span", CustomSpan, { extends: "span" });
}