// ====================================
// 🎯 初回ガイド用ツールチップシステム
// ====================================
// 目的: ①②③④の説明テキストにホバーで詳細説明を表示

(function() {
  'use strict';

  console.log('🎯 初回ガイドツールチップシステム初期化開始');

  // ツールチップ翻訳辞書
  const tooltipTranslations = {
    ja: {
      'guide-step-1': '<span style="display: inline-flex; align-items: center; justify-content: center; background: #ff9800; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">🎲 例文全シャッフル</span>を押すと、<span style="font-weight: bold; color: #2196f3;">様々な例文</span>が表示されます。<br><br>そこに表示される<span style="font-weight: bold; color: #ff9800;">「英語とイラストのセット」</span>を見て、<span style="font-weight: bold; color: #4CAF50;">イラストだけを見て英語が思い出せる</span>ようにしましょう',
      'guide-step-2': '「<span style="display: inline-flex; align-items: center; justify-content: center; background: #4CAF50; color: white; border: none; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold; line-height: 1.2;">英語<br>OFF</span>」を押すと、<span style="font-weight: bold; color: #ff5722;">そこの英語が消えます</span>。<br><br>これによって、<span style="font-weight: bold; color: #4CAF50;">自分が練習したい箇所をテスト</span>できるようになります。',
      'guide-step-3': '「<span style="display: inline-flex; align-items: center; justify-content: center; background: #ff9800; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">🎲 例文全シャッフル</span>」をクリックすると、<span style="font-weight: bold; color: #2196f3;">例文全体</span>が違うものに入れ替わります。<br><br>「<span style="display: inline-flex; align-items: center; justify-content: center; background: #ff9800; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">🎲</span>」をクリックすると、<span style="font-weight: bold; color: #ff9800;">その部分だけ</span>が入れ替わります。<br><br>自由にシャッフルし、イラストをヒントに<span style="font-weight: bold; color: #ff5722;">「英語を消した部分を含めた全文」</span>を口に出して言ってください。<br><br>英語の<span style="font-weight: bold; color: #4CAF50;">「フォーム」</span>が自然と身に付きます。',
      'guide-step-4': '英語の文は、<br>文の中に、さらに小さな文が入ることがあります。<br><br>たとえば、<br><span style="font-weight: bold; color: #2196f3;">I know [that he loves me].</span><br><br>このような<br><span style="font-weight: bold; color: #ff5722;">「中に入っている文」</span>は、<br>ふだんはたたんで表示しています。<br><br><span style="display: inline-flex; align-items: center; justify-content: center; background: #2196f3; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">▼ 詳細</span>を押すと、<br>中に入っている文を取り出して見ることができます。<br><br><img src="images/guide/subslot-detail-example.png" style="width: 100%; max-width: 300px; margin-top: 10px; border: 2px solid #ddd; border-radius: 4px;">'
    },
    en: {
      'guide-step-1': 'Press <span style="display: inline-flex; align-items: center; justify-content: center; background: #ff9800; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">🎲 Shuffle All</span> to display <span style="font-weight: bold; color: #2196f3;">various example sentences</span>.<br><br>Look at the <span style="font-weight: bold; color: #ff9800;">"English-image pairs"</span> displayed, and practice until you can <span style="font-weight: bold; color: #4CAF50;">recall the English by just seeing the images</span>.',
      'guide-step-2': 'Press "<span style="display: inline-flex; align-items: center; justify-content: center; background: #4CAF50; color: white; border: none; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold; line-height: 1.2;">English<br>OFF</span>" to <span style="font-weight: bold; color: #ff5722;">hide the English text</span> in that area.<br><br>This allows you to <span style="font-weight: bold; color: #4CAF50;">test the specific parts you want to practice</span>.',
      'guide-step-3': 'Click "<span style="display: inline-flex; align-items: center; justify-content: center; background: #ff9800; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">🎲 Shuffle All</span>" to replace the <span style="font-weight: bold; color: #2196f3;">entire sentence</span>.<br><br>Click "<span style="display: inline-flex; align-items: center; justify-content: center; background: #ff9800; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">🎲</span>" to replace <span style="font-weight: bold; color: #ff9800;">that part only</span>.<br><br>Shuffle freely, use the images as hints, and speak out <span style="font-weight: bold; color: #ff5722;">"the complete sentence including hidden parts"</span>.<br><br>The English <span style="font-weight: bold; color: #4CAF50;">"form"</span> will naturally become ingrained.',
      'guide-step-4': 'English sentences can have <br>smaller sentences nested inside.<br><br>For example,<br><span style="font-weight: bold; color: #2196f3;">I know [that he loves me].</span><br><br>Such <span style="font-weight: bold; color: #ff5722;">"embedded sentences"</span> are normally <br>displayed in collapsed form.<br><br>Press <span style="display: inline-flex; align-items: center; justify-content: center; background: #2196f3; color: white; border: none; padding: 3px 6px; border-radius: 3px; font-size: 10px; font-weight: bold;">▼ Detail</span> <br>to expand and see the embedded sentence.<br><br><img src="images/guide/subslot-detail-example.png" style="width: 100%; max-width: 300px; margin-top: 10px; border: 2px solid #ddd; border-radius: 4px;">'
    }
  };

  // 現在の言語を取得する関数
  function getCurrentLanguage() {
    return localStorage.getItem('rephrase_language') || 'ja';
  }

  // ツールチップコンテンツを取得
  function getTooltipContent(stepId) {
    const lang = getCurrentLanguage();
    return tooltipTranslations[lang][stepId] || tooltipTranslations['ja'][stepId];
  }

  // ツールチップ要素を生成
  function createTooltip() {
    const tooltip = document.createElement('div');
    tooltip.id = 'guide-tooltip';
    tooltip.className = 'guide-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      display: none;
      background: rgba(255, 255, 255, 0.98);
      border: 2px solid #667eea;
      border-radius: 8px;
      padding: 12px 16px;
      max-width: 320px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      font-size: 13px;
      line-height: 1.6;
      color: #333;
    `;
    document.body.appendChild(tooltip);
    return tooltip;
  }

  // ツールチップを表示
  function showTooltip(element, stepId) {
    const tooltip = document.getElementById('guide-tooltip') || createTooltip();
    
    // ツールチップの内容を設定（翻訳対応）
    const content = getTooltipContent(stepId);
    tooltip.innerHTML = `
      <div>
        ${content}
      </div>
    `;
    
    // ツールチップの位置を計算
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // 基本位置: 要素の下中央
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    let top = rect.bottom + 8;
    
    // 画面外にはみ出る場合の調整
    if (left + tooltipRect.width > window.innerWidth - 20) {
      left = window.innerWidth - tooltipRect.width - 20;
    }
    if (left < 20) {
      left = 20;
    }
    
    // 下に表示スペースがない場合は上に表示
    if (top + tooltipRect.height > window.innerHeight - 20) {
      top = rect.top - tooltipRect.height - 8;
    }
    
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.display = 'block';
  }

  // ツールチップを非表示
  function hideTooltip() {
    const tooltip = document.getElementById('guide-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }

  // イベントリスナーを設定
  function initTooltips() {
    const stepIds = ['guide-step-1', 'guide-step-2', 'guide-step-3', 'guide-step-4'];
    
    stepIds.forEach(id => {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`⚠️ ツールチップ対象要素が見つかりません: ${id}`);
        return;
      }

      // ホバー時に表示
      element.addEventListener('mouseenter', () => {
        showTooltip(element, id);
      });

      // ホバー解除時に非表示
      element.addEventListener('mouseleave', () => {
        hideTooltip();
      });

      // クリック時も表示（スマホ対応）
      element.addEventListener('click', (e) => {
        const tooltip = document.getElementById('guide-tooltip');
        if (tooltip && tooltip.style.display === 'block') {
          hideTooltip();
        } else {
          showTooltip(element, id);
        }
        e.stopPropagation();
      });

      console.log(`✅ ツールチップ設定完了: ${id}`);
    });

    // ツールチップ外をクリックしたら閉じる
    document.addEventListener('click', (e) => {
      const tooltip = document.getElementById('guide-tooltip');
      if (tooltip && !tooltip.contains(e.target)) {
        hideTooltip();
      }
    });
  }

  // ツールチップを再描画（言語切り替え時に呼ばれる）
  function refreshTooltip() {
    const tooltip = document.getElementById('guide-tooltip');
    if (tooltip && tooltip.style.display === 'block') {
      // 現在表示中のツールチップを再描画
      const stepIds = ['guide-step-1', 'guide-step-2', 'guide-step-3', 'guide-step-4'];
      for (const id of stepIds) {
        const element = document.getElementById(id);
        if (element && element.matches(':hover')) {
          showTooltip(element, id);
          break;
        }
      }
    }
  }

  // DOMContentLoaded後に初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTooltips);
  } else {
    initTooltips();
  }

  // 言語切り替えイベントをリッスン
  window.addEventListener('languageChanged', refreshTooltip);

  console.log('✅ 初回ガイドツールチップシステム初期化完了');
})();
