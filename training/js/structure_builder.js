
function renderSlot(item) {
  console.log("renderSlot item:", item); 
  const slotDiv = document.createElement('div');
  slotDiv.className = 'slot';
  slotDiv.dataset.displayOrder = item.Slot_display_order;
  
  // 🎤 音声システム用：data-slot属性を追加
  slotDiv.dataset.slot = item.Slot.toLowerCase();

  if (item.PhraseType === 'word') {
    const phraseDiv = document.createElement('div');
    phraseDiv.className = 'slot-phrase';
    phraseDiv.innerText = item.SlotPhrase || '';

    const textDiv = document.createElement('div');
    textDiv.className = 'slot-text';
    textDiv.innerText = item.SlotText || '';

    slotDiv.appendChild(phraseDiv);
    slotDiv.appendChild(textDiv);
  } else {
    const markDiv = document.createElement('div');
    markDiv.className = 'slot-mark';
    markDiv.innerText = '▶';
    slotDiv.appendChild(markDiv);
    if (typeof bindSubslotToggleButtons === "function") bindSubslotToggleButtons();
}

  return slotDiv;
  if (typeof bindSubslotToggleButtons === "function") bindSubslotToggleButtons();
}

function renderSubslot(sub) {
  console.log("renderSubslot sub:", sub);
  const subDiv = document.createElement('div');
  subDiv.className = 'subslot';
  if (sub.SubslotID) {
    // 🔧 修正：SubslotIDから'sub-'プレフィックスを除去してからIDを生成
    const cleanSubslotId = sub.SubslotID.replace(/^sub-/, '');
    subDiv.id = `slot-${sub.Slot.toLowerCase()}-sub-${cleanSubslotId.toLowerCase()}`;
    console.log(`🔧 renderSubslot ID生成: ${sub.SubslotID} → ${cleanSubslotId} → ${subDiv.id}`);
  }
  if (typeof sub.display_order !== 'undefined') {
    subDiv.dataset.displayOrder = sub.display_order;
  }


  const subElDiv = document.createElement('div');
  subElDiv.className = 'subslot-element';
  subElDiv.innerText = sub.SubslotElement || '';

  const subTextDiv = document.createElement('div');
  subTextDiv.className = 'subslot-text';
  subTextDiv.innerText = sub.SubslotText || '';

  subDiv.appendChild(subElDiv);
  subDiv.appendChild(subTextDiv);

  // 🎯 **修正：正しいlocalStorageシステムを使用**
  if (sub.SubslotID) {
    // 実際に使用されているシステムに合わせる
    const saved = localStorage.getItem('rephrase_subslot_visibility_state');
    if (saved) {
      try {
        const visibilityState = JSON.parse(saved);
        // 🔧 修正：SubslotIDから'sub-'プレフィックスを除去してからキーを生成
        const cleanSubslotId = sub.SubslotID.replace(/^sub-/, '');
        const elementId = `slot-${sub.Slot.toLowerCase()}-sub-${cleanSubslotId.toLowerCase()}`;
        const elementState = visibilityState[elementId];
        
        if (elementState && elementState.text === false) {
          subTextDiv.style.opacity = '0';
          console.log(`Applied rephrase_subslot_visibility_state: ${elementId}.text = false (hidden)`);
        } else {
          console.log(`Applied rephrase_subslot_visibility_state: ${elementId}.text = true (visible)`);
        }
      } catch (e) {
        console.error('Error parsing rephrase_subslot_visibility_state:', e);
      }
    }
  }

  return subDiv;
  if (typeof bindSubslotToggleButtons === "function") bindSubslotToggleButtons();
}

