# JavaScript Architecture Document
**Rephrase English Learning System v2025.07.27-1**  
**Generated:** 2025年8月1日  
**Status:** Production Environment

## 📋 概要

このドキュメントは、Rephraseシステムの本番環境で使用されているJavaScriptファイルの役割と依存関係を記録しています。開発過程で作成された未使用ファイルは全て保管庫に移動済みです。

## 🏗️ アーキテクチャ構成

### ESModule システム（ES6 import/export）
モジュール間の依存関係を管理し、名前空間の衝突を防ぐ現代的なアーキテクチャ。

### Script Tag システム（従来型）
グローバルスコープで動作し、DOMイベントやユーザーインタラクションを直接処理。

## 🔄 状態管理統一アーキテクチャ（2025年8月2日更新）

### 中央集権的状態管理
全てのlocalStorage操作が`state-manager.js`を経由する統一アーキテクチャ。

#### 統一前（問題があった状態）
```javascript
// 各ファイルが独自にlocalStorage操作
localStorage.setItem('rephrase_visibility_state', JSON.stringify(data));
localStorage.setItem('rephrase_subslot_visibility_state', JSON.stringify(data));
// → 競合、不整合、デバッグ困難
```

#### 統一後（現在の状態）
```javascript
// 全て統一されたインターフェース
window.RephraseState.setState('visibility.main', data);
window.RephraseState.setState('visibility.subslots', data);
window.RephraseState.setState('visibility.questionWord', data);
window.RephraseState.setState('explanation.modal.visible', true);
window.RephraseState.setState('explanation.data.explanationData', data);
window.RephraseState.setState('audio.recognition.isActive', true);        // VoiceSystem統合
window.RephraseState.setState('audio.recognition.recognizedText', text);  // 音声認識結果
window.RephraseState.setState('audio.recognition.isRecording', false);    // 録音状態
window.RephraseState.setState('image.metaTags.cache', metaTagsArray);     // 画像システム統合
window.RephraseState.setState('randomizer.sentencePositionInfo', posInfo); // ランダマイザー統合
// → 一貫性、デバッグ容易、拡張性
```

#### 統合完了ファイル (2025年8月2日 16:00更新)
- ✅ **state-manager.js**: 中央状態管理システム
- ✅ **visibility-control.js**: UI表示制御
- ✅ **explanation-manager.js**: 解説システム
- ✅ **zoom-controller-manager.js**: ズーム制御
- ✅ **voice_system.js**: 音声認識システム (6700+行・最重要統合完了)
- ✅ **universal_image_system.js**: 汎用画像管理システム (2146行・統合完了)
- ✅ **randomizer_all.js**: 全体ランダマイズシステム (統合完了)
- ✅ **randomizer_individual.js**: 個別ランダマイズシステム (統合完了)

#### メリット
- **データ整合性**: 単一の管理ポイントで競合を排除
- **デバッグ効率**: 統一されたログ出力で問題特定が容易
- **拡張性**: 新機能追加時の一貫したパターン
- **保守性**: 状態管理ロジックの一元化
- **音声学習基盤**: リアルタイム音声認識+例文比較評点システムの技術基盤完成

## 📁 ファイル一覧と役割

### 🔒 セキュリティ・認証システム
#### `security.js` ★ESModule
- **役割**: セキュリティ機能の中核
- **機能**: ファイルアップロード検証、HTMLエスケープ、XSS防止
- **Export**: `initSecurity()`, `validateFileUpload()`, `escapeHtml()`
- **使用場所**: `training/index.html` (最優先で読み込み)
- **依存関係**: なし

#### `auth.js`
- **役割**: 認証システム
- **機能**: ユーザー認証、セッション管理
- **使用場所**: `training/index.html`
- **依存関係**: 
  - `window.rateLimiter` (rate-limiter.js)
  - `window.errorHandler` (error-handler.js) 
  - `window.securityUtils` (training/index.html内定義)

#### `rate-limiter.js`
- **役割**: レート制限機能
- **機能**: API呼び出し頻度制限、DoS攻撃防止
- **使用場所**: `training/index.html`
- **依存関係**: なし
- **提供**: `window.rateLimiter` (グローバルオブジェクト)

#### `error-handler.js`
- **役割**: エラーハンドリングシステム
- **機能**: エラー表示、ログ管理、ユーザー通知
- **使用場所**: `training/index.html`
- **依存関係**: なし
- **提供**: `window.errorHandler` (グローバルオブジェクト)

