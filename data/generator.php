<pre>
<?php
  $values = "INSERT INTO `rekentuin`.`items` (`id`, `mirror_item_id`, `question`, `answer_options`, `correct_answer`, `maximum_response_in_seconds`, `rating`, `domain_id`, `user_id`, `predecessor_id`, `start_rating`, `modified_count`, `version`, `status`, `modified`, `rating_uncertainty`, `question_game_type_id`, `answer_game_type_id`, `validator`, `created`) VALUES ";
  
  $i = 1;
  while($i < 22) {
    $nS = rand(1, 5);
    $x = rand(1,5);
    $y = rand(1,5);
    $item = "{'grid':[" . ($x+1) . "," . ($y+1) . "],'pre':0,'post':0,'sequence':[";
    
    while($nS > 0) {
      $xS = rand(0, $x);
      $yS = rand(0, $y);
      $item .= "{'x':$xS,'y':$yS,'col':" . rand(0, 3) . ",'shape':" . rand(0, 3) . "},";
      $nS--;
    }
    
    $item = rtrim($item, ",");
    $item .= "]}";
    echo $i . ": " . $item . "<br />";
    
    $values .= "(NULL, $i, \"$item\", 'none', 'none', 20, 2, 40, 0, 0, 2, 0, 2, 'active', '0000-00-00 00:00:00', 0, 2, 1, '', '0000-00-00 00:00:00'),\n ";
    
    $i++;
  }
  
  $values = rtrim($values, "\n ,");
  echo "\n\n" . $values;
?>
</pre>