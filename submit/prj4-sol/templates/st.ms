<!DOCTYPE html>
<html>
  <head>
    <h1>Senor Types List</h1>
    <link rel="stylesheet" href="../css/style.css">
  </head>
  <body>
  {{#fields}}
	      <span class="error">{{errorMessage}}</span>
	 {{/fields}}
  {{#errors}}
	      <span class="error">{{_}}</span>
	 {{/errors}}
  <div>
   <form method="GET">
   {{{wt0}}}  
   {{{wt1}}} 
   {{{wt2}}} 
   {{{wt3}}}
   <input name="submit" type="submit" value="search" class="control">
   </form>
   </div> 
   <h2>Results Summary</h2>
   <table class="summary">
        <thead>
    	   <tr>
                  <th>Manufacturer</th>
                  <th>Sensor Type ID</th>
                  <th>Model Number</th>
                  <th>Measure</th>
                  <th colspan="2">Limits</th>
    	   </tr>
    	   <tr>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th>Min</th>
                  <th>Max</th>
    	   </tr>
         </thead>
    {{#sensTypes}} {{#data}} 
    <tr>
    <td class="tst-manufacturer"> {{manufacturer}} </td>
    <td class="tst-sensor-type-id"> {{id}} </td>
    <td class="tst-modelNumber"> {{modelNumber}} </td>
    <td class="tst-quantity">{{quantity}} </td>
    {{#limits}} <td class="numeric interval tst-limits-min"> {{min}} </td>
    <td class="numeric interval tst-limits-max"> {{max}} </td>
    {{/limits}}  
    {{/data}}
    </tr>
    </tbody>
    </table>
    <div class="scroll">
    <a class="tst-prev" href="{{myprev}}" rel="prev">&lt;&lt;</a>
    <a class="tst-next" href="{{mynext}}" rel="next">&gt;&gt;</a>
    </div>
     {{/sensTypes}}
    {{>footer}}
    </body>
<html>  