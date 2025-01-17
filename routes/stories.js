// Import necessary modules, middlewares, and controllers
const {
  getStory, getStoryLikes, getReply, getReplyLikes
} = require('../controllers').stories;

/**
 * @function topicRoutes
 * @description a modular function that registers all the story routes(public) to the app
 * @param {Object} app - The express app
 * @returns {void} - No return
*/
module.exports = app => {
  app.use((_req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers", "Access-Control-Allow-Origin", "Access-Control-Allow-Methods",
      "x-access-token, Origin, Content-Type, Accept"
    );

    next();
  });


  // Route for handling story page
  app.get('/p/:story', getStory);

  // Route for handling story replies
  app.get('/p/:story/replies', getStory);

  // Route for handling story likes
  app.get('/p/:story/likes', getStoryLikes);

  // Route to get a reply: handles reply page
  app.get('/r/:hash', getReply);

  // Route to get reply likes
  app.get('/r/:hash/likes', getReplyLikes);

  // Route to get a reply: handles reply page(replies)
  app.get('/r/:hash/replies', getReply);
}