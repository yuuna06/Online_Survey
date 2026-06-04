/**
 * ------------------------------------------------------------------------
 * 連携APIクライアント (JavaScript -> api.php)
 * ------------------------------------------------------------------------
 * このファイルは、画面からサーバー（api.php）へデータを送受信するための共通処理です。
 * HTML側からこれらの関数を呼び出すだけで、裏側で勝手に通信と画面更新が行われます。
 *
 * 【重要】このファイルを読み込むHTMLには、以下のIDを持つ要素を用意してください。
 * - コメント入力欄: id="comment-text-area"
 * - コメント一覧の枠: id="comment-list"
 * - アンケートIDを持つ隠し項目: id="current-survey-id" value="UUID..."
 * - 保存状態の表示欄: id="save-status"
 * - アンケートフォーム本体: id="main-form"
 * ------------------------------------------------------------------------
 */

/**
 * ① コメント投稿処理
 * 概要：テキストエリアの文字を取得し、api.phpに送信。成功すればHTML要素として追記します。
 * 使い方：投稿ボタンの onclick="postComment()" で呼び出してください。
 */
async function postComment() {
    // 1. HTMLから必要なデータを取得
    const textInput = document.getElementById('comment-text-area');
    const text = textInput.value.trim();
    const surveyIdInput = document.getElementById('current-survey-id');

    // エラーハンドリング：空送信の防止
    if (!text) {
        alert("コメントを入力してください。");
        return;
    }
    if (!surveyIdInput) {
        console.error("システムエラー: アンケートID(current-survey-id)が見つかりません。");
        return;
    }

    // 2. api.phpへ送るデータの梱包
    const formData = new FormData();
    formData.append('action', 'comment');
    formData.append('survey_id', surveyIdInput.value);
    formData.append('text', text);

    // 3. 通信実行
    try {
        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        // 4. 通信成功時の画面更新処理
        if (data.status === 'success') {
            // サーバーから送られてきたHTML(コメント部品)を、リストの末尾に挿入
            const commentList = document.getElementById('comment-list');
            commentList.insertAdjacentHTML('beforeend', data.comment_html);
            
            // 連続投稿できるように入力欄を空に戻す
            textInput.value = '';
        } else {
            // NGワード等、サーバー側で弾かれた場合のメッセージを表示
            alert(data.message);
        }
    } catch (error) {
        console.error("通信エラー:", error);
        alert("サーバーとの通信に失敗しました。");
    }
}

/**
 * ② コメントへの「いいね」処理
 * 概要：対象コメントのいいね数を切り替え（トグル）、最新の件数で画面を書き換えます。
 * 使い方：各コメントのいいねボタン onclick="toggleLike('コメントのUUID')" で呼び出してください。
 */
async function toggleLike(commentId) {
    if (!commentId) return;

    const formData = new FormData();
    formData.append('action', 'like');
    formData.append('comment_id', commentId);

    try {
        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();

        if (data.status === 'success') {
            // いいねの数字を表示している<span>の中身を、サーバーから返ってきた最新の数字で上書き
            const countElement = document.getElementById(`like-count-${commentId}`);
            if (countElement) {
                countElement.textContent = data.total_likes;
            }

            // キリ番などの条件を満たした場合、音声演出を実行
            if (data.play_voice) {
                const audio = new Audio('assets/sounds/iine_voice.mp3');
                audio.play().catch(e => console.warn("音声再生がブラウザにブロックされました", e));
            }
        }
    } catch (error) {
        console.error("いいね処理エラー:", error);
    }
}
/**
 * ③ リアルタイム保存（サイレント・オートセーブ）
 * 概要：ユーザーに通知することなく、裏側でこっそりセッションへ同期します。
 * 意図：UXを邪魔せず、ブラウザが落ちた際などの「最悪の事態」を回避するための保険です。
 */
async function autoSave(type) {
    const formElement = document.getElementById('main-form');
    if (!formElement) return;

    // フォームの内容をまるごと取得
    const formDataObj = Object.fromEntries(new FormData(formElement));
    
    const formData = new FormData();
    formData.append('action', 'save');
    formData.append('type', type);
    formData.append('payload', JSON.stringify(formDataObj));

    try {
        // fetchの成否に関わらず、画面には一切何も出しません
        await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        
    } catch (error) {
        // 開発時のデバッグ用にコンソールにだけ残しておく
        console.error("Silent Save Error (Backend only):", error);
    }
}

/**
 * ------------------------------------------------------------------------
 * 自動保存の監視設定
 * ------------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    const formElement = document.getElementById('main-form');
    if (formElement) {
        let saveTimer;

        formElement.addEventListener('input', () => {

            // デバウンス処理　入力が止まってから1秒後に1回だけ送信
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => {
                autoSave('answer');
            }, 1000); 
        });
    }
});