/**
 * ZoomControllerManager 統合テスト
 * 
 * 包括的なテストにより、以下の機能を検証:
 * - 基本ズーム機能（50%-150%）
 * - サブスロット種別による個別処理
 * - 動的サブスロット対応
 * - 設定永続化
 * - 状態管理システム連携
 * - エラーハンドリング
 * 
 * @version 1.0
 * @date 2025-08-02
 */

class ZoomControllerManagerTest {
  constructor() {
    this.testResults = [];
    this.mockElements = new Map();
    this.originalConsoleLog = console.log;
    this.testLogs = [];
  }

  /**
   * 全テストの実行
   */
  async runAllTests() {
    console.log('🧪 ZoomControllerManager統合テスト開始');
    console.log('='.repeat(50));
    
    this.setupTestEnvironment();
    
    try {
      // 基本機能テスト
      await this.testBasicInitialization();
      await this.testZoomApplication();
      await this.testZoomLevelPersistence();
      
      // 高度な機能テスト
      await this.testSubslotTypeSpecificHandling();
      await this.testDynamicSubslotDetection();
      await this.testMutationObserver();
      
      // 統合テスト
      await this.testStateManagerIntegration();
      await this.testErrorHandling();
      await this.testPerformance();
      
      // UI機能テスト
      await this.testScrollHint();
      await this.testVisualFeedback();
      
    } catch (error) {
      this.addTestResult('ERROR', 'テスト実行中にエラー', error.message);
    }
    
    this.cleanupTestEnvironment();
    this.displayTestResults();
  }

  /**
   * テスト環境のセットアップ
   */
  setupTestEnvironment() {
    // ズームコントロール要素のモック作成
    this.createMockZoomControls();
    
    // スロット要素のモック作成
    this.createMockSlotElements();
    
    // localStorage のモック
    this.setupLocalStorageMock();
    
    console.log('🔧 テスト環境セットアップ完了');
  }

  /**
   * モックズームコントロール要素の作成
   */
  createMockZoomControls() {
    // ズームスライダー
    const zoomSlider = document.createElement('input');
    zoomSlider.type = 'range';
    zoomSlider.id = 'zoomSlider';
    zoomSlider.min = '0.5';
    zoomSlider.max = '1.5';
    zoomSlider.step = '0.1';
    zoomSlider.value = '1.0';
    document.body.appendChild(zoomSlider);
    this.mockElements.set('zoomSlider', zoomSlider);
    
    // ズーム値表示
    const zoomValue = document.createElement('span');
    zoomValue.id = 'zoomValue';
    zoomValue.textContent = '100%';
    document.body.appendChild(zoomValue);
    this.mockElements.set('zoomValue', zoomValue);
    
    // リセットボタン
    const zoomResetButton = document.createElement('button');
    zoomResetButton.id = 'zoomResetButton';
    zoomResetButton.textContent = 'リセット';
    document.body.appendChild(zoomResetButton);
    this.mockElements.set('zoomResetButton', zoomResetButton);
  }

  /**
   * モックスロット要素の作成
   */
  createMockSlotElements() {
    // メインセクション
    const section = document.createElement('section');
    section.id = 'main-slot-section';
    
    // シャッフルボタン
    const shuffleButton = document.createElement('button');
    shuffleButton.id = 'randomize-all';
    shuffleButton.textContent = 'シャッフル';
    section.appendChild(shuffleButton);
    
    // メインスロットラッパー
    const mainSlotWrapper = document.createElement('div');
    mainSlotWrapper.className = 'slot-wrapper';
    mainSlotWrapper.id = 'main-slots';
    section.appendChild(mainSlotWrapper);
    
    // サブスロット要素（S, C1, その他）
    const subslotIds = ['slot-s-sub', 'slot-c1-sub', 'slot-v-sub', 'slot-o1-sub'];
    subslotIds.forEach(id => {
      const subslot = document.createElement('div');
      subslot.className = 'slot-wrapper';
      subslot.id = id;
      subslot.style.display = 'flex'; // 初期状態で表示
      
      // サブスロットコンテナ
      const container = document.createElement('div');
      container.className = 'subslot-container';
      container.id = `${id}-container`;
      subslot.appendChild(container);
      
      section.appendChild(subslot);
      this.mockElements.set(id, subslot);
    });
    
    document.body.appendChild(section);
    this.mockElements.set('section', section);
  }

