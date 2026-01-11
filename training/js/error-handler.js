/**
 * Rephrase エラーハンドリングシステム
 * セキュアなエラー管理と情報漏洩防止を提供
 */

class ErrorHandler {
    constructor() {
        this.errorLog = [];
        this.maxLogSize = 100;
        this.isProduction = this.detectEnvironment();
        this.userFriendlyMessages = this.initializeUserMessages();
        this.sensitivePatterns = this.initializeSensitivePatterns();
        
        this.initializeGlobalErrorHandling();
        
        console.log('🛡️ エラーハンドリングシステム初期化完了');
        console.log('📊 環境設定:', {
            isProduction: this.isProduction,
            maxLogSize: this.maxLogSize,
            globalErrorCatch: '有効',
            userFriendlyModal: this.isProduction ? '有効' : '無効'
        });
    }

    /**
     * 環境検出（本番環境かどうか）
     */
    detectEnvironment() {
        // 本番環境の判定条件
        const productionIndicators = [
            window.location.protocol === 'https:',
            window.location.hostname !== 'localhost',
            !window.location.hostname.includes('127.0.0.1'),
            !window.location.href.includes('file://'),
            !document.documentElement.hasAttribute('debug')
        ];
        
        // 過半数が true なら本番環境
        const productionScore = productionIndicators.filter(Boolean).length;
        const isProduction = productionScore >= 3;
        
        // デバッグ情報を出力
        console.log('🔍 環境検出結果:', {
            protocol: window.location.protocol,
            hostname: window.location.hostname,
            href: window.location.href,
            hasDebugAttr: document.documentElement.hasAttribute('debug'),
            productionIndicators,
            productionScore,
            isProduction
        });
        
        return isProduction;
    }

    /**
     * ユーザー向けメッセージの初期化
     */
    initializeUserMessages() {
        return {
            // 認証エラー
            'auth.invalid_credentials': 'ユーザー名またはパスワードが正しくありません',
            'auth.account_locked': 'アカウントがロックされています。しばらく待ってから再試行してください',
            'auth.rate_limit': 'ログイン試行回数が多すぎます。しばらく待ってから再試行してください',
            'auth.session_expired': 'セッションが期限切れです。再度ログインしてください',
            'auth.insufficient_permissions': 'この操作を実行する権限がありません',
            'auth.registration_failed': 'ユーザー登録に失敗しました',
            'auth.login_failed': 'ログインに失敗しました',
            'auth.session_error': 'セッション処理でエラーが発生しました',

            // データエラー
            'data.not_found': '要求されたデータが見つかりません',
            'data.validation_failed': '入力データが無効です。正しい形式で入力してください',
            'data.save_failed': 'データの保存に失敗しました',
            'data.load_failed': 'データファイルの読み込みに失敗しました。ファイルが存在するか確認してください',
            'data.corrupt': 'データが破損している可能性があります',

            // ネットワークエラー
            'network.connection_failed': 'ファイルの読み込みに失敗しました。ファイルパスが正しいか確認してください',
            'network.timeout': '通信がタイムアウトしました',
            'network.server_error': 'サーバーエラーが発生しました',
            'network.service_unavailable': 'サービスが一時的に利用できません',

            // システムエラー
            'system.unknown': 'システムエラーが発生しました',
            'system.maintenance': 'システムメンテナンス中です',
            'system.resource_limit': 'リソース制限に達しました',
            'system.browser_unsupported': 'お使いのブラウザは対応していません',
            'system.rate_limit_error': '率制限システムでエラーが発生しました',
            'system.microphone_error': 'マイクへのアクセスでエラーが発生しました',

            // 一般的なエラー
            'general.invalid_input': '選択または入力内容に問題があります',
            'general.operation_failed': '操作に失敗しました',
            'general.try_again': '再度お試しください'
        };
    }

