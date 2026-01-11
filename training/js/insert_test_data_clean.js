// insert_test_data.js をベースにした動的記載エリアから静的DOM同期用スクリプト
console.log("🔵 insert_test_data_clean.js 読み込み開始");
// 
// ⚠️⚠️⚠️【重要警告】⚠️⚠️⚠️
// 動的記載エリア(dynamic-slot-area)は絶対に変更禁止！
// - DOM構造の変更厳禁
// - 位置の移動厳禁  
// - ラッパーへの移動厳禁
// - 読み取り専用でのみ使用可能
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️

// 🌐 軽量版t()関数 - 現在の言語に応じてテキストを返す（統合版）
function t(key) {
  const lang = localStorage.getItem('rephrase_language') || 'ja';
  const dict = {
    ja: {
      'btn-english-off': '英語<br>OFF',
      'btn-english-on': '英語<br>ON',
      'btn-hide-all': '🙈 英語全OFF',
      'btn-show-all': '👁️ 英語全ON'
    },
    en: {
      'btn-english-off': 'EN<br>OFF',
      'btn-english-on': 'EN<br>ON',
      'btn-hide-all': '🙈 Hide All English',
      'btn-show-all': '👁️ Show All English'
    }
  };
  return dict[lang]?.[key] || key;
}

// 🌐 言語に応じた英語OFFボタンテキストを取得
function getEnglishOffButtonText() {
  return t('btn-english-off');
}

// 🌐 言語に応じた英語ONボタンテキストを取得
function getEnglishOnButtonText() {
  return t('btn-english-on');
}

// 🌐 関数をグローバルに公開
window.getEnglishOffButtonText = getEnglishOffButtonText;
window.getEnglishOnButtonText = getEnglishOnButtonText;

// 🎯 データ挿入時のスムーズレンダリング制御を有効化
let isDataInsertionInProgress = false;

/**
 * 🎯 データ挿入開始：視覚的ちらつき制御を開始
 */
function startSmoothDataInsertion() {
  console.log('🎯 スムーズデータ挿入開始');
  isDataInsertionInProgress = true;
  
  // SmoothRenderControllerが利用可能な場合のみ使用
  if (window.smoothRenderController && typeof window.smoothRenderController.startBatchUpdate === 'function') {
    window.smoothRenderController.startBatchUpdate();
  } else {
    console.warn('⚠️ SmoothRenderController未利用可能 - 基本的な非表示制御を実行');
    // フォールバック：基本的な非表示制御
    const mainContainer = document.querySelector('.slot-wrapper');
    if (mainContainer) {
      mainContainer.style.visibility = 'hidden';
    }
  }
}

/**
 * 🎯 データ挿入完了：視覚的ちらつき制御を終了
 */
function completeSmoothDataInsertion() {
  console.log('🎯 スムーズデータ挿入完了');
  isDataInsertionInProgress = false;
  
  // 遅延して表示復元（DOM更新の完了を確実に待つ）
  setTimeout(() => {
    if (window.smoothRenderController && typeof window.smoothRenderController.completeBatchUpdate === 'function') {
      window.smoothRenderController.completeBatchUpdate();
    } else {
      console.warn('⚠️ SmoothRenderController未利用可能 - 基本的な表示復元を実行');
      // フォールバック：基本的な表示復元
      const mainContainer = document.querySelector('.slot-wrapper');
      if (mainContainer) {
        mainContainer.style.visibility = 'visible';
      }
    }
  }, 100); // 100ms後に表示復元
}

// 🎯 メタレベル制御：サブスロット表示設定管理（localStorage版）
function setSubslotVisibility(slotType, isVisible) {
  const storageKey = `subslot_visibility_${slotType}`;
  localStorage.setItem(storageKey, JSON.stringify(isVisible));
  console.log(`🎯 サブスロット表示設定保存: ${slotType} = ${isVisible}`);
}

function getSubslotVisibility(slotType) {
  const storageKey = `subslot_visibility_${slotType}`;
  const stored = localStorage.getItem(storageKey);
  return stored !== null ? JSON.parse(stored) : true; // デフォルトは表示
}

function applySubslotVisibilityControl(slotElement, slotType) {
  // localStorageから詳細な表示状態を取得
  try {
    const saved = localStorage.getItem('rephrase_subslot_visibility_state');
    console.log(`🔍 DEBUG: localStorage内容 =`, saved);
    
    if (!saved) {
      console.log(`🔍 DEBUG: localStorageに設定がありません - デフォルト表示`);
      return; // 設定がない場合はデフォルト表示
    }
    
    const subslotVisibilityState = JSON.parse(saved);
    const slotId = slotElement.id;
    
    console.log(`🔍 DEBUG: 対象スロットID = ${slotId}`);
    console.log(`🔍 DEBUG: スロット設定 =`, subslotVisibilityState[slotId]);
    
    // 該当スロットの設定を確認（text項目がfalseの場合に透明化）
    if (subslotVisibilityState[slotId] && subslotVisibilityState[slotId]['text'] === false) {
      const phraseElement = slotElement.querySelector('.slot-phrase');
      if (phraseElement) {
        phraseElement.style.opacity = '0';
        console.log(`🎯 非表示制御適用: ${slotId} の phrase要素を透明化（text=false）`);
      }
    } else {
      console.log(`🔍 DEBUG: ${slotId} は表示設定または設定なし`);
    }
  } catch (error) {
    console.error("❌ サブスロット表示制御の適用に失敗:", error);
  }
}

// 疑問詞エリアを初期化して確実に空状態にする関数
function initializeQuestionWordArea() {
  const topDiv = document.getElementById("display-top-question-word");
  if (topDiv) {
    topDiv.textContent = "";
    topDiv.innerHTML = ""; // HTMLも完全にクリア
    topDiv.classList.add("empty-content"); // 強制的に空クラスを追加
    console.log("🧹 疑問詞エリアを初期化しました");
  }
  
  // 動的エリアの疑問詞も削除
  const dynamicQuestionDiv = document.getElementById("dynamic-question-word");
  if (dynamicQuestionDiv) {
    dynamicQuestionDiv.remove();
    console.log("🧹 動的エリアの疑問詞を削除しました");
  }
}

// 動的エリアからデータを抽出する関数
// ⚠️【編集禁止】動的記載エリア(dynamic-slot-area)は読み取り専用です
function extractDataFromDynamicArea() {
  // ⚠️【編集禁止】この関数は動的記載エリアからの読み取りのみ行います
  const dynamicArea = document.getElementById("dynamic-slot-area");
  if (!dynamicArea) {
    console.warn("⚠ dynamic-slot-area が見つかりません");
    return [];
  }

  const slotElements = dynamicArea.querySelectorAll(".slot, .subslot");
  const data = [];

  slotElements.forEach(el => {
    const slotId = el.id || el.getAttribute("id");
    if (!slotId) return;

    const phraseEl = el.querySelector(".slot-phrase, .subslot-element");
    const textEl = el.querySelector(".slot-text, .subslot-text");

    const phraseText = phraseEl ? phraseEl.textContent : "";
    const slotText = textEl ? textEl.textContent : "";

    data.push({
      Slot: slotId,
      SlotPhrase: phraseText,
      SlotText: slotText
    });
  });

  return data;
}

// スロットIDを正規化する関数
function normalizeSlotId(slotId) {
  return slotId.replace(/-sub-sub/g, '-sub');
}

// JSONデータをorder順に並べ替える関数（順序制御の基本関数）
function sortJsonDataByOrder(jsonData) {
  if (!jsonData || !Array.isArray(jsonData)) return jsonData;
  
  return [...jsonData].sort((a, b) => {
    // orderが数値ではない場合のための対策
    const orderA = typeof a.order === 'number' ? a.order : parseInt(a.order) || 0;
    const orderB = typeof b.order === 'number' ? b.order : parseInt(b.order) || 0;
    return orderA - orderB;
  });
}

// DOM要素をorder属性に基づいて並べ替える関数（注意：DOM構造変更を伴うため慎重に使用）
function reorderDomElements(container, selector, getOrderFunc) {
  if (!container) return;
  
  const elements = container.querySelectorAll(selector);
  if (elements.length <= 1) return; // 要素が1つ以下なら何もしない
  
  console.log(`🔢 ${container.id}内の${selector}要素を並べ替えます (${elements.length}個)`);
  
  // 要素とその順序値の配列を作成
  const elementsWithOrder = Array.from(elements).map(el => {
    const order = getOrderFunc(el);
    return { el, order };
  });
  
  // 順序でソート
  elementsWithOrder.sort((a, b) => a.order - b.order);
  
  // 親要素を取得
  const parent = elements[0].parentNode;
  
  // 順番に再配置
  elementsWithOrder.forEach(item => {
    parent.appendChild(item.el); // 末尾に移動（順序通りに並ぶ）
  });
  
  console.log(`✅ ${container.id}内の要素を順序通りに再配置しました`);
}

// 特定のスロットコンテナ内のサブスロットを順序付けする関数
function reorderSubslots(parentSlotId, jsonData) {
  const container = document.getElementById(parentSlotId);
  if (!container) {
    console.warn(`⚠ 並べ替え対象のコンテナが見つかりません: ${parentSlotId}`);
    return;
  }
  
  // このスロットに関連するサブスロットのデータを取得
  const parentId = parentSlotId.replace('slot-', '');
  const subslotData = jsonData.filter(item => 
    item.Slot.toLowerCase() === parentId && 
    item.SubslotID && 
    item.SubslotID !== ""
  );
  
  if (subslotData.length <= 1) {
    console.log(`ℹ️ ${parentSlotId}には並べ替えが必要なサブスロットが1つ以下です`);
    return;
  }
  
  console.log(`🔢 ${parentSlotId}のサブスロットを並べ替えます (${subslotData.length}個)`);
  
  // SubSlotIDからorderを取得するマップを作成
  const orderMap = new Map();
  subslotData.forEach(item => {
    orderMap.set(item.SubslotID.toLowerCase(), item.order || 0);
  });
  
  // サブスロット要素を取得して順序付け
  const subslotSelector = '[id^="slot-' + parentId.toLowerCase() + '-"]';
  const subslots = container.querySelectorAll(subslotSelector);
  
  if (subslots.length === 0) {
    console.warn(`⚠ ${parentId}内にサブスロット要素が見つかりません`);
    return;
  }
  
  // サブスロット要素とその順序値の配列を作成
  const subslotElements = Array.from(subslots).map(el => {
    // IDからサブスロットIDを抽出（例：slot-m1-sub-o1 → sub-o1）
    const subslotId = el.id.replace(`slot-${parentId.toLowerCase()}-`, '');
    const order = orderMap.get(subslotId) || 0;
    return { el, order };
  });
  
  // 順序でソート
  subslotElements.sort((a, b) => a.order - b.order);
  
  // 親要素に順序通りに追加し直す
  subslotElements.forEach(item => {
    container.appendChild(item.el);
  });
  
  console.log(`✅ ${parentId}内のサブスロットを順序通りに再配置しました`);
}

// すべての上位スロットを順序付けする関数 - CSSのorder属性を使用する安全版
function applyOrderToAllSlots(jsonData) {
  if (!jsonData || !Array.isArray(jsonData)) {
    console.warn("⚠ 順序付けに使用するデータが無効です");
    return;
  }
  
  console.log("🔢 上位スロットの表示順を適用開始");
  
  // 上位スロットのIDとorderマッピングを作成
  const upperSlots = jsonData.filter(item => item.SubslotID === "" && item.PhraseType === "word");
  const slotOrderMap = new Map();
  
  upperSlots.forEach(item => {
    // order値を取得（display_order、Slot_display_orderまたはorderフィールド）
    const orderValue = item.display_order || item.Slot_display_order || item.order || 0;
    slotOrderMap.set(item.Slot.toLowerCase(), orderValue);
  });
  
  // マップのエントリを確認
  console.log("📊 スロット順序マップ:", [...slotOrderMap.entries()]);
  
  // 順序をCSSのorder属性として適用（DOM構造自体は変更しない安全な方法）
  slotOrderMap.forEach((orderValue, slotId) => {
    const slotElement = document.getElementById(`slot-${slotId}`);
    if (slotElement) {
      // CSSのorder属性を設定
      slotElement.style.order = orderValue;
      console.log(`✅ スロット "${slotId}" に表示順 ${orderValue} を適用 (CSS order)`);
    }
  });
  
  // 親コンテナにflexboxレイアウトを適用（モバイル対応考慮版）
  const slotWrapper = document.querySelector('.slot-wrapper');
  if (slotWrapper) {
    // モバイルデバイスの場合は flex-direction を強制しない
    const isMobileDevice = document.documentElement.classList.contains('mobile-device');
    
    if (isMobileDevice) {
      // モバイルでもCSS order属性を確実に機能させるためflex設定を明示
      slotWrapper.style.display = 'flex';
      slotWrapper.style.flexDirection = 'row'; // 横並び + order属性で語順制御
      slotWrapper.style.flexWrap = 'nowrap'; // 改行しない
      console.log("📱 モバイルデバイス: 横並び + CSS order属性で語順制御");
    } else {
      // PC版でも横並び（英語は横書き言語）
      slotWrapper.style.display = 'flex';
      slotWrapper.style.flexDirection = 'row';
      slotWrapper.style.flexWrap = 'wrap';
      console.log("💻 PCデバイス: 横並びflex-directionを適用");
    }
  }
  
  console.log("✅ 上位スロットの表示順適用完了");
}

