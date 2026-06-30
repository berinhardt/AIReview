/**
 * Records a review decision (accepted or rejected).
 *
 * @param {Object} params - The parameters for recording the review result.
 * @param {boolean} params.accepted - Whether the review is accepted.
 * @param {Object} env - The environment context.
 * @param {Object} env.agent - The agent context.
 * @param {Object} env.agent.notes - The agent's notes.
 * @returns {Promise<{success: boolean}>} A promise that resolves to an object indicating success.
 * @throws {Error} Throws an error if the 'accepted' parameter is not a boolean.
 */
export const ReviewResult = async (param, env) => {
   if (typeof param.accepted !== 'boolean') {
      throw new Error("Parameter 'accepted' must be a boolean.");
   }
   env.agent.notes.reviewAccepted = param.accepted;
   return { success: true };
};

ReviewResult.TOOLDEF = {
   type: 'function',
   name: 'ReviewTools_ReviewResult',
   description: 'Record a review decision (accepted or rejected).',
   parameters: {
      type: 'object',
      properties: {
         accepted: {
            type: 'boolean',
            description: 'Whether the review is accepted.'
         }
      },
      required: ['accepted']
   }
};
