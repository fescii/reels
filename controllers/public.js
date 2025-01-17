
/**
 * @controller {get} /index
 * @name Index
 * @description This route will render the index page for the app.
*/
const index = async (req, res) => {
  res.render('pages/index')
}

/**
 * @controller {get} /about
 * @name About
 * @description This route will render the about page for the app.
 * @access Public
*/
const about = async (req, res) => {
  res.render('pages/about')
}

/**
 * @controller {get} /soon
 * @name Soon
 * @description This route will render the coming soon page for the app.
 * @access Public
*/
const soon = async (req, res) => {
  res.render('pages/soon')
}

// Export all public content controllers
module.exports = { index, about, soon }