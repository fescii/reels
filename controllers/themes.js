
/**
 * @controller {get} /themes
 * @apiName Join
 * @name Search
 * @description This route will render the themes page for the app.
*/
const themes = async (req, res) => {
  const meta = {
    title: 'Themes | Custumize your Zoanai experience',
    description: 'Explore themes and custumize your Zoanai experience',
    keywords: 'themes, custumize, explore, experience, Zoanai',
    image: '/static/img/favi.png',
    url: '/themes',
  }
  res.render('pages/themes', {
    meta: meta, data: {
      name: 'themes'
    }
  })
}

// Export all public content controllers
module.exports = {
  themes
}