import { synthesizeLearnings, SynthesisOptions } from './synthesisAgent';
import { synthesisSystemPrompt } from '../deep-research/prompt';

// Mock the callAIModel function
jest.mock('../deep-research/ai/providers', () => ({
  callAIModel: jest.fn().mockImplementation(async (prompt: string) => {
    return 'Synthesized text from AI model';
  }),
  trimPrompt: jest.fn().mockImplementation((prompt: string) => prompt),
}));

// Import the mocked function
import { callAIModel } from '../deep-research/ai/providers';

describe('synthesizeLearnings', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test that synthesizeLearnings correctly formats the input for the AI model.
  test('should correctly format input for the AI model', async () => {
    // Arrange
    const learnings = ['Learning 1', 'Learning 2'];
    const prompt = 'Test prompt';
    
    // Act
    await synthesizeLearnings(learnings, prompt);
    
    // Assert
    // Check that the formatted learnings are included in the prompt
    const expectedFormattedLearnings = '<learning>Learning 1</learning>\n<learning>Learning 2</learning>';
    expect((callAIModel as jest.Mock).mock.calls[0][0]).toContain(expectedFormattedLearnings);
    
    // Check that the prompt is included in the complete prompt
    expect((callAIModel as jest.Mock).mock.calls[0][0]).toContain(`CONTEXT: ${prompt}`);
    
    // Check that the system prompt is included
    expect((callAIModel as jest.Mock).mock.calls[0][0]).toContain(synthesisSystemPrompt());
  });

  // Test that synthesizeLearnings handles empty learnings array gracefully.
  test('should handle empty learnings array gracefully', async () => {
    // Arrange
    const learnings: string[] = [];
    const prompt = 'Test prompt';
    
    // Act
    const result = await synthesizeLearnings(learnings, prompt);
    
    // Assert
    expect(result).toBe('No research findings to synthesize.');
    expect(callAIModel).not.toHaveBeenCalled();
  });

  // Test that synthesizeLearnings calls the AI model with the correct combined prompt.
  test('should call the AI model with the correct combined prompt', async () => {
    // Arrange
    const learnings = ['Learning 1', 'Learning 2'];
    const prompt = 'Test prompt';
    
    // Act
    await synthesizeLearnings(learnings, prompt);
    
    // Assert
    expect(callAIModel).toHaveBeenCalledTimes(1);
    
    const completePrompt = (callAIModel as jest.Mock).mock.calls[0][0];
    expect(completePrompt).toContain(synthesisSystemPrompt());
    expect(completePrompt).toContain(`CONTEXT: ${prompt}`);
    expect(completePrompt).toContain('LEARNINGS TO SYNTHESIZE:');
    expect(completePrompt).toContain('<learning>Learning 1</learning>');
    expect(completePrompt).toContain('<learning>Learning 2</learning>');
    expect(completePrompt).toContain('Please synthesize these learnings into a cohesive narrative that addresses the context.');
  });

  // Test that synthesizeLearnings returns the AI model's response.
  test('should return the AI model\'s response', async () => {
    // Arrange
    const learnings = ['Learning 1', 'Learning 2'];
    const prompt = 'Test prompt';
    const mockResponse = 'Synthesized text from AI model';
    (callAIModel as jest.Mock).mockResolvedValueOnce(mockResponse);
    
    // Act
    const result = await synthesizeLearnings(learnings, prompt);
    
    // Assert
    expect(result).toBe(mockResponse);
  });

  // Test that synthesizeLearnings throws an error if the AI model call fails.
  test('should throw an error if the AI model call fails', async () => {
    // Arrange
    const learnings = ['Learning 1', 'Learning 2'];
    const prompt = 'Test prompt';
    const errorMessage = 'AI model call failed';
    (callAIModel as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
    
    // Act & Assert
    await expect(synthesizeLearnings(learnings, prompt)).rejects.toThrow(`Failed to synthesize learnings: ${errorMessage}`);
  });

  // Test that synthesizeLearnings correctly uses the maxLength option
  test('should include maxLength in the prompt when provided', async () => {
    // Arrange
    const learnings = ['Learning 1', 'Learning 2'];
    const prompt = 'Test prompt';
    const options = { maxLength: 500 };
    
    // Act
    await synthesizeLearnings(learnings, prompt, options);
    
    // Assert
    const completePrompt = (callAIModel as jest.Mock).mock.calls[0][0];
    expect(completePrompt).toContain(`Keep the synthesis under approximately ${options.maxLength} words.`);
  });

  // Test that synthesizeLearnings correctly uses the tone option
  test('should include tone in the prompt when provided', async () => {
    // Arrange
    const learnings = ['Learning 1', 'Learning 2'];
    const prompt = 'Test prompt';
    const options = { tone: 'analytical' as const };
    
    // Act
    await synthesizeLearnings(learnings, prompt, options);
    
    // Assert
    const completePrompt = (callAIModel as jest.Mock).mock.calls[0][0];
    expect(completePrompt).toContain(`Maintain a ${options.tone} tone throughout the synthesis.`);
  });

  // Test that synthesizeLearnings correctly uses both maxLength and tone options
  test('should include both maxLength and tone in the prompt when provided', async () => {
    // Arrange
    const learnings = ['Learning 1', 'Learning 2'];
    const prompt = 'Test prompt';
    const options: SynthesisOptions = {
      maxLength: 500,
      tone: 'informative'
    };
    
    // Act
    await synthesizeLearnings(learnings, prompt, options);
    
    // Assert
    const completePrompt = (callAIModel as jest.Mock).mock.calls[0][0];
    expect(completePrompt).toContain(`Maintain a ${options.tone} tone throughout the synthesis.`);
    expect(completePrompt).toContain(`Keep the synthesis under approximately ${options.maxLength} words.`);
  });

  // Test that synthesizeLearnings handles null learnings array
  test('should handle null learnings array gracefully', async () => {
    // Arrange
    const learnings = null as unknown as string[];
    const prompt = 'Test prompt';
    
    // Act
    const result = await synthesizeLearnings(learnings, prompt);
    
    // Assert
    expect(result).toBe('No research findings to synthesize.');
    expect(callAIModel).not.toHaveBeenCalled();
  });

  // Test that synthesizeLearnings processes large arrays in batches
  test('should process large arrays in batches', async () => {
    // Arrange
    // Create an array with more items than the default batch size
    const learnings = Array(60).fill(0).map((_, i) => `Learning ${i + 1}`);
    const prompt = 'Test prompt';
    const options: SynthesisOptions = {
      batchSize: 20 // Set a smaller batch size for testing
    };
    
    // Mock implementation for batched processing
    (callAIModel as jest.Mock).mockImplementation(async (prompt: string) => {
      if (prompt.includes('Part 1 of 3')) return 'Batch 1 synthesis';
      if (prompt.includes('Part 2 of 3')) return 'Batch 2 synthesis';
      if (prompt.includes('Part 3 of 3')) return 'Batch 3 synthesis';
      if (prompt.includes('Final synthesis')) return 'Final combined synthesis';
      return 'Unexpected prompt';
    });
    
    // Act
    const result = await synthesizeLearnings(learnings, prompt, options);
    
    // Assert
    // Should have been called 4 times: 3 batches + 1 final synthesis
    expect(callAIModel).toHaveBeenCalledTimes(4);
    expect(result).toBe('Final combined synthesis');
  });
});