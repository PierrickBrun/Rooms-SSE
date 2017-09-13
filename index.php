<?php

require 'redis.php';

require 'vendor/predis/predis/autoload.php';
Predis\Autoloader::register();

$db = new Predis\Client();
$prefix = 'PHPSESSID:';
$sessHandler = new RedisSessionHandler($db, $prefix);
$sessHandler->ttl = ini_get('session.gc_maxlifetime');

ini_set('session.save_handler', $sessHandler);
session_start();
echo '<h1>SID: '.session_id().'</h1>';

$users = array('Bob' => '123', 'John' => '456');

$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST') {
    doLogin();
} else {
    doHTML();
}
function doLogin()
{
    $users = array('Bob' => '123', 'John' => '456');

    if (array_key_exists($_POST['username'], $users) && $users[$_POST['username']] == $_POST['password']) {
        $_SESSION['user'] = $_POST['username'];
    }
    doHTML();
}
function doHTML()
{
    if (!isset($_SESSION['user'])) {
        require 'login.html';

        return;
    } else {
        //redirects to node server
        echo '<script>
        window.location.assign("http://localhost:8080/");
        </script>';
    }
}
