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
 * @controller {get} /updates
 * @name getAccount
 * @description This route will the user settings page for the app.
 * @returns Page: Renders settings page || error page
*/
const updates = async (req, res) => {
  // Check if the user is logged in
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"];

  if (!token) {
    return res.redirect('/join/login?next=/updates');
  }

  try {
    const result = await api.get('/u/updates', {
      "x-access-token": token
    });

    if (!result.success) {
      // if result.unverified, redirect to the unverified page
      if (result.unverified) {
        return res.redirect('/join/login?next=/updates');
      } else if(result.error) {
        // if result.error, render the 500 page
        return res.status(500).render('500');
      }
      else {
        return res.status(404).render('404');
      }
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