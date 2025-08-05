// Enhanced Chat Interface with Modern Interactions and Sidebar Navigation
class ModernChatInterface {
    constructor() {
        this.socket = io();
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.chatMessages = document.getElementById('chat-messages');
        this.charCount = document.getElementById('char-count');
        this.statusIndicator = document.getElementById('status-indicator');
        this.thoughtsToggle = document.getElementById('thoughts-toggle');
        this.welcomeTime = document.getElementById('welcome-time');
        
        // Sidebar elements
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebar-toggle');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history-btn');
        this.quickActionBtns = document.querySelectorAll('.quick-action-btn');
        
        this.isTyping = false;
        this.typingTimeout = null;
        this.isProcessing = false;
        this.conversationHistory = [];
        this.currentConversationId = this.generateConversationId();
        
        this.initializeEventListeners();
        this.setupSocketEvents();
        this.initializeUI();
        this.initializeSidebar();
    }

    initializeEventListeners() {
        // Enhanced input handling with auto-resize
        this.messageInput.addEventListener('input', (e) => {
            this.handleInputChange(e);
            this.updateCharCount();
            this.autoResizeTextarea();
        });

        // Enhanced send button interactions
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key handling with shift+enter for new line
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Enhanced focus effects
        this.messageInput.addEventListener('focus', () => {
            this.addFocusEffects();
        });

        this.messageInput.addEventListener('blur', () => {
            this.removeFocusEffects();
        });

        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Quick action buttons
        this.quickActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const query = e.currentTarget.dataset.query;
                this.handleQuickAction(query);
            });
        });

        // Clear history button
        this.clearHistoryBtn.addEventListener('click', () => {
            this.clearConversationHistory();
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024) {
                if (!this.sidebar.contains(e.target) && !this.sidebarToggle.contains(e.target)) {
                    this.closeSidebar();
                }
            }
        });
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.updateStatus('Connected', 'success');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.updateStatus('Disconnected', 'error');
        });

        this.socket.on('receive_message', (data) => {
            this.handleIncomingMessage(data);
        });

        this.socket.on('connection_status', (data) => {
            this.updateStatus(data.status, 'info');
        });
    }

    initializeUI() {
        // Set welcome time
        this.updateWelcomeTime();
        
        // Initialize character count
        this.updateCharCount();
        
        // Add smooth scroll behavior
        this.chatMessages.style.scrollBehavior = 'smooth';
        
        // Add loading animation to send button
        this.addButtonAnimations();
    }

    initializeSidebar() {
        // Initialize conversation history from localStorage
        this.loadConversationHistory();
        
        // Update history display
        this.updateHistoryDisplay();
        
        // Set up history item event listeners
        this.setupHistoryEventListeners();
    }

    handleInputChange(e) {
        const message = e.target.value.trim();
        this.sendButton.disabled = !message;
        
        // Add typing indicator
        if (message && !this.isTyping) {
            this.isTyping = true;
            this.socket.emit('typing_start');
        } else if (!message && this.isTyping) {
            this.isTyping = false;
            this.socket.emit('typing_stop');
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    updateCharCount() {
        const count = this.messageInput.value.length;
        this.charCount.textContent = count;
        
        // Visual feedback for character limit
        if (count > 1800) {
            this.charCount.style.color = '#ef4444';
        } else if (count > 1500) {
            this.charCount.style.color = '#f59e0b';
        } else {
            this.charCount.style.color = '#9ca3af';
        }
    }

    sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isProcessing) return;

        this.isProcessing = true;
        this.updateStatus('Sending...', 'info');
        this.showTypingIndicator();

        // Emit message to server (don't display immediately)
        this.socket.emit('send_message', {
            message: message,
            show_thoughts: this.thoughtsToggle.checked
        });

        // Clear input and reset
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';
        this.sendButton.disabled = true;
        this.updateCharCount();
        this.isTyping = false;
    }

    handleQuickAction(query) {
        // Set the query in the input field
        this.messageInput.value = query;
        this.messageInput.focus();
        this.updateCharCount();
        this.sendButton.disabled = false;
        
        // Auto-resize the textarea
        this.autoResizeTextarea();
        
        // Close sidebar on mobile
        if (window.innerWidth <= 1024) {
            this.closeSidebar();
        }
    }

    handleIncomingMessage(data) {
        this.isProcessing = false;
        this.hideTypingIndicator();
        this.updateStatus('Ready', 'success');

        // Display the message
        this.displayMessage(data);
        
        // Update conversation history
        this.updateConversationHistory(data);
    }

    displayMessage(data) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${data.sender === 'user' ? 'user-message' : 'ai-message'}`;
        
        // Add specific classes for different message types
        if (data.type === 'thought') {
            messageDiv.classList.add('thought-message');
        } else if (data.type === 'final_response') {
            messageDiv.classList.add('final-response');
        }

        const timestamp = this.formatTimestamp(data.timestamp);
        
        messageDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas ${data.sender === 'user' ? 'fa-user' : 'fa-robot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    ${this.formatMessageContent(data.content, data.type)}
                </div>
                <div class="message-timestamp">
                    <i class="fas fa-clock"></i>
                    <span>${timestamp}</span>
                </div>
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
        
        // Add hover effects
        this.addMessageHoverEffects(messageDiv);
    }

    formatMessageContent(content, type) {
        // Enhanced content formatting
        let formattedContent = content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');

        // Add special formatting for different message types
        if (type === 'thought') {
            formattedContent = `<div class="thought-content">
                <i class="fas fa-lightbulb thought-icon"></i>
                <span>${formattedContent}</span>
            </div>`;
        }

        return formattedContent;
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) {
            return 'Just now';
        } else if (diffInMinutes < 60) {
            return `${diffInMinutes}m ago`;
        } else if (diffInMinutes < 1440) {
            const hours = Math.floor(diffInMinutes / 60);
            return `${hours}h ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    scrollToBottom() {
        const scrollOptions = {
            top: this.chatMessages.scrollHeight,
            behavior: 'smooth'
        };
        
        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            this.chatMessages.scrollTo(scrollOptions);
        });
    }

    showTypingIndicator() {
        this.statusIndicator.textContent = 'AI is thinking...';
        this.statusIndicator.classList.add('typing');
        
        // Add typing animation to send button
        this.sendButton.classList.add('processing');
    }

    hideTypingIndicator() {
        this.statusIndicator.textContent = 'Ready';
        this.statusIndicator.classList.remove('typing');
        this.sendButton.classList.remove('processing');
    }

    updateStatus(message, type) {
        this.statusIndicator.textContent = message;
        this.statusIndicator.className = `status-indicator ${type}`;
    }

    updateWelcomeTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        this.welcomeTime.textContent = timeString;
    }

    addFocusEffects() {
        this.messageInput.parentElement.classList.add('focused');
    }

    removeFocusEffects() {
        this.messageInput.parentElement.classList.remove('focused');
    }

    addButtonAnimations() {
        // Add ripple effect to send button
        this.sendButton.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            const rect = this.sendButton.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.sendButton.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    }

    addMessageHoverEffects(messageDiv) {
        messageDiv.addEventListener('mouseenter', () => {
            messageDiv.style.transform = 'translateY(-2px)';
        });
        
        messageDiv.addEventListener('mouseleave', () => {
            messageDiv.style.transform = 'translateY(0)';
        });
    }

    // Sidebar functionality
    toggleSidebar() {
        if (window.innerWidth <= 1024) {
            this.sidebar.classList.toggle('open');
        }
    }

    closeSidebar() {
        this.sidebar.classList.remove('open');
    }

    // Conversation history functionality
    generateConversationId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    updateConversationHistory(data) {
        // Only update history for user messages and final responses
        if (data.sender === 'user' || data.type === 'final_response') {
            const conversation = this.conversationHistory.find(c => c.id === this.currentConversationId);
            
            if (!conversation) {
                // Create new conversation
                this.conversationHistory.unshift({
                    id: this.currentConversationId,
                    title: data.sender === 'user' ? data.content.substring(0, 50) + '...' : 'New Conversation',
                    preview: data.content.substring(0, 100) + '...',
                    timestamp: data.timestamp,
                    messages: [data]
                });
            } else {
                // Update existing conversation
                conversation.messages.push(data);
                conversation.preview = data.content.substring(0, 100) + '...';
                conversation.timestamp = data.timestamp;
                
                if (data.sender === 'user') {
                    conversation.title = data.content.substring(0, 50) + '...';
                }
            }
            
            // Keep only last 10 conversations
            if (this.conversationHistory.length > 10) {
                this.conversationHistory = this.conversationHistory.slice(0, 10);
            }
            
            this.saveConversationHistory();
            this.updateHistoryDisplay();
        }
    }

    updateHistoryDisplay() {
        // Clear existing history items except the current session
        const currentSessionItem = this.historyList.querySelector('.history-item.active');
        this.historyList.innerHTML = '';
        
        if (currentSessionItem) {
            this.historyList.appendChild(currentSessionItem);
        }

        // Add conversation history items
        this.conversationHistory.forEach(conversation => {
            const historyItem = this.createHistoryItem(conversation);
            this.historyList.appendChild(historyItem);
        });

        this.setupHistoryEventListeners();
    }

    createHistoryItem(conversation) {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.dataset.conversationId = conversation.id;
        
        const timestamp = this.formatTimestamp(conversation.timestamp);
        
        historyItem.innerHTML = `
            <div class="history-item-content">
                <div class="history-item-title">${conversation.title}</div>
                <div class="history-item-preview">${conversation.preview}</div>
                <div class="history-item-time">${timestamp}</div>
            </div>
            <button class="history-item-delete">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        return historyItem;
    }

    setupHistoryEventListeners() {
        const historyItems = this.historyList.querySelectorAll('.history-item:not(.active)');
        
        historyItems.forEach(item => {
            // Click to load conversation
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.history-item-delete')) {
                    this.loadConversation(item.dataset.conversationId);
                }
            });
            
            // Delete conversation
            const deleteBtn = item.querySelector('.history-item-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deleteConversation(item.dataset.conversationId);
                });
            }
        });
    }

    loadConversation(conversationId) {
        const conversation = this.conversationHistory.find(c => c.id === conversationId);
        if (conversation) {
            // Clear current chat
            this.chatMessages.innerHTML = '';
            
            // Load conversation messages
            conversation.messages.forEach(message => {
                this.displayMessage(message);
            });
            
            // Update active state
            this.historyList.querySelectorAll('.history-item').forEach(item => {
                item.classList.remove('active');
            });
            
            const activeItem = this.historyList.querySelector(`[data-conversation-id="${conversationId}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
            
            this.currentConversationId = conversationId;
        }
    }

    deleteConversation(conversationId) {
        this.conversationHistory = this.conversationHistory.filter(c => c.id !== conversationId);
        this.saveConversationHistory();
        this.updateHistoryDisplay();
        
        // If deleted conversation was active, start new conversation
        if (this.currentConversationId === conversationId) {
            this.startNewConversation();
        }
    }

    startNewConversation() {
        this.currentConversationId = this.generateConversationId();
        this.chatMessages.innerHTML = `
            <div class="message ai-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <div class="message-text">
                        Hello! I'm Huawei Network Planning AI Assistant, for Etisalat (e&). I can help you with network planning, optimization, capacity analysis, and technical solutions. How can I assist you with your network planning needs today?
                    </div>
                    <div class="message-timestamp">
                        <i class="fas fa-clock"></i>
                        <span>Just now</span>
                    </div>
                </div>
            </div>
        `;
        
        // Update active state
        this.historyList.querySelectorAll('.history-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const currentSessionItem = this.historyList.querySelector('.history-item.active');
        if (currentSessionItem) {
            currentSessionItem.classList.add('active');
        }
    }

    clearConversationHistory() {
        if (confirm('Are you sure you want to clear all conversation history?')) {
            this.conversationHistory = [];
            this.saveConversationHistory();
            this.updateHistoryDisplay();
            this.startNewConversation();
        }
    }

    saveConversationHistory() {
        try {
            localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
        } catch (error) {
            console.error('Error saving conversation history:', error);
        }
    }

    loadConversationHistory() {
        try {
            const saved = localStorage.getItem('conversationHistory');
            if (saved) {
                this.conversationHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.error('Error loading conversation history:', error);
            this.conversationHistory = [];
        }
    }
}

// Enhanced CSS for new interactions
const enhancedStyles = `
    .input-wrapper.focused {
        border-color: #7c3aed;
        box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.2);
        transform: translateY(-2px);
    }

    .send-button.processing {
        animation: pulse 1.5s infinite;
    }

    .send-button .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }

    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }

    .status-indicator.success {
        color: #10b981;
    }

    .status-indicator.error {
        color: #ef4444;
    }

    .status-indicator.info {
        color: #3b82f6;
    }

    .thought-content {
        display: flex;
        align-items: flex-start;
        gap: 0.5rem;
    }

    .thought-icon {
        color: #667eea;
        margin-top: 0.1rem;
        animation: pulse 2s infinite;
    }

    code {
        background: rgba(0, 0, 0, 0.1);
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.9em;
    }

    .message-text strong {
        font-weight: 600;
    }

    .message-text em {
        font-style: italic;
    }

    /* Sidebar overlay for mobile */
    @media (max-width: 1024px) {
        .sidebar.open::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
        }
    }
`;

// Inject enhanced styles
const styleSheet = document.createElement('style');
styleSheet.textContent = enhancedStyles;
document.head.appendChild(styleSheet);

// Initialize the enhanced chat interface
document.addEventListener('DOMContentLoaded', () => {
    new ModernChatInterface();
});