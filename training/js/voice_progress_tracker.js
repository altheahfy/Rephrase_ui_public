/**
 * 音声学習進捗追跡システム
 * 学習者の発話判定データを保存・集計し、上達度を表示する
 */
class VoiceProgressTracker {
    constructor() {
        this.dbName = 'VoiceProgressDB';
        this.dbVersion = 1;
        this.db = null;
        
        // レベル定義
        this.levelMapping = {
            '初心者レベル': 1,
            '中級者レベル': 2,
            '上級者レベル': 3,
            '達人レベル': 4,
            '内容不一致': 0,
            '内容要改善': 0.5,
            '音質不良': 0,
            '音声未検出': 0
        };
        
        this.init();
    }
    
    /**
     * 初期化
     */
    async init() {
        try {
            await this.initDatabase();
            console.log('✅ 音声進捗追跡システム初期化完了');
        } catch (error) {
            console.error('❌ 音声進捗追跡システム初期化失敗:', error);
        }
    }
    
    /**
     * IndexedDBの初期化
     */
    initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => {
                reject(new Error('データベース接続失敗'));
            };
            
            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('✅ データベース接続成功');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // 練習セッションテーブル
                if (!db.objectStoreNames.contains('sessions')) {
                    const sessionStore = db.createObjectStore('sessions', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    
                    sessionStore.createIndex('timestamp', 'timestamp', { unique: false });
                    sessionStore.createIndex('level', 'level', { unique: false });
                    sessionStore.createIndex('date', 'date', { unique: false });
                    sessionStore.createIndex('levelScore', 'levelScore', { unique: false });
                }
                
                // 日別統計テーブル
                if (!db.objectStoreNames.contains('dailyStats')) {
                    const dailyStore = db.createObjectStore('dailyStats', {
                        keyPath: 'date'
                    });
                    
                    dailyStore.createIndex('averageLevel', 'averageLevel', { unique: false });
                    dailyStore.createIndex('sessionCount', 'sessionCount', { unique: false });
                }
                
                console.log('✅ データベーステーブル作成完了');
            };
        });
    }
    
    /**
     * 音声分析結果を保存
     * @param {Object} analysisResult - 音声分析結果
     */
    async saveVoiceSession(analysisResult) {
        if (!this.db) {
            console.error('❌ データベースが初期化されていません');
            return;
        }
        
        try {
            const timestamp = new Date();
            const date = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
            
            // レベルからスコアに変換
            const levelScore = this.convertLevelToScore(analysisResult.level);
            
            // セッションデータ作成
            const sessionData = {
                timestamp: timestamp.toISOString(),
                date: date,
                level: this.cleanLevelText(analysisResult.level),
                levelScore: levelScore,
                duration: analysisResult.duration || 0,
                wordsPerMinute: analysisResult.wordsPerMinute || 0,
                contentAccuracy: analysisResult.contentAccuracy || 0,
                expectedSentence: analysisResult.expectedSentence || '',
                recognizedText: analysisResult.recognizedText || '',
                verificationStatus: analysisResult.verificationStatus || 'unknown'
            };
            
            // セッションを保存
            await this.saveToStore('sessions', sessionData);
            
            // 日別統計を更新
            await this.updateDailyStats(date);
            
            console.log('✅ 音声セッション保存完了:', sessionData);
            
            return sessionData;
            
        } catch (error) {
            console.error('❌ 音声セッション保存失敗:', error);
            throw error;
        }
    }
    
    /**
     * レベルテキストをスコアに変換
     */
    convertLevelToScore(levelText) {
        // 絵文字やその他の記号を除去してクリーンなレベル名を抽出
        const cleanLevel = this.cleanLevelText(levelText);
        
        // 部分マッチでレベルを判定
        if (cleanLevel.includes('達人')) return 4;
        if (cleanLevel.includes('上級者')) return 3;
        if (cleanLevel.includes('中級者')) return 2;
        if (cleanLevel.includes('初心者')) return 1;
        if (cleanLevel.includes('内容不一致') || cleanLevel.includes('音質不良') || cleanLevel.includes('音声未検出')) return 0;
        if (cleanLevel.includes('内容要改善')) return 0.5;
        
        return 0; // デフォルト
    }
    
    /**
     * レベルテキストをクリーンアップ
     */
    cleanLevelText(levelText) {
        if (!levelText) return 'unknown';
        
        // 絵文字と特殊文字を除去
        return levelText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
                       .replace(/[❌⚠️⚡🚀📈🐌]/g, '')
                       .trim();
    }
    
    /**
     * データストアに保存
     */
    saveToStore(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * データストアを更新
     */
    updateStore(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 日別統計を更新
     */
    async updateDailyStats(date) {
        try {
            // その日のセッションを取得
            const sessions = await this.getSessionsByDate(date);
            
            if (sessions.length === 0) return;
            
            // 統計計算
            const validSessions = sessions.filter(s => s.levelScore > 0);
            const averageLevel = validSessions.length > 0 
                ? validSessions.reduce((sum, s) => sum + s.levelScore, 0) / validSessions.length 
                : 0;
            
            const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            const averageWPM = sessions.filter(s => s.wordsPerMinute > 0).length > 0
                ? sessions.filter(s => s.wordsPerMinute > 0).reduce((sum, s) => sum + s.wordsPerMinute, 0) / sessions.filter(s => s.wordsPerMinute > 0).length
                : 0;
            
            const dailyStats = {
                date: date,
                sessionCount: sessions.length,
                validSessionCount: validSessions.length,
                averageLevel: averageLevel,
                totalDuration: totalDuration,
                averageWordsPerMinute: averageWPM,
                lastUpdated: new Date().toISOString()
            };
            
            await this.updateStore('dailyStats', dailyStats);
            console.log(`✅ 日別統計更新完了 (${date}):`, dailyStats);
            
        } catch (error) {
            console.error('❌ 日別統計更新失敗:', error);
        }
    }
    
    /**
     * 指定日付のセッションを取得
     */
    getSessionsByDate(date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const index = store.index('date');
            const request = index.getAll(date);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 期間別の進捗データを取得
     * @param {string} period - 'week', 'month', 'quarter', 'year'
     * @param {Date} endDate - 終了日（デフォルト: 今日）
     */
    async getProgressData(period = 'week', endDate = new Date()) {
        try {
            const startDate = this.calculateStartDate(period, endDate);
            const sessions = await this.getSessionsInRange(startDate, endDate);
            
            return this.calculateProgressMetrics(sessions, period, startDate, endDate);
            
        } catch (error) {
            console.error('❌ 進捗データ取得失敗:', error);
            return null;
        }
    }
    
    /**
     * 期間の開始日を計算
     */
    calculateStartDate(period, endDate) {
        const start = new Date(endDate);
        
        switch (period) {
            case 'week':
                start.setDate(start.getDate() - 7);
                break;
            case 'month':
                start.setMonth(start.getMonth() - 1);
                break;
            case 'quarter':
                start.setMonth(start.getMonth() - 3);
                break;
            case 'year':
                start.setFullYear(start.getFullYear() - 1);
                break;
            default:
                start.setDate(start.getDate() - 7);
        }
        
        return start;
    }
    
    /**
     * 期間内のセッションを取得
     */
    getSessionsInRange(startDate, endDate) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const index = store.index('timestamp');
            
            const range = IDBKeyRange.bound(
                startDate.toISOString(),
                endDate.toISOString()
            );
            
            const request = index.getAll(range);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 進捗メトリクスを計算
     */
    calculateProgressMetrics(sessions, period, startDate, endDate) {
        const validSessions = sessions.filter(s => s.levelScore > 0);
        
        if (sessions.length === 0) {
            return {
                period,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                totalSessions: 0,
                validSessions: 0,
                averageLevel: 0,
                improvement: 0,
                levelDistribution: { beginner: 0, intermediate: 0, advanced: 0, expert: 0 },
                dailyAverage: 0,
                bestDay: null,
                chartData: []
            };
        }
        
        // 基本統計
        const totalSessions = sessions.length;
        const validSessionCount = validSessions.length;
        const averageLevel = validSessionCount > 0 
            ? validSessions.reduce((sum, s) => sum + s.levelScore, 0) / validSessionCount 
            : 0;
        
        // レベル分布
        const levelDistribution = {
            beginner: sessions.filter(s => s.levelScore >= 0.5 && s.levelScore < 1.5).length,
            intermediate: sessions.filter(s => s.levelScore >= 1.5 && s.levelScore < 2.5).length,
            advanced: sessions.filter(s => s.levelScore >= 2.5 && s.levelScore < 3.5).length,
            expert: sessions.filter(s => s.levelScore >= 3.5).length
        };
        
        // 上達度計算（期間前半vs後半の比較）
        const improvement = this.calculateImprovement(validSessions);
        
        // 日別平均
        const dayCount = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const dailyAverage = totalSessions / dayCount;
        
        // 最高パフォーマンス日
        const bestDay = this.findBestDay(sessions);
        
        // チャートデータ
        const chartData = this.generateChartData(sessions, startDate, endDate);
        
        return {
            period,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            totalSessions,
            validSessions: validSessionCount,
            averageLevel,
            improvement,
            levelDistribution,
            dailyAverage,
            bestDay,
            chartData
        };
    }
    
    /**
     * 上達度を計算（期間前半vs後半）
     */
    calculateImprovement(sessions) {
        if (sessions.length < 4) return 0;
        
        const midPoint = Math.floor(sessions.length / 2);
        const firstHalf = sessions.slice(0, midPoint);
        const secondHalf = sessions.slice(midPoint);
        
        const firstAverage = firstHalf.reduce((sum, s) => sum + s.levelScore, 0) / firstHalf.length;
        const secondAverage = secondHalf.reduce((sum, s) => sum + s.levelScore, 0) / secondHalf.length;
        
        return ((secondAverage - firstAverage) / firstAverage) * 100;
    }
    
    /**
     * 最高パフォーマンス日を特定
     */
    findBestDay(sessions) {
        const dailyStats = {};
        
        sessions.forEach(session => {
            const date = session.date;
            if (!dailyStats[date]) {
                dailyStats[date] = { sessions: [], total: 0, average: 0 };
            }
            dailyStats[date].sessions.push(session);
        });
        
        let bestDay = null;
        let bestAverage = 0;
        
        Object.keys(dailyStats).forEach(date => {
            const dayData = dailyStats[date];
            const validSessions = dayData.sessions.filter(s => s.levelScore > 0);
            
            if (validSessions.length > 0) {
                const average = validSessions.reduce((sum, s) => sum + s.levelScore, 0) / validSessions.length;
                
                if (average > bestAverage) {
                    bestAverage = average;
                    bestDay = {
                        date,
                        averageLevel: average,
                        sessionCount: dayData.sessions.length
                    };
                }
            }
        });
        
        return bestDay;
    }
    
    /**
     * チャート用データを生成
     */
    generateChartData(sessions, startDate, endDate) {
        const chartData = [];
        const dailyData = {};
        
        // 日別にグループ化
        sessions.forEach(session => {
            const date = session.date;
            if (!dailyData[date]) {
                dailyData[date] = [];
            }
            dailyData[date].push(session);
        });
        
        // 期間内の全日付について
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const daySessions = dailyData[dateStr] || [];
            const validSessions = daySessions.filter(s => s.levelScore > 0);
            
            const averageLevel = validSessions.length > 0 
                ? validSessions.reduce((sum, s) => sum + s.levelScore, 0) / validSessions.length 
                : 0;
            
            chartData.push({
                date: dateStr,
                averageLevel,
                sessionCount: daySessions.length,
                validSessionCount: validSessions.length
            });
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return chartData;
    }
    
    /**
     * 全データをクリア（開発・テスト用）
     */
    async clearAllData() {
        if (!this.db) return;
        
        try {
            await this.clearStore('sessions');
            await this.clearStore('dailyStats');
            console.log('✅ 全進捗データをクリアしました');
        } catch (error) {
            console.error('❌ データクリア失敗:', error);
        }
    }
    
    /**
     * 全データを取得（エクスポート用）
     */
    async getAllData() {
        if (!this.db) {
            throw new Error('データベースが初期化されていません');
        }
        
        try {
            const sessions = await this.getAllSessions();
            const dailyStats = await this.getAllDailyStats();
            
            return {
                sessions,
                dailyStats,
                exportDate: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('❌ 全データ取得失敗:', error);
            throw error;
        }
    }
    
    /**
     * 全セッションデータを取得
     */
    getAllSessions() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readonly');
            const store = transaction.objectStore('sessions');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 全日別統計データを取得
     */
    getAllDailyStats() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dailyStats'], 'readonly');
            const store = transaction.objectStore('dailyStats');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * データをインポート（復元用）
     */
    async importData(data) {
        if (!this.db) {
            throw new Error('データベースが初期化されていません');
        }
        
        try {
            // 既存データをクリア
            await this.clearAllData();
            
            // セッションデータを復元
            if (data.sessions && data.sessions.length > 0) {
                await this.importSessions(data.sessions);
            }
            
            // 日別統計データを復元
            if (data.dailyStats && data.dailyStats.length > 0) {
                await this.importDailyStats(data.dailyStats);
            }
            
            console.log('✅ データインポート完了');
        } catch (error) {
            console.error('❌ データインポート失敗:', error);
            throw error;
        }
    }
    
    /**
     * セッションデータをインポート
     */
    importSessions(sessions) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['sessions'], 'readwrite');
            const store = transaction.objectStore('sessions');
            
            let completed = 0;
            const total = sessions.length;
            
            sessions.forEach(session => {
                const request = store.add(session);
                
                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
            
            if (total === 0) {
                resolve();
            }
        });
    }
    
    /**
     * 日別統計データをインポート
     */
    importDailyStats(dailyStats) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['dailyStats'], 'readwrite');
            const store = transaction.objectStore('dailyStats');
            
            let completed = 0;
            const total = dailyStats.length;
            
            dailyStats.forEach(stat => {
                const request = store.add(stat);
                
                request.onsuccess = () => {
                    completed++;
                    if (completed === total) {
                        resolve();
                    }
                };
                
                request.onerror = () => {
                    reject(request.error);
                };
            });
            
            if (total === 0) {
                resolve();
            }
        });
    }
    
    /**
     * ストアをクリア
     */
    clearStore(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 一時的な分析結果データをクリア（保存キャンセル時用）
     * @param {Object} analysisResult - キャンセルされた分析結果
     */
    async clearTemporaryData(analysisResult) {
        console.log('🚫 一時データクリア処理開始:', analysisResult);
        
        // 現在の実装では、IndexedDBに保存されるまでは一時データは存在しないため、
        // 実際のクリア処理は不要ですが、将来の拡張のためにメソッドを用意
        
        // 万が一、一時的にメモリ上に保存された分析結果があれば、それをクリア
        // （現在の実装では該当しませんが、デバッグ用として）
        
        console.log('✅ 一時データクリア完了（現在は実際のクリア処理はありません）');
        return true;
    }
}

// グローバルインスタンス
window.voiceProgressTracker = new VoiceProgressTracker();
