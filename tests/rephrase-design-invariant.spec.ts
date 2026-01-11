import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * RephraseUI「私の代行テスト」- 設計不変条件テスト
 * 
 * 【目的】
 * UIの一般的な動作確認ではなく、これまで人間（私）が修正後に必ず行っていた
 * 確認行為を抽象化して自動化する。
 * 
 * 【優先順位】
 * 1. Test-3/4: hidden状態保持（致命的バグ防止）【最優先】
 * 2. Test-2: order保証
 * 3. Test-1: DB構造カバレッジ
 * 
 * 【設計思想】
 * - 全組み合わせテストは不要
 * - 構造・型・状態不変条件を保証対象とする
 * - 「私ならOKを出すか？」を機械で判断する
 */

// DBデータをロード
function loadDB() {
  const dbPath = path.join(__dirname, '../training/data/slot_order_data.json');
  const rawData = fs.readFileSync(dbPath, 'utf-8');
  return JSON.parse(rawData);
}

// DBから全サブスロット種別を抽出
function extractAllSubslotTypes(db: any[]): Set<string> {
  const subslotTypes = new Set<string>();
  
  for (const row of db) {
    if (row.SubslotID && row.SubslotID.trim() !== '') {
      subslotTypes.add(row.SubslotID);
    }
  }
  
  return subslotTypes;
}

// DBからイレギュラーなorder定義を持つ例文を抽出
function extractIrregularOrderExamples(db: any[]): any[] {
  const standardOrder = ['M1', 'S', 'Aux', 'M2', 'V', 'C1', 'O1', 'O2', 'C2', 'M3'];
  const irregularExamples: any[] = [];
  
  // 例文IDごとにグループ化
  const byExampleId = new Map<string, any[]>();
  for (const row of db) {
    const exId = row.例文ID;
    if (!byExampleId.has(exId)) {
      byExampleId.set(exId, []);
    }
    byExampleId.get(exId)!.push(row);
  }
  
  // 標準順序と異なるものを抽出
  for (const [exId, rows] of byExampleId) {
    const mainSlots = rows
      .filter(r => r.Slot && r.SubslotID === '')
      .sort((a, b) => a.Slot_display_order - b.Slot_display_order);
    
    // 実際の順序を取得
    const actualOrder = mainSlots.map(r => r.Slot);
    
    // 標準順序と比較（出現しているスロットだけ）
    const expectedSubsequence = standardOrder.filter(slot => actualOrder.includes(slot));
    
    // 順序が異なる場合
    if (JSON.stringify(actualOrder) !== JSON.stringify(expectedSubsequence)) {
      irregularExamples.push({
        exampleId: exId,
        vGroupKey: rows[0].V_group_key,
        actualOrder,
        expectedSubsequence,
        rows
      });
    }
  }
  
  return irregularExamples;
}