### 🎯 コア機能システム
#### `structure_builder.js` ★ESModule
- **役割**: DOM構造構築
- **機能**: スロット構造の動的生成、HTMLテンプレート管理
- **Export**: `buildStructure()`
- **使用場所**: `training/index.html` (ESModule import)
- **依存関係**: なし

#### `randomizer_all.js` ★ESModule
- **役割**: 全体ランダマイザー機能
- **機能**: 全スロットの一括ランダム化、状態管理
- **Export**: `randomizeAll()`, `randomizeAllWithStateManagement()`
- **使用場所**: `training/index.html` (ESModule import)
- **依存関係**: なし

#### `randomizer_individual.js`
- **役割**: 個別スロットランダマイザー
- **機能**: 単一スロットのランダム化、個別制御
- **使用場所**: `training/index.html`
- **依存関係**: なし

#### `insert_test_data_clean.js` ★state-manager連携強化
- **役割**: 動的記載エリア監視・同期システム
- **機能**: 
  - `dynamic-slot-area`の変更監視（MutationObserver使用）
  - `window.loadedJsonData`から例文データを読み取り
  - 動的記載エリアから静的DOMへのデータ同期
  - サブスロット順序制御、DisplayAtTop処理
  - 疑問詞状態復元（state-manager経由）
- **状態管理**: 疑問詞表示状態の復元ロジック追加
- **使用場所**: `training/index.html`
- **依存関係**: `window.loadedJsonData` (グローバル変数), `state-manager.js` (疑問詞状態管理)
- **提供**: 処理完了シグナル (image_auto_hide.jsが待機)

### 🎛️ UI制御システム
#### `state-manager.js` ★CORE SYSTEM
- **役割**: 中央集権的状態管理システム + マネージャー統合
- **機能**: 
  - 全システムのlocalStorage操作を統一管理
  - 状態変更リスナー、ディープマージ
  - **NEW**: マネージャーインスタンス統合機能
  - **NEW**: ZoomControllerManager自動初期化
- **Export**: 
  - `RephraseState` (グローバルオブジェクト)
  - `RephraseStateManager` (クラス)
- **使用場所**: `training/index.html` (最初に読み込み)
- **依存関係**: なし
- **提供**: 
  - `RephraseState.getState()`, `RephraseState.setState()`
  - `RephraseState.registerManager()`, `RephraseState.getManager()`
  - `window.getRephraseManagers()` (デバッグ用)

#### `control_panel_manager.js` ★state-manager統合済み
- **役割**: コントロールパネル管理
- **機能**: 設定パネル、ユーザーインターフェース制御
- **状態管理**: RephraseState.getState/setState経由 (15箇所で使用)
- **使用場所**: `training/index.html`
- **依存関係**: `state-manager.js`

#### `visibility_control.js` ★state-manager統合済み
- **役割**: 要素表示制御
- **機能**: スロット・要素の表示/非表示切り替え、疑問詞表示状態管理
- **状態管理**: RephraseState.getState/setState経由での統一管理
- **localStorage**: `visibility.main`, `visibility.questionWord`
- **使用場所**: `training/index.html`
- **依存関係**: `state-manager.js`
- **提供**: `questionWordVisibilityState` (グローバル変数、state-manager同期)

#### `subslot_visibility_control.js` ★state-manager統合済み
- **役割**: サブスロット表示制御
- **機能**: 詳細レベルのサブスロット表示管理
- **状態管理**: RephraseState.getState/setState経由 (19箇所で使用)
- **localStorage**: `visibility.subslots`
- **使用場所**: `training/index.html`
- **依存関係**: `state-manager.js`
- **使用場所**: `training/index.html`
- **依存関係**: なし

#### `subslot_toggle.js`
- **役割**: サブスロット切り替え機能
- **機能**: サブスロットの開閉、アニメーション制御
- **使用場所**: `training/index.html`
- **依存関係**: なし

#### `zoom_controller.js` ❌DEPRECATED
- **状態**: 廃止予定（modules/zoom-controller-manager.js に統合）
- **役割**: 従来のズーム機能制御
- **使用場所**: 使用停止

#### ZoomControllerManager (`modules/zoom-controller-manager.js`) ★NEW
- **役割**: 手動ズーム・縮小機構（モジュール化）
- **機能**: 
  - リアルタイムズーム調整（50%〜150%）
  - 縦横比保持（CSS transform: scale）
  - S/C1スロット特別処理（垂直位置補正）
  - 動的サブスロット対応（MutationObserver）
  - 設定永続化（localStorage）
