const api = require('./api');

/**
 * @controller {get} /updates
 * @name getAccount
 * @description This route will the user settings page for the app.
 * @returns Page: Renders settings page || error page
*/
const updates = async (req, res) => {
  // Check if the user is logged in
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"];

  if (!token) {
    return res.redirect('/join/login?next=/user');
  }

  try {
    const result = await api.get('/u/updates', {
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

    // get meta data for the user
    const { title, image, description } = meta(user);

    const metaData = {
      title,
      description,
      image,
      keywords: user.tags ? user.tags.join(', ') : '',
      url: `/u/${user.hash.toLowerCase()}`
    }

    res.render('pages/updates', {
      data: user, meta: metaData
    })
  } catch (error) {
    return res.status(500).render('500');
  }
}

// Export all public content controllers
module.exports = {
  updates
}