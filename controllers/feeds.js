/**
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const home = async (req, res) => {
  const meta = {
    title: 'Zoanai',
    description: 'Create and expore content with Zoanai',
    keywords: 'articles, news, blog, content. create, explore',
    image: '/static/img/favi.png',
    url: '/',
  }
  res.render('pages/main', {
    meta: meta, data: {
      name: 'home',
      tab: 'all',
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
  const meta = {
    title: 'Offline',
    description: 'You are offline',
    keywords: 'offline, no internet',
    image: '/static/img/favi.png',
    url: '/offline',
  }

  res.render('pages/main', {
    meta: meta, data: {
      name: 'offline',
      tab: 'all',
    }
  })
}

// Export all public content controllers
module.exports = {
  home, offline
}