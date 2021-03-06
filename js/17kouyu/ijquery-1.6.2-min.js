
/*
    http://www.JSON.org/json2.js
    2011-01-18

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false, regexp: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

var JSON;
if (!JSON) {
    JSON = {};
}

(function () {
    "use strict";

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                this.getUTCFullYear()     + '-' +
                f(this.getUTCMonth() + 1) + '-' +
                f(this.getUTCDate())      + 'T' +
                f(this.getUTCHours())     + ':' +
                f(this.getUTCMinutes())   + ':' +
                f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function (key) {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string' ? c :
                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' : gap ?
                    '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']' :
                    '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' : gap ?
                '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
                '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());


/*!	SWFObject v2.2 <http://code.google.com/p/swfobject/> 
 is released under the MIT License <http://www.opensource.org/licenses/mit-license.php>
 */
var swfobject = function(){

    var UNDEF = "undefined", OBJECT = "object", SHOCKWAVE_FLASH = "Shockwave Flash", SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash", FLASH_MIME_TYPE = "application/x-shockwave-flash", EXPRESS_INSTALL_ID = "SWFObjectExprInst", ON_READY_STATE_CHANGE = "onreadystatechange", win = window, doc = document, nav = navigator, plugin = false, domLoadFnArr = [main], regObjArr = [], objIdArr = [], listenersArr = [], storedAltContent, storedAltContentId, storedCallbackFn, storedCallbackObj, isDomLoaded = false, isExpressInstallActive = false, dynamicStylesheet, dynamicStylesheetMedia, autoHideShow = true,    /* Centralized function for browser feature detection
     - User agent string detection is only used when no good alternative is possible
     - Is executed directly for optimal performance
     */
    ua = function(){
        var w3cdom = typeof doc.getElementById != UNDEF && typeof doc.getElementsByTagName != UNDEF && typeof doc.createElement != UNDEF, u = nav.userAgent.toLowerCase(), p = nav.platform.toLowerCase(), windows = p ? /win/.test(p) : /win/.test(u), mac = p ? /mac/.test(p) : /mac/.test(u), webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false, // returns either the webkit version or false if not webkit
 ie = !+"\v1", // feature detection based on Andrea Giammarchi's solution: http://webreflection.blogspot.com/2009/01/32-bytes-to-know-if-your-browser-is-ie.html
 playerVersion = [0, 0, 0], d = null;
        if (typeof nav.plugins != UNDEF && typeof nav.plugins[SHOCKWAVE_FLASH] == OBJECT) {
            d = nav.plugins[SHOCKWAVE_FLASH].description;
            if (d && !(typeof nav.mimeTypes != UNDEF && nav.mimeTypes[FLASH_MIME_TYPE] && !nav.mimeTypes[FLASH_MIME_TYPE].enabledPlugin)) { // navigator.mimeTypes["application/x-shockwave-flash"].enabledPlugin indicates whether plug-ins are enabled or disabled in Safari 3+
                plugin = true;
                ie = false; // cascaded feature detection for Internet Explorer
                d = d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
                playerVersion[0] = parseInt(d.replace(/^(.*)\..*$/, "$1"), 10);
                playerVersion[1] = parseInt(d.replace(/^.*\.(.*)\s.*$/, "$1"), 10);
                playerVersion[2] = /[a-zA-Z]/.test(d) ? parseInt(d.replace(/^.*[a-zA-Z]+(.*)$/, "$1"), 10) : 0;
            }
        } else if (typeof win.ActiveXObject != UNDEF) {
            try {
                var a = new ActiveXObject(SHOCKWAVE_FLASH_AX);
                if (a) { // a will return null when ActiveX is disabled
                    d = a.GetVariable("$version");
                    if (d) {
                        ie = true; // cascaded feature detection for Internet Explorer
                        d = d.split(" ")[1].split(",");
                        playerVersion = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
                    }
                }
            } catch (e) {
            }
        }
        return {
            w3: w3cdom,
            pv: playerVersion,
            wk: webkit,
            ie: ie,
            win: windows,
            mac: mac
        };
    }(),    /* Cross-browser onDomLoad
     - Will fire an event as soon as the DOM of a web page is loaded
     - Internet Explorer workaround based on Diego Perini's solution: http://javascript.nwbox.com/IEContentLoaded/
     - Regular onload serves as fallback
     */
    onDomLoad = function(){
        if (!ua.w3) {
            return;
        }
        if ((typeof doc.readyState != UNDEF && doc.readyState == "complete") || (typeof doc.readyState == UNDEF && (doc.getElementsByTagName("body")[0] || doc.body))) { // function is fired after onload, e.g. when script is inserted dynamically 
            callDomLoadFunctions();
        }
        if (!isDomLoaded) {
            if (typeof doc.addEventListener != UNDEF) {
                doc.addEventListener("DOMContentLoaded", callDomLoadFunctions, false);
            }
            if (ua.ie && ua.win) {
                doc.attachEvent(ON_READY_STATE_CHANGE, function(){
                    if (doc.readyState == "complete") {
                        doc.detachEvent(ON_READY_STATE_CHANGE, arguments.callee);
                        callDomLoadFunctions();
                    }
                });
                if (win == top) { // if not inside an iframe
                    (function(){
                        if (isDomLoaded) {
                            return;
                        }
                        try {
                            doc.documentElement.doScroll("left");
                        } catch (e) {
                            setTimeout(arguments.callee, 0);
                            return;
                        }
                        callDomLoadFunctions();
                    })();
                }
            }
            if (ua.wk) {
                (function(){
                    if (isDomLoaded) {
                        return;
                    }
                    if (!/loaded|complete/.test(doc.readyState)) {
                        setTimeout(arguments.callee, 0);
                        return;
                    }
                    callDomLoadFunctions();
                })();
            }
            addLoadEvent(callDomLoadFunctions);
        }
    }();
    
    function callDomLoadFunctions(){
        if (isDomLoaded) {
            return;
        }
        try { // test if we can really add/remove elements to/from the DOM; we don't want to fire it too early
            var t = doc.getElementsByTagName("body")[0].appendChild(createElement("span"));
            t.parentNode.removeChild(t);
        } catch (e) {
            return;
        }
        isDomLoaded = true;
        var dl = domLoadFnArr.length;
        for (var i = 0; i < dl; i++) {
            domLoadFnArr[i]();
        }
    }
    
    function addDomLoadEvent(fn){
        if (isDomLoaded) {
            fn();
        } else {
            domLoadFnArr[domLoadFnArr.length] = fn; // Array.push() is only available in IE5.5+
        }
    }
    
    /* Cross-browser onload
     - Based on James Edwards' solution: http://brothercake.com/site/resources/scripts/onload/
     - Will fire an event as soon as a web page including all of its assets are loaded
     */
    function addLoadEvent(fn){
        if (typeof win.addEventListener != UNDEF) {
            win.addEventListener("load", fn, false);
        } else if (typeof doc.addEventListener != UNDEF) {
            doc.addEventListener("load", fn, false);
        } else if (typeof win.attachEvent != UNDEF) {
            addListener(win, "onload", fn);
        } else if (typeof win.onload == "function") {
            var fnOld = win.onload;
            win.onload = function(){
                fnOld();
                fn();
            };
        } else {
            win.onload = fn;
        }
    }
    
    /* Main function
     - Will preferably execute onDomLoad, otherwise onload (as a fallback)
     */
    function main(){
        if (plugin) {
            testPlayerVersion();
        } else {
            matchVersions();
        }
    }
    
    /* Detect the Flash Player version for non-Internet Explorer browsers
     - Detecting the plug-in version via the object element is more precise than using the plugins collection item's description:
     a. Both release and build numbers can be detected
     b. Avoid wrong descriptions by corrupt installers provided by Adobe
     c. Avoid wrong descriptions by multiple Flash Player entries in the plugin Array, caused by incorrect browser imports
     - Disadvantage of this method is that it depends on the availability of the DOM, while the plugins collection is immediately available
     */
    function testPlayerVersion(){
        var b = doc.getElementsByTagName("body")[0];
        var o = createElement(OBJECT);
        o.setAttribute("type", FLASH_MIME_TYPE);
       
		var divSwf=createElement("div");		
		divSwf.id="swfObjectDiv";
		divSwf.style.display="none";				
		b.appendChild(divSwf);
		var t = divSwf.appendChild(o);		
        if (t) {
            var counter = 0;
            (function(){
                if (typeof t.GetVariable != UNDEF) {
                    var d = t.GetVariable("$version");
                    if (d) {
                        d = d.split(" ")[1].split(",");
                        ua.pv = [parseInt(d[0], 10), parseInt(d[1], 10), parseInt(d[2], 10)];
                    }
                } else if (counter < 10) {
                    counter++;
                    setTimeout(arguments.callee, 10);
                    return;
                }                
                b.removeChild(divSwf);
                t = null;
                matchVersions();
            })();
        } else {
            matchVersions();
        }
    }
    
    /* Perform Flash Player and SWF version matching; static publishing only
     */
    function matchVersions(){
        var rl = regObjArr.length;
        if (rl > 0) {
            for (var i = 0; i < rl; i++) { // for each registered object element
                var id = regObjArr[i].id;
                var cb = regObjArr[i].callbackFn;
                var cbObj = {
                    success: false,
                    id: id
                };
                if (ua.pv[0] > 0) {
                    var obj = getElementById(id);
                    if (obj) {
                        if (hasPlayerVersion(regObjArr[i].swfVersion) && !(ua.wk && ua.wk < 312)) { // Flash Player version >= published SWF version: Houston, we have a match!
                            setVisibility(id, true);
                            if (cb) {
                                cbObj.success = true;
                                cbObj.ref = getObjectById(id);
                                cb(cbObj);
                            }
                        } else if (regObjArr[i].expressInstall && canExpressInstall()) { // show the Adobe Express Install dialog if set by the web page author and if supported
                            var att = {};
                            att.data = regObjArr[i].expressInstall;
                            att.width = obj.getAttribute("width") || "0";
                            att.height = obj.getAttribute("height") || "0";
                            if (obj.getAttribute("class")) {
                                att.styleclass = obj.getAttribute("class");
                            }
                            if (obj.getAttribute("align")) {
                                att.align = obj.getAttribute("align");
                            }
                            // parse HTML object param element's name-value pairs
                            var par = {};
                            var p = obj.getElementsByTagName("param");
                            var pl = p.length;
                            for (var j = 0; j < pl; j++) {
                                if (p[j].getAttribute("name").toLowerCase() != "movie") {
                                    par[p[j].getAttribute("name")] = p[j].getAttribute("value");
                                }
                            }
                            showExpressInstall(att, par, id, cb);
                        } else { // Flash Player and SWF version mismatch or an older Webkit engine that ignores the HTML object element's nested param elements: display alternative content instead of SWF
                            displayAltContent(obj);
                            if (cb) {
                                cb(cbObj);
                            }
                        }
                    }
                } else { // if no Flash Player is installed or the fp version cannot be detected we let the HTML object element do its job (either show a SWF or alternative content)
                    setVisibility(id, true);
                    if (cb) {
                        var o = getObjectById(id); // test whether there is an HTML object element or not
                        if (o && typeof o.SetVariable != UNDEF) {
                            cbObj.success = true;
                            cbObj.ref = o;
                        }
                        cb(cbObj);
                    }
                }
            }
        }
    }
    
    function getObjectById(objectIdStr){
        var r = null;
        var o = getElementById(objectIdStr);
        if (o && o.nodeName == "OBJECT") {
            if (typeof o.SetVariable != UNDEF) {
                r = o;
            } else {
                var n = o.getElementsByTagName(OBJECT)[0];
                if (n) {
                    r = n;
                }
            }
        }
        return r;
    }
    
    /* Requirements for Adobe Express Install
     - only one instance can be active at a time
     - fp 6.0.65 or higher
     - Win/Mac OS only
     - no Webkit engines older than version 312
     */
    function canExpressInstall(){
        return !isExpressInstallActive && hasPlayerVersion("6.0.65") && (ua.win || ua.mac) && !(ua.wk && ua.wk < 312);
    }
    
    /* Show the Adobe Express Install dialog
     - Reference: http://www.adobe.com/cfusion/knowledgebase/index.cfm?id=6a253b75
     */
    function showExpressInstall(att, par, replaceElemIdStr, callbackFn){
        isExpressInstallActive = true;
        storedCallbackFn = callbackFn || null;
        storedCallbackObj = {
            success: false,
            id: replaceElemIdStr
        };
        var obj = getElementById(replaceElemIdStr);
        if (obj) {
            if (obj.nodeName == "OBJECT") { // static publishing
                storedAltContent = abstractAltContent(obj);
                storedAltContentId = null;
            } else { // dynamic publishing
                storedAltContent = obj;
                storedAltContentId = replaceElemIdStr;
            }
            att.id = EXPRESS_INSTALL_ID;
            if (typeof att.width == UNDEF || (!/%$/.test(att.width) && parseInt(att.width, 10) < 310)) {
                att.width = "310";
            }
            if (typeof att.height == UNDEF || (!/%$/.test(att.height) && parseInt(att.height, 10) < 137)) {
                att.height = "137";
            }
            doc.title = doc.title.slice(0, 47) + " - Flash Player Installation";
            var pt = ua.ie && ua.win ? "ActiveX" : "PlugIn", fv = "MMredirectURL=" + win.location.toString().replace(/&/g, "%26") + "&MMplayerType=" + pt + "&MMdoctitle=" + doc.title;
            if (typeof par.flashvars != UNDEF) {
                par.flashvars += "&" + fv;
            } else {
                par.flashvars = fv;
            }
            // IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
            // because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
            if (ua.ie && ua.win && obj.readyState != 4) {
                var newObj = createElement("div");
                replaceElemIdStr += "SWFObjectNew";
                newObj.setAttribute("id", replaceElemIdStr);
                obj.parentNode.insertBefore(newObj, obj); // insert placeholder div that will be replaced by the object element that loads expressinstall.swf
                obj.style.display = "none";
                (function(){
                    if (obj.readyState == 4) {
                        obj.parentNode.removeChild(obj);
                    } else {
                        setTimeout(arguments.callee, 10);
                    }
                })();
            }
            createSWF(att, par, replaceElemIdStr);
        }
    }
    
    /* Functions to abstract and display alternative content
     */
    function displayAltContent(obj){
        if (ua.ie && ua.win && obj.readyState != 4) {
            // IE only: when a SWF is loading (AND: not available in cache) wait for the readyState of the object element to become 4 before removing it,
            // because you cannot properly cancel a loading SWF file without breaking browser load references, also obj.onreadystatechange doesn't work
            var el = createElement("div");
            obj.parentNode.insertBefore(el, obj); // insert placeholder div that will be replaced by the alternative content
            el.parentNode.replaceChild(abstractAltContent(obj), el);
            obj.style.display = "none";
            (function(){
                if (obj.readyState == 4) {
                    obj.parentNode.removeChild(obj);
                } else {
                    setTimeout(arguments.callee, 10);
                }
            })();
        } else {
            obj.parentNode.replaceChild(abstractAltContent(obj), obj);
        }
    }
    
    function abstractAltContent(obj){
        var ac = createElement("div");
        if (ua.win && ua.ie) {
            ac.innerHTML = obj.innerHTML;
        } else {
            var nestedObj = obj.getElementsByTagName(OBJECT)[0];
            if (nestedObj) {
                var c = nestedObj.childNodes;
                if (c) {
                    var cl = c.length;
                    for (var i = 0; i < cl; i++) {
                        if (!(c[i].nodeType == 1 && c[i].nodeName == "PARAM") && !(c[i].nodeType == 8)) {
                            ac.appendChild(c[i].cloneNode(true));
                        }
                    }
                }
            }
        }
        return ac;
    }
    
    /* Cross-browser dynamic SWF creation
     */
    function createSWF(attObj, parObj, id){
        var r, el = getElementById(id);
        if (ua.wk && ua.wk < 312) {
            return r;
        }
        if (el) {
            if (typeof attObj.id == UNDEF) { // if no 'id' is defined for the object element, it will inherit the 'id' from the alternative content
                attObj.id = id;
            }
            if (ua.ie && ua.win) { // Internet Explorer + the HTML object element + W3C DOM methods do not combine: fall back to outerHTML
                var att = "";
                for (var i in attObj) {
                    if (attObj[i] != Object.prototype[i]) { // filter out prototype additions from other potential libraries
                        if (i.toLowerCase() == "data") {
                            parObj.movie = attObj[i];
                        } else if (i.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
                            att += ' class="' + attObj[i] + '"';
                        } else if (i.toLowerCase() != "classid") {
                            att += ' ' + i + '="' + attObj[i] + '"';
                        }
                    }
                }
                var par = "";
                for (var j in parObj) {
                    if (parObj[j] != Object.prototype[j]) { // filter out prototype additions from other potential libraries
                        par += '<param name="' + j + '" value="' + parObj[j] + '" />';
                    }
                }
                el.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + att + '>' + par + '</object>';
                objIdArr[objIdArr.length] = attObj.id; // stored to fix object 'leaks' on unload (dynamic publishing only)
                r = getElementById(attObj.id);
            } else { // well-behaving browsers
                var o = createElement(OBJECT);
                o.setAttribute("type", FLASH_MIME_TYPE);
                for (var m in attObj) {
                    if (attObj[m] != Object.prototype[m]) { // filter out prototype additions from other potential libraries
                        if (m.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
                            o.setAttribute("class", attObj[m]);
                        } else if (m.toLowerCase() != "classid") { // filter out IE specific attribute
                            o.setAttribute(m, attObj[m]);
                        }
                    }
                }
                for (var n in parObj) {
                    if (parObj[n] != Object.prototype[n] && n.toLowerCase() != "movie") { // filter out prototype additions from other potential libraries and IE specific param element
                        createObjParam(o, n, parObj[n]);
                    }
                }
                el.parentNode.replaceChild(o, el);
                r = o;
            }
        }
        return r;
    }
    
    function createObjParam(el, pName, pValue){
        var p = createElement("param");
        p.setAttribute("name", pName);
        p.setAttribute("value", pValue);
        el.appendChild(p);
    }
    
    /* Cross-browser SWF removal
     - Especially needed to safely and completely remove a SWF in Internet Explorer
     */
    function removeSWF(id){
        var obj = getElementById(id);
        if (obj && obj.nodeName == "OBJECT") {
            if (ua.ie && ua.win) {
                obj.style.display = "none";
                (function(){
                    if (obj.readyState == 4) {
                        removeObjectInIE(id);
                    } else {
                        setTimeout(arguments.callee, 10);
                    }
                })();
            } else {
                obj.parentNode.removeChild(obj);
            }
        }
    }
    
    function removeObjectInIE(id){
        var obj = getElementById(id);
        if (obj) {
            for (var i in obj) {
                if (typeof obj[i] == "function") {
                    obj[i] = null;
                }
            }
            obj.parentNode.removeChild(obj);
        }
    }
    
    /* Functions to optimize JavaScript compression
     */
    function getElementById(id){
        var el = null;
        try {
            el = doc.getElementById(id);
        } catch (e) {
        }
        return el;
    }
    
    function createElement(el){
        return doc.createElement(el);
    }
    
    /* Updated attachEvent function for Internet Explorer
     - Stores attachEvent information in an Array, so on unload the detachEvent functions can be called to avoid memory leaks
     */
    function addListener(target, eventType, fn){
        target.attachEvent(eventType, fn);
        listenersArr[listenersArr.length] = [target, eventType, fn];
    }
    
    /* Flash Player and SWF content version matching
     */
    function hasPlayerVersion(rv){
        var pv = ua.pv, v = rv.split(".");
        v[0] = parseInt(v[0], 10);
        v[1] = parseInt(v[1], 10) || 0; // supports short notation, e.g. "9" instead of "9.0.0"
        v[2] = parseInt(v[2], 10) || 0;
        return (pv[0] > v[0] || (pv[0] == v[0] && pv[1] > v[1]) || (pv[0] == v[0] && pv[1] == v[1] && pv[2] >= v[2])) ? true : false;
    }
    
    /* Cross-browser dynamic CSS creation
     - Based on Bobby van der Sluis' solution: http://www.bobbyvandersluis.com/articles/dynamicCSS.php
     */
    function createCSS(sel, decl, media, newStyle){
        if (ua.ie && ua.mac) {
            return;
        }
        var h = doc.getElementsByTagName("head")[0];
        if (!h) {
            return;
        } // to also support badly authored HTML pages that lack a head element
        var m = (media && typeof media == "string") ? media : "screen";
        if (newStyle) {
            dynamicStylesheet = null;
            dynamicStylesheetMedia = null;
        }
        if (!dynamicStylesheet || dynamicStylesheetMedia != m) {
            // create dynamic stylesheet + get a global reference to it
            var s = createElement("style");
            s.setAttribute("type", "text/css");
            s.setAttribute("media", m);
            dynamicStylesheet = h.appendChild(s);
            if (ua.ie && ua.win && typeof doc.styleSheets != UNDEF && doc.styleSheets.length > 0) {
                dynamicStylesheet = doc.styleSheets[doc.styleSheets.length - 1];
            }
            dynamicStylesheetMedia = m;
        }
        // add style rule
        if (ua.ie && ua.win) {
            if (dynamicStylesheet && typeof dynamicStylesheet.addRule == OBJECT) {
                dynamicStylesheet.addRule(sel, decl);
            }
        } else {
            if (dynamicStylesheet && typeof doc.createTextNode != UNDEF) {
                dynamicStylesheet.appendChild(doc.createTextNode(sel + " {" + decl + "}"));
            }
        }
    }
    
    function setVisibility(id, isVisible){
        if (!autoHideShow) {
            return;
        }
        var v = isVisible ? "visible" : "hidden";
        if (isDomLoaded && getElementById(id)) {
            getElementById(id).style.visibility = v;
        } else {
            createCSS("#" + id, "visibility:" + v);
        }
    }
    
    /* Filter to avoid XSS attacks
     */
    function urlEncodeIfNecessary(s){
        var regex = /[\\\"<>\.;]/;
        var hasBadChars = regex.exec(s) != null;
        return hasBadChars && typeof encodeURIComponent != UNDEF ? encodeURIComponent(s) : s;
    }
    
    /* Release memory to avoid memory leaks caused by closures, fix hanging audio/video threads and force open sockets/NetConnections to disconnect (Internet Explorer only)
     */
    var cleanup = function(){
        if (ua.ie && ua.win) {
            window.attachEvent("onunload", function(){
                // remove listeners to avoid memory leaks
                var ll = listenersArr.length;
                for (var i = 0; i < ll; i++) {
                    listenersArr[i][0].detachEvent(listenersArr[i][1], listenersArr[i][2]);
                }
                // cleanup dynamically embedded objects to fix audio/video threads and force open sockets and NetConnections to disconnect
                var il = objIdArr.length;
                for (var j = 0; j < il; j++) {
                    removeSWF(objIdArr[j]);
                }
                // cleanup library's main closures to avoid memory leaks
                for (var k in ua) {
                    ua[k] = null;
                }
                ua = null;
                for (var l in swfobject) {
                    swfobject[l] = null;
                }
                swfobject = null;
            });
        }
    }();
    
    return {
        /* Public API
         - Reference: http://code.google.com/p/swfobject/wiki/documentation
         */
        registerObject: function(objectIdStr, swfVersionStr, xiSwfUrlStr, callbackFn){
            if (ua.w3 && objectIdStr && swfVersionStr) {
                var regObj = {};
                regObj.id = objectIdStr;
                regObj.swfVersion = swfVersionStr;
                regObj.expressInstall = xiSwfUrlStr;
                regObj.callbackFn = callbackFn;
                regObjArr[regObjArr.length] = regObj;
                setVisibility(objectIdStr, false);
            } else if (callbackFn) {
                callbackFn({
                    success: false,
                    id: objectIdStr
                });
            }
        },
        
        getObjectById: function(objectIdStr){
            if (ua.w3) {
                return getObjectById(objectIdStr);
            }
        },
        
        embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj, callbackFn){
            var callbackObj = {
                success: false,
                id: replaceElemIdStr
            };
            if (ua.w3 && !(ua.wk && ua.wk < 312) && swfUrlStr && replaceElemIdStr && widthStr && heightStr && swfVersionStr) {
                setVisibility(replaceElemIdStr, false);
                addDomLoadEvent(function(){
                    widthStr += ""; // auto-convert to string
                    heightStr += "";
                    var att = {};
                    if (attObj && typeof attObj === OBJECT) {
                        for (var i in attObj) { // copy object to avoid the use of references, because web authors often reuse attObj for multiple SWFs
                            att[i] = attObj[i];
                        }
                    }
                    att.data = swfUrlStr;
                    att.width = widthStr;
                    att.height = heightStr;
                    var par = {};
                    if (parObj && typeof parObj === OBJECT) {
                        for (var j in parObj) { // copy object to avoid the use of references, because web authors often reuse parObj for multiple SWFs
                            par[j] = parObj[j];
                        }
                    }
                    if (flashvarsObj && typeof flashvarsObj === OBJECT) {
                        for (var k in flashvarsObj) { // copy object to avoid the use of references, because web authors often reuse flashvarsObj for multiple SWFs
                            if (typeof par.flashvars != UNDEF) {
                                par.flashvars += "&" + k + "=" + flashvarsObj[k];
                            } else {
                                par.flashvars = k + "=" + flashvarsObj[k];
                            }
                        }
                    }
                    if (hasPlayerVersion(swfVersionStr)) { // create SWF
                        var obj = createSWF(att, par, replaceElemIdStr);
                        if (att.id == replaceElemIdStr) {
                            setVisibility(replaceElemIdStr, true);
                        }
                        callbackObj.success = true;
                        callbackObj.ref = obj;
                    } else if (xiSwfUrlStr && canExpressInstall()) { // show Adobe Express Install
                        att.data = xiSwfUrlStr;
                        showExpressInstall(att, par, replaceElemIdStr, callbackFn);
                        return;
                    } else { // show alternative content
                        setVisibility(replaceElemIdStr, true);
                    }
                    if (callbackFn) {
                        callbackFn(callbackObj);
                    }
                });
            } else if (callbackFn) {
                callbackFn(callbackObj);
            }
        },
        
        switchOffAutoHideShow: function(){
            autoHideShow = false;
        },
        
        ua: ua,
        
        getFlashPlayerVersion: function(){
            return {
                major: ua.pv[0],
                minor: ua.pv[1],
                release: ua.pv[2]
            };
        },
        
        hasFlashPlayerVersion: hasPlayerVersion,
        
        createSWF: function(attObj, parObj, replaceElemIdStr){
            if (ua.w3) {
                return createSWF(attObj, parObj, replaceElemIdStr);
            } else {
                return undefined;
            }
        },
        
        showExpressInstall: function(att, par, replaceElemIdStr, callbackFn){
            if (ua.w3 && canExpressInstall()) {
                showExpressInstall(att, par, replaceElemIdStr, callbackFn);
            }
        },
        
        removeSWF: function(objElemIdStr){
            if (ua.w3) {
                removeSWF(objElemIdStr);
            }
        },
        
        createCSS: function(selStr, declStr, mediaStr, newStyleBoolean){
            if (ua.w3) {
                createCSS(selStr, declStr, mediaStr, newStyleBoolean);
            }
        },
        
        addDomLoadEvent: addDomLoadEvent,
        
        addLoadEvent: addLoadEvent,
        
        getQueryParamValue: function(param){
            var q = doc.location.search || doc.location.hash;
            if (q) {
                if (/\?/.test(q)) {
                    q = q.split("?")[1];
                } // strip question mark
                if (param == null) {
                    return urlEncodeIfNecessary(q);
                }
                var pairs = q.split("&");
                for (var i = 0; i < pairs.length; i++) {
                    if (pairs[i].substring(0, pairs[i].indexOf("=")) == param) {
                        return urlEncodeIfNecessary(pairs[i].substring((pairs[i].indexOf("=") + 1)));
                    }
                }
            }
            return "";
        },
        
        // For internal usage only
        expressInstallCallback: function(){
            if (isExpressInstallActive) {
                var obj = getElementById(EXPRESS_INSTALL_ID);
                if (obj && storedAltContent) {
                    obj.parentNode.replaceChild(storedAltContent, obj);
                    if (storedAltContentId) {
                        setVisibility(storedAltContentId, true);
                        if (ua.ie && ua.win) {
                            storedAltContent.style.display = "block";
                        }
                    }
                    if (storedCallbackFn) {
                        storedCallbackFn(storedCallbackObj);
                    }
                }
                isExpressInstallActive = false;
            }
        }
    };
}();

