const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://g3xewrthlc.execute-api.us-east-1.amazonaws.com';

export async function fetchOptimizationData() {
  console.log('[API] Fetching optimization data from:', `${API_BASE_URL}/optimizer?action=analyze`);

  const response = await fetch(`${API_BASE_URL}/optimizer?action=analyze`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const responseText = await response.text();
  console.log('[API] Response status:', response.status);
  console.log('[API] Response body:', responseText);

  if (!response.ok) {
    const error = `[API error ${response.status}] ${responseText}`;
    console.error('[API] Fetch failed:', error);
    throw new Error(error);
  }

  try {
    const data = JSON.parse(responseText);
    console.log('[API] Parsed data:', data);
    console.log('[API] FRONTEND_RECEIVED - topServices:', data?.data?.topServices);
    console.log('[API] FRONTEND_RECEIVED - zombieResources:', data?.data?.zombieResources);
    console.log('[API] FRONTEND_RECEIVED - utilizationData:', data?.data?.utilizationData);
    console.log('[API] FRONTEND_RECEIVED - ec2Instances:', data?.data?.ec2Instances);
    return data;
  } catch (parseError) {
    console.error('[API] JSON parse error:', parseError);
    throw new Error(`Invalid JSON response: ${responseText}`);
  }
}

export async function fetchResourceMetadata() {
  console.log('[API] Fetching resource metadata from:', `${API_BASE_URL}/resources`);

  const response = await fetch(`${API_BASE_URL}/resources`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const responseText = await response.text();
  console.log('[API] Response status:', response.status);
  console.log('[API] Response body:', responseText);

  if (!response.ok) {
    const error = `[API error ${response.status}] ${responseText}`;
    console.error('[API] Fetch failed:', error);
    throw new Error(error);
  }

  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('[API] JSON parse error:', parseError);
    throw new Error(`Invalid JSON response: ${responseText}`);
  }
}