const express = require("express");
const path = require('path');
const http = require('http');

// NOTE: sceneFadeDuration is set in 2 files below
const config = require('./db/config.json');
const property_list = require('./db/property_list.json');

const publicPath = path.join(__dirname, './public/');
const viewsPath = path.join(__dirname, './templates');
const port = process.env.PORT || 3000;

var app = express();

var server = http.createServer(app);


app.set('view engine', 'hbs');
app.set('views', viewsPath);
app.use(express.static(publicPath));


app.get('/', (req, res) => {
  res.status(200).render('index');
});

app.post('/', (req, res) => {
  res.status(200).json({
    config: config,
    property_list: property_list
  });
});


server.listen(port, () => {
  console.log(`Started on port ${port}`);
  console.log(publicPath);
});
