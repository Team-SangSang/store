var
  port = process.env.PORT || 5432,
  
  // load modules
  express = require('express'),
  path = require('path'),
  favicon = require('serve-favicon'),
  logger = require('morgan'),
  cookie = require('cookie-parser'),
  session = require('cookie-session'),
  body = require('body-parser'),
  routes = require('./routes/index'),
  material = require('./routes/material'), 
  http = require('http'),
  app = express(),
  engine = require('ejs-locals'),
  server = http.createServer(app).listen(port),

  passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy;

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// set display from ejs engine
app.set('view engine', 'ejs');

app.engine('ejs', engine);

app.set('env', 'development');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(body.json({limit: '50mb'}));
app.use(body.urlencoded({limit: '50mb', extended: false }));
app.use(cookie());
app.use(session({secret: 'WeWillBeKoreaFinalistOfInnovation'}));
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use('/', routes);

// serialize
// 인증후 사용자 정보를 세션에 저장
passport.serializeUser(function(user, done) {
    console.log('serialize');
    done(null, user);
});
 
 
// deserialize
// 인증후, 사용자 정보를 세션에서 읽어서 request.user에 저장
passport.deserializeUser(function(user, done) {
    //findById(id, function (err, user) {
    console.log('deserialize');
    done(null, user);
    //});
});
 
passport.use(new FacebookStrategy({
        clientID: '393591520822349',
        clientSecret: 'c2cfe94f302db66c828e66518f920de6',
        callbackURL: "http://studio321.kr/fb/callback",
        profileFields: ['id', 'displayName', 'photos']
    },
    function(accessToken, refreshToken, profile, done) {
        console.log(profile);
        done(null,profile);
    }
));

app.get('/fb', passport.authenticate('facebook', { scope: ['user_status', 'user_checkins', 'user_about_me', 'user_birthday', 'user_website', 'publish_actions', 'user_photos'] }));

app.get('/fb/callback',passport.authenticate('facebook', {
  successRedirect: '/fb/login/success',
  failureRedirect: '/fb/login/failed'
}));

var ensureAuthenticated = function (request, respone, next) {
  next();
};

app.get('/fb/login/success', ensureAuthenticated, function(req, res){
    res.redirect('/');
});
app.get('/fb/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

// catch 404 and forward to $error handler
app.use(function ($req, $res, $next) {
    var $err = new Error('Not Found');
    $err.status = 404;
    $next($err);
});

// $error handlers

// development $error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function ($err, $req, $res, $next) {
        $res.status($err.status || 500);
        $res.render('error', {
            message: $err.message,
            error: $err
        });

        console.log($err);
    });
}

// productsocketn $error handler
// no stacktraces leaked to user
app.use(function ($err, $req, $res, $next) {
    $res.status($err.status || 500);
    $res.render('error', {
        message: $err.message,
        error: {}
    }); 
});

// set app public
module.exports = app;