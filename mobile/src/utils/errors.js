export const userMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error?.response) return 'Unable to reach FinFlow. Check your connection and try again.';
  if (error.response.status === 429) return 'Too many requests. Please wait a moment and try again.';
  return error.response.data?.message || error.response.data?.errors?.[0]?.msg || fallback;
};
