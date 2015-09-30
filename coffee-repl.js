(function(global) {
"use strict";

// --- dependency modules ----------------------------------
var CoffeeScript = global["CoffeeScript"];

// --- class / interfaces ----------------------------------
function CoffeeScriptREPL(){
    this["log"] = "";
    this["buffer"] = "coffee> ";
    this["defaultInput"] = "";
    this["inputQueue"] = [];
    this["outputQueue"] = [];
}

CoffeeScriptREPL["help"] = (function(){/*
.help  show repl options
.[n]   revert last nth input
.hist  view input history
.clear clear log
.jquery load(jquery.js)
.lodash load(lodash.js)

c[space][enter]
cons[space][enter]
console.[space][enter]
console.lo[space][enter]
       autosuggestion

log(str)   alt console.log()
clear()    alt console.clear()
dir(obj [, depth])
           alt console.dir()
type(obj)  alt typeof()
load(url)  load js file
$$[n]         last nth result variable
*/}).toString().match(/^function\s*\(\s*\)\s*\{\s*\/\*([\S\s]*?)\*\/\s*\}$/)[1];

CoffeeScriptREPL["prototype"] = {
    "terminal": CoffeeScriptREPL_terminal,  // Function(String):void
    "evaluate": CoffeeScriptREPL_evaluate,  // Function(String):void
    "addLog":   CoffeeScriptREPL_addLog,    // Function(String):void
    "clearLog": CoffeeScriptREPL_clearLog   // Function():void
};

// --- implements ------------------------------------------
function CoffeeScriptREPL_terminal(input,  // @arg String
                                   depth){ // @arg Number default = 0
                                           // @ret Void
    var n, that = this;
    depth = depth || 0
    this["defaultInput"] = "";
    if (n = (/^\.([123456789](?:\d+)?)/.exec(input) || ["", ""])[1]) {
        if(!!this["inputQueue"][this["inputQueue"]["length"] - n]){
            this["defaultInput"] = this["inputQueue"][this["inputQueue"]["length"] - n];
        } else {
            this["defaultInput"] = input;
        }
    } else if (/^\.hi/.test(input)) {
        this["buffer"] = "coffee> " + input + "\n" + this["inputQueue"]["map"](function(str, i){
            return that["inputQueue"]["length"] - i + ": " + str
        })["join"]("\n")
    } else if (/\s$/.test(input)) {
        var tmp = autocomplete(input["trimRight"]());
        if(tmp["results"]["length"] === 0){
            this["defaultInput"] = input["trimRight"]();
        } else if(tmp["results"]["length"] === 1){
            this["defaultInput"] = tmp["tokens"][0] + tmp["tokens"][1] + (tmp["tokens"][1]["length"] === 0 ? "" : ".") + tmp["results"][0];
        } else {
            this["buffer"] = "coffee> " + input + "\n" + tmp["results"]["join"](" \t");
            this["defaultInput"] = input["trimRight"]();
        }
    } else if (/^.c/.test(input)) {
        this["clearLog"]();
    } else if (/^.he/.test(input)) {
        this["log"] = "coffee> " + input + "\n" + CoffeeScriptREPL["help"];
    } else if (/^.j/.test(input)) {
      load("https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js");
      this["log"] = "coffee> load('https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js')";
    } else if (/^.l/.test(input)) {
      load("https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.10.1/lodash.min.js");
      this["log"] = "coffee> load('https://cdnjs.cloudflare.com/ajax/libs/lodash.js/3.10.1/lodash.min.js')";
    } else {
        this["buffer"] = "";
        this["log"] += "coffee> " + input + "\n";
        try{
            var _log = dump(this["evaluate"](input), depth) + "\n";
        }catch(err){
            var _log = err["stack"] + "\n";
        }
        this["log"] += _log;
    }
}

function CoffeeScriptREPL_evaluate(input){ // @arg String
                                           // @ret Void
    this["inputQueue"]["push"](input);
    var that = this;
    var preprocessed = "do ->\n  " + input["split"]("\n")["join"]("\n  ");
    var expanded = macroexpand(preprocessed);
    var env = {
        "log": function(o){ that["addLog"](o); },
        "clear": function(){ that["clearLog"](); },
        "dir": function(o, i){ return dump(o, i); },
        "type": function(o){ return type(o); },
        "load": function(url){ load(url); }
    };
    this["outputQueue"]["forEach"](function(val, i){
        env["$$"+(that["outputQueue"]["length"] - 1 - i)] = val;
    });
    var output = evaluate(expanded, env);
    this["outputQueue"]["push"](output);
    return output;
}

function CoffeeScriptREPL_addLog(o){
    this["log"] += dump(o) + "\n";
}

function CoffeeScriptREPL_clearLog(){
    this["log"] = "";
    this["buffer"] = "coffee> ";
    this["defaultInput"] = "";
}

// --- functions ------------------------------------------
function load(url,        // @arg URLString
              callback) { // @arg Function
                          // @ret Void
    var script = document.createElement("script");
    script.src = url;
    script.onload = callback;
    document.body.appendChild(script);
}

function macroexpand(code) { // @arg CoffeeScriptString
                             // @ret JavaScriptString
    var compiled = CoffeeScript["compile"](code, {"bare": true});
    var replaced = compiled["replace"](/var[^\;]+;\n\n/, "");
    return replaced;
}

function evaluate(code,  // @arg String
                  env) { // @arg Object
                         // @ret Any
    env = env || {};
    var vars = Object.keys(env);
    var vals = vars.map(function(key){ return env[key]; });
    var args = vars.concat("return " + code + ";");
    var fn = Function.apply(this, args);
    return fn.apply(self, vals);
}
console.assert(evaluate("unko", {unko:0}) === 0, "evaluate");

function getPropertys(o){ // @arg Object
                          // @ret StringArray
    /*
    var keys1 = (function(o){
        var results = [];
        for(key in o) results.push(key);
        return results;
    })(o);
    var keys2 = Object.keys(o);
    */
    var keys3 = (function(o){
        var results = [];
        while(o) {
            results = results.concat(Object.getOwnPropertyNames(o));
            o = Object.getPrototypeOf(o);
        }
        return results;
    })(o);
    //var keys = [].concat(keys1, keys2, keys3);
    var keys = keys3;
    var merged = keys.reduce(function(_, key){
        if(!!_["keySet"][key]) return _;
        _["keySet"][key] = true;
        _["results"]["push"](key);
        return _;
    },{"keySet":{}, "results":[]})["results"];
    var sorted = merged.sort();
    return sorted;
}
console.assert(getPropertys({a:0, b:0}).length === 2, "getPropertys");

function suggest(env,      // @arg Object
                 keyword){ // @arg String
                           // @ret StringArray
    var reg = new RegExp("^" + keyword + ".*");
    var keys = getPropertys(env);
    var candidates = keys.filter(function(key) {
      return reg.test(key) && key !== keyword;
    });
    return candidates;
}
console.assert(suggest(self, "sel").length === 1, "suggest");

function autocomplete(code) { // @arg String
                              // @ret Object
    var reg = /((?:[A-Za-z0-9$_](?:\.(?:[A-Za-z0-9$_]+)?)?)+)$/;
    var exp = (reg.exec(code) || ["", ""])[1]
    var pre = code.replace(exp, "");
    var arr = exp.split(".");
    var env = arr.slice(0, arr.length-1).join(".");
    var key = arr.slice(arr.length-1)[0];
    if(key.length === 0){
        var results = getPropertys(evaluate(env));
    } else if (env.length === 0){
        var results = suggest(self, key);
    } else {
        var results = suggest(evaluate(env), key);
    }
    if(exp === key){
        return {"tokens": [pre, "", key], "results": results};
    } else{
        return {"tokens": [pre, env, key], "results": results};
    }
}
console.assert(autocomplete("if"    ).results.length === 0, "autocomplete 1");
console.assert(autocomplete("if win").results[0] === "window", "autocomplete 2");
console.assert(autocomplete("if window.sel").results[0] === "self", "autocomplete 2");

function type(o) { // @arg Object
                   // @ret String
    if (o === null) {                   return "null";
    } else if (o === void 0) {          return "undefined";
    } else if (o === self) {            return "global";
    } else if (o["nodeType"] != null) { return "node";
    } else if (typeof o !== "object") { return typeof o;
    } else {
        var str = Object.prototype.toString.call(o);
        return ((str === "[object Object]" ?
                 /^\s*function\s+(\w+)/.exec("" + o["constructor"]) :
                 /^\[object (\w+)\]$/.exec(str)
                ) || ["", "object"])[1]["toLowerCase"]();
    }
}
console.assert(type(null) === "null", "type null");
console.assert(type(void 0) === "undefined", "type undefined");
console.assert(type(true) === "boolean", "type boolean");
console.assert(type(0) === "number", "type number");
console.assert(type("string") === "string", "type string");
console.assert(type(function() {}) === "function", "type function");
console.assert(type([]) === "array", "type array");
console.assert(type({}) === "object", "type object");
console.assert(type(new Date) === "date", "type date");
console.assert(type(Math) === "math", "type math");
console.assert(type(/0/) === "regexp", "type regexp");
console.assert(type(window) === "global", "type global");
console.assert(type(document.createElement("div")) === "node", "type node");
console.assert(type(new (function Foo(){})) === "foo", "type foo");


function dump(o,      // @arg Object
              depth){ // @arg Number?
                      // @ret String
    depth = depth || 0;
    return recur(o, depth, 0, []);
    function recur(o, depth, i, ancestors){
        switch (type(o)) {
            case "null":
            case "undefined":
            case "boolean":
            case "number":   return "" + o;
            case "string":   return "\"" + o.split('\n').join('\\n') + "\"";
            case "function": return Object.prototype.toString.call(o);
            case "date":     return JSON.stringify(o);
            case "array":
                if (ancestors.some(function(_o){ return _o === o;})) {
                    return Object.prototype.toString.call(o) + "// Recursive Definition";
                } else if (i >= depth) {
                    return Object.prototype.toString.call(o);
                } else {
                    var arr = o.map(function(val){
                        return recur(val, depth, i + 1, ancestors.concat(o));
                    }).join(", ");
                    return "[" + arr + "]";
                }
            default:
                if (ancestors.some(function(_o){ return _o === o;})) {
                    return Object.prototype.toString.call(o) + " <- Recursive Definition";
                } else if (i >= depth) {
                    return Object.prototype.toString.call(o);
                } else {
                    var keys = getPropertys(o);
                    if (keys.length === 0) {
                        return "{}";
                    } else {
                        var props = keys.map(function(key) {
                            var val = recur(o[key], depth, i + 1, ancestors.concat(o));
                            return "" + space(i+1) + key + ": " + val;
                        }).join(",\n");
                        return "{\n" + props + "\n" + space(i) + "}";
                    }
                }
        }
    }
}
console.assert(dump({a:{b:{c:0,d:0}}}) === "[object Object]", "dump {a:{b:{c:0,d:0}}}");
console.assert(dump({a:{b:{c:0,d:0}}},3) === "{\n  a: {\n    b: {\n      c: 0,\n      d: 0\n    }\n  }\n}", "dump {a:{b:{c:0,d:0}}}, 3");


function space(i){ // @arg Number
                   // @ret String
    var result = "";
    while(i--) result += "  ";
    return result;
}
console.assert(space(0) === "",     "space 0");
console.assert(space(1) === "  ",   "space 1");
console.assert(space(2) === "    ", "space 2");

// --- exports ---------------------------------------------
global["CoffeeScriptREPL" in global ? "CoffeeScriptREPL_" : "CoffeeScriptREPL"] = CoffeeScriptREPL;

})((this || 0).self || global);
