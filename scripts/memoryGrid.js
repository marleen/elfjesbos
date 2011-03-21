var MemoryGrid = (function(arg_window, arg_selector, arg_undefined)
{
  var Game = function(arg_matrix, arg_configuration, arg_textElement)
  {
    this.matrix        = arg_matrix;
    this.configuration = arg_configuration;
    this.textElement   = arg_textElement;
  };
  
  Game.prototype = {
  
    start: function ()
    {
      this.changeText(this.configuration.getIntroduction());
      this.highLightText();
      this.matrix.build();
      
      var gameInstance = this;
      
      arg_window.setTimeout(function ()
      {
        gameInstance.showStimuli();
      }, this.configuration.getIntroductionDuration());
    },
    
    showStimuli: function ()
    {
      var animators = []
        , stimuli   = this.configuration.getStimuli()
        , animatorChain
        , animator
        , element;
      
      for (var i = 0; i < stimuli.length; i++)
      {
        element  = this.matrix.grid[stimuli[i].y][stimuli[i].x];
        animator = new Animator({ transition: Animator.tx.easeIn
                                , duration:   1000
                                })

        animator.addSubject(new CSSStyleSubject(element, 'background-color: #FFF', 'background-color: ' + stimuli[i].color ));

        animators.push(animator);
      }
      
      animatorChain = new AnimatorChain(animators);
      
      animatorChain.play();
    },
    
    stop: function ()
    {
      this.matrix.dispose();
    },
    
    changeText: function(arg_text)
    {
      this.textElement.innerHTML = arg_text;
    },
    
    highLightText: function ()
    {
      if (arg_undefined === this.highLightAnimator) 
      {
        this.highLightAnimator = new Animator({ transition: Animator.tx.easeIn
                                              , duration:   1000
                                              });
        
        this.highLightAnimator.addSubject(new ColorStyleSubject(this.textElement, "background-color", '#00611C', '#FFF'));
      }
      
      this.highLightAnimator.play();
    }
    
  };
  
  var GameController = function(arg_buttonElement, arg_matrixElement, arg_textElement)
  {
    this.buttonElement = arg_buttonElement;
    this.matrixElement = arg_matrixElement;
    this.textElement   = arg_textElement;
    
    // created a reference to the game controller to refer to from the onClick event handler
    var gameControllerInstance = this;
    
    arg_selector(arg_buttonElement).addEvent('click', function ()
    {
      var disabledClass = 'disabled';
      
      if ( ! this.hasClass(disabledClass)) 
      {
        gameControllerInstance.startGame();
        
        this.addClass(disabledClass);
      }
    });
  };
  
  GameController.prototype = {
  
    startGame: function ()
    {
      if (arg_undefined !== GameController.currentGame) 
      {
        throw new Error("There is a game currently active");
      }
      
      // this should retrieve the question from the database with an AJAX call... hardcoded for now 
      var question      = '4,5|Onthoudt de volgorde van de objecten|Klik de objecten aan in dezelfde volgorde.|2,#333,triangle;4,#345,square;7,#543,ball;16,#555,star;6,#555,star'
        , configuration = new ConfigurationTransformer(question, '|', ';', ',')
        , matrix        = new Matrix(this.matrixElement, configuration.getRows(), configuration.getColumns());
      
      GameController.currentGame = new Game(matrix, configuration, this.textElement);
      
      GameController.currentGame.start();
    },
    
    endGame: function ()
    {
      if (arg_undefined === GameController.currentGame) 
      {
        throw new Error("There no game active");
      }
      
      GameController.currentGame.stop();
    }
    
  };
  
  var Stimulus = function(arg_x, arg_y, arg_color, arg_shape)
  {
    this.x     = arg_x;
    this.y     = arg_y;
    this.shape = arg_shape;
    this.color = arg_color;
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
      return 1000;
    }
 
    var definitions = configuration[3].split(arg_objectDelimitter), stimuli = [], rows = _getRows();
    
    for (var i = 0, count = definitions.length; i < count; i++) 
    {
      var stimulus = definitions[i].split(arg_characteristicDelimitter);
      
      stimuli.push(new Stimulus((stimulus[0] - 1) % rows, Math.floor((stimulus[0] - 1) / rows), stimulus[1], stimulus[2]));
    }
    
    function _getStimuli ()
    {
      return stimuli;
    }
 
    return { getRows:                 _getRows
           , getColumns:              _getColumns
           , getIntroduction:         _getIntroduction
           , getIntroductionDuration: _getIntroductionDuration
           , getQuestion:             _getQuestion
           , getStimuli:              _getStimuli
           };
  };
  
  var Matrix = function(arg_element, arg_rows, arg_columns)
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
      this.element.removeChild(this.element.firstChild);
    }
    
  };
  
  return { GameController: GameController
         };
})(/*The global window object*/window, /*The mootools selector*/ document.id);
