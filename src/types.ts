import { z } from 'zod';

export const OllamaModelSchema = z.object({
  name: z.string(),
  model: z.string(),
  modified_at: z.string(),
  size: z.number(),
  digest: z.string(),
  details: z.object({
    parent_model: z.string(),
    format: z.string(),
    family: z.string(),
    families: z.array(z.string()).optional(),
    parameter_size: z.string(),
    quantization_level: z.string()
  })
});

export const OllamaGenerateRequestSchema = z.object({
  model: z.string(),
  prompt: z.string(),
  images: z.array(z.string()).optional(),
  format: z.string().optional(),
  options: z.record(z.any()).optional(),
  system: z.string().optional(),
  template: z.string().optional(),
  context: z.array(z.number()).optional(),
  stream: z.boolean().default(false),
  raw: z.boolean().optional(),
  keep_alive: z.string().optional()
});

export const OllamaChatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  images: z.array(z.string()).optional(),
  tool_calls: z.array(z.any()).optional()
});

export const OllamaChatRequestSchema = z.object({
  model: z.string(),
  messages: z.array(OllamaChatMessageSchema).min(1),
  tools: z.array(z.any()).optional(),
  format: z.string().optional(),
  options: z.record(z.any()).optional(),
  stream: z.boolean().default(false),
  keep_alive: z.string().optional()
});

export const OllamaListModelsResponseSchema = z.object({
  models: z.array(OllamaModelSchema)
});

export const OllamaGenerateResponseSchema = z.object({
  model: z.string(),
  created_at: z.string(),
  response: z.string(),
  done: z.boolean(),
  context: z.array(z.number()).optional(),
  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional()
});

export const OllamaChatResponseSchema = z.object({
  model: z.string(),
  created_at: z.string(),
  message: OllamaChatMessageSchema,
  done: z.boolean(),
  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
  prompt_eval_duration: z.number().optional(),
  eval_count: z.number().optional(),
  eval_duration: z.number().optional()
});

export type OllamaModel = z.infer<typeof OllamaModelSchema>;
export type OllamaGenerateRequest = z.infer<typeof OllamaGenerateRequestSchema>;
export type OllamaChatRequest = z.infer<typeof OllamaChatRequestSchema>;
export type OllamaChatMessage = z.infer<typeof OllamaChatMessageSchema>;
export type OllamaListModelsResponse = z.infer<typeof OllamaListModelsResponseSchema>;
export type OllamaGenerateResponse = z.infer<typeof OllamaGenerateResponseSchema>;
export type OllamaChatResponse = z.infer<typeof OllamaChatResponseSchema>;