// 動的エリアから静的DOMへの同期関数
function syncDynamicToStatic() {
  console.log("🔄 syncDynamicToStatic 実行開始");
  console.log("🔍 window.loadedJsonDataの確認:", window.loadedJsonData ? `${window.loadedJsonData.length}件` : '未設定');
  if (window.loadedJsonData && window.loadedJsonData.length > 0) {
    console.log("🔍 loadedJsonDataのM1スロット:", window.loadedJsonData.filter(item => item.Slot === 'M1' && !item.SubslotID));
  }
  // 🔼 DisplayAtTop 対応（分離疑問詞表示）
  if (window.loadedJsonData) {
    const topDisplayItem = window.loadedJsonData.find(d => d.DisplayAtTop);
    if (topDisplayItem && topDisplayItem.DisplayText) {
      const topDiv = document.getElementById("display-top-question-word");
      if (topDiv) {
        // 🔤 分離疑問詞は常に文頭なので必ず大文字化
        const capitalizedText = topDisplayItem.DisplayText.charAt(0).toUpperCase() + topDisplayItem.DisplayText.slice(1);
        topDiv.textContent = capitalizedText;
        topDiv.classList.remove("empty-content"); // 空クラスを削除
        console.log("✅ DisplayAtTop 表示（大文字化）: " + capitalizedText);
      } else {
        console.warn("⚠ display-top-question-word が見つかりません");
      }
    } else {
      // DisplayAtTopがない場合はクリア
      const topDiv = document.getElementById("display-top-question-word");
      if (topDiv) {
        topDiv.textContent = "";
        topDiv.innerHTML = ""; // HTMLも完全にクリア
        topDiv.classList.add("empty-content"); // 強制的に空クラスを追加
        console.log("🧹 DisplayAtTop 表示をクリア（syncDynamicToStatic）");
      }
    }
  }

  console.log("🧹 サブスロット初期化開始");
  // 🧹 DisplayAtTop対象となりうるサブスロットを明示的にクリア
  const displayAtTopItem = window.loadedJsonData?.find(d => d.DisplayAtTop);
  if (displayAtTopItem && displayAtTopItem.DisplayText) {
    console.log(`🧹 DisplayAtTop対象のサブスロットを検索: "${displayAtTopItem.DisplayText}"`);
    
    // 全てのサブスロットから DisplayAtTop.DisplayText と一致するものを探してクリア
    const allSubslots = document.querySelectorAll('[id*="-sub-"]');
    allSubslots.forEach(subslot => {
      const phraseEl = subslot.querySelector('.slot-phrase');
      if (phraseEl && phraseEl.textContent.trim() === displayAtTopItem.DisplayText.trim()) {
        phraseEl.textContent = "";
        console.log(`🧹 DisplayAtTop対象サブスロットをクリア: ${subslot.id}`);
      }
    });
  }
  
  // 🧹 slot-*-sub の中にあるサブスロット phrase/text を初期化
  const allSubContainers = document.querySelectorAll('[id^="slot-"][id$="-sub"]');
  console.log(`📊 初期化対象サブコンテナ: ${allSubContainers.length}件`);
  allSubContainers.forEach(container => {
    const phraseBlocks = container.querySelectorAll('.slot-phrase');
    const textBlocks = container.querySelectorAll('.slot-text');
    console.log(`🧹 "${container.id}"内 - phraseBlocks: ${phraseBlocks.length}, textBlocks: ${textBlocks.length}`);
    phraseBlocks.forEach(p => p.textContent = "");
    textBlocks.forEach(t => t.textContent = "");
  });

  console.log("🧹 全サブスロット初期化開始");
  // 🧹 全サブスロット初期化（静的DOM）
  const allSubslots = document.querySelectorAll('[id*="-sub-sub-"]');
  console.log(`📊 初期化対象サブスロット: ${allSubslots.length}件`);
  allSubslots.forEach(slot => {
    const phrase = slot.querySelector('.slot-phrase');
    const text = slot.querySelector('.slot-text');
    console.log(`🧹 "${slot.id}"内 - phrase: ${!!phrase}, text: ${!!text}`);
    if (phrase) phrase.textContent = "";
    if (text) text.textContent = "";
  });

  console.log("🔄 動的エリアからデータ抽出開始");
  const data = extractDataFromDynamicArea();
  console.log(`📊 動的エリアから抽出したデータ: ${data.length}件`);
  if (data.length === 0) {
    console.log("🔄 動的エリアからのデータ抽出失敗時のDisplayAtTop処理開始");
    // 🔼 分離疑問詞 (DisplayAtTop) 書き込み処理
    const topDisplay = window.loadedJsonData?.find(d => d.DisplayAtTop);
    if (topDisplay && topDisplay.DisplayText) {
      const topDiv = document.getElementById("display-top-question-word");
      if (topDiv) {
        // 🔤 分離疑問詞は常に文頭なので必ず大文字化
        const capitalizedText = topDisplay.DisplayText.charAt(0).toUpperCase() + topDisplay.DisplayText.slice(1);
        topDiv.textContent = capitalizedText;
        topDiv.classList.remove("empty-content"); // 空クラスを削除
        console.log(`🔼 DisplayAtTop 表示（大文字化）: ${capitalizedText}`);
      } else {
        console.warn("⚠ display-top-question-word が見つかりません");
      }
    } else {
      // DisplayAtTopがない場合はクリア
      const topDiv = document.getElementById("display-top-question-word");
      if (topDiv) {
        topDiv.textContent = "";
        topDiv.innerHTML = ""; // HTMLも完全にクリア
        topDiv.classList.add("empty-content"); // 強制的に空クラスを追加
        console.log("🧹 DisplayAtTop 表示をクリア（動的エリア抽出失敗時）");
      }
    }
    console.warn("⚠ 動的エリアからデータ抽出できませんでした");
    return;
  }

  console.log("🔄 抽出データの処理開始");
  
  // 🎯 スムーズレンダリング制御開始
  startSmoothDataInsertion();
  
  data.forEach(item => {
    console.log(`🔄 処理項目: ${JSON.stringify(item)}`);
    if (item.SubslotID === "" && item.PhraseType === "word") {
      // 上位スロットへの書き込み
      console.log(`👑 上位スロット処理: ${item.Slot}`);
      console.log("検索ID(normalized):", normalizeSlotId(item.Slot));
      const container = document.getElementById("slot-" + item.Slot.toLowerCase());
      if (container) {
        console.log("container found for ID:", container.id);
        console.log("container HTML:", container.outerHTML.substring(0, 150) + "...");
        const phraseDiv = container.querySelector(".slot-phrase");
        console.log("phraseDiv:", phraseDiv ? phraseDiv.outerHTML : "未検出");
        const textDiv = container.querySelector(".slot-text");
        console.log("textDiv:", textDiv ? textDiv.outerHTML : "未検出");
        
        if (phraseDiv) {
          // � デバッグ：ボタン機能を一時的に無効化
          console.log(`🔍 DEBUG [insertTestData]: phraseDiv.parentElement.className = "${phraseDiv.parentElement.className}"`);console.log(`🔍 DEBUG [insertTestData]: phraseDiv.style.cssText = "${phraseDiv.style.cssText}"`);console.log(`🔍 DEBUG [insertTestData]: item.Slot = "${item.Slot}", SlotPhrase = "${item.SlotPhrase}"`);          // 🔍 localStorageで英語テキスト表示設定をチェック
          const slotKey = item.Slot.toLowerCase();
          let isTextVisible = true; // デフォルトは表示
          
          if (window.visibilityState && window.visibilityState[slotKey]) {
            isTextVisible = window.visibilityState[slotKey]['text'] !== false;
          }
          console.log(`🔍 [insertTestData] ${slotKey}: isTextVisible=${isTextVisible}, slotKey状態=`, window.visibilityState?.[slotKey]);
          
          // 🆕 親スロット用の個別トグルボタンを作成（初回のみ）
          let phraseRow = null; // phraseDiv.parentElement.querySelector('.upper-slot-phrase-row');
          if (!phraseRow) {
            // phraseRowコンテナを作成
            phraseRow = document.createElement('div');
            phraseRow.className = 'upper-slot-phrase-row';
            phraseRow.style.cssText = `
              grid-row: 4;
              grid-column: 1;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              gap: 4px;
              width: 100%;
              height: 100%;
            `;
            
            // 🔹 英語テキストが空の場合（サブスロットのみの親）はボタンを作成しない
            const hasEnglishText = item.SlotPhrase && item.SlotPhrase.trim() !== '';
            
            // トグルボタンを作成（英語テキストがある場合のみ）
            let toggleButton = null;
            if (hasEnglishText) {
              toggleButton = document.createElement('button');
              toggleButton.className = 'upper-slot-toggle-btn';
              toggleButton.dataset.slotId = container.id;
              toggleButton.innerHTML = getEnglishOffButtonText();
              toggleButton.title = '英語表示切替';
              toggleButton.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 4px;
                font-size: 9px;
                cursor: pointer;
                line-height: 1.1;
                min-width: 32px;
                text-align: center;
              `;
            }
            
            // 新しいphraseElementを作成（サブスロットと同じ方式）
            const newPhraseElement = document.createElement('div');
            newPhraseElement.className = 'slot-phrase';
            newPhraseElement.textContent = item.SlotPhrase || "";
            
            // opacity/visibilityを設定
            if (!isTextVisible) {
              newPhraseElement.style.opacity = '0';
              newPhraseElement.style.visibility = 'hidden';
            } else {
              newPhraseElement.style.opacity = '1';
              newPhraseElement.style.visibility = 'visible';
            }
            
            // ボタンクリックでトグル（ボタンがある場合のみ）
            if (toggleButton) {
              toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                
                console.log(`🔄 親スロット個別トグルボタンクリック: ${container.id}`);
                
                // 毎回phraseRowから.slot-phraseを取得（ランダマイズ対応）
                const currentPhraseRow = container.querySelector('.upper-slot-phrase-row');
                const currentPhraseElement = currentPhraseRow?.querySelector('.slot-phrase');
                
                if (!currentPhraseElement) {
                  console.error(`❌ .slot-phrase要素が見つかりません: ${container.id}`);
                  return;
                }
                
                // 現在の状態を取得
                if (!window.visibilityState) window.visibilityState = {};
                if (!window.visibilityState[slotKey]) {
                  window.visibilityState[slotKey] = { text: true, auxtext: true };
                }
                
                // 状態を反転
                const currentVisible = window.visibilityState[slotKey]['text'] !== false;
                window.visibilityState[slotKey]['text'] = !currentVisible;
                
                // UIを更新
                if (!currentVisible) {
                  // 表示する
                  currentPhraseElement.style.opacity = '1';
                  currentPhraseElement.style.visibility = 'visible';
                  toggleButton.innerHTML = getEnglishOffButtonText();
                  toggleButton.style.backgroundColor = '#4CAF50';
                  toggleButton.title = '英語を非表示';
                  console.log(`✅ ${container.id}: 英語を表示`);
                } else {
                  // 非表示にする
                  currentPhraseElement.style.opacity = '0';
                  currentPhraseElement.style.visibility = 'hidden';
                  toggleButton.innerHTML = getEnglishOnButtonText();
                  toggleButton.style.backgroundColor = '#757575';
                  toggleButton.title = '英語を表示';
                  console.log(`🙈 ${container.id}: 英語を非表示`);
                  
                  //  イラストヒントトーストを表示
                  if (typeof window.showIllustrationHintToast === 'function') {
                    window.showIllustrationHintToast(toggleButton);
                  }
                }
              });
            }
            
            // phraseRowに新規DOMを追加
            if (toggleButton) phraseRow.appendChild(toggleButton);
            phraseRow.appendChild(newPhraseElement);
            
            // 古いphraseDivを削除してphraseRowを挿入
            phraseDiv.replaceWith(phraseRow);
            
            console.log(`🆕 親スロット個別ボタン追加（新規DOM作成）: ${container.id}`);
          } else {
            // phraseRowが既に存在する場合、内容を更新
            const existingPhraseElement = phraseRow.querySelector('.slot-phrase');
            if (existingPhraseElement) {
              existingPhraseElement.textContent = item.SlotPhrase || "";
              
              // opacity/visibilityを設定
              if (!isTextVisible) {
                existingPhraseElement.style.opacity = '0';
                existingPhraseElement.style.visibility = 'hidden';
              } else {
                existingPhraseElement.style.opacity = '1';
                existingPhraseElement.style.visibility = 'visible';
              }
            }
            
            // 🔹 英語テキストが空の場合、ボタンを非表示にする
            const hasEnglishText = item.SlotPhrase && item.SlotPhrase.trim() !== '';
            console.log(`🔍 [既存phraseRow更新] ${container.id}: SlotPhrase="${item.SlotPhrase}", hasEnglishText=${hasEnglishText}`);
            const toggleButton = phraseRow.querySelector('.upper-slot-toggle-btn');
            if (toggleButton) {
              if (!hasEnglishText) {
                // 英語テキストがない場合、ボタンを非表示
                toggleButton.style.display = 'none';
                console.log(`🙈 親スロットOFFボタンを非表示: ${container.id} (英語テキストなし)`);
              } else {
                // 英語テキストがある場合、ボタンを表示して状態を同期
                toggleButton.style.display = '';
                console.log(`👁️ 親スロットOFFボタンを表示: ${container.id} (英語テキストあり)`);
                if (!isTextVisible) {
                  toggleButton.innerHTML = getEnglishOnButtonText();
                  toggleButton.style.backgroundColor = '#757575';
                  toggleButton.title = '英語を表示';
                } else {
                  toggleButton.innerHTML = getEnglishOffButtonText();
                  toggleButton.style.backgroundColor = '#4CAF50';
                  toggleButton.title = '英語を非表示';
                }
              }
            }
            console.log(`✅ phrase書き込み成功: ${item.Slot} (parent) | 値: "${item.SlotPhrase}"`);
          }
        } else {
          console.warn(`❌ 上位phraseDiv取得失敗: ${item.Slot}`);
        }
        
        if (textDiv) {
          const slotKey = item.Slot.toLowerCase();
          let isAuxtextVisible = true;
          if (window.visibilityState && window.visibilityState[slotKey]) {
            isAuxtextVisible = window.visibilityState[slotKey]['auxtext'] !== false;
          }
          console.log(`🔍 [insertTestData] ${slotKey} auxtext: isAuxtextVisible=${isAuxtextVisible}`);
          
          // 🆕 日本語補助テキスト用の個別トグルボタンを作成
          let textRow = textDiv.parentElement?.querySelector('.upper-slot-text-row');
          if (!textRow) {
            // textRowコンテナを作成
            textRow = document.createElement('div');
            textRow.className = 'upper-slot-text-row';
            textRow.style.cssText = `
              grid-row: 3;
              grid-column: 1;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              gap: 4px;
              width: 100%;
              height: 100%;
            `;
            
            // トグルボタンを作成
            const toggleButton = document.createElement('button');
            toggleButton.className = 'upper-slot-auxtext-toggle-btn';
            toggleButton.dataset.slotId = container.id;
            toggleButton.innerHTML = 'ヒント<br>OFF';
            toggleButton.title = '日本語補助表示切替';
            toggleButton.style.cssText = `
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 3px;
              padding: 2px 4px;
              font-size: 9px;
              cursor: pointer;
              line-height: 1.1;
              min-width: 32px;
              text-align: center;
            `;
            
            // 新しいtextElementを作成
            const newTextElement = document.createElement('div');
            newTextElement.className = 'slot-text';
            newTextElement.textContent = item.SlotText || "";
            
            // opacity/visibilityを設定
            if (!isAuxtextVisible) {
              newTextElement.style.opacity = '0';
              newTextElement.style.visibility = 'hidden';
            } else {
              newTextElement.style.opacity = '1';
              newTextElement.style.visibility = 'visible';
            }
            
            // ボタンクリックでトグル
            toggleButton.addEventListener('click', (e) => {
              e.stopPropagation();
              
              console.log(`🔄 親スロット日本語補助個別トグルボタンクリック: ${container.id}`);
              
              // 毎回textRowから.slot-textを取得（ランダマイズ対応）
              const currentTextRow = container.querySelector('.upper-slot-text-row');
              const currentTextElement = currentTextRow?.querySelector('.slot-text');
              
              if (!currentTextElement) {
                console.error(`❌ .slot-text要素が見つかりません: ${container.id}`);
                return;
              }
              
              // 現在の状態を取得
              if (!window.visibilityState) window.visibilityState = {};
              if (!window.visibilityState[slotKey]) {
                window.visibilityState[slotKey] = { text: true, auxtext: true };
              }
              
              // 状態を反転
              const currentVisible = window.visibilityState[slotKey]['auxtext'] !== false;
              window.visibilityState[slotKey]['auxtext'] = !currentVisible;
              
              // UIを更新
              if (!currentVisible) {
                // 表示する
                currentTextElement.style.opacity = '1';
                currentTextElement.style.visibility = 'visible';
                toggleButton.innerHTML = 'ヒント<br>OFF';
                toggleButton.style.backgroundColor = '#4CAF50';
                toggleButton.title = '日本語補助を非表示';
                console.log(`✅ ${container.id}: 日本語補助を表示`);
              } else {
                // 非表示にする
                currentTextElement.style.opacity = '0';
                currentTextElement.style.visibility = 'hidden';
                toggleButton.innerHTML = 'ヒント<br>ON';
                toggleButton.style.backgroundColor = '#757575';
                toggleButton.title = '日本語補助を表示';
                console.log(`🙈 ${container.id}: 日本語補助を非表示`);
              }
            });
            
            // textRowに新規DOMを追加
            textRow.appendChild(toggleButton);
            textRow.appendChild(newTextElement);
            
            // 古いtextDivを削除してtextRowを挿入
            textDiv.replaceWith(textRow);
            
            console.log(`🆕 親スロット日本語補助個別ボタン追加（新規DOM作成）: ${container.id}`);
          } else {
            // textRowが既に存在する場合、内容を更新
            const existingTextElement = textRow.querySelector('.slot-text');
            if (existingTextElement) {
              existingTextElement.textContent = item.SlotText || "";
              
              // opacity/visibilityを設定
              if (!isAuxtextVisible) {
                existingTextElement.style.opacity = '0';
                existingTextElement.style.visibility = 'hidden';
              } else {
                existingTextElement.style.opacity = '1';
                existingTextElement.style.visibility = 'visible';
              }
            }
            
            // ボタンの状態を同期
            const toggleButton = textRow.querySelector('.upper-slot-auxtext-toggle-btn');
            if (toggleButton) {
              if (!isAuxtextVisible) {
                toggleButton.innerHTML = 'ヒント<br>ON';
                toggleButton.style.backgroundColor = '#757575';
                toggleButton.title = '日本語補助を表示';
              } else {
                toggleButton.innerHTML = 'ヒント<br>OFF';
                toggleButton.style.backgroundColor = '#4CAF50';
                toggleButton.title = '日本語補助を非表示';
              }
            }
            console.log(`✅ text書き込み成功: ${item.Slot} (parent) | 値: "${item.SlotText}"`);
          }
          
          // textDiv内にあるslot-phraseを確認（注：textRowに変更後も継続）
          const nestedPhraseDiv = textRow?.querySelector(".slot-phrase");
          if (nestedPhraseDiv) {
            console.warn(`⚠️ textRow内にslot-phraseが入れ子になっています: ${item.Slot}`);
          }
        } else {
          console.warn(`❌ 上位textDiv取得失敗: ${item.Slot}`);
        }
      } else {
        console.warn(`❌ 上位スロットが見つかりません: slot-${item.Slot.toLowerCase()}`);
      }
      return;
    }
    
    // 元のサブスロット書き込み処理
    console.log("サブスロット検索ID(normalized):", normalizeSlotId(item.Slot));
    
    // 🔽 DisplayAtTop 対象の subslot 要素はスキップ
    if (window.loadedJsonData) {
      const topDisplayItem = window.loadedJsonData.find(d => d.DisplayAtTop);
      if (
        topDisplayItem &&
        topDisplayItem.DisplayText &&
        item.SubslotElement === topDisplayItem.DisplayText
      ) {
        console.log(`🚫 subslot "${item.SubslotElement}" は DisplayAtTop で表示済のためスキップ`);
        return;
      }
    }
    
    console.log("🔍 サブスロット要素検索:", normalizeSlotId(item.Slot));
    const slotElement = document.getElementById(normalizeSlotId(item.Slot));
    if (!slotElement) {
      console.log("サブスロット要素が見つかりません:", normalizeSlotId(item.Slot));
      console.warn(`⚠ スロットが見つかりません: ${item.Slot}`);
      return;
    }
    
    console.log("🔍 サブスロット要素発見:", slotElement.id, "| HTML:", slotElement.outerHTML.substring(0, 100) + "...");
    const phraseElement = slotElement.querySelector(".slot-phrase");
    console.log("サブスロット phraseElement:", phraseElement ? phraseElement.outerHTML : "未検出");
    const slotTextElement = slotElement.querySelector(".slot-text");
    console.log("サブスロット textElement:", slotTextElement ? slotTextElement.outerHTML : "未検出");

    // 📝 フレーズ要素への書き込み（上位スロットと同じ方式 - ラベル保護）
    if (phraseElement) {
      // 🔍 localStorageで英語テキスト表示設定をチェック（新システム統合）
      const parentSlotKey = item.Slot.split('-')[0].toLowerCase(); // "m1-sub-s" → "m1"
      let isTextVisible = true; // デフォルトは表示
      
      if (window.visibilityState && window.visibilityState[parentSlotKey]) {
        isTextVisible = window.visibilityState[parentSlotKey]['text'] !== false;
      }
      
      phraseElement.textContent = item.SlotPhrase || "";
      
      // 🎯 サブスロットの幅をテキスト長に応じて調整（複数画像と同じ方式）
      // サブスロットはIDに'-sub-'を含む（クラスはslot-container）
      if (item.SlotPhrase && slotElement.id && slotElement.id.includes('-sub-')) {
        const tempSpan = document.createElement('span');
        tempSpan.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;font:inherit;font-size:14px;font-weight:600;';
        tempSpan.textContent = item.SlotPhrase;
        document.body.appendChild(tempSpan);
        const textWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);
        
        // テキスト幅 + パディングで最小幅を設定（最小120px）
        const requiredWidth = Math.max(120, textWidth + 40);
        slotElement.style.width = requiredWidth + 'px';
        slotElement.style.minWidth = requiredWidth + 'px';
        console.log(`📏 サブスロット幅調整: ${item.Slot} → ${requiredWidth}px (テキスト: "${item.SlotPhrase}")`);
      }
      
      if (!isTextVisible) {
        // 非表示設定の場合、透明化
        phraseElement.style.opacity = '0';
        phraseElement.style.visibility = 'hidden';
        console.log(`🙈 サブスロット phrase非表示: ${item.Slot}`);
      } else {
        // 表示設定の場合、通常表示
        phraseElement.style.opacity = '1';
        phraseElement.style.visibility = 'visible';
        console.log(`✅ サブスロット phrase書き込み成功: ${item.Slot} | 値: "${item.SlotPhrase}"`);
      }
    } else {
      console.warn(`❌ サブスロット phrase要素取得失敗: ${item.Slot}`);
    }
    
    // 📝 テキスト要素への書き込み（上位スロットと同じ方式 - ラベル保護）
    if (slotTextElement) {
      // 🔍 localStorageで日本語補助テキスト表示設定をチェック（新システム統合）
      const parentSlotKey = item.Slot.split('-')[0].toLowerCase(); // "m1-sub-s" → "m1"
      let isAuxTextVisible = true; // デフォルトは表示
      
      if (window.visibilityState && window.visibilityState[parentSlotKey]) {
        isAuxTextVisible = window.visibilityState[parentSlotKey]['auxtext'] !== false;
      }
      
      // 設定に応じてテキストを書き込みまたは非表示
      slotTextElement.textContent = item.SlotText || "";
      if (isAuxTextVisible) {
        // 通常表示のスタイル確保
        slotTextElement.style.cssText = `
          display: block;
          color: #333;
          font-size: 14px;
        `;
        console.log(`✅ サブスロット text書き込み成功: ${item.Slot} | 値: "${item.SlotText}"`);
      } else {
        // 非表示スタイル（CSS上書き）
        slotTextElement.style.cssText = `
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
        `;
        console.log(`🙈 サブスロット text非表示: ${item.Slot}`);
      }
      
      // 上位スロットと同じ入れ子構造チェック
      const nestedPhraseDiv = slotTextElement.querySelector(".slot-phrase");
      if (nestedPhraseDiv) {
        console.warn(`⚠️ サブスロット slotTextElement内にslot-phraseが入れ子になっています: ${item.Slot}`);
        console.warn(`⚠️ この入れ子構造が原因で書き込みが上書きされている可能性があります`);
      }
    } else {
      console.warn(`❌ サブスロット text要素取得失敗: ${item.Slot}`);
    }
  });
  
  // 🎯 スムーズレンダリング制御完了
  completeSmoothDataInsertion();
  
  // 🔢 サブスロット順序修正：window.loadedJsonDataを使用して正しい順序で再書き込み
  console.log("🔢 サブスロット順序修正処理を実行...");
  if (window.loadedJsonData && typeof window.syncSubslotsWithCorrectOrder === 'function') {
    setTimeout(() => {
      window.syncSubslotsWithCorrectOrder(window.loadedJsonData);
      console.log("✅ サブスロット順序修正処理が完了しました");
    }, 50);
  } else {
    console.warn("⚠ window.loadedJsonData または syncSubslotsWithCorrectOrder関数が見つかりません");
  }

  // 🖼 画像処理：データ同期完了後に画像の自動非表示処理を実行
  console.log("🖼 syncDynamicToStatic完了後の画像処理を実行...");
  if (typeof window.processAllImagesWithCoordination === 'function') {
    setTimeout(() => {
      window.processAllImagesWithCoordination();
      console.log("✅ 画像自動非表示処理が完了しました");
    }, 100);
  } else {
    console.warn("⚠ processAllImagesWithCoordination関数が見つかりません");
  }

  // 🎯 サブスロット画像処理：サブスロットのテキスト挿入後に画像更新を実行
  console.log("🎯 サブスロット画像更新処理を実行...");
  if (typeof window.updateSubslotImages === 'function') {
    setTimeout(() => {
      // C1のサブスロットが展開されている場合のみ更新
      const c1SubContainer = document.getElementById('slot-c1-sub');
      if (c1SubContainer && window.getComputedStyle(c1SubContainer).display !== 'none') {
        window.updateSubslotImages('c1');
        console.log("✅ C1サブスロット画像更新が完了しました");
      } else {
        console.log("ℹ️ C1サブスロットが展開されていないため画像更新をスキップ");
      }
    }, 150); // 上位スロット画像処理の後に実行
  } else {
    console.warn("⚠ updateSubslotImages関数が見つかりません");
  }
}

// DisplayAtTop に対応する疑問詞をページ上部に表示する処理
function displayTopQuestionWord() {
  const topDiv = document.getElementById("display-top-question-word");
  if (!topDiv) {
    console.warn("⚠ display-top-question-word が見つかりません");
    return;
  }

  const topDisplayItem = window.loadedJsonData?.find(d => d.DisplayAtTop);
  if (topDisplayItem && topDisplayItem.DisplayText) {
    // 🔤 分離疑問詞は常に文頭なので必ず大文字化
    const questionWord = topDisplayItem.DisplayText.trim();
    const capitalizedQuestionWord = questionWord.charAt(0).toUpperCase() + questionWord.slice(1);
    
    // 🆕 分離疑問詞の日本語訳
    const translations = {
      'What': '何？',
      'Who': '誰？',
      'When': 'いつ？',
      'Where': 'どこ？',
      'Why': 'なぜ？',
      'How': 'どのように？',
      'Which': 'どちら？',
      'Whose': '誰の？',
      'Whom': '誰を？',
      'How many': 'いくつ？',
      'How much': 'いくら？',
      'How long': 'どのくらい？',
      'How often': 'どのくらいの頻度で？',
      'How far': 'どのくらい遠く？'
    };
    
    // 🆕 HTML構造を確保（なければ作成）
    let textElement = topDiv.querySelector('.question-word-text');
    let auxtextElement = topDiv.querySelector('.question-word-auxtext');
    
    // 🔧 常にHTML構造を強制的に再作成（確実に動作させるため）
    const translation = translations[capitalizedQuestionWord] || translations[questionWord] || '';
    
    // 🆕 日本語補助テキスト個別ボタンを作成
    const auxTextToggleBtn = document.createElement('button');
    auxTextToggleBtn.className = 'question-word-auxtext-toggle-btn';
    auxTextToggleBtn.innerHTML = 'ヒント<br>OFF';
    auxTextToggleBtn.title = '日本語補助表示切替';
    auxTextToggleBtn.style.cssText = `
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 2px 4px;
      font-size: 9px;
      cursor: pointer;
      line-height: 1.1;
      min-width: 32px;
      text-align: center;
    `;
    
    // 🆕 英語テキスト個別ボタンを作成
    const textToggleBtn = document.createElement('button');
    textToggleBtn.className = 'question-word-text-toggle-btn';
    textToggleBtn.innerHTML = getEnglishOffButtonText();
    textToggleBtn.title = '英語表示切替';
    textToggleBtn.style.cssText = `
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 3px;
      padding: 2px 4px;
      font-size: 9px;
      cursor: pointer;
      line-height: 1.1;
      min-width: 32px;
      text-align: center;
    `;
    
    topDiv.innerHTML = `
      <div class="question-word-label">疑問詞</div>
      <div class="question-word-image"></div>
      <div class="question-word-auxtext-row" style="grid-row: 3; display: flex; align-items: center; gap: 4px;">
        <div class="auxtext-toggle-container"></div>
        <div class="question-word-auxtext">${translation}</div>
      </div>
      <div class="question-word-text-row" style="grid-row: 4; display: flex; align-items: center; gap: 4px;">
        <div class="text-toggle-container"></div>
        <div class="question-word-text">${capitalizedQuestionWord}</div>
      </div>
      <div class="question-word-button-placeholder"></div>
      <div class="question-word-button-placeholder"></div>
    `;
    
    // ボタンを挿入
    const auxTextToggleContainer = topDiv.querySelector('.auxtext-toggle-container');
    const textToggleContainer = topDiv.querySelector('.text-toggle-container');
    if (auxTextToggleContainer) auxTextToggleContainer.appendChild(auxTextToggleBtn);
    if (textToggleContainer) textToggleContainer.appendChild(textToggleBtn);
    
    // 🆕 日本語補助ボタンクリックイベント
    auxTextToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      console.log('🔄 疑問詞日本語補助トグルボタンクリック');
      
      const saved = localStorage.getItem('question_word_visibility_state');
      let state = saved ? JSON.parse(saved) : { text: true, auxtext: true };
      
      const currentVisible = state.auxtext !== false;
      state.auxtext = !currentVisible;
      
      localStorage.setItem('question_word_visibility_state', JSON.stringify(state));
      
      const auxtextEl = topDiv.querySelector('.question-word-auxtext');
      if (!currentVisible) {
        if (auxtextEl) {
          auxtextEl.style.opacity = '1';
          auxtextEl.style.visibility = 'visible';
        }
        auxTextToggleBtn.innerHTML = 'ヒント<br>OFF';
        auxTextToggleBtn.style.backgroundColor = '#4CAF50';
        console.log('✅ 疑問詞日本語補助を表示');
      } else {
        if (auxtextEl) {
          auxtextEl.style.opacity = '0';
          auxtextEl.style.visibility = 'hidden';
        }
        auxTextToggleBtn.innerHTML = 'ヒント<br>ON';
        auxTextToggleBtn.style.backgroundColor = '#757575';
        console.log('🙈 疑問詞日本語補助を非表示');
      }
    });
    
    // 🆕 英語テキストボタンクリックイベント
    textToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      console.log('🔄 疑問詞英語トグルボタンクリック');
      
      const saved = localStorage.getItem('question_word_visibility_state');
      let state = saved ? JSON.parse(saved) : { text: true, auxtext: true };
      
      const currentVisible = state.text !== false;
      state.text = !currentVisible;
      
      localStorage.setItem('question_word_visibility_state', JSON.stringify(state));
      
      const textEl = topDiv.querySelector('.question-word-text');
      if (!currentVisible) {
        if (textEl) {
          textEl.style.opacity = '1';
          textEl.style.visibility = 'visible';
        }
        textToggleBtn.innerHTML = getEnglishOffButtonText();
        textToggleBtn.style.backgroundColor = '#4CAF50';
        console.log('✅ 疑問詞英語を表示');
      } else {
        if (textEl) {
          textEl.style.opacity = '0';
          textEl.style.visibility = 'hidden';
        }
        textToggleBtn.innerHTML = getEnglishOnButtonText();
        textToggleBtn.style.backgroundColor = '#757575';
        console.log('🙈 疑問詞英語を非表示');
        
        // 💡 イラストヒントトーストを表示
        if (typeof window.showIllustrationHintToast === 'function') {
          window.showIllustrationHintToast(textToggleBtn);
        }
      }
    });
    
    // 🆕 localStorageの状態を即座に適用
    try {
      const saved = localStorage.getItem('question_word_visibility_state');
      if (saved) {
        const state = JSON.parse(saved);
        const auxtextEl = topDiv.querySelector('.question-word-auxtext');
        const textEl = topDiv.querySelector('.question-word-text');
        
        if (state.auxtext === false && auxtextEl) {
          auxtextEl.style.opacity = '0';
          auxtextEl.style.visibility = 'hidden';
          auxTextToggleBtn.innerHTML = 'ヒント<br>ON';
          auxTextToggleBtn.style.backgroundColor = '#757575';
        }
        
        if (state.text === false && textEl) {
          textEl.style.opacity = '0';
          textEl.style.visibility = 'hidden';
          textToggleBtn.innerHTML = getEnglishOnButtonText();
          textToggleBtn.style.backgroundColor = '#757575';
        }
      }
    } catch (error) {
      console.warn('localStorage状態適用エラー:', error);
    }
    
    console.log("✅ 分離疑問詞として表示（大文字化）: " + capitalizedQuestionWord + " (" + translation + ")");
    
    // 🆕 表示状態を復元
    topDiv.style.display = "";
    topDiv.classList.remove("empty-slot-hidden", "hidden", "empty-content");
    topDiv.classList.add("visible"); // visibleクラスを追加してGrid表示を有効化
    
    // 🔹 疑問詞を文頭（slot-wrapper内の最初）に移動
    const slotWrapper = document.querySelector('.slot-wrapper');
    if (slotWrapper && !slotWrapper.contains(topDiv)) {
      // slot-wrapperの最初に移動
      slotWrapper.insertBefore(topDiv, slotWrapper.firstChild);
      console.log("✅ 疑問詞を文頭に移動しました");
    }

    // 🔹 動的記載エリアにも同じ疑問詞を表示
    const dynamicArea = document.getElementById("dynamic-slot-area");
    if (dynamicArea) {
      // 既存の動的エリア用疑問詞要素があるかチェック
      let dynamicQuestionDiv = document.getElementById("dynamic-question-word");
      
      if (!dynamicQuestionDiv) {
        // 初回作成：元の要素をクローン
        dynamicQuestionDiv = topDiv.cloneNode(true);
        dynamicQuestionDiv.id = "dynamic-question-word"; // 異なるIDを設定
        console.log("✅ 動的エリア用疑問詞要素を作成しました");
      }
      
      // テキストを更新（HTML構造を保持）
      const dynamicTextElement = dynamicQuestionDiv.querySelector('.question-word-text');
      if (dynamicTextElement) {
        // 🔤 動的エリアでも大文字化
        dynamicTextElement.textContent = capitalizedQuestionWord;
      } else {
        // 構造がない場合は単純にテキストを設定
        dynamicQuestionDiv.textContent = capitalizedQuestionWord;
      }
      
      // 動的エリアの最初に配置
      if (!dynamicArea.contains(dynamicQuestionDiv)) {
        dynamicArea.insertBefore(dynamicQuestionDiv, dynamicArea.firstChild);
        console.log("✅ 動的エリアに疑問詞を配置しました");
      }
    }
  } else {
    // DisplayAtTopがない場合は表示をクリア
    const textElement = topDiv.querySelector('.question-word-text');
    const auxtextElement = topDiv.querySelector('.question-word-auxtext');
    
    if (textElement && auxtextElement) {
      // 新しい構造でクリア
      textElement.textContent = "";
      auxtextElement.textContent = "";
    } else {
      // 従来の方法でクリア
      topDiv.textContent = "";
      topDiv.innerHTML = ""; // HTMLも完全にクリア
    }
    
    topDiv.classList.add("empty-content"); // 強制的に空クラスを追加
    
    // 🆕 空の場合は非表示にする
    topDiv.style.display = "none";
    topDiv.classList.add("empty-slot-hidden", "hidden");
    topDiv.classList.remove("visible"); // visibleクラスを削除
    console.log("🙈 分離疑問詞エリアを非表示 (DisplayAtTopデータなし)");
    
    // 動的エリアの疑問詞もクリア
    const dynamicQuestionDiv = document.getElementById("dynamic-question-word");
    if (dynamicQuestionDiv) {
      dynamicQuestionDiv.remove();
      console.log("🧹 動的エリアの疑問詞を削除しました");
    }
    
    console.log("🧹 DisplayAtTop 表示をクリア（該当データなし）");
  }
  
  // 🔧 遅延処理は削除（HTML構造を破壊するため）
  // 上記の処理で既に正しく設定済み
}

// ✅ 修正版：window.loadedJsonData を直接参照してスロット書き込み
function syncUpperSlotsFromJson(data) {
  if (!data || !Array.isArray(data)) {
    console.error("❌ 上位スロット同期: 無効なデータが渡されました", data);
    return;
  }
  
  const upperSlotCount = data.filter(item => item.SubslotID === "" && item.PhraseType === "word").length;
  console.log(`🔄 上位スロット同期: ${upperSlotCount}件の対象を処理`);
  
  // 🎯 スムーズレンダリング制御開始
  startSmoothDataInsertion();
  
  // 詳細ログはデバッグが必要な時だけ出す
  if (window.DEBUG_SYNC) {
    console.log("📊 データサンプル:", JSON.stringify(data.slice(0, 3))); // 最初の3件だけ表示
  }
  
  // グローバル変数がなければ初期化
  if (typeof window.DEBUG_SYNC === 'undefined') {
    window.DEBUG_SYNC = false;
  }
  
  data.forEach(item => {
    if (item.SubslotID === "" && item.PhraseType === "word") {
      console.log("🔍 上位スロット処理開始:", JSON.stringify(item));
      const slotId = "slot-" + item.Slot.toLowerCase();
      console.log("👉 探索するスロットID:", slotId);
      
      const container = document.getElementById(slotId);
      if (container) {
        console.log("✅ スロットコンテナ発見:", container.id);
        
        // 重要: slot-containerの直下のslot-phraseを選択（:scope > を使用）
        const phraseDiv = container.querySelector(":scope > .slot-phrase");
        console.log("📌 上位スロットのphraseDiv:", phraseDiv ? phraseDiv.outerHTML : "未検出");
        
        // 🆕 .upper-slot-phrase-rowが既に存在する場合もチェック
        const existingPhraseRow = container.querySelector('.upper-slot-phrase-row');
        if (existingPhraseRow) {
          console.log("✅ .upper-slot-phrase-row既存、内容を更新: ", container.id);
        }
        
        const textDiv = container.querySelector(":scope > .slot-text");
        console.log("📌 上位スロットのtextDiv:", textDiv ? textDiv.outerHTML : "未検出");
        
        // 🆕 .upper-slot-text-rowが既に存在する場合もチェック
        const existingTextRow = container.querySelector('.upper-slot-text-row');
        if (existingTextRow) {
          console.log("✅ .upper-slot-text-row既存、内容を更新: ", container.id);
        }
        
        if (phraseDiv || existingPhraseRow) {
          const slotKey = item.Slot.toLowerCase();
          let isTextVisible = true;
          if (window.visibilityState && window.visibilityState[slotKey]) {
            isTextVisible = window.visibilityState[slotKey]['text'] !== false;
          }
          console.log(`🔍 [syncUpperSlots] ${slotKey}: isTextVisible=${isTextVisible}, slotKey状態=`, window.visibilityState?.[slotKey], 'item.Slot=', item.Slot, 'item.SlotPhrase=', item.SlotPhrase);
          
          // 🆕 親スロット用の個別トグルボタンを作成（初回のみ）
          let phraseRow = existingPhraseRow; // 既存のphraseRowを使用
          console.log(`🔍 [syncUpperSlots] ${slotKey}: phraseRow存在=${!!phraseRow}, isTextVisible=${isTextVisible}`);
          if (!phraseRow) {
            // phraseRowコンテナを作成
            phraseRow = document.createElement('div');
            phraseRow.className = 'upper-slot-phrase-row';
            phraseRow.style.cssText = `
              grid-row: 4;
              grid-column: 1;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              gap: 4px;
              width: 100%;
              height: 100%;
            `;
            
            // 🔹 英語テキストが空の場合（サブスロットのみの親）はボタンを作成しない
            const hasEnglishText = item.SlotPhrase && item.SlotPhrase.trim() !== '';
            
            // トグルボタンを作成（英語テキストがある場合のみ）
            let toggleButton = null;
            if (hasEnglishText) {
              toggleButton = document.createElement('button');
              toggleButton.className = 'upper-slot-toggle-btn';
              toggleButton.dataset.slotId = container.id;
              toggleButton.innerHTML = getEnglishOffButtonText();
              toggleButton.title = '英語表示切替';
              toggleButton.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 4px;
                font-size: 9px;
                cursor: pointer;
                line-height: 1.1;
                min-width: 32px;
                text-align: center;
                flex-shrink: 0;
              `;
            }
            
            // 新しいphraseElementを作成（サブスロットと同じ方式）
            const newPhraseElement = document.createElement('div');
            newPhraseElement.className = 'slot-phrase';
            newPhraseElement.textContent = item.SlotPhrase || "";
            console.log(`📝 [syncUpperSlots] ${slotKey}: textContent設定直後="${newPhraseElement.textContent}", item.SlotPhrase="${item.SlotPhrase}"`);
            
            // opacity/visibilityを設定
            if (!isTextVisible) {
              newPhraseElement.style.opacity = '0';
              newPhraseElement.style.visibility = 'hidden';
              console.log(`👻 [syncUpperSlots] ${slotKey}: 非表示に設定（opacity=0, visibility=hidden）`);
            } else {
              newPhraseElement.style.opacity = '1';
              newPhraseElement.style.visibility = 'visible';
              console.log(`👁️ [syncUpperSlots] ${slotKey}: 表示に設定（opacity=1, visibility=visible）`);
            }
            console.log(`🎨 [syncUpperSlots] ${slotKey}: DOM作成直後 opacity=${newPhraseElement.style.opacity}, visibility=${newPhraseElement.style.visibility}`);
            
            // ボタンクリックでトグル（ボタンがある場合のみ）
            if (toggleButton) {
              toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                
                console.log(`🔄 親スロット個別トグルボタンクリック: ${container.id}`);
                
                // 毎回phraseRowから.slot-phraseを取得（ランダマイズ対応）
                const currentPhraseRow = container.querySelector('.upper-slot-phrase-row');
                const currentPhraseElement = currentPhraseRow?.querySelector('.slot-phrase');
                
                if (!currentPhraseElement) {
                  console.error(`❌ .slot-phrase要素が見つかりません: ${container.id}`);
                  return;
                }
                
                // 現在の状態を取得
                if (!window.visibilityState) window.visibilityState = {};
                if (!window.visibilityState[slotKey]) {
                  window.visibilityState[slotKey] = { text: true, auxtext: true };
                }
                
                // 状態を反転
                const currentVisible = window.visibilityState[slotKey]['text'] !== false;
                window.visibilityState[slotKey]['text'] = !currentVisible;
                
                // UIを更新
                if (!currentVisible) {
                  // 表示する
                  currentPhraseElement.style.opacity = '1';
                  currentPhraseElement.style.visibility = 'visible';
                  toggleButton.innerHTML = getEnglishOffButtonText();
                  toggleButton.style.backgroundColor = '#4CAF50';
                  toggleButton.title = '英語を非表示';
                  console.log(`✅ ${container.id}: 英語を表示`);
                } else {
                  // 非表示にする
                  currentPhraseElement.style.opacity = '0';
                  currentPhraseElement.style.visibility = 'hidden';
                  toggleButton.innerHTML = getEnglishOnButtonText();
                  toggleButton.style.backgroundColor = '#757575';
                  toggleButton.title = '英語を表示';
                  console.log(`🙈 ${container.id}: 英語を非表示`);
                  
                  //  イラストヒントトーストを表示
                  if (typeof window.showIllustrationHintToast === 'function') {
                    window.showIllustrationHintToast(toggleButton);
                  }
                }
              });
            }
            
            // phraseRowに新規DOMを追加
            if (toggleButton) phraseRow.appendChild(toggleButton);
            phraseRow.appendChild(newPhraseElement);
            
            // 古いphraseDivを削除してphraseRowを挿入
            phraseDiv.replaceWith(phraseRow);
            
            console.log(`🆕 親スロット個別ボタン追加（新規DOM作成）: ${container.id}`);
          } else {
            // phraseRowが既に存在する場合、内容を更新
            const existingPhraseElement = phraseRow.querySelector('.slot-phrase');
            if (existingPhraseElement) {
              existingPhraseElement.textContent = item.SlotPhrase || "";
              
              // opacity/visibilityを設定
              if (!isTextVisible) {
                existingPhraseElement.style.opacity = '0';
                existingPhraseElement.style.visibility = 'hidden';
              } else {
                existingPhraseElement.style.opacity = '1';
                existingPhraseElement.style.visibility = 'visible';
              }
            }
            
            // 🔹 OFFボタンの表示・非表示は updateAllSlotToggleButtons() に任せる
            // （ランダマイズ後に150ms遅延で実行されるため、ここでは処理しない）
            
            // ボタンのラベル・色の状態だけを同期
            const toggleButton = phraseRow.querySelector('.upper-slot-toggle-btn');
            if (toggleButton) {
              // isTextVisibleに基づいてボタンの見た目を更新
              if (!isTextVisible) {
                toggleButton.innerHTML = getEnglishOnButtonText();
                toggleButton.style.backgroundColor = '#757575';
                toggleButton.title = '英語を表示';
              } else {
                toggleButton.innerHTML = getEnglishOffButtonText();
                toggleButton.style.backgroundColor = '#4CAF50';
                toggleButton.title = '英語を非表示';
              }
            }
            console.log(`✅ 上位 phrase書き込み成功: ${item.Slot} | 値: "${item.SlotPhrase}"`);
          }
        } else {
          console.warn(`❌ 上位phraseDiv取得失敗: ${slotId} - 要素が見つかりません`);
        }
        
        // existingTextRowは既にLine 1058で宣言済み（重複宣言を削除）
        if (textDiv || existingTextRow) {
          const slotKey = item.Slot.toLowerCase();
          let isAuxtextVisible = true;
          if (window.visibilityState && window.visibilityState[slotKey]) {
            isAuxtextVisible = window.visibilityState[slotKey]['auxtext'] !== false;
          }
          console.log(`🔍 [syncUpperSlots] ${slotKey} auxtext: isAuxtextVisible=${isAuxtextVisible}`);
          
          let textRow = existingTextRow;
            
            if (!textRow) {
              // textRowコンテナを作成（初回のみ）
              textRow = document.createElement('div');
              textRow.className = 'upper-slot-text-row';
              textRow.style.cssText = `
                grid-row: 3;
                grid-column: 1;
                display: flex;
                align-items: center;
                justify-content: flex-start;
                gap: 4px;
                width: 100%;
                height: 100%;
              `;
              
              // トグルボタンを作成
              const toggleButton = document.createElement('button');
              toggleButton.className = 'upper-slot-auxtext-toggle-btn';
              toggleButton.dataset.slotId = container.id;
              toggleButton.innerHTML = 'ヒント<br>OFF';
              toggleButton.title = '日本語補助表示切替';
              toggleButton.style.cssText = `
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 3px;
                padding: 2px 4px;
                font-size: 9px;
                cursor: pointer;
                line-height: 1.1;
                min-width: 32px;
                text-align: center;
                flex-shrink: 0;
              `;
              
              // 新しいtextElementを作成
              const newTextElement = document.createElement('div');
              newTextElement.className = 'slot-text';
              newTextElement.textContent = item.SlotText || "";
              
              // opacity/visibilityを設定
              if (!isAuxtextVisible) {
                newTextElement.style.opacity = '0';
                newTextElement.style.visibility = 'hidden';
              } else {
                newTextElement.style.opacity = '1';
                newTextElement.style.visibility = 'visible';
              }
              
              // ボタンクリックでトグル
              toggleButton.addEventListener('click', (e) => {
                e.stopPropagation();
                
                console.log(`🔄 親スロット日本語補助個別トグルボタンクリック: ${container.id}`);
                
                // 毎回textRowから.slot-textを取得（ランダマイズ対応）
                const currentTextRow = container.querySelector('.upper-slot-text-row');
                const currentTextElement = currentTextRow?.querySelector('.slot-text');
                
                if (!currentTextElement) {
                  console.error(`❌ .slot-text要素が見つかりません: ${container.id}`);
                  return;
                }
                
                // 現在の状態を取得
                if (!window.visibilityState) window.visibilityState = {};
                if (!window.visibilityState[slotKey]) {
                  window.visibilityState[slotKey] = { text: true, auxtext: true };
                }
                
                // 状態を反転
                const currentVisible = window.visibilityState[slotKey]['auxtext'] !== false;
                window.visibilityState[slotKey]['auxtext'] = !currentVisible;
                
                // UIを更新
                if (!currentVisible) {
                  // 表示する
                  currentTextElement.style.opacity = '1';
                  currentTextElement.style.visibility = 'visible';
                  toggleButton.innerHTML = 'ヒント<br>OFF';
                  toggleButton.style.backgroundColor = '#4CAF50';
                  toggleButton.title = '日本語補助を非表示';
                  console.log(`✅ ${container.id}: 日本語補助を表示`);
                } else {
                  // 非表示にする
                  currentTextElement.style.opacity = '0';
                  currentTextElement.style.visibility = 'hidden';
                  toggleButton.innerHTML = 'ヒント<br>ON';
                  toggleButton.style.backgroundColor = '#757575';
                  toggleButton.title = '日本語補助を表示';
                  console.log(`🙈 ${container.id}: 日本語補助を非表示`);
                }
              });
              
              // textRowに新規DOMを追加
              textRow.appendChild(toggleButton);
              textRow.appendChild(newTextElement);
              
              // 古いtextDivを削除してtextRowを挿入
              textDiv.replaceWith(textRow);
              
              console.log(`🆕 親スロット日本語補助個別ボタン追加（新規DOM作成）: ${container.id}`);
            } else {
              // textRowが既に存在する場合、内容を更新
              const existingTextElement = textRow.querySelector('.slot-text');
              if (existingTextElement) {
                existingTextElement.textContent = item.SlotText || "";
                
                // opacity/visibilityを設定
                if (!isAuxtextVisible) {
                  existingTextElement.style.opacity = '0';
                  existingTextElement.style.visibility = 'hidden';
                } else {
                  existingTextElement.style.opacity = '1';
                  existingTextElement.style.visibility = 'visible';
                }
              }
              
              // ボタンの状態を同期
              const toggleButton = textRow.querySelector('.upper-slot-auxtext-toggle-btn');
              if (toggleButton) {
                if (!isAuxtextVisible) {
                  toggleButton.innerHTML = 'ヒント<br>ON';
                  toggleButton.style.backgroundColor = '#757575';
                  toggleButton.title = '日本語補助を表示';
                } else {
                  toggleButton.innerHTML = 'ヒント<br>OFF';
                  toggleButton.style.backgroundColor = '#4CAF50';
                  toggleButton.title = '日本語補助を非表示';
                }
              }
              console.log(`✅ 上位 text書き込み成功: ${item.Slot} | 値: "${item.SlotText}"`);
            }
        } else {
          console.warn(`❌ 上位textDiv/textRow取得失敗: ${slotId}`);
        }
      } else {
        console.warn(`❌ 上位スロットが見つかりません: ${slotId}`);
      }
    }
  });

  // � 全上位スロットの展開ボタン制御（データ存在チェック + PhraseType判定）
  const allTargetSlots = ['c1', 'm1', 's', 'v', 'o1', 'o2', 'm2', 'c2', 'm3', 'aux'];
  console.log(`🎯 展開ボタン制御対象: ${allTargetSlots.join(', ')}`);
  
  allTargetSlots.forEach(slotName => {
    const slotId = `slot-${slotName}`;
    const container = document.getElementById(slotId);
    
    if (!container) {
      console.warn(`⚠ ${slotId}が見つかりません`);
      return;
    }
    
    // このスロットのデータを検索
    const slotData = data.find(item => 
      item.Slot.toLowerCase() === slotName && 
      (!item.SubslotID || item.SubslotID === "")
    );
    
    // このスロットに関連するサブスロットデータをチェック
    const relatedSubslotData = data.filter(item => 
      item.Slot.toLowerCase() === slotName && 
      item.SubslotID && 
      item.SubslotID !== ""
    );
    
    const detailButton = container.querySelector('.subslot-toggle-button');
    if (!detailButton) {
      console.log(`ℹ ${slotName}: 展開ボタンが存在しません`);
      return;
    }
    
    console.log(`🔍 ${slotName}:`);
    console.log(`  - 上位データ: ${slotData ? `PhraseType=${slotData.PhraseType}` : '未存在'}`);
    console.log(`  - 関連サブスロット: ${relatedSubslotData.length}件`);
    
    // サブスロットデータの詳細を出力
    if (relatedSubslotData.length > 0) {
      console.log(`  - サブスロット詳細:`);
      relatedSubslotData.forEach((sub, index) => {
        console.log(`    ${index + 1}. SubslotID=${sub.SubslotID}, PhraseType=${sub.PhraseType}, Element="${sub.SubslotElement}"`);
      });
    }
    
    // 判定ロジック：
    // 1. 上位データが存在し、PhraseType="word" → 展開ボタン非表示
    // 2. 関連サブスロットデータが0件 → 展開ボタン非表示
    // 3. それ以外 → 展開ボタン表示
    
    if (slotData && slotData.PhraseType === "word") {
      detailButton.style.display = 'none';
      console.log(`🚫 ${slotName}: PhraseType=wordのため展開ボタンを非表示`);
      
      // 🖼 展開ボタン非表示の場合は画像を元に戻す
      const slotImage = container.querySelector('.slot-image');
      if (slotImage) {
        slotImage.src = 'slot_images/common/placeholder.png';
        console.log(`🖼 ${slotName}: 画像をplaceholder.pngに戻しました`);
      }
    } else if (relatedSubslotData.length === 0) {
      detailButton.style.display = 'none';
      console.log(`🚫 ${slotName}: サブスロットデータ0件のため展開ボタンを非表示`);
      
      // 🖼 展開ボタン非表示の場合は画像を元に戻す
      const slotImage = container.querySelector('.slot-image');
      if (slotImage) {
        slotImage.src = 'slot_images/common/placeholder.png';
        console.log(`🖼 ${slotName}: 画像をplaceholder.pngに戻しました`);
      }
    } else {
      detailButton.style.display = '';
      console.log(`👁 ${slotName}: サブスロットデータ${relatedSubslotData.length}件のため展開ボタンを表示`);
      
      // 🖼 サブスロット要素がある上位スロットの画像をbutton.pngに変更
      const slotImage = container.querySelector('.slot-image');
      if (slotImage) {
        slotImage.src = 'slot_images/common/button.png';
        console.log(`🖼 ${slotName}: 画像をbutton.pngに変更しました`);
      } else {
        console.warn(`⚠ ${slotName}: slot-imageが見つかりません`);
      }
    }
  });
  const targetSlots = ['c1', 'm1', 's', 'v', 'o1', 'o2', 'm2', 'c2', 'm3', 'aux'];
  console.log(`🎯 空スロット非表示対象: ${targetSlots.join(', ')}`);
  
  targetSlots.forEach(slotName => {
    const slotId = `slot-${slotName}`;
    const slot = document.getElementById(slotId);
    
    if (slot) {
      const phraseDiv = slot.querySelector('.slot-phrase');
      const textDiv = slot.querySelector('.slot-text');
      
      // 上位スロット自体が空かどうかを判定
      const phraseEmpty = !phraseDiv || !phraseDiv.textContent || phraseDiv.textContent.trim() === '';
      const textEmpty = !textDiv || !textDiv.textContent || textDiv.textContent.trim() === '';
      let upperSlotEmpty = phraseEmpty && textEmpty;
      
      // 🔥 M2スロット特別処理: PhraseType="clause"の場合、サブスロットありなら上位空でも表示
      if (slotName === 'm2' && upperSlotEmpty) {
        const relatedM2SubSlots = document.querySelectorAll(`[id^="slot-m2-sub-"]`);
        if (relatedM2SubSlots.length > 0) {
          console.log(`🔥 M2スロット特別処理: サブスロット${relatedM2SubSlots.length}個検出のため上位空でも表示対象とします`);
          upperSlotEmpty = false; // 強制的に表示対象にする
        }
      }
      
      // 関連するサブスロットに内容があるかチェック
      const relatedSubSlots = document.querySelectorAll(`[id^="slot-${slotName}-sub-"]`);
      let hasNonEmptySubslots = false;
      
      relatedSubSlots.forEach(subSlot => {
        const subPhraseDiv = subSlot.querySelector('.slot-phrase');
        const subTextDiv = subSlot.querySelector('.slot-text');
        const subPhraseEmpty = !subPhraseDiv || !subPhraseDiv.textContent || subPhraseDiv.textContent.trim() === '';
        const subTextEmpty = !subTextDiv || !subTextDiv.textContent || subTextDiv.textContent.trim() === '';
        
        if (!subPhraseEmpty || !subTextEmpty) {
          hasNonEmptySubslots = true;
        }
      });
      
      console.log(`🔍 ${slotId}:`);
      console.log(`  - 上位スロット空: ${upperSlotEmpty} (phrase="${phraseDiv?.textContent}", text="${textDiv?.textContent}")`);
      console.log(`  - 関連サブスロット: ${relatedSubSlots.length}件`);
      console.log(`  - 空でないサブスロットあり: ${hasNonEmptySubslots}`);
      
      // 判定: 上位スロットが空 かつ 空でないサブスロットがない場合のみ非表示
      const shouldHide = upperSlotEmpty && !hasNonEmptySubslots;
      
      if (shouldHide) {
        slot.style.display = 'none';
        slot.classList.add('empty-slot-hidden', 'hidden');
        console.log(`👻 ${slotId}を非表示にしました`);
      } else {
        slot.style.display = '';
        slot.classList.remove('empty-slot-hidden', 'hidden');
        const reason = !upperSlotEmpty ? '上位スロットに内容あり' : 'サブスロットに内容あり';
        console.log(`👁 ${slotId}を表示状態にしました (理由: ${reason})`);
      }
    } else {
      console.log(`⚠ ${slotId}が見つかりません`);
    }
  });
  
  // 🎯 スムーズレンダリング制御完了
  completeSmoothDataInsertion();
  
  // 🖼 画像処理：上位スロット同期完了後に画像の自動非表示処理を実行
  // 注意：この処理は最終的にラベル復元後に統合実行されるため、ここでは削除
  // console.log("🖼 syncUpperSlotsFromJson完了後の画像処理を実行...");
  // if (typeof window.processAllImagesWithCoordination === 'function') {
  //   setTimeout(() => {
  //     window.processAllImagesWithCoordination();
  //     console.log("✅ 上位スロット同期後の画像自動非表示処理が完了しました");
  //   }, 50);
  // } else {
  //   console.warn("⚠ processAllImagesWithCoordination関数が見つかりません");
  // }
  
  // 🆕 スロット幅の動的調整を実行
  setTimeout(() => {
    if (typeof window.adjustSlotWidthsBasedOnText === 'function') {
      window.adjustSlotWidthsBasedOnText();
    }
  }, 100);
  
  // 🖼 全スロット画像更新：データ更新後に全スロット画像を再更新
  setTimeout(() => {
    if (typeof window.updateAllSlotImagesAfterDataChange === 'function') {
      window.updateAllSlotImagesAfterDataChange();
      console.log("✅ syncUpperSlotsFromJson完了後の全スロット画像更新を実行");
    } else {
      console.warn("⚠ updateAllSlotImagesAfterDataChange関数が見つかりません");
    }
  }, 150);
  
  // 🏷️ 上位スロット同期後にラベルを復元
  setTimeout(() => {
    if (window.restoreSubslotLabels) {
      window.restoreSubslotLabels();
      console.log("🏷️ 上位スロット同期後のラベル復元を実行しました");
    }
    
    // 🖼 画像処理：この処理はラベル復元内で統合実行されるため、ここでは削除
    // if (typeof window.processAllImagesWithCoordination === 'function') {
    //   window.processAllImagesWithCoordination();
    // }
  }, 150);
  
  // 🎤 音声読み上げ用データの更新（上位スロット同期完了後）
  setTimeout(() => {
    // 受け取ったdataをそのまま音声用データとして格納
    window.currentDisplayedSentence = data.map(slot => ({ ...slot }));
    console.log(`🎤 音声用データ更新完了（上位スロット同期後）: ${window.currentDisplayedSentence.length}件`);
    console.log(`🎤 音声用データ詳細:`, window.currentDisplayedSentence.map(s => `${s.Slot}: ${s.SlotPhrase || s.SubslotElement}`));
    
    // 🔹 OFFボタンの表示・非表示を更新（DOM更新完了後に実行）
    if (typeof window.updateAllSlotToggleButtons === 'function') {
      window.updateAllSlotToggleButtons();
    }
  }, 200);
}

