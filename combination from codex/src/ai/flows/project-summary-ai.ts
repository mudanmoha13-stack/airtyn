'use server';
/**
 * @fileOverview A Genkit flow for generating concise summaries of project activity or task discussions.
 *
 * - summarizeProjectActivity - A function that handles the project activity or task discussion summarization process.
 * - ProjectSummaryInput - The input type for the summarizeProjectActivity function.
 * - ProjectSummaryOutput - The return type for the summarizeProjectActivity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectSummaryInputSchema = z.object({
  contentToSummarize: z
    .string()
    .describe('The project activity or task discussion content to summarize.'),
  summaryLength: z
    .enum(['short', 'medium', 'long'])
    .default('medium')
    .describe('Desired length of the summary.'),
  focus:
    z.string().optional().describe('Optional focus or key aspects the summary should highlight.'),
});
export type ProjectSummaryInput = z.infer<typeof ProjectSummaryInputSchema>;

const ProjectSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the provided content.'),
});
export type ProjectSummaryOutput = z.infer<typeof ProjectSummaryOutputSchema>;

export async function summarizeProjectActivity(
  input: ProjectSummaryInput
): Promise<ProjectSummaryOutput> {
  return projectSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'projectSummaryPrompt',
  input: {schema: ProjectSummaryInputSchema},
  output: {schema: ProjectSummaryOutputSchema},
  prompt: `You are an AI assistant specialized in project management. Your task is to provide a concise summary of the provided content, which could be recent project activity or a lengthy task discussion thread.

Desired summary length: "{{summaryLength}}".
{{#if focus}}
Focus on the following key aspects: "{{focus}}".
{{/if}}

Please summarize the following content:

--- Content to Summarize ---
{{{contentToSummarize}}}
--- End Content ---`,
});

const projectSummaryFlow = ai.defineFlow(
  {
    name: 'projectSummaryFlow',
    inputSchema: ProjectSummaryInputSchema,
    outputSchema: ProjectSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate project summary.');
    }
    return output;
  }
);
