// Import find topic by hash and by slug
const {
  getUserByHash, getUserProfile
} = require('../../queries').userQueries;


/**
 * @controller {get} /t/:slug(:hash) Topic
 * @name getPerson
 * @description This route will the user page for the app.
 * @returns Page: Renders user page
*/
const getPerson = async (req, res) => {
  //get the params from the request
  let param = req.params.hash;

  // get user from the request object
  const currentUser = req.user;

  // convert the user hash to lowercase
  param = param.toUpperCase();

  // query the database for the user
  const { user, error } = await getUserByHash(param, currentUser.hash);

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).render('500')
  }

  // if there is no user, render the 404 page
  if (!user) {
    return res.status(404).render('404')
  }

  // add tab to the user object
  user.tab = 'stories';

  res.render('pages/user', {
    data: user
  })
}


/**
 * @controller {get} /t/:slug(:hash) Topic
 * @name getUserReplies
 * @description This route will the user page for the app.
 * @returns Page: Renders user page
*/
const getUserReplies = async (req, res) => {
  //get the params from the request
  let param = req.params.hash;

  // get user from the request object
  const currentUser = req.user;

  // convert the user hash to lowercase
  param = param.toUpperCase();

  // query the database for the user
  const { user, error } = await getUserByHash(param, currentUser.hash);

  // if there is an error, render the error page
  if (error) {
    return res.status(500).render('500')
  }

  // if there is no user, render the 404 page
  if (!user) {
    return res.status(404).render('404')
  }

  // add tab to the user object
  user.tab = 'replies';

  res.render('pages/user', {
    data: user
  })
}

/**
 * @controller {get} /u/:hash/followers
 * @name getUserFollowers
 * @description This route will the user page for the app.
 * @returns Page: Renders user page
*/
const getUserFollowers = async (req, res) => {
  //get the params from the request
  let param = req.params.hash;

  // get user from the request object
  const currentUser = req.user;

  // convert the user hash to lowercase
  param = param.toUpperCase();

  // query the database for the user
  const { user, error } = await getUserByHash(param, currentUser.hash);

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).render('500')
  }

  // if there is no user, render the 404 page
  if (!user) {
    return res.status(404).render('404')
  }

  // add tab to the user object
  user.tab = 'followers';

  res.render('pages/user', {
    data: user
  })
}


/**
 * @controller {get} /u/:hash/following
 * @name getUserFollowing
 * @description This route will the user page for the app.
 * @returns Page: Renders user page || error page
*/
const getUserFollowing = async (req, res) => {
  //get the params from the request
  let param = req.params.hash;

  // get user from the request object
  const currentUser = req.user;

  // convert the user hash to lowercase
  param = param.toUpperCase();

  // query the database for the user
  const { user, error } = await getUserByHash(param, currentUser.hash);

  // if there is an error, render the error page
  if (error) {
    return res.status(500).render('500')
  }

  // if there is no user, render the 404 page
  if (!user) {
    return res.status(404).render('404')
  }

  // add tab to the user object
  user.tab = 'following';

  res.render('pages/user', {
    data: user
  })
}

/**
 * @controller {get} /t/:slug(:hash) Topic
 * @name getPerson
 * @description This route will the user page for the app.
 * @returns Page: Renders user page
*/
const fetchUser = async (req, res) => {
  //get the params from the request
  let param = req.params.hash;

  // get user from the request object
  const currentUser = req.user;

  // convert the user hash to lowercase
  param = param.toUpperCase();

  // query the database for the user
  const { user, error } = await getUserByHash(param, currentUser.hash);

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).json({
      success: false,
      message: 'An error occurred'
    })
  }

  // if there is no user, render the 404 page
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  res.status(200).json({
    success: true,
    message: 'User found',
    user
  });
}

/**
 * @controller {get} /user
 * @name getAccount
 * @description This route will the user settings page for the app.
 * @returns Page: Renders settings page || error page
*/
const getAccount = async (req, res) => {
  if (!req.user?.hash) {
    return res.redirect('/join/login?next=/user');
  }

  const hash = req.user.hash;
  let current = req.params.current;

  const { user, error } = await getUserProfile(hash);

  if (error) {
    console.log(error);
    return res.status(500).render('500');
  }

  if (!user) {
    return res.status(404).render('404');
  }

  user.contact = {
    email: user.contact?.email || null,
    x: user.contact?.x || null,
    threads: user.contact?.threads || null,
    phone: user.contact?.phone || null,
    link: user.contact?.link || null,
    linkedin: user.contact?.linkedin || null,
  };

  user.tab = current || 'stats';

  res.render('pages/updates', {
    data: user
  });
}

// Export all public content controllers
module.exports = {
  getPerson, getUserReplies, getUserFollowers, getUserFollowing, getAccount,
  fetchUser
}