// ✅ サブスロット同期機能の実装（完全リセット＋再構築方式）
function syncSubslotsFromJson(data) {
  console.log("🔄 サブスロット同期（完全リセット＋再構築）開始");
  if (!data || !Array.isArray(data)) {
    console.warn("⚠ サブスロット同期: データが無効です");
    return;
  }
  
  // DisplayAtTopの要素を特定（サブスロットから除外するため）
  const displayAtTopItem = data.find(d => d.DisplayAtTop);
  
  // サブスロット用のデータをフィルタリング
  const subslotData = data.filter(item => item.SubslotID && item.SubslotID !== "");
  console.log(`📊 サブスロット対象件数: ${subslotData.length}`);
  
  // 🧹 STEP1: 全サブスロットコンテナをクリア
  const allSubContainers = document.querySelectorAll('[id^="slot-"][id$="-sub"]');
  console.log(`🧹 クリア対象サブスロットコンテナ: ${allSubContainers.length}件`);
  
  allSubContainers.forEach(container => {
    // 子要素を全て削除
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    console.log(`🧹 ${container.id} を完全クリア`);
  });
  
  // 🔧 STEP2: display_orderでソートしてから再構築
  // display_orderによる正しい順序でソート
  const sortedSubslotData = subslotData.sort((a, b) => {
    // まず親スロットで並べ、次にdisplay_orderで並べる
    if (a.Slot !== b.Slot) {
      return a.Slot.localeCompare(b.Slot);
    }
    return (a.display_order || 0) - (b.display_order || 0);
  });
  
  console.log(`📊 display_orderでソート完了: ${sortedSubslotData.length}件`);
  sortedSubslotData.forEach((item, index) => {
    console.log(`  ${index + 1}. ${item.Slot}-${item.SubslotID}: display_order=${item.display_order}`);
  });
  
  sortedSubslotData.forEach(item => {
    try {
      // DisplayAtTopの要素をサブスロットから除外
      if (displayAtTopItem && 
          displayAtTopItem.DisplayText && 
          item.SubslotElement === displayAtTopItem.DisplayText) {
        console.log(`🚫 DisplayAtTop対象のため除外: ${item.SubslotElement} (${item.Slot}-${item.SubslotID})`);
        return;
      }

      // スロット要素ID構築（slot-[親スロット名]-sub-[サブスロットID]形式）
      const parentSlot = item.Slot.toLowerCase();
      // 🔧 修正：SubslotIDから'sub-'プレフィックスを除去
      const cleanSubslotId = item.SubslotID.replace(/^sub-/, '');
      const subslotId = cleanSubslotId.toLowerCase();
      const fullSlotId = `slot-${parentSlot}-sub-${subslotId}`;
      console.log(` サブスロット生成: ${fullSlotId}`);
      
      // 親コンテナを検索（slot-[親スロット名]-sub）
      const parentContainerId = `slot-${parentSlot}-sub`;
      const parentContainer = document.getElementById(parentContainerId);
      
      if (!parentContainer) {
        console.warn(`⚠ 親コンテナが見つかりません: ${parentContainerId}`);
        return;
      }
      
      // 新しいサブスロットDOM要素を生成
      const slotElement = document.createElement('div');
      slotElement.id = fullSlotId;
      slotElement.className = 'slot-container';
      
      // 🏷️ ラベル要素を作成（最初に追加）
      const labelElement = document.createElement('label');
      labelElement.textContent = subslotId.toUpperCase();
      labelElement.style.cssText = `
        display: block;
        font-weight: bold;
        margin-bottom: 5px;
        color: #333;
        font-size: 14px;
      `;
      
      // phrase要素を作成（英語例文テキスト）
      const phraseElement = document.createElement('div');
      phraseElement.className = 'slot-phrase';
      if (item.SubslotElement) {
        // 🎯 LocalStorageから文頭・文末スロット情報を取得して英語例文テキスト（phrase）に適用
        let processedSubslotPhrase = item.SubslotElement;
        
        try {
          const storedInfo = localStorage.getItem('sentencePositionInfo');
          console.log(`🔍 DEBUG: LocalStorage sentencePositionInfo = ${storedInfo}`);
          
          if (storedInfo) {
            const sentencePositionInfo = JSON.parse(storedInfo);
            const { firstSlot, lastSlot, isQuestionSentence } = sentencePositionInfo;
            
            console.log(`🔍 DEBUG: firstSlot=${firstSlot}, lastSlot=${lastSlot}, isQuestionSentence=${isQuestionSentence}`);
            console.log(`🔍 DEBUG: 現在のサブスロット: ${item.Slot}-${item.SubslotID}`);
            
            // 全てのサブスロットから最初と最後を特定
            const firstSlotSubslots = data.filter(d => d.SubslotID && d.Slot === firstSlot)
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            const lastSlotSubslots = data.filter(d => d.SubslotID && d.Slot === lastSlot)
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            
            console.log(`🔍 DEBUG: firstSlotSubslots=${firstSlotSubslots.length}件, lastSlotSubslots=${lastSlotSubslots.length}件`);
            
            // 文頭スロットの最初のサブスロットなら大文字化
            if (firstSlotSubslots.length > 0 && 
                item.SubslotID === firstSlotSubslots[0].SubslotID && 
                item.Slot === firstSlot) {
              processedSubslotPhrase = processedSubslotPhrase.charAt(0).toUpperCase() + processedSubslotPhrase.slice(1);
              console.log(`💡 文頭サブスロット大文字化: ${item.SubslotID} -> ${processedSubslotPhrase}`);
            }
            
            // 文末スロットの最後のサブスロットなら句読点付与
            if (lastSlotSubslots.length > 0 && 
                item.SubslotID === lastSlotSubslots[lastSlotSubslots.length - 1].SubslotID && 
                item.Slot === lastSlot) {
              const punctuation = isQuestionSentence ? "?" : ".";
              processedSubslotPhrase = processedSubslotPhrase.replace(/[.?!]+$/, "") + punctuation;
              console.log(`💡 文末サブスロット句読点付与: ${item.SubslotID} -> ${processedSubslotPhrase}`);
            }
          } else {
            console.log(`🔍 DEBUG: LocalStorageにsentencePositionInfoがありません`);
          }
        } catch (error) {
          console.warn('⚠️ サブスロット大文字化・句読点処理エラー:', error);
        }
        
        phraseElement.textContent = processedSubslotPhrase;
      }
      
      // 🆕 個別トグルボタンを作成（英語テキストの左側に配置）
      const toggleButton = document.createElement('button');
      toggleButton.className = 'subslot-toggle-btn';
      toggleButton.dataset.slotId = fullSlotId;
      toggleButton.innerHTML = getEnglishOffButtonText();
      toggleButton.title = '英語表示切替';
      toggleButton.style.cssText = `
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 2px 4px;
        font-size: 9px;
        cursor: pointer;
        line-height: 1.1;
        min-width: 32px;
        text-align: center;
      `;
      

      
      // ボタンクリックでトグル
      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation(); // 親要素へのイベント伝播を防止
        
        console.log(`🔄 個別トグルボタンクリック: ${fullSlotId}`);
        
        // 現在の状態を取得
        const saved = localStorage.getItem('rephrase_subslot_visibility_state');
        let visibilityState = saved ? JSON.parse(saved) : {};
        
        if (!visibilityState[fullSlotId]) {
          visibilityState[fullSlotId] = { text: true, auxtext: true };
        }
        
        // 状態を反転
        const currentVisible = visibilityState[fullSlotId]['text'] !== false;
        visibilityState[fullSlotId]['text'] = !currentVisible;
        
        // localStorageに保存
        localStorage.setItem('rephrase_subslot_visibility_state', JSON.stringify(visibilityState));
        
        // UIを更新
        if (!currentVisible) {
          // 表示する
          slotElement.classList.remove('hidden-subslot-text');
          phraseElement.style.opacity = '1';
          phraseElement.style.visibility = 'visible';
          toggleButton.innerHTML = getEnglishOffButtonText();
          toggleButton.style.backgroundColor = '#4CAF50';
          toggleButton.title = '英語を非表示';
          console.log(`✅ ${fullSlotId}: 英語を表示`);
        } else {
          // 非表示にする
          slotElement.classList.add('hidden-subslot-text');
          phraseElement.style.opacity = '0';
          phraseElement.style.visibility = 'hidden';
          toggleButton.innerHTML = getEnglishOnButtonText();
          toggleButton.style.backgroundColor = '#757575';
          toggleButton.title = '英語を表示';
          console.log(`🙈 ${fullSlotId}: 英語を非表示`);
          
          // 💡 イラストヒントトーストを表示
          if (typeof window.showIllustrationHintToast === 'function') {
            window.showIllustrationHintToast(toggleButton);
          }
        }
      });
      
      // 🆕 日本語補助テキスト個別トグルボタンを作成
      const auxTextToggleButton = document.createElement('button');
      auxTextToggleButton.className = 'subslot-auxtext-toggle-btn';
      auxTextToggleButton.dataset.slotId = fullSlotId;
      auxTextToggleButton.innerHTML = 'ヒント<br> OFF';
      auxTextToggleButton.title = '日本語補助表示切替';
      auxTextToggleButton.style.cssText = `
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 2px 4px;
        font-size: 9px;
        cursor: pointer;
        line-height: 1.1;
        min-width: 40px;
        text-align: center;
      `;
      
      // ボタンクリックで日本語補助テキストをトグル
      auxTextToggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        
        console.log(`🔄 日本語補助トグルボタンクリック: ${fullSlotId}`);
        
        // 現在の状態を取得
        const saved = localStorage.getItem('rephrase_subslot_visibility_state');
        let visibilityState = saved ? JSON.parse(saved) : {};
        
        if (!visibilityState[fullSlotId]) {
          visibilityState[fullSlotId] = { text: true, auxtext: true };
        }
        
        // 状態を反転
        const currentVisible = visibilityState[fullSlotId]['auxtext'] !== false;
        visibilityState[fullSlotId]['auxtext'] = !currentVisible;
        
        // localStorageに保存
        localStorage.setItem('rephrase_subslot_visibility_state', JSON.stringify(visibilityState));
        
        // UIを更新
        const textElement = slotElement.querySelector('.slot-text');
        if (!currentVisible) {
          // 表示する
          slotElement.classList.remove('hidden-subslot-auxtext');
          if (textElement) {
            textElement.style.opacity = '1';
            textElement.style.visibility = 'visible';
          }
          auxTextToggleButton.innerHTML = 'ヒント<br> OFF';
          auxTextToggleButton.style.backgroundColor = '#4CAF50';
          auxTextToggleButton.title = '日本語補助を非表示';
          console.log(`✅ ${fullSlotId}: 日本語補助を表示`);
        } else {
          // 非表示にする
          slotElement.classList.add('hidden-subslot-auxtext');
          if (textElement) {
            textElement.style.opacity = '0';
            textElement.style.visibility = 'hidden';
          }
          auxTextToggleButton.innerHTML = 'ヒント<br>ON';
          auxTextToggleButton.style.backgroundColor = '#757575';
          auxTextToggleButton.title = '日本語補助を表示';
          console.log(`🙈 ${fullSlotId}: 日本語補助を非表示`);
        }
      });
      
      // text要素を作成（日本語補助テキスト）
      const textElement = document.createElement('div');
      textElement.className = 'slot-text';
      if (item.SubslotText) {
        textElement.textContent = item.SubslotText;
        // 通常表示のスタイル
        textElement.style.cssText = `
          display: block;
          color: #777;
          font-size: 11px;
        `;
      }
      
      // 🆕 日本語補助テキスト行のコンテナを作成（ボタン＋日本語補助テキスト）
      const textRow = document.createElement('div');
      textRow.className = 'subslot-text-row';
      textRow.style.cssText = `
        grid-row: 3;
        grid-column: 1;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;
        width: 100%;
        height: 100%;
      `;
      textRow.appendChild(auxTextToggleButton);
      textRow.appendChild(textElement);
      
      // 🆕 英語テキスト行のコンテナを作成（ボタン＋英語テキスト）
      const phraseRow = document.createElement('div');
      phraseRow.className = 'subslot-phrase-row';
      phraseRow.style.cssText = `
        grid-row: 4;
        grid-column: 1;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        gap: 4px;
        width: 100%;
        height: 100%;
      `;
      phraseRow.appendChild(toggleButton);
      phraseRow.appendChild(phraseElement);
      
      // 要素を組み立て（ラベルを最初に追加）
      slotElement.appendChild(labelElement);
      slotElement.appendChild(textRow); // 🆕 textRowを追加（日本語補助）
      slotElement.appendChild(phraseRow); // 🆕 phraseRowを追加（英語）
      
      // 親コンテナに追加
      parentContainer.appendChild(slotElement);
      
      // 🎯 DOM追加後にlocalStorage設定に基づいてCSSクラスとインラインスタイルを適用
      try {
        const saved = localStorage.getItem('rephrase_subslot_visibility_state');
        if (saved) {
          const subslotVisibilityState = JSON.parse(saved);
          if (subslotVisibilityState[fullSlotId]) {
            console.log(`🔧 ${fullSlotId} の表示設定を適用:`, subslotVisibilityState[fullSlotId]);
            
            // 英語例文テキストの表示制御
            if (subslotVisibilityState[fullSlotId]['text'] === false) {
              slotElement.classList.add('hidden-subslot-text');
              // 🆕 インラインスタイルも設定（visibility_control.jsと統一）
              phraseElement.style.opacity = '0';
              phraseElement.style.visibility = 'hidden';
              // 🆕 ボタンの状態も同期
              toggleButton.innerHTML = getEnglishOnButtonText();
              toggleButton.style.backgroundColor = '#757575';
              toggleButton.title = '英語を表示';
              console.log(`🙈 ${fullSlotId} に hidden-subslot-text クラスとインラインスタイルを追加（英語例文テキスト非表示）`);
            } else {
              // 表示状態の場合
              toggleButton.innerHTML = getEnglishOffButtonText();
              toggleButton.style.backgroundColor = '#4CAF50';
              toggleButton.title = '英語を非表示';
            }
            
            // 🆕 日本語補助テキストの表示制御
            if (subslotVisibilityState[fullSlotId]['auxtext'] === false) {
              slotElement.classList.add('hidden-subslot-auxtext');
              textElement.style.opacity = '0';
              textElement.style.visibility = 'hidden';
              // 🆕 日本語補助ボタンの状態も同期
              auxTextToggleButton.innerHTML = 'ヒント<br>ON';
              auxTextToggleButton.style.backgroundColor = '#757575';
              auxTextToggleButton.title = '日本語補助を表示';
              console.log(`🙈 ${fullSlotId} に hidden-subslot-auxtext クラスを追加（日本語補助テキスト非表示）`);
            } else {
              // 表示状態の場合
              auxTextToggleButton.innerHTML = 'ヒント<br> OFF';
              auxTextToggleButton.style.backgroundColor = '#2196F3';
              auxTextToggleButton.title = '日本語補助を非表示';
            }
          } else {
            console.log(`📝 ${fullSlotId} の表示設定なし - デフォルト表示`);
          }
        } else {
          console.log(`📝 localStorage に表示設定なし - 全デフォルト表示`);
        }
      } catch (error) {
        console.warn('localStorage設定適用エラー:', error);
      }
      
      // 🎯 サブスロットの幅をテキスト長に応じて調整（新規生成時）
      // サブスロットはIDに'-sub-'を含む（クラスはslot-container）
      if (item.SubslotElement && slotElement.id && slotElement.id.includes('-sub-')) {
        const tempSpan = document.createElement('span');
        tempSpan.style.cssText = 'visibility:hidden;position:absolute;white-space:nowrap;font:inherit;font-size:14px;font-weight:600;';
        tempSpan.textContent = item.SubslotElement;
        document.body.appendChild(tempSpan);
        const textWidth = tempSpan.offsetWidth;
        document.body.removeChild(tempSpan);
        
        // テキスト幅 + パディングで最小幅を設定（最小120px）
        // ボタン（32px）+ gap（4px）+ 左右パディング（30px）= 約70px追加
        const requiredWidth = Math.max(120, textWidth + 80);
        slotElement.style.width = requiredWidth + 'px';
        slotElement.style.minWidth = requiredWidth + 'px';
        console.log(`📏 サブスロット幅調整（新規生成）: ${fullSlotId} → ${requiredWidth}px (テキスト: "${item.SubslotElement}")`);
      }
      
      console.log(`✅ サブスロット完全生成（ラベル付き）: ${fullSlotId} | label:"${subslotId.toUpperCase()}" | phrase:"${item.SubslotElement}" | text:"${item.SubslotText}"`);
      
    } catch (err) {
      console.error(`❌ サブスロット処理エラー: ${err.message}`, item);
    }
  });
  
  console.log("✅ サブスロット同期完了（完全リセット＋再構築）");
  
  // 🆕 サブスロット同期後にスロット幅調整を実行
  setTimeout(() => {
    if (typeof window.adjustSlotWidthsBasedOnText === 'function') {
      window.adjustSlotWidthsBasedOnText();
    }
  }, 50);
  
  // 🏷️ サブスロット同期後にラベルを復元
  setTimeout(() => {
    if (window.restoreSubslotLabels) {
      window.restoreSubslotLabels();
      console.log("🏷️ サブスロット同期後のラベル復元を実行しました");
    }
    
    // 🖼 画像処理：この処理はラベル復元内で統合実行されるため、ここでは削除
    // if (typeof window.processAllImagesWithCoordination === 'function') {
    //   window.processAllImagesWithCoordination();
    // }
  }, 100);
  
  // 🎤 音声読み上げ用データの更新（サブスロット同期完了後）
  setTimeout(() => {
    // 受け取ったdataをそのまま音声用データとして格納
    window.currentDisplayedSentence = data.map(slot => ({ ...slot }));
    console.log(`🎤 音声用データ更新完了（サブスロット同期後）: ${window.currentDisplayedSentence.length}件`);
    console.log(`🎤 音声用データ詳細:`, window.currentDisplayedSentence.map(s => `${s.Slot}: ${s.SlotPhrase || s.SubslotElement}`));
  }, 150);
}