function buildStructure(selectedSlots) {
  console.log("🏗️ buildStructure called with selectedSlots:", selectedSlots);
  console.log("🔍 buildStructure受信データの件数:", selectedSlots.length);
  console.log("🔍 buildStructure受信データのM1スロット:", selectedSlots.filter(item => item.Slot === 'M1' && !item.SubslotID));
  console.log("🔍 buildStructure受信データのM2スロット:", selectedSlots.filter(item => item.Slot === 'M2' && !item.SubslotID));
  console.log("🔍 buildStructure受信データのM2サブスロット:", selectedSlots.filter(item => item.Slot === 'M2' && item.SubslotID));
  
  let wrapper = document.querySelector('.slot-wrapper');
  if (!wrapper) {
    console.error('slot-wrapper not found, skipping structure generation');
    return;
    if (typeof bindSubslotToggleButtons === "function") bindSubslotToggleButtons();
}

  let dynamicArea = document.getElementById('dynamic-slot-area');
  if (!dynamicArea) {
    dynamicArea = document.createElement('div');
    dynamicArea.id = 'dynamic-slot-area';
    wrapper.appendChild(dynamicArea);
    if (typeof bindSubslotToggleButtons === "function") bindSubslotToggleButtons();
}

  dynamicArea.innerHTML = '';

  console.log("buildStructure called with selectedSlots:", selectedSlots);

  // 上位スロットのリセット
  const slotContainers = wrapper.querySelectorAll('.slot-container');
  slotContainers.forEach(container => {
    const phraseDiv = container.querySelector('.slot-phrase');
    if (phraseDiv) phraseDiv.innerText = '';
    const textDiv = container.querySelector('.slot-text');
    if (textDiv) textDiv.innerText = '';
  });

  const upperSlots = selectedSlots.filter(e => !e.SubslotID);

  // 🔍 分離疑問詞判定とDisplayAtTop付加
  const slotOrderMap = {};
  
  // 🔍 分離疑問詞構文の疑問詞表示（DisplayAtTop）を上位スロットに付与
  const questionWords = ["what", "where", "who", "when", "why", "how"];
  const displayTopMap = new Map();

  selectedSlots.forEach(entry => {
    if (
      entry.SubslotID &&
      entry.SubslotElement &&
      questionWords.includes(entry.SubslotElement.trim().toLowerCase())
    ) {
      const key = entry.Slot + "-" + entry.Slot_display_order;
      displayTopMap.set(key, entry.SubslotElement.trim());
    }
  });

  selectedSlots.forEach(entry => {
    if (!entry.SubslotID) {
      const key = entry.Slot + "-" + entry.Slot_display_order;
      if (displayTopMap.has(key)) {
        entry.DisplayAtTop = true;
        entry.DisplayText = displayTopMap.get(key);
        console.log("🔼 DisplayAtTop 自動付加:", entry.DisplayText, "(slot:", entry.Slot, ")");
      }
    }
  });


  selectedSlots.forEach(entry => {
    if (!entry.SubslotID && slotOrderMap[entry.Slot] && slotOrderMap[entry.Slot].size >= 2) {
      const minOrder = Math.min(...slotOrderMap[entry.Slot]);
      if (entry.Slot_display_order === minOrder && entry.Role === "c1") {
        entry.DisplayAtTop = true;
        entry.DisplayText = entry.Text;
        console.log("🔼 DisplayAtTop 付加:", entry.Text);
      }
    }
  });
  upperSlots.sort((a, b) => a.Slot_display_order - b.Slot_display_order);

  upperSlots.forEach(item => {
    console.log(`Processing upper slot: ${item.Slot} (PhraseType: ${item.PhraseType})`);

    if (item.PhraseType === 'word') {
      const slotDiv = renderSlot(item);
      // メインスロットにIDを設定（syncDynamicToStatic対応）
      slotDiv.id = `dynamic-slot-${item.Slot.toLowerCase()}`;
      dynamicArea.appendChild(slotDiv);
    } else {
      console.log(`Skipped upper slot: ${item.Slot} (PhraseType: ${item.PhraseType})`);
      if (typeof bindSubslotToggleButtons === "function") bindSubslotToggleButtons();
}

    const subslots = selectedSlots.filter(s =>
      s.Slot === item.Slot &&
      s.SubslotID &&
      s.Slot_display_order === item.Slot_display_order
    );
    subslots.sort((a, b) => a.display_order - b.display_order);

    
    // 🔽 DisplayAtTop が付加された上位スロットは動的記載エリアに出力しない
    if (item.DisplayAtTop === true) {
      console.log(`🚫 DisplayAtTop により ${item.Slot} の表示をスキップ`);
      return;
    }

  subslots.forEach(sub => {
      console.log(`Adding subslot to ${item.Slot}: ${sub.SubslotID} (display_order: ${sub.display_order})`);
      const subDiv = renderSubslot(sub);
      dynamicArea.appendChild(subDiv);
    // 差分追加: 安全なM1サブスロット書き込み
    if (sub.Slot === "M1") {
      // SubslotIDから'sub-'プレフィックスを除去
      const cleanSubslotId = sub.SubslotID.replace(/^sub-/, '').toLowerCase();
      const target = document.getElementById(`slot-m1-sub-${cleanSubslotId}`);
      if (target) {
        const phrase = target.querySelector(".slot-phrase");
        if (phrase) { phrase.textContent = sub.SubslotElement || ""; console.log(`✅ phrase書き込み: ${target.id}`); }
        const text = target.querySelector(".slot-text");
        if (text) { text.textContent = sub.SubslotText || ""; console.log(`✅ text書き込み: ${target.id}`); }
      } else {
        console.warn(`⚠ サブスロットが見つからない: slot-m1-sub-${cleanSubslotId}`);
      }
    }
    
    // 差分追加: 安全なM2サブスロット書き込み
    if (sub.Slot === "M2") {
      console.log(`� ===== M2サブスロット処理開始 =====`);
      console.log(`�🔍 M2サブスロット処理開始:`, sub);
      // SubslotIDから'sub-'プレフィックスを除去
      const cleanSubslotId = sub.SubslotID.replace(/^sub-/, '').toLowerCase();
      console.log(`🔍 cleanSubslotId: '${cleanSubslotId}'`);
      const expectedId = `slot-m2-sub-${cleanSubslotId}`;
      console.log(`🔍 探している要素ID: '${expectedId}'`);
      const target = document.getElementById(expectedId);
      console.log(`🔍 見つかった要素:`, target);
      console.log(`🔥 ===== M2サブスロット処理状況確認 =====`);
      if (target) {
        console.log(`✅ 要素が見つかりました: ${expectedId}`);
        const phrase = target.querySelector(".slot-phrase");
        const text = target.querySelector(".slot-text");
        console.log(`🔍 phrase要素:`, phrase);
        console.log(`🔍 text要素:`, text);
        if (phrase) { 
          phrase.textContent = sub.SubslotElement || ""; 
          console.log(`✅ M2 phrase書き込み完了: ${target.id} = '${sub.SubslotElement}'`); 
        }
        if (text) { 
          text.textContent = sub.SubslotText || ""; 
          console.log(`✅ M2 text書き込み完了: ${target.id} = '${sub.SubslotText}'`); 
        }
        console.log(`🔥 ===== M2サブスロット処理完了（既存要素） =====`);
      } else {
        console.warn(`❌ M2サブスロットが見つからない: ${expectedId}`);
        // 実際に存在するM2サブスロット要素を調べる
        const allM2Subs = document.querySelectorAll('[id^="slot-m2-sub-"]');
        console.log(`🔍 実際に存在するM2サブスロット要素:`, Array.from(allM2Subs).map(el => el.id));
        
        // 🔧 動的作成: M2サブスロットコンテナが存在する場合は要素を作成
        const m2Container = document.getElementById('slot-m2-sub');
        console.log(`🔍 M2コンテナ検索結果:`, m2Container);
        if (m2Container) {
          console.log(`🛠 M2サブスロット要素を動的作成開始: ${expectedId}`);
          const newSubslot = renderSubslot(sub);
          console.log(`🔍 作成されたサブスロット要素:`, newSubslot);
          m2Container.appendChild(newSubslot);
          console.log(`✅ M2サブスロット動的作成完了: ${expectedId}`);
          console.log(`🔥 ===== M2サブスロット処理完了（動的作成） =====`);
        } else {
          console.error(`❌ M2サブスロットコンテナが見つかりません: slot-m2-sub`);
          console.log(`🔥 ===== M2サブスロット処理失敗 =====`);
        }
      }
    }
    });
  });
  
  // 🎤 音声読み上げ用データの作成：実際に表示されているスロットのみを抽出
  createVoiceDataFromDisplayedSlots(selectedSlots);
  
  if (typeof bindSubslotToggleButtons === "function") bindSubslotToggleButtons();
}

