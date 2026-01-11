
export function randomizeAll(slotData) {
  const groups = [...new Set(slotData.map(entry => entry.V_group_key).filter(v => v))];
  if (groups.length === 0) {
    console.warn("V_group_key 母集団が見つかりません。");
    return [];
  }

  console.log(`🎯 [デバッグ] 全V_group_key: ${groups.join(', ')}`);
  console.log(`🎯 [デバッグ] 現在の状態:`, window.currentRandomizedState);

  // 🎯 **重複回避ロジック**: 現在のV_group_keyを除外
  let availableGroups = groups;
  if (window.currentRandomizedState && window.currentRandomizedState.vGroupKey) {
    availableGroups = groups.filter(g => g !== window.currentRandomizedState.vGroupKey);
    console.log(`🎯 現在のV_group_key「${window.currentRandomizedState.vGroupKey}」を除外`);
    console.log(`🎯 [デバッグ] 除外後の候補: ${availableGroups.join(', ')}`);
  } else {
    console.log('🎯 [デバッグ] 現在の状態が未設定、除外なし');
  }
  
  // 🎯 **履歴ベース重複回避**: 最近選択されたV_group_keyも除外
  if (window.randomizeHistory && typeof window.randomizeHistory.filterAvoidDuplicates === 'function') {
    const beforeHistoryFilter = availableGroups.length;
    availableGroups = window.randomizeHistory.filterAvoidDuplicates(
      availableGroups, 
      window.currentRandomizedState?.vGroupKey, 
      'vGroupKeys'
    );
    console.log(`🎯 [デバッグ] 履歴フィルタ: ${beforeHistoryFilter} → ${availableGroups.length}候補`);
  } else {
    console.log('🎯 [デバッグ] 履歴機能が利用できません');
  }
  
  // 選択肢が枯渇した場合は全候補を復活
  if (availableGroups.length === 0) {
    console.log("🎯 重複回避後に選択肢がなくなったため、全候補を復活");
    availableGroups = groups;
  }

  const selectedGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
  console.log(`🟢 選択 V_group_key: ${selectedGroup} (${availableGroups.length}/${groups.length}候補から選択)`);
  console.log(`🎯 [デバッグ] 選択された候補: ${availableGroups.join(', ')}`);

  const groupSlots = slotData.filter(entry => entry.V_group_key === selectedGroup);
  const exampleIDs = [...new Set(groupSlots.map(entry => entry.例文ID).filter(id => id))];

  if (exampleIDs.length === 0) {
    console.warn("例文ID 母集団が見つかりません。");
    return [];
  }

  console.log(`🎯 [デバッグ] ${selectedGroup}の例文ID: ${exampleIDs.join(', ')}`);
  
  // 🎯 **例文IDレベルでの重複回避** (Phase 1.5)
  let availableExampleIDs = exampleIDs;
  if (window.currentRandomizedState && 
      window.currentRandomizedState.vGroupKey === selectedGroup &&
      window.currentRandomizedState.exampleId) {
    const currentExampleIds = window.currentRandomizedState.exampleId.split(',');
    availableExampleIDs = exampleIDs.filter(id => !currentExampleIds.includes(id));
    console.log(`🎯 [デバッグ] 同じV_group_key内で例文ID重複回避: ${currentExampleIds.join(',')} を除外`);
    console.log(`🎯 [デバッグ] 除外後の例文ID候補: ${availableExampleIDs.join(', ')}`);
  }
  
  // 🎯 **履歴ベース例文ID重複回避**
  if (window.randomizeHistory && typeof window.randomizeHistory.filterAvoidDuplicates === 'function') {
    const beforeHistoryFilter = availableExampleIDs.length;
    availableExampleIDs = window.randomizeHistory.filterAvoidDuplicates(
      availableExampleIDs, 
      window.currentRandomizedState?.exampleId, 
      'exampleIds'
    );
    console.log(`🎯 [デバッグ] 例文ID履歴フィルタ: ${beforeHistoryFilter} → ${availableExampleIDs.length}候補`);
  }
  
  // 例文ID選択肢が枯渇した場合は全候補を復活
  if (availableExampleIDs.length === 0) {
    console.log("🎯 例文ID重複回避後に選択肢がなくなったため、全候補を復活");
    availableExampleIDs = exampleIDs;
  }

  let slotSets = [];
  exampleIDs.forEach((id, index) => {
    const setNumber = index + 1;
    const slots = groupSlots.filter(entry => entry.例文ID === id && !entry.SubslotID).map(entry => ({
      ...entry,
      識別番号: `${entry.Slot}-${setNumber}`
    }));
    slotSets.push(slots);
  });

  let selectedSlots = [];
  const slotTypes = [...new Set(groupSlots.map(entry => entry.Slot).filter(s => s))];
  
  slotTypes.forEach(type => {
    if (type === "O1") return;
    
    let candidates = slotSets.flat().filter(entry => entry.Slot === type);
    
    // 🎲 空スロット選択肢を追加（「案2」実装）
    // ただし、疑問詞スロットは例外：疑問詞グループでは必ず疑問詞を表示する
    const hasWhWordInType = candidates.some(c => c.QuestionType === 'wh-word');
    const totalExampleCount = exampleIDs.length;
    const slotExampleCount = [...new Set(candidates.map(c => c.例文ID))].length;
    if (slotExampleCount < totalExampleCount && !hasWhWordInType) {
      // 空スロットを表現する仮想エントリを追加
      candidates.push({
        Slot: type,
        SlotPhrase: "",
        SlotText: "",
        例文ID: "EMPTY_SLOT",
        V_group_key: selectedGroup,
        識別番号: `${type}-EMPTY`
      });
      console.log(`🎲 ${type}スロットに空選択肢を追加（${slotExampleCount}/${totalExampleCount}例文にのみ存在）`);
    } else if (hasWhWordInType) {
      console.log(`🔒 ${type}スロット: 疑問詞を含むため空選択肢は追加しません`);
    }
    
    // �🎯 疑問詞競合回避ロジック
    if (candidates.some(c => c.QuestionType === 'wh-word')) {
      const alreadyHasWhWord = selectedSlots.some(s => s.QuestionType === 'wh-word');
      if (alreadyHasWhWord) {
        // 既に疑問詞が選択済みなら、非疑問詞のみ選択候補にする
        candidates = candidates.filter(c => c.QuestionType !== 'wh-word');
        console.log(`🔒 疑問詞競合回避: ${type}スロットから疑問詞を除外`);
      } else {
        console.log(`✅ 疑問詞選択可能: ${type}スロット`);
      }
    }
    
    if (candidates.length > 0) {
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      
      // 🎲 空スロットが選択された場合の処理
      if (chosen.例文ID === "EMPTY_SLOT") {
        console.log(`🎯 ${type}スロット: 空選択肢が選ばれました（スロットなし）`);
        // 空スロットの場合は何も追加しない（スキップ）
        return;
      }
      
      // 🎯 V_group_keyを保持してスロットを追加
      selectedSlots.push({ ...chosen, V_group_key: selectedGroup });
      
      // 疑問詞が選択された場合のログ
      if (chosen.QuestionType === 'wh-word') {
        console.log(`🎯 疑問詞選択: ${chosen.SlotPhrase} (${chosen.Slot})`);
      }
      
      const relatedSubslots = groupSlots.filter(e =>
        e.例文ID === chosen.例文ID &&
        e.Slot === chosen.Slot &&
        e.SubslotID
      );
      relatedSubslots.forEach(sub => {
        selectedSlots.push({ ...sub });
      });
    }
  });

  const o1Entries = groupSlots.filter(e => e.Slot === "O1");
  const uniqueOrders = [...new Set(o1Entries.map(e => e.Slot_display_order))];

  if (uniqueOrders.length > 1) {
    // 🔍 同一例文内でのO1複数順序チェック
    const hasSameExampleMultipleOrders = o1Entries.some(entry => {
      const sameExampleO1s = o1Entries.filter(e => e.例文ID === entry.例文ID);
      const ordersInSameExample = [...new Set(sameExampleO1s.map(e => e.Slot_display_order))];
      return ordersInSameExample.length > 1;
    });
    
    if (hasSameExampleMultipleOrders) {
      // 分離疑問詞構文：同一例文内の複数順序O1を全て選択
      console.log("🔄 分離疑問詞構文検出: 複数O1を選択");
      uniqueOrders.forEach(order => {
        const targets = o1Entries.filter(e => e.Slot_display_order === order);
        targets.forEach(t => selectedSlots.push({ ...t }));
      });
    } else {
      // 異なる例文由来のO1混在：1つだけランダム選択
      console.log("🔄 異なる例文のO1混在検出: 1つだけ選択");
      const chosen = o1Entries[Math.floor(Math.random() * o1Entries.length)];
      selectedSlots.push({ ...chosen });
      const subslots = groupSlots.filter(e => e.例文ID === chosen.例文ID && e.Slot === chosen.Slot && e.SubslotID);
      subslots.forEach(sub => selectedSlots.push({ ...sub }));
    }
  } else if (o1Entries.length > 0) {
    const clauseO1 = o1Entries.filter(e => e.PhraseType === "clause");
    if (clauseO1.length > 0) {
      const chosen = clauseO1[Math.floor(Math.random() * clauseO1.length)];
      selectedSlots.push({ ...chosen });
      const subslots = groupSlots.filter(e => e.例文ID === chosen.例文ID && e.Slot === chosen.Slot && e.SubslotID);
      subslots.forEach(sub => selectedSlots.push({ ...sub }));
    } else {
      const wordO1 = o1Entries.filter(e => e.PhraseType !== "clause");
      if (wordO1.length > 0) {
        const chosen = wordO1[Math.floor(Math.random() * wordO1.length)];
        selectedSlots.push({ ...chosen });
        const subslots = groupSlots.filter(e => e.例文ID === chosen.例文ID && e.Slot === chosen.Slot && e.SubslotID);
        subslots.forEach(sub => selectedSlots.push({ ...sub }));
      }
    }
  }

  window.slotSets = slotSets;
  window.slotTypes = slotTypes;
  window.lastSelectedSlots = selectedSlots;

  // === 個別ランダマイズ用: 完全なスロットプールを保存 ===
  // 選択されたV_group_keyの全スロットデータ（メイン+サブスロット）を保存
  window.fullSlotPool = groupSlots.map(slot => ({ ...slot }));
  console.log(`💾 個別ランダマイズ用データプール保存完了: ${window.fullSlotPool.length}件`);
  console.log(`💾 V_group_key "${selectedGroup}" の全スロットデータを保存しました`);

  // 疑問文判定と句読点付与
  function detectQuestionPattern(selectedSlots) {
    // Slot_display_order順にソート
    const sortedSlots = selectedSlots.filter(slot => !slot.SubslotID)
      .sort((a, b) => (a.Slot_display_order || 0) - (b.Slot_display_order || 0));
    if (sortedSlots.length === 0) return false;
    // 上位2スロットを判定
    const upperSlots = sortedSlots.slice(0, 2);
    for (const slot of upperSlots) {
      if (slot.QuestionType === 'wh-word') {
        console.log(`🔍 疑問文判定: wh-wordで判定 (${slot.SlotPhrase})`);
        return true;
      }
      const text = (slot.SlotPhrase || "").toLowerCase().trim();
      if (text === "do" || text === "does" || text === "did") {
        console.log(`🔍 疑問文判定: do/does/didで判定 (${text})`);
        return true;
      }
    }
    console.log(`🔍 疑問文判定: 平叙文と判定`);
    return false;
  }
  const isQuestionSentence = detectQuestionPattern(selectedSlots);
  const punctuation = isQuestionSentence ? "?" : ".";
  
  // 最後のメインスロットを特定
  const mainSlots = selectedSlots.filter(slot => !slot.SubslotID);
  let lastMainSlotIndex = -1;
  let firstMainSlotIndex = -1;
  if (mainSlots.length > 0) {
    const lastOrder = Math.max(...mainSlots.map(s => s.Slot_display_order || 0));
    const firstOrder = Math.min(...mainSlots.map(s => s.Slot_display_order || 0));
    lastMainSlotIndex = selectedSlots.findIndex(s => !s.SubslotID && (s.Slot_display_order || 0) === lastOrder);
    firstMainSlotIndex = selectedSlots.findIndex(s => !s.SubslotID && (s.Slot_display_order || 0) === firstOrder);
  }

  // 個別ランダマイズ用の位置情報をRephraseStateに保存
  if (mainSlots.length > 0) {
    const sentencePositionInfo = {
      firstSlot: mainSlots.find(s => (s.Slot_display_order || 0) === Math.min(...mainSlots.map(s => s.Slot_display_order || 0))).Slot,
      lastSlot: mainSlots.find(s => (s.Slot_display_order || 0) === Math.max(...mainSlots.map(s => s.Slot_display_order || 0))).Slot,
      isQuestionSentence: isQuestionSentence,
      timestamp: Date.now()
    };
    
    // RephraseState統合：localStorage操作を状態管理経由に変更
    if (window.RephraseState) {
      window.RephraseState.setState('randomizer.sentencePositionInfo', sentencePositionInfo);
      console.log('💾 個別ランダマイズ用位置情報をRephraseStateに保存:', sentencePositionInfo);
    } else {
      // フォールバック：RephraseState未初期化時
      localStorage.setItem('sentencePositionInfo', JSON.stringify(sentencePositionInfo));
      console.log('💾 個別ランダマイズ用位置情報を保存（フォールバック）:', sentencePositionInfo);
    }
  }

  return selectedSlots.map((slot, idx) => {
    let phrase = slot.SlotPhrase || "";
    
    // 一つ目のメインスロットの一文字目を大文字にする
    if (idx === firstMainSlotIndex && phrase) {
      phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
    }
    
    // 最後のメインスロットのみ句読点をSlotPhraseに付与（英語例文テキストのみ）
    if (idx === lastMainSlotIndex && phrase) {
      // 既存の句読点を除去してから新しい句読点を追加
      phrase = phrase.replace(/[.?!]+$/, "") + punctuation;
    }
    return {
      Slot: slot.Slot || "",
      SlotPhrase: phrase,
      SlotText: slot.SlotText || "",
      Slot_display_order: slot.Slot_display_order || 0,
      PhraseType: slot.PhraseType || "",
      SubslotID: slot.SubslotID || "",
      SubslotElement: slot.SubslotElement || "",
      SubslotText: slot.SubslotText || "",
      display_order: slot.display_order || 0,
      識別番号: slot.識別番号 || ""
    };
  });
}