// 特定のM1スロットをテスト（デバッグ用）
function debugM1Slot() {
  if (!window.loadedJsonData) {
    console.warn("⚠ window.loadedJsonData が存在しないためM1デバッグできません");
    return;
  }
  
  const m1Data = window.loadedJsonData.find(item => 
    item.Slot.toLowerCase() === "m1" && item.SubslotID === "" && item.PhraseType === "word"
  );
  
  if (!m1Data) {
    console.warn("⚠ M1の上位スロットデータが見つかりません");
    return;
  }
  
  console.log("🔍 M1スロットデバッグ - データ:", m1Data);
  
  // M1スロットを直接取得
  const m1Container = document.getElementById("slot-m1");
  if (!m1Container) {
    console.warn("⚠ slot-m1要素が見つかりません");
    return;
  }
  
  // M1の構造を確認
  console.log("📋 M1スロット構造:", m1Container.outerHTML.substring(0, 200));
  
  // 直接の子要素としてのslot-phrase
  const phraseDiv = m1Container.querySelector(":scope > .slot-phrase");
  console.log("📌 M1の直接子としてのslot-phrase:", phraseDiv ? phraseDiv.outerHTML : "未検出");
  
  if (phraseDiv) {
    // 値を設定
    phraseDiv.textContent = m1Data.SlotPhrase || "";
    console.log("✅ M1 phrase値設定:", m1Data.SlotPhrase);
  } else {
    console.warn("⚠ M1にslot-phrase要素がないか、直接の子要素ではありません");
  }
  
  // slot-textの処理
  const textDiv = m1Container.querySelector(":scope > .slot-text");
  if (textDiv) {
    // 入れ子のslot-phraseを確認
    const nestedPhraseDiv = textDiv.querySelector(".slot-phrase");
    console.log("📌 M1のslot-text内のslot-phrase:", nestedPhraseDiv ? nestedPhraseDiv.outerHTML : "未検出");
    
    if (nestedPhraseDiv) {
      // 入れ子のslot-phraseも念のためクリア
      nestedPhraseDiv.textContent = "";
    }
    
    // テキストノードを適切に設定 - 安全に処理
    if (textDiv.firstChild && textDiv.firstChild.nodeType === Node.TEXT_NODE) {
      textDiv.firstChild.textContent = m1Data.SlotText || "";
    } else {
      // firstChildがない場合や適切なノードでない場合は新しくテキストノードを作成
      textDiv.textContent = ""; // 既存のコンテンツをクリア
      textDiv.append(document.createTextNode(m1Data.SlotText || ""));
    }
    console.log("✅ M1 text値設定:", m1Data.SlotText);
  } else {
    console.warn("⚠ M1にslot-text要素が見つかりません");
  }
}

