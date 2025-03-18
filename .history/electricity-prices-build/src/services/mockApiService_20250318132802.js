import { handlePriceApi } from './apiService';

export async function handleStaticApi(req, res) {
  try {
    const data = await handlePriceApi(req.url);
    
    // Set CORS and caching headers for APIs
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 min cache
    res.setHeader('Content-Type', 'application/json');
    
    return JSON.stringify(data, null, 2);
  } catch (error) {
    res.statusCode = 500;
    return JSON.stringify({ error: 'Internal server error' });
  }
}
