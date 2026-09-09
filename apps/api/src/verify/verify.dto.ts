import { z } from 'zod';

const responseItemSchema = z.object({
  identifier: z.string().min(1),
  nullifier: z.string().min(1),
  signal_hash: z.string().optional(),
  proof: z.union([z.string(), z.array(z.string())]),
  merkle_root: z.string().optional(),
  issuer_schema_id: z.number().optional(),
});

export const idkitResultSchema = z.object({
  protocol_version: z.string().min(1),
  nonce: z.string().min(1),
  action: z.string().optional(),
  action_description: z.string().optional(),
  environment: z.string().optional(),
  responses: z.array(responseItemSchema).min(1, 'result contained no credential responses'),
});

export type IdkitResultDto = z.infer<typeof idkitResultSchema>;
