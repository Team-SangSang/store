/*$(function () {

  var
    $socket = io('http://localhost:8000');

  $socket.on('test', function ($data) {
  });

  var
    $CmdList = $('#CmdLine'),

    $works = [],
    $nextWork = 0,

    doWork = function () {
      if ( $nextWork < $works.length ) {
        $works[$nextWork].func($works[$nextWork].model);
      }
      else {
        $works = [];
        $nextWork = 0;
      }

      $nextWork++;
    },

    passWork = function () {
      $nextWork++;

      doWork();

      $nextWork--;
    };
    
    CmdNode = function ($params) {
      var _cmd = {
        'render': function () {},
        'execute': function () {}
      };

      _.extend(_cmd, $params);

      return _cmd;
    },

    PinMatch = {
      13: 'Debug LED',
      15: 'Custum LED'
    },

    $selectedPins = [],

    CmdMatch = {
      'selector': new CmdNode({
        'render': function ($node) {
          var $Pins, $content = '';

          $node.find('td.content').text('개체 선택');
          $Pins = $node.attr('value').split(',');
          
          for ( var $i in $Pins ) {
            $Pins[$i] = $Pins[$i].trim();

            $content += PinMatch[$Pins[$i]] + ' ';
          }

          $node.find('td.value').text($content);
        },

        'execute': function ($node) {
          selectedPins = [];
          $Pins = $node.attr('value').split(',');
          
          for ( var $i in $Pins ) {
            $selectedPins[$i] = $Pins[$i].trim();
          }

          passWork();
        }
      }),
      'value': new CmdNode({
        'render': function ($node) {
          $node.find('td.content').text('출력 수정');
          $node.find('td.value').text($node.attr('value'));
        },

        'execute': function ($node) {
          var $value = $node.attr('value');

          for ( var $i in $selectedPins ) {
            $socket.emit('digitalWrite', {pin: $selectedPins[$i], value: $value});
          }
        }
      }),
      'delay': new CmdNode({
        'render': function ($node) {
          $node.find('td.content').text('명령 대기');
          $node.find('td.value').text($node.attr('value') + 'ms');
        },

        'execute': function ($node) {
          var $value = $node.attr('value');
          
          $socket.emit('delay', {value: $value});
        }
      })
    },

    CmdListRender = function () {
      var
        $no = 1;

      $CmdList.find('tr').each(function ($i, ui) {
        var $self = $(this);
        $self.find('td.order').text($no++);
        CmdMatch[$self.attr('type')].render($self);
      });
    };

  $CmdList.sortable({
    create: function (event, ui) {
      CmdListRender();
    },

    update: function (event, ui) {
      CmdListRender();
    }
  });

  $('#cmdExecute').bind('click', function () {
    $nextWork = 0;

    $CmdList.find('tr').each(function ($i, ui) {
      var $self = $(this);
      $works[$nextWork++] = {'model': $self, 'func': CmdMatch[$self.attr('type')].execute};
    });

    $nextWork = 0;

    doWork();
  });

  $socket.on('done', function ($data) {
    console.log($data);
    doWork();
  });

});*/