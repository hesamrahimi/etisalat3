# LangGraph Integration Guide

This guide explains how to integrate your LangGraph-based supervisor with the Flask visualization app.

## 🔄 **Integration Overview**

Your current LangGraph workflow:
```python
workflow = self.graph.compile()
for s in workflow.stream(...):
    # Process each step
```

Will be integrated with the Flask app to:
1. Stream responses in real-time
2. Update the visualization as each agent communicates
3. Show the communication flow as it happens

## 📋 **Step-by-Step Integration**

### **Step 1: Import Your LangGraph Supervisor**

At the top of `app.py`, add your supervisor import:

```python
# Add your LangGraph supervisor import here
from your_supervisor_module import YourLangGraphSupervisor
```

### **Step 2: Update the Global Supervisor Instance**

In `app.py`, change line 514 from:
```python
supervisor = MockSupervisor()  # TODO: Change to RealSupervisor() for production
```

To:
```python
supervisor = RealSupervisor()  # Now using real LangGraph supervisor
```

### **Step 3: Customize the RealSupervisor Class**

Update the `RealSupervisor` class in `app.py`:

```python
class RealSupervisor:
    def __init__(self):
        # Initialize your actual LangGraph supervisor
        self.your_langgraph_supervisor = YourLangGraphSupervisor()
        self.communication_parser = None  # Will be created when needed
    
    def process_user_input(self, user_input, show_thoughts=False):
        # Initialize communication parser for this conversation
        if not self.communication_parser:
            self.communication_parser = CommunicationParser()
        
        # Reset for new conversation
        self.communication_parser.reset_communications()
        
        try:
            # Your actual LangGraph workflow
            workflow = self.your_langgraph_supervisor.graph.compile()
            
            for s in workflow.stream({"user_input": user_input}):
                # Extract communication data from LangGraph response
                communication_data = self._extract_communication_from_langgraph(s)
                
                if communication_data:
                    # Add to communication parser for visualization
                    self.communication_parser.add_communication_entry(communication_data)
                
                # Yield response for frontend
                yield {
                    'type': 'response',
                    'content': s.get('content', 'Processing...'),
                    'timestamp': datetime.now().isoformat(),
                    'metadata': {
                        'communication_data': communication_data
                    }
                }
                
                socketio.sleep(0.5)
            
        except Exception as e:
            print(f"Error in LangGraph supervisor: {e}")
            yield {
                'type': 'error',
                'content': f"Error processing request: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
```

### **Step 4: Customize Communication Data Extraction**

Update the `_extract_communication_from_langgraph` method to match your LangGraph response format:

```python
def _extract_communication_from_langgraph(self, langgraph_response):
    """
    Extract communication data from LangGraph response
    Customize this based on your LangGraph response structure
    """
    try:
        # Example: Your LangGraph response might look like:
        # {
        #     'agent_name': 'Supervisor',
        #     'caller': 'Supervisor',
        #     'talkto': 'NBI Agent',
        #     'message': 'Requesting node information...',
        #     'step': 'communication'
        # }
        
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
```

### **Step 5: Customize Thought Content Extraction (IMPORTANT!)**

Add the `_extract_thought_content_from_langgraph` method to extract actual thought content:

```python
def _extract_thought_content_from_langgraph(self, langgraph_response):
    """
    Extract thought content from LangGraph response
    Uses the exact same logic as LogParser._extract_thought_content
    """
    import re
    
    # Convert LangGraph response to string for parsing
    response_str = str(langgraph_response)
    
    # Look for HumanMessage patterns (same as LogParser)
    # Pattern: HumanMessage(content='...', ...)
    human_message_pattern = r"HumanMessage\(content='([^']*)'"
    matches = re.findall(human_message_pattern, response_str)
    
    if matches:
        # Return the first HumanMessage content found
        return matches[0]
    
    # If no HumanMessage found, look for any content in quotes that might be a thought
    # This is a fallback for other message types (same as LogParser)
    content_pattern = r"content='([^']*)'"
    matches = re.findall(content_pattern, response_str)
    
    if matches:
        # Return the first content found
        return matches[0]
    
    # If no content found, return a fallback message
    return f"Processing step: {response_str[:100]}..." if len(response_str) > 100 else response_str
```

**Important:** This method uses the **exact same logic** as `LogParser._extract_thought_content` to parse `HumanMessage(content='...')` patterns from your LangGraph responses, ensuring consistency between MockSupervisor and RealSupervisor.

