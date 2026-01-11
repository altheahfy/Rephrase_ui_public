# UI Adjustment Phase — Scope & Intent (IMPORTANT)

This phase is **public-release preparation**.
- Goal: improve usability, clarity, and stability of RephraseUI.
- Non-goal: large-scale architectural refactoring or full K-MAD rollout.

**Hard constraints**
- Do NOT modify core parsing / analysis pipelines.
- Do NOT refactor architecture.
- Touch only UI/output/adapter layers explicitly mentioned below.

﻿０．このシステムの目的
（１） 例文DB自動作成システムで作成したDBを元に、ユーザーに対して各文法の重要例文を提示し、「イラスト表示＋英語テキスト表示コントロール＋ランダマイズ」でパターンプラクティスから全文英作文まで自由なアウトプットトレーニングを支援するもの。

１．全体フローと各コンポーネントの役割
（１）Structure Builder　→　insert test data clean　→　静的・動的ハイブリッドDOM「スロット」
DBの母集団から下記ランダマイザーが選択したものに対して、スロット定義、orderの各データに沿ってUI上に並べて例文としての構造を作る。
まずStructure Builderが動的記載エリアに構築、それをinsert test data cleanがDOMに転写する。
スロットは入れ子の埋め込み節も表現できるようにするため上位スロット主節レベルと埋め込みサブスロットの二段階構造になっており、サブスロットは折りたたむことができる。

### **同期処理の核心ロジック**
1. **動的記載エリア変更検出** → MutationObserver発動
2. **デバウンス処理** → 300ms遅延で重複防止
3. **safeJsonSync実行** → `window.loadedJsonData`（候補データ）を使用
4. **同じ選択ロジック適用** → `syncUpperSlotsFromJson(data)`のforEachループ
5. **結果的な一致** → 動的記載エリアと静的スロットが100％一致

### **なぜ100％一致するのか**
- **同一の候補データソース**: 両方とも`window.loadedJsonData`を使用
- **同一の選択ロジック**: forEachループで最後の項目が選ばれる仕様
- **タイミング同期**: 動的記載エリア更新→即座に静的スロット同期

（２）Randomizer
全体ランダマイズと個別ランダマイズの2種類を持つ。
全体ランダマイズは全文をランダマイズ表示。個別ランダマイズは各スロットごとにランダマイズ表示（上位スロット主節レベルだけの部分、埋め込み節サブスロットを持つ部分、両者ともランダマイズ対象）
Rephraseランダマイズアルゴリズムに基づき、ランダマイズは2段階のプロセスを経る。
①V_groupe_key（動詞グループキー）をランダマイズ
これによりS,V,O,Cなどの各要素の語順パターンが決定される。
②各要素のランダマイズ
同じV_groupe_key内でS,V,O,Cなどの各要素をランダマイズ。

### **V_group_key 母集団の識別番号ランダマイズ仕様**
- V_group_key 母集団内のスロットは、例文IDを手掛かりに親スロットとサブスロットをペアとして整理
- 各スロットは、例文IDを超えた混合母集団形成のため「識別番号」を付与（例：M1-1, M1-2）
- ランダマイズは識別番号単位で行われ、選出された識別番号に対応する親スロットとそのサブスロットを一括で出力対象とする
- ExampleID は識別番号付与後のランダマイズ処理では使用せず、スロット種間の自然な混合を保証

### **DB構造との関係**
- DB (slot_order_data.json) は V_group_key 単位でスロット群を構造化
- 母集団キーは **構文ID + V_group_key (Aux＋V セット)**
- V_group_key は助動詞＋動詞の組を一意に示すもの
- 各スロットデータは V_group_key によってどの母集団に属するかが決まる

（３）universal_image_system
あらかじめ準備（ClaudeSonnetが生成したプロンプトをCanvaの描画AIに指示、生成）した1枚のイラストに、そのイラストから想起される単語やチャンクのメタタグを定義しておき、スロットに入った単語やチャンクのメタタグと一致するイラストをスロットに格納・表示するシステム。

