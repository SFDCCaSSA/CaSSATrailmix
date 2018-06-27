const cool = require('cool-ascii-faces')
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

express()
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/cool', (req, res) => res.send(cool()))
  .get('/times', (req, res) => {
    let result = ''
    const times = process.env.TIMES || 5
    for (i = 0; i < times; i++) {
      result += i + ' '
    }
    res.send(result)
  })
  .get('/db', async (req, res) => {
    try {
      const client = await pool.connect()
      const results = await client.query('SELECT * FROM test_table');
      console.error(results);
      res.render('pages/db', {results : results});
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/trailmixes', async (req, res) => {
    try {
      const client = await pool.connect()
      const results = await client.query('SELECT * FROM trailmixes');
      console.error(results);
      res.render('pages/trailmixes', {results : results});
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/microdemos', async (req, res) => {
    try {
      const client = await pool.connect()
      const results = await client.query('SELECT * FROM microdemos order by nube, id asc');
      console.error(results);
      res.render('pages/microdemos', {results : results});
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .get('/webinars', async (req, res) => {
    try {
      const client = await pool.connect()
      const results = await client.query('SELECT * FROM webinars order by nube, id asc');
      console.error(results);
      res.render('pages/webinars', {results : results});
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post("/newWebinar", function(req, res) {
    console.log("req",req);
    var notification = req.body["soapenv:Envelope"]["soapenv:Body"][0]["notifications"][0];
    var sessionId = notification["SessionId"][0];
    var data = {};
    if (notification["Notification"] !== undefined) {
      var sobject = notification["Notification"][0]["sObject"][0];
      Object.keys(sobject).forEach(function(key) {
        if (key.indexOf("sf:") == 0) {
          var newKey = key.substr(3);
          data[newKey] = sobject[key][0];
        }
      }); // do something #awesome with the data and sessionId
      console.log("sessionId",sessionId);
      console.error("data",data);
    }
    res.status(201).end();
  })
  .listen(PORT, () => console.log("Listening on ${ PORT }"))
