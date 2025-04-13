const api = require('./api');

const meta = ({ images = [], kind, author, content }) => {
  const image = images.length > 0 ? images[0] : '/static/img/favi.png';
  const title = kind === "post" ? `Post | ${author.name}` : `Reply | by ${author.name}`;
  const sanitizedContent = content?.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() || "This post has no content.";
  const description = sanitizedContent.length > 100 ? `${sanitizedContent.substring(0, 100)}...` : sanitizedContent;

  return { title, image, description };
};

/**
 * @controller {get} /p/(:hash) Post
 * @name post
 * @description This route will render the post page for the app.
 * @returns Page: Renders post page
 */
const post = async (req, res) => {
  const param = req.params.hash.toUpperCase();
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"];

  try {
    const result = await api.get(`/p/${param}`, { "x-access-token": token });

    if (!result.success) {
      return res.status(404).render('404');
    }

    const post = { ...result.post, tab: 'replies' };
    const { title, image, description } = meta(post);
    const metaData = {
      title,
      description,
      image,
      keywords: post.tags?.join(', ') || '',
      url: `/p/${post.hash.toLowerCase()}`,
    };

    res.render('pages/post', { data: post, meta: metaData });
  } catch {
    res.status(500).render('500');
  }
};

module.exports = { post };