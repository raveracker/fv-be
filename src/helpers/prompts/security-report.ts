export const securityReportUserContent = (
  domain: string,
  formattedInfo: string,
) => {
  return `Based on this information about ${domain}:

    ${formattedInfo}

    Generate a structured security report following this format:
    - domain: The domain name
    - isScam: Boolean indicating if the site is likely a scam
    - riskFactor: One of "Very Low", "Low", "Medium", "High", or "Very High"
    - domainRating: A number from 1-10 where 10 is completely trustworthy
    - summary: A concise overall assessment of the domain's legitimacy and reputation
    `.trim();
};

export const securityAnalysisFunction = {
  name: 'security_reputation_analysis',
  description: 'Returns a JSON object matching the security report schema.',
  parameters: {
    type: 'object',
    properties: {
      domain: { type: 'string' },
      isScam: { type: 'boolean' },
      riskFactor: {
        type: 'string',
        enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
      },
      domainRating: { type: 'number' },
      summary: { type: 'string' },
    },
    required: ['domain', 'isScam', 'riskFactor', 'domainRating', 'summary'],
    additionalProperties: false,
  },
};
