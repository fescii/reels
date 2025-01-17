
/**
 * @controller {get} /join Join
 * @apiName Join
 * @name Join
 * @description This route will render the join page for the app.
*/
const join = async (req, res) => {
  const meta = {
    title: 'Join Zoanai Today',
    description: 'Create and expore content with Zoanai',
    keywords: 'join, register, login, recover',
    image: '/static/img/favi.png',
    url: '/join',
  }

  res.render('pages/main', {
    meta: meta,
  })
}

/**
 * @controller {get} /login Login
 * @apiName Login
 * @name Login
 * @description This route will render the login page for the app.
*/
const login = async (req, res) => {
  const meta = {
    title: 'Login to Zoanai',
    description: 'Login to Zoanai to access your account',
    keywords: 'login, register, recover',
    image: '/static/img/favi.png',
    url: '/join/login',
  }

  res.render('pages/main', {
    meta: meta,
  })
}

/**
 * @controller {get} /register Register
 * @apiName Register
 * @name Register
 * @description This route will render the register page for the app.
*/
const register = async (req, res) => {
  const meta = {
    title: 'Register for Zoanai',
    description: 'Register for Zoanai to create and explore content',
    keywords: 'register, login, recover',
    image: '/static/img/favi.png',
    url: '/join/register',
  }

  res.render('pages/main', {
    meta: meta,
  })
}


/**
 * @controller {get} /recover/Reset password
 * @apiName Recover
 * @name Recover
 * @description This route will render the recover page for the app.
 * @returns Page: Renders recover page
*/
const recover = async (req, res) => {
  const meta = {
    title: 'Recover your Zoanai account',
    description: 'Recover your Zoanai account by resetting your password',
    keywords: 'recover, login, register',
    image: '/static/img/favi.png',
    url: '/join/recover',
  }

  res.render('pages/main', {
    meta: meta,
  })
}


// Export all public content controllers
module.exports = {
  join, login, register, recover
}