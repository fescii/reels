// Importing all controllers then exporting them as a single object
const authController = require("./auth");
const searchController = require("./search");
const storyController = require("./stories");
const userController = require("./users");
const feedsController = require("./feeds");
const publicController = require("./public");
const errorsController = require("./errors");
const topicsController = require("./topics");
const themesController = require("./themes");
const updatesController = require("./updates");
const chatsController = require("./chats");
const soonController = require("./soon");


// Export all controllers as a single object
module.exports = {
  auth: authController,
  search: searchController,
  stories: storyController,
  users: userController,
  feeds: feedsController,
  public: publicController,
  errors: errorsController,
  topics: topicsController,
  themes: themesController,
  updates: updatesController,
  chats: chatsController,
  soon: soonController,
};
