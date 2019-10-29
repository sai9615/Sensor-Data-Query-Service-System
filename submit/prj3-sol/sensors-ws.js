const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

const AppError = require('./app-error');

const OK = 200;
const CREATED = 201;
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const CONFLICT = 409;
const SERVER_ERROR = 500;

const app = express();

function serve(port, sensors) {
  
  app.locals.port = port;
  app.locals.Sensors = sensors;
  setupRoutes(app);
  app.listen(port, function() {
  console.log(`listening on port ${port}`);
  });
  //@TODO set up express app, routing and listen
  
}

app.get('/', function(req,res) {
  res.send("Hey I am responding to your request")
})

module.exports = { serve: serve };

function setupRoutes(app){
  app.use(cors());
  app.use(bodyParser.json());
  app.get('/sensor-types', getSensortype(app)) 
  app.get('/sensor-types/:sensorid', getSensTypeByid(app))
  app.post('/sensor-types', postSensortype(app))
  app.get('/sensors', getSensors(app))
  app.get('/sensors/:sensorid', getSensByid(app))
  app.post('/sensors', postSensors(app))
  app.get('/sensor-data/:sensorid', getSensorsData(app))
  app.get('/sensor-data/:sensorid/:timestamp', getSensorsDatabyTimeStamp(app))
  //app.get('/sensor-data/:sensorid', getSensorsDatabyStatus(app))
  app.post('/sensor-data/:sensorid',postSensorData(app))
  //app.use(doErrors());
}


function getSensortype(app){
return errorWrap(async function(req, res) {
try{
  const query =  req.query;
  // if (req.query.id != undefined) {
  //   throw{isDomain: true,
  //     errorCode: 'NOT_FOUND',
  //     message: `sensor data not found`,}
  // }
  if(query.length != 0 ){
    const results = await app.locals.Sensors.findSensorTypes(query)
    if(results.length === 0 ){
      throw{isDomain: true,
        errorCode: 'NOT_FOUND',
        message: `sensor data not found`,}
    } else {
      results.next =  "http://localhost:2345/sensor-types?_index=" +results.nextIndex + "&_count=" +req.query._count 
      results.prev =  "http://localhost:2345/sensor-types?_index=" +results.previousIndex + "&_count=" +req.query._count 
      results.self = requestUrl(req)
      res.json(results)
    }   
  } else {
  const results = await app.locals.Sensors.findSensorTypes()
  if(results.length === 0 ){
    throw{isDomain: true,
      errorCode: 'NOT_FOUND',
      message: `sensor data not found`,}
  } else {
    results.self = requestUrl(req)
    res.json(results)

  } }
} catch(err) {
 // console.log(err)
  err[0].isDomain = true
  const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
}
})
}

function getSensTypeByid(app){
  return errorWrap(async function(req, res) {
try{
  let id = req.params.sensorid
  const results = await app.locals.Sensors.findSensorTypes({id:id})
  if(results.length === 0 ){
    throw{isDomain: true,
      errorCode: 'NOT_FOUND',
      message: `sensor data not found`,}
  } else {
    results.self = requestUrl(req)
    res.json(results)
  }
}catch(err) {
 //console.log(err)
  err[0].isDomain = true
  const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
}
})
}

function postSensortype(app){
  return errorWrap(async function(req, res) {
 try { 
  const obj = req.body
  const results = await app.locals.Sensors.addSensorType(obj)
  res.append('Location', requestUrl(req) + '/' + obj.id);
  res.sendStatus(CREATED);
  } catch(err){
    err[0].isDomain = true
    const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
}
  })
}

function getSensors(app){
  return errorWrap(async function(req, res) {
  try{
    const query =  req.query;
    // if (req.query.id != undefined) {
    //   throw{isDomain: true,
    //     errorCode: 'NOT_FOUND',
    //     message: `sensor not found`,}
    // }
      const results = await app.locals.Sensors.findSensors(query)
      if(results == null ){
        throw{isDomain: true,
          errorCode: 'NOT_FOUND',
          message: `sensor not found`,}
      } else {
      results.next =  "http://localhost:2345/sensors?model=" +req.query.model+ "&_index=" +results.nextIndex + "&_count=" +req.query._count 
      results.prev =  "http://localhost:2345/sensors?model=" +req.query.model+ "&_count=" +req.query._count 
        results.self = requestUrl(req) 
        res.json(results)
      }   
    }  catch(err) {
    err[0].isDomain = true
    const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
  }
  })
}

function getSensByid(app){
  return errorWrap(async function(req, res) {
try{
  let id = req.params.sensorid
  const results = await app.locals.Sensors.findSensors({id:id})
  if(results.length === 0 ){
    throw{isDomain: true,
      errorCode: 'NOT_FOUND',
      message: `sensor id not found`,}
  } else {
    res.json(results)
  }
}catch(err) {
  err[0].isDomain = true
    const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
}
})
}

