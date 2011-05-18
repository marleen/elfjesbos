var MarleenMol = new Class({
  Extends:          GameUtils,
  Implements:       [Events],
  BindAll:          true,

  screen:           false,
  data:             false,
  gameData:         false,
  itemData:         false,
  timeouts:         [],

  givenAnswer:      '',
  correct:          false,
  coinsLeft:        0,

  initialize: function (screen, data)
  {
    this.screen = screen;
    this.data   = data;
  },

  item: function (itemData)
  {
    this.data.Item        = itemData.Item;
    this.coinsLeft        = this.screen.game.coin.length;
    this.numberOfSeconds  = 20 //moet worden: itemData.Item.maximum_response_in_seconds.toInt();
    
    this.animateCoins(0, 1);
  },

  answer: function (answer)
  {
    var multiplier = this.numberOfSeconds / this.screen.game.coin.length;
    if (multiplier < 1)
    {
      multiplier = 1;
    }
    
    var readyDelay;
    if (this.givenAnswer == __('questionMarkValue'))
    {
      readyDelay = this.animateCoins(0, 0);
    }
    else
    {
      readyDelay = this.animateCoins(this.correct ? 1 : 2, 10 * multiplier);
    }
    readyDelay += this.correct ? this.data.Game.wait_correct * 1000 : this.data.Game.wait_incorrect * 1000;

    this.fireEvent('answer', [this.givenAnswer, this.correct, this.coinsLeft, readyDelay]);
  }
});

