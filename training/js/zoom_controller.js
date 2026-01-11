/**
 * 手動ズーム・縮小機構
 * スピーキング練習時の視認性向上のため、スロット空間全体を縦横比を保ったまま縮小
 * 
 * 機能:
 * - スライダーによるリアルタイムズーム調整（50% - 150%）
 * - 上位スロット・サブスロット全体に適用
 * - 縦横比保持（transform: scale）
 * - 設定の永続化（localStorage）
 * - リセット機能
 */

class ZoomController {
  constructor() {
    this.zoomSlider = null;
    this.zoomValue = null;
    this.zoomResetButton = null;
    this.targetContainers = []; // ズーム対象のコンテナ
    this.originalMarginValues = new Map(); // 元のmargin-left値を保存
    this.currentZoom = 1.0;
    this.storageKey = 'rephrase_zoom_level';
    
    // 🚫 無限ループ対策用プロパティ
    this.isObserverPaused = false;
    this.lastUpdateTime = 0;
    this.mutationObserver = null;
    
    this.init();
  }

  init() {
    // DOM要素の取得
    this.zoomSlider = document.getElementById('zoomSlider');
    this.zoomValue = document.getElementById('zoomValue');
    this.zoomResetButton = document.getElementById('zoomResetButton');
    
    if (!this.zoomSlider || !this.zoomValue || !this.zoomResetButton) {
      console.warn('⚠️ ズームコントロール要素が見つかりません');
      return;
    }

    // ズーム対象コンテナの特定
    this.identifyTargetContainers();
    
    // 保存されたズーム値を読み込み
    this.loadZoomLevel();
    
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // スクロールヒント要素を作成
    this.createScrollHint();
    
    console.log('🔍 ズームコントローラーが初期化されました');
  }

