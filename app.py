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

# Communication parser class to handle the logs_new.txt format
class CommunicationParser:
    def __init__(self, log_file_path='logs_new.txt'):
        self.log_file_path = log_file_path
        self.communication_data = []
        # For real-time integration, we'll add entries as they come
        self._parse_communications()
    
    def _parse_communications(self):
        """Parse the logs_new.txt file and extract communication data"""
        try:
            with open(self.log_file_path, 'r', encoding='utf-8') as file:
                content = file.read()
        except FileNotFoundError:
            print(f"Communication log file {self.log_file_path} not found. Using empty communication list.")
            return
        except Exception as e:
            print(f"Error reading communication log file: {e}")
            return
        
        # Split by the separator "----"
        log_entries = content.split('----')
        
        for entry in log_entries:
            entry = entry.strip()
            if not entry:
                continue
            
            # Extract communication data
            communication = self._extract_communication_data(entry)
            if communication:
                self.communication_data.append(communication)
    
    def add_communication_entry(self, entry_data):
        """
        Add a new communication entry in real-time
        This method will be called by your LangGraph supervisor as it yields responses
        
        Args:
            entry_data: Dictionary with 'caller', 'talkto', 'message' keys
        """
        if entry_data and isinstance(entry_data, dict):
            # Add timestamp if not present
            if 'timestamp' not in entry_data:
                entry_data['timestamp'] = datetime.now().isoformat()
            
            self.communication_data.append(entry_data)
            print(f"Added communication entry: {entry_data['caller']} -> {entry_data['talkto']}")
    
    def reset_communications(self):
        """Reset communication data for new conversation"""
        self.communication_data = []
        print("Communication data reset for new conversation")
    
    def get_latest_communications(self, count=None):
        """
        Get the latest communication entries
        Useful for real-time updates to visualization
        
        Args:
            count: Number of latest entries to return (None for all)
        """
        if count is None:
            return self.communication_data
        return self.communication_data[-count:] if self.communication_data else []
    
    def _extract_communication_data(self, entry):
        """Extract communication data from log entry"""
        import re
        
        try:
            # Look for various communication patterns in the log entry
            
            # Pattern 1: ((), {'Agent': {'caller': 'X', 'talkto': 'Y', 'messages': [...]}})
            pattern1 = r"\(\(\)\s*,\s*\{'([^']+)':\s*\{'caller':\s*'([^']+)',\s*'talkto':\s*'([^']+)',\s*'messages':\s*\[([^\]]+)\]"
            matches1 = re.findall(pattern1, entry)
            
            if matches1:
                agent_name, caller, talkto, messages_str = matches1[0]
                # Extract message content
                content_match = re.search(r"content='([^']*)'", messages_str)
                if content_match:
                    message = content_match.group(1)
                else:
                    # Fallback: extract any quoted string as message
                    quoted_match = re.search(r"'([^']*)'", messages_str)
                    message = quoted_match.group(1) if quoted_match else "Processing request..."
                
                return {
                    'caller': caller,
                    'talkto': talkto,
                    'message': message,
                    'timestamp': datetime.now().isoformat()
                }
            
            # Pattern 2: ((), {'Agent': {'caller': 'X', 'messages': [...], 'talkto': 'Y'}})
            pattern2 = r"\(\(\)\s*,\s*\{'([^']+)':\s*\{'caller':\s*'([^']+)',\s*'messages':\s*\[([^\]]+)\],\s*'talkto':\s*'([^']+)'"
            matches2 = re.findall(pattern2, entry)
            
            if matches2:
                agent_name, caller, messages_str, talkto = matches2[0]
                # Extract message content
                content_match = re.search(r"content='([^']*)'", messages_str)
                if content_match:
                    message = content_match.group(1)
                else:
                    # Fallback: extract any quoted string as message
                    quoted_match = re.search(r"'([^']*)'", messages_str)
                    message = quoted_match.group(1) if quoted_match else "Processing request..."
                
                return {
                    'caller': caller,
                    'talkto': talkto,
                    'message': message,
                    'timestamp': datetime.now().isoformat()
                }
            
            # Pattern 3: ((), {'Agent': {'caller': 'X', 'talkto': 'Y', 'messages': ['simple string']}})
            pattern3 = r"\(\(\)\s*,\s*\{'([^']+)':\s*\{'caller':\s*'([^']+)',\s*'talkto':\s*'([^']+)',\s*'messages':\s*\[([^\]]+)\]"
            matches3 = re.findall(pattern3, entry)
            
            if matches3:
                agent_name, caller, talkto, messages_str = matches3[0]
                # Extract simple string message
                quoted_match = re.search(r"'([^']*)'", messages_str)
                message = quoted_match.group(1) if quoted_match else "Processing request..."
                
                return {
                    'caller': caller,
                    'talkto': talkto,
                    'message': message,
                    'timestamp': datetime.now().isoformat()
                }
            
            # Pattern 4: Check for agent responses with tool calls (these are internal processing)
            # These don't represent communication between agents, so we skip them
            if "tool_calls" in entry or "ToolMessage" in entry or "AIMessage" in entry:
                return None
            
            return None
        except Exception as e:
            print(f"Error parsing communication entry: {e}")
            return None
    
    def get_communication_data(self):
        """Return all parsed communication data"""
        return self.communication_data
    
    def get_communication_flow(self):
        """Return communication flow for visualization"""
        flow = []
        for comm in self.communication_data:
            if comm:
                # Map "Checker" to "User" for visualization
                caller = "User" if comm['caller'] == "Checker" else comm['caller']
                talkto = "User" if comm['talkto'] == "Checker" else comm['talkto']
                
                flow.append({
                    'caller': caller,
                    'talkto': talkto,
                    'message': comm['message'],
                    'timestamp': comm['timestamp']
                })
        return flow

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

