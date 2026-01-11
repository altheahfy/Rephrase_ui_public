/**
 * 音声学習進捗表示UI
 * 学習者の上達度を視覚的に表示する
 */
class VoiceProgressUI {
    constructor() {
        this.progressTracker = window.voiceProgressTracker;
        this.isVisible = false;
        this.currentPeriod = 'week';
        
        // グローバルインスタンスとして登録
        window.currentProgressUI = this;
        
        // 初期化のタイミングをずらす
        if (this.progressTracker) {
            this.init();
        } else {
            // ProgressTrackerが読み込まれるまで待つ
            setTimeout(() => {
                this.progressTracker = window.voiceProgressTracker;
                if (this.progressTracker) {
                    this.init();
                } else {
                    console.error('❌ VoiceProgressTrackerが見つかりません');
                }
            }, 1000);
        }
    }
    
    /**
     * 初期化
     */
    init() {
        this.createProgressPanel();
        this.setupEventListeners();
        console.log('✅ 音声進捗表示UI初期化完了');
    }
    
    /**
     * 進捗パネルを作成
     */
    createProgressPanel() {
        // 既存のパネルがあれば削除
        const existingPanel = document.getElementById('voice-progress-panel');
        if (existingPanel) {
            existingPanel.remove();
        }
        
        const panel = document.createElement('div');
        panel.id = 'voice-progress-panel';
        panel.className = 'voice-progress-panel';
        panel.style.display = 'none';
        
        panel.innerHTML = `
            <div class="progress-panel-header">
                <h3>📊 音声学習進捗</h3>
                <button id="progress-close-btn" class="close-btn">×</button>
            </div>
            
            <div class="progress-panel-content">
                <!-- 期間選択タブ -->
                <div class="period-tabs">
                    <button class="period-tab active" data-period="week">1週間</button>
                    <button class="period-tab" data-period="month">1ヶ月</button>
                    <button class="period-tab" data-period="quarter">3ヶ月</button>
                    <button class="period-tab" data-period="year">1年</button>
                </div>
                
                <!-- メイン統計表示 -->
                <div class="progress-stats-container">
                    <div class="progress-loading">📊 データを読み込み中...</div>
                    <div class="progress-stats" style="display: none;">
                        <!-- 基本統計 -->
                        <div class="stats-row">
                            <div class="stat-card">
                                <div class="stat-label">練習回数</div>
                                <div class="stat-value" id="total-sessions">-</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">平均レベル</div>
                                <div class="stat-value" id="average-level">-</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-label">上達度</div>
                                <div class="stat-value" id="improvement">-</div>
                            </div>
                        </div>
                        
                        <!-- レベル分布 -->
                        <div class="level-distribution">
                            <h4>📈 レベル分布</h4>
                            <div class="level-bars">
                                <div class="level-bar">
                                    <span class="level-label">🐌 初心者</span>
                                    <div class="bar-container">
                                        <div class="bar beginner" id="bar-beginner"></div>
                                        <span class="bar-value" id="count-beginner">0</span>
                                    </div>
                                </div>
                                <div class="level-bar">
                                    <span class="level-label">📈 中級者</span>
                                    <div class="bar-container">
                                        <div class="bar intermediate" id="bar-intermediate"></div>
                                        <span class="bar-value" id="count-intermediate">0</span>
                                    </div>
                                </div>
                                <div class="level-bar">
                                    <span class="level-label">🚀 上級者</span>
                                    <div class="bar-container">
                                        <div class="bar advanced" id="bar-advanced"></div>
                                        <span class="bar-value" id="count-advanced">0</span>
                                    </div>
                                </div>
                                <div class="level-bar">
                                    <span class="level-label">⚡ 達人</span>
                                    <div class="bar-container">
                                        <div class="bar expert" id="bar-expert"></div>
                                        <span class="bar-value" id="count-expert">0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 進捗チャート -->
                        <div class="progress-chart-container">
                            <h4>📉 進捗推移</h4>
                            <canvas id="progress-chart" width="400" height="150"></canvas>
                        </div>
                        
                        <!-- 最高記録 -->
                        <div class="best-performance">
                            <h4>🏆 最高記録</h4>
                            <div id="best-day-info">データなし</div>
                        </div>
                        
                        <!-- データ管理 -->
                        <div class="data-management">
                            <h4>🔧 データ管理</h4>
                            <div class="data-buttons">
                                <button id="export-data-btn" class="secondary-btn">📥 ダウンロード</button>
                                <button id="import-data-btn" class="secondary-btn">📤 アップロード</button>
                            </div>
                            <input type="file" id="import-data-input" accept=".json" style="display: none;">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // パネル作成後にイベントリスナーを設定
        this.setupEventListeners();
    }
    
    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // 閉じるボタン
        const closeBtn = document.getElementById('progress-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideProgressPanel();
            });
        }
        
        // パネル外をクリック/タップで閉じる（モバイル対応）
        const panel = document.getElementById('voice-progress-panel');
        if (panel) {
            panel.addEventListener('click', (e) => {
                // パネル自体がクリックされた場合は閉じる
                if (e.target === panel) {
                    this.hideProgressPanel();
                }
            });
        }
        
        // 期間選択タブ
        const periodTabs = document.querySelectorAll('.period-tab');
        periodTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const period = e.target.dataset.period;
                this.selectPeriod(period);
            });
        });
        
        // データエクスポートボタン
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
        
        // データインポートボタン
        const importBtn = document.getElementById('import-data-btn');
        const importInput = document.getElementById('import-data-input');
        
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => {
                importInput.click();
            });
            
            importInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    this.importData(file);
                }
            });
        }
    }
    
    /**
     * 進捗パネルを表示
     */
    async showProgressPanel() {
        console.log('📊 showProgressPanel() が呼び出されました');
        let panel = document.getElementById('voice-progress-panel');
        console.log('🔍 パネル要素:', panel);
        
        // パネルが存在しない場合は作成
        if (!panel) {
            console.log('⚠️ パネルが存在しないため新規作成します');
            this.createProgressPanel();
            panel = document.getElementById('voice-progress-panel');
            console.log('🔍 作成後のパネル要素:', panel);
        }
        
        if (panel) {
            console.log('✅ パネル要素が見つかりました - 表示します');
            
            panel.style.display = 'block';
            this.isVisible = true;
            
            // Escキーで閉じる機能を追加
            this.handleKeyPress = (e) => {
                if (e.key === 'Escape' && this.isVisible) {
                    this.hideProgressPanel();
                }
            };
            document.addEventListener('keydown', this.handleKeyPress);
            
            // データを読み込んで表示
            await this.loadAndDisplayProgress();
        } else {
            console.error('❌ パネル要素の作成に失敗しました');
        }
    }
    
    /**
     * 進捗パネルを非表示
     */
    hideProgressPanel() {
        const panel = document.getElementById('voice-progress-panel');
        
        if (panel) {
            panel.style.display = 'none';
        }
        
        this.isVisible = false;
        
        // Escキーイベントリスナーを削除
        if (this.handleKeyPress) {
            document.removeEventListener('keydown', this.handleKeyPress);
            this.handleKeyPress = null;
        }
    }
    
    /**
     * 期間を選択
     */
    async selectPeriod(period) {
        this.currentPeriod = period;
        
        // タブの見た目を更新
        document.querySelectorAll('.period-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        // データを再読み込み
        await this.loadAndDisplayProgress();
    }
    
    /**
     * 進捗データを読み込んで表示
     */
    async loadAndDisplayProgress() {
        console.log('🎯 loadAndDisplayProgress開始');
        console.log('📊 progressTracker:', this.progressTracker);
        console.log('📊 progressTracker.db:', this.progressTracker?.db);
        
        if (!this.progressTracker) {
            console.error('❌ progressTrackerが見つかりません');
            this.displayError('進捗追跡システムが初期化されていません');
            return;
        }
        
        if (!this.progressTracker.db) {
            console.error('❌ データベースが初期化されていません');
            this.displayError('データベースが初期化されていません');
            return;
        }
        
        try {
            console.log('✅ ローディング表示開始');
            // ローディング表示
            this.showLoading(true);
            
            console.log('📊 データ取得開始 - 期間:', this.currentPeriod);
            // データ取得
            const progressData = await this.progressTracker.getProgressData(this.currentPeriod);
            console.log('📊 取得したデータ:', progressData);
            
            if (progressData) {
                console.log('✅ データ表示処理開始');
                this.displayProgressData(progressData);
            } else {
                console.log('⚠️ データなし - NoData表示');
                this.displayNoData();
            }
            
        } catch (error) {
            console.error('❌ 進捗データ表示エラー:', error);
            console.error('❌ エラースタック:', error.stack);
            this.displayError(error.message);
        } finally {
            console.log('🏁 ローディング非表示');
            this.showLoading(false);
        }
    }
    
    /**
     * ローディング表示を切り替え
     */
    showLoading(show) {
        console.log(`🔄 showLoading(${show}) 開始`);
        const loading = document.querySelector('.progress-loading');
        const stats = document.querySelector('.progress-stats');
        
        console.log('🔍 loading要素:', loading);
        console.log('🔍 stats要素:', stats);
        
        if (loading && stats) {
            loading.style.display = show ? 'block' : 'none';
            stats.style.display = show ? 'none' : 'block';
            console.log(`✅ ローディング${show ? '表示' : '非表示'}完了`);
        } else {
            console.error('❌ ローディング要素またはstats要素が見つかりません');
            if (!loading) console.error('❌ .progress-loading が見つかりません');
            if (!stats) console.error('❌ .progress-stats が見つかりません');
        }
    }
    
    /**
     * 進捗データを表示
     */
    displayProgressData(data) {
        console.log('📊 進捗データ表示:', data);
        
        // 基本統計
        document.getElementById('total-sessions').textContent = data.totalSessions;
        document.getElementById('average-level').textContent = this.formatLevel(data.averageLevel);
        document.getElementById('improvement').textContent = this.formatImprovement(data.improvement);
        
        // レベル分布
        this.displayLevelDistribution(data.levelDistribution, data.totalSessions);
        
        // チャート
        this.displayChart(data.chartData);
        
        // 最高記録
        this.displayBestDay(data.bestDay);
    }
    
    /**
     * レベル値をフォーマット
     */
    formatLevel(level) {
        if (level === 0) return 'データなし';
        if (level < 1) return '要練習';
        if (level < 2) return '🐌 初心者';
        if (level < 3) return '📈 中級者';
        if (level < 4) return '🚀 上級者';
        return '⚡ 達人';
    }
    
    /**
     * 上達度をフォーマット
     */
    formatImprovement(improvement) {
        if (improvement === 0) return 'データ不足';
        const sign = improvement > 0 ? '+' : '';
        return `${sign}${improvement.toFixed(1)}%`;
    }
    
    /**
     * レベル分布を表示
     */
    displayLevelDistribution(distribution, total) {
        const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
        
        levels.forEach(level => {
            const count = distribution[level] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            const bar = document.getElementById(`bar-${level}`);
            const countElement = document.getElementById(`count-${level}`);
            
            if (bar && countElement) {
                bar.style.width = `${percentage}%`;
                countElement.textContent = count;
            }
        });
    }
    
    /**
     * 進捗チャートを表示
     */
    displayChart(chartData) {
        const canvas = document.getElementById('progress-chart');
        if (!canvas || !chartData || chartData.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // キャンバスをクリア
        ctx.clearRect(0, 0, width, height);
        
        // データ準備
        const maxLevel = 4;
        const margin = 40;
        const chartWidth = width - margin * 2;
        const chartHeight = height - margin * 2;
        
        // 軸を描画
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        
        // Y軸
        ctx.beginPath();
        ctx.moveTo(margin, margin);
        ctx.lineTo(margin, height - margin);
        ctx.stroke();
        
        // X軸
        ctx.beginPath();
        ctx.moveTo(margin, height - margin);
        ctx.lineTo(width - margin, height - margin);
        ctx.stroke();
        
        // データ点を描画
        if (chartData.length > 1) {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            chartData.forEach((point, index) => {
                const x = margin + (index / (chartData.length - 1)) * chartWidth;
                const y = height - margin - (point.averageLevel / maxLevel) * chartHeight;
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
            
            // データ点を丸で表示
            ctx.fillStyle = '#2196F3';
            chartData.forEach((point, index) => {
                const x = margin + (index / (chartData.length - 1)) * chartWidth;
                const y = height - margin - (point.averageLevel / maxLevel) * chartHeight;
                
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
        
        // ラベル
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('時間経過', width / 2, height - 10);
        
        ctx.save();
        ctx.translate(15, height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText('レベル', 0, 0);
        ctx.restore();
    }
    
    /**
     * 最高記録を表示
     */
    displayBestDay(bestDay) {
        const element = document.getElementById('best-day-info');
        if (!element) return;
        
        if (!bestDay) {
            element.innerHTML = 'まだ記録がありません';
            return;
        }
        
        const date = new Date(bestDay.date).toLocaleDateString('ja-JP');
        const level = this.formatLevel(bestDay.averageLevel);
        
        element.innerHTML = `
            <div class="best-day-card">
                <div class="best-day-date">📅 ${date}</div>
                <div class="best-day-level">🎯 ${level}</div>
                <div class="best-day-sessions">🔄 ${bestDay.sessionCount}回練習</div>
            </div>
        `;
    }
    
    /**
     * データなし表示
     */
    displayNoData() {
        const statsContainer = document.querySelector('.progress-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="no-data">
                    <h3>📊 データがありません</h3>
                    <p>音声練習を開始すると進捗が表示されます</p>
                </div>
            `;
        }
    }
    
    /**
     * エラー表示
     */
    displayError(message) {
        const statsContainer = document.querySelector('.progress-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="error-message">
                    <h3>❌ エラー</h3>
                    <p>${message}</p>
                </div>
            `;
        }
    }
    
    /**
     * データをエクスポート
     */
    async exportData() {
        try {
            console.log('📥 データエクスポート開始');
            
            if (!this.progressTracker) {
                throw new Error('進捗追跡システムが初期化されていません');
            }
            
            const data = await this.progressTracker.getAllData();
            console.log('📊 取得されたデータ:', data);
            
            const jsonData = JSON.stringify(data, null, 2);
            console.log('📄 JSON文字列長:', jsonData.length);
            
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const filename = `voice_progress_${new Date().toISOString().split('T')[0]}.json`;
            
            // 複数の方法でダウンロードを試行
            if (this.downloadUsingClick(url, filename)) {
                console.log('✅ クリック方式でダウンロード開始');
            } else if (this.downloadUsingLocation(url, filename)) {
                console.log('✅ Location方式でダウンロード開始');
            } else {
                // 最後の手段：テキストエリアにデータを表示
                this.showDataInTextArea(jsonData);
            }
            
            // リソースをクリーンアップ
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 1000);
            
            console.log('✅ データエクスポート完了');
            
        } catch (error) {
            console.error('❌ データエクスポート失敗:', error);
            alert('❌ データエクスポートに失敗しました: ' + error.message);
        }
    }
    
    /**
     * クリック方式でダウンロード
     */
    downloadUsingClick(url, filename) {
        try {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            
            // ユーザーのクリックをシミュレート
            a.click();
            
            setTimeout(() => {
                if (document.body.contains(a)) {
                    document.body.removeChild(a);
                }
            }, 100);
            
            return true;
        } catch (error) {
            console.error('クリック方式失敗:', error);
            return false;
        }
    }
    
    /**
     * Location方式でダウンロード
     */
    downloadUsingLocation(url, filename) {
        try {
            // 新しいウィンドウで開く
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
                newWindow.document.title = filename;
                return true;
            }
            return false;
        } catch (error) {
            console.error('Location方式失敗:', error);
            return false;
        }
    }
    
    /**
     * テキストエリアにデータを表示（最後の手段）
     */
    showDataInTextArea(jsonData) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 20000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
        `;
        
        content.innerHTML = `
            <h3>📥 学習データ</h3>
            <p>ブラウザのダウンロードが制限されています。<br>
            以下のデータをコピーして、テキストファイルとして保存してください。</p>
            <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px;">${jsonData}</textarea>
            <br><br>
            <button onclick="this.parentElement.parentElement.remove()">閉じる</button>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // テキストエリアの内容を選択
        const textarea = content.querySelector('textarea');
        textarea.select();
        
        console.log('📄 テキストエリアにデータを表示');
    }
    
    /**
     * データをインポート
     */
    async importData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.sessions || !data.dailyStats) {
                throw new Error('無効なデータ形式です');
            }
            
            if (confirm(`${data.sessions.length}個のセッションデータを復元しますか？\n現在のデータは上書きされます。`)) {
                await this.progressTracker.importData(data);
                alert('✅ データの復元が完了しました');
                
                // 表示を更新
                await this.loadAndDisplayProgress();
            }
            
        } catch (error) {
            console.error('データインポートエラー:', error);
            alert('❌ データの復元に失敗しました: ' + error.message);
        }
    }
}

// グローバルインスタンス
window.voiceProgressUI = new VoiceProgressUI();
