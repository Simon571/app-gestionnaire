'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Download, Trash2, Lock, Eye, Shield } from 'lucide-react';
import { useSecureBackupSync } from '@/lib/secure-backup-sync-service';
import { SecureStorage, AuditLog } from '@/lib/encryption-service';

export default function PrivacySecurityPage() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const secureBackupFunctions = useSecureBackupSync();
  const { 
    exportPersonalData = async () => {}, 
    deleteAllPersonalData = async () => {},
    getAuditLogs = () => []
  } = secureBackupFunctions || {};

  const [activeTab, setActiveTab] = useState<'privacy' | 'security' | 'audit'>('privacy');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCode, setDeleteCode] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // ==================== GDPR - Droit d'accès ====================
  const handleExportData = async () => {
    try {
      setLoading(true);
      await exportPersonalData();
      setMessage({ type: 'success', text: 'Vos données personnelles ont été téléchargées avec succès.' });
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  // ==================== GDPR - Droit à l'oubli ====================
  const handleDeleteData = async () => {
    if (deleteCode !== 'DELETE_ALL_DATA_CONFIRM') {
      setMessage({ type: 'error', text: 'Code de confirmation incorrect' });
      return;
    }

    try {
      setLoading(true);
      await deleteAllPersonalData('DELETE_ALL_DATA_CONFIRM');
      setMessage({ type: 'success', text: 'Toutes vos données ont été supprimées de manière permanente.' });
      setShowDeleteConfirm(false);
      setDeleteCode('');
    } catch (error) {
      setMessage({ type: 'error', text: `Erreur: ${error}` });
    } finally {
      setLoading(false);
    }
  };

  const auditLogs = getAuditLogs();

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Confidentialité & Sécurité</h1>
        <p className="text-gray-600 mt-2">Gérez vos données et contrôlez votre sécurité</p>
      </div>

      {/* Message de notification */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('privacy')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'privacy'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Confidentialité (GDPR)
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-2" />
          Sécurité
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 font-semibold border-b-2 ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Eye className="w-4 h-4 inline mr-2" />
          Audit Logs
        </button>
      </div>

      {/* ==================== TAB: PRIVACY (GDPR) ==================== */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Droit d'accès */}
          <Card>
            <CardHeader>
              <CardTitle>Droit d'accès à vos données</CardTitle>
              <CardDescription>
                Téléchargez une copie de toutes vos données personnelles au format JSON
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Conformément au RGPD (Article 15), vous avez le droit d'accéder à toutes vos données personnelles stockées dans notre application.
              </p>
              <Button 
                onClick={handleExportData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger mes données
              </Button>
            </CardContent>
          </Card>

          {/* Droit à l'oubli */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Droit à l'oubli</CardTitle>
              <CardDescription>
                Supprimez définitivement toutes vos données personnelles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold">Attention</p>
                    <p>Cette action est irréversible. Toutes vos données seront supprimées définitivement.</p>
                  </div>
                </div>
              </div>

              {!showDeleteConfirm ? (
                <Button 
                  onClick={() => setShowDeleteConfirm(true)}
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer toutes mes données
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Pour confirmer la suppression, entrez le code: <strong>DELETE_ALL_DATA_CONFIRM</strong>
                  </p>
                  <input
                    type="text"
                    placeholder="Entrez le code de confirmation..."
                    value={deleteCode}
                    onChange={(e) => setDeleteCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleDeleteData}
                      disabled={loading || deleteCode !== 'DELETE_ALL_DATA_CONFIRM'}
                      variant="destructive"
                    >
                      Confirmer la suppression
                    </Button>
                    <Button 
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteCode('');
                      }}
                      variant="outline"
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Portabilité des données */}
          <Card>
            <CardHeader>
              <CardTitle>Portabilité des données</CardTitle>
              <CardDescription>
                Transférez vos données vers un autre service
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Vous pouvez à tout moment demander le transfert de vos données vers un autre service compatible.
              </p>
              <p className="text-sm text-gray-600">
                Contactez-nous: privacy@app-gestionnaire.com
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== TAB: SECURITY ==================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>État de la sécurité</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                  <span className="text-sm font-semibold">✓ Chiffrement des données</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">AES-256</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                  <span className="text-sm font-semibold">✓ HTTPS obligatoire</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Actif</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded border border-green-200">
                  <span className="text-sm font-semibold">✓ Authentification</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">JWT</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200">
                  <span className="text-sm font-semibold">⚠ 2FA</span>
                  <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded">Optionnel</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200">
                  <span className="text-sm font-semibold">ℹ Politique CSP</span>
                  <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Activée</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Meilleures pratiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✓ Ne partagez jamais votre mot de passe</li>
                <li>✓ Utilisez un mot de passe fort (12+ caractères, majuscules, minuscules, chiffres, symboles)</li>
                <li>✓ Connectez-vous depuis un appareil sécurisé</li>
                <li>✓ Téléchargez régulièrement vos données</li>
                <li>✓ Vérifiez les logs d'activité régulièrement</li>
                <li>✓ Signalez les activités suspectes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ==================== TAB: AUDIT LOGS ==================== */}
      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <CardTitle>Logs d'audit</CardTitle>
            <CardDescription>
              Toutes les actions effectuées sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun log d'audit disponible</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {auditLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded border border-gray-200 text-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{log.action}</p>
                        <p className="text-gray-600 text-xs mt-1">{log.userId}</p>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(log.timestamp).toLocaleString('fr-FR')}
                      </span>
                    </div>
                    {log.details && (
                      <div className="mt-2 text-xs text-gray-600">
                        <details>
                          <summary className="cursor-pointer hover:text-gray-900">Détails</summary>
                          <pre className="mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
