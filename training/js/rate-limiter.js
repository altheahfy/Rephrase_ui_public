/**
 * Rephrase API率制限システム
 * DDoS攻撃、ブルートフォース攻撃、スパム攻撃からシステムを保護
 */

class RateLimiter {
    constructor() {
        this.limits = new Map();
        this.blocked = new Map();
        this.requestLog = new Map();
        
        // 率制限設定
        this.rateLimits = {
            // 認証関連（厳格）
            'auth.login': {
                windowMs: 60 * 1000,        // 1分間
                maxAttempts: 5,             // 5回まで
                blockDurationMs: 15 * 60 * 1000, // 15分間ブロック
                message: 'ログイン試行回数が多すぎます。15分後に再試行してください。'
            },
            'auth.register': {
                windowMs: 60 * 60 * 1000,   // 1時間
                maxAttempts: 3,             // 3回まで
                blockDurationMs: 60 * 60 * 1000, // 1時間ブロック
                message: '登録試行回数が多すぎます。1時間後に再試行してください。'
            },
            'auth.passwordReset': {
                windowMs: 60 * 60 * 1000,   // 1時間
                maxAttempts: 3,             // 3回まで
                blockDurationMs: 60 * 60 * 1000, // 1時間ブロック
                message: 'パスワードリセット要求が多すぎます。1時間後に再試行してください。'
            },
            
            // データ操作（標準）
            'api.fileUpload': {
                windowMs: 60 * 1000,        // 1分間
                maxAttempts: 10,            // 10回まで
                blockDurationMs: 5 * 60 * 1000, // 5分間ブロック
                message: 'ファイルアップロードが多すぎます。5分後に再試行してください。'
            },
            'api.dataFetch': {
                windowMs: 60 * 1000,        // 1分間
                maxAttempts: 100,           // 100回まで
                blockDurationMs: 2 * 60 * 1000, // 2分間ブロック
                message: 'API呼び出しが多すぎます。2分後に再試行してください。'
            },
            
            // 一般操作（緩和）
            'general.pageView': {
                windowMs: 60 * 1000,        // 1分間
                maxAttempts: 200,           // 200回まで
                blockDurationMs: 60 * 1000, // 1分間ブロック
                message: 'ページアクセスが多すぎます。1分後に再試行してください。'
            }
        };
        
        this.init();
    }

    init() {
        // 定期的にクリーンアップ
        setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000); // 5分ごと
        
