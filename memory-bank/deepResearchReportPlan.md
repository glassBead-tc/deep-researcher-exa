# Deep Research Output Transformation Plan

## Objective
Transform the multi-section output of the Deep Research process into a single, cohesive, opinionated academic report that presents and argues for the answer to the user's query, leveraging the research findings.

## Current State Analysis
The current Deep Research output is presented in distinct sections:
-   **Learnings:** Raw facts and information extracted from sources.
-   **Visited URLs:** List of sources consulted.
-   **Synthesized Learnings:** A summary or combination of information from the Learnings.
-   **Answer:** A concise answer to the query.

While comprehensive, this format requires the user to navigate different sections to understand the full context and the reasoning behind the answer.

## Desired End State
A single report with the following characteristics:
-   **Format:** Markdown or plain text, suitable for direct presentation to the user.
-   **Tone:** Opinionated and academic, presenting a clear argument for the chosen answer.
-   **Content:**
    -   Starts with the query and the determined answer.
    -   Presents the key findings from the "Learnings" and "Synthesized Learnings" sections as evidence supporting the answer.
    -   Academically argues why the chosen answer is the "single most historically important" (or relevant to the specific query) based on the evidence.
    -   References the "Visited URLs" as sources for the information presented.
    -   Addresses potential counterarguments or alternative interpretations if relevant information is present in the research output.
    -   Concludes with a summary reinforcing the main argument.

## Implementation Steps

1.  **Identify Output Source:** Locate the code responsible for generating the final Deep Research output structure (likely within `company-researcher/lib/deep-research/`).
2.  **Access Output Data:** Determine how to access the data from each section (Learnings, Visited URLs, Synthesized Learnings, Answer) programmatically.
3.  **Develop Report Generation Logic:**
    *   Create a function or module responsible for taking the structured research output data as input.
    *   Implement logic to format the query and answer at the beginning of the report.
    *   Implement logic to select and structure the most relevant "Learnings" and "Synthesized Learnings" to serve as evidence.
    *   Implement logic to construct the argumentative narrative, linking the evidence to the answer in an academic tone.
    *   Implement logic to include the "Visited URLs" section, potentially formatted as a bibliography or references list.
    *   Consider adding logic to identify and incorporate information that could represent counterarguments, framing them within the academic discussion.
4.  **Integrate Report Generation:** Modify the existing Deep Research process to call the new report generation logic after the research is complete and before presenting the output to the user.
5.  **Update User Interface (if applicable):** If the output is displayed in a UI, update the UI component to display the single report instead of the tabbed sections. (Based on the image, this seems to be a likely requirement).
6.  **Handle Edge Cases:**
    *   Implement graceful handling for cases where research yields limited or no relevant information.
    *   Consider how to handle queries that may not have a single definitive answer based on the research. The report should reflect this ambiguity academically.
7.  **Add TDD Anchors:** Define specific test cases based on expected inputs and desired report outputs.

## Required Resources/Tools
-   Existing Deep Research code files (e.g., `company-researcher/lib/deep-research/deep-research.ts`, `company-researcher/app/api/research/route.ts`).
-   Potentially natural language processing (NLP) capabilities or prompt engineering techniques to assist in synthesizing and structuring the argumentative report content.

## TDD Anchors
-   Test case: Given research output with clear evidence for a single answer, the generated report should strongly argue for that answer, citing the evidence.
-   Test case: Given research output with conflicting information, the generated report should discuss the conflicting evidence and explain why one answer is favored (or if no single answer can be definitively determined).
-   Test case: Given research output with no relevant information, the generated report should state that no conclusive answer could be determined based on the research.
-   Test case: The generated report should always include the list of visited URLs.
-   Test case: The tone of the generated report should be consistently academic and opinionated towards the supported answer.