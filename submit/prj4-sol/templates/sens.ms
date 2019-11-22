<!DOCTYPE html>
<html>
  <head>
     <title>Create & Update Sensor</title>
    <h1>Senors List</h1>
    <link rel="stylesheet" href="../css/style.css">
  </head>
  <body>
{{#fields}}
	      <span class="error">{{errorMessage}}</span>
	 {{/fields}}
 </ul>
  {{#errors}}
	      <span class="error">{{_}}</span>
	 {{/errors}}
  <ul>
   </ul>
  <ul>
  <div>
   <form method="GET">
   {{{wt0}}}  
   {{{wt1}}} 
   {{{wt2}}} 
   <input name="submit" type="submit" value="search" class="control">
   </form>
   </div> 
   <h2>Results Summary</h2>
   <table class="summary">
        <thead>
    	   <tr>
                  <th>Sensor ID</th>
                  <th>Model</th>
                  <th>Period</th>
                  <th colspan="2">Expexted Range</th>
    	   </tr>
    	   <tr>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th>Min</th>
                  <th>Max</th>
    	   </tr>
         </thead>
    {{#sensors}} {{#data}} 
    <tr>
    <td class="tst-sensor-id"> {{id}} </td>
    <td class="tst-model"> {{model}} </td>
    <td class="tst-period numeric"> {{period}} </td>
    {{#expected}}<td class="numeric interval tst-expexted-min"> {{min}} </td>
    <td class="numeric interval tst-expected-max"> {{max}} </td>
    {{/expected}}
    {{/data}}
    </tr>
    </tbody>
    </table>
    <div class="scroll">
    <a class="tst-prev" href="{{myprev}}" rel="prev">&lt;&lt;</a>
    <a class="tst-next" href="{{mynext}}" rel="next">&gt;&gt;</a>
    </div>
    {{/sensors}}
    {{>footer}}
    </body>
<html>  