（４）control_panel_manager
スロットに入った単語やチャンクの表示・非表示を切り替えるシステム。これを用いて英語を消し、（３）のイラストと組み合わせることによって、「日本語を英語に変換する」という日本人学習者が例外なく陥る誤った思考を排除し、「イメージ→直、英語」という本来あるべき、日本語を介しないトレーニングを実現する。消す範囲は自分で選べるので、特定箇所の感覚を刷り込むパターンプラクティスから、全文を英作文することまで幅広く自由度の高いトレーニングが可能。

（５）日本語補助テキスト
be動詞や前置詞など、イラストにしにくいニュアンスもある。それらは日本語の補助テキストを表示する。

（６）音声学習システム
アウトプットトレーニングには音声学習が不可欠である。スロットに入った例文は、音声ボタンを押すことでネイティブ発音で読み上げられる。また、自分の発話を録音するとともに、認識されるかどうかで発音の正確性を、またネイティブとの比較で発話速度を計測することにより、音声アウトプットのレベル計測が可能。レベルは時系列データとして蓄積され上達度をグラフ表示して可視化する。

（７）explanation_system
ボタンを押下することでモーダルの文法解説が表示されるシステム。解説データはJSON形式で外部ファイル化されており、V_group_keyに基づいて正しい解説が表示される仕組み。ランダマイズ後もリアルタイムでV_group_keyを検出し、正しい解説を表示する。

（８）スマホ最適化
iPhone,Androidなどスマホでの操作性を最適化。タップ領域の拡大、レスポンシブデザイン対応、スクロール挙動最適化など。

３．職務分掌
RephraseUIはK-MAD以前の開発であったため、職務分掌という概念は無かった。今後、導入した方が良い部分があるかどうか、要検討。



２．特記事項
これまでの開発で特に苦労した特殊なロジックや設計思想・経緯について記載する。
（１）動的記載エリアから静的・動的ハイブリッドスロットへの同期処理
システム開発・コードのスキルがゼロであるため事情がよく分からないまま開発を進め、結果として、気づいたら各スロットにイラストや日本語補助などを組み込むことが難しい状況であった。そこで苦肉の策として、動的記載エリアに構築された内容を別途DOMに転写することで乗り切ったが、最初からDBのデータをDOMに入れることができるのではないか？

（２）ランダマイズアルゴリズム
V_groupe_key、例文ID、order、slot_orderなど識別子が多く、どれが何を指しているのか、何の機能に関係してくるのかを正確にAIに理解させるのが難しく、たびたび混乱が生じた。特に、各スロットは、例文IDを超えた混合母集団形成のため「識別番号」を付与（例：M1-1, M1-2）、ランダマイズは識別番号単位で行われるという点が、アイデアとしてまとめるのもAIに理解させ実装するのも大変だった。

（３）イラスト生成
最初はChatGPTに一括生成させようとしたがスピードの点で現実的でないことが判明。Stable Diffusionによる大量生成体制を試みたが、今度は単語やチャンクのイラスト化に求められる様々なポーズやニュアンスの実現に向かないことが分かり、最終的にClaudeSonnet＋Canvaの組み合わせに落ち着いた。

（４）表示・非表示プロパティとランダマイズのバッティング
サブスロットを折りたたんで再び表示させる、あるいはランダマイズして中身を入れ替えるなどの操作は、いわば動的生成に近く、「非表示」を選択していても単語・チャンクが表示されてしまう症状に悩まされた。最終的にはhtmlの記憶エリアにプロパティを保存しておきそれをDOMが毎回参照するようにすることで機能するようになった。

（５）音声速度計測
android版において発話した音声の速度計測と録音とは同時に行えない（計測はリアル音声入力でなければならず録音したデータを計測するということもできない）という技術的制限（有料のものを使えば可能）を知らなかったため、その事実を突き止めることにも時間がかかった。
また、発話速度の計測の仕方も工夫が必要で、ちょっとした条件の変更（始点と終点をどこにするか、無音区間をどう扱うか）で大きく結果が変わるため、試行錯誤が続いた。

（６）スマホ最適化
微妙なスロットのズレなどが発生し、細かい調整に苦労した。最終的にはスマホ画面に窓のような枠を設定し、そこからPC用UIを表示、かつ左右のワイプだけが可能で上下は固定、とすることで、スマホでの指操作に適した状態を作り出した。


