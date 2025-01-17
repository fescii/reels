// Importing all controllers then exporting them as a single object
const authController = require("./auth");
const searchController = require("./search");
const storyController = require("./stories");
const userController = require("./users");
const statsController = require("./stats");
const feedsController = require("./feeds");
const publicController = require("./public");
const errorsController = require("./errors");
const topicsController = require("./topics");


// Export all controllers as a single object
module.exports = {
  auth: authController,
  search: searchController,
  stories: storyController,
  users: userController,
  stats: statsController,
  feeds: feedsController,
  public: publicController,
  errors: errorsController,
  topics: topicsController
};
