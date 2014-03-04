$ ->
  $log = $("#log")
  $form = $("#console")
  $input = $("#console-input")

  setTimeout (->
    $input.focus()
  ), 100

  history = if localStorage["history"]? then JSON.parse(localStorage["history"]) else []
  $log.append if localStorage["log"]? then localStorage["log"] else help
  $$ = null

  $form.submit (ev)->
    input = $input.val()
    if n = (/^\.(\d+)$/.exec(input) or ["", ""])[1]
      $input.val(history[n-1])
    else if /^\.hist$/.test(input)
      $input.val("")
      output = history.map((v, i)-> "#{i}\t#{v}").join("\n") 
      log = """
        coffee> #{input}
        #{output}
      """
      localStorage["log"] += log
      $log.append(log)
    else if /\s$/.test(input)
      {fst, snd, trd} = autocomplete(input.replace(/\s+$/,""))
      if      trd.length is 0
      else if trd.length is 1
        _input = fst+snd+trd[0]
        $input.val(_input)
      else
        _input = input.replace(/\s+$/,"")
        $input.val(_input)
        log = """
          coffee> #{input}
          #{trd.map((key)->snd+key).join("\n")}\n\n
        """
        localStorage["log"] += log
        $log.append(log)
        $(window).scrollTop 9999999
    else if /^\.clear/.test(input)
      $input.val("")
      $log.html("")
      localStorage["log"] = ""
    else if /^\.help/.test(input)
      output = help
      $input.val("")
      log = """
        coffee> #{input}
        #{output}
      """
      localStorage["log"] += log
      $log.append(log)
    else
      history.unshift(input)
      localStorage["history"] = JSON.stringify(history)
      buffer = ""
      log = (str)-> buffer += str + "\n"; undefined
      dir = (obj, i=0)-> buffer += dump(obj, i) + "\n"; undefined
      clear = -> $log.html(""); undefined
      try
        $$ = evaluate(macroexpand(input), {log, clear, dir, type, load, $$})
        output = buffer + dump($$) + "\n\n"
      catch err
        output = buffer + err.stack + "\n"
      $input.val("")
      log = """
        coffee> #{input}
        #{output}
      """
      localStorage["log"] += log
      $log.append(log)
    setTimeout (->
      $(window).scrollTop 9999999
      $input.focus()
    ), 100
    false

help = """
  .help  show repl options
  .1     last input
  .[n]   nth input
  .hist  view history
  .clear clear log

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
  $$         last result variable
  \n
"""

load = (url, next)-> # string -> ((node)-> void) -> void
  script = document.createElement("script")
  script.src = url
  script.onload = next
  document.body.appendChild(script)
  undefined

macroexpand = (code)-> # string -> string
  CoffeeScript.compile(code, {bare:true}).replace(/var[^\;]+;\n\n/,"")
console.assert(macroexpand("do -> x") is "(function() {\n  return x;\n})();\n", "macroexpand")

evaluate = (code, env=this)-> # string -> Object -> any
  `var result;
  with(env){
    result = eval(code);
  }`
  result
console.assert(evaluate("this") is this, "evaluate")

getPropertys = (o)-> # any -> [string]
  tmp = {}
  keys = []
  while o
    keys = keys.concat Object.getOwnPropertyNames(o)
    o = Object.getPrototypeOf(o)
  keys.filter((key)->
    if tmp[key]? then false
    else              tmp[key] = true
  ).sort()
console.assert(""+getPropertys({a:0}) is ""+getPropertys(Object.create({a:0})), "getPropertys")

suggest = (a, b)-> # string -> string -> [string]
  reg = new RegExp("^#{b}.*")
  getPropertys(try evaluate("(#{a})") catch err then {})
    .filter (key)-> reg.test(key)
console.assert(suggest("this", "conso")[0]   is "console", "suggest conso")
console.assert(suggest("console", "lo")[0]   is "log",     "suggest console.lo")
console.assert(suggest("Math", "p")[0]       is "pow",     "suggest Math.p")
console.assert(suggest("Object.call", "c")[0]is "call",    "suggest Object.call.c")

