/**
 * Rephrase 動的文法説明ページ生成システム v1.0
 * 既存デザインシステム準拠・統一テンプレート使用
 */

class GrammarPageGenerator {
  constructor() {
    this.templatePath = './template.html';
    this.metadataPath = './grammar-metadata.json';
  }

  /**
   * テンプレートファイル読み込み
   */
  async loadTemplate() {
    try {
      const response = await fetch(this.templatePath);
      return await response.text();
    } catch (error) {
      console.error('テンプレート読み込みエラー:', error);
      return null;
    }
  }

  /**
   * メタデータファイル読み込み
   */
  async loadMetadata() {
    try {
      const response = await fetch(this.metadataPath);
      return await response.json();
    } catch (error) {
      console.error('メタデータ読み込みエラー:', error);
      return null;
    }
  }

  /**
   * コンテンツセクション生成
   */
  generateContentSection(section) {
    let html = `<section class="content-section">`;
    
    if (section.title) {
      html += `<h2>${section.title}</h2>`;
    }

    section.content.forEach(item => {
      switch (item.type) {
        case 'paragraph':
          html += `<p>${item.text}</p>`;
          break;
        
        case 'key-point':
          html += `
            <div class="key-point">
              <h4>${item.title}</h4>
              <p>${item.content}</p>
            </div>`;
          break;
        
        case 'example-box':
          html += `
            <div class="example-box">
              <h4>${item.title}</h4>`;
          
          if (item.examples) {
            item.examples.forEach(example => {
              html += `<div class="example-sentence">${example}</div>`;
            });
          }
          
          if (item.content) {
            html += `<p>${item.content}</p>`;
          }
          
          html += `</div>`;
          break;
        
        case 'warning-box':
          html += `
            <div class="warning-box">
              <h4>${item.title}</h4>
              <p>${item.content}</p>
            </div>`;
          break;

        case 'heading3':
          html += `<h3>${item.text}</h3>`;
          break;

        case 'list':
          html += '<ul>';
          item.items.forEach(listItem => {
            html += `<li>${listItem}</li>`;
          });
          html += '</ul>';
          break;
      }
    });

    html += '</section>';
    return html;
  }

  /**
   * 単一ページ生成
   */
  generatePage(template, grammarData) {
    let content = '';
    
    // コンテンツセクション生成
    if (grammarData.content && grammarData.content.sections) {
      grammarData.content.sections.forEach(section => {
        content += this.generateContentSection(section);
      });
    }

    // テンプレート変数置換
    let html = template
      .replace(/\{\{displayName\}\}/g, grammarData.displayName)
      .replace(/\{\{description\}\}/g, grammarData.description)
      .replace(/\{\{grammarKey\}\}/g, grammarData.grammarKey)
      .replace(/\{\{content\}\}/g, content);

    return html;
  }

  /**
   * 全ページ生成
   */
  async generateAllPages() {
    console.log('🚀 動的ページ生成開始...');
    
    const template = await this.loadTemplate();
    const metadata = await this.loadMetadata();
    
    if (!template || !metadata) {
      console.error('❌ 必要なファイルの読み込みに失敗しました');
      return;
    }

    const results = [];
    
    Object.entries(metadata).forEach(([key, grammarData]) => {
      try {
        const html = this.generatePage(template, grammarData);
        results.push({
          key: key,
          filename: `${grammarData.filename}.html`,
          displayName: grammarData.displayName,
          html: html,
          success: true
        });
        
        console.log(`✅ ${grammarData.displayName} ページ生成完了`);
      } catch (error) {
        console.error(`❌ ${grammarData.displayName} 生成エラー:`, error);
        results.push({
          key: key,
          filename: `${grammarData.filename}.html`,
          displayName: grammarData.displayName,
          error: error.message,
          success: false
        });
      }
    });

    return results;
  }

  /**
   * トレーニングUI用マッピング生成
   */
  async generateGrammarMapping() {
    const metadata = await this.loadMetadata();
    if (!metadata) return null;

    const mapping = {};
    Object.values(metadata).forEach(grammarData => {
      mapping[grammarData.grammarKey] = `data/${grammarData.jsonFile}`;
    });

    console.log('📋 トレーニングUI用マッピング生成完了:', mapping);
    return mapping;
  }

  /**
   * マトリクスリンク情報生成
   */
  async generateMatrixLinks() {
    const metadata = await this.loadMetadata();
    if (!metadata) return null;

    const links = [];
    Object.entries(metadata).forEach(([key, grammarData]) => {
      links.push({
        href: `../explanation/${grammarData.filename}.html`,
        display: grammarData.matrixDisplay,
        category: grammarData.category,
        priority: grammarData.priority,
        displayName: grammarData.displayName
      });
    });

    // 優先度順でソート
    links.sort((a, b) => a.priority - b.priority);
    
    console.log('🔗 マトリクスリンク情報生成完了:', links);
    return links;
  }
}

// 使用例とテスト機能
class GrammarSystemTester {
  constructor() {
    this.generator = new GrammarPageGenerator();
  }

  /**
   * システムテスト実行
   */
  async runTests() {
    console.log('🧪 動的生成システムテスト開始...');
    
    // 1. 全ページ生成テスト
    const pages = await this.generator.generateAllPages();
    console.log('📄 生成されたページ:', pages);

    // 2. マッピング生成テスト
    const mapping = await this.generator.generateGrammarMapping();
    console.log('🔗 生成されたマッピング:', mapping);

    // 3. マトリクスリンク生成テスト
    const links = await this.generator.generateMatrixLinks();
    console.log('📊 生成されたマトリクスリンク:', links);

    return { pages, mapping, links };
  }

  /**
   * ページプレビュー生成
   */
  async previewPage(grammarKey) {
    const template = await this.generator.loadTemplate();
    const metadata = await this.generator.loadMetadata();
    
    if (!template || !metadata || !metadata[grammarKey]) {
      console.error('プレビュー生成失敗');
      return null;
    }

    const html = this.generator.generatePage(template, metadata[grammarKey]);
    
    // プレビュー用Blobを作成
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    console.log(`📖 プレビューURL生成: ${metadata[grammarKey].displayName}`);
    return { url, displayName: metadata[grammarKey].displayName };
  }
}

// グローバル公開
window.GrammarPageGenerator = GrammarPageGenerator;
window.GrammarSystemTester = GrammarSystemTester;

console.log('✅ 動的文法説明ページ生成システム読み込み完了');
console.log('💡 使用方法:');
console.log('  const generator = new GrammarPageGenerator();');
console.log('  const tester = new GrammarSystemTester();');
console.log('  await tester.runTests(); // システムテスト');
