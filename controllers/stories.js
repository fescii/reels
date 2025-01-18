const api = require('./api');

const first = text => {
  const imgRegex = /<img[^>]+src\s*=\s*['"]([^'"]+)['"][^>]*>/i;
  const match = text.match(imgRegex);
  return match ? match[1] : null;
}

const meta = data => {
  const firstImageSrc = first(text);

  let image = '/static/img/favi.png';
  if (data.kind === 'story') {
    image = firstImageSrc || image;
  } else {
    image = data.images && data.images.length > 0 ? data.images[0] : image;
  }

  let title = data.title ? 'Story | ' + data.title : 'Post | by ' + data.author;

  let content = data.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (content == null) {
    content = "This story has no content.";
  }
  let description = content.length > 100 ? content.substring(0, 100) + "..." : content;

  return {
    title,
    image,
    description
  };
}

const replyMeta = data => {
  let title = 'Reply | by ' + data.author;
  let content = data.content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (content == null) {
    content = "This reply has no content.";
  }

  const image = data.images && data.images.length > 0 ? data.images[0] : '/static/img/favi.png';

  const description = content.length > 100 ? content.substring(0, 100) + "..." : content;

  return {
    title,
    description,
    image
  };
}

/**
 * @controller {get} /p/:slug(:hash) Story
 * @name getStory
 * @description This route will render the story page for the app.
 * @returns Page: Renders story page
*/
const getStory = async (req, res) => {
  //get the params from the request
  let param = req.params.story;

  // get header x-access-token
  let token = req.cookies['x-access-token'] || req.headers["x-access-token"]

  try {
    const result = await api.get(`/p/page/${param}`, {
      "x-access-token": token
    })

    // if there is no story, render the 404 page
    if (!result.success) {
      return res.status(404).render('404')
    }

    const story = result.story;
    story.tab = 'replies';

    const { title, image, description } = meta(story);
    const url = "/p/" + data.hash.toLowerCase();

    const metaData = {
      title: title,
      description: description,
      image: image,
      keywords: story.tags ? story.tags.join(', ') : '',
      url: url,
    }

    res.render('pages/post', {
      data: story, meta: metaData
    })
  } catch (error) {
    return res.status(500).render('500')
  }
}

/**
 * @controller {get} /p/:slug(:hash) Story
 * @name getStoryLikes
 * @description This route will render the story page for the app.
 * @returns Page: Renders story page
*/
const getStoryLikes = async (req, res) => {
  //get the params from the request
  let param = req.params.story;

  // get header x-access-token
  let token = req.cookies['x-access-token'] || req.headers["x-access-token"]

  try {
    const result = await api.get(`/p/page/${param}`, {
      "x-access-token": token
    })

    // if there is no story, render the 404 page
    if (!result.success) {
      return res.status(404).render('404')
    }

    const story = result.story;
    story.tab = 'likes';

    const { title, image, description } = meta(story);
    const url = "/p/" + data.hash.toLowerCase();

    const metaData = {
      title: title,
      description: description,
      image: image,
      keywords: story.tags ? story.tags.join(', ') : '',
      url: url,
    }

    res.render('pages/post', {
      data: story, meta: metaData
    })
  } catch (error) {
    return res.status(500).render('500')
  }
}

/**
 * @controller {get} /r/:hash) Reply
 * @name getReply
 * @description - A controller to render the reply page
 * @returns Page: Renders reply page
*/
const getReply = async (req, res) => {
  //get the params from the request
  let { hash } = req.params;

  // get header x-access-token
  let token = req.cookies['x-access-token'] || req.headers["x-access-token"]

  try {
    const result = await api.get(`/r/page/${hash}`, {
      "x-access-token": token
    });

    // if there is no reply, render the 404 page
    if (!result.success) {
      return res.status(404).render('404')
    }

    const reply = result.reply;
    reply.tab = 'replies';

    const { title, image, description } = replyMeta(reply);

    const metaData = {
      title: title,
      description: description,
      image: image,
      keywords: reply.tags ? reply.tags.join(', ') : '',
      url: "/r/" + reply.hash.toLowerCase(),
    }

    res.render('pages/reply', {
      data: reply, meta: metaData
    })

  } catch (error) {
    return res.status(500).render('500')
  }
}

/**
 * @controller {get} /r/:hash) Reply Likes
 * @name getReplyLikes
 * @description - A controller to render the reply page
 * @returns Page: Renders reply page
*/
const getReplyLikes = async (req, res) => {
  //get the params from the request
  const { hash } = req.params;

  // get header x-access-token
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"]

  try {
    const result = await api.get(`/r/page/${hash}`, {
      "x-access-token": token
    });

    // if there is no reply, render the 404 page
    if (!result.success) {
      return res.status(404).render('404')
    }

    const reply = result.reply;
    reply.tab = 'likes';

    const { title, image, description } = replyMeta(reply);

    const metaData = {
      title: title,
      description: description,
      image: image,
      keywords: reply.tags ? reply.tags.join(', ') : '',
      url: "/r/" + reply.hash.toLowerCase(),
    }

    res.render('pages/reply', {
      data: reply, meta: metaData
    })

  } catch (error) {
    return res.status(500).render('500')
  }
}


// Export all public content controllers
module.exports = {
  getStory, getStoryLikes, getReply, getReplyLikes
}