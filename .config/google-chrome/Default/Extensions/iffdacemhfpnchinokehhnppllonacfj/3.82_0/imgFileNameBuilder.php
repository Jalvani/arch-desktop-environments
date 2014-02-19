<?php

$dir    = 'img/emoticonsandemojis';
$files = scandir($dir);

foreach($files as $fileName)
    {
        print("\"img/emoticonsandemojis/". $fileName . "\", \n");    
    }

/* print_r($files); */

?>