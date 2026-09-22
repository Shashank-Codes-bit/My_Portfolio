/** Static suggested questions per route, addressed to Shashank ("you"). Three per route. */
export const suggestions: Record<string, string[]> = {
  "/": ["What do you actually build?", "Is any of it live?", "What are you looking for?"],
  "/work/hr-policy-assistant": ["How does it stay grounded?", "What happens when it doesn't know?", "Could this work on our documents?"],
  "/work/dhobi-dash": ["How did you find the first customer?", "Why an AI builder?", "What keeps the data clean?"],
  "/work/tdd-generator": ["What problem does it solve?", "How does the output stay consistent?", "Is it live?"],
  "/work/booking-agent": ["Why shouldn't the model drive the flow?", "How is this different from an IVR?", "When will it be done?"],
  "/work/voltas": ["What does the monitoring cover?", "How big is the payout saving?", "What's the stack?"],
  "/work/hero": ["Why bypass the business layer?", "What did that trade off?", "What was the outcome?"],
  "/work/airtel": ["What does the validation layer prevent?", "What drove the 17%?", "What else shipped there?"],
  "/work/mitsubishi-fuso": ["How big was the estate?", "What was the DocuSign work?", "What about incidents?"],
  "/how-i-build": ["Have you ever broken one of these?", "Which is most contentious?", "Where did these come from?"],
  "/about": ["How did you get from graduate engineer to this?", "Why AI, coming from CRM?", "What are you strongest at?"],
};

export const suggestionsFor = (route: string): string[] => suggestions[route] ?? suggestions["/"];

export const allSuggestionStrings = (): string[] => Array.from(new Set(Object.values(suggestions).flat()));