        console.log('🛡️ 率制限システム初期化完了');
    }

    /**
     * 率制限チェック
     * @param {string} action - アクション名 (例: 'auth.login')
     * @param {string} identifier - 識別子 (IPアドレス、ユーザーID等)
     * @returns {Object} - {allowed: boolean, remaining: number, resetTime: number, message?: string}
     */
    checkLimit(action, identifier = 'default') {
        try {
            const config = this.rateLimits[action];
            if (!config) {
                console.warn(`未定義のアクション: ${action}`);
                return { allowed: true, remaining: Infinity, resetTime: 0 };
            }

            const key = `${action}:${identifier}`;
            const now = Date.now();

            // ブロック状態チェック
            if (this.isBlocked(key)) {
                const blockInfo = this.blocked.get(key);
                const remainingBlockTime = Math.ceil((blockInfo.until - now) / 1000);
                
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: blockInfo.until,
                    message: `${config.message} (残り${remainingBlockTime}秒)`,
                    blocked: true
                };
            }

            // 要求ログの取得または初期化
            if (!this.requestLog.has(key)) {
                this.requestLog.set(key, []);
            }

            const requests = this.requestLog.get(key);
            
            // 古い要求を削除（ウィンドウ外）
            const windowStart = now - config.windowMs;
            const validRequests = requests.filter(timestamp => timestamp > windowStart);
            this.requestLog.set(key, validRequests);

            // 制限チェック
            if (validRequests.length >= config.maxAttempts) {
                // 制限超過 - ブロック
                this.blockIdentifier(key, config.blockDurationMs);
                
                return {
                    allowed: false,
                    remaining: 0,
                    resetTime: now + config.blockDurationMs,
                    message: config.message,
                    blocked: true
                };
            }

            // 要求を記録
            validRequests.push(now);
            this.requestLog.set(key, validRequests);

            const remaining = config.maxAttempts - validRequests.length;
            const resetTime = now + config.windowMs;

            return {
                allowed: true,
                remaining: remaining,
                resetTime: resetTime
            };
        } catch (error) {
            // エラーハンドリング - 安全側に倒す
            if (window.errorHandler) {
                window.errorHandler.handleError(error, { action, identifier }, 'system.rate_limit_error');
            } else {
                console.error('Rate limit check error:', error);
            }
            
            // セキュリティ優先で制限を適用
            return {
                allowed: false,
                remaining: 0,
                resetTime: Date.now() + 60000, // 1分間ブロック
                message: 'システムエラーのため一時的に制限されています',
                error: true
            };
        }
    }

    /**
     * ブロック状態確認
     */
    isBlocked(key) {
        const blockInfo = this.blocked.get(key);
        if (!blockInfo) return false;
        
        if (Date.now() > blockInfo.until) {
            this.blocked.delete(key);
            return false;
        }
        
        return true;
    }

    /**
     * 識別子をブロック
     */
    blockIdentifier(key, durationMs) {
        const until = Date.now() + durationMs;
        this.blocked.set(key, { until });
        
        console.log(`🚫 ブロック: ${key} (${Math.ceil(durationMs / 1000)}秒間)`);
    }

    /**
     * 手動ブロック解除
     */
    unblock(action, identifier) {
        const key = `${action}:${identifier}`;
        this.blocked.delete(key);
        this.requestLog.delete(key);
        
        console.log(`✅ ブロック解除: ${key}`);
    }

    /**
     * 率制限情報取得
     */
    getLimitInfo(action, identifier = 'default') {
        const config = this.rateLimits[action];
        if (!config) return null;

        const key = `${action}:${identifier}`;
        const requests = this.requestLog.get(key) || [];
        const blockInfo = this.blocked.get(key);

        return {
            action,
            identifier,
            config,
            currentRequests: requests.length,
            blocked: !!blockInfo,
            blockUntil: blockInfo?.until || null
        };
    }

    /**
     * 全ての率制限状態取得
     */
    getAllLimits() {
        const limits = {};
        
        for (const [key, requests] of this.requestLog.entries()) {
            const [action, identifier] = key.split(':');
            if (!limits[action]) limits[action] = {};
            
            limits[action][identifier] = {
                requests: requests.length,
                lastRequest: Math.max(...requests),
                blocked: this.isBlocked(key)
            };
        }
        
        return limits;
    }

    /**
     * 古いデータのクリーンアップ
     */
    cleanup() {
        const now = Date.now();
        let cleanupCount = 0;

        // 古い要求ログを削除
        for (const [key, requests] of this.requestLog.entries()) {
            const [action] = key.split(':');
            const config = this.rateLimits[action];
            
            if (config) {
                const windowStart = now - config.windowMs;
                const validRequests = requests.filter(timestamp => timestamp > windowStart);
                
                if (validRequests.length === 0) {
                    this.requestLog.delete(key);
                    cleanupCount++;
                } else {
                    this.requestLog.set(key, validRequests);
                }
            }
        }

        // 期限切れのブロックを削除
        for (const [key, blockInfo] of this.blocked.entries()) {
            if (now > blockInfo.until) {
                this.blocked.delete(key);
                cleanupCount++;
            }
        }

        if (cleanupCount > 0) {
            console.log(`🧹 率制限クリーンアップ: ${cleanupCount}件削除`);
        }
    }

    /**
     * 統計情報取得
     */
    getStats() {
        const now = Date.now();
        let totalRequests = 0;
        let activeBlocks = 0;
        let actionStats = {};

        // 要求統計
        for (const [key, requests] of this.requestLog.entries()) {
            const [action] = key.split(':');
            totalRequests += requests.length;
            
            if (!actionStats[action]) {
                actionStats[action] = { requests: 0, identifiers: 0 };
            }
            actionStats[action].requests += requests.length;
            actionStats[action].identifiers++;
        }

        // ブロック統計
        for (const [key, blockInfo] of this.blocked.entries()) {
            if (now <= blockInfo.until) {
                activeBlocks++;
            }
        }

        return {
            totalRequests,
            activeBlocks,
            totalIdentifiers: this.requestLog.size,
            actionStats
        };
    }

    /**
     * 簡易IPアドレス取得（開発用）
     */
    getClientIdentifier() {
        // 本番環境ではサーバーサイドでIPアドレスを取得
        // 現在は簡易的にsessionStorageを使用
        let clientId = sessionStorage.getItem('clientId');
        if (!clientId) {
            clientId = 'client_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('clientId', clientId);
        }
        return clientId;
    }

    /**
     * レスポンスヘッダー形式で制限情報を取得
     */
    getHeaders(action, identifier) {
        const limitInfo = this.checkLimit(action, identifier);
        
        return {
            'X-RateLimit-Limit': this.rateLimits[action]?.maxAttempts || 'Unknown',
            'X-RateLimit-Remaining': limitInfo.remaining,
            'X-RateLimit-Reset': Math.ceil(limitInfo.resetTime / 1000),
            'X-RateLimit-Window': Math.ceil((this.rateLimits[action]?.windowMs || 0) / 1000)
        };
    }
}

// グローバルに率制限システムを公開
window.rateLimiter = new RateLimiter();
