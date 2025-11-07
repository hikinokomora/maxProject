#!/bin/bash

# Demo script for MAX Chatbot
# This script demonstrates the chatbot functionality via API calls

echo "=========================================="
echo "  MAX Chatbot Demo"
echo "=========================================="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
HEALTH=$(curl -s http://localhost:5000/health)
if [ $? -eq 0 ]; then
    echo "✓ Server is running!"
    echo "  Response: $HEALTH"
else
    echo "✗ Server is not running. Please start it first with: cd server && npm start"
    exit 1
fi

echo ""
echo "2. Getting university info..."
curl -s http://localhost:5000/api/chat/info | python3 -m json.tool

echo ""
echo "3. Testing greeting..."
curl -s -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Привет"}' | python3 -m json.tool

echo ""
echo "4. Asking for help..."
curl -s -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "помощь"}' | python3 -m json.tool

echo ""
echo "5. Getting schedule..."
curl -s "http://localhost:5000/api/schedule?group=ИВТ-101" | python3 -m json.tool

echo ""
echo "6. Getting events..."
curl -s "http://localhost:5000/api/events?limit=2" | python3 -m json.tool

echo ""
echo "7. Getting application types..."
curl -s http://localhost:5000/api/applications/types | python3 -m json.tool

echo ""
echo "8. Creating a sample application..."
curl -s -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -d '{
    "type": "certificate",
    "studentName": "Иванов Иван",
    "studentId": "12345",
    "department": "Факультет информатики",
    "email": "ivanov@example.com",
    "description": "Справка об обучении для банка"
  }' | python3 -m json.tool

echo ""
echo "=========================================="
echo "  Demo completed!"
echo "=========================================="
echo ""
echo "To test the web interface, open http://localhost:3000 in your browser"
