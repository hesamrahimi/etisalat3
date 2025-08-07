// Enhanced Chat Interface with Modern Interactions, Sidebar Navigation, and Advanced Features
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
        
        // Settings elements
        this.settingsToggle = document.getElementById('settings-toggle');
        this.settingsContent = document.getElementById('settings-content');
        this.themeToggle = document.getElementById('theme-toggle');
        this.exportTxtBtn = document.getElementById('export-txt-btn');
        this.exportPdfBtn = document.getElementById('export-pdf-btn');
        this.typingNotifications = document.getElementById('typing-notifications');
        this.autoScroll = document.getElementById('auto-scroll');
        this.previewLength = document.getElementById('preview-length');
        this.autoSave = document.getElementById('auto-save');
        
        // History elements
        this.historyToggle = document.getElementById('history-toggle');
        this.historyContent = document.getElementById('history-content');
        
        this.isTyping = false;
        this.typingTimeout = null;
        this.isProcessing = false;
        this.conversationHistory = [];
        this.currentConversationId = this.generateConversationId();
        this.searchResults = [];
        this.settings = this.loadSettings();
        this.autoSaveInterval = null;
        
                    // Visualization state
            this.visualizationState = {
                communicationData: [],
                completedSteps: [],
                currentStep: 0,
                logEntries: []
            };
            
            // Animation state
            this.isAnimating = false;
        
        this.initializeEventListeners();
        this.setupSocketEvents();
        this.initializeUI();
        this.initializeSidebar();
        this.initializeSettings();
        this.initializeVisualizationPanel();
        this.startAutoSave();
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

        // Settings functionality
        this.settingsToggle.addEventListener('click', () => {
            this.toggleSettings();
        });

        this.themeToggle.addEventListener('change', () => {
            this.toggleTheme();
        });

        this.exportTxtBtn.addEventListener('click', () => {
            this.exportConversation('txt');
        });

        this.exportPdfBtn.addEventListener('click', () => {
            this.exportConversation('pdf');
        });

        // History functionality
        this.historyToggle.addEventListener('click', () => {
            this.toggleHistory();
        });

        // Settings change listeners
        this.typingNotifications.addEventListener('change', () => {
            this.updateSettings();
        });

        this.autoScroll.addEventListener('change', () => {
            this.updateSettings();
        });

        this.previewLength.addEventListener('change', () => {
            this.updateSettings();
        });

        this.autoSave.addEventListener('change', () => {
            this.updateSettings();
            this.startAutoSave();
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
        
        // Apply saved theme
        this.applyTheme();
    }

    initializeSidebar() {
        // Initialize conversation history from localStorage
        this.loadConversationHistory();
        
        // Update history display
        this.updateHistoryDisplay();
        
        // Set up history item event listeners
        this.setupHistoryEventListeners();
    }

    initializeSettings() {
        // Apply saved settings to UI
        this.themeToggle.checked = this.settings.theme === 'light';
        this.typingNotifications.checked = this.settings.typingNotifications;
        this.autoScroll.checked = this.settings.autoScroll;
        this.previewLength.value = this.settings.previewLength;
        this.autoSave.value = this.settings.autoSaveInterval;
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

        // Note: Visualization panel is now manually controlled by user
        // Users can click the "Agent Communication Flow" button to expand the panel

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

    async triggerVisualization() {
        try {
            // Get real communication data from server
            const response = await fetch('/api/trigger-visualization');
            const data = await response.json();
            
            if (data.success && data.communication_data.length > 0) {
                // Check if visualization page is open by trying to access it
                let visualizationWindow = null;
                try {
                    visualizationWindow = window.open('', 'visualization');
                    if (visualizationWindow && !visualizationWindow.closed) {
                        // Check if the window has the correct URL
                        if (visualizationWindow.location.href.includes('/visualization')) {
                            // Send message to existing visualization window
                            visualizationWindow.postMessage({
                                type: 'start_visualization',
                                communicationData: data.communication_data
                            }, '*');
                            return;
                        } else {
                            // Close the wrong window
                            visualizationWindow.close();
                        }
                    }
                } catch (e) {
                    // Window is blocked or doesn't exist
                }
                
                // Open new visualization window
                const newWindow = window.open('/visualization', 'visualization', 'width=1200,height=800');
                if (newWindow) {
                    // Wait a bit for the window to load, then send the message
                    setTimeout(() => {
                        newWindow.postMessage({
                            type: 'start_visualization',
                            communicationData: data.communication_data
                        }, '*');
                    }, 1000);
                }
            }
        } catch (error) {
            console.error('Error triggering visualization:', error);
        }
    }

    getCommunicationData() {
        // This would typically come from the server
        // For now, we'll use a sample flow based on the logs_new.txt structure
        return [
            {
                caller: 'Supervisor',
                talkto: 'NBI Agent',
                message: 'Extract and translate node names and TP locations to UUIDs'
            },
            {
                caller: 'NBI Agent',
                talkto: 'Supervisor',
                message: 'Node UUIDs and TP UUIDs extracted successfully'
            },
            {
                caller: 'Supervisor',
                talkto: 'Plan Agent',
                message: 'Pass UUIDs to Plan Agent for OCh planning'
            },
            {
                caller: 'Plan Agent',
                talkto: 'NBI Agent',
                message: 'Request NBI Agent to plan OCh on NCE'
            },
            {
                caller: 'NBI Agent',
                talkto: 'Plan Agent',
                message: 'NCE OCh planning completed'
            },
            {
                caller: 'Plan Agent',
                talkto: 'DT Agent',
                message: 'Request DT Agent to plan OCh on OPE'
            },
            {
                caller: 'DT Agent',
                talkto: 'Plan Agent',
                message: 'OPE OCh planning completed'
            },
            {
                caller: 'Plan Agent',
                talkto: 'Tunnel Operator',
                message: 'Request Tunnel Operator to create OCh'
            },
            {
                caller: 'Tunnel Operator',
                talkto: 'DT Agent',
                message: 'Create OCh on OPE using DT Agent'
            },
            {
                caller: 'DT Agent',
                talkto: 'Tunnel Operator',
                message: 'OPE OCh created successfully'
            },
            {
                caller: 'Tunnel Operator',
                talkto: 'NBI Agent',
                message: 'Create OCh on NCE using NBI Agent'
            },
            {
                caller: 'NBI Agent',
                talkto: 'Tunnel Operator',
                message: 'NCE OCh created successfully'
            },
            {
                caller: 'Tunnel Operator',
                talkto: '__end__',
                message: 'Task completed successfully'
            }
        ];
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

        // Add delay for thought messages to sync with backend timing
        if (data.type === 'thought') {
            // Match the backend timing: 0.5 seconds for RealSupervisor, 1 second for MockSupervisor
            // We'll use 1.5 seconds for smoother transitions
            setTimeout(() => {
                this.displayMessage(data);
                this.updateConversationHistory(data);
            }, 1500); // 1500ms = 1.5 seconds
        } else {
            // For non-thought messages (responses, errors), display immediately
            this.displayMessage(data);
            this.updateConversationHistory(data);
        }
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
        const statusIcon = this.getStatusIcon(data);
    
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
                ${statusIcon ? `<div class="message-status">
                    <i class="fas ${statusIcon} status-icon ${data.status || 'sent'}"></i>
                    <span>${data.status || 'sent'}</span>
                </div>` : ''}
            </div>
        `;
        
        this.chatMessages.appendChild(messageDiv);
        
        // Auto-scroll if enabled
        if (this.settings.autoScroll) {
            this.scrollToBottom();
        }
        
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

    getStatusIcon(data) {
        if (data.sender === 'user') {
            return 'fa-check';
        }
        return null;
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
        if (!this.settings.typingNotifications) return;
        
        this.statusIndicator.textContent = 'AI is thinking...';
        this.statusIndicator.classList.add('typing');
        
        // Add typing animation to send button
        this.sendButton.classList.add('processing');
        
        // Show enhanced typing indicator
        this.showEnhancedTypingIndicator();
    }

    showEnhancedTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
        
        // Store reference to remove later
        this.currentTypingIndicator = typingDiv;
    }

    hideTypingIndicator() {
        this.statusIndicator.textContent = 'Ready';
        this.statusIndicator.classList.remove('typing');
        this.sendButton.classList.remove('processing');
        
        // Remove enhanced typing indicator
        if (this.currentTypingIndicator) {
            this.currentTypingIndicator.remove();
            this.currentTypingIndicator = null;
        }
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

    // Settings functionality
    toggleSettings() {
        this.settingsContent.classList.toggle('expanded');
        this.settingsToggle.classList.toggle('expanded');
    }

    toggleTheme() {
        const isLight = this.themeToggle.checked;
        this.settings.theme = isLight ? 'light' : 'dark';
        this.applyTheme();
        this.saveSettings();
    }

    applyTheme() {
        if (this.settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
    }

    updateSettings() {
        this.settings.typingNotifications = this.typingNotifications.checked;
        this.settings.autoScroll = this.autoScroll.checked;
        this.settings.previewLength = parseInt(this.previewLength.value);
        this.settings.autoSaveInterval = parseInt(this.autoSave.value);
        
        this.saveSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('chatSettings');
            return saved ? JSON.parse(saved) : this.getDefaultSettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            return this.getDefaultSettings();
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('chatSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    getDefaultSettings() {
        return {
            theme: 'dark',
            typingNotifications: true,
            autoScroll: true,
            previewLength: 100,
            autoSaveInterval: 10
        };
    }

    // Export functionality
    exportConversation(format) {
        const conversation = this.conversationHistory.find(c => c.id === this.currentConversationId);
        if (!conversation) {
            alert('No conversation to export');
            return;
        }

        if (format === 'txt') {
            this.exportAsTxt(conversation);
        } else if (format === 'pdf') {
            this.exportAsPdf(conversation);
        }
    }

    exportAsTxt(conversation) {
        let content = `Huawei Network Planning AI Assistant - Conversation Export\n`;
        content += `Date: ${new Date().toLocaleString()}\n`;
        content += `Conversation: ${conversation.title}\n\n`;
        content += `Messages:\n\n`;

        conversation.messages.forEach(message => {
            const sender = message.sender === 'user' ? 'User' : 'AI Assistant';
            const timestamp = new Date(message.timestamp).toLocaleString();
            content += `[${timestamp}] ${sender}:\n${message.content}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `conversation-${conversation.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportAsPdf(conversation) {
        // Simple PDF export using browser print functionality
        const printWindow = window.open('', '_blank');
        let content = `
            <html>
            <head>
                <title>Conversation Export</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .message { margin-bottom: 20px; padding: 10px; border-left: 3px solid #7c3aed; }
                    .user { background: #f3f4f6; }
                    .ai { background: #f9fafb; }
                    .timestamp { color: #6b7280; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Huawei Network Planning AI Assistant</h1>
                    <h2>Conversation Export</h2>
                    <p>Date: ${new Date().toLocaleString()}</p>
                    <p>Conversation: ${conversation.title}</p>
                </div>
        `;

        conversation.messages.forEach(message => {
            const sender = message.sender === 'user' ? 'User' : 'AI Assistant';
            const timestamp = new Date(message.timestamp).toLocaleString();
            const messageClass = message.sender === 'user' ? 'user' : 'ai';
            
            content += `
                <div class="message ${messageClass}">
                    <div class="timestamp">[${timestamp}] ${sender}</div>
                    <div>${message.content.replace(/\n/g, '<br>')}</div>
                </div>
            `;
        });

        content += '</body></html>';
        
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.print();
    }

    // Auto-save functionality
    startAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        const interval = this.settings.autoSaveInterval * 60 * 1000; // Convert to milliseconds
        this.autoSaveInterval = setInterval(() => {
            this.saveConversationHistory();
        }, interval);
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
                    title: data.sender === 'user' ? data.content.substring(0, this.settings.previewLength) + '...' : 'New Conversation',
                    preview: data.content.substring(0, this.settings.previewLength) + '...',
                    timestamp: data.timestamp,
                    messages: [data]
                });
            } else {
                // Update existing conversation
                conversation.messages.push(data);
                conversation.preview = data.content.substring(0, this.settings.previewLength) + '...';
                conversation.timestamp = data.timestamp;
                
                if (data.sender === 'user') {
                    conversation.title = data.content.substring(0, this.settings.previewLength) + '...';
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

    toggleHistory() {
        this.historyContent.classList.toggle('expanded');
        this.historyToggle.classList.toggle('expanded');
    }

    // Settings functionality
    toggleSettings() {
        this.settingsContent.classList.toggle('expanded');
        this.settingsToggle.classList.toggle('expanded');
    }

    // Initialize visualization panel functionality
    initializeVisualizationPanel() {
        console.log('Initializing visualization panel...');
        const panel = document.getElementById('visualization-panel');
        const toggleBtn = document.getElementById('visualization-toggle-btn');
        const closeBtn = document.getElementById('visualization-close-btn');
        const loading = document.getElementById('visualization-loading');
        const container = document.getElementById('visualization-container');
        const graphContainer = document.getElementById('graph-container');
        const clearBtn = document.getElementById('clear-btn');
        
        console.log('Panel:', panel);
        console.log('Toggle button:', toggleBtn);
        console.log('Close button:', closeBtn);

        let isExpanded = false;

        // Toggle panel
        toggleBtn.addEventListener('click', () => {
            console.log('Visualization button clicked!');
            if (!isExpanded) {
                this.expandVisualizationPanel();
            } else {
                this.collapseVisualizationPanel();
            }
        });

        // Close panel
        closeBtn.addEventListener('click', () => {
            this.collapseVisualizationPanel();
        });

        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isExpanded) {
                this.collapseVisualizationPanel();
            }
        });



        // Clear data
        clearBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to clear all communication data?')) {
                await this.clearVisualizationData();
            }
        });



        // Store methods for external access
        this.expandVisualizationPanel = () => {
            panel.classList.add('expanded');
            isExpanded = true;
            this.loadVisualizationData();
        };

        this.collapseVisualizationPanel = () => {
            panel.classList.remove('expanded');
            isExpanded = false;
            
            // Call the same functionality as the Clear Data button
            this.clearVisualizationData();
        };

        this.loadVisualizationData = async () => {
            try {
                loading.style.display = 'flex';
                container.style.display = 'none';

                const response = await fetch('/api/communication-data');
                const data = await response.json();
                
                console.log('Loaded communication data:', data);

                if (data && data.length > 0) {
                    this.communicationData = data;
                    this.createAgentNodes();
                    // Small delay to ensure nodes are created before starting animation
                    setTimeout(() => {
                        this.startSimpleVisualization();
                    }, 100);
                } else {
                    graphContainer.innerHTML = '<p style="color: white; text-align: center; margin-top: 2rem;">No communication data available. Start a conversation to see agent interactions.</p>';
                    this.communicationData = [];
                    this.currentStep = 0;
                }

                loading.style.display = 'none';
                container.style.display = 'flex';
            } catch (error) {
                console.error('Error loading visualization data:', error);
                graphContainer.innerHTML = '<p>Error loading data. Please try again.</p>';
                loading.style.display = 'none';
                container.style.display = 'flex';
            }
        };

        this.renderVisualization = (data) => {
            // Use the proper visualization with nodes and connections
            this.communicationData = data;
            
            // Only create nodes and start animation if there's actual communication data
            if (data && data.length > 0) {
                this.createAgentNodes();
                this.startVisualization();
            } else {
                // Show empty state
                graphContainer.innerHTML = '<p style="color: white; text-align: center; margin-top: 2rem;">No communication data available. Start a conversation to see agent interactions.</p>';
            }
        };

        // Simple agent configuration
        this.agents = {
            'User': { x: 300, y: 20, status: 'idle' },
            'Supervisor': { x: 500, y: 20, status: 'idle' },
            'NBI Agent': { x: 200, y: 120, status: 'idle' },
            'Plan Agent': { x: 600, y: 120, status: 'idle' },
            'DT Agent': { x: 200, y: 220, status: 'idle' },
            'Tunnel Operator': { x: 600, y: 220, status: 'idle' },
            '__end__': { x: 400, y: 320, status: 'idle' }
        };

        this.isPlaying = false;
        this.isPaused = false;
        this.currentStep = 0;

        this.createAgentNodes = () => {
            // Clear existing nodes
            graphContainer.innerHTML = '';
            
            Object.entries(this.agents).forEach(([name, config]) => {
                const node = document.createElement('div');
                node.className = 'agent-node idle';
                node.id = `agent-${name.replace(/\s+/g, '-')}`;
                node.style.left = `${config.x}px`;
                node.style.top = `${config.y}px`;
                node.textContent = name;
                node.title = `${name} - Idle`;
                
                node.addEventListener('click', () => this.showAgentDetails(name));
                
                graphContainer.appendChild(node);
            });

            // Create communication log
            const logContainer = document.createElement('div');
            logContainer.className = 'communication-log';
            logContainer.style.cssText = `
                position: absolute;
                bottom: 20px;
                left: 20px;
                right: 20px;
                height: 200px;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 15px;
                overflow-y: auto;
                border: 1px solid rgba(255, 255, 255, 0.1);
            `;
            
            const logTitle = document.createElement('h4');
            logTitle.textContent = '📋 Communication Log';
            logTitle.style.cssText = 'color: white; margin: 0 0 10px 0; font-size: 1rem;';
            logContainer.appendChild(logTitle);

            const logEntries = document.createElement('div');
            logEntries.id = 'logEntries';
            logContainer.appendChild(logEntries);
            graphContainer.appendChild(logContainer);
        };

        this.showAgentDetails = (agentName) => {
            console.log(`Agent details for: ${agentName}`);
        };

        this.startSimpleVisualization = () => {
            if (this.communicationData.length === 0) {
                console.log('No communication data available.');
                return;
            }

            // Prevent multiple starts
            if (this.isPlaying) {
                console.log('Visualization already running.');
                return;
            }

            this.isPlaying = true;
            this.isPaused = false;
            this.currentStep = 0;
            
            // Clear any existing connections first
            const existingConnections = graphContainer.querySelectorAll('.connection-line');
            existingConnections.forEach(conn => conn.remove());
            
            // Start the simple animation
            this.processNextStep();
        };

        this.processNextStep = async () => {
            if (!this.isPlaying || this.isPaused) return;
            
            if (this.currentStep >= this.communicationData.length) {
                this.stopVisualization();
                return;
            }

            const step = this.communicationData[this.currentStep];
            await this.processSimpleStep(step);
            
            this.currentStep++;
            
            // Continue to next step after delay
            setTimeout(() => this.processNextStep(), 1500);
        };

        this.processSimpleStep = async (step) => {
            const { caller, talkto, message } = step;
            
            // Add log entry
            this.addLogEntry(caller, talkto, message);
            
            // Update caller status to active
            this.updateAgentStatus(caller, 'active');
            
            // Wait for processing
            await this.delay(1500);
            
            // Create connection from caller to callee
            this.createConnection(caller, talkto);
            
            // Update callee status to processing
            this.updateAgentStatus(talkto, 'processing');
            
            // Wait for response
            await this.delay(1500);
            
            // Update caller status to waiting
            this.updateAgentStatus(caller, 'waiting');
            
            // Wait for final response
            await this.delay(1500);
            
            // Reset both agents to idle
            this.updateAgentStatus(caller, 'idle');
            this.updateAgentStatus(talkto, 'idle');
        };

        this.updateAgentStatus = (agentName, status) => {
            const node = document.getElementById(`agent-${agentName.replace(/\s+/g, '-')}`);
            if (node) {
                node.className = `agent-node ${status}`;
                node.title = `${agentName} - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
            }
        };

        this.createConnection = (fromAgent, toAgent) => {
            const fromNode = document.getElementById(`agent-${fromAgent.replace(/\s+/g, '-')}`);
            const toNode = document.getElementById(`agent-${toAgent.replace(/\s+/g, '-')}`);
            
            if (!fromNode || !toNode) return;
            
            const fromRect = fromNode.getBoundingClientRect();
            const toRect = toNode.getBoundingClientRect();
            const containerRect = graphContainer.getBoundingClientRect();
            
            // Calculate center positions
            const fromCenterX = fromRect.left - containerRect.left + fromRect.width / 2;
            const fromCenterY = fromRect.top - containerRect.top + fromRect.height / 2;
            const toCenterX = toRect.left - containerRect.left + toRect.width / 2;
            const toCenterY = toRect.top - containerRect.top + toRect.height / 2;
            
            // Calculate direction vector
            const dx = toCenterX - fromCenterX;
            const dy = toCenterY - fromCenterY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length === 0) return; // Same position
            
            // Normalize direction vector
            const dirX = dx / length;
            const dirY = dy / length;
            
            // Calculate perpendicular vector for offset
            const perpX = -dirY;
            const perpY = dirX;
            
            // Count existing connections between these agents to create offset
            const existingConnections = graphContainer.querySelectorAll('.connection-line');
            let offsetCount = 0;
            
            existingConnections.forEach(conn => {
                // Check for connections in both directions between these agents
                if ((conn.dataset.from === fromAgent && conn.dataset.to === toAgent) ||
                    (conn.dataset.from === toAgent && conn.dataset.to === fromAgent)) {
                    offsetCount++;
                }
            });
            
            // Calculate offset with smaller spacing
            const offset = offsetCount * 8; // 8px spacing between parallel lines
            
            // Node radius (all nodes are circles with 40px radius)
            const nodeRadius = 40;
            
            // Calculate edge points (from border to border)
            const fromEdgeX = fromCenterX + dirX * nodeRadius;
            const fromEdgeY = fromCenterY + dirY * nodeRadius;
            const toEdgeX = toCenterX - dirX * nodeRadius;
            const toEdgeY = toCenterY - dirY * nodeRadius;
            
            // Apply perpendicular offset to edge points
            // Alternate offset direction for better visual separation
            const offsetDirection = offsetCount % 2 === 0 ? 1 : -1;
            const finalOffset = offset * offsetDirection;
            
            const offsetFromX = fromEdgeX + perpX * finalOffset;
            const offsetFromY = fromEdgeY + perpY * finalOffset;
            const offsetToX = toEdgeX + perpX * finalOffset;
            const offsetToY = toEdgeY + perpY * finalOffset;
            
            // Calculate the actual line length and angle
            const lineDx = offsetToX - offsetFromX;
            const lineDy = offsetToY - offsetFromY;
            const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
            const angle = Math.atan2(lineDy, lineDx) * 180 / Math.PI;
            
            const line = document.createElement('div');
            line.className = 'connection-line animated';
            line.dataset.from = fromAgent;
            line.dataset.to = toAgent;
            line.style.left = `${offsetFromX}px`;
            line.style.top = `${offsetFromY}px`;
            line.style.width = `${lineLength}px`;
            line.style.transform = `rotate(${angle}deg)`;
            
            graphContainer.appendChild(line);
            
            // After animation, transition to static line (but keep it visible)
            setTimeout(() => {
                line.classList.remove('animated');
                line.classList.add('static');
            }, 2000);
        };

        this.addLogEntry = (fromAgent, toAgent, message, logContainer = null, skipDuplicateCheck = false) => {
            const logEntries = logContainer || document.getElementById('logEntries');
            if (!logEntries) return;
            
            // Check if this exact log entry already exists (unless skipDuplicateCheck is true)
            if (!skipDuplicateCheck) {
                const existingEntries = logEntries.querySelectorAll('.log-entry');
                for (let entry of existingEntries) {
                    const agentsText = entry.querySelector('div:last-child').textContent;
                    const messageText = entry.querySelector('div:last-child').textContent;
                    if (agentsText.includes(`${fromAgent} → ${toAgent}`) && messageText.includes(message.substring(0, 30))) {
                        return; // Don't add duplicate log entries
                    }
                }
            }
            
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.style.cssText = `
                margin-bottom: 8px;
                padding: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                border-left: 3px solid #10b981;
            `;
            
            const timestamp = new Date().toLocaleTimeString();
            const truncatedMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;
            
            logEntry.innerHTML = `
                <div style="color: #6b7280; font-size: 0.8rem; margin-bottom: 4px;">${timestamp}</div>
                <div style="color: white; font-size: 0.9rem;">
                    <strong style="color: #10b981;">${fromAgent}</strong> 
                    <span style="color: #f59e0b;">→</span> 
                    <strong style="color: #3b82f6;">${toAgent}</strong>: 
                    <span style="color: #d1d5db;">${truncatedMessage}</span>
                </div>
            `;
            
            logEntries.appendChild(logEntry);
            logEntries.scrollTop = logEntries.scrollHeight;
        };





        this.restoreVisualizationState = () => {
            console.log('Restoring visualization state with', this.visualizationState.completedSteps.length, 'completed steps');
            
            // Clear existing connections first
            const existingConnections = graphContainer.querySelectorAll('.connection-line');
            existingConnections.forEach(conn => conn.remove());
            
            // Restore all completed connections
            this.visualizationState.completedSteps.forEach(step => {
                this.createStaticConnection(step.caller, step.talkto);
                this.updateAgentStatus(step.caller, 'idle');
                this.updateAgentStatus(step.talkto, 'idle');
            });
            
            // Restore log entries
            this.visualizationState.logEntries.forEach(entry => {
                this.addLogEntry(entry.caller, entry.talkto, entry.message, null, true); // true = skip duplicate check
            });
        };

        this.showCompletedCommunications = () => {
            // Clear existing connections first
            const existingConnections = graphContainer.querySelectorAll('.connection-line');
            existingConnections.forEach(conn => conn.remove());
            
            // Clear existing log entries to prevent duplicates
            const logEntries = document.getElementById('logEntries');
            if (logEntries) {
                logEntries.innerHTML = '';
            }
            
            // Show all completed communications as static connections
            for (let i = 0; i < this.currentStep; i++) {
                const step = this.communicationData[i];
                const { caller, talkto, message } = step;
                
                // Create static connection (no animation)
                this.createStaticConnection(caller, talkto);
                
                // Add log entry for completed communication
                this.addLogEntry(caller, talkto, message, null, true);
                
                // Update agent statuses based on the communication
                this.updateAgentStatus(caller, 'idle');
                this.updateAgentStatus(talkto, 'idle');
            }
        };

        this.createStaticConnection = (fromAgent, toAgent) => {
            const fromNode = document.getElementById(`agent-${fromAgent.replace(/\s+/g, '-')}`);
            const toNode = document.getElementById(`agent-${toAgent.replace(/\s+/g, '-')}`);
            
            if (!fromNode || !toNode) return;
            
            // Check if connection already exists
            const existingConnection = graphContainer.querySelector(`[data-from="${fromAgent}"][data-to="${toAgent}"]`);
            if (existingConnection) return; // Don't create duplicate connections
            
            const fromRect = fromNode.getBoundingClientRect();
            const toRect = toNode.getBoundingClientRect();
            const containerRect = graphContainer.getBoundingClientRect();
            
            // Calculate center positions
            const fromCenterX = fromRect.left - containerRect.left + fromRect.width / 2;
            const fromCenterY = fromRect.top - containerRect.top + fromRect.height / 2;
            const toCenterX = toRect.left - containerRect.left + toRect.width / 2;
            const toCenterY = toRect.top - containerRect.top + toRect.height / 2;
            
            // Calculate direction vector
            const dx = toCenterX - fromCenterX;
            const dy = toCenterY - fromCenterY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length === 0) return; // Same position
            
            // Normalize direction vector
            const dirX = dx / length;
            const dirY = dy / length;
            
            // Calculate perpendicular vector for offset
            const perpX = -dirY;
            const perpY = dirX;
            
            // Count existing connections between these agents to create offset
            const existingConnections = graphContainer.querySelectorAll('.connection-line');
            let offsetCount = 0;
            
            existingConnections.forEach(conn => {
                if ((conn.dataset.from === fromAgent && conn.dataset.to === toAgent) ||
                    (conn.dataset.from === toAgent && conn.dataset.to === fromAgent)) {
                    offsetCount++;
                }
            });
            
            // Calculate offset
            const offset = offsetCount * 8;
            const nodeRadius = 40;
            
            // Calculate edge points
            const fromEdgeX = fromCenterX + dirX * nodeRadius;
            const fromEdgeY = fromCenterY + dirY * nodeRadius;
            const toEdgeX = toCenterX - dirX * nodeRadius;
            const toEdgeY = toCenterY - dirY * nodeRadius;
            
            // Apply perpendicular offset
            const offsetDirection = offsetCount % 2 === 0 ? 1 : -1;
            const finalOffset = offset * offsetDirection;
            
            const offsetFromX = fromEdgeX + perpX * finalOffset;
            const offsetFromY = fromEdgeY + perpY * finalOffset;
            const offsetToX = toEdgeX + perpX * finalOffset;
            const offsetToY = toEdgeY + perpY * finalOffset;
            
            // Calculate line length and angle
            const lineDx = offsetToX - offsetFromX;
            const lineDy = offsetToY - offsetFromY;
            const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
            const angle = Math.atan2(lineDy, lineDx) * 180 / Math.PI;
            
            const line = document.createElement('div');
            line.className = 'connection-line static'; // Static, no animation
            line.dataset.from = fromAgent;
            line.dataset.to = toAgent;
            line.style.left = `${offsetFromX}px`;
            line.style.top = `${offsetFromY}px`;
            line.style.width = `${lineLength}px`;
            line.style.transform = `rotate(${angle}deg)`;
            
            graphContainer.appendChild(line);
        };

        this.updateAgentStatus = (agentName, status) => {
            const node = document.getElementById(`agent-${agentName.replace(/\s+/g, '-')}`);
            if (node) {
                node.className = `agent-node ${status}`;
                node.title = `${agentName} - ${status.charAt(0).toUpperCase() + status.slice(1)}`;
            }
        };

        this.stopVisualization = () => {
            this.isPlaying = false;
            this.isPaused = false;
        };

        this.delay = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };

        this.createConnection = (fromAgent, toAgent) => {
            const fromNode = document.getElementById(`agent-${fromAgent.replace(/\s+/g, '-')}`);
            const toNode = document.getElementById(`agent-${toAgent.replace(/\s+/g, '-')}`);
            
            if (!fromNode || !toNode) return;
            
            // Check if connection already exists
            const existingConnection = graphContainer.querySelector(`[data-from="${fromAgent}"][data-to="${toAgent}"]`);
            if (existingConnection) return; // Don't create duplicate connections
            
            const fromRect = fromNode.getBoundingClientRect();
            const toRect = toNode.getBoundingClientRect();
            const containerRect = graphContainer.getBoundingClientRect();
            
            // Calculate center positions
            const fromCenterX = fromRect.left - containerRect.left + fromRect.width / 2;
            const fromCenterY = fromRect.top - containerRect.top + fromRect.height / 2;
            const toCenterX = toRect.left - containerRect.left + toRect.width / 2;
            const toCenterY = toRect.top - containerRect.top + toRect.height / 2;
            
            // Calculate direction vector
            const dx = toCenterX - fromCenterX;
            const dy = toCenterY - fromCenterY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            if (length === 0) return; // Same position
            
            // Normalize direction vector
            const dirX = dx / length;
            const dirY = dy / length;
            
            // Calculate perpendicular vector for offset
            const perpX = -dirY;
            const perpY = dirX;
            
            // Count existing connections between these agents to create offset
            const existingConnections = graphContainer.querySelectorAll('.connection-line');
            let offsetCount = 0;
            
            existingConnections.forEach(conn => {
                if ((conn.dataset.from === fromAgent && conn.dataset.to === toAgent) ||
                    (conn.dataset.from === toAgent && conn.dataset.to === fromAgent)) {
                    offsetCount++;
                }
            });
            
            // Calculate offset
            const offset = offsetCount * 8;
            const nodeRadius = 40;
            
            // Calculate edge points
            const fromEdgeX = fromCenterX + dirX * nodeRadius;
            const fromEdgeY = fromCenterY + dirY * nodeRadius;
            const toEdgeX = toCenterX - dirX * nodeRadius;
            const toEdgeY = toCenterY - dirY * nodeRadius;
            
            // Apply perpendicular offset
            const offsetDirection = offsetCount % 2 === 0 ? 1 : -1;
            const finalOffset = offset * offsetDirection;
            
            const offsetFromX = fromEdgeX + perpX * finalOffset;
            const offsetFromY = fromEdgeY + perpY * finalOffset;
            const offsetToX = toEdgeX + perpX * finalOffset;
            const offsetToY = toEdgeY + perpY * finalOffset;
            
            // Calculate line length and angle
            const lineDx = offsetToX - offsetFromX;
            const lineDy = offsetToY - offsetFromY;
            const lineLength = Math.sqrt(lineDx * lineDx + lineDy * lineDy);
            const angle = Math.atan2(lineDy, lineDx) * 180 / Math.PI;
            
            const line = document.createElement('div');
            line.className = 'connection-line animated';
            line.dataset.from = fromAgent;
            line.dataset.to = toAgent;
            line.style.left = `${offsetFromX}px`;
            line.style.top = `${offsetFromY}px`;
            line.style.width = `${lineLength}px`;
            line.style.transform = `rotate(${angle}deg)`;
            
            graphContainer.appendChild(line);
            
            // After animation, transition to static line
            setTimeout(() => {
                line.classList.remove('animated');
                line.classList.add('static');
            }, 1500);
        };

        this.delay = (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };

        // Method to clear visualization data (same as Clear Data button)
        this.clearVisualizationData = async () => {
            try {
                // Clear backend data
                const response = await fetch('/api/clear-communication-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    // Clear the graph container
                    const graphContainer = document.getElementById('graph-container');
                    if (graphContainer) {
                        graphContainer.innerHTML = '<p style="color: white; text-align: center; margin-top: 2rem;">✅ All communication data cleared successfully.</p>';
                    }
                    // Reset local variables
                    this.communicationData = [];
                    this.currentStep = 0;
                    // Stop any ongoing animation
                    this.stopVisualization();
                } else {
                    console.error('Failed to clear backend data');
                }
            } catch (error) {
                console.error('Error clearing data:', error);
            }
        };


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