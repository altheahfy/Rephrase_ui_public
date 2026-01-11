/**
 * Rephrase State Manager - 状態管理一元化システム
 * Phase2リファクタリング: JavaScript統合の中核システム
 * 
 * 設計方針:
 * - 既存のグローバル変数を段階的に統合
 * - localStorage自動同期
 * - 深いオブジェクト更新対応
 * - リスナーシステムによる状態変更通知
 */

class RephraseStateManager {
  constructor() {
    // 状態管理の中央ストア
    this.state = {
      // 表示制御状態
      visibility: {
        slots: {}, // 上位スロット表示状態
        subslots: {}, // サブスロット表示状態
        questionWord: {} // 疑問詞表示状態
      },
      
      // 音声関連状態
      audio: {
        isRecording: false,
        volume: 0.8,
        platform: this.detectPlatform(),
        progress: {}
      },
      
      // UI状態
      ui: {
        zoom: 1.0,
        controlPanelsVisible: true,
        currentSubslot: null,
        mobileDevice: this.isMobileDevice()
      },
      
      // スロットデータ
      slots: {
        lastSelected: {},
        fullSlotPool: null,
        currentExample: null
      },
      
      // セキュリティ関連
      security: {
        rateLimitData: {},
        authStatus: false
      },
      
      // マネージャー統合状態
      managers: {
        zoom: { initialized: false, instance: null },
        explanation: { initialized: false, instance: null },
        voice: { initialized: false, instance: null }
      }
    };
    
    // 状態変更リスナー
    this.listeners = new Map();
    
    // マネージャーインスタンス管理
    this.managerInstances = new Map();
    
    // localStorage同期設定
    this.syncKeys = [
      'visibility.slots',
      'visibility.subslots', 
      'visibility.questionWord',
      'audio.volume',
      'ui.zoom',
      'ui.controlPanelsVisible'
    ];
    
    // 初期化
    this.init();
  }
  
  /**
   * 初期化処理
   */
  init() {
    // localStorageから状態復元
    this.loadFromLocalStorage();
    
    // 既存グローバル変数の統合
    this.migrateExistingGlobalVars();
    
    // ブラウザイベントリスナー設定
    this.setupBrowserListeners();
    
    console.log('[RephraseStateManager] 初期化完了', this.state);
  }
  
  /**
   * 状態の取得（深いパス対応）
   * @param {string} path - 'visibility.slots.s.text' 形式のパス
   * @returns {any} 値
   */
  getState(path) {
    if (!path) return this.state;
    
    const keys = path.split('.');
    let current = this.state;
    
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }
    
