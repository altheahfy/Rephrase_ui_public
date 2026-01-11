/**
 * 🔒 Rephrase セキュリティモジュール
 * Phase 1: 基本セキュリティ実装
 */

// =============================================================================
// 1. 入力値検証・サニタイゼーション
// =============================================================================

/**
 * HTMLエスケープ処理（XSS対策）
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * JSONファイルの安全な解析
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    // 基本的な形式チェック
    if (typeof jsonString !== 'string') {
      console.warn('🔒 セキュリティ警告: JSON解析対象が文字列ではありません');
      return defaultValue;
    }

    // サイズ制限チェック（10MB以下）
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (jsonString.length > maxSize) {
      console.error('🔒 セキュリティエラー: JSONファイルサイズが大きすぎます');
      throw new Error('ファイルサイズが制限を超えています');
    }

    // 危険なパターンの検出
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /function\s*\(/i,
      /__proto__/i,
      /constructor/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(jsonString)) {
        console.error('🔒 セキュリティエラー: 危険なパターンが検出されました');
        throw new Error('不正なコンテンツが含まれています');
      }
    }

    const parsed = JSON.parse(jsonString);
    
    // 解析結果の検証
    if (parsed && typeof parsed === 'object') {
      return sanitizeObject(parsed);
    }
    
    return parsed;
    
  } catch (error) {
    console.error('🔒 JSON解析エラー:', error.message);
    return defaultValue;
  }
}

/**
 * オブジェクトの再帰的サニタイゼーション
 */
function sanitizeObject(obj) {
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'string' ? escapeHtml(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    // 危険なプロパティ名を除外
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      console.warn('🔒 セキュリティ警告: 危険なプロパティを除外しました:', key);
      continue;
    }
    
    const safeKey = escapeHtml(key);
    sanitized[safeKey] = sanitizeObject(value);
  }
  
  return sanitized;
}

/**
 * ファイルアップロードの検証
 */
export function validateFileUpload(file) {
  const errors = [];

  // ファイルサイズチェック（50MB以下）
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    errors.push('ファイルサイズが大きすぎます（最大50MB）');
  }

  // ファイル形式チェック
  const allowedTypes = [
    'application/json',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel' // .xls
  ];
  
  if (!allowedTypes.includes(file.type)) {
    errors.push('許可されていないファイル形式です');
  }

  // ファイル名の検証
  const filename = file.name;
  const dangerousChars = /[<>:"|?*]/;
  if (dangerousChars.test(filename)) {
    errors.push('ファイル名に無効な文字が含まれています');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

// =============================================================================
// 2. ローカルストレージの暗号化
// =============================================================================

/**
 * 簡易暗号化（Base64 + ROT13ベース）
 * 注意: 本格的な暗号化ではないが、平文保存よりは安全
 */
function simpleEncrypt(text) {
  try {
    // ROT13的な文字置換 + Base64エンコード
    const shifted = text.split('').map(char => {
      const code = char.charCodeAt(0);
      return String.fromCharCode(code + 13);
    }).join('');
    
    return btoa(unescape(encodeURIComponent(shifted)));
  } catch (error) {
    console.warn('🔒 暗号化失敗、平文で保存します:', error);
    return text;
  }
}

/**
 * 簡易復号化
 */
function simpleDecrypt(encrypted) {
  try {
    const decoded = decodeURIComponent(escape(atob(encrypted)));
    
    return decoded.split('').map(char => {
      const code = char.charCodeAt(0);
      return String.fromCharCode(code - 13);
    }).join('');
  } catch (error) {
    console.warn('🔒 復号化失敗、そのまま返します:', error);
    return encrypted;
  }
}

/**
 * 安全なローカルストレージ保存
 */
export function secureLocalStorageSet(key, value) {
  try {
    const serialized = JSON.stringify(value);
    const encrypted = simpleEncrypt(serialized);
    
    localStorage.setItem(`rephrase_secure_${key}`, encrypted);
    console.log('🔒 安全にローカルストレージに保存しました:', key);
    
  } catch (error) {
    console.error('🔒 セキュアストレージ保存エラー:', error);
    // フォールバック: 平文保存
    localStorage.setItem(`rephrase_${key}`, JSON.stringify(value));
  }
}

/**
 * 安全なローカルストレージ取得
 */
export function secureLocalStorageGet(key, defaultValue = null) {
  try {
    // まずセキュア版を試行
    const encrypted = localStorage.getItem(`rephrase_secure_${key}`);
    if (encrypted) {
      const decrypted = simpleDecrypt(encrypted);
      return JSON.parse(decrypted);
    }
    
    // フォールバック: 従来版
    const fallback = localStorage.getItem(`rephrase_${key}`);
    if (fallback) {
      return JSON.parse(fallback);
    }
    
    return defaultValue;
    
  } catch (error) {
    console.error('🔒 セキュアストレージ取得エラー:', error);
    return defaultValue;
  }
}

// =============================================================================
// 3. CSRF対策
// =============================================================================

/**
 * CSRFトークン生成
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRFトークン検証
 */
export function validateCSRFToken(token) {
  const storedToken = sessionStorage.getItem('rephrase_csrf_token');
  return storedToken && storedToken === token;
}

/**
 * CSRF保護初期化
 */
export function initCSRFProtection() {
  const token = generateCSRFToken();
  sessionStorage.setItem('rephrase_csrf_token', token);
  
  // すべてのフォームにCSRFトークンを追加
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = token;
    form.appendChild(csrfInput);
  });
  
  console.log('🔒 CSRF保護を初期化しました');
}