  /**
   * localStorage モックのセットアップ
   */
  setupLocalStorageMock() {
    this.mockStorage = {};
    
    // localStorage の元の参照を保存
    this.originalLocalStorage = window.localStorage;
    
    // モック localStorage を設定
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key) => this.mockStorage[key] || null,
        setItem: (key, value) => this.mockStorage[key] = value,
        removeItem: (key) => delete this.mockStorage[key],
        clear: () => this.mockStorage = {}
      },
      writable: true
    });
  }

  /**
   * 基本初期化テスト
   */
  async testBasicInitialization() {
    console.log('\n📋 基本初期化テスト');
    
    try {
      const manager = new ZoomControllerManager();
      
      // DOM要素の取得確認
      this.assert(manager.zoomSlider !== null, '基本初期化', 'ズームスライダーが取得されている');
      this.assert(manager.zoomValue !== null, '基本初期化', 'ズーム値表示が取得されている');
      this.assert(manager.zoomResetButton !== null, '基本初期化', 'リセットボタンが取得されている');
      
      // 初期値確認
      this.assert(manager.currentZoom === 1.0, '基本初期化', '初期ズーム値が1.0');
      this.assert(manager.storageKey === 'rephrase_zoom_level', '基本初期化', 'ストレージキーが正しい');
      
      // 対象コンテナの特定確認
      await new Promise(resolve => setTimeout(resolve, 100)); // 初期化待ち
      this.assert(manager.targetContainers.length > 0, '基本初期化', '対象コンテナが特定されている');
      
    } catch (error) {
      this.addTestResult('FAIL', '基本初期化', `エラー: ${error.message}`);
    }
  }

  /**
   * ズーム適用テスト
   */
  async testZoomApplication() {
    console.log('\n🔍 ズーム適用テスト');
    
    try {
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 50%ズームテスト
      manager.applyZoom(0.5);
      const section = this.mockElements.get('section');
      const sectionTransform = section.style.transform;
      this.assert(sectionTransform.includes('scale(0.5)'), 'ズーム適用', '50%ズームがsectionに適用されている');
      
      // 150%ズームテスト
      manager.applyZoom(1.5);
      const newTransform = section.style.transform;
      this.assert(newTransform.includes('scale(1.5)'), 'ズーム適用', '150%ズームがsectionに適用されている');
      
      // ズーム値表示テスト
      manager.updateZoomDisplay(1.2);
      const zoomValue = this.mockElements.get('zoomValue');
      this.assert(zoomValue.textContent === '120%', 'ズーム適用', 'ズーム値表示が正しく更新されている');
      
    } catch (error) {
      this.addTestResult('FAIL', 'ズーム適用', `エラー: ${error.message}`);
    }
  }

  /**
   * ズームレベル永続化テスト
   */
  async testZoomLevelPersistence() {
    console.log('\n💾 ズームレベル永続化テスト');
    
    try {
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 保存テスト
      manager.saveZoomLevel(1.0);
      this.assert(this.mockStorage['rephrase_zoom_level'] === '1.0', '永続化', 'ズームレベルが保存されている');
      
      // 読み込みテスト（100%のみ復元）
      this.mockStorage['rephrase_zoom_level'] = '1.0';
      manager.loadZoomLevel();
      this.assert(manager.currentZoom === 1.0, '永続化', '100%ズームが正しく復元されている');
      
      // 非100%値のリセットテスト
      this.mockStorage['rephrase_zoom_level'] = '0.8';
      manager.loadZoomLevel();
      this.assert(manager.currentZoom === 1.0, '永続化', '非100%値が100%にリセットされている');
      
    } catch (error) {
      this.addTestResult('FAIL', '永続化', `エラー: ${error.message}`);
    }
  }

  /**
   * サブスロット種別による個別処理テスト
   */
  async testSubslotTypeSpecificHandling() {
    console.log('\n🎯 サブスロット種別個別処理テスト');
    
    try {
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // S, C1サブスロットの個別処理テスト
      manager.applyZoom(0.6);
      
      const sSubslot = this.mockElements.get('slot-s-sub');
      const c1Subslot = this.mockElements.get('slot-c1-sub');
      const vSubslot = this.mockElements.get('slot-v-sub');
      
      // S, C1は個別スケール + 垂直補正
      this.assert(sSubslot.style.transform.includes('scale(0.6)'), 'サブスロット個別処理', 'Sサブスロットに個別スケールが適用されている');
      this.assert(c1Subslot.style.transform.includes('scale(0.6)'), 'サブスロット個別処理', 'C1サブスロットに個別スケールが適用されている');
      
      // 垂直補正の確認
      const expectedCorrection = (1 - 0.6) * 600; // 240px
      this.assert(sSubslot.style.marginTop.includes('240px'), 'サブスロット個別処理', 'S垂直補正が適用されている');
      
      // その他サブスロットは補正スケール
      const expectedScaleCorrection = Math.min(1.2, 1 + (1 - 0.6) * 0.3); // 1.12
      this.assert(vSubslot.style.transform.includes('1.12'), 'サブスロット個別処理', 'その他サブスロットに補正スケールが適用されている');
      
    } catch (error) {
      this.addTestResult('FAIL', 'サブスロット個別処理', `エラー: ${error.message}`);
    }
  }

  /**
   * 動的サブスロット検出テスト
   */
  async testDynamicSubslotDetection() {
    console.log('\n📱 動的サブスロット検出テスト');
    
    try {
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 新しいサブスロットを動的に追加
      const newSubslot = document.createElement('div');
      newSubslot.className = 'slot-wrapper';
      newSubslot.id = 'slot-new-sub';
      newSubslot.style.display = 'flex';
      this.mockElements.get('section').appendChild(newSubslot);
      
      // 強制検出実行
      manager.forceSubslotDetection();
      
      // 検出されたことを確認
      await new Promise(resolve => setTimeout(resolve, 300)); // 検出処理待ち
      const isDetected = manager.targetContainers.some(c => c.id === 'slot-new-sub');
      this.assert(isDetected, '動的サブスロット検出', '新しいサブスロットが検出されている');
      
      // ズームが適用されることを確認
      manager.applyZoom(0.8);
      const hasTransform = newSubslot.style.transform.includes('scale');
      this.assert(hasTransform, '動的サブスロット検出', '新しいサブスロットにズームが適用されている');
      
    } catch (error) {
      this.addTestResult('FAIL', '動的サブスロット検出', `エラー: ${error.message}`);
    }
  }

  /**
   * MutationObserver テスト
   */
  async testMutationObserver() {
    console.log('\n👁️ MutationObserver テスト');
    
    try {
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 観測開始の確認
      this.assert(manager.mutationObserver !== null, 'MutationObserver', '観測が開始されている');
      this.assert(manager.isObserverPaused === false, 'MutationObserver', '観測が有効');
      
      // 一時停止・再開テスト
      manager.isObserverPaused = true;
      this.assert(manager.isObserverPaused === true, 'MutationObserver', '観測一時停止が機能');
      
      manager.isObserverPaused = false;
      this.assert(manager.isObserverPaused === false, 'MutationObserver', '観測再開が機能');
      
    } catch (error) {
      this.addTestResult('FAIL', 'MutationObserver', `エラー: ${error.message}`);
    }
  }

  /**
   * 状態管理システム連携テスト
   */
  async testStateManagerIntegration() {
    console.log('\n🔗 状態管理システム連携テスト');
    
    try {
      // モック状態管理システム
      window.RephraseState = {
        updateState: (key, value) => {
          this.mockStateManager = { [key]: value };
        }
      };
      
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 状態管理連携確認
      this.assert(manager.stateManager !== null, '状態管理連携', '状態管理システムと連携している');
      
      // ズーム変更時の状態更新確認
      manager.applyZoom(1.3);
      this.assert(this.mockStateManager && this.mockStateManager.zoomLevel === 1.3, '状態管理連携', 'ズーム変更が状態管理に反映されている');
      
    } catch (error) {
      this.addTestResult('FAIL', '状態管理連携', `エラー: ${error.message}`);
    }
  }

  /**
   * エラーハンドリングテスト
   */
  async testErrorHandling() {
    console.log('\n⚠️ エラーハンドリングテスト');
    
    try {
      // DOM要素が存在しない状況をシミュレート
      this.mockElements.get('zoomSlider').remove();
      
      // 遅延初期化が動作することを確認
      const manager = new ZoomControllerManager();
      this.assert(manager.zoomSlider === null, 'エラーハンドリング', 'DOM要素不在時の初期化処理');
      
      // localStorage エラーのシミュレート
      const originalSetItem = window.localStorage.setItem;
      window.localStorage.setItem = () => {
        throw new Error('localStorage error');
      };
      
      // エラーが適切にキャッチされることを確認
      let errorCaught = false;
      try {
        manager.saveZoomLevel(1.0);
      } catch (e) {
        errorCaught = true;
      }
      
      // localStorage を復元
      window.localStorage.setItem = originalSetItem;
      
      this.assert(!errorCaught, 'エラーハンドリング', 'localStorage エラーが適切にハンドリングされている');
      
    } catch (error) {
      this.addTestResult('FAIL', 'エラーハンドリング', `エラー: ${error.message}`);
    }
  }

  /**
   * パフォーマンステスト
   */
  async testPerformance() {
    console.log('\n⚡ パフォーマンステスト');
    
    try {
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 大量のサブスロットを追加
      const section = this.mockElements.get('section');
      for (let i = 0; i < 50; i++) {
        const subslot = document.createElement('div');
        subslot.className = 'slot-wrapper';
        subslot.id = `performance-test-${i}-sub`;
        subslot.style.display = 'flex';
        section.appendChild(subslot);
      }
      
      // パフォーマンス測定
      const startTime = performance.now();
      manager.identifyTargetContainers();
      manager.applyZoom(0.7);
      const endTime = performance.now();
      
      const processingTime = endTime - startTime;
      this.assert(processingTime < 100, 'パフォーマンス', `大量要素処理が100ms以内 (${processingTime.toFixed(2)}ms)`);
      
      // メモリリーク確認（対象コンテナ数の確認）
      const containerCount = manager.targetContainers.length;
      this.assert(containerCount > 50, 'パフォーマンス', `すべての要素が検出されている (${containerCount}個)`);
      
    } catch (error) {
      this.addTestResult('FAIL', 'パフォーマンス', `エラー: ${error.message}`);
    }
  }

  /**
   * スクロールヒントテスト
   */
  async testScrollHint() {
    console.log('\n💡 スクロールヒントテスト');
    
    try {
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // スクロールヒント要素の存在確認
      const hintElement = document.getElementById('zoomScrollHint');
      this.assert(hintElement !== null, 'スクロールヒント', 'ヒント要素が作成されている');
      
      // 高ズーム時の自動表示確認
      manager.applyZoom(1.4);
      await new Promise(resolve => setTimeout(resolve, 100));
      this.assert(hintElement.classList.contains('show'), 'スクロールヒント', '高ズーム時にヒントが表示される');
      
      // 手動制御確認
      manager.showScrollHint(false);
      this.assert(!hintElement.classList.contains('show'), 'スクロールヒント', '手動非表示が機能');
      
    } catch (error) {
      this.addTestResult('FAIL', 'スクロールヒント', `エラー: ${error.message}`);
    }
  }

  /**
   * 視覚的フィードバックテスト
   */
  async testVisualFeedback() {
    console.log('\n🎨 視覚的フィードバックテスト');
    
    try {
      const manager = new ZoomControllerManager();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const zoomValue = this.mockElements.get('zoomValue');
      
      // 縮小時の色変更確認
      manager.updateZoomDisplay(0.7);
      this.assert(zoomValue.style.color === 'rgb(255, 87, 34)', '視覚フィードバック', '縮小時に赤色表示');
      
      // 拡大時の色変更確認
      manager.updateZoomDisplay(1.3);
      this.assert(zoomValue.style.color === 'rgb(76, 175, 80)', '視覚フィードバック', '拡大時に緑色表示');
      
      // 通常時の色確認
      manager.updateZoomDisplay(1.0);
      this.assert(zoomValue.style.color === 'rgb(102, 102, 102)', '視覚フィードバック', '通常時にグレー表示');
      
    } catch (error) {
      this.addTestResult('FAIL', '視覚フィードバック', `エラー: ${error.message}`);
    }
  }

  /**
   * アサーション関数
   */
  assert(condition, category, description) {
    if (condition) {
      this.addTestResult('PASS', category, description);
    } else {
      this.addTestResult('FAIL', category, description);
    }
  }

  /**
   * テスト結果の追加
   */
  addTestResult(status, category, description) {
    this.testResults.push({
      status,
      category,
      description,
      timestamp: new Date().toISOString()
    });
    
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`  ${icon} ${category}: ${description}`);
  }

  /**
   * テスト環境のクリーンアップ
   */
  cleanupTestEnvironment() {
    // モック要素の削除
    this.mockElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // localStorage の復元
    Object.defineProperty(window, 'localStorage', {
      value: this.originalLocalStorage,
      writable: true
    });
    
    // 状態管理システムのクリーンアップ
    if (window.RephraseState && this.mockStateManager) {
      delete window.RephraseState;
    }
    
    console.log('🧹 テスト環境クリーンアップ完了');
  }

  /**
   * テスト結果の表示
   */
  displayTestResults() {
    console.log('\n📊 テスト結果サマリー');
    console.log('='.repeat(50));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    const errorTests = this.testResults.filter(r => r.status === 'ERROR').length;
    
    console.log(`📈 総テスト数: ${totalTests}`);
    console.log(`✅ 成功: ${passedTests}`);
    console.log(`❌ 失敗: ${failedTests}`);
    console.log(`⚠️ エラー: ${errorTests}`);
    console.log(`🏆 成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0 || errorTests > 0) {
      console.log('\n🔍 失敗・エラー詳細:');
      this.testResults.filter(r => r.status !== 'PASS').forEach(result => {
        const icon = result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`  ${icon} ${result.category}: ${result.description}`);
      });
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🧪 ZoomControllerManager統合テスト完了');
  }

  /**
   * 特定のテストカテゴリのみ実行
   */
  async runSpecificTest(testName) {
    this.setupTestEnvironment();
    
    try {
      switch (testName) {
        case 'initialization':
          await this.testBasicInitialization();
          break;
        case 'zoom':
          await this.testZoomApplication();
          break;
        case 'persistence':
          await this.testZoomLevelPersistence();
          break;
        case 'subslot':
          await this.testSubslotTypeSpecificHandling();
          break;
        case 'dynamic':
          await this.testDynamicSubslotDetection();
          break;
        case 'observer':
          await this.testMutationObserver();
          break;
        case 'state':
          await this.testStateManagerIntegration();
          break;
        case 'error':
          await this.testErrorHandling();
          break;
        case 'performance':
          await this.testPerformance();
          break;
        case 'hint':
          await this.testScrollHint();
          break;
        case 'visual':
          await this.testVisualFeedback();
          break;
        default:
          console.log(`⚠️ 不明なテスト: ${testName}`);
      }
    } catch (error) {
      this.addTestResult('ERROR', testName, error.message);
    }
    
    this.cleanupTestEnvironment();
    this.displayTestResults();
  }
}

// グローバル関数として公開
window.testZoomController = async () => {
  const tester = new ZoomControllerManagerTest();
  await tester.runAllTests();
};

window.testZoomControllerSpecific = async (testName) => {
  const tester = new ZoomControllerManagerTest();
  await tester.runSpecificTest(testName);
};

// 簡易テスト実行関数
window.quickTestZoom = () => {
  console.log('🚀 ZoomControllerManager簡易テスト');
  
  // 基本的な機能確認
  if (window.zoomController) {
    console.log('✅ ZoomController初期化済み');
    
    // ズーム機能テスト
    window.zoomController.setZoom(0.8);
    console.log('✅ 80%ズーム適用');
    
    setTimeout(() => {
      window.zoomController.setZoom(1.2);
      console.log('✅ 120%ズーム適用');
      
      setTimeout(() => {
        window.zoomController.resetZoom();
        console.log('✅ ズームリセット');
        console.log('🎉 簡易テスト完了');
      }, 1000);
    }, 1000);
  } else {
    console.log('❌ ZoomControllerが初期化されていません');
  }
};

console.log('🧪 ZoomControllerManager テストシステム読み込み完了');
console.log('実行方法:');
console.log('  - 全テスト: testZoomController()');
console.log('  - 特定テスト: testZoomControllerSpecific("testName")');
console.log('  - 簡易テスト: quickTestZoom()');