    return current;
  }
  
  /**
   * 状態の更新（深いパス対応 + localStorage自動同期）
   * @param {string} path - 更新パス
   * @param {any} value - 新しい値
   * @param {boolean} notify - リスナー通知するか（デフォルト: true）
   */
  setState(path, value, notify = true) {
    if (!path) {
      console.error('[RephraseStateManager] パスが指定されていません');
      return;
    }
    
    console.log(`[RephraseStateManager] setState開始: ${path} = ${value}`);
    
    const keys = path.split('.');
    let current = this.state;
    
    // 深いパスまで移動
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // 最終キーに値を設定
    const finalKey = keys[keys.length - 1];
    const oldValue = current[finalKey];
    current[finalKey] = value;
    
    console.log(`[RephraseStateManager] 内部状態更新完了: ${path}`);
    console.log('[RephraseStateManager] 更新後の該当部分:', this.getState(path));
    
    // localStorage同期
    if (this.shouldSync(path)) {
      console.log(`[RephraseStateManager] localStorage同期対象: ${path}`);
      this.syncToLocalStorage(path, value);
    } else {
      console.log(`[RephraseStateManager] localStorage同期対象外: ${path}`);
    }
    
    // リスナー通知
    if (notify) {
      this.notifyListeners(path, value, oldValue);
    }
    
    console.log(`[RephraseStateManager] setState完了: ${path}`, value);
  }
  
  /**
   * 状態変更リスナーの登録
   * @param {string} path - 監視するパス（'*'で全体監視）
   * @param {function} callback - コールバック関数
   * @returns {string} リスナーID（削除用）
   */
  addListener(path, callback) {
    const listenerId = `listener_${Date.now()}_${Math.random()}`;
    
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Map());
    }
    
    this.listeners.get(path).set(listenerId, callback);
    
    return listenerId;
  }
  
  /**
   * リスナーの削除
   * @param {string} path - パス
   * @param {string} listenerId - リスナーID
   */
  removeListener(path, listenerId) {
    if (this.listeners.has(path)) {
      this.listeners.get(path).delete(listenerId);
    }
  }
  
  /**
   * リスナーへの通知
   * @param {string} path - 更新されたパス
   * @param {any} newValue - 新しい値
   * @param {any} oldValue - 古い値
   */
  notifyListeners(path, newValue, oldValue) {
    // 完全一致リスナー
    if (this.listeners.has(path)) {
      this.listeners.get(path).forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error('[RephraseStateManager] リスナーエラー:', error);
        }
      });
    }
    
    // 全体監視リスナー（'*'）
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(callback => {
        try {
          callback(newValue, oldValue, path);
        } catch (error) {
          console.error('[RephraseStateManager] 全体リスナーエラー:', error);
        }
      });
    }
  }
  
  /**
   * localStorage同期が必要かチェック
   * @param {string} path - パス
   * @returns {boolean}
   */
  shouldSync(path) {
    return this.syncKeys.some(syncKey => path.startsWith(syncKey));
  }
  
  /**
   * localStorageへの同期
   * @param {string} path - パス
   * @param {any} value - 値
   */
  syncToLocalStorage(path, value) {
    try {
      console.log(`[RephraseStateManager] syncToLocalStorage開始: ${path} = ${value}`);
      
      // 既存のlocalStorageキー命名規則に合わせる
      let storageKey;
      
      if (path.startsWith('visibility.slots')) {
        storageKey = 'rephrase_visibility_state';
      } else if (path.startsWith('visibility.subslots')) {
        storageKey = 'rephrase_subslot_visibility_state';
      } else if (path.startsWith('visibility.questionWord')) {
        storageKey = 'rephrase_question_word_visibility';
      } else if (path.startsWith('ui.controlPanelsVisible')) {
        storageKey = 'rephrase_subslot_visibility_state';
      } else {
        storageKey = `rephrase_${path.replace(/\./g, '_')}`;
      }
      
      console.log(`[RephraseStateManager] 使用するstorageKey: ${storageKey}`);
      
      // 既存データを取得して部分更新
      let existingData = {};
      try {
        const rawData = localStorage.getItem(storageKey);
        console.log(`[RephraseStateManager] 既存localStorage (raw): ${rawData}`);
        existingData = JSON.parse(rawData || '{}');
        console.log(`[RephraseStateManager] 既存localStorage (parsed):`, existingData);
      } catch (e) {
        console.log(`[RephraseStateManager] localStorage解析エラー、空オブジェクトで初期化:`, e);
        existingData = {};
      }
      
      // パスに応じた部分更新 - storageKey別に処理分岐
      let pathParts;
      
      if (storageKey === 'rephrase_visibility_state') {
        // visibility.slots.* の場合、slotsから始まるパス構造
        if (path.startsWith('visibility.slots.')) {
          pathParts = path.split('.').slice(2); // ['visibility', 'slots'] を除去
          console.log(`[RephraseStateManager] visibility.slots用パス分割:`, pathParts);
        } else {
          pathParts = [];
        }
      } else if (storageKey === 'rephrase_subslot_visibility_state') {
        // visibility.subslots.* の場合
        if (path.startsWith('visibility.subslots.')) {
          pathParts = path.split('.').slice(2); // ['visibility', 'subslots'] を除去
        } else if (path.startsWith('ui.controlPanelsVisible')) {
          pathParts = ['global_control_panels_visible']; // 既存キー名に合わせる
        } else {
          pathParts = [];
        }
      } else if (storageKey === 'rephrase_question_word_visibility') {
        // visibility.questionWord.* の場合
        if (path.startsWith('visibility.questionWord.')) {
          pathParts = path.split('.').slice(2); // ['visibility', 'questionWord'] を除去
        } else {
          pathParts = [];
        }
      } else {
        // その他のカスタムキーの場合、フルパスを使用
        pathParts = path.split('.');
      }
      
      console.log(`[RephraseStateManager] 最終パス分割結果:`, pathParts);
      
      let current = existingData;
      
      // 深いパス構造を安全に作成
      for (let i = 0; i < pathParts.length - 1; i++) {
        const key = pathParts[i];
        console.log(`[RephraseStateManager] パス作成中: ${key}, 現在のcurrent:`, current);
        
        if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
          console.log(`[RephraseStateManager] 新しいオブジェクト作成: ${key}`);
          current[key] = {};
        }
        current = current[key];
        console.log(`[RephraseStateManager] 移動後のcurrent:`, current);
      }
      
      // 最終キーに値を設定
      if (pathParts.length > 0) {
        const finalKey = pathParts[pathParts.length - 1];
        console.log(`[RephraseStateManager] 最終キー設定: ${finalKey} = ${value}`);
        current[finalKey] = value;
        console.log(`[RephraseStateManager] 設定後のcurrent:`, current);
      } else {
        // パスがトップレベルの場合は全体を置換
        console.log(`[RephraseStateManager] トップレベル設定`);
        existingData = value;
      }
      
      console.log(`[RephraseStateManager] 最終的なexistingData:`, existingData);
      
      const finalDataString = JSON.stringify(existingData);
      localStorage.setItem(storageKey, finalDataString);
      
      // 確認のため再読み込み
      const verification = localStorage.getItem(storageKey);
      console.log(`[RephraseStateManager] localStorage保存確認: ${verification}`);
      
      console.log(`[RephraseStateManager] localStorage同期完了: ${storageKey}`, existingData);
      
    } catch (error) {
      console.error('[RephraseStateManager] localStorage同期エラー:', error);
    }
  }
  
  /**
   * localStorageからの状態復元
   */
  loadFromLocalStorage() {
    try {
      // 既存のlocalStorageキーから復元
      const visibilityState = JSON.parse(localStorage.getItem('rephrase_visibility_state') || '{}');
      const subslotState = JSON.parse(localStorage.getItem('rephrase_subslot_visibility_state') || '{}');
      const questionWordState = JSON.parse(localStorage.getItem('rephrase_question_word_visibility') || '{}');
      
      // 状態に統合
      if (Object.keys(visibilityState).length > 0) {
        this.state.visibility.slots = visibilityState;
      }
      
      if (Object.keys(subslotState).length > 0) {
        this.state.visibility.subslots = subslotState;
        if (subslotState.global_control_panels_visible !== undefined) {
          this.state.ui.controlPanelsVisible = subslotState.global_control_panels_visible;
        }
      }
      
      if (Object.keys(questionWordState).length > 0) {
        this.state.visibility.questionWord = questionWordState;
      }
      
    } catch (error) {
      console.error('[RephraseStateManager] localStorage読み込みエラー:', error);
    }
  }
  
  /**
   * 既存グローバル変数の統合
   */
  migrateExistingGlobalVars() {
    // window.questionWordVisibilityState の統合
    if (window.questionWordVisibilityState) {
      this.state.visibility.questionWord = { ...window.questionWordVisibilityState };
    }
    
    // window.rateLimiter の統合
    if (window.rateLimiter) {
      this.state.security.rateLimitData = window.rateLimiter.getData?.() || {};
    }
    
    // window.fullSlotPool の統合
    if (window.fullSlotPool) {
      this.state.slots.fullSlotPool = window.fullSlotPool;
    }
    
    // window.lastSelectedSlots の統合
    if (window.lastSelectedSlots) {
      this.state.slots.lastSelected = window.lastSelectedSlots;
    }
  }
  
  /**
   * プラットフォーム検出
   * @returns {string} 'Android' | 'PC'
   */
  detectPlatform() {
    return /Android/i.test(navigator.userAgent) ? 'Android' : 'PC';
  }
  
  /**
   * モバイルデバイス検出
   * @returns {boolean}
   */
  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           window.innerWidth <= 768;
  }
  
  /**
   * ブラウザイベントリスナー設定
   */
  setupBrowserListeners() {
    // リサイズイベント
    window.addEventListener('resize', () => {
      this.setState('ui.mobileDevice', this.isMobileDevice(), false);
    });
    
    // ページ終了時にlocalStorage同期
    window.addEventListener('beforeunload', () => {
      this.saveToLocalStorage();
    });
  }
  
  /**
   * 全状態のlocalStorageへの保存
   */
  saveToLocalStorage() {
    this.syncKeys.forEach(path => {
      const value = this.getState(path);
      if (value !== undefined) {
        this.syncToLocalStorage(path, value);
      }
    });
  }
  
  /**
   * デバッグ用状態ダンプ
   */
  dumpState() {
    console.log('[RephraseStateManager] 現在の状態:', JSON.stringify(this.state, null, 2));
    return this.state;
  }
  
  /**
   * 既存システムとの互換性維持用ヘルパー
   */
  
  // 既存のvisibility_control.jsとの互換性
  getVisibilityState(slotId, elementType) {
    return this.getState(`visibility.slots.${slotId}.${elementType}`);
  }
  
  setVisibilityState(slotId, elementType, visible) {
    this.setState(`visibility.slots.${slotId}.${elementType}`, visible);
  }
  
  // 既存のsubslot_visibility_control.jsとの互換性
  getSubslotVisibilityState(subslotId, elementType) {
    return this.getState(`visibility.subslots.${subslotId}.${elementType}`);
  }
  
  setSubslotVisibilityState(subslotId, elementType, visible) {
    this.setState(`visibility.subslots.${subslotId}.${elementType}`, visible);
  }
  
  // 既存のquestion_word_visibility.jsとの互換性
  getQuestionWordVisibility(elementType) {
    return this.getState(`visibility.questionWord.${elementType}`);
  }
  
  setQuestionWordVisibility(elementType, visible) {
    this.setState(`visibility.questionWord.${elementType}`, visible);
  }
  
  /**
   * マネージャー登録機能
   */
  registerManager(name, instance) {
    this.managerInstances.set(name, instance);
    this.setState(`managers.${name}.initialized`, true);
    this.setState(`managers.${name}.instance`, instance);
    console.log(`[RephraseStateManager] マネージャー登録: ${name}`);
  }
  
  getManager(name) {
    return this.managerInstances.get(name);
  }
  
  getAllManagers() {
    return Array.from(this.managerInstances.entries()).map(([name, instance]) => ({
      name,
      instance,
      initialized: this.getState(`managers.${name}.initialized`)
    }));
  }
  
  /**
   * マネージャー統合初期化
   */
  initializeManagers() {
    console.log('[RephraseStateManager] マネージャー統合初期化開始');
    
    // ZoomControllerManagerの初期化
    if (window.ZoomControllerManager && !this.getManager('zoom')) {
      try {
        const zoomManager = new window.ZoomControllerManager();
        this.registerManager('zoom', zoomManager);
      } catch (error) {
        console.error('[RephraseStateManager] ZoomControllerManager初期化失敗:', error);
      }
    }
    
    console.log('[RephraseStateManager] マネージャー統合初期化完了');
  }
}

// クラスをグローバルにエクスポート
window.RephraseStateManager = RephraseStateManager;

// グローバルインスタンス作成
window.RephraseState = new RephraseStateManager();

// マネージャー統合初期化（DOM完了後）
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    window.RephraseState.initializeManagers();
  }, 100); // 早期初期化でVoiceSystemより先に実行
});

// デバッグ用関数をグローバルに公開
window.checkRephraseState = () => window.RephraseState.dumpState();
window.getRephraseManagers = () => window.RephraseState.getAllManagers();

console.log('[RephraseStateManager] 状態管理システム初期化完了');