// グローバルにエクスポートする（index.htmlから呼び出せるように）
window.syncUpperSlotsFromJson = syncUpperSlotsFromJson;
window.syncSubslotsFromJson = syncSubslotsFromJson;

// 🎯 メタレベル制御関数をグローバルに公開
window.setSubslotVisibility = setSubslotVisibility;
window.getSubslotVisibility = getSubslotVisibility;
window.applySubslotVisibilityControl = applySubslotVisibilityControl;

// 🎯 O1サブスロット制御のテスト関数
window.hideO1Subslot = function() {
  setSubslotVisibility('o1', false);
  console.log('🎯 O1サブスロットを非表示に設定');
};

window.showO1Subslot = function() {
  setSubslotVisibility('o1', true);
  console.log('🎯 O1サブスロットを表示に設定');
};

window.testO1SubslotControl = function() {
  console.log('🎯 O1サブスロット制御テスト開始');
  console.log('現在の設定:', getSubslotVisibility('o1'));
  
  // 現在の設定を切り替え
  const currentVisible = getSubslotVisibility('o1');
  setSubslotVisibility('o1', !currentVisible);
  
  console.log('変更後の設定:', getSubslotVisibility('o1'));
  console.log('🎯 個別ランダマイズを実行して効果を確認してください');
};


