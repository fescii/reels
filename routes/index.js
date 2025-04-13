// Init all routes
module.exports = (app) => {
  require('./auth')(app);
  require('./topics')(app);
  require('./posts')(app);
  require('./users')(app);
  require('./search')(app);
  require('./themes')(app);
  require('./updates')(app);
  require('./chats')(app);
  require('./feeds')(app);
  require('./soon')(app);
  require('./public')(app);
  require('./errors')(app);
}