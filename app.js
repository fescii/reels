const express = require("express");
const path = require("path");
const dotenv = require('dotenv');
dotenv.config();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
const cors = require("cors");
const app = express();

app.use(cookieParser())

// adjust the limit to the size of the file you want to upload
app.use(bodyParser.json({ limit: '50mb' })); // Increase the limit as needed
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use('/static', express.static('public'))
app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')

// serve service worker from the root
app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'js', 'service-worker.js'));
});

let corsOptions = {
  origin: [`http://localhost:${process.env['PORT']}`, "https://192.168.68.21:${process.env['PORT']}"],
  credentials: true,
  methods: ["GET"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(bodyParser.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// Require and start all routes
require('./routes')(app);

// set port, listen for requests
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`Server is listening on port ${PORT}`);
})