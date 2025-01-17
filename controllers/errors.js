/**
 * @function errorHandler
 * @description Error handler middleware for capturing all errors and sends a response to the user
 * @param {Object} err - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {Object} - Returns response object
 *
 */
const errorHandler = (err, req, res, _next) => {
  console.error(err.stack);
  const errorStatus = err.status || 500;

  return res.status(errorStatus).render('500');
}

/**
 * @function badGateway
 * @description Error handler middleware for capturing all errors and sends a response to the user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} - Returns render 502 page
*/
const badGateway = (req, res) => {
  return res.status(502).render('502');
}

/**
 * Not found middleware - Captures all requests to unknown routes
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} _next - Next middleware function
 * @returns {Object} - Returns response object
 */
const notFound = (req, res, _next) => {
  // Check if the url start with "/api/"
  if (req.url.startsWith('/api/')){
    return res.status(404).json({
      success: false,
      error: true,
      message: "Resource not found!"
    });
  }
  else {
    return res.status(404).render('404')
  }
}

/**
 * Exporting the error handler and not found middleware
 */
module.exports = {
  errorHandler, notFound, badGateway
}