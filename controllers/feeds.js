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
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const all = async (req, res) => {
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
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const stories = async (req, res) => {
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
      tab: 'stories',
    }
  })
}

/**
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const replies = async (req, res) => {
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
      tab: 'replies',
    }
  })
}

/**
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const users = async (req, res) => {
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
      tab: 'users',
    }
  })
}

// Export all public content controllers
module.exports = {
  home, all, stories, replies, users
}