"use strict";

$(function () {
  var
    $view = {
      cmdGroup: '#commandList',
      cmdItems: '#commandList .cmd',
      cmdGraph: '#scenarioContainer',
      cmdCanvas: '#scenarioContainer > canvas',
      cmdAttr: '#compAttribute',
      body: 'body'
    },

    $ID = function () {
      var
        $id = 1;

      return {
        next: function () { return $id++; },
        set: function ($sid) { $id = $sid; }
      };
    }(),

    $scenario = function () {
      var
        $wholeList = {},
        $cmdList = {},

        $crtPage = 0,
        $mainPage = 0,

        $getMainPage = function () {
          return $('input[name="id"]').val();
        },

        $insert = function ($command) {
          $wholeList[$crtPage] = $cmdList;
          $cmdList[$command.order] = $command;
        },

        $erase = function ($order) {
          $wholeList[$crtPage] = $cmdList;
          console.log($order, $cmdList[$order]);
          $cmdList[$order].destroy();
          delete $cmdList[$order];
        },

        $getList = function ($id) {
          if ( !$id ) {
            return $cmdList; 
          }

          return $wholeList[$id];
        },

        $getEvent = function ($event) {
          var $list = [];

          for ( var $i in $cmdList ) {
            if ( $cmdList[$i].event === $event ) {
              $list.push($cmdList[$i]);
            }
          }

          return $list;
        },

        $getChild = function ($index) {
          if ( $cmdList.hasOwnProperty($index) ) {
            return $cmdList[$index];
          }

          return null;
        },

        $chainRush = function ($child, $done) {
          var
            $doList = [],

            $i = 0;

          var
            $tasking = 0,

            $configHandle = {
              wait: function () {
                $tasking += 1;
              },

              done: function () {
                $tasking -= 1;
              }
            };

          while ($child) {
            if ( $isDebug ) {
              if ( $i % 250 === 0 && $i ) {
                if ( !confirm("Too much execute, would you like to continue?") ) {
                  return;
                }
              }
            }

            $doList.push($child);

            // 준비 이벤트
            $child.config($configHandle);

            if ($cmdList.hasOwnProperty($child.next)) {
              $child = $cmdList[$child.next];
            }
            else {
              $child = null;
            }

            $i++;
          }

          var $worker = setInterval(function () {

            console.log($tasking);
            if ( $tasking !== 0 ) {
              return;
            }

            console.log("Work Start");

            var
              $index = -1,

              $handle = {
                return: function ($value) {
                  $done($value);

                  return;
                },

                next: function () {
                  $index++;

                  if ( $doList.length <= $index ) {
                    if ( $done ) {
                      $done();
                    }

                    return;
                  }

                  $doList[$index].execute($handle);
                },

                prev: function () {
                  $doList[$index].execute($handle);

                  $index--;
                },

                setIndex: function ($setIndex) {
                  $index = $setIndex;

                  $doList[$index].execute($handle);
                },

                getIndex: function () { return $index; },

                getChild: function ($index) {
                  if ($doList.hasOwnProperty($index))
                    return $doList[$index];

                  return null;
                },

                getChildren: function () { return $doList; }
              };

            $handle.next();
            
            clearInterval($worker);

          }, 1000 / 60);
        },

        $trigger = function ($event, $callback) {  
          var
            $startNode = $getEvent($event),
            $nodeAmount = $startNode.length;

          console.log('Trigger', $scenario.getList());

          for ( var $i in $startNode ) {
            // @callback done
            $chainRush($startNode[$i], function ($value) {

              // @call doneCallback
              if ( $callback && --$nodeAmount == 0 ) {
                $callback($value);
              }
            });
          }
        },

        $setPage = function ($targetPage) {
          if ( !$wholeList.hasOwnProperty($targetPage) ) {
            $wholeList[$targetPage] = {};
          }

          $crtPage = $targetPage;
          $cmdList = $wholeList[$targetPage];

          console.log($cmdList);

          var $lastestID = 0;

          for ( var $i in $cmdList ) {
            if ( $cmdList[$i].order > $lastestID ) {
              $lastestID = $cmdList[$i].order;
            }
          }

          $ID.set($lastestID + 1);
        },

        $getPage = function () { return $crtPage; },

        $getData = function () {
          var $data = {};

          for ( var $i in $wholeList ) {
            $data[$i] = {};

            for ( var $j in $wholeList[$i] ) {
              $data[$i][$j] = $wholeList[$i][$j].getData();
            }
          }

          return $data;
        },

        $save = function () {
          var $data = {};

          $data.content = [];

          for ( var $i in $wholeList[$mainPage] ) {
            $data.content.push($wholeList[$mainPage][$i].getData());
          }

          $data.content = JSON.stringify($data.content);

          var $formData = $('#modifyScenario').serializeArray();

          for ( var $i in $formData ) {
            $data[$formData[$i].name] = $formData[$i].value;
          }

          $.ajax({
            type: 'POST',
            url: '/scenario/edit',
            data: $data,
            success: function ($respone) {
              console.log("saved!");
            }
          });

          $('#scenarioTitle').text($data.title);
        },

        $loadContent = function ($id, $callback) {
          $.ajax({
            type: 'GET',
            url: '/scenario/content/' + $id,
            cache: false,
            success: function ($respone) {
              if ( $respone ) {
                $callback(JSON.parse($respone));
              }
            }
          });
        },

        $load = function ($id, $callback) {
          var $mainID = $getMainPage();

          if ( !$id ) {
            $id = $mainID;
          }

          $loadContent($id, function ($data) {
            for ( var $i in $wholeList[$id] ) {
              $wholeList[$id][$i].destroy();
            }

            var $tmp = $getPage();

            $setPage($id);

            for ( var $i in $data ) {
              var $cmd = $create($data[$i].exec, $($data[$i].html), $data[$i]);

              if ( $id != $mainID ) {
                $cmd.node.hide();
              }
            }

            $setPage($tmp);

            if ( $callback ) {
              $callback();
            }

            $output.render();
          });
        },

        $create = function ($type, $node, $opts) {
          console.log($type);
          var $cmd = new $cmdDef[$type]();

          $cmd.group = $crtPage;
          $cmd.order = $ID.next();
          $cmd.exec = $type;

          if ( $opts ) {
            
            for ( var $i in $opts ) {
              if ( $cmd[$i] !== undefined ) {
                $cmd[$i] = $opts[$i];
              }
            }
          }

          $scenario.insert($cmd);

          $cmd.init($node);

          return $cmd;
        };

      // set base page
      $crtPage = $mainPage = $getMainPage();

      return {
        setPage: $setPage,
        getPage: $getPage,
        getList: $getList,
        insert: $insert,
        erase: $erase,
        trigger: $trigger,
        getData: $getData,
        save: $save,
        create: $create,
        load: $load,
        getMainPage: $getMainPage
      }
    }(),

    $crtScenario = 0,

    $isDebug = false,

    $cmdBase = function () {
      var
        $self = this;

      this.group = 0;
      // 실행 순서
      this.order = 0;
      // 다음 실행될 명령
      this.next = 0;
      this.prev = 0;
      // 연결 핀
      this.pin = 0;
      this.val = 0;

      this.exec = '';

      // 실행 / 종료 이벤트
      this.event = '';

      this.node = undefined;
      this.el = undefined;
      this.html = '';

      this.getData = function () {
        var
          _self = this,
          $data = {};

        _self.html = _self.el.outerHTML;

        for ( var $i in _self ) {
          var $type = typeof _self[$i];

          if ($type !== 'function' && $type !== 'object') {
            $data[$i] = _self[$i];
          }
        }

        return $data;
      };

      this.init = function ($node) {
        var _self = this;

        _self.node = $node;
        _self.el = $node[0];

        $node.attr('order', _self.order);

        $node.appendTo($view.cmdGraph);

        $node.draggable({
          appendTo: $view.cmdGraph,
          drag: function ($event, $ui) {
            $output.render();
          }
        });

        $node.bind('mousedown', _self.holdLight);
        $node.bind('mousedown', _self.focusOn);

        // 저장되고 불러졌을 때
        if ( $node.hasClass('holdlight') ) {
          $node.trigger('mousedown');
        }

        _self.setup();
      };

      this.setup = function () {};

      this.config = function () {};

      this.save = function () {
        var _self = this;

        _self.final();
      };

      this.final = function () {
      };

      this.focusOn = function () {};

      this.focusOut = function () {};

      this.edit = function () {};

      this.execute = function () {};

      this.holdLight = function ($event) {
        var
          $this = $(this);

        $('.holdlight').removeClass('holdlight');

        $this.addClass('holdlight');
      };

      this.holdLightDown = function ($event) {
        $this.removeClass('holdlight');
      };

      this.render = function () {};

      this.destroy = function () {
        var _self = this;

        _self.node.remove();
      };

      this.get = function ($key) {
        var
          _self = this,
          $variable = new RegExp("^\{([$_a-zA-Z0-9]+)\}$").exec(_self[$key]);

        if ( $variable ) {
          var $list = $scenario.getList();

          for ( var $i in $list ) {
            if ( $list[$i].order == $variable[1] ) {
              //console.log($list[$i].val, $variable[1]);
              if (/^[0-9.]+$/.test($list[$i].val)) {
                return parseFloat($list[$i].val);
              }

              return $list[$i].val;
            }

            if ( $list[$i].id === $variable[1] ) {
              return $list[$i].val;
            }
          }
        }

        if (_self[$key]) {
          return _self[$key];
        }

        return _self[$key];
      };

      this.set = function ($key, $value) {
        var
          _self = this,
          $variable = new RegExp("^\{(\$)?([$_a-zA-Z]+[$_a-zA-Z0-9])\}$").exec($key);

        console.log('Var', $variable, $key);

        if ( $variable ) {
          var $list = $scenario.getList();

          for ( var $i in $list ) {
            if ( $variable[1] && $list[$i].exec !== 'let' ) continue;

            if ( $list[$i].order === $variable[2] ) {
              $list[$i].val = $value;

              console.log('Update', $value);

              return $list[$i].val;
            }

            if ( $list[$i].id === $variable[2] ) {
              $list[$i].val = $value;

              console.log('Update', $value);

              return $list[$i].val;
            }
          }
        }

        return null;
      };

      this.label = function ($target, $options) {
        var
          $span = $('<span class="help-block"></span>').appendTo($view.cmdAttr);

        $span.text($options.text);
      }

      this.input = function ($target, $options) {
        var
          _self = this,
          $group = $('<div class="form-group" />').appendTo($view.cmdAttr),
          $label = $('<label></label>').appendTo($group),
          $input = $('<input type="text" class="form-control" />').appendTo($group),

          $inputAttr = ['min', 'max', 'type', 'readonly'],

          inputEvent = function ($event) {
            $target[$options.target] = $input.val();
          };

        $label.text($options['label']);
        $input.val($target[$options.target]);

        if ($options.hasOwnProperty('choose')) {
          var

            $btnGroup = $('<div class="input-group" />').appendTo($group),
            $btnSpan = $('<span class="input-group-btn" />').appendTo($btnGroup);

            $input.prependTo($btnGroup);

          var $btnEvent = function () {};

          if (/scenario/.test($options.choose)) {
            var
              $modal = $('#dataSelector'),
              $title = $modal.find('#dataSelectorTitle'),
              $list = $modal.find('#dataList'),

              $btn = $('<button class="btn btn-warning" type="button">시나리오</button>').appendTo($btnSpan);

            $btnEvent = function ($event) {
              var
                $data = $list.find('> div a'),

                $dataEvent = function () {
                  var
                    $this = $(this);

                  $target.pin = $this.attr('data-val');
                  $target.scene = $this.find('h3').text().trim();
                  $target.desc = $this.find('p').text().trim();

                  $target.focusOn();

                  $modal.modal('hide');
                };

              $modal.on('show.bs.modal', function () {
                $data.bind('click', $dataEvent);

                $modal.off('show.bs.modal');
              });

              $modal.on('hide.bs.modal', function () {
                $data.unbind('click', $dataEvent);

                $modal.off('hide.bs.modal');
              });

              $modal.modal('show');
            };

            $btn.bind('click', $btnEvent);
          }
          if (/var/.test($options.choose)) {
            var
              $btn = $('<button class="btn btn-warning" type="button">변수</button>').appendTo($btnSpan);

            $btnEvent = function ($event) {

              var $cmdList = $scenario.getList();

              for ( var $i in $cmdList ) {
                if ( $target.order == $i ) {
                  continue;
                }

                var $cmdItem = $cmdList[$i];

                var $reset = function () {
                  for ( var $j in $cmdList ) {
                    $cmdList[$j].node.unbind('mousedown.cmd').removeClass('holdlight2');
                  }
                };

                $cmdItem.node.addClass('holdlight2');
                $cmdItem.node.bindFirst('mousedown.cmd', function ($event) {
                  $event.preventDefault();
                  $event.stopImmediatePropagation(); 

                  var
                    $this = $(this),
                    $save = '',
                    $cmdItem = $cmdList[$this.attr('order')];

                  if ( $cmdItem.id ) {
                    $save = '{' + $cmdItem.id + '}';
                  }
                  else {
                    $save = '{' + $cmdItem.order + '}';
                  }

                  $target[$options.target] = $save;
                  $input.val($save);

                  _self.focusOn();

                  $reset();

                  return false;
                });

                $view.cmdGraph.bind('mousedown.cmd', function ($event) {
                  $reset();

                  $view.cmdGraph.unbind('mousedown.cmd');
                });
              }
            };

            $btn.bind('click', $btnEvent);
          }
          if (/cmd/.test($options.choose)) {
            var
              $btn = $('<button class="btn btn-warning" type="button">명령</button>').appendTo($btnSpan);

            $btnEvent = function ($event) {
              var $cmdList = $scenario.getList();

              for ( var $i in $cmdList ) {
                if ( $target.order == $i ) {
                  continue;
                }

                var $reset = function () {
                  for ( var $j in $cmdList ) {
                    $cmdList[$j].node.unbind('mousedown.cmd').removeClass('holdlight2');
                  }
                };

                var $cmdItem = $cmdList[$i];

                $cmdItem.node.addClass('holdlight2');
                $cmdItem.node.bindFirst('mousedown.cmd', function ($event) {
                  $event.preventDefault();
                  $event.stopImmediatePropagation();

                  var
                    $this = $(this);

                  $target[$options.target] = $this.attr('order');
                  $input.val($this.attr('order'));

                  _self.focusOn();

                  $reset();

                  return false;
                });

                $view.cmdGraph.bind('mousedown.cmd', function ($event) {
                  $reset();

                  $view.cmdGraph.unbind('mousedown.cmd');
                });
              }

              console.log($cmdItem.node.data('events'));
            };

            $btn.bind('click', $btnEvent);
          }
          if (/pin/.test($options.choose)) {
            var
              $modal = $('#pinModal'),
              $list = $modal.find('map > area'),

              $btn = $('<button class="btn btn-warning" type="button">핀</button>').appendTo($btnSpan);

            $btnEvent = function ($event) {
              var
                $dataEvent = function () {
                  var
                    $this = $(this);

                  $target[$options.target] = $this.attr('data-num');

                  $target.focusOn();

                  $modal.modal('hide');
                };

              $modal.on('show.bs.modal', function () {
                $list.bind('click', $dataEvent);

                $modal.off('show.bs.modal');
              });

              $modal.on('hide.bs.modal', function () {
                $list.unbind('click', $dataEvent);

                $modal.off('hide.bs.modal');
              });

              $modal.modal('show');
            };

            $btn.bind('click', $btnEvent);
          }
        };

        for ( var $i in $inputAttr ) {
          var $attrName = $inputAttr[$i];

          if ($options.hasOwnProperty($attrName)) {
            $input.attr($attrName, $options[$attrName]);
          }
        }

        $input.bind('keyup', inputEvent).bind('change', inputEvent);
      };

      this.select = function ($target, $options) {
        var
          $group = $('<div class="form-group" />').appendTo($view.cmdAttr),
          $label = $('<label></label>').appendTo($group),
          $select = $('<select class="form-control"></select>').appendTo($group),

          $inputAttr = [],

          inputEvent = function ($event) {
            $target[$options.target] = $select.val();
          };

        $label.text($options.label);
        $select.val($target[$options.target]);

        for ( var $i in $inputAttr ) {
          var $attrName = $inputAttr[$i];

          if ($options.hasOwnProperty($attrName)) {
            $select.attr($attrName, $options[$attrName]);
          }
        }

        for ( var $i in $options.data ) {
          var $option = $('<option></option>').appendTo($select);

          $option.val($options.data[$i]);
          $option.text($i);

          if ( $target[$options.target] == $options.data[$i] ) {
            $option.attr('selected', 'selected');
          }
        }

        $select.bind('change', inputEvent);
      }
    },

    $cmdDef = {};

  $cmdDef.ar = function () {
    var
      $self = this;

    this.setup = function () {
    }

    this.config = function () {
    }

    this.execute = function ($handle) {
      var $exec = Executer;

      $exec.analogRead($self.get('pin'), function ($data) {
        $self.val = $data.val;

        console.log($data);

        $handle.next();
      });
    }

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 핀',
        type: 'text',
        choose: 'var pin'
      });

    }
  };

  $cmdDef.return = function () {
    var
      $self = this;

    this.setup = function () {};
    this.config = function () {};

    this.execute = function ($handle) {
      $handle.return($self.get('val'));
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'val',
        label: '반환값',
        type: 'text',
        choose: 'var'
      });
    }
  };

  $cmdDef.call = function () {
    var
      $self = this;

    $self.scene = '';
    $self.desc = '';

    this.setup = function () {};
    this.config = function ($handle) {
      $handle.wait();

      $scenario.load($self.get('pin'), function () {
        $handle.done();
      });
    };

    this.execute = function ($handle) {

      var $temp = $scenario.getMainPage();

      $scenario.setPage($self.get('pin'));

      console.log("Call Start", $scenario.getList());

      $scenario.trigger('start', function () {
        // when trigger done
        $scenario.setPage($temp);

        console.log("Call End!", $scenario.getList());

        $handle.next();
      });
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정된 시나리오',
        type: 'text',
        choose: 'scenario'
      });

      if ( $self.scene ) {
        $self.label($self, {
          text: '이름: ' + $self.get('scene')
        });
      }

      if ( $self.desc ) {
        $self.label($self, {
          text: $self.get('desc')
        }); 
      }
    };
  };

  $cmdDef.trigger = function () {
    var
      $self = this;

    $self.scene = '';
    $self.desc = '';
    $self.negative = 0;

    this.setup = function () {
      $self.event = 'update';
    };

    this.config = function ($handle) {
      $handle.wait();

      $scenario.load($self.get('pin'), function () {
        $handle.done();
      });
    };

    this.execute = function ($handle) {

      var $temp = $scenario.getMainPage();

      $scenario.setPage($self.get('pin'));

      $scenario.trigger('start', function ($detected) {
        // when trigger done
        $scenario.setPage($temp);

        if ( ($detected && !$self.negative) || (!$detected && $self.negative) ) {
          $handle.next();
        }
      });
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정된 시나리오',
        type: 'text',
        choose: 'scenario'
      });

      $self.select($self, {
        target: 'negative',
        label: '실행 상황',
        data: {
          '참일 때': 0,
          '거짓일 때': 1
        }
      });

      if ( $self.scene ) {
        $self.label($self, {
          text: '이름: ' + $self.get('scene')
        });
      }

      if ( $self.desc ) {
        $self.label($self, {
          text: $self.get('desc')
        }); 
      }
    };
  };

  $cmdDef.dr = function () {
    var
      $self = this;

    this.setup = function () {
    }

    this.config = function () {
    }

    this.execute = function ($handle) {
      var $exec = Executer;

      $exec.digitalRead($self.get('pin'), function ($data) {
        $self.val = $data.val;

        console.log($data);

        $handle.next();
      });
    }

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 핀',
        type: 'text',
        choose: 'var pin'
      });

    }
  };

  $cmdDef.oper = function () {
    var
      $self = this,
      $oper = {
        add: function () {
          $self.val = parseFloat($self.get('var1')) + parseFloat($self.get('var2'));
        },
        sub: function () {
          $self.val = parseFloat($self.get('var1')) - parseFloat($self.get('var2'));
        },
        div: function () {
          $self.val = parseFloat($self.get('var1')) / parseFloat($self.get('var2'));
        },
        mul: function () {
          $self.val = parseFloat($self.get('var1')) * parseFloat($self.get('var2'));
        },
        cop: function () {
          $self.set($self.var1, $self.get('var2'));
        }
      };

    this.oper = 'add';

    this.var1 = '';

    this.var2 = '';
 
    this.setup = function () {
    };

    this.config = function () {
    };

    this.execute = function ($handle) {
      $oper[$self.oper]();

      $handle.next();
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.select($self, {
        target: 'oper',
        label: '연산 타입',
        data: {
          'Add': 'add',
          'Subtract': 'sub',
          'Divide': 'div',
          'Multiply': 'mul',
          'Copy': 'cop'
        }
      });

      $self.input($self, {
        target: 'var1',
        label: '대상 A',
        type: 'text',
        choose: 'var'
      });

      $self.input($self, {
        target: 'var2',
        label: '대상 B',
        type: 'text',
        choose: 'var'
      });
      
      $output.render();
    };
  };

  $cmdDef.start = function () {
    var
      $self = this;

    this.setup = function () {
      // start event 등록
      $self.event = 'start';
    };

    this.render = function () {};

    this.execute = function ($handle) {
      console.log("Program Update");

      $handle.next();
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });
      
      $output.render();
    }
  };

  $cmdDef.update = function () {
    var
      $self = this;

    this.setup = function () {
      // start event 등록
      $self.event = 'update';
    };

    this.render = function () {};

    this.execute = function ($handle) {
      console.log("Program Update");

      $handle.next();
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });
      
      $output.render();
    }
  };

  $cmdDef.end = function () {
    var
      $self = this;

    this.setup = function () {
      // start event 등록
      $self.event = 'end';
    };

    this.render = function () {};

    this.execute = function ($handle) {
      console.log("Program End!");

      $handle.next();
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });
      
      $output.render();
    }
  };

  $cmdDef.pm = function () {
    var
      $self = this;

    this.mode = '';

    this.setup = function () {
    };

    this.render = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;
      $exec.pinMode($self.pin, $self.mode, $handle.next);
      console.log("pinMode");
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 핀',
        type: 'text',
        choose: 'var pin'
      });

      $self.select($self, {
        target: 'mode',
        label: 'Pin Mode',
        data: {
          'OUTPUT': 'out',
          'INPUT': 'in'
        }
      });

      $output.render();
    }
  };

  $cmdDef.aw = function () {
    var
      $self = this;

    this.setup = function () {
    };

    this.render = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;
      $exec.analogWrite($self.pin, $self.val, $handle.next);

      console.log("Analog Write");
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 핀',
        type: 'text',
        choose: 'var pin'
      });

      $self.input($self, {
        target: 'val',
        label: '값',
        type: 'number',
        min: 0,
        max: 255
      });

      $output.render();
    }
  };

  $cmdDef.dw = function () {
    var
      $self = this;

    this.setup = function () {
    };

    this.render = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;
      $exec.digitalWrite($self.pin, $self.val, $handle.next);

      console.log("Digital Write");
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 핀',
        type: 'text',
        choose: 'var pin'
      });

      $self.input($self, {
        target: 'val',
        label: '값',
        type: 'number',
        min: 0,
        max: 255
      });

      $output.render();
    }
  };

  $cmdDef.if = function () {
    var
      $self = this;

    this.condition = '';

    this.setup = function () {};
    this.render = function () {};

    this.execute = function ($handle) {
      // endif 찾아 헤멤
      var
        $innerCond = 1,
        $condition = $self.get('condition');

      // 참일 경우
      if ($condition != 0) {
        console.log('Condition', $condition);

        for ( var $i = $handle.getIndex() + 1, $child = null; $child = $handle.getChild($i); $i++ ) {
          if ( $child.exec == 'if' ) {
            $innerCond++;
          }
          else if ( $child.exec == 'elseif' || $child.exec == 'else' ) {
            if ($innerCond === 1) {
              $child.continue = false;
            }
          }
          else if ( $child.exec == 'endif' ) {
            $innerCond--;
          }

          if ( $innerCond === 0 ) {
            break;
          }
        }

        if ( $innerCond ) {
          console.log('No found EndIf');
        }

        $handle.next();
      }
      else {
        for ( var $i = $handle.getIndex() + 1, $child = null; $child = $handle.getChild($i); $i++ ) {
          if ( $child.exec == 'if' ) {
            $innerCond++;
          }
          else if ( $child.exec == 'elseif' || $child.exec == 'else' ) {
            if ($innerCond === 1) {
              $child.continue = true;

              $handle.setIndex($i);
              return;
            }
          }
          else if ( $child.exec == 'endif' ) {
            $innerCond--;
          }

          if ( $innerCond === 0 ) {

            $handle.setIndex($i);
            return;
            break;
          }
        }

        if ( $innerCond ) {
          console.log('No found EndIf');
        }
      }
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'condition',
        label: '조건',
        choose: 'var',
        type: 'text'
      });

      $output.render();
    }
  };

  $cmdDef.elseif = function () {
    var
      $self = this;

    this.condition = '';
    this.continue = false;

    this.setup = function () {};
    this.render = function () {};
    this.config = function () {
      this.continue = false;
    }

    this.execute = function ($handle) {
      // endif 찾아 헤멤
      var $innerCond = 1;

      // 실행되는 경우
      if ( $self.get('continue') ) {
        // 참일 경우
        if ($self.get('condition')) {
          for ( var $i = $handle.getIndex() + 1, $child = null; $child = $handle.getChild($i); $i++ ) {
            if ( $child.exec == 'if' ) {
              $innerCond++;
            }
            else if ( $child.exec == 'elseif' || $child.exec == 'else' ) {
              if ($innerCond === 1) {
                $child.continue = false;
              }
            }
            else if ( $child.exec == 'endif' ) {
              $innerCond--;
            }

            if ( $innerCond === 0 ) {
              break;
            }
          }

          if ( $innerCond ) {
            console.log('No found EndIf');
          }

          $handle.next();
        }
        else {
          for ( var $i = $handle.getIndex() + 1, $child = null; $child = $handle.getChild($i); $i++ ) {
            if ( $child.exec == 'if' ) {
              $innerCond++;
            }
            else if ( $child.exec == 'elseif' || $child.exec == 'else' ) {
              if ($innerCond === 1) {
                $child.continue = true;

                $handle.setIndex($i);
                return;
              }
            }
            else if ( $child.exec == 'endif' ) {
              $innerCond--;
            }

            if ( $innerCond === 0 ) {

              $handle.setIndex($i);
              return;
              break;
            }
          }

          if ( $innerCond ) {
            console.log('No found EndIf');
          }
        }
      }
      // 실행되지 않는 경우
      else {
        for ( var $i = $handle.getIndex() + 1, $child = null; $child = $handle.getChild($i); $i++ ) {
          if ( $child.exec == 'if' ) {
            $innerCond++;
          }
          else if ( $child.exec == 'endif' ) {
            $innerCond--;
          }

          if ( $innerCond === 0 ) {
            $handle.setIndex($i);

            return;
            break;
          }
        }

        if ( $innerCond ) {
          console.log('No found EndIf');
        }
      }
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'condition',
        label: '조건',
        choose: 'var',
        type: 'text'
      });

      $output.render();
    }
  };

  $cmdDef.else = function () {
    var
      $self = this;

    this.continue = false;

    this.setup = function () {};
    this.render = function () {};
    this.config = function () {
      this.continue = false;
    }

    this.execute = function ($handle) {
      // endif 찾아 헤멤
      var $innerCond = 1;

      console.log('Else');

      // 실행되는 경우
      if ( $self.get('continue') ) {
        $handle.next();
      }
      // 실행되지 않는 경우
      else {
        for ( var $i = $handle.getIndex() + 1, $child = null; $child = $handle.getChild($i); $i++ ) {
          if ( $child.exec == 'if' ) {
            $innerCond++;
          }
          else if ( $child.exec == 'endif' ) {
            $innerCond--;
          }

          if ( $innerCond === 0 ) {
            $handle.setIndex($i);

            return;
            break;
          }
        }

        if ( $innerCond ) {
          console.log('No found EndIf');
        }
      }
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $output.render();
    }
  };

  $cmdDef.endif = function () {
    var
      $self = this;

    this.execute = function ($handle) {
      $handle.next();
    }

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $output.render();
    }
  };

  $cmdDef.math = function () {
    var
      $self = this,
      $oper = {
        inc: function () {
        },
        dec: function () {
          return $self.get('val1') >= $self.get('val2');
        }
      };

    this.type = 'inc';
    this.target = 0;
    this.param = '';
    this.data = [];

    this.setup = function () {};
    this.config = function () {};

    this.execute = function ($handle) {
      $self.data = $self.param.split(',');

      for ( var $i in $self.data ) {
        $self[$i] = $self.data[$i];
      }

      $oper[$self.get('type')]();

      if ( $self.target ) {
        $self.set($self.target, $self.get('val'));
      }

      $handle.next();
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'val',
        label: '대상 변수',
        type: 'text',
        choose: 'var'
      });

      $self.input($self, {
        target: 'param',
        label: '인자 (콤마로 구분)',
        type: 'text',
        choose: 'var'
      });

      $self.select($self, {
        target: 'type',
        label: '수학 함수',
        data: {
          '값 증가': 'inc',
          '값 감소': 'dec'
        }
      });
    }
  };

  $cmdDef.svdetach = function () {
    var
      $self = this;

    this.setup = function () {
    };

    this.config = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;

      $exec.servoDetach($self.get('pin'), $handle.next);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 핀',
        type: 'text',
        choose: 'var'
      });

      $output.render();
    }
  };
  
  $cmdDef.svattach = function () {
    var
      $self = this;

    this.setup = function () {
    };

    this.config = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;

      $exec.servoAttach($self.get('pin'), $handle.next);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 핀',
        type: 'text',
        choose: 'var'
      });

      $output.render();
    }
  };

  $cmdDef.svwrite = function () {
    var
      $self = this;

    this.setup = function () {
    };

    this.config = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;

      $exec.servoWrite($self.get('pin'), $self.get('val'), $handle.next);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 핀',
        type: 'text',
        choose: 'var'
      });

      $self.input($self, {
        target: 'val',
        label: '각도',
        type: 'text',
        choose: 'var'
      });

      $output.render();
    }
  };

  $cmdDef.compare = function () {
    var
      $self = this,
      $oper = {
        equal: function () {
          return $self.get('val1') == $self.get('val2');
        },
        larger: function () {
          return $self.get('val1') >= $self.get('val2');
        },
        smaller: function () {
          return $self.get('val1') <= $self.get('val2');
        },
        higher: function () {
          return $self.get('val1') > $self.get('val2');
        },
        lower: function () {
          return $self.get('val1') < $self.get('val2');
        },
        different: function () {
          return $self.get('val1') != $self.get('val2');
        }
      };

    this.type = 'eqaul';
    this.val1 = 0;
    this.val2 = 0;

    this.setup = function () {};
    this.config = function () {};

    this.execute = function ($handle) {
      console.log($self.get('type'));
      console.log("Vars: ", $self.get('val1'), $self.get('val2'));
      if ($oper[$self.get('type')]()) {
        $self.val = 1;
      }
      else {
        $self.val = 0;
      }

      $handle.next();
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'val1',
        label: '비교 대상 A',
        type: 'text',
        choose: 'var'
      });

      $self.input($self, {
        target: 'val2',
        label: '비교 대상 B',
        type: 'text',
        choose: 'var'
      });

      $self.select($self, {
        target: 'type',
        label: '비교 형식',
        data: {
          'A = B': 'equal',
          'A >= B': 'larger',
          'A <= B': 'smaller',
          'A > B': 'higher',
          'A < B': 'lower',
          'A != B': 'different'
        }
      });
    }
  };

  $cmdDef.loop = function () {
    var
      $self = this;

    this.repeat = 0;

    this.repeatCount = 0;

    this.toggleNext = 0;

    this.condition = '';

    this.setup = function () {
    };

    this.render = function () {};

    this.execute = function ($handle) {
      if ( $self.get('condtion') || ($self.repeat && $self.repeatCount < $self.repeat)  ) {
        $self.repeatCount++;

        console.log("Loop:", $self.repeatCount, "of", $self.repeat);

        $handle.next();
      }
      else {
        // endloop를 찾아 헤멤
        var $innerLoop = 1;

        for ( var $i = $handle.getIndex() + 1, $child = null; $child = $handle.getChild($i); $i++ ) {
          if ( $child.exec === 'loop' ) {
            $innerLoop++;
          }
          if ( $child.exec === 'endloop' ) {
            $innerLoop--;
          }

          if ( $innerLoop === 0 ) {
            // find!
            $child.continue = false;
            $self.repeatCount = 0;

            $handle.setIndex($i);

            return;
          }
        }
      }
    };

    this.config = function () {
      $self.repeatCount = 0;
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'repeat',
        label: '최소 반복 횟수',
        type: 'number',
        min: 0
      });

      $self.input($self, {
        target: 'condition',
        label: '조건',
        type: 'text',
        choose: 'var'
      });

      $output.render();
    }
  };

  $cmdDef.endloop = function () {
    var
      $self = this;

    this.continue = false;

    this.setup = function () {
    };

    this.config = function () {
      this.continue = true;
    };

    this.render = function () {};

    this.execute = function ($handle) {
      console.log("EndLoop back");
      if ( $self.continue ) {
        // loop를 찾아 헤멤
        var $innerLoop = 1;

        for ( var $i = $handle.getIndex() - 1, $child = null; $child = $handle.getChild($i); $i-- ) {
          if ( $child.exec === 'loop' ) {
            $innerLoop--;
          }
          if ( $child.exec === 'endloop' ) {
            $innerLoop++;
          }

          if ( $innerLoop === 0 ) {
            // find!
            console.log("Loop Found");
            $handle.setIndex($i);

            return;
          }
        }
      }
      else {
        $self.continue = true;

        console.log("End Loop!");

        $handle.next();
      }
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $output.render();
    }
  };

  $cmdDef.delay = function () {
    var
      $self = this;

    this.time = 0;

    this.setup = function () {
    };

    this.render = function () {};

    this.execute = function ($handle) {
      console.log('delay');

      setTimeout(function () {
        console.log('delay done');
        $handle.next();
      }, $self.time);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'time',
        label: '지연 시간 (ms)',
        type: 'number',
        min: 0
      });

      $output.render();
    }
  };

  $cmdDef.let = function () {
    var
      $self = this;

    this.default = 0;
    this.val = 0;
    this.id = '';

    this.setup = function () {
    };

    this.config = function () {
    };

    this.execute = function ($handle) {
      $self.val = $self.default;
      
      $handle.next();
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'id',
        label: '변수 ID',
        type: 'text'
      });

      $self.input($self, {
        target: 'default',
        label: '기본값',
        type: 'text',
        min: 0
      });

      $self.input($self, {
        target: 'val',
        label: '값',
        type: 'text',
        min: 0
      });
    }
  };

  $cmdDef.setone = function () {
    var
      $self = this;

    this.setup = function () {};
    this.config = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;
      var $a = $self.get('pin');

      $exec.setOne(40 + parseInt($a), $self.get('val'), $handle.next);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 오프셋',
        type: 'text',
        choose: 'var pin'
      });

      $self.input($self, {
        target: 'val',
        label: '값',
        type: 'text',
        choose: 'var'
      });
    }
  };

  $cmdDef.srgb = function () {
    var
      $self = this;

    this.pin = 0;
    this.red = 0;
    this.green = 0;
    this.blue = 0;

    this.setup = function () {};
    this.config = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;

      $exec.setRGB($self.get('pin'), $self.get('red'), $self.get('blue'), $self.get('green'), $handle.next);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 오프셋',
        type: 'text',
        choose: 'var pin',
        min: 0
      });

      $self.input($self, {
        target: 'red',
        label: '빨간색',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });

      $self.input($self, {
        target: 'green',
        label: '초록색',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });

      $self.input($self, {
        target: 'blue',
        label: '파란색',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });
    };
  };

  $cmdDef.sargb = function () {
    var
      $self = this;

    this.red = 0;
    this.green = 0;
    this.blue = 0;

    this.setup = function () {};
    this.config = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;

      // @Blue Green값 바꿔 보내고 있음 훗날을 위해
      $exec.setAllRGB($self.get('red'), $self.get('blue'), $self.get('green'), $handle.next);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'red',
        label: '빨간색',
        type: 'text',
        min: 0, max: 255,
        choose: 'var'
      });

      $self.input($self, {
        target: 'green',
        label: '초록색',
        type: 'text',
        min: 0, max: 255,
        choose: 'var'
      });

      $self.input($self, {
        target: 'blue',
        label: '파란색',
        type: 'text',
        min: 0, max: 255,
        choose: 'var'
      });
    };
  };

  $cmdDef.shsv = function () {
    var
      $self = this;

    this.pin = 0;
    this.hue = 0;
    this.sat = 0;
    this.val = 0;

    this.setup = function () {};
    this.config = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;

      $exec.setHSV($self.get('pin'), $self.get('hue'), $self.get('sat'), $self.get('val'), $handle.next);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'pin',
        label: '지정 오프셋',
        type: 'text',
        choose: 'var',
        min: 0
      });

      $self.input($self, {
        target: 'hue',
        label: '색상',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });

      $self.input($self, {
        target: 'sat',
        label: '명도',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });

      $self.input($self, {
        target: 'val',
        label: '채도',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });
    };
  };

  $cmdDef.sahsv = function () {
    var
      $self = this;

    this.hue = 0;
    this.sat = 0;
    this.val = 0;

    this.setup = function () {};
    this.config = function () {};

    this.execute = function ($handle) {
      var $exec = Executer;

      $exec.setAllHSV($self.get('hue'), $self.get('sat'), $self.get('val'), $handle.next);
    };

    this.focusOn = function () {
      $view.cmdAttr.empty();

      $self.input($self, {
        target: 'order',
        label: '명령 번호',
        type: 'text',
        readonly: 'readonly'
      });

      $self.input($self, {
        target: 'next',
        label: '다음 명령',
        type: 'text',
        choose: 'cmd'
      });

      $self.input($self, {
        target: 'hue',
        label: '색상',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });

      $self.input($self, {
        target: 'sat',
        label: '명도',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });

      $self.input($self, {
        target: 'val',
        label: '채도',
        type: 'text',
        choose: 'var',
        min: 0, max: 255
      });
    };
  };

  for ( var $i in $cmdDef ) {
    $cmdDef[$i].prototype = new $cmdBase();
  }

  // get view
  for ( var $i in $view ) {
    $view[$i] = $($view[$i]);
  }

  // canvas
  var $output = (function () {
    var
      $canvas = $view.cmdCanvas,
      $ctx = $canvas[0].getContext('2d'),

      $offset = $canvas.offset();

    $canvas.attr('width', $view.cmdGraph.outerWidth());
    $canvas.attr('height', $view.cmdGraph.outerHeight());

    return {
      clear: function () {
        $ctx.clearRect(0, 0, $canvas.attr('width'), $canvas.attr('height'));
      },

      render: function () {
        this.clear();

        var $cmdList = $scenario.getList();

        for ( var $i in $cmdList ) {
          var $cmd = $cmdList[$i];

          if ( !$cmdList.hasOwnProperty($cmd.next) ) continue;

          $ctx.save();

          var
            $target = $cmdList[$cmd.next],
            $dest = $target.node,
            $start = $cmd.node,

            $size = {
              start: {
                width: $start.outerWidth(),
                height: $start.outerHeight()
              },
              dest: {
                width: $dest.outerWidth(),
                height: $dest.outerHeight()
              }
            },

            $line = {
              start: {
                x: $start.offset().left + $size.start.width / 2,
                y: $start.offset().top + $size.start.height / 2
              },
              dest: [
                {x: $dest.offset().left + $size.dest.width / 2, y: $dest.offset().top},
                {x: $dest.offset().left + $size.dest.width / 2, y: $dest.offset().top + $size.dest.height},
                {x: $dest.offset().left, y: $dest.offset().top + $size.dest.height / 2},
                {x: $dest.offset().left + $size.dest.width, y: $dest.offset().top + $size.dest.height / 2}
              ]
            };

          var
            $minDist = -1,
            $minNo = 0;

          for ( var $i in $line.dest ) {
            var $length = Math.sqrt(Math.pow($line.dest[$i].x - $line.start.x, 2) + Math.pow($line.dest[$i].y - $line.start.y, 2));

            if ( $length < $minDist || $minDist < 0) {
              $minDist = $length;
              $minNo = $i;
            }
          }

          $line.dest = $line.dest[$minNo];

          switch (parseInt($minNo)) {
            case 0:
              $line.start.y += $size.start.height / 2;
              break;
            case 1:
              $line.start.y -= $size.start.height / 2;
              break;
            case 2:
              $line.start.x += $size.start.width / 2;
              break;
            case 3:
              $line.start.x -= $size.start.width / 2;
              break;
            default:
              break;
          }
          /*if ( $start.offset().top < $dest.offset().top + $size.dest.height ) {
            $line.start.y += $size.start.height;
          }
          else if ( $start.offset().top + $size.start.height > $dest.offset().top ) {
            $line.dest.y += $size.start.height;
          }
          else {
            $line.start.y += $size.start.height / 2;
            $line.dest.y += $size.dest.height / 2;
          }

          if ( $start.offset().left < $dest.offset().left + $size.dest.width ) {
            $line.start.x += $size.start.width;
          }
          else if ( $start.offset().left + $size.start.width > $dest.offset().left ) {
            $line.dest.x += $size.dest.width;
          }
          else {
            $line.start.x += $size.start.width / 2;
            $line.dest.x += $size.dest.width / 2;
          }*/

          $line.start.x -= $offset.left;
          $line.start.y -= $offset.top;
          $line.dest.x -= $offset.left;
          $line.dest.y -= $offset.top;

          $ctx.beginPath();
          $ctx.lineWidth = 3;

          $ctx.moveTo($line.start.x, $line.start.y);
          $ctx.lineTo($line.dest.x, $line.dest.y);

          var
            $angle = Math.atan2($line.dest.y - $line.start.y, $line.dest.x - $line.start.x) / 180 * Math.PI,
            $cos = function ( $angle ) {
              return Math.cos($angle * 180 / Math.PI);
            },
            $sin = function ( $angle ) {
              return Math.sin($angle * 180 / Math.PI);
            };

          $ctx.lineTo($line.dest.x + $cos($angle + 20) * 15, $line.dest.y + $sin($angle + 20) * 15);
          $ctx.moveTo($line.dest.x, $line.dest.y);

          $ctx.lineTo($line.dest.x + $cos($angle - 20) * 15, $line.dest.y + $sin($angle - 20) * 15);
          $ctx.moveTo($line.dest.x, $line.dest.y);

          $ctx.closePath();
          $ctx.stroke();
          $ctx.restore();
        }
      }
    };
  })();

  // make component UI
  $view.cmdItems.each(function ($i, $ui){
    var
      $this = $(this),
      $attr = {
        icon: '',
        exec: ''
      };

    for ( var $i in $attr ) {
      $attr[$i] = $this.attr($i);
    }

    $this.tooltip({
      placement: 'right'
    });

    var
      $icon = $('<span class="glyphicon"></span>');

    $icon.addClass('glyphicon-' + $attr.icon);
    $icon.prependTo($this);
  });

  $view.cmdItems.draggable({
    helper: 'clone',
    appendTo: $view.cmdGraph,
    start: function ($event, $ui) {
      var
        $helper = $ui.helper;

      $helper.removeAttr('title');
    }
  });

  $view.cmdGraph.droppable({
    drop: function ($event, $ui) {
      var
        $this = $(this),
        $original = $ui.draggable,
        $clone = $ui.helper.clone();

      // 복사 중복 방지
      if ($original.attr('order')) {
        return;
      }

      var
        $type = $clone.attr('exec');

      $scenario.create($type, $clone);
    },

    out: function ($event, $ui) {
      var
        $this = $(this),
        $target = $ui.draggable;

      console.log($target);

      $scenario.erase($target.attr('order'));
    }
  });

  var $Simulate = function () {
    var
      $isRunning = false,
      $worker = null;

    return {
      'Run': function ($callback) {
        if ( !$isRunning ) {
          $isRunning = true;

          $scenario.trigger('start', function () {
            $worker = setInterval(function () {
              $scenario.trigger('update', function () {
              });
              
            }, 1000 / 30);

            if ( $callback ) {
              $callback();
            }
          });
        }
      },

      'Stop': function ($callback) {
        if ( $isRunning ) {
          $isRunning = false;

          clearInterval($worker);
          $worker = null;

          $scenario.trigger('end', function () {
          });

          if ( $callback ) {
            $callback();
          }
        }
      }
    };
  }();

  var $Controller = {
    'simulate': function () {
      $Simulate.Run($Simulate.Stop);
    },

    'save': function () {
      $scenario.save();
    },

    'select': function () {
      return 1;
    },

    'delete': function () {
      var $mainID = $scenario.getMainPage();

      $.ajax({
        method: 'GET',
        url: '/scenario/delete/' + $mainID,
        success: function ($result) {

          console.log($result);

          if ($result.id && $result.id == $mainID) {
            document.location = '/scenario/';
          }
        }
      });
    },

    'start': function () {
      $Simulate.Run();
    },

    'stop': function () {
      $Simulate.Stop();
    }
  };

  $('[data-controller]').bind('click', function ($event) {
    var
      $this = $(this);

    $Controller[$this.attr('data-controller')]();

    $event.preventDefault();
  });

  $scenario.load();
});