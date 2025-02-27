// Import necessary modules, middlewares, and controllers
const {
  updates
} = require('../controllers').updates;

/**
 * @function userRoutes
 * @description a modular function that registers all the user routes
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

  // Route for handling user settings page
  app.get('/updates', updates);
}