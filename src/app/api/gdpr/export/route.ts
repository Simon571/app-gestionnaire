/**
 * API route sécurisée pour l'export GDPR
 * POST /api/gdpr/export
 * 
 * Avec:
 * - Rate limiting (2 exports par 15 min)
 * - Authentification requise
 * - Audit logging
 * - Données chiffrées
 */

import { NextRequest, NextResponse } from 'next/server';
import { secureApiRoute, RATE_LIMIT_MAX_REQUESTS } from '@/lib/rate-limiter';
import { AuditLog, EncryptionService } from '@/lib/encryption-service';

export async function POST(request: NextRequest) {
  return secureApiRoute(
    request,
    async (req) => {
      try {
        // 1. Vérifier l'authentification
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
          return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
          );
        }

        const token = authHeader.substring(7);
        let userId: string;

        try {
          const decoded = EncryptionService.verifyToken(token);
          userId = decoded.userId;
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid token' },
            { status: 401 }
          );
        }

        // 2. Logger la demande d'export
        AuditLog.log('GDPR_EXPORT_REQUEST', userId, {
          timestamp: new Date().toISOString(),
          ipAddress: req.headers.get('x-forwarded-for')
        });

        // 3. Récupérer les données de l'utilisateur (exemple)
        // TODO: Implémenter la récupération depuis la base de données
        const userData = {
          userId,
          exportDate: new Date().toISOString(),
          data: {
            profile: { name: 'John Doe', email: 'john@example.com' },
            people: [],
            territories: [],
            assignments: []
          }
        };

        // 4. Chiffrer les données pour la transmission
        const encryptedData = EncryptionService.encrypt(userData);

        // 5. Retourner les données chiffrées
        const response = NextResponse.json(
          {
            success: true,
            data: encryptedData,
            format: 'encrypted-json',
            algorithm: 'AES-256-GCM'
          },
          { status: 200 }
        );

        // 6. Logger le succès
        AuditLog.log('GDPR_EXPORT_SUCCESS', userId, {
          dataSize: JSON.stringify(userData).length,
          exportTime: new Date().toISOString()
        });

        return response;
      } catch (error) {
        console.error('Export error:', error);

        AuditLog.log('GDPR_EXPORT_FAILED', 'unknown', {
          error: String(error)
        });

        return NextResponse.json(
          { error: 'Export failed' },
          { status: 500 }
        );
      }
    },
    {
      allowedMethods: ['POST'],
      rateLimit: RATE_LIMIT_MAX_REQUESTS.dataExport,
      rateLimitId: 'gdpr-export',
      requireAuth: true
    }
  );
}
