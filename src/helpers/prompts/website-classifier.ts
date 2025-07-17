export const websiteClassifierPrompt = (data: any) => {
  return `
        Analyze the following website content in this JSON format:

        Title: ${data.title}
        H1: ${data.h1}
        Meta Description: ${data.metaDescription}

        Products: ${JSON.stringify(data.products, null, 2)}
        Organization: ${JSON.stringify(data.organization, null, 2)}

        Answer the following:
        1. What product or service does this website offer?
        2. What category of business is it in?
        3. Who is the likely target audience?
    `.trim();
};
