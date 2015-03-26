var
  express = require('express'),
  router = express.Router(),
  path = require('path'),
  fs = require('fs'),
  app = express();

app.param(function(name, fn){
  if (fn instanceof RegExp) {
    return function(req, res, next, val){
      var captures;
      if (captures = fn.exec(String(val))) {
        req.params[name] = captures;
        next();
      } else {
        next('route');
      }
    }
  }
});

app.param('id', /^[0-9]+$/);
app.param('display', /^[_a-z0-9]+$/);

router.get('/form/:display', function ($req, $res) {
  var $path = path.join(app.get('views'), 'material/form', $req.params.display);
  fs.exists($path + '.ejs', function ($exists) {
    if ( !$exists ) {
      console.log('fwefew');
      throw new Error('Not found file: ' + $path);
      return;
    }

    $res.render($path);
  });
});

router.get('/', function ($req, $res) {
  
  $res.render('material/index', {});
});

module.exports = router;