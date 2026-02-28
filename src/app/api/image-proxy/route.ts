import { NextRequest, NextResponse } from 'next/server';

// API endpoint для проксирования изображений с Google Drive
// Это решает проблему CORS, так как серверные запросы не подчиняются CORS политике

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileId = searchParams.get('id');
  const url = searchParams.get('url');

  let targetUrl = '';

  if (fileId) {
    // Если передан ID файла, формируем URL
    targetUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
  } else if (url) {
    // Если передан полный URL, извлекаем ID
    const idMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      targetUrl = `https://drive.google.com/uc?export=view&id=${idMatch[1]}`;
    } else if (url.includes('uc?export=')) {
      targetUrl = url;
    } else {
      return NextResponse.json(
        { error: 'Invalid Google Drive URL' },
        { status: 400 }
      );
    }
  } else {
    return NextResponse.json(
      { error: 'Missing id or url parameter' },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Кеш на 24 часа
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
