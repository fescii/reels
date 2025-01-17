// Import necessary modules, middlewares, and controllers
const {
  join, login, register, recover
} = require('../controllers').auth;


/**
 * @function logonRoutes
 * @description a modular function that registers all the logon routes
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


  // Route for handling logon page
  app.get('/join', join);

  // Route for handling login page
  app.get('/join/login', login);

  // Route for handling register page
  app.get('/join/register', register);

  // Route for handling recover page
  app.get('/join/recover', recover);
}