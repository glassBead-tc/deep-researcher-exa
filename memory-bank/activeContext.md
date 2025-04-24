# Active Context: Report and Answer Generation Refactoring

## Current Task
Refactoring the deep-researcher codebase to consolidate duplicate answer generation systems.

## Implementation Status
- Created a unified function `generateResearchResponse` in `deep-researcher/lib/deep-research/deep-research.ts` that:
  - Takes a detail level parameter ('detailed' or 'concise') but always generates a full report
  - Has a comment "// Always generate a full report regardless of detailLevel parameter"
  - Handles both report generation and concise answer generation
  - Maintains the same core logic as the original functions
  - Returns appropriate data structure for both use cases

- Updated the original functions to use the new unified function:
  - `writeFinalReport` now calls `generateResearchResponse` with `detailLevel: 'detailed'`
  - `writeFinalAnswer` now calls `generateResearchResponse` with `detailLevel: 'detailed'` (not 'concise')
  - Comment in `writeFinalAnswer`: "// Always use detailed path even for final answers"

- Updated `runSynthesisAgent` in `deep-researcher/lib/synthesis/synthesisAgent.ts` to:
  - Map the mode parameter ('report' or 'answer') to the appropriate detail level
  - Call the new unified function instead of the original functions
  - Maintain the same return structure for backward compatibility

## Key Design Decisions
- Maintained backward compatibility by keeping the original function names and signatures
- Used a unified approach to handle both detailed reports and concise answers
- Added appropriate interfaces and types for the new function
- Ensured the same metadata is returned for each mode
- **Important**: The implementation always generates a full report regardless of the detailLevel parameter

## Next Steps
- Test the refactored code to ensure it works as expected
- Consider adding more detail levels if needed in the future
- Update any tests that might be affected by the refactoring