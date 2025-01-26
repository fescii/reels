const {
  themes
} = require('../controllers').themes;

/**
 * @function topicRoutes
 * @description a modular function that registers all the story routes(search) to the app
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

  // Route for handling themes
  app.get('/themes', themes);
}