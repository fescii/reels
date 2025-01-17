// Import all forms
import BioForm from "./bio.form.js";
import EmailForm from "./email.form.js";
import PasswordForm from "./password.form.js";
import ProfileForm from "./profile.form.js";
import NameForm from "./name.form.js";
import SocialForm from "./social.form.js";


export default function forms() {
  // Register forms
  customElements.define("bio-form", BioForm);
  customElements.define("email-form", EmailForm);
  customElements.define("password-form", PasswordForm);
  customElements.define("profile-form", ProfileForm);
  customElements.define("name-form", NameForm);
  customElements.define("social-form", SocialForm);
}