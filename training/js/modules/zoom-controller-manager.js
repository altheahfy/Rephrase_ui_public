/**
 * ZoomControllerManager - 手動ズーム・縮小機構
 * 
 * スピーキング練習時の視認性向上のため、スロット空間全体を縦横比を保ったまま拡大・縮小する機構
 * 設計仕様書 zoom_controller_specification.md に基づく実装
 * 
 * 主要機能:
 * - リアルタイムズーム調整（50%〜150%）
 * - 縦横比保持（CSS transform: scale）
 * - 位置関係維持（上位スロット・サブスロット）
 * - 設定永続化（localStorage）
 * - 動的サブスロット対応（MutationObserver）
 * - スロット種別による個別処理（S,C1特別対応）
 * 
 * @version 1.1
 * @date 2025-08-02
 */

class ZoomControllerManager {
  constructor() {
    // RephraseStateManagerのインスタンスを取得（既存のwindow.RephraseStateを使用）
    this.stateManager = window.RephraseState || window.stateManager;
    
    // stateManagerが存在しない場合のフォールバック
    if (!this.stateManager) {
      console.warn('⚠️ RephraseStateManagerが見つかりません。基本機能のみで動作します。');
      this.stateManager = {
        setState: () => {},
        getState: () => undefined,
        registerManager: () => {}
      };
    }
    
    // グローバルにインスタンスを保存（他のマネージャーとの共有用）
    if (!window.stateManager && this.stateManager !== window.RephraseState) {
      window.stateManager = this.stateManager;
    }
    
    // DOM要素参照
    this.zoomSlider = null;
    this.zoomValue = null;
    this.zoomResetButton = null;
    this.scrollHint = null;
    
    // ズーム制御プロパティ
    this.targetContainers = []; // ズーム対象のコンテナ
    this.originalMarginValues = new Map(); // 元のmargin-left値を保存
    this.currentZoom = 1.0;
    this.storageKey = 'rephrase_zoom_level';
    
    // 無限ループ対策用プロパティ
    this.isObserverPaused = false;
    this.lastUpdateTime = 0;
    this.mutationObserver = null;
    
    // 初期化状態
    this.isInitialized = false;
    
    // State paths for RephraseStateManager（統一パターン）
    this.STATE_PATHS = {
      ZOOM_CURRENT: 'zoom.ui.current',
      ZOOM_PERCENTAGE: 'zoom.ui.percentage', 
      ZOOM_SAVED: 'zoom.storage.saved',
      ZOOM_LAST_MODIFIED: 'zoom.storage.lastModified',
      TARGET_CONTAINER_COUNT: 'zoom.system.targetContainerCount',
      OBSERVER_PAUSED: 'zoom.system.observerPaused',
      INITIALIZATION_STATUS: 'zoom.system.isInitialized'
    };
    
    console.log('🔍 ZoomControllerManager初期化開始');
    this.initializeState();
    this.init();
  }

  // 初期状態の設定（ExplanationManagerパターン適用）
  initializeState() {
    const defaultState = {
      zoom: {
        ui: {
          current: 1.0,
          percentage: 100
        },
        storage: {
          saved: 1.0,
          lastModified: Date.now()
        },
        system: {
          targetContainerCount: 0,
          observerPaused: false,
          isInitialized: false
        }
      }
    };

    // デフォルト状態を設定
    Object.keys(defaultState.zoom).forEach(category => {
      Object.keys(defaultState.zoom[category]).forEach(key => {
        const path = `zoom.${category}.${key}`;
        if (this.stateManager.getState(path) === undefined) {
          this.stateManager.setState(path, defaultState.zoom[category][key]);
        }
      });
    });

    console.log('✅ ZoomControllerManager状態初期化完了');
  }

