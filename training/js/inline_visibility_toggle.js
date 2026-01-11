/**
 * インライン表示切替システム
 * 
 * 目的：
 * - 上部の「英語OFF/ON」ボタンで全スロットの英語テキストを一括切替
 * - 各スロット横の個別ボタンで個別にON/OFF
 * - ランダマイズ後もlocalStorageから状態を復元
 * 
 * 依存関係：
 * - visibility_control.js（既存のlocalStorage管理システム）
 *   - visibilityState: {slot: {elementType: boolean}}
 *   - saveVisibilityState(): state-manager経由で保存
 *   - toggleSlotElementVisibility(slot, type, isVisible): 個別切替
 */

(function() {
  'use strict';

  console.log('[InlineVisibility] スクリプト開始');

  // 全スロット定義（visibility_control.jsと同じ）
  const ALL_SLOTS = ['s', 'aux', 'v', 'm1', 'm2', 'c1', 'o1', 'o2', 'c2', 'm3'];

  // 上部ボタン初期化
  function initToggleAllButton() {
    const toggleButton = document.getElementById('toggle-english-all');
    if (!toggleButton) {
      console.warn('[InlineVisibility] toggle-english-all ボタンが見つかりません');
      return;
    }

    toggleButton.addEventListener('click', function() {
      console.log('[InlineVisibility] 一括切替ボタンがクリックされました');
      
      // 現在の状態を確認（visibilityStateから判定）
      const isCurrentlyVisible = window.visibilityState?.['s']?.['text'] !== false;
      
      console.log('[InlineVisibility] 現在の状態:', isCurrentlyVisible ? '表示中' : '非表示');
      
      // 🎯 既存システムを使って全スロットの状態を更新
      ALL_SLOTS.forEach(slot => {
        if (window.toggleSlotElementVisibility) {
          // visibility_control.jsの関数を使用
          window.toggleSlotElementVisibility(slot, 'text', !isCurrentlyVisible);
        }
      });
      
      // ボタンのラベルを切替
      if (isCurrentlyVisible) {
        toggleButton.innerHTML = '👁️ 英語ON';
        console.log('[InlineVisibility] → 英語を非表示にしました');
      } else {
        toggleButton.innerHTML = '🙈 英語全OFF';
        console.log('[InlineVisibility] → 英語を表示しました');
      }
    });
    
    console.log('[InlineVisibility] 一括切替ボタン初期化完了');
  }

  // ボタンラベルを現在の状態に同期
  function syncButtonLabel() {
    const toggleButton = document.getElementById('toggle-english-all');
    if (!toggleButton) return;
    
    // visibilityStateから現在の状態を取得（より確実な方法）
    let isCurrentlyVisible = true; // デフォルトは表示
    
    if (window.visibilityState && window.visibilityState['s'] && window.visibilityState['s']['text'] !== undefined) {
      isCurrentlyVisible = window.visibilityState['s']['text'];
    }
    
    if (isCurrentlyVisible) {
      toggleButton.innerHTML = '🙈 英語OFF';
    } else {
      toggleButton.innerHTML = '👁️ 英語ON';
    }
    
    console.log('[InlineVisibility] ボタンラベル同期:', isCurrentlyVisible ? '表示中' : '非表示');
  }

  // ランダマイズ後のボタン同期（MutationObserver経由）
  function setupButtonSyncAfterRandomize() {
    const dynamicArea = document.getElementById("dynamic-slot-area");
    if (!dynamicArea) return;
    
    const observer = new MutationObserver(function() {
      // DOM変更後、ボタンラベルを同期
      if (window.syncButtonDebounceTimer) {
        clearTimeout(window.syncButtonDebounceTimer);
      }
      
      window.syncButtonDebounceTimer = setTimeout(() => {
        syncButtonLabel();
      }, 500);
    });
    
    observer.observe(dynamicArea, { 
      childList: true, 
      subtree: true 
    });
    
    console.log('[InlineVisibility] ボタン同期監視を開始しました');
  }

  // 初期化
  function init() {
    console.log('[InlineVisibility] 初期化開始');
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        initToggleAllButton();
        // visibility_control.jsがロードされた後に同期
        setTimeout(() => {
          syncButtonLabel();
          setupButtonSyncAfterRandomize();
        }, 100);
      });
    } else {
      initToggleAllButton();
      setTimeout(() => {
        syncButtonLabel();
        setupButtonSyncAfterRandomize();
      }, 100);
    }
  }

  init();
})();
