<?php
require "db.php";
$q_key =  "test01";

function showData(array $d):void{
    echo "<pre>";
    print_r($d);
    echo "</pre>";
}

$r = get_survey_by_key($q_key, "question_key");
print_r($r);
$json = $r["survey_spec"];
echo "<br><br><br>";
print_r($json);
echo "<br>";
echo "<h1>".$r['title']."</h1>";
echo "<p>".$r['survey_spec']["title"]."</p>";
$len = count($json["questions"]);
echo "<form method='post'>";
for ($i=0; $i<$len; $i++){
    echo "<div>";
    echo "<h2>質問".($i+1).":".$json["questions"][$i]["label"]."</h2>";
    if($json["questions"][$i]["type"]=="multiple"){
        foreach($json["questions"][$i]["options"] as $item){
            echo "<input type='checkbox' name='q{$i}[]' value='{$item}'>";
            echo "<label>{$item}</label><br>";
        }
    }elseif($json["questions"][$i]["type"]=="single"){
        foreach($json["questions"][$i]["options"] as $item){
            echo "<input type='radio' name='q{$i}' value='{$item}'>";
            echo "<label>".$item."</label><br>";
        }
    }elseif($json["questions"][$i]["type"]=="text"){
        echo "<input type='text' name='q{$i}'>";
    }
    echo "</div>"; 
}
echo "<button type='submit'>送信</button>";
echo "</form>";
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    echo "<h2>受信データ</h2>";
    showData($_POST);
    exit;
}