# AI Chat Assistant GUI

A modern, professional web-based chat interface for interacting with AI agents and LLM supervisors. Built with Flask, Socket.IO, and modern web technologies.

## Features

- 🎨 **Modern UI**: Clean, professional design similar to ChatGPT
- 💬 **Real-time Chat**: Instant message delivery using WebSocket connections
- 🤔 **Thought Process**: Toggle to show AI thinking process (when enabled)
- ⏰ **Timestamps**: All messages include timestamps
- 📱 **Responsive**: Works on desktop and mobile devices
- ⌨️ **Smart Input**: Auto-resizing textarea with character limits
- 🔄 **Streaming**: Support for streaming responses from AI agents

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

### 3. Open in Browser

Navigate to `http://localhost:5000` in your web browser.

## Project Structure

```
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Modern CSS styles
│   └── js/
│       └── chat.js       # Frontend JavaScript
└── README.md             # This file
```

## Integration with Your Supervisor

### Current Mock Implementation

The current `MockSupervisor` class in `app.py` simulates your actual supervisor:

```python
class MockSupervisor:
    def process_user_input(self, user_input, show_thoughts=False):
        # Simulate thinking process
        thoughts = [
            "Analyzing user input...",
            "Understanding the context...",
            "Generating appropriate response...",
            "Finalizing the answer..."
        ]
        
        # Simulate streaming thoughts
        for thought in thoughts:
            if show_thoughts:
                yield {
                    'type': 'thought',
                    'content': thought,
                    'timestamp': datetime.now().isoformat()
                }
            time.sleep(0.5)
        
        # Final response
        final_response = f"Thank you for your message: '{user_input}'. This is a mock response."
        
        yield {
            'type': 'final_response',
            'content': final_response,
            'timestamp': datetime.now().isoformat()
        }
```

### Integration Steps

1. **Replace MockSupervisor**: Replace the `MockSupervisor` class with your actual supervisor class.

2. **Implement Required Interface**: Your supervisor should have a method that:
   - Takes `user_input` (string) and `show_thoughts` (boolean) as parameters
   - Uses `yield` to stream responses
   - Returns dictionaries with the following structure:
     ```python
     {
         'type': 'thought' | 'final_response' | 'error',
         'content': 'message content',
         'timestamp': 'ISO timestamp'
     }
     ```

3. **Example Integration**:
   ```python
   # Replace this line in app.py
   supervisor = MockSupervisor()
   
   # With your actual supervisor
   from your_supervisor_module import YourSupervisor
   supervisor = YourSupervisor()
   ```

### How the GUI Receives User Input

The GUI sends user input to your supervisor through the following flow:

1. **User types message** → Frontend JavaScript captures input
2. **Send button clicked** → Socket.IO emits `send_message` event
3. **Flask receives event** → `handle_message()` function processes it
4. **Supervisor called** → `supervisor.process_user_input(user_input, show_thoughts)`
5. **Streaming response** → Each `yield` from supervisor is sent to frontend
6. **Frontend displays** → Messages appear in chat interface

### Message Types

- `user_message`: User's input message
- `thought`: AI thinking process (when toggle is enabled)
- `final_response`: Final AI response
- `error`: Error messages

## Customization

### Styling

Modify `static/css/style.css` to customize:
- Colors and gradients
- Message bubble styles
- Animations
- Responsive breakpoints

### Functionality

Modify `static/js/chat.js` to customize:
- Message handling
- UI interactions
- Socket.IO events

### Backend

Modify `app.py` to customize:
- Supervisor integration
- Message processing
- Error handling

## Development

### Running in Development Mode

```bash
python app.py
```

The application runs with debug mode enabled by default.

### Production Deployment

For production, consider:
- Using a production WSGI server (Gunicorn, uWSGI)
- Setting up proper SSL certificates
- Configuring environment variables
- Using a reverse proxy (Nginx)

## Troubleshooting

### Common Issues

1. **Socket.IO Connection Failed**
   - Check if the Flask server is running
   - Verify port 5000 is not blocked
   - Check browser console for errors

2. **Messages Not Appearing**
   - Check browser console for JavaScript errors
   - Verify Socket.IO events are being emitted/received
   - Check Flask server logs

3. **Styling Issues**
   - Clear browser cache
   - Check if CSS file is being served correctly
   - Verify file paths in HTML template

## License

This project is open source and available under the MIT License.