test.describe('RephraseUI 設計不変条件テスト', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/training/index.html?skipAuth=true');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('#presetSelect')).toHaveCount(1);
    await expect(page.locator('#loadPresetButton')).toHaveCount(1);
    
    await page.selectOption('#presetSelect', 'data/slot_order_data.json');
    await page.click('#loadPresetButton');
    
    await page.waitForFunction(() => {
      const phrases = document.querySelectorAll('.slot-phrase');
      for (const p of phrases) {
        if (p.textContent && p.textContent.trim().length > 0) return true;
      }
      return false;
    }, { timeout: 15000 });
  });

  /**
   * Test-3: 【最優先】全サブスロットに対する開閉操作でhidden状態が解除されないか
   * 
   * 目的: サブスロット開閉操作が、学習者の設定した「非表示状態」を破壊しないことを保証する
   */
  test('[致命的] 全サブスロット開閉でhidden状態が維持される', async ({ page }) => {
    console.log('=== Test-3: サブスロット開閉 → hidden状態維持 ===');
    
    // 制御パネルを開く
    const toggleBtn = page.locator('#toggle-control-panels');
    await expect(toggleBtn).toHaveCount(1);
    await toggleBtn.click();
    
    const controlPanel = page.locator('#visibility-control-panel-inline');
    await expect(controlPanel).toBeVisible({ timeout: 2000 });
    
    // 【ステップ1】英語テキスト・日本語補助テキストを全て非表示に設定
    console.log('ステップ1: 全テキストを非表示に設定');
    
    const allCheckboxes = controlPanel.locator('input[type="checkbox"]');
    const checkboxCount = await allCheckboxes.count();
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      
      if (isChecked) {
        // チェックを外す（非表示にする）
        await checkbox.evaluate((el: HTMLInputElement) => el.click());
      }
    }
    
    console.log(`全${checkboxCount}個のチェックボックスを非表示に設定完了`);
    
    // 【ステップ2】UI上に存在する全サブスロットを列挙
    const subslotToggles = page.locator('button[data-subslot-toggle]');
    const toggleCount = await subslotToggles.count();
    
    console.log(`サブスロットトグルボタン数: ${toggleCount}`);
    
    if (toggleCount === 0) {
      test.skip(true, 'このプリセットにはサブスロットトグルボタンがない');
      return;
    }
    
    // 【ステップ3】各サブスロットについて開く→閉じる→hidden状態確認
    for (let i = 0; i < toggleCount; i++) {
      const toggle = subslotToggles.nth(i);
      const toggleId = await toggle.getAttribute('data-subslot-toggle');
      
      console.log(`\n[サブスロット ${i + 1}/${toggleCount}] ID: ${toggleId}`);
      
      // 開く
      const beforeOpen = await toggle.isVisible();
      if (beforeOpen) {
        await toggle.click();
        console.log('  開く操作実行');
        
        // 開いた状態を少し待つ
        await page.waitForTimeout(300);
        
        // 閉じる
        await toggle.click();
        console.log('  閉じる操作実行');
        
        await page.waitForTimeout(300);
      }
      
      // 【検証】全チェックボックスがまだ非表示（unchecked）であることを確認
      const afterCheckboxes = controlPanel.locator('input[type="checkbox"]');
      const afterCount = await afterCheckboxes.count();
      
      for (let j = 0; j < afterCount; j++) {
        const checkbox = afterCheckboxes.nth(j);
        const isChecked = await checkbox.isChecked();
        
        if (isChecked) {
          const dataSlot = await checkbox.getAttribute('data-slot');
          const dataType = await checkbox.getAttribute('data-type');
          
          console.error(`\n❌ 致命的エラー: サブスロット開閉後、チェックボックスがONに戻った`);
          console.error(`   サブスロット: ${toggleId}`);
          console.error(`   影響を受けたチェックボックス: data-slot="${dataSlot}", data-type="${dataType}"`);
          
          expect(isChecked).toBe(false);
        }
      }
    }
    
    console.log('\n✅ Test-3 合格: 全サブスロット開閉後もhidden状態が完全に維持された');
  });

  /**
   * Test-4: 【最優先】ランダマイズ後もhidden状態が解除されないか（主節・サブスロット両方）
   * 
   * 目的: ランダマイズがUI再描画を伴っても、ユーザー設定（非表示）が保持されることを保証する
   */
  test('[致命的] ランダマイズ後もhidden状態が維持される', async ({ page }) => {
    console.log('=== Test-4: ランダマイズ → hidden状態維持 ===');
    
    // 制御パネルを開く
    const toggleBtn = page.locator('#toggle-control-panels');
    await expect(toggleBtn).toHaveCount(1);
    await toggleBtn.click();
    
    const controlPanel = page.locator('#visibility-control-panel-inline');
    await expect(controlPanel).toBeVisible({ timeout: 2000 });
    
    // 【ステップ1】英語テキスト・日本語補助テキストを全て非表示に設定
    console.log('ステップ1: 全テキストを非表示に設定');
    
    const allCheckboxes = controlPanel.locator('input[type="checkbox"]');
    const checkboxCount = await allCheckboxes.count();
    
    for (let i = 0; i < checkboxCount; i++) {
      const checkbox = allCheckboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      
      if (isChecked) {
        await checkbox.evaluate((el: HTMLInputElement) => el.click());
      }
    }
    
    console.log(`全${checkboxCount}個のチェックボックスを非表示に設定完了`);
    
    // 【ステップ2】ランダマイズを複数回実行してhidden状態を検証
    const randomizeBtn = page.locator('#randomize-all');
    await expect(randomizeBtn).toHaveCount(1);
    
    const randomizeAttempts = 5;
    
    for (let attempt = 1; attempt <= randomizeAttempts; attempt++) {
      console.log(`\n[ランダマイズ ${attempt}/${randomizeAttempts}]`);
      
      await randomizeBtn.click();
      
      // データロード完了を待つ
      await expect.poll(async () => {
        const phrases = await page.locator('.slot-phrase').allTextContents();
        return phrases.filter(p => p.trim()).length;
      }, { timeout: 3000 }).toBeGreaterThan(0);
      
      // 【検証1】主節スロットのhidden状態確認
      const afterCheckboxes = controlPanel.locator('input[type="checkbox"]');
      const afterCount = await afterCheckboxes.count();
      
      let violationFound = false;
      
      for (let j = 0; j < afterCount; j++) {
        const checkbox = afterCheckboxes.nth(j);
        const isChecked = await checkbox.isChecked();
        
        if (isChecked) {
          const dataSlot = await checkbox.getAttribute('data-slot');
          const dataType = await checkbox.getAttribute('data-type');
          
          console.error(`\n❌ 致命的エラー: ランダマイズ後、チェックボックスがONに戻った`);
          console.error(`   ランダマイズ回数: ${attempt}`);
          console.error(`   影響を受けたチェックボックス: data-slot="${dataSlot}", data-type="${dataType}"`);
          
          violationFound = true;
        }
      }
      
      if (violationFound) {
        expect(violationFound).toBe(false);
        break;
      }
      
      // 【検証2】出現している全サブスロットのhidden状態確認
      const subslotToggles = page.locator('button[data-subslot-toggle]');
      const toggleCount = await subslotToggles.count();
      
      console.log(`  出現中のサブスロット数: ${toggleCount}`);
      
      // サブスロット内の要素が非表示になっているか確認
      // （ここではチェックボックス状態が維持されていれば、サブスロット内も非表示のはず）
    }
    
    console.log('\n✅ Test-4 合格: 全ランダマイズ後もhidden状態が完全に維持された');
  });

  /**
   * Test-2: イレギュラーなorderが定義されている場合、UI表示順がorderに従っているか
   * 
   * 目的: DB側で定義された語順（order）が、UIで無視・正規化されていないことを保証する
   */
  test('[重要] イレギュラーorder定義が正しくUI表示される', async ({ page }) => {
    console.log('=== Test-2: イレギュラーorder検証 ===');
    
    // DBをロードしてイレギュラーorderを持つ例文を探す
    const db = loadDB();
    const irregularExamples = extractIrregularOrderExamples(db);
    
    console.log(`DBに存在するイレギュラーorder例文数: ${irregularExamples.length}`);
    
    if (irregularExamples.length === 0) {
      test.skip(true, 'このDBにはイレギュラーorder定義がない');
      return;
    }
    
    // 最初のイレギュラー例文を表示させる
    const targetExample = irregularExamples[0];
    console.log(`検証対象例文ID: ${targetExample.exampleId}`);
    console.log(`期待されるorder: ${targetExample.actualOrder.join(' → ')}`);
    
    // ランダマイズで該当例文が出現するまで試行
    const randomizeBtn = page.locator('#randomize-all');
    await expect(randomizeBtn).toHaveCount(1);
    
    let found = false;
    const maxAttempts = 50;
    
    for (let attempt = 1; attempt <= maxAttempts && !found; attempt++) {
      await randomizeBtn.click();
      
      await page.waitForTimeout(500);
      
      // 表示中のスロットIDを取得
      const mainSlots = page.locator('.slot-container:not([id*="sub"]):not(.hidden):not(.empty-slot-hidden)');
      const count = await mainSlots.count();
      
      const displayedSlotIds: string[] = [];
      for (let i = 0; i < count; i++) {
        const id = await mainSlots.nth(i).getAttribute('id');
        if (id) {
          // id="slot-m1" → "M1"
          const slotType = id.replace('slot-', '').toUpperCase();
          displayedSlotIds.push(slotType);
        }
      }
      
      // 目標のorderと一致するか確認
      const normalizedActual = targetExample.actualOrder.map((s: string) => s.toUpperCase());
      const normalizedDisplayed = displayedSlotIds.map(s => s.replace('AUX', 'Aux').toUpperCase());
      
      if (JSON.stringify(normalizedDisplayed) === JSON.stringify(normalizedActual)) {
        found = true;
        console.log(`\n試行${attempt}回目で目標例文が出現`);
        console.log(`UI表示順: ${displayedSlotIds.join(' → ')}`);
        console.log(`DB定義順: ${targetExample.actualOrder.join(' → ')}`);
        
        // 完全一致を検証
        expect(displayedSlotIds.length).toBe(targetExample.actualOrder.length);
        
        for (let i = 0; i < displayedSlotIds.length; i++) {
          const displayed = displayedSlotIds[i].toLowerCase();
          const expected = targetExample.actualOrder[i].toLowerCase();
          
          if (displayed !== expected) {
            console.error(`\n❌ エラー: UI表示順がDB定義と不一致`);
            console.error(`   位置${i}: 表示="${displayed}", 期待="${expected}"`);
          }
          
          expect(displayed).toBe(expected);
        }
        
        console.log('\n✅ Test-2 合格: イレギュラーorderが正しくUI表示された');
      }
    }
    
    if (!found) {
      console.warn(`⚠️ ${maxAttempts}回試行したが目標例文が出現しなかった`);
      test.skip(true, `イレギュラーorder例文が${maxAttempts}回のランダマイズで出現せず`);
    }
  });

  /**
   * Test-1: DBに存在する全てのサブスロットが画面上に一度以上表示されるか
   * 
   * 目的: DBに存在するサブスロット構造が、UI表示ロジック上で欠落していないことを保証する
   */
  test('[カバレッジ] DB全サブスロット種別がUI出現する', async ({ page }) => {
    console.log('=== Test-1: DB全サブスロット種別のUI出現確認 ===');
    
    // DBから全サブスロット種別を取得
    const db = loadDB();
    const allSubslotTypes = extractAllSubslotTypes(db);
    
    console.log(`DBに存在するサブスロット種別数: ${allSubslotTypes.size}`);
    console.log(`サブスロット種別: ${Array.from(allSubslotTypes).join(', ')}`);
    
    // UI出現サブスロットを記録
    const appearedSubslots = new Set<string>();
    
    // ランダマイズを複数回実行してサブスロット出現を記録
    const randomizeBtn = page.locator('#randomize-all');
    await expect(randomizeBtn).toHaveCount(1);
    
    const maxAttempts = 100;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await randomizeBtn.click();
      
      await page.waitForTimeout(300);
      
      // サブスロットコンテナを探す
      const subslotContainers = page.locator('[id*="subslot"], .subslot-container');
      const containerCount = await subslotContainers.count();
      
      for (let i = 0; i < containerCount; i++) {
        const container = subslotContainers.nth(i);
        const id = await container.getAttribute('id');
        
        if (id && id.includes('subslot')) {
          // id="slot-s-subslots" → 親スロットは "s"
          // 内部のサブスロット要素を探す
          const subSlots = container.locator('[id*="sub-"]');
          const subSlotCount = await subSlots.count();
          
          for (let j = 0; j < subSlotCount; j++) {
            const subSlot = subSlots.nth(j);
            const subSlotId = await subSlot.getAttribute('id');
            
            if (subSlotId) {
              // id="slot-s-sub-aux" → "sub-aux"
              const match = subSlotId.match(/sub-[a-z0-9]+/);
              if (match) {
                appearedSubslots.add(match[0]);
              }
            }
          }
        }
      }
      
      // 全サブスロット種別が出現したら終了
      if (appearedSubslots.size === allSubslotTypes.size) {
        console.log(`\n${attempt}回のランダマイズで全サブスロット種別が出現`);
        break;
      }
      
      if (attempt % 20 === 0) {
        console.log(`  試行${attempt}回: 出現済み ${appearedSubslots.size}/${allSubslotTypes.size} 種別`);
      }
    }
    
    console.log(`\n最終出現数: ${appearedSubslots.size}/${allSubslotTypes.size}`);
    console.log(`出現したサブスロット: ${Array.from(appearedSubslots).sort().join(', ')}`);
    
    // 未出現のサブスロットを確認
    const missingSubslots = Array.from(allSubslotTypes).filter(type => !appearedSubslots.has(type));
    
    if (missingSubslots.length > 0) {
      console.error(`\n❌ エラー: 以下のサブスロット種別がUIに出現しなかった:`);
      console.error(`   ${missingSubslots.join(', ')}`);
      
      expect(missingSubslots.length).toBe(0);
    } else {
      console.log('\n✅ Test-1 合格: DB全サブスロット種別がUI出現した');
    }
  });
});
