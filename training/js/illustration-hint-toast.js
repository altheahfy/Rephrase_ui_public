// 💡 イラストヒントトーストシステム
// 英語OFFボタンを押した際に、イラストをハイライトしてヒントを表示

(function() {
  'use strict';
  
  // 🌐 軽量版t()関数 - 現在の言語に応じてテキストを返す
  function t(key) {
    const lang = localStorage.getItem('rephrase_language') || 'ja';
    const dict = {
      ja: {
        'hint-message': 'イラストをヒントに<br>英語を考えましょう',
        'hint-dismiss': '今後表示しない'
      },
      en: {
        'hint-message': 'Use the illustration as a hint<br>to think of the English',
        'hint-dismiss': "Don't show again"
      }
    };
    return dict[lang]?.[key] || key;
  }
  
  /**
   * トーストを表示してイラストをハイライト
   * @param {HTMLElement} triggerButton - クリックされたボタン要素
   */
  function showIllustrationHintToast(triggerButton) {
    console.log('💡 [showIllustrationHintToast] 呼び出されました', triggerButton);
    
    // localStorage で「今後表示しない」設定を確認
    const dismissed = localStorage.getItem('illustration_hint_dismissed');
    if (dismissed === 'true') {
      console.log('💡 イラストヒント: ユーザーが非表示設定済み');
      return;
    }
    
    // トリガーボタンから親スロットを探す
    let targetSlot = null;
    if (triggerButton) {
      targetSlot = triggerButton.closest('.slot-container') || 
                   triggerButton.closest('.subslot-container') ||
                   triggerButton.closest('#display-top-question-word');
      console.log('🎯 ターゲットスロット:', targetSlot);
    }
    
    // トーストの位置を計算（スロット自体の位置を基準）
    let toastLeft, toastTop, arrowPosition;
    
    if (targetSlot) {
      const slotRect = targetSlot.getBoundingClientRect();
      console.log('📐 スロット位置:', slotRect);
      
      // スロットの右側に配置（画面外に出る場合は左側）
      const toastWidth = 280;
      const spaceOnRight = window.innerWidth - slotRect.right;
      const positionOnRight = spaceOnRight > toastWidth + 40;
      
      if (positionOnRight) {
        toastLeft = slotRect.right + 20;
        arrowPosition = 'left';
      } else {
        toastLeft = slotRect.left - toastWidth - 20;
        arrowPosition = 'right';
      }
      
      // スロットの垂直中央に配置
      toastTop = slotRect.top + (slotRect.height / 2);
    } else {
      // スロットなし → 画面左上に配置
      toastLeft = 20;
      toastTop = 100;
      arrowPosition = 'none';
      console.log('⚠ スロットなし: 画面左上に表示');
    }
    
    console.log('📍 トースト位置:', { toastLeft, toastTop, arrowPosition });
    
    // 吹き出しトースト
    const toast = document.createElement('div');
    toast.id = 'illustration-hint-toast';
    
    if (arrowPosition === 'none') {
      toast.style.cssText = `
        position: fixed;
        left: ${toastLeft}px;
        top: ${toastTop}px;
        background: white;
        border: 2px solid #333;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        text-align: center;
        animation: fadeIn 0.3s ease-out;
        pointer-events: auto;
        width: 280px;
      `;
    } else {
      toast.style.cssText = `
        position: fixed;
        left: ${toastLeft}px;
        top: ${toastTop}px;
        transform: translateY(-50%);
        background: white;
        border: 2px solid #333;
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        text-align: center;
        animation: fadeIn 0.3s ease-out;
        pointer-events: auto;
        width: 280px;
      `;
    }
    
    toast.innerHTML = `
      <div style="font-size: 16px; font-weight: bold; color: #333; margin-bottom: 10px; line-height: 1.4;">
        ${t('hint-message')}
      </div>
      <label style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 10px; cursor: pointer;">
        <input type="checkbox" id="dismiss-illustration-hint" style="width: 16px; height: 16px; cursor: pointer;">
        <span style="font-size: 12px; color: #555;">${t('hint-dismiss')}</span>
      </label>
      <button id="close-illustration-hint" style="
        background: #4CAF50;
        color: white;
        border: none;
        border-radius: 6px;
        padding: 8px 20px;
        font-size: 13px;
        cursor: pointer;
        font-weight: bold;
      ">OK</button>
    `;
    
    // 矢印を追加（イラストがある場合のみ）
    if (arrowPosition !== 'none') {
      const arrow = document.createElement('div');
      arrow.className = 'toast-arrow';
      if (arrowPosition === 'left') {
        arrow.style.cssText = `
          position: absolute;
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 10px solid transparent;
          border-bottom: 10px solid transparent;
          border-right: 12px solid #333;
        `;
      } else {
        arrow.style.cssText = `
          position: absolute;
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 10px solid transparent;
          border-bottom: 10px solid transparent;
          border-left: 12px solid #333;
        `;
      }
      toast.appendChild(arrow);
    }
    
    // アニメーションCSS
    const style = document.createElement('style');
    style.id = 'illustration-hint-style';
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-50%) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
      }
      
      .slot-image-highlight {
        position: relative;
        z-index: 10000 !important;
        animation: imageGlow 1s infinite alternate !important;
        border-radius: 8px !important;
      }
      
      @keyframes imageGlow {
        0% {
          box-shadow: 0 0 10px 4px rgba(255, 193, 7, 0.8), 
                      0 0 20px 8px rgba(255, 193, 7, 0.4) !important;
          border: 3px solid rgba(255, 193, 7, 0.9) !important;
        }
        100% {
          box-shadow: 0 0 20px 8px rgba(255, 193, 7, 1), 
                      0 0 40px 12px rgba(255, 193, 7, 0.6) !important;
          border: 3px solid rgba(255, 193, 7, 1) !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(toast);
    console.log('✅ トースト DOM追加完了');
    
    // OKボタンクリック
    const closeBtn = document.getElementById('close-illustration-hint');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('💡 OKボタンクリック');
        
        const checkbox = document.getElementById('dismiss-illustration-hint');
        if (checkbox && checkbox.checked) {
          localStorage.setItem('illustration_hint_dismissed', 'true');
          console.log('💡 イラストヒント: 今後表示しない設定を保存');
        }
        
        // トーストを削除
        if (toast.parentNode) {
          toast.remove();
          console.log('✅ トースト削除');
        }
        if (style.parentNode) {
          style.remove();
          console.log('✅ スタイル削除');
        }
        
        // ハイライトを解除
        if (targetImage) {
          targetImage.classList.remove('slot-image-highlight');
          console.log('✅ ハイライト解除');
        }
        if (style.parentNode) {
          style.remove();
          console.log('✅ スタイル削除');
        }
        
        // ハイライトを解除
        highlightedImages.forEach(img => img.classList.remove('slot-image-highlight'));
        console.log('✅ ハイライト解除');
      });
    } else {
      console.error('❌ OKボタンが見つかりません');
    }
  }
  
  /**
   * 「今後表示しない」設定をリセット（デバッグ用）
   */
  function resetIllustrationHint() {
    localStorage.removeItem('illustration_hint_dismissed');
    console.log('💡 イラストヒント設定をリセットしました');
  }
  
  // グローバルにエクスポート
  window.showIllustrationHintToast = showIllustrationHintToast;
  window.resetIllustrationHint = resetIllustrationHint;
  
  console.log('✅ illustration-hint-toast.js が読み込まれました');
})();
