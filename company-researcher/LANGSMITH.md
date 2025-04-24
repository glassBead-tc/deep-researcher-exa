# LangSmith Integration

This project includes integration with LangSmith for observability of agent operations at the pipeline level.

## How It Works

LangSmith tracing is implemented at the pipeline level rather than the function level. This means:

1. We trace entire workflows as a single unit
2. LLM calls within the workflow are automatically traced
3. The hierarchical structure of operations is preserved in traces

## Setup

1. Create a LangSmith account at [https://smith.langchain.com/](https://smith.langchain.com/)
2. Get an API key from the [settings page](https://smith.langchain.com/settings)
3. Run the setup script to configure your environment:

```bash
./setup-langsmith.sh
```

## Testing the Integration

After setting up your environment, you can run a simple test to verify that the integration is working:

```bash
npm run test:langsmith
```

Or run the test script directly:

```bash
./run-langsmith-test.sh
```

## Integration Details

The integration focuses on tracing three primary pipelines:

- **research_pipeline**: The main deep research process that iteratively searches and processes information
- **generate_report**: The pipeline that generates the final detailed report
- **generate_answer**: The pipeline that generates the concise final answer

Each of these pipelines is traced as a single unit, with any LLM calls within them automatically traced.

## Usage Example

```typescript
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";
import { OpenAI } from "openai";

// Auto-trace LLM calls
const client = wrapOpenAI(new OpenAI());

// Trace an entire workflow
const pipeline = traceable(
  async (userInput) => {
    // All operations in this function will be traced together
    const result = await client.chat.completions.create({
      messages: [{ role: "user", content: userInput }],
      model: "gpt-3.5-turbo",
    });
    return result.choices[0].message.content;
  },
  { name: "my_research_pipeline", run_type: "chain" }
);

// Use the pipeline
const result = await pipeline("Research query");
```

## Environment Variables

The following environment variables are required for LangSmith to work:

- `LANGSMITH_API_KEY`: Your LangSmith API key
- `LANGSMITH_TRACING`: Set to `true` to enable tracing
- `LANGSMITH_PROJECT`: The project name in LangSmith (defaults to "default")

## Viewing Traces

After running your application with LangSmith enabled, you can view the traces in your LangSmith dashboard:

[https://smith.langchain.com/](https://smith.langchain.com/)

## Benefits

- **Simplified Integration**: By tracing at the pipeline level, we avoid cluttering the codebase with tracing logic
- **Automatic LLM Tracing**: All LLM calls within a traced pipeline are automatically traced
- **Hierarchical Visualization**: See the entire research process as a nested trace in the LangSmith UI
- **Contextual Understanding**: Each trace maintains its context and relationship to parent/child operations 