## 🔧 **Architecture Differences**

### **MockSupervisor Mode (Current)**
- Uses static `logs_new.txt` file for communication data
- `CommunicationParser` reads the entire file at initialization (`load_file=True`)
- API endpoints create new `CommunicationParser` instances with `load_file=True`
- Good for testing and demonstration

### **RealSupervisor Mode (Your Integration)**
- Uses real-time LangGraph streaming for communication data
- `CommunicationParser` is created empty (`load_file=False`) - no file reading
- Communication data is added incrementally as LangGraph yields responses
- API endpoints use the supervisor's communication tracking
- Good for production with real LangGraph workflow

## 🔧 **Fixed: CommunicationParser Initialization Issue**

### **Problem:**
The RealSupervisor was doing this wasteful sequence:
```python
self.communication_parser = CommunicationParser()  # Reads entire logs_new.txt
self.communication_parser.reset_communications()   # Immediately clears all data!
```

### **Solution:**
Now RealSupervisor creates an empty CommunicationParser:
```python
self.communication_parser = CommunicationParser(load_file=False)  # No file reading
self.communication_parser.reset_communications()  # Just ensures empty state
```

## 🔧 **Fixed: Generator Length Issue**

### **Problem:**
When working with LangGraph streaming (generators), you can't use `len()` directly:
```python
# This causes IDE errors:
simulated_responses = self._simulate_langgraph_streaming(user_input)  # Generator
'total_thoughts': len(simulated_responses),  # ❌ Error: can't len() a generator
```

### **Solution (Recommended): True Streaming**
For real-time LangGraph integration, use true streaming without predictions:
```python
# This works correctly and maintains streaming benefits:
step_count = 0

for response in self.your_langgraph_workflow.stream({"user_input": user_input}):
    step_count += 1
    yield {
        'type': 'thought',
        'content': response.get('content', 'Processing...'),
        'thought_number': step_count,  # Just current count
        'metadata': {
            'communication_data': communication_data
        }
    }
```

### **Alternative Solution: List Conversion (Fallback)**
If you need exact progress tracking and can afford to wait for all messages:
```python
# This works but loses streaming benefits:
simulated_responses = list(self._simulate_langgraph_streaming(user_input))  # List
'total_thoughts': len(simulated_responses),  # ✅ Works: can len() a list
```

**Note:** For your actual LangGraph integration, **true streaming** (first approach) is recommended for better user experience. The simplified approach without `total_thoughts` is more robust and doesn't require predictions.

## 🚀 **Testing Your Integration**

### **1. Test the API Endpoints**

```bash
# Test communication data endpoint
curl http://localhost:5000/api/communication-data

# Test latest communications endpoint
curl http://localhost:5000/api/latest-communications

# Test visualization trigger endpoint
curl http://localhost:5000/api/trigger-visualization
```

### **2. Test Real-Time Updates**

1. Start the Flask app: `python app.py`
2. Open the dashboard: `http://localhost:5000`
3. Send a message in the chat
4. Watch the visualization update in real-time

### **3. Monitor the Logs**

Check the Flask console for:
- LangGraph workflow execution
- Communication data extraction
- Real-time updates to the visualization

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **No communication data showing:**
   - Check if `_extract_communication_from_langgraph` is returning the correct format
   - Verify your LangGraph response structure matches the extraction logic

2. **Visualization not updating:**
   - Ensure `self.communication_parser.add_communication_entry()` is being called
   - Check the browser console for JavaScript errors

3. **LangGraph integration errors:**
   - Verify your LangGraph supervisor is properly initialized
   - Check that the workflow.stream() is yielding the expected format

### **Debug Tips:**

1. Add print statements in `_extract_communication_from_langgraph`:
```python
print(f"LangGraph response: {langgraph_response}")
print(f"Extracted communication: {communication_data}")
```

2. Monitor the communication parser:
```python
print(f"Total communications: {len(self.communication_parser.communication_data)}")
```

## ✅ **Integration Complete!**

Once you've completed these steps:

1. **Real-time streaming** from your LangGraph workflow
2. **Live visualization** updates as agents communicate
3. **Proper separation** between mock and real modes
4. **Consistent API** endpoints for both modes

Your Flask app will now properly integrate with your LangGraph supervisor and provide real-time visualization of agent communications! 