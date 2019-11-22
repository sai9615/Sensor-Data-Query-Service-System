<!DOCTYPE html>
<html>
  <head>
    <title>Create & Update Sensor Types</title>
    <link rel="stylesheet" href="../css/style.css">
  </head>
  <body>
  <div class="page">
        <h1 class="tst-sensor-types-add-page">Add Senor Types</h1>
        {{#fields}}
	      <span class="error">{{errorMessage}}</span>
	 {{/fields}}
 </ul>
  {{#errors}}
	      <span class="error">{{message}}</span>
	 {{/errors}}
  <ul>
   <form method="POST">
   {{{wt0}}}  
   {{{wt1}}} 
   {{{wt2}}} 
   {{{wt3}}}
   {{{wt4}}}
   {{{wt5}}}
<input name="submit" type="submit" value="Add" class="control">
   </form>
   </div> 
 {{>footer}}
    </body>
<html>  