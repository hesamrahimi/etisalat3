#!/usr/bin/env python3

import re
from datetime import datetime

def test_extract_communication_data(entry):
    """Test the communication data extraction"""
    print(f"Testing entry: {entry[:200]}...")
    
    try:
        # Pattern 1: ((), {'Agent': {'caller': 'X', 'talkto': 'Y', 'messages': [...]}})
        pattern1 = r"\(\(\)\s*,\s*\{'([^']+)':\s*\{'caller':\s*'([^']+)',\s*'talkto':\s*'([^']+)',\s*'messages':\s*\[([^\]]+)\]"
        matches1 = re.findall(pattern1, entry)
        print(f"Pattern 1 matches: {len(matches1)}")
        
        if matches1:
            agent_name, caller, talkto, messages_str = matches1[0]
            print(f"  Agent: {agent_name}, Caller: {caller}, Talkto: {talkto}")
            print(f"  Messages string: {messages_str[:100]}...")
            
            # Extract message content - handle escaped characters
            content_match = re.search(r"content='([^']*(?:\\.[^']*)*)'", messages_str)
            if content_match:
                message = content_match.group(1)
                # Unescape the message
                message = message.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace("\\'", "'")
                print(f"  Content match: {message[:100]}...")
            else:
                # Fallback: extract any quoted string as message
                quoted_match = re.search(r"'([^']*(?:\\.[^']*)*)'", messages_str)
                if quoted_match:
                    message = quoted_match.group(1)
                    # Unescape the message
                    message = message.replace('\\n', '\n').replace('\\t', '\t').replace('\\"', '"').replace("\\'", "'")
                else:
                    message = "Processing request..."
                print(f"  Quoted match: {message[:100]}...")
            
            return {
                'caller': caller,
                'talkto': talkto,
                'message': message,
                'timestamp': datetime.now().isoformat()
            }
        
        print("  No patterns matched")
        return None
        
    except Exception as e:
        print(f"Error parsing communication entry: {e}")
        return None

# Test with a sample entry from the log file
test_entry = """((), {'Supervisor': {'caller': 'Supervisor', 'talkto': 'NBI Agent', 'messages': [HumanMessage(content='To complete the task, I will follow the steps outlined:\\n\\n1. **Extract and Translate Node Names and TP Locations to UUIDs:**\\n\\n   - **Source Node:**\\n     - Node Name: 203_WANHE_BUILDINGS_A\\n     - TP Location: /ne=203_WANHE_BUILDINGS_A/sh=0/sl=3/p=1\\n\\n   - **Destination Node:**\\n     - Node Name: 205_CHINA_SHIHUA_1\\n     - TP Location: /ne=205_CHINA_SHIHUA_1/sh=0/sl=4/p=6\\n\\n2. **Translate Node Names to UUIDs:**\\n\\n   - Request NBI Agent to translate:\\n     - Node Name: 203_WANHE_BUILDINGS_A\\n     - Node Name: 205_CHINA_SHIHUA_1\\n\\n3. **Translate TP Locations to UUIDs:**\\n\\n   - Request NBI Agent to translate:\\n     - TP Location: /ne=203_WANHE_BUILDINGS_A/sh=0/sl=3/p=1 (Node UUID: [UUID of 203_WANHE_BUILDINGS_A])\\n     - TP Location: /ne=205_CHINA_SHIHUA_1/sh=0/sl=4/p=6 (Node UUID: [UUID of 205_CHINA_SHIHUA_1])\\n\\n4. **Pass the UUIDs to Plan Agent:**\\n\\n   - Source Node UUID: [UUID of 203_WANHE_BUILDINGS_A]\\n   - Source TP UUID: [UUID of /ne=203_WANHE_BUILDINGS_A/sh=0/sl=3/p=1]\\n   - Destination Node UUID: [UUID of 205_CHINA_SHIHUA_1]\\n   - Destination TP UUID: [UUID of /ne=205_CHINA_SHIHUA_1/sh=0/sl=4/p=6]\\n\\n   - Plan Agent will use these UUIDs to plan and create the OCh.\\n\\nPlease confirm if you need any further assistance or if there are additional details to consider.', additional_kwargs={}, response_metadata={})]}})"""

print("Testing communication data extraction...")
result = test_extract_communication_data(test_entry)
if result:
    print(f"SUCCESS: {result}")
else:
    print("FAILED: No communication data extracted") 