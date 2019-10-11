'use strict';

const AppError = require('./app-error');
const validate = require('./validate');

const assert = require('assert');
const mongo = require('mongodb').MongoClient;
const url = require('url');
var mlindex =0;
var msindex =0;

class Sensors {

    constructor(clients,dbnames){
    //  this.clients = client;
      this.client = clients;
      this.db = dbnames;
   //   this.clear();
  }

  /** Return a new instance of this class with database as
   *  per mongoDbUrl.  Note that mongoDbUrl is expected to
   *  be of the form mongodb://HOST:PORT/DB.
   */
  static async newSensors(mongoDbUrl) {
  if(/[a-z]*?:\/\/[a-z]*:\d{5}\/[a-z]*/.test(mongoDbUrl)){
    var myURL = url.parse(mongoDbUrl);
    var host = myURL.host;
    var protocol = myURL.protocol;
    var cli = protocol + "//" + host
    var dbs = mongoDbUrl.toString().split("27017/");
    var db_name = dbs[1];
    const client = await mongo.connect(cli, MONGO_OPTIONS);
    const db = client.db(db_name);
    console.log("connected to MongoDB"); 
    return new Sensors(client,db);
    } else {
      throw['improper URL specified'];
    }
  }
  /** Release all resources held by this Sensors instance.
   *  Specifically, close any database connections.
   */
  async close() {
    await this.client.close();
  }

  /** Clear database */
  async clear() {
    this.db.dropDatabase();
  }

  /** Subject to field validation as per validate('addSensorType',
   *  info), add sensor-type specified by info to this.  Replace any
   *  earlier information for a sensor-type with the same id.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async addSensorType(info) {
    const sensorType = validate('addSensorType', info);
    const dbTable = this.db.collection('sensor_type');
    const dups = [];
    var cnt=0
    try {
      cnt  = await dbTable.count({id: sensorType.id})
      if(cnt>0){
        //console.log(sensor.id);
        dbTable.update( {"id" : sensorType.id},
        {
          "id" : sensorType.id,
          "manufacturer": sensorType.manufacturer,
          "modelNumber": sensorType.modelNumber,
          "quantity": sensorType.quantity,
          "limits": sensorType.limits
      })
    } else {
      await dbTable.insertOne(sensorType);
    }
  }
    catch (err) {
      console.log(err);
      dups.push(err);
    }
    if (dups.length > 0) {
      throw ['invalid sensor type'];
    }
   
   // this.close();
  }
  
  /** Subject to field validation as per validate('addSensor', info)
   *  add sensor specified by info to this.  Note that info.model must
   *  specify the id of an existing sensor-type.  Replace any earlier
   *  information for a sensor with the same id.
   *
   *  All user errors must be thrown as an array of AppError's.
   */


