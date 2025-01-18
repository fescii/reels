
/**
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const search = async (req, res) => {
  const query = req.query.q || null;
  const meta = {
    title: 'Search for stories, posts, authors, and articles',
    description: 'Search for content on Zoanai',
    keywords: 'search, articles, news, blog, content. create, explore',
    image: '/static/img/favi.png',
    url: '/search',
  }
  res.render('pages/main', {
    meta: meta, data: {
      name: 'search',
      query: query
    }
  })
}

// Export all public content controllers
module.exports = {
  search
}