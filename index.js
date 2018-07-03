const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 5000

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false
});

var app = express();
var bodyParser = require('body-parser');
require('body-parser-xml')(bodyParser);

app.use(bodyParser.xml());

app
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', (req, res) => res.render('pages/index'))
  .get('/microdemos', async (req, res) => {
    try {
      const client = await pool.connect();
      //const results = await client.query('SELECT * FROM microdemos order by nube, id asc');
      const results = await client.query("SELECT * FROM videos WHERE tipo__c = 'Microdemo' and estatus__c='Activo' order by nube__c, id asc");
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
      const client = await pool.connect();
      //const results = await client.query('SELECT * FROM webinars order by nube, id asc');
      const results = await client.query("SELECT * FROM videos WHERE tipo__c = 'Webinar' and estatus__c='Activo' order by nube__c, id asc");
      console.error(results);
      res.render('pages/webinars', {results : results});
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  })
  .post("/newWebinar", function(req, res) {
    var datas = parseRequest(req);
    for(let i=0 ; i < datas.length ; i++){
      insertVideo(datas[i]);
    }
    res.status(201).end();
  })
  .post("/updWebinar", function(req, res) {
    var datas = parseRequest(req);
    for(let i=0 ; i < datas.length ; i++){
      updateVideo(datas[i]);
    }
    res.status(201).end();
  })
  .listen(PORT, () => console.log("Listening on ${ PORT }"));


parseRequest = function(req){
    var regs = [];
    console.log("req.body",JSON.stringify(req.body));
    var notification = req.body["soapenv:Envelope"]["soapenv:Body"][0]["notifications"][0];
    var sessionId = notification["SessionId"][0];
    if (notification["Notification"] !== undefined) {
      for (let i = 0; i < notification["Notification"].length; i++) {
        var data = {};
        var sobject = notification["Notification"][i]["sObject"][0];
        Object.keys(sobject).forEach(function(key) {
          if (key.indexOf("sf:") == 0) {
            var newKey = key.substr(3);
            data[newKey] = sobject[key][0];
          }
        }); 
        regs.push(data);
      }
    }
    return regs;
};

var promise = require('bluebird');

var options = {
  promiseLib: promise
};
var pgp = require('pg-promise')(options);
var connectionString = process.env.DATABASE_URL;
var db = pgp(connectionString);

insertVideo = function(data){
    console.log("data param: " + JSON.stringify(data));
    var dataString = JSON.stringify(data);
    db.tx(t => {
      const q1 = t.none('INSERT INTO videos(id,descripcioncorta__c,estatus__c,fecha__c,liga__c,name,nube__c,tipo__c) VALUES(${Id},${DescripcionCorta__c},${Estatus__c},${Fecha__c},${Liga__c},${Name},${Nube__c},${Tipo__c})', data);
      return t.batch([q1]); // all of the queries are to be resolved;
    })
    .then(data => {
        // success, COMMIT was executed
        console.log('success insertVideo');
    })
    .catch(error => {
        console.error('ERROR:', error);
        console.error("error inserting Video");
        console.error(error);
        return (500,JSON.stringify({"Error":true,"Data":data}));
    });
};

updateVideo = function(data){
  db.tx(t => {
    const q1 = t.none('UPDATE videos SET id = ${Id},descripcioncorta__c = ${DescripcionCorta__c},estatus__c = ${Estatus__c},fecha__c = ${Fecha__c},liga__c = ${Liga__c},name = ${Name},nube__c = ${Nube__c},tipo__c = ${Tipo__c} WHERE id = ${Id}', data);
    return t.batch([q1]); // all of the queries are to be resolved;
  })
    .then(data => {
        // success, COMMIT was executed
        console.log('success updateVideo');
    })
    .catch(error => {
        console.error('ERROR:', error);
        console.error("error updating Video");
        console.error(error);
        return (500,JSON.stringify({"Error":true,"Data":data}));
    });
};

