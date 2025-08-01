# Integration Guide: Connecting Your Supervisor with the Chat GUI

## Overview

This guide explains how to integrate your existing supervisor/LLM code with the chat GUI. The GUI is designed to work with any supervisor that follows a simple interface.

## Quick Integration Steps

### 1. Understand the Interface

Your supervisor needs to implement a method with this signature:

```python
def process_user_input(self, user_input: str, show_thoughts: bool = False):
    """
    Process user input and yield responses.
    
    Args:
        user_input: The user's message
        show_thoughts: Whether to show thinking process
        
    Yields:
        dict: Response dictionaries with format:
        {
            'type': 'thought' | 'final_response' | 'error',
            'content': 'message content',
            'timestamp': 'ISO timestamp string'
        }
    """
```

### 2. Replace the Mock Supervisor

In `app.py`, replace:

```python
# Current mock implementation
supervisor = MockSupervisor()
```

With your actual supervisor:

```python
# Your actual supervisor
from your_supervisor_module import YourSupervisor
supervisor = YourSupervisor()
```

### 3. Implement the Required Method

Your supervisor class should have a `process_user_input` method that yields responses:

```python
class YourSupervisor:
    def __init__(self):
        # Initialize your LLM and other components
        self.llm = your_llm_initialization()
        
    def process_user_input(self, user_input, show_thoughts=False):
        from datetime import datetime
        
        # Show thinking process if enabled
        if show_thoughts:
            yield {
                'type': 'thought',
                'content': 'Processing your request...',
                'timestamp': datetime.now().isoformat()
            }
        
        # Your actual LLM processing here
        response = self.llm.generate(user_input)
        
        # Yield final response
        yield {
            'type': 'final_response',
            'content': response,
            'timestamp': datetime.now().isoformat()
        }
```

## Message Types

### 1. User Messages (`user_message`)
- Automatically handled by the GUI
- No action needed from your supervisor

### 2. Thoughts (`thought`)
- Show AI thinking process
- Only sent when `show_thoughts=True`
- Use for intermediate processing steps

### 3. Final Response (`final_response`)
- The main AI response
- Always sent after processing
- This is what the user sees as the AI's answer

### 4. Errors (`error`)
- Error messages
- Sent when exceptions occur
- Automatically handled by the GUI

## Advanced Integration Examples

### Example 1: Simple LLM Integration

```python
class SimpleLLMSupervisor:
    def __init__(self):
        # Initialize your LLM (e.g., OpenAI, Anthropic, etc.)
        self.llm = your_llm_client()
        
    def process_user_input(self, user_input, show_thoughts=False):
        from datetime import datetime
        
        if show_thoughts:
            yield {
                'type': 'thought',
                'content': 'Sending request to LLM...',
                'timestamp': datetime.now().isoformat()
            }
        
        # Call your LLM
        response = self.llm.chat.completions.create(
            messages=[{"role": "user", "content": user_input}]
        )
        
        yield {
            'type': 'final_response',
            'content': response.choices[0].message.content,
            'timestamp': datetime.now().isoformat()
        }
```

### Example 2: Streaming LLM Responses

```python
class StreamingSupervisor:
    def __init__(self):
        self.llm = your_streaming_llm()
        
    def process_user_input(self, user_input, show_thoughts=False):
        from datetime import datetime
        
        if show_thoughts:
            yield {
                'type': 'thought',
                'content': 'Starting streaming response...',
                'timestamp': datetime.now().isoformat()
            }
        
        # Stream response from LLM
        accumulated_response = ""
        for chunk in self.llm.stream_generate(user_input):
            accumulated_response += chunk
            yield {
                'type': 'final_response',
                'content': accumulated_response,
                'timestamp': datetime.now().isoformat()
            }
```

### Example 3: Context-Aware Supervisor

```python
class ContextAwareSupervisor:
    def __init__(self):
        self.llm = your_llm()
        self.conversation_history = []
        
    def process_user_input(self, user_input, show_thoughts=False):
        from datetime import datetime
        
        # Add user input to history
        self.conversation_history.append({
            "role": "user",
            "content": user_input
        })
        
        if show_thoughts:
            yield {
                'type': 'thought',
                'content': f'Processing message #{len(self.conversation_history)}...',
                'timestamp': datetime.now().isoformat()
            }
        
        # Generate response with context
        response = self.llm.generate_with_context(
            self.conversation_history
        )
        
        # Add response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": response
        })
        
        yield {
            'type': 'final_response',
            'content': response,
            'timestamp': datetime.now().isoformat()
        }
```

## Error Handling

Always wrap your processing in try-catch blocks:

```python
def process_user_input(self, user_input, show_thoughts=False):
    from datetime import datetime
    
    try:
        # Your processing logic here
        response = self.llm.process(user_input)
        
        yield {
            'type': 'final_response',
            'content': response,
            'timestamp': datetime.now().isoformat()
        }
        
    except Exception as e:
        yield {
            'type': 'error',
            'content': f'Error: {str(e)}',
            'timestamp': datetime.now().isoformat()
        }
```

## Testing Your Integration

1. **Run the test script**:
   ```bash
   python3 test_chat.py
   ```

2. **Test the GUI**:
   ```bash
   python3 app.py
   ```
   Then open `http://localhost:5000` in your browser.

3. **Test with your supervisor**:
   - Replace `MockSupervisor` with your supervisor
   - Test both with and without thoughts enabled
   - Verify error handling works

## Common Issues and Solutions

### Issue: Messages not appearing
- Check that your supervisor yields dictionaries with correct format
- Verify all required fields (`type`, `content`, `timestamp`) are present
- Check Flask server logs for errors

### Issue: Thoughts not showing
- Ensure `show_thoughts` parameter is being used
- Check that thoughts are yielded before final response
- Verify toggle is enabled in GUI

### Issue: Slow responses
- Consider using async processing for long operations
- Implement streaming responses for better UX
- Add progress indicators in thoughts

### Issue: Connection errors
- Check that Flask server is running
- Verify Socket.IO connection is established
- Check browser console for JavaScript errors

## Performance Tips

1. **Use streaming** for long responses
2. **Implement caching** for repeated queries
3. **Add progress indicators** in thoughts
4. **Handle timeouts** gracefully
5. **Use async processing** for heavy operations

## Security Considerations

1. **Validate user input** before processing
2. **Sanitize responses** before sending to frontend
3. **Implement rate limiting** if needed
4. **Add authentication** for production use
5. **Use HTTPS** in production

## Next Steps

1. Replace `MockSupervisor` with your actual supervisor
2. Test the integration thoroughly
3. Customize the UI as needed
4. Add any additional features
5. Deploy to production

For questions or issues, refer to the main README.md file or check the Flask server logs for debugging information.