（７）What do you think it is？のような、本来は1つである要素が別々の箇所に分かれて表示されるケース
この文はDo you thinkとwhat is itが合体した文で、さらに言うとwhat is it?は元々概念的にはit_S is_V what_O1である。
合体によって、O1埋め込み節の内容のうちWhatが文頭に分かれて出現、it isと合わせて2つのO1が別々の箇所に存在することとなる。実装の仕組は忘れてしまったが、この特殊処理の実現に苦労した。恐らく、Itの形式主語＋不定詞の真の主語でSが2つになるケースでもこれを応用することになると思われる。

３．その他開発体制（当該項目はK-MADで培ったノウハウで、RephraseUIにどう生かすかは今後の課題であり未実装）
（１）構造化ロギング完全追跡システム
エラーが発生した際、どこが原因なのかを即座に特定するため、情報の入力と出力に対して透明性が必要。
- **適用箇所**: 7ハンドラー（`@log_claim_generation()`）+ 2システム（`@log_method_entry_exit()`）
   - **追跡内容**: Claim生成経路、ClaimArbiter調停、Claim→スロット変換
   - **AST Linter**: 3パターン自動検出（違反時commitブロック）
   - **効果**: デバッグ時間7-18倍高速化（35-90分 → 5分）
   - **🆕 Trace ID機能**（2025-12-18実装）:
     - **目的**: Test単位での完全追跡、デバッグ時間2時間 → 5分（24倍高速化）
     - **仕組み**: 各Test実行時に一意のTrace ID（例: `test_012_20251218_195022`）を付与
     - **ログ記録**: 全ログエントリに`"trace_id"`フィールドを自動追加
     - **ビューアーツール**: `python tools/view_test_trace.py <trace_id>` でTest単位のログを抽出・ツリー表示
     - **使用例**: 
       ```bash
       # Golden Test実行（Trace IDが表示される）
       python golden_snapshots.py --category=basic_5_patterns
       # 出力: [Test]: 012 [Trace ID: 012_20251218_195022]
       
       # 特定TestのTrace ID指定でログ表示
       python tools/view_test_trace.py 012_20251218_195022
       # → Test 012の全処理フロー（Claim生成、調停、スロット変換）をツリー構造で表示
       ```
     - **実装場所**: 
       - `src/systems/structured_logging.py`: Trace IDコンテキスト管理（Thread-local変数）
       - `golden_snapshots.py`: Test実行時に`set_trace_id()`呼び出し
       - `tools/view_test_trace.py`: ログビューアーツール（新規作成）
   - **詳細**: `HANDLER_DEVELOPMENT_GUIDE.md` Part 7（構造化ロギング必須化）

（２）Fail and Recover自動統合システム
修正履歴を自動記録し、類似ケースを検索するシステム。手動記録の負担を75-82%削減。
- **適用箇所**: `golden_snapshots.py` の `_handle_fail_and_recover_integration()`
   - **追跡内容**: 失敗→成功の遷移検出、類似過去修正の自動検索、Git diff自動抽出
   - **コアヘルパー**: `tools/fail_and_recover_helper.py` (297行)
   - **効果**: 記録時間15-28分 → 3-5分（75-82%削減、root_cause/design_rationaleのみ手動）
   - **🆕 自動機能**（2025-12-21実装）:
     - **失敗時ヒント表示**: テスト失敗時に類似過去修正TOP3を自動表示
       - スコアリング: カテゴリ一致 +10点、ファイル一致 +20点/ファイル、キーワード +5点/語
     - **成功時記録プロンプト**: 前回失敗→今回成功を検出し、記録確認プロンプト表示
       - 'y'入力でテンプレート自動生成、`Fail and Recover.md`に追記
       - テンプレート内容: Git diff、精度改善、タイムスタンプ（自動）+ root_cause、design_rationale（手動3-5分）
     - **テスト状態管理**: `test_states_cache.json`でテスト状態を永続化（passed/failed、精度）
     - **CIモード対応**: `--ci`または`--no-fail-recover-prompt`でプロンプトスキップ
   - **使用例**: 
     ```bash
     # 通常実行（自動プロンプト有効）
     python golden_snapshots.py --category=infinitive_constructions --include-extensions
     # → 失敗時: 類似ケースヒント表示
     # → 成功時: "修正を記録しますか? (y/n):" プロンプト
     
     # プロンプトスキップ
     python golden_snapshots.py --category=basic_5_patterns --no-fail-recover-prompt
     ```
   - **実装場所**: 
     - `golden_snapshots.py` Line 1563-1729: 統合メソッド（テスト状態管理、プロンプト、記録）
     - `tools/fail_and_recover_helper.py`: コアヘルパー（類似検索、テンプレート生成、追記）
     - `test_states_cache.json`: テスト状態キャッシュ（自動生成）
   - **詳細**: 本ファイル Section 6（開発体制）、`tools/fail_and_recover_helper.py` docstring

