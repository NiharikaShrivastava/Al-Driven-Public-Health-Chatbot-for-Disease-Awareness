document.addEventListener('DOMContentLoaded', async () => {
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');
    const chatMessages = document.getElementById('chat-messages');

    // Import WebLLM from esm.run CDN
    const { CreateMLCEngine } = await import('https://esm.run/@mlc-ai/web-llm');

    // System prompt for health awareness
    const SYSTEM_PROMPT = {
        role: 'system',
        content: 'You are a public health awareness assistant. Provide factual information on diseases based on trusted sources. Cover symptoms, prevention, and treatment where relevant. Always remind: This is not medical advice—consult a doctor. Keep responses concise and professional.'
    };

    // Model selection (small and fast for browser)
    const selectedModel = 'Phi-3-mini-4k-instruct-q4f32_1-MLC';

    // Initialize engine
    let engine;
    try {
        engine = await CreateMLCEngine(selectedModel, {
            initProgressCallback: (progress) => {
                console.log('Loading model:', progress.text);
                if (!chatMessages.querySelector('.loading-message')) {
                    addMessage('Loading AI model... This may take a few minutes on first run.', 'bot');
                }
            }
        });
        // Remove loading message after init
        const loadingMsg = chatMessages.querySelector('.loading-message');
        if (loadingMsg) loadingMsg.remove();
        addMessage('AI model loaded! Ask about any disease.', 'bot');
    } catch (error) {
        console.error('Failed to load model:', error);
        addMessage('Error loading AI model. Please refresh and ensure WebGPU is enabled in your browser (e.g., Chrome).', 'bot');
        return;
    }

    // Conversation history
    let messages = [SYSTEM_PROMPT];

    // Function to add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', sender);
        if (sender === 'bot' && text.includes('Loading')) {
            messageDiv.classList.add('loading-message');
        }
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Event listener for form submit
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userQuery = userInput.value.trim();
        if (!userQuery) return;

        addMessage(userQuery, 'user');
        userInput.value = '';

        // Add user message to history
        messages.push({ role: 'user', content: userQuery });

        addMessage('Thinking...', 'bot');  // Placeholder

        try {
            // Generate response (non-streaming for simplicity)
            const reply = await engine.chat.completions.create({
                messages: messages,
                max_tokens: 300,
                temperature: 0.7
            });

            const botResponse = reply.choices[0].message.content.trim();

            // Remove placeholder
            chatMessages.lastChild.remove();

            addMessage(botResponse, 'bot');

            // Add bot response to history for context
            messages.push({ role: 'assistant', content: botResponse });
        } catch (error) {
            console.error('Generation error:', error);
            chatMessages.lastChild.remove();
            addMessage('Sorry, there was an issue generating the response. Try again.', 'bot');
        }
    });

    // Initial bot message
    addMessage('Hello! I\'m a local AI health assistant. Ask about any disease (e.g., "What are symptoms of asthma?"). No internet needed after loading!', 'bot');
});