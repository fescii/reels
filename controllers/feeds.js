
/**
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const home = async (req, res) => {
  res.render('pages/main', {
    data: {
      name: "Home",
    }
  })
}

/**
 * @controller {get} /offline Offline
 * @apiName Join
 * @name Offline
 * @description This route will render the offline page for the app.
*/
const offline = async (req, res) => {
  res.render('pages/main', {
    data: {
      name: "Offline",
    }
  })
}

// Export all public content controllers
module.exports = {
  home, offline
}