  /**
   * ズーム対象となるコンテナを特定
   * スロット領域全体（上位スロット・サブスロット）を含むsection要素を対象
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
      
      // 🆕 追加：展開中のサブスロットも個別に追加して確実性を向上
      const visibleSubslots = document.querySelectorAll('.slot-wrapper[id$="-sub"]:not([style*="display: none"])');
      console.log(`📱 展開中のサブスロット: ${visibleSubslots.length}個`);
      
      visibleSubslots.forEach(subslot => {
        this.targetContainers.push({
          element: subslot,
          type: 'subslot',
          id: subslot.id
        });
        console.log(`🎯 サブスロット追加: ${subslot.id}`);
        
        // 🔧 MARGIN SAVE: 元のmargin-left値を保存（真の初期値を確実に取得）
        const currentMarginLeft = getComputedStyle(subslot).getPropertyValue('--dynamic-margin-left');
        const actualMarginLeft = getComputedStyle(subslot).marginLeft;
        const inlineMarginLeft = subslot.style.marginLeft;
        
        console.log(`    ├─ [${subslot.id}] margin状態:`);
        console.log(`    │  ├─ CSS変数(--dynamic-margin-left): "${currentMarginLeft}"`);
        console.log(`    │  ├─ 計算されたmargin-left: "${actualMarginLeft}"`);
        console.log(`    │  └─ インラインmargin-left: "${inlineMarginLeft}"`);
        
        // 🚨 既に保存済みの場合はスキップ（初回のみ保存）
        if (this.originalMarginValues.has(subslot.id)) {
          console.log(`    └─ 📋 既に保存済み: ${this.originalMarginValues.get(subslot.id)}px`);
        } else {
          // 保存優先順位: インライン値 → 計算された値（CSS変数は除外）
          let valueToSave = null;
          let saveSource = '';
          
          if (inlineMarginLeft && inlineMarginLeft !== '0px' && inlineMarginLeft !== 'auto') {
            valueToSave = parseFloat(inlineMarginLeft);
            saveSource = 'インライン';
          } else if (actualMarginLeft && actualMarginLeft !== '0px' && actualMarginLeft !== 'auto') {
            // CSS変数が設定されている場合は、それを除去して真の値を取得
            if (currentMarginLeft && currentMarginLeft !== actualMarginLeft) {
              // 一時的にCSS変数を除去して真の値を取得
              const tempVar = subslot.style.getPropertyValue('--dynamic-margin-left');
              subslot.style.removeProperty('--dynamic-margin-left');
              const trueMarginLeft = getComputedStyle(subslot).marginLeft;
              // CSS変数を復元
              if (tempVar) {
                subslot.style.setProperty('--dynamic-margin-left', tempVar);
              }
              valueToSave = parseFloat(trueMarginLeft);
              saveSource = '真の計算値';
              console.log(`    │  ├─ 真の計算値（CSS変数除去後）: "${trueMarginLeft}"`);
            } else {
              valueToSave = parseFloat(actualMarginLeft);
              saveSource = '計算値';
            }
          }
          
          if (valueToSave && !isNaN(valueToSave) && valueToSave > 0) {
            this.originalMarginValues.set(subslot.id, valueToSave);
            console.log(`    └─ ✅ 保存完了: ${valueToSave}px (${saveSource})`);
          } else {
            console.log(`    └─ ⚠️  保存値なし（すべて0pxまたは無効）`);
          }
        }
        
        // 🔧 SUBSLOT FIX: サブスロット内の個別コンテナも処理対象に追加
        const subslotContainers = subslot.querySelectorAll('.subslot-container');
        subslotContainers.forEach(container => {
          this.targetContainers.push({
            element: container,
            type: 'subslot-container',
            id: container.id
          });
          console.log(`    ├─ ${container.id} (.subslot-container) を追加`);
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
        console.log(`🎯 フォールバック時サブスロット追加: ${subslot.id}`);
        
        // 🔧 MARGIN SAVE: フォールバック時も元のmargin-left値を保存（詳細デバッグ付き）
        const currentMarginLeft = getComputedStyle(subslot).getPropertyValue('--dynamic-margin-left');
        const actualMarginLeft = getComputedStyle(subslot).marginLeft;
        const inlineMarginLeft = subslot.style.marginLeft;
        
        console.log(`    ├─ [FB-${subslot.id}] margin状態:`);
        console.log(`    │  ├─ CSS変数: "${currentMarginLeft}"`);
        console.log(`    │  ├─ 計算値: "${actualMarginLeft}"`);
        console.log(`    │  └─ インライン: "${inlineMarginLeft}"`);
        
        let valueToSave = null;
        let saveSource = '';
        
        if (currentMarginLeft && currentMarginLeft !== '0px' && currentMarginLeft !== 'auto') {
          valueToSave = parseFloat(currentMarginLeft);
          saveSource = 'CSS変数';
        } else if (actualMarginLeft && actualMarginLeft !== '0px' && actualMarginLeft !== 'auto') {
          valueToSave = parseFloat(actualMarginLeft);
          saveSource = '計算値';
        } else if (inlineMarginLeft && inlineMarginLeft !== '0px' && inlineMarginLeft !== 'auto') {
          valueToSave = parseFloat(inlineMarginLeft);
          saveSource = 'インライン';
        }
        
        if (valueToSave && !isNaN(valueToSave)) {
          this.originalMarginValues.set(subslot.id, valueToSave);
          console.log(`    └─ ✅ FB保存完了: ${valueToSave}px (${saveSource})`);
        } else {
          console.log(`    └─ ⚠️  FB保存値なし`);
        }
        
        // 🔧 SUBSLOT FIX: フォールバック時もサブスロット内の個別コンテナを追加
        const subslotContainers = subslot.querySelectorAll('.subslot-container');
        subslotContainers.forEach(container => {
          this.targetContainers.push({
            element: container,
            type: 'subslot-container',
            id: container.id
          });
          console.log(`    ├─ ${container.id} (.subslot-container) をフォールバック追加`);
        });
      });
    }

    console.log(`🎯 ズーム対象コンテナ: ${this.targetContainers.length}個を特定`);
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
   * @param {number} zoomLevel - ズーム倍率 (0.5 - 1.5)
   */
  applyZoom(zoomLevel) {
    this.currentZoom = zoomLevel;
    
    // 🚫 ログ簡素化：基本情報のみ
    console.log(`🔍 ズーム適用: ${Math.round(zoomLevel * 100)}% (対象数: ${this.targetContainers.length})`);
    
    this.targetContainers.forEach((container, index) => {
      if (container.element) {
        // 🚨 CRITICAL FIX: section全体 + S,C1には個別適用
        if (container.type === 'slot-section') {
          // section全体にのみtransform: scaleを適用
          container.element.style.setProperty('transform', `scale(${zoomLevel})`, 'important');
          container.element.style.setProperty('transform-origin', 'top left', 'important');
          
          // 🔍 ズーム時の幅・オーバーフロー制御
          container.element.style.setProperty('max-width', 'none', 'important');
          container.element.style.setProperty('width', '100%', 'important');
          container.element.style.setProperty('overflow-x', 'visible', 'important');
          container.element.style.setProperty('overflow-y', 'visible', 'important');
          
          console.log(`  🎯 section全体にscale適用: ${zoomLevel}`);
        } else if (container.type === 'subslot' && (container.id === 'slot-s-sub' || container.id === 'slot-c1-sub')) {
          // 🆘 S, C1のみ個別にscale適用（section全体のscaleが効かない場合の対策）
          container.element.style.setProperty('transform', `scale(${zoomLevel})`, 'important');
          container.element.style.setProperty('transform-origin', 'top left', 'important');
          
          // � タブ接続中の場合はmargin-top補正をスキップ（タブ接続のmargin-top: -80pxを保持）
          const hasTabConnection = container.element.classList.contains('active-subslot-area');
          
          if (hasTabConnection) {
            console.log(`  🔗 タブ接続中のため垂直補正をスキップ: ${container.id}`);
          } else {
            // 🔧 S, C1の垂直位置補正（下に離れる問題を解決）
            if (zoomLevel < 1.0) {
              // 縮小時にS, C1が下に離れる問題を補正
              const verticalCorrection = (1 - zoomLevel) * 600; // 調整倍率を3倍に増加
              container.element.style.setProperty('margin-top', `-${verticalCorrection}px`, 'important');
              console.log(`  🔧 S/C1垂直補正: ${container.id} → margin-top: -${verticalCorrection}px`);
            } else {
              // 100%以上の場合は垂直補正をリセット
              container.element.style.removeProperty('margin-top');
            }
          }
          
          console.log(`  🆘 S/C1個別scale適用: ${container.id} → ${zoomLevel}`);
        } else if (container.type === 'subslot') {
          // � その他のサブスロット: section全体のscaleに加えて補正適用
          const scaleCorrection = Math.min(1.2, 1 + (1 - zoomLevel) * 0.3); // 最大20%まで補正
          container.element.style.setProperty('transform', `scale(${scaleCorrection})`, 'important');
          container.element.style.setProperty('transform-origin', 'top left', 'important');
          console.log(`  🔧 その他サブスロット補正: ${container.id} → scale(${scaleCorrection})`);
        } else {
          // 🚫 その他のコンテナ（subslot-container等）
          console.log(`  ⏭️  ${container.type}(${container.id}): scale適用スキップ`);
        }
        
        // � MARGIN-LEFT処理を削除：垂直位置問題には無関係
        // (元のmargin-left調整コードを削除)
        
        // スケール適用時の位置調整（縮小時の空白削減）- 全サブスロット共通処理
        if (zoomLevel < 1.0) {
          // 縮小時は要素間の空白を削減
          const spaceReduction = (1 - zoomLevel) * 50;
          container.element.style.marginBottom = `-${spaceReduction}px`;
        } else {
          // 100%以上の場合はマージンリセット
          container.element.style.marginBottom = '';
        }
      }
    });

    // ズーム倍率が高い場合のスクロールヒント表示（縮小時はスクロール不要）
    if (zoomLevel > 1.3) {
      this.showScrollHint(true);
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
        // 設計仕様に従い、1.0(100%)の値のみ復元、それ以外は強制リセット
        if (zoomLevel === 1.0) {
          this.zoomSlider.value = zoomLevel;
          this.applyZoom(zoomLevel);
          this.updateZoomDisplay(zoomLevel);
          console.log(`📚 100%ズームレベル復元完了`);
        } else {
          // 1.0以外の値は強制的に100%にリセット
          console.log(`🔄 非100%ズームレベル検出 (${Math.round(zoomLevel * 100)}%) → 100%にリセット`);
          this.forceDefaultZoom();
        }
      } else {
        // 保存値がない場合はデフォルトを適用
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
    // 🚫 無限ループ対策：観測を一時的に停止するフラグ
    this.isObserverPaused = false;
    this.lastUpdateTime = 0;
    
    const observer = new MutationObserver((mutations) => {
      // 🚫 観測が一時停止中の場合はスキップ
      if (this.isObserverPaused) {
        return;
      }
      
      // 🚫 短時間での連続実行を防ぐ（デバウンス）
      const now = Date.now();
      if (now - this.lastUpdateTime < 500) {
        return;
      }
      
      let needsUpdate = false;
      let subslotChange = false;

      mutations.forEach((mutation) => {
        // 🚫 ズーム関連のstyle変更は除外（transform, width, margin等）
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target.classList.contains('slot-wrapper') && target.id && target.id.endsWith('-sub')) {
            // ズーム関連でない表示変更のみ検出（display プロパティのみ）
            const oldStyle = mutation.oldValue || '';
            const newStyle = target.getAttribute('style') || '';
            
            const oldDisplay = oldStyle.includes('display:') || oldStyle.includes('display ');
            const newDisplay = newStyle.includes('display:') || newStyle.includes('display ');
            
            // displayプロパティの変更のみを対象とする
            if (oldDisplay !== newDisplay) {
              console.log(`📱 サブスロット表示変更検出: ${target.id}`);
              needsUpdate = true;
              subslotChange = true;
            }
          }
        }
        
        // 2. DOM追加・削除の監視（変更なし）
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
        
        // 🚫 観測を一時停止してズーム適用
        this.isObserverPaused = true;
        
        // サブスロット変更時は少し遅延させて確実に適用
        const delay = subslotChange ? 300 : 100;
        setTimeout(() => {
          console.log('🔄 サブスロット変更によるズーム再適用');
          this.identifyTargetContainers();
          this.applyZoom(this.currentZoom);
          
          // 🚫 処理完了後、観測を再開
          setTimeout(() => {
            this.isObserverPaused = false;
          }, 200);
        }, delay);
      }
    });

    // 🚫 監視範囲を限定（attributeOldValueを追加）
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class'],
      attributeOldValue: true  // 古い値も取得して比較可能にする
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
   * サブスロット展開後に手動で呼び出し可能
   */
  forceSubslotDetection() {
    console.log('🔍 サブスロット強制検出を実行');
    
    // より詳細な検出情報
    const allSubSlotWrappers = document.querySelectorAll('.slot-wrapper[id$="-sub"]');
    console.log(`📊 発見されたサブスロット要素総数: ${allSubSlotWrappers.length}`);
    
    allSubSlotWrappers.forEach((wrapper, index) => {
      const computedStyle = getComputedStyle(wrapper);
      const isVisible = wrapper.style.display !== 'none' && computedStyle.display !== 'none';
      console.log(`  [${index}] ${wrapper.id}:`);
      console.log(`    - style.display: "${wrapper.style.display}"`);
      console.log(`    - computed.display: "${computedStyle.display}"`);
      console.log(`    - isVisible: ${isVisible}`);
      console.log(`    - 現在のtransform: "${wrapper.style.transform}"`);
    });
    
    // 🔧 修正：対象コンテナの再検出と現在のズーム値の取得を確実に実行
    this.identifyTargetContainers();
    
    // 現在のズーム値を取得（スライダーから直接取得して確実性を向上）
    const currentZoomFromSlider = parseFloat(this.zoomSlider.value) || 1.0;
    this.currentZoom = currentZoomFromSlider;
    
    console.log(`🔍 強制検出時のズーム値: スライダー=${currentZoomFromSlider}, currentZoom=${this.currentZoom}`);
    
    // ズーム適用
    this.applyZoom(this.currentZoom);
    
    // 検出結果をログ出力
    const subslots = this.targetContainers.filter(c => c.type === 'sub');
    console.log(`📱 最終的に対象となったサブスロット: ${subslots.length}個`);
    subslots.forEach(sub => {
      console.log(`  - ${sub.id}: 表示=${sub.element.style.display !== 'none'}`);
    });
    
    // 🆕 追加：サブスロット展開直後の追加確認処理
    setTimeout(() => {
      console.log('🔄 サブスロット展開後の追加確認処理');
      const visibleSubslots = document.querySelectorAll('.slot-wrapper[id$="-sub"]:not([style*="display: none"])');
      console.log(`👁️ 表示中のサブスロット数: ${visibleSubslots.length}`);
      
      visibleSubslots.forEach(subslot => {
        const currentTransform = subslot.style.transform;
        console.log(`  - ${subslot.id}: transform="${currentTransform}"`);
        
        // もしズームが適用されていない場合は再適用
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
   * 高ズーム時のスクロール案内
   */
  createScrollHint() {
    const hint = document.createElement('div');
    hint.id = 'zoomScrollHint';
    hint.className = 'zoom-scroll-hint';
    hint.innerHTML = '🔍 ズーム中：横スクロールで全体を確認';
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
}

// グローバル変数として公開
let zoomController = null;

// DOMContentLoaded時の初期化
document.addEventListener('DOMContentLoaded', () => {
  // 他のシステムの初期化を待って実行
  setTimeout(() => {
    zoomController = new ZoomController();
    
    // グローバルAPIとして公開
    window.zoomController = zoomController;
    window.setZoom = (level) => zoomController.setZoom(level);
    window.resetZoom = () => zoomController.resetZoom();
    window.getCurrentZoom = () => zoomController.getCurrentZoom();
    window.forceSubslotDetection = () => zoomController.forceSubslotDetection();
    
  }, 500);
});

// デバッグ用関数
window.debugZoomController = () => {
  if (zoomController) {
    console.log('🔍 ズームコントローラー状態:');
    console.log('- 現在のズーム:', zoomController.getCurrentZoom());
    console.log('- 対象コンテナ数:', zoomController.targetContainers.length);
    console.log('- 観測一時停止:', zoomController.isObserverPaused);
  } else {
    console.log('❌ ズームコントローラーが初期化されていません');
  }
};

// 🔍 垂直位置診断用関数（margin-leftではなく実際の位置問題を調査）
window.debugVerticalPosition = () => {
  console.log('📏 === 垂直位置診断 ===');
  const subslots = document.querySelectorAll('.slot-wrapper[id$="-sub"]:not([style*="display: none"])');
  
  subslots.forEach(subslot => {
    const computed = getComputedStyle(subslot);
    const rect = subslot.getBoundingClientRect();
    
    console.log(`\n📍 ${subslot.id}:`);
    console.log(`  🔹 位置情報:`);
    console.log(`    ├─ top: ${rect.top}px`);
    console.log(`    ├─ left: ${rect.left}px`);
    console.log(`    ├─ width: ${rect.width}px`);
    console.log(`    └─ height: ${rect.height}px`);
    
    console.log(`  🔹 margin/padding:`);
    console.log(`    ├─ margin-top: "${computed.marginTop}"`);
    console.log(`    ├─ margin-bottom: "${computed.marginBottom}"`);
    console.log(`    ├─ padding-top: "${computed.paddingTop}"`);
    console.log(`    └─ padding-bottom: "${computed.paddingBottom}"`);
    
    console.log(`  🔹 位置設定:`);
    console.log(`    ├─ position: "${computed.position}"`);
    console.log(`    ├─ top: "${computed.top}"`);
    console.log(`    ├─ bottom: "${computed.bottom}"`);
    console.log(`    └─ z-index: "${computed.zIndex}"`);
    
    console.log(`  🔹 transform:`);
    console.log(`    ├─ transform: "${computed.transform}"`);
    console.log(`    └─ transform-origin: "${computed.transformOrigin}"`);
    
    console.log(`  🔹 flexbox:`);
    console.log(`    ├─ display: "${computed.display}"`);
    console.log(`    ├─ align-items: "${computed.alignItems}"`);
    console.log(`    ├─ align-self: "${computed.alignSelf}"`);
    console.log(`    └─ justify-content: "${computed.justifyContent}"`);
  });
};

// 🔧 margin値強制リセット用関数
window.resetAllMargins = () => {
  if (zoomController) {
    console.log('🔄 全margin値を強制リセット');
    
    // 保存された元値をクリア
    zoomController.originalMarginValues.clear();
    
    // 全サブスロットのmargin関連をリセット
    const subslots = document.querySelectorAll('.slot-wrapper[id$="-sub"]');
    subslots.forEach(subslot => {
      subslot.style.removeProperty('--dynamic-margin-left');
      subslot.style.removeProperty('margin-left');
      console.log(`  ✅ ${subslot.id}: margin値リセット完了`);
    });
    
    // コンテナを再検出
    zoomController.identifyTargetContainers();
  }
};

// 🧪 ズーム強制テスト用関数
window.testZoomMargin = (zoomLevel = 0.8) => {
  if (zoomController) {
    console.log(`🧪 ズーム${Math.round(zoomLevel * 100)}%テスト開始`);
    
    // 強制的にズーム適用
    zoomController.setZoom(zoomLevel);
    
    // 少し待ってから結果確認
    setTimeout(() => {
      debugMarginValues();
    }, 100);
  }
};

// 🚫 緊急時：MutationObserver完全停止用関数
window.stopZoomObserver = () => {
  if (zoomController && zoomController.mutationObserver) {
    zoomController.mutationObserver.disconnect();
    zoomController.isObserverPaused = true;
    console.log('🚫 MutationObserver完全停止しました');
  }
};

// 🔄 MutationObserver再開用関数
window.restartZoomObserver = () => {
  if (zoomController) {
    zoomController.setupDynamicSubslotObserver();
    console.log('🔄 MutationObserver再開しました');
  }
};

// ズーム設定リセット用関数
window.resetZoomSettings = () => {
  try {
    localStorage.removeItem('rephrase_zoom_level');
    if (zoomController) {
      zoomController.forceDefaultZoom();
    }
    console.log('🔄 ズーム設定を完全リセットしました');
  } catch (error) {
    console.error('❌ ズーム設定リセットに失敗:', error);
  }
};
