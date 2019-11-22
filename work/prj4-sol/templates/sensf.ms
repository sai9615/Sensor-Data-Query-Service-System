<!DOCTYPE html>
<html>
  <head>
    <title>Create & Update Sensor</title>
    <link rel="stylesheet" href="../css/style.css">
  </head>
  <body>
  <div class="page">
        <h1 class="tst-sensors-add-page">Add Senor</h1>
   {{#fields}}
	      <span class="error">{{errorMessage}}</span>
	 {{/fields}}
  {{#errors}}
	      <span class="error">{{message}}</span>
	 {{/errors}}
   <form method="POST">
   {{{wt0}}}  
   {{{wt1}}} 
   {{{wt2}}} 
   {{{wt3}}}
<input name="submit" type="submit" value="Add" class="control">
   </form>
   </div> 
 {{>footer}}
    </body>
<html>  