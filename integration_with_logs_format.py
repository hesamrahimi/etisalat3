"""
Integration Guide: Connecting Flask App with Existing LLM Supervisor
Based on logs.txt Format

This file demonstrates how to integrate your existing LLM supervisor with the Flask web application,
specifically handling the tuple-based response format found in logs.txt.

Expected Supervisor Response Format:
- Responses are tuples: (first_tuple, second_dict)
- Only process entries where first_tuple is empty: ((), {...})
- Extract HumanMessage content from nested dictionary structure
- Stream thoughts gradually before final response
"""

import time
import re
from datetime import datetime
from typing import Generator, Dict, Any, Tuple, Optional

class LogsFormatSupervisor:
    """
    Example supervisor class that mimics the logs.txt format
    Replace this with your actual supervisor implementation
    """
    
    def __init__(self):
        self.log_parser = LogsFormatParser()
    
    def process_user_input(self, user_input: str, show_thoughts: bool = False) -> Generator[Dict[str, Any], None, None]:
        """
        Process user input and yield responses in the expected format
        
        Args:
            user_input: User's message
            show_thoughts: Whether to show intermediate thoughts
            
        Yields:
            Dictionary with type, content, timestamp, and metadata
        """
        # Reset parser for new conversation
        self.log_parser.reset_index()
        
        # Get thoughts from logs (or your supervisor's thought process)
        thoughts = self.log_parser.get_thoughts()
        
        # Stream thoughts if requested
        for i, thought in enumerate(thoughts):
            if show_thoughts and thought:
                yield {
                    'type': 'thought',
                    'content': thought,
                    'timestamp': datetime.now().isoformat(),
                    'thought_number': i + 1,
                    'total_thoughts': len(thoughts)
                }
                time.sleep(0.5)  # Simulate processing time
        
        # Generate final response
        final_response = self._generate_final_response(user_input)
        yield {
            'type': 'final_response',
            'content': final_response,
            'timestamp': datetime.now().isoformat()
        }
    
    def _generate_final_response(self, user_input: str) -> str:
        """Generate final response based on user input"""
        return f"Based on your query: '{user_input}', here is the comprehensive analysis and recommendations from the network planning supervisor."


class LogsFormatParser:
    """
    Parser for the logs.txt format responses
    This handles the tuple-based structure: (first_tuple, second_dict)
    """
    
    def __init__(self, log_file_path: str = 'logs.txt'):
        self.log_file_path = log_file_path
        self.current_index = 0
        self.parsed_thoughts = []
        self._parse_logs()
    
    def _parse_logs(self):
        """Parse logs.txt and extract HumanMessage content"""
        try:
            with open(self.log_file_path, 'r', encoding='utf-8') as file:
                content = file.read()
        except FileNotFoundError:
            print(f"Log file {self.log_file_path} not found. Using empty thoughts list.")
            return
        
        # Split by separator
        log_entries = content.split('----')
        
        for entry in log_entries:
            entry = entry.strip()
            if not entry:
                continue
            
            # Extract thought content using regex
            thought_content = self._extract_thought_content(entry)
            if thought_content:
                self.parsed_thoughts.append(thought_content)
    
    def _extract_thought_content(self, entry: str) -> Optional[str]:
        """
        Extract HumanMessage content from log entry
        
        Expected format: HumanMessage(content='...', ...)
        """
        import re
        
        # Look for HumanMessage patterns
        human_message_pattern = r"HumanMessage\(content='([^']*)'"
        matches = re.findall(human_message_pattern, entry)
        
        if matches:
            return matches[0]
        
        # Fallback: look for any content in quotes
        content_pattern = r"content='([^']*)'"
        matches = re.findall(content_pattern, entry)
        
        if matches:
            return matches[0]
        
        return None
    
    def get_thoughts(self) -> list:
        """Return all parsed thoughts"""
        return self.parsed_thoughts
    
    def get_next_thought(self) -> Optional[str]:
        """Get next thought in sequence"""
        if self.current_index < len(self.parsed_thoughts):
            thought = self.parsed_thoughts[self.current_index]
            self.current_index += 1
            return thought
        return None
    
    def reset_index(self):
        """Reset index to start from beginning"""
        self.current_index = 0


