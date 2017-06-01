/*
 *
 *
 jTimeout v2.1
 Made with love by Versatility Werks (http://flwebsites.biz)
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
            /**
             * Whether or not the session has timed out
             */
            timedOut: false,
            /**
             * Whether or not there is currently a timeout warning on the screen
             */
            timeoutWarning: false,
            /**
             * The interval loop for counting down
             */
            interval: false,
            /**
             * The settimeout for mouse movement to be debounced
             */
            mouseTimeout: false,

            options: options,

            /**
             * Generates a random ID to identify the current tab
             * 
             * @param separator
             * @returns {*}
             */
            generateUid: function(separator)
            {
                var delim = separator || "-";

                return (this.S4() + this.S4() + delim + this.S4() + delim + this.S4() + delim + this.S4() + delim + this.S4() + this.S4() + this.S4());
            },
            S4: function()
            {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            },
            get: function(key)
            {
                return window.localStorage.getItem(key);
            },
            set: function(key, val)
            {
                return window.localStorage.setItem(key, val);
            },
            /**
             * Gets the current time left
             */
            getTimer: function()
            {
                return this.get('timeoutCountdown');
            },
            /**
             * Sets the time left
             *
             * @param curTime
             */
            setTimer: function(curTime)
            {
                return this.set('timeoutCountdown', curTime);
            },
            /**
             * Gets the tab that is controlling the timeout countdown
             */
            getTab: function()
            {
                return this.get('timeoutTab');
            },
            /**
             * Sets the tab that is controlling the timeout countdown
             * @param tab
             */
            setTab: function(tab)
            {
                return this.set('timeoutTab', tab);
            },
            /**
             * Gets the last tab that updated the timer countdown
             */
            getTabLast: function()
            {
                return this.get('timeoutTabLast');
            },
            /**
             * Sets the last tab that updated the timer countdown
             */
            setTabLast: function()
            {
                return this.set('timeoutTabLast', new Date());
            },
            /**
             * Stops the countdown prior to timeout
             */
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
            setCountdown: function(interval){
                this.interval = interval;
            },
            stopCountdown: function()
            {
                if( this.interval )
                {
                    window.clearInterval(this.interval);
                }
            },
            /* The magic happens here. This function loops every x seconds */
            countdown: function()
            {
                /* Get current timer, tab that reported that time, and the time that tab reported */
                var seconds = timeout.getTimer(),
                    whichTab = timeout.getTab(),
                    whichTabLast = timeout.getTabLast();

                /* If another tab updated it more than 2 seconds ago, this tab will take control */
                if (whichTabLast < new Date('-2 seconds'))
                {
                    seconds = seconds - Math.abs(((new Date()).getTime() - whichTabLast.getTime()) / 1000); //remove difference
                    whichTab = timeout.options.tabID;
                    timeout.setTab(whichTab);
                }

                if (timeout.priorCountDown)
                {
                    timeout.priorCountDown.text(seconds);
                }

                /* If the last tab to interact is the same as this one */
                if (whichTab === timeout.options.tabID)
                {
                    seconds = seconds - timeout.options.heartbeat;
                    timeout.setTabLast();
                    timeout.setTimer(seconds);
                }

                /* Timeout */
                if (seconds <= 0 && !timeout.timedOut)
                {
                    timeout.timeoutWarning = true;
                    timeout.timedOut = true;

                    timeout.options.onTimeout(timeout);

                    timeout.stopCountdown();

                    timeout.stopMouseTimeout();

                    timeout.setTimer(0);
                }
                /* If less than x seconds left and not warned yet, show warning */
                else if (seconds < timeout.options.secondsPrior && !timeout.timeoutWarning)
                {
                    timeout.timeoutWarning = true;

                    timeout.startFlashing();

                    timeout.options.onPriorCallback(timeout, seconds);

                }
                /* reset timeout warning if timeout was set higher */
                else if (seconds >= timeout.options.secondsPrior && timeout.timeoutWarning)
                {
                    timeout.stopFlashing();
                    timeout.stopPriorCountdown();
                    timeout.hideCountdownAlert();
                }
            }
        };

        //if no tab id was provided, generate a unique tab id
        if (!timeout.options.tabID)
        {
            timeout.options.tabID = timeout.generateUid();
        }

        /* Set defaults in localStorage (shared storage across tabs) */
        timeout.setTimer(timeout.options.timeoutAfter);
        timeout.setTab(timeout.options.tabID);
        timeout.setTabLast();

        var inMS = timeout.options.heartbeat * 1000;

        timeout.setCountdown(window.setInterval(timeout.countdown, inMS));

        if(timeout.options.extendOnMouseMove)
        {
            inMS = timeout.options.mouseDebounce * 1000;

            timeout.mouseMoved = false;

            //delay the initial mousemove watch for x seconds
            timeout.setMouseTimeout(window.setTimeout(function ()
            {
                //on mouse move
                $('body').on('mousemove', function ()
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

        window.jTimeout = timeout;

        return timeout;
    };

    $.jTimeout.reset = function (seconds)
    {
        seconds = typeof seconds !== 'undefined' ? seconds : $.jTimeout.defaults.timeoutAfter; //default to default timeoutAfter

        $.jTimeout().set('timeoutCountdown', seconds); //set timeout countdown
    };

    $.jTimeout.defaults = {
        'flashTitle': true, //whether or not to flash the tab/title bar when about to timeout, or after timing out
        'flashTitleSpeed': 500, //how quickly to switch between the original title, and the warning text
        'flashingTitleText': '**WARNING**', //what to show in the tab/title bar when about to timeout, or after timing out
        'originalTitle': document.title, //store the original title of this page

        'tabID': false, //each tab needs a unique ID so you can tell which one last updated the timer - false makes it autogenerate one
        'timeoutAfter': 1440, //pass this from server side to be fully-dynamic. For PHP: ini_get('session.gc_maxlifetime'); - 1440 is generally the default timeout
        'heartbeat': 1, //how many seconds in between checking and updating the timer

        'extendOnMouseMove': true, //Whether or not to extend the session when the mouse is moved
        'mouseDebounce': 30, //How many seconds between extending the session when the mouse is moved (instead of extending a billion times within 5 seconds)
        'onMouseMove': function(timeout){
            //request the session extend page
            $.get(timeout.options.extendUrl);
            //reset timer
            timeout.setTimer(timeout.options.timeoutAfter);
            //set cur tab to this one
            timeout.setTab(timeout.options.tabID);
            timeout.setTabLast();
        }, //Override the standard $.get() request that uses the extendUrl with your own function.

        'extendUrl': '/dashboard', //URL to request in order to extend the session.
        'logoutUrl': '/logout', //URL to request in order to force a logout after the timeout. This way you can end a session early based on a shorter timeout OR if the front-end timeout doesn't sync with the backend one perfectly, you don't look like an idiot.
        'loginUrl': '/login', //URL to send a customer when they want to log back in

        'secondsPrior': 60, //how many seconds before timing out to run the next callback (onPriorCallback)

        'triggerResetOnAlert': false, // should it reset the timer with mouse move while the alert is visible and hide it?

        //override the popup that shows when getting within x seconds of timing out
        'onPriorCallback': function(timeout, seconds){
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
        'onClickExtend': function(timeout){
            /* Request dashboard to increase session */
            $.get(timeout.options.extendUrl);

            timeout.setTimer(timeout.options.timeoutAfter);
            timeout.setTab(timeout.options.tabID);
            timeout.setTabLast();
        },
        //override the timeout function if you'd like
        'onTimeout': function(timeout){
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
        }
    };

    /* END OF ON JQUERY LOAD */
})(jQuery);