/*	Unobtrusive Flash Objects (UFO) v3.22 <http://www.bobbyvandersluis.com/ufo/>
	Copyright 2005-2007 Bobby van der Sluis
	This software is licensed under the CC-GNU LGPL <http://creativecommons.org/licenses/LGPL/2.1/>
*/

var UFO = {
	req: ["movie", "width", "height", "majorversion", "build"],
	opt: ["play", "loop", "menu", "quality", "scale", "salign", "wmode", "bgcolor", "base", "flashvars", "devicefont", "allowscriptaccess", "seamlesstabbing", "allowfullscreen", "allownetworking"],
	optAtt: ["id", "name", "align"],
	optExc: ["swliveconnect"],
	ximovie: "ufo.swf",
	xiwidth: "215",
	xiheight: "138",
	ua: navigator.userAgent.toLowerCase(),
	pluginType: "",
	fv: [0,0],
	foList: [],
		
	create: function(FO, id) {
		if (!UFO.uaHas("w3cdom") || UFO.uaHas("ieMac")) return;
		UFO.getFlashVersion();
		UFO.foList[id] = UFO.updateFO(FO);
		UFO.createCSS("#" + id, "visibility:hidden;");
		UFO.domLoad(id);
	},

	updateFO: function(FO) {
		if (typeof FO.xi != "undefined" && FO.xi == "true") {
			if (typeof FO.ximovie == "undefined") FO.ximovie = UFO.ximovie;
			if (typeof FO.xiwidth == "undefined") FO.xiwidth = UFO.xiwidth;
			if (typeof FO.xiheight == "undefined") FO.xiheight = UFO.xiheight;
		}
		FO.mainCalled = false;
		return FO;
	},

	domLoad: function(id) {
		var _t = setInterval(function() {
			if ((document.getElementsByTagName("body")[0] != null || document.body != null) && document.getElementById(id) != null) {
				UFO.main(id);
				clearInterval(_t);
			}
		}, 250);
		if (typeof document.addEventListener != "undefined") {
			document.addEventListener("DOMContentLoaded", function() { UFO.main(id); clearInterval(_t); } , null); // Gecko, Opera 9+
		}
	},

	main: function(id) {
		var _fo = UFO.foList[id];
		if (_fo.mainCalled) return;
		UFO.foList[id].mainCalled = true;
		document.getElementById(id).style.visibility = "hidden";
		if (UFO.hasRequired(id)) {
			if (UFO.hasFlashVersion(parseInt(_fo.majorversion, 10), parseInt(_fo.build, 10))) {
				if (typeof _fo.setcontainercss != "undefined" && _fo.setcontainercss == "true") UFO.setContainerCSS(id);
				UFO.writeSWF(id);
			}
			else if (_fo.xi == "true" && UFO.hasFlashVersion(6, 65)) {
				UFO.createDialog(id);
			}
		}
		document.getElementById(id).style.visibility = "visible";
	},
	
	createCSS: function(selector, declaration) {
		var _h = document.getElementsByTagName("head")[0]; 
		var _s = UFO.createElement("style");
		if (!UFO.uaHas("ieWin")) _s.appendChild(document.createTextNode(selector + " {" + declaration + "}")); // bugs in IE/Win
		_s.setAttribute("type", "text/css");
		_s.setAttribute("media", "screen"); 
		_h.appendChild(_s);
		if (UFO.uaHas("ieWin") && document.styleSheets && document.styleSheets.length > 0) {
			var _ls = document.styleSheets[document.styleSheets.length - 1];
			if (typeof _ls.addRule == "object") _ls.addRule(selector, declaration);
		}
	},
	
	setContainerCSS: function(id) {
		var _fo = UFO.foList[id];
		var _w = /%/.test(_fo.width) ? "" : "px";
		var _h = /%/.test(_fo.height) ? "" : "px";
		UFO.createCSS("#" + id, "width:" + _fo.width + _w +"; height:" + _fo.height + _h +";");
		if (_fo.width == "100%") {
			UFO.createCSS("body", "margin-left:0; margin-right:0; padding-left:0; padding-right:0;");
		}
		if (_fo.height == "100%") {
			UFO.createCSS("html", "height:100%; overflow:hidden;");
			UFO.createCSS("body", "margin-top:0; margin-bottom:0; padding-top:0; padding-bottom:0; height:100%;");
		}
	},

	createElement: function(el) {
		return (UFO.uaHas("xml") && typeof document.createElementNS != "undefined") ?  document.createElementNS("http://www.w3.org/1999/xhtml", el) : document.createElement(el);
	},

	createObjParam: function(el, aName, aValue) {
		var _p = UFO.createElement("param");
		_p.setAttribute("name", aName);	
		_p.setAttribute("value", aValue);
		el.appendChild(_p);
	},

	uaHas: function(ft) {
		var _u = UFO.ua;
		switch(ft) {
			case "w3cdom":
				return (typeof document.getElementById != "undefined" && typeof document.getElementsByTagName != "undefined" && (typeof document.createElement != "undefined" || typeof document.createElementNS != "undefined"));
			case "xml":
				var _m = document.getElementsByTagName("meta");
				var _l = _m.length;
				for (var i = 0; i < _l; i++) {
					if (/content-type/i.test(_m[i].getAttribute("http-equiv")) && /xml/i.test(_m[i].getAttribute("content"))) return true;
				}
				return false;
			case "ieMac":
				return /msie/.test(_u) && !/opera/.test(_u) && /mac/.test(_u);
			case "ieWin":
				return /msie/.test(_u) && !/opera/.test(_u) && /win/.test(_u);
			case "gecko":
				return /gecko/.test(_u) && !/applewebkit/.test(_u);
			case "opera":
				return /opera/.test(_u);
			case "safari":
				return /applewebkit/.test(_u);
			default:
				return false;
		}
	},
	
	getFlashVersion: function() {
		if (UFO.fv[0] != 0) return;  
		if (navigator.plugins && typeof navigator.plugins["Shockwave Flash"] == "object") {
			UFO.pluginType = "npapi";
			var _d = navigator.plugins["Shockwave Flash"].description;
			if (typeof _d != "undefined") {
				_d = _d.replace(/^.*\s+(\S+\s+\S+$)/, "$1");
				var _m = parseInt(_d.replace(/^(.*)\..*$/, "$1"), 10);
				var _r = /r/.test(_d) ? parseInt(_d.replace(/^.*r(.*)$/, "$1"), 10) : 0;
				UFO.fv = [_m, _r];
			}
		}
		else if (window.ActiveXObject) {
			UFO.pluginType = "ax";
			try { // avoid fp 6 crashes
				var _a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
			}
			catch(e) {
				try { 
					var _a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
					UFO.fv = [6, 0];
					_a.AllowScriptAccess = "always"; // throws if fp < 6.47 
				}
				catch(e) {
					if (UFO.fv[0] == 6) return;
				}
				try {
					var _a = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				}
				catch(e) {}
			}
			if (typeof _a == "object") {
				var _d = _a.GetVariable("$version"); // bugs in fp 6.21/6.23
				if (typeof _d != "undefined") {
					_d = _d.replace(/^\S+\s+(.*)$/, "$1").split(",");
					UFO.fv = [parseInt(_d[0], 10), parseInt(_d[2], 10)];
				}
			}
		}
	},

	hasRequired: function(id) {
		var _l = UFO.req.length;
		for (var i = 0; i < _l; i++) {
			if (typeof UFO.foList[id][UFO.req[i]] == "undefined") return false;
		}
		return true;
	},
	
	hasFlashVersion: function(major, release) {
		return (UFO.fv[0] > major || (UFO.fv[0] == major && UFO.fv[1] >= release)) ? true : false;
	},

	writeSWF: function(id) {
		var _fo = UFO.foList[id];
		var _e = document.getElementById(id);
		if (UFO.pluginType == "npapi") {
			if (UFO.uaHas("gecko") || UFO.uaHas("xml")) {
				while(_e.hasChildNodes()) {
					_e.removeChild(_e.firstChild);
				}
				var _obj = UFO.createElement("object");
				_obj.setAttribute("type", "application/x-shockwave-flash");
				_obj.setAttribute("data", _fo.movie);
				_obj.setAttribute("width", _fo.width);
				_obj.setAttribute("height", _fo.height);
				var _l = UFO.optAtt.length;
				for (var i = 0; i < _l; i++) {
					if (typeof _fo[UFO.optAtt[i]] != "undefined") _obj.setAttribute(UFO.optAtt[i], _fo[UFO.optAtt[i]]);
				}
				var _o = UFO.opt.concat(UFO.optExc);
				var _l = _o.length;
				for (var i = 0; i < _l; i++) {
					if (typeof _fo[_o[i]] != "undefined") UFO.createObjParam(_obj, _o[i], _fo[_o[i]]);
				}
				_e.appendChild(_obj);
			}
			else {
				var _emb = "";
				var _o = UFO.opt.concat(UFO.optAtt).concat(UFO.optExc);
				var _l = _o.length;
				for (var i = 0; i < _l; i++) {
					if (typeof _fo[_o[i]] != "undefined") _emb += ' ' + _o[i] + '="' + _fo[_o[i]] + '"';
				}
				_e.innerHTML = '<embed type="application/x-shockwave-flash" src="' + _fo.movie + '" width="' + _fo.width + '" height="' + _fo.height + '" pluginspage="http://www.macromedia.com/go/getflashplayer"' + _emb + '></embed>';
			}
		}
		else if (UFO.pluginType == "ax") {
			var _objAtt = "";
			var _l = UFO.optAtt.length;
			for (var i = 0; i < _l; i++) {
				if (typeof _fo[UFO.optAtt[i]] != "undefined") _objAtt += ' ' + UFO.optAtt[i] + '="' + _fo[UFO.optAtt[i]] + '"';
			}
			var _objPar = "";
			var _l = UFO.opt.length;
			for (var i = 0; i < _l; i++) {
				if (typeof _fo[UFO.opt[i]] != "undefined") _objPar += '<param name="' + UFO.opt[i] + '" value="' + _fo[UFO.opt[i]] + '" />';
			}
			var _p = window.location.protocol == "https:" ? "https:" : "http:";
			_e.innerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + _objAtt + ' width="' + _fo.width + '" height="' + _fo.height + '" codebase="' + _p + '//download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=' + _fo.majorversion + ',0,' + _fo.build + ',0"><param name="movie" value="' + _fo.movie + '" />' + _objPar + '</object>';
		}
	},
		
	createDialog: function(id) {
		var _fo = UFO.foList[id];
		UFO.createCSS("html", "height:100%; overflow:hidden;");
		UFO.createCSS("body", "height:100%; overflow:hidden;");
		UFO.createCSS("#xi-con", "position:absolute; left:0; top:0; z-index:1000; width:100%; height:100%; background-color:#fff; filter:alpha(opacity:75); opacity:0.75;");
		UFO.createCSS("#xi-dia", "position:absolute; left:50%; top:50%; margin-left: -" + Math.round(parseInt(_fo.xiwidth, 10) / 2) + "px; margin-top: -" + Math.round(parseInt(_fo.xiheight, 10) / 2) + "px; width:" + _fo.xiwidth + "px; height:" + _fo.xiheight + "px;");
		var _b = document.getElementsByTagName("body")[0];
		var _c = UFO.createElement("div");
		_c.setAttribute("id", "xi-con");
		var _d = UFO.createElement("div");
		_d.setAttribute("id", "xi-dia");
		_c.appendChild(_d);
		_b.appendChild(_c);
		var _mmu = window.location;
		if (UFO.uaHas("xml") && UFO.uaHas("safari")) {
			var _mmd = document.getElementsByTagName("title")[0].firstChild.nodeValue = document.getElementsByTagName("title")[0].firstChild.nodeValue.slice(0, 47) + " - Flash Player Installation";
		}
		else {
			var _mmd = document.title = document.title.slice(0, 47) + " - Flash Player Installation";
		}
		var _mmp = UFO.pluginType == "ax" ? "ActiveX" : "PlugIn";
		var _uc = typeof _fo.xiurlcancel != "undefined" ? "&xiUrlCancel=" + _fo.xiurlcancel : "";
		var _uf = typeof _fo.xiurlfailed != "undefined" ? "&xiUrlFailed=" + _fo.xiurlfailed : "";
		UFO.foList["xi-dia"] = { movie:_fo.ximovie, width:_fo.xiwidth, height:_fo.xiheight, majorversion:"6", build:"65", flashvars:"MMredirectURL=" + _mmu + "&MMplayerType=" + _mmp + "&MMdoctitle=" + _mmd + _uc + _uf };
		UFO.writeSWF("xi-dia");
	},

	expressInstallCallback: function() {
		var _b = document.getElementsByTagName("body")[0];
		var _c = document.getElementById("xi-con");
		_b.removeChild(_c);
		UFO.createCSS("body", "height:auto; overflow:auto;");
		UFO.createCSS("html", "height:auto; overflow:auto;");
	},

	cleanupIELeaks: function() {
		var _o = document.getElementsByTagName("object");
		var _l = _o.length
		for (var i = 0; i < _l; i++) {
			_o[i].style.display = "none";
			for (var x in _o[i]) {
				if (typeof _o[i][x] == "function") {
					_o[i][x] = null;
				}
			}
		}
	}

};

