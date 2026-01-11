/**
 * 🌐 言語切り替えシステム
 * 日本語 ⇔ 英語の切り替え機能
 */

// 翻訳辞書
const translations = {
  ja: {
    // タイトル
    'app-title': '🔄 Rephrase 例文トレーニング',
    
    // 使い方ガイド
    'guide-text-1': 'を押して出てくる英語とイラストのセットを覚えよう',
    'guide-text-2': 'を押して練習したい場所の英語を消そう',
    'guide-text-3': 'で練習（一部～全部）',
    'guide-text-4': 'を押すと隠れている英語が出ます',
    
    // ボタンテキスト
    'btn-shuffle-all': '🎲 全シャッフル',
    'btn-english-off': '英語\nOFF',
    'btn-hint-off': 'ヒント\nOFF',
    'btn-image-off': 'イラスト\nOFF',
    'btn-detail': '▼ 詳細',
    'btn-reset-visibility': '全表示',
    'btn-voice-learning': '🎤 音声学習',
    'btn-control-panel': '📝 制御パネル',
    'btn-shuffle': '🎲',
    'btn-explanation': '💡 解説',
    'btn-explanation-full': '💡 例文解説',
    'btn-hide-all-english': '🙈 英語全OFF',
    
    // データ選択UI
    'data-label': '📋 データ',
    'data-select-placeholder': '-- 選択 --',
    'data-option-main': '🎯 メイン',
    'data-option-2': '📚 例文2',
    'data-option-intransitive': '📝 自動詞第1文型',
    'btn-load': '読込',
    
    // 音声パネル
    'voice-panel-title': '🎤 音声学習システム',
    'voice-panel-android-title': '🤖 Android音声学習システム',
    'voice-recognition-status': '🎤 音声認識状態: 初期化中...',
    'voice-android-status': 'Android音声認識状態',
    
    // 全シャッフルボタン
    'shuffle-all-text': '🎲 例文全シャッフル',
    
    // 初回ガイド
    'guide-hover-text': 'ポインタをかざすと説明が出ます',
    'guide-close-hint': 'このガイドを非表示にする',
    
    // ツールチップ（title属性）
    'tooltip-step-1': '全シャッフルボタンを押して、ランダムな英語とイラストの組み合わせを表示します',
    'tooltip-step-2': 'EN OFFボタンを押して、練習したい部分の英語を隠すことができます',
    'tooltip-step-3': '全シャッフルまたは個別シャッフルボタンで、一部または全部の練習ができます',
    'tooltip-step-4': '詳細ボタンを押すと、隠れている英語が表示されます',
    'tooltip-explanation': '文法解説を表示'
  },
  en: {
    // タイトル
    'app-title': '🔄 Rephrase Sentence Training',
    
    // 使い方ガイド
    'guide-text-1': 'Press to memorize the English-image pairs',
    'guide-text-2': 'Press to hide English in practice areas',
    'guide-text-3': 'Practice (partial to full)',
    'guide-text-4': 'Press to reveal hidden English',
    
    // ボタンテキスト
    'btn-shuffle-all': '🎲 Shuffle All',
    'btn-english-off': 'EN\nOFF',
    'btn-hint-off': 'Hint\nOFF',
    'btn-image-off': 'Image\nOFF',
    'btn-detail': '▼ Detail',
    'btn-reset-visibility': 'Show All',
    'btn-voice-learning': '🎤 Voice Learning',
    'btn-control-panel': '📝 Control Panel',
    'btn-shuffle': '🎲',
    'btn-explanation': '💡 Explanation',
    'btn-explanation-full': '💡 Explanation',
    'btn-hide-all-english': '🙈 Hide All English',
    
    // データ選択UI
    'data-label': '📋 Data',
    'data-select-placeholder': '-- Select --',
    'data-option-main': '🎯 Main',
    'data-option-2': '📚 Examples 2',
    'data-option-intransitive': '📝 Intransitive Type 1',
    'btn-load': 'Load',
    
    // 音声パネル
    'voice-panel-title': '🎤 Voice Learning System',
    'voice-panel-android-title': '🤖 Android Voice Learning',
    'voice-recognition-status': '🎤 Voice Recognition: Initializing...',
    'voice-android-status': 'Android Voice Recognition Status',
    
    // 全シャッフルボタン
    'shuffle-all-text': '🎲 Shuffle All Sentences',
    
    // 初回ガイド
    'guide-hover-text': 'Hover to see instructions',
    'guide-close-hint': 'Hide this guide',
    
    // ツールチップ（title属性）
    'tooltip-step-1': 'Press Shuffle All to display random English-image combinations',
    'tooltip-step-2': 'Press EN OFF to hide English text in practice areas',
    'tooltip-step-3': 'Use Shuffle All or individual shuffle buttons for partial or full practice',
    'tooltip-step-4': 'Press Detail button to reveal hidden English text',
    'tooltip-explanation': 'Show grammar explanation'
  }
};