- **設計仕様**: `設計仕様書/zoom_controller_specification.md` に準拠
- **状態管理**: RephraseStateManager統合
- **使用場所**: `training/index.html`
- **依存関係**: 
  - `state-manager.js` (RephraseStateManager)
  - DOM要素: `zoomSlider`, `zoomValue`, `zoomResetButton`
- **提供**: `window.zoomController` (グローバルAPI)
- **テストファイル**: `modules/zoom-controller-manager-test.js`

### � 例文解説システム
#### `explanation_system.js` ★state-manager統合済み
- **役割**: 例文解説モーダルシステム
- **機能**: 
  - V_group_keyに基づく文法解説の表示
  - 動的解説ボタンの自動配置（例文シャッフルボタン付近）
  - モーダルウィンドウでの解説内容表示
  - JSONデータからの解説データ読み込み
- **データ処理**: 
  - `V自動詞第1文型.json`から解説データを抽出
  - `explanation_title`と`explanation_content`フィールドを使用
  - フィルタリング条件: 両フィールドが空でないアイテム
- **状態管理**: 
  - `explanation.modal.visible`: モーダル表示状態
  - `explanation.data.explanationData`: 解説データ配列
  - `explanation.ui.buttons.explanation`: 解説ボタン表示状態
  - `explanation.context.currentVGroupKey`: 現在のV_group_key
- **UI統合**: 
  - `randomize-all`ボタン付近に解説ボタンを自動配置
  - モーダル表示でレスポンシブ対応
  - 閉じるボタン、オーバーレイクリックでの閉じる機能
- **使用場所**: `training/index.html`
- **依存関係**: `state-manager.js`
- **データソース**: `training/data/V自動詞第1文型.json`

### �🖼️ 画像・メディア系システム
#### `universal_image_system.js`
- **役割**: 汎用画像管理システム
- **機能**: 画像表示、遅延読み込み、エラーハンドリング
- **使用場所**: `training/index.html`
- **依存関係**: なし

#### `image_auto_hide.js`
- **役割**: 画像自動非表示機能
- **機能**: 不要画像の自動非表示、パフォーマンス最適化
- **使用場所**: `training/index.html`
- **依存関係**: `insert_test_data_clean.js`の処理完了を待機

### 🔊 音声システム
#### `voice_system.js` ★RephraseStateManager統合完了
- **役割**: 音声認識・再生システム (6700+行の大規模システム)
- **機能**: 音声入力、TTS、プラットフォーム別対応、リアルタイム音声認識
- **状態管理統合**: ✅ 完了 (2025年8月2日)
  - `audio.recognition.isActive`: 音声認識状態
  - `audio.recognition.recognizedText`: 認識結果テキスト  
  - `audio.recognition.isRecording`: 録音状態
  - `audio.recognition.isAndroidAnalyzing`: Android分析状態
- **アーキテクチャ特徴**:
  - Android/PC プラットフォーム別状態管理
  - リアルタイム状態同期機能
  - デバッグパネル統合（📊 状態確認ボタン）
- **使用場所**: `training/index.html`
- **依存関係**: `window.RephraseState` (state-manager.js)
- **技術的価値**: 「リアルタイム音声認識 + 例文比較評点」システムの技術基盤

#### `voice_progress_tracker.js`
- **役割**: 音声進捗追跡
- **機能**: 学習進捗記録、音声データ管理
- **使用場所**: `training/index.html` (重複読み込みあり)
- **依存関係**: なし

#### `voice_progress_ui.js`
- **役割**: 音声進捗UI表示
- **機能**: 進捗バー、視覚的フィードバック
- **使用場所**: `training/index.html` (重複読み込みあり)
- **依存関係**: なし

### 📚 学習機能システム
#### `explanation_system.js`
- **役割**: 解説システム
- **機能**: 文法解説表示、ヘルプ機能
- **使用場所**: `training/index.html`
- **依存関係**: なし

#### `question_word_visibility.js`
- **役割**: 疑問詞表示制御
- **機能**: 疑問詞の表示/非表示、学習レベル調整
- **使用場所**: `training/index.html`
- **依存関係**: `questionWordVisibilityState` (visibility_control.js)

## 🔗 依存関係マップ

### ESModule Import Chain
```
training/index.html
├── security.js (最優先読み込み)
├── randomizer_all.js
└── structure_builder.js
```