  /**
   * 初期化
   */
  async init() {
    try {
      console.log('🔍 ZoomControllerManager初期化中...');
      
      // DOM要素の取得
      if (!this.acquireDOMElements()) {
        console.warn('⚠️ ズームコントロール要素が見つかりません - 遅延初期化を試行');
        this.scheduleDelayedInit();
        return false;
      }

      // ズーム対象コンテナの特定
      this.identifyTargetContainers();
      
      // 保存されたズーム値を読み込み
      this.loadZoomLevel();
      
      // イベントリスナーの設定
      this.setupEventListeners();
      
      // スクロールヒント要素を作成
      this.createScrollHint();
      
      // 動的サブスロット監視開始
      this.setupDynamicSubslotObserver();
      
      // 初期化完了状態を設定
      this.isInitialized = true;
      this.stateManager.setState(this.STATE_PATHS.INITIALIZATION_STATUS, true);
      
      // RephraseStateManagerにマネージャーとして登録
      if (window.RephraseState && window.RephraseState.registerManager) {
        window.RephraseState.registerManager('zoom', this);
      }
      
      console.log('🔍 ZoomControllerManager初期化完了');
      return true;
      
    } catch (error) {
      console.error('❌ ZoomControllerManager初期化失敗:', error);
      return false;
    }
  }

  /**
   * DOM要素の取得
   * @returns {boolean} 要素取得成功フラグ
   */
  acquireDOMElements() {
    this.zoomSlider = document.getElementById('zoomSlider');
    this.zoomValue = document.getElementById('zoomValue');
    this.zoomResetButton = document.getElementById('zoomResetButton');
    
    if (!this.zoomSlider || !this.zoomValue || !this.zoomResetButton) {
      console.warn('⚠️ ズームコントロール要素が見つかりません');
      console.warn(`   zoomSlider: ${!!this.zoomSlider}`);
      console.warn(`   zoomValue: ${!!this.zoomValue}`);
      console.warn(`   zoomResetButton: ${!!this.zoomResetButton}`);
      return false;
    }
    
    return true;
  }

  /**
   * 遅延初期化（DOM要素が見つからない場合）
   */
  scheduleDelayedInit() {
    let attempts = 0;
    const maxAttempts = 10;
    
    const delayedInit = () => {
      attempts++;
      
      this.zoomSlider = document.getElementById('zoomSlider');
      this.zoomValue = document.getElementById('zoomValue');
      this.zoomResetButton = document.getElementById('zoomResetButton');
      
      if (this.zoomSlider && this.zoomValue && this.zoomResetButton) {
        console.log(`🔍 遅延初期化成功 (試行${attempts}回目)`);
        this.identifyTargetContainers();
        this.loadZoomLevel();
        this.setupEventListeners();
        this.createScrollHint();
        console.log('🔍 ZoomControllerManager遅延初期化完了');
      } else if (attempts < maxAttempts) {
        setTimeout(delayedInit, 500);
      } else {
        console.error('❌ ZoomControllerManager初期化失敗 - DOM要素が見つかりません');
      }
    };
    
    setTimeout(delayedInit, 500);
  }

