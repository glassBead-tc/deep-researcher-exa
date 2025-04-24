#!/bin/bash

# Check if setup-langsmith-env.sh exists
if [ ! -f setup-langsmith-env.sh ]; then
  echo "LangSmith environment not set up yet. Running setup..."
  bash setup-langsmith.sh
fi

# Source the environment variables
source setup-langsmith-env.sh

# Run the test
echo "Running LangSmith test..."
npx tsx test-langsmith.ts

echo ""
echo "Test complete. Check your LangSmith dashboard at https://smith.langchain.com/" 