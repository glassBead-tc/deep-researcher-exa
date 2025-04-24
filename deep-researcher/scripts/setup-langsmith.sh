#!/bin/bash

# Setup script for LangSmith tracing

echo "Setting up LangSmith environment..."
echo ""
echo "Visit https://smith.langchain.com/settings to create an API key"
echo ""

# Prompt for LangSmith API key
read -p "Enter your LangSmith API key: " API_KEY

# Prompt for project name (optional)
read -p "Enter project name (or press Enter for 'default'): " PROJECT_NAME
PROJECT_NAME=${PROJECT_NAME:-default}

# Write to .env.local file
cat > .env.local <<EOL
# LangSmith Configuration
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=${API_KEY}
LANGSMITH_PROJECT=${PROJECT_NAME}
EOL

echo ""
echo "Environment variables written to .env.local"
echo ""
echo "To use these variables in your terminal session, run:"
echo "source setup-langsmith-env.sh"

# Create a source file for terminal sessions
cat > setup-langsmith-env.sh <<EOL
#!/bin/bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=${API_KEY}
export LANGSMITH_PROJECT=${PROJECT_NAME}

echo "LangSmith environment variables set:"
echo "LANGSMITH_TRACING=true"
echo "LANGSMITH_API_KEY=********"
echo "LANGSMITH_PROJECT=${PROJECT_NAME}"
EOL

chmod +x setup-langsmith-env.sh

echo ""
echo "Setup complete!" 