/**
 * window.loadedJsonDataを使用してサブスロットを正しい順序で静的エリアに書き込む関数
 * @param {Array} jsonData - window.loadedJsonData
 */
function syncSubslotsWithCorrectOrder(jsonData) {
  if (!jsonData || !Array.isArray(jsonData)) {
    console.warn("⚠ syncSubslotsWithCorrectOrder: 無効なデータです");
    return;
  }

  console.log("🔄 === サブスロット順序修正処理を開始 ===");

  // サブスロットデータのみを抽出し、display_orderでソート
  const subslotData = jsonData.filter(item => item.SubslotID && item.SubslotID !== "");
  
  console.log(`📊 サブスロット総数: ${subslotData.length}`);

  // 親スロット別にグループ化
  const groupedByParent = {};
  subslotData.forEach(item => {
    const parentSlot = item.Slot.toLowerCase();
    if (!groupedByParent[parentSlot]) {
      groupedByParent[parentSlot] = [];
    }
    groupedByParent[parentSlot].push(item);
  });

  // 各親スロットのサブスロットを display_order でソート
  Object.keys(groupedByParent).forEach(parentSlot => {
    const subslots = groupedByParent[parentSlot];
    
    // display_orderでソート
    subslots.sort((a, b) => {
      const orderA = a.display_order || 0;
      const orderB = b.display_order || 0;
      return orderA - orderB;
    });

    console.log(`🔢 ${parentSlot}のサブスロット順序:`);
    subslots.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.SubslotID} (order: ${item.display_order}) - "${item.SubslotElement}"`);
    });

    // 各サブスロットを順序通りに静的エリアに書き込み
    subslots.forEach(item => {
      // 🔧 修正：SubslotIDから'sub-'プレフィックスを除去
      const cleanSubslotId = item.SubslotID.replace(/^sub-/, '');
      const fullSlotId = `slot-${parentSlot}-sub-${cleanSubslotId.toLowerCase()}`;
      const slotElement = document.getElementById(fullSlotId);

      if (slotElement) {
        // phraseとtextを更新
        const phraseElement = slotElement.querySelector(".slot-phrase");
        const textElement = slotElement.querySelector(".slot-text");

        if (phraseElement && item.SubslotElement) {
          phraseElement.textContent = item.SubslotElement;
          console.log(`✅ [${fullSlotId}] phrase: "${item.SubslotElement}"`);
        }

        if (textElement && item.SubslotText) {
          textElement.textContent = item.SubslotText;
          console.log(`✅ [${fullSlotId}] text: "${item.SubslotText}"`);
        }

        // CSSのorderプロパティも設定（DOM順序を上書き）
        slotElement.style.order = item.display_order || 0;
        console.log(`✅ [${fullSlotId}] CSS order: ${item.display_order || 0}`);
      } else {
        console.warn(`⚠ サブスロット要素が見つかりません: ${fullSlotId}`);
      }
    });
  });

  console.log("✅ === サブスロット順序修正処理が完了 ===");
}

// グローバルにエクスポート
window.syncSubslotsWithCorrectOrder = syncSubslotsWithCorrectOrder;

/**
 * 空のスロットを非表示にする機構
 * @param {Array} jsonData - window.loadedJsonData
 */
function hideEmptySlots(jsonData) {
  if (!jsonData || !Array.isArray(jsonData)) {
    console.warn("⚠ hideEmptySlots: 無効なデータです");
    return;
  }

  console.log("🙈 === 空のスロット非表示処理を開始 ===");
  console.log(`📊 処理対象データ件数: ${jsonData.length}`);

  // 1. 上位スロットの表示/非表示制御
  console.log("1️⃣ 上位スロット非表示処理を開始");
  hideEmptyUpperSlots(jsonData);
  
  // 2. サブスロットの表示/非表示制御
  console.log("2️⃣ サブスロット非表示処理を開始");
  hideEmptySubslots(jsonData);
  
  // 3. サブスロットコンテナの表示/非表示制御（全てのサブスロットが非表示の場合）
  console.log("3️⃣ サブスロットコンテナ非表示処理を開始");
  hideEmptySubslotContainers();

  // 4. 分離疑問詞エリアの表示/非表示制御
  console.log("4️⃣ 分離疑問詞エリア非表示処理を開始");
  hideEmptyQuestionWordArea(jsonData);

  console.log("✅ === 空のスロット非表示処理が完了 ===");
}

/**
 * 空の上位スロットを非表示にする（改良版：サブスロットの存在も考慮）
 * @param {Array} jsonData - JSONデータ
 */
function hideEmptyUpperSlots(jsonData) {
  // 上位スロットデータを取得
  const upperSlots = jsonData.filter(item => 
    item.SubslotID === "" && item.PhraseType === "word"
  );

  console.log(`🔍 上位スロット非表示チェック: ${upperSlots.length}件`);

  upperSlots.forEach(item => {
    const slotId = `slot-${item.Slot.toLowerCase()}`;
    const slotElement = document.getElementById(slotId);
    
    if (!slotElement) {
      console.warn(`⚠ 上位スロット要素が見つかりません: ${slotId}`);
      return;
    }

    // 上位スロット自体が空かどうかを判定
    const upperSlotIsEmpty = (!item.SlotPhrase || item.SlotPhrase.trim() === "") && 
                           (!item.SlotText || item.SlotText.trim() === "");

    // この上位スロットに関連するサブスロットを確認
    const relatedSubslots = jsonData.filter(subItem => 
      subItem.Slot.toLowerCase() === item.Slot.toLowerCase() && 
      subItem.SubslotID && 
      subItem.SubslotID !== ""
    );

    // 関連サブスロットのうち、空でないものがあるかチェック
    const hasNonEmptySubslots = relatedSubslots.some(subItem => 
      (subItem.SubslotElement && subItem.SubslotElement.trim() !== "") ||
      (subItem.SubslotText && subItem.SubslotText.trim() !== "")
    );

    console.log(`🔍 上位スロット [${item.Slot}]:`);
    console.log(`  - 上位スロット自体が空: ${upperSlotIsEmpty}`);
    console.log(`  - 関連サブスロット数: ${relatedSubslots.length}`);
    console.log(`  - 空でないサブスロットあり: ${hasNonEmptySubslots}`);

    // 判定：上位スロット自体が空 かつ 空でないサブスロットがない場合のみ非表示
    const shouldHide = upperSlotIsEmpty && !hasNonEmptySubslots;

    if (shouldHide) {
      slotElement.style.display = "none";
      slotElement.classList.add("empty-slot-hidden", "hidden");
      console.log(`🙈 上位スロットを非表示: ${slotId} (理由: 上位・サブスロット共に空)`);
    } else {
      slotElement.style.display = "";
      slotElement.classList.remove("empty-slot-hidden", "hidden");
      if (upperSlotIsEmpty && hasNonEmptySubslots) {
        console.log(`👁 上位スロットを表示: ${slotId} (理由: サブスロットに内容あり)`);
      } else if (!upperSlotIsEmpty) {
        console.log(`👁 上位スロットを表示: ${slotId} (理由: 上位スロットに内容あり)`);
      }
    }
  });
}

/**
 * 空のサブスロットを非表示にする
 * @param {Array} jsonData - JSONデータ
 */
function hideEmptySubslots(jsonData) {
  // サブスロットデータを取得
  const subSlots = jsonData.filter(item => 
    item.SubslotID && item.SubslotID !== ""
  );

  console.log(`🔍 サブスロット非表示チェック: ${subSlots.length}件`);

  subSlots.forEach(item => {
    const parentSlot = item.Slot.toLowerCase();
    const subslotId = item.SubslotID.toLowerCase();
    const fullSlotId = `slot-${parentSlot}-${subslotId}`;
    const slotElement = document.getElementById(fullSlotId);
    
    if (!slotElement) {
      console.warn(`⚠ サブスロット要素が見つかりません: ${fullSlotId}`);
      return;
    }

    // DisplayAtTop対象は非表示判定から除外
    const displayAtTopItem = jsonData.find(d => d.DisplayAtTop);
    const isDisplayAtTopTarget = displayAtTopItem && 
                                displayAtTopItem.DisplayText && 
                                item.SubslotElement === displayAtTopItem.DisplayText;

    if (isDisplayAtTopTarget) {
      // DisplayAtTop対象は強制的に非表示（別途上部に表示されるため）
      slotElement.style.display = "none";
      slotElement.classList.add("display-at-top-hidden", "hidden");
      console.log(`🚫 DisplayAtTop対象サブスロットを非表示: ${fullSlotId}`);
      return;
    }

    // 空かどうかを判定（SubslotElementとSubslotTextが両方とも空）
    const isEmpty = (!item.SubslotElement || item.SubslotElement.trim() === "") && 
                   (!item.SubslotText || item.SubslotText.trim() === "");

    if (isEmpty) {
      slotElement.style.display = "none";
      slotElement.classList.add("empty-slot-hidden", "hidden");
      console.log(`🙈 サブスロットを非表示: ${fullSlotId}`);
    } else {
      slotElement.style.display = "";
      slotElement.classList.remove("empty-slot-hidden", "display-at-top-hidden", "hidden");
      console.log(`👁 サブスロットを表示: ${fullSlotId}`);
    }
  });
}

/**
 * 全てのサブスロットが非表示の場合、サブスロットコンテナも非表示にする
 */
function hideEmptySubslotContainers() {
  // 全てのサブスロットコンテナを取得
  const subslotContainers = document.querySelectorAll('[id^="slot-"][id$="-sub"]');
  
  console.log(`🔍 サブスロットコンテナ非表示チェック: ${subslotContainers.length}件`);

  subslotContainers.forEach(container => {
    // コンテナ内の全サブスロット要素を取得
    const subslots = container.querySelectorAll('[id*="-sub-"]');
    
    if (subslots.length === 0) {
      // サブスロットが存在しない場合は非表示
      container.style.display = "none";
      container.classList.add("empty-container-hidden", "hidden");
      console.log(`🙈 空のサブスロットコンテナを非表示: ${container.id}`);
      return;
    }

    // 表示されているサブスロットの数をカウント
    const visibleSubslots = Array.from(subslots).filter(subslot => 
      window.getComputedStyle(subslot).display !== "none"
    );

    if (visibleSubslots.length === 0) {
      // 全てのサブスロットが非表示の場合、コンテナも非表示
      container.style.display = "none";
      container.classList.add("empty-container-hidden", "hidden");
      console.log(`🙈 全サブスロット非表示のためコンテナを非表示: ${container.id}`);
    } else {
      // 表示されているサブスロットがある場合、コンテナを表示
      container.style.display = "";
      container.classList.remove("empty-container-hidden", "hidden");
      console.log(`👁 サブスロットコンテナを表示: ${container.id} (表示中サブスロット: ${visibleSubslots.length}件)`);
    }
  });
}

/**
 * 分離疑問詞エリアの表示/非表示制御
 * @param {Array} jsonData - JSONデータ
 */
function hideEmptyQuestionWordArea(jsonData) {
  const questionWordArea = document.getElementById("display-top-question-word");
  
  if (!questionWordArea) {
    console.log("ℹ️ 分離疑問詞エリア要素が見つかりません");
    return;
  }

  // DisplayAtTopフラグを持つアイテムがあるかチェック
  const displayAtTopItem = jsonData?.find(d => d.DisplayAtTop && d.DisplayText && d.DisplayText.trim() !== "");
  
  if (displayAtTopItem) {
    // DisplayAtTopアイテムがある場合は、エリア自体は表示可能状態にする（但し、制御パネルの設定は尊重）
    questionWordArea.classList.remove("empty-slot-hidden");
    console.log(`✅ 分離疑問詞エリアにデータあり: ${displayAtTopItem.DisplayText} (制御パネル設定は維持)`);
    
    // 🔹 制御パネルの設定は一切変更しない - 既に復元処理で適切に設定済み
    
  } else {
    // DisplayAtTopアイテムがない場合のみ非表示
    questionWordArea.style.display = "none";
    questionWordArea.classList.add("empty-slot-hidden", "hidden");
    questionWordArea.classList.remove("visible");
    console.log("🙈 分離疑問詞エリアを非表示 (DisplayAtTopデータなし)");
  }
}

// 指定されたコンテナ内のサブスロットを order に従ってDOMを直接並べ替える関数
function reorderSubslotsInContainer(container, jsonData) {
  if (!container || !jsonData) {
    console.warn("⚠ reorderSubslotsInContainer: コンテナまたはデータがありません");
    return;
  }
  const subslots = container.querySelectorAll(".subslot");
  if (subslots.length <= 1) {
    console.log(`ℹ️ ${container.id} には並べ替えが必要なサブスロットが1つ以下です`);
    return; // 並べ替える必要なし
  }

  console.log(`🔢 DOM並べ替え実行: ${container.id} (${subslots.length}個の要素)`);

  // container.id = "slot-m1-sub" -> parentSlotId = "m1"
  const parentSlotId = container.id.replace("slot-", "").replace("-sub", "").toUpperCase();
  console.log(`親スロットID: ${parentSlotId}`);

  const elementsWithOrder = Array.from(subslots).map(el => {
    // id例: slot-m1-sub-s, slot-m1-sub-x など
    // サブスロットID部分を正確に抽出
    const match = el.id.match(/^slot-([^-]+)-sub-(.+)$/);
    let slotKey = null, subslotKey = null;
    if (match) {
      slotKey = match[1];
      subslotKey = match[2];
    } else {
      // 旧形式: slot-m1-sub など
      const match2 = el.id.match(/^slot-([^-]+)-sub$/);
      if (match2) {
        slotKey = match2[1];
        subslotKey = '';
      }
    }
    // JSONのSubslotIDと完全一致させる
    let foundData = null;
    if (slotKey !== null) {
      foundData = jsonData.find(d =>
        d.Slot?.toUpperCase() === parentSlotId &&
        ((d.SubslotID?.toLowerCase() === `sub-${subslotKey}`) ||
         (d.SubslotID?.toLowerCase() === subslotKey)) // 柔軟に両方対応
      );
    }
    const order = foundData ? foundData.display_order : 999;
    console.log(`  - サブスロットDOM: ${el.id} → slotKey: ${slotKey}, subslotKey: ${subslotKey}, JSONマッチ: ${!!foundData}, order=${order}`);
    if(foundData){
      console.log(`    ✅ データ発見 (Slot: ${foundData.Slot}, SubslotID: ${foundData.SubslotID}), order=${order}`);
    } else {
      console.log(`    ❌ データ未発見 (親: ${parentSlotId}, subslotKey: ${subslotKey})`);
    }
    return { el, order };
  });

  elementsWithOrder.sort((a, b) => a.order - b.order);

  console.log("📊 ソート後の順序:", elementsWithOrder.map(item => ({id: item.el.id, order: item.order})));
  
  console.log("🔄 DOM要素の再配置を開始");
  elementsWithOrder.forEach(item => {
    container.appendChild(item.el);
  });

  console.log(`✅ DOM並べ替え完了: ${container.id}`);
}

// 新しい順序付け関数
function applyDisplayOrder(data) {
  if (!data || !Array.isArray(data)) {
    console.warn("⚠ applyDisplayOrder: 無効なデータです");
    return;
  }

  console.log("🔢 表示順序の適用を開始します");
  // ⚠️【編集禁止】動的記載エリア(dynamic-slot-area)は読み取り専用です
  const dynamicArea = document.getElementById('dynamic-slot-area');
  // dynamicAreaが存在しない場合は処理を中断
  if (!dynamicArea) {
      console.error("❌ 動的記載エリア #dynamic-slot-area が見つかりません。順序付けを中止します。");
      return;
  }

  // 上位スロットの順序を適用
  const upperSlots = data.filter(item => !item.SubslotID || item.SubslotID === "");
  upperSlots.forEach(item => {
    if (item.Slot && typeof item.Slot_display_order !== 'undefined') {
      const slotElement = document.getElementById(`slot-${item.Slot.toLowerCase()}`);
      // 要素が存在し、かつ動的エリアの子要素ではない場合にのみ処理
      if (slotElement && !dynamicArea.contains(slotElement)) {
        slotElement.style.order = item.Slot_display_order;
        console.log(`✅ 静的上位スロット[${slotElement.id}]に order: ${item.Slot_display_order} を適用`);
      }
    }
  });

  // サブスロットの順序を適用
  const subSlots = data.filter(item => item.SubslotID && item.SubslotID !== "");
  subSlots.forEach(item => {
    if (item.Slot && item.SubslotID && typeof item.display_order !== 'undefined') {
      // 🔧 修正：SubslotIDから'sub-'プレフィックスを除去
      const cleanSubslotId = item.SubslotID.replace(/^sub-/, '');
      const subSlotElement = document.getElementById(`slot-${item.Slot.toLowerCase()}-sub-${cleanSubslotId.toLowerCase()}`);
      // 要素が存在し、かつ動的エリアの子要素ではない場合にのみ処理
      if (subSlotElement && !dynamicArea.contains(subSlotElement)) {
        subSlotElement.style.order = item.display_order;
        console.log(`✅ 静的サブスロット[${subSlotElement.id}]に order: ${item.display_order} を適用`);
      }
    }
  });

  // すべてのサブスロットコンテナに flexbox を適用して order を有効化
  const subSlotContainers = document.querySelectorAll('[id$="-sub"]');
  subSlotContainers.forEach(container => {
      // .visible クラスを持つ（＝表示されている）コンテナのみを対象
      if (container.classList.contains('visible')) {
          container.style.display = 'flex';
          container.style.flexWrap = 'wrap';
          container.style.gap = '8px';
          console.log(`✅ サブスロットコンテナ [${container.id}] にflexboxを適用`);
      }
  });

  console.log("✅ 表示順序の適用が完了しました");
}

console.log("🚀 Line 2736到達: updateAllSlotToggleButtons関数を定義します");

// 🔹 全スロットのOFFボタン（英語・ヒント）表示・非表示を更新（ランダマイズ後に呼び出す）
window.updateAllSlotToggleButtons = function() {
  console.log("🔄 全スロットのOFFボタン（英語・ヒント）表示・非表示を更新");
  
  // 全スロットコンテナを取得
  const allSlotContainers = document.querySelectorAll('[id^="slot-"]');
  
  allSlotContainers.forEach(container => {
    // サブスロットコンテナ（id="slot-xxx-sub"）はスキップ
    if (container.id.endsWith('-sub')) return;
    
    // === 英語OFFボタンの処理 ===
    // phraseRowを取得
    const phraseRow = container.querySelector('.upper-slot-phrase-row');
    if (phraseRow) {
      // .slot-phraseの内容を取得
      const phraseElement = phraseRow.querySelector('.slot-phrase');
      if (phraseElement) {
        const phraseText = phraseElement.textContent?.trim() || '';
        const hasEnglishText = phraseText !== '';
        
        // 英語OFFボタンを取得
        const englishToggleButton = phraseRow.querySelector('.upper-slot-toggle-btn');
        if (englishToggleButton) {
          // 英語テキストがない場合、ボタンを非表示
          if (!hasEnglishText) {
            englishToggleButton.style.display = 'none';
            console.log(`🙈 英語OFFボタン非表示: ${container.id} (英語テキストなし)`);
          } else {
            englishToggleButton.style.display = '';
            console.log(`👁️ 英語OFFボタン表示: ${container.id} (英語テキストあり: "${phraseText.substring(0, 30)}...")`);
          }
        }
      }
    }
    
    // === ヒントOFFボタンの処理 ===
    // textRowを取得
    const textRow = container.querySelector('.upper-slot-text-row');
    if (textRow) {
      // .slot-textの内容を取得
      const textElement = textRow.querySelector('.slot-text');
      if (textElement) {
        const hintText = textElement.textContent?.trim() || '';
        const hasHintText = hintText !== '';
        
        // ヒントOFFボタンを取得
        const hintToggleButton = textRow.querySelector('.upper-slot-auxtext-toggle-btn');
        if (hintToggleButton) {
          // ヒントテキストがない場合、ボタンを非表示
          if (!hasHintText) {
            hintToggleButton.style.display = 'none';
            console.log(`🙈 ヒントOFFボタン非表示: ${container.id} (ヒントテキストなし)`);
          } else {
            hintToggleButton.style.display = '';
            console.log(`👁️ ヒントOFFボタン表示: ${container.id} (ヒントテキストあり: "${hintText.substring(0, 30)}...")`);
          }
        }
      }
    }
  });
  
  console.log("✅ 全スロットのOFFボタン（英語・ヒント）更新完了");
};

// JSONロードエラー対策：try-catchで囲んでエラーを詳細にログ出力
window.safeJsonSync = function(data) {
  try {
    // 重複実行防止のためのフラグ
    if (window.isSyncInProgress) {
      console.log("⏳ 同期処理が既に実行中のため、このリクエストはスキップします");
      return;
    }
    window.isSyncInProgress = true;
    
    console.log("🔄 同期処理を開始します");
    if (!data || !Array.isArray(data)) {
      console.warn("⚠ 同期処理に渡されたデータが無効です:", typeof data);
      if (window.loadedJsonData && Array.isArray(window.loadedJsonData)) {
        console.log("✅ window.loadedJsonDataを代わりに使用します");
        data = window.loadedJsonData;
      } else {
        console.error("❌ 有効なJSONデータがありません");
        window.isSyncInProgress = false;
        
        // 1秒後に再試行
        setTimeout(() => {
          console.log("🔄 JSONデータが無効だったため再試行します");
          if (window.loadedJsonData && Array.isArray(window.loadedJsonData)) {
            window.safeJsonSync(window.loadedJsonData);
          }
        }, 1000);
        return;
      }
    }
    
    // 上位スロット同期を実行
    try {
      syncUpperSlotsFromJson(data);
      console.log("✅ 上位スロットの同期が完了");
    } catch (upperSlotError) {
      console.error("❌ 上位スロット同期中にエラーが発生:", upperSlotError.message);
    }
    
    // サブスロット同期関数があれば実行
    if (typeof syncSubslotsFromJson === 'function') {
      try {
        syncSubslotsFromJson(data);
        console.log("✅ サブスロットの同期が完了");
      } catch (subslotError) {
        console.error("❌ サブスロット同期中にエラーが発生:", subslotError.message);
      }
    }
    
    // 分離疑問詞表示の更新
    try {
      if (typeof displayTopQuestionWord === 'function') {
        displayTopQuestionWord();
        console.log("✅ 分離疑問詞表示の更新が完了");
        
        // 🆕 疑問詞の表示状態を復元（state-manager対応版）
        if (typeof window.toggleQuestionWordVisibility === 'function') {
          
          // state-manager経由で状態を取得
          let questionWordState = null;
          if (window.RephraseState) {
            questionWordState = window.RephraseState.getState('visibility.questionWord');
            console.log("📂 state-manager経由で疑問詞状態を取得:", questionWordState);
          } else {
            // フォールバック：直接localStorage読み込み
            try {
              const saved = localStorage.getItem('rephrase_question_word_visibility');
              if (saved) {
                questionWordState = JSON.parse(saved);
                console.log("📂 直接localStorageから疑問詞状態を取得:", questionWordState);
              }
            } catch (error) {
              console.error("❌ localStorage読み込みエラー:", error);
            }
          }
          
          // 疑問詞のvisibility状態を復元
          if (questionWordState) {
            ['text', 'auxtext'].forEach(elementType => {
              const isVisible = questionWordState[elementType] ?? true;
              window.toggleQuestionWordVisibility(elementType, isVisible);
              console.log(`🔄 疑問詞${elementType}状態を復元: ${isVisible}`);
            });
          } else {
            // 状態がない場合は、グローバル変数からフォールバック取得
            if (typeof window.questionWordVisibilityState === 'object') {
              ['text', 'auxtext'].forEach(elementType => {
                const isVisible = window.questionWordVisibilityState[elementType] ?? true;
                window.toggleQuestionWordVisibility(elementType, isVisible);
                console.log(`🔄 疑問詞${elementType}状態をグローバル変数から復元: ${isVisible}`);
              });
            } else {
              console.log("📝 疑問詞状態が見つからないため、デフォルト表示を維持");
            }
          }
          
          console.log("✅ 疑問詞表示状態の復元が完了");
        } else {
          console.warn("⚠ toggleQuestionWordVisibility関数が見つかりません");
        }
      }
    } catch (displayError) {
      console.error("❌ 分離疑問詞表示更新中にエラーが発生:", displayError.message);
    }
    
    // 新機能：表示順の適用処理
    try {
      // スロットの表示順を適用
      if (typeof applyOrderToAllSlots === 'function') {
        applyOrderToAllSlots(data);
        console.log("✅ スロット表示順の適用が完了");
      }
      
      // 必要に応じて個別のサブスロット順序を適用（特定の上位スロットのみ）
      // M1スロットのサブスロット順序設定例
      if (typeof reorderSubslots === 'function') {
        // もっとも重要な構文スロットのサブスロット順序を整理
        reorderSubslots('slot-m1', data);
        reorderSubslots('slot-s', data);
        reorderSubslots('slot-v', data);
        reorderSubslots('slot-c', data);
        reorderSubslots('slot-o', data);
        console.log("✅ 主要スロットのサブスロット順序適用が完了");
      }

      // ★新しい順序付け関数を呼び出す
      applyDisplayOrder(data);

    } catch (orderError) {
      console.error("❌ 表示順適用中にエラーが発生しました:", orderError.message);
    }
    
    // 空のスロット非表示処理
    try {
      if (typeof hideEmptySlots === 'function') {
        hideEmptySlots(data);
        console.log("✅ 空のスロット非表示処理が完了");
      }
    } catch (hideError) {
      console.error("❌ 空のスロット非表示処理中にエラーが発生:", hideError.message);
    }
    
    // 🎨 複数画像システムの更新（ランダマイズ後の新しいテキストに対して新しいロジックを適用）
    try {
      if (typeof window.refreshAllMultipleImages === 'function') {
        setTimeout(() => {
          window.refreshAllMultipleImages();
          console.log("🎨 ランダマイズ後の複数画像更新完了");
        }, 300); // スロット書き込み完了後に実行
      }
    } catch (imageError) {
      console.error("❌ 複数画像更新中にエラーが発生:", imageError.message);
    }
    
    // 🎛️ 制御パネル状態の初期化（JSONロード完了後）
    try {
      // 制御パネルは初期状態では非表示にする
      if (typeof setControlPanelsVisibility === 'function') {
        setControlPanelsVisibility(false);
        console.log("🎛️ JSONロード完了後：制御パネルを初期状態（非表示）に設定");
      }
      
      // 既存のサブスロット制御パネルも非表示にする
      const existingSubslotPanels = document.querySelectorAll('.subslot-visibility-panel');
      existingSubslotPanels.forEach(panel => {
        panel.style.display = 'none';
        console.log(`🎛️ 既存サブスロット制御パネル ${panel.id} を非表示に設定`);
      });
    } catch (controlPanelError) {
      console.error("❌ 制御パネル初期化中にエラーが発生:", controlPanelError.message);
    }
    
    // 同期完了
    window.isSyncInProgress = false;
  } catch (err) {
    console.error("❌ 同期処理中にエラーが発生しました:", err.message);
    console.error("エラーの詳細:", err.stack);
    window.isSyncInProgress = false; // エラーが発生してもフラグはリセット
  }
};

// ランダマイズ後の同期を確保するためのMutationObserverを設定
// ⚠️【編集禁止】動的記載エリア(dynamic-slot-area)は読み取り専用です
window.setupSyncObserver = function() {
  try {
    // ⚠️【編集禁止】動的エリアの変更を監視（読み取り専用）
    const dynamicArea = document.getElementById("dynamic-slot-area");
    if (!dynamicArea) {
      console.warn("⚠ 監視対象の動的記載エリアが見つかりません");
      return;
    }
    
    console.log("👁 動的記載エリアの監視を開始します");
    
    // 変更の監視設定
    const observer = new MutationObserver(function(mutations) {
      console.log("👀 動的記載エリアに変更を検出しました");
      
      // 処理が重複しないよう、タイマーでデバウンス
      if (window.syncDebounceTimer) {
        clearTimeout(window.syncDebounceTimer);
      }
      
      window.syncDebounceTimer = setTimeout(() => {
        console.log("🔄 変更検出による同期処理を実行します");
        if (window.loadedJsonData) {
          window.safeJsonSync(window.loadedJsonData);
        }
      }, 300); // 300ミリ秒の遅延で実行
    });
    
    // 設定を適用して監視開始
    observer.observe(dynamicArea, { 
      childList: true, 
      subtree: true, 
      characterData: true,
      attributes: true
    });
    
    console.log("✅ MutationObserverの設定が完了しました");
    return observer;
  } catch (err) {
    console.error("❌ 監視設定中にエラーが発生しました:", err.message);
  }
};

// ランダマイザーの監視と同期（ランダマイザー用の特別対応）
window.setupRandomizerSync = function() {
  try {
    // ランダマイズボタンを探す
    const randomizerButtons = document.querySelectorAll('button[data-action="randomize"], button.randomize-button, #randomize-all');
    if (randomizerButtons.length === 0) {
      console.warn("⚠ ランダマイズボタンが見つかりません");
      return;
    }
    
    console.log(`🎲 ランダマイズボタンを ${randomizerButtons.length}個 検出しました`);
    
    // 各ボタンにイベントリスナーを追加
    randomizerButtons.forEach((button, index) => {
      // 既存のイベントハンドラを保持するための対応
      const originalClickHandler = button.onclick;
      
      button.addEventListener('click', function(event) {
        console.log(`🎲 ランダマイズボタンがクリックされました (${index + 1})`);
        
        // ランダマイズ処理完了後に確実に同期処理を行う
        setTimeout(() => {
          console.log("🔄 ランダマイズ後の同期処理を実行します (遅延: 1000ms)");
          if (window.loadedJsonData) {
            // ランダマイズ後は強制的に上位スロットを再同期
            window.DEBUG_SYNC = true; // 詳細ログを有効化
            
            // 表示順制御も再適用
            if (typeof applyOrderToAllSlots === 'function') {
              console.log("🔢 ランダマイズ後のスロット表示順適用");
              applyOrderToAllSlots(window.loadedJsonData);
            }
            
            // 全体の再同期
            window.safeJsonSync(window.loadedJsonData);
            
            // 🆕 表示状態を復元（英語ON/OFF状態を保持）
            if (window.applyVisibilityState) {
              console.log("🎨 ランダマイズ後の表示状態を復元します");
              window.applyVisibilityState();
            }
            
            setTimeout(() => {
              window.DEBUG_SYNC = false; // ログ量を元に戻す
            }, 500);
          }
        }, 1000); // 1000ms（1秒）に延長 - ランダマイズ処理が確実に完了するのを待つ
      }, true); // キャプチャフェーズでイベントをキャッチ
      
      console.log(`✅ ランダマイズボタン(${index + 1})に同期処理を追加しました`);
    });
    
    // window.randomizeAllSlots関数をオーバーライド（存在する場合）
    if (typeof window.randomizeAllSlots === 'function') {
      const originalRandomizeFunc = window.randomizeAllSlots;
      window.randomizeAllSlots = function(...args) {
        console.log("🎲 randomizeAllSlots関数が呼び出されました");
        const result = originalRandomizeFunc.apply(this, args);
        
        // ランダマイズ処理完了後に同期処理を行う
        setTimeout(() => {
          console.log("🔄 randomizeAllSlots後の同期処理を実行します (遅延: 1000ms)");
          if (window.loadedJsonData) {
            // ランダマイズ後は強制的に上位スロットを再同期
            window.DEBUG_SYNC = true; // 詳細ログを有効化
            
            // 表示順制御も再適用
            if (typeof applyOrderToAllSlots === 'function') {
              console.log("🔢 randomizeAllSlots後のスロット表示順適用");
              applyOrderToAllSlots(window.loadedJsonData);
            }
            
            window.safeJsonSync(window.loadedJsonData);
            
            // 🆕 表示状態を復元（英語ON/OFF状態を保持）
            if (window.applyVisibilityState) {
              console.log("🎨 randomizeAllSlots後の表示状態を復元します");
              window.applyVisibilityState();
            }
            
            setTimeout(() => {
              window.DEBUG_SYNC = false; // ログ量を元に戻す
            }, 500);
          }
        }, 1000); // 1000ms（1秒）に延長
        
        return result;
      };
      console.log("✅ randomizeAllSlots関数をオーバーライドしました");
    }
    
    return true;
  } catch (err) {
    console.error("❌ ランダマイザー監視設定中にエラーが発生しました:", err.message);
    return false;
  }
};

// ページ読み込み完了時に監視を開始
document.addEventListener("DOMContentLoaded", function() {
  console.log("🌐 DOMContentLoaded イベント発生");
  
  // 動的エリアの位置調整
  ensureDynamicAreaPosition();
  
  setTimeout(() => {
    window.setupSyncObserver();
    window.setupRandomizerSync();
    
    // 初期同期も実行
    if (window.loadedJsonData) {
      window.safeJsonSync(window.loadedJsonData);
    }
    
    // JSONデータ変更を監視（loadedJsonDataの監視）- 改良版
    let lastJsonDataSignature = "";
    
    // データの特徴的な部分から署名を生成する関数
    function getDataSignature(data) {
      if (!data || !Array.isArray(data) || data.length === 0) return "";
      try {
        // スロットの内容からチェックサムを生成
        const sampleItems = data.slice(0, 3); // 最初の3件のみ使用
        const signature = sampleItems.map(item => 
          `${item.Slot}:${item.SlotPhrase && item.SlotPhrase.substring(0, 10)}`
        ).join('|');
        return signature;
      } catch (e) {
        return "";
      }
    }
    
    // 低頻度で定期チェック (3秒ごと)
    setInterval(() => {
           if (window.loadedJsonData) {
        const newSignature = getDataSignature(window.loadedJsonData);
        if (newSignature && newSignature !== lastJsonDataSignature) {
          console.log("🔄 window.loadedJsonData の実質的な変更を検出");
          window.safeJsonSync(window.loadedJsonData);
          lastJsonDataSignature = newSignature;
        }
      }
      
      // 定期的に動的エリアの位置も確認
      ensureDynamicAreaPosition();
    }, 3000); // 3秒ごとに変更をチェック
    
    // 「詳細」ボタンクリック時に順序を再適用する
    document.body.addEventListener('click', (event) => {
        // クリックされたのが「.slot-container」内の要素かチェック
        const slotContainer = event.target.closest('.slot-container');
        if (slotContainer) {
            console.log('スロットコンテナ内の要素がクリックされました。100ms後に順序を再適用します。');
            // 元のスクリプトがコンテナを表示するのを待つために少し遅延させる
            setTimeout(() => {
                if (window.loadedJsonData) {
                    applyDisplayOrder(window.loadedJsonData);
                }
            }, 100); // 100ミリ秒の遅延
        }
    });
    
  }, 500); // DOMが完全に構築されるのを待つ
});

// ⚠️【編集禁止】動的エリアの位置を調整する関数 - 動的記載エリアは変更厳禁
function ensureDynamicAreaPosition() {
  // ⚠️【編集禁止】動的エリアコンテナを取得（読み取り専用）
  const container = document.getElementById("dynamic-area-container");
  
  // コンテナが存在する場合
  if (container) {
    // コンテナが最後の要素でない場合は移動
    if (container !== document.body.lastElementChild) {
      // すべてのスロット関連要素とサブスロット要素の後に配置する
      document.body.appendChild(container);
      console.log("🔄 動的エリアコンテナを再配置しました");
    }
    
    // ⚠️【編集禁止】動的エリア内部の調整 - DOM構造変更厳禁
    const dynamicArea = document.getElementById("dynamic-slot-area");
    const wrapper = document.getElementById("dynamic-slot-area-wrapper");
    
    if (dynamicArea && wrapper && !wrapper.contains(dynamicArea)) {
      wrapper.appendChild(dynamicArea);
      console.log("🔄 動的エリアをラッパー内に再配置しました");
    }
  }
}

/**
 * デバッグ用：空のスロット検出状況を詳細にレポートする関数
 */
function debugEmptySlots() {
  if (!window.loadedJsonData) {
    console.warn("⚠ window.loadedJsonData が存在しません");
    return;
  }

  console.log("🔍 === 空のスロット検出デバッグ開始 ===");
  
  // 上位スロットの状況確認
  const upperSlots = window.loadedJsonData.filter(item => 
    item.SubslotID === "" && item.PhraseType === "word"
  );
  
  console.log(`📊 上位スロット総数: ${upperSlots.length}`);
  upperSlots.forEach(item => {
    const slotId = `slot-${item.Slot.toLowerCase()}`;
    const slotElement = document.getElementById(slotId);
    const isEmpty = (!item.SlotPhrase || item.SlotPhrase.trim() === "") && 
                   (!item.SlotText || item.SlotText.trim() === "");
    
    console.log(`🔍 上位スロット [${item.Slot}]:`);
    console.log(`  - SlotPhrase: "${item.SlotPhrase}"`);
    console.log(`  - SlotText: "${item.SlotText}"`);
    console.log(`  - isEmpty: ${isEmpty}`);
    console.log(`  - DOM要素存在: ${!!slotElement}`);
    if (slotElement) {
      console.log(`  - 現在のdisplay: ${window.getComputedStyle(slotElement).display}`);
      console.log(`  - クラス: ${slotElement.className}`);
    }
  });

  // サブスロットの状況確認
  const subSlots = window.loadedJsonData.filter(item => 
    item.SubslotID && item.SubslotID !== ""
  );
  
  console.log(`📊 サブスロット総数: ${subSlots.length}`);
  subSlots.forEach(item => {
    const parentSlot = item.Slot.toLowerCase();
    const subslotId = item.SubslotID.toLowerCase();
    const fullSlotId = `slot-${parentSlot}-${subslotId}`;
    const slotElement = document.getElementById(fullSlotId);
    const isEmpty = (!item.SubslotElement || item.SubslotElement.trim() === "") && 
                   (!item.SubslotText || item.SubslotText.trim() === "");

    console.log(`🔍 サブスロット [${item.Slot}-${item.SubslotID}]:`);
    console.log(`  - SubslotElement: "${item.SubslotElement}"`);
    console.log(`  - SubslotText: "${item.SubslotText}"`);
    console.log(`  - isEmpty: ${isEmpty}`);
    console.log(`  - DOM要素存在: ${!!slotElement}`);
    if (slotElement) {
      console.log(`  - 現在のdisplay: ${window.getComputedStyle(slotElement).display}`);
      console.log(`  - クラス: ${slotElement.className}`);
    }
  });

  console.log("✅ === 空のスロット検出デバッグ終了 ===");
}

/**
 * 強制的に空のスロットを非表示にするテスト関数（デバッグ用・改良版）
 */
function forceHideEmptySlots() {
  console.log("🚀 強制的な空のスロット非表示テスト（改良版）を実行");
  
  // 全ての上位スロットを確認
  const allUpperSlots = document.querySelectorAll('[id^="slot-"]:not([id*="-sub"])');
  console.log(`📊 検出された上位スロット: ${allUpperSlots.length}件`);
  
  allUpperSlots.forEach(slot => {
    const phraseEl = slot.querySelector('.slot-phrase');
    const textEl = slot.querySelector('.slot-text');
    
    const phraseText = phraseEl ? phraseEl.textContent.trim() : '';
    const textText = textEl ? textEl.textContent.trim() : '';
    
    // この上位スロットに関連するサブスロットを確認
    const slotName = slot.id.replace('slot-', '');
    const relatedSubSlots = document.querySelectorAll(`[id^="slot-${slotName}-sub-"]`);
    
    // 関連サブスロットに内容があるかチェック
    let hasNonEmptySubslots = false;
    relatedSubSlots.forEach(subSlot => {
      const subPhraseEl = subSlot.querySelector('.slot-phrase');
      const subTextEl = subSlot.querySelector('.slot-text');
      const subPhraseText = subPhraseEl ? subPhraseEl.textContent.trim() : '';
      const subTextText = subTextEl ? subTextEl.textContent.trim() : '';
      
      if (subPhraseText !== '' || subTextText !== '') {
        hasNonEmptySubslots = true;
      }
    });
    
    console.log(`🔍 ${slot.id}:`);
    console.log(`  - phrase: "${phraseText}"`);
    console.log(`  - text: "${textText}"`);
    console.log(`  - 関連サブスロット数: ${relatedSubSlots.length}`);
    console.log(`  - 空でないサブスロットあり: ${hasNonEmptySubslots}`);
    
    // 判定：上位スロット自体が空 かつ 空でないサブスロットがない場合のみ非表示
    const upperSlotIsEmpty = phraseText === '' && textText === '';
    const shouldHide = upperSlotIsEmpty && !hasNonEmptySubslots;
    
    if (shouldHide) {
      console.log(`  🙈 空のため非表示に設定: ${slot.id}`);
      slot.style.display = 'none';
      slot.classList.add('empty-slot-hidden', 'hidden');
    } else {
      console.log(`  👁 表示維持: ${slot.id} (理由: ${!upperSlotIsEmpty ? '上位スロットに内容' : 'サブスロットに内容'})`);
      slot.style.display = '';
      slot.classList.remove('empty-slot-hidden', 'hidden');
    }
  });
  
  // サブスロットの処理は従来通り
  const allSubSlots = document.querySelectorAll('[id*="-sub-"]');
  console.log(`📊 検出されたサブスロット: ${allSubSlots.length}件`);
  
  allSubSlots.forEach(slot => {
    const phraseEl = slot.querySelector('.slot-phrase');
    const textEl = slot.querySelector('.slot-text');
    
    const phraseText = phraseEl ? phraseEl.textContent.trim() : '';
    const textText = textEl ? textEl.textContent.trim() : '';
    
    console.log(`🔍 ${slot.id}:`);
    console.log(`  - phrase: "${phraseText}"`);
    console.log(`  - text: "${textText}"`);
    
    if (phraseText === '' && textText === '') {
      console.log(`  🙈 空のため非表示に設定: ${slot.id}`);
      slot.style.display = 'none';
      slot.classList.add('empty-slot-hidden', 'hidden');
    } else {
      console.log(`  👁 内容があるため表示: ${slot.id}`);
      slot.style.display = '';
      slot.classList.remove('empty-slot-hidden', 'hidden');
    }
  });
}

// 🆕 テキスト長に応じたスロット幅動的調整システム（パフォーマンス最適化版）

// デバウンス機能：連続する調整要求を統合
let adjustWidthsTimeout = null;
let adjustWidthsPending = false;

function debounceAdjustSlotWidths() {
  if (adjustWidthsTimeout) {
    clearTimeout(adjustWidthsTimeout);
  }
  
  if (adjustWidthsPending) {
    return; // 既に実行待ちの場合はスキップ
  }
  
  adjustWidthsPending = true;
  adjustWidthsTimeout = setTimeout(() => {
    adjustSlotWidthsBasedOnTextOptimized();
    adjustWidthsPending = false;
    adjustWidthsTimeout = null;
  }, 50); // 50ms後に実行（バッチ処理）
}

function adjustSlotWidthsBasedOnText() {
  // デバウンス版を呼び出し
  debounceAdjustSlotWidths();
}

function adjustSlotWidthsBasedOnTextOptimized() {
  console.log("🔧 スロット幅の動的調整を開始（最適化版）");
  
  // DOM操作をバッチ処理するため、全体を非表示にしてから一括更新
  const mainContainer = document.querySelector('.slots-container') || document.body;
  const originalVisibility = mainContainer.style.visibility;
  
  // 視覚的なちらつきを防ぐ
  mainContainer.style.visibility = 'hidden';
  
  // 🎯 親スロットのみを対象にする（サブスロットはCSSのみで制御）
  const slotContainers = document.querySelectorAll('.slot-container');
  
  // 🔄 既存のインラインスタイル幅をリセット（ランダマイズ時に前の値が残らないように）
  slotContainers.forEach(container => {
    container.style.width = '';
    container.style.minWidth = '';
    container.style.maxWidth = '';
  });
  const measurements = []; // 測定結果をバッチ処理
  
  // Step 1: 全ての測定を一括実行（DOM操作を最小化）
  const tempContainer = document.createElement('div');
  tempContainer.style.cssText = 'position: absolute; visibility: hidden; top: -9999px; left: -9999px;';
  document.body.appendChild(tempContainer);
  
  slotContainers.forEach(container => {
    // 分離疑問詞エリアは幅調整から除外（単一単語のため）
    if (container.id === 'display-top-question-word') {
      console.log(`⏭ ${container.id}: 分離疑問詞エリアのため幅調整をスキップ`);
      return;
    }
    
    // 🎯 親スロット直下の.slot-phraseのみを取得（サブスロット内のテキストを除外）
    // :scope > で直接の子要素のみを選択
    const phraseElement = container.querySelector(':scope > .slot-phrase');
    const textElement = container.querySelector(':scope > .slot-text');
    
    if (!phraseElement && !textElement) return;
    
    // テキストの実際の表示幅を計算
    const phraseText = phraseElement ? phraseElement.textContent.trim() : '';
    const auxText = textElement ? textElement.textContent.trim() : '';
    
    let maxTextWidth = 0;
    
    // 英語テキスト（phraseElement）の表示幅を計算（バッチ処理）
    if (phraseText && phraseElement) {
      const tempSpan = document.createElement('span');
      tempSpan.style.font = window.getComputedStyle(phraseElement).font;
      tempSpan.textContent = phraseText;
      tempContainer.appendChild(tempSpan);
      maxTextWidth = Math.max(maxTextWidth, tempSpan.offsetWidth);
      tempContainer.removeChild(tempSpan);
    }
    
    // 補助テキスト（textElement）の表示幅を計算（バッチ処理）
    if (auxText && textElement) {
      const tempSpan = document.createElement('span');
      tempSpan.style.font = window.getComputedStyle(textElement).font;
      tempSpan.textContent = auxText;
      tempContainer.appendChild(tempSpan);
      maxTextWidth = Math.max(maxTextWidth, tempSpan.offsetWidth);
      tempContainer.removeChild(tempSpan);
    }
    
    // 実際の表示幅 + パディング + マージンを考慮して適切な幅を設定
    const padding = 60; // パディング・ボーダー・マージンの合計（増加）
    let targetWidth = Math.max(200, maxTextWidth + padding); // 最小幅200px（増加）
    
    // 長いテキストの場合はさらに余裕を持たせる
    if (maxTextWidth > 150) {
      targetWidth = maxTextWidth + 80; // より長いテキストには追加の余白
    }
    
    // 最大幅制限（画面幅の80%程度まで）
    const maxWidth = Math.min(800, window.innerWidth * 0.8);
    targetWidth = Math.min(targetWidth, maxWidth);
    
    // 測定結果を保存（まだ適用しない）
    measurements.push({
      container,
      targetWidth,
      maxTextWidth,
      phraseText,
      auxText,
      containerId: container.id
    });
  });
  
  // Step 2: 測定用コンテナを削除
  document.body.removeChild(tempContainer);
  
  // Step 3: 全ての幅を一括適用（レイアウト計算を一度だけ実行）
  measurements.forEach(measurement => {
    measurement.container.style.width = measurement.targetWidth + 'px';
    measurement.container.style.minWidth = measurement.targetWidth + 'px';
    
    console.log(`📏 ${measurement.containerId}: 英語テキスト幅=${measurement.phraseText ? measurement.maxTextWidth : 0}px, 補助テキスト幅=${measurement.auxText ? 'calculated' : 0}px, 最大幅=${measurement.maxTextWidth}px, 適用幅=${measurement.targetWidth}px`);
  });
  
  // Step 4: 可視性を復元（全ての調整完了後）
  mainContainer.style.visibility = originalVisibility;
  
  console.log(`✅ スロット幅調整完了（${measurements.length}個のスロットを最適化処理）`);
}

/**
 * 🎤 DOMから音声読み上げ用データを更新する関数
 */
function updateVoiceDataFromDOM() {
  console.log("🎤 DOMから音声読み上げ用データを更新中...");
  
  const voiceData = [];
  
  // 上位スロットの取得
  const slotNames = ['m1', 's', 'aux', 'm2', 'v', 'c1', 'o1', 'o2', 'c2', 'm3'];
  
  slotNames.forEach(slotName => {
    const slotElement = document.getElementById(`slot-${slotName}`);
    if (slotElement) {
      const phraseElement = slotElement.querySelector(':scope > .slot-phrase');
      if (phraseElement && phraseElement.textContent.trim()) {
        // 表示されているテキストから音声用データを作成
        voiceData.push({
          Slot: slotName.toUpperCase(),
          SlotPhrase: phraseElement.textContent.trim(),
          Slot_display_order: getSlotDisplayOrder(slotName),
          PhraseType: 'word'
        });
        console.log(`🎤 上位スロット追加: ${slotName.toUpperCase()} = "${phraseElement.textContent.trim()}"`);
      }
    }
  });
  
  // 疑問詞の取得
  const questionWordElement = document.querySelector('#display-top-question-word .question-word-text');
  if (questionWordElement && questionWordElement.textContent.trim()) {
    voiceData.unshift({
      Slot: 'question-word',
      SlotPhrase: questionWordElement.textContent.trim(),
      Slot_display_order: -1,
      PhraseType: 'word'
    });
    console.log(`🎤 疑問詞追加: "${questionWordElement.textContent.trim()}"`);
  }
  
  // サブスロットの取得
  const subslotElements = document.querySelectorAll('.subslot');
  subslotElements.forEach(subElement => {
    const subElementText = subElement.querySelector('.subslot-element');
    if (subElementText && subElementText.textContent.trim()) {
      const subslotId = subElement.id; // slot-s-sub-s-1 のような形式
      const matches = subslotId.match(/slot-(\w+)-sub-/);
      const parentSlot = matches ? matches[1].toUpperCase() : 'UNKNOWN';
      
      voiceData.push({
        Slot: parentSlot,
        SubslotElement: subElementText.textContent.trim(),
        SubslotID: subslotId,
        display_order: parseInt(subElement.dataset.displayOrder) || 0,
        PhraseType: 'clause'
      });
      console.log(`🎤 サブスロット追加: ${parentSlot} = "${subElementText.textContent.trim()}"`);
    }
  });
  
  // 音声用データを保存
  window.currentDisplayedSentence = voiceData;
  console.log(`🎤 音声用データ更新完了: ${voiceData.length}件`);
  console.log('🎤 音声用データ詳細:', voiceData.map(s => `${s.Slot}: ${s.SlotPhrase || s.SubslotElement}`));
}

/**
 * スロット名から display_order を取得する関数
 */
function getSlotDisplayOrder(slotName) {
  const orderMap = {
    'm1': 1, 's': 2, 'aux': 3, 'm2': 4, 'v': 5,
    'c1': 6, 'o1': 7, 'o2': 8, 'c2': 9, 'm3': 10
  };
  return orderMap[slotName.toLowerCase()] || 0;
}

// 🆕 スロット幅調整をグローバル関数として公開
window.adjustSlotWidthsBasedOnText = adjustSlotWidthsBasedOnText;

// デバッグ用関数：サブスロット大文字化・句読点処理の状況を確認
window.debugSubslotPunctuation = function() {
  console.log('=== サブスロット大文字化・句読点処理デバッグ ===');
  
  // LocalStorageの情報を確認
  const storedInfo = localStorage.getItem('sentencePositionInfo');
  console.log('📖 LocalStorage情報:', storedInfo);
  
  if (storedInfo) {
    try {
      const sentencePositionInfo = JSON.parse(storedInfo);
      console.log('📖 解析済み情報:', sentencePositionInfo);
      
      // 現在のlastSelectedSlotsを確認
      if (window.lastSelectedSlots) {
        console.log('📊 現在のlastSelectedSlots:', window.lastSelectedSlots);
        
        // サブスロットのみを抽出
        const subslots = window.lastSelectedSlots.filter(slot => slot.SubslotID);
        console.log('📊 サブスロット一覧:', subslots);
        
        // 文頭・文末スロットのサブスロットを特定
        const firstSlotSubslots = subslots.filter(slot => slot.Slot === sentencePositionInfo.firstSlot)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        const lastSlotSubslots = subslots.filter(slot => slot.Slot === sentencePositionInfo.lastSlot)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        
        console.log('📊 文頭スロット(' + sentencePositionInfo.firstSlot + ')のサブスロット:', firstSlotSubslots);
        console.log('📊 文末スロット(' + sentencePositionInfo.lastSlot + ')のサブスロット:', lastSlotSubslots);
        
        if (firstSlotSubslots.length > 0) {
          console.log('🎯 文頭対象サブスロット:', firstSlotSubslots[0].SubslotID, '- SubslotText:', firstSlotSubslots[0].SubslotText);
        }
        if (lastSlotSubslots.length > 0) {
          console.log('🎯 文末対象サブスロット:', lastSlotSubslots[lastSlotSubslots.length - 1].SubslotID, '- SubslotText:', lastSlotSubslots[lastSlotSubslots.length - 1].SubslotText);
        }
      }
    } catch (error) {
      console.error('❌ LocalStorage情報の解析エラー:', error);
    }
  }
  
  console.log('=== デバッグ終了 ===');
};

// 🎨 全スロットの複数画像を新しいロジックで再描画する関数
function refreshAllMultipleImages() {
  console.log('🎨 全スロット複数画像再描画開始');
  
  // 対象スロットの定義
  const allSlotIds = [
    'slot-m1', 'slot-s', 'slot-aux', 'slot-m2', 'slot-v', 
    'slot-c1', 'slot-o1', 'slot-o2', 'slot-c2', 'slot-m3'
  ];
  
  // サブスロットも含める
  const subSlotIds = [];
  document.querySelectorAll('.subslot').forEach(subslot => {
    if (subslot.id) {
      subSlotIds.push(subslot.id);
    }
  });
  
  const targetSlots = [...allSlotIds, ...subSlotIds];
  
  let refreshCount = 0;
  
  targetSlots.forEach(slotId => {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    
    // 既存の複数画像コンテナがあるかチェック
    const existingContainer = slot.querySelector('.multi-image-container');
    
    if (existingContainer) {
      // テキスト内容を取得
      const phraseElement = slot.querySelector('.slot-phrase, .subslot-element');
      const phraseText = phraseElement ? phraseElement.textContent.trim() : '';
      
      if (phraseText) {
        console.log(`🔄 ${slotId} の複数画像を新しいロジックで再描画: "${phraseText}"`);
        
        // 既存コンテナを削除
        existingContainer.remove();
        
        // 新しいロジックで再描画（非同期で実行してパフォーマンス向上）
        setTimeout(() => {
          if (typeof window.applyMultipleImagesToSlot === 'function') {
            window.applyMultipleImagesToSlot(slotId, phraseText, true);
          }
        }, refreshCount * 100); // 順次実行で負荷分散
        
        refreshCount++;
      }
    }
  });
  
  console.log(`🎨 複数画像再描画完了: ${refreshCount}個のスロットを処理`);
}

// データ書き込み完了後に複数画像を自動再描画
window.addEventListener('load', function() {
  // ページ読み込み完了後、少し遅延してから実行
  setTimeout(() => {
    if (typeof refreshAllMultipleImages === 'function') {
      refreshAllMultipleImages();
    }
  }, 2000); // 2秒後に実行（全画像読み込み完了を待つ）
});

// グローバル関数として公開
window.refreshAllMultipleImages = refreshAllMultipleImages;
