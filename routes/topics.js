// Import necessary modules, middlewares, and controllers
const {
  getTopic, getTopicStories,
  editTopic
} = require('../controllers').topics;

/**
 * @function topicRoutes
 * @description a modular function that registers all the topic routes
 * @param {Object} app - The express app
 * @returns {void} - No return
*/
module.exports = (app) => {
  app.use((_req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers", "Access-Control-Allow-Origin", "Access-Control-Allow-Methods",
      "x-access-token, Origin, Content-Type, Accept"
    );

    next();
  });


  // Route for handling topic page
  app.get('/t/:topic', getTopic);

  // Route for handling topic articles page
  app.get('/t/:topic/article', getTopic);

  // Route for handling topic stories page
  app.get('/t/:topic/stories', getTopicStories);

  // Route for editing topic
  app.get('/t/:hash/edit', editTopic);
}