// =============================================================================
// 4. 一般的なセキュリティユーティリティ
// =============================================================================

/**
 * スクリプトインジェクション検出
 */
export function detectScriptInjection(input) {
  const scriptPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /vbscript:/i,
    /data:text\/html/i
  ];
  
  return scriptPatterns.some(pattern => pattern.test(input));
}

/**
 * URL検証
 */
export function validateURL(url) {
  try {
    const parsed = new URL(url);
    // HTTPSのみ許可（本番環境用）
    return parsed.protocol === 'https:' || 
           (parsed.protocol === 'http:' && parsed.hostname === 'localhost');
  } catch {
    return false;
  }
}

/**
 * セキュリティヘッダーの設定（可能な範囲で）
 */
export function setSecurityHeaders() {
  // Content Security Policy（メタタグで設定）
  const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!existingCSP) {
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // 既存コードとの互換性のため
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self'",
      "media-src 'self'",
      "object-src 'none'",
      "frame-src 'none'"
    ].join('; ');
    document.head.appendChild(cspMeta);
    console.log('🔒 Content Security Policy を設定しました');
  }
  
  // X-Content-Type-Options
  const xcto = document.createElement('meta');
  xcto.httpEquiv = 'X-Content-Type-Options';
  xcto.content = 'nosniff';
  document.head.appendChild(xcto);
  
  // X-Frame-Options
  const xfo = document.createElement('meta');
  xfo.httpEquiv = 'X-Frame-Options';
  xfo.content = 'DENY';
  document.head.appendChild(xfo);
  
  console.log('🔒 セキュリティヘッダーを設定しました');
}

// =============================================================================
// 5. セキュリティ初期化
// =============================================================================

/**
 * セキュリティシステムの初期化
 */
export function initSecurity() {
  console.log('🔒 Rephraseセキュリティシステム初期化開始...');
  
  try {
    // CSRF保護初期化
    initCSRFProtection();
    
    // セキュリティヘッダー設定
    setSecurityHeaders();
    
    // HTTPS強制（本番環境でのみ）
    if (location.protocol === 'http:' && location.hostname !== 'localhost') {
      console.warn('🔒 本番環境ではHTTPSを使用してください');
      // location.replace(location.href.replace('http:', 'https:'));
    }
    
    console.log('✅ セキュリティシステム初期化完了');
    
  } catch (error) {
    console.error('❌ セキュリティ初期化エラー:', error);
  }
}

// グローバル公開（デバッグ用）
window.RephraseSecurityUtils = {
  escapeHtml,
  safeJsonParse,
  validateFileUpload,
  secureLocalStorageSet,
  secureLocalStorageGet,
  generateCSRFToken,
  validateCSRFToken,
  detectScriptInjection,
  validateURL
};

// auth.js互換性のため
window.securityUtils = window.RephraseSecurityUtils;