  /**
   * ズーム対象となるコンテナを特定
   * 設計仕様書に基づく正確なDOM要素特定アルゴリズム
   */
  identifyTargetContainers() {
    // 既存のコンテナリストをクリア
    this.targetContainers = [];

    // スロット領域全体を含むsection要素を特定
    const sections = document.querySelectorAll('section');
    let slotSection = null;
    
    sections.forEach(section => {
      // 例文シャッフルボタンとslot-wrapperを含むsectionを探す
      const hasShuffleButton = section.querySelector('#randomize-all');
      const hasSlotWrapper = section.querySelector('.slot-wrapper');
      
      if (hasShuffleButton && hasSlotWrapper) {
        slotSection = section;
      }
    });

    if (slotSection) {
      this.targetContainers.push({
        element: slotSection,
        type: 'slot-section',
        id: 'slot-section'
      });
      console.log('🎯 ズーム対象: スロット領域全体（section要素）');
      
      // 展開中のサブスロットも個別に追加
      const visibleSubslots = document.querySelectorAll('.slot-wrapper[id$="-sub"]:not([style*="display: none"])');
      console.log(`📱 展開中のサブスロット: ${visibleSubslots.length}個`);
      
      visibleSubslots.forEach(subslot => {
        this.targetContainers.push({
          element: subslot,
          type: 'subslot',
          id: subslot.id
        });
        console.log(`🎯 サブスロット追加: ${subslot.id}`);
        
        // 元のmargin-left値を保存
        this.saveOriginalMarginValue(subslot);
        
        // サブスロット内の個別コンテナも処理対象に追加
        const subslotContainers = subslot.querySelectorAll('.subslot-container');
        subslotContainers.forEach(container => {
          this.targetContainers.push({
            element: container,
            type: 'subslot-container',
            id: container.id
          });
        });
      });
    } else {
      console.warn('⚠️ スロット領域のsection要素が見つかりません');
      
      // フォールバック：個別にslot-wrapperを対象とする
      const mainSlotWrapper = document.querySelector('.slot-wrapper:not([id$="-sub"])');
      if (mainSlotWrapper) {
        this.targetContainers.push({
          element: mainSlotWrapper,
          type: 'main',
          id: 'main-slots'
        });
        console.log('🎯 フォールバック: メインスロットのみ対象');
      }
      
      // フォールバック時も展開中のサブスロットを追加
      const visibleSubslots = document.querySelectorAll('.slot-wrapper[id$="-sub"]:not([style*="display: none"])');
      visibleSubslots.forEach(subslot => {
        this.targetContainers.push({
          element: subslot,
          type: 'subslot',
          id: subslot.id
        });
        this.saveOriginalMarginValue(subslot);
      });
    }

    console.log(`🎯 ズーム対象コンテナ: ${this.targetContainers.length}個を特定`);
  }

  /**
   * 元のmargin-left値を保存
   * @param {HTMLElement} subslot - サブスロット要素
   */
  saveOriginalMarginValue(subslot) {
    if (this.originalMarginValues.has(subslot.id)) {
      return; // 既に保存済みの場合はスキップ
    }

    const currentMarginLeft = getComputedStyle(subslot).getPropertyValue('--dynamic-margin-left');
    const actualMarginLeft = getComputedStyle(subslot).marginLeft;
    const inlineMarginLeft = subslot.style.marginLeft;
    
    let valueToSave = null;
    let saveSource = '';
    
    // 保存優先順位: インライン値 → 計算された値
    if (inlineMarginLeft && inlineMarginLeft !== '0px' && inlineMarginLeft !== 'auto') {
      valueToSave = parseFloat(inlineMarginLeft);
      saveSource = 'インライン';
    } else if (actualMarginLeft && actualMarginLeft !== '0px' && actualMarginLeft !== 'auto') {
      valueToSave = parseFloat(actualMarginLeft);
      saveSource = '計算値';
    }
    
    if (valueToSave && !isNaN(valueToSave) && valueToSave > 0) {
      this.originalMarginValues.set(subslot.id, valueToSave);
      console.log(`✅ margin-left保存: ${subslot.id} → ${valueToSave}px (${saveSource})`);
    }
  }

  /**
   * イベントリスナーの設定
   */
  setupEventListeners() {
    // スライダー変更時のリアルタイムズーム
    this.zoomSlider.addEventListener('input', (e) => {
      const zoomLevel = parseFloat(e.target.value);
      this.applyZoom(zoomLevel);
      this.updateZoomDisplay(zoomLevel);
    });

    // スライダー操作完了時の保存
    this.zoomSlider.addEventListener('change', (e) => {
      const zoomLevel = parseFloat(e.target.value);
      this.saveZoomLevel(zoomLevel);
    });

    // リセットボタン
    this.zoomResetButton.addEventListener('click', () => {
      this.resetZoom();
    });

    // サブスロット展開時の動的対応
    this.setupDynamicSubslotObserver();
  }

