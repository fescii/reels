
/**
 * @controller {get} /index
 * @name Index
 * @description This route will render the index page for the app.
*/
const index = async (req, res) => {
  const meta = {
    title: 'Welcome to Zoanai',
    description: 'Explore and create content on Zoanai',
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
    title: 'About | Zoanai',
    description: 'Learn more about Zoanai',
    keywords: 'about, zoanai, blog, post',
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
    title: 'Coming Soon | Zoanai',
    description: 'Get ready for Zoanai',
    keywords: 'coming soon, zoanai, blog, post',
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