/**
 * 🎤 実際に表示されているスロットから音声用データを作成
 */
function createVoiceDataFromDisplayedSlots(selectedSlots) {
  const voiceData = [];
  
  // DOMから実際に表示されている内容を取得
  const slotContainers = document.querySelectorAll('.slot-container');
  
  slotContainers.forEach(container => {
    const slotId = container.id;
    const slotName = slotId.replace('display-top-', '').replace('-', '_').toUpperCase();
    
    // .slot-phrase が存在し、テキストがある場合のみ音声用データに追加
    const phraseElement = container.querySelector('.slot-phrase');
    if (phraseElement && phraseElement.textContent.trim()) {
      // selectedSlotsから対応するスロットデータを取得
      const slotData = selectedSlots.find(slot => 
        slot.Slot && slot.Slot.toLowerCase() === slotName.toLowerCase() && 
        slot.SlotPhrase === phraseElement.textContent.trim()
      );
      
      if (slotData) {
        voiceData.push({ ...slotData });
      }
    }
  });
  
  // 疑問詞も追加（分離表示の場合）
  const questionWordElement = document.querySelector('#display-top-question-word .question-word-text');
  if (questionWordElement && questionWordElement.textContent.trim()) {
    const questionWordData = selectedSlots.find(slot => 
      (slot.Slot === 'question-word' || slot.Slot === 'WH' || slot.Slot === 'wh') &&
      slot.SlotPhrase === questionWordElement.textContent.trim()
    );
    if (questionWordData) {
      voiceData.unshift({ ...questionWordData }); // 疑問詞は先頭に
    }
  }
  
  // サブスロットも追加（表示されているもののみ）
  const subslotElements = document.querySelectorAll('.subslot');
  subslotElements.forEach(subElement => {
    const subElText = subElement.querySelector('.subslot-element');
    if (subElText && subElText.textContent.trim()) {
      const subData = selectedSlots.find(slot => 
        slot.SubslotID && 
        slot.SubslotElement === subElText.textContent.trim()
      );
      if (subData) {
        voiceData.push({ ...subData });
      }
    }
  });
  
  // 音声用データを保存
  window.currentDisplayedSentence = voiceData;
  console.log(`🎤 音声用データ更新完了: ${voiceData.length}件`);
  console.log('🎤 表示されているスロットのみ抽出:', voiceData.map(s => `${s.Slot}: ${s.SlotPhrase || s.SubslotElement}`));
}

export { buildStructure, buildStructure as buildStructureFromJson };

window.buildStructure = buildStructure;
