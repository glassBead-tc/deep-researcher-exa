# Deep Researcher

## 🔎 Advanced Research Tool Powered by [Exa.ai](https://exa.ai)

![Deep Researcher](https://github.com/glassBead-tc/deep-researcher-exa/blob/main/deep-researcher/public/exa-researcher.png)

Deep Researcher is an open-source tool that performs in-depth research on any topic using Exa.ai's powerful search capabilities. It intelligently gathers and synthesizes information from across the web, presenting you with comprehensive insights and detailed reports.

## ✨ Features

- **Intelligent Query Generation**: Automatically generates relevant search queries based on your research topic
- **Iterative Research Process**: Conducts deep research by exploring multiple branches of knowledge
- **Comprehensive Information Gathering**: Collects data from websites, social media, academic sources, and more
- **AI-Powered Synthesis**: Analyzes and synthesizes findings into coherent learnings
- **Detailed Reports**: Generates structured, academic-quality reports with citations
- **LangSmith Integration**: Built-in observability for monitoring the research pipeline

## 🔧 Technical Implementation

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Search**: [Exa.ai](https://exa.ai) API for web search and content extraction
- **AI**: Anthropic Claude, OpenAI, Fireworks AI, and OpenRouter integration options
- **Observability**: LangSmith for tracing and monitoring
- **Deployment**: Optimized for Vercel hosting

### Research Pipeline
The research process follows these key steps:
1. **Query Generation**: Creates targeted search queries based on the initial prompt
2. **Information Retrieval**: Gathers content from the web using Exa.ai's API
3. **Content Analysis**: Processes and extracts relevant information from search results
4. **Knowledge Synthesis**: Consolidates findings into structured learnings
5. **Report Generation**: Produces detailed reports with citations
6. **Answer Derivation**: Provides a concise, evidence-based answer to the original query

## 🚀 Getting Started

### Prerequisites
- Node.js 22.x
- Exa.ai API key
- Anthropic API key (or another supported AI provider)
- (Optional) LangSmith API key for tracing

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/deep-researcher.git
cd deep-researcher
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env.local` file with your API keys
```
EXA_API_KEY=your_exa_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_TRACING=true
LANGSMITH_PROJECT=deep-researcher
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 📊 LangSmith Integration

Deep Researcher includes integration with LangSmith for observability of agent operations at the pipeline level. This provides:

- Tracing of entire research workflows as a single unit
- Automatic tracking of LLM calls within workflows
- Hierarchical visualization of the research process
- Contextual understanding of operations

To set up LangSmith:

1. Create a LangSmith account at [https://smith.langchain.com/](https://smith.langchain.com/)
2. Get an API key from the [settings page](https://smith.langchain.com/settings)
3. Run the setup script:
```bash
./setup-langsmith.sh
```

For more details, see [LANGSMITH.md](deep-researcher/LANGSMITH.md).

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgements

- [Exa.ai](https://exa.ai) for providing the search API
- The Next.js team for the application framework
- Anthropic and other AI providers for the language models

---

Built with ❤️ by the Deep Researcher team
