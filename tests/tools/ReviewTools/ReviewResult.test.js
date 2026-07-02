import { describe, it, expect } from 'vitest';
import { ReviewResult } from '../../../tools/ReviewTools.js';

describe('ReviewResult', () => {
  it('should set reviewAccepted to true when accepted is true', async () => {
    const params = { accepted: true };
    const env = { agent: { notes: {} } };
    
    const result = await ReviewResult(params, env);
    
    expect(result).toEqual({ success: true });
    expect(env.agent.notes.reviewAccepted).toBe(true);
  });

  it('should set reviewAccepted to false when accepted is false', async () => {
    const params = { accepted: false };
    const env = { agent: { notes: {} } };
    
    const result = await ReviewResult(params, env);
    
    expect(result).toEqual({ success: true });
    expect(env.agent.notes.reviewAccepted).toBe(false);
  });

  it('should throw an error if accepted is not a boolean', async () => {
    const params = { accepted: 'true' }; // Invalid type
    const env = { agent: { notes: {} } };
    
    await expect(ReviewResult(params, env)).rejects.toThrow("Parameter 'accepted' must be a boolean.");
  });
});