  /**
   * ズームレベルの適用
   * 設計仕様書に基づくスロット種別による個別処理
   * @param {number} zoomLevel - ズーム倍率 (0.5 - 1.5)
   */
  applyZoom(zoomLevel) {
    this.currentZoom = zoomLevel;
    
    console.log(`🔍 ズーム適用: ${Math.round(zoomLevel * 100)}% (対象数: ${this.targetContainers.length})`);
    
    this.targetContainers.forEach((container) => {
      if (!container.element) return;
      
      if (container.type === 'slot-section') {
        // section全体にtransform: scaleを適用
        container.element.style.setProperty('transform', `scale(${zoomLevel})`, 'important');
        container.element.style.setProperty('transform-origin', 'top left', 'important');
        
        // ズーム時の幅・オーバーフロー制御
        container.element.style.setProperty('max-width', 'none', 'important');
        container.element.style.setProperty('width', '100%', 'important');
        container.element.style.setProperty('overflow-x', 'visible', 'important');
        container.element.style.setProperty('overflow-y', 'visible', 'important');
        
        console.log(`  🎯 section全体にscale適用: ${zoomLevel}`);
        
      } else if (container.type === 'subslot' && 
                 (container.id === 'slot-s-sub' || container.id === 'slot-c1-sub')) {
        // S, C1のみ個別スケール適用 + 垂直位置補正
        container.element.style.setProperty('transform', `scale(${zoomLevel})`, 'important');
        container.element.style.setProperty('transform-origin', 'top left', 'important');
        
        // 🔗 タブ接続中の場合はmargin-top補正をスキップ（タブ接続のmargin-top: -80pxを保持）
        const hasTabConnection = container.element.classList.contains('active-subslot-area');
        
        if (hasTabConnection) {
          console.log(`  🔗 タブ接続中のため垂直補正をスキップ: ${container.id}`);
        } else {
          // 垂直位置補正（設計仕様書の補正計算式）
          if (zoomLevel < 1.0) {
            const verticalCorrection = (1 - zoomLevel) * 600;
            container.element.style.setProperty('margin-top', `-${verticalCorrection}px`, 'important');
            console.log(`  🔧 S/C1垂直補正: ${container.id} → margin-top: -${verticalCorrection}px`);
          } else {
            container.element.style.removeProperty('margin-top');
          }
        }
        
        console.log(`  🆘 S/C1個別scale適用: ${container.id} → ${zoomLevel}`);
        
      } else if (container.type === 'subslot') {
        // その他のサブスロット: section全体のscaleに加えて補正適用
        const scaleCorrection = Math.min(1.2, 1 + (1 - zoomLevel) * 0.3);
        container.element.style.setProperty('transform', `scale(${scaleCorrection})`, 'important');
        container.element.style.setProperty('transform-origin', 'top left', 'important');
        console.log(`  🔧 その他サブスロット補正: ${container.id} → scale(${scaleCorrection})`);
      }
      
      // スケール適用時の位置調整（縮小時の空白削減）
      if (zoomLevel < 1.0) {
        const spaceReduction = (1 - zoomLevel) * 50;
        container.element.style.marginBottom = `-${spaceReduction}px`;
      } else {
        container.element.style.marginBottom = '';
      }
    });

    // 高ズーム時のスクロールヒント表示
    if (zoomLevel > 1.3) {
      this.showScrollHint(true);
    }

    // 状態管理システムに反映
    if (this.stateManager && this.stateManager.setState) {
      this.stateManager.setState('ui.zoom', zoomLevel);
    }
  }

  /**
   * ズーム表示の更新
   * @param {number} zoomLevel - ズーム倍率
   */
  updateZoomDisplay(zoomLevel) {
    const percentage = Math.round(zoomLevel * 100);
    this.zoomValue.textContent = `${percentage}%`;
    
    // パーセンテージに応じた色変更
    if (zoomLevel < 0.8) {
      this.zoomValue.style.color = '#FF5722'; // 縮小時は赤
    } else if (zoomLevel > 1.2) {
      this.zoomValue.style.color = '#4CAF50'; // 拡大時は緑
    } else {
      this.zoomValue.style.color = '#666'; // 通常時はグレー
    }
  }