autocomplete = (code)-> # string -> (string, string, [string])
  reg = /((?:[A-Za-z0-9$_](?:\.(?:[A-Za-z0-9$_]+)?)?)+)$/
  if exp = (reg.exec(code) or ["", ""])[1]
    pre = code.replace(exp, "")
    if exp.lastIndexOf(".") is -1
      result = suggest("this", exp)
      {fst: pre, snd: "", trd:result}
    else
      n = exp.lastIndexOf(".")
      a = exp.slice(0, n)
      b = exp.slice(n+1)
      result = suggest(a, b)
      {fst: pre, snd: a+".", trd:result}
  else
    {fst: code, snd:"", trd: []}
console.assert((do -> {fst,snd,trd}=autocomplete("conso");     fst is ""    and snd is ""         and trd[0] is "console"), "autocomplete conso")
console.assert((do -> {fst,snd,trd}=autocomplete("console.lo");fst is ""    and snd is "console." and trd[0] is "log"),     "autocomplete console.lo")
console.assert((do -> {fst,snd,trd}=autocomplete("if Math.P"); fst is "if " and snd is "Math."    and trd[0] is "PI"),      "autocomplete if Math.P")

type = (o)-> # any -> string
  if      o is null              then "null"
  else if o is undefined         then "undefined"
  else if o is window            then "global"
  else if o.nodeType?            then "node"
  else if typeof o isnt "object" then typeof o
  else
    _type = Object.prototype.toString.call(o)
    _type = ""+o.constructor if _type is "[object Object]"
    (/^\[object (\w+)\]$/.exec(_type)   or
     /^\s*function\s+(\w+)/.exec(_type) or
     ["", "object"]
    )[1].toLowerCase()
console.assert(type(null)      is "null",      "type null")
console.assert(type(undefined) is "undefined", "type undefined")
console.assert(type(true)      is "boolean",   "type boolean")
console.assert(type(0)         is "number",    "type number")
console.assert(type("string")  is "string",    "type string")
console.assert(type(->)        is "function",  "type function")
console.assert(type([])        is "array",     "type array")
console.assert(type({})        is "object",    "type object")
console.assert(type(new Date)  is "date",      "type date")
console.assert(type(Math)      is "math",      "type math")
console.assert(type(/0/)       is "regexp",    "type regexp")
console.assert(type(window)    is "global",    "type global")
console.assert(type(document.createElement("div")) is "node", "type node")
console.assert(type(new (class Foo)) is "foo", "type foo")

dump = (o, depth=0, i=0)-> # any -> number? -> number? -> string
  space = (i)-> [0..i].map(-> "").join("  ")
  dumpObj = (o)->
    if getPropertys(o).length is 0 then "{}"
    else
      props = getPropertys(o)
        .map((k)-> "#{space(i+1)}#{k}: #{dump(o[k], depth, i+1)}")
        .join(",\n")
      """{
        #{props}
        #{space(i)}}
      """
  switch type(o)
    when "null", "undefined", "boolean",  "number" then ""+o
    when "string"                                  then "\"#{o}\""
    when "function"                                then Object.prototype.toString.call(o)
    when "date"                                    then JSON.stringify(o)                                              Object.prototype.toString.call(o)
    when "array"
      if i < depth                                 then "[#{(dump(v, max, i+1) for v in o).join(", ")}]" 
      else                                              Object.prototype.toString.call(o)
    else
      if i < depth                                 then dumpObj(o)
      else                                              Object.prototype.toString.call(o)
console.assert(dump({a:{b:{c:0,d:0}}}) is "[object Object]", "dump {a:{b:{c:0,d:0}}}")
console.assert(dump({a:{b:{c:0,d:0}}},3) is "{\n  a: {\n    b: {\n      c: 0,\n      d: 0\n    }\n  }\n}", "dump {a:{b:{c:0,d:0}}}, 3")



