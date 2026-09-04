export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (data.details && data.details.length > 0) return data.details.join('; ');
  return data.message || fallback;
}