  /**
   * ズームレベルのlocalStorageへの保存
   * @param {number} zoomLevel - 保存するズーム倍率
   */
  saveZoomLevel(zoomLevel) {
    try {
      localStorage.setItem(this.storageKey, zoomLevel.toString());
      console.log(`💾 ズームレベル保存: ${Math.round(zoomLevel * 100)}%`);
    } catch (error) {
      console.warn('⚠️ ズームレベルの保存に失敗:', error);
    }
  }

  /**
   * 保存されたズームレベルの読み込み
   * 設計仕様：100%(1.0)の値のみ復元、それ以外は強制的に100%にリセット
   */
  loadZoomLevel() {
    try {
      const savedZoom = localStorage.getItem(this.storageKey);
      if (savedZoom) {
        const zoomLevel = parseFloat(savedZoom);
        // 設計仕様に従い、1.0(100%)の値のみ復元
        if (zoomLevel === 1.0) {
          this.zoomSlider.value = zoomLevel;
          this.applyZoom(zoomLevel);
          this.updateZoomDisplay(zoomLevel);
          console.log(`📚 100%ズームレベル復元完了`);
        } else {
          console.log(`🔄 非100%ズームレベル検出 (${Math.round(zoomLevel * 100)}%) → 100%にリセット`);
          this.forceDefaultZoom();
        }
      } else {
        this.forceDefaultZoom();
      }
    } catch (error) {
      console.warn('⚠️ ズームレベルの読み込みに失敗:', error);
      this.forceDefaultZoom();
    }
  }

  /**
   * 強制的にデフォルト100%を設定
   */
  forceDefaultZoom() {
    const defaultZoom = 1.0;
    this.zoomSlider.value = defaultZoom;
    this.applyZoom(defaultZoom);
    this.updateZoomDisplay(defaultZoom);
    this.saveZoomLevel(defaultZoom);
    console.log('🔄 ズームレベルを強制的に100%に設定');
  }

  /**
   * ズームリセット（100%に戻す）
   */
  resetZoom() {
    const defaultZoom = 1.0;
    this.zoomSlider.value = defaultZoom;
    this.applyZoom(defaultZoom);
    this.updateZoomDisplay(defaultZoom);
    this.saveZoomLevel(defaultZoom);
    
    console.log('🔄 ズームレベルをリセットしました');
  }

