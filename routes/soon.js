const {
  apis, comics, shots
} = require('../controllers').soon;

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

  // Route for handling comics
  app.get('/comics', comics);
  
  // Route for handling topics
  app.get('/shots', shots);

  // Route for handling apis
  app.get('/apis', apis);
}