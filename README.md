# jTimeout
jQuery session timeout handler

## Demo 
[http://flwebsites.biz/jTimeout/](http://flwebsites.biz/jTimeout/)

## What is it?
This cross-tab jQuery plugin keeps track of time and lets a user know before their session times out so they can extend it. Then tells them when it has expired so they can login again. The coolest part about jTimeout is that if a user loads 4 tabs with jTimeout on them, only 1 will control the countdown. If a tab is closed, another one will take over counting down. If another tab is opened, the timer will be reset (since the session timeout was reset). The only time the timer isn't reset but could/should be, is when an AJAX call is made to a page that doesn't include jTimeout. You'll have to just call "$.jTimeout.reset(1440);" each time an AJAX call is made to reset the timer. Passing the number of seconds is optional, it'll default to the $.jTimeout.defaults.timeoutAfter param. If you don't implement this reset, no big deal. The session doesn't actually have to be expired for this plugin to work. It'll manually call the logout page on timeout.

## Dependencies
 - jQuery
 - jAlert (unless you override the callbacks) :: available here: http://flwebsites.biz/jAlert/


## How to use
```html
<html>
<head></head>
<body>
<!-- your site content -->
<script src='https://code.jquery.com/jquery-1.11.3.min.js'></script> <!-- Include jQuery -->
<script src='jAlert-master/src/jAlert-v3.5.min.js'></script> <!-- Include jAlert - Get it here: http://flwebsites.biz/jAlert/ -->
<script src='jTimeout-master/src/jTimeout-v1.5.min.js'></script> <!-- Include this Plugin -->
<script>
  $(function(){
    $.jTimeout( options ); //options outlined below.
  });
</script>
</body>
</html>
```

## Options
```javascript
$(function(){
   $.jTimeout({
  	'flashTitle': true, //whether or not to flash the tab/title bar when about to timeout, or after timing out
  	'flashTitleSpeed': 500, //how quickly to switch between the original title, and the warning text
  	'flashingTitleText': '**WARNING**', //what to show in the tab/title bar when about to timeout, or after timing out
  	'originalTitle': document.title, //store the original title of this page
  
  	'tabID': false, //each tab needs a unique ID so you can tell which one last updated the timer - false makes it autogenerate one
  	'timeoutAfter': 1440, //pass this from server side to be fully-dynamic. For PHP: ini_get('session.gc_maxlifetime'); - 1440 is generally the default timeout
  	'heartbeat': 1, //how many seconds in between checking and updating the timer - warning: this will effect the speed of the countdown prior
  
  	'extendUrl': '/dashboard', //URL to request in order to extend the session.
  	'logoutUrl': '/logout', //URL to request in order to force a logout after the timeout. This way you can end a session early based on a shorter timeout OR if the front-end timeout doesn't sync with the backend one perfectly, you don't look like an idiot.
  	'loginUrl': '/login', //URL to send a customer when they want to log back in
  
  	'secondsPrior': 60, //how many seconds before timing out to run the next callback (onPriorCallback)
  	'onPriorCallback': false, //override the popup that shows when getting within x seconds of timing out
  
  	'onClickExtend': false, //override the click to extend button callback
  
  	'onTimeout': false //override the timeout function if you'd like
	});
});
```

### How to reset the timer
```javascript 
$.jTimeout.reset();
```

### How to set the timer to a specific number of seconds
```javascript 
$.jTimeout.reset(1440); 
```

### Recommended reset usage
Everytime you request a page that extends a user's session, use the reset function:
```javascript
$.get('/my-ajax-page', function(data){
  $.jTimeout.reset();
  //handle ajax response
});
```

### If you want to use your own modal 
jTimeout already works out of the box with jAlert, but can fairly easily configured to work with your own custom callbacks. Just override the callbacks like this:
```javascript
$.jTimeout({
  onTimeout: function(jTimeout){
    //do whatever you want
  },
  onPriorCallback: function(jTimeout){
    //tell them they will be timing out soon!
    //to get the current time:
    var secondsLeft = jTimeout.getTimer();
    console.log('You will be timed out in: '+secondsLeft'+ seconds');
  }
});
```