    /**
     * 機密情報パターンの初期化
     */
    initializeSensitivePatterns() {
        return [
            // システムパス
            /[C-Z]:\\[^\\]*\\/gi,
            /\/[^\/]*\/[^\/]*\/[^\/]*/gi,
            
            // スタックトレース
            /at\s+[^(]*\([^)]*\)/gi,
            /\s+at\s+/gi,
            
            // ファイル拡張子とパス
            /\.[js|html|css|json]:\d+:\d+/gi,
            /file:\/\/\/[^\s]*/gi,
            
            // 内部関数名
            /function\s+\w+/gi,
            /\w+\.\w+\.\w+/gi,
            
            // ブラウザ固有情報
            /chrome-extension:\/\/[^\s]*/gi,
            /moz-extension:\/\/[^\s]*/gi,
            
            // デバッグ情報
            /console\.[log|error|warn|debug]/gi,
            /debugger/gi,
            
            // セキュリティ関連
            /password|token|key|secret|hash|salt/gi,
            /localStorage|sessionStorage/gi
        ];
    }

    /**
     * グローバルエラーハンドリングの初期化
     */
    initializeGlobalErrorHandling() {
        // JavaScript エラーキャッチ（重要なもののみ）
        window.addEventListener('error', (event) => {
            // 小さなエラーは無視
            if (event.message && event.message.includes('Script error')) {
                return;
            }
            
            this.handleGlobalError('javascript', event.error, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                message: event.message
            });
        });

        // Promise リジェクションキャッチ（重要なもののみ）
        window.addEventListener('unhandledrejection', (event) => {
            // ネットワークエラーや小さなPromiseエラーは無視
            if (event.reason && typeof event.reason === 'string' && 
                (event.reason.includes('fetch') || event.reason.includes('load'))) {
                console.warn('軽微なPromiseエラーをスキップ:', event.reason);
                return;
            }
            
            this.handleGlobalError('promise', event.reason, {
                promise: 'unhandled rejection'
            });
        });

