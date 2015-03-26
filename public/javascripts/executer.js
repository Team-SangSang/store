$(function () {
  "use strict";

  var Executer = function () {
    var
      $socket = io('http://localhost:8000'),

      $commandModel = function () {
        this.type = '';
        this.value = '';
      },

      _command = {
        analogWrite: function ($pin, $val, $done) {
          var $callback = function () {
            $socket.off('awCallback', $callback);

            $done();
          };

          $socket.on('awCallback', $callback);


          $socket.emit('analogWrite', {pin: $pin, value: $val});
        },

        pinMode: function ($pin, $mode, $done) {
          var $callback = function () {
            $socket.off('pmCallback', $callback);

            $done();
          };

          $socket.on('pmCallback', $callback);


          $socket.emit('pinMode', {pin: $pin, value: $mode});
        },

        digitalWrite: function ($pin, $value, $done) {
          var $callback = function () {
            $socket.off('dwCallback', $callback);

            $done();
          };

          $socket.on('dwCallback', $callback);

          $socket.emit('digitalWrite', {pin: $pin, value: $value});
        },

        digitalRead: function ($pin, $done) {
          var $callback = function ($data) {
            $socket.off('drCallback', $callback);

            $done($data);
          };

          $socket.on('drCallback', $callback);

          $socket.emit('digitalRead', {pin: $pin});
        },

        analogRead: function ($pin, $done) {
          var $callback = function ($data) {
            $socket.off('arCallback', $callback);

            $done($data);
          };

          $socket.on('arCallback', $callback);

          $socket.emit('analogRead', {pin: $pin});
        },

        servoDetach: function ($pin, $done) {
          var $callback = function ($data) {
            $socket.off('svDetach', $callback);

            $done($data);
          };

          $socket.on('svDetach', $callback);

          $socket.emit('servoDetach', {pin: $pin});
        },

        servoAttach: function ($pin, $done) {
          var $callback = function ($data) {
            $socket.off('svAttach', $callback);

            $done($data);
          };

          $socket.on('svAttach', $callback);

          $socket.emit('servoAttach', {pin: $pin});
        },

        servoWrite: function ($pin, $pos, $done) {
          var $callback = function ($data) {
            $socket.off('svWrite', $callback);

            $done($data);
          };

          $socket.on('svWrite', $callback);

          $socket.emit('servoWrite', {pin: $pin, val: $pos});
        },

        setOne: function ($pin, $val, $done) {
          var $callback = function () {
            $socket.off('soCallback', $callback);

            $done();
          };

          $socket.on('soCallback', $callback);

          $socket.emit('setOne', {pin: $pin, val: $val});
        },

        setRGB: function ($pin, $r, $g, $b, $done) {
          var $callback = function () {
            $socket.off('rgbCallback', $callback);

            $done();
          };

          $socket.on('rgbCallback', $callback);

          $socket.emit('setRGB', {pin: $pin, r: $r, g: $g, b: $b});
        },

        setAllRGB: function ($r, $g, $b, $done) {
          var $callback = function () {
            $socket.off('argbCallback', $callback);

            $done();
          };

          $socket.on('argbCallback', $callback);

          $socket.emit('setAllRGB', {r: $r, g: $g, b: $b});
        },

        setHSV: function ($pin, $h, $s, $v, $done) {
          var $callback = function () {
            $socket.off('hsvCallback', $callback);

            $done();
          };

          $socket.on('hsvCallback', $callback);

          $socket.emit('setHSV', {pin: $pin, h: $h, s: $s, v: $v});
        },

        setAllHSV: function ($h, $s, $v, $done) {
          var $callback = function () {
            $socket.off('ahsvCallback', $callback);

            $done();
          };

          $socket.on('ahsvCallback', $callback);

          $socket.emit('setAllHSV', {h: $h, s: $s, v: $v});
        }
      };

    $socket.off = $socket.removeListener;

    for ( var $i in _command ) {
      _command[$i].prototype = new $commandModel();
    }

    return _command;
  }();

  // make it public
  window.Executer = Executer;
});