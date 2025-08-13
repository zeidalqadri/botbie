#!/bin/bash

echo "🤖 Botbie Usage Examples"
echo "========================"

# Base URL
BASE_URL="http://localhost:3333"

echo -e "\n1️⃣ Health Check:"
curl -s $BASE_URL/health | python3 -m json.tool

echo -e "\n2️⃣ Submit a Sentiment Analysis Task:"
TASK_ID=$(curl -s -X POST $BASE_URL/task \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text-analysis",
    "payload": {
      "text": "Botbie is an amazing AI assistant! I love how it processes tasks efficiently.",
      "action": "sentiment"
    }
  }' | python3 -c "import sys, json; print(json.load(sys.stdin)['taskId'])")

echo "Task ID: $TASK_ID"

echo -e "\n3️⃣ Check Task Status:"
sleep 2
curl -s $BASE_URL/task/$TASK_ID | python3 -m json.tool

echo -e "\n4️⃣ Submit a Summarization Task:"
curl -s -X POST $BASE_URL/task \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text-analysis",
    "payload": {
      "text": "Artificial Intelligence is transforming how we work. Machine learning models can now understand context, generate text, and even write code. This technology is being integrated into various applications, from chatbots to code assistants. The future looks promising as AI continues to evolve.",
      "action": "summarize"
    }
  }' | python3 -m json.tool

echo -e "\n5️⃣ Submit a Keyword Extraction Task:"
curl -s -X POST $BASE_URL/task \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text-analysis",
    "payload": {
      "text": "Cloud computing provides scalable infrastructure for modern applications. Kubernetes orchestrates containers while Docker packages applications. DevOps practices enable continuous integration and deployment.",
      "action": "keywords"
    }
  }' | python3 -m json.tool

echo -e "\n6️⃣ Submit Multiple Tasks (Batch Processing):"
for i in {1..3}; do
  curl -s -X POST $BASE_URL/task \
    -H "Content-Type: application/json" \
    -d "{
      \"type\": \"processing\",
      \"payload\": {
        \"jobId\": \"batch-$i\",
        \"data\": \"Process this data chunk $i\"
      }
    }" | python3 -m json.tool
done

echo -e "\n7️⃣ List Available Agents:"
curl -s $BASE_URL/agents | python3 -m json.tool

echo -e "\n✅ Examples complete!"