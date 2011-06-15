var MarleenMol = new Class({
  Extends:          GameUtils,
  Implements:       [Events],
  BindAll:          true,

  screen:           false,
  data:             false,
  gameCoins:        0,
  gameData:         false,
  itemData:         false,
  timeouts:         [],

  answerAllowed:    false,
  givenAnswer:      false,
  coinsLeft:        0,

  currentIndex:     0,

  animationDelay:   0,
  ANIMATION_FPS:    8,
  HOLD_SHAPE_MS:    1000,

  initialize: function (screen, data)
  {
    this.screen = screen;
    this.data   = data;
    
    /* Maak click handlers aan voor mollengrid */
    if (this.screen.grid)
    { for (var row = 0; row < 6; row++)
      { for (var col = 0; col < 6; col++)
        { this.addEventHandler(this.screen.grid[row][col], 'click', this.clickCheck.pass([col, row]));
        }
      }
    }
    
    /* Verberg instructieteksten */
    this.setInstruction(false);
    
    /* Overige spelknoppen etc. */
    this.addEventHandler(this.screen.game.stop, 'click', this.onClickStop);
    this.addEventHandler(this.screen.game.answerDontKnow, 'click', this.onClickAnswerDontKnow);
    this.setText(this.screen.game.stop, __('stop'));
    this.setText(this.screen.game.coins, this.gameCoins);
    this.initCoins();
  },

  item: function (itemData)
  {
    /* Reset variabelen en verwerk itemdata */
    this.answerAllowed    = false;
    this.givenAnswer      = false;
    this.currentIndex     = 0;
    this.animationDelay   = 0;
    
    this.data.Item        = itemData.Item;
    this.Item             = JSON.decode(this.data.Item.question);
    this.updateGrid();
    
    /* Herstel muntjes, bereid scherm voor op itemafname */
    this.coinsLeft       = this.screen.game.coin.length;
    this.numberOfSeconds = itemData.Item.maximum_response_in_seconds.toInt();
    for (var i = 0; i < this.screen.game.coin.length; i++)
    {
      this.style(this.screen.game.coin[i], 0);
    }
    
    this.setInstruction(this.Item.task, 'pre');
    
    this.hide(this.screen.game.stop);
    this.hide(this.screen.game.answerDontKnow);
    
    this.setAnimation();
    this.stimulusFinished.delay(this.animationDelay);
  },

  stimulusFinished: function ()
  {
    this.answerAllowed = true;
    this.setInstruction(this.Item.task, 'post');
    this.show(this.screen.game.answerDontKnow);
    this.animateCoins(0, 1);
  },

  setInstruction: function (id, prepost)
  {
    var instructions = this.screen.instructions.container.getElements('div').hide();
    if (id !== false)
    {
      this.screen.instructions[prepost][id].show();
      this.screen.instructions[prepost][id].getParent().show();
    }
  },

  updateGrid: function ()
  {
    for (var row = 0; row < 6; row++)
    {
      if (row >= this.Item.grid[1])     this.hide(this.screen.grid[row]);
      else
      {
        for (var col = 0; col < 6; col++)
        {
          if (col >= this.Item.grid[0]) this.hide(this.screen.grid[row][col]);
          else                          this.show(this.screen.grid[row][col].set('html', ''));
        }
        this.show(this.screen.grid[row]);
      }
    }
  },

  setAnimation: function ()
  {
    this.timeouts.sequence = [];
    for (var i = 0; i < this.Item.sequence.length; i++)
    {
      var cell = this.Item.sequence[i];
      this.screen.grid[y][x].set('class', 's' + cell.shape + 'c' + cell.col);
      for (var j = 0; j < 5; j++)
      {
        this.timeouts.sequence.push(this.updateCell.pass([cell.x, cell.y, j + 1]).delay(this.animationDelay));
        this.animationDelay += 1000 / cell.fps;
      }
      for (j = 4; j >= 0; j--)
      {
        if (j == 4) this.animationDelay += cell.holdms;
        this.timeouts.sequence.push(this.updateCell.pass([cell.x, cell.y, j]).delay(this.animationDelay));
        this.animationDelay += 1000 / cell.fps;
      }
    }
  },

  updateCell: function (x, y, z)
  {
    var width = parseInt(this.screen.grid[y][x].getStyle('width'), 10);
    this.screen.grid[y][x].setStyle('background-position', '-' + z * width + 'px 0px');
  },

  clickCheck: function (x, y)
  {
    /* Is de animatie al afgelopen? */
    if (!this.answerAllowed) return false;
    
    /* Is de juiste positie aangeklikt? */
    if (x != this.Item.sequence[this.currentIndex].x || y != this.Item.sequence[this.currentIndex].y)
    {
      this.answer('incorrect');
    }
    else
    {
      this.currentIndex++;
      var oldHtml = this.screen.grid[y][x].get('html');
      var newHtml = (oldHtml == '') ? '' : oldHtml + ', ' ;
      this.screen.grid[y][x].set('html', newHtml + this.currentIndex);
      if (this.currentIndex == this.Item.sequence.length) this.answer('correct');
    }
  },

  onClickAnswerDontKnow: function ()
  {
    this.answer(__('questionMarkValue'));
  },

  onClickStop: function ()
  {
    this.fireEvent('stop');
  },

  answer: function (answer)
  {
    this.answerAllowed = false;
    var correct = (answer == 'correct');
    this.givenAnswer = answer;
    
    var multiplier = this.numberOfSeconds / this.screen.game.coin.length;
    if (multiplier < 1) multiplier = 1;
    
    this.hide(this.screen.game.answerDontKnow);
    this.show(this.screen.game.stop);
    
    var readyDelay;
    if (answer == __('questionMarkValue')) readyDelay = this.animateCoins(0, 0);
    else                                   readyDelay = this.animateCoins(correct ? 1 : 2, 10 * multiplier);
    readyDelay += correct ? this.data.Game.wait_correct * 1000 : this.data.Game.wait_incorrect * 1000;
    
    this.fireEvent('answer', [answer, correct, this.coinsLeft, readyDelay]);
  }
});