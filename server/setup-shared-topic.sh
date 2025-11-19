#!/bin/bash

# Setup script for creating shared Hedera topic

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌿 Air Quality Monitor - Shared Hedera Topic Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "✅ Found existing .env file"
    source .env
else
    echo "📝 No .env file found. Let's create one!"
    echo ""
fi

# Prompt for credentials if not set
if [ -z "$HEDERA_ACCOUNT_ID" ]; then
    echo "Please enter your Hedera Testnet credentials:"
    echo "(Get free testnet account at: https://portal.hedera.com)"
    echo ""
    read -p "Hedera Account ID (e.g., 0.0.12345): " HEDERA_ACCOUNT_ID
    read -p "Hedera Private Key: " HEDERA_PRIVATE_KEY
    echo ""
    
    # Create .env file
    cat > .env << EOF
# Server Configuration
PORT=3000

# Hedera Testnet Credentials
HEDERA_ACCOUNT_ID=$HEDERA_ACCOUNT_ID
HEDERA_PRIVATE_KEY=$HEDERA_PRIVATE_KEY

# Shared Topic ID (will be set after creation)
SHARED_TOPIC_ID=
EOF
    
    echo "✅ Created .env file"
    echo ""
fi

# Run the topic creation script
echo "🚀 Creating shared topic..."
echo ""
node create-shared-topic.js

# Check if topic was created successfully
if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Setup Complete!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "Next steps:"
    echo "1. Check shared-topic-config.json for topic details"
    echo "2. Update .env with the SHARED_TOPIC_ID"
    echo "3. Restart the server: npm start"
    echo "4. Users can now submit data to the shared topic!"
    echo ""
else
    echo ""
    echo "❌ Setup failed. Please check the error messages above."
    echo ""
fi

