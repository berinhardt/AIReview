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
