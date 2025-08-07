# LangGraph Streaming Integration Guide

## 🔄 **Understanding LangGraph Streaming**

Your LangGraph supervisor likely yields messages **one by one**:
```python
# Your LangGraph workflow probably looks like this:
for s in workflow.stream({"user_input": user_input}):
    # Each 's' is one message/thought
    # They come in real-time, not all at once
    yield s
```

## 🎯 **Three Approaches for Handling Streaming**

### **Approach 1: True Streaming (Recommended for Real-Time)**

**Best for:** Real-time user experience, true streaming
**When to use:** When you want messages to appear as they arrive

```python
def process_user_input(self, user_input, show_thoughts=False):
    step_count = 0
    total_steps = self._get_expected_steps(user_input)  # You determine this
    
    for response in self.your_langgraph_workflow.stream({"user_input": user_input}):
        step_count += 1
        
        # Extract communication data
        communication_data = self._extract_communication_from_langgraph(response)
        
        # Yield immediately (no waiting)
        yield {
            'type': 'thought',
            'content': response.get('content', 'Processing...'),
            'timestamp': datetime.now().isoformat(),
            'thought_number': step_count,
            'total_thoughts': total_steps,  # You need to know this in advance
            'metadata': {
                'communication_data': communication_data
            }
        }
```

**Pros:**
- ✅ True real-time streaming
- ✅ Messages appear as they arrive
- ✅ Better user experience
- ✅ Lower memory usage

**Cons:**
- ❌ Need to know total steps in advance
- ❌ Can't show "3 of 5" until you know there are 5 total

### **Approach 2: Dynamic Counting (Flexible)**

**Best for:** When you don't know total steps in advance
**When to use:** When your workflow length is variable

```python
def process_user_input(self, user_input, show_thoughts=False):
    step_count = 0
    
    for response in self.your_langgraph_workflow.stream({"user_input": user_input}):
        step_count += 1
        
        # Extract communication data
        communication_data = self._extract_communication_from_langgraph(response)
        
        # Yield with current count (total unknown)
        yield {
            'type': 'thought',
            'content': response.get('content', 'Processing...'),
            'timestamp': datetime.now().isoformat(),
            'thought_number': step_count,
            'total_thoughts': None,  # Unknown total
            'metadata': {
                'communication_data': communication_data
            }
        }
```

**Pros:**
- ✅ True streaming
- ✅ No need to know total steps
- ✅ Works with variable-length workflows

**Cons:**
- ❌ Can't show progress like "3 of 5"
- ❌ Frontend needs to handle `total_thoughts: null`

### **Approach 3: List Conversion (Current Fix)**

**Best for:** When you need exact progress tracking
**When to use:** When total steps are predictable and small

```python
def process_user_input(self, user_input, show_thoughts=False):
    # Convert generator to list (loses streaming benefit)
    responses = list(self.your_langgraph_workflow.stream({"user_input": user_input}))
    
    for i, response in enumerate(responses):
        # Extract communication data
        communication_data = self._extract_communication_from_langgraph(response)
        
        yield {
            'type': 'thought',
            'content': response.get('content', 'Processing...'),
            'timestamp': datetime.now().isoformat(),
            'thought_number': i + 1,
            'total_thoughts': len(responses),  # Exact total
            'metadata': {
                'communication_data': communication_data
            }
        }
```

**Pros:**
- ✅ Exact progress tracking
- ✅ Know total steps in advance
- ✅ Simple implementation

**Cons:**
- ❌ No true streaming (waits for all messages)
- ❌ Higher memory usage
- ❌ Poor user experience for long workflows

## ✅ **Simplified Approach (Recommended)**

**Best for:** True streaming without predictions
**When to use:** When you want immediate streaming without worrying about total steps

```python
def process_user_input(self, user_input, show_thoughts=False):
    step_count = 0
    
    for response in self.your_langgraph_workflow.stream({"user_input": user_input}):
        step_count += 1
        
        # Extract communication data
        communication_data = self._extract_communication_from_langgraph(response)
        
        # Yield immediately (no waiting, no predictions needed)
        yield {
            'type': 'thought',
            'content': response.get('content', 'Processing...'),
            'timestamp': datetime.now().isoformat(),
            'thought_number': step_count,  # Just current count
            'metadata': {
                'communication_data': communication_data
            }
        }
```

**Pros:**
- ✅ True real-time streaming
- ✅ No predictions needed
- ✅ Works with any workflow length
- ✅ Simple and robust
- ✅ Messages appear immediately

**Cons:**
- ❌ No progress indicator (no "3 of 5")
- ❌ Frontend shows just "Thought 3" instead of "Thought 3 of 5"

## 🚀 **Recommended Approach for Your Integration**

For your LangGraph integration, use the **simplified approach**:

```python
class RealSupervisor:
    def __init__(self):
        self.communication_parser = None
    
    def process_user_input(self, user_input, show_thoughts=False):
        # Initialize communication parser
        if not self.communication_parser:
            self.communication_parser = CommunicationParser(load_file=False)
        
        self.communication_parser.reset_communications()
        
        try:
            step_count = 0
            
            # Your actual LangGraph workflow
            for response in self.your_langgraph_workflow.stream({"user_input": user_input}):
                step_count += 1
                
                # Extract communication data
                communication_data = self._extract_communication_from_langgraph(response)
                
                if communication_data:
                    self.communication_parser.add_communication_entry(communication_data)
                
                # Yield immediately for real-time streaming
                yield {
                    'type': 'thought',
                    'content': response.get('content', 'Processing...'),
                    'timestamp': datetime.now().isoformat(),
                    'thought_number': step_count,  # Just current count
                    'metadata': {
                        'communication_data': communication_data
                    }
                }
                
                # Small delay for smooth streaming
                socketio.sleep(0.5)
            
        except Exception as e:
            print(f"Error in LangGraph supervisor: {e}")
            yield {
                'type': 'error',
                'content': f"Error processing request: {str(e)}",
                'timestamp': datetime.now().isoformat()
            }
```

## 🔧 **Frontend Compatibility**

The frontend already handles the simplified approach:

```javascript
// Frontend shows just the current thought number
showProgress(data.thought_number);  // Shows "Thought 3"
```

## ✅ **Summary**

For your LangGraph integration:

1. **Use the simplified approach** - no predictions needed
2. **True streaming** - thoughts appear immediately
3. **Robust** - works with any workflow length
4. **Simple** - just count as you go

The key is that **true streaming** provides the best user experience, and you don't need the progress indicator if it's not essential! 