
/**
 * @controller {get} /index
 * @name Index
 * @description This route will render the index page for the app.
*/
const index = async (req, res) => {
  const meta = {
    title: 'Welcome to Pau',
    description: 'Explore and create content on Pau',
    keywords: 'blog, post, create, explore',
    image: '/static/img/favi.png',
    url: '/',
  }

  res.render('pages/index', {
    meta: meta, data: {
      name: 'index',
    }
  })
}

/**
 * @controller {get} /about
 * @name About
 * @description This route will render the about page for the app.
 * @access Public
*/
const about = async (req, res) => {
  const meta = {
    title: 'About | Pau',
    description: 'Learn more about Pau',
    keywords: 'about, Pau, blog, post',
    image: '/static/img/favi.png',
    url: '/about',
  }
  res.render('pages/about', {
    meta: meta, data: {
      name: 'about'
    }
  })
}

/**
 * @controller {get} /soon
 * @name Soon
 * @description This route will render the coming soon page for the app.
 * @access Public
*/
const soon = async (req, res) => {
  const meta = {
    title: 'Coming Soon | Pau',
    description: 'Get ready for Pau',
    keywords: 'coming soon, Pau, blog, post',
    image: '/static/img/favi.png',
    url:  '/soon',
  }
  
  res.render('pages/soon', {
    meta: meta, data: {
      name: 'soon'
    }
  })
}

// Export all public content controllers
module.exports = { index, about, soon }