// 現在の言語を取得（localStorageから復元、デフォルトは日本語）
let currentLanguage = localStorage.getItem('rephrase_language') || 'ja';

/**
 * 言語を切り替える
 * @param {string} lang - 言語コード ('ja' または 'en')
 */
function switchLanguage(lang) {
  if (!translations[lang]) {
    console.error(`未対応の言語: ${lang}`);
    return;
  }
  
  currentLanguage = lang;
  localStorage.setItem('rephrase_language', lang);
  
  console.log(`🌐 言語切り替え: ${lang === 'ja' ? '日本語' : 'English'}`);
  
  // 全ての翻訳対象要素を更新
  applyTranslations();
  
  // ボタンの状態を更新
  updateLanguageButtons();
  
  // 言語変更イベントを発火（他のシステムが反応できるように）
  window.dispatchEvent(new Event('languageChanged'));
}

/**
 * 翻訳を適用
 */
function applyTranslations() {
  const lang = currentLanguage;
  const dict = translations[lang];
  
  // data-i18n属性を持つ全要素に翻訳を適用
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (dict[key]) {
      // innerHTML対応（改行を含むテキスト用）
      if (element.tagName === 'BUTTON' || element.classList.contains('allow-html')) {
        element.innerHTML = dict[key];
      } else {
        element.textContent = dict[key];
      }
    }
  });
  
  // data-i18n-title属性を持つ全要素のtitle属性を翻訳
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    if (dict[key]) {
      element.title = dict[key];
    }
  });
  
  // 🆕 言語切り替え時に既存ボタンを再描画
  refreshAllButtons();
  
  console.log(`✅ 翻訳適用完了: ${Object.keys(dict).length}件`);
}

/**
 * 全ボタンを再描画（t()経由で正しい言語を取得）
 */
function refreshAllButtons() {
  // 個別英語OFF/ONボタン（背景色で状態を判定）
  document.querySelectorAll('.upper-slot-toggle-btn').forEach(btn => {
    const bgColor = btn.style.backgroundColor;
    const isOff = bgColor === 'rgb(76, 175, 80)' || bgColor === '#4CAF50'; // 緑色=OFF状態
    
    if (isOff) {
      if (window.getEnglishOffButtonText) {
        btn.innerHTML = window.getEnglishOffButtonText();
      }
    } else {
      if (window.getEnglishOnButtonText) {
        btn.innerHTML = window.getEnglishOnButtonText();
      }
    }
  });
  
  // 全体英語OFF/ONボタンも再描画
  const hideAllBtn = document.getElementById('hide-all-english-visibility');
  if (hideAllBtn) {
    const bgColor = hideAllBtn.style.backgroundColor;
    const isOff = bgColor === 'rgb(76, 175, 80)' || bgColor === '#4CAF50';
    
    const lang = localStorage.getItem('rephrase_language') || 'ja';
    if (isOff) {
      hideAllBtn.innerHTML = lang === 'ja' ? '🙈 英語全OFF' : '🙈 Hide All English';
    } else {
      hideAllBtn.innerHTML = lang === 'ja' ? '👁️ 英語全ON' : '👁️ Show All English';
    }
  }
}

// 🌐 refreshAllButtonsをグローバルに公開
window.refreshAllButtons = refreshAllButtons;

/**
 * 言語ボタンの状態を更新
 */
function updateLanguageButtons() {
  const jaBtn = document.getElementById('lang-btn-ja');
  const enBtn = document.getElementById('lang-btn-en');
  
  if (!jaBtn || !enBtn) return;
  
  if (currentLanguage === 'ja') {
    jaBtn.classList.add('active');
    enBtn.classList.remove('active');
  } else {
    jaBtn.classList.remove('active');
    enBtn.classList.add('active');
  }
}

/**
 * 初期化処理
 */
function initLanguageSwitcher() {
  console.log('🌐 言語切り替えシステム初期化');
  
  // 詳細ボタンに一括でdata-i18n属性を追加
  document.querySelectorAll('button[data-subslot-toggle]').forEach(button => {
    if (button.textContent.includes('詳細') || button.textContent.includes('Detail')) {
      button.setAttribute('data-i18n', 'btn-detail');
    }
  });
  
  // ページロード時に翻訳を適用
  applyTranslations();
  updateLanguageButtons();
  
  // 言語ボタンにイベントリスナーを追加
  const jaBtn = document.getElementById('lang-btn-ja');
  const enBtn = document.getElementById('lang-btn-en');
  
  if (jaBtn) {
    jaBtn.addEventListener('click', () => switchLanguage('ja'));
  }
  
  if (enBtn) {
    enBtn.addEventListener('click', () => switchLanguage('en'));
  }
  
  console.log(`✅ 言語切り替えシステム初期化完了（現在: ${currentLanguage}）`);
}

// DOMContentLoadedで初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanguageSwitcher);
} else {
  initLanguageSwitcher();
}

// グローバルに公開
window.switchLanguage = switchLanguage;
window.applyTranslations = applyTranslations;
