python3 << 'EOF'
import random
import json
from datetime import datetime, timedelta
import os

# Ensure data directory exists
os.makedirs('~/.openclaw/workspace/wangyu', exist_ok=True)

# Generate mock market data
random.seed(int(datetime.now().timestamp()))
trend = random.randint(40, 90)
volume_score = random.randint(30, 85)
momentum = random.randint(35, 88)
sentiment = random.randint(25, 92)

# Calculate WANGYU Index
wangyu_index = (trend_score + volume_score + momentum + sent_score) // 4

# Load position
position_file = os.path.expanduser('~/.openclaw/workspace/wangyu/position.txt')
position = 