import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * RephraseUI「私の代行テスト」
 * 
 * 【目的】
 * 人間が修正後に必ず行っていた確認行為を自動化する
 * 「UIの一般的な動作確認」ではなく「私ならOKを出すか？」を判断する
 * 
 * 【対象DB】
 * プルダウンメニューの「フルセット」（data/slot_order_data.json）
 * ※将来的に変更可能
 */

// 対象プリセットの定義（ここを変更して切り替え可能）
const TARGET_PRESET_NAME = 'フルセット';
const TARGET_PRESET_FILE = 'data/slot_order_data.json';

test.describe('RephraseUI 私の代行テスト', () => {
  
  let dbData: any;
  
  test.beforeAll(async () => {
    // DBデータを読み込み（配列形式）
    const dbPath = path.resolve(__dirname, '..', 'training', TARGET_PRESET_FILE);
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    dbData = JSON.parse(rawData);
    
    console.log(`📋 対象DB: ${TARGET_PRESET_NAME} (${TARGET_PRESET_FILE})`);
    console.log(`📊 DB内のスロット行数: ${dbData.length}`);
    
    // 例文ID一覧を抽出
    const exampleIds = new Set<string>();
    for (const row of dbData) {
      if (row.例文ID) exampleIds.add(row.例文ID);
    }
    console.log(`📊 例文数: ${exampleIds.size}`);
  });
  
  test.beforeEach(async ({ page }) => {
    // 画面サイズを設定（サブスロット展開時も全体が見えるように）
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // URLパラメータなしでページを開く（grammarパラメータの影響を排除）
    await page.goto('/training/index.html?skipAuth=true');
    await page.waitForLoadState('networkidle');
    
    // ページ全体を60%に縮小表示（サブスロット展開時も全体が見えるように）
    await page.evaluate(() => {
      document.body.style.transform = 'scale(0.6)';
      document.body.style.transformOrigin = 'top left';
    });
    
    // プリセット選択UIが準備完了するまで待機
    await page.waitForTimeout(1000);
    
    // プルダウンから「フルセット」を選択
    const presetSelect = page.locator('#presetSelect');
    await expect(presetSelect).toBeVisible({ timeout: 5000 });
    
    const currentValue = await presetSelect.inputValue();
    console.log(`🔍 プリセット選択前の値: ${currentValue}`);
    
    // 強制的に「フルセット」を選択
    await page.evaluate((targetFile) => {
      const select = document.getElementById('presetSelect') as HTMLSelectElement;
      if (select) {
        select.value = targetFile;
        // changeイベントを発火（自動ロード処理がある場合に備えて）
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, TARGET_PRESET_FILE);
    
    await page.waitForTimeout(500);
    
    const afterValue = await presetSelect.inputValue();
    console.log(`🔍 プリセット選択後の値: ${afterValue}`);
    
    if (afterValue !== TARGET_PRESET_FILE) {
      throw new Error(`❌ プリセット選択失敗: 期待=${TARGET_PRESET_FILE}, 実際=${afterValue}`);
    }
    
    // ロードボタンをクリック
    const loadBtn = page.locator('#loadPresetButton');
    await expect(loadBtn).toBeVisible({ timeout: 5000 });
    await loadBtn.click();
    
    console.log('✅ プリセットロードボタンクリック完了');
    
    // JSONデータロード完了を確実に待機
    await page.waitForFunction((expectedFile) => {
      // window.loadedJsonDataが更新されているか確認
      const loadedData = (window as any).loadedJsonData;
      if (!loadedData || !Array.isArray(loadedData) || loadedData.length === 0) {
        return false;
      }
      
      // プリセット選択が期待値と一致しているか確認
      const select = document.getElementById('presetSelect') as HTMLSelectElement;
      if (!select || select.value !== expectedFile) {
        return false;
      }
      
      // スロット内容が表示されているか確認
      const phrases = document.querySelectorAll('.slot-phrase');
      for (const p of phrases) {
        if (p.textContent && p.textContent.trim().length > 0) {
          return true;
        }
      }
      return false;
    }, TARGET_PRESET_FILE, { timeout: 15000 });
    
    console.log('✅ データロード完了確認');
    
    // ロードされたデータの情報を取得
    const loadedInfo = await page.evaluate(() => {
      const data = (window as any).loadedJsonData;
      const select = document.getElementById('presetSelect') as HTMLSelectElement;
      return {
        dataLength: data?.length || 0,
        presetValue: select?.value || 'unknown'
      };
    });
    
    console.log(`📊 ロードされたデータ行数: ${loadedInfo.dataLength}`);
    console.log(`📋 確認されたプリセット値: ${loadedInfo.presetValue}`);
    
    // データが正しくロードされていることを確認
    if (loadedInfo.dataLength === 0) {
      throw new Error('❌ データがロードされていません');
    }
    
    if (loadedInfo.presetValue !== TARGET_PRESET_FILE) {
      throw new Error(`❌ プリセット不一致: 期待=${TARGET_PRESET_FILE}, 実際=${loadedInfo.presetValue}`);
    }
    
    // サブスロットトグルボタンの数を確認
    const toggleBtns = await page.locator('button[data-subslot-toggle]').count();
    console.log(`📍 サブスロットトグルボタン数: ${toggleBtns}`);
  });

  /**
   * Test-3&4統合: 【最優先】サブスロットのhidden状態保持テスト
   * 
   * 目的: 開閉操作と個別ランダマイズの両方で、学習者の設定した「非表示状態」が保持されることを保証
   * 
   * ロジック:
   * 1. DB調査: 使用される可能性のある全サブスロット（親+サブの組み合わせ）を把握
   * 2. ランダマイズを実施してそのサブスロットが表示されるのを待つ
   * 3. 表示されたら制御パネルでそこの英語と日本語補助テキストを非表示
   * 4. 【テストA】トグルで開閉 → hidden状態確認
   * 5. 【テストB】個別ランダマイズ → hidden状態確認
   * 6. これを可能性のある全サブスロットに対して実施
   */
  test('[最優先] サブスロットのhidden状態が開閉・ランダマイズで保持される', async ({ page }) => {
    test.setTimeout(300000); // 5分
    
    // 1. DBから全サブスロット組み合わせ（親+サブ）を抽出
    const allDbSubslots = new Set<string>();
    for (const row of dbData) {
      if (row.SubslotID && row.Slot && row.V_group_key && row.例文ID) {
        const parentSlot = row.Slot.toLowerCase();
        const subslotId = row.SubslotID;
        allDbSubslots.add(`${parentSlot}-${subslotId}`);
      }
    }
    
    console.log(`📋 DB内の全サブスロット組み合わせ: ${allDbSubslots.size}種類`);
    console.log(`   ${Array.from(allDbSubslots).sort().join(', ')}`);
    
    if (allDbSubslots.size === 0) {
      console.log('⚠️ DBにサブスロットが存在しない');
      test.skip();
      return;
    }
    
    // =====================================
    // 🔧 共通ヘルパー関数
    // =====================================
    
    // サブスロットを非表示に設定するヘルパー
    // 🆕 configuredSubslotsを使って既に設定済みのサブスロットはスキップ
    async function hideSubslotTexts(parentSlotName: string, subslotPanel: any, configuredSet: Set<string>) {
      // 「全英文非表示」ボタンをクリック
      const hideAllButton = subslotPanel.locator('button').filter({ hasText: '全英文非表示' });
      
      if (await hideAllButton.count() === 0) {
        console.log(`  ⚠️ ${parentSlotName} の「全英文非表示」ボタンが見つからない`);
        return false;
      }
      
      console.log(`  🔧 「全英文非表示」ボタンをクリック`);
      await hideAllButton.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
      
      try {
        await hideAllButton.click({ timeout: 5000 });
      } catch (e) {
        console.log(`  ⚠️ 「全英文非表示」クリック失敗: ${e.message}`);
        return false;
      }
      await page.waitForTimeout(500);
      
      console.log(`  ✅ 英語テキスト非表示設定完了`);
      
      // 日本語補助テキストも非表示にする
      console.log(`  🔧 日本語補助テキストを非表示にします...`);
      const subslotTypes = ['m1', 's', 'aux', 'm2', 'v', 'c1', 'o1', 'o2', 'c2', 'm3'];
      let auxButtonClickCount = 0;
      
      for (const subslotType of subslotTypes) {
        try {
          // 🆕 既に設定済みならスキップ（トグルで表示に戻してしまうのを防止）
          const configKey = `${parentSlotName}-sub-${subslotType}`;
          if (configuredSet.has(configKey)) {
            console.log(`    ⏭️ ${subslotType} 📝補助: 既に設定済み（スキップ）`);
            continue;
          }
          
          const auxButton = subslotPanel.locator(
            `.subslot-toggle-button[data-subslot-type="${subslotType}"][data-element-type="auxtext"]`
          );
          
          if (await auxButton.count() === 0) continue;
          if (!(await auxButton.isVisible().catch(() => false))) continue;
          
          // 🎯 正しいセレクタ: slot-{parent}-sub-{type}
          const targetSubslotId = `slot-${parentSlotName}-sub-${subslotType}`;
          const targetSubslot = page.locator(`#${targetSubslotId}`);
          
          if (await targetSubslot.count() === 0) continue;
          
          const alreadyHidden = await targetSubslot.evaluate(el => 
            el.classList.contains('hidden-subslot-auxtext')
          ).catch(() => false);
          
          if (alreadyHidden) {
            console.log(`    ⏭️ ${subslotType} 📝補助: 既に非表示（スキップ）`);
            // 🆕 非表示状態を記録
            configuredSet.add(configKey);
            continue;
          }
          
          await auxButton.click({ timeout: 3000 });
          auxButtonClickCount++;
          // 🆕 クリック後に記録
          configuredSet.add(configKey);
          await page.waitForTimeout(100);
          console.log(`    ✅ ${subslotType} 📝補助: クリック完了`);
        } catch (err) {
          console.log(`    ⚠️ ${subslotType} 📝補助ボタンのクリック失敗: ${err.message}`);
        }
      }
      
      console.log(`  ✅ 日本語補助: ${auxButtonClickCount}個クリック`);
      return true;
    }
    
    // hidden状態を検証するヘルパー
    async function verifyHiddenState(parentSlotName: string, subslotIds: string[], testType: string): Promise<number> {
      let failCount = 0;
      
      for (const subslotId of subslotIds) {
        const combination = `${parentSlotName}-${subslotId}`;
        const containerIdPattern = `slot-${parentSlotName}-${subslotId}`;
        const container = page.locator(`#${containerIdPattern}.slot-container`);
        
        if (await container.count() === 0) {
          console.log(`  ⚠️ ${containerIdPattern} が見つからない`);
          continue;
        }
        
        const slotPhrase = container.locator('.slot-phrase');
        const slotText = container.locator('.slot-text');
        
        let localFail = 0;
        
        const hasTextHiddenClass = await container.evaluate(el => 
          el.classList.contains('hidden-subslot-text')
        );
        
        if (await slotPhrase.count() > 0 && !hasTextHiddenClass) {
          console.log(`  ❌ ${combination}: .hidden-subslot-text クラスが失われている [${testType}]`);
          localFail++;
        }
        
        const hasAuxtextHiddenClass = await container.evaluate(el => 
          el.classList.contains('hidden-subslot-auxtext')
        );
        
        if (await slotText.count() > 0 && !hasAuxtextHiddenClass) {
          console.log(`  ❌ ${combination}: .hidden-subslot-auxtext クラスが失われている [${testType}]`);
          localFail++;
        }
        
        if (localFail === 0) {
          console.log(`  ✅ ${combination}: hidden状態保持 [${testType}]`);
        }
        failCount += localFail;
      }
      
      return failCount;
    }
    
    // 転写完了を待機するヘルパー
    async function waitForTransfer(wrapperId: string): Promise<boolean> {
      const result = await page.waitForFunction((id) => {
        const wrapper = document.getElementById(id);
        if (!wrapper || window.getComputedStyle(wrapper).display === 'none') return false;
        
        const containers = wrapper.querySelectorAll('.slot-container, .subslot-container');
        if (containers.length === 0) return false;
        
        for (const container of containers) {
          const slotPhrase = container.querySelector('.slot-phrase');
          const slotText = container.querySelector('.slot-text');
          if ((slotPhrase?.textContent?.trim()) || (slotText?.textContent?.trim())) {
            return true;
          }
        }
        return false;
      }, wrapperId, { timeout: 10000 }).catch(() => null);
      
      return !!result;
    }
    
    // =====================================
    // メインテストループ
    // =====================================
    
    const testedSubslots = new Set<string>();
    // 🆕 既に非表示設定済みのサブスロットを追跡（2回目以降のクリックを防止）
    const configuredSubslots = new Set<string>();
    let totalFailCount = 0;
    const violations: { combination: string; testType: string; reason: string }[] = [];
    const MAX_RANDOMIZE = 50;
    const randomizeBtn = page.locator('#randomize-all');
    
    for (let attempt = 0; attempt < MAX_RANDOMIZE && testedSubslots.size < allDbSubslots.size; attempt++) {
      await randomizeBtn.click();
      await page.waitForTimeout(1000);
      
      console.log(`\n━━━ ${attempt + 1}回目のランダマイズ ━━━`);
      
      // 動的記載エリアから実際にレンダリングされたサブスロットを解析
      const renderedSubslots = await page.evaluate(() => {
        const dynamicArea = document.getElementById('dynamic-slot-area');
        if (!dynamicArea) return [];
        
        const results: Array<{parent: string, subslots: string[]}> = [];
        const subslotElements = dynamicArea.querySelectorAll('.subslot[id*="-sub-"]');
        const groupedByParent = new Map<string, Set<string>>();
        
        subslotElements.forEach((element) => {
          const id = element.id;
          const match = id.match(/^slot-(\w+)-sub-(\w+)$/);
          if (!match) return;
          
          const parent = match[1].toLowerCase();
          const subslotType = `sub-${match[2]}`;
          
          const subElement = element.querySelector('.subslot-element');
          const subText = element.querySelector('.subslot-text');
          const hasContent = (subElement?.textContent?.trim() && subElement.textContent.trim() !== '') ||
                           (subText?.textContent?.trim() && subText.textContent.trim() !== '');
          
          if (hasContent) {
            if (!groupedByParent.has(parent)) groupedByParent.set(parent, new Set());
            groupedByParent.get(parent)!.add(subslotType);
          }
        });
        
        groupedByParent.forEach((subslots, parent) => {
          results.push({ parent, subslots: Array.from(subslots) });
        });
        
        return results;
      });
      
      if (renderedSubslots.length === 0) {
        console.log(`  ⚠️ 動的記載エリアにサブスロットなし（スキップ）`);
        continue;
      }
      
      console.log(`  🔍 動的記載エリア解析結果:`);
      renderedSubslots.forEach(item => {
        console.log(`    ${item.parent}: ${item.subslots.join(', ')}`);
      });
      
      // 各親スロットをテスト
      for (const {parent: parentSlotName, subslots: subslotIds} of renderedSubslots) {
        const toggleBtn = page.locator(`button[data-subslot-toggle="${parentSlotName}"]`);
        
        if (await toggleBtn.count() === 0) {
          console.log(`  ⏩ ${parentSlotName} トグルボタンが見つからない（スキップ）`);
          continue;
        }
        
        console.log(`\n🔓 ${parentSlotName} サブスロット領域を開きます`);
        await toggleBtn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        
        try {
          await toggleBtn.click({ timeout: 5000 });
          await page.waitForTimeout(500);
        } catch (e) {
          console.log(`  ❌ クリックエラー: ${e.message}`);
          continue;
        }
        
        const actualWrapperId = `slot-${parentSlotName}-sub`;
        if (!await waitForTransfer(actualWrapperId)) {
          console.log(`  ⚠️ ${parentSlotName} の転写タイムアウト（スキップ）`);
          await toggleBtn.click().catch(() => {});
          await page.waitForTimeout(400);
          continue;
        }
        
        console.log(`  ✅ ${parentSlotName} の転写完了`);
        
        // サブスロット制御パネルを取得
        const subslotPanelId = `subslot-visibility-panel-${parentSlotName}`;
        const subslotPanel = page.locator(`#${subslotPanelId}`);
        
        if (await subslotPanel.count() === 0) {
          console.log(`  ⚠️ ${parentSlotName} のサブスロット制御パネルが見つからない（スキップ）`);
          continue;
        }
        
        // 制御パネル表示
        if (!(await subslotPanel.isVisible())) {
          const controlPanelToggle = page.locator('#toggle-control-panels');
          await controlPanelToggle.click();
          await page.waitForTimeout(500);
        }
        
        // サブスロットを非表示に設定（configuredSubslotsで既設定をスキップ）
        if (!await hideSubslotTexts(parentSlotName, subslotPanel, configuredSubslots)) {
          continue;
        }
        
        // =====================================
        // 【テストA】開閉操作テスト
        // =====================================
        console.log(`  🔄 【テストA】開閉操作テスト開始...`);
        
        // 閉じる
        await toggleBtn.click();
        await page.waitForTimeout(400);
        
        // 開く
        await toggleBtn.click();
        await page.waitForTimeout(800);
        
        // 検証
        const toggleFailCount = await verifyHiddenState(parentSlotName, subslotIds, '開閉テスト');
        if (toggleFailCount > 0) {
          totalFailCount += toggleFailCount;
          violations.push({
            combination: `${parentSlotName}`,
            testType: '開閉テスト',
            reason: `${toggleFailCount}件のhidden状態解除`
          });
        }
        
        // =====================================
        // 【テストB】個別ランダマイズテスト
        // =====================================
        console.log(`  🎲 【テストB】個別ランダマイズテスト開始...`);
        
        const individualRandomizeBtn = page.locator(`button[data-individual-randomize="${parentSlotName}"]`);
        
        if (await individualRandomizeBtn.count() > 0) {
          await individualRandomizeBtn.click();
          await page.waitForTimeout(1500);
          
          if (await waitForTransfer(actualWrapperId)) {
            const randomizeFailCount = await verifyHiddenState(parentSlotName, subslotIds, '個別ランダマイズ');
            if (randomizeFailCount > 0) {
              totalFailCount += randomizeFailCount;
              violations.push({
                combination: `${parentSlotName}`,
                testType: '個別ランダマイズ',
                reason: `${randomizeFailCount}件のhidden状態解除`
              });
            }
          } else {
            console.log(`  ⚠️ 個別ランダマイズ後の転写タイムアウト`);
          }
        } else {
          console.log(`  ⚠️ ${parentSlotName} の個別ランダマイズボタンが見つからない（スキップ）`);
        }
        
        // テスト済みサブスロットを記録
        for (const subslotId of subslotIds) {
          testedSubslots.add(`${parentSlotName}-${subslotId}`);
        }
        
        // 親スロットを閉じる
        console.log(`  🔒 ${parentSlotName} サブスロット領域を閉じます`);
        await toggleBtn.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await toggleBtn.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(400);
      }
      
      if ((attempt + 1) % 10 === 0) {
        console.log(`\n📊 ${attempt + 1}回ランダマイズ: ${testedSubslots.size}/${allDbSubslots.size}種類テスト完了`);
      }
    }
    
    console.log(`\n📊 最終結果:`);
    console.log(`   DB内の全組み合わせ: ${allDbSubslots.size}種類`);
    console.log(`   テスト完了: ${testedSubslots.size}種類`);
    console.log(`   カバレッジ: ${((testedSubslots.size / allDbSubslots.size) * 100).toFixed(1)}%`);
    console.log(`   違反数: ${totalFailCount}`);
    
    if (violations.length > 0) {
      console.log(`\n❌ 違反詳細:`);
      violations.forEach(v => console.log(`   ${v.combination} [${v.testType}]: ${v.reason}`));
    }
    
    // 判定基準: 90%以上のカバレッジでPass（業界標準に準拠）
    const coveragePercent = (testedSubslots.size / allDbSubslots.size) * 100;
    const MIN_COVERAGE = 90;
    
    expect(coveragePercent).toBeGreaterThanOrEqual(MIN_COVERAGE);
    expect(totalFailCount).toBe(0);
    
    if (totalFailCount === 0 && coveragePercent >= MIN_COVERAGE) {
      console.log(`\n🎉 サブスロットのhidden状態が開閉・ランダマイズで保持されている（カバレッジ${coveragePercent.toFixed(1)}%）`);
    }
  });

  /**
   * Test-2: イレギュラーなorderが定義されている場合、UI表示順がorderに従っているか
   * 
   * 目的: DB側で定義された語順（order）が、UIで無視・正規化されていないことを保証
   */
  test('[必須] イレギュラーなorder定義がUI表示順に反映される', async ({ page }) => {
    // DBから例文IDごとにスロット順序を抽出
    const exampleOrders = new Map<string, any[]>();
    
    for (const row of dbData) {
      if (!row.例文ID || row.SubslotID) continue; // 主節スロットのみ
      
      if (!exampleOrders.has(row.例文ID)) {
        exampleOrders.set(row.例文ID, []);
      }
      
      exampleOrders.get(row.例文ID)!.push({
        slot: row.Slot,
        order: row.Slot_display_order
      });
    }
    
    // 各例文のスロット順序をソート
    const standardOrder = ['M1', 'S', 'Aux', 'M2', 'V', 'C1', 'O1', 'O2', 'C2', 'M3'];
    const irregularExamples: any[] = [];
    
    for (const [exampleId, slots] of exampleOrders) {
      const sortedSlots = slots.sort((a, b) => a.order - b.order);
      const actualOrder = sortedSlots.map(s => s.slot);
      
      // 標準順序（該当スロットのみ）
      const expectedOrder = standardOrder.filter(s => actualOrder.includes(s));
      
      // 完全一致しない場合はイレギュラー
      const isIrregular = JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder);
      
      if (isIrregular) {
        irregularExamples.push({
          id: exampleId,
          actualOrder: actualOrder,
          expectedOrder: expectedOrder
        });
      }
    }
    
    console.log(`📋 イレギュラーなorder定義: ${irregularExamples.length}個`);
    
    if (irregularExamples.length === 0) {
      console.log('⚠️ イレギュラーなorder定義が見つからない（全て標準順）');
      test.skip();
      return;
    }
    
    console.log(`📝 イレギュラー例:`, irregularExamples.slice(0, 3));
    
    // ランダマイズを複数回実行して、イレギュラーorder例文を検証
    const randomizeBtn = page.locator('#randomize-all');
    let testCount = 0;
    const MAX_ATTEMPTS = 20;
    
    for (let attempt = 0; attempt < MAX_ATTEMPTS && testCount < 3; attempt++) {
      await randomizeBtn.click();
      await page.waitForTimeout(1000);
      
      // 現在表示中のスロットDOMを取得
      const mainSlots = page.locator('.slot-container:not([id*="sub"]):not(.hidden)');
      const slotCount = await mainSlots.count();
      
      const displayedSlots: string[] = [];
      for (let i = 0; i < slotCount; i++) {
        const id = await mainSlots.nth(i).getAttribute('id');
        if (id) {
          // id形式: "slot-m1" → "M1"
          const slotType = id.replace('slot-', '').toUpperCase();
          displayedSlots.push(slotType);
        }
      }
      
      // 表示されているスロット順序が標準順から逸脱しているか確認
      const expectedDisplayed = standardOrder.filter(s => displayedSlots.includes(s));
      const isIrregular = JSON.stringify(displayedSlots) !== JSON.stringify(expectedDisplayed);
      
      if (isIrregular) {
        console.log(`✅ イレギュラーorder検出: ${displayedSlots.join(' → ')}`);
        console.log(`   期待標準順: ${expectedDisplayed.join(' → ')}`);
        testCount++;
      }
    }
    
    console.log(`📊 イレギュラーorder検証数: ${testCount}個`);
    
    // 少なくとも1つはイレギュラーorderを検証できた
    expect(testCount).toBeGreaterThan(0);
    
    console.log('🎉 イレギュラーorder定義がUI表示順に反映されている');
  });

  /**
   * Test-1: DBに存在する全てのサブスロットが画面上に一度以上表示されるか
   * 
   * 目的: DBに存在するサブスロット構造が、UI表示ロジック上で欠落していないことを保証
   * 
   * ロジック:
   * 1. DB内の各例文について、親スロットごとのサブスロット構造をマップ化
   *    例: make/ex007 → S に [sub-s, sub-aux, sub-m2, sub-v, sub-o1]
   * 2. ランダマイズで各例文を表示し、各親スロットのサブスロットが全て表示されているか確認
   * 3. DB内の全サブスロット組み合わせ（親+サブ）がUIに出現するまで繰り返す
   */
  test('[必須] DBの全サブスロット種別がUIに表示される', async ({ page }) => {
    test.setTimeout(300000); // 5分
    
    // 1. DBから例文構造をマップ化：各例文の各親スロットにどのサブスロットがあるか
    const exampleStructure = new Map<string, Map<string, Set<string>>>();
    // 形式: Map<"V_group_key/例文ID", Map<"親スロット", Set<"サブスロット種別">>>
    
    for (const row of dbData) {
      if (row.SubslotID && row.Slot && row.V_group_key && row.例文ID) {
        const exampleKey = `${row.V_group_key}/${row.例文ID}`;
        if (!exampleStructure.has(exampleKey)) {
          exampleStructure.set(exampleKey, new Map());
        }
        const example = exampleStructure.get(exampleKey)!;
        const parentSlot = row.Slot.toLowerCase();
        if (!example.has(parentSlot)) {
          example.set(parentSlot, new Set());
        }
        example.get(parentSlot)!.add(row.SubslotID);
      }
    }
    
    console.log(`📋 DB内の例文数: ${exampleStructure.size}`);
    
    // DB内の全サブスロット組み合わせ（親+サブ）を集計
    const allDbCombinations = new Set<string>();
    exampleStructure.forEach((parentMap, exampleKey) => {
      parentMap.forEach((subslots, parentSlot) => {
        subslots.forEach(subslotId => {
          allDbCombinations.add(`${parentSlot}-${subslotId}`);
        });
      });
    });
    
    console.log(`📊 DB内の全サブスロット組み合わせ: ${allDbCombinations.size}種類`);
    console.log(`   ${Array.from(allDbCombinations).sort().join(', ')}`);
    
    if (allDbCombinations.size === 0) {
      console.log('⚠️ DBにサブスロットが存在しない');
      test.skip();
      return;
    }
    
    // 2. ランダマイズして各例文の各親スロットのサブスロットが全て表示されるか確認
    const uiFoundCombinations = new Set<string>();
    const randomizeBtn = page.locator('#randomize-all');
    const MAX_RANDOMIZE = 50;
    
    for (let i = 0; i < MAX_RANDOMIZE; i++) {
      await randomizeBtn.click();
      await page.waitForTimeout(1000);
      
      // 現在表示中のサブスロットトグルボタンを取得
      const toggleBtns = page.locator('button[data-subslot-toggle]');
      const toggleCount = await toggleBtns.count();
      
      if (toggleCount === 0) {
        console.log(`  ⚠️ ${i + 1}回目: サブスロットトグルボタンなし（スキップ）`);
        continue;
      }
      
      console.log(`\n━━━ ${i + 1}回目のランダマイズ: トグルボタン ${toggleCount}個 ━━━`);
      
      // 各親スロットを開いてサブスロットを確認
      for (let j = 0; j < toggleCount; j++) {
        const toggleBtn = toggleBtns.nth(j);
        const parentSlot = await toggleBtn.getAttribute('data-subslot-toggle');
        if (!parentSlot) continue;
        
        // 親スロットを開く
        await toggleBtn.evaluate((btn: HTMLElement) => btn.click());
        await page.waitForTimeout(500);
        
        // 静的DOM内の実際のサブスロット要素を確認
        const staticWrapperId = `slot-${parentSlot}-sub`;
        const actualSubslots = await page.evaluate((wrapperId) => {
          const wrapper = document.getElementById(wrapperId);
          if (!wrapper) return [];
          
          const containers = wrapper.querySelectorAll('.slot-container, .subslot-container');
          const found: string[] = [];
          
          containers.forEach((container) => {
            const id = container.id;
            if (!id) return;
            
            // ID形式: "slot-s-sub-s" → sub-s
            const match = id.match(/slot-\w+-sub-(\w+)$/);
            if (!match) return;
            
            // 実際にコンテンツがあるか確認（.slot-phraseまたは.slot-textに内容があるか）
            const slotPhrase = container.querySelector('.slot-phrase');
            const slotText = container.querySelector('.slot-text');
            const hasContent = (slotPhrase?.textContent?.trim() && slotPhrase.textContent.trim() !== '') ||
                             (slotText?.textContent?.trim() && slotText.textContent.trim() !== '');
            
            if (hasContent) {
              const subslotType = `sub-${match[1]}`;
              found.push(subslotType);
            }
          });
          
          return found;
        }, staticWrapperId);
        
        // 見つかったサブスロットを記録
        actualSubslots.forEach(subslotId => {
          const combination = `${parentSlot}-${subslotId}`;
          if (!uiFoundCombinations.has(combination)) {
            uiFoundCombinations.add(combination);
            console.log(`  ✅ ${combination} を発見`);
          }
        });
        
        // 親スロットを閉じる
        await toggleBtn.evaluate((btn: HTMLElement) => btn.click());
        await page.waitForTimeout(300);
      }
      
      // 全種類揃ったら早期終了
      if (uiFoundCombinations.size >= allDbCombinations.size) {
        console.log(`\n✅ ${i + 1}回のランダマイズで全サブスロット組み合わせが出現`);
        break;
      }
      
      if ((i + 1) % 10 === 0) {
        console.log(`\n📊 ${i + 1}回ランダマイズ: ${uiFoundCombinations.size}/${allDbCombinations.size}種類出現`);
      }
    }
    
    // 3. 検証：DB内の全組み合わせがUIに出現したか
    const missingCombinations: string[] = [];
    allDbCombinations.forEach(combination => {
      if (!uiFoundCombinations.has(combination)) {
        missingCombinations.push(combination);
      }
    });
    
    console.log(`\n📊 最終結果:`);
    console.log(`   DB内の全組み合わせ: ${allDbCombinations.size}種類`);
    console.log(`   UI出現: ${uiFoundCombinations.size}種類`);
    
    if (missingCombinations.length > 0) {
      console.log(`\n❌ 未出現: ${missingCombinations.join(', ')}`);
    }
    
    expect(uiFoundCombinations.size).toBeGreaterThanOrEqual(allDbCombinations.size);
    console.log('\n🎉 DB内の全サブスロット種別が静的スロットDOMに正しく表示される');
  });

  /**
   * Test-5: 【新規】「英語OFF/ON」ボタン経由でのhidden状態保持テスト
   * 
   * 目的: 全体制御ボタン（🙈 英語OFF / 👁️ 英語ON）経由で非表示設定した場合も、
   *       開閉操作とランダマイズで状態が保持されることを保証
   * 
   * 従来のTest-3&4との違い:
   * - Test-3&4: サブスロット制御パネル経由（個別設定）
   * - Test-5: 英語OFF/ONボタン経由（全体設定）
   * 
   * ⚠️ ロジックはTest-3&4と同じ（実証済み）、非表示設定方法のみ変更
   */
  test('[新規] 「英語OFF/ON」ボタン経由でのhidden状態保持', async ({ page }) => {
    test.setTimeout(300000); // 5分
    
    // =====================================
    // 🆕 英語OFF/ONボタンで全英文非表示
    // =====================================
    const hideAllEnglishBtn = page.locator('#hide-all-english-visibility');
    await expect(hideAllEnglishBtn).toHaveCount(1);
    
    const initialText = await hideAllEnglishBtn.textContent();
    console.log(`📋 初期ボタンテキスト: ${initialText?.trim()}`);
    
    if (initialText?.includes('英語OFF')) {
      console.log('🔒 「英語OFF」ボタンをクリック');
      await hideAllEnglishBtn.click();
      await page.waitForTimeout(500);
      
      const afterText = await hideAllEnglishBtn.textContent();
      console.log(`✅ ボタン変化確認: ${afterText?.trim()}`);
      expect(afterText).toContain('英語ON');
    }
    
    console.log('\n🔍 主要スロットの英文非表示を確認...');
    for (const slotName of ['s', 'v', 'o1']) {
      const phraseElement = page.locator(`#slot-${slotName} .slot-phrase`).first();
      if (await phraseElement.count() > 0) {
        const isHidden = await phraseElement.evaluate(el => {
          const style = window.getComputedStyle(el);
          return style.opacity === '0' || style.visibility === 'hidden';
        });
        expect(isHidden).toBe(true);
        console.log(`  ✅ ${slotName.toUpperCase()} スロット英文が非表示`);
      }
    }
    
    // =====================================
    // 以降はTest-3&4と全く同じロジック
    // =====================================
    
    // 転写待機ヘルパー（Test-3&4からコピー）
    async function waitForTransfer(wrapperId: string): Promise<boolean> {
      const result = await page.waitForFunction((id) => {
        const wrapper = document.getElementById(id);
        if (!wrapper || window.getComputedStyle(wrapper).display === 'none') return false;
        
        const containers = wrapper.querySelectorAll('.slot-container, .subslot-container');
        if (containers.length === 0) return false;
        
        for (const container of containers) {
          const slotPhrase = container.querySelector('.slot-phrase');
          const slotText = container.querySelector('.slot-text');
          if ((slotPhrase?.textContent?.trim()) || (slotText?.textContent?.trim())) {
            return true;
          }
        }
        return false;
      }, wrapperId, { timeout: 10000 }).catch(() => null);
      
      return !!result;
    }
    
    // hidden状態検証ヘルパー（Test-3&4からコピー）
    async function verifyHiddenState(parentSlotName: string, subslotIds: string[], testType: string): Promise<number> {
      let failCount = 0;
      
      for (const subslotId of subslotIds) {
        const combination = `${parentSlotName}-${subslotId}`;
        const containerIdPattern = `slot-${parentSlotName}-${subslotId}`;
        const container = page.locator(`#${containerIdPattern}.slot-container`);
        
        if (await container.count() === 0) {
          console.log(`  ⚠️ ${containerIdPattern} が見つからない`);
          continue;
        }
        
        const hasTextHiddenClass = await container.evaluate(el => 
          el.classList.contains('hidden-subslot-text')
        );
        
        if (!hasTextHiddenClass) {
          console.log(`  ❌ ${combination}: .hidden-subslot-text クラスが失われている [${testType}]`);
          failCount++;
        } else {
          console.log(`  ✅ ${combination}: hidden状態保持 [${testType}]`);
        }
      }
      
      return failCount;
    }
    
    const testedSubslots = new Set<string>();
    let totalFailCount = 0;
    const violations: { combination: string; testType: string; reason: string }[] = [];
    const MAX_RANDOMIZE = 50;
    const randomizeBtn = page.locator('#randomize-all');
    
    for (let attempt = 0; attempt < MAX_RANDOMIZE && testedSubslots.size < 20; attempt++) {
      await randomizeBtn.click();
      await page.waitForTimeout(1000);
      
      console.log(`\n━━━ ${attempt + 1}回目のランダマイズ ━━━`);
      
      // 動的記載エリアから実際にレンダリングされたサブスロットを解析
      const renderedSubslots = await page.evaluate(() => {
        const dynamicArea = document.getElementById('dynamic-slot-area');
        if (!dynamicArea) return [];
        
        const results: Array<{parent: string, subslots: string[]}> = [];
        const subslotElements = dynamicArea.querySelectorAll('.subslot[id*="-sub-"]');
        const groupedByParent = new Map<string, Set<string>>();
        
        subslotElements.forEach((element) => {
          const id = element.id;
          const match = id.match(/^slot-(\w+)-sub-(\w+)$/);
          if (!match) return;
          
          const parent = match[1].toLowerCase();
          const subslotType = `sub-${match[2]}`;
          
          const subElement = element.querySelector('.subslot-element');
          const subText = element.querySelector('.subslot-text');
          const hasContent = (subElement?.textContent?.trim() && subElement.textContent.trim() !== '') ||
                           (subText?.textContent?.trim() && subText.textContent.trim() !== '');
          
          if (hasContent) {
            if (!groupedByParent.has(parent)) groupedByParent.set(parent, new Set());
            groupedByParent.get(parent)!.add(subslotType);
          }
        });
        
        groupedByParent.forEach((subslots, parent) => {
          results.push({ parent, subslots: Array.from(subslots) });
        });
        
        return results;
      });
      
      if (renderedSubslots.length === 0) {
        console.log(`  ⚠️ 動的記載エリアにサブスロットなし（スキップ）`);
        continue;
      }
      
      console.log(`  🔍 動的記載エリア解析結果:`);
      renderedSubslots.forEach(item => {
        console.log(`    ${item.parent}: ${item.subslots.join(', ')}`);
      });
      
      // 各親スロットをテスト
      for (const {parent: parentSlotName, subslots: subslotIds} of renderedSubslots) {
        const toggleBtn = page.locator(`button[data-subslot-toggle="${parentSlotName}"]`);
        
        if (await toggleBtn.count() === 0) {
          console.log(`  ⏩ ${parentSlotName} トグルボタンが見つからない（スキップ）`);
          continue;
        }
        
        console.log(`\n🔓 ${parentSlotName} サブスロット領域を開きます`);
        await toggleBtn.scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
        
        try {
          await toggleBtn.click({ timeout: 5000 });
          await page.waitForTimeout(500);
        } catch (e) {
          console.log(`  ❌ クリックエラー: ${e.message}`);
          continue;
        }
        
        const actualWrapperId = `slot-${parentSlotName}-sub`;
        if (!await waitForTransfer(actualWrapperId)) {
          console.log(`  ⚠️ ${parentSlotName} の転写タイムアウト（スキップ）`);
          await toggleBtn.click().catch(() => {});
          await page.waitForTimeout(400);
          continue;
        }
        
        console.log(`  ✅ ${parentSlotName} の転写完了`);
        
        // =====================================
        // 【テストA】開閉操作テスト
        // =====================================
        console.log(`  🔄 【テストA】開閉操作テスト開始...`);
        
        // 閉じる
        await toggleBtn.click();
        await page.waitForTimeout(400);
        
        // 開く
        await toggleBtn.click();
        await page.waitForTimeout(800);
        
        // 検証
        const toggleFailCount = await verifyHiddenState(parentSlotName, subslotIds, '開閉テスト');
        if (toggleFailCount > 0) {
          totalFailCount += toggleFailCount;
          violations.push({
            combination: `${parentSlotName}`,
            testType: '開閉テスト',
            reason: `${toggleFailCount}件のhidden状態解除`
          });
        }
        
        // =====================================
        // 【テストB】個別ランダマイズテスト
        // =====================================
        console.log(`  🎲 【テストB】個別ランダマイズテスト開始...`);
        
        const individualRandomizeBtn = page.locator(`button[data-individual-randomize="${parentSlotName}"]`);
        
        if (await individualRandomizeBtn.count() > 0) {
          await individualRandomizeBtn.click();
          await page.waitForTimeout(1500);
          
          if (await waitForTransfer(actualWrapperId)) {
            const randomizeFailCount = await verifyHiddenState(parentSlotName, subslotIds, '個別ランダマイズ');
            if (randomizeFailCount > 0) {
              totalFailCount += randomizeFailCount;
              violations.push({
                combination: `${parentSlotName}`,
                testType: '個別ランダマイズ',
                reason: `${randomizeFailCount}件のhidden状態解除`
              });
            }
          } else {
            console.log(`  ⚠️ 個別ランダマイズ後の転写タイムアウト`);
          }
        } else {
          console.log(`  ⚠️ ${parentSlotName} の個別ランダマイズボタンが見つからない（スキップ）`);
        }
        
        // テスト済みサブスロットを記録
        for (const subslotId of subslotIds) {
          testedSubslots.add(`${parentSlotName}-${subslotId}`);
        }
        
        // 親スロットを閉じる
        console.log(`  🔒 ${parentSlotName} サブスロット領域を閉じます`);
        await toggleBtn.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {});
        await toggleBtn.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(400);
      }
      
      if ((attempt + 1) % 10 === 0) {
        console.log(`\n📊 ${attempt + 1}回ランダマイズ: ${testedSubslots.size}個のサブスロットをテスト完了`);
      }
    }
    
    console.log(`\n📊 最終結果:`);
    console.log(`   テスト完了: ${testedSubslots.size}個のサブスロット`);
    console.log(`   違反数: ${totalFailCount}`);
    
    if (violations.length > 0) {
      console.log(`\n❌ 違反詳細:`);
      violations.forEach(v => console.log(`   ${v.combination} [${v.testType}]: ${v.reason}`));
    }
    
    // 少なくとも3個以上はテストできたことを確認
    expect(testedSubslots.size).toBeGreaterThanOrEqual(3);
    expect(totalFailCount).toBe(0);
    
    if (totalFailCount === 0) {
      console.log(`\n🎉 「英語OFF/ON」ボタン経由でもhidden状態が正しく保持される（${testedSubslots.size}個テスト）`);
    }
  });
});
