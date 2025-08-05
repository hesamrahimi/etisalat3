from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_socketio import SocketIO, emit
import time
import json
import ast
from datetime import datetime
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
socketio = SocketIO(app, cors_allowed_origins="*")

# Simple user credentials (in production, use proper authentication)
USERS = {
    'admin': 'password123',
    'user': 'password123'
}

def login_required(f):
    """Decorator to check if user is logged in"""
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Log parser class to handle the logs.txt format
class LogParser:
    def __init__(self, log_file_path='logs.txt'):
        self.log_file_path = log_file_path
        self.current_log_index = 0
        self.parsed_thoughts = []
        self._parse_logs()
    
    def _parse_logs(self):
        """Parse the logs.txt file and extract thought messages"""
        try:
            with open(self.log_file_path, 'r', encoding='utf-8') as file:
                content = file.read()
        except FileNotFoundError:
            print(f"Log file {self.log_file_path} not found. Using empty thoughts list.")
            return
        except Exception as e:
            print(f"Error reading log file: {e}")
            return
        
        # Split by the separator "----"
        log_entries = content.split('----')
        
        for entry in log_entries:
            entry = entry.strip()
            if not entry:
                continue
            
            # Extract thought content using regex
            thought_content = self._extract_thought_content(entry)
            if thought_content:
                self.parsed_thoughts.append(thought_content)
    
    def _extract_thought_content(self, entry):
        """Extract thought content from log entry using regex"""
        import re
        
        # Look for HumanMessage patterns
        # Pattern: HumanMessage(content='...', ...)
        human_message_pattern = r"HumanMessage\(content='([^']*)'"
        matches = re.findall(human_message_pattern, entry)
        
        if matches:
            # Return the first HumanMessage content found
            return matches[0]
        
        # If no HumanMessage found, look for any content in quotes that might be a thought
        # This is a fallback for other message types
        content_pattern = r"content='([^']*)'"
        matches = re.findall(content_pattern, entry)
        
        if matches:
            # Return the first content found
            return matches[0]
        
        return None
    
    def get_thoughts(self):
        """Return all parsed thoughts"""
        return self.parsed_thoughts
    
    def get_next_thought(self):
        """Get the next thought in sequence"""
        if self.current_log_index < len(self.parsed_thoughts):
            thought = self.parsed_thoughts[self.current_log_index]
            self.current_log_index += 1
            return thought
        return None
    
    def reset_index(self):
        """Reset the index to start from the beginning"""
        self.current_log_index = 0

