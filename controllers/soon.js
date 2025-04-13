/**
 * @controller {get} /topics
 * @apiName Join
 * @name Search
 * @description This route will render the themes page for the app.
*/
const shots = async (req, res) => {
  const meta = {
    title: 'Soon | This feature is coming soon',
    description: 'Stay tuned, this feature is coming soon',
    keywords: 'videos, articles, explore, experience, Pau',
    image: '/static/img/favi.png',
    url: '/topics',
  }
  res.render('pages/shots', {
    meta: meta, data: {
      name: 'topics'
    }
  })
}

/**
 * @controller {get} /apis
 * @apiName Join
 * @name Search
 * @description This route will render the apis page for the app.
*/
const apis = async (req, res) => {
  const meta = {
    title: 'Soon | This feature is coming soon',
    description: 'Stay tuned, this feature is coming soon',
    keywords: 'videos, articles, explore, experience, Pau',
    image: '/static/img/favi.png',
    url: '/themes',
  }
  res.render('pages/later', {
    meta: meta, data: {
      name: 'apis'
    }
  })
}

/**
 * @controller {get} /themes
 * @apiName Join
 * @name Search
 * @description This route will render the themes page for the app.
*/
const comics = async (req, res) => {
  const meta = {
    title: 'Soon | This feature is coming soon',
    description: 'Stay tuned, this feature is coming soon',
    keywords: 'videos, articles, explore, experience, Pau',
    image: '/static/img/favi.png',
    url: '/comics',
  }
  res.render('pages/later', {
    meta: meta, data: {
      name: 'comics'
    }
  })
}


// Export all public content controllers
module.exports = {
  shots,
  apis,
  comics
}