# Real supervisor integration class for LangGraph
class RealSupervisor:
    def __init__(self):
        self.communication_parser = CommunicationParser()
        # You'll need to import and initialize your actual LangGraph supervisor here
        # self.your_langgraph_supervisor = YourLangGraphSupervisor()
    
    def process_user_input(self, user_input, show_thoughts=False):
        """
        Process user input with real LangGraph supervisor
        This method will be called by the Flask app when a message is received
        
        Args:
            user_input: The user's message
            show_thoughts: Whether to show intermediate thoughts
            
        Yields:
            Dictionary with response data for the frontend
        """
        # Reset communication data for new conversation
        self.communication_parser.reset_communications()
        
        try:
            # TODO: Replace this with your actual LangGraph supervisor initialization
            # workflow = self.your_langgraph_supervisor.graph.compile()
            
            # For now, we'll simulate the LangGraph workflow
            # In your real implementation, you would do:
            # for s in workflow.stream({"user_input": user_input}):
            
            # Simulate LangGraph streaming (replace this with your actual implementation)
            simulated_responses = self._simulate_langgraph_streaming(user_input)
            
            for response in simulated_responses:
                # Extract communication data from LangGraph response
                communication_data = self._extract_communication_from_langgraph(response)
                
                if communication_data:
                    # Add to communication parser for visualization
                    self.communication_parser.add_communication_entry(communication_data)
                
                # Yield response for frontend
                yield {
                    'type': 'thought' if show_thoughts else 'response',
                    'content': response.get('content', 'Processing...'),
                    'timestamp': datetime.now().isoformat(),
                    'metadata': {
                        'communication_data': communication_data
                    }
                }
                
                # Small delay for smooth streaming
                socketio.sleep(0.5)
            
            # Final response
            yield {
                'type': 'final_response',
                'content': 'Processing complete. Check the visualization for agent communication flow.',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error in LangGraph supervisor: {e}")
            yield {
                'type': 'error',
                'content': f"Error processing request: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
    
    def _extract_communication_from_langgraph(self, langgraph_response):
        """
        Extract communication data from LangGraph response
        This method should be customized based on your LangGraph response format
        
        Args:
            langgraph_response: Response from your LangGraph workflow
            
        Returns:
            Dictionary with 'caller', 'talkto', 'message' or None
        """
        try:
            # TODO: Customize this based on your LangGraph response structure
            # Your LangGraph response might look like:
            # {
            #     'agent_name': 'Supervisor',
            #     'caller': 'Supervisor',
            #     'talkto': 'NBI Agent',
            #     'message': 'Requesting node information...',
            #     'step': 'communication'
            # }
            
            # For now, we'll simulate the extraction
            if 'agent_name' in langgraph_response:
                return {
                    'caller': langgraph_response.get('caller', langgraph_response['agent_name']),
                    'talkto': langgraph_response.get('talkto', 'Next Agent'),
                    'message': langgraph_response.get('message', 'Processing request...'),
                    'timestamp': datetime.now().isoformat()
                }
            
            return None
            
        except Exception as e:
            print(f"Error extracting communication data: {e}")
            return None
    
    def _simulate_langgraph_streaming(self, user_input):
        """
        Simulate LangGraph streaming responses
        Replace this with your actual LangGraph workflow.stream() call
        
        Args:
            user_input: User's input message
            
        Yields:
            Simulated LangGraph responses
        """
        # This is a simulation - replace with your actual LangGraph workflow
        simulated_steps = [
            {
                'agent_name': 'Supervisor',
                'caller': 'Supervisor',
                'talkto': 'NBI Agent',
                'message': f'Processing user request: {user_input}',
                'content': 'Analyzing network requirements...'
            },
            {
                'agent_name': 'NBI Agent',
                'caller': 'NBI Agent',
                'talkto': 'Supervisor',
                'message': 'Retrieved node information',
                'content': 'Node data collected successfully'
            },
            {
                'agent_name': 'Supervisor',
                'caller': 'Supervisor',
                'talkto': 'Plan Agent',
                'message': 'Requesting network planning',
                'content': 'Planning network configuration...'
            },
            {
                'agent_name': 'Plan Agent',
                'caller': 'Plan Agent',
                'talkto': 'DT Agent',
                'message': 'Requesting tunnel configuration',
                'content': 'Configuring data tunnels...'
            },
            {
                'agent_name': 'DT Agent',
                'caller': 'DT Agent',
                'talkto': 'Tunnel Operator',
                'message': 'Setting up tunnel operations',
                'content': 'Tunnel setup in progress...'
            },
            {
                'agent_name': 'Tunnel Operator',
                'caller': 'Tunnel Operator',
                'talkto': '__end__',
                'message': 'Tunnel configuration complete',
                'content': 'Network planning completed successfully!'
            }
        ]
        
        for step in simulated_steps:
            yield step
            # Simulate processing time
            socketio.sleep(1)

# Global supervisor instance - change this to RealSupervisor() when integrating with your LangGraph
supervisor = MockSupervisor()  # TODO: Change to RealSupervisor() for production

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

@app.route('/visualization')
@login_required
def visualization():
    """AI Agent Communication Flow Visualization page"""
    return render_template('visualization.html', username=session.get('user_id'))

@app.route('/api/communication-data')
@login_required
def get_communication_data():
    """API endpoint to get communication data for visualization"""
    try:
        communication_parser = CommunicationParser()
        flow_data = communication_parser.get_communication_flow()
        return jsonify(flow_data)
    except Exception as e:
        print(f"Error getting communication data: {e}")
        return jsonify([])

@app.route('/api/trigger-visualization')
@login_required
def trigger_visualization():
    """API endpoint to trigger visualization with real communication data"""
    try:
        communication_parser = CommunicationParser()
        flow_data = communication_parser.get_communication_flow()
        return jsonify({
            'success': True,
            'communication_data': flow_data
        })
    except Exception as e:
        print(f"Error triggering visualization: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        })

@app.route('/api/latest-communications')
@login_required
def get_latest_communications():
    """API endpoint to get latest communication data for real-time updates"""
    try:
        # Get the communication parser from the supervisor
        if hasattr(supervisor, 'communication_parser'):
            communication_parser = supervisor.communication_parser
        else:
            communication_parser = CommunicationParser()
        
        # Get latest communications (last 10 entries for real-time updates)
        latest_communications = communication_parser.get_latest_communications(count=10)
        
        # Convert to flow format for visualization
        flow_data = []
        for comm in latest_communications:
            if comm:
                # Map "Checker" to "User" for visualization
                caller = "User" if comm['caller'] == "Checker" else comm['caller']
                talkto = "User" if comm['talkto'] == "Checker" else comm['talkto']
                
                flow_data.append({
                    'caller': caller,
                    'talkto': talkto,
                    'message': comm['message'],
                    'timestamp': comm['timestamp']
                })
        
        return jsonify({
            'success': True,
            'communication_data': flow_data,
            'total_entries': len(communication_parser.communication_data)
        })
    except Exception as e:
        print(f"Error getting latest communications: {e}")
        return jsonify({
            'success': False,
            'error': str(e),
            'communication_data': []
        })

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