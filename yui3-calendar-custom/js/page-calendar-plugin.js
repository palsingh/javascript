// START WRAPPER: The YUI.add wrapper is added by the build system, when you use YUI Builder to build your component from the raw source in this file
YUI.add("page-calendar-plugin", function(Y) {
    /* CalendarPlugin class constructor */
    function CalendarPlugin(config) {
        CalendarPlugin.superclass.constructor.apply(this, arguments);
    }

    /* 
     * Required NAME static field, to identify the class and 
     * used as an event prefix, to generate class names etc. (set to the 
     * class name in camel case). 
     */
    CalendarPlugin.NAME = "calendarPlugin";

    /* 
     * Required NS static field, to identify the property on the host which will, 
     * be used to refer to the plugin instance ( e.g. host.feature.doSomething() )
     */
    CalendarPlugin.NS = "cal";

    /*
     * The attribute configuration for the plugin. This defines the core user facing state of the plugin
     */
    CalendarPlugin.ATTRS = {
        host: {
            value: null
        },
        calendarObj: {
            value: null
        },
        align: {
            value: [Y.WidgetPositionAlign.TL, Y.WidgetPositionAlign.BL],
            setter: function(position) {
                if (position == 'right') {
                    return [Y.WidgetPositionAlign.TR, Y.WidgetPositionAlign.BR];
                } else {
                    return [Y.WidgetPositionAlign.TL, Y.WidgetPositionAlign.BL];
                }
            }
        }
    };

    /* CalendarPlugin extends the base Plugin.Base class */
    Y.extend(CalendarPlugin, Y.Plugin.Base, {
        initializer: function(config) {
            // Set config
            this.set('host', config.host);
            // Set the padding for correct positioning
            config.host.addClass('yui3-calendar-input');
            // Create a calendar container
            var calNodeId = Y.guid();
            var calNode = Y.Node.create("<div id='" + calNodeId + "'></div>");
            config.host.insert(calNode, 'after');

            // var create calendar 
            var defaultDate = config.date;
            if (defaultDate instanceof Date) {
                // Do nothing
            } else {
                // put current date
                defaultDate = new Date();
            }

            var defaultConfig = {
                inputNode: config.host,
                contentBox: "#" + calNodeId,
                height: 'auto',
                width: '300px',
                overflow: 'hidden',
                showPrevMonth: true,
                showNextMonth: true,
                date: defaultDate,
                zIndex: '999'
            };

            var finalConfig = defaultConfig;

            // Addon configs
            if (config.maximumDate)
                ;
            finalConfig.maximumDate = config.maximumDate;
            if (config.minimumDate)
                ;
            finalConfig.minimumDate = config.minimumDate;

            var calendar = new Y.Calendar(finalConfig);
            calendar.align(config.host, this.get('align'));
            calendar.render();
            calendar.get('boundingBox').setStyle('position', 'absolute');
            this.set('calendarObj', calendar);
            /*
             * Added the below customRenderer to disable the dates which are out of range of min and max date.
             * Adding class to disable nodes because that class will not listen to event to select that date
             */
            if(finalConfig.minimumDate && finalConfig.maximumDate){
                finalConfig.minimumDate.setHours(0,0,0,0);
                finalConfig.maximumDate.setHours(0,0,0,0);
            }
            
            calendar.set("customRenderer", {
                rules: {all: 'all'},
                filterFunction: function(cellDate, cellNode) {
                    if (cellDate < finalConfig.minimumDate || cellDate > finalConfig.maximumDate) {
                        cellNode.addClass('yui3-calendar-selection-disabled');
                        cellNode.setAttribute('aria-disabled' , true);
                    }
                }
            });
        },
        destructor: function() {
            //this.get('calendarObj').destroy();
        }
    });

    Y.namespace("Plugin").Calendar = CalendarPlugin;
}, "3.1.0", {
    requires: ["plugin", "page-bicalendar", 'widget-position-align']
});
// END WRAPPER