        // console.error をインターセプト（開発環境のみ）
        if (!this.isProduction) {
            const originalConsoleError = console.error;
            console.error = (...args) => {
                // 軽微なエラーは記録のみ
                const message = args.join(' ');
                if (!message.includes('critical') && !message.includes('security')) {
                    originalConsoleError.apply(console, args);
                    return;
                }
                
                this.logError('console', message, { level: 'error' });
                originalConsoleError.apply(console, args);
            };
        }
    }

    /**
     * グローバルエラーハンドラー
     */
    handleGlobalError(type, error, context = {}) {
        const errorInfo = {
            type: type,
            message: error?.message || error,
            timestamp: new Date().toISOString(),
            context: context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logError(type, error, context);

        // 開発環境では自動モーダル表示を無効化
        console.log('🔍 グローバルエラー捕捉:', {
            type: type,
            message: error?.message || error,
            isProduction: this.isProduction,
            url: window.location.href
        });

        // 本番環境でのみユーザーにエラー表示
        if (this.isProduction) {
            // 重要なエラーのみモーダル表示
            const criticalPatterns = ['security', 'auth', 'critical'];
            const isCritical = criticalPatterns.some(pattern => 
                String(error?.message || error).toLowerCase().includes(pattern)
            );
            
            if (isCritical) {
                this.showUserFriendlyError('system.unknown');
            }
        } else {
            console.warn('🚨 グローバルエラー（開発環境）- モーダル非表示:', {
                type: type,
                message: error?.message || error,
                context: context
            });
        }
    }

    /**
     * エラーログ記録
     */
    logError(type, error, context = {}) {
        const logEntry = {
            id: this.generateErrorId(),
            type: type,
            message: this.sanitizeErrorMessage(error?.message || error),
            originalMessage: error?.message || error,
            timestamp: new Date().toISOString(),
            context: context,
            stack: error?.stack ? this.sanitizeStackTrace(error.stack) : null,
            severity: this.determineSeverity(error),
            userAgent: navigator.userAgent.substring(0, 100), // 制限
            url: window.location.pathname // パスのみ
        };

        this.errorLog.unshift(logEntry);
        
        // ログサイズ制限
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(0, this.maxLogSize);
        }

        // 重要エラーの場合は即座に通知
        if (logEntry.severity === 'critical') {
            this.notifyCriticalError(logEntry);
        }
    }

    /**
     * エラーメッセージの無害化
     */
    sanitizeErrorMessage(message) {
        if (!message) return 'Unknown error';
        
        let sanitized = String(message);
        
        // 機密情報パターンの除去
        this.sensitivePatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '[FILTERED]');
        });

        // 長すぎるメッセージの切り詰め
        if (sanitized.length > 200) {
            sanitized = sanitized.substring(0, 200) + '...';
        }

        return sanitized;
    }

    /**
     * スタックトレースの無害化
     */
    sanitizeStackTrace(stack) {
        if (!stack || this.isProduction) return null;
        
        let sanitized = stack;
        
        // ファイルパスの除去
        sanitized = sanitized.replace(/[C-Z]:\\[^\\]*\\/gi, '[PATH]/');
        sanitized = sanitized.replace(/file:\/\/\/[^\s]*/gi, '[FILE]');
        
        // 行番号のみ保持
        sanitized = sanitized.replace(/\.js:\d+:\d+/gi, '.js:[LINE]:[COL]');
        
        return sanitized.substring(0, 500); // 制限
    }

    /**
     * エラー重要度の判定
     */
    determineSeverity(error) {
        const message = error?.message || error;
        
        if (!message) return 'medium';
        
        // 重要度パターン
        const criticalPatterns = [
            /security|auth|permission/i,
            /rate.?limit|blocked|banned/i,
            /corruption|data.?loss/i
        ];
        
        const highPatterns = [
            /network|connection|timeout/i,
            /save|load|storage/i,
            /validation|invalid/i
        ];
        
        if (criticalPatterns.some(pattern => pattern.test(message))) {
            return 'critical';
        }
        
        if (highPatterns.some(pattern => pattern.test(message))) {
            return 'high';
        }
        
        return 'medium';
    }

    /**
     * エラーID生成
     */
    generateErrorId() {
        return 'ERR-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
    }

    /**
     * 重要エラーの通知
     */
    notifyCriticalError(errorEntry) {
        // 開発環境でのみ詳細通知
        if (!this.isProduction) {
            console.error('🚨 重要エラー検出:', errorEntry);
        }

        // セキュリティ関連エラーの場合は追加処理
        if (errorEntry.message.toLowerCase().includes('security')) {
            this.handleSecurityError(errorEntry);
        }
    }

    /**
     * セキュリティエラーの処理
     */
    handleSecurityError(errorEntry) {
        // セキュリティログの記録
        this.logSecurityIncident(errorEntry);
        
        // 必要に応じてセッション無効化
        if (errorEntry.message.includes('permission') || errorEntry.message.includes('auth')) {
            if (window.authSystem) {
                window.authSystem.logout();
            }
        }
    }

    /**
     * セキュリティインシデントの記録
     */
    logSecurityIncident(errorEntry) {
        const incident = {
            id: errorEntry.id,
            timestamp: errorEntry.timestamp,
            type: 'security_error',
            message: errorEntry.message,
            context: errorEntry.context,
            userAgent: errorEntry.userAgent,
            url: errorEntry.url
        };

        // セキュリティログに記録（本番環境では外部送信）
        if (this.isProduction) {
            // TODO: セキュリティログサーバーに送信
            console.warn('セキュリティインシデント記録:', incident.id);
        } else {
            console.warn('🔒 セキュリティインシデント:', incident);
        }
    }

    /**
     * ユーザーフレンドリーエラー表示
     */
    showUserFriendlyError(errorCode, details = null) {
        const message = this.userFriendlyMessages[errorCode] || this.userFriendlyMessages['system.unknown'];
        
        // エラーID生成（サポート用）
        const errorId = this.generateErrorId();
        
        let displayMessage = message;
        if (!this.isProduction && details) {
            displayMessage += `\n\nエラーID: ${errorId}`;
            displayMessage += `\n詳細: ${this.sanitizeErrorMessage(details)}`;
        } else if (this.isProduction) {
            displayMessage += `\n\nエラーID: ${errorId}`;
            displayMessage += '\n\nサポートが必要な場合は、このエラーIDをお知らせください。';
        }

        // モーダルで表示（alert より安全）
        this.showErrorModal(displayMessage, errorId);
    }

    /**
     * エラーモーダル表示
     */
    showErrorModal(message, errorId) {
        // 既存のエラーモーダルがあれば削除
        const existingModal = document.getElementById('error-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'error-modal';
        modal.innerHTML = `
            <div style="
                position: fixed;
                top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <div style="
                    background: white;
                    border-radius: 10px;
                    padding: 30px;
                    max-width: 500px;
                    margin: 20px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3);
                ">
                    <div style="
                        color: #d32f2f;
                        font-size: 24px;
                        margin-bottom: 15px;
                        display: flex;
                        align-items: center;
                    ">
                        ⚠️ エラーが発生しました
                    </div>
                    <div style="
                        color: #333;
                        line-height: 1.6;
                        margin-bottom: 20px;
                        white-space: pre-line;
                    ">${this.escapeHtml(message)}</div>
                    <button onclick="document.getElementById('error-modal').remove()" style="
                        background: #1976d2;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                    ">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // 自動閉じる（30秒後）
        setTimeout(() => {
            if (document.getElementById('error-modal')) {
                modal.remove();
            }
        }, 30000);
    }

    /**
     * HTML エスケープ
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * パブリックAPI: 安全なエラーハンドリング
     */
    handleError(error, context = {}, userErrorCode = null) {
        // 🔍 デバッグ用：元のエラーをConsoleに常に出力
        console.error('🔴 [ErrorHandler] エラー発生:', {
            error: error,
            message: error?.message,
            stack: error?.stack,
            context: context,
            userErrorCode: userErrorCode
        });
        
        this.logError('application', error, context);

        // 明示的に要求された場合のみモーダル表示
        if (userErrorCode && context.showModal !== false) {
            if (userErrorCode) {
                this.showUserFriendlyError(userErrorCode, error?.message);
            } else {
                // エラータイプの自動判定
                const autoCode = this.detectErrorType(error);
                this.showUserFriendlyError(autoCode, error?.message);
            }
        } else {
            console.log('📝 エラーをログに記録（モーダル非表示）:', error?.message || error);
        }
    }

    /**
     * エラータイプの自動判定
     */
    detectErrorType(error) {
        const message = error?.message || error;
        
        if (!message) return 'system.unknown';
        
        // パターンマッチング
        if (/network|fetch|connection/i.test(message)) return 'network.connection_failed';
        if (/timeout/i.test(message)) return 'network.timeout';
        if (/permission|unauthorized|forbidden/i.test(message)) return 'auth.insufficient_permissions';
        if (/validation|invalid/i.test(message)) return 'data.validation_failed';
        if (/not found|404/i.test(message)) return 'data.not_found';
        if (/rate.?limit/i.test(message)) return 'auth.rate_limit';
        
        return 'system.unknown';
    }

    /**
     * エラーログの取得（管理者用）
     */
    getErrorLog(limit = 10) {
        if (this.isProduction) {
            // 本番環境では制限されたログのみ
            return this.errorLog.slice(0, limit).map(entry => ({
                id: entry.id,
                type: entry.type,
                timestamp: entry.timestamp,
                severity: entry.severity
            }));
        } else {
            return this.errorLog.slice(0, limit);
        }
    }

    /**
     * エラーログのクリア
     */
    clearErrorLog() {
        this.errorLog = [];
        console.log('📝 エラーログをクリアしました');
    }

    /**
     * システム統計の取得
     */
    getErrorStats() {
        const total = this.errorLog.length;
        const bySeverity = this.errorLog.reduce((acc, entry) => {
            acc[entry.severity] = (acc[entry.severity] || 0) + 1;
            return acc;
        }, {});
        
        const byType = this.errorLog.reduce((acc, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1;
            return acc;
        }, {});

        return {
            total,
            bySeverity,
            byType,
            environment: this.isProduction ? 'production' : 'development'
        };
    }
}

// グローバルに公開
window.errorHandler = new ErrorHandler();

// 便利関数の提供
window.handleError = (error, context, userErrorCode) => {
    window.errorHandler.handleError(error, context, userErrorCode);
};

window.showUserError = (errorCode, details) => {
    window.errorHandler.showUserFriendlyError(errorCode, details);
};

// デバッグ用関数
window.forceShowErrorModal = (message) => {
    window.errorHandler.showUserFriendlyError('system.unknown', message || 'テストエラー');
};

console.log('🛡️ エラーハンドリングシステム準備完了');
console.log('🔧 デバッグコマンド:');
console.log('  - window.forceShowErrorModal("テスト") : エラーモーダルの強制表示');
console.log('  - window.errorHandler.getErrorLog() : エラーログの確認');
console.log('  - window.errorHandler.getErrorStats() : エラー統計の確認');
