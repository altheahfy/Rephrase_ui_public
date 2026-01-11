/**
 * 📚 ExplanationManager - 解説システム統合マネージャー
 * 
 * RephraseStateManagerとの統合:
 * - modal.visible: モーダル表示状態
 * - data.explanationData: 解説データ配列
 * - ui.buttons.explanation: 解説ボタン表示状態
 * - context.currentVGroupKey: 現在のV_group_key
 * 
 * 依存関係:
 * - RephraseStateManager (state management)
 * - DOM: explanationModal, randomize-all
 * - Global: window.lastSelectedSlots, window.currentRandomizedState
 * - JSON: data/V自動詞第1文型.json
 */

class ExplanationManager {
  constructor() {
    // RephraseStateManagerのインスタンスを取得または作成
    this.stateManager = window.stateManager || new window.RephraseStateManager();
    
    // グローバルにインスタンスを保存（他のマネージャーとの共有用）
    if (!window.stateManager) {
      window.stateManager = this.stateManager;
    }
    
    this.modal = null;
    this.isInitialized = false;
    
    // State paths for RephraseStateManager
    this.STATE_PATHS = {
      MODAL_VISIBLE: 'explanation.modal.visible',
      EXPLANATION_DATA: 'explanation.data.explanationData',
      BUTTON_VISIBLE: 'explanation.ui.buttons.explanation',
      CURRENT_V_GROUP_KEY: 'explanation.context.currentVGroupKey',
      INITIALIZATION_STATUS: 'explanation.system.isInitialized'
    };
    
    console.log('🎯 ExplanationManager初期化開始');
    this.initializeState();
  }

  // 初期状態の設定
  initializeState() {
    const defaultState = {
      explanation: {
        modal: {
          visible: false
        },
        data: {
          explanationData: []
        },
        ui: {
          buttons: {
            explanation: false
          }
        },
        context: {
          currentVGroupKey: null
        },
        system: {
          isInitialized: false
        }
      }
    };

    // デフォルト状態を設定
    Object.keys(defaultState.explanation).forEach(category => {
      Object.keys(defaultState.explanation[category]).forEach(key => {
        const path = `explanation.${category}.${key}`;
        if (this.stateManager.getState(path) === undefined) {
          this.stateManager.setState(path, defaultState.explanation[category][key]);
        }
      });
    });

    console.log('✅ ExplanationManager状態初期化完了');
  }

  // メイン初期化処理
  async initialize() {
    try {
      console.log('📚 ExplanationManager初期化中...');
      
      // モーダル要素の取得
      this.modal = document.getElementById('explanationModal');
      if (!this.modal) {
        console.error('❌ 解説モーダルが見つかりません');
        return false;
      }

      // モーダルイベントリスナーの設定
      this.setupModalEvents();
      
      // JSONデータの読み込み
      await this.loadExplanationData();
      
      // 解説ボタンの配置
      this.addExplanationButtons();

      // 初期化完了を状態に保存
      this.stateManager.setState(this.STATE_PATHS.INITIALIZATION_STATUS, true);
      this.isInitialized = true;
      
      // 言語切り替えイベントをリッスン
      window.addEventListener('languageChanged', () => {
        console.log('🌐 言語変更検出 - 解説ボタンを更新');
        this.updateExplanationButtons();
      });
      
      console.log('✅ ExplanationManager初期化完了');
      return true;
      
    } catch (error) {
      console.error('❌ ExplanationManager初期化エラー:', error);
      this.stateManager.setState(this.STATE_PATHS.INITIALIZATION_STATUS, false);
      return false;
    }
  }

