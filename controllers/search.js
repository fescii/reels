
/**
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const search = async (req, res) => {
  const meta = {
    title: 'Search Zoanai',
    description: 'Search for content on Zoanai',
    keywords: 'search, articles, news, blog, content. create, explore',
    image: '/static/img/favi.png',
    url: '/search',
  }
  res.render('pages/main', {
    meta: meta
  })
}

// Export all public content controllers
module.exports = {
  search
}