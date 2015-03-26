var
  express = require('express'),
  router = express.Router(),
  app = express(),

  dbSystem = require('./db-system'),
  db = dbSystem(),

  passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,

  dateFormat = require('date-format'),

  viewData = require('../common/view.config.js');

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

app.param('id', /^[0-9a-f]+$/);
app.param('page', /^[0-9]+$/);
app.param('search', /^.$/);
app.param('category', /%[0-9a-zA-Z]+$/);

router.use(function (request, respone, next) {
  viewData.request = request;

  /*  console.log("token: ", FB.getAccessToken());

  FB.api('me', {fields: ['id', 'name']}, function (respone) {
    if ( !respone || respone.error ) {
      console.log(!respone ? 'error occurred' : respone.error);
      return;
    }

    console.log(respone);
  });*/

  next();
});

router.use('/user', function (request, respone, next) {
});

router.get('/user/login', function (request, respone, next) {
  FB.api('oauth/access_token', {
    client_id: '393591520822349',
    client_secret: 'c2cfe94f302db66c828e66518f920de6',
    grant_type: 'client_credentials'
  }, function (res) {
      if(!res || res.error) {
          console.log(!res ? 'error occurred' : res.error);
          return;
      }

      var accessToken = res.access_token;

      console.log(res);
  });
});

router.get('/user/logout', function (request, respone, next) {
});

router.use('/create', function (request, respone, next) {
  next();
});

router.get('/create', function (request, respone, next) {
  respone.render('create/default', viewData);
});

// register new project
router.post('/create/register', function (request, respone, next) {
  var
    Union = db.model.Union;

    defaultData = {
      category_id: null,
      user_id: null,
      parent: null,
      profile_img: '/images/profile_temp.png',
      thumbnail: null,
      author: 'Han BaHwan',
      password: '1234',
      title: request.title,
      content: '',
      regdate: new Date(),
      lastedit: new Date(),
      canBeShared: true,
      isReleased: true,
      view: 0,
      clone: 0,
      play: 0,
      like: 0
    },

    crypto = require('crypto'),
    shasum = crypto.createHash('sha1'),

    requestData = ['title', 'description'];

  for (var i = 0, length = requestData.length; i < length; i++) {
    if ( request.body[requestData[i]] )
      defaultData[requestData[i]] = request.body[requestData[i]];
  }

  defaultData.password =  crypto.createHash('sha256').update(defaultData.password).digest('hex');

  var newUnion = new Union(defaultData);

  newUnion.save(function (error, union) {
    if ( error ) throw error;

    respone.redirect('/app/edit/' + union._id);
  });
});

router.use('/app/', function (request, respone, next) {
  next();
});

router.get('/app/:id', function (request, respone, next) {
  var
    Union = db.model.Union;

  Union.findById(request.params.id, function (error, union) {
    if ( error ) return errorHandler(error);

    if ( !union ) {
      next(new Error('no Data'));
      return;
    }

    union.lasteditF = dateFormat('yyyy-MM-dd hh:mm', union.lastedit);
    union.regdateF  = dateFormat('yyyy-MM-dd hh:mm', union.regdate);
    viewData.union = union;

    respone.render('app/view', viewData);
  });
});

router.get('/app/player/:id', function (request, respone, next) {
  var
    Union = db.model.Union;

  Union.findById(request.params.id, function (error, union) {
    if ( error ) return errorHandler(error);

    if ( !union ) {
      next(new Error('no Data'));
      return;
    }

    viewData.union = union;

    respone.render('app/player', viewData);
  });
});

// app editing
router.use('/app/edit', function (request, respone, next) {
  next();
});

router.get('/app/preview/:id', function (request, respone, next) {

});


router.get('/app/edit/:id', function (request, respone, next) {
  var Union = db.model.Union;

  Union.findOne({_id: request.params.id}, 'title description isReleased thumbnail lastedit', function (error, union) {
    if ( error ) next(error);

    if ( !union ) {
      next(new Error('No data'));
      return;
    }

    union.lasteditF = dateFormat('yyyy-MM-dd hh:mm:ss', union.lastedit);

    viewData.union = union;

    respone.render('app/edit', viewData);
  });
});

router.post('/app/edit', function (request, respone, next) {
  next();
});

router.post('/app/edit/info', function (request, respone, next) {
  var
    Union = db.model.Union,
    params = request.body;

  Union.findOne({_id: params.id}, '*', function (error, union) {
    if ( error ) return errorHandler(error);

    if ( !union ) {
      next(new Error('No data'));
      return;
    }

    var updateList = ['title', 'description', 'isReleased'];

    for ( var i = 0, length = updateList.length; i < length; i++ ) {
      var fieldName = updateList[i];

      if ( params[fieldName] ) {
        union[fieldName] = params[fieldName];
      }
    }

    union.lastedit = new Date();

    union.save();

    respone.redirect('/app/edit/' + union._id);
  });
});

router.post('/app/edit/union', function (request, respone, next) {
  var
    Union = db.model.Union,
    params = request.body;

  Union.findOne({_id: params.id}, '*', function (error, union) {
    if ( error ) respone.json({'error': 1, message: error});

    if ( !union ) {
      respone.json({'error': 1, 'message': "The data doesn't exist"});
      return;
    }

    var updateList = ['content', 'thumbnail'];

    for ( var i = 0, length = updateList.length; i < length; i++ ) {
      var fieldName = updateList[i];

      if ( params[fieldName] ) {
        union[fieldName] = params[fieldName];
      }
    }

    union.lastedit = new Date();

    union.save();

    respone.json({'error': 0, 'message': '', 'union': union});
  });
});

router.post('/app/export', function (request, respone, next) {
  var
    Union = db.model.Union,
    params = request.body;

    defaultData = {
      category_id: null,
      user_id: null,
      parent: params.id,
      profile_img: '/images/profile_temp.png',
      thumbnail: null,
      author: 'Han BaHwan',
      password: '1234',
      title: params.title,
      content: params.content,
      regdate: new Date(),
      lastedit: new Date(),
      canBeShared: true,
      isReleased: false,
      view: 0,
      clone: 0,
      play: 0,
      like: 0
    },

    crypto = require('crypto'),
    shasum = crypto.createHash('sha1');

  defaultData.password =  crypto.createHash('sha256').update(defaultData.password).digest('hex');

  var newUnion = new Union(defaultData);

  newUnion.save(function (error, union) {
    if ( error ) throw error;

    respone.send(union);
  });
});

router.get('/app/import/:id', function (request, respone, next) {
  var
    Union = db.model.Union,
    params = request.params;

  Union.findOne({_id: params.id}, 'content title description regdate', function (error, union) {
    if ( error ) respone.json({'error': 1, message: error});

    if ( !union ) {
      respone.json({'error': 1, 'message': "The data doesn't exist"});
      return;
    }

    respone.json({'error': 0, 'content': union.content, 'title': union.title, 'description': union.description, 'id': union._id, 'regdate': union.regdate});
  });
});

router.post('/app/search', function (request, respone, next) {
  var
    Union = db.model.Union,
    params = request.body;

  Union.find({title: params.title}, function (error, union) {
    respone.json(union);
  });
});

router.get('/store', function (request, respone, next) {
});

router.get('/', function (request, respone) {
  var
    Union = db.model.Union;

  Union.find({isReleased: true}).limit(8).sort('-_id').exec(function (error, union) {
    viewData.union = union;
  
    respone.render('index', viewData);
  });
});

module.exports = router;