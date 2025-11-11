/**
 * Exemple d'API route sécurisée
 * POST /api/auth/login
 * 
 * Avec:
 * - Rate limiting (5 tentatives par 15 min)
 * - Validation des entrées
 * - Gestion des erreurs sécurisée
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureApiRoute, RATE_LIMIT_MAX_REQUESTS } from '@/lib/rate-limiter';
import { AuditLog, EncryptionService } from '@/lib/encryption-service';
import { SecureAuthService } from '@/lib/secure-auth-service';

export async function POST(request: NextRequest) {
  return secureApiRoute(
    request,
    async (req) => {
      try {
        const body = await req.json();
        const { email, password } = body;

        // 1. Valider les entrées
        if (!email || !password) {
          return NextResponse.json(
            { error: 'Email and password are required' },
            { status: 400 }
          );
        }

        if (!EncryptionService.validateEmail(email)) {
          // Ne pas révéler que l'email est invalide (prévention d'énumération)
          AuditLog.log('LOGIN_FAILED', email, { reason: 'invalid_email' });
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          );
        }

        if (!EncryptionService.validatePassword(password)) {
          return NextResponse.json(
            { error: 'Invalid email or password' },
            { status: 401 }
          );
        }

        // 2. Authentifier l'utilisateur
        const token = await SecureAuthService.signIn(email, password);

        // 3. Retourner le token de manière sécurisée
        const response = NextResponse.json(
          {
            success: true,
            accessToken: token.accessToken,
            expiresIn: token.expiresIn
          },
          { status: 200 }
        );

        // 4. Définir le cookie HTTP-Only pour le refresh token
        response.cookies.set('refresh_token', token.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60 // 30 jours
        });

        return response;
      } catch (error) {
        console.error('Login error:', error);

        // Ne pas révéler les détails d'erreur
        AuditLog.log('LOGIN_ERROR', 'unknown', { 
          error: String(error) 
        });

        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    },
    {
      allowedMethods: ['POST'],
      rateLimit: RATE_LIMIT_MAX_REQUESTS.login,
      rateLimitId: 'login'
    }
  );
}
