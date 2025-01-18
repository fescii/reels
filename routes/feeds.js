// Import necessary modules, middlewares, and controllers
const {
  home, stories, all, users, replies
} = require('../controllers').feeds;

/**
 * @function topicRoutes
 * @description a modular function that registers all feeds routes
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

  // Route for handling(rendering) home page
  app.get('/home', home);

  // Route for handling(rendering) home page
  app.get('/home/all', all);

  // Route for handling(rendering) home page
  app.get('/home/stories', home);

  // Route for handling(rendering) home page
  app.get('/home/replies', replies);

  // Route for handling(rendering) home page
  app.get('/home/users', users);
}