（３）Ast Linter
RephraseUIにおいては何を禁止すべきか、現時点ではまとまっていない。恐らく情報統一システムの順守、全体フローを統一汎用パイプラインにした場合の逸脱の禁止、などになるだろうか。

（４）Goldenテスト
スナップショットをそなえたテストシステム。いつ何が退化したか分かりやすい。
UIはユーザーが自分でマウスで触って動かして見て試すしかないのか？（開発時はそうしていた）

（５）コードスナップショットシステム
Goldenテスト実施時、**AST Linter v3実施時**に自動的に全コードのスナップショットを時刻付で保存するシステム。Goldenテストのログと照合すれば、退化の原因を素早く特定できる。

（６）情報統一システム
**情報統一システム方式の設計理念**:
> **「全ての情報はState Manager？を通し、統一された形式で入手・処理・保存する」**
目的：取り扱いがバラバラになって情報の受け渡しがどこかで止まったり、トラブル時にどこが原因か分かりにくくなったりすることを防ぐ


#### Layer 1: 静的解析（開発時）
- **mypy**（型チェッカー、型推論）← 🆕 2025-11-08追加
- **pyright**（VS Code統合型チェッカー）← 🆕 2025-11-08追加
- AST Linter（パターン検出）
- 動的基準システム（`dynamic_standards_registry.json`）

**mypy/pyright実行方法**:
```bash
# mypy: コマンドライン/CI用
mypy src/ --config-file=mypy.ini

# pyright: VS Code統合（自動）
pyright src/
```

**型チェック実行タイミング**:
1. **開発中**: pyright（Pylance）がリアルタイムチェック（VS Code）
2. **コミット前**: mypy実行（pre-commit hook、推奨）
3. **CI**: GitHub Actions（自動、将来実装予定）

#### Layer 2: 実行時検証（実行時）🆕
- `__setattr__`型チェック（`CentralProcessingResult`等）
- Dict/List型混同を即座に検出
- デバッグ時間を35-90分 → 5分に短縮（**7-18倍高速化**）

#### Layer 3: 防御的プログラミング（処理時）
- `isinstance()`チェック
- try-exceptエラーハンドリング

**ハンドラー開発時の厳守事項**:
```python
# ✅ 正しい: Dict型で代入 + 型ヒント
def analyze_structure(
    self, 
    doc: Doc,  # 型ヒント必須（mypy/pyrightチェック）
    context: CentralAnalysisContext
) -> CentralProcessingResult:  # 戻り値型必須
    result = create_standard_result(...)
    
    sub_slots: Dict[str, str] = {'sub-v': 'to fly'}  # 型ヒント推奨
    result.sub_slots = sub_slots  # ✅ Dict型（Layer 2が検証）
    
    return result  # ✅ 正しい型（Layer 1が検証）

# ❌ 間違い: List型で代入（Layer 2が即座にTypeError）
result.sub_slots = ['sub-v', 'sub-o1']  # TypeError!

# ❌ 間違い: 型ヒントなし（Layer 1 mypyが警告）
def analyze_structure(self, doc, context):  # ← 型ヒントなし
    return ['sub-v']  # ← mypyが戻り値型違反を検出
```

**3層防御の効果**:

