/*
 *
 *
 jTimeout v.2.1
 Made with love by Versatility Werks (http://flwebsites.biz)
 MIT Licensed
 *
 *
 */
(function ($) {

    $.jTimeout = function (options) {

        var jTimeout = this,
            $timedOut = false, //whether or not the session has timed out
            $timeoutWarned = false; //whether or not we've displayed a message about the session nearing timeout

        jTimeout.options = $.extend({}, $.jTimeout.defaults, options);

        /* Create a unique id for the current tab */
        jTimeout.generateUid = function (separator) {
            var delim = separator || "-";

            function S4() {
                return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
            }

            return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
        };

        jTimeout.getTimer = function () {
            return window.localStorage.getItem('timeoutCountdown');
        };

        jTimeout.setTimer = function (curTime) {

            return window.localStorage.setItem('timeoutCountdown', curTime);
        };

        jTimeout.getTab = function () {
            return window.localStorage.getItem('timeoutTab');
        };

        jTimeout.setTab = function (tab) {
            return window.localStorage.setItem('timeoutTab', tab);
        };

        jTimeout.getTabLast = function () {
            return window.localStorage.getItem('timeoutTabLast');
        };

        jTimeout.setTabLast = function () {
            return window.localStorage.setItem('timeoutTabLast', new Date());
        };

        jTimeout.stopPriorCountdown = function () {

            if (jTimeout.priorCountDown) {
                jTimeout.priorCountDown = false;
            }

        };

        jTimeout.resetOnAlert = function () {

            if (!jTimeout.options.triggerResetOnAlert) {
                return $('#jTimeoutAlert').length == 0 && $('#jTimedoutAlert').length == 0;
            }

            return $('#jTimedoutAlert').length == 0 && jTimeout.options.triggerResetOnAlert;
        };

        jTimeout.stopFlashing = function () {

            if (jTimeout.options.flashTitle) {
                if (jTimeout.flashingTitle) {
                    window.clearInterval(jTimeout.flashingTitle);
                }

                jTimeout.flashingTitle = false;

                document.title = jTimeout.options.originalTitle;
            }

        };

        jTimeout.startFlashing = function () {

            if (!jTimeout.flashingTitle && jTimeout.options.flashTitle) {

                jTimeout.flashingTitle = window.setInterval(function () {

                    if (document.title == jTimeout.options.flashingTitleText) {
                        document.title = jTimeout.options.originalTitle;
                    }
                    else {
                        document.title = jTimeout.options.flashingTitleText;
                    }

                }, jTimeout.options.flashTitleSpeed);

            }

        };

        jTimeout.startPriorCountdown = function (elem) {

            jTimeout.priorCountDown = elem;

        };

        jTimeout.hideAlerts = function () {

            var timedOutAlert = $('#jTimeoutAlert'),
                timeoutAlert = $('#jTimedoutAlert');

            if (timedOutAlert.length > 0) {
                timedOutAlert.closeAlert();
            }

            if (timeoutAlert.length > 0) {
                timeoutAlert.closeAlert();
            }

        };

        /* The magic happens here. This function loops every x seconds */
        jTimeout.countdown = function () {

            /* Get current timer, tab that reported that time, and the time that tab reported */
            var seconds = jTimeout.getTimer(),
                whichTab = jTimeout.getTab(),
                whichTabLast = jTimeout.getTabLast();

            /* If another tab updated it more than 2 seconds ago, this tab will take control */
            if (whichTabLast < new Date('-2 seconds')) {
                seconds = seconds - Math.abs(((new Date()).getTime() - whichTabLast.getTime()) / 1000); //remove difference

                whichTab = jTimeout.options.tabID;

                jTimeout.setTab(whichTab);
            }

            if (jTimeout.priorCountDown) {
                jTimeout.priorCountDown.text(seconds);
            }

            /* If the last tab to interact is the same as this one */
            if (whichTab == jTimeout.options.tabID) {
                seconds = seconds - jTimeout.options.heartbeat;

                jTimeout.setTabLast();

                jTimeout.setTimer(seconds);

            }

            /* Timeout */
            if (seconds < 0 && !$timedOut) {

                $timeoutWarned = true;

                $timedOut = true;

                if (!jTimeout.options.onTimeout) {
                    /* Alert User */
                    $.jAlert({
                        'id': 'jTimedoutAlert',
                        'title': 'Oh No!',
                        'content': '<b>Your session has timed out.</b>',
                        'theme': 'red',
                        'btns': {
                            'text': 'Login Again',
                            'href': jTimeout.options.loginUrl,
                            'theme': 'blue',
                            'closeAlert': false
                        },
                        'closeOnClick': false,
                        'closeBtn': false,
                        'closeOnEsc': false,
                        'replaceOtherAlerts': true
                    });

                    /* Force logout */
                    $.get(jTimeout.options.logoutUrl);

                }
                else {
                    jTimeout.options.onTimeout(jTimeout);
                }

            }
            /* If less than x + 2 seconds left and not warned yet, show warning */
            else if (seconds < jTimeout.options.secondsPrior && !$timeoutWarned) {

                $timeoutWarned = true;

                jTimeout.startFlashing();

                /* If there's not a callback override, use default */
                if (!jTimeout.options.onPriorCallback) {
                    $.jAlert({
                        'id': 'jTimeoutAlert',
                        'title': 'Oh No!',
                        'content': '<b>Your session will timeout in <span class="jTimeout_Countdown">' + seconds + '</span> seconds!</b>',
                        'theme': 'red',
                        'closeBtn': false,
                        'onOpen': function (alert) {
                            jTimeout.startPriorCountdown(alert.find('.jTimeout_Countdown'));
                        },
                        'btns': [
                            {
                                'text': 'Extend my Session',
                                'theme': 'blue',
                                'onClick': function (e, btn) {

                                    e.preventDefault();

                                    if (!jTimeout.options.onClickExtend) {
                                        /* Request dashboard to increase session */
                                        $.get(jTimeout.options.extendUrl);

                                        jTimeout.setTimer(jTimeout.options.timeoutAfter);
                                        jTimeout.setTab(jTimeout.options.tabID);
                                        jTimeout.setTabLast();
                                    }
                                    else {
                                        jTimeout.options.onClickExtend(jTimeout);
                                    }

                                    btn.parents('.jAlert').closeAlert();

                                    return false;
                                }
                            },
                            {
                                'text': 'Logout Now',
                                'onClick': function (e, btn) {

                                    e.preventDefault();

                                    window.location.href = jTimeout.options.logoutUrl;

                                    return false;

                                }
                            }
                        ]
                    });
                }
                else {
                    jTimeout.options.onPriorCallback(jTimeout);
                }

            }
            /* reset timeout warning if timeout was set higher */
            else if (seconds > jTimeout.options.secondsPrior && ( $timeoutWarned || $timedOut )) {

                jTimeout.stopFlashing();

                jTimeout.stopPriorCountdown();

                jTimeout.hideAlerts();

                $timeoutWarned = false;

                $timedOut = false;

            }

        };

        if (!jTimeout.options.tabID) {
            jTimeout.options.tabID = jTimeout.generateUid();
        }

        /* Set defaults in localStorage (shared storage across tabs) */
        jTimeout.setTimer(jTimeout.options.timeoutAfter);
        jTimeout.setTab(jTimeout.options.tabID);
        jTimeout.setTabLast();

        var inMS = jTimeout.options.heartbeat * 1000;

        setInterval(jTimeout.countdown, inMS);

        if (jTimeout.options.extendOnMouseMove) {
            inMS = jTimeout.options.mouseDebounce * 1000;

            jTimeout.mouseMoved = false;

            window.setTimeout(function () {

                $('body').on('mousemove', function () {

                    if (!jTimeout.mouseMoved && jTimeout.resetOnAlert()) {
                        jTimeout.mouseMoved = true;

                        window.setTimeout(function () {
                            jTimeout.mouseMoved = false;
                        }, inMS);

                        if (!jTimeout.onMouseMove) {
                            $.get(jTimeout.options.extendUrl);

                            jTimeout.setTimer(jTimeout.options.timeoutAfter);
                            jTimeout.setTab(jTimeout.options.tabID);
                            jTimeout.setTabLast();
                        }
                        else {
                            jTimeout.options.onMouseMove();
                        }
                    }
                });

            }, inMS);
        }

        return this;

    };

    $.jTimeout.reset = function (seconds) {
        seconds = typeof seconds != 'undefined' ? seconds : $.jTimeout.defaults.timeoutAfter; //default to default timeoutAfter
        window.localStorage.timeoutCountdown = seconds; //set timeout countdown
    }

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
        'onMouseMove': false, //Override the standard $.get() request that uses the extendUrl with your own function.

        'extendUrl': '/dashboard', //URL to request in order to extend the session.
        'logoutUrl': '/logout', //URL to request in order to force a logout after the timeout. This way you can end a session early based on a shorter timeout OR if the front-end timeout doesn't sync with the backend one perfectly, you don't look like an idiot.
        'loginUrl': '/login', //URL to send a customer when they want to log back in

        'secondsPrior': 60, //how many seconds before timing out to run the next callback (onPriorCallback)

        'triggerResetOnAlert': false, // should it reset the timer with mouse move while the alert is visible and hide it?

        'onPriorCallback': false, //override the popup that shows when getting within x seconds of timing out
        'onClickExtend': false, //override the click to extend button callback
        'onTimeout': false //override the timeout function if you'd like
    };

    /* END OF ON JQUERY LOAD */
})(jQuery);
