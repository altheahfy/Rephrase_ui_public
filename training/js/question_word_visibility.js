// 🔹 分離疑問詞の表示制御システム
// question-word-text (疑問詞テキスト) と question-word-auxtext (補助テキスト) の表示/非表示を制御

// 🎯 疑問詞の表示状態を管理（グローバル変数を使用）
// questionWordVisibilityState は visibility_control.js で宣言済み

// 🔧 疑問詞の表示制御
function toggleQuestionWordVisibility(elementType, isVisible) {
  console.log(`🎛️ 疑問詞の${elementType}表示を${isVisible ? '表示' : '非表示'}に設定`);
  console.log(`🔍 呼び出し元: ${new Error().stack.split('\n')[2]}`);
  
  // 状態を更新
  questionWordVisibilityState[elementType] = isVisible;
  
  // DOM要素を取得して表示/非表示を切り替え
  const textElement = document.querySelector('.question-word-text');
  const auxtextElement = document.querySelector('.question-word-auxtext');
  
  console.log(`🔍 textElement: ${textElement ? 'found' : 'not found'}`);
  console.log(`🔍 auxtextElement: ${auxtextElement ? 'found' : 'not found'}`);
  
  if (elementType === 'text' && textElement) {
    textElement.style.display = isVisible ? 'block' : 'none';
    console.log(`✅ 疑問詞テキストを${isVisible ? '表示' : '非表示'}にしました`);
  }
  
  if (elementType === 'auxtext' && auxtextElement) {
    const questionWordArea = document.getElementById('display-top-question-word');
    
    if (isVisible) {
      // 表示時：hide-auxtextクラスを削除してGrid行を復活
      if (questionWordArea) {
        questionWordArea.classList.remove('hide-auxtext');
      }
      auxtextElement.style.display = 'flex';
    } else {
      // 非表示時：hide-auxtextクラスを追加してGrid行を0に
      if (questionWordArea) {
        questionWordArea.classList.add('hide-auxtext');
      }
      auxtextElement.style.display = 'none';
    }
    console.log(`✅ 疑問詞補助テキストを${isVisible ? '表示' : '非表示'}にしました`);
    console.log(`🔍 questionWordAreaクラス: ${questionWordArea ? questionWordArea.className : 'not found'}`);
  }
  
  // 状態を保存
  saveQuestionWordVisibilityState();
}

// 📁 疑問詞表示状態をlocalStorageに保存
function saveQuestionWordVisibilityState() {
  try {
    localStorage.setItem('question_word_visibility_state', JSON.stringify(questionWordVisibilityState));
    console.log("💾 疑問詞表示状態を保存しました:", questionWordVisibilityState);
  } catch (error) {
    console.error("❌ 疑問詞表示状態の保存に失敗:", error);
  }
}

// 📂 疑問詞表示状態をlocalStorageから読み込み
function loadQuestionWordVisibilityState() {
  try {
    const saved = localStorage.getItem('question_word_visibility_state');
    if (saved) {
      questionWordVisibilityState = JSON.parse(saved);
      console.log("📂 保存された疑問詞表示状態を読み込みました:", questionWordVisibilityState);
    } else {
      console.log("📝 保存された疑問詞表示状態がないため、デフォルト値を使用");
    }
    
    // 読み込んだ状態をDOMに適用
    applyQuestionWordVisibilityState();
  } catch (error) {
    console.error("❌ 疑問詞表示状態の読み込みに失敗:", error);
    // エラー時はデフォルト状態を適用
    applyQuestionWordVisibilityState();
  }
}