| 検出タイミング | Layer 1（mypy/pyright） | Layer 2（Runtime） | Layer 3（Defensive） |
|--------------|----------------------|-------------------|---------------------|
| **開発中** | ✅ リアルタイム波線表示 | - | - |
| **コミット前** | ✅ mypy自動実行 | - | - |
| **実行時** | - | ✅ 即座にTypeError | ✅ 防御的処理 |
| **検出率** | 85-90% | 95% | 99% |

**型エラー検出率の向上**:
- AST Linterのみ: 70-80%
- + mypy/pyright: **95%+**（+15-25%向上）
**🆕 Runtime Type Safety** - 実行時型安全性システム（2025-11-03導入）
   - `__setattr__`オーバーライドによる型強制
   - Dict/List型混同を即座に検出（従来：数時間後 → 新：即座）
   - デバッグ時間を35-90分 → 5分に短縮（7-18倍高速化）
   - **3層防御体制**: Layer 1（静的解析） → Layer 2（実行時検証） → Layer 3（防御的）
   - **適用範囲**: CentralProcessingResult.sub_slots, main_slots等
   - **詳細**: `UNIFIED_PIPELINE_ARCHITECTURE.md` Section 10、`HANDLER_DEVELOPMENT_GUIDE.md` Part 7


**詳細**: `UNIFIED_PIPELINE_ARCHITECTURE.md` Section 10（特にSection 10.5 静的型チェッカー統合）、`HANDLER_DEVELOPMENT_GUIDE.md` Part 7

（７）統一汎用パイプライン
**統一汎用パイプラインとは何か？（誤解がないか？）を完全に理解してください。**

**【実装調査時の注意】**:
- ✅ **設計仕様書**: `Phase ①` `Phase ②` `Phase ③` `Phase ④` という表記
- ✅ **CentralController実装**: `Phase ① 特殊構造処理` `Phase ② 基本構造分析` `Phase ③ 拡張ハンドラー` `Phase ④ 統合・検証` という表記
- ⚠️ grep検索時: `Phase ①` だけでは実装が見つからない（日本語説明が付いているため）
- ✅ **正しい検索パターン**: `Phase ① 特殊構造|Phase ② 基本構造|Phase ③ 拡張ハンドラー|Phase ④ 統合` または `① 文法検出|②③ 埋め込み節|⑧ マスク|⑨ 上位文|⑤⑥ Claim`
- 📍 **実装場所**: `src/controllers/central_controller_v14_chunk_system.py` の `_execute_unified_pipeline()` メソッド（Line 1374-2044）

#### 🎯 統一汎用パイプラインの本質

**定義**: 各ハンドラーが個別にパイプラインを持つのではなく、**全文法が共通プロセス①-⑩を選択的に使用する**単一のパイプライン。

**比喩**: 
- ❌ **間違った理解**: 文法ごとに専用の工場を持つ（関係節工場、不定詞工場、動名詞工場）
- ✅ **正しい理解**: **1つの工場で全文法を処理**。違いは「原材料（トリガー）」だけ。

| 文法 | トリガー（5%の違い） | 共通プロセス（95%同じ） |
|------|---------------------|----------------------|
| 関係節 | 先行詞 + 関係詞（who/which/that） | ②-⑩を実行 |
| 不定詞 | to do | ②-⑩を実行 |
| 動名詞 | doing | ②-⑩を実行 |

#### 🔑 共通プロセス①-⑩（全文法共通）

