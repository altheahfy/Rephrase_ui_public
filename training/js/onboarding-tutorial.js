/**
 * Rephrase アプリケーション オンボーディングチュートリアル
 * ユーザーが機能の価値を理解できるようガイドするシステム
 */

class OnboardingTutorial {
    constructor() {
        this.currentStep = 0;
        this.steps = [
            {
                title: "🎉 Rephraseへようこそ！",
                description: "従来の英語学習とは違う、新しい体験をご案内します",
                target: "body",
                position: "center",
                isIntroduction: true
            },
            {
                title: "🤔 こんな経験、ありませんか？",
                description: "日本語を見る → 英語に翻訳 → 話す...<br><strong>時間がかかって、不自然な英語になってしまう</strong>",
                target: "body",
                position: "center",
                showProblem: true,
                demo: () => this.demonstrateTraditionalMethod()
            },
            {
                title: "✨ Rephraseの革新的解決法",
                description: "<strong>イラストを見る → 直接英語で表現</strong><br>翻訳を飛び越えて、自然な英語思考を身に付けます",
                target: ".image-container",
                position: "top",
                showSolution: true,
                demo: () => this.demonstrateDirectMethod()
            },
            {
                title: "🎯 実際に体験してみましょう！",
                description: "「普通の方法」と「Rephrase式」を比較体験してみてください",
                target: "body",
                position: "center",
                isInteractive: true,
                demo: () => this.startComparison()
            },
            {
                title: "🖼️ イラスト学習の効果",
                description: "<strong>効果実証済み：</strong><br>• 翻訳時間 60%短縮<br>• スピーキング流暢性 40%向上<br>• 自然な英語表現力アップ",
                target: ".image-container",
                position: "top",
                showStats: true,
                demo: () => this.demonstrateIllustrationBenefits()
            },
            {
                title: "👁️‍🗨️ 英語非表示の魔法",
                description: "英語を隠して、イラストから直接話す練習<br><strong>「あ、頭の使い方が変わった！」</strong>を実感してください",
                target: ".hide-english-button",
                position: "bottom",
                isCore: true,
                demo: () => this.demonstrateHideEnglishMagic()
            },
            {
                title: "🎤 音声認識でリアルタイム評価",
                description: "あなたの発音を瞬時に認識・評価<br>一人でも正確な発音練習ができます",
                target: ".voice-recognition-button",
                position: "top",
                demo: () => this.demonstrateVoiceRecognition()
            },
            {
                title: "📖 シャッフル機能の学習効果",
                description: "パターンをランダム表示で自然に定着<br>暗記に頼らない本当の英語力を養います",
                target: ".shuffle-button",
                position: "bottom",
                demo: () => this.demonstrateShuffleBenefit()
            },
            {
                title: "🚀 準備完了！さあ始めましょう",
                description: "<strong>4つの機能の組み合わせで、</strong><br>従来にない効果的な英語学習体験が待っています！",
                target: "body",
                position: "center",
                isConclusion: true,
                showConfidence: true
            }
        ];
    }

    start() {
        if (this.hasCompletedTutorial()) return;
        
        this.showOverlay();
        this.showStep(0);
    }

    showStep(stepIndex) {
        const step = this.steps[stepIndex];
        if (!step) return this.complete();

        this.currentStep = stepIndex;
        
        // ステップ表示
        this.renderStepModal(step);
        
        // デモ実行
        if (step.demo) {
            setTimeout(() => step.demo(), 1000);
        }
        
        // 進捗表示
        this.updateProgress();
    }

    demonstrateTraditionalMethod() {
        // 従来の翻訳学習法のデモ
        this.showThinkingBubble("Japanese: 私は学生です → English: I am a student", "traditional");
        
        setTimeout(() => {
            this.showThinkingBubble("時間がかかる... 不自然な英語...", "problem", 2000);
        }, 2000);
    }

    demonstrateDirectMethod() {
        // Rephrase式の直接学習法のデモ
        this.showThinkingBubble("イラスト 👤📚 → I am a student", "direct");
        
        setTimeout(() => {
            this.showThinkingBubble("早い！自然な英語！", "solution", 2000);
        }, 1500);
    }