if (typeof window.attachEvent != "undefined" && UFO.uaHas("ieWin")) {
	window.attachEvent("onunload", UFO.cleanupIELeaks);
}


(function(E,u){function Fa(a,b,d){if(d===u&&a.nodeType===1){d="data-"+b.replace(pb,"$1-$2").toLowerCase();d=a.getAttribute(d);if(typeof d==="string"){try{d=d==="true"?true:d==="false"?false:d==="null"?null:!c.isNaN(d)?parseFloat(d):qb.test(d)?c.parseJSON(d):d}catch(e){}c.data(a,b,d)}else d=u}return d}function ra(a){for(var b in a)if(b!=="toJSON")return false;return true}function Ga(a,b,d){var e=b+"defer",f=b+"queue",g=b+"mark",i=c.data(a,e,u,true);if(i&&(d==="queue"||!c.data(a,f,u,true))&&(d==="mark"||
!c.data(a,g,u,true)))setTimeout(function(){if(!c.data(a,f,u,true)&&!c.data(a,g,u,true)){c.removeData(a,e,true);i.resolve()}},0)}function V(){return false}function ia(){return true}function Ha(a,b,d){var e=c.extend({},d[0]);e.type=a;e.originalEvent={};e.liveFired=u;c.event.handle.call(b,e);e.isDefaultPrevented()&&d[0].preventDefault()}function rb(a){var b,d,e,f,g,i,l,m,o,s,A,G=[];f=[];g=c._data(this,"events");if(!(a.liveFired===this||!g||!g.live||a.target.disabled||a.button&&a.type==="click")){if(a.namespace)A=
RegExp("(^|\\.)"+a.namespace.split(".").join("\\.(?:.*\\.)?")+"(\\.|$)");a.liveFired=this;var F=g.live.slice(0);for(l=0;l<F.length;l++){g=F[l];g.origType.replace(sa,"")===a.type?f.push(g.selector):F.splice(l--,1)}f=c(a.target).closest(f,a.currentTarget);m=0;for(o=f.length;m<o;m++){s=f[m];for(l=0;l<F.length;l++){g=F[l];if(s.selector===g.selector&&(!A||A.test(g.namespace))&&!s.elem.disabled){i=s.elem;e=null;if(g.preType==="mouseenter"||g.preType==="mouseleave"){a.type=g.preType;if((e=c(a.relatedTarget).closest(g.selector)[0])&&
c.contains(i,e))e=i}if(!e||e!==i)G.push({elem:i,handleObj:g,level:s.level})}}}m=0;for(o=G.length;m<o;m++){f=G[m];if(d&&f.level>d)break;a.currentTarget=f.elem;a.data=f.handleObj.data;a.handleObj=f.handleObj;A=f.handleObj.origHandler.apply(f.elem,arguments);if(A===false||a.isPropagationStopped()){d=f.level;if(A===false)b=false;if(a.isImmediatePropagationStopped())break}}return b}}function ja(a,b){return(a&&a!=="*"?a+".":"")+b.replace(sb,"`").replace(tb,"&")}function Ia(a,b,d){b=b||0;if(c.isFunction(b))return c.grep(a,
function(f,g){return!!b.call(f,g,f)===d});else if(b.nodeType)return c.grep(a,function(f){return f===b===d});else if(typeof b==="string"){var e=c.grep(a,function(f){return f.nodeType===1});if(ub.test(b))return c.filter(b,e,!d);else b=c.filter(b,e)}return c.grep(a,function(f){return c.inArray(f,b)>=0===d})}function Ja(a,b){if(!(b.nodeType!==1||!c.hasData(a))){var d=c.expando,e=c.data(a),f=c.data(b,e);if(e=e[d]){var g=e.events;f=f[d]=c.extend({},e);if(g){delete f.handle;f.events={};for(var i in g){d=
0;for(e=g[i].length;d<e;d++)c.event.add(b,i+(g[i][d].namespace?".":"")+g[i][d].namespace,g[i][d],g[i][d].data)}}}}}function Ka(a,b){var d;if(b.nodeType===1){b.clearAttributes&&b.clearAttributes();b.mergeAttributes&&b.mergeAttributes(a);d=b.nodeName.toLowerCase();if(d==="object")b.outerHTML=a.outerHTML;else if(d==="input"&&(a.type==="checkbox"||a.type==="radio")){if(a.checked)b.defaultChecked=b.checked=a.checked;if(b.value!==a.value)b.value=a.value}else if(d==="option")b.selected=a.defaultSelected;
else if(d==="input"||d==="textarea")b.defaultValue=a.defaultValue;b.removeAttribute(c.expando)}}function ka(a){return"getElementsByTagName"in a?a.getElementsByTagName("*"):"querySelectorAll"in a?a.querySelectorAll("*"):[]}function La(a){if(a.type==="checkbox"||a.type==="radio")a.defaultChecked=a.checked}function Ma(a){if(c.nodeName(a,"input"))La(a);else"getElementsByTagName"in a&&c.grep(a.getElementsByTagName("input"),La)}function vb(a,b){b.src?c.ajax({url:b.src,async:false,dataType:"script"}):c.globalEval((b.text||
b.textContent||b.innerHTML||"").replace(wb,"/*$0*/"));b.parentNode&&b.parentNode.removeChild(b)}function Na(a,b,d){var e=b==="width"?a.offsetWidth:a.offsetHeight,f=b==="width"?xb:yb;if(e>0){d!=="border"&&c.each(f,function(){d||(e-=parseFloat(c.css(a,"padding"+this))||0);if(d==="margin")e+=parseFloat(c.css(a,d+this))||0;else e-=parseFloat(c.css(a,"border"+this+"Width"))||0});return e+"px"}e=aa(a,b,b);if(e<0||e==null)e=a.style[b]||0;e=parseFloat(e)||0;d&&c.each(f,function(){e+=parseFloat(c.css(a,"padding"+
this))||0;if(d!=="padding")e+=parseFloat(c.css(a,"border"+this+"Width"))||0;if(d==="margin")e+=parseFloat(c.css(a,d+this))||0});return e+"px"}function Oa(a){return function(b,d){if(typeof b!=="string"){d=b;b="*"}if(c.isFunction(d))for(var e=b.toLowerCase().split(Pa),f=0,g=e.length,i,l;f<g;f++){i=e[f];if(l=/^\+/.test(i))i=i.substr(1)||"*";i=a[i]=a[i]||[];i[l?"unshift":"push"](d)}}}function la(a,b,d,e,f,g){f=f||b.dataTypes[0];g=g||{};g[f]=true;f=a[f];for(var i=0,l=f?f.length:0,m=a===ta,o;i<l&&(m||!o);i++){o=
f[i](b,d,e);if(typeof o==="string")if(!m||g[o])o=u;else{b.dataTypes.unshift(o);o=la(a,b,d,e,o,g)}}if((m||!o)&&!g["*"])o=la(a,b,d,e,"*",g);return o}function ua(a,b,d,e){if(c.isArray(b))c.each(b,function(g,i){d||zb.test(a)?e(a,i):ua(a+"["+(typeof i==="object"||c.isArray(i)?g:"")+"]",i,d,e)});else if(!d&&b!=null&&typeof b==="object")for(var f in b)ua(a+"["+f+"]",b[f],d,e);else e(a,b)}function Qa(){try{return new E.XMLHttpRequest}catch(a){}}function Ra(){setTimeout(Ab,0);return ma=c.now()}function Ab(){ma=
u}function ba(a,b){var d={};c.each(Sa.concat.apply([],Sa.slice(0,b)),function(){d[this]=a});return d}function Ta(a){if(!va[a]){var b=y.body,d=c("<"+a+">").appendTo(b),e=d.css("display");d.remove();if(e==="none"||e===""){if(!Q){Q=y.createElement("iframe");Q.frameBorder=Q.width=Q.height=0}b.appendChild(Q);if(!ca||!Q.createElement){ca=(Q.contentWindow||Q.contentDocument).document;ca.write((y.compatMode==="CSS1Compat"?"<!doctype html>":"")+"<html><body>");ca.close()}d=ca.createElement(a);ca.body.appendChild(d);
e=c.css(d,"display");b.removeChild(Q)}va[a]=e}return va[a]}function wa(a){return c.isWindow(a)?a:a.nodeType===9?a.defaultView||a.parentWindow:false}var y=E.document,Bb=E.navigator,Cb=E.location,c=function(){function a(){if(!b.isReady){try{y.documentElement.doScroll("left")}catch(j){setTimeout(a,1);return}b.ready()}}var b=function(j,t){return new b.fn.init(j,t,f)},d=E.aijQuery,e=E.ai$,f,g=/^(?:[^<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,i=/\S/,l=/^\s+/,m=/\s+$/,o=/\d/,s=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,A=/^[\],:{}\s]*$/,
G=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,F=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,H=/(?:^|:|,)(?:\s*\[)+/g,W=/(webkit)[ \/]([\w.]+)/,M=/(opera)(?:.*version)?[ \/]([\w.]+)/,N=/(msie) ([\w.]+)/,R=/(mozilla)(?:.*? rv:([\w.]+))?/,h=/-([a-z])/ig,k=function(j,t){return t.toUpperCase()},p=Bb.userAgent,r,n,q=Object.prototype.toString,v=Object.prototype.hasOwnProperty,x=Array.prototype.push,B=Array.prototype.slice,O=String.prototype.trim,K=Array.prototype.indexOf,L={};b.fn=b.prototype=
{constructor:b,init:function(j,t,z){var w;if(!j)return this;if(j.nodeType){this.context=this[0]=j;this.length=1;return this}if(j==="body"&&!t&&y.body){this.context=y;this[0]=y.body;this.selector=j;this.length=1;return this}if(typeof j==="string")if((w=j.charAt(0)==="<"&&j.charAt(j.length-1)===">"&&j.length>=3?[null,j,null]:g.exec(j))&&(w[1]||!t))if(w[1]){z=(t=t instanceof b?t[0]:t)?t.ownerDocument||t:y;if(j=s.exec(j))if(b.isPlainObject(t)){j=[y.createElement(j[1])];b.fn.attr.call(j,t,true)}else j=
[z.createElement(j[1])];else{j=b.buildFragment([w[1]],[z]);j=(j.cacheable?b.clone(j.fragment):j.fragment).childNodes}return b.merge(this,j)}else{if((t=y.getElementById(w[2]))&&t.parentNode){if(t.id!==w[2])return z.find(j);this.length=1;this[0]=t}this.context=y;this.selector=j;return this}else return!t||t.jquery?(t||z).find(j):this.constructor(t).find(j);else if(b.isFunction(j))return z.ready(j);if(j.selector!==u){this.selector=j.selector;this.context=j.context}return b.makeArray(j,this)},selector:"",
jquery:"1.6.2",length:0,size:function(){return this.length},toArray:function(){return B.call(this,0)},get:function(j){return j==null?this.toArray():j<0?this[this.length+j]:this[j]},pushStack:function(j,t,z){var w=this.constructor();b.isArray(j)?x.apply(w,j):b.merge(w,j);w.prevObject=this;w.context=this.context;if(t==="find")w.selector=this.selector+(this.selector?" ":"")+z;else if(t)w.selector=this.selector+"."+t+"("+z+")";return w},each:function(j,t){return b.each(this,j,t)},ready:function(j){b.bindReady();
r.done(j);return this},eq:function(j){return j===-1?this.slice(j):this.slice(j,+j+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(B.apply(this,arguments),"slice",B.call(arguments).join(","))},map:function(j){return this.pushStack(b.map(this,function(t,z){return j.call(t,z,t)}))},end:function(){return this.prevObject||this.constructor(null)},push:x,sort:[].sort,splice:[].splice};b.fn.init.prototype=b.fn;b.extend=b.fn.extend=function(){var j,
t,z,w,C,D=arguments[0]||{},I=1,J=arguments.length,S=false;if(typeof D==="boolean"){S=D;D=arguments[1]||{};I=2}if(typeof D!=="object"&&!b.isFunction(D))D={};if(J===I){D=this;--I}for(;I<J;I++)if((j=arguments[I])!=null)for(t in j){z=D[t];w=j[t];if(D!==w)if(S&&w&&(b.isPlainObject(w)||(C=b.isArray(w)))){if(C){C=false;z=z&&b.isArray(z)?z:[]}else z=z&&b.isPlainObject(z)?z:{};D[t]=b.extend(S,z,w)}else if(w!==u)D[t]=w}return D};b.extend({noConflict:function(j){if(E.ai$===b)E.ai$=e;if(j&&E.jQuery===b)E.jQuery=
d;return b},isReady:false,readyWait:1,holdReady:function(j){if(j)b.readyWait++;else b.ready(true)},ready:function(j){if(j===true&&!--b.readyWait||j!==true&&!b.isReady){if(!y.body)return setTimeout(b.ready,1);b.isReady=true;if(!(j!==true&&--b.readyWait>0)){r.resolveWith(y,[b]);b.fn.trigger&&b(y).trigger("ready").unbind("ready")}}},bindReady:function(){if(!r){r=b._Deferred();if(y.readyState==="complete")return setTimeout(b.ready,1);if(y.addEventListener){y.addEventListener("DOMContentLoaded",n,false);
E.addEventListener("load",b.ready,false)}else if(y.attachEvent){y.attachEvent("onreadystatechange",n);E.attachEvent("onload",b.ready);var j=false;try{j=E.frameElement==null}catch(t){}y.documentElement.doScroll&&j&&a()}}},isFunction:function(j){return b.type(j)==="function"},isArray:Array.isArray||function(j){return b.type(j)==="array"},isWindow:function(j){return j&&typeof j==="object"&&"setInterval"in j},isNaN:function(j){return j==null||!o.test(j)||isNaN(j)},type:function(j){return j==null?String(j):
L[q.call(j)]||"object"},isPlainObject:function(j){if(!j||b.type(j)!=="object"||j.nodeType||b.isWindow(j))return false;if(j.constructor&&!v.call(j,"constructor")&&!v.call(j.constructor.prototype,"isPrototypeOf"))return false;for(var t in j);return t===u||v.call(j,t)},isEmptyObject:function(j){for(var t in j)return false;return true},error:function(j){throw j;},parseJSON:function(j){if(typeof j!=="string"||!j)return null;j=b.trim(j);if(E.JSON&&E.JSON.parse)return E.JSON.parse(j);if(A.test(j.replace(G,
"@").replace(F,"]").replace(H,"")))return(new Function("return "+j))();b.error("Invalid JSON: "+j)},parseXML:function(j,t,z){if(E.DOMParser){z=new DOMParser;t=z.parseFromString(j,"text/xml")}else{t=new ActiveXObject("Microsoft.XMLDOM");t.async="false";t.loadXML(j)}z=t.documentElement;if(!z||!z.nodeName||z.nodeName==="parsererror")b.error("Invalid XML: "+j);return t},noop:function(){},globalEval:function(j){if(j&&i.test(j))(E.execScript||function(t){E.eval.call(E,t)})(j)},camelCase:function(j){return j.replace(h,
k)},nodeName:function(j,t){return j.nodeName&&j.nodeName.toUpperCase()===t.toUpperCase()},each:function(j,t,z){var w,C=0,D=j.length,I=D===u||b.isFunction(j);if(z)if(I)for(w in j){if(t.apply(j[w],z)===false)break}else for(;C<D;){if(t.apply(j[C++],z)===false)break}else if(I)for(w in j){if(t.call(j[w],w,j[w])===false)break}else for(;C<D;)if(t.call(j[C],C,j[C++])===false)break;return j},trim:O?function(j){return j==null?"":O.call(j)}:function(j){return j==null?"":j.toString().replace(l,"").replace(m,
"")},makeArray:function(j,t){var z=t||[];if(j!=null){var w=b.type(j);j.length==null||w==="string"||w==="function"||w==="regexp"||b.isWindow(j)?x.call(z,j):b.merge(z,j)}return z},inArray:function(j,t){if(K)return K.call(t,j);for(var z=0,w=t.length;z<w;z++)if(t[z]===j)return z;return-1},merge:function(j,t){var z=j.length,w=0;if(typeof t.length==="number")for(var C=t.length;w<C;w++)j[z++]=t[w];else for(;t[w]!==u;)j[z++]=t[w++];j.length=z;return j},grep:function(j,t,z){var w=[],C;z=!!z;for(var D=0,I=
j.length;D<I;D++){C=!!t(j[D],D);z!==C&&w.push(j[D])}return w},map:function(j,t,z){var w,C,D=[],I=0,J=j.length;if(j instanceof b||J!==u&&typeof J==="number"&&(J>0&&j[0]&&j[J-1]||J===0||b.isArray(j)))for(;I<J;I++){w=t(j[I],I,z);if(w!=null)D[D.length]=w}else for(C in j){w=t(j[C],C,z);if(w!=null)D[D.length]=w}return D.concat.apply([],D)},guid:1,proxy:function(j,t){if(typeof t==="string"){var z=j[t];t=j;j=z}if(!b.isFunction(j))return u;var w=B.call(arguments,2);z=function(){return j.apply(t,w.concat(B.call(arguments)))};
z.guid=j.guid=j.guid||z.guid||b.guid++;return z},access:function(j,t,z,w,C,D){var I=j.length;if(typeof t==="object"){for(var J in t)b.access(j,J,t[J],w,C,z);return j}if(z!==u){w=!D&&w&&b.isFunction(z);for(J=0;J<I;J++)C(j[J],t,w?z.call(j[J],J,C(j[J],t)):z,D);return j}return I?C(j[0],t):u},now:function(){return(new Date).getTime()},uaMatch:function(j){j=j.toLowerCase();j=W.exec(j)||M.exec(j)||N.exec(j)||j.indexOf("compatible")<0&&R.exec(j)||[];return{browser:j[1]||"",version:j[2]||"0"}},sub:function(){function j(z,
w){return new j.fn.init(z,w)}b.extend(true,j,this);j.superclass=this;j.fn=j.prototype=this();j.fn.constructor=j;j.sub=this.sub;j.fn.init=function(z,w){if(w&&w instanceof b&&!(w instanceof j))w=j(w);return b.fn.init.call(this,z,w,t)};j.fn.init.prototype=j.fn;var t=j(y);return j},browser:{}});b.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(j,t){L["[object "+t+"]"]=t.toLowerCase()});p=b.uaMatch(p);if(p.browser){b.browser[p.browser]=true;b.browser.version=p.version}if(b.browser.webkit)b.browser.safari=
true;if(i.test("\u00a0")){l=/^[\s\xA0]+/;m=/[\s\xA0]+$/}f=b(y);if(y.addEventListener)n=function(){y.removeEventListener("DOMContentLoaded",n,false);b.ready()};else if(y.attachEvent)n=function(){if(y.readyState==="complete"){y.detachEvent("onreadystatechange",n);b.ready()}};return b}(),xa="done fail isResolved isRejected promise then always pipe".split(" "),Ua=[].slice;c.extend({_Deferred:function(){var a=[],b,d,e,f={done:function(){if(!e){var g=arguments,i,l,m,o,s;if(b){s=b;b=0}i=0;for(l=g.length;i<
l;i++){m=g[i];o=c.type(m);if(o==="array")f.done.apply(f,m);else o==="function"&&a.push(m)}s&&f.resolveWith(s[0],s[1])}return this},resolveWith:function(g,i){if(!e&&!b&&!d){i=i||[];d=1;try{for(;a[0];)a.shift().apply(g,i)}finally{b=[g,i];d=0}}return this},resolve:function(){f.resolveWith(this,arguments);return this},isResolved:function(){return!!(d||b)},cancel:function(){e=1;a=[];return this}};return f},Deferred:function(a){var b=c._Deferred(),d=c._Deferred(),e;c.extend(b,{then:function(f,g){b.done(f).fail(g);
return this},always:function(){return b.done.apply(b,arguments).fail.apply(this,arguments)},fail:d.done,rejectWith:d.resolveWith,reject:d.resolve,isRejected:d.isResolved,pipe:function(f,g){return c.Deferred(function(i){c.each({done:[f,"resolve"],fail:[g,"reject"]},function(l,m){var o=m[0],s=m[1],A;if(c.isFunction(o))b[l](function(){if((A=o.apply(this,arguments))&&c.isFunction(A.promise))A.promise().then(i.resolve,i.reject);else i[s](A)});else b[l](i[s])})}).promise()},promise:function(f){if(f==null){if(e)return e;
e=f={}}for(var g=xa.length;g--;)f[xa[g]]=b[xa[g]];return f}});b.done(d.cancel).fail(b.cancel);delete b.cancel;a&&a.call(b,b);return b},when:function(a){function b(l){return function(m){d[l]=arguments.length>1?Ua.call(arguments,0):m;--g||i.resolveWith(i,Ua.call(d,0))}}var d=arguments,e=0,f=d.length,g=f,i=f<=1&&a&&c.isFunction(a.promise)?a:c.Deferred();if(f>1){for(;e<f;e++)if(d[e]&&c.isFunction(d[e].promise))d[e].promise().then(b(e),i.reject);else--g;g||i.resolveWith(i,d)}else if(i!==a)i.resolveWith(i,
f?[a]:[]);return i.promise()}});c.support=function(){var a=y.createElement("div"),b=y.documentElement,d,e,f,g,i,l;a.setAttribute("className","t");a.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";d=a.getElementsByTagName("*");e=a.getElementsByTagName("a")[0];if(!d||!d.length||!e)return{};f=y.createElement("select");g=f.appendChild(y.createElement("option"));d=a.getElementsByTagName("input")[0];i={leadingWhitespace:a.firstChild.nodeType===
3,tbody:!a.getElementsByTagName("tbody").length,htmlSerialize:!!a.getElementsByTagName("link").length,style:/top/.test(e.getAttribute("style")),hrefNormalized:e.getAttribute("href")==="/a",opacity:/^0.55$/.test(e.style.opacity),cssFloat:!!e.style.cssFloat,checkOn:d.value==="on",optSelected:g.selected,getSetAttribute:a.className!=="t",submitBubbles:true,changeBubbles:true,focusinBubbles:false,deleteExpando:true,noCloneEvent:true,inlineBlockNeedsLayout:false,shrinkWrapBlocks:false,reliableMarginRight:true};
d.checked=true;i.noCloneChecked=d.cloneNode(true).checked;f.disabled=true;i.optDisabled=!g.disabled;try{delete a.test}catch(m){i.deleteExpando=false}if(!a.addEventListener&&a.attachEvent&&a.fireEvent){a.attachEvent("onclick",function(){i.noCloneEvent=false});a.cloneNode(true).fireEvent("onclick")}d=y.createElement("input");d.value="t";d.setAttribute("type","radio");i.radioValue=d.value==="t";d.setAttribute("checked","checked");a.appendChild(d);e=y.createDocumentFragment();e.appendChild(a.firstChild);
i.checkClone=e.cloneNode(true).cloneNode(true).lastChild.checked;a.innerHTML="";a.style.width=a.style.paddingLeft="1px";f=y.getElementsByTagName("body")[0];e=y.createElement(f?"div":"body");g={visibility:"hidden",width:0,height:0,border:0,margin:0};f&&c.extend(g,{position:"absolute",left:-1E3,top:-1E3});for(l in g)e.style[l]=g[l];e.appendChild(a);b=f||b;b.insertBefore(e,b.firstChild);i.appendChecked=d.checked;i.boxModel=a.offsetWidth===2;if("zoom"in a.style){a.style.display="inline";a.style.zoom=
1;i.inlineBlockNeedsLayout=a.offsetWidth===2;a.style.display="";a.innerHTML="<div style='width:4px;'></div>";i.shrinkWrapBlocks=a.offsetWidth!==2}a.innerHTML="<table><tr><td style='padding:0;border:0;display:none'></td><td>t</td></tr></table>";f=a.getElementsByTagName("td");d=f[0].offsetHeight===0;f[0].style.display="";f[1].style.display="none";i.reliableHiddenOffsets=d&&f[0].offsetHeight===0;a.innerHTML="";if(y.defaultView&&y.defaultView.getComputedStyle){d=y.createElement("div");d.style.width="0";
d.style.marginRight="0";a.appendChild(d);i.reliableMarginRight=(parseInt((y.defaultView.getComputedStyle(d,null)||{marginRight:0}).marginRight,10)||0)===0}e.innerHTML="";b.removeChild(e);if(a.attachEvent)for(l in{submit:1,change:1,focusin:1}){b="on"+l;d=b in a;if(!d){a.setAttribute(b,"return;");d=typeof a[b]==="function"}i[l+"Bubbles"]=d}e=e=f=g=f=d=a=d=null;return i}();c.boxModel=c.support.boxModel;var qb=/^(?:\{.*\}|\[.*\])$/,pb=/([a-z])([A-Z])/g;c.extend({cache:{},uuid:0,expando:"jQuery"+(c.fn.jquery+
Math.random()).replace(/\D/g,""),noData:{embed:true,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:true},hasData:function(a){a=a.nodeType?c.cache[a[c.expando]]:a[c.expando];return!!a&&!ra(a)},data:function(a,b,d,e){if(c.acceptData(a)){var f=c.expando,g=typeof b==="string",i=a.nodeType,l=i?c.cache:a,m=i?a[c.expando]:a[c.expando]&&c.expando;if(!((!m||e&&m&&!l[m][f])&&g&&d===u)){if(!m)if(i)a[c.expando]=m=++c.uuid;else m=c.expando;if(!l[m]){l[m]={};if(!i)l[m].toJSON=c.noop}if(typeof b==="object"||
typeof b==="function")if(e)l[m][f]=c.extend(l[m][f],b);else l[m]=c.extend(l[m],b);a=l[m];if(e){a[f]||(a[f]={});a=a[f]}if(d!==u)a[c.camelCase(b)]=d;if(b==="events"&&!a[b])return a[f]&&a[f].events;return g?a[c.camelCase(b)]||a[b]:a}}},removeData:function(a,b,d){if(c.acceptData(a)){var e=c.expando,f=a.nodeType,g=f?c.cache:a,i=f?a[c.expando]:c.expando;if(g[i]){if(b){var l=d?g[i][e]:g[i];if(l){delete l[b];if(!ra(l))return}}if(d){delete g[i][e];if(!ra(g[i]))return}b=g[i][e];if(c.support.deleteExpando||
g!=E)delete g[i];else g[i]=null;if(b){g[i]={};if(!f)g[i].toJSON=c.noop;g[i][e]=b}else if(f)if(c.support.deleteExpando)delete a[c.expando];else if(a.removeAttribute)a.removeAttribute(c.expando);else a[c.expando]=null}}},_data:function(a,b,d){return c.data(a,b,d,true)},acceptData:function(a){if(a.nodeName){var b=c.noData[a.nodeName.toLowerCase()];if(b)return!(b===true||a.getAttribute("classid")!==b)}return true}});c.fn.extend({data:function(a,b){var d=null;if(typeof a==="undefined"){if(this.length){d=
c.data(this[0]);if(this[0].nodeType===1)for(var e=this[0].attributes,f,g=0,i=e.length;g<i;g++){f=e[g].name;if(f.indexOf("data-")===0){f=c.camelCase(f.substring(5));Fa(this[0],f,d[f])}}}return d}else if(typeof a==="object")return this.each(function(){c.data(this,a)});var l=a.split(".");l[1]=l[1]?"."+l[1]:"";if(b===u){d=this.triggerHandler("getData"+l[1]+"!",[l[0]]);if(d===u&&this.length){d=c.data(this[0],a);d=Fa(this[0],a,d)}return d===u&&l[1]?this.data(l[0]):d}else return this.each(function(){var m=
c(this),o=[l[0],b];m.triggerHandler("setData"+l[1]+"!",o);c.data(this,a,b);m.triggerHandler("changeData"+l[1]+"!",o)})},removeData:function(a){return this.each(function(){c.removeData(this,a)})}});c.extend({_mark:function(a,b){if(a){b=(b||"fx")+"mark";c.data(a,b,(c.data(a,b,u,true)||0)+1,true)}},_unmark:function(a,b,d){if(a!==true){d=b;b=a;a=false}if(b){d=d||"fx";var e=d+"mark";if(a=a?0:(c.data(b,e,u,true)||1)-1)c.data(b,e,a,true);else{c.removeData(b,e,true);Ga(b,d,"mark")}}},queue:function(a,b,d){if(a){b=
(b||"fx")+"queue";var e=c.data(a,b,u,true);if(d)if(!e||c.isArray(d))e=c.data(a,b,c.makeArray(d),true);else e.push(d);return e||[]}},dequeue:function(a,b){b=b||"fx";var d=c.queue(a,b),e=d.shift();if(e==="inprogress")e=d.shift();if(e){b==="fx"&&d.unshift("inprogress");e.call(a,function(){c.dequeue(a,b)})}if(!d.length){c.removeData(a,b+"queue",true);Ga(a,b,"queue")}}});c.fn.extend({queue:function(a,b){if(typeof a!=="string"){b=a;a="fx"}if(b===u)return c.queue(this[0],a);return this.each(function(){var d=
c.queue(this,a,b);a==="fx"&&d[0]!=="inprogress"&&c.dequeue(this,a)})},dequeue:function(a){return this.each(function(){c.dequeue(this,a)})},delay:function(a,b){a=c.fx?c.fx.speeds[a]||a:a;b=b||"fx";return this.queue(b,function(){var d=this;setTimeout(function(){c.dequeue(d,b)},a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a){function b(){--g||d.resolveWith(e,[e])}if(typeof a!=="string")a=u;a=a||"fx";var d=c.Deferred(),e=this,f=e.length,g=1,i=a+"defer",l=a+"queue";a+="mark";
for(var m;f--;)if(m=c.data(e[f],i,u,true)||(c.data(e[f],l,u,true)||c.data(e[f],a,u,true))&&c.data(e[f],i,c._Deferred(),true)){g++;m.done(b)}b();return d.promise()}});var Va=/[\n\t\r]/g,ya=/\s+/,Db=/\r/g,Eb=/^(?:button|input)$/i,Fb=/^(?:button|input|object|select|textarea)$/i,Gb=/^a(?:rea)?$/i,Wa=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,Hb=/\:|^on/,X,Xa;c.fn.extend({attr:function(a,b){return c.access(this,a,b,true,
c.attr)},removeAttr:function(a){return this.each(function(){c.removeAttr(this,a)})},prop:function(a,b){return c.access(this,a,b,true,c.prop)},removeProp:function(a){a=c.propFix[a]||a;return this.each(function(){try{this[a]=u;delete this[a]}catch(b){}})},addClass:function(a){var b,d,e,f,g,i,l;if(c.isFunction(a))return this.each(function(m){c(this).addClass(a.call(this,m,this.className))});if(a&&typeof a==="string"){b=a.split(ya);d=0;for(e=this.length;d<e;d++){f=this[d];if(f.nodeType===1)if(!f.className&&
b.length===1)f.className=a;else{g=" "+f.className+" ";i=0;for(l=b.length;i<l;i++)~g.indexOf(" "+b[i]+" ")||(g+=b[i]+" ");f.className=c.trim(g)}}}return this},removeClass:function(a){var b,d,e,f,g,i,l;if(c.isFunction(a))return this.each(function(m){c(this).removeClass(a.call(this,m,this.className))});if(a&&typeof a==="string"||a===u){b=(a||"").split(ya);d=0;for(e=this.length;d<e;d++){f=this[d];if(f.nodeType===1&&f.className)if(a){g=(" "+f.className+" ").replace(Va," ");i=0;for(l=b.length;i<l;i++)g=
g.replace(" "+b[i]+" "," ");f.className=c.trim(g)}else f.className=""}}return this},toggleClass:function(a,b){var d=typeof a,e=typeof b==="boolean";if(c.isFunction(a))return this.each(function(f){c(this).toggleClass(a.call(this,f,this.className,b),b)});return this.each(function(){if(d==="string")for(var f,g=0,i=c(this),l=b,m=a.split(ya);f=m[g++];){l=e?l:!i.hasClass(f);i[l?"addClass":"removeClass"](f)}else if(d==="undefined"||d==="boolean"){this.className&&c._data(this,"__className__",this.className);
this.className=this.className||a===false?"":c._data(this,"__className__")||""}})},hasClass:function(a){a=" "+a+" ";for(var b=0,d=this.length;b<d;b++)if((" "+this[b].className+" ").replace(Va," ").indexOf(a)>-1)return true;return false},val:function(a){var b,d,e=this[0];if(!arguments.length){if(e){if((b=c.valHooks[e.nodeName.toLowerCase()]||c.valHooks[e.type])&&"get"in b&&(d=b.get(e,"value"))!==u)return d;d=e.value;return typeof d==="string"?d.replace(Db,""):d==null?"":d}return u}var f=c.isFunction(a);
return this.each(function(g){var i=c(this);if(this.nodeType===1){g=f?a.call(this,g,i.val()):a;if(g==null)g="";else if(typeof g==="number")g+="";else if(c.isArray(g))g=c.map(g,function(l){return l==null?"":l+""});b=c.valHooks[this.nodeName.toLowerCase()]||c.valHooks[this.type];if(!b||!("set"in b)||b.set(this,g,"value")===u)this.value=g}})}});c.extend({valHooks:{option:{get:function(a){var b=a.attributes.value;return!b||b.specified?a.value:a.text}},select:{get:function(a){var b,d=a.selectedIndex,e=
[],f=a.options;a=a.type==="select-one";if(d<0)return null;for(var g=a?d:0,i=a?d+1:f.length;g<i;g++){b=f[g];if(b.selected&&(c.support.optDisabled?!b.disabled:b.getAttribute("disabled")===null)&&(!b.parentNode.disabled||!c.nodeName(b.parentNode,"optgroup"))){b=c(b).val();if(a)return b;e.push(b)}}if(a&&!e.length&&f.length)return c(f[d]).val();return e},set:function(a,b){var d=c.makeArray(b);c(a).find("option").each(function(){this.selected=c.inArray(c(this).val(),d)>=0});if(!d.length)a.selectedIndex=
-1;return d}}},attrFn:{val:true,css:true,html:true,text:true,data:true,width:true,height:true,offset:true},attrFix:{tabindex:"tabIndex"},attr:function(a,b,d,e){var f=a.nodeType;if(!a||f===3||f===8||f===2)return u;if(e&&b in c.attrFn)return c(a)[b](d);if(!("getAttribute"in a))return c.prop(a,b,d);var g,i;if(e=f!==1||!c.isXMLDoc(a)){b=c.attrFix[b]||b;i=c.attrHooks[b];if(!i)if(Wa.test(b))i=Xa;else if(X&&b!=="className"&&(c.nodeName(a,"form")||Hb.test(b)))i=X}if(d!==u)if(d===null){c.removeAttr(a,b);return u}else if(i&&
"set"in i&&e&&(g=i.set(a,d,b))!==u)return g;else{a.setAttribute(b,""+d);return d}else if(i&&"get"in i&&e&&(g=i.get(a,b))!==null)return g;else{g=a.getAttribute(b);return g===null?u:g}},removeAttr:function(a,b){var d;if(a.nodeType===1){b=c.attrFix[b]||b;if(c.support.getSetAttribute)a.removeAttribute(b);else{c.attr(a,b,"");a.removeAttributeNode(a.getAttributeNode(b))}if(Wa.test(b)&&(d=c.propFix[b]||b)in a)a[d]=false}},attrHooks:{type:{set:function(a,b){if(Eb.test(a.nodeName)&&a.parentNode)c.error("type property can't be changed");
else if(!c.support.radioValue&&b==="radio"&&c.nodeName(a,"input")){var d=a.value;a.setAttribute("type",b);if(d)a.value=d;return b}}},tabIndex:{get:function(a){var b=a.getAttributeNode("tabIndex");return b&&b.specified?parseInt(b.value,10):Fb.test(a.nodeName)||Gb.test(a.nodeName)&&a.href?0:u}},value:{get:function(a,b){if(X&&c.nodeName(a,"button"))return X.get(a,b);return b in a?a.value:null},set:function(a,b,d){if(X&&c.nodeName(a,"button"))return X.set(a,b,d);a.value=b}}},propFix:{tabindex:"tabIndex",
readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(a,b,d){var e=a.nodeType;if(!a||e===3||e===8||e===2)return u;var f,g;if(e!==1||!c.isXMLDoc(a)){b=c.propFix[b]||b;g=c.propHooks[b]}return d!==u?g&&"set"in g&&(f=g.set(a,d,b))!==u?f:a[b]=d:g&&"get"in g&&(f=g.get(a,b))!==u?f:a[b]},propHooks:{}});Xa=
{get:function(a,b){return c.prop(a,b)?b.toLowerCase():u},set:function(a,b,d){if(b===false)c.removeAttr(a,d);else{b=c.propFix[d]||d;if(b in a)a[b]=true;a.setAttribute(d,d.toLowerCase())}return d}};if(!c.support.getSetAttribute){c.attrFix=c.propFix;X=c.attrHooks.name=c.attrHooks.title=c.valHooks.button={get:function(a,b){var d;return(d=a.getAttributeNode(b))&&d.nodeValue!==""?d.nodeValue:u},set:function(a,b,d){if(a=a.getAttributeNode(d))return a.nodeValue=b}};c.each(["width","height"],function(a,b){c.attrHooks[b]=
c.extend(c.attrHooks[b],{set:function(d,e){if(e===""){d.setAttribute(b,"auto");return e}}})})}c.support.hrefNormalized||c.each(["href","src","width","height"],function(a,b){c.attrHooks[b]=c.extend(c.attrHooks[b],{get:function(d){d=d.getAttribute(b,2);return d===null?u:d}})});if(!c.support.style)c.attrHooks.style={get:function(a){return a.style.cssText.toLowerCase()||u},set:function(a,b){return a.style.cssText=""+b}};if(!c.support.optSelected)c.propHooks.selected=c.extend(c.propHooks.selected,{get:function(){}});
c.support.checkOn||c.each(["radio","checkbox"],function(){c.valHooks[this]={get:function(a){return a.getAttribute("value")===null?"on":a.value}}});c.each(["radio","checkbox"],function(){c.valHooks[this]=c.extend(c.valHooks[this],{set:function(a,b){if(c.isArray(b))return a.checked=c.inArray(c(a).val(),b)>=0}})});var sa=/\.(.*)$/,za=/^(?:textarea|input|select)$/i,sb=/\./g,tb=/ /g,Ib=/[^\w\s.|`]/g,Jb=function(a){return a.replace(Ib,"\\$&")};c.event={add:function(a,b,d,e){if(!(a.nodeType===3||a.nodeType===
8)){if(d===false)d=V;else if(!d)return;var f,g;if(d.handler){f=d;d=f.handler}if(!d.guid)d.guid=c.guid++;if(g=c._data(a)){var i=g.events,l=g.handle;if(!i)g.events=i={};if(!l)g.handle=l=function(F){return typeof c!=="undefined"&&(!F||c.event.triggered!==F.type)?c.event.handle.apply(l.elem,arguments):u};l.elem=a;b=b.split(" ");for(var m,o=0,s;m=b[o++];){g=f?c.extend({},f):{handler:d,data:e};if(m.indexOf(".")>-1){s=m.split(".");m=s.shift();g.namespace=s.slice(0).sort().join(".")}else{s=[];g.namespace=
""}g.type=m;if(!g.guid)g.guid=d.guid;var A=i[m],G=c.event.special[m]||{};if(!A){A=i[m]=[];if(!G.setup||G.setup.call(a,e,s,l)===false)if(a.addEventListener)a.addEventListener(m,l,false);else a.attachEvent&&a.attachEvent("on"+m,l)}if(G.add){G.add.call(a,g);if(!g.handler.guid)g.handler.guid=d.guid}A.push(g);c.event.global[m]=true}a=null}}},global:{},remove:function(a,b,d,e){if(!(a.nodeType===3||a.nodeType===8)){if(d===false)d=V;var f,g,i=0,l,m,o,s,A,G,F=c.hasData(a)&&c._data(a),H=F&&F.events;if(F&&H){if(b&&
b.type){d=b.handler;b=b.type}if(!b||typeof b==="string"&&b.charAt(0)==="."){b=b||"";for(f in H)c.event.remove(a,f+b)}else{for(b=b.split(" ");f=b[i++];){s=f;l=f.indexOf(".")<0;m=[];if(!l){m=f.split(".");f=m.shift();o=RegExp("(^|\\.)"+c.map(m.slice(0).sort(),Jb).join("\\.(?:.*\\.)?")+"(\\.|$)")}if(A=H[f])if(d){s=c.event.special[f]||{};for(g=e||0;g<A.length;g++){G=A[g];if(d.guid===G.guid){if(l||o.test(G.namespace)){e==null&&A.splice(g--,1);s.remove&&s.remove.call(a,G)}if(e!=null)break}}if(A.length===
0||e!=null&&A.length===1){if(!s.teardown||s.teardown.call(a,m)===false)c.removeEvent(a,f,F.handle);delete H[f]}}else for(g=0;g<A.length;g++){G=A[g];if(l||o.test(G.namespace)){c.event.remove(a,s,G.handler,g);A.splice(g--,1)}}}if(c.isEmptyObject(H)){if(b=F.handle)b.elem=null;delete F.events;delete F.handle;c.isEmptyObject(F)&&c.removeData(a,u,true)}}}}},customEvent:{getData:true,setData:true,changeData:true},trigger:function(a,b,d,e){var f=a.type||a,g=[],i;if(f.indexOf("!")>=0){f=f.slice(0,-1);i=true}if(f.indexOf(".")>=
0){g=f.split(".");f=g.shift();g.sort()}if(!((!d||c.event.customEvent[f])&&!c.event.global[f])){a=typeof a==="object"?a[c.expando]?a:new c.Event(f,a):new c.Event(f);a.type=f;a.exclusive=i;a.namespace=g.join(".");a.namespace_re=RegExp("(^|\\.)"+g.join("\\.(?:.*\\.)?")+"(\\.|$)");if(e||!d){a.preventDefault();a.stopPropagation()}if(d){if(!(d.nodeType===3||d.nodeType===8)){a.result=u;a.target=d;b=b!=null?c.makeArray(b):[];b.unshift(a);g=d;e=f.indexOf(":")<0?"on"+f:"";do{i=c._data(g,"handle");a.currentTarget=
g;i&&i.apply(g,b);if(e&&c.acceptData(g)&&g[e]&&g[e].apply(g,b)===false){a.result=false;a.preventDefault()}g=g.parentNode||g.ownerDocument||g===a.target.ownerDocument&&E}while(g&&!a.isPropagationStopped());if(!a.isDefaultPrevented()){var l;g=c.event.special[f]||{};if((!g._default||g._default.call(d.ownerDocument,a)===false)&&!(f==="click"&&c.nodeName(d,"a"))&&c.acceptData(d)){try{if(e&&d[f]){if(l=d[e])d[e]=null;c.event.triggered=f;d[f]()}}catch(m){}if(l)d[e]=l;c.event.triggered=u}}return a.result}}else c.each(c.cache,
function(){var o=this[c.expando];o&&o.events&&o.events[f]&&c.event.trigger(a,b,o.handle.elem)})}},handle:function(a){a=c.event.fix(a||E.event);var b=((c._data(this,"events")||{})[a.type]||[]).slice(0),d=!a.exclusive&&!a.namespace,e=Array.prototype.slice.call(arguments,0);e[0]=a;a.currentTarget=this;for(var f=0,g=b.length;f<g;f++){var i=b[f];if(d||a.namespace_re.test(i.namespace)){a.handler=i.handler;a.data=i.data;a.handleObj=i;i=i.handler.apply(this,e);if(i!==u){a.result=i;if(i===false){a.preventDefault();
a.stopPropagation()}}if(a.isImmediatePropagationStopped())break}}return a.result},props:"altKey attrChange attrName bubbles button cancelable charCode clientX clientY ctrlKey currentTarget data detail eventPhase fromElement handler keyCode layerX layerY metaKey newValue offsetX offsetY pageX pageY prevValue relatedNode relatedTarget screenX screenY shiftKey srcElement target toElement view wheelDelta which".split(" "),fix:function(a){if(a[c.expando])return a;var b=a;a=c.Event(b);for(var d=this.props.length,
e;d;){e=this.props[--d];a[e]=b[e]}if(!a.target)a.target=a.srcElement||y;if(a.target.nodeType===3)a.target=a.target.parentNode;if(!a.relatedTarget&&a.fromElement)a.relatedTarget=a.fromElement===a.target?a.toElement:a.fromElement;if(a.pageX==null&&a.clientX!=null){d=a.target.ownerDocument||y;b=d.documentElement;d=d.body;a.pageX=a.clientX+(b&&b.scrollLeft||d&&d.scrollLeft||0)-(b&&b.clientLeft||d&&d.clientLeft||0);a.pageY=a.clientY+(b&&b.scrollTop||d&&d.scrollTop||0)-(b&&b.clientTop||d&&d.clientTop||
0)}if(a.which==null&&(a.charCode!=null||a.keyCode!=null))a.which=a.charCode!=null?a.charCode:a.keyCode;if(!a.metaKey&&a.ctrlKey)a.metaKey=a.ctrlKey;if(!a.which&&a.button!==u)a.which=a.button&1?1:a.button&2?3:a.button&4?2:0;return a},guid:1E8,proxy:c.proxy,special:{ready:{setup:c.bindReady,teardown:c.noop},live:{add:function(a){c.event.add(this,ja(a.origType,a.selector),c.extend({},a,{handler:rb,guid:a.handler.guid}))},remove:function(a){c.event.remove(this,ja(a.origType,a.selector),a)}},beforeunload:{setup:function(a,
b,d){if(c.isWindow(this))this.onbeforeunload=d},teardown:function(a,b){if(this.onbeforeunload===b)this.onbeforeunload=null}}}};c.removeEvent=y.removeEventListener?function(a,b,d){a.removeEventListener&&a.removeEventListener(b,d,false)}:function(a,b,d){a.detachEvent&&a.detachEvent("on"+b,d)};c.Event=function(a,b){if(!this.preventDefault)return new c.Event(a,b);if(a&&a.type){this.originalEvent=a;this.type=a.type;this.isDefaultPrevented=a.defaultPrevented||a.returnValue===false||a.getPreventDefault&&
a.getPreventDefault()?ia:V}else this.type=a;b&&c.extend(this,b);this.timeStamp=c.now();this[c.expando]=true};c.Event.prototype={preventDefault:function(){this.isDefaultPrevented=ia;var a=this.originalEvent;if(a)if(a.preventDefault)a.preventDefault();else a.returnValue=false},stopPropagation:function(){this.isPropagationStopped=ia;var a=this.originalEvent;if(a){a.stopPropagation&&a.stopPropagation();a.cancelBubble=true}},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=ia;this.stopPropagation()},
isDefaultPrevented:V,isPropagationStopped:V,isImmediatePropagationStopped:V};var Ya=function(a){var b=a.relatedTarget,d=false,e=a.type;a.type=a.data;if(b!==this){if(b)d=c.contains(this,b);if(!d){c.event.handle.apply(this,arguments);a.type=e}}},Za=function(a){a.type=a.data;c.event.handle.apply(this,arguments)};c.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(a,b){c.event.special[a]={setup:function(d){c.event.add(this,b,d&&d.selector?Za:Ya,a)},teardown:function(d){c.event.remove(this,
b,d&&d.selector?Za:Ya)}}});if(!c.support.submitBubbles)c.event.special.submit={setup:function(){if(c.nodeName(this,"form"))return false;else{c.event.add(this,"click.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="submit"||d==="image")&&c(b).closest("form").length)Ha("submit",this,arguments)});c.event.add(this,"keypress.specialSubmit",function(a){var b=a.target,d=b.type;if((d==="text"||d==="password")&&c(b).closest("form").length&&a.keyCode===13)Ha("submit",this,arguments)})}},teardown:function(){c.event.remove(this,
".specialSubmit")}};if(!c.support.changeBubbles){var ha,$a=function(a){var b=a.type,d=a.value;if(b==="radio"||b==="checkbox")d=a.checked;else if(b==="select-multiple")d=a.selectedIndex>-1?c.map(a.options,function(e){return e.selected}).join("-"):"";else if(c.nodeName(a,"select"))d=a.selectedIndex;return d},na=function(a,b){var d=a.target,e,f;if(!(!za.test(d.nodeName)||d.readOnly)){e=c._data(d,"_change_data");f=$a(d);if(a.type!=="focusout"||d.type!=="radio")c._data(d,"_change_data",f);if(!(e===u||
f===e))if(e!=null||f){a.type="change";a.liveFired=u;c.event.trigger(a,b,d)}}};c.event.special.change={filters:{focusout:na,beforedeactivate:na,click:function(a){var b=a.target,d=c.nodeName(b,"input")?b.type:"";if(d==="radio"||d==="checkbox"||c.nodeName(b,"select"))na.call(this,a)},keydown:function(a){var b=a.target,d=c.nodeName(b,"input")?b.type:"";if(a.keyCode===13&&!c.nodeName(b,"textarea")||a.keyCode===32&&(d==="checkbox"||d==="radio")||d==="select-multiple")na.call(this,a)},beforeactivate:function(a){a=
a.target;c._data(a,"_change_data",$a(a))}},setup:function(){if(this.type==="file")return false;for(var a in ha)c.event.add(this,a+".specialChange",ha[a]);return za.test(this.nodeName)},teardown:function(){c.event.remove(this,".specialChange");return za.test(this.nodeName)}};ha=c.event.special.change.filters;ha.focus=ha.beforeactivate}c.support.focusinBubbles||c.each({focus:"focusin",blur:"focusout"},function(a,b){function d(f){var g=c.event.fix(f);g.type=b;g.originalEvent={};c.event.trigger(g,null,
g.target);g.isDefaultPrevented()&&f.preventDefault()}var e=0;c.event.special[b]={setup:function(){e++===0&&y.addEventListener(a,d,true)},teardown:function(){--e===0&&y.removeEventListener(a,d,true)}}});c.each(["bind","one"],function(a,b){c.fn[b]=function(d,e,f){var g;if(typeof d==="object"){for(var i in d)this[b](i,e,d[i],f);return this}if(arguments.length===2||e===false){f=e;e=u}if(b==="one"){g=function(m){c(this).unbind(m,g);return f.apply(this,arguments)};g.guid=f.guid||c.guid++}else g=f;if(d===
"unload"&&b!=="one")this.one(d,e,f);else{i=0;for(var l=this.length;i<l;i++)c.event.add(this[i],d,g,e)}return this}});c.fn.extend({unbind:function(a,b){if(typeof a==="object"&&!a.preventDefault)for(var d in a)this.unbind(d,a[d]);else{d=0;for(var e=this.length;d<e;d++)c.event.remove(this[d],a,b)}return this},delegate:function(a,b,d,e){return this.live(b,d,e,a)},undelegate:function(a,b,d){return arguments.length===0?this.unbind("live"):this.die(b,null,d,a)},trigger:function(a,b){return this.each(function(){c.event.trigger(a,
b,this)})},triggerHandler:function(a,b){if(this[0])return c.event.trigger(a,b,this[0],true)},toggle:function(a){var b=arguments,d=a.guid||c.guid++,e=0,f=function(g){var i=(c.data(this,"lastToggle"+a.guid)||0)%e;c.data(this,"lastToggle"+a.guid,i+1);g.preventDefault();return b[i].apply(this,arguments)||false};for(f.guid=d;e<b.length;)b[e++].guid=d;return this.click(f)},hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)}});var Aa={focus:"focusin",blur:"focusout",mouseenter:"mouseover",mouseleave:"mouseout"};
c.each(["live","die"],function(a,b){c.fn[b]=function(d,e,f,g){var i=0,l,m,o=g||this.selector,s=g?this:c(this.context);if(typeof d==="object"&&!d.preventDefault){for(l in d)s[b](l,e,d[l],o);return this}if(b==="die"&&!d&&g&&g.charAt(0)==="."){s.unbind(g);return this}if(e===false||c.isFunction(e)){f=e||V;e=u}for(d=(d||"").split(" ");(g=d[i++])!=null;){l=sa.exec(g);m="";if(l){m=l[0];g=g.replace(sa,"")}if(g==="hover")d.push("mouseenter"+m,"mouseleave"+m);else{l=g;if(Aa[g]){d.push(Aa[g]+m);g+=m}else g=
(Aa[g]||g)+m;if(b==="live"){m=0;for(var A=s.length;m<A;m++)c.event.add(s[m],"live."+ja(g,o),{data:e,selector:o,handler:f,origType:g,origHandler:f,preType:l})}else s.unbind("live."+ja(g,o),f)}}return this}});c.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error".split(" "),function(a,b){c.fn[b]=function(d,e){if(e==null){e=d;d=null}return arguments.length>0?this.bind(b,
d,e):this.trigger(b)};if(c.attrFn)c.attrFn[b]=true});(function(){function a(h,k,p,r,n,q){n=0;for(var v=r.length;n<v;n++){var x=r[n];if(x){var B=false;for(x=x[h];x;){if(x.sizcache===p){B=r[x.sizset];break}if(x.nodeType===1&&!q){x.sizcache=p;x.sizset=n}if(x.nodeName.toLowerCase()===k){B=x;break}x=x[h]}r[n]=B}}}function b(h,k,p,r,n,q){n=0;for(var v=r.length;n<v;n++){var x=r[n];if(x){var B=false;for(x=x[h];x;){if(x.sizcache===p){B=r[x.sizset];break}if(x.nodeType===1){if(!q){x.sizcache=p;x.sizset=n}if(typeof k!==
"string"){if(x===k){B=true;break}}else if(o.filter(k,[x]).length>0){B=x;break}}x=x[h]}r[n]=B}}}var d=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,e=0,f=Object.prototype.toString,g=false,i=true,l=/\\/g,m=/\W/;[0,0].sort(function(){i=false;return 0});var o=function(h,k,p,r){p=p||[];var n=k=k||y;if(k.nodeType!==1&&k.nodeType!==9)return[];if(!h||typeof h!=="string")return p;var q,v,x,B,O,K=true,L=o.isXML(k),j=[],
t=h;do{d.exec("");if(q=d.exec(t)){t=q[3];j.push(q[1]);if(q[2]){B=q[3];break}}}while(q);if(j.length>1&&A.exec(h))if(j.length===2&&s.relative[j[0]])v=R(j[0]+j[1],k);else for(v=s.relative[j[0]]?[k]:o(j.shift(),k);j.length;){h=j.shift();if(s.relative[h])h+=j.shift();v=R(h,v)}else{if(!r&&j.length>1&&k.nodeType===9&&!L&&s.match.ID.test(j[0])&&!s.match.ID.test(j[j.length-1])){q=o.find(j.shift(),k,L);k=q.expr?o.filter(q.expr,q.set)[0]:q.set[0]}if(k){q=r?{expr:j.pop(),set:H(r)}:o.find(j.pop(),j.length===1&&
(j[0]==="~"||j[0]==="+")&&k.parentNode?k.parentNode:k,L);v=q.expr?o.filter(q.expr,q.set):q.set;if(j.length>0)x=H(v);else K=false;for(;j.length;){q=O=j.pop();if(s.relative[O])q=j.pop();else O="";if(q==null)q=k;s.relative[O](x,q,L)}}else x=[]}x||(x=v);x||o.error(O||h);if(f.call(x)==="[object Array]")if(K)if(k&&k.nodeType===1)for(h=0;x[h]!=null;h++){if(x[h]&&(x[h]===true||x[h].nodeType===1&&o.contains(k,x[h])))p.push(v[h])}else for(h=0;x[h]!=null;h++)x[h]&&x[h].nodeType===1&&p.push(v[h]);else p.push.apply(p,
x);else H(x,p);if(B){o(B,n,p,r);o.uniqueSort(p)}return p};o.uniqueSort=function(h){if(M){g=i;h.sort(M);if(g)for(var k=1;k<h.length;k++)h[k]===h[k-1]&&h.splice(k--,1)}return h};o.matches=function(h,k){return o(h,null,null,k)};o.matchesSelector=function(h,k){return o(k,null,null,[h]).length>0};o.find=function(h,k,p){var r;if(!h)return[];for(var n=0,q=s.order.length;n<q;n++){var v,x=s.order[n];if(v=s.leftMatch[x].exec(h)){var B=v[1];v.splice(1,1);if(B.substr(B.length-1)!=="\\"){v[1]=(v[1]||"").replace(l,
"");r=s.find[x](v,k,p);if(r!=null){h=h.replace(s.match[x],"");break}}}}r||(r=typeof k.getElementsByTagName!=="undefined"?k.getElementsByTagName("*"):[]);return{set:r,expr:h}};o.filter=function(h,k,p,r){for(var n,q,v=h,x=[],B=k,O=k&&k[0]&&o.isXML(k[0]);h&&k.length;){for(var K in s.filter)if((n=s.leftMatch[K].exec(h))!=null&&n[2]){var L,j,t=s.filter[K];j=n[1];q=false;n.splice(1,1);if(j.substr(j.length-1)!=="\\"){if(B===x)x=[];if(s.preFilter[K])if(n=s.preFilter[K](n,B,p,x,r,O)){if(n===true)continue}else q=
L=true;if(n)for(var z=0;(j=B[z])!=null;z++)if(j){L=t(j,n,z,B);var w=r^!!L;if(p&&L!=null)if(w)q=true;else B[z]=false;else if(w){x.push(j);q=true}}if(L!==u){p||(B=x);h=h.replace(s.match[K],"");if(!q)return[];break}}}if(h===v)if(q==null)o.error(h);else break;v=h}return B};o.error=function(h){throw"Syntax error, unrecognized expression: "+h;};var s=o.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(h){return h.getAttribute("href")},
type:function(h){return h.getAttribute("type")}},relative:{"+":function(h,k){var p=typeof k==="string",r=p&&!m.test(k);p=p&&!r;if(r)k=k.toLowerCase();r=0;for(var n=h.length,q;r<n;r++)if(q=h[r]){for(;(q=q.previousSibling)&&q.nodeType!==1;);h[r]=p||q&&q.nodeName.toLowerCase()===k?q||false:q===k}p&&o.filter(k,h,true)},">":function(h,k){var p,r=typeof k==="string",n=0,q=h.length;if(r&&!m.test(k))for(k=k.toLowerCase();n<q;n++){if(p=h[n]){p=p.parentNode;h[n]=p.nodeName.toLowerCase()===k?p:false}}else{for(;n<
q;n++)if(p=h[n])h[n]=r?p.parentNode:p.parentNode===k;r&&o.filter(k,h,true)}},"":function(h,k,p){var r,n=e++,q=b;if(typeof k==="string"&&!m.test(k)){r=k=k.toLowerCase();q=a}q("parentNode",k,n,h,r,p)},"~":function(h,k,p){var r,n=e++,q=b;if(typeof k==="string"&&!m.test(k)){r=k=k.toLowerCase();q=a}q("previousSibling",k,n,h,r,p)}},find:{ID:function(h,k,p){if(typeof k.getElementById!=="undefined"&&!p)return(h=k.getElementById(h[1]))&&h.parentNode?[h]:[]},NAME:function(h,k){if(typeof k.getElementsByName!==
"undefined"){for(var p=[],r=k.getElementsByName(h[1]),n=0,q=r.length;n<q;n++)r[n].getAttribute("name")===h[1]&&p.push(r[n]);return p.length===0?null:p}},TAG:function(h,k){if(typeof k.getElementsByTagName!=="undefined")return k.getElementsByTagName(h[1])}},preFilter:{CLASS:function(h,k,p,r,n,q){h=" "+h[1].replace(l,"")+" ";if(q)return h;q=0;for(var v;(v=k[q])!=null;q++)if(v)if(n^(v.className&&(" "+v.className+" ").replace(/[\t\n\r]/g," ").indexOf(h)>=0))p||r.push(v);else if(p)k[q]=false;return false},
ID:function(h){return h[1].replace(l,"")},TAG:function(h){return h[1].replace(l,"").toLowerCase()},CHILD:function(h){if(h[1]==="nth"){h[2]||o.error(h[0]);h[2]=h[2].replace(/^\+|\s*/g,"");var k=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(h[2]==="even"&&"2n"||h[2]==="odd"&&"2n+1"||!/\D/.test(h[2])&&"0n+"+h[2]||h[2]);h[2]=k[1]+(k[2]||1)-0;h[3]=k[3]-0}else h[2]&&o.error(h[0]);h[0]=e++;return h},ATTR:function(h,k,p,r,n,q){k=h[1]=h[1].replace(l,"");if(!q&&s.attrMap[k])h[1]=s.attrMap[k];h[4]=(h[4]||h[5]||"").replace(l,
"");if(h[2]==="~=")h[4]=" "+h[4]+" ";return h},PSEUDO:function(h,k,p,r,n){if(h[1]==="not")if((d.exec(h[3])||"").length>1||/^\w/.test(h[3]))h[3]=o(h[3],null,null,k);else{h=o.filter(h[3],k,p,true^n);p||r.push.apply(r,h);return false}else if(s.match.POS.test(h[0])||s.match.CHILD.test(h[0]))return true;return h},POS:function(h){h.unshift(true);return h}},filters:{enabled:function(h){return h.disabled===false&&h.type!=="hidden"},disabled:function(h){return h.disabled===true},checked:function(h){return h.checked===
true},selected:function(h){return h.selected===true},parent:function(h){return!!h.firstChild},empty:function(h){return!h.firstChild},has:function(h,k,p){return!!o(p[3],h).length},header:function(h){return/h\d/i.test(h.nodeName)},text:function(h){var k=h.getAttribute("type"),p=h.type;return h.nodeName.toLowerCase()==="input"&&"text"===p&&(k===p||k===null)},radio:function(h){return h.nodeName.toLowerCase()==="input"&&"radio"===h.type},checkbox:function(h){return h.nodeName.toLowerCase()==="input"&&
"checkbox"===h.type},file:function(h){return h.nodeName.toLowerCase()==="input"&&"file"===h.type},password:function(h){return h.nodeName.toLowerCase()==="input"&&"password"===h.type},submit:function(h){var k=h.nodeName.toLowerCase();return(k==="input"||k==="button")&&"submit"===h.type},image:function(h){return h.nodeName.toLowerCase()==="input"&&"image"===h.type},reset:function(h){var k=h.nodeName.toLowerCase();return(k==="input"||k==="button")&&"reset"===h.type},button:function(h){var k=h.nodeName.toLowerCase();
return k==="input"&&"button"===h.type||k==="button"},input:function(h){return/input|select|textarea|button/i.test(h.nodeName)},focus:function(h){return h===h.ownerDocument.activeElement}},setFilters:{first:function(h,k){return k===0},last:function(h,k,p,r){return k===r.length-1},even:function(h,k){return k%2===0},odd:function(h,k){return k%2===1},lt:function(h,k,p){return k<p[3]-0},gt:function(h,k,p){return k>p[3]-0},nth:function(h,k,p){return p[3]-0===k},eq:function(h,k,p){return p[3]-0===k}},filter:{PSEUDO:function(h,
k,p,r){var n=k[1],q=s.filters[n];if(q)return q(h,p,k,r);else if(n==="contains")return(h.textContent||h.innerText||o.getText([h])||"").indexOf(k[3])>=0;else if(n==="not"){k=k[3];p=0;for(r=k.length;p<r;p++)if(k[p]===h)return false;return true}else o.error(n)},CHILD:function(h,k){var p=k[1],r=h;switch(p){case "only":case "first":for(;r=r.previousSibling;)if(r.nodeType===1)return false;if(p==="first")return true;r=h;case "last":for(;r=r.nextSibling;)if(r.nodeType===1)return false;return true;case "nth":p=
k[2];var n=k[3];if(p===1&&n===0)return true;var q=k[0],v=h.parentNode;if(v&&(v.sizcache!==q||!h.nodeIndex)){var x=0;for(r=v.firstChild;r;r=r.nextSibling)if(r.nodeType===1)r.nodeIndex=++x;v.sizcache=q}r=h.nodeIndex-n;return p===0?r===0:r%p===0&&r/p>=0}},ID:function(h,k){return h.nodeType===1&&h.getAttribute("id")===k},TAG:function(h,k){return k==="*"&&h.nodeType===1||h.nodeName.toLowerCase()===k},CLASS:function(h,k){return(" "+(h.className||h.getAttribute("class"))+" ").indexOf(k)>-1},ATTR:function(h,
k){var p=k[1];p=s.attrHandle[p]?s.attrHandle[p](h):h[p]!=null?h[p]:h.getAttribute(p);var r=p+"",n=k[2],q=k[4];return p==null?n==="!=":n==="="?r===q:n==="*="?r.indexOf(q)>=0:n==="~="?(" "+r+" ").indexOf(q)>=0:!q?r&&p!==false:n==="!="?r!==q:n==="^="?r.indexOf(q)===0:n==="$="?r.substr(r.length-q.length)===q:n==="|="?r===q||r.substr(0,q.length+1)===q+"-":false},POS:function(h,k,p,r){var n=s.setFilters[k[2]];if(n)return n(h,p,k,r)}}},A=s.match.POS,G=function(h,k){return"\\"+(k-0+1)},F;for(F in s.match){s.match[F]=
RegExp(s.match[F].source+/(?![^\[]*\])(?![^\(]*\))/.source);s.leftMatch[F]=RegExp(/(^(?:.|\r|\n)*?)/.source+s.match[F].source.replace(/\\(\d+)/g,G))}var H=function(h,k){h=Array.prototype.slice.call(h,0);if(k){k.push.apply(k,h);return k}return h};try{Array.prototype.slice.call(y.documentElement.childNodes,0)}catch(W){H=function(h,k){var p=0,r=k||[];if(f.call(h)==="[object Array]")Array.prototype.push.apply(r,h);else if(typeof h.length==="number")for(var n=h.length;p<n;p++)r.push(h[p]);else for(;h[p];p++)r.push(h[p]);
return r}}var M,N;if(y.documentElement.compareDocumentPosition)M=function(h,k){if(h===k){g=true;return 0}if(!h.compareDocumentPosition||!k.compareDocumentPosition)return h.compareDocumentPosition?-1:1;return h.compareDocumentPosition(k)&4?-1:1};else{M=function(h,k){if(h===k){g=true;return 0}else if(h.sourceIndex&&k.sourceIndex)return h.sourceIndex-k.sourceIndex;var p,r,n=[],q=[];p=h.parentNode;r=k.parentNode;var v=p;if(p===r)return N(h,k);else if(p){if(!r)return 1}else return-1;for(;v;){n.unshift(v);
v=v.parentNode}for(v=r;v;){q.unshift(v);v=v.parentNode}p=n.length;r=q.length;for(v=0;v<p&&v<r;v++)if(n[v]!==q[v])return N(n[v],q[v]);return v===p?N(h,q[v],-1):N(n[v],k,1)};N=function(h,k,p){if(h===k)return p;for(h=h.nextSibling;h;){if(h===k)return-1;h=h.nextSibling}return 1}}o.getText=function(h){for(var k="",p,r=0;h[r];r++){p=h[r];if(p.nodeType===3||p.nodeType===4)k+=p.nodeValue;else if(p.nodeType!==8)k+=o.getText(p.childNodes)}return k};(function(){var h=y.createElement("div"),k="script"+(new Date).getTime(),
p=y.documentElement;h.innerHTML="<a name='"+k+"'/>";p.insertBefore(h,p.firstChild);if(y.getElementById(k)){s.find.ID=function(r,n,q){if(typeof n.getElementById!=="undefined"&&!q)return(n=n.getElementById(r[1]))?n.id===r[1]||typeof n.getAttributeNode!=="undefined"&&n.getAttributeNode("id").nodeValue===r[1]?[n]:u:[]};s.filter.ID=function(r,n){var q=typeof r.getAttributeNode!=="undefined"&&r.getAttributeNode("id");return r.nodeType===1&&q&&q.nodeValue===n}}p.removeChild(h);p=h=null})();(function(){var h=
y.createElement("div");h.appendChild(y.createComment(""));if(h.getElementsByTagName("*").length>0)s.find.TAG=function(k,p){var r=p.getElementsByTagName(k[1]);if(k[1]==="*"){for(var n=[],q=0;r[q];q++)r[q].nodeType===1&&n.push(r[q]);r=n}return r};h.innerHTML="<a href='#'></a>";if(h.firstChild&&typeof h.firstChild.getAttribute!=="undefined"&&h.firstChild.getAttribute("href")!=="#")s.attrHandle.href=function(k){return k.getAttribute("href",2)};h=null})();y.querySelectorAll&&function(){var h=o,k=y.createElement("div");
k.innerHTML="<p class='TEST'></p>";if(!(k.querySelectorAll&&k.querySelectorAll(".TEST").length===0)){o=function(r,n,q,v){n=n||y;if(!v&&!o.isXML(n)){var x=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(r);if(x&&(n.nodeType===1||n.nodeType===9))if(x[1])return H(n.getElementsByTagName(r),q);else if(x[2]&&s.find.CLASS&&n.getElementsByClassName)return H(n.getElementsByClassName(x[2]),q);if(n.nodeType===9){if(r==="body"&&n.body)return H([n.body],q);else if(x&&x[3]){var B=n.getElementById(x[3]);if(B&&B.parentNode){if(B.id===
x[3])return H([B],q)}else return H([],q)}try{return H(n.querySelectorAll(r),q)}catch(O){}}else if(n.nodeType===1&&n.nodeName.toLowerCase()!=="object"){x=n;var K=(B=n.getAttribute("id"))||"__sizzle__",L=n.parentNode,j=/^\s*[+~]/.test(r);if(B)K=K.replace(/'/g,"\\$&");else n.setAttribute("id",K);if(j&&L)n=n.parentNode;try{if(!j||L)return H(n.querySelectorAll("[id='"+K+"'] "+r),q)}catch(t){}finally{B||x.removeAttribute("id")}}}return h(r,n,q,v)};for(var p in h)o[p]=h[p];k=null}}();(function(){var h=y.documentElement,
k=h.matchesSelector||h.mozMatchesSelector||h.webkitMatchesSelector||h.msMatchesSelector;if(k){var p=!k.call(y.createElement("div"),"div"),r=false;try{k.call(y.documentElement,"[test!='']:sizzle")}catch(n){r=true}o.matchesSelector=function(q,v){v=v.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!o.isXML(q))try{if(r||!s.match.PSEUDO.test(v)&&!/!=/.test(v)){var x=k.call(q,v);if(x||!p||q.document&&q.document.nodeType!==11)return x}}catch(B){}return o(v,null,null,[q]).length>0}}})();(function(){var h=y.createElement("div");
h.innerHTML="<div class='test e'></div><div class='test'></div>";if(!(!h.getElementsByClassName||h.getElementsByClassName("e").length===0)){h.lastChild.className="e";if(h.getElementsByClassName("e").length!==1){s.order.splice(1,0,"CLASS");s.find.CLASS=function(k,p,r){if(typeof p.getElementsByClassName!=="undefined"&&!r)return p.getElementsByClassName(k[1])};h=null}}})();o.contains=y.documentElement.contains?function(h,k){return h!==k&&(h.contains?h.contains(k):true)}:y.documentElement.compareDocumentPosition?
function(h,k){return!!(h.compareDocumentPosition(k)&16)}:function(){return false};o.isXML=function(h){return(h=(h?h.ownerDocument||h:0).documentElement)?h.nodeName!=="HTML":false};var R=function(h,k){for(var p,r=[],n="",q=k.nodeType?[k]:k;p=s.match.PSEUDO.exec(h);){n+=p[0];h=h.replace(s.match.PSEUDO,"")}h=s.relative[h]?h+"*":h;p=0;for(var v=q.length;p<v;p++)o(h,q[p],r);return o.filter(n,r)};c.find=o;c.expr=o.selectors;c.expr[":"]=c.expr.filters;c.unique=o.uniqueSort;c.text=o.getText;c.isXMLDoc=o.isXML;
c.contains=o.contains})();var Kb=/Until$/,Lb=/^(?:parents|prevUntil|prevAll)/,Mb=/,/,ub=/^.[^:#\[\.,]*$/,Nb=Array.prototype.slice,ab=c.expr.match.POS,Ob={children:true,contents:true,next:true,prev:true};c.fn.extend({find:function(a){var b=this,d,e;if(typeof a!=="string")return c(a).filter(function(){d=0;for(e=b.length;d<e;d++)if(c.contains(b[d],this))return true});var f=this.pushStack("","find",a),g,i,l;d=0;for(e=this.length;d<e;d++){g=f.length;c.find(a,this[d],f);if(d>0)for(i=g;i<f.length;i++)for(l=
0;l<g;l++)if(f[l]===f[i]){f.splice(i--,1);break}}return f},has:function(a){var b=c(a);return this.filter(function(){for(var d=0,e=b.length;d<e;d++)if(c.contains(this,b[d]))return true})},not:function(a){return this.pushStack(Ia(this,a,false),"not",a)},filter:function(a){return this.pushStack(Ia(this,a,true),"filter",a)},is:function(a){return!!a&&(typeof a==="string"?c.filter(a,this).length>0:this.filter(a).length>0)},closest:function(a,b){var d=[],e,f,g=this[0];if(c.isArray(a)){var i,l={},m=1;if(g&&
a.length){e=0;for(f=a.length;e<f;e++){i=a[e];l[i]||(l[i]=ab.test(i)?c(i,b||this.context):i)}for(;g&&g.ownerDocument&&g!==b;){for(i in l){e=l[i];if(e.jquery?e.index(g)>-1:c(g).is(e))d.push({selector:i,elem:g,level:m})}g=g.parentNode;m++}}return d}i=ab.test(a)||typeof a!=="string"?c(a,b||this.context):0;e=0;for(f=this.length;e<f;e++)for(g=this[e];g;)if(i?i.index(g)>-1:c.find.matchesSelector(g,a)){d.push(g);break}else{g=g.parentNode;if(!g||!g.ownerDocument||g===b||g.nodeType===11)break}d=d.length>1?
c.unique(d):d;return this.pushStack(d,"closest",a)},index:function(a){if(!a||typeof a==="string")return c.inArray(this[0],a?c(a):this.parent().children());return c.inArray(a.jquery?a[0]:a,this)},add:function(a,b){var d=typeof a==="string"?c(a,b):c.makeArray(a&&a.nodeType?[a]:a),e=c.merge(this.get(),d);return this.pushStack(!d[0]||!d[0].parentNode||d[0].parentNode.nodeType===11||!e[0]||!e[0].parentNode||e[0].parentNode.nodeType===11?e:c.unique(e))},andSelf:function(){return this.add(this.prevObject)}});
c.each({parent:function(a){return(a=a.parentNode)&&a.nodeType!==11?a:null},parents:function(a){return c.dir(a,"parentNode")},parentsUntil:function(a,b,d){return c.dir(a,"parentNode",d)},next:function(a){return c.nth(a,2,"nextSibling")},prev:function(a){return c.nth(a,2,"previousSibling")},nextAll:function(a){return c.dir(a,"nextSibling")},prevAll:function(a){return c.dir(a,"previousSibling")},nextUntil:function(a,b,d){return c.dir(a,"nextSibling",d)},prevUntil:function(a,b,d){return c.dir(a,"previousSibling",
d)},siblings:function(a){return c.sibling(a.parentNode.firstChild,a)},children:function(a){return c.sibling(a.firstChild)},contents:function(a){return c.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:c.makeArray(a.childNodes)}},function(a,b){c.fn[a]=function(d,e){var f=c.map(this,b,d),g=Nb.call(arguments);Kb.test(a)||(e=d);if(e&&typeof e==="string")f=c.filter(e,f);f=this.length>1&&!Ob[a]?c.unique(f):f;if((this.length>1||Mb.test(e))&&Lb.test(a))f=f.reverse();return this.pushStack(f,
a,g.join(","))}});c.extend({filter:function(a,b,d){if(d)a=":not("+a+")";return b.length===1?c.find.matchesSelector(b[0],a)?[b[0]]:[]:c.find.matches(a,b)},dir:function(a,b,d){var e=[];for(a=a[b];a&&a.nodeType!==9&&(d===u||a.nodeType!==1||!c(a).is(d));){a.nodeType===1&&e.push(a);a=a[b]}return e},nth:function(a,b,d){b=b||1;for(var e=0;a;a=a[d])if(a.nodeType===1&&++e===b)break;return a},sibling:function(a,b){for(var d=[];a;a=a.nextSibling)a.nodeType===1&&a!==b&&d.push(a);return d}});var Pb=/ jQuery\d+="(?:\d+|null)"/g,
Ba=/^\s+/,bb=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,cb=/<([\w:]+)/,Qb=/<tbody/i,Rb=/<|&#?\w+;/,db=/<(?:script|object|embed|option|style)/i,eb=/checked\s*(?:[^=]|=\s*.checked.)/i,Sb=/\/(java|ecma)script/i,wb=/^\s*<!(?:\[CDATA\[|\-\-)/,P={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>",
"</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]};P.optgroup=P.option;P.tbody=P.tfoot=P.colgroup=P.caption=P.thead;P.th=P.td;if(!c.support.htmlSerialize)P._default=[1,"div<div>","</div>"];c.fn.extend({text:function(a){if(c.isFunction(a))return this.each(function(b){var d=c(this);d.text(a.call(this,b,d.text()))});if(typeof a!=="object"&&a!==u)return this.empty().append((this[0]&&this[0].ownerDocument||y).createTextNode(a));return c.text(this)},wrapAll:function(a){if(c.isFunction(a))return this.each(function(d){c(this).wrapAll(a.call(this,
d))});if(this[0]){var b=c(a,this[0].ownerDocument).eq(0).clone(true);this[0].parentNode&&b.insertBefore(this[0]);b.map(function(){for(var d=this;d.firstChild&&d.firstChild.nodeType===1;)d=d.firstChild;return d}).append(this)}return this},wrapInner:function(a){if(c.isFunction(a))return this.each(function(b){c(this).wrapInner(a.call(this,b))});return this.each(function(){var b=c(this),d=b.contents();d.length?d.wrapAll(a):b.append(a)})},wrap:function(a){return this.each(function(){c(this).wrapAll(a)})},
unwrap:function(){return this.parent().each(function(){c.nodeName(this,"body")||c(this).replaceWith(this.childNodes)}).end()},append:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.appendChild(a)})},prepend:function(){return this.domManip(arguments,true,function(a){this.nodeType===1&&this.insertBefore(a,this.firstChild)})},before:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,this)});else if(arguments.length){var a=
c(arguments[0]);a.push.apply(a,this.toArray());return this.pushStack(a,"before",arguments)}},after:function(){if(this[0]&&this[0].parentNode)return this.domManip(arguments,false,function(b){this.parentNode.insertBefore(b,this.nextSibling)});else if(arguments.length){var a=this.pushStack(this,"after",arguments);a.push.apply(a,c(arguments[0]).toArray());return a}},remove:function(a,b){for(var d=0,e;(e=this[d])!=null;d++)if(!a||c.filter(a,[e]).length){if(!b&&e.nodeType===1){c.cleanData(e.getElementsByTagName("*"));
c.cleanData([e])}e.parentNode&&e.parentNode.removeChild(e)}return this},empty:function(){for(var a=0,b;(b=this[a])!=null;a++)for(b.nodeType===1&&c.cleanData(b.getElementsByTagName("*"));b.firstChild;)b.removeChild(b.firstChild);return this},clone:function(a,b){a=a==null?false:a;b=b==null?a:b;return this.map(function(){return c.clone(this,a,b)})},html:function(a){if(a===u)return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(Pb,""):null;else if(typeof a==="string"&&!db.test(a)&&(c.support.leadingWhitespace||
!Ba.test(a))&&!P[(cb.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(bb,"<$1></$2>");try{for(var b=0,d=this.length;b<d;b++)if(this[b].nodeType===1){c.cleanData(this[b].getElementsByTagName("*"));this[b].innerHTML=a}}catch(e){this.empty().append(a)}}else c.isFunction(a)?this.each(function(f){var g=c(this);g.html(a.call(this,f,g.html()))}):this.empty().append(a);return this},replaceWith:function(a){if(this[0]&&this[0].parentNode){if(c.isFunction(a))return this.each(function(b){var d=c(this),e=d.html();
d.replaceWith(a.call(this,b,e))});if(typeof a!=="string")a=c(a).detach();return this.each(function(){var b=this.nextSibling,d=this.parentNode;c(this).remove();b?c(b).before(a):c(d).append(a)})}else return this.length?this.pushStack(c(c.isFunction(a)?a():a),"replaceWith",a):this},detach:function(a){return this.remove(a,true)},domManip:function(a,b,d){var e,f,g,i=a[0],l=[];if(!c.support.checkClone&&arguments.length===3&&typeof i==="string"&&eb.test(i))return this.each(function(){c(this).domManip(a,
b,d,true)});if(c.isFunction(i))return this.each(function(s){var A=c(this);a[0]=i.call(this,s,b?A.html():u);A.domManip(a,b,d)});if(this[0]){e=i&&i.parentNode;e=c.support.parentNode&&e&&e.nodeType===11&&e.childNodes.length===this.length?{fragment:e}:c.buildFragment(a,this,l);g=e.fragment;if(f=g.childNodes.length===1?g=g.firstChild:g.firstChild){b=b&&c.nodeName(f,"tr");f=0;for(var m=this.length,o=m-1;f<m;f++)d.call(b?c.nodeName(this[f],"table")?this[f].getElementsByTagName("tbody")[0]||this[f].appendChild(this[f].ownerDocument.createElement("tbody")):
this[f]:this[f],e.cacheable||m>1&&f<o?c.clone(g,true,true):g)}l.length&&c.each(l,vb)}return this}});c.buildFragment=function(a,b,d){var e,f,g,i;if(b&&b[0])i=b[0].ownerDocument||b[0];i.createDocumentFragment||(i=y);if(a.length===1&&typeof a[0]==="string"&&a[0].length<512&&i===y&&a[0].charAt(0)==="<"&&!db.test(a[0])&&(c.support.checkClone||!eb.test(a[0]))){f=true;if((g=c.fragments[a[0]])&&g!==1)e=g}if(!e){e=i.createDocumentFragment();c.clean(a,i,e,d)}if(f)c.fragments[a[0]]=g?e:1;return{fragment:e,cacheable:f}};
c.fragments={};c.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){c.fn[a]=function(d){var e=[];d=c(d);var f=this.length===1&&this[0].parentNode;if(f&&f.nodeType===11&&f.childNodes.length===1&&d.length===1){d[b](this[0]);return this}else{f=0;for(var g=d.length;f<g;f++){var i=(f>0?this.clone(true):this).get();c(d[f])[b](i);e=e.concat(i)}return this.pushStack(e,a,d.selector)}}});c.extend({clone:function(a,b,d){var e=a.cloneNode(true),
f,g,i;if((!c.support.noCloneEvent||!c.support.noCloneChecked)&&(a.nodeType===1||a.nodeType===11)&&!c.isXMLDoc(a)){Ka(a,e);f=ka(a);g=ka(e);for(i=0;f[i];++i)Ka(f[i],g[i])}if(b){Ja(a,e);if(d){f=ka(a);g=ka(e);for(i=0;f[i];++i)Ja(f[i],g[i])}}return e},clean:function(a,b,d,e){b=b||y;if(typeof b.createElement==="undefined")b=b.ownerDocument||b[0]&&b[0].ownerDocument||y;for(var f=[],g,i=0,l;(l=a[i])!=null;i++){if(typeof l==="number")l+="";if(l){if(typeof l==="string")if(Rb.test(l)){l=l.replace(bb,"<$1></$2>");
g=(cb.exec(l)||["",""])[1].toLowerCase();var m=P[g]||P._default,o=m[0],s=b.createElement("div");for(s.innerHTML=m[1]+l+m[2];o--;)s=s.lastChild;if(!c.support.tbody){o=Qb.test(l);m=g==="table"&&!o?s.firstChild&&s.firstChild.childNodes:m[1]==="<table>"&&!o?s.childNodes:[];for(g=m.length-1;g>=0;--g)c.nodeName(m[g],"tbody")&&!m[g].childNodes.length&&m[g].parentNode.removeChild(m[g])}!c.support.leadingWhitespace&&Ba.test(l)&&s.insertBefore(b.createTextNode(Ba.exec(l)[0]),s.firstChild);l=s.childNodes}else l=
b.createTextNode(l);var A;if(!c.support.appendChecked)if(l[0]&&typeof(A=l.length)==="number")for(g=0;g<A;g++)Ma(l[g]);else Ma(l);if(l.nodeType)f.push(l);else f=c.merge(f,l)}}if(d){a=function(G){return!G.type||Sb.test(G.type)};for(i=0;f[i];i++)if(e&&c.nodeName(f[i],"script")&&(!f[i].type||f[i].type.toLowerCase()==="text/javascript"))e.push(f[i].parentNode?f[i].parentNode.removeChild(f[i]):f[i]);else{if(f[i].nodeType===1){b=c.grep(f[i].getElementsByTagName("script"),a);f.splice.apply(f,[i+1,0].concat(b))}d.appendChild(f[i])}}return f},
cleanData:function(a){for(var b,d,e=c.cache,f=c.expando,g=c.event.special,i=c.support.deleteExpando,l=0,m;(m=a[l])!=null;l++)if(!(m.nodeName&&c.noData[m.nodeName.toLowerCase()]))if(d=m[c.expando]){if((b=e[d]&&e[d][f])&&b.events){for(var o in b.events)g[o]?c.event.remove(m,o):c.removeEvent(m,o,b.handle);if(b.handle)b.handle.elem=null}if(i)delete m[c.expando];else m.removeAttribute&&m.removeAttribute(c.expando);delete e[d]}}});var fb=/alpha\([^)]*\)/i,Tb=/opacity=([^)]*)/,Ub=/([A-Z]|^ms)/g,gb=/^-?\d+(?:px)?$/i,
Vb=/^-?\d/,Wb=/^[+\-]=/,Xb=/[^+\-\.\de]+/g,Yb={position:"absolute",visibility:"hidden",display:"block"},xb=["Left","Right"],yb=["Top","Bottom"],aa,hb,ib;c.fn.css=function(a,b){if(arguments.length===2&&b===u)return this;return c.access(this,a,b,true,function(d,e,f){return f!==u?c.style(d,e,f):c.css(d,e)})};c.extend({cssHooks:{opacity:{get:function(a,b){if(b){var d=aa(a,"opacity","opacity");return d===""?"1":d}else return a.style.opacity}}},cssNumber:{fillOpacity:true,fontWeight:true,lineHeight:true,
opacity:true,orphans:true,widows:true,zIndex:true,zoom:true},cssProps:{"float":c.support.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,d,e){if(!(!a||a.nodeType===3||a.nodeType===8||!a.style)){var f,g=c.camelCase(b),i=a.style,l=c.cssHooks[g];b=c.cssProps[g]||g;if(d!==u){e=typeof d;if(!(e==="number"&&isNaN(d)||d==null)){if(e==="string"&&Wb.test(d)){d=+d.replace(Xb,"")+parseFloat(c.css(a,b));e="number"}if(e==="number"&&!c.cssNumber[g])d+="px";if(!l||!("set"in l)||(d=l.set(a,d))!==u)try{i[b]=d}catch(m){}}}else{if(l&&
"get"in l&&(f=l.get(a,false,e))!==u)return f;return i[b]}}},css:function(a,b,d){var e,f;b=c.camelCase(b);f=c.cssHooks[b];b=c.cssProps[b]||b;if(b==="cssFloat")b="float";if(f&&"get"in f&&(e=f.get(a,true,d))!==u)return e;else if(aa)return aa(a,b)},swap:function(a,b,d){var e={},f;for(f in b){e[f]=a.style[f];a.style[f]=b[f]}d.call(a);for(f in b)a.style[f]=e[f]}});c.curCSS=c.css;c.each(["height","width"],function(a,b){c.cssHooks[b]={get:function(d,e,f){var g;if(e){if(d.offsetWidth!==0)return Na(d,b,f);
else c.swap(d,Yb,function(){g=Na(d,b,f)});return g}},set:function(d,e){if(gb.test(e)){e=parseFloat(e);if(e>=0)return e+"px"}else return e}}});if(!c.support.opacity)c.cssHooks.opacity={get:function(a,b){return Tb.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?parseFloat(RegExp.$1)/100+"":b?"1":""},set:function(a,b){var d=a.style,e=a.currentStyle;d.zoom=1;var f=c.isNaN(b)?"":"alpha(opacity="+b*100+")";e=e&&e.filter||d.filter||"";d.filter=fb.test(e)?e.replace(fb,f):e+" "+f}};c(function(){if(!c.support.reliableMarginRight)c.cssHooks.marginRight=
{get:function(a,b){var d;c.swap(a,{display:"inline-block"},function(){d=b?aa(a,"margin-right","marginRight"):a.style.marginRight});return d}}});if(y.defaultView&&y.defaultView.getComputedStyle)hb=function(a,b){var d,e;b=b.replace(Ub,"-$1").toLowerCase();if(!(e=a.ownerDocument.defaultView))return u;if(e=e.getComputedStyle(a,null)){d=e.getPropertyValue(b);if(d===""&&!c.contains(a.ownerDocument.documentElement,a))d=c.style(a,b)}return d};if(y.documentElement.currentStyle)ib=function(a,b){var d,e=a.currentStyle&&
a.currentStyle[b],f=a.runtimeStyle&&a.runtimeStyle[b],g=a.style;if(!gb.test(e)&&Vb.test(e)){d=g.left;if(f)a.runtimeStyle.left=a.currentStyle.left;g.left=b==="fontSize"?"1em":e||0;e=g.pixelLeft+"px";g.left=d;if(f)a.runtimeStyle.left=f}return e===""?"auto":e};aa=hb||ib;if(c.expr&&c.expr.filters){c.expr.filters.hidden=function(a){var b=a.offsetHeight;return a.offsetWidth===0&&b===0||!c.support.reliableHiddenOffsets&&(a.style.display||c.css(a,"display"))==="none"};c.expr.filters.visible=function(a){return!c.expr.filters.hidden(a)}}var Zb=
/%20/g,zb=/\[\]$/,jb=/\r?\n/g,$b=/#.*$/,ac=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,bc=/^(?:color|date|datetime|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,cc=/^(?:GET|HEAD)$/,dc=/^\/\//,kb=/\?/,ec=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,fc=/^(?:select|textarea)/i,Pa=/\s+/,gc=/([?&])_=[^&]*/,lb=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,mb=c.fn.load,ta={},nb={},Y,Z;try{Y=Cb.href}catch(oc){Y=y.createElement("a");Y.href="";Y=Y.href}Z=lb.exec(Y.toLowerCase())||
[];c.fn.extend({load:function(a,b,d){if(typeof a!=="string"&&mb)return mb.apply(this,arguments);else if(!this.length)return this;var e=a.indexOf(" ");if(e>=0){var f=a.slice(e,a.length);a=a.slice(0,e)}e="GET";if(b)if(c.isFunction(b)){d=b;b=u}else if(typeof b==="object"){b=c.param(b,c.ajaxSettings.traditional);e="POST"}var g=this;c.ajax({url:a,type:e,dataType:"html",data:b,complete:function(i,l,m){m=i.responseText;if(i.isResolved()){i.done(function(o){m=o});g.html(f?c("<div>").append(m.replace(ec,"")).find(f):
m)}d&&g.each(d,[m,l,i])}});return this},serialize:function(){return c.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?c.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||fc.test(this.nodeName)||bc.test(this.type))}).map(function(a,b){var d=c(this).val();return d==null?null:c.isArray(d)?c.map(d,function(e){return{name:b.name,value:e.replace(jb,"\r\n")}}):{name:b.name,value:d.replace(jb,"\r\n")}}).get()}});
c.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(a,b){c.fn[b]=function(d){return this.bind(b,d)}});c.each(["get","post"],function(a,b){c[b]=function(d,e,f,g){if(c.isFunction(e)){g=g||f;f=e;e=u}return c.ajax({type:b,url:d,data:e,success:f,dataType:g})}});c.extend({getScript:function(a,b){return c.get(a,u,b,"script")},getJSON:function(a,b,d){return c.get(a,b,d,"json")},ajaxSetup:function(a,b){if(b)c.extend(true,a,c.ajaxSettings,b);else{b=a;a=c.extend(true,
c.ajaxSettings,b)}for(var d in{context:1,url:1})if(d in b)a[d]=b[d];else if(d in c.ajaxSettings)a[d]=c.ajaxSettings[d];return a},ajaxSettings:{url:Y,isLocal:/^(?:about|app|app\-storage|.+\-extension|file|widget):$/.test(Z[1]),global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":"*/*"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",
text:"responseText"},converters:{"* text":E.String,"text html":true,"text json":c.parseJSON,"text xml":c.parseXML}},ajaxPrefilter:Oa(ta),ajaxTransport:Oa(nb),ajax:function(a,b){function d(n,q,v,x){if(N!==2){N=2;W&&clearTimeout(W);H=u;G=x||"";k.readyState=n?4:0;var B,O,K;if(v){x=e;var L=k,j=x.contents,t=x.dataTypes,z=x.responseFields,w,C,D,I;for(C in z)if(C in v)L[z[C]]=v[C];for(;t[0]==="*";){t.shift();if(w===u)w=x.mimeType||L.getResponseHeader("content-type")}if(w)for(C in j)if(j[C]&&j[C].test(w)){t.unshift(C);
break}if(t[0]in v)D=t[0];else{for(C in v){if(!t[0]||x.converters[C+" "+t[0]]){D=C;break}I||(I=C)}D=D||I}if(D){D!==t[0]&&t.unshift(D);v=v[D]}else v=void 0}else v=u;if(n>=200&&n<300||n===304){if(e.ifModified){if(w=k.getResponseHeader("Last-Modified"))c.lastModified[o]=w;if(w=k.getResponseHeader("Etag"))c.etag[o]=w}if(n===304){q="notmodified";B=true}else try{w=e;if(w.dataFilter)v=w.dataFilter(v,w.dataType);var J=w.dataTypes;C={};var S,oa,hc=J.length,pa,T=J[0],da,Ca,U,$,ea;for(S=1;S<hc;S++){if(S===1)for(oa in w.converters)if(typeof oa===
"string")C[oa.toLowerCase()]=w.converters[oa];da=T;T=J[S];if(T==="*")T=da;else if(da!=="*"&&da!==T){Ca=da+" "+T;U=C[Ca]||C["* "+T];if(!U){ea=u;for($ in C){pa=$.split(" ");if(pa[0]===da||pa[0]==="*")if(ea=C[pa[1]+" "+T]){$=C[$];if($===true)U=ea;else if(ea===true)U=$;break}}}U||ea||c.error("No conversion from "+Ca.replace(" "," to "));if(U!==true)v=U?U(v):ea($(v))}}O=v;q="success";B=true}catch(ic){q="parsererror";K=ic}}else{K=q;if(!q||n){q="error";if(n<0)n=0}}k.status=n;k.statusText=q;B?i.resolveWith(f,
[O,q,k]):i.rejectWith(f,[k,q,K]);k.statusCode(m);m=u;if(R)g.trigger("ajax"+(B?"Success":"Error"),[k,e,B?O:K]);l.resolveWith(f,[k,q]);if(R){g.trigger("ajaxComplete",[k,e]);--c.active||c.event.trigger("ajaxStop")}}}if(typeof a==="object"){b=a;a=u}b=b||{};var e=c.ajaxSetup({},b),f=e.context||e,g=f!==e&&(f.nodeType||f instanceof c)?c(f):c.event,i=c.Deferred(),l=c._Deferred(),m=e.statusCode||{},o,s={},A={},G,F,H,W,M,N=0,R,h,k={readyState:0,setRequestHeader:function(n,q){if(!N){var v=n.toLowerCase();n=
A[v]=A[v]||n;s[n]=q}return this},getAllResponseHeaders:function(){return N===2?G:null},getResponseHeader:function(n){var q;if(N===2){if(!F)for(F={};q=ac.exec(G);)F[q[1].toLowerCase()]=q[2];q=F[n.toLowerCase()]}return q===u?null:q},overrideMimeType:function(n){if(!N)e.mimeType=n;return this},abort:function(n){n=n||"abort";H&&H.abort(n);d(0,n);return this}};i.promise(k);k.success=k.done;k.error=k.fail;k.complete=l.done;k.statusCode=function(n){if(n){var q;if(N<2)for(q in n)m[q]=[m[q],n[q]];else{q=n[k.status];
k.then(q,q)}}return this};e.url=((a||e.url)+"").replace($b,"").replace(dc,Z[1]+"//");e.dataTypes=c.trim(e.dataType||"*").toLowerCase().split(Pa);if(e.crossDomain==null){M=lb.exec(e.url.toLowerCase());e.crossDomain=!!(M&&(M[1]!=Z[1]||M[2]!=Z[2]||(M[3]||(M[1]==="http:"?80:443))!=(Z[3]||(Z[1]==="http:"?80:443))))}if(e.data&&e.processData&&typeof e.data!=="string")e.data=c.param(e.data,e.traditional);la(ta,e,b,k);if(N===2)return false;R=e.global;e.type=e.type.toUpperCase();e.hasContent=!cc.test(e.type);
R&&c.active++===0&&c.event.trigger("ajaxStart");if(!e.hasContent){if(e.data)e.url+=(kb.test(e.url)?"&":"?")+e.data;o=e.url;if(e.cache===false){M=c.now();var p=e.url.replace(gc,"$1_="+M);e.url=p+(p===e.url?(kb.test(e.url)?"&":"?")+"_="+M:"")}}if(e.data&&e.hasContent&&e.contentType!==false||b.contentType)k.setRequestHeader("Content-Type",e.contentType);if(e.ifModified){o=o||e.url;c.lastModified[o]&&k.setRequestHeader("If-Modified-Since",c.lastModified[o]);c.etag[o]&&k.setRequestHeader("If-None-Match",
c.etag[o])}k.setRequestHeader("Accept",e.dataTypes[0]&&e.accepts[e.dataTypes[0]]?e.accepts[e.dataTypes[0]]+(e.dataTypes[0]!=="*"?", */*; q=0.01":""):e.accepts["*"]);for(h in e.headers)k.setRequestHeader(h,e.headers[h]);if(e.beforeSend&&(e.beforeSend.call(f,k,e)===false||N===2)){k.abort();return false}for(h in{success:1,error:1,complete:1})k[h](e[h]);if(H=la(nb,e,b,k)){k.readyState=1;R&&g.trigger("ajaxSend",[k,e]);if(e.async&&e.timeout>0)W=setTimeout(function(){k.abort("timeout")},e.timeout);try{N=
1;H.send(s,d)}catch(r){status<2?d(-1,r):c.error(r)}}else d(-1,"No Transport");return k},param:function(a,b){var d=[],e=function(g,i){i=c.isFunction(i)?i():i;d[d.length]=encodeURIComponent(g)+"="+encodeURIComponent(i)};if(b===u)b=c.ajaxSettings.traditional;if(c.isArray(a)||a.jquery&&!c.isPlainObject(a))c.each(a,function(){e(this.name,this.value)});else for(var f in a)ua(f,a[f],b,e);return d.join("&").replace(Zb,"+")}});c.extend({active:0,lastModified:{},etag:{}});var jc=c.now(),qa=/(\=)\?(&|$)|\?\?/i;
c.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return c.expando+"_"+jc++}});c.ajaxPrefilter("json jsonp",function(a,b,d){b=a.contentType==="application/x-www-form-urlencoded"&&typeof a.data==="string";if(a.dataTypes[0]==="jsonp"||a.jsonp!==false&&(qa.test(a.url)||b&&qa.test(a.data))){var e,f=a.jsonpCallback=c.isFunction(a.jsonpCallback)?a.jsonpCallback():a.jsonpCallback,g=E[f],i=a.url,l=a.data,m="$1"+f+"$2";if(a.jsonp!==false){i=i.replace(qa,m);if(a.url===i){if(b)l=l.replace(qa,m);if(a.data===
l)i+=(/\?/.test(i)?"&":"?")+a.jsonp+"="+f}}a.url=i;a.data=l;E[f]=function(o){e=[o]};d.always(function(){E[f]=g;if(e&&c.isFunction(g))E[f](e[0]);try{delete E[f]}catch(e){};});a.converters["script json"]=function(){e||c.error(f+" was not called");return e[0]};a.dataTypes[0]="json";return"script"}});c.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(a){c.globalEval(a);return a}}});
c.ajaxPrefilter("script",function(a){if(a.cache===u)a.cache=false;if(a.crossDomain){a.type="GET";a.global=false}});c.ajaxTransport("script",function(a){if(a.crossDomain){var b,d=y.head||y.getElementsByTagName("head")[0]||y.documentElement;return{send:function(e,f){b=y.createElement("script");b.async="async";if(a.scriptCharset)b.charset=a.scriptCharset;b.src=a.url;b.onload=b.onreadystatechange=function(g,i){if(i||!b.readyState||/loaded|complete/.test(b.readyState)){b.onload=b.onreadystatechange=null;
d&&b.parentNode&&d.removeChild(b);b=u;i||f(200,"success")}};d.insertBefore(b,d.firstChild)},abort:function(){if(b)b.onload(0,1)}}}});var Da=E.ActiveXObject?function(){for(var a in fa)fa[a](0,1)}:false,kc=0,fa;c.ajaxSettings.xhr=E.ActiveXObject?function(){var a;if(!(a=!this.isLocal&&Qa()))a:{try{a=new E.ActiveXObject("Microsoft.XMLHTTP");break a}catch(b){}a=void 0}return a}:Qa;(function(a){c.extend(c.support,{ajax:!!a,cors:!!a&&"withCredentials"in a})})(c.ajaxSettings.xhr());c.support.ajax&&c.ajaxTransport(function(a){if(!a.crossDomain||
c.support.cors){var b;return{send:function(d,e){var f=a.xhr(),g,i;a.username?f.open(a.type,a.url,a.async,a.username,a.password):f.open(a.type,a.url,a.async);if(a.xhrFields)for(i in a.xhrFields)f[i]=a.xhrFields[i];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType);if(!a.crossDomain&&!d["X-Requested-With"])d["X-Requested-With"]="XMLHttpRequest";try{for(i in d)f.setRequestHeader(i,d[i])}catch(l){}f.send(a.hasContent&&a.data||null);b=function(m,o){var s,A,G,F,H;try{if(b&&(o||f.readyState===
4)){b=u;if(g){f.onreadystatechange=c.noop;Da&&delete fa[g]}if(o)f.readyState!==4&&f.abort();else{s=f.status;G=f.getAllResponseHeaders();F={};if((H=f.responseXML)&&H.documentElement)F.xml=H;F.text=f.responseText;try{A=f.statusText}catch(W){A=""}if(!s&&a.isLocal&&!a.crossDomain)s=F.text?200:404;else if(s===1223)s=204}}}catch(M){o||e(-1,M)}F&&e(s,A,F,G)};if(!a.async||f.readyState===4)b();else{g=++kc;if(Da){if(!fa){fa={};c(E).unload(Da)}fa[g]=b}f.onreadystatechange=b}},abort:function(){b&&b(0,1)}}}});
var va={},Q,ca,lc=/^(?:toggle|show|hide)$/,mc=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,ga,Sa=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],ma,Ea=E.webkitRequestAnimationFrame||E.mozRequestAnimationFrame||E.oRequestAnimationFrame;c.fn.extend({show:function(a,b,d){if(a||a===0)return this.animate(ba("show",3),a,b,d);else{d=0;for(var e=this.length;d<e;d++){a=this[d];if(a.style){b=a.style.display;if(!c._data(a,
"olddisplay")&&b==="none")b=a.style.display="";b===""&&c.css(a,"display")==="none"&&c._data(a,"olddisplay",Ta(a.nodeName))}}for(d=0;d<e;d++){a=this[d];if(a.style){b=a.style.display;if(b===""||b==="none")a.style.display=c._data(a,"olddisplay")||""}}return this}},hide:function(a,b,d){if(a||a===0)return this.animate(ba("hide",3),a,b,d);else{a=0;for(b=this.length;a<b;a++)if(this[a].style){d=c.css(this[a],"display");d!=="none"&&!c._data(this[a],"olddisplay")&&c._data(this[a],"olddisplay",d)}for(a=0;a<
b;a++)if(this[a].style)this[a].style.display="none";return this}},_toggle:c.fn.toggle,toggle:function(a,b,d){var e=typeof a==="boolean";if(c.isFunction(a)&&c.isFunction(b))this._toggle.apply(this,arguments);else a==null||e?this.each(function(){var f=e?a:c(this).is(":hidden");c(this)[f?"show":"hide"]()}):this.animate(ba("toggle",3),a,b,d);return this},fadeTo:function(a,b,d,e){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:b},a,d,e)},animate:function(a,b,d,e){var f=c.speed(b,
d,e);if(c.isEmptyObject(a))return this.each(f.complete,[false]);a=c.extend({},a);return this[f.queue===false?"each":"queue"](function(){f.queue===false&&c._mark(this);var g=c.extend({},f),i=this.nodeType===1,l=i&&c(this).is(":hidden"),m,o,s,A,G;g.animatedProperties={};for(s in a){m=c.camelCase(s);if(s!==m){a[m]=a[s];delete a[s]}o=a[m];if(c.isArray(o)){g.animatedProperties[m]=o[1];o=a[m]=o[0]}else g.animatedProperties[m]=g.specialEasing&&g.specialEasing[m]||g.easing||"swing";if(o==="hide"&&l||o===
"show"&&!l)return g.complete.call(this);if(i&&(m==="height"||m==="width")){g.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY];if(c.css(this,"display")==="inline"&&c.css(this,"float")==="none")if(c.support.inlineBlockNeedsLayout){o=Ta(this.nodeName);if(o==="inline")this.style.display="inline-block";else{this.style.display="inline";this.style.zoom=1}}else this.style.display="inline-block"}}if(g.overflow!=null)this.style.overflow="hidden";for(s in a){i=new c.fx(this,g,s);o=a[s];
if(lc.test(o))i[o==="toggle"?l?"show":"hide":o]();else{m=mc.exec(o);A=i.cur();if(m){o=parseFloat(m[2]);G=m[3]||(c.cssNumber[s]?"":"px");if(G!=="px"){c.style(this,s,(o||1)+G);A*=(o||1)/i.cur();c.style(this,s,A+G)}if(m[1])o=(m[1]==="-="?-1:1)*o+A;i.custom(A,o,G)}else i.custom(A,o,"")}}return true})},stop:function(a,b){a&&this.queue([]);this.each(function(){var d=c.timers,e=d.length;for(b||c._unmark(true,this);e--;)if(d[e].elem===this){if(b)d[e](true);d.splice(e,1)}});b||this.dequeue();return this}});
c.each({slideDown:ba("show",1),slideUp:ba("hide",1),slideToggle:ba("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){c.fn[a]=function(d,e,f){return this.animate(b,d,e,f)}});c.extend({speed:function(a,b,d){var e=a&&typeof a==="object"?c.extend({},a):{complete:d||!d&&b||c.isFunction(a)&&a,duration:a,easing:d&&b||b&&!c.isFunction(b)&&b};e.duration=c.fx.off?0:typeof e.duration==="number"?e.duration:e.duration in c.fx.speeds?c.fx.speeds[e.duration]:
c.fx.speeds._default;e.old=e.complete;e.complete=function(f){c.isFunction(e.old)&&e.old.call(this);if(e.queue!==false)c.dequeue(this);else f!==false&&c._unmark(this)};return e},easing:{linear:function(a,b,d,e){return d+e*a},swing:function(a,b,d,e){return(-Math.cos(a*Math.PI)/2+0.5)*e+d}},timers:[],fx:function(a,b,d){this.options=b;this.elem=a;this.prop=d;b.orig=b.orig||{}}});c.fx.prototype={update:function(){this.options.step&&this.options.step.call(this.elem,this.now,this);(c.fx.step[this.prop]||
c.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null))return this.elem[this.prop];var a,b=c.css(this.elem,this.prop);return isNaN(a=parseFloat(b))?!b||b==="auto"?0:b:a},custom:function(a,b,d){function e(l){return f.step(l)}var f=this,g=c.fx,i;this.startTime=ma||Ra();this.start=a;this.end=b;this.unit=d||this.unit||(c.cssNumber[this.prop]?"":"px");this.now=this.start;this.pos=this.state=0;e.elem=this.elem;if(e()&&c.timers.push(e)&&
!ga)if(Ea){ga=true;i=function(){if(ga){Ea(i);g.tick()}};Ea(i)}else ga=setInterval(g.tick,g.interval)},show:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.show=true;this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur());c(this.elem).show()},hide:function(){this.options.orig[this.prop]=c.style(this.elem,this.prop);this.options.hide=true;this.custom(this.cur(),0)},step:function(a){var b=ma||Ra(),d=true,e=this.elem,f=this.options,g;if(a||b>=f.duration+
this.startTime){this.now=this.end;this.pos=this.state=1;this.update();f.animatedProperties[this.prop]=true;for(g in f.animatedProperties)if(f.animatedProperties[g]!==true)d=false;if(d){f.overflow!=null&&!c.support.shrinkWrapBlocks&&c.each(["","X","Y"],function(l,m){e.style["overflow"+m]=f.overflow[l]});f.hide&&c(e).hide();if(f.hide||f.show)for(var i in f.animatedProperties)c.style(e,i,f.orig[i]);f.complete.call(e)}return false}else{if(f.duration==Infinity)this.now=b;else{a=b-this.startTime;this.state=
a/f.duration;this.pos=c.easing[f.animatedProperties[this.prop]](this.state,a,0,1,f.duration);this.now=this.start+(this.end-this.start)*this.pos}this.update()}return true}};c.extend(c.fx,{tick:function(){for(var a=c.timers,b=0;b<a.length;++b)a[b]()||a.splice(b--,1);a.length||c.fx.stop()},interval:13,stop:function(){clearInterval(ga);ga=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(a){c.style(a.elem,"opacity",a.now)},_default:function(a){if(a.elem.style&&a.elem.style[a.prop]!=
null)a.elem.style[a.prop]=(a.prop==="width"||a.prop==="height"?Math.max(0,a.now):a.now)+a.unit;else a.elem[a.prop]=a.now}}});if(c.expr&&c.expr.filters)c.expr.filters.animated=function(a){return c.grep(c.timers,function(b){return a===b.elem}).length};var nc=/^t(?:able|d|h)$/i,ob=/^(?:body|html)$/i;c.fn.offset="getBoundingClientRect"in y.documentElement?function(a){var b=this[0],d;if(a)return this.each(function(i){c.offset.setOffset(this,a,i)});if(!b||!b.ownerDocument)return null;if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);
try{d=b.getBoundingClientRect()}catch(e){}var f=b.ownerDocument,g=f.documentElement;if(!d||!c.contains(g,b))return d?{top:d.top,left:d.left}:{top:0,left:0};b=f.body;f=wa(f);return{top:d.top+(f.pageYOffset||c.support.boxModel&&g.scrollTop||b.scrollTop)-(g.clientTop||b.clientTop||0),left:d.left+(f.pageXOffset||c.support.boxModel&&g.scrollLeft||b.scrollLeft)-(g.clientLeft||b.clientLeft||0)}}:function(a){var b=this[0];if(a)return this.each(function(o){c.offset.setOffset(this,a,o)});if(!b||!b.ownerDocument)return null;
if(b===b.ownerDocument.body)return c.offset.bodyOffset(b);c.offset.initialize();var d,e=b.offsetParent,f=b.ownerDocument,g=f.documentElement,i=f.body;d=(f=f.defaultView)?f.getComputedStyle(b,null):b.currentStyle;for(var l=b.offsetTop,m=b.offsetLeft;(b=b.parentNode)&&b!==i&&b!==g;){if(c.offset.supportsFixedPosition&&d.position==="fixed")break;d=f?f.getComputedStyle(b,null):b.currentStyle;l-=b.scrollTop;m-=b.scrollLeft;if(b===e){l+=b.offsetTop;m+=b.offsetLeft;if(c.offset.doesNotAddBorder&&!(c.offset.doesAddBorderForTableAndCells&&
nc.test(b.nodeName))){l+=parseFloat(d.borderTopWidth)||0;m+=parseFloat(d.borderLeftWidth)||0}e=b.offsetParent}if(c.offset.subtractsBorderForOverflowNotVisible&&d.overflow!=="visible"){l+=parseFloat(d.borderTopWidth)||0;m+=parseFloat(d.borderLeftWidth)||0}}if(d.position==="relative"||d.position==="static"){l+=i.offsetTop;m+=i.offsetLeft}if(c.offset.supportsFixedPosition&&d.position==="fixed"){l+=Math.max(g.scrollTop,i.scrollTop);m+=Math.max(g.scrollLeft,i.scrollLeft)}return{top:l,left:m}};c.offset=
{initialize:function(){var a=y.body,b=y.createElement("div"),d,e,f,g=parseFloat(c.css(a,"marginTop"))||0;c.extend(b.style,{position:"absolute",top:0,left:0,margin:0,border:0,width:"1px",height:"1px",visibility:"hidden"});b.innerHTML="<div style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;'><div></div></div><table style='position:absolute;top:0;left:0;margin:0;border:5px solid #000;padding:0;width:1px;height:1px;' cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";
a.insertBefore(b,a.firstChild);d=b.firstChild;e=d.firstChild;f=d.nextSibling.firstChild.firstChild;this.doesNotAddBorder=e.offsetTop!==5;this.doesAddBorderForTableAndCells=f.offsetTop===5;e.style.position="fixed";e.style.top="20px";this.supportsFixedPosition=e.offsetTop===20||e.offsetTop===15;e.style.position=e.style.top="";d.style.overflow="hidden";d.style.position="relative";this.subtractsBorderForOverflowNotVisible=e.offsetTop===-5;this.doesNotIncludeMarginInBodyOffset=a.offsetTop!==g;a.removeChild(b);
c.offset.initialize=c.noop},bodyOffset:function(a){var b=a.offsetTop,d=a.offsetLeft;c.offset.initialize();if(c.offset.doesNotIncludeMarginInBodyOffset){b+=parseFloat(c.css(a,"marginTop"))||0;d+=parseFloat(c.css(a,"marginLeft"))||0}return{top:b,left:d}},setOffset:function(a,b,d){var e=c.css(a,"position");if(e==="static")a.style.position="relative";var f=c(a),g=f.offset(),i=c.css(a,"top"),l=c.css(a,"left"),m={},o={};if((e==="absolute"||e==="fixed")&&c.inArray("auto",[i,l])>-1){o=f.position();e=o.top;
l=o.left}else{e=parseFloat(i)||0;l=parseFloat(l)||0}if(c.isFunction(b))b=b.call(a,d,g);if(b.top!=null)m.top=b.top-g.top+e;if(b.left!=null)m.left=b.left-g.left+l;"using"in b?b.using.call(a,m):f.css(m)}};c.fn.extend({position:function(){if(!this[0])return null;var a=this[0],b=this.offsetParent(),d=this.offset(),e=ob.test(b[0].nodeName)?{top:0,left:0}:b.offset();d.top-=parseFloat(c.css(a,"marginTop"))||0;d.left-=parseFloat(c.css(a,"marginLeft"))||0;e.top+=parseFloat(c.css(b[0],"borderTopWidth"))||0;
e.left+=parseFloat(c.css(b[0],"borderLeftWidth"))||0;return{top:d.top-e.top,left:d.left-e.left}},offsetParent:function(){return this.map(function(){for(var a=this.offsetParent||y.body;a&&!ob.test(a.nodeName)&&c.css(a,"position")==="static";)a=a.offsetParent;return a})}});c.each(["Left","Top"],function(a,b){var d="scroll"+b;c.fn[d]=function(e){var f,g;if(e===u){f=this[0];if(!f)return null;return(g=wa(f))?"pageXOffset"in g?g[a?"pageYOffset":"pageXOffset"]:c.support.boxModel&&g.document.documentElement[d]||
g.document.body[d]:f[d]}return this.each(function(){if(g=wa(this))g.scrollTo(!a?e:c(g).scrollLeft(),a?e:c(g).scrollTop());else this[d]=e})}});c.each(["Height","Width"],function(a,b){var d=b.toLowerCase();c.fn["inner"+b]=function(){var e=this[0];return e&&e.style?parseFloat(c.css(e,d,"padding")):null};c.fn["outer"+b]=function(e){var f=this[0];return f&&f.style?parseFloat(c.css(f,d,e?"margin":"border")):null};c.fn[d]=function(e){var f=this[0];if(!f)return e==null?null:this;if(c.isFunction(e))return this.each(function(i){var l=
c(this);l[d](e.call(this,i,l[d]()))});if(c.isWindow(f)){var g=f.document.documentElement["client"+b];return f.document.compatMode==="CSS1Compat"&&g||f.document.body["client"+b]||g}else if(f.nodeType===9)return Math.max(f.documentElement["client"+b],f.body["scroll"+b],f.documentElement["scroll"+b],f.body["offset"+b],f.documentElement["offset"+b]);else if(e===u){f=c.css(f,d);g=parseFloat(f);return c.isNaN(g)?f:g}else return this.css(d,typeof e==="string"?e:e+"px")}});E.aijQuery=E.ai$=c})(window);
