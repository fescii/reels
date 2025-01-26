// Init all routes
module.exports = (app) => {
  require('./auth')(app);
  require('./topics')(app);
  require('./stories')(app);
  require('./users')(app);
  require('./search')(app);
  require('./feeds')(app);
  require('./public')(app);
  require('./themes')(app);
  require('./updates')(app);
  require('./errors')(app);
}