    startComparison() {
        // インタラクティブ比較体験
        const comparisonDiv = document.createElement('div');
        comparisonDiv.className = 'comparison-demo';
        comparisonDiv.innerHTML = `
            <div class="comparison-container">
                <div class="method traditional-method">
                    <h4>従来の方法</h4>
                    <div class="demo-area">
                        <p>日本語: 私は本を読んでいます</p>
                        <p>↓ 翻訳思考 ↓</p>
                        <p>English: I am reading a book</p>
                    </div>
                    <button onclick="onboardingTutorial.tryTraditional()">試してみる</button>
                </div>
                <div class="method rephrase-method">
                    <h4>Rephrase方式</h4>
                    <div class="demo-area">
                        <div class="illustration">📖👤</div>
                        <p>↓ 直接思考 ↓</p>
                        <p>English: I am reading a book</p>
                    </div>
                    <button onclick="onboardingTutorial.tryRephrase()">試してみる</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(comparisonDiv);
    }

    demonstrateIllustrationBenefits() {
        // イラスト学習の統計的効果を表示
        this.showStatsAnimation([
            { label: "翻訳時間短縮", value: "60%", color: "#4CAF50" },
            { label: "スピーキング向上", value: "40%", color: "#2196F3" },
            { label: "自然な表現力", value: "85%", color: "#FF9800" }
        ]);
    }

    demonstrateHideEnglishMagic() {
        // 英語非表示の「魔法」体験
        const englishText = document.querySelector('.english-text');
        const hideButton = document.querySelector('.hide-english-button');
        
        if (englishText && hideButton) {
            // ステップ1: ボタンを光らせる
            this.highlightElement(hideButton, "この魔法のボタンを押してみてください");
            
            setTimeout(() => {
                // ステップ2: 英語が消える魔法
                englishText.style.transition = 'all 0.8s ease';
                englishText.style.opacity = '0';
                englishText.style.transform = 'scale(0.8)';
                
                this.showThinkingBubble("英語が消えました！イラストから英語を想像してみてください", "magic");
                
                setTimeout(() => {
                    // ステップ3: 復元
                    englishText.style.opacity = '';
                    englishText.style.transform = '';
                    this.removeHighlight(hideButton);
                }, 3000);
            }, 2000);
        }
    }

    demonstrateShuffleBenefit() {
        // シャッフル機能の学習効果デモ
        const shuffleButton = document.querySelector('.shuffle-button');
        if (shuffleButton) {
            this.highlightElement(shuffleButton, "例文をシャッフルして、パターンを自然に覚えます");
            
            // シャッフル効果をビジュアル化
            this.animateShuffleEffect();
        }
    }

    // ヘルパーメソッド
    showThinkingBubble(text, type, duration = 3000) {
        const bubble = document.createElement('div');
        bubble.className = `thinking-bubble ${type}`;
        bubble.innerHTML = `<div class="bubble-content">${text}</div>`;
        document.body.appendChild(bubble);
        
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, duration);
    }

    showStatsAnimation(stats) {
        const statsDiv = document.createElement('div');
        statsDiv.className = 'stats-animation';
        statsDiv.innerHTML = stats.map(stat => `
            <div class="stat-item" style="color: ${stat.color}">
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        `).join('');
        
        document.body.appendChild(statsDiv);
        
        setTimeout(() => {
            if (statsDiv.parentNode) {
                statsDiv.parentNode.removeChild(statsDiv);
            }
        }, 4000);
    }

    highlightElement(element, message) {
        element.style.position = 'relative';
        element.style.zIndex = '9999';
        element.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        element.style.border = '3px solid gold';
        
        if (message) {
            this.showThinkingBubble(message, "instruction");
        }
    }

    removeHighlight(element) {
        element.style.boxShadow = '';
        element.style.border = '';
        element.style.zIndex = '';
    }

    animateShuffleEffect() {
        // シャッフルエフェクトのビジュアル化
        const container = document.querySelector('.sentence-container') || document.body;
        const shuffleEffect = document.createElement('div');
        shuffleEffect.className = 'shuffle-visual-effect';
        shuffleEffect.innerHTML = `
            <div class="card">例文 1</div>
            <div class="card">例文 2</div>
            <div class="card">例文 3</div>
        `;
        container.appendChild(shuffleEffect);
        
        setTimeout(() => {
            shuffleEffect.classList.add('shuffling');
        }, 100);
        
        setTimeout(() => {
            if (shuffleEffect.parentNode) {
                shuffleEffect.parentNode.removeChild(shuffleEffect);
            }
        }, 3000);
    }

    demonstrateIllustration() {
        // イラスト表示のデモンストレーション
        const imageContainer = document.querySelector('.image-container');
        if (imageContainer) {
            imageContainer.style.border = '3px solid #4CAF50';
            imageContainer.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
            
            // アニメーション効果
            setTimeout(() => {
                imageContainer.style.border = '';
                imageContainer.style.boxShadow = '';
            }, 2000);
        }
    }

    demonstrateHideEnglish() {
        // 英語非表示のデモンストレーション
        const englishText = document.querySelector('.english-text');
        const hideButton = document.querySelector('.hide-english-button');
        
        if (englishText && hideButton) {
            // ボタンハイライト
            hideButton.style.background = 'linear-gradient(45deg, #FF6B6B, #4ECDC4)';
            hideButton.style.animation = 'pulse 1s infinite';
            
            // 3秒後に実際に英語を隠すデモ
            setTimeout(() => {
                englishText.style.opacity = '0.3';
                englishText.style.filter = 'blur(5px)';
                
                // さらに2秒後に復元
                setTimeout(() => {
                    englishText.style.opacity = '';
                    englishText.style.filter = '';
                    hideButton.style.background = '';
                    hideButton.style.animation = '';
                }, 2000);
            }, 3000);
        }
    }

    demonstrateVoiceRecognition() {
        // 音声認識のデモンストレーション
        const voiceButton = document.querySelector('.voice-recognition-button');
        if (voiceButton) {
            voiceButton.style.background = 'radial-gradient(circle, #FF4444, #CC0000)';
            voiceButton.style.animation = 'recording 1.5s infinite';
            
            // マイクアイコンのアニメーション
            const micIcon = voiceButton.querySelector('i') || voiceButton;
            micIcon.style.transform = 'scale(1.2)';
            
            setTimeout(() => {
                voiceButton.style.background = '';
                voiceButton.style.animation = '';
                micIcon.style.transform = '';
            }, 3000);
        }
    }

    renderStepModal(step) {
        // モーダルHTML生成
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal';
        modal.innerHTML = `
            <div class="onboarding-content">
                <h3>${step.title}</h3>
                <p>${step.description}</p>
                <div class="onboarding-controls">
                    <button class="skip-button" onclick="onboardingTutorial.skip()">スキップ</button>
                    <div class="step-counter">${this.currentStep + 1} / ${this.steps.length}</div>
                    <button class="next-button" onclick="onboardingTutorial.next()">
                        ${this.currentStep === this.steps.length - 1 ? '完了' : '次へ'}
                    </button>
                </div>
            </div>
        `;
        
        // 既存のモーダルを削除
        const existing = document.querySelector('.onboarding-modal');
        if (existing) existing.remove();
        
        document.body.appendChild(modal);
        
        // ポジション調整
        this.positionModal(modal, step);
    }

    positionModal(modal, step) {
        const target = document.querySelector(step.target);
        if (!target || step.position === 'center') {
            modal.style.position = 'fixed';
            modal.style.top = '50%';
            modal.style.left = '50%';
            modal.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const rect = target.getBoundingClientRect();
        modal.style.position = 'absolute';
        
        switch (step.position) {
            case 'top':
                modal.style.top = `${rect.top - modal.offsetHeight - 10}px`;
                modal.style.left = `${rect.left + rect.width/2}px`;
                modal.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                modal.style.top = `${rect.bottom + 10}px`;
                modal.style.left = `${rect.left + rect.width/2}px`;
                modal.style.transform = 'translateX(-50%)';
                break;
        }
    }

    next() {
        this.showStep(this.currentStep + 1);
    }

    skip() {
        this.complete();
    }

    complete() {
        // チュートリアル完了処理
        localStorage.setItem('rephrase_tutorial_completed', 'true');
        this.hideOverlay();
        
        // 完了メッセージ
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const message = document.createElement('div');
        message.className = 'tutorial-complete-message';
        message.innerHTML = `
            <div class="completion-content">
                🎉 チュートリアル完了！
                <p>Rephraseの4つの機能を使って、効果的な英語学習を始めましょう！</p>
                <button onclick="this.parentElement.parentElement.remove()">始める</button>
            </div>
        `;
        document.body.appendChild(message);
        
        setTimeout(() => message.remove(), 5000);
    }

    showOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        document.body.appendChild(overlay);
    }

    hideOverlay() {
        const overlay = document.querySelector('.onboarding-overlay');
        if (overlay) overlay.remove();
        
        const modal = document.querySelector('.onboarding-modal');
        if (modal) modal.remove();
    }

    updateProgress() {
        const progress = ((this.currentStep + 1) / this.steps.length) * 100;
        const progressBar = document.querySelector('.tutorial-progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    hasCompletedTutorial() {
        return localStorage.getItem('rephrase_tutorial_completed') === 'true';
    }

    resetTutorial() {
        localStorage.removeItem('rephrase_tutorial_completed');
    }
}

// CSS スタイル追加
const tutorialStyles = `
<style>
.onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
}

.onboarding-modal {
    position: fixed;
    z-index: 10000;
    max-width: 400px;
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.3s ease;
}

.onboarding-content h3 {
    margin: 0 0 12px 0;
    color: #333;
    font-size: 1.4em;
}

.onboarding-content p {
    margin: 0 0 20px 0;
    color: #666;
    line-height: 1.5;
}

.onboarding-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.skip-button {
    background: none;
    border: 1px solid #ddd;
    padding: 8px 16px;
    border-radius: 6px;
    color: #666;
}

.next-button {
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: bold;
}

.step-counter {
    color: #666;
    font-size: 0.9em;
}

.tutorial-complete-message {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 10000;
    background: white;
    padding: 24px;
    border-radius: 12px;
    text-align: center;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.completion-content button {
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: bold;
    margin-top: 12px;
}

@keyframes slideIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

@keyframes recording {
    0% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(255, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 68, 68, 0); }
}
</style>
`;

// スタイルを追加
document.head.insertAdjacentHTML('beforeend', tutorialStyles);

// グローバルインスタンス
const onboardingTutorial = new OnboardingTutorial();

// 初回起動時にチュートリアル開始
document.addEventListener('DOMContentLoaded', () => {
    // 少し遅延してからチュートリアル開始
    setTimeout(() => onboardingTutorial.start(), 1500);
});