  /**
   * 動的なサブスロット展開に対応
   * MutationObserverでサブスロットの表示変更を監視（無限ループ対策付き）
   */
  setupDynamicSubslotObserver() {
    this.isObserverPaused = false;
    this.lastUpdateTime = 0;
    
    const observer = new MutationObserver((mutations) => {
      // 観測が一時停止中の場合はスキップ
      if (this.isObserverPaused) {
        return;
      }
      
      // 短時間での連続実行を防ぐ（デバウンス）
      const now = Date.now();
      if (now - this.lastUpdateTime < 500) {
        return;
      }
      
      let needsUpdate = false;
      let subslotChange = false;

      mutations.forEach((mutation) => {
        // ズーム関連のstyle変更は除外
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target.classList.contains('slot-wrapper') && target.id && target.id.endsWith('-sub')) {
            // displayプロパティの変更のみを対象とする
            const oldStyle = mutation.oldValue || '';
            const newStyle = target.getAttribute('style') || '';
            
            const oldDisplay = oldStyle.includes('display:') || oldStyle.includes('display ');
            const newDisplay = newStyle.includes('display:') || newStyle.includes('display ');
            
            if (oldDisplay !== newDisplay) {
              console.log(`📱 サブスロット表示変更検出: ${target.id}`);
              needsUpdate = true;
              subslotChange = true;
            }
          }
        }
        
        // DOM追加・削除の監視
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // サブスロット要素の追加
              if (node.classList && node.classList.contains('slot-wrapper') && 
                  node.id && node.id.endsWith('-sub')) {
                console.log(`➕ サブスロット要素追加: ${node.id}`);
                needsUpdate = true;
                subslotChange = true;
              }
              
              // サブスロット内の子要素追加
              const subWrappers = node.querySelectorAll && node.querySelectorAll('.slot-wrapper[id$="-sub"]');
              if (subWrappers && subWrappers.length > 0) {
                console.log(`➕ サブスロット子要素追加: ${subWrappers.length}個`);
                needsUpdate = true;
                subslotChange = true;
              }
            }
          });
        }
      });

      if (needsUpdate) {
        this.lastUpdateTime = now;
        
        // 観測を一時停止してズーム適用
        this.isObserverPaused = true;
        
        // サブスロット変更時は遅延させて確実に適用
        const delay = subslotChange ? 300 : 100;
        setTimeout(() => {
          console.log('🔄 サブスロット変更によるズーム再適用');
          this.identifyTargetContainers();
          this.applyZoom(this.currentZoom);
          
          // 処理完了後、観測を再開
          setTimeout(() => {
            this.isObserverPaused = false;
          }, 200);
        }, delay);
      }
    });

    // 監視範囲を限定
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class'],
      attributeOldValue: true
    });

    this.mutationObserver = observer;
    console.log('👁️ 無限ループ対策付きサブスロット動的監視を開始');
  }

  /**
   * 外部からのズーム調整API
   * @param {number} zoomLevel - 設定するズーム倍率
   */
  setZoom(zoomLevel) {
    if (zoomLevel >= 0.5 && zoomLevel <= 1.5) {
      this.zoomSlider.value = zoomLevel;
      this.applyZoom(zoomLevel);
      this.updateZoomDisplay(zoomLevel);
      this.saveZoomLevel(zoomLevel);
    }
  }

  /**
   * 現在のズームレベルを取得
   * @returns {number} 現在のズーム倍率
   */
  getCurrentZoom() {
    return this.currentZoom;
  }

  /**
   * サブスロット検出を強制実行
   */
  forceSubslotDetection() {
    console.log('🔍 サブスロット強制検出を実行');
    
    const allSubSlotWrappers = document.querySelectorAll('.slot-wrapper[id$="-sub"]');
    console.log(`📊 発見されたサブスロット要素総数: ${allSubSlotWrappers.length}`);
    
    // 対象コンテナの再検出
    this.identifyTargetContainers();
    
    // 現在のズーム値で再適用
    const currentZoomFromSlider = parseFloat(this.zoomSlider.value) || 1.0;
    this.currentZoom = currentZoomFromSlider;
    this.applyZoom(this.currentZoom);
    
    // 遅延での追加確認処理
    setTimeout(() => {
      const visibleSubslots = document.querySelectorAll('.slot-wrapper[id$="-sub"]:not([style*="display: none"])');
      console.log(`👁️ 表示中のサブスロット数: ${visibleSubslots.length}`);
      
      visibleSubslots.forEach(subslot => {
        const currentTransform = subslot.style.transform;
        if (!currentTransform.includes('scale')) {
          console.log(`🔧 ${subslot.id} にズームを再適用`);
          subslot.style.setProperty('transform', `scale(${this.currentZoom})`, 'important');
          subslot.style.setProperty('transform-origin', 'top left', 'important');
        }
      });
    }, 200);
  }

  /**
   * スクロールヒント要素の作成
   */
  createScrollHint() {
    const hint = document.createElement('div');
    hint.id = 'zoomScrollHint';
    hint.className = 'zoom-scroll-hint';
    hint.innerHTML = '🔍 ズーム中：横スクロールで全体を確認';
    hint.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      font-size: 14px;
      z-index: 10000;
      opacity: 0;
      transition: opacity 0.3s;
      pointer-events: none;
    `;
    
    // show クラス用のスタイル
    const style = document.createElement('style');
    style.textContent = `
      .zoom-scroll-hint.show {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(hint);
    this.scrollHint = hint;
  }

  /**
   * スクロールヒントの表示制御
   * @param {boolean} show - 表示するかどうか
   */
  showScrollHint(show) {
    if (this.scrollHint) {
      if (show) {
        this.scrollHint.classList.add('show');
        // 3秒後に自動非表示
        setTimeout(() => {
          if (this.scrollHint) {
            this.scrollHint.classList.remove('show');
          }
        }, 3000);
      } else {
        this.scrollHint.classList.remove('show');
      }
    }
  }

  /**
   * デバッグ情報の出力
   */
  debugInfo() {
    console.log('🔍 ZoomControllerManager状態:');
    console.log('- 現在のズーム:', this.getCurrentZoom());
    console.log('- 対象コンテナ数:', this.targetContainers.length);
    console.log('- 観測一時停止:', this.isObserverPaused);
    console.log('- 保存されたmargin値:', this.originalMarginValues);
  }

  /**
   * 垂直位置診断
   */
  debugVerticalPosition() {
    console.log('📏 === 垂直位置診断 ===');
    const subslots = document.querySelectorAll('.slot-wrapper[id$="-sub"]:not([style*="display: none"])');
    
    subslots.forEach(subslot => {
      const computed = getComputedStyle(subslot);
      const rect = subslot.getBoundingClientRect();
      
      console.log(`\n📍 ${subslot.id}:`);
      console.log(`  位置: top=${rect.top}px, left=${rect.left}px`);
      console.log(`  margin: top="${computed.marginTop}", bottom="${computed.marginBottom}"`);
      console.log(`  transform: "${computed.transform}"`);
      console.log(`  transform-origin: "${computed.transformOrigin}"`);
    });
  }

  /**
   * 設定完全リセット
   */
  resetSettings() {
    try {
      localStorage.removeItem(this.storageKey);
      this.originalMarginValues.clear();
      this.forceDefaultZoom();
      console.log('🔄 ズーム設定を完全リセットしました');
    } catch (error) {
      console.error('❌ ズーム設定リセットに失敗:', error);
    }
  }

  /**
   * マネージャーの破棄
   */
  destroy() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    if (this.scrollHint) {
      this.scrollHint.remove();
    }
    
    // イベントリスナーの削除
    if (this.zoomSlider) {
      this.zoomSlider.removeEventListener('input', this.applyZoom);
      this.zoomSlider.removeEventListener('change', this.saveZoomLevel);
    }
    
    if (this.zoomResetButton) {
      this.zoomResetButton.removeEventListener('click', this.resetZoom);
    }
    
    console.log('🗑️ ZoomControllerManager破棄完了');
  }
}