  async addSensor(info) {
    const sensor = validate('addSensor', info);
    //console.log("was here");
    var cnt=0;
    const dbTable = this.db.collection('sensor');
    try{
    cnt  = await dbTable.count({id: sensor.id})
    //console.log(cnt);
    if(cnt>0){
      //console.log(sensor.id);
      dbTable.update( {"id" : sensor.id},
      {
        "id" : sensor.id,
        "model": sensor.model,
        "period": sensor.period,
        "expected": sensor.expected
    })
  }
    else if(await this.db.collection('sensor_type').findOne({id: sensor.model}))
    {
      await dbTable.insertOne(sensor);
     // console.log("data inserted");
    }
    else {
      throw["invalid sensor model"]
    }
  }
    catch(err){
      console.log(err);
      throw["invalid sensor model"]
    }
    //@TODO;
  }
  /** Subject to field validation as per validate('addSensorData',
   *  info), add reading given by info for sensor specified by
   *  info.sensorId to this. Note that info.sensorId must specify the
   *  id of an existing sensor.  Replace any earlier reading having
   *  the same timestamp for the same sensor.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async addSensorData(info) {
    const sensorData = validate('addSensorData', info);
    const dbTable = this.db.collection('sensor_data');
    const dbTable1 = this.db.collection('sensor_type');
    const dbTable2 = this.db.collection('sensor');
    let elems;
    var st;
    var el;
    try{
     if(await dbTable2.find({id: sensorData.sensorId})){
     var objs =  await dbTable2.find({id: sensorData.sensorId}).toArray()
     elems = objs[0];
       if(await dbTable1.find({id: elems.model})){
        var obs = await dbTable1.find({id: elems.model}).toArray()
        el = obs[0];
        st = el.limits;
        sensorData.status = inrange(sensorData.value, elems.expected, st);
       }
       var cnt1 = await dbTable.count({sensorId: sensorData.sensorId ,timestamp: sensorData.timestamp})
     //  console.log(cnt2)
       if(cnt1>0){
         console.log(sensorData.sensorId)
         console.log(sensorData.timestamp)
          dbTable.update( {sensorId : sensorData.sensorId, timestamp: sensorData.timestamp},
          {
            "sensorId": sensorData.sensorId,
            "timestamp": sensorData.timestamp,
            "value": sensorData.value,
            "status":sensorData.status
        }) 
       // console.log("was here")
      } else {
        await dbTable.insertOne(sensorData);
     //   console.log("Sensor data inserted");
       }
  } } catch(err){
    console.log(err)
    throw["invalid sensor model"]
  }
}

  /** Subject to validation of search-parameters in info as per
   *  validate('findSensorTypes', info), return all sensor-types which
   *  satisfy search specifications in info.  Note that the
   *  search-specs can filter the results by any of the primitive
   *  properties of sensor types (except for meta-properties starting
   *  with '_').
   *
   *  The returned value should be an object containing a data
   *  property which is a list of sensor-types previously added using
   *  addSensorType().  The list should be sorted in ascending order
   *  by id.
   *
   *  The returned object will contain a lastIndex property.  If its
   *  value is non-negative, then that value can be specified as the
   *  _index meta-property for the next search.  Note that the _index
   *  (when set to the lastIndex) and _count search-spec
   *  meta-parameters can be used in successive calls to allow
   *  scrolling through the collection of all sensor-types which meet
   *  some filter criteria.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async findSensorTypes(info) {
    //@TODO
    const searchSpecs = validate('findSensorTypes', info);
    const dbTable = this.db.collection('sensor_type');
    let myobj = { data: [] , nextIndex: ""};
    let og_arr = await dbTable.find().sort({id: 1}).toArray()
    var sindex = searchSpecs._index
    var scount = searchSpecs._count
    //const sTable = dbTable.find().sort({id: 1});
    try{
    if(searchSpecs.id!=null){
    let arr = await dbTable.find({id: searchSpecs.id}, { projection: { _id: 0} }).sort({id: 1}).toArray()
    if(arr.length == 0) { var errs= "id "+searchSpecs.id; throw errs}
    arr.forEach((elem) => {elem.id == searchSpecs.id ? myobj.data.push(elem):elem})
    myobj.nextIndex = -1;
    } else if(searchSpecs.manufacturer != null && searchSpecs.quantity!= null){
      if(!sindex){
        let arr = await dbTable.find({manufacturer: searchSpecs.manufacturer, quantity:searchSpecs.quantity}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "manufacturer "+searchSpecs.manufacturer + "with quantity " + searchSpecs.quantity; throw errs}
        arr.forEach((elem) => {elem.manufacturer == searchSpecs.manufacturer ? myobj.data.push(elem):elem})
        myobj.nextIndex = -1;
      } else {
        let arr = await dbTable.find({manufacturer: searchSpecs.manufacturer, quantity:searchSpecs.quantity}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "manufacturer "+searchSpecs.manufacturer + "with quantity " + searchSpecs.quantity; throw errs}
        let j=0
        mlindex = sindex
        for(let i=sindex; i<=og_arr.length; i++){
          if(i == og_arr.length){ 
            mlindex = -1
            break
          }
          for(let j=0 ; j<arr.length ; j++){
          if(og_arr[i].id == arr[j].id){
            myobj.data.push(arr[j])
            scount--
          }
        }
        mlindex++;
        if(scount <= 0){
          break;
        }
        }
        //og_arr.forEach((elem) => {elem.id == myobj.data[myobj.data.length-1].id ? myobj.nextIndex = og_arr.indexOf(elem)+1: elem }) 
        myobj.nextIndex = mlindex
      }
    } else if(searchSpecs.manufacturer != null){
      if(!sindex){
      let arr = await dbTable.find({manufacturer: searchSpecs.manufacturer}, { projection: { _id: 0} }).sort({id: 1}).toArray()
      if(arr.length == 0) { var errs= "manufacturer "+searchSpecs.manufacturer; throw errs}
      arr.forEach((elem) => {elem.manufacturer == searchSpecs.manufacturer ? myobj.data.push(elem):elem})
      myobj.nextIndex = -1;
      } else {
        let arr = await dbTable.find({manufacturer: searchSpecs.manufacturer}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "manufacturer "+searchSpecs.manufacturer; throw errs}
        let j=0
        mlindex = sindex
        for(let i=sindex; i<=og_arr.length; i++){
          if(i == og_arr.length){ 
            mlindex = -1
            break
          }
          for(let j=0 ; j<arr.length ; j++){
          if(og_arr[i].id == arr[j].id){
            myobj.data.push(arr[j])
            scount--
          }
        }
        mlindex++;
        if(scount <= 0){
          break;
        }
        }
        //og_arr.forEach((elem) => {elem.id == myobj.data[myobj.data.length-1].id ? myobj.nextIndex = og_arr.indexOf(elem)+1: elem }) 
        myobj.nextIndex = mlindex
      }
    } else if(searchSpecs.unit!= null){
      if(!sindex){
        let arr = await dbTable.find({unit: searchSpecs.unit}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "unit "+searchSpecs.unit; throw errs}
        arr.forEach((elem) => {elem.unit == searchSpecs.unit ? myobj.data.push(elem):elem})
        myobj.nextIndex = -1;
      } else {
        let arr = await dbTable.find({unit: searchSpecs.unit}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "unit "+searchSpecs.unit; throw errs}
        let j=0
        mlindex = sindex
        for(let i=sindex; i<=og_arr.length; i++){
          if(i == og_arr.length){ 
            mlindex = -1
            break
          }
          for(let j=0 ; j<arr.length ; j++){
          if(og_arr[i].id == arr[j].id){
            myobj.data.push(arr[j])
            scount--
          }
        }
        mlindex++;
        if(scount <= 0){
          break;
        }
        }
        //og_arr.forEach((elem) => {elem.id == myobj.data[myobj.data.length-1].id ? myobj.nextIndex = og_arr.indexOf(elem)+1: elem }) 
        myobj.nextIndex = mlindex
      }
    } else if(searchSpecs.quantity != null){
      if(!sindex){
        let arr = await dbTable.find({quantity: searchSpecs.quantity}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "quantity "+searchSpecs.quantity; throw errs}
        arr.forEach((elem) => {elem.quantity == searchSpecs.quantity ? myobj.data.push(elem):elem})
        myobj.nextIndex = -1;
      } else {
        let arr = await dbTable.find({quantity: searchSpecs.quantity}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "quantity "+searchSpecs.quantity; throw errs}
        let j=0
        mlindex = sindex
        for(let i=sindex; i<=og_arr.length; i++){
          if(i == og_arr.length){ 
            mlindex = -1
            break
          }
          for(let j=0 ; j<arr.length ; j++){
          if(og_arr[i].id == arr[j].id){
            myobj.data.push(arr[j])
            scount--
          }
        }
        mlindex++;
        if(scount <= 0){
          break;
        }
        }
        //og_arr.forEach((elem) => {elem.id == myobj.data[myobj.data.length-1].id ? myobj.nextIndex = og_arr.indexOf(elem)+1: elem }) 
        myobj.nextIndex = mlindex
      }
    } else if(searchSpecs.modelNumber != null){
      if(!sindex){
        let arr = await dbTable.find({modelNumber: searchSpecs.modelNumber}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "modelNumber"+searchSpecs.modelNumber; throw errs}
        arr.forEach((elem) => {elem.modelNumber == searchSpecs.modelNumber ? myobj.data.push(elem):elem})
        myobj.nextIndex = -1;
      } else {
        let arr = await dbTable.find({unit: searchSpecs.unit}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "modelNumber"+searchSpecs.modelNumber; throw errs}
        let j=0
        mlindex = sindex
        for(let i=sindex; i<=og_arr.length; i++){
          if(i == og_arr.length){ 
            mlindex = -1
            break
          }
          for(let j=0 ; j<arr.length ; j++){
          if(og_arr[i].id == arr[j].id){
            myobj.data.push(arr[j])
            scount--
          }
        }
        mlindex++;
        if(scount <= 0){
          break;
        }
        }
        //og_arr.forEach((elem) => {elem.id == myobj.data[myobj.data.length-1].id ? myobj.nextIndex = og_arr.indexOf(elem)+1: elem }) 
        myobj.nextIndex = mlindex 
      }
    }
    }
     catch(errs){
      const err = `no such sensor type with ${errs}`;
      throw [ new AppError('X_ID', err) ];
     }
    return myobj;
  }
  
  /** Subject to validation of search-parameters in info as per
   *  validate('findSensors', info), return all sensors which satisfy
   *  search specifications in info.  Note that the search-specs can
   *  filter the results by any of the primitive properties of a
   *  sensor (except for meta-properties starting with '_').
   *
   *  The returned value should be an object containing a data
   *  property which is a list of all sensors satisfying the
   *  search-spec which were previously added using addSensor().  The
   *  list should be sorted in ascending order by id.
   *
   *  If info specifies a truthy value for a _doDetail meta-property,
   *  then each sensor S returned within the data array will have an
   *  additional S.sensorType property giving the complete sensor-type
   *  for that sensor S.
   *
   *  The returned object will contain a lastIndex property.  If its
   *  value is non-negative, then that value can be specified as the
   *  _index meta-property for the next search.  Note that the _index (when 
   *  set to the lastIndex) and _count search-spec meta-parameters can be used
   *  in successive calls to allow scrolling through the collection of
   *  all sensors which meet some filter criteria.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async findSensors(info) {
    //@TODO
    const searchSpecs = validate('findSensors', info);
    const dbTable = this.db.collection('sensor');
    let myobj = { data: [] , nextIndex: ""};
    var sindex = searchSpecs._index
    var scount = searchSpecs._count
    try{
    if(searchSpecs.id!=null){
    let arr = await dbTable.find({id: searchSpecs.id}, { projection: { _id: 0} }).sort({id: 1}).toArray()
    if(arr.length == 0) { var errs= "id "+searchSpecs.id; throw errs}
    arr.forEach((elem) => {elem.id == searchSpecs.id ? myobj.data.push(elem):elem})
    myobj.nextIndex = -1;
    } else if(searchSpecs.model != null){
      if(!sindex){
      let arr = await dbTable.find({model: searchSpecs.model}, { projection: { _id: 0} }).sort({id: 1}).toArray()
      if(arr.length == 0) { var errs= "model " + searchSpecs.model; throw errs}
      for(let i=0; i<5 ; i++){
        myobj.data.push(arr[i])
        msindex++
      }
      myobj.nextIndex = msindex;
      } else {
        let arr = await dbTable.find({model: searchSpecs.model}, { projection: { _id: 0} }).sort({id: 1}).toArray()
        if(arr.length == 0) { var errs= "model " + searchSpecs.id; throw errs}
        msindex = sindex
        for(let i=sindex; i<=arr.length; i++){
          if(i == arr.length){ 
            msindex = -1
            break
          } 
            myobj.data.push(arr[i])
            scount--
            msindex++
        if(scount <= 0){
          break;
        }
        }
        //og_arr.forEach((elem) => {elem.id == myobj.data[myobj.data.length-1].id ? myobj.nextIndex = og_arr.indexOf(elem)+1: elem }) 
        myobj.nextIndex = msindex
      }
    } 
    }
     catch(errs){
      const err = `no such sensor with ${errs}`;
      throw [ new AppError('X_ID', err) ];
     }
    return myobj;
  }
  
  /** Subject to validation of search-parameters in info as per
   *  validate('findSensorData', info), return all sensor readings
   *  which satisfy search specifications in info.  Note that info
   *  must specify a sensorId property giving the id of a previously
   *  added sensor whose readings are desired.  The search-specs can
   *  filter the results by specifying one or more statuses (separated
   *  by |).
   *
   *  The returned value should be an object containing a data
   *  property which is a list of objects giving readings for the
   *  sensor satisfying the search-specs.  Each object within data
   *  should contain the following properties:
   * 
   *     timestamp: an integer giving the timestamp of the reading.
   *     value: a number giving the value of the reading.
   *     status: one of "ok", "error" or "outOfRange".
   *
   *  The data objects should be sorted in reverse chronological
   *  order by timestamp (latest reading first).
   *
   *  If the search-specs specify a timestamp property with value T,
   *  then the first returned reading should be the latest one having
   *  timestamp <= T.
   * 
   *  If info specifies a truthy value for a doDetail property, 
   *  then the returned object will have additional 
   *  an additional sensorType giving the sensor-type information
   *  for the sensor and a sensor property giving the sensor
   *  information for the sensor.
   *
   *  Note that the timestamp search-spec parameter and _count
   *  search-spec meta-parameters can be used in successive calls to
   *  allow scrolling through the collection of all readings for the
   *  specified sensor.
   *
   *  All user errors must be thrown as an array of AppError's.
   */
  async findSensorData(info) {
    //@TODO
    const searchSpecs = validate('findSensorData', info);
    const dbTable = this.db.collection('sensor_data');
    const dbTable1 = this.db.collection('sensor_type');
    const dbTable2 = this.db.collection('sensor');
    let myobj = { data: []};
    var myobjs = {data: [], sensorType:[], sensor:[] };
    var scount = searchSpecs._count
    let abc = searchSpecs.statuses;
    let test = abc.values();
    let test1 = test.next().value;
    //console.log(test1)
    let test2 = test.next().value;
    //console.log(test2)
    try{  

      if(searchSpecs._doDetail){
        //console.log("was here top")
        let arr = await dbTable.find({sensorId: searchSpecs.sensorId}, { projection: { _id: 0, sensorId: 0}}).sort({timestamp: -1}).toArray()
        if(arr.length == 0) { var errs= "sensorId " + searchSpecs.sensorId; throw errs}
        for(let j=0; j<arr.length; j++){
          if((arr[j].status === test1) || (arr[j].status === test2)){
            myobjs.data.push(arr[j])
            scount-- 
          }
          if(scount == 0){
            break;
          }
      }
      var elem1 = await dbTable2.find({id: searchSpecs.sensorId}, { projection: { _id: 0}}).toArray()
      myobjs.sensor.push(elem1)
      var elem2 = await dbTable1.find({model: elem1.model}, { projection: { _id: 0}}).toArray()
      myobjs.sensorType.push(elem2[0]) 
    } 

  /*  if(test1 != undefined && test2 != undefined && searchSpecs._count!= null){
      console.log("was here 5")
      let arr = await dbTable.find({sensorId: searchSpecs.sensorId}, { projection: { _id: 0, sensorId: 0}}).sort({timestamp: -1}).toArray()
      for(let j=0; j<arr.length; j++){
        if((arr[j].status === test1) || (arr[j].status === test2)){
          myobj.data.push(arr[j])
          scount-- 
        }
        if(scount == 0){
          break;
        }
    } }

     if(test1 != undefined && test2 == undefined && info._count !=-1 ){
      console.log("was here 4")
      let arr = await dbTable.find({sensorId: searchSpecs.sensorId}, { projection: { _id: 0, sensorId: 0}}).sort({timestamp: -1}).toArray()
      for(let j=0; j<arr.length; j++){
        if(arr[j].status === test1){
          myobj.data.push(arr[j])
          scount-- 
        }
        if(scount == 0){
          break;
        }
    } }  */
    
    if(info.timestamp != null && info._count != null){
      //console.log("was here 3")
      let arr = await dbTable.find({sensorId: searchSpecs.sensorId}, { projection: { _id: 0, sensorId: 0}}).sort({timestamp: -1}).toArray()
      if(arr.length == 0) { var errs= "sensorId " + searchSpecs.sensorId; throw errs}  
      for(let j=0; j<arr.length; j++){
          if(arr[j].timestamp <= searchSpecs.timestamp){
            myobj.data.push(arr[j])
            scount-- 
          }
          if(scount == 0){
            break;
          }
        }
    } 
    
    if(searchSpecs.sensorId != null && info.statuses != null && info.timestamp == null){
      if(info.statuses == "all"){
      //console.log("was here2")
      let arr = await dbTable.find({sensorId: searchSpecs.sensorId}, { projection: { _id: 0} }).sort({timestamp: -1}).toArray()
      if(arr.length == 0) { var errs= "sensorId " + searchSpecs.sensorId; throw errs}  
      for(let i=0; i<5; i++){
        myobj.data.push(arr[i])
      }} else if(test1 != undefined && test2 == undefined && info._count !=-1 ){
       // console.log("was here 4")
        let arr = await dbTable.find({sensorId: searchSpecs.sensorId}, { projection: { _id: 0, sensorId: 0}}).sort({timestamp: -1}).toArray()
        if(arr.length == 0) { var errs= "sensorId " + searchSpecs.sensorId; throw errs}  
        for(let j=0; j<arr.length; j++){
          if(arr[j].status === test1){
            myobj.data.push(arr[j])
            scount-- 
          }
          if(scount == 0){
            break;
          }
      } } else if(test1 != undefined && test2 != undefined){
        //console.log("was here 5")
        let arr = await dbTable.find({sensorId: searchSpecs.sensorId}, { projection: { _id: 0, sensorId: 0}}).sort({timestamp: -1}).toArray()
        if(arr.length == 0) { var errs= "sensorId " + searchSpecs.sensorId; throw errs}  
        for(let j=0; j<arr.length; j++){
          if((arr[j].status === test1) || (arr[j].status === test2)){
            myobj.data.push(arr[j])
            scount-- 
          }
          if(scount == 0){
            break;
          }
      } }
    } 
    
    if(searchSpecs.sensorId!=null && info.statuses == null && info.timestamp == null ){
      //console.log("was here1")
      let arr = await dbTable.find({sensorId: searchSpecs.sensorId, status: test1}, { projection: { _id: 0, sensorId: 0} }).sort({timestamp: -1}).toArray()
      if(arr.length == 0) { var errs= "sensorId " + searchSpecs.sensorId; throw errs}  
      for(let k=0; k<5; k++){
        myobj.data.push(arr[k])
      }
    }  

    }catch(errs){
      const err = `no such sensor data with ${errs}`;
      throw [ new AppError('X_ID', err) ];
       }
       if(searchSpecs._doDetail){
         return myobjs
       } else {
        return myobj;
       }
    
  }

  
  
} //class Sensors

function inrange(value, sens, st){
  if (value > sens.max){
     if(st.min <= value  && value <= st.max ){
       return "outOfRange";
     } else {
       return "error";
     }
   } else if(value < sens.min){
     if(st.min <= value && value <= st.max ){
       return "outOfRange";
     } else {
       return "error";
     }
   }  else if(sens.min <= value && value <= sens.max){
     return "ok";
   }
 }

module.exports = Sensors.newSensors;

//Options for creating a mongo client
const MONGO_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};



function inRange(value, range) {
  return Number(range.min) <= value && value <= Number(range.max);
}