# Integration with Flask App
def integrate_with_flask_app():
    """
    How to integrate your existing supervisor with the Flask app
    
    Replace the MockSupervisor in app.py with your actual supervisor
    """
    
    # 1. Replace the MockSupervisor class in app.py
    """
    In app.py, replace:
    
    class MockSupervisor:
        def __init__(self):
            self.log_parser = LogParser()
        
        def process_user_input(self, user_input, show_thoughts=False):
            # ... existing code ...
    
    With your actual supervisor:
    
    class YourActualSupervisor:
        def __init__(self):
            # Initialize your actual supervisor
            self.your_supervisor = YourSupervisorClass()
        
        def process_user_input(self, user_input, show_thoughts=False):
            # Call your actual supervisor
            responses = self.your_supervisor.process(user_input)
            
            # Convert your supervisor's responses to the expected format
            for response in responses:
                # Extract thought content from your supervisor's response
                thought_content = self._extract_from_supervisor_response(response)
                
                if show_thoughts and thought_content:
                    yield {
                        'type': 'thought',
                        'content': thought_content,
                        'timestamp': datetime.now().isoformat(),
                        'thought_number': i + 1,
                        'total_thoughts': total_thoughts
                    }
                    time.sleep(0.5)
            
            # Generate final response
            final_response = self._get_final_response(responses)
            yield {
                'type': 'final_response',
                'content': final_response,
                'timestamp': datetime.now().isoformat()
            }
    """
    
    # 2. Expected Response Format
    """
    Your supervisor should yield responses in this format:
    
    {
        'type': 'thought' | 'final_response' | 'error',
        'content': 'The actual message content',
        'timestamp': 'ISO format timestamp',
        'metadata': {
            'thought_number': 1,
            'total_thoughts': 5,
            # ... any additional metadata
        }
    }
    """
    
    # 3. Handling logs.txt Format
    """
    If your supervisor produces responses in the logs.txt format:
    
    ((), {'Supervisor': {'caller': 'Supervisor', 'messages': [HumanMessage(content='...')]}})
    
    You need to:
    1. Parse the tuple structure
    2. Extract HumanMessage content
    3. Convert to the expected Flask format
    """
    
    return "Integration example completed"


# Example: How to modify your existing supervisor
class YourExistingSupervisor:
    """
    Example of how to modify your existing supervisor to work with the Flask app
    
    Replace this with your actual supervisor class
    """
    
    def __init__(self):
        # Initialize your existing supervisor
        pass
    
    def process(self, user_input: str) -> Generator[Tuple, None, None]:
        """
        Your existing supervisor's process method
        This should yield responses in the logs.txt format
        """
        # Your existing logic here
        # Yield responses like: ((), {'Supervisor': {'messages': [HumanMessage(content='...')]}})
        pass


# Example: Integration wrapper
class SupervisorIntegrationWrapper:
    """
    Wrapper to convert your existing supervisor's responses to Flask format
    """
    
    def __init__(self, your_supervisor: YourExistingSupervisor):
        self.supervisor = your_supervisor
    
    def process_user_input(self, user_input: str, show_thoughts: bool = False) -> Generator[Dict[str, Any], None, None]:
        """
        Convert your supervisor's responses to Flask format
        """
        # Get responses from your supervisor
        supervisor_responses = self.supervisor.process(user_input)
        
        thought_count = 0
        for response in supervisor_responses:
            # Parse the tuple format: (first_tuple, second_dict)
            first_tuple, second_dict = response
            
            # Only process entries where first tuple is empty
            if first_tuple == ():
                # Extract HumanMessage content
                thought_content = self._extract_human_message(second_dict)
                
                if thought_content and show_thoughts:
                    thought_count += 1
                    yield {
                        'type': 'thought',
                        'content': thought_content,
                        'timestamp': datetime.now().isoformat(),
                        'thought_number': thought_count,
                        'total_thoughts': 'unknown'  # You might need to calculate this
                    }
                    time.sleep(0.5)
        
        # Generate final response
        final_response = self._generate_final_response(user_input)
        yield {
            'type': 'final_response',
            'content': final_response,
            'timestamp': datetime.now().isoformat()
        }
    
    def _extract_human_message(self, data_dict: Dict) -> Optional[str]:
        """Extract HumanMessage content from nested dictionary"""
        # Navigate through the nested structure
        for key, value in data_dict.items():
            if isinstance(value, dict):
                if 'messages' in value:
                    messages = value['messages']
                    if isinstance(messages, list):
                        for message in messages:
                            if hasattr(message, 'content') and hasattr(message, '__class__'):
                                if 'HumanMessage' in str(message.__class__):
                                    return message.content
                    elif isinstance(messages, str):
                        return messages
                else:
                    # Recursively search deeper
                    result = self._extract_human_message(value)
                    if result:
                        return result
        return None
    
    def _generate_final_response(self, user_input: str) -> str:
        """Generate final response based on user input"""
        return f"Analysis complete for: '{user_input}'. Here are the final recommendations."


# Usage Example
if __name__ == "__main__":
    # Example of how to use the integration
    supervisor = LogsFormatSupervisor()
    
    # Test the integration
    for response in supervisor.process_user_input("Test query", show_thoughts=True):
        print(f"Type: {response['type']}")
        print(f"Content: {response['content'][:100]}...")
        print(f"Timestamp: {response['timestamp']}")
        print("---")
    
    print("Integration example completed successfully!")


"""
SUMMARY:

1. Your existing supervisor should yield responses in the logs.txt format:
   ((), {'Supervisor': {'messages': [HumanMessage(content='...')]}})

2. The Flask app expects responses in this format:
   {
       'type': 'thought' | 'final_response' | 'error',
       'content': 'message content',
       'timestamp': 'ISO timestamp',
       'metadata': {...}
   }

3. Use the SupervisorIntegrationWrapper to convert between formats

4. Replace MockSupervisor in app.py with your actual supervisor

5. Ensure your supervisor can handle the show_thoughts parameter for streaming
""" 