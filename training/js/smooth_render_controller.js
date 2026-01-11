/**
 * 🎯 視覚的スムーズレンダリング制御システム
 * スロットの表示順序とタイミングを完全制御してちらつきを排除
 */

class SmoothRenderController {
  constructor() {
    this.isRendering = false;
    this.renderQueue = [];
    this.visibilityState = 'visible'; // 'hidden', 'visible'
  }

  /**
   * 全スロットを一時的に非表示にしてバッチ更新を開始
   */
  startBatchUpdate() {
    console.log('🎯 バッチ更新開始: 全スロット非表示化');
    this.isRendering = true;
    this.visibilityState = 'hidden';
    
    // メインコンテナを瞬時に非表示
    const mainContainer = document.querySelector('.slot-wrapper');
    if (mainContainer) {
      mainContainer.style.visibility = 'hidden';
      mainContainer.style.transition = 'none'; // アニメーション無効化
    }
    
    // 個別スロットも非表示化
    const allSlots = document.querySelectorAll('.slot-container');
    allSlots.forEach(slot => {
      slot.style.visibility = 'hidden';
      slot.style.transition = 'none';
    });
  }

  /**
   * バッチ更新完了後に全スロットを同時表示
   */
  completeBatchUpdate() {
    console.log('🎯 バッチ更新完了: 全スロット同時表示');
    
    // requestAnimationFrameで次のフレームまで待機してから表示
    requestAnimationFrame(() => {
      const mainContainer = document.querySelector('.slot-wrapper');
      if (mainContainer) {
        mainContainer.style.visibility = 'visible';
        mainContainer.style.transition = 'opacity 0.1s ease-in-out';
      }
      
      // 個別スロットを順序良く表示（左から右へ）
      const allSlots = document.querySelectorAll('.slot-container');
      const slotOrder = ['slot-m1', 'slot-s', 'slot-aux', 'slot-m2', 'slot-v', 'slot-c1', 'slot-o1', 'slot-o2', 'slot-c2', 'slot-m3'];
      
      slotOrder.forEach((slotId, index) => {
        const slot = document.getElementById(slotId);
        if (slot) {
          // 微小な遅延で順序良く表示（視覚的に自然な流れ）
          setTimeout(() => {
            slot.style.visibility = 'visible';
            slot.style.transition = 'opacity 0.05s ease-in-out';
          }, index * 10); // 10ms間隔で順次表示
        }
      });
      
      this.isRendering = false;
      this.visibilityState = 'visible';
      console.log('✅ スムーズレンダリング完了');
    });
  }

  /**
   * 緊急用：即座に全表示を復元
   */
  forceShow() {
    console.log('🚨 緊急表示復元');
    const mainContainer = document.querySelector('.slot-wrapper');
    if (mainContainer) {
      mainContainer.style.visibility = 'visible';
      mainContainer.style.transition = '';
    }
    
    const allSlots = document.querySelectorAll('.slot-container');
    allSlots.forEach(slot => {
      slot.style.visibility = 'visible';
      slot.style.transition = '';
    });
    
    this.isRendering = false;
    this.visibilityState = 'visible';
  }

  /**
   * 現在のレンダリング状態を確認
   */
  isCurrentlyRendering() {
    return this.isRendering;
  }
}

// グローバルインスタンス作成
window.smoothRenderController = new SmoothRenderController();

console.log('✅ SmoothRenderController初期化完了');
