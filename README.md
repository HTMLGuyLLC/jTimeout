# jTimeout
by HTMLGuy, LLC (https://htmlguy.com)

![example jtimeout](https://htmlguyllc.github.io/jTimeout/example.png)

## Demo
[https://htmlguyllc.github.io/jTimeout/](http://htmlguyllc.github.io/jTimeout/)

## What is it?
jQuery session timeout handler - Tracks a user's session expiration and lets them know before their session times out so they can extend it. Then tells them when it has expired so they can login again. The only time the timer isn't reset but could/should be, is when an AJAX call is made to a page that doesn't include jTimeout. You'll have to just call "$.jTimeout.reset(1440);" each time an AJAX call is made to reset the timer. Passing the number of seconds is optional, it'll default to the $.jTimeout.defaults.timeoutAfter param. If you don't implement this reset, no big deal. The session doesn't actually have to be expired for this plugin to work. It'll manually call the logout page on timeout.

## Dependencies
 - jQuery
 - jAlert (unless you override the callbacks) :: available here: https://github.com/HTMLGuyLLC/jAlert

## Available on NPM
https://www.npmjs.com/package/jtimeout
```
npm install jtimeout
```

## How to use
```html
<html>
<head>
<link rel="stylesheet" src="jAlert-master/dist/jAlert.css"/>
</head>
<body>
<!-- your site content -->
<script src='https://code.jquery.com/jquery-1.11.3.min.js'></script> <!-- Include jQuery -->
<script src='jAlert-master/dist/jAlert.min.js'></script> <!-- Include jAlert - Get it here: https://github.com/HTMLGuyLLC/jAlert -->
<script src='jTimeout-master/dist/jTimeout.min.js'></script> <!-- Include this Plugin -->
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
		expiration_key: 'jtimeout-session-expiration', //key used to store expiration in localstorage (change this for multiple timers)

		flashTitle: true, //whether or not to flash the tab/title bar when about to timeout, or after timing out
		flashTitleSpeed: 500, //how quickly to switch between the original title, and the warning text
		flashingTitleText: '**WARNING**', //what to show in the tab/title bar when about to timeout, or after timing out
		originalTitle: document.title, //store the original title of this page

		timeoutAfter: 1440, //pass this from server side to be fully-dynamic. For PHP: ini_get('session.gc_maxlifetime'); - 1440 is generally the default timeout
		heartbeat: 1, //how many seconds in between checking the expiration - warning: changing this can effect your prior countdown warning and timeout - for best results, stick with 1

		extendOnMouseMove: true, //Whether or not to extend the session when the mouse is moved
		mouseDebounce: 30, //How many seconds between extending the session when the mouse is moved (instead of extending a billion times within 5 seconds)
		onMouseMove: false, //Override the standard $.get() request that uses the extendUrl with your own function.

		extendUrl: '/dashboard', //URL to request in order to extend the session.
		logoutUrl: '/logout', //URL to request in order to force a logout after the timeout. This way you can end a session early based on a shorter timeout OR if the front-end timeout doesn't sync with the backend one perfectly, you don't look like an idiot.
		loginUrl: '/login', //URL to send a customer when they want to log back in

		secondsPrior: 60, //how many seconds before timing out to run the next callback (onPriorCallback)
		onPriorCallback: false, //override the popup that shows when getting within x seconds of timing out

		onClickExtend: false, //override the click to extend button callback

		onTimeout: false, //override the timeout function if you'd like
		onSessionExtended: false //override the session extension method (triggered only after a timeout)
	}
   );
   $.jTimeout().getExpiration(); //gets the expiration date string
   $.jTimeout().getSecondsTillExpiration(); //gets the number of seconds until the session expires
});
```

###Seting the default session length in PHP (recommended)
```javascript
$.jTimeout({ 'timeoutAfter': <?php echo ini_get('session.gc_maxlifetime'); ?> });
```

### How to reset the expiration
```javascript
$.jTimeout().reset();
```

### How to set the timer to a specific number of seconds
```javascript
$.jTimeout().setExpiration(1440);
```

### Recommended reset usage
Everytime you request a page that extends a user's session, use the reset function:
```javascript
$(document).ajaxStop(function(){
  $.jTimeout().reset();
});
//warning: If $.ajax() or $.ajaxSetup() is called with the global option set to false, the .ajaxStop() method will not fire.
```

### If you want to use your own modal
jTimeout already works out of the box with jAlert, but can fairly easily configured to work with your own custom callbacks. Just override the callbacks like this:
```javascript
$.jTimeout({
  onTimeout: function(jTimeout){
      console.log('Session timed out!');
  },
  onPriorCallback: function(jTimeout){
      var secondsLeft = jTimeout.getSecondsTillExpiration();
      console.log('You will be timed out in: '+secondsLeft+' seconds');
  },
  onSessionExtended:function(jTimeout){
      console.log('Session timed out, but then was extended by another tab or request.');
  }
});
```
