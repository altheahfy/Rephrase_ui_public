/**
 * グローバルエラーハンドリング強化
 * 本番環境用のエラー追跡とユーザーフレンドリーなエラー表示
 */

class ProductionErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        // 未処理のエラーをキャッチ
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event);
        });

        // Promise rejectionをキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            this.handlePromiseRejection(event);
        });

        console.log('🛡️ 本番エラーハンドリング開始');
    }

    handleGlobalError(event) {
        const error = {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logError('JavaScript Error', error);
        this.showUserFriendlyError('申し訳ございません。システムエラーが発生しました。');
    }

    handlePromiseRejection(event) {
        const error = {
            reason: event.reason,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        this.logError('Promise Rejection', error);
        this.showUserFriendlyError('処理中にエラーが発生しました。しばらく待ってから再試行してください。');
        
        // デフォルトの警告を防ぐ
        event.preventDefault();
    }

    logError(type, error) {
        // 開発環境ではコンソールに出力
        console.group(`❌ ${type}`);
        console.error('Error details:', error);
        console.groupEnd();

        // 本番環境では分析サービスに送信（例：Google Analytics、Sentry等）
        if (window.gtag) {
            gtag('event', 'exception', {
                description: `${type}: ${error.message || error.reason}`,
                fatal: false
            });
        }

        // localStorageにもエラーログを保存（診断用）
        this.saveErrorToLocalStorage(type, error);
    }

    saveErrorToLocalStorage(type, error) {
        try {
            const errors = JSON.parse(localStorage.getItem('rephraseErrors') || '[]');
            errors.push({
                type,
                error,
                id: Date.now()
            });

            // 最新の10件のみ保持
            if (errors.length > 10) {
                errors.splice(0, errors.length - 10);
            }

            localStorage.setItem('rephraseErrors', JSON.stringify(errors));
        } catch (e) {
            console.warn('エラーログの保存に失敗:', e);
        }
    }

    showUserFriendlyError(message) {
        // ユーザーフレンドリーなエラー表示
        if (document.body) {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #ff5252;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 10000;
                max-width: 300px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.4;
            `;
            errorDiv.innerHTML = `
                <div style="display: flex; align-items: flex-start; gap: 10px;">
                    <span style="font-size: 18px;">⚠️</span>
                    <div>
                        <strong>エラーが発生しました</strong><br>
                        ${message}
                    </div>
                </div>
            `;

            document.body.appendChild(errorDiv);

            // 5秒後に自動削除
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    // エラーログを取得（デバッグ用）
    getErrorLogs() {
        try {
            return JSON.parse(localStorage.getItem('rephraseErrors') || '[]');
        } catch (e) {
            return [];
        }
    }

    // エラーログをクリア
    clearErrorLogs() {
        localStorage.removeItem('rephraseErrors');
        console.log('🗑️ エラーログをクリアしました');
    }
}

// グローバルエラーハンドラーを初期化
window.productionErrorHandler = new ProductionErrorHandler();

// デバッグ用のグローバル関数を提供
window.getErrorLogs = () => window.productionErrorHandler.getErrorLogs();
window.clearErrorLogs = () => window.productionErrorHandler.clearErrorLogs();
