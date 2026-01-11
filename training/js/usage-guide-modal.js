/**
 * Rephrase 使い方ガイドモーダル
 * 簡潔な操作説明をモーダルで表示
 */

class UsageGuideModal {
  constructor() {
    this.modalId = 'usage-guide-modal';
    this.storageKey = 'rephrase_usage_guide_shown';
    this.init();
  }

  init() {
    // モーダルHTML作成
    this.createModalHTML();
    
    // イベントリスナー設定
    this.setupEventListeners();
    
    // 初回訪問時に自動表示
    if (!localStorage.getItem(this.storageKey)) {
      setTimeout(() => this.show(), 500); // 0.5秒後に表示
    }
  }

  createModalHTML() {
    const modalHTML = `
      <div id="${this.modalId}" class="usage-guide-modal" style="display: none;">
        <div class="usage-guide-overlay"></div>
        <div class="usage-guide-content">
          <button class="usage-guide-close" aria-label="閉じる">×</button>
          <h2>📖 使い方</h2>
          <div class="usage-steps">
            <div class="usage-step">
              <span class="step-number">①</span>
              <span class="step-text">🔄 シャッフルで「イラスト＝英語」を覚える</span>
            </div>
            <div class="usage-step">
              <span class="step-number">②</span>
              <span class="step-text">👁️ 練習したい場所の英語を消す（一部～全文）</span>
            </div>
            <div class="usage-step">
              <span class="step-number">③</span>
              <span class="step-text">🔄 シャッフルで練習（一部～全文）</span>
            </div>
          </div>
          <div class="usage-note">
            ※ 🔊 音声学習ボタンで発音確認・発話診断可能
          </div>
          <button class="usage-guide-start">始める</button>
          <label class="usage-guide-checkbox">
            <input type="checkbox" id="usage-guide-dont-show">
            <span>次回から表示しない</span>
          </label>
        </div>
      </div>
    `;

    // body要素に追加
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  setupEventListeners() {
    const modal = document.getElementById(this.modalId);
    const closeBtn = modal.querySelector('.usage-guide-close');
    const startBtn = modal.querySelector('.usage-guide-start');
    const overlay = modal.querySelector('.usage-guide-overlay');
    const dontShowCheckbox = document.getElementById('usage-guide-dont-show');

    // 閉じるボタン
    closeBtn.addEventListener('click', () => this.close());
    
    // オーバーレイクリックで閉じる
    overlay.addEventListener('click', () => this.close());
    
    // 始めるボタン
    startBtn.addEventListener('click', () => {
      if (dontShowCheckbox.checked) {
        localStorage.setItem(this.storageKey, 'true');
      }
      this.close();
    });

    // Escキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.style.display === 'flex') {
        this.close();
      }
    });
  }

  show() {
    const modal = document.getElementById(this.modalId);
    modal.style.display = 'flex';
    
    // フェードイン効果
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });
  }

  close() {
    const modal = document.getElementById(this.modalId);
    modal.classList.remove('show');
    
    // アニメーション終了後に非表示
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }

  // 手動で再表示する関数（「？」ボタンから呼び出し用）
  reopen() {
    this.show();
  }

  // リセット関数（開発・デバッグ用）
  reset() {
    localStorage.removeItem(this.storageKey);
    console.log('✅ 使い方ガイド設定をリセットしました');
  }
}

// グローバルスコープでインスタンス化
let usageGuideModal;

// DOMContentLoaded後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    usageGuideModal = new UsageGuideModal();
  });
} else {
  usageGuideModal = new UsageGuideModal();
}

// リセット関数をグローバルに公開（デバッグ用）
window.resetUsageGuide = () => {
  if (usageGuideModal) {
    usageGuideModal.reset();
  }
};

// 手動再表示関数をグローバルに公開（「？」ボタン用）
window.showUsageGuide = () => {
  if (usageGuideModal) {
    usageGuideModal.reopen();
  }
};
