
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
    meta: meta, data: {
      name: 'join'
    }
  })
}

/**
 * @controller {get} /login Login
 * @apiName Login
 * @name Login
 * @description This route will render the login page for the app.
*/
const login = async (req, res) => {
  // get next url
  const nextUrl = req.query.next || '/home';

  const meta = {
    title: 'Login to Zoanai',
    description: 'Login to Zoanai to access your account',
    keywords: 'login, register, recover',
    image: '/static/img/favi.png',
    url: '/join/login',
  }

  res.render('pages/auth', {
    meta: meta, data: {
      name: 'login',
      next: nextUrl
    }
  })
}

/**
 * @controller {get} /register Register
 * @apiName Register
 * @name Register
 * @description This route will render the register page for the app.
*/
const register = async (req, res) => {
  const nextUrl = req.query.next || '/home';

  const meta = {
    title: 'Register for Zoanai',
    description: 'Register for Zoanai to create and explore content',
    keywords: 'register, login, recover',
    image: '/static/img/favi.png',
    url: '/join/register',
  }

  res.render('pages/auth', {
    meta: meta, data: {
      name: 'register',
      next: nextUrl
    }
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
  const nextUrl = req.query.next || '/home';

  const meta = {
    title: 'Recover your Zoanai account',
    description: 'Recover your Zoanai account by resetting your password',
    keywords: 'recover, login, register',
    image: '/static/img/favi.png',
    url: '/join/recover',
  }

  res.render('pages/auth', {
    meta: meta, data: {
      name: 'recover',
      next: nextUrl
    }
  })
}

/**
 * @function logout
 * @description Controller to log out a user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 * @returns {Redirect} - Redirects to the login page
*/
const logout = async (req, res, next) => {
  // Clear the cookie
  res.clearCookie('x-access-token');
  res.clearCookie('hash');

  // Redirect to the login page
  return res.redirect('/join');
}



// Export all public content controllers
module.exports = {
  join, login, register, recover, logout
}