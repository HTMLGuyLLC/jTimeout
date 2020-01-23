/*
 *
 *
 jTimeout v3.2.0
 Made with love by HTMLGuy, LLC
 MIT Licensed
 *
 *
 */
(function ($) {

    $.jTimeout = function (options) {

        if( typeof window.jTimeout !== 'undefined' )
        {
            return window.jTimeout;
        }

        options = $.extend({}, $.jTimeout.defaults, options);

        var timeout =
        {
            //Whether or not the session has timed out
            timedOut: false,
            //whether or not to warn the person before the session expires
            timeoutWarning: false,
            //The interval loop for counting down
            interval: false,
            //The settimeout for mouse movement to be debounced
            mouseTimeout: false,
            //all options provided
            options: options,
            //get from localstorage
            get: function(key)
            {
                return window.localStorage.getItem(key);
            },
            //set to localstorage
            set: function(key, val)
            {
                return window.localStorage.setItem(key, val);
            },
            //gets the expiration date
            getExpiration: function()
            {
                return this.get(this.options.expiration_key);
            },
            //sets the expiration date based on relative seconds
            setExpiration: function(seconds_till_expiration)
            {
                var d = new Date();
                d.setSeconds(d.getSeconds() + seconds_till_expiration);
                return this.set(this.options.expiration_key, d);
            },
            //sets the expiration based on the provided session duration
            resetExpiration: function()
            {
                this.setExpiration(this.options.timeoutAfter);
                return this;
            },
            //returns the number of seconds before the session expires
            getSecondsTillExpiration: function()
            {
                //gets expiration seconds minus current seconds
                var seconds = Math.round(((new Date(this.getExpiration())).getTime() - (new Date()).getTime()) / 1000);
                return seconds <= 0 ? 0 : seconds;
            },
            //stops the prior to timeout countdown
            stopPriorCountdown: function()
            {
                if (timeout.priorCountDown)
                {
                    timeout.priorCountDown = false;
                }
            },
            /**
             * Determines whether or not the timeout countdown alert should allow extending the session and then hiding the alert
             *
             * @returns {*}
             */
            resetOnAlert: function()
            {
                if (!timeout.options.triggerResetOnAlert)
                {
                    return $('#jTimeoutAlert').length === 0 && $('#jTimedoutAlert').length === 0;
                }

                return $('#jTimedoutAlert').length === 0 && timeout.options.triggerResetOnAlert;
            },
            /**
             * Stops flashing in the title
             */
            stopFlashing: function()
            {
                if (timeout.options.flashTitle)
                {
                    if (timeout.flashingTitle)
                    {
                        window.clearInterval(timeout.flashingTitle);
                    }

                    timeout.flashingTitle = false;

                    document.title = timeout.options.originalTitle;
                }
            },
            /**
             * Starts flashing the title
             */
            startFlashing: function()
            {
                if (!timeout.flashingTitle && timeout.options.flashTitle)
                {
                    timeout.flashingTitle = window.setInterval(function ()
                    {
                        if (document.title === timeout.options.flashingTitleText)
                        {
                            document.title = timeout.options.originalTitle;
                        }
                        else
                        {
                            document.title = timeout.options.flashingTitleText;
                        }
                    }, timeout.options.flashTitleSpeed);
                }
            },
            /**
             * Starts the countdown prior to timeout
             *
             * @param elem
             */
            startPriorCountdown: function(elem)
            {
                timeout.priorCountDown = elem;
            },
            /**
             * Hides the countdown alert
             */
            hideCountdownAlert: function()
            {
                timeout.timeoutWarning = false;

                var timeoutAlert = $('#jTimeoutAlert');

                if (timeoutAlert.length > 0)
                {
                    timeoutAlert.closeAlert();
                }
            },
            setMouseTimeout: function(timeout)
            {
                this.mouseTimeout = timeout;
            },
            stopMouseTimeout: function(){
                if( this.mouseTimeout)
                {
                    window.clearTimeout(this.mouseTimeout);
                }
            },
            //stops monitoring for user activity
            stopActivityMonitoring: function()
            {
                timeout.stopMouseTimeout();
            },
            //every so often (if enabled) a call will be made to extend a session because the user is actively using the website
            startActivityMonitoring: function()
            {
                //if already started, stop (prevent dupe)
                timeout.stopActivityMonitoring();

                //if enabled
                if(timeout.options.extendOnMouseMove)
                {
                    inMS = timeout.options.mouseDebounce * 1000;
                    timeout.mouseMoved = false;

                    //delay the initial mousemove watch for x seconds
                    timeout.setMouseTimeout(window.setTimeout(function ()
                    {
                        //on mouse move
                        $('body').on('mousemove.jTimeout', function ()
                        {
                            if (!timeout.mouseMoved && timeout.resetOnAlert())
                            {
                                timeout.mouseMoved = true;

                                timeout.setMouseTimeout(window.setTimeout(function ()
                                {
                                    timeout.mouseMoved = false;
                                }, inMS));

                                timeout.options.onMouseMove(timeout);
                            }
                        });

                    }, inMS));
                }
            },
            setCountdown: function(interval){
                this.interval = interval;
            },
            /* The magic happens here. This function loops every x seconds */
            countdown: function()
            {
                /* Get current timer, tab that reported that time, and the time that tab reported */
                var expiration = timeout.getExpiration();
                var seconds_till_expires = timeout.getSecondsTillExpiration();

                //if there is a prior countdown
                if (timeout.priorCountDown)
                {
                    timeout.priorCountDown.text(seconds_till_expires);
                }

                /* Timeout */
                if (seconds_till_expires <= 0 && !timeout.timedOut)
                {
                    timeout.timeoutWarning = true;
                    timeout.timedOut = true;
                    timeout.options.onTimeout(timeout);
                    timeout.stopActivityMonitoring();
                }
                //if timed out and session was extended
                else if( seconds_till_expires > 0 && timeout.timedOut )
                {
                    timeout.timeoutWarning = false;
                    timeout.timedOut = false;
                    timeout.options.onSessionExtended(timeout);
                    timeout.startActivityMonitoring();
                }
                /* If less than x seconds left and not warned yet, show warning */
                else if (seconds_till_expires < timeout.options.secondsPrior && !timeout.timeoutWarning)
                {
                    timeout.timeoutWarning = true;
                    timeout.startFlashing();
                    timeout.options.onPriorCallback(timeout, seconds_till_expires);

                }
                /* reset timeout warning if timeout was set higher */
                else if (seconds_till_expires >= timeout.options.secondsPrior && timeout.timeoutWarning)
                {
                    timeout.stopFlashing();
                    timeout.stopPriorCountdown();
                    timeout.hideCountdownAlert();
                }
            },
            /* Kill the plugin by removing all event handlers and current activities (like flashing) */
            destroy: function () {
                timeout.stopFlashing();
                timeout.stopActivityMonitoring();
                delete timeout.options.onSessionExtended;
                delete timeout.countdown;

                // Remove the event handlers
                $('body').off('mousemove.jTimeout');
            }
        };

        //sets time of current expiration
        timeout.resetExpiration();

        var inMS = timeout.options.heartbeat * 1000;
        timeout.setCountdown(window.setInterval(timeout.countdown, inMS));

        timeout.startActivityMonitoring();

        window.jTimeout = timeout;

        return timeout;
    };

    $.jTimeout.reset = function(seconds_till_expiration)
    {
        var seconds = typeof seconds_till_expiration === 'undefined' ? $.jTimeout.defaults.timeoutAfter : seconds_till_expiration;
        $.jTimeout().setExpiration(seconds);
    };

    $.jTimeout.defaults = {
        expiration_key: 'jtimeout-session-expiration', //key used to store expiration in localstorage (change this for multiple timers)
        flashTitle: true, //whether or not to flash the tab/title bar when about to timeout, or after timing out
        flashTitleSpeed: 500, //how quickly to switch between the original title, and the warning text
        flashingTitleText: '**WARNING**', //what to show in the tab/title bar when about to timeout, or after timing out
        originalTitle: document.title, //store the original title of this page
        timeoutAfter: 1440, //pass this from server side to be fully-dynamic. For PHP: ini_get('session.gc_maxlifetime'); - 1440 is generally the default timeout
        heartbeat: 1, //how many seconds in between checking and updating the timer
        extendOnMouseMove: true, //Whether or not to extend the session when the mouse is moved
        mouseDebounce: 30, //How many seconds between extending the session when the mouse is moved (instead of extending a billion times within 5 seconds)
        onMouseMove: function(timeout){
            //request the session extend page
            $.get({
                url: timeout.options.extendUrl,
                cache: false,
                success: function(){
                    //reset expiration
                    timeout.resetExpiration();
                }
            });
        }, //Override the standard $.get() request that uses the extendUrl with your own function.
        extendUrl: '/dashboard', //URL to request in order to extend the session.
        logoutUrl: '/logout', //URL to request in order to force a logout after the timeout. This way you can end a session early based on a shorter timeout OR if the front-end timeout doesn't sync with the backend one perfectly, you don't look like an idiot.
        loginUrl: '/login', //URL to send a customer when they want to log back in
        secondsPrior: 60, //how many seconds before timing out to run the next callback (onPriorCallback)
        triggerResetOnAlert: false, // should it reset the timer with mouse move while the alert is visible and hide it?
        //override the popup that shows when getting within x seconds of timing out
        onPriorCallback: function(timeout, seconds){
            $.jAlert({
                'id': 'jTimeoutAlert',
                'title': 'Oh No!',
                'content': '<b>Your session will timeout in <span class="jTimeout_Countdown">' + seconds + '</span> seconds!</b>',
                'theme': 'red',
                'closeBtn': false,
                'onOpen': function (alert) {
                    timeout.startPriorCountdown(alert.find('.jTimeout_Countdown'));
                },
                'btns': [
                    {
                        'text': 'Extend my Session',
                        'theme': 'blue',
                        'onClick': function (e, btn) {
                            e.preventDefault();
                            timeout.options.onClickExtend(timeout);
                            btn.parents('.jAlert').closeAlert();
                            return false;
                        }
                    },
                    {
                        'text': 'Logout Now',
                        'onClick': function (e, btn) {
                            e.preventDefault();
                            window.location.href = timeout.options.logoutUrl;
                            return false;
                        }
                    }
                ]
            });
        },
        //override the click to extend button callback
        onClickExtend: function(timeout){
            /* Request dashboard to increase session */
            $.get({
                url: timeout.options.extendUrl,
                cache: false
            });
            timeout.resetExpiration();
        },
        //override the timeout function if you'd like
        onTimeout: function(timeout){
            /* Alert User */
            $.jAlert({
                'id': 'jTimedoutAlert',
                'title': 'Oh No!',
                'content': '<b>Your session has timed out.</b>',
                'theme': 'red',
                'btns': {
                    'text': 'Login Again',
                    'href': timeout.options.loginUrl,
                    'theme': 'blue',
                    'closeAlert': false
                },
                'closeOnClick': false,
                'closeBtn': false,
                'closeOnEsc': false
            });

            /* Force logout */
            $.get(timeout.options.logoutUrl);
        },
        //if session is extended after timeout, hide the timeout popup
        onSessionExtended: function(timeout)
        {
            $('#jTimedoutAlert').closeAlert();
        }
    };

    /* END OF ON JQUERY LOAD */
})(jQuery);
