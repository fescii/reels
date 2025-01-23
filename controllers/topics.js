const api = require('./api');

const meta = data => {
  const image = '/static/img/favi.png';
  const title = 'Topic | ' + data.name;
  // create a deep copy of the data content(summary) and remove all html tags
  const summary = data.summary;

  let content = summary.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
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

/**
 * @controller {get} /t/:slug(:hash) Topic
 * @name getTopic
 * @description This route will render the topic page for the app.
 * @returns Page: Renders topic page
*/
const getTopic = async (req, res) => {
  //get the params from the request
  let param = req.params.topic;

  // get header x-access-token
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"]

  try {
    const result = await api.get(`/t/page/${param}`, {
      "x-access-token": token
    });

    // if there is no topic, render the 404 page
    if(!result.success) {
      return res.status(404).render('404');
    }

    const topic = result.topic;

    // add tab to the topic object
    topic.tab = 'article';

    // get meta data for the topic
    const { title, image, description } = meta(topic);
    const url = `/t/${topic.hash}`;

    const metaData = {
      title: title,
      description: description,
      image: image,
      keywords: '',
      url: url,
    }

    res.render('pages/topic', {
      meta: metaData,
      data: topic
    })
  } catch (error) {
    // console.log(error)
    return res.status(500).render('500')
  }
}

/**
 * @controller {get} /t/:slug(:hash) Topic
 * @name getTopicStories
 * @description This route will render the topic page for the app.
 * @returns Page: Renders topic page
*/
const getTopicStories = async (req, res) => {
  //get the params from the request
  let param = req.params.topic;

  // get header x-access-token
  const token = req.cookies['x-access-token'] || req.headers["x-access-token"]

  try {
    const result = await api.get(`/t/page/${param}`, {
      "x-access-token": token
    });

    // if there is no topic, render the 404 page
    if(!result.success) {
      return res.status(404).render('404');
    }

    const topic = result.topic;

    // add tab to the topic object
    topic.tab = 'stories';

    // get meta data for the topic
    const { title, image, description } = meta(topic);
    const url = `/t/${topic.hash}`;

    const metaData = {
      title: title,
      description: description,
      image: image,
      keywords: '',
      url: url,
    }

    res.render('pages/topic', {
      meta: metaData,
      data: topic
    })
  } catch (error) {
    return res.status(500).render('500')
  }
}

// Export all public content controllers
module.exports = {
  getTopic, getTopicStories
}