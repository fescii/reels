/**
 * @controller {get} /search Search
 * @apiName Join
 * @name Search
 * @description This route will render the search page for the app.
*/
const home = async (req, res) => {
  const meta = {
    title: 'Pau',
    description: 'Create and expore content with Pau',
    keywords: 'articles, news, blog, content. create, explore',
    image: '/static/img/favi.png',
    url: '/',
  }
  res.render('pages/home', {
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
    title: 'Pau',
    description: 'Create and expore content with Pau',
    keywords: 'articles, news, blog, content. create, explore',
    image: '/static/img/favi.png',
    url: '/',
  }
  res.render('pages/home', {
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
    title: 'Pau',
    description: 'Create and expore content with Pau',
    keywords: 'articles, news, blog, content. create, explore',
    image: '/static/img/favi.png',
    url: '/',
  }
  res.render('pages/home', {
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
    title: 'Pau',
    description: 'Create and expore content with Pau',
    keywords: 'articles, news, blog, content. create, explore',
    image: '/static/img/favi.png',
    url: '/',
  }
  res.render('pages/home', {
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
    title: 'Pau',
    description: 'Create and expore content with Pau',
    keywords: 'articles, news, blog, content. create, explore',
    image: '/static/img/favi.png',
    url: '/',
  }
  res.render('pages/home', {
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