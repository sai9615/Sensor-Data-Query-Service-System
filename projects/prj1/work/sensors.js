'use strict';

const assert = require('assert');

let myarray = new Array();
let mysensarr = new Array();
let mysdarr = new Array();
var mlindex;
var msindex;
var track=0; 
var tmstp;

//const myarray = new Array();

class Sensors {
  constructor() {
    this.clear();
  }

  /** Clear out all data from this object. */
  async clear() {
    //clear all the arrays!
    myarray.length = 0;
    mysensarr.length =0;
    mysdarr.length = 0;
  }

  /** Subject to field validation as per FN_INFOS.addSensorType,
   *  add sensor-type specified by info to this.  Replace any
   *  earlier information for a sensor-type with the same id.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async addSensorType(info) {
    const sensorType = validate("addSensorType", info);
    // Used to check if the newly added sensor already exsists!
    //  myarray.push(sensorType);
    var cnt=0;
    if (myarray.length == 0) {
      myarray.push(sensorType);
      // console.log(myarray[0].id);
    }
    for (var len = 0; len < myarray.length; len++) {
      if (myarray[len].id !== sensorType.id && len + 1 == myarray.length) {
        myarray.push(sensorType);
        console.log("hello my id is " + myarray[len + 1].id);
        cnt++;
        break;
      } else if (myarray[len].id === sensorType.id) {
        myarray[len].manufacturer = sensorType.manufacturer;
        myarray[len].modelNumber = sensorType.modelNumber;
        myarray[len].quantity = sensorType.quantity;
        myarray[len].unit = sensorType.unit;
        myarray[len].limits[0] = sensorType.limits[0];
        myarray[len].limits[1] = sensorType.limits[1];
        break;
      } else {
        continue;
      }
    }
    if(mlindex<0){
      mlindex = mlindex + cnt; 
    } else {
      mlindex = myarray.length;  
    } 
     //console.log(myarray[0].id);
  }
  /** Subject to field validation as per FN_INFOS.addSensor, add
   *  sensor specified by info to this.  Replace any earlier
   *  information for a sensor with the same id.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async addSensor(info) {
    const sensor = validate("addSensor", info);
    var check = 0;
    for (var i = 0; i < myarray.length; i++) {
      if (myarray[i].id === sensor.model) {
        check = 1;
        console.log("sensor id is " + sensor.id);
        break;
      }
    }
    if (check == 1) {
      mysensarr.push(sensor);
    } else if (check != 1) {
      throw [`no model ${sensor.model} sensor`];
    }
    msindex = mysensarr.length;
    //@TODO
  }

  /** Subject to field validation as per FN_INFOS.addSensorData, add
   *  reading given by info for sensor specified by info.sensorId to
   *  this. Replace any earlier reading having the same timestamp for
   *  the same sensor.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async addSensorData(info) {
    const sensorData = validate("addSensorData", info);
    var check = 0;
    var st;
    //we add the first sensor to array and validate it's id later.
    //All the sensors after the first sensor would be added
    //after their id is first verified.
    if (mysdarr.length == 0) {
      mysdarr.push(sensorData);
    }
    for (var j = 0; j < mysensarr.length; j++) {
      if (mysensarr[j].id === sensorData.sensorId) {
        for(var k=0; k<myarray.length; k++){
          if(myarray[k].id == mysensarr[j].model){
            st = myarray[k].limits;
            break;
          } 
        }
        sensorData.status = inrange(sensorData.value, mysensarr[j].expected, st);
        check = 1;
        break;
      }
    }
    if (check == 1) {
      var exsists = 0;
      for (var k = 0; k < mysdarr.length; k++) {
        if (
          mysdarr[k].sensorId === sensorData.sensorId &&
          mysdarr[k].timestamp === sensorData.timestamp
        ) {
          mysdarr[k].value = sensorData.value;
          console.log(mysdarr[0].value);
          exsists = 1;
          break;
        }
      }
      if (exsists === 0) {
        mysdarr.push(sensorData);
      }
    } else if (check != 1) {
      //if the first element is invalid.
      if (mysdarr.length === 1) {
        mysdarr.pop;
      }
      throw [`no model ${sensorData.sensorId} sensor`];
    }
    //@TODO
  }

  /** Subject to validation of search-parameters in info as per
   *  FN_INFOS.findSensorTypes, return all sensor-types which
   *  satisfy search specifications in info.  Note that the
   *  search-specs can filter the results by any of the primitive
   *  properties of sensor types.
   *
   *  The returned value should be an object containing a data
   *  property which is a list of sensor-types previously added using
   *  addSensorType().  The list should be sorted in ascending order
   *  by id.
   *
   *  The returned object will contain a lastIndex property.  If its
   *  value is non-negative, then that value can be specified as the
   *  index property for the next search.  Note that the index (when
   *  set to the lastIndex) and count search-spec parameters can be used
   *  in successive calls to allow scrolling through the collection of
   *  all sensor-types which meet some filter criteria.
   *
   *
   *  All user errors must be thrown as an array of objects.
   */
  async findSensorTypes(info) {
    const searchSpecs = validate("findSensorTypes", info);
    //@TODO
    var counts = 0;
    var myobj = { nextIndex: "", data: [] };
    var search = false;
    myarray.sort((prop1, prop2) => (prop1.id > prop2.id ? 1 : -1));
    if (searchSpecs.index != null && searchSpecs.index != 0) {
                  if (searchSpecs.index > myarray.length - 1 || searchSpecs.index < 0) {
                    throw [`improper index specified ${searchSpecs.index}`];
                  }
                  if (mlindex > 0) {
                    for (var j = track; j < track + searchSpecs.count; j++) {
                      myobj.data.push(myarray[j]);
                      counts++;
                    }
                    mlindex = mlindex - counts;
                    track = myarray.indexOf(myobj.data[counts-1])+1;
                    if (mlindex > 0) {
                      myobj.nextIndex = track;
                    } else {
                      myobj.nextIndex = mlindex;
                    }
                  } else {
                    for (var j = searchSpecs.index; j < track + searchSpecs.count; j++) {
                      myobj.data.push(myarray[j]);
                      counts++;
                    }
                    mlindex = mlindex - counts;
                    track = myarray.indexOf(myobj.data[counts-1])+1;
                    if (mlindex > 0) {
                      myobj.nextIndex = track;
                    } else {
                      myobj.nextIndex = mlindex;
                    }
                  }
    } else if (searchSpecs.id != null) {
                for (var l = 0; l < myarray.length; l++) {
                  if (myarray[l].id === searchSpecs.id) {
                    myobj.data.push(myarray[l]);
                    search = true;
                    counts++;
                  }
                }
                if (search == false) {
                  throw [`id not found: ${searchSpecs.id}`];
                }
                mlindex = mlindex - counts;
                track = myarray.indexOf(myobj.data[counts-1])+1;
                if (mlindex > 0) {
                  myobj.nextIndex = track;
                } else {
                  myobj.nextIndex = mlindex;
                }
    } else if (searchSpecs.manufacturer != null) {
              for (var l = 0; l < myarray.length; l++) {
                if (myarray[l].manufacturer === searchSpecs.manufacturer) {
                  myobj.data.push(myarray[l]);
                  search = true;
                  counts++;
                }
              }
              if (search == false) {
                throw [`manufacturer not found: ${searchSpecs.manufacturer}`];
              }
              mlindex = mlindex - counts;
              track = myarray.indexOf(myobj.data[counts-1])+1;
              if (mlindex > 0) {
                myobj.nextIndex = track;
              } else {
                myobj.nextIndex = mlindex;
              }
    } else if (searchSpecs.quantity != null) {
              for (var l = 0; l < myarray.length; l++) {
                if (myarray[l].quantity === searchSpecs.quantity) {
                  myobj.data.push(myarray[l]);
                  counts++;
                  search = true;
                }
              }
              if (search == false) {
                throw [`quantity not found: ${searchSpecs.quantity}`];
              }
              mlindex = mlindex - counts;
              track = myarray.indexOf(myobj.data[counts-1])+1;
              if (mlindex > 0) {
                myobj.nextIndex = track;
              } else {
                myobj.nextIndex = mlindex;
              }
    } else if (searchSpecs.unit != null) {
              for (var l = 0; l < myarray.length; l++) {
                if (myarray[l].unit === searchSpecs.unit) {
                  myobj.data.push(myarray[l]);
                  search = true;
                  counts++;
                }
              }
              if (search == false) {
                throw [`unit not found: ${searchSpecs.unit}`];
              }
              mlindex = mlindex - counts;
              track = myarray.indexOf(myobj.data[counts-1])+1;
              if (mlindex > 0) {
                myobj.nextIndex = track;
              } else {
                myobj.nextIndex = mlindex;
              }
    } else if (searchSpecs.modelNumber != null) {
              for (var l = 0; l < myarray.length; l++) {
                if (myarray[l].modelNumber === searchSpecs.modelNumber) {
                  myobj.data.push(myarray[l]);
                  search =true;
                  counts++;
                }
              }
              if (search == false) {
                throw [`modelNumber not found: ${searchSpecs.modelNumber}`];
              }
              mlindex = mlindex - counts;
              track = myarray.indexOf(myobj.data[counts-1])+1;
              if (mlindex > 0) {
                myobj.nextIndex = track;
              } else {
                myobj.nextIndex = mlindex;
              }
    } else {
              for (var j = 0; j < searchSpecs.count; j++) {
                myobj.data.push(myarray[j]);
                counts++;
              }
            // console.log("mlindex is " + mlindex + "count is " + counts);
              mlindex = mlindex - counts;
            //  console.log("mlindex is " + mlindex);
              track = myarray.indexOf(myobj.data[counts-1])+1;
              if (mlindex > 0) {
                myobj.nextIndex = track;
              } else {
                myobj.nextIndex = mlindex;
              }
    }
    return myobj;
  }

