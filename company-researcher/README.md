# 🔎 Deep Researcher
### Powered by [Exa.ai](https://exa.ai) - The Search Engine for AI Applications

![Screenshot](https://companyresearcher.exa.ai/opengraph-image.jpg)

<br>

## 🎯 What is Deep Researcher?

Deep Researcher is a free and open-source tool that helps you conduct in-depth research on any topic. Simply input a query, and the tool gathers comprehensive information from across the web, presenting you with detailed insights and learnings.

<br>

## 📊 Data Sources & API Endpoints
> All data is fetched using Exa's powerful search API. Each section below includes a direct link to try the API call in Exa's playground.

1. **Website Information**
   - Website Content ([Try API](https://dashboard.exa.ai/playground/get-contents?filters=%7B%22ids%22%3A%5B%22https%3A%2F%2Fexa.ai%22%5D%2C%22text%22%3A%22true%22%2C%22summary%22%3Atrue%7D))
   - Subpages ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai&c=company&filters=%7B%22type%22%3A%22neural%22%2C%22text%22%3A%22true%22%2C%22numResults%22%3A1%2C%22livecrawl%22%3A%22always%22%2C%22subpages%22%3A10%2C%22subpageTarget%22%3A%5B%22about%22%2C%22pricing%22%2C%22faq%22%2C%22blog%22%5D%2C%22includeDomains%22%3A%5B%22exa.ai%22%5D%7D))

2. **Social Media Presence**
   - Twitter/X ([Try API](https://dashboard.exa.ai/playground/search?q=from%3Aexaailabs&c=tweet&filters=%7B%22type%22%3A%22keyword%22%2C%22text%22%3A%22true%22%2C%22livecrawl%22%3A%22always%22%2C%22numResults%22%3A100%2C%22includeDomains%22%3A%5B%22twitter.com%22%2C%22x.com%22%5D%2C%22includeText%22%3A%5B%22exaailabs%22%5D%7D))
   - YouTube Videos ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai&filters=%7B%22type%22%3A%22keyword%22%2C%22includeDomains%22%3A%5B%22youtube.com%22%5D%2C%22numResults%22%3A10%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - Reddit Discussions ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai&filters=%7B%22type%22%3A%22keyword%22%2C%22includeDomains%22%3A%5B%22reddit.com%22%5D%2C%22includeText%22%3A%5B%22exa.ai%22%5D%7D))
   - GitHub ([Try API](https://dashboard.exa.ai/playground/search?q=exa.ai%20Github%3A&filters=%7B%22type%22%3A%22keyword%22%2C%22numResults%22%3A1%2C%22includeDomains%22%3A%5B%22github.com%22%5D%7D))

<br>

## 💻 Tech Stack
- **Search Engine**: [Exa.ai](https://exa.ai) - Web search API optimized for AI applications
- **Frontend**: [Next.js](https://nextjs.org/docs) with App Router, [TailwindCSS](https://tailwindcss.com), TypeScript
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs/ai-sdk-core)
- **Hosting**: [Vercel](https://vercel.com/)

<br>

## 🚀 Getting Started

### Prerequisites
- Node.js
- Exa.ai API key
- Anthropic API key
- (Optional) YouTube API key
- (Optional) GitHub token

### Installation

1. Clone the repository
```bash
git clone https://github.com/exa-labs/company-researcher.git
cd company-researcher
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Set up environment variables as described in the section below

4. Run the development server
```bash
npm run dev
# or
yarn dev
```

5. Open http://localhost:3000 in your browser

<br>

## 🔑 API Keys & Environment Setup

### Required API Keys
* **Exa API Key**: Get from [Exa Dashboard](https://dashboard.exa.ai/api-keys)
* **Anthropic API Key**: Get from [Anthropic Console](https://console.anthropic.com/)

### Optional API Keys (for additional features)
* **YouTube API Key**: Get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (for YouTube video fetching)
* **GitHub Token**: Get from [GitHub Settings](https://github.com/settings/tokens) (for GitHub repository data)

> Note: The application can run without the optional API keys. YouTube and GitHub features can be disabled by commenting out their respective code sections.

### Environment Setup

Create a `.env.local` file in the root directory with the following structure:

```env
# Required
EXA_API_KEY=your_exa_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Optional - for additional features
YOUTUBE_API_KEY=your_youtube_api_key
NEXT_PUBLIC_GITHUB_TOKEN=your_github_token
```

> For deployment on platforms like Vercel, add these environment variables in your platform's settings.

Alternatively, you can create a copy of our example environment file:
```bash
cp .env.example .env.local
```
Then fill in your API keys in the newly created `.env.local` file.

<br>

## ⭐ About [Exa.ai](https://exa.ai)

This project is powered by [Exa.ai](https://exa.ai), a powerful search engine and web search API designed specifically for AI applications. Exa provides:

* Advanced semantic search capabilities
* Clean web content extraction
* Real-time data retrieval
* Comprehensive web search functionality
* Superior search accuracy for AI applications

[Try Exa search](https://exa.ai/search)

<br>

---

Built with ❤️ by team Exa
