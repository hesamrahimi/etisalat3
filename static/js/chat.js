// Initialize Socket.IO connection
const socket = io();

// DOM elements
const chatMessages = document.getElementById('chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const charCount = document.getElementById('char-count');
const statusIndicator = document.getElementById('status-indicator');
const thoughtsToggle = document.getElementById('thoughts-toggle');

// Set welcome message timestamp
document.getElementById('welcome-time').textContent = formatTimestamp(new Date());

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    
    // Update character count
    const count = this.value.length;
    charCount.textContent = count;
    
    // Enable/disable send button
    sendButton.disabled = count === 0 || count > 2000;
});

// Send message on Enter (Shift+Enter for new line)
messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Send message on button click
sendButton.addEventListener('click', sendMessage);

// Socket.IO event handlers
socket.on('connect', function() {
    console.log('Connected to server');
    statusIndicator.textContent = 'Connected';
    statusIndicator.className = 'status-indicator';
});

socket.on('disconnect', function() {
    console.log('Disconnected from server');
    statusIndicator.textContent = 'Disconnected';
    statusIndicator.className = 'status-indicator';
});

socket.on('connection_status', function(data) {
    console.log('Connection status:', data.status);
});

socket.on('receive_message', function(data) {
    handleIncomingMessage(data);
});

// Handle incoming messages
function handleIncomingMessage(data) {
    const { type, content, timestamp, sender, metadata } = data;
    
    switch (type) {
        case 'user_message':
            addMessage(content, 'user', timestamp);
            break;
        case 'thought':
            addThoughtMessage(content, timestamp, metadata);
            break;
        case 'final_response':
            addMessage(content, 'ai', timestamp, 'final');
            break;
        case 'error':
            addErrorMessage(content, timestamp);
            break;
    }
    
    scrollToBottom();
}

// Send message function
function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || message.length > 2000) return;
    
    // Show typing indicator
    statusIndicator.textContent = 'AI is thinking...';
    statusIndicator.className = 'status-indicator typing';
    
    // Send message to server
    socket.emit('send_message', {
        message: message,
        show_thoughts: thoughtsToggle.checked
    });
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    charCount.textContent = '0';
    sendButton.disabled = true;
    
    // Reset status after a delay
    setTimeout(() => {
        statusIndicator.textContent = 'Ready';
        statusIndicator.className = 'status-indicator';
    }, 1000);
}

// Add message to chat
function addMessage(content, sender, timestamp, messageType = 'normal') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    if (messageType === 'thought') {
        messageDiv.classList.add('thought-message');
    }
    
    const avatar = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    const avatarBg = sender === 'user' ? 'user-avatar' : 'ai-avatar';
    
    messageDiv.innerHTML = `
        <div class="message-avatar ${avatarBg}">
            <i class="${avatar}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">
                ${escapeHtml(content)}
            </div>
            <div class="message-timestamp">
                <i class="fas fa-clock"></i>
                <span>${formatTimestamp(new Date(timestamp))}</span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Add thought message with progress indicator
function addThoughtMessage(content, timestamp, metadata) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message thought-message';
    
    const progressText = metadata && metadata.thought_number && metadata.total_thoughts 
        ? ` (${metadata.thought_number}/${metadata.total_thoughts})`
        : '';
    
    messageDiv.innerHTML = `
        <div class="message-avatar ai-avatar">
            <i class="fas fa-brain"></i>
        </div>
        <div class="message-content">
            <div class="message-text">
                <div class="thought-content">
                    <i class="fas fa-lightbulb thought-icon"></i>
                    ${escapeHtml(content)}
                </div>
                ${progressText ? `<div class="thought-progress">${progressText}</div>` : ''}
            </div>
            <div class="message-timestamp">
                <i class="fas fa-clock"></i>
                <span>${formatTimestamp(new Date(timestamp))}</span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Add error message
function addErrorMessage(content, timestamp) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message error-message';
    
    messageDiv.innerHTML = `
        <div class="message-avatar ai-avatar">
            <i class="fas fa-exclamation-triangle"></i>
        </div>
        <div class="message-content">
            <div class="message-text">
                <i class="fas fa-exclamation-circle"></i>
                ${escapeHtml(content)}
            </div>
            <div class="message-timestamp">
                <i class="fas fa-clock"></i>
                <span>${formatTimestamp(new Date(timestamp))}</span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
}

// Utility functions
function formatTimestamp(date) {
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
        scrollToBottom();
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    scrollToBottom();
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    scrollToBottom();
    messageInput.focus();
});