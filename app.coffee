$ ->
  $log = $("#log")
  $form = $("#console")
  $input = $("#console-input")

  setTimeout (->
    $input.focus()
    $form.submit()
  ), 100
  history = []
  $_ = null

  $form.submit (ev)->
    input = $input.val()
    history.unshift(input)
    if n = (/\.(\d+)$/.exec(input) or [false, false])[1]
      $input.val(history[n])
    else if /\s$/.test(input)
      [pre, ary] = autocomplete(input)
      if ary.length is 0
      else if ary.length is 1
        $input.val((pre+" "+ary[0]).replace(/^\s+/,""))
      else
        $input.val(input.replace(/\s+$/,""))
        $log.append("coffee> #{input}\n")
        $log.append("#{ary.join("\n")}\n")
        $(window).scrollTop 9999999
    else
      if /\.help$/.test(input)
        output = help
      else
        buffer = ""
        log = (str)-> buffer += str+"\n"; undefined
        clear = -> $log.html(""); undefined
        try
          output = evaluate(macroexpand(input), {log, clear, $_})
        catch err
          output = buffer+err+"\n"+err.stack
      $_ = output
      $input.val("")
      $log.append("coffee> #{input}\n")
      $log.append(output+"\n")
      $log.append("\n")
    setTimeout (->
      $(window).scrollTop 9999999
      $input.focus()
    ), 100
    false

help = """
  .help  show repl options
  .1     last input
  .n     nth input

  conso[space][enter]
  console.lo[space][enter]
         autocomplete
  console.[space][enter]
         autosuggestion

  log(str)     alter console.log()
  clear()      alter console.clear()
  dir(obj [, depth])
               alter console.dir()
  type(obj)    alter typeof()
  include(url) include js file
  $_           last output value
"""

include = (url, next)->
  script = document.createElement("script")
  script.src = url
  script.onload = next
  document.body.appendChild(script)
  undefined

macroexpand = (code)->
  CoffeeScript.compile(code, {bare:true}).replace(/var[^\;]+;\n\n/,"")
console.assert(macroexpand("do -> x") is "(function() {\n  return x;\n})();\n", "macroexpand")

evaluate = (code, env=this)->
  `var result;
  with(env){
    result = eval(code);
  }`
  result
console.assert(evaluate("window") is window, "evaluate")

getPropertys = (o)->
  if !o? then return []
  ary = [].concat Object.getOwnPropertyNames(o), (key for key of o)
  tmp = {}
  _ary = ary.filter (key)->
    if tmp[key]? then false
    else              tmp[key] = true
  _ary.sort()
console.assert(""+getPropertys({a:0}) is ""+getPropertys(Object.create({a:0})), "getPropertys")

suggest = (code, token)->
  reg = new RegExp("^#{token}.*")
  try
    result = evaluate("(#{code})")
  catch err
    result = {}
  getPropertys(result).filter (key)-> reg.test(key)
console.assert(suggest("window", "conso")[0] is "console", "suggest conso")
console.assert(suggest("console", "lo")[0]   is "log",     "suggest console.lo")
console.assert(suggest("Math", "p")[0]       is "pow",     "suggest Math.p")

autocomplete = (code)->
  tokens = (code+" ").split(/\s+/).slice(0, -1)
  token = tokens.pop()
  pre = tokens.join(" ")
  if token.indexOf(".") is -1 # "wind"
    result = suggest("window", token).map (str)->
      str.replace(/\s+$/,"")
  else
    ary = token.split(".")
    obj = ary.slice(0, -1).join(".")
    key = ary[ary.length-1]
    result = suggest(obj, key).map (str)->
      obj+"."+str.replace(/\s+$/,"")
  [pre, result]
console.assert(autocomplete("conso")[0]         is "" and
               autocomplete("conso")[1][0]      is "console",      "autocomplete conso")
console.assert(autocomplete("console.lo")[0]    is "" and
               autocomplete("console.lo")[1][0] is "console.log",  "autocomplete console.lo")
console.assert(autocomplete("if {a:0}.")[0]     is "if"
               autocomplete("if {a:0}.")[1][0]  is "{a:0}.a",      "autocomplete {a:0}.")
###
type = (o)->
  if      o is null              then "null"
  else if o is undefined         then "undefined"
  else if o is window            then "global"
  else if o.nodeType?            then "node"
  else if typeof o isnt "object" then typeof o
  else
    _type = Object.prototype.toString.call(o)
    if _type is "[object Object]"
      _type = ""+o.constructor
    (/^\[object (\w+)\]$/.exec(_type)   or
          /^\s*function\s+(\w+)/.exec(_type) or
          ["", "object"])[1].toLowerCase()
###
`function type(mix) { // @arg Mix: search
                        // @ret TypeLowerCaseString:
                        // @help: mm.type
                        // @desc: get type/class name
    var rv, type, global = window;

    rv = mix === null   ? "null"
       : mix === void 0 ? "undefined"
       : mix === global ? "global"
       : mix.nodeType   ? "node"
       //: mix.__CLASS__  ? mix.__CLASS__ // ES Spec: [[Class]] like internal property
       : "";

    if (rv) {
        return rv;
    }
    // typeof primitive -> "number", "string", "boolean"
    type = typeof mix;
    if (type !== "object") {
        return type;
    }

    // Object.prototype.toString.call(Hoge) -> "[object Hoge]"
    // (new Hoge).constructor.name -> "Hoge" (except IE)
    // (new Hoge).constructor + "" -> "[object Hoge]" or "function Hoge()..."

    type = Object.prototype.toString.call(mix);
    if (type === "[object Object]") {
        rv = mix.constructor.name;
        if (!rv) {
            type = mix.constructor + "";
        }
    }
    if (!rv) {
        rv = ( /^\[object (\w+)\]$/.exec(type)   ||
               /^\s*function\s+(\w+)/.exec(type) || ["", ""] )[1];
    }

    if (!rv || rv === "Object") {
        if (mix[/*mm.strict ? "" : */"callee"] ||
            typeof mix.item === "function") {
            return "list"; // Arguments
        }
    }
    /*if (rv in _mm_type_alias_db) {
        return _mm_type_alias_db[rv];
    }*/
    return rv ? rv.toLowerCase() : "object";
}`
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
console.assert(type(document.createElement("div")) is "node",  "type node")
console.assert(type(new (class Foo)) is "foo", "type foo")

space = (i)-> [0..i].map(->"").join("  ")
console.assert(space(0) is "",   "space 0")
console.assert(space(1) is "  ", "space 1")

dir = (o, max=1, i=0) ->
  dumpObj = (o)->
    if getPropertys(o).length is 0 then "{}"
    else                           "{\n#{(getPropertys(o).map (k)->"#{space(i+1)}#{k}: #{dir(o[k], max, i+1)}").join(",\n")}\n#{space(i)}}"
  switch type(o)
    when "null", "undefined", "boolean",  "number" then ""+o
    when "string"                                  then "\"#{o}\""
    when "function"                                then Object.prototype.toString.call(o)
    when "date"                                    then JSON.stringify(o)
    when "array"
      if i < max                                   then "[#{(dir(v, max, i+1) for v in o).join(", ")}]" 
      else                                              Object.prototype.toString.call(o)
    else
      if i < max                                   then dumpObj(o)
      else                                              Object.prototype.toString.call(o)
console.assert(dir({a:0}) is dir(Object.create({a:0})), "dir")