// グローバルAPI用の変数
let globalZoomController = null;

// 初期化関数
function initZoomController() {
  if (!globalZoomController) {
    globalZoomController = new ZoomControllerManager();
    
    // グローバルAPIとして公開
    window.zoomController = globalZoomController;
    window.setZoom = (level) => globalZoomController.setZoom(level);
    window.resetZoom = () => globalZoomController.resetZoom();
    window.getCurrentZoom = () => globalZoomController.getCurrentZoom();
    window.forceSubslotDetection = () => globalZoomController.forceSubslotDetection();
    window.debugZoomController = () => globalZoomController.debugInfo();
    window.debugVerticalPosition = () => globalZoomController.debugVerticalPosition();
    window.resetZoomSettings = () => globalZoomController.resetSettings();
  }
  return globalZoomController;
}

// DOMContentLoaded時の自動初期化
document.addEventListener('DOMContentLoaded', () => {
  // 他のシステムの初期化を待って実行
  setTimeout(() => {
    initZoomController();
  }, 500);
});

// モジュールとしてエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ZoomControllerManager, initZoomController };
}

// ES6モジュールとしてもエクスポート
if (typeof window !== 'undefined') {
  window.ZoomControllerManager = ZoomControllerManager;
  window.initZoomController = initZoomController;
}
