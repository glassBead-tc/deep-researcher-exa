import { OpenAI } from "openai";
import { traceable } from "langsmith/traceable";
import { wrapOpenAI } from "langsmith/wrappers";
import { setupLangSmith } from "./lib/langsmith";

async function main() {
  // Check if environment variables are properly set
  setupLangSmith();

  // Initialize and wrap the OpenAI client to trace LLM calls automatically
  const client = wrapOpenAI(new OpenAI());
  
  // Create a simple traceable pipeline (similar to how deepResearch is wrapped)
  const pipeline = traceable(
    async (userInput: string) => {
      console.log(`Processing input: "${userInput}"`);
      
      // First step - get topics to research
      const topics = await client.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "You are a helpful research assistant. Generate 3 topics to research based on the query."
          },
          { 
            role: "user", 
            content: `Generate 3 specific research topics for: ${userInput}` 
          }
        ],
        model: "gpt-3.5-turbo",
      });
      
      console.log("Generated topics:", topics.choices[0].message.content);
      
      // Second step - generate a report
      const result = await client.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: "You are a helpful research assistant. Create a brief summary based on these topics." 
          },
          { 
            role: "user", 
            content: `Create a brief summary about: ${userInput}\n\nTopics to include:\n${topics.choices[0].message.content}` 
          }
        ],
        model: "gpt-3.5-turbo",
      });
      
      return result.choices[0].message.content;
    },
    { name: "research_pipeline_test", run_type: "chain" }
  );

  try {
    console.log("Running test pipeline...");
    const response = await pipeline("LangSmith observability benefits");
    console.log("\nResponse:", response);
    
    console.log("\nSuccess! Check your LangSmith dashboard to see the traced run.");
    console.log("You'll see the entire pipeline traced as one process, with any LLM calls nested within.");
    console.log("Dashboard URL: https://smith.langchain.com/");
  } catch (error) {
    console.error("Error running test:", error);
    console.log("\nTroubleshooting tips:");
    console.log("1. Make sure your LANGSMITH_API_KEY is correct");
    console.log("2. Ensure LANGSMITH_TRACING is set to 'true'");
    console.log("3. Check your OpenAI API key is set properly");
  }
}

main().catch(console.error); 