### Script Tag Load Order & Dependencies
```
training/index.html
├── rate-limiter.js (window.rateLimiter)
├── error-handler.js (window.errorHandler)
├── auth.js → 依存: window.rateLimiter, window.errorHandler, window.securityUtils
├── subslot_toggle.js
├── randomizer_individual.js
├── control_panel_manager.js
├── visibility_control.js (questionWordVisibilityState 宣言)
├── subslot_visibility_control.js
├── image_auto_hide.js → 依存: insert_test_data_clean.js の実行完了
├── universal_image_system.js
├── question_word_visibility.js → 依存: questionWordVisibilityState (visibility_control.js)
├── voice_system.js
├── voice_progress_tracker.js (重複)
├── voice_progress_ui.js (重複)
├── explanation_system.js
├── zoom_controller.js
└── insert_test_data_clean.js (image_auto_hide.js から参照)
```

### Global Variables & Functions Dependencies
```
window.rateLimiter (rate-limiter.js)
├── → auth.js が参照

window.errorHandler (error-handler.js)  
├── → auth.js が参照

window.securityUtils (training/index.html内で定義)
├── → auth.js が参照

window.loadedJsonData (insert_test_data_clean.js)
├── → insert_test_data_clean.js が参照・監視

questionWordVisibilityState (visibility_control.js)
├── → question_word_visibility.js が参照

insert_test_data_clean.js の実行完了
├── → image_auto_hide.js が待機

MutationObserver監視 (insert_test_data_clean.js)
├── → dynamic-slot-area の変更を検出して同期処理を実行
```

## ⚠️ 注意事項

### 重複読み込み
- `voice_progress_tracker.js` と `voice_progress_ui.js` が複数箇所で読み込まれています
- パフォーマンスに影響する可能性があるため、要確認

### セキュリティ優先度
- `security.js` は最優先で読み込まれ、他のスクリプト実行前にセキュリティ初期化を実行
- すべてのファイルアップロード処理でセキュリティ検証が必要

### 読み込み順序の重要性
- **必須**: `rate-limiter.js` → `error-handler.js` → `auth.js` の順序
- **必須**: `visibility_control.js` → `question_word_visibility.js` の順序  
- **必須**: `insert_test_data_clean.js` → `image_auto_hide.js` の実行順序
- グローバル変数への依存により、読み込み順序の変更は危険

### モジュール設計
- ESModuleシステムと従来のスクリプトタグが混在
- グローバル変数を通じた密結合が存在
- 将来的にはESModuleへの統一を検討

## 🗃️ 保管済みファイル

以下のファイルは開発過程保管庫に移動済み：

### 未使用JavaScriptファイル (14件)
- `common.js`
- `image_handler.js`
- `main.js`
- `question_word_controller.js`
- `randomizer.js` (セキュリティ強化版・未使用)
- `randomizer_controller.js` (レンダリング統合版・未使用)
- `randomizer_slot.js`
- `renderer_core.js`
- `responsive_layout.js`
- `rotation-fix.js`
- `simple_recorder.js`
- `slot_data_loader.js`
- `subslot_renderer.js`
- `v_slot_image_system.js`

### 開発用フォルダ (3件)
- `old/` - 旧バージョンファイル
- `optimized/` - 最適化実験ファイル
- `バックアップ/` - バックアップファイル

## 📊 統計情報

- **本番環境ファイル数**: 20ファイル
- **保管庫移動ファイル数**: 14ファイル + 3フォルダ
- **ESModule採用率**: 15% (3/20)
- **セキュリティ関連ファイル**: 4ファイル
- **UI制御ファイル**: 5ファイル
- **音声システムファイル**: 3ファイル

## 🔄 更新履歴

- **2025-08-02**: state-manager統合対応アーキテクチャ更新
  - **状態管理統一**: localStorage操作を全てstate-manager.js経由に統一
  - **影響ファイル**: `visibility_control.js`, `subslot_visibility_control.js`, `control_panel_manager.js`, `insert_test_data_clean.js`
  - **変更内容**: RephraseState.getState/setState経由での状態管理に変更
  - **メリット**: データ整合性向上、デバッグ効率化、将来拡張性向上
- **2025-08-01**: 初版作成、未使用ファイル整理完了
- **対象バージョン**: Rephrase English Learning System v2025.07.27-1

---
**注意**: このドキュメントは本番環境の現在の状態を反映しています。ファイルの追加・削除・変更時は必ずこのドキュメントを更新してください。
