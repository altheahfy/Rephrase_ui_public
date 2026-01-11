// 制御パネル表示管理システム
// 上位スロットおよびサブスロット表示制御パネルの表示/非表示を一元管理

// 🎛️ 制御パネル表示状態を管理するグローバル変数
window.controlPanelsVisible = false;

// 🔄 制御パネルの表示状態を取得
function getControlPanelsVisibility() {
  // 🎯 **追加：state-manager経由で状態読み込み**
  try {
    if (window.RephraseState) {
      const subslotState = window.RephraseState.getState('visibility.subslots');
      if (subslotState && subslotState.hasOwnProperty('global_control_panels_visible')) {
        window.controlPanelsVisible = subslotState['global_control_panels_visible'];
        console.log(`📂 state-manager経由で制御パネル状態を読み込み: ${window.controlPanelsVisible}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ 制御パネル状態読み込みエラー:', error);
  }
  
  // ボタンのテキストからも状態を確認
  const toggleBtn = document.getElementById('toggle-control-panels');
  if (toggleBtn && toggleBtn.textContent.includes('表示中')) {
    window.controlPanelsVisible = true;
  }
  
  console.log(`🔍 制御パネル表示状態取得: ${window.controlPanelsVisible}`);
  return window.controlPanelsVisible;
}

// 🔄 制御パネルの表示状態を設定
function setControlPanelsVisibility(isVisible) {
  window.controlPanelsVisible = isVisible;
  
  // 🎯 **追加：state-manager経由で状態保存**
  try {
    if (window.RephraseState) {
      window.RephraseState.setState('visibility.subslots.global_control_panels_visible', isVisible);
      console.log(`💾 制御パネル表示状態をstate-manager経由で保存: ${isVisible ? '表示' : '非表示'}`);
    } else {
      console.log(`📝 state-manager未利用のため、メモリのみに保存: ${isVisible ? '表示' : '非表示'}`);
    }
  } catch (error) {
    console.error('❌ 制御パネル状態の保存に失敗:', error);
  }
  
  console.log(`🎛️ 制御パネル表示状態を設定: ${isVisible ? '表示' : '非表示'}`);
}

// 🎛️ 全ての制御パネルの表示/非表示を切り替え
function toggleAllControlPanels() {
  const newState = !window.controlPanelsVisible;
  setControlPanelsVisibility(newState);
  
  console.log(`🎛️ 制御パネル切り替え開始: ${newState ? '表示' : '非表示'}`);
  
  // 上位スロット制御パネルの表示/非表示
  const upperControlPanel = document.getElementById('visibility-control-panel-inline');
  if (upperControlPanel) {
    upperControlPanel.style.display = newState ? 'block' : 'none';
    console.log(`✅ 上位スロット制御パネル: ${newState ? '表示' : '非表示'}`);
  } else {
    console.warn("⚠ 上位スロット制御パネルが見つかりません");
  }
  
  // サブスロット制御パネルの表示/非表示
  const subslotPanels = document.querySelectorAll('.subslot-visibility-panel');
  console.log(`🔍 見つかったサブスロット制御パネル: ${subslotPanels.length}個`);
  
  subslotPanels.forEach((panel, index) => {
    panel.style.display = newState ? 'block' : 'none';
    console.log(`  - パネル${index + 1} (${panel.id}): ${newState ? '表示' : '非表示'}`);
  });
  
  // ボタンテキストの更新
  const toggleBtn = document.getElementById('toggle-control-panels');
  if (toggleBtn) {
    toggleBtn.textContent = newState ? '制御パネル (表示中)' : '制御パネル';
    console.log(`✅ ボタンテキスト更新: "${toggleBtn.textContent}"`);
  } else {
    console.warn("⚠ 制御パネルボタンが見つかりません");
  }
  
  console.log(`🎛️ 全制御パネル表示状態変更完了: ${newState ? '表示' : '非表示'}`);
  return newState;
}

// 🎛️ サブスロット制御パネルの表示を現在の状態に合わせる
function syncSubslotControlPanelVisibility(panelElement) {
  if (panelElement && panelElement.classList.contains('subslot-visibility-panel')) {
    // 🎯 **修正：state-manager経由で状態取得**
    let isVisible = false;
    try {
      if (window.RephraseState) {
        const subslotState = window.RephraseState.getState('visibility.subslots');
        if (subslotState && subslotState.hasOwnProperty('global_control_panels_visible')) {
          isVisible = subslotState['global_control_panels_visible'];
          console.log('📂 state-manager経由でパネル表示状態を取得しました');
        } else {
          console.log('📝 state-managerにパネル表示状態がないため、フォールバック');
          isVisible = window.controlPanelsVisible;
        }
      } else {
        // フォールバック：直接localStorage読み込み
        const saved = localStorage.getItem('rephrase_subslot_visibility_state');
        if (saved) {
          const state = JSON.parse(saved);
          if (state.hasOwnProperty('global_control_panels_visible')) {
            isVisible = state['global_control_panels_visible'];
          }
        }
        console.log('📂 直接localStorageからパネル表示状態を取得しました（state-manager未利用）');
      }
    } catch (error) {
      console.warn('⚠️ パネル表示状態読み込みエラー:', error);
      // フォールバック: window.controlPanelsVisibleを使用
      isVisible = window.controlPanelsVisible;
    }
    
    panelElement.style.display = isVisible ? 'block' : 'none';
    console.log(`🔄 サブスロット制御パネルの表示を同期: ${isVisible ? '表示' : '非表示'} (state: ${isVisible})`);
  }
}

// 🔹 グローバル関数としてエクスポート
window.getControlPanelsVisibility = getControlPanelsVisibility;
window.setControlPanelsVisibility = setControlPanelsVisibility;
window.toggleAllControlPanels = toggleAllControlPanels;
window.syncSubslotControlPanelVisibility = syncSubslotControlPanelVisibility;

// 🔍 デバッグ用：現在の制御パネル状態を詳細表示
window.debugControlPanelStatus = function() {
  console.log("🔍 === 制御パネル状態デバッグ ===");
  console.log(`グローバル変数: ${window.controlPanelsVisible}`);
  
  const toggleBtn = document.getElementById('toggle-control-panels');
  console.log(`ボタンテキスト: "${toggleBtn ? toggleBtn.textContent : 'ボタンなし'}"`);
  
  const upperPanel = document.getElementById('visibility-control-panel-inline');
  console.log(`上位パネル表示: ${upperPanel ? upperPanel.style.display : 'パネルなし'}`);
  
  const subslotPanels = document.querySelectorAll('.subslot-visibility-panel');
  console.log(`サブスロットパネル数: ${subslotPanels.length}`);
  subslotPanels.forEach((panel, index) => {
    console.log(`  - パネル${index + 1} (${panel.id}): ${panel.style.display}`);
  });
  console.log("🔍 ========================");
};

console.log("✅ control_panel_manager.js が読み込まれました");
