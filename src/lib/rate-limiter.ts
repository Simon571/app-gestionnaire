/**
 * Rate limiter middleware pour les API routes
 * Prévient les attaques par force brute et DoS
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = {
  login: 5,           // 5 tentatives de connexion par 15 min
  signup: 3,          // 3 inscriptions par 15 min
  apiCall: 100,       // 100 appels génériques par 15 min
  dataExport: 2,      // 2 exports de données par 15 min
  dataDelete: 1,      // 1 suppression par 15 min
} as const;

export function getRateLimitKey(
  request: NextRequest,
  identifier: string = 'default'
): string {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  return `${ip}:${identifier}`;
}

export function checkRateLimit(
  key: string,
  limit: number = RATE_LIMIT_MAX_REQUESTS.apiCall
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const current = rateLimitStore[key];

  // Initialiser ou réinitialiser après la fenêtre
  if (!current || now > current.resetTime) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    };
    return {
      allowed: true,
      remaining: limit - 1,
      resetTime: rateLimitStore[key].resetTime
    };
  }

  // Incrémenter le compteur
  current.count++;

  const allowed = current.count <= limit;
  const remaining = Math.max(0, limit - current.count);

  return {
    allowed,
    remaining,
    resetTime: current.resetTime
  };
}

export function rateLimitMiddleware(
  limit: number = RATE_LIMIT_MAX_REQUESTS.apiCall,
  identifier: string = 'default'
) {
  return (handler: Function) => {
    return async (request: NextRequest) => {
      const key = getRateLimitKey(request, identifier);
      const { allowed, remaining, resetTime } = checkRateLimit(key, limit);

      const response = await handler(request);

      // Ajouter les headers de rate limiting
      response.headers.set('X-RateLimit-Limit', String(limit));
      response.headers.set('X-RateLimit-Remaining', String(remaining));
      response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));

      if (!allowed) {
        const resetDate = new Date(resetTime).toISOString();
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
            resetTime: resetDate
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(limit),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000)),
              'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
            }
          }
        );
      }

      return response;
    };
  };
}

/**
 * Valider une requête API
 */
export function validateApiRequest(
  request: NextRequest,
  allowedMethods: string[] = ['POST']
): { valid: boolean; error?: string } {
  // Vérifier la méthode HTTP
  if (!allowedMethods.includes(request.method)) {
    return { valid: false, error: `Method ${request.method} not allowed` };
  }

  // Vérifier le Content-Type pour POST/PUT
  if (['POST', 'PUT'].includes(request.method)) {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return { valid: false, error: 'Content-Type must be application/json' };
    }
  }

  // Vérifier les headers de sécurité
  const origin = request.headers.get('origin');
  const expectedOrigin = process.env.NEXT_PUBLIC_CORS_ORIGIN || 'http://localhost:3000';
  
  if (origin && !origin.includes(expectedOrigin)) {
    return { valid: false, error: 'CORS origin not allowed' };
  }

  return { valid: true };
}

/**
 * Wrapper pour les API routes sécurisées
 */
export async function secureApiRoute(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    allowedMethods?: string[];
    rateLimit?: number;
    rateLimitId?: string;
    requireAuth?: boolean;
  } = {}
): Promise<NextResponse> {
  const {
    allowedMethods = ['POST'],
    rateLimit = RATE_LIMIT_MAX_REQUESTS.apiCall,
    rateLimitId = 'default',
    requireAuth = false
  } = options;

  // 1. Valider la requête
  const validation = validateApiRequest(request, allowedMethods);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  // 2. Vérifier le rate limiting
  const key = getRateLimitKey(request, rateLimitId);
  const { allowed, remaining, resetTime } = checkRateLimit(key, rateLimit);

  if (!allowed) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000)
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': '0',
          'Retry-After': String(Math.ceil((resetTime - Date.now()) / 1000))
        }
      }
    );
  }

  // 3. Vérifier l'authentification (si requis)
  if (requireAuth) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    // Vérifier le token (à implémenter avec votre logique)
    // const token = authHeader.substring(7);
    // if (!verifyToken(token)) {
    //   return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    // }
  }

  // 4. Exécuter le handler
  try {
    const response = await handler(request);

    // Ajouter les headers de rate limit
    response.headers.set('X-RateLimit-Limit', String(rateLimit));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetTime / 1000)));

    // Ajouter les headers de sécurité
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');

    return response;
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
