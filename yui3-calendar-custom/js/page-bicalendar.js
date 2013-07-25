/*
 YUI 3.4.1 (build 4118)
 Copyright 2011 Yahoo! Inc. All rights reserved.
 Licensed under the BSD License.
 http://yuilibrary.com/license/
 */
YUI.add('page-bicalendar', function(Y) {

    /**
     * The Calendar component is a UI widget that allows users
     * to view dates in a two-dimensional month grid, as well as
     * to select one or more dates, or ranges of dates. Calendar
     * is generated dynamically and relies on the developer to
     * provide for a progressive enhancement alternative.
     *
     *
     * @module calendar
     */

    var getCN = Y.ClassNameManager.getClassName,
            CALENDAR = 'calendar',
            CAL_HD = getCN(CALENDAR, 'header'),
            CAL_DAY_SELECTED = getCN(CALENDAR, 'day-selected'),
            CAL_DAY_HILITED = getCN(CALENDAR, 'day-highlighted'),
            CAL_DAY = getCN(CALENDAR, 'day'),
            CAL_GRID = getCN(CALENDAR, 'grid'),
            CAL_PREVMONTH_DAY = getCN(CALENDAR, 'prevmonth-day'),
            CAL_NEXTMONTH_DAY = getCN(CALENDAR, 'nextmonth-day'),
            CAL_MONTH_SELECT = getCN(CALENDAR, 'month-select'),
            CAL_YEAR_SELECT = getCN(CALENDAR, 'year-select'),
            CAL_NOT_VALID = getCN(CALENDAR, 'selection-disabled'), // Added this var to disable events from the cell of calendar which has that class

            ydate = Y.DataType.Date,
            delegate = Y.delegate,
            CAL_PANE = getCN(CALENDAR, 'pane'),
            os = Y.UA.os,
            KEY_DOWN = 40,
            KEY_UP = 38,
            KEY_LEFT = 37,
            KEY_RIGHT = 39,
            KEY_ENTER = 13,
            KEY_SPACE = 32,
            substitute = Y.substitute;
    /** Create a calendar view to represent a single or multiple
     * month range of dates, rendered as a grid with date and
     * weekday labels.
     * 
     * @class Calendar
     * @extends CalendarBase
     * @param config {Object} Configuration object (see Configuration attributes)
     * @constructor
     */
    /*
     function Calendar(config) {
     Calendar.superclass.constructor.apply ( this, arguments );
     }
     */
    var Calendar = Y.Base.create(CALENDAR, Y.CalendarBase, [Y.WidgetPosition, Y.WidgetPositionAlign, Y.WidgetStack], {
        /**
         * A property tracking the last selected date on the calendar, for the
         * purposes of multiple selection.
         *
         * @property _lastSelectedDate
         * @type Date
         * @default null
         * @private
         */
        _lastSelectedDate: null,
        _highlightedDateNode: null,
        /**
         * Designated initializer. Activates the navigation plugin for the calendar.
         *
         * @method initializer
         */
        initializer: function(config) {
            if (!config.height)
                this.set('height', '200px');
            if (!config.width)
                this.set('width', '300px');
            if (!config.showPrevMonth)
                this.set('showPrevMonth', true);
            if (!config.showNextMonth)
                this.set('showNextMonth', true);
        },
        /**
         * syncUI implementation
         *
         * Update the scroll position, based on the current value of scrollY
         * @method syncUI
         */
        syncUI: function() {

        },
        /**
         * Overrides the _bindCalendarEvents placeholder in CalendarBase
         * and binds calendar events during bindUI stage.
         * @method _bindCalendarEvents
         * @protected
         */
        _bindCalendarEvents: function() {
            var that = this,
                    contentBox = this.get('contentBox'),
                    initDate = this.get('date'),
                    pane = contentBox.one("." + CAL_PANE),
                    minDate = this.get('minimumDate'),
                    maxDate = this.get('maximumDate'),
                    boundingBox = this.get('boundingBox');

            pane.on("selectstart", function(ev) {
                ev.preventDefault();
            });
            pane.delegate("click", this._clickCalendar, "." + CAL_DAY, this);
            pane.delegate("keyup", this._clickCalendar, "." + CAL_DAY, this);
            // Events in header

            pane.delegate("focus", this._focusCalendarGrid, "." + CAL_GRID, this);
            pane.delegate("focus", this._focusCalendarCell, "." + CAL_DAY, this);
            pane.delegate("keydown", this._keydownCalendar, "." + CAL_GRID, this);
            pane.delegate("blur", this._blurCalendarGrid, "." + CAL_GRID + ",." + CAL_DAY, this);
            boundingBox.on('key' , this._hideCalendar, 'esc' , this);
            boundingBox.after("blur", _checkItemFocus, this);
            function _checkItemFocus(e) {
                Y.later(100, {}, function() {
                    if (!that.get('boundingBox').contains(Y.one(document.activeElement))) {
                        that._hideCalendar();
                    }
                });
            }
            contentBox.one("." + CAL_YEAR_SELECT).after('change', function(e) {
                var baseDate = that.get('date');
                // New date for pane
                baseDate.setYear(e.target.get('value'));
                /*
                 * @Reason  :   Added below code to remove the invalid months if min/max year
                 * @ModifiedBy :   Jaspal Singh
                 * @ModifiedDate    :   10-04-2013
                 */
                if (minDate.getFullYear() == e.target.get('value')) {
                    that._updateInvalidMonths(1, minDate.getMonth() + 1);
                } else if (maxDate.getFullYear() == e.target.get('value')) {
                    that._updateInvalidMonths(maxDate.getMonth() + 2, 13);
                } else {
                    that._updateInvalidMonths();
                }
                that.set('date', baseDate);
            });


            contentBox.one("." + CAL_MONTH_SELECT).after('change', function(e) {
                var baseDate = that.get('date');
                // New date
                baseDate.setMonth(that.getMonthIndex(e.target.get('value')));
                that.set('date', baseDate);
            });

            var inputNode = this.get('inputNode');
            // Maje input box readonly
            inputNode.set('readonly', true);

            // Show the calender when somebody clicked/focused on inputNode

            inputNode.on('focus', function(e) {
                contentBox.one('.' + CAL_GRID).ancestor('.yui3-calendar').setAttribute('tabindex', inputNode.getAttribute('tabindex'))
                contentBox.one('.' + CAL_GRID).setAttribute('tabindex', inputNode.getAttribute('tabindex'));
                // Align the widget to the input Node
                //this.align(inputNode,[Y.WidgetPositionAlign.TL , Y.WidgetPositionAlign.BL]);
                // Show the widget
                this.show();
                if(!this.get("contentBox").one("." + CAL_DAY_HILITED)){
                    this._highlightDateNode(new Date());
                }
                if (this.get('autoFocusOnFieldFocus')) {
                    this.focus();
                }
            }, this);


            inputNode.on('keydown', function(e) {
                if (e.keyCode == 9) {
                    // If its tab
                    this._hideCalendar();
                }

            }, this);

            Y.one('body').on('click', function(e) {
                // If clicked outside
                if (e.target != inputNode && !contentBox.contains(e.target)) {
                    this._hideCalendar();
                }
            }, this);

            // When any date node is clicked
            this.on('dateClick', function(ev) {
                var dateValue = this.getPrettyDate(ev.date);
                // Set value in the text input 
                inputNode.set('value', dateValue);
                // Set value in the date output
                var d = this.getPaddedValue(ev.date.getDate()),
                        m = this.getPaddedMonthValue(ev.date.getMonth()),
                        y = ev.date.getFullYear() + '';

                this.set('dateOutput', {
                    'd': d,
                    'm': m,
                    'y': y,
                    raw: ev.date
                });
                // Hide the widget
                this._hideCalendar();
                try{
                    var nextNodeTabIndex = parseInt(contentBox.one('select:last-child').getAttribute('tabindex') , 10) + 1;
                    Y.one('[tabindex='+ nextNodeTabIndex +']').focus();
                }catch(e){
                    Y.log(Y.one('[tabindex='+ nextNodeTabIndex +']'))
                }
            }, this);
            // By default it will be hidden
            this._hideCalendar();
            this._updateCalendarHeader(initDate);
        },
                
        /*
         * Hide the calendar
         * @returns {undefined}
         * 
         */
        '_hideCalendar': function() {
            Y.log('hiding calendar');
            this.hide();
        },
        /*
         * @param {type} startMonth
         * @param {type} endMonth
         * @returns {undefined}
         */

        '_updateInvalidMonths': function(startMonth, endMonth) {
            var contentBox = this.get('contentBox')
            contentBox.one("." + CAL_MONTH_SELECT).all('option').setStyle('display', 'block').removeAttribute('disabled');
            if (startMonth && endMonth) {
                for (var i = startMonth; i < endMonth; i++) {
                    var monthVal = '';
                    if (i < 10) {
                        monthVal = '0' + i;
                    } else {
                        monthVal = i;
                    }
                    contentBox.one("." + CAL_MONTH_SELECT).one('option[value=' + monthVal + ']').setStyle('display', 'none').setAttribute('disabled', true);
                }
            }
        },
        /*
         * 
         * @param {type} dateInput
         * @returns {Date|Boolean}
         * 
         */
        'getDate': function(dateInput) {
            var dateObj, temp;
            if (Y.Lang.isUndefined(dateInput)) {
                temp = this.get('dateOutput');
                if (Y.Lang.isUndefined(temp.raw) || !(temp.raw instanceof Date)) {
                    return false;
                } else {
                    dateObj = temp.raw;
                }
            } else if (dateInput instanceof Date) {
                dateObj = dateInput;
            } else if (Y.Lang.isString(dateInput)) {
                temp = dateInput.split('-');
                if (temp.length == 3) {
                    // First try DD-MM-YYYY approach
                    if (temp[2].length == 4) {
                        dateObj = new Date(parseInt(temp[2], 10), this.getMonthIndex(temp[1]), parseInt(temp[0], 10));
                    }
                    // then try YYYY-MM-DD approach
                    else if (temp[0].length == 4) {
                        dateObj = new Date(parseInt(temp[0], 10), this.getMonthIndex(temp[1]), parseInt(temp[2], 10))
                    }


                    // If its again not a success
                    if (!(dateObj instanceof Date)) {
                        // just push it into Date date parse function
                        dateObj = Y.DataType.Date.parse(dateInput);
                        if (!(dateObj instanceof Date)) {
                            return false;
                        }
                    }
                }
            } else if (dateInput instanceof Object) {
                dateObj = new Date(parseInt(dateInput.y, 10), this.getMonthIndex(dateInput.m), parseInt(dateInput.d, 10));
                if (!(dateObj instanceof Date)) {
                    return false;
                }
            }

            return dateObj
        },
        'setDate': function(dateInput) {
            // get date from input
            var that = this,
                    dateObj = this.getDate(dateInput);


            if (dateObj instanceof Date) {
                var calDate = {
                    'y': (dateObj.getFullYear() + ''),
                    'm': that.getPaddedMonthValue(dateObj.getMonth()),
                    'd': that.getPaddedValue(dateObj.getDate()),
                    'raw': dateObj
                };
                this.set('dateOutput', calDate);
                this.get('inputNode').set('value', this.getPrettyDate(dateInput));
            } else {
                Y.log('date not valid', 'warn')
            }
        },
        'getPrettyDate': function(dateInput) {
            
            // get date from input
            var dateObj = this.getDate(dateInput);

            var monthStrArr = Calendar.MONTH_SHORT,
                    d = dateObj.getDate() + '',
                    m = this.getPaddedValue(dateObj.getMonth()),
                    y = dateObj.getFullYear(),
                    daySuffix = '',
                    monthStr = monthStrArr[dateObj.getMonth()]
            var lastDayChar = d[d.length - 1];
            if (d.length == 2 && d[0] == 1) {
                // if the date is 11th , 12th ... and so on 
                daySuffix = 'th'
            } else if (lastDayChar == '1') {
                daySuffix = 'st'
            } else if (lastDayChar == '2') {
                daySuffix = 'nd'
            } else if (lastDayChar == '3') {
                daySuffix = 'rd'
            } else {
                daySuffix = 'th'
            }


            return d + daySuffix + " " + monthStr + " " + y;
        },
        _initCalendarHeader: function(baseDate) {
            var minimumDate = this.get('minimumDate'), maximumDate = this.get('maximumDate');

            if (!minimumDate) {
                minimumDate = ydate.addYears(baseDate, Calendar.ADD_MIN_BEFORE)
            }

            if (!maximumDate) {
                maximumDate = ydate.addYears(baseDate, Calendar.ADD_MAX_AFTER)
            }

            var monthOptions = this._getMonthOptions(minimumDate, maximumDate);
            var yearOptions = this._getYearOptions(minimumDate, maximumDate);

            var monthSelect = substitute(Calendar.MONTH_TPL, {
                'month_options': monthOptions,
                'month_select_class': CAL_MONTH_SELECT
            });
            var yearSelect = substitute(Calendar.YEAR_TPL, {
                'year_options': yearOptions,
                'year_select_class': CAL_YEAR_SELECT
            });

            return substitute(Calendar.HEADER_TPL, {
                'month_select': monthSelect,
                'year_select': yearSelect
            })
        },
        _updateCalendarHeader: function(currentDate) {
            var contentBox = this.get('contentBox');

            contentBox.one("." + CAL_YEAR_SELECT).set('value', "" + currentDate.getFullYear());
            contentBox.one("." + CAL_MONTH_SELECT).set('value', this.getPaddedMonthValue(currentDate.getMonth()))

        },
        _getMonthOptions: function(minimumDate, maximumDate) {
            var monthArr = [], tempDate, optionsStr = '', paddedMonth;
            var monthStrArr = Calendar.MONTH_SHORT;

            tempDate = minimumDate;
            do {
                if (tempDate.getMonth() == maximumDate.getMonth() && tempDate.getFullYear() == maximumDate.getFullYear()) {
                    // Get the current one also
                    if (Y.Array.indexOf(monthArr, tempDate.getMonth()) == -1) {
                        monthArr.push(parseInt(tempDate.getMonth()));
                    }
                    break;
                }

                if (Y.Array.indexOf(monthArr, tempDate.getMonth()) == -1) {
                    monthArr.push(parseInt(tempDate.getMonth()));
                }
                tempDate = ydate.addMonths(tempDate, 1)

            } while (true);
            // Sort the month arr in assending order
            monthArr.sort(Y.Array.numericSort);
            for (var i = 0; i < monthArr.length; i++) {
                paddedMonth = this.getPaddedMonthValue(monthArr[i]);
                optionsStr += substitute(Calendar.MONTH_OPTION_TPL, {
                    'month_option_content': monthStrArr[monthArr[i]],
                    'month_value': paddedMonth
                });
            }
            return optionsStr
        },
        _getYearOptions: function(minimumDate, maximumDate) {
            var yearArr = [], tempDate, optionsStr = '';

            for (var i = parseInt(minimumDate.getFullYear()); i <= parseInt(maximumDate.getFullYear()); i++) {
                optionsStr += substitute(Calendar.YEAR_OPTION_TPL, {
                    'year_option_content': i,
                    'year_value': i

                });
            }
            return optionsStr
        },
        getPaddedValue: function(newValue) {
            if (newValue > 0 && newValue < 10) {
                return "0" + newValue;
            } else {
                return "" + newValue;
            }
        },
        getMonthIndex: function(monthValue) {
            monthValue = '' + monthValue;
            var monthIntValue = Y.DataType.Number.parse(monthValue);
            return monthIntValue - 1;
        },
        getPaddedMonthValue: function(indexValue) {
            indexValue = parseInt(indexValue);
            return this.getPaddedValue(indexValue + 1);
        },
        _afterDateChange: function() {

            var contentBox = this.get('contentBox'),
                    calendarPanes = contentBox.all("." + getCN(CALENDAR, 'grid')),
                    currentDate = this.get("date"),
                    counter = 0;

            contentBox.setStyle("visibility", "hidden");
            this._updateCalendarHeader(currentDate);

            this._restoreModifiedCells();

            calendarPanes.each(function(curNode) {
                this._rerenderCalendarPane(ydate.addMonths(currentDate, counter++),
                        curNode);
            }, this);

            this._afterShowPrevMonthChange();
            this._afterShowNextMonthChange();

            this._renderCustomRules();
            this._renderSelectedDates();

            contentBox.setStyle("visibility", "visible");
        },
        /**
         * Handles the calendar clicks based on selection mode.
         * @method _clickCalendar
         * @param {Event} ev A click event
         * @private
         * @modifiedBy  :   Jaspal Singh
         * @reason      :   Added IF/ELSE condition, to select date when ENTER is pressed
         */
        _clickCalendar: function(ev) {
            if (ev.keyCode === KEY_ENTER || ev.type === 'click' || ev.keyCode === KEY_SPACE) {
                var clickedCell = ev.target,
                        clickedCellIsDay = clickedCell.hasClass(CAL_DAY) &&
                        !clickedCell.hasClass(CAL_PREVMONTH_DAY) &&
                        !clickedCell.hasClass(CAL_NEXTMONTH_DAY) &&
                        !clickedCell.hasClass(CAL_NOT_VALID),
                        clickedCellIsSelected = clickedCell.hasClass(CAL_DAY_SELECTED);
                switch (this.get("selectionMode")) {
                    case("single"):
                        if (clickedCellIsDay) {
                            if (!clickedCellIsSelected) {
                                this._clearSelection(true);
                                this._addDateToSelection(this._nodeToDate(clickedCell));
                            }
                        }
                        break;
                    case("multiple-sticky"):
                        if (clickedCellIsDay) {
                            if (clickedCellIsSelected) {
                                this._removeDateFromSelection(this._nodeToDate(clickedCell));
                            }
                            else {
                                this._addDateToSelection(this._nodeToDate(clickedCell));
                            }
                        }
                        break;
                    case("multiple"):
                        if (!ev.metaKey && !ev.ctrlKey && !ev.shiftKey) {
                            this._clearSelection(true);
                            this._lastSelectedDate = this._nodeToDate(clickedCell);
                            this._addDateToSelection(this._lastSelectedDate);
                        }
                        else if (((os == 'macintosh' && ev.metaKey) || (os != 'macintosh' && ev.ctrlKey)) && !ev.shiftKey) {
                            if (clickedCellIsSelected) {
                                this._removeDateFromSelection(this._nodeToDate(clickedCell));
                                this._lastSelectedDate = null;
                            }
                            else {
                                this._lastSelectedDate = this._nodeToDate(clickedCell);
                                this._addDateToSelection(this._lastSelectedDate);
                            }
                        }
                        else if (((os == 'macintosh' && ev.metaKey) || (os != 'macintosh' && ev.ctrlKey)) && ev.shiftKey) {
                            if (this._lastSelectedDate != null) {
                                var selectedDate = this._nodeToDate(clickedCell);
                                this._addDateRangeToSelection(selectedDate, this._lastSelectedDate);
                                this._lastSelectedDate = selectedDate;
                            }
                            else {
                                this._lastSelectedDate = this._nodeToDate(clickedCell);
                                this._addDateToSelection(this._lastSelectedDate);
                            }

                        }
                        else if (ev.shiftKey) {
                            if (this._lastSelectedDate != null) {
                                var selectedDate = this._nodeToDate(clickedCell);
                                this._clearSelection(true);
                                this._addDateRangeToSelection(selectedDate, this._lastSelectedDate);
                                this._lastSelectedDate = selectedDate;
                            }
                            else {
                                this._clearSelection(true);
                                this._lastSelectedDate = this._nodeToDate(clickedCell);
                                this._addDateToSelection(this._lastSelectedDate);
                            }
                        }
                        break;
                }

                if (clickedCellIsDay) {
                    /**
                     * Fired when a specific date cell in the calendar is clicked. The event carries a 
                     * payload which includes a `cell` property corresponding to the node of the actual
                     * date cell, and a `date` property, with the `Date` that was clicked.
                     *
                     * @event dateClick
                     */
                    this.fire("dateClick", {
                        cell: clickedCell,
                        date: this._nodeToDate(clickedCell)
                    });
                }
                else if (clickedCell.hasClass(CAL_PREVMONTH_DAY)) {
                    /**
                     * Fired when any of the previous month's days displayed before the calendar grid
                     * are clicked.
                     *
                     * @event prevMonthClick
                     */
                    this.fire("prevMonthClick");
                }
                else if (clickedCell.hasClass(CAL_NEXTMONTH_DAY)) {
                    /**
                     * Fired when any of the next month's days displayed after the calendar grid
                     * are clicked.
                     *
                     * @event nextMonthClick
                     */
                    this.fire("nextMonthClick");
                }
            }
        },
        /**
         * Handler for keyboard press on a calendar grid
         * @method _keydownCalendar
         * @protected
         */
        _keydownCalendar: function(ev) {
            var gridNum = this._getGridNumber(ev.target),
                    curDate = !this._highlightedDateNode ? null : this._nodeToDate(this._highlightedDateNode),
                    keyCode = ev.keyCode,
                    dayNum = 0,
                    dir = '';

            switch (keyCode) {
                case KEY_DOWN:
                    dayNum = 7;
                    dir = 's';
                    break;
                case KEY_UP:
                    dayNum = -7;
                    dir = 'n';
                    break;
                case KEY_LEFT:
                    dayNum = -1;
                    dir = 'w';
                    break;
                case KEY_RIGHT:
                    dayNum = 1;
                    dir = 'e';
                    break;
                case KEY_SPACE:
                case KEY_ENTER:
                    ev.preventDefault();
                    if (this._highlightedDateNode) {
                        var selMode = this.get("selectionMode");
                        if (selMode === "single" && !this._highlightedDateNode.hasClass(CAL_DAY_SELECTED)) {
                            this._clearSelection(true);
                            this._addDateToSelection(curDate);
                        }
                        else if (selMode === "multiple" || selMode === "multiple-sticky") {
                            if (this._highlightedDateNode.hasClass(CAL_DAY_SELECTED)) {
                                this._removeDateFromSelection(curDate);
                            }
                            else {
                                this._addDateToSelection(curDate);
                            }
                        }
                    }
                    break;
            }


            if (keyCode === KEY_DOWN || keyCode === KEY_UP || keyCode === KEY_LEFT || keyCode === KEY_RIGHT) {

                if (!curDate) {
                    curDate = ydate.addMonths(this.get("date"), gridNum);
                    dayNum = 0;
                }
                ev.preventDefault();
                var newDate = ydate.addDays(curDate, dayNum),
                        startDate = this.get("date"),
                        endDate = ydate.addMonths(this.get("date"), this._paneNumber - 1),
                        lastPaneDate = new Date(endDate),
                        newNode = '';
                endDate.setDate(ydate.daysInMonth(endDate));

                if (ydate.isInRange(newDate, startDate, endDate)) {
                    /*
                     var paneShift = (newDate.getMonth() - curDate.getMonth()) % 10;
                     
                     
                     if (paneShift != 0) {
                     var newGridNum = gridNum + paneShift,
                     contentBox = this.get('contentBox'),
                     newPane = contentBox.one("#" + this._calendarId + "_pane_" + newGridNum);
                     newPane.focus();
                     }
                     */
                    newNode = this._testNewNode(newDate);
                    if (!newNode.hasClass(CAL_NOT_VALID)) {
                        this._highlightDateNode(newDate);
                    }else if(!this.get("contentBox").one("." + CAL_DAY_HILITED)){
                        this._highlightDateNode(new Date());
                    }
                }
                else if (ydate.isGreater(startDate, newDate)) {
                    if (!ydate.isGreaterOrEqual(this.get("minimumDate"), startDate)) {
                        this.set("date", ydate.addMonths(startDate, -1));
                        this._highlightDateNode(newDate);
                    }
                }
                else if (ydate.isGreater(newDate, endDate)) {
                    if (!ydate.isGreaterOrEqual(lastPaneDate, this.get("maximumDate"))) {
                        this.set("date", ydate.addMonths(startDate, 1));
                        this._highlightDateNode(newDate);
                    }
                }

            }
        },
        _testNewNode: function(oDate) {
            var newNode = this._dateToNode(oDate);
            return newNode;
        },
        /**
         * Handler for gain of focus of calendar cell
         * @method _focusCalendarCell
         * @protected
         */
        _focusCalendarCell: function(ev) {
            this._highlightedDateNode = ev.target;
            ev.stopPropagation();
        },
        /**
         * Handler for gain of focus of calendar grid
         * @method _focusCalendarGrid
         * @protected
         */
        _focusCalendarGrid: function(ev) {
            this._unhighlightCurrentDateNode();
            this._highlightedDateNode = null;
        },
        /**
         * Unhighlights a specific date node currently highlighted with keyboard highlight class
         * @method _unhighlightCurrentDateNode
         * @protected
         */
        _unhighlightCurrentDateNode: function() {
            var allHilitedNodes = this.get("contentBox").all("." + CAL_DAY_HILITED);
            if (allHilitedNodes) {
                allHilitedNodes.removeClass(CAL_DAY_HILITED);
            }
        },
        /**
         * Returns the grid number for a specific calendar grid (for multi-grid templates)
         * @method _getGridNumber
         * @param gridNode {Node} Node corresponding to a specific grid
         * @protected
         */
        _getGridNumber: function(gridNode) {
            var idParts = gridNode.get("id").split("_").reverse();
            return parseInt(idParts[0], 10);
        },
        /**
         * Highlights a specific date node with keyboard highlight class
         * @method _highlightDateNode
         * @param oDate {Date} Date corresponding the node to be highlighted
         * @protected
         */
        _highlightDateNode: function(oDate) {
            this._unhighlightCurrentDateNode();
            var newNode = this._dateToNode(oDate);
            newNode.focus();
            newNode.addClass(CAL_DAY_HILITED);
        },
        /**
         * Handler for loss of focus of calendar grid
         * @method _blurCalendarGrid
         * @protected
         */
        _blurCalendarGrid: function(ev) {
            this._unhighlightCurrentDateNode();
        },
        /**
         * Subtracts one month from the current calendar view.
         * @method subtractMonth
         */
        subtractMonth: function(e) {
            this.set("date", ydate.addMonths(this.get("date"), -1));
            e.halt();
        },
        /**
         * Subtracts one year from the current calendar view.
         * @method subtractYear
         */
        subtractYear: function(e) {
            this.set("date", ydate.addYears(this.get("date"), -1));
            e.halt();
        },
        /**
         * Adds one month to the current calendar view.
         * @method addMonth
         */
        addMonth: function(e) {
            this.set("date", ydate.addMonths(this.get("date"), 1));
            e.halt();
        },
        /**
         * Adds one year to the current calendar view.
         * @method addYear
         */
        addYear: function(e) {
            this.set("date", ydate.addYears(this.get("date"), 1));
            e.halt();
        }
    },
    {
        /**
         * The identity of the widget.
         *
         * @property NAME
         * @type String
         * @default 'Calendar'
         * @readOnly
         * @protected
         * @static
         */
        NAME: "Calendar",
        ADD_MAX_AFTER: 10,
        ADD_MIN_BEFORE: -10,
        MONTH_SHORT: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        HEADER_TPL: "<div class='" + CAL_HD + "'>{year_select} {month_select}</div>",
        MONTH_TPL: "<select class='{month_select_class}'>{month_options}</select>",
        MONTH_OPTION_TPL: "<option value='{month_value}'>{month_option_content}</option>",
        YEAR_TPL: "<select class='{year_select_class}'>{year_options}</select>",
        YEAR_OPTION_TPL: "<option value='{year_value}'>{year_option_content}</option>",
        /**
         * Static property used to define the default attribute configuration of
         * the Widget.
         *
         * @property ATTRS
         * @type {Object}
         * @protected
         * @static
         */
        ATTRS: {
            /**
             * A setting specifying the type of selection the calendar allows.
             * Possible values include:
             * <ul>
             *   <li>`single`</li> - One date at a time
             *   <li>`multiple-sticky</li> - Multiple dates, selected one at a time (the dates "stick")
             *   <li>`multiple`</li> - Multiple dates, selected with Ctrl/Meta keys for additional single
             *   dates, and Shift key for date ranges.
             *
             * @attribute selectionMode
             * @type String
             * @default single
             */
            selectionMode: {
                value: "single"
            },
            /**
             * The date corresponding to the current calendar view. Always
             * normalized to the first of the month that contains the date
             * at assignment time. Used as the first date visible in the
             * calendar.
             *
             * @attribute date
             * @type Date
             * @default Today's date as set on the user's computer.
             */
            date: {
                value: new Date(),
                setter: function(val) {

                    var newDate = this._normalizeDate(val),
                            newTopDate = ydate.addMonths(newDate, this._paneNumber - 1),
                            minDate = this.get("minimumDate"),
                            maxDate = this.get("maximumDate");

                    if ((minDate == null || ydate.isGreaterOrEqual(newDate, minDate)) &&
                            (maxDate == null || ydate.isGreaterOrEqual(maxDate, newTopDate))) {
                        return newDate;
                    }

                    else if (minDate != null && ydate.isGreater(minDate, newDate)) {
                        return minDate;
                    }

                    else if (maxDate != null && ydate.isGreater(newTopDate, maxDate)) {
                        var actualMaxDate = ydate.addMonths(maxDate, -1 * (this._paneNumber - 1));
                        return actualMaxDate;
                    }
                }
            },
            /**
             * The minimum date that can be displayed by the calendar. The calendar will not
             * allow dates earlier than this one to be set, and will reset any earlier date to
             * this date. Should be `null` if no minimum date is needed.
             *
             * @attribute minimumDate
             * @type Date
             * @default null
             */
            minimumDate: {
                value: null,
                setter: function(val) {
                    if (val != null) {
                        var curDate = this.get('date'),
                                newMinDate = this._normalizeDate(val);
                        if (curDate != null && !ydate.isGreaterOrEqual(curDate, newMinDate)) {
                            this.set('date', newMinDate);
                        }
                        return newMinDate;
                    }
                    else {
                        return val;
                    }
                }
            },
            /**
             * The maximum date that can be displayed by the calendar. The calendar will not
             * allow dates later than this one to be set, and will reset any later date to
             * this date. Should be `null` if no maximum date is needed.
             *
             * @attribute maximumDate
             * @type Date
             * @default null
             */
            maximumDate: {
                value: null,
                setter: function(val) {
                    if (val != null) {
                        var curDate = this.get('date'),
                                newMaxDate = this._normalizeDate(val);
                        if (curDate != null && !ydate.isGreaterOrEqual(val, ydate.addMonths(curDate, this._paneNumber - 1))) {
                            this.set('date', ydate.addMonths(newMaxDate, -1 * (this._paneNumber - 1)));
                        }
                        return newMaxDate;
                    }
                    else {
                        return val;
                    }
                }
            },
            /**
             * Input node with which this calendar should aligned to.
             */
            inputNode: {
                value: null,
                setter: function(node) {
                    var finalNode = null;
                    if (Y.Lang.isString(node)) {
                        finalNode = Y.one(node);
                        if (finalNode instanceof Y.Node) {
                            return finalNode;
                        } else {
                            return Y.Attribute.INVALID_VALUE;
                        }
                    } else if (node instanceof Y.Node) {
                        return node;
                    } else {
                        return Y.Attribute.INVALID_VALUE;
                    }
                }
            },
            /**
             * The output of the selection will be stoted here
             */
            dateOutput: {
                value: {
                    d: null,
                    m: null,
                    y: null
                }
            },
            /*
             * If the user is to autofocus on the calendar
             * when they enter the input box
             *
             * @attribute autoFocusOnFieldFocus
             * @type bool
             * @default false
             * @public
             */
            autoFocusOnFieldFocus: {
                value: true
            },
            /*
             * The format in which you want your output
             * 
             *
             * @attribute format
             * @type Date
             * @default MM-DD-YYYY
             * @public
             */
            format : {
                value : "MM-DD-YYYY"
            }
        }
    });
    Y.Calendar = Calendar;

}, '3.4.1', {
    requires: ['calendar-base', 'substitute', 'datatype', 'widget-position-align', 'widget-stack', 'selector-css3'],
    "skinnable": true
});
