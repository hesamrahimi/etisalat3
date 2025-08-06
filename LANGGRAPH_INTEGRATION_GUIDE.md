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

### **Step 2: Update the RealSupervisor Class**

Replace the `_simulate_langgraph_streaming` method in `RealSupervisor` with your actual LangGraph workflow:

```python
def process_user_input(self, user_input, show_thoughts=False):
    """
    Process user input with real LangGraph supervisor
    """
    # Reset communication data for new conversation
    self.communication_parser.reset_communications()
    
    try:
        # Initialize your LangGraph supervisor
        langgraph_supervisor = YourLangGraphSupervisor()
        workflow = langgraph_supervisor.graph.compile()
        
        # Stream responses from your LangGraph workflow
        for s in workflow.stream({"user_input": user_input}):
            # Extract communication data from LangGraph response
            communication_data = self._extract_communication_from_langgraph(s)
            
            if communication_data:
                # Add to communication parser for visualization
                self.communication_parser.add_communication_entry(communication_data)
            
            # Yield response for frontend
            yield {
                'type': 'thought' if show_thoughts else 'response',
                'content': s.get('content', 'Processing...'),
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
```

### **Step 3: Customize Communication Data Extraction**

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
        
        # Extract based on your actual response structure
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

### **Step 4: Switch to RealSupervisor**

In `app.py`, change the supervisor initialization:

```python
# Change this line:
supervisor = MockSupervisor()  # TODO: Change to RealSupervisor() for production

# To this:
supervisor = RealSupervisor()
```

## 🔧 **Key Integration Points**

### **1. Communication Data Format**

Your LangGraph responses should include these fields for visualization:
- `caller`: The agent making the call
- `talkto`: The agent being called  
- `message`: The communication message
- `agent_name`: The current agent name

### **2. Real-time Updates**

The Flask app will:
- Call `add_communication_entry()` for each LangGraph response
- Update the visualization in real-time
- Stream responses to the frontend

### **3. Agent Mapping**

The visualization expects these agent names:
- `User` (maps from "Checker" in your logs)
- `Supervisor`
- `NBI Agent`
- `Plan Agent`
- `DT Agent`
- `Tunnel Operator`
- `__end__`

## 🚀 **Testing the Integration**

### **1. Test with Mock Data First**

```python
# In RealSupervisor, use the simulation first:
supervisor = RealSupervisor()  # Uses simulated data
```

### **2. Test with Real LangGraph**

```python
# Replace simulation with real LangGraph:
supervisor = RealSupervisor()  # Uses your actual LangGraph workflow
```

### **3. Monitor the Console**

Watch for these messages:
```
Communication data reset for new conversation
Added communication entry: Supervisor -> NBI Agent
Added communication entry: NBI Agent -> Supervisor
...
```

## 🔍 **Debugging Tips**

### **1. Check LangGraph Response Format**

Add logging to see your actual LangGraph response structure:

```python
def _extract_communication_from_langgraph(self, langgraph_response):
    print(f"LangGraph response: {langgraph_response}")
    # ... rest of the method
```

### **2. Verify Communication Data**

Check that communication entries are being added:

```python
def add_communication_entry(self, entry_data):
    print(f"Adding communication: {entry_data}")
    # ... rest of the method
```

### **3. Test API Endpoints**

Test the communication data API:
```bash
curl http://localhost:5000/api/latest-communications
```

## 📝 **Example LangGraph Response Format**

Your LangGraph responses should look like this:

```python
# Example response from your LangGraph workflow
{
    'agent_name': 'Supervisor',
    'caller': 'Supervisor',
    'talkto': 'NBI Agent', 
    'message': 'Requesting node information for network planning',
    'content': 'Analyzing network requirements...',
    'step': 'communication'
}
```

## 🎯 **Next Steps**

1. **Import your LangGraph supervisor** in `app.py`
2. **Replace the simulation** with your actual `workflow.stream()` call
3. **Customize the response extraction** to match your LangGraph format
4. **Test the integration** with real data
5. **Monitor the visualization** to ensure arrows appear correctly

The Flask app is now ready to integrate with your LangGraph supervisor and will show real-time agent communication flow as your workflow processes each step! 