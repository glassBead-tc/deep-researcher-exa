# Synthesis Module

This module provides functionality to synthesize research findings into coherent, narrative text.

## Components

### `synthesizeLearnings`

The `synthesizeLearnings` function transforms an array of research learnings into cohesive, narrative text based on a given prompt. It uses an AI model to convert bullet-point style research findings into well-structured, formal prose with logical paragraph organization and smooth transitions.

#### Usage

```typescript
import { synthesizeLearnings } from '@/lib/synthesis/synthesisAgent';

// Example usage
async function generateSynthesis() {
  const learnings = [
    "Company X was founded in 2010 by John Doe.",
    "Company X has raised $50M in funding.",
    "Their main product is a SaaS platform for data analytics.",
    "They have 200 employees across 5 offices globally."
  ];
  
  const prompt = "Research about Company X";
  
  // Basic usage
  const synthesis = await synthesizeLearnings(learnings, prompt);
  
  // With options
  const formalSynthesis = await synthesizeLearnings(learnings, prompt, {
    tone: 'formal',
    maxLength: 300
  });
  
  return synthesis;
}
```

#### Parameters

- `learnings`: Array of string learnings/insights to be synthesized
  - Each string should contain a single, discrete piece of information
  - The array can contain any number of items
  - If empty or null, the function returns a default message
  - For large arrays, the function automatically processes them in batches
- `prompt`: The user prompt providing context for the synthesis
  - This helps the AI understand the topic and focus of the synthesis
  - Should be concise but descriptive
- `options`: Optional configuration parameters
  - `maxLength`: Optional maximum length for the synthesized output (in words)
  - `tone`: Optional tone setting, defaults to 'formal'. Can be 'formal', 'informative', or 'analytical'
  - `batchSize`: Optional batch size for processing large arrays of learnings (default: 50)

#### Returns

A Promise that resolves to a string containing the synthesized narrative. The narrative will:
- Combine related learnings into coherent paragraphs
- Include smooth transitions between ideas
- Maintain the specified tone throughout
- Present information in a logical order
- Not include introductory or concluding remarks outside the synthesized content

#### Error Handling

The function handles several error cases:

1. **Empty or null learnings array**: Returns "No research findings to synthesize."
   ```typescript
   const emptyResult = await synthesizeLearnings([], "Query");
   console.log(emptyResult); // "No research findings to synthesize."
   ```

2. **AI model failure**: Throws an error with a descriptive message
   ```typescript
   try {
     const synthesis = await synthesizeLearnings(learnings, prompt);
   } catch (error) {
     console.error("Synthesis failed:", error.message);
     // Handle the error appropriately
   }
   ```

#### Implementation Details

The function:
1. Validates the input learnings array
2. For large arrays, processes learnings in batches to avoid token limits
3. Formats each learning with XML tags for better AI processing
4. Constructs a complete prompt with system instructions, tone settings, length constraints, and the formatted learnings
5. Ensures the prompt doesn't exceed token limits
6. Calls the AI model with the constructed prompt
7. For batched processing, combines the results into a final synthesis
8. Returns the AI-generated synthesis

#### Performance Optimizations

The function includes several optimizations for handling large arrays of learnings:

1. **Automatic Batching**: For arrays larger than the specified batch size (default: 50), the function automatically processes the learnings in smaller batches and then combines the results.

   ```typescript
   // Process a large array of learnings with custom batch size
   const largeSynthesis = await synthesizeLearnings(manyLearnings, prompt, {
     batchSize: 30 // Process in batches of 30
   });
   ```

2. **Token Limit Protection**: The function ensures that prompts don't exceed token limits, using the `trimPrompt` utility when necessary.

3. **Structured Prompt Building**: Uses a modular approach to construct prompts, making the code more maintainable and easier to extend.

## Integration Examples

### API Route Integration