var MemoryGrid = (function(arg_window, arg_selector, arg_undefined)
{
  var Game = function(arg_matrix, arg_configuration, arg_textElement, arg_controller)
  {
    this.matrix        = arg_matrix;
    this.configuration = arg_configuration;
    this.textElement   = arg_textElement;
    this.controller    = arg_controller;
  };

  Game.prototype = {

    start: function ()
    {
      this.changeText(this.configuration.getIntroduction());
      this.highLightText();
      this.matrix.build();
      this.showStimuli.delay(this.configuration.getIntroductionDuration(), this);
    },

    showStimuli: function ()
    {
      var animations   = []
        , stimuli      = this.configuration.getStimuli()
        , stimuliCount = stimuli.length
        , delay        = -stimuli[0].delay

      for (var i = 0, element; i < stimuliCount; i++)
      {
        delay        += stimuli[i].delay;
        element       = arg_selector(this.matrix.grid[stimuli[i].y][stimuli[i].x]);
        animations[i] = new SpriteAnimation(element, 5, 59, -stimuli[i].delay, function (arg_element)
        {
          arg_element.setStyle('background-position', '-' + this.width * this.frame + "px 0px");
        });

        element.addClass('shape-' + stimuli[i].shape);

        if (0 < i)
        {
          animations[i].start.delay(delay, animations[i]);
        }
        else
        {
          animations[0].start();
        }

        animations[i].start.delay(delay + stimuli[i].duration, animations[i]);
      }

      this.changeText.delay(delay, this, this.configuration.getQuestion());
      this.highLightText.delay(delay, this);
      this.addEventHandlers.delay(delay + this.configuration.getQuestionDuration(), this);
    },

    addEventHandlers: function ()
    {
      var piggyBankAnimation = new SpriteAnimation(this.controller.piggyBankElement, 20, 38, this.configuration.getTotalDuration(), function (arg_element)
      {
        arg_element.setStyle('margin-left', this.width * this.frame + "px");
        arg_element.setStyle('width', 760 - this.width * this.frame + "px");
      });
      
      piggyBankAnimation.start();
      // not so clean but it works
      piggyBankAnimation.stop.delay(this.configuration.getTotalDuration(), piggyBankAnimation);

      this.onClickEventHandler = this.onClick.bind(this);

      arg_selector(this.matrix.element).addEvent('click', this.onClickEventHandler);
    },

    removeEventHandlers: function ()
    {
      if (this.onClickEventHandler)
      {
        arg_selector(this.matrix.element).removeEvent('click', this.onClickEventHandler);
      }
    },

    onClick: function (arg_event)
    {
      var stimuli  = this.configuration.getExpectedStimuli()
        , stimulus = stimuli.shift()
        , cell     = arg_event.target;

      if (stimulus.y != cell.parentNode.rowIndex || stimulus.x != cell.cellIndex)
      {
        document.getElementById('piggy-bank').removeClass('coin_neutral').addClass('coin_incorrect');
        this.changeText("That's too bad, you lost :-( Stay alert we'll start again soon");
        this.highLightText();
        this.controller.endGame();
        this.controller.startGame.delay(this.configuration.getIntroductionDuration(), this.controller);
      }
      else
      {
        if (1 > stimuli.length)
        {
          document.getElementById('piggy-bank').removeClass('coin_neutral').addClass('coin_correct');
          this.changeText("Great you won the game :-D Stay alert we'll start again soon");
          this.highLightText();
          this.controller.endGame();
          this.controller.startGame.delay(this.configuration.getIntroductionDuration(), this.controller);
        }
        else
        {
          this.highLightText();
        }
      }
    },

    stop: function ()
    {
      this.removeEventHandlers();
      this.matrix.dispose();
    },

    changeText: function(arg_text)
    {
      this.textElement.innerHTML = arg_text;
    },

    highLightText: function ()
    {
      arg_selector(this.textElement).highlight('#00611C');
    }

  };

  var GameController = function(arg_matrixElement, arg_textElement, arg_piggyBankElement)
  {
    this.matrixElement    = arg_matrixElement;
    this.textElement      = arg_textElement;
    this.piggyBankElement = arg_piggyBankElement;
  };

  GameController.prototype = {

    startGame: function ()
    {
      if (arg_undefined !== GameController.currentGame)
      {
        throw new Error("There is a game currently active");
      }

      var client     = new XMLHttpRequest()
        , controller = this; // create reference for later

      client.onreadystatechange = function ()
      {
        if (this.readyState == 4)
        {
          if (200 !== this.status && 0 !== this.status)
          {
            if (null !== this.responseText)
            {
              throw new Error("No data was received from the server");
            }
          }
          if (null !== this.responseText)
          {
            controller.processConfiguration(this.responseText).start();
          }
        }
      }

      // for now we just fetch random static question from our data dir
      // this should be replaced with a database call
      client.open("GET", "data/question-" + Math.round(Math.random() * 10) + '.txt');
      client.send();
    },

    processConfiguration: function (arg_configuration)
    {
      var configuration = new ConfigurationTransformer(arg_configuration, '|', ';', ',')
        , matrix        = new Matrix(this.matrixElement, configuration.getRows(), configuration.getColumns());

      GameController.currentGame = new Game(matrix, configuration, this.textElement, this);

      return GameController.currentGame;
    },

    endGame: function ()
    {
      if (arg_undefined === GameController.currentGame)
      {
        throw new Error("There no game active");
      }

      GameController.currentGame.stop();

      GameController.currentGame = arg_undefined;
    }

  };

  var Stimulus = function(arg_x, arg_y, arg_color, arg_shape)
  {
    this.x        = arg_x;
    this.y        = arg_y;
    this.shape    = arg_shape;
    this.color    = arg_color;
    this.duration = 1000;
    this.delay    = 1000;
  };

  var ConfigurationTransformer = function(arg_configuration, arg_configurationDelimitter, arg_objectDelimitter, arg_characteristicDelimitter)
  {
    var configuration = arg_configuration.split(arg_configurationDelimitter);

    if (4 > configuration.length)
    {
      throw new Error("Incorrect configuration input");
    }

    var dimensions = configuration[0].split(arg_characteristicDelimitter);

    function _getRows ()
    {
      return parseInt(dimensions[0])
    }

    function _getColumns ()
    {
      return parseInt(dimensions[1])
    }

    function _getIntroduction ()
    {
      return configuration[1];
    }

    function _getQuestion ()
    {
      return configuration[2];
    }

    function _getIntroductionDuration ()
    {
      return 2000;
    }

    function _getQuestionDuration ()
    {
      return 2000;
    }
    
    function _getTotalDuration ()
    {
      return 10000;
    }

    var definitions = configuration[3].split(arg_objectDelimitter)
      , stimuli     = []
      , rows        = _getRows();

    for (var i = 0, count = definitions.length; i < count; i++)
    {
      var stimulus = definitions[i].split(arg_characteristicDelimitter);

      stimuli.push(new Stimulus((stimulus[0] - 1) % rows, Math.floor((stimulus[0] - 1) / rows), stimulus[1], stimulus[2]));
    }

    function _getStimuli ()
    {
      return stimuli;
    }

    function _getExpectedStimuli ()
    {
      // possible future extension point
      return stimuli;
    }

    return { getRows:                 _getRows
           , getColumns:              _getColumns
           , getIntroduction:         _getIntroduction
           , getIntroductionDuration: _getIntroductionDuration
           , getQuestionDuration:     _getQuestionDuration
           , getTotalDuration:        _getTotalDuration
           , getQuestion:             _getQuestion
           , getStimuli:              _getStimuli
           , getExpectedStimuli:      _getExpectedStimuli
           };
  };

  var SpriteAnimation = function (arg_element, arg_frames, arg_width, arg_duration, arg_callback)
  {
    this.callback = arg_callback;
    this.element  = arg_element;
    this.reverse  = false;
    this.frame    = 1;
    this.count    = arg_frames;
    this.fps      = Math.sqrt(Math.pow(parseInt(arg_duration / arg_frames), 2));
    this.width    = arg_width;
    this.timer    = null;
  };

  SpriteAnimation.prototype = {

    pulse: function ()
    {
      this.callback(this.element);

      if (this.frame < this.count)
      {
        if ( ! this.reverse)
        {
          this.frame++;
        }
        else
        {
          this.frame--;
        }
      }
      else if (this.frame == this.count)
      {
        this.reverse = true;
        this.frame--;
      }
      else if (this.frame === 0)
      {
        this.reset();
      }
    },

    start: function ()
    {
      if (null == this.timer)
      {
        this.timer = this.pulse.periodical(this.fps, this);
      }
    },

    stop: function ()
    {
      if (this.timer)
      {
        arg_window.clearInterval(this.timer);

        this.timer = null;
      }
    },

    reset: function ()
    {
      this.frame   = 0;
      this.reverse = false;

      this.stop();
    }

  };

  var Matrix = function (arg_element, arg_rows, arg_columns)
  {
    if (arg_undefined === arg_element)
    {
      throw new Error("No element was passed");
    }

    this.element = arg_element;
    this.rows    = arg_rows;
    this.columns = arg_columns;
    this.grid    = [];

    for (var i = 0; i < this.rows; i++)
    {
      this.grid[i] = [];
    }
  };

  Matrix.prototype = {

    build: function ()
    {
      var table = document.createElement('table')
        , tbody = document.createElement('tbody');

      table.appendChild(tbody);

      for (var i = 0; i < this.rows; i++)
      {
        var row = document.createElement('tr');

        for (var j = 0; j < this.columns; j++)
        {
          var cell = document.createElement('td');

          row.appendChild(cell);

          this.grid[i][j] = cell;
        }

        tbody.appendChild(row);
      }

      this.element.appendChild(table);
    },

    dispose: function ()
    {
      this.element.removeChild(this.element.getElementsByTagName('table')[0]);
    }

  };

  return { GameController: GameController
         };
}(/*The global window object*/window, /*The mootools selector*/ document.id));