function postSensors(app){
  return errorWrap(async function(req, res) {
 try { 
  const obj = req.body
  const results = await app.locals.Sensors.addSensor(obj)
  res.append('Location', requestUrl(req) + '/' + obj.id);
  res.sendStatus(CREATED);
  } catch(err){
    err[0].isDomain = true
    const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
}
  })
}


function getSensorsData(app){
  return errorWrap(async function(req, res) {
  try{
    let timestamp = req.query.timestamp
    let sensorid = req.params.sensorid
    let count = req.query._count
    let statuses = req.query.statuses
    let dodetail = req.query._doDetail
    if(timestamp || statuses || dodetail){
      let results = null
      if(timestamp!= undefined && sensorid!= undefined && statuses!=undefined){
        results = await app.locals.Sensors.findSensorData({sensorId:sensorid, timestamp:timestamp, statuses:statuses})
        results.self = requestUrl(req)  
      } else if(count!= undefined && sensorid!= undefined && timestamp!=undefined){
        results = await app.locals.Sensors.findSensorData({sensorId:sensorid, timestamp:timestamp, _count:count})
        results.self = requestUrl(req)  
      } else if(dodetail!= undefined && count!= undefined){
        results = await app.locals.Sensors.findSensorData({sensorId:sensorid, _doDetail:dodetail, _count:count})
        results.self = requestUrl(req)  
      } 
      if(results == null ){
        throw{isDomain: true,
          errorCode: 'NOT_FOUND',
          message: `sensor data not found`,}
      } else {
        results.data.forEach(elem => elem.self = "http://localhost:2345/sensor-data/" + sensorid + "/" + elem.timestamp)
        res.json(results)
      }   
    } else {
    let sensorid = req.params.sensorid  
    const results = await app.locals.Sensors.findSensorData({sensorId:sensorid})
    results.self = requestUrl(req)
    if(results.length === 0 ){
      throw{isDomain: true,
        errorCode: 'NOT_FOUND',
        message: `sensor data not found`,}
    } else {
      results.data.forEach(elem => elem.self = "http://localhost:2345/sensor-data/" + sensorid + "/" + elem.timestamp)
      res.json(results)
    } } 
  } catch(err) {
    err[0].isDomain = true
    const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
  }
  })
}

function getSensorsDatabyTimeStamp(app){
  return errorWrap(async function(req, res) {
    try{
      let id = req.params.sensorid
      let timestamp = req.params.timestamp
      let match = 0
      let index = 0
      const results = await app.locals.Sensors.findSensorData({timestamp:timestamp, sensorId:id})
     const check = results.data
        for(let i =0 ; i<check.length; i++){
          if(check[i].timestamp === Number(timestamp))
          {
             match = 1
             index = i
             check[index].self = "http://localhost:2345/sensor-data/" + id + "/" + timestamp
          }
        }
      if(match === 0 || results.length === 0 ){
        throw{isDomain: true,
          errorCode: 'NOT_FOUND',
          message: `sensor data with timestamp not found`,}
      } else {
        results.self = requestUrl(req)
        results.data = check[index]
       // results.data[0].self = check.self
        res.json(results)
      }
    }catch(err) {
    err[0].isDomain = true
    const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
    }
    })
}

function postSensorData(app){
  return errorWrap(async function(req, res) {
 try { 
  const obj = req.body 
  const replacement = Object.assign({}, obj)
  replacement.sensorId = req.params.sensorid
  const results = await app.locals.Sensors.addSensorData(replacement)
  res.append('Location', requestUrl(req) + '/' + obj.id);
  res.sendStatus(CREATED);
  } catch(err){
    err[0].isDomain = true
    const mapped = mapError(err[0]);
    res.status(mapped.status).json(mapped);
}
  })
}




/* Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */ 
function doErrors(app) {
  return async function(err, req, res, next) {
    res.status(SERVER_ERROR);
    res.json({ code: 'SERVER_ERROR', message: err.message });
    console.error(err);
  };
}

/** Set up error handling for handler by wrapping it in a 
 *  try-catch with chaining to error handler on error.
 */
function errorWrap(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    }
    catch (err) {
      next(err);
    }
  };
}

/*************************** Mapping Errors ****************************/

const ERROR_MAP = {
  EXISTS: CONFLICT,
  NOT_FOUND: NOT_FOUND
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapError(err) {
  console.error(err);
  return err.isDomain
    ? { status: (ERROR_MAP[err.code] || BAD_REQUEST),
	code: err.code,
	message: err.msg
      }
    : { status: SERVER_ERROR,
	code: 'INTERNAL',
	message: err.toString()
      };
} 

/****************************** Utilities ******************************/

/** Return original URL for req */
function requestUrl(req) {
  const port = req.app.locals.port;
  return `${req.protocol}://${req.hostname}:${port}${req.originalUrl}`;
}