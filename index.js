require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser= require('body-parser');
const dns = require('dns')
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://oam:6hbMXRnomGaKBzfR@tc3.nue1c.mongodb.net/fcc-mongoose?retryWrites=true&w=majority');

const urlSchema = new mongoose.Schema({
  host: String,
  original_url: String
});

const Url = mongoose.model('Url', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));

function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str);
}
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
  if(!isURL(req.body.url)) {
    return res.json({ error: 'invalid url' })
  }

  var lowerUrl = req.body.url.toLowerCase()
  var host = new URL(lowerUrl).host;
  
  dns.lookup(host, function(err) {
    if(err) {
      return res.json({ error: 'invalid url' })
    } else {
      let url = new Url({
        host: host,
        original_url: lowerUrl
      });
      Url.findOne({original_url: lowerUrl}, function(err, data) {
        console.log(data)
        if(data) {
           return res.json({
              original_url: data.original_url,
              short_url: data._id
            }) 
        }
        url.save(function(err, data) {
            return res.json({             
              original_url: data.original_url,
              short_url: data._id
            })
          });
      });
    }
  });
});

app.get('/api/shorturl/:short_url', function(req, res) {
  Url.findById(req.params.short_url, function(err, data) {
    if(data) {
      return res.redirect(data.original_url)
    }
    return res.json({ error: 'invalid url' })
  })
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
