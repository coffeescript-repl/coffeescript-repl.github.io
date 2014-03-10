var express = require('express');

express()
  .disable('x-powered-by')
  .use(express.static(__dirname + '/htdocs'))
  .listen(8082);