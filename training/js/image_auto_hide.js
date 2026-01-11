// 画像スロット自動非表示機構（修正版）
// 本来の仕様：「プレースホルダー画像や読み込みエラー画像を自動的に非表示にする」

console.log("🔄 image_auto_hide_fixed.js が読み込まれました");

// 🔄 MutationObserver の制御用変数
let imageObserver = null;
let isObserverEnabled = true;

// 🔄 MutationObserver の一時停止/再開機能
function pauseImageObserver() {
  isObserverEnabled = false;
  console.log("⏸️ 画像監視システムを一時停止しました");
}

function resumeImageObserver() {
  isObserverEnabled = true;
  console.log("▶️ 画像監視システムを再開しました");
}

// 🎯 非表示対象とする画像のパターン
const HIDDEN_IMAGE_PATTERNS = [
  'placeholder.png',           // プレースホルダー画像
  'common/placeholder.png',    // プレースホルダー画像（フルパス）
  'slot_images/common/placeholder.png', // プレースホルダー画像（完全パス）
  // '?',                      // 「？」画像 - ⚠️コメントアウト：キャッシュバスターと誤判定するため
  'question',                  // 「？」関連画像
  'unknown',                   // 不明画像
  'default',                   // デフォルト画像
  'broken',                    // 壊れた画像
  'error',                     // エラー画像
  'missing',                   // 見つからない画像
];

// 🔍 画像が非表示対象かどうかを判定（本来の仕様）
function shouldHideImage(imgElement) {
  if (!imgElement || !imgElement.src) {
    console.log(`🙈 画像にsrcがありません`);
    return true; // src が無い場合は非表示
  }
  
  const src = imgElement.src;
  const alt = imgElement.alt || '';
  
  console.log(`🔍 画像判定中: src="${src}", alt="${alt}"`);
  
  // 🎨 メタタグを持つ画像は常に表示（意図したイラスト）
  if (imgElement.hasAttribute('data-meta-tag')) {
    console.log(`✅ メタタグ付き画像は表示: ${src}`);
    return false;
  }
  
  // 🎯 詳細ボタンがあるスロットの button.png は常に表示
  const slotContainer = imgElement.closest('.slot-container, .subslot-container');
  if (slotContainer) {
    const hasSubslotToggle = slotContainer.querySelector('[data-subslot-toggle]');
    if (hasSubslotToggle && src.includes('button.png')) {
      console.log(`✅ 詳細ボタン付きスロットの指アイコンは表示: ${src}`);
      return false;
    }
  }
  
  // 🚫 プレースホルダー画像の場合は非表示
  for (const pattern of HIDDEN_IMAGE_PATTERNS) {
    if (src.includes(pattern)) {
      console.log(`❌ プレースホルダー画像のため非表示: ${src} (pattern: ${pattern})`);
      return true;
    }
  }
  
  // 🚫 画像読み込みエラーの場合は非表示
  if (imgElement.complete && imgElement.naturalWidth === 0) {
    console.log(`🙈 画像読み込みエラーのため非表示: ${src}`);
    return true;
  }
  
  // 🚫 画像読み込み未完了の場合は一時的に非表示
  if (!imgElement.complete) {
    console.log(`⏳ 画像読み込み未完了のため一時非表示: ${src}`);
    return true;
  }
  
  // ✅ 上記に該当しない場合は表示（意図したイラストとして扱う）
  console.log(`✅ 有効な画像として表示: ${src}`);
  return false;
}

// 🎨 画像スロットに自動非表示クラスを適用
function applyAutoHideToImage(imgElement) {
  if (!imgElement) return;
  
  const shouldHide = shouldHideImage(imgElement);
  
  if (shouldHide) {
    imgElement.classList.add('auto-hidden-image');
    console.log(`🙈 画像を自動非表示に設定: ${imgElement.alt || imgElement.src}`);
  } else {
    imgElement.classList.remove('auto-hidden-image');
    console.log(`👁 画像を表示に設定: ${imgElement.alt || imgElement.src}`);
  }
}

// 🎯 詳細ボタンがあるスロットにbutton.pngを自動設定
function setButtonImageForDetailSlots() {
  console.log("🎯 詳細ボタン付きスロットにbutton.png自動設定を開始...");
  
  // 詳細ボタンがあるスロットコンテナを全て取得
  const slotsWithToggle = document.querySelectorAll('.slot-container:has([data-subslot-toggle])');
  
  slotsWithToggle.forEach((slotContainer, index) => {
    const imgElement = slotContainer.querySelector('.slot-image');
    const toggleButton = slotContainer.querySelector('[data-subslot-toggle]');
    
    if (imgElement && toggleButton) {
      const currentSrc = imgElement.src;
      
      // プレースホルダー画像や無効な画像の場合のみbutton.pngに変更
      const shouldReplaceImage = HIDDEN_IMAGE_PATTERNS.some(pattern => currentSrc.includes(pattern)) ||
                                imgElement.alt.startsWith('image for') ||
                                (imgElement.complete && imgElement.naturalWidth === 0);
      
      if (shouldReplaceImage) {
        const buttonImageSrc = 'slot_images/common/button.png';
        imgElement.src = buttonImageSrc;
        imgElement.alt = 'Click to expand details';
        console.log(`✅ スロット${index + 1}にbutton.pngを設定: ${slotContainer.id}`);
      } else if (currentSrc.includes('button.png')) {
        console.log(`👁 スロット${index + 1}は既にbutton.pngが設定済み: ${slotContainer.id}`);
      } else {
        console.log(`🔍 スロット${index + 1}には別の有効な画像が設定済み: ${currentSrc}`);
      }
    }
  });
  
  console.log("✅ 詳細ボタン付きスロットのbutton.png自動設定が完了しました");
}

