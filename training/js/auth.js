/**
 * Rephrase認証システム
 * セキュアなユーザー認証とセッション管理を提供
 */

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24時間
        this.maxLoginAttempts = 5;
        this.lockoutDuration = 15 * 60 * 1000; // 15分
        this.init();
    }

    async init() {
        // 🆕 初回アクセス時にデフォルトユーザーを作成
        await this.ensureDefaultUser();
        
        // ページ読み込み時にセッション復元を試行
        await this.restoreSession();
        this.setupSessionTimeout();
        this.bindEvents();
    }
    
    /**
     * デフォルトユーザーの存在確認と作成
     * GitHub Pages等で初回アクセス時にテストユーザーを自動作成
     */
    async ensureDefaultUser() {
        const DEFAULT_USERNAME = 'demo';
        const DEFAULT_PASSWORD = 'demo1234'; // 8文字以上必須
        const DEFAULT_EMAIL = 'demo@rephrase.local';
        
        console.log('🔐 デフォルトユーザーチェック開始...');
        
        // securityUtilsが読み込まれているか確認
        if (!window.securityUtils) {
            console.warn('⚠️ securityUtils未読み込み。デフォルトユーザー作成をスキップします。');
            return;
        }
        
        // すでにユーザーが存在するかチェック
        const exists = this.userExists(DEFAULT_USERNAME);
        console.log(`🔍 ユーザー "${DEFAULT_USERNAME}" の存在: ${exists}`);
        
        if (!exists) {
            console.log('🔐 デフォルトユーザーを作成中...');
            try {
                const result = await this.register(DEFAULT_USERNAME, DEFAULT_PASSWORD, DEFAULT_EMAIL);
                if (result.success) {
                    console.log('✅ デフォルトユーザー作成完了');
                    console.log('📝 ログイン情報: username="demo", password="demo1234"');
                } else {
                    console.error('❌ デフォルトユーザー作成失敗:', result.message);
                }
            } catch (error) {
                console.error('❌ デフォルトユーザー作成エラー:', error);
            }
        } else {
            console.log('✓ デフォルトユーザーは既に存在します');
        }
    }

    /**
     * パスワードのハッシュ化（HTTPフォールバック対応）
     * 本番環境では bcrypt や Argon2 を使用推奨
     */
    async hashPassword(password, salt = null) {
        if (!salt) {
            salt = this.generateSalt();
        }
        
        // 🔧 HTTP環境(Live Server)でのフォールバック
        if (!window.crypto || !window.crypto.subtle) {
            console.warn('🔒 HTTP環境: 簡易ハッシュを使用（開発用）');
            // 簡易ハッシュ関数（開発環境用）
            return this.fallbackHash(password, salt);
        }
        
        // HTTPS環境: 安全なcrypto.subtleを使用
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + salt);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            return { hash: hashHex, salt: salt };
        } catch (error) {
            console.warn('🔒 crypto.subtle失敗、フォールバックを使用:', error);
            return this.fallbackHash(password, salt);
        }
    }

    /**
     * HTTP環境用の簡易ハッシュ関数
     */
    fallbackHash(password, salt) {
        // 簡易的なハッシュ（開発環境用）
        let hash = 0;
        const input = password + salt;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 32bit整数に変換
        }
        return { 
            hash: Math.abs(hash).toString(16).padStart(8, '0'), 
            salt: salt 
        };
    }

    generateSalt() {
        // 🔧 HTTP環境でのフォールバック
        if (!window.crypto || !window.crypto.getRandomValues) {
            console.warn('🔒 HTTP環境: 簡易ソルト生成（開発用）');
            // 簡易ソルト生成
            return Math.random().toString(36).substring(2, 18);
        }
        
        // HTTPS環境: 安全な乱数生成
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * ユーザー登録
     */
    async register(username, password, email) {
        try {
            // 率制限チェック
            const clientId = window.rateLimiter ? window.rateLimiter.getClientIdentifier() : 'default';
            const rateCheck = window.rateLimiter ? window.rateLimiter.checkLimit('auth.register', clientId) : { allowed: true };
            
            if (!rateCheck.allowed) {
                throw new Error(rateCheck.message || '登録試行回数が制限されています');
            }

            // 入力値検証（詳細なエラーメッセージ付き）
            this.validateInput(username, password, email);

            // 既存ユーザーチェック
            if (this.userExists(username)) {
                throw new Error('このユーザー名は既に使用されています');
            }

            // パスワードハッシュ化
            const { hash, salt } = await this.hashPassword(password);

            // ユーザーデータ作成
            const userData = {
                id: this.generateUserId(),
                username: username,
                email: email,
                passwordHash: hash,
                salt: salt,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                loginAttempts: 0,
                lockedUntil: null,
                isActive: true
            };

            // 暗号化してローカルストレージに保存
            this.saveUser(userData);

            console.log('ユーザー登録成功:', username);
            return { success: true, message: '登録が完了しました' };

        } catch (error) {
            // セキュアなエラーハンドリング
            if (window.errorHandler) {
                window.errorHandler.handleError(error, { action: 'register', username }, 'auth.registration_failed');
            } else {
                console.error('Registration error:', error);
            }
            return { success: false, message: error.message };
        }
    }

    /**
     * ログイン
     */
    async login(username, password) {
        try {
            // 率制限チェック
            const clientId = window.rateLimiter ? window.rateLimiter.getClientIdentifier() : 'default';
            const rateCheck = window.rateLimiter ? window.rateLimiter.checkLimit('auth.login', clientId) : { allowed: true };
            
            if (!rateCheck.allowed) {
                throw new Error(rateCheck.message || 'ログイン試行回数が制限されています');
            }

            const user = this.getUser(username);
            
            if (!user) {
                throw new Error('ユーザー名またはパスワードが正しくありません');
            }

            // アカウントロック確認
            if (this.isAccountLocked(user)) {
                const lockTime = new Date(user.lockedUntil);
                const remainingTime = Math.ceil((lockTime - new Date()) / 60000);
                throw new Error(`アカウントがロックされています。${remainingTime}分後に再試行してください`);
            }

            // パスワード検証
            const { hash } = await this.hashPassword(password, user.salt);
            
            if (hash !== user.passwordHash) {
                // ログイン試行回数を増加
                this.incrementLoginAttempts(user);
                throw new Error('ユーザー名またはパスワードが正しくありません');
            }

            // ログイン成功
            this.loginSuccess(user);
            console.log('ログイン成功:', username);
            
            return { 
                success: true, 
                message: 'ログインしました',
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email
                }
            };

        } catch (error) {
            // セキュアなエラーハンドリング
            if (window.errorHandler) {
                window.errorHandler.handleError(error, { action: 'login', username }, 'auth.login_failed');
            } else {
                console.error('Login error:', error);
            }
            return { success: false, message: error.message };
        }
    }

    /**
     * ログアウト
     */
    logout() {
        this.currentUser = null;
        this.clearSession();
        this.clearSessionTimeout();
        console.log('ログアウトしました');
        
        // ログイン画面にリダイレクト
        this.showLoginInterface();
        
        return { success: true, message: 'ログアウトしました' };
    }

    /**
     * セッション復元（シンプル版）
     */
    async restoreSession() {
        try {
            const sessionData = localStorage.getItem('userSession');
            
            if (sessionData) {
                const session = JSON.parse(sessionData);
                
                if (session.expires > Date.now()) {
                    const user = this.getUser(session.username);
                    if (user && user.isActive) {
                        this.currentUser = user;
                        this.extendSession();
                        console.log('🔐 セッション復元成功:', user.username);
                        return true;
                    }
                }
            }
            
            this.clearSession();
            return false;
            
        } catch (error) {
            console.error('🔐 セッション復元エラー:', error);
            this.clearSession();
            return false;
        }
    }

    /**
     * 入力値検証
     */
    validateInput(username, password, email = null) {
        // ユーザー名検証
        if (!username || username.length < 3 || username.length > 20) {
            throw new Error('ユーザー名は3文字以上20文字以下で入力してください');
        }
        
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            throw new Error('ユーザー名は英数字とアンダースコアのみ使用可能です');
        }

        // パスワード検証
        if (!password || password.length < 8) {
            throw new Error('パスワードは8文字以上で入力してください');
        }

        // パスワード強度チェック（少し緩和）
        let missingRequirements = [];
        if (!/[a-z]/.test(password)) missingRequirements.push('小文字');
        if (!/[A-Z]/.test(password)) missingRequirements.push('大文字');
        if (!/\d/.test(password)) missingRequirements.push('数字');
        
        if (missingRequirements.length > 1) {
            throw new Error(`パスワードには${missingRequirements.join('、')}を含めてください`);
        }

        // メール検証（登録時のみ）
        if (email !== null) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                throw new Error('有効なメールアドレスを入力してください');
            }
        }

        return true;
    }

    /**
     * ユーザー存在確認
     */
    userExists(username) {
        const users = this.getAllUsers();
        return users.some(user => user.username === username);
    }

    /**
     * ユーザーデータ取得
     */
    getUser(username) {
        const users = this.getAllUsers();
        return users.find(user => user.username === username);
    }

    /**
     * 全ユーザーデータ取得
     */
    getAllUsers() {
        try {
            const usersData = window.securityUtils.secureLocalStorageGet('rephraseUsers');
            return usersData || [];
        } catch (error) {
            console.error('Failed to get users:', error);
            return [];
        }
    }

    /**
     * ユーザーデータ保存
     */
    saveUser(userData) {
        const users = this.getAllUsers();
        const existingIndex = users.findIndex(user => user.username === userData.username);
        
        if (existingIndex >= 0) {
            users[existingIndex] = userData;
        } else {
            users.push(userData);
        }
        
        window.securityUtils.secureLocalStorageSet('rephraseUsers', users);
    }

    /**
     * ユーザーID生成
     */
    generateUserId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * アカウントロック確認
     */
    isAccountLocked(user) {
        return user.lockedUntil && new Date(user.lockedUntil) > new Date();
    }

    /**
     * ログイン試行回数増加
     */
    incrementLoginAttempts(user) {
        user.loginAttempts = (user.loginAttempts || 0) + 1;
        
        if (user.loginAttempts >= this.maxLoginAttempts) {
            user.lockedUntil = new Date(Date.now() + this.lockoutDuration).toISOString();
            console.log(`アカウント ${user.username} をロックしました`);
        }
        
        this.saveUser(user);
    }

    /**
     * ログイン成功処理
     */
    loginSuccess(user) {
        // ログイン試行回数とロックをリセット
        user.loginAttempts = 0;
        user.lockedUntil = null;
        user.lastLogin = new Date().toISOString();
        
        this.currentUser = user;
        this.saveUser(user);
        this.createSession(user);
        this.hideLoginInterface();
    }

    /**
     * セッション作成（シンプル版）
     */
    createSession(user) {
        const sessionData = {
            username: user.username,
            created: Date.now(),
            expires: Date.now() + this.sessionTimeout
        };
        
        localStorage.setItem('userSession', JSON.stringify(sessionData));
        console.log('🔐 セッション作成:', sessionData);
    }

    /**
     * セッション延長
     */
    extendSession() {
        if (this.currentUser) {
            this.createSession(this.currentUser);
        }
    }

    /**
     * セッションクリア（シンプル版）
     */
    clearSession() {
        try {
            // ローカルストレージから直接削除
            localStorage.removeItem('userSession');
            localStorage.removeItem('rephrase_session');
            this.currentUser = null;
            console.log('🔐 セッションデータをクリア');
        } catch (error) {
            console.warn('🔐 セッションクリア中にエラー:', error);
            // エラーが発生してもcurrentUserはnullにする
            this.currentUser = null;
        }
    }

    /**
     * セッションタイムアウト設定（シンプル版）
     */
    setupSessionTimeout() {
        // 定期的にセッション確認
        this.sessionCheckInterval = setInterval(() => {
            try {
                const sessionData = localStorage.getItem('userSession');
                if (!sessionData) {
                    this.logout();
                    return;
                }
                
                const session = JSON.parse(sessionData);
                if (session.expires <= Date.now()) {
                    this.logout();
                }
            } catch (error) {
                console.warn('🔐 セッションチェック中にエラー:', error);
                this.logout();
            }
        }, 60000); // 1分ごとにチェック
    }

    /**
     * セッションタイムアウトクリア
     */
    clearSessionTimeout() {
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
        }
    }

    /**
     * 現在のユーザー取得
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * ログイン状態確認（シンプル版）
     */
    isLoggedIn() {
        // currentUserが存在するかの基本チェック
        if (!this.currentUser) {
            console.log('🔐 currentUser が存在しません');
            return false;
        }
        
        try {
            // ローカルストレージから直接セッションチェック
            const sessionData = localStorage.getItem('userSession');
            if (!sessionData) {
                console.log('🔐 セッションデータが存在しません');
                this.currentUser = null;
                return false;
            }
            
            const session = JSON.parse(sessionData);
            if (session.expires <= Date.now()) {
                console.log('🔐 セッション期限切れ');
                this.currentUser = null;
                this.clearSession();
                return false;
            }
            
            console.log('✅ 有効なセッション確認済み');
            return true;
            
        } catch (error) {
            console.log('🔐 ログイン状態確認中にエラー:', error);
            this.currentUser = null;
            this.clearSession();
            return false;
        }
    }

    /**
     * ログインインターフェース表示
     */
    showLoginInterface() {
        // TODO: ログインフォームの表示処理
        console.log('ログインフォームを表示');
    }

    /**
     * ログインインターフェース非表示
     */
    hideLoginInterface() {
        // TODO: ログインフォームの非表示処理
        console.log('ログインフォームを非表示');
    }

    /**
     * イベントバインド
     */
    bindEvents() {
        // ページ離脱時にセッション延長
        window.addEventListener('beforeunload', () => {
            if (this.isLoggedIn()) {
                this.extendSession();
            }
        });

        // アクティビティ検出でセッション延長
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, this.debounce(() => {
                if (this.isLoggedIn()) {
                    this.extendSession();
                }
            }, 300000)); // 5分間隔で延長
        });
    }

    /**
     * デバウンス関数
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// グローバルに認証システムを公開
window.authSystem = new AuthSystem();