  /** Subject to validation of search-parameters in info as per
   *  FN_INFOS.findSensors, return all sensors which
   *  satisfy search specifications in info.  Note that the
   *  search-specs can filter the results by any of the primitive
   *  properties of a sensor.
   *
   *  The returned value should be an object containing a data
   *  property which is a list of all sensors satisfying the
   *  search-spec which were previously added using addSensor().  The
   *  list should be sorted in ascending order by id.
   *
   *  If info specifies a truthy value for a doDetail property,
   *  then each sensor S returned within the data array will have
   *  an additional S.sensorType property giving the complete
   *  sensor-type for that sensor S.
   *
   *  The returned object will contain a lastIndex property.  If its
   *  value is non-negative, then that value can be specified as the
   *  index property for the next search.  Note that the index (when
   *  set to the lastIndex) and count search-spec parameters can be used
   *  in successive calls to allow scrolling through the collection of
   *  all sensors which meet some filter criteria.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async findSensors(info) {
    const searchSpecs = validate("findSensors", info);
    var counts = 0;
    var myobj = { nextIndex: "", data: [] };
    var myobjs = { nextIndex: "", data: [], sensorType:[] };
    var search = false;
    var ind=0;
    mysensarr.sort((prop1, prop2) => (prop1.id > prop2.id ? 1 : -1));

    if (searchSpecs.id != null) {
            var l;
            if(searchSpecs.index != 0){
              l = searchSpecs.index; 
            }
            else {
              if(track == 0){
                l=0
              } else{
                l= track-1;
              }
            }
            for (l; l < mysensarr.length; l++) {
              if (mysensarr[l].id === searchSpecs.id) {
                  myobj.data.push(mysensarr[l]);
                  search = true;
                  counts++;
              }
              ind++;
              track++;
              if(searchSpecs.count !=0 && counts == searchSpecs.count){
                break;
              }
            }
            if (search == false) {
              throw [`id not found: ${searchSpecs.id}`];
            }
            msindex = msindex - ind++;
            if (msindex > 0) {
              myobj.nextIndex = track-1;
            } else {
              myobj.nextIndex = msindex;
            }
    } else if (searchSpecs.model != null) {
            var l;
            if(searchSpecs.index != 0){
              l = searchSpecs.index; 
            }
            else {
                if(track == 0){
                  l=0
                } else{
                  l= track-1;
                }
            }
            for (l; l < mysensarr.length; l++) {
              if (mysensarr[l].model === searchSpecs.model) {
                if(searchSpecs.doDetail){
                  myobjs.data.push(mysensarr[l]);  
                } else {
                  myobj.data.push(mysensarr[l]);
                }
                search = true;
                counts++;
              }
              ind++;
              track++;
              if(searchSpecs.count !=0 && counts == searchSpecs.count){
                break;
              }
            }
            if (search == false) {
              throw [`model not found: ${searchSpecs.model}`];
            }
            msindex = msindex - ind;
            if(!searchSpecs.doDetail){
            if (msindex > 0) {
              myobj.nextIndex = track-1;
            } else {
              myobj.nextIndex = msindex;
            }
          }else{
            for(var a=0; a<myarray.length; a++ ){
              for(var b=0; b<myobjs.data.length; b++ ){
                if(myarray[a].id == myobjs.data[b].model){
                  myobjs.sensorType = myarray[a];
                }
              }
            } 
            if (msindex > 0) {
              myobjs.nextIndex = track-1;
            } else {
              myobjs.nextIndex = msindex;
            }
    }
    } else if (searchSpecs.period != null) {
            var l;
            if(searchSpecs.index != 0){
              l = searchSpecs.index; 
            }
            else {
              if(track == 0){
                l=0
              } else{
                l= track-1;
              }
            }
            for (l; l < mysensarr.length; l++) {
              if (mysensarr[l].period === searchSpecs.period) {
                myobj.data.push(mysensarr[l]);
                counts++;
                search = true;
              }
              ind++;
              track++;
              if(searchSpecs.count !=0 && counts == searchSpecs.count){
                break;
              }
          }
          if (search == false) {
            throw [`period not found: ${searchSpecs.period}`];
          }
          msindex = msindex - ind;
          if (msindex > 0) {
            myobj.nextIndex = track-1;
          } else {
            myobj.nextIndex = msindex;
          }
    } else {
              for (var j = 0; j < searchSpecs.count; j++) {
                myobj.data.push(mysensarr[j]);
                counts++;
              }
              console.log("mlindex is " + msindex + "count is " + counts);
              msindex = msindex - counts;
              console.log("msindex is " + msindex);
              track = counts;
            if (msindex > 0) {
                myobj.nextIndex = track;
              } else {
                myobj.nextIndex = msindex;
              }
    }    

    if (searchSpecs.doDetail){
        return myobjs;  
    } else{
        return myobj;
    }
  }

  /** Subject to validation of search-parameters in info as per
   *  FN_INFOS.findSensorData, return all sensor reading which satisfy
   *  search specifications in info.  Note that info must specify a
   *  sensorId property giving the id of a previously added sensor
   *  whose readings are desired.  The search-specs can filter the
   *  results by specifying one or more statuses (separated by |).
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
   *  Note that the timestamp and count search-spec parameters can be
   *  used in successive calls to allow scrolling through the
   *  collection of all readings for the specified sensor.
   *
   *  All user errors must be thrown as an array of objects.
   */
  async findSensorData(info) {
    const stat = info.statuses;
    const searchSpecs = validate("findSensorData", info);
    var counts = 0;
    var myobj = {data: [] };
    var myobjs = {data: [], sensorType:[], sensor:[] };
    var search = false;
    mysensarr.sort((prop1, prop2) => (prop1.timestamp < prop2.timestamp ? 1 : -1));
    if (searchSpecs.timestamp != null && tmstp != null) {
      let abc = searchSpecs.statuses;
      let test = abc.values();
      let test1 = test.next().value;
      let test2 = test.next().value;
      console.log(test2);
      for (var l=0; l < mysdarr.length; l++) {
        if ((mysdarr[l].sensorId === searchSpecs.sensorId && mysdarr[l].status === test1 && mysdarr[l].timestamp <= searchSpecs.timestamp ) || (mysdarr[l].sensorId === searchSpecs.sensorId && mysdarr[l].status === test2 && mysdarr[l].timestamp <= searchSpecs.timestamp)) {
          myobj.data.push(mysdarr[l]);
          counts++;
          search = true;
        }
        if(searchSpecs.count !=0 && counts == searchSpecs.count){
          break;
        }
    }
    if (search == false) {
      throw [`sensor not found with timestamp: ${searchSpecs.timestamp}`];
    }
   tmstp = myobj.data[counts-1].timestamp;
  } else if (searchSpecs.statuses != null && info.statuses != null ) {
    let abc = searchSpecs.statuses;
    let test = abc.values();
    let test1 = test.next().value;
            for (var l=0; l < mysdarr.length; l++) {
              if (mysdarr[l].sensorId === searchSpecs.sensorId && mysdarr[l].status === test1) {
                  myobj.data.push(mysdarr[l]);
                  counts++;
                  search = true;
                }
              if(searchSpecs.count !=0 && counts == searchSpecs.count){
                break;
              }
          }
          if (search == false) {
            throw [`sensor with status: ${searchSpecs.sensorId} not found`];
          }
          tmstp = myobj.data[counts-1].timestamp;
          console.log(tmstp);
  } else if (searchSpecs.sensorId != null) {
            for (var l=0; l < mysdarr.length; l++) {
              if (mysdarr[l].sensorId === searchSpecs.sensorId) {
                if(searchSpecs.doDetail){
                  myobjs.data.push(mysdarr[l]);  
                } else {
                  myobj.data.push(mysdarr[l]);
                }
                search = true;
                counts++;
              }
              if(searchSpecs.count !=0 && counts == searchSpecs.count){
                break;
              }
            }
            if (search == false) {
              throw [`sensorId not found 3: ${searchSpecs.sensorId}`];
            }
            if(searchSpecs.doDetail){
            for(var a=0; a<mysensarr.length; a++ ){
              for(var b=0; b<myobjs.data.length; b++ ){
                if(mysensarr[a].id == myobjs.data[b].sensorId){
                  myobjs.sensor = mysensarr[a];
                }
              }
            }
            for(var a=0; a<myarray.length; a++ ){
                if(myarray[a].id == myobjs.sensor.model){
                  myobjs.sensorType = myarray[a];
                }
              }
            }
    }   
    if(searchSpecs.doDetail){
          return myobjs;
            } else{
            return myobj;
    }
  }
}
/**
 * A function that returns the status of the sensors reading based
 * on the expected min and max values of the sensor.
 */
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