  // JSONデータの読み込み
  async loadExplanationData() {
    try {
      const response = await fetch('data/V自動詞第1文型.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const allData = await response.json();
      
      // 解説データのみをフィルタリング
      const explanationData = allData.filter(item => item.explanation_title);
      
      // 状態に保存
      this.stateManager.setState(this.STATE_PATHS.EXPLANATION_DATA, explanationData);
      
      console.log(`📖 解説データ読み込み完了: ${explanationData.length}件`);
      
    } catch (error) {
      console.error('❌ 解説データ読み込みエラー:', error);
      this.stateManager.setState(this.STATE_PATHS.EXPLANATION_DATA, []);
    }
  }

  // モーダルイベントの設定
  setupModalEvents() {
    // 閉じるボタンのイベント
    const closeBtn = this.modal.querySelector('.explanation-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // モーダル背景クリックで閉じる
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // ESCキーで閉じる
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isModalOpen()) {
        this.closeModal();
      }
    });
  }

  // モーダルを開く
  openModal(title, content) {
    if (!this.modal) return;

    try {
      const titleElement = this.modal.querySelector('#explanationTitle');
      const contentElement = this.modal.querySelector('#explanationContent');

      if (titleElement) titleElement.textContent = title;
      if (contentElement) contentElement.innerHTML = content;

      this.modal.style.display = 'flex';
      // アニメーション用の遅延
      setTimeout(() => {
        this.modal.classList.add('show');
      }, 10);

      // 状態を保存
      this.stateManager.setState(this.STATE_PATHS.MODAL_VISIBLE, true);

      console.log('📖 解説モーダル開いた:', title);
      
    } catch (error) {
      console.error('❌ モーダル表示エラー:', error);
    }
  }

  // モーダルを閉じる
  closeModal() {
    if (!this.modal) return;

    this.modal.classList.remove('show');
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 300);

    // 状態を保存
    this.stateManager.setState(this.STATE_PATHS.MODAL_VISIBLE, false);

    console.log('📖 解説モーダル閉じた');
  }

  // モーダルが開いているかチェック
  isModalOpen() {
    return this.stateManager.getState(this.STATE_PATHS.MODAL_VISIBLE) || false;
  }

  // テスト用の解説表示
  showTestExplanation() {
    const explanationData = this.stateManager.getState(this.STATE_PATHS.EXPLANATION_DATA) || [];
    const testTitle = "解説システムテスト";
    const testContent = `
      <h4>✅ システム動作確認</h4>
      <p>ExplanationManagerが正常に動作しています。</p>
      <p><strong>読み込み済み解説データ:</strong> ${explanationData.length}件</p>
      <p><strong>状態管理:</strong> RephraseStateManager統合済み</p>
      <h4>📚 統合済み機能</h4>
      <ul>
        <li>モーダル表示状態の状態管理</li>
        <li>解説データの状態管理</li>
        <li>V_group_key検出機能</li>
        <li>解説ボタンの自動配置</li>
      </ul>
    `;
    
    this.openModal(testTitle, testContent);
  }

  // 現在のV_group_keyを検出
  getCurrentVGroupKey() {
    try {
      console.log('🔍 V_group_key検出開始');
      
      // 最優先: window.lastSelectedSlotsから現在表示中のV_group_keyを取得（リアルタイム）
      if (window.lastSelectedSlots && window.lastSelectedSlots.length > 0) {
        // 最初に見つかったスロットのV_group_keyを使用（全スロットが同じV_group_keyを持つ）
        const slotWithVGroupKey = window.lastSelectedSlots.find(slot => slot.V_group_key);
        if (slotWithVGroupKey && slotWithVGroupKey.V_group_key) {
          console.log('✅ window.lastSelectedSlotsから取得:', slotWithVGroupKey.V_group_key);
          // 状態管理にも保存（キャッシュ更新）
          this.stateManager.setState(this.STATE_PATHS.CURRENT_V_GROUP_KEY, slotWithVGroupKey.V_group_key);
          return slotWithVGroupKey.V_group_key;
        }
      }
      
      // フォールバック: window.currentRandomizedStateから取得
      if (window.currentRandomizedState && window.currentRandomizedState.vGroupKey) {
        console.log('✅ window.currentRandomizedState.vGroupKeyから取得:', window.currentRandomizedState.vGroupKey);
        this.stateManager.setState(this.STATE_PATHS.CURRENT_V_GROUP_KEY, window.currentRandomizedState.vGroupKey);
        return window.currentRandomizedState.vGroupKey;
      }
      
      // 最後の手段: 状態管理のキャッシュから取得（古い可能性があるが完全に空よりは良い）
      const cachedKey = this.stateManager.getState(this.STATE_PATHS.CURRENT_V_GROUP_KEY);
      if (cachedKey) {
        console.log('⚠️ 状態管理キャッシュから取得（古い可能性あり）:', cachedKey);
        return cachedKey;
      }
      
      console.log('❓ V_group_keyが見つかりません');
      console.log('📊 デバッグ情報:');
      console.log('  - window.lastSelectedSlots:', window.lastSelectedSlots);
      console.log('  - window.currentRandomizedState:', window.currentRandomizedState);
      
      return null;
      
    } catch (error) {
      console.error('❌ V_group_key検出エラー:', error);
      return null;
    }
  }

  // V_group_keyに対応する解説データを検索
  findExplanationByVGroupKey(vGroupKey) {
    if (!vGroupKey) return null;
    
    const explanationData = this.stateManager.getState(this.STATE_PATHS.EXPLANATION_DATA) || [];
    
    // 完全一致を最優先で検索
    let explanation = explanationData.find(item => 
      item.V_group_key === vGroupKey
    );
    
    if (explanation) {
      console.log('📖 解説データ発見（完全一致）:', explanation.explanation_title);
      return explanation;
    }
    
    // 完全一致がない場合、V_group_keyの基本形（数字やサフィックスを除去）で検索
    const baseVGroupKey = vGroupKey.replace(/\d+$/, ''); // 末尾の数字を除去
    if (baseVGroupKey !== vGroupKey) {
      explanation = explanationData.find(item => 
        item.V_group_key === baseVGroupKey
      );
      
      if (explanation) {
        console.log(`📖 解説データ発見（基本形一致）: ${vGroupKey} → ${baseVGroupKey} → ${explanation.explanation_title}`);
        return explanation;
      }
    }
    
    console.log('❓ 解説データなし:', vGroupKey);
    return null;
  }

  // 現在のコンテキストに基づいて解説を表示
  showContextualExplanation() {
    console.log('🔍 解説表示開始');
    
    const explanationData = this.stateManager.getState(this.STATE_PATHS.EXPLANATION_DATA) || [];
    
    // デバッグ: 現在の解説データ一覧を表示
    console.log('📊 利用可能な解説データ:', explanationData.map(item => ({
      V_group_key: item.V_group_key,
      title: item.explanation_title
    })));
    
    const vGroupKey = this.getCurrentVGroupKey();
    console.log('🎯 検出されたV_group_key:', vGroupKey);
    
    if (!vGroupKey) {
      this.openModal('解説情報なし', '<p>現在表示されている内容に対応する解説が見つかりません。<br>デバッグ情報をコンソールで確認してください。</p>');
      return;
    }

    const explanation = this.findExplanationByVGroupKey(vGroupKey);
    if (!explanation) {
      // 元の動詞テキストを取得してカスタムメッセージを表示
      const originalVerb = this.getOriginalVerbText();
      const debugInfo = `
        <p>「${originalVerb || vGroupKey}」に対応する解説が見つかりません。</p>
        <h4>🔍 デバッグ情報</h4>
        <p><strong>検出されたV_group_key:</strong> ${vGroupKey}</p>
        <p><strong>元の動詞:</strong> ${originalVerb}</p>
        <p><strong>利用可能な解説:</strong></p>
        <ul>
          ${explanationData.map(item => 
            `<li>${item.V_group_key}: ${item.explanation_title}</li>`
          ).join('')}
        </ul>
      `;
      this.openModal('解説情報なし', debugInfo);
      return;
    }

    this.showExplanation(explanation);
  }

  // 元の動詞テキストを取得（デバッグ用）
  getOriginalVerbText() {
    try {
      // 現在表示中のデータから動詞情報を取得
      if (window.lastSelectedSlots && window.lastSelectedSlots.length > 0) {
        const vSlot = window.lastSelectedSlots.find(slot => slot.Slot === 'V');
        if (vSlot && vSlot.SlotPhrase) {
          return vSlot.SlotPhrase;
        }
      }

      // フォールバック: DOM要素から取得
      const vSlot = document.getElementById('slot-v');
      if (vSlot) {
        const slotPhrase = vSlot.querySelector('.slot-phrase');
        if (slotPhrase) {
          return slotPhrase.textContent.trim();
        }
      }

      return 'N/A';
    } catch (error) {
      console.error('動詞テキスト取得エラー:', error);
      return 'N/A';
    }
  }

  // 解説データを表示
  showExplanation(explanationData) {
    const title = explanationData.explanation_title || '解説';
    const content = this.formatExplanationContent(explanationData);
    this.openModal(title, content);
  }

  // 解説コンテンツをHTMLフォーマット
  formatExplanationContent(data) {
    let html = '';
    
    if (data.explanation_content) {
      html += `<div class="explanation-main">${data.explanation_content}</div>`;
    }
    
    if (data.explanation_examples) {
      html += `
        <h4>📝 例文</h4>
        <div class="explanation-examples">${data.explanation_examples}</div>
      `;
    }
    
    if (data.explanation_notes) {
      html += `
        <h4>💡 補足説明</h4>
        <div class="explanation-notes">${data.explanation_notes}</div>
      `;
    }
    
    return html || '<p>解説内容が登録されていません。</p>';
  }

  // 解説ボタンを例文シャッフルボタンの右横に追加
  addExplanationButtons() {
    try {
      console.log('🔧 解説ボタン配置開始');
      
      // 英語ON/OFFボタンを検索（解説ボタンをその後に配置）
      const hideEnglishBtn = document.getElementById('hide-all-english-visibility');
      if (!hideEnglishBtn) {
        console.log('❓ 英語ON/OFFボタンが見つかりません');
        return;
      }

      // 既存の解説ボタンを削除
      const existingBtn = document.getElementById('explanation-btn');
      if (existingBtn) {
        existingBtn.remove();
      }

      // 解説ボタンを作成
      const explanationBtn = document.createElement('button');
      explanationBtn.id = 'explanation-btn';
      explanationBtn.className = 'explanation-btn';
      explanationBtn.textContent = '💡 例文解説';
      explanationBtn.title = '文法解説を表示';
      explanationBtn.setAttribute('data-i18n', 'btn-explanation-full');
      explanationBtn.setAttribute('data-i18n-title', 'tooltip-explanation');
      
      // スタイルを例文シャッフルボタンと調和させる
      explanationBtn.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
        margin-left: 10px;
      `;
      
      // ホバーエフェクトを追加
      explanationBtn.addEventListener('mouseover', () => {
        explanationBtn.style.transform = 'scale(1.05)';
      });
      explanationBtn.addEventListener('mouseout', () => {
        explanationBtn.style.transform = 'scale(1)';
      });
      
      // クリックイベントを追加
      explanationBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showContextualExplanation();
      });

      // 英語ON/OFFボタンの右横に配置（希望順序: シャッフル → 英語ON/OFF → 解説 → 音声学習）
      hideEnglishBtn.insertAdjacentElement('afterend', explanationBtn);
      console.log('✅ 例文解説ボタンを配置しました');
      
      // 🎤 音声学習ボタンを解説ボタンの後ろに移動（既存ボタンを活用）
      const voiceBtn = document.getElementById('voice-panel-open-btn');
      if (voiceBtn) {
        // 解説ボタンの直後に移動
        explanationBtn.insertAdjacentElement('afterend', voiceBtn);
        // スタイル調整
        voiceBtn.style.marginLeft = '10px';
        console.log('✅ 音声学習ボタンを解説ボタンの右横に移動しました');
      }
      
      // 🌐 翻訳を適用（language_switcher.jsのapplyTranslations()を呼び出す）
      if (typeof applyTranslations === 'function') {
        applyTranslations();
      }
      
      // 状態に保存
      this.stateManager.setState(this.STATE_PATHS.BUTTON_VISIBLE, true);
      
      console.log('✅ 英語ON/OFFボタンの右横に解説ボタン追加完了');
      
    } catch (error) {
      console.error('❌ 解説ボタン配置エラー:', error);
    }
  }

  // ボタンを更新（データ読み込み後などに呼ぶ）
  updateExplanationButtons() {
    if (this.isInitialized) {
      this.addExplanationButtons();
    }
  }

  // 状態のリセット
  resetState() {
    this.stateManager.setState(this.STATE_PATHS.MODAL_VISIBLE, false);
    this.stateManager.setState(this.STATE_PATHS.CURRENT_V_GROUP_KEY, null);
    console.log('🔄 ExplanationManager状態リセット完了');
  }

  // 現在の状態を取得（デバッグ用）
  getDebugState() {
    return {
      modalVisible: this.stateManager.getState(this.STATE_PATHS.MODAL_VISIBLE),
      explanationDataCount: (this.stateManager.getState(this.STATE_PATHS.EXPLANATION_DATA) || []).length,
      buttonVisible: this.stateManager.getState(this.STATE_PATHS.BUTTON_VISIBLE),
      currentVGroupKey: this.stateManager.getState(this.STATE_PATHS.CURRENT_V_GROUP_KEY),
      isInitialized: this.stateManager.getState(this.STATE_PATHS.INITIALIZATION_STATUS)
    };
  }
}

// 後方互換性: グローバル変数のサポート
let explanationSystem = null;

// 後方互換性: グローバル関数のサポート
function testExplanation() {
  if (window.explanationManager && window.explanationManager.isInitialized) {
    window.explanationManager.showTestExplanation();
  } else {
    console.log('❌ ExplanationManagerが初期化されていません');
  }
}

function showExplanation() {
  if (window.explanationManager && window.explanationManager.isInitialized) {
    window.explanationManager.showContextualExplanation();
  } else {
    console.log('❌ ExplanationManagerが初期化されていません');
  }
}

// グローバル露出
window.ExplanationManager = ExplanationManager;
window.testExplanation = testExplanation;
window.showExplanation = showExplanation;

console.log('📚 ExplanationManager class definition loaded');
