<?php
/*====================
セッション破棄関数
====================*/
function session_del(){
    //セッションが開始されていない場合は開始する
    if(session_status() == PHP_SESSION_NONE){
        session_start();
    }

    //セッション変数をすべて空にする
    $_SESSION = array();

    //ブラウザのセッションクッキーを削除する
    if(ini_get("session.use_cookies")){
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    //セッションidを破棄する
    session_destroy();
}


/*====================
ログインチェック関数
====================*/
function login_check(){
    //セッションが開始されていない場合は開始する
    if(session_status() == PHP_SESSION_NONE){
        session_start();
    }

    //セッションにユーザーIDが保存されているか確認する
    if(!isset($_SESSION['user_id'])){
        //元のURLを保存してログインページにリダイレクトする
        $_SESSION['return_to'] = $_SERVER['REQUEST_URI']; 
        header('Location: login.php');
        exit();
    }

    //タイムアウトのチェック
    if(isset($_SESSION['last_acc'])){
        $timeout = 30 * 60; // 30分
        if(time() - $_SESSION['last_acc'] > $timeout){
            //セッションを破棄してログインページにリダイレクトする
            session_del();
            $_SESSION['return_to'] = $_SERVER['REQUEST_URI'];
            header('Location: login.php');
            exit();
        }
    }
}