module.exports = Sensors;

//@TODO add auxiliary functions as necessary

const DEFAULT_COUNT = 5;    

/** Validate info parameters for function fn.  If errors are
 *  encountered, then throw array of error messages.  Otherwise return
 *  an object built from info, with type conversions performed and
 *  default values plugged in.  Note that any unknown properties in
 *  info are passed unchanged into the returned object.
 */
function validate(fn, info) {
  const errors = [];
  const values = validateLow(fn, info, errors);
  if (errors.length > 0) throw errors; 
  return values;
}

function validateLow(fn, info, errors, name='') {
  const values = Object.assign({}, info);
  for (const [k, v] of Object.entries(FN_INFOS[fn])) {
    const validator = TYPE_VALIDATORS[v.type] || validateString;
    const xname = name ? `${name}.${k}` : k;
    const value = info[k];
    const isUndef = (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    );
    values[k] =
      (isUndef)
      ? getDefaultValue(xname, v, errors)
      : validator(xname, value, v, errors);
  }
  return values;
}

function getDefaultValue(name, spec, errors) {
  if (spec.default !== undefined) {
    return spec.default;
  }
  else {
    errors.push(`missing value for ${name}`);
    return;
  }
}

function validateString(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  if (typeof value !== 'string') {
    errors.push(`require type String for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
    return;
  }
  else {
    return value;
  }
}

function validateNumber(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  switch (typeof value) {
  case 'number':
    return value;
  case 'string':
    if (value.match(/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?$/)) {
      return Number(value);
    }
    else {
      errors.push(`value ${value} for ${name} is not a number`);
      return;
    }
  default:
    errors.push(`require type Number or String for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
  }
}

function validateInteger(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  switch (typeof value) {
  case 'number':
    if (Number.isInteger(value)) {
      return value;
    }
    else {
      errors.push(`value ${value} for ${name} is not an integer`);
      return;
    }
  case 'string':
    if (value.match(/^[-+]?\d+$/)) {
      return Number(value);
    }
    else {
      errors.push(`value ${value} for ${name} is not an integer`);
      return;
    }
  default:
    errors.push(`require type Number or String for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
  }
}

function validateRange(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  if (typeof value !== 'object') {
    errors.push(`require type Object for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
  }
  return validateLow('_range', value, errors, name);
}

const STATUSES = new Set(['ok', 'error', 'outOfRange']);

function validateStatuses(name, value, spec, errors) {
  assert(value !== undefined && value !== null && value !== '');
  if (typeof value !== 'string') {
    errors.push(`require type String for ${name} value ${value} ` +
		`instead of type ${typeof value}`);
  }
  if (value === 'all') return STATUSES;
  const statuses = value.split('|');
  const badStatuses = statuses.filter(s => !STATUSES.has(s));
  if (badStatuses.length > 0) {
    errors.push(`invalid status ${badStatuses} in status ${value}`);
  }
  return new Set(statuses);
}

const TYPE_VALIDATORS = {
  'integer': validateInteger,
  'number': validateNumber,
  'range': validateRange,
  'statuses': validateStatuses,
};


/** Documents the info properties for different commands.
 *  Each property is documented by an object with the
 *  following properties:
 *     type: the type of the property.  Defaults to string.
 *     default: default value for the property.  If not
 *              specified, then the property is required.
 */
var dnw  = Date.now() + 999999999;

const FN_INFOS = {
  addSensorType: {
    id: { }, 
    manufacturer: { }, 
    modelNumber: { }, 
    quantity: { }, 
    unit: { },
    limits: { type: 'range', },
  },
  addSensor:   {
    id: { },
    model: { },
    period: { type: 'integer' },
    expected: { type: 'range' },
  },
  addSensorData: {
    sensorId: { },
    timestamp: { type: 'integer' },
    value: { type: 'number' },
  },
  findSensorTypes: {
    id: { default: null },  //if specified, only matching sensorType returned.
    index: {  //starting index of first result in underlying collection
      type: 'integer',
      default: 0,
    },
    count: {  //max # of results
      type: 'integer',
      default: DEFAULT_COUNT,
    },
  },
  findSensors: {
    id: { default: null }, //if specified, only matching sensor returned.
    index: {  //starting index of first result in underlying collection
      type: 'integer',
      default: 0,
    },
    count: {  //max # of results
      type: 'integer',
      default: DEFAULT_COUNT,
    },
    doDetail: { //if truthy string, then sensorType property also returned
      default: null, 
    },
  },
  findSensorData: {
    sensorId: { },
    timestamp: {
      type: 'integer',
      default: dnw, //some future date
    },
    count: {  //max # of results
      type: 'integer',
      default: DEFAULT_COUNT,
    },
    statuses: { //ok, error or outOfRange, combined using '|'; returned as Set
      type: 'statuses',
      default: new Set(['ok']),
    },
    doDetail: {     //if truthy string, then sensor and sensorType properties
      default: null,//also returned
    },
  },
  _range: { //pseudo-command; used internally for validating ranges
    min: { type: 'number' },
    max: { type: 'number' },
  },
};  