```typescript
// In an API route
import { synthesizeLearnings } from '@/lib/synthesis/synthesisAgent';

export async function POST(request: Request) {
  const { learnings, prompt } = await request.json();
  
  try {
    // Determine if we need to use batching based on array size
    const options = {
      tone: 'informative',
      // Use a smaller batch size for very large arrays
      ...(learnings.length > 100 ? { batchSize: 30 } : {})
    };
    
    const synthesis = await synthesizeLearnings(learnings, prompt, options);
    
    return Response.json({ synthesis });
  } catch (error) {
    console.error('Synthesis error:', error);
    return Response.json({ error: 'Failed to synthesize learnings' }, { status: 500 });
  }
}
```

This example demonstrates how to conditionally apply batching based on the size of the learnings array, which is particularly useful in API routes where you might receive varying amounts of data.

### Component Integration

```tsx
// In a React component
'use client';

import { useState } from 'react';
import { synthesizeLearnings } from '@/lib/synthesis/synthesisAgent';

export default function SynthesisComponent({ learnings, prompt }) {
  const [synthesis, setSynthesis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSynthesize = async () => {
    setIsLoading(true);
    try {
      const result = await synthesizeLearnings(learnings, prompt);
      setSynthesis(result);
    } catch (error) {
      console.error('Failed to synthesize:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <button 
        onClick={handleSynthesize}
        disabled={isLoading}
      >
        {isLoading ? 'Synthesizing...' : 'Synthesize Learnings'}
      </button>
      
      {synthesis && (
        <div className="mt-4">
          <h3>Synthesis</h3>
          <div className="prose">{synthesis}</div>
        </div>
      )}
    </div>
  );
}
```

### Advanced Usage Examples

#### Controlling Output Length

When you need to limit the synthesis to a specific length:

```typescript
const conciseSynthesis = await synthesizeLearnings(learnings, prompt, {
  maxLength: 150 // Limit to approximately 150 words
});
```

#### Setting Different Tones

Adjust the tone based on your audience or purpose:

```typescript
// For a formal business report
const formalSynthesis = await synthesizeLearnings(learnings, prompt, {
  tone: 'formal'
});

// For educational content
const informativeSynthesis = await synthesizeLearnings(learnings, prompt, {
  tone: 'informative'
});

// For data-focused content
const analyticalSynthesis = await synthesizeLearnings(learnings, prompt, {
  tone: 'analytical'
});
```

#### Handling Large Arrays of Learnings

For large arrays of learnings, you can control the batch size:

```typescript
// Process a large array of learnings with custom batch size
const largeSynthesis = await synthesizeLearnings(manyLearnings, prompt, {
  batchSize: 30 // Process in batches of 30 instead of the default 50
});
```

The function will automatically:
1. Split the learnings into batches of the specified size
2. Process each batch separately
3. Combine the results into a final synthesis

This approach helps avoid token limits and ensures consistent quality even with very large datasets.

#### Combining Options

You can combine multiple options for precise control:

```typescript
const customSynthesis = await synthesizeLearnings(learnings, prompt, {
  tone: 'analytical',
  maxLength: 200,
  batchSize: 40
});
```

### Error Handling Examples

Robust error handling in a component:

```tsx
const [synthesis, setSynthesis] = useState('');
const [error, setError] = useState(null);
const [isLoading, setIsLoading] = useState(false);

const handleSynthesize = async () => {
  setIsLoading(true);
  setError(null);
  
  try {
    // Check if learnings array is valid
    if (!learnings || learnings.length === 0) {
      setSynthesis('No research findings to synthesize.');
      return;
    }
    
    const result = await synthesizeLearnings(learnings, prompt, options);
    setSynthesis(result);
  } catch (error) {
    console.error('Synthesis error:', error);
    setError(`Failed to generate synthesis: ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};
```

## System Integration

The `synthesizeLearnings` function is integrated into the research workflow as follows:

1. The user submits a research query through the UI
2. The system performs deep research to gather information
3. The research findings are collected as an array of learnings
4. The `synthesizeLearnings` function is called to transform these discrete learnings into a cohesive narrative
5. The synthesized text is returned to the UI where it can be displayed as one of the view options

This integration provides users with multiple ways to consume the research results:
- As raw, individual learnings (useful for detailed analysis)
- As a synthesized narrative (better for quick understanding and readability)
- As a concise answer (for direct response to the query)