❌ 間違ったアプローチ（if-elif分岐）:
┌──────────────────────────────────────┐
│ _execute_universal_pipeline()       │
├──────────────────────────────────────┤
│ if has_relative:                     │
│   ┌────────────────────────────┐    │
│   │ 関係節専用パイプライン（200行）│    │
│   │ ②-⑩を独自実装             │    │  ← 600行の重複！
│   └────────────────────────────┘    │
│ elif has_infinitive:                 │
│   ┌────────────────────────────┐    │
│   │ 不定詞専用パイプライン（200行）│    │
│   │ ②-⑩を独自実装（95%同じ！）│    │
│   └────────────────────────────┘    │
│ elif has_gerund:                     │
│   ┌────────────────────────────┐    │
│   │ 動名詞専用パイプライン（200行）│    │
│   │ ②-⑩を独自実装（95%同じ！）│    │
│   └────────────────────────────┘    │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ _execute_universal_pipeline()       │
├──────────────────────────────────────┤
│ ② トリガー検出（5-10行）             │
│   ├─ 関係節: "先行詞+関係詞"         │
│   ├─ 不定詞: "to do"                │
│   └─ 動名詞: "doing"                │  ← 違いはここだけ！
├──────────────────────────────────────┤
│ ③-⑩ 共通プロセス（200行）           │
│   │ 全文法で100%再利用              │  ← 1つのコードで全対応！
│   ├─ ③ 切り分け                     │
│   ├─ ④ 再帰処理                     │
│   ├─ ⑥ Claim収集                    │
│   ├─ ⑦ ClaimArbiter調停            │
│   ├─ ⑧ マスキング                   │
│   ├─ ⑨ 上位処理                     │
│   └─ ⑩ 統合・正規化                 │
└──────────────────────────────────────┘
```

✅ 正しいアプローチ（統一パイプライン + Pure Text/フォールバックspaCy完全分離）:

**🔥 重要な設計思想（2025-10-30確立）**:

例えば関係節のプロセスが「①②③④⑤」で、不定詞プロセスはこのうち②と④が違う、という場合。
「①②③④⑤」
「①②'③④'⑤」
のように2つを作るのではなく、
①→ ② →③→ ④→⑤
　⤵②'⤴ ⤵④'⤴
のように、パイプライン自体は1つで、②と④のところだけが分岐し、①③⑤は同じ箇所を通る（コピーするのではない）ということを意味します。

（８） **Claim**
 - ハンドラーの出力を安全な提案式に（CentralControllerが承認）

（９）**🆕 Capabilities（職務分掌徹底）**
 - ハンドラーに明確な能力定義（2025-10-25強化）
   - 各ハンドラーは`CAPABILITIES`でClaim Type白リストを宣言
   - 宣言外のClaimを生成すると`CapabilityViolationError`
   - ハンドラー間競合を検出
   - CentralControllerがどのハンドラーを呼ぶかのラベルにもなる




４． 完成目標

（１）**🔄 UIのアーキテクチャを大幅改善（例文DB自動作成システムで培った高度アーキテクチャ思想を適用）
（２）**🔄 仮主語S分離の仕組み実装**（Extraposition完全対応）・スロット番号制対応スロット重複問題の完全解決（S='It' + S='to see...'等をS_1,S_2とする。が、それは内部IDで、UI上はS仮、S真のようなほうが分かりやすい）
（３）**🔄 サルでもわかるUI改善**（直感的インターフェース）
（４）**🔄 K-MAD完全導入リファクタリング**（将来課題）

### 背景（2025-01-01記録）

RephraseUIは**K-MAD方式以前に開発された**ため、以下の構造的問題を抱えています：

**現状の問題**:
- ❌ **CSSクラス名の二重管理**: `hidden-text` vs `hidden-subslot-text`（2025-01-01バグ原因）
- ❌ **タイミングの暗黙的依存**: 100ms, 250msなどマジックナンバー（2025-01-01バグ原因）
- ❌ **状態管理の分散**: localStorage, CSS classes, inline stylesが混在
- ❌ **職務分掌の欠如**: 複数ファイルが同じ責務を重複
- ❌ **構造化ロギングの欠如**: デバッグがConsole Log頼み

**K-MAD適用後の期待効果**:
- ✅ **バグ発生率70-80%削減**（情報統一システム + 職務分掌）
- ✅ **デバッグ時間7-18倍高速化**（構造化ロギング）
- ✅ **退化の自動検出**（Golden Test + AST Linter）
- ✅ **開発速度の向上**（動的基準システム）

**具体的な適用内容**:
1. **情報統一システム**: 全てのクラス名・API・状態管理を統一形式に
2. **職務分掌（Capabilities）**: ファイル・関数の責務を明確に分離
3. **構造化ロギング**: エラー原因の即座特定（35-90分 → 5分）
4. **動的基準システム**: マジックナンバー排除、設定の外部化
5. **AST Linter**: 統一ルールの自動検証、コミットブロック
6. **Golden Test**: UI退化の自動検出、スナップショット比較
7. **Fail and Recover自動統合**: 修正履歴の自動記録（15-28分 → 3-5分）

**優先順位**: 現在は公開リリース優先のため、時間的余裕ができ次第実施


**目的**: 

**実装内容**（training/js/structure_builder.js、推定20-30行）:
①. スロット表示ラベル生成関数（10-15行）
   ```javascript
   function getSlotDisplayLabel(slotName) {
     // "O1_1" → "O1 (1)", "O1_2" → "O1 (2)"
     const match = slotName.match(/^([A-Z]+\d?)_(\d+)$/);
     if (match) return `${match[1]} (${match[2]})`;
     return slotName;  // "O1" → "O1" (後方互換)
   }
   ```
②. renderSlot()内でラベル適用（5行）
③. 音声読み上げ順序調整（10-20行、番号順ソート）

**重要**: データ構造はそのまま使用可能（`Slot_display_order`で表示順序制御）


Claude Sonnet への指示文（UI調整フェーズ・安全優先）

現在、RephraseUI は K-MAD 以前に構築されたため、内部構造が完全に把握できていない。
そのため アーキテクチャの大規模改修は行わず、UI出力レイヤのみを安全に調整する 方針を取る。

基本方針

コア解析ロジック・データ構造は一切変更しない

変更対象は training/js/structure_builder.js などの表示・整形レイヤのみ

「変更禁止ゾーン」を定義するのではなく、
「今フェーズで触ってよいゾーン」だけを明示して封じ込める

今回のUI調整の目的

サルでも分かるUI

制御パネルや番号制スロットを、直感的に理解できる表示にする

番号付きスロットの可読性向上

内部名（例：O1_1, O1_2）は保持したまま、UIでは自然なラベルに変換

表示順・音声読み上げ順の安定化

番号順で一貫した並びにする

実装内容（安全に触ってよい範囲）

表示ラベル変換関数の追加

function getSlotDisplayLabel(slotName) {
  // "O1_1" → "O1 (1)", "O1_2" → "O1 (2)"
  const match = slotName.match(/^([A-Z]+\d?)_(\d+)$/);
  if (match) return `${match[1]} (${match[2]})`;
  return slotName; // 後方互換
}


renderSlot() 内で表示ラベルとして上記関数を使用

表示順・読み上げ順は番号順ソート

番号なし（O1）は (0) 扱いにする

既存の Slot_display_order などの制御は維持する

形式主語（It / to- 不定詞）について

形式主語（S仮 / S真）はロジック問題だが、

コア解析は触らず、UI投入直前の出力整形で分離する

例：

内部：S, S_2

UI：S (formal) / S (real) などのラベル表現

今回は 出口レイヤでの最小対応に留める（全面K-MAD適用は後回し）

重要な制約

内部データ構造・解析パイプラインには手を入れない

大規模リファクタリングは行わない

目的は「公開に耐える安定UI」であり、構造美の追求ではない

補足（背景共有・書かなくてもOK）

このUIは **RephraseUI（学習用）**であり、
DB自動作成システムの内部可視化UIではない

今回は公開直前フェーズのため、速度と安全性を最優先する




## 📊 現在の進捗状況


---

## 🔍 AI調査時の必須プロトコル（絶対厳守）

### Rule 1: 実装調査の3ステップ（省略禁止）

**目的**: grep検索で見つからない → 「実装が存在しない」という誤った結論を防ぐ

**必須手順**:

1. **Step 1: 広範囲grep検索**（複数パターン必須）
   ```bash
   # パターンA: 設計仕様書表記
   grep "Phase ①|Phase ②|Phase ③|Phase ④"
   
   # パターンB: 実装表記
   grep "Phase ① 特殊構造|Phase ② 基本構造|Phase ③ 拡張|Phase ④ 統合"
   
   # パターンC: プロセス番号
   grep "① 文法検出|②③ 埋め込み|⑧ マスク|⑨ 上位文|⑤⑥ Claim"
   ```

2. **Step 2: 0件の場合、実装ファイル直接確認**（必須）
   - 設計仕様書に記載されている実装場所を開く
   - 該当メソッド全体を`read_file`で読む（Line範囲指定）
   - 例: `src/controllers/central_controller_v14_chunk_system.py` Line 1374-2044

3. **Step 3: 証拠付き報告**（必須）
   - ✅ 「Line XXX-YYYで実装確認。コード内容: ...」（証拠提示）
   - ❌ 「見つからない」「存在しない」だけの報告は**絶対禁止**

### Rule 2: 否定的報告の禁止（証拠必須）

- ❌ **禁止**: 「実装が存在しない」「複数のプロセスが存在しない」等の否定的報告
  - **理由**: grep検索で見つからないだけで、実装は存在する可能性が高い
  - **結果**: ユーザーに誤った情報を提供 → 時間の大幅な損失

- ✅ **推奨**: 段階的報告
  - 「grep検索で0件。設計仕様書記載のLine XXX-YYYを確認中...」
  - 「Line XXX-YYYで実装確認。Phase ①は `_execute_unified_pipeline()` Line 1466-1680に実装済み」

### Rule 3: 破壊的変更の事前承認（必須）

- **100行以上の削除・追加は、理由・影響範囲を説明し、ユーザー承認必須**
- Golden Testを実行するまで「完了」と報告しない
- 例: 「PhraseChunker 497行削除を提案。理由: XXX。影響範囲: YYY。承認をお願いします。」

### Rule 4: 設計仕様書は絶対（信頼原則）

- **設計仕様書に「Phase ① 完成」と記載 → 実装は必ず存在する**
- 見つからない場合は「調査方法が誤り」と判断し、Step 2（直接確認）へ
- 設計仕様書を疑わず、自分の調査手法を疑う

### 過去の失敗事例（2025-11-23）

**失敗**: 
- grep検索で `Phase ①` が0件 → 「実装が存在しない」と誤報告
- 実際: `Phase ① 特殊構造処理` という表記で実装済み（Line 1466-1680）
- 結果: 2-3時間の無駄な作業 + Git復元

**再発防止**: 
- 上記Rule 1-4を厳守
- grep検索で見つからない場合、必ずStep 2（直接確認）を実行

---


## 🔧 作業の引き継ぎ

現在の作業内容や前回のチャットからの引き継ぎ事項は、会話の冒頭で共有されます。
それを踏まえて、すぐに本題に入って支援してください。

---

**最終更新**: 2025年12月27日

## 🔄 段階的リリース戦略（2025-12-19確立）

**背景**: AI市場のタイミングを重視し、完全実装を待たずに段階的リリースを実施
K-MAD完全導入リファクタリングは今後の課題


---

## Minimal UI Verification Plan (Pre-HN)

This section describes **lightweight, high-impact checks** suitable for RephraseUI,
where behavior is user-driven (mouse/interaction) and cannot be fully Golden-tested.

### A. DOM-Level Assertions (Automatable)
Use Playwright or equivalent.

Verify after randomization / UI updates:
- Required slots exist (S, V, O1, C, sub-slots if applicable)
- Slot order matches `Slot_display_order`
- sub-slot expand/collapse state is preserved across re-renders
- visibility flags (hidden / shown) remain consistent
- no duplicate or missing slot containers

These checks assert **structural correctness**, not pedagogy.

### B. Visual Regression (Snapshot-Based)
For a small, fixed set of example states:
- Capture screenshots (before/after UI changes)
- Compare pixel diffs with a tolerance threshold

Purpose:
- Detect layout breakage
- Detect unintended UI shifts
- Prevent silent regressions before public release

This is not aesthetic validation, but **regression detection**.

### C. Human-in-the-Loop UX Check (Manual)
Still required for:
- “Is this intuitive?”
- “Can a first-time user understand the control panel?”

Keep this manual, fast, and limited to key flows only.

---

**Summary**
- Structural correctness: automated
- Layout regression: visual snapshots
- UX intuition: human check

This balances safety and speed without over-engineering.
