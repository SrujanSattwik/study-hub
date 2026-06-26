// KnowNook AI Chat - Gemini Integration
const API_KEY = 'AIzaSyD0zRyo_OGTAw2MbGTK9DUaIIKKPRj58qA';
const API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';

let uploadedImage = null;
let conversationHistory = [];

// Initialize chat
document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const fileUpload = document.getElementById('file-upload');
    const fileUploadBtn = document.querySelector('.file-upload-btn');

    chatForm.addEventListener('submit', handleSendMessage);
    fileUpload.addEventListener('change', handleFileUpload);
    
    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = chatInput.scrollHeight + 'px';
    });
});

async function handleSendMessage(e) {
    e.preventDefault();
    
    const chatInput = document.getElementById('chat-input');
    const chatBox = document.getElementById('chat-box');
    const message = chatInput.value.trim();
    
    if (!message && !uploadedImage) return;
    
    // Display user message
    appendMessage('user', message, uploadedImage);
    
    // Clear input
    chatInput.value = '';
    chatInput.style.height = 'auto';
    
    // Show typing indicator
    showTypingIndicator();
    
    const response = await sendToGemini(message, uploadedImage);
    hideTypingIndicator();
    appendMessage('bot', response);
    
    // Clear uploaded image
    uploadedImage = null;
    document.getElementById('file-upload').value = '';
}

async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file (PNG, JPG, JPEG, GIF, WEBP)');
        e.target.value = '';
        return;
    }
    
    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
        uploadedImage = {
            data: event.target.result.split(',')[1],
            mimeType: file.type
        };
        
        // Show preview
        const preview = document.createElement('div');
        preview.className = 'image-preview';
        preview.innerHTML = `
            <img src="${event.target.result}" alt="Upload preview">
            <button onclick="clearImageUpload()" class="clear-preview">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        const existingPreview = document.querySelector('.image-preview');
        if (existingPreview) existingPreview.remove();
        
        document.querySelector('.chat-input-container').insertBefore(
            preview, 
            document.getElementById('chat-form')
        );
    };
    reader.readAsDataURL(file);
}

function clearImageUpload() {
    uploadedImage = null;
    document.getElementById('file-upload').value = '';
    const preview = document.querySelector('.image-preview');
    if (preview) preview.remove();
}

async function sendToGemini(text, image) {
    const parts = [];
    
    if (text) {
        parts.push({ text: text });
    }
    
    if (image) {
        parts.push({
            inline_data: {
                mime_type: image.mimeType,
                data: image.data
            }
        });
    }
    
    const requestBody = {
        contents: [{
            parts: parts
        }]
    };
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': API_KEY
            },
            body: JSON.stringify(requestBody)
        });
        
        const data = await response.json();
        console.log('API Response:', data);
        
        if (!response.ok) {
            console.error('API Error:', data);
            return `Error: ${data.error?.message || 'Failed to get response'}`;
        }
        
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
            return data.candidates[0].content.parts[0].text;
        }
        
        if (data.promptFeedback?.blockReason) {
            return `Content blocked: ${data.promptFeedback.blockReason}`;
        }
        
        return 'No response generated. Please try rephrasing your question.';
    } catch (error) {
        console.error('Fetch Error:', error);
        return `Network error: ${error.message}`;
    }
}

function appendMessage(sender, text, image = null) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = `<i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (image) {
        const img = document.createElement('img');
        img.src = `data:${image.mimeType};base64,${image.data}`;
        img.className = 'message-image';
        contentDiv.appendChild(img);
    }
    
    if (text) {
        const p = document.createElement('p');
        p.innerHTML = formatMessage(text);
        contentDiv.appendChild(p);
    }
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function formatMessage(text) {
    // Convert markdown-style formatting to HTML
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
    const chatBox = document.getElementById('chat-box');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot typing-indicator';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTypingIndicator() {
    const indicator = document.querySelector('.typing-indicator');
    if (indicator) indicator.remove();
}
