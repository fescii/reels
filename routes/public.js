// Import necessary controllers

const { index, soon, about} = require('../controllers').public;

/**
 * @function publicRoutes
 * @description a modular function that registers all the public routes to the app
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


  // Route for handling the index page
  app.get('/', index);

  // Route for handling the about page
  app.get('/about', about);

  // Route for handling the coming soon page
  app.get('/soon', soon);
}