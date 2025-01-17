/**
 * @controller {get} /p/:slug(:hash) Story
 * @name getStory
 * @description This route will render the story page for the app.
 * @returns Page: Renders story page
*/
const getStory = async (req, res) => {
  //get the params from the request
  let param = req.params.story;

  // query the database for the story
  const { story, error } = [ null, null ];

  // console.log(story)

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).render('500')
  }

  // if there is no story, render the 404 page
  if (!story) {
    return res.status(404).render('404')
  }

  // add the job to the queue
  if (user.hash !== story.author) {
    await actionQueue.add('actionJob', {
      kind: 'view',
      hashes: {
        target: story.hash,
      },
      user: story.author,
      action: 'story',
      value: 1,
    }, { attempts: 3, backoff: 1000, removeOnComplete: true });
  }

  // add tab to the story object
  story.tab = 'replies';

  res.render('pages/story', {
    data: story
  })
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

  // query the database for the story
  const { story, error } = [ null, null ];

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).render('500')
  }

  // if there is no story, render the 404 page
  if (!story) {
    return res.status(404).render('404')
  }

  // add the job to the queue
  if (user.hash !== story.author) {
    await actionQueue.add('actionJob', {
      kind: 'view',
      hashes: {
        target: story.hash,
      },
      user: story.author,
      action: 'story',
      value: 1,
    }, { attempts: 3, backoff: 1000, removeOnComplete: true });
  }

  // add tab to the story object
  story.tab = 'likes';

  res.render('pages/story', {
    data: story
  })
}

/**
 * @controller {get} /r/:hash) Reply
 * @name getReply
 * @description - A controller to render the reply page
 * @returns Page: Renders reply page
*/
const getReply = async (req, res) => {
  //get the params from the request
  let {hash} = req.params;


  // query the database for the reply
  const { reply, error } = [ null, null ];

  // if there is an error, render the error page
  if (error) { 
    return res.status(500).render('500')
  }

  // if there is no reply, render the 404 page
  if (!reply) {
    return res.status(404).render('404')
  }

  // add the job to the queue
  if (user.hash !== reply.author) {
    await actionQueue.add('actionJob', {
      kind: 'view',
      hashes: {
        target: reply.hash,
      },
      action: 'reply',
      user: reply.author,
      value: 1,
    }, { attempts: 3, backoff: 1000, removeOnComplete: true });
  }

  // add tab to the reply object
  reply.tab = 'replies';

  res.render('pages/reply', {
    data: reply
  })
}

/**
 * @controller {get} /r/:hash) Reply Likes
 * @name getReplyLikes
 * @description - A controller to render the reply page
 * @returns Page: Renders reply page
*/
const getReplyLikes = async (req, res) => {
  //get the params from the request
  let {hash} = req.params;

  // query the database for the reply
  const { reply, error } = [ null, null ];
 
  // if there is an error, render the error page
  if (error) { 
    return res.status(500).render('500')
  }

  // if there is no reply, render the 404 page
  if (!reply) {
    return res.status(404).render('404')
  }

  // add the job to the queue
  if (user.hash !== reply.author) {
    await actionQueue.add('actionJob', {
      kind: 'view',
      hashes: {
        target: reply.hash,
      },
      action: 'reply',
      user: reply.author,
      value: 1,
    }, { attempts: 3, backoff: 1000, removeOnComplete: true });
  }

  // add tab to the reply object
  reply.tab = 'likes';

  res.render('pages/reply', {
    data: reply
  })
}


// Export all public content controllers
module.exports = {
  getStory, getStoryLikes, getReply, getReplyLikes
}