# Mock supervisor class - this will be replaced with your actual supervisor
class MockSupervisor:
    def __init__(self):
        self.log_parser = LogParser()
    
    def process_user_input(self, user_input, show_thoughts=False):
        """
        Mock supervisor that yields thoughts from logs.txt and final response
        This will be replaced with your actual supervisor integration
        """
        # Reset the log parser index for new conversation
        self.log_parser.reset_index()
        
        # Simulate thinking process with thoughts from logs.txt
        thoughts = self.log_parser.get_thoughts()
        
        # Stream thoughts from the logs
        for i, thought in enumerate(thoughts):
            if show_thoughts and thought:
                yield {
                    'type': 'thought',
                    'content': thought,
                    'timestamp': datetime.now().isoformat(),
                    'thought_number': i + 1,
                    'total_thoughts': len(thoughts)
                }
                time.sleep(random.uniform(0.5, 1.2))  # Variable processing time
        
        # Generate contextual final response
        final_response = self._generate_response(user_input)
        
        yield {
            'type': 'final_response',
            'content': final_response,
            'timestamp': datetime.now().isoformat()
        }
    
    def _generate_response(self, user_input):
        """Generate contextual responses based on user input"""
        user_input_lower = user_input.lower()
        
        if any(word in user_input_lower for word in ['hello', 'hi', 'hey']):
            return "Hello! I'm Huawei Network Planning AI Assistant, for Etisalat (e&). I can help you with network planning, optimization, capacity analysis, and technical solutions. How can I assist you with your network planning needs today?"
        
        elif any(word in user_input_lower for word in ['help', 'assist', 'support']):
            return "I'm here to help with all your network planning needs! I can assist with coverage analysis, capacity planning, frequency optimization, site selection, traffic engineering, and network performance optimization. What specific aspect of network planning do you need help with?"
        
        elif any(word in user_input_lower for word in ['coverage', 'signal', 'cell']):
            return "For coverage analysis, I can help you with cell site planning, signal strength optimization, coverage gap identification, and interference analysis. I can also provide recommendations for optimal antenna placement and power settings to maximize coverage efficiency."
        
        elif any(word in user_input_lower for word in ['capacity', 'traffic', 'load']):
            return "Capacity planning is crucial for network performance. I can analyze traffic patterns, predict capacity requirements, optimize resource allocation, and help you plan for future growth. This includes analyzing peak hour traffic, seasonal variations, and growth projections."
        
        elif any(word in user_input_lower for word in ['frequency', 'spectrum', 'band']):
            return "Frequency planning and spectrum optimization are key to minimizing interference and maximizing network efficiency. I can help with frequency allocation strategies, interference analysis, and spectrum utilization optimization for both 4G and 5G networks."
        
        elif any(word in user_input_lower for word in ['5g', '5 g', 'fifth generation']):
            return "5G network planning requires special considerations including mmWave deployment, small cell densification, network slicing, and edge computing integration. I can help you plan 5G rollouts, optimize coverage for different frequency bands, and ensure seamless integration with existing 4G infrastructure."
        
        elif any(word in user_input_lower for word in ['optimization', 'optimize', 'performance']):
            return "Network optimization involves continuous monitoring and improvement of network performance. I can help with parameter optimization, handover optimization, load balancing, and quality of service improvements. This includes analyzing KPIs and providing actionable recommendations."
        
        elif any(word in user_input_lower for word in ['site', 'location', 'placement']):
            return "Site selection and placement are critical for optimal network coverage. I can help you analyze terrain data, population density, traffic patterns, and existing infrastructure to recommend optimal site locations. This includes consideration of zoning restrictions and environmental factors."
        
        elif any(word in user_input_lower for word in ['huawei', 'etisalat']):
            return "As Huawei Network Planning AI Assistant, for Etisalat (e&), I'm specifically designed to work with Huawei equipment and Etisalat's network infrastructure. I can provide recommendations tailored to Huawei's product portfolio and Etisalat's operational requirements and standards."
        
        elif any(word in user_input_lower for word in ['thank', 'thanks']):
            return "You're welcome! I'm glad I could help with your network planning needs. If you have any other questions about network optimization, capacity planning, or technical solutions, feel free to ask!"
        
        elif len(user_input) < 10:
            return "I see you've sent a brief message. Could you please provide more details about your network planning question? I can help with coverage analysis, capacity planning, frequency optimization, site selection, and many other network planning aspects."
        
        else:
            return f"Thank you for your network planning query: '{user_input}'. As Huawei Network Planning AI Assistant, for Etisalat (e&), I can help you with comprehensive network analysis, optimization recommendations, and technical solutions. In the real implementation, this will come from your actual network planning supervisor with detailed analysis and specific recommendations for your network infrastructure."

# Global supervisor instance
supervisor = MockSupervisor()

@app.route('/')
def index():
    """Redirect to login if not authenticated, otherwise to dashboard"""
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return redirect(url_for('dashboard'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    """Login page and authentication"""
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username in USERS and USERS[username] == password:
            session['user_id'] = username
            return redirect(url_for('dashboard'))
        else:
            return render_template('login.html', error='Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    """Logout user and clear session"""
    session.clear()
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard page (current chat interface)"""
    return render_template('dashboard.html', username=session.get('user_id'))

@app.route('/health')
def health_check():
    """Health check endpoint for monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'service': "Huawei Network Planning AI Assistant for Etisalat (e&)"
    })

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    print(f"Client connected: {request.sid}")
    emit('connection_status', {'status': 'connected'})

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnection"""
    print(f"Client disconnected: {request.sid}")

@socketio.on('send_message')
def handle_message(data):
    """Handle incoming messages from the frontend"""
    user_input = data.get('message', '').strip()
    show_thoughts = data.get('show_thoughts', False)
    
    if not user_input:
        emit('receive_message', {
            'type': 'error',
            'content': 'Please enter a network planning question before sending.',
            'timestamp': datetime.now().isoformat(),
            'sender': 'ai'
        })
        return
    
    # Emit user message back to confirm receipt
    emit('receive_message', {
        'type': 'user_message',
        'content': user_input,
        'timestamp': datetime.now().isoformat(),
        'sender': 'user'
    })
    
    # Process with supervisor (mock for now)
    try:
        for response in supervisor.process_user_input(user_input, show_thoughts):
            emit('receive_message', {
                'type': response['type'],
                'content': response['content'],
                'timestamp': response['timestamp'],
                'sender': 'ai',
                'metadata': {k: v for k, v in response.items() if k not in ['type', 'content', 'timestamp']}
            })
            socketio.sleep(0.1)  # Small delay for smooth streaming
    except Exception as e:
        print(f"Error processing message: {str(e)}")
        emit('receive_message', {
            'type': 'error',
            'content': f"Sorry, I encountered an error while processing your network planning query. Please try again. Error: {str(e)}",
            'timestamp': datetime.now().isoformat(),
            'sender': 'ai'
        })

if __name__ == '__main__':
    print("Starting Huawei Network Planning AI Assistant, for Etisalat (e&)...")
    print("Access the application at: http://localhost:5000")
    print("Health check available at: http://localhost:5000/health")
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)