// 🔄 全画像スロットの自動非表示判定を実行
function processAllImageSlots() {
  console.log("🔄 画像スロット自動非表示処理を開始...");
  
  const allImages = document.querySelectorAll('.slot-image');
  console.log(`📊 検出された画像スロット: ${allImages.length}個`);
  
  allImages.forEach((img, index) => {
    console.log(`🔍 画像${index + 1}を処理中:`);
    console.log(`  - src: ${img.src}`);
    console.log(`  - alt: ${img.alt}`);
    console.log(`  - complete: ${img.complete}`);
    console.log(`  - naturalWidth: ${img.naturalWidth}`);
    console.log(`  - naturalHeight: ${img.naturalHeight}`);
    
    // 画像の読み込み完了を待ってから判定
    if (img.complete) {
      applyAutoHideToImage(img);
    } else {
      console.log(`⏳ 画像${index + 1}は読み込み中...`);
      // 画像読み込み完了時に判定
      img.addEventListener('load', () => {
        console.log(`✅ 画像${index + 1}読み込み完了`);
        applyAutoHideToImage(img);
      });
      
      // エラー時も判定
      img.addEventListener('error', () => {
        console.log(`❌ 画像${index + 1}読み込みエラー`);
        applyAutoHideToImage(img);
      });
    }
  });
  
  console.log("✅ 画像スロット自動非表示処理が完了しました");
}

// 🔄 統合処理：詳細ボタン用画像設定 + 自動非表示処理
function processAllImagesWithButtonAutoSet() {
  console.log("🔄 詳細ボタン用画像設定 + 自動非表示処理を開始...");
  
  // まず詳細ボタン付きスロットにbutton.pngを設定
  setButtonImageForDetailSlots();
  
  // その後、自動非表示処理を実行
  setTimeout(() => {
    processAllImageSlots();
  }, 100); // 画像設定の反映を待つ
  
  console.log("✅ 統合処理が完了しました");
}

// 🔄 データ更新時の画像再判定
function reprocessImagesAfterDataUpdate() {
  console.log("🔄 データ更新後の画像再判定を実行...");
  
  // 少し遅延させてDOM更新完了を待つ
  setTimeout(() => {
    processAllImageSlots();
  }, 100);
}

// 🔄 ランダマイズ後の画像再判定
function reprocessImagesAfterRandomize() {
  console.log("🔄 ランダマイズ後の画像再判定を実行...");
  
  // ランダマイズ処理完了後に再判定
  setTimeout(() => {
    processAllImageSlots();
  }, 200);
}

// 🔹 グローバル関数としてエクスポート
window.processAllImageSlots = processAllImageSlots;
window.reprocessImagesAfterDataUpdate = reprocessImagesAfterDataUpdate;
window.reprocessImagesAfterRandomize = reprocessImagesAfterRandomize;
window.setButtonImageForDetailSlots = setButtonImageForDetailSlots;
window.processAllImagesWithButtonAutoSet = processAllImagesWithButtonAutoSet;
window.pauseImageObserver = pauseImageObserver;
window.resumeImageObserver = resumeImageObserver;

// 🔹 デバッグ用手動実行関数
window.debugImageHiding = function() {
  console.log("🔧 デバッグ: 手動で画像非表示処理を実行");
  processAllImageSlots();
};

window.showAllImageInfo = function() {
  console.log("🔍 全画像要素の情報を表示:");
  const allImages = document.querySelectorAll('.slot-image');
  allImages.forEach((img, index) => {
    console.log(`画像${index + 1}:`);
    console.log(`  - ID: ${img.closest('.slot-container')?.id || 'unknown'}`);
    console.log(`  - src: ${img.src}`);
    console.log(`  - alt: ${img.alt}`);
    console.log(`  - complete: ${img.complete}`);
    console.log(`  - naturalWidth: ${img.naturalWidth}`);
    console.log(`  - naturalHeight: ${img.naturalHeight}`);
    console.log(`  - classList: ${Array.from(img.classList).join(', ')}`);
    console.log(`  - style.display: ${img.style.display}`);
    console.log(`  - 詳細ボタン有無: ${img.closest('.slot-container')?.querySelector('[data-subslot-toggle]') ? 'あり' : 'なし'}`);
  });
};

// 🔄 ページ読み込み時の自動実行
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔄 画像自動非表示システムを初期化中...");
  
  // insert_test_data_clean.jsの処理完了を待ってから実行
  setTimeout(() => {
    console.log("🔄 insert_test_data_clean.js処理完了後の画像処理を実行...");
    processAllImagesWithButtonAutoSet();
  }, 800); // より長い遅延でinsert_test_data_clean.jsの完了を確実に待つ
  
  // データの変更を監視して画像を再判定
  const observer = new MutationObserver(function(mutations) {
    let shouldReprocess = false;
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || 
          (mutation.type === 'attributes' && mutation.attributeName === 'src')) {
        shouldReprocess = true;
      }
    });
    
    if (shouldReprocess) {
      setTimeout(() => {
        processAllImageSlots();
      }, 100);
    }
  });
  
  // 画像要素の変更を監視
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'alt']
  });
});

console.log("✅ image_auto_hide_fixed.js が読み込まれました");
