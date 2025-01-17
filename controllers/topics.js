/**
 * @controller {get} /t/:slug(:hash) Topic
 * @name getTopic
 * @description This route will render the topic page for the app.
 * @returns Page: Renders topic page
*/
const getTopic = async (req, res) => {
  //get the params from the request
  let param = req.params.topic;

  // query the database for the topic
  const { topic, error } = [ null, null ];

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).render('500')
  }

  // if there is no topic, render the 404 page
  if (!topic) {
    return res.status(404).render('404')
  }

  // add view to update views
  const payload = {
    kind: 'view',
    hashes: {
      target: topic.hash,
    },
    action: 'topic',
    value: 1,
  };

  // add the job to the queue
  await actionQueue.add('actionJob', payload);

  // add tab to the topic object
  topic.tab = 'article';

  res.render('pages/topic', {
    data: topic
  })
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

  // query the database for the topic
  const { topic, error } = [ null, null ];

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).render('500')
  }

  // if there is no topic, render the 404 page
  if (!topic) {
    return res.status(404).render('404')
  }

  // add the job to the queue
  await actionQueue.add('actionJob', {
    kind: 'view',
    hashes: {
      target: topic.hash,
    },
    action: 'topic',
    user: topic.author,
    value: 1,
  }, { attempts: 3, backoff: 1000, removeOnComplete: true });

  // add tab to the topic object
  topic.tab = 'stories';

  res.render('pages/topic', {
    data: topic
  })
}

/**
 * @controller {get} /t/:slug(:hash) Topic
 * @name fetchTopic
 * @description This route will render the topic page for the app.
 * @returns Page: Renders topic page
*/
const fetchTopic = async (req, res) => {
  //get the params from the request
  let param = req.params.topic;

  // query the database for the topic
  const { topic, error } = [ null, null ];

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).json({ 
      success: false,
      message: 'An error occurred while fetching the topic'
    })
  }

  // if there is no topic, render the 404 page
  if (!topic) {
    return res.status(404).json({
      success: false,
      message: 'Topic not found'
    });
  }

  // add view to update views
  const payload = {
    kind: 'view',
    hashes: {
      target: topic.hash,
    },
    action: 'topic',
    value: 1,
  };

  // add the job to the queue
  await actionQueue.add('actionJob', payload);

  res.json({
    success: true,
    message: 'Topic fetched successfully',
    topic
  })
}

// Export all public content controllers
module.exports = {
  getTopic, getTopicStories,
  fetchTopic
}