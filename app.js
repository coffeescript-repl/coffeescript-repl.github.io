// Generated by CoffeeScript 1.7.1
(function() {
  var Foo, autocomplete, dump, evaluate, getPropertys, help, load, macroexpand, suggest, type;

  $(function() {
    var $$, $form, $input, $log, history;
    $log = $("#log");
    $form = $("#console");
    $input = $("#console-input");
    setTimeout((function() {
      return $input.focus();
    }), 100);
    history = localStorage["history"] != null ? JSON.parse(localStorage["history"]) : [];
    $log.append(localStorage["log"] != null ? localStorage["log"] : help);
    $$ = null;
    return $form.submit(function(ev) {
      var buffer, clear, dir, err, fst, input, log, n, output, snd, trd, _input, _ref;
      input = $input.val();
      if (n = (/^\.(\d+)$/.exec(input) || ["", ""])[1]) {
        $input.val(history[n - 1]);
      } else if (/^\.hist$/.test(input)) {
        $input.val("");
        output = history.map(function(v, i) {
          return "" + i + "\t" + v;
        }).join("\n");
        log = "coffee> " + input + "\n" + output;
        localStorage["log"] += log;
        $log.append(log);
      } else if (/\s$/.test(input)) {
        _ref = autocomplete(input.replace(/\s+$/, "")), fst = _ref.fst, snd = _ref.snd, trd = _ref.trd;
        if (trd.length === 0) {

        } else if (trd.length === 1) {
          _input = fst + snd + trd[0];
          $input.val(_input);
        } else {
          _input = input.replace(/\s+$/, "");
          $input.val(_input);
          log = "coffee> " + input + "\n" + (trd.map(function(key) {
            return snd + key;
          }).join("\n")) + "\n\n";
          localStorage["log"] += log;
          $log.append(log);
          $(window).scrollTop(9999999);
        }
      } else if (/^\.clear/.test(input)) {
        $input.val("");
        $log.html("");
        localStorage["log"] = "";
      } else if (/^\.help/.test(input)) {
        output = help;
        $input.val("");
        log = "coffee> " + input + "\n" + output;
        localStorage["log"] += log;
        $log.append(log);
      } else {
        history.unshift(input);
        localStorage["history"] = JSON.stringify(history);
        buffer = "";
        log = function(str) {
          buffer += str + "\n";
          return void 0;
        };
        dir = function(obj, i) {
          if (i == null) {
            i = 0;
          }
          buffer += dump(obj, i) + "\n";
          return void 0;
        };
        clear = function() {
          $log.html("");
          return void 0;
        };
        try {
          $$ = evaluate(macroexpand(input), {
            log: log,
            clear: clear,
            dir: dir,
            type: type,
            load: load,
            $$: $$
          });
          output = buffer + dump($$) + "\n\n";
        } catch (_error) {
          err = _error;
          output = buffer + err.stack + "\n";
        }
        $input.val("");
        log = "coffee> " + input + "\n" + output;
        localStorage["log"] += log;
        $log.append(log);
      }
      setTimeout((function() {
        $(window).scrollTop(9999999);
        return $input.focus();
      }), 100);
      return false;
    });
  });

  help = ".help  show repl options\n.1     last input\n.[n]   nth input\n.hist  view history\n.clear clear log\n\nc[space][enter]\ncons[space][enter]\nconsole.[space][enter]\nconsole.lo[space][enter]\n       autosuggestion\n\nlog(str)   alt console.log()\nclear()    alt console.clear()\ndir(obj [, depth])\n           alt console.dir()\ntype(obj)  alt typeof()\nload(url)  load js file\n$$         last result variable\n\n";

  load = function(url, next) {
    var script;
    script = document.createElement("script");
    script.src = url;
    script.onload = next;
    document.body.appendChild(script);
    return void 0;
  };

  macroexpand = function(code) {
    return CoffeeScript.compile(code, {
      bare: true
    }).replace(/var[^\;]+;\n\n/, "");
  };

  console.assert(macroexpand("do -> x") === "(function() {\n  return x;\n})();\n", "macroexpand");

  evaluate = function(code, env) {
    if (env == null) {
      env = this;
    }
    return eval.call(env, code);
  };

  console.assert(evaluate("this") === this, "evaluate");

  getPropertys = function(o) {
    var keys, tmp;
    tmp = {};
    keys = [];
    while (o) {
      keys = keys.concat(Object.getOwnPropertyNames(o));
      o = Object.getPrototypeOf(o);
    }
    return keys.filter(function(key) {
      if (tmp[key] != null) {
        return false;
      } else {
        return tmp[key] = true;
      }
    }).sort();
  };

  console.assert("" + getPropertys({
    a: 0
  }) === "" + getPropertys(Object.create({
    a: 0
  })), "getPropertys");

  suggest = function(a, b) {
    var err, reg;
    reg = new RegExp("^" + b + ".*");
    return getPropertys((function() {
      try {
        return evaluate("(" + a + ")");
      } catch (_error) {
        err = _error;
        return {};
      }
    })()).filter(function(key) {
      return reg.test(key);
    });
  };

  console.assert(suggest("this", "conso")[0] === "console", "suggest conso");

  console.assert(suggest("console", "lo")[0] === "log", "suggest console.lo");

  console.assert(suggest("Math", "p")[0] === "pow", "suggest Math.p");

  console.assert(suggest("Object.call", "c")[0] === "call", "suggest Object.call.c");

  autocomplete = function(code) {
    var a, b, exp, n, pre, reg, result;
    reg = /((?:[A-Za-z0-9$_](?:\.(?:[A-Za-z0-9$_]+)?)?)+)$/;
    if (exp = (reg.exec(code) || ["", ""])[1]) {
      pre = code.replace(exp, "");
      if (exp.lastIndexOf(".") === -1) {
        result = suggest("this", exp);
        return {
          fst: pre,
          snd: "",
          trd: result
        };
      } else {
        n = exp.lastIndexOf(".");
        a = exp.slice(0, n);
        b = exp.slice(n + 1);
        result = suggest(a, b);
        return {
          fst: pre,
          snd: a + ".",
          trd: result
        };
      }
    } else {
      return {
        fst: code,
        snd: "",
        trd: []
      };
    }
  };

  console.assert((function() {
    var fst, snd, trd, _ref;
    _ref = autocomplete("conso"), fst = _ref.fst, snd = _ref.snd, trd = _ref.trd;
    return fst === "" && snd === "" && trd[0] === "console";
  })(), "autocomplete conso");

  console.assert((function() {
    var fst, snd, trd, _ref;
    _ref = autocomplete("console.lo"), fst = _ref.fst, snd = _ref.snd, trd = _ref.trd;
    return fst === "" && snd === "console." && trd[0] === "log";
  })(), "autocomplete console.lo");

  console.assert((function() {
    var fst, snd, trd, _ref;
    _ref = autocomplete("if Math.P"), fst = _ref.fst, snd = _ref.snd, trd = _ref.trd;
    return fst === "if " && snd === "Math." && trd[0] === "PI";
  })(), "autocomplete if Math.P");

  type = function(o) {
    var _type;
    if (o === null) {
      return "null";
    } else if (o === void 0) {
      return "undefined";
    } else if (o === window) {
      return "global";
    } else if (o.nodeType != null) {
      return "node";
    } else if (typeof o !== "object") {
      return typeof o;
    } else {
      _type = Object.prototype.toString.call(o);
      if (_type === "[object Object]") {
        _type = "" + o.constructor;
      }
      return (/^\[object (\w+)\]$/.exec(_type) || /^\s*function\s+(\w+)/.exec(_type) || ["", "object"])[1].toLowerCase();
    }
  };

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

  console.assert(type(new (Foo = (function() {
    function Foo() {}

    return Foo;

  })())) === "foo", "type foo");

  dump = function(o, depth, i) {
    var dumpObj, space, v;
    if (depth == null) {
      depth = 0;
    }
    if (i == null) {
      i = 0;
    }
    space = function(i) {
      var _i, _results;
      return (function() {
        _results = [];
        for (var _i = 0; 0 <= i ? _i <= i : _i >= i; 0 <= i ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this).map(function() {
        return "";
      }).join("  ");
    };
    dumpObj = function(o) {
      var props;
      if (getPropertys(o).length === 0) {
        return "{}";
      } else {
        props = getPropertys(o).map(function(k) {
          return "" + (space(i + 1)) + k + ": " + (dump(o[k], depth, i + 1));
        }).join(",\n");
        return "{\n" + props + "\n" + (space(i)) + "}";
      }
    };
    switch (type(o)) {
      case "null":
      case "undefined":
      case "boolean":
      case "number":
        return "" + o;
      case "string":
        return "\"" + o + "\"";
      case "function":
        return Object.prototype.toString.call(o);
      case "date":
        return JSON.stringify(o)(Object.prototype.toString.call(o));
      case "array":
        if (i < depth) {
          return "[" + (((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = o.length; _i < _len; _i++) {
              v = o[_i];
              _results.push(dump(v, max, i + 1));
            }
            return _results;
          })()).join(", ")) + "]";
        } else {
          return Object.prototype.toString.call(o);
        }
        break;
      default:
        if (i < depth) {
          return dumpObj(o);
        } else {
          return Object.prototype.toString.call(o);
        }
    }
  };

  console.assert(dump({
    a: {
      b: {
        c: 0,
        d: 0
      }
    }
  }) === "[object Object]", "dump {a:{b:{c:0,d:0}}}");

  console.assert(dump({
    a: {
      b: {
        c: 0,
        d: 0
      }
    }
  }, 3) === "{\n  a: {\n    b: {\n      c: 0,\n      d: 0\n    }\n  }\n}", "dump {a:{b:{c:0,d:0}}}, 3");

}).call(this);

//# sourceMappingURL=app.map
