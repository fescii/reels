const api = require('./api');

const meta = data => {
  // Head/Meta Start
  const title = "User | " + data.name;
  // Separate the name into first and last name
  const name = data.name.split(" ");

  // Check if the profile picture is null and overwrite it with the default picture
  const picture = data.picture === null ? `https://ui-avatars.com/api/?background=d9e7ff&bold=true&size=100&color=fff&name=${name[0]}+${name[1]}` : data.picture;

  // Check if bio is null and overwrite it with the default bio
  const bio = data.bio === null ? "This user has not added a bio yet." : data.bio;

  return {
    title,
    image: picture,
    description: bio
  }
}

/**
 * @controller {get} /t/:slug(:hash) Topic
 * @name getPerson
 * @description This route will the user page for the app.
 * @returns Page: Renders user page
*/
const getPerson = async (req, res) => {
  //get the params from the request
  let param = req.params.hash;

  // get header x-access-token
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"]
  
  try {
    const result = await api.get(`/u/page/${param}`, {
      "x-access-token": token
    });

    if(!result.success) {
      return res.status(404).render('404');
    }

    const user = result.user;
    user.tab = 'stories';

    const { title, image, description } = meta(user);

    const metaData = {
      title,
      description,
      image,
      keywords: user.tags ? user.tags.join(', ') : '',
      url: `/u/${user.hash.toLowerCase()}`
    }

    res.render('pages/profile', {
      data: user, meta: metaData
    })
  } catch (error) {
    // console.log(error)
    return res.status(500).render('500')
  }
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

  // get header x-access-token
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"]
  
  try {
    const result = await api.get(`/u/page/${param}`, {
      "x-access-token": token
    });

    if(!result.success) {
      return res.status(404).render('404');
    }

    const user = result.user;
    user.tab = 'replies';

    const { title, image, description } = meta(user);

    const metaData = {
      title,
      description,
      image,
      keywords: user.tags ? user.tags.join(', ') : '',
      url: `/u/${user.hash.toLowerCase()}`
    }

    res.render('pages/profile', {
      data: user, meta: metaData
    })
  } catch (error) {
    return res.status(500).render('500')
  }
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

  // get header x-access-token
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"]
  
  try {
    const result = await api.get(`/u/page/${param}`, {
      "x-access-token": token
    });

    if(!result.success) {
      return res.status(404).render('404');
    }

    const user = result.user;
    user.tab = 'followers';

    const { title, image, description } = meta(user);

    const metaData = {
      title,
      description,
      image,
      keywords: user.tags ? user.tags.join(', ') : '',
      url: `/u/${user.hash.toLowerCase()}`
    }

    res.render('pages/profile', {
      data: user, meta: metaData
    })
  } catch (error) {
    return res.status(500).render('500')
  }
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

  // get header x-access-token
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"]
  
  try {
    const result = await api.get(`/u/page/${param}`, {
      "x-access-token": token
    });

    if(!result.success) {
      return res.status(404).render('404');
    }

    const user = result.user;
    user.tab = 'following';

    const { title, image, description } = meta(user);

    const metaData = {
      title,
      description,
      image,
      keywords: user.tags ? user.tags.join(', ') : '',
      url: `/u/${user.hash.toLowerCase()}`
    }

    res.render('pages/profile', {
      data: user, meta: metaData
    })
  } catch (error) {
    return res.status(500).render('500')
  }
}

/**
 * @controller {get} /user
 * @name getAccount
 * @description This route will the user settings page for the app.
 * @returns Page: Renders settings page || error page
*/
const getAccount = async (req, res) => {
  // Check if the user is logged in
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"];

  if (!token) {
    return res.redirect('/join/login?next=/user');
  }

  try {
    const result = await api.get('/u/user', {
      "x-access-token": token
    });

    if (!result.success) {
      return res.status(404).render('404');
    }

    const user = result.user;

    // if not user, render the 404 page
    if (!user) {
      return res.status(404).render('404');
    }

    // Check if the user has a bio and overwrite it with the default bio
    user.contact = {
      email: user.contact?.email || null,
      x: user.contact?.x || null,
      threads: user.contact?.threads || null,
      phone: user.contact?.phone || null,
      link: user.contact?.link || null,
      linkedin: user.contact?.linkedin || null,
    };

    // set tab to the current tab or default to stats
    const current = req.query.tab || 'stats';

    // get meta data for the user
    const { title, image, description } = meta(user);

    const metaData = {
      title,
      description,
      image,
      keywords: user.tags ? user.tags.join(', ') : '',
      url: `/u/${user.hash.toLowerCase()}`
    }

    res.render('pages/user', {
      data: user, meta: metaData, current
    })
  } catch (error) {
    return res.status(500).render('500');
  }
}

// Export all public content controllers
module.exports = {
  getPerson, getUserReplies, getUserFollowers, getUserFollowing, getAccount
}