// 🎯 **状態保存付きランダマイズ関数のエクスポート**
export function randomizeAllWithStateManagement(slotData) {
  console.log('🎯 [デバッグ] randomizeAllWithStateManagement 開始');
  
  // allPresetDataを使用してV_group_keyを取得
  const allData = window.allPresetData || slotData;
  if (!allData || allData.length === 0) {
    console.log('🎯 [デバッグ] データが見つかりません:', { allData, slotData });
    return [];
  }
  
  console.log('🎯 [デバッグ] 利用可能なデータ件数:', allData.length);
  
  const result = randomizeAll(slotData);
  
  // 🎯 現在の選択状態を保存
  if (result.length > 0) {
    // V_group_keyを元データから直接取得
    const groups = [...new Set(allData.map(entry => entry.V_group_key).filter(v => v))];
    const selectedExampleIds = [...new Set(result.filter(r => r.SlotPhrase).map(r => r.識別番号))];
    
    console.log('🎯 [デバッグ] 全V_group_key:', groups);
    console.log('🎯 [デバッグ] 選択された例文ID:', selectedExampleIds);
    
    // 実際に選択されたV_group_keyを特定
    let selectedVGroupKey = null;
    if (result.length > 0) {
      // 結果から最初に見つかるV_group_keyを使用
      for (const slot of result) {
        if (slot.SlotPhrase && slot.SlotPhrase.trim()) {
          // 元データから該当するエントリを検索
          const matchingEntry = allData.find(entry => 
            entry.Slot === slot.Slot && 
            entry.SlotPhrase === slot.SlotPhrase &&
            entry.V_group_key
          );
          if (matchingEntry && matchingEntry.V_group_key) {
            selectedVGroupKey = matchingEntry.V_group_key;
            console.log('🎯 [デバッグ] V_group_key発見:', selectedVGroupKey, 'スロット:', slot.Slot);
            break;
          }
        }
      }
    }
    
    console.log(`🎯 [デバッグ] 選択されたV_group_key: ${selectedVGroupKey}`);
    console.log(`🎯 [デバッグ] 利用可能なV_group_key: ${groups.join(', ')}`);
    
    // グローバル状態を更新
    if (window.currentRandomizedState) {
      window.currentRandomizedState.vGroupKey = selectedVGroupKey;
      window.currentRandomizedState.exampleId = selectedExampleIds.join(',');
      window.currentRandomizedState.lastRandomizedTime = Date.now();
      window.currentRandomizedState.selectedSlots = result;
      console.log('🎯 [デバッグ] グローバル状態更新:', window.currentRandomizedState);
    }
    
    // 履歴を保存
    if (window.randomizeHistory && typeof window.randomizeHistory.save === 'function') {
      window.randomizeHistory.save(selectedVGroupKey, selectedExampleIds.join(','));
      console.log('🎯 [デバッグ] 履歴保存実行:', { selectedVGroupKey, exampleIds: selectedExampleIds.join(',') });
    } else {
      console.log('🎯 [デバッグ] 履歴保存機能が利用できません');
    }
    
    console.log('🎯 全体ランダマイズ状態保存完了:', {
      vGroupKey: selectedVGroupKey,
      exampleIds: selectedExampleIds
    });
  }
  
  return result;
}
