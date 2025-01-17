
/**
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const search = async (req, res) => {
  const query = req.query.q || null;
  res.render('pages/search', {
    data: {
      query: query,
    }
  })
}

// Export all public content controllers
module.exports = {
  search
}