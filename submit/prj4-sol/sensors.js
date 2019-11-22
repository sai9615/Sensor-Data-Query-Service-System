'use strict';

const assert = require('assert');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const querystring = require('querystring');

const Mustache = require('./mustache');
const path = require('path');
const widgetView = require('./widget-view');
const mustache = require('mustache');
const STATIC_DIR = 'statics';
const TEMPLATES_DIR = 'templates';


const FIELDS_INFO = {
  id: {
    friendlyName: 'sensor Id',
    isSearch: true,
    isId: true,
    regex: /^[\w\-\']+$/,
    error: 'User Id field can only contain alphanumerics or - please go back and enter values again.',
  },
  manufacturer: {
    friendlyName: 'manufacturer',
    isSearch: true,
    regex: /^[a-zA-Z\-\' ]+$/,
    error: "Manufacturer field can only contain alphabetics, -, ' or space, please go back and enter values again.",
  },
  modelNumber: {
    friendlyName: 'Model Number',
    isSearch: true,
    regex: /^\w+$/,
    error: "Model Number field can only contain alphabetics, -, ' or space please go back and enter values again.",
  },
  quantity: {
    friendlyName: 'Quantity',
    isSearch: true,
    regex: /temperature|humidity|flow|pressure/,
    error: "quantity field can only have internal values temperature, pressure, flow or humidity, please go back and enter values again.",
  },
  model: {
    friendlyName: 'model',
    isSearch: true,
    regex: /^[\w\-\']+$/,
    error: "Model field can only contain alphanumerics, -, ' or space, please go back and enter values again.",
  },
  period: {
    friendlyName: 'period',
    isSearch: true,
    regex: /[0-9]+/,
    error: "Period field can only contain alphabetics, -, ' or space, please go back and enter values again.",
  },
  unit: {
     friendlyName: 'unit',
     regex: /[a-zA-Z]+/,
     error: "Unit field can only contain alphabetics, please go back and enter values again.",
   },
  limits_min: {
      friendlyName: 'limits-min',
      isSearch: true,
      regex: /[0-9]+/,
      error: "limit min field can only contain numbers, please go back and enter values again.",
    },
  limits_max:{
      friendlyName: 'limits-max',
      isSearch: true,
      regex: /[0-9]+/,
      error: "limit max field can only contain numbers, please go back and enter values again.",
    },
  expected_min: {
      friendlyName: 'expected-min',
      isSearch: true,
      regex: /[0-9]+/,
      error: "min field can only contain numbers, please go back and enter values again.",
    },
  expected_max:{
      friendlyName: 'expected-max',
      isSearch: true,
      regex: /[0-9]+/,
      error: "max field can only contain numbers, please go back and enter values again.",
    },  
};

const FIELDS =
  Object.keys(FIELDS_INFO).map((n) => Object.assign({name: n}, FIELDS_INFO[n]));


function serve(port, model, base='') {
    const app = express();
    app.locals.port = port;
    app.locals.model = model;
    process.chdir(__dirname);
    app.use(express.static(STATIC_DIR));
    setupRoutes(app);
    app.listen(port, function() {
      console.log(`listening on port ${port}`);
    }); 
}

module.exports = serve;

function setupRoutes(app) {
    app.get('/', getHome(app));
    app.get('/sensor-types.html', getsensorType(app));
    app.get('/add.html', createStForm(app));
    app.post('/add.html', bodyParser.urlencoded({extended: true}), postStForm(app))
    app.get('/sensors.html', getsensors(app))
    app.get('/sens-add.html', createSensForm(app))
    app.post('/sens-add.html', bodyParser.urlencoded({extended: true}), postSensForm(app))
}

function getHome(app){
    return async function(req, res) {
    res.sendFile(path.join(__dirname+'/static/index.html'))
    }
}


function getsensorType(app){
    return async function(req, res){
      const isSubmit = req.query.submit !== undefined;
      let sensTypes = [];
      let errors = undefined;
      const search = getNonEmptyValues(req.query);
     // console.log(search);
      if (isSubmit) {
        errors = validate(search);
       // console.log(errors)
        if (Object.keys(search).length == 0) {
    const msg = 'at least one search parameter must be specified';
    errors = Object.assign(errors || {}, { _: msg });
        }
        if (!errors) {
          const q = search;
          //console.log(q)
          try {
            sensTypes = await app.locals.model.list('sensor-types', q);  
         //   console.log(sensTypes)  
          }
          catch (err) {
            console.error(err);
            errors = wsErrors(err);
          }
          if (sensTypes.length === 0) {
            errors = {_: 'no sensor type found for specified criteria; please retry'};
          }
        }
      } else {
        try {
          const q = req.query;
          sensTypes = await app.locals.model.list('sensor-types', q);  
          //console.log("was here");
        //  console.log(sensTypes)  
        }
        catch (err) {
          console.error(err);
          errors = wsErrors(err);
        }
      }
      
       const WIDGETS = [
          { name : 'id', 
            label : 'Sensor Type id',
            classes: ['tst-sensor-type-id'],
            errors: { input1: 'bad value error' },
          },
          { name : 'modelNumber', 
          label : 'Model Number',
          classes: ["tst-model-number"],
          errors: { input1: 'bad value error' },
          },
          { name : 'manufacturer', 
          label : 'Manufacturer',
          classes: ["tst-manufacturer"],
          errors: { input1: 'bad value error' },
          },
          { name : 'quantity', 
          label : 'Quantity',
          classes: ["tst-quantity"],
          type: 'select',
          choices: {
            '': 'Select',
            temperature: 'Temperature',
            pressure: 'Pressure',
            flow: 'Flow Rate',
            humidity: 'Relative Humidity',
                },
          errors: { input1: 'bad value error' },
          },
        ];
        let model;
        if(!errors){
          var list = [10];
          const mustache = new Mustache();
          let i = 0;
          for (const widget of WIDGETS) {
            const view = widgetView(widget, widget.val, widget.errors);
            list[i] = mustache.render('widget', view);
            i++;
          }
        //console.log(window.location.href)
        if(!isSubmit && (req.query.id==undefined && req.query.quantity == undefined && req.query.manufacturer == undefined && req.query.modelNumber == undefined)){
          sensTypes.mynext = req.originalUrl.replace(/\?.*$/, '')+"?_index="+sensTypes.nextIndex
          sensTypes.myprev = req.originalUrl.replace(/\?.*$/, '')+"?_index="+sensTypes.previousIndex  
        } else {
          sensTypes.mynext = req.originalUrl.replace(/\?.*$/, '')+"?_index="+sensTypes.nextIndex+"&id="+req.query.id +"&modelNumber="+req.query.modelNumber +"&manufacturer="+req.query.manufacturer +"&quantity="+req.query.quantity  
          sensTypes.myprev = req.originalUrl.replace(/\?.*$/, '')+"?_index="+sensTypes.previousIndex+"&id="+req.query.id +"&modelNumber="+req.query.modelNumber +"&manufacturer="+req.query.manufacturer +"&quantity="+req.query.quantity  
        }        
        model = { wt0:list[0], wt1:list[1], wt2:list[2], wt3:list[3], sensTypes:sensTypes };  
        } else {
     //     console.log("errorsssssssss")
        model = errorModel(app, sensTypes, errors)    
      //  console.log(model);
        }
        const html = doMustache('st', model);   
        res.send(html);
    }
}

function createStForm(app){
  return async function(req, res){
  const WIDGETS = [
    { name : 'id', 
      label : 'Sensor Type ID*',
      classes: ['tst-sensor-type-id'],
      errors: { input1: 'bad value error' },
    },
    { name : 'modelNumber', 
    label : 'Model Number*',
    classes: ["tst-model-number"],
    errors: { input1: 'bad value error' },
    },
    { name : 'manufacturer', 
    label : 'Manufacturer*',
    classes: ["tst-manufacturer"],
    errors: { input1: 'bad value error' },
    },
    { name : 'quantity', 
    label : 'Measure*',
    classes: ["tst-quantity"], 
    type: 'select',
    choices: {
      '': 'Select',
      temperature: 'Temperature',
      pressure: 'Pressure',
      flow: 'Flow Rate',
      humidity: 'Relative Humidity',
          },
    errors: { input1: 'bad value error' },
    },
     { name : 'unit', 
     label : 'Sensor Type Unit*',
     classes: ['tst-sensor-type-unit'],
    errors: { input1: 'bad value error' },
   },
    { type: 'interval',
      name : 'limits', 
    label : 'limits*',
    classes: ["numeric interval"],
    errors: { input1: 'bad value error' },
    },
  ];
  let model;
  var list = [10];
  const mustache = new Mustache();
  let i = 0;
  for (const widget of WIDGETS) {
     const view = widgetView(widget, widget.val, widget.errors);
     list[i] = mustache.render('widget', view);
     i++;
   }
  model = { wt0:list[0], wt1:list[1], wt2:list[2], wt3:list[3], wt4:list[4], wt5:list[5]}; 
  const html = doMustache('stf', model);
  res.send(html);
  }
}

function postStForm(app){
  return async function(req, res){
  const sensor = req.body;
  let errors = undefined;
  //console.log(sensor)
  let test = getNonEmptyValues(req.body)
  if (Object.keys(test).length == 0) {
    const msg = 'Please go back and fill in all the parameters';
    errors = Object.assign(errors || {}, { _: msg });
  } else {
  if(sensor.limits.min != ""){
    test.limits_min = sensor.limits.min
  }if(sensor.limits.max != ""){
    test.limits_max = sensor.limits.max
  }
  errors = validate(test);
  }
  if(!errors){
      try{
        await app.locals.model.update('sensor-types',sensor);
        res.redirect("./sensor-types.html?id="+sensor.id);
      } catch(err){
        console.error(err);
         errors = wsErrors(err);
      } 
    }if(errors){
      const model = errorModel(app, test, errors);
       const html = doMustache('stf', model)
       res.send(html)
     }
  }
}

//  Sensors part

function getsensors(app){
  return async function(req, res){
    const isSubmit = req.query.submit !== undefined;
    let sensors = [];
    let errors = undefined;
    const search = getNonEmptyValues(req.query);
    console.log(search);
    if (isSubmit) {
      errors = validate(search);
      if (Object.keys(search).length == 0) {
  const msg = 'at least one search parameter must be specified';
  errors = Object.assign(errors || {}, { _: msg });
      }
      if (!errors) {
        const q = search;
        //console.log(q)
        try {
          sensors = await app.locals.model.list('sensors', q);  
          //console.log(sensors)  
        }
        catch (err) {
          console.error(err);
          errors = wsErrors(err);
        }
        if (sensors.length === 0) {
          errors = {_: 'no sensor type found for specified criteria; please retry'};
        }
      }
    } else {
      try {
        const q = req.query;
        sensors = await app.locals.model.list('sensors', q);  
        //console.log(sensors)  
      }
      catch (err) {
        console.error(err);
        errors = wsErrors(err);
      }
    }
    
     const WIDGETS = [
        { name : 'id', 
          label : 'Sensor Id',
          classes: ['tst-sensor-id'],
          errors: { input1: 'bad value error' },
        },
        { name : 'model', 
        label : 'Model',
        classes: ["tst-model"],
        errors: { input1: 'bad value error' },
        },
        { name : 'period', 
        label : 'Period',
        classes: ["tst-period numeric"],
        errors: { input1: 'bad value error' },
        },
      ];
      let model;
      if(!errors){
        var list = [10];
        const mustache = new Mustache();
        let i = 0;
        for (const widget of WIDGETS) {
          const view = widgetView(widget, widget.val, widget.errors);
          list[i] = mustache.render('widget', view);
          i++;
        }
        if(!isSubmit && (req.query.id==undefined && req.query.period == undefined && req.query.model == undefined )){
          sensors.mynext = req.originalUrl.replace(/\?.*$/, '')+"?_index="+sensors.nextIndex
          sensors.myprev = req.originalUrl.replace(/\?.*$/, '')+"?_index="+sensors.previousIndex  
        } else {
          sensors.mynext = req.originalUrl.replace(/\?.*$/, '')+"?_index="+sensors.nextIndex+"&id="+req.query.id +"&period="+req.query.period +"&model="+req.query.model 
          sensors.myprev = req.originalUrl.replace(/\?.*$/, '')+"?_index="+sensors.previousIndex+"&id="+req.query.id +"&period="+req.query.period +"&model="+req.query.model  
        }          
      model = { wt0:list[0], wt1:list[1], wt2:list[2], sensors:sensors };  
      } else {
      model = errorModel(app, sensors, errors)    
      }
      const html = doMustache('sens', model);   
      res.send(html);
  }
}




function createSensForm(app){
  return async function(req, res){
  const WIDGETS = [
    { name : 'id', 
      label : 'Sensor ID*',
      classes: ['tst-sensor-type-id'],
      errors: { input1: 'bad value error' },
    },
    { name : 'model', 
    label : 'Model*',
    classes: ["tst-model"],
    errors: { input1: 'bad value error' },
    },
    { name : 'period', 
    label : 'Period*',
    classes: ["tst-period"],
    errors: { input1: 'bad value error' },
    },
    { type: 'interval',
      name : 'expected', 
    label : 'Expected Range*',
    classes: ["numeric interval"],
    errors: { input1: 'bad value error' },
    },
  ];
  let model;
  var list = [10];
  const mustache = new Mustache();
  let i = 0;
  for (const widget of WIDGETS) {
     const view = widgetView(widget, widget.val, widget.errors);
     list[i] = mustache.render('widget', view);
     i++;
   }
  model = { wt0:list[0], wt1:list[1], wt2:list[2], wt3:list[3]}; 
  const html = doMustache('sensf', model);
  res.send(html);
  }
}


function postSensForm(app){
  return async function(req, res){
  const sensor = req.body;
  console.log(sensor)
  let errors = undefined
  let test = getNonEmptyValues(req.body)
  if (Object.keys(test).length == 0) {
    const msg = 'Please go back and fill in all the parameters';
    errors = Object.assign(errors || {}, { _: msg });
  } else {
    if(sensor.expected.min != ""){
      test.limits_min = sensor.expected.min
    }if(sensor.expected.max != ""){
      test.limits_max = sensor.expected.max
    }
  errors = validate(test);
  }
  if(!errors){
      try{
        await app.locals.model.update('sensors',sensor);
        res.redirect("./sensors.html?id="+sensor.id);
      } catch(err){
        console.error(err);
         errors = wsErrors(err);
      } 
     } if(errors){
       const model = errorModel(app, test, errors);
       const html = doMustache('sens', model)
       res.send(html)
     }
  }
}

function errorModel(app, values={}, errors={}) {
  return {
    errors: errors,
    fields: fieldsWithValues(values, errors)
  };
}
  function doMustache(templateId, view) {
    const mustache = new Mustache();
    return mustache.render(templateId, view, 'footer.ms');
  }

  function wsErrors(err) {
    const msg = (err.message) ? err.message : 'web service error';
    console.error(msg);
    return { _: [ msg ] };
  }
  

  function getNonEmptyValues(values) {
    const out = {};
    Object.keys(values).forEach(function(k) {
      if (FIELDS_INFO[k] !== undefined) {
        const v = values[k];
        if (v && v.trim().length > 0) out[k] = v.trim();
      }
    });
    return out;
  }

  function fieldsWithValues(values, errors={}) {
    return FIELDS.map(function (info) {
      const name = info.name;
      const extraInfo = { value: values[name] };
      if (errors[name]) extraInfo.errorMessage = errors[name];
      return Object.assign(extraInfo, info);
    });
  }


  function validate(values, requires=[]) {
    const errors = {};
    requires.forEach(function (name) {
      if (values[name] === undefined) {
        errors[name] =
    `A value for '${FIELDS_INFO[name].friendlyName}' must be provided`;
      }
    });
    for (const name of Object.keys(values)) {
      const fieldInfo = FIELDS_INFO[name];
      const value = values[name];
      if (fieldInfo.regex && !value.match(fieldInfo.regex)) {
        errors[name] = fieldInfo.error;
      }
    }
    return Object.keys(errors).length > 0 && errors;
  }