// 🎨 疑問詞の表示状態をDOMに適用
function applyQuestionWordVisibilityState() {
  const textElement = document.querySelector('.question-word-text');
  const auxtextElement = document.querySelector('.question-word-auxtext');
  
  if (textElement) {
    textElement.style.display = questionWordVisibilityState.text ? 'block' : 'none';
  }
  
  if (auxtextElement) {
    const questionWordArea = document.getElementById('display-top-question-word');
    
    if (questionWordVisibilityState.auxtext) {
      // 表示時：hide-auxtextクラスを削除してGrid行を復活
      if (questionWordArea) {
        questionWordArea.classList.remove('hide-auxtext');
      }
      auxtextElement.style.display = 'flex';
    } else {
      // 非表示時：hide-auxtextクラスを追加してGrid行を0に
      if (questionWordArea) {
        questionWordArea.classList.add('hide-auxtext');
      }
      auxtextElement.style.display = 'none';
    }
  }
  
  console.log("🎨 疑問詞表示状態をDOMに適用しました:", questionWordVisibilityState);
}

// 🎛️ UI制御パネルとの連携
function setupQuestionWordControlUI() {
  console.log("🎛️ 疑問詞制御UIのイベントハンドラーを設定中...");
  
  // 疑問詞用チェックボックスを取得
  const textCheckbox = document.querySelector('.visibility-checkbox[data-slot="question-word"][data-type="text"]');
  const auxtextCheckbox = document.querySelector('.visibility-checkbox[data-slot="question-word"][data-type="auxtext"]');
  
  // テキストチェックボックスのイベント
  if (textCheckbox) {
    textCheckbox.addEventListener('change', function() {
      const isVisible = this.checked;
      console.log(`🎛️ 疑問詞テキストチェックボックス変更: ${isVisible}`);
      toggleQuestionWordVisibility('text', isVisible);
    });
    
    // 初期状態を設定
    textCheckbox.checked = questionWordVisibilityState.text;
  } else {
    console.warn("⚠ 疑問詞テキスト用チェックボックスが見つかりません");
  }
  
  // 補助テキストチェックボックスのイベント
  if (auxtextCheckbox) {
    auxtextCheckbox.addEventListener('change', function() {
      const isVisible = this.checked;
      console.log(`🎛️ 疑問詞補助テキストチェックボックス変更: ${isVisible}`);
      toggleQuestionWordVisibility('auxtext', isVisible);
    });
    
    // 初期状態を設定
    auxtextCheckbox.checked = questionWordVisibilityState.auxtext;
  } else {
    console.warn("⚠ 疑問詞補助テキスト用チェックボックスが見つかりません");
  }
  
  console.log("✅ 疑問詞制御UI設定完了");
}

// 🔄 疑問詞表示をリセット（全表示）
function resetQuestionWordVisibility() {
  console.log("🔄 疑問詞表示をリセット（全表示）");
  
  questionWordVisibilityState.text = true;
  questionWordVisibilityState.auxtext = true;
  
  applyQuestionWordVisibilityState();
  
  // UIチェックボックスも更新
  const textCheckbox = document.querySelector('.visibility-checkbox[data-slot="question-word"][data-type="text"]');
  const auxtextCheckbox = document.querySelector('.visibility-checkbox[data-slot="question-word"][data-type="auxtext"]');
  
  if (textCheckbox) textCheckbox.checked = true;
  if (auxtextCheckbox) auxtextCheckbox.checked = true;
  
  saveQuestionWordVisibilityState();
}

// 🔹 グローバル関数としてエクスポート
window.toggleQuestionWordVisibility = toggleQuestionWordVisibility;
window.loadQuestionWordVisibilityState = loadQuestionWordVisibilityState;
window.saveQuestionWordVisibilityState = saveQuestionWordVisibilityState;
window.applyQuestionWordVisibilityState = applyQuestionWordVisibilityState;
window.setupQuestionWordControlUI = setupQuestionWordControlUI;
window.resetQuestionWordVisibility = resetQuestionWordVisibility;

// 🔄 DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔄 疑問詞表示制御システムを初期化中...");
  
  // 少し遅らせて初期化（他のシステムとの競合を避けるため）
  setTimeout(() => {
    loadQuestionWordVisibilityState();
    setupQuestionWordControlUI();
  }, 150);
});

console.log("✅ question_word_visibility.js が読み込まれました");
