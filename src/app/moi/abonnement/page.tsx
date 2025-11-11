'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, AlertCircle, Edit2, HelpCircle, FileText, Lock, Users, X, Save } from 'lucide-react';
import { useAppSettings } from '@/context/app-settings-context';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PricingPlan {
  id: string;
  name: string;
  color: 'blue' | 'bronze' | 'silver' | 'gold';
  users: string;
  details: string[];
  features: string[];
  actionLabel: string;
  actionColor: string;
  pricing: {
    duration1: { usd: number; aud: number; years: number };
    duration2?: { usd: number; aud: number; years: number };
  };
}

interface AssemblyInfo {
  name: string;
  country: string;
  contact: {
    name: string;
    email: string;
  };
  titleNumber: string;
  expirationDate: string;
  assemblyId: string;
}

export default function AbonnementPage() {
  const { settings } = useAppSettings();
  const [currentPlan, setCurrentPlan] = useState('gold');
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);
  
  // Informations de l'assemblée (à connecter à votre backend)
  const [assemblyData] = useState({
    assemblyId: '', // Attribué après souscription
    assemblyName: 'Assemblée Or', // Défini par le plan
    subscriptionStatus: 'inactive', // 'inactive' ou 'active'
    titleNumber: '443-885-335',
    expirationDate: '2026/01/02',
  });

  // Récupération du nom de l'assemblée depuis les paramètres
  const assemblyName = settings.congregationName || assemblyData.assemblyName;

  // Informations de la personne qui engage l'assemblée (éditables)
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    country: '',
  });

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [limitedFinancialTariff, setLimitedFinancialTariff] = useState(false);
  
  // États des modales
  const [openModal, setOpenModal] = useState<'help' | 'refund' | 'license' | 'privacy' | null>(null);
  
  // États pour les abonnements
  const [selectedPlanForSubscription, setSelectedPlanForSubscription] = useState<string | null>(null);
  const [showSubscriptionConfirm, setShowSubscriptionConfirm] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState<1 | 2>(1);
  const [renewalDate, setRenewalDate] = useState('3/08/2024');
  
  const assemblyInfo: AssemblyInfo = {
    name: 'Assemblée Or',
    country: 'Congo RDC',
    contact: {
      name: 'Simon',
      email: 'simonnzamba@yahoo.fr',
    },
    titleNumber: '443-885-335',
    expirationDate: '2026/01/02',
    assemblyId: '443-885-335',
  };

  const pricingPlans: PricingPlan[] = [
    {
      id: 'individual',
      name: 'Individuel',
      color: 'blue',
      users: '1 utilisateur',
      details: ['250 personnes, 100 territoires'],
      features: ['Afficher toutes les fonctionnalités'],
      actionLabel: 'Rétrograder et renouveler',
      actionColor: 'pink',
      pricing: {
        duration1: { usd: 12, aud: 18, years: 1 },
        duration2: { usd: 20, aud: 30, years: 2 },
      }
    },
    {
      id: 'bronze',
      name: 'Assemblée Bronze',
      color: 'bronze',
      users: 'Tous les frères nommés',
      details: [
        'Partage, 150 personnes, 100 territoires',
      ],
      features: ['Afficher toutes les fonctionnalités'],
      actionLabel: 'Rétrograder et renouveler',
      actionColor: 'pink',
      pricing: {
        duration1: { usd: 29, aud: 43.5, years: 1 },
        duration2: { usd: 49, aud: 73.5, years: 2 },
      }
    },
    {
      id: 'silver',
      name: 'Assemblée Argent',
      color: 'silver',
      users: 'Tous les frères nommés',
      details: [
        'Partage, 250 personnes, 500 territoires',
        'Toutes les fonctionnalités de l\'abonnement Bronze',
        '+ Témoignage public, groupes linguistiques, demandes de publications, maintenance',
      ],
      features: ['Afficher toutes les fonctionnalités'],
      actionLabel: 'Rétrograder et renouveler',
      actionColor: 'pink',
      pricing: {
        duration1: { usd: 39, aud: 58.5, years: 1 },
        duration2: { usd: 65, aud: 97.5, years: 2 },
      }
    },
    {
      id: 'gold',
      name: 'Assemblée Or',
      color: 'gold',
      users: 'Tous les frères nommés',
      details: [
        'Partage, 350 personnes, 1000 territoires',
        'Toutes les fonctionnalités de l\'abonnement Argent',
        '+ Cartographie du territoire et adresses',
      ],
      features: ['Afficher toutes les fonctionnalités'],
      actionLabel: 'Renouveler',
      actionColor: 'pink',
      pricing: {
        duration1: { usd: 49, aud: 73.5, years: 1 },
        duration2: { usd: 82, aud: 123, years: 2 },
      }
    },
  ];

  // Données détaillées des fonctionnalités
  const featureCategories = [
    {
      name: 'Abonnement',
      features: [
        { label: 'Utilisateurs', individual: '1', bronze: 'Tous les frères nommés', silver: 'Tous les frères nommés', gold: 'Tous les frères nommés' },
        { label: 'Période', individual: '1 année', bronze: '1 année', silver: '1 ou 2 ans', gold: '1 ou 2 ans' },
      ]
    },
    {
      name: 'Territoire',
      features: [
        { label: 'Territoires', individual: '100', bronze: '100', silver: '500', gold: '1000', isNumber: true },
        { label: 'Attributions de territoire', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Campagnes', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Dessiner les limites du territoire', individual: false, bronze: false, silver: false, gold: true },
        { label: 'Adresses du territoire', individual: false, bronze: false, silver: false, gold: true },
        { label: 'Auto-attribuer des territoires', individual: false, bronze: false, silver: false, gold: true },
        { label: 'Carte d\'ensemble du territoire', individual: false, bronze: false, silver: false, gold: true },
        { label: 'Afficher les notes de travail du territoire', individual: false, bronze: false, silver: false, gold: true },
      ]
    },
    {
      name: 'NW Publisher app',
      features: [
        { label: 'NW Publisher app', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Envoyer et recevoir des données App', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Envoyer la pièce jointe et les cartes', individual: false, bronze: true, silver: true, gold: true },
        { label: 'Afficher les informations sur le proclamateur', individual: false, bronze: false, silver: true, gold: true },
        { label: 'Afficher et soumettre des rapports de service', individual: false, bronze: false, silver: true, gold: true },
        { label: 'Recevoir App Assistance aux réunions', individual: false, bronze: false, silver: true, gold: true },
      ]
    },
    {
      name: 'Assemblée',
      features: [
        { label: 'Partage de l\'assemblée', individual: false, bronze: true, silver: true, gold: true },
        { label: 'Tableau d\'affichage', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Événements de l\'assemblée', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Rapport de prédication', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Groupes et familles', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Groupes de langue', individual: false, bronze: false, silver: true, gold: true },
        { label: 'Circonscriptions', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Orateurs', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Partage d\'orateurs', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Assistance aux réunions', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Publications', individual: false, bronze: false, silver: true, gold: true },
        { label: 'Responsabilités dans l\'assemblée', individual: true, bronze: true, silver: true, gold: true },
      ]
    },
    {
      name: 'Personnes',
      features: [
        { label: 'Personnes', individual: '250', bronze: '150', silver: '250', gold: '350', isNumber: true },
        { label: 'Rapports du proclamateur', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Permission de l\'utilisateur', individual: false, bronze: true, silver: true, gold: true },
        { label: 'Contacts d\'urgence', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Périodes d\'absence', individual: true, bronze: true, silver: true, gold: true },
      ]
    },
    {
      name: 'Programme',
      features: [
        { label: 'Réunion Vie et ministère', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Besoins de l\'assemblée', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Discours publics', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Prédication', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Témoignage public', individual: false, bronze: false, silver: true, gold: true },
        { label: 'Services', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Nettoyage', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Entretien des espaces verts', individual: true, bronze: true, silver: true, gold: true },
        { label: 'Maintenance', individual: false, bronze: true, silver: true, gold: true },
        { label: 'Visite du responsable de circonscription', individual: true, bronze: true, silver: true, gold: true },
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'border-blue-300 bg-blue-50';
      case 'bronze':
        return 'border-yellow-700 bg-yellow-50';
      case 'silver':
        return 'border-gray-400 bg-gray-50';
      case 'gold':
        return 'border-yellow-400 bg-yellow-50';
      default:
        return '';
    }
  };

  const getHeaderClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-900';
      case 'bronze':
        return 'bg-yellow-700 text-white';
      case 'silver':
        return 'bg-gray-400 text-white';
      case 'gold':
        return 'bg-yellow-400 text-yellow-900';
      default:
        return '';
    }
  };

  const getButtonClasses = (color: string) => {
    return 'bg-pink-300 hover:bg-pink-400 text-pink-900 font-semibold';
  };

  return (
    <div className="space-y-8">
      {/* En-tête avec infos assemblée */}
      <div>
        <h1 className="text-3xl font-bold mb-6">Abonnement</h1>

        {/* Infos principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Assemblée */}
          <div className={`rounded-lg border-2 p-4 ${getColorClasses('gold')}`}>
            <div className={`rounded px-4 py-2 mb-4 text-center font-bold text-lg ${getHeaderClasses('gold')}`}>
              {assemblyName}
            </div>
            
            {assemblyData.subscriptionStatus === 'active' ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold">Titulaire</span>
                  <p className="text-gray-700">{assemblyData.titleNumber}</p>
                </div>
                <div>
                  <span className="font-semibold text-red-600">Date d'expiration</span>
                  <p className="text-gray-700">{assemblyData.expirationDate}</p>
                  <p className="text-xs text-gray-600">L'abonnement est à jour</p>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 text-center py-4">
                <p className="mb-2">Pas d'abonnement actif</p>
                <p className="text-xs">Sélectionnez un plan pour commencer</p>
              </div>
            )}
          </div>

          {/* Infos contact */}
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-lg">Personne responsable</h3>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsEditingContact(!isEditingContact)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>

            {isEditingContact ? (
              <div className="space-y-4">
                {/* Sélection du Pays */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Pays</label>
                  <Select value={contactData.country} onValueChange={(value) => setContactData({...contactData, country: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Congo RDC">Congo RDC</SelectItem>
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Belgique">Belgique</SelectItem>
                      <SelectItem value="Suisse">Suisse</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Champ Nom */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nom</label>
                  <Input 
                    placeholder="Entrez votre nom"
                    value={contactData.name}
                    onChange={(e) => setContactData({...contactData, name: e.target.value})}
                  />
                </div>

                {/* Champ E-mail */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">E-mail</label>
                  <Input 
                    type="email"
                    placeholder="Entrez votre e-mail"
                    value={contactData.email}
                    onChange={(e) => setContactData({...contactData, email: e.target.value})}
                  />
                </div>

                {/* Boutons de sauvegarde */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setIsEditingContact(false);
                      // Ici vous pouvez ajouter la sauvegarde des données
                    }}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsEditingContact(false)}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Pays</p>
                  <p className="font-semibold">{contactData.country || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Nom</p>
                  <p className="font-semibold">{contactData.name || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">E-mail</p>
                  <p className="font-semibold break-all">{contactData.email || 'Non défini'}</p>
                </div>
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600">ID d'assemblée</p>
                  <p className="font-semibold">{assemblyData.assemblyId || 'Non attribué (après souscription)'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Restrictions financières */}
          <div className="rounded-lg border border-green-300 bg-green-50 p-4 space-y-3">
            <p className="text-sm font-semibold">Vous pourriez être admissible à la tarification des moyens financiers limités</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">Tarification des moyens financiers limités</span>
              <button
                onClick={() => setLimitedFinancialTariff(!limitedFinancialTariff)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  limitedFinancialTariff ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    limitedFinancialTariff ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Plans tarifaires */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Plans disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border-2 overflow-hidden ${getColorClasses(plan.color)} ${
                currentPlan === plan.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {/* Header */}
              <div className={`rounded-t px-4 py-3 text-center font-bold text-lg ${getHeaderClasses(plan.color)}`}>
                {plan.name}
              </div>

              <div className="p-4 space-y-4">
                {/* Users */}
                <div className="text-sm">
                  <p className="font-semibold">{plan.users}</p>
                </div>

                {/* Features link */}
                {plan.features.map((feature, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setShowFeaturesModal(true)}
                    className="flex items-center gap-2 text-blue-600 hover:underline cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="text-sm font-semibold">{feature}</span>
                  </div>
                ))}

                {/* Details */}
                <div className="text-xs text-gray-700 space-y-2">
                  {plan.details.map((detail, idx) => (
                    <p key={idx}>{detail}</p>
                  ))}
                </div>

                {/* Renewal info and duration selector */}
                <div className="text-xs font-semibold text-gray-700 border-t pt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <span>Renouveler jusqu'au</span>
                    <input 
                      type="date" 
                      value={renewalDate}
                      onChange={(e) => setRenewalDate(e.target.value)}
                      className="px-2 py-1 border rounded text-xs"
                    />
                  </div>

                  {/* Pricing options */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        id={`duration1-${plan.id}`}
                        name={`duration-${plan.id}`}
                        value="1"
                        checked={selectedDuration === 1}
                        onChange={() => setSelectedDuration(1)}
                        className="cursor-pointer"
                      />
                      <label htmlFor={`duration1-${plan.id}`} className="cursor-pointer flex-1">
                        ${plan.pricing.duration1.usd} USD / ${plan.pricing.duration1.aud} AUD ({plan.pricing.duration1.years} year)
                      </label>
                    </div>
                    {plan.pricing.duration2 && (
                      <div className="flex items-center gap-2">
                        <input 
                          type="radio" 
                          id={`duration2-${plan.id}`}
                          name={`duration-${plan.id}`}
                          value="2"
                          checked={selectedDuration === 2}
                          onChange={() => setSelectedDuration(2)}
                          className="cursor-pointer"
                        />
                        <label htmlFor={`duration2-${plan.id}`} className="cursor-pointer flex-1">
                          ${plan.pricing.duration2.usd} USD / ${plan.pricing.duration2.aud} AUD ({plan.pricing.duration2.years} years)
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action button */}
                <Button 
                  className={`w-full ${getButtonClasses(plan.color)}`}
                  onClick={() => {
                    if (!contactData.name || !contactData.email || !contactData.country) {
                      alert('Veuillez remplir vos informations de contact avant de continuer');
                      return;
                    }
                    setSelectedPlanForSubscription(plan.id);
                    setShowSubscriptionConfirm(true);
                  }}
                >
                  💳 {plan.actionLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal des fonctionnalités détaillées */}
      {showFeaturesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            {/* En-tête modal */}
            <div className="sticky top-0 bg-gradient-to-r from-cyan-400 to-cyan-500 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Types d'abonnement</h2>
              <button
                onClick={() => setShowFeaturesModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6">
              {/* En-tête des plans */}
              <div className="grid grid-cols-5 gap-2">
                <div></div>
                <div className="text-center">
                  <div className="border-2 border-blue-300 bg-blue-50 rounded px-3 py-2 font-bold">Individuel</div>
                </div>
                <div className="text-center">
                  <div className="border-2 border-yellow-700 bg-yellow-700 rounded px-3 py-2 font-bold text-white">Assemblée Bronze</div>
                </div>
                <div className="text-center">
                  <div className="border-2 border-gray-400 bg-gray-400 rounded px-3 py-2 font-bold text-white">Assemblée Argent</div>
                </div>
                <div className="text-center">
                  <div className="border-2 border-yellow-400 bg-yellow-400 rounded px-3 py-2 font-bold">Assemblée Or</div>
                </div>
              </div>

              {/* Catégories de fonctionnalités */}
              {featureCategories.map((category, categoryIdx) => (
                <div key={categoryIdx} className="space-y-2">
                  <h3 className="text-lg font-bold text-cyan-600">{category.name}</h3>
                  
                  {category.features.map((feature, featureIdx) => (
                    <div key={featureIdx} className="grid grid-cols-5 gap-2 items-center text-sm border-b pb-2">
                      <div className="font-semibold text-gray-700">{feature.label}</div>
                      
                      {/* Individual */}
                      <div className="text-center">
                        {typeof feature.individual === 'boolean' ? (
                          feature.individual ? (
                            <Check className="w-5 h-5 text-black mx-auto" />
                          ) : null
                        ) : (
                          <span className="font-bold">{feature.individual}</span>
                        )}
                      </div>

                      {/* Bronze */}
                      <div className="text-center">
                        {typeof feature.bronze === 'boolean' ? (
                          feature.bronze ? (
                            <Check className="w-5 h-5 text-black mx-auto" />
                          ) : null
                        ) : (
                          <span className="font-bold">{feature.bronze}</span>
                        )}
                      </div>

                      {/* Silver */}
                      <div className="text-center">
                        {typeof feature.silver === 'boolean' ? (
                          feature.silver ? (
                            <Check className="w-5 h-5 text-black mx-auto" />
                          ) : null
                        ) : (
                          <span className="font-bold">{feature.silver}</span>
                        )}
                      </div>

                      {/* Gold */}
                      <div className="text-center">
                        {typeof feature.gold === 'boolean' ? (
                          feature.gold ? (
                            <Check className="w-5 h-5 text-black mx-auto" />
                          ) : null
                        ) : (
                          <span className="font-bold">{feature.gold}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer links */}
      <div className="flex flex-wrap gap-4 justify-center pt-6 border-t">
        <Button variant="ghost" className="gap-2" onClick={() => setOpenModal('help')}>
          <HelpCircle className="w-4 h-4" />
          Aide à l'abonnement
        </Button>
        <Button variant="ghost" className="gap-2" onClick={() => setOpenModal('refund')}>
          <FileText className="w-4 h-4" />
          Politique de remboursement
        </Button>
        <Button variant="ghost" className="gap-2" onClick={() => setOpenModal('license')}>
          <Lock className="w-4 h-4" />
          Licence d'utilisation
        </Button>
        <Button variant="ghost" className="gap-2" onClick={() => setOpenModal('privacy')}>
          <Users className="w-4 h-4" />
          Politique de confidentialité
        </Button>
      </div>

      {/* Modales */}
      {showSubscriptionConfirm && selectedPlanForSubscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Confirmer l'abonnement</h2>
              <button onClick={() => setShowSubscriptionConfirm(false)} className="text-white hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                <p className="text-sm text-gray-600">Plan sélectionné</p>
                <p className="font-semibold text-lg">{pricingPlans.find(p => p.id === selectedPlanForSubscription)?.name}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Personne responsable:</span>
                  <span className="font-semibold">{contactData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">E-mail:</span>
                  <span className="font-semibold break-all">{contactData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pays:</span>
                  <span className="font-semibold">{contactData.country}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs text-gray-500 mb-2">Tarif sélectionné:</p>
                  {selectedDuration === 1 ? (
                    <>
                      <div className="flex justify-between font-bold text-blue-600">
                        <span>${pricingPlans.find(p => p.id === selectedPlanForSubscription)?.pricing.duration1.usd} USD</span>
                        <span>${pricingPlans.find(p => p.id === selectedPlanForSubscription)?.pricing.duration1.aud} AUD</span>
                      </div>
                      <p className="text-xs text-gray-500">1 year</p>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between font-bold text-blue-600">
                        <span>${pricingPlans.find(p => p.id === selectedPlanForSubscription)?.pricing.duration2?.usd} USD</span>
                        <span>${pricingPlans.find(p => p.id === selectedPlanForSubscription)?.pricing.duration2?.aud} AUD</span>
                      </div>
                      <p className="text-xs text-gray-500">2 years</p>
                    </>
                  )}
                </div>
                {limitedFinancialTariff && (
                  <div className="flex justify-between text-green-600">
                    <span className="font-semibold">Tarif spécial:</span>
                    <span className="font-bold">✓ Actif</span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-3">En continuant, vous acceptez nos conditions de service et notre politique de confidentialité.</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowSubscriptionConfirm(false)}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      // Simuler le paiement
                      setShowSubscriptionConfirm(false);
                      setCurrentPlan(selectedPlanForSubscription);
                      const plan = pricingPlans.find(p => p.id === selectedPlanForSubscription);
                      const price = selectedDuration === 1 
                        ? `$${plan?.pricing.duration1.usd} USD / $${plan?.pricing.duration1.aud} AUD`
                        : `$${plan?.pricing.duration2?.usd} USD / $${plan?.pricing.duration2?.aud} AUD`;
                      alert(`✅ Abonnement à "${plan?.name}" confirmé!\n\nPrix: ${price}\nDurée: ${selectedDuration} year${selectedDuration === 2 ? 's' : ''}\n\nVotre ID d'assemblée sera généré après vérification du paiement.`);
                    }}
                  >
                    Confirmer
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modales */}
      {openModal === 'help' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-blue-50 px-6 py-4 flex justify-between items-center border-b">
              <h2 className="text-2xl font-bold text-blue-900">Aide à l'abonnement</h2>
              <button onClick={() => setOpenModal(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-8 text-gray-700">
              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">À propos de l'abonnement</h3>
                <p className="mb-3">L'abonnement à notre gestionnaire d'assemblée soutient le développement, la maintenance et l'assistance de notre application. Le développement logiciel est très coûteux et nécessite beaucoup de ressources. Un abonnement montre votre appréciation pour le temps et les ressources considérables investis dans le développement et la maintenance de ce programme.</p>
                <p>Notre application offre une très généreuse <strong>période d'essai gratuit de 60 jours</strong>, au cours de laquelle vous pouvez évaluer toutes les fonctionnalités pendant 60 jours. Si vous décidez d'utiliser notre gestionnaire, veuillez souscrire à un abonnement.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Comment s'abonner</h3>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Allez à <strong>Moi {`>`} Abonnement</strong></li>
                  <li>Remplissez vos informations de contact (Pays, Nom, E-mail)</li>
                  <li>Sélectionnez un plan d'abonnement (Individuel, Bronze, Argent, Or)</li>
                  <li>Cliquez sur <strong>"Renouveler"</strong> ou <strong>"Rétrograder et renouveler"</strong></li>
                  <li>Suivez les instructions de paiement</li>
                </ol>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Options d'abonnement</h3>
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-semibold text-gray-900">Individuel</h4>
                    <p className="text-sm">1 utilisateur, 250 personnes, 100 territoires - Idéal pour une utilisation personnelle</p>
                  </div>
                  <div className="border-l-4 border-yellow-700 pl-4">
                    <h4 className="font-semibold text-gray-900">Assemblée Bronze</h4>
                    <p className="text-sm">Tous les frères nommés, 150 personnes, 100 territoires - Pour les petites assemblées</p>
                  </div>
                  <div className="border-l-4 border-gray-400 pl-4">
                    <h4 className="font-semibold text-gray-900">Assemblée Argent</h4>
                    <p className="text-sm">Tous les frères nommés, 250 personnes, 500 territoires - Pour les assemblées moyennes</p>
                  </div>
                  <div className="border-l-4 border-yellow-400 pl-4">
                    <h4 className="font-semibold text-gray-900">Assemblée Or</h4>
                    <p className="text-sm">Tous les frères nommés, 350 personnes, 1000 territoires - Pour les grandes assemblées</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Activation de l'abonnement</h3>
                <p className="mb-2">Après votre achat :</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fermez et rouvrez l'application, OU</li>
                  <li>Allez à <strong>Moi {`>`} Abonnement {`>`} Rafraîchir</strong></li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Essai gratuit</h3>
                <p>Notre application offre une période d'essai gratuit de <strong>60 jours</strong>, au cours de laquelle vous pouvez utiliser toutes les fonctionnalités gratuitement. C'est l'une des périodes d'essai les plus longues et les plus généreuses d'une application logicielle au monde, et elle vous donne plus que suffisamment de temps pour tester notre gestionnaire et déterminer si vous voulez l'utiliser.</p>
                <p className="mt-2 text-sm text-gray-600"><strong>Remarque :</strong> L'essai gratuit est fourni par personne, pas par assemblée.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Coûts d'abonnement</h3>
                <p className="mb-3">Le développement logiciel et l'assistance sont très coûteux et très chronophages. Malgré cela, nous essayons très fort de garder nos coûts d'abonnement aussi bas que possible.</p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm"><strong>Saviez-vous ?</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                    <li>Notre application est utilisée par des milliers d'assemblées dans plus de 100 langues différentes et dans plus de 170 pays</li>
                    <li>Notre application contient au moins deux fois plus de fonctionnalités que d'autres logiciels, mais coûte moins de la moitié du prix</li>
                    <li>Une option de tarification pour les moyens financiers limités est disponible pour ceux qui ne peuvent pas se permettre l'abonnement standard</li>
                  </ul>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Tarification des moyens financiers limités</h3>
                <p>Si vous avez des moyens financiers limités et que vous ne pouvez pas vous permettre l'abonnement standard, une option de tarification réduite est disponible. Activez le toggle <strong>"Tarification des moyens financiers limités"</strong> pour voir les tarifs réduits.</p>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Questions fréquemment posées</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">Comment puis-je renouveler, améliorer ou rétrograder mon abonnement ?</h4>
                    <p className="text-sm">Allez à <strong>Moi {`>`} Abonnement</strong> et cliquez sur le bouton d'action du plan que vous souhaitez.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Combien de temps dure un abonnement ?</h4>
                    <p className="text-sm">Les abonnements durent 1 an ou 2 ans, selon le plan que vous avez choisi.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Si un frère achète un abonnement Assemblée, comment les autres frères accèdent-ils à l'application ?</h4>
                    <p className="text-sm">Tous les frères nommés peuvent accéder à l'application avec leur propre compte dans l'assemblée.</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Que se passe-t-il quand mon abonnement expire ?</h4>
                    <p className="text-sm">Vous recevrez des notifications de renouvellement. Vous pouvez renouveler dans les 45 jours précédant la date d'expiration pour éviter une interruption de service.</p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold mb-3 text-gray-900">Nous contacter</h3>
                <p>Pour toute question concernant votre abonnement, veuillez nous contacter à : <strong>support@example.com</strong></p>
              </section>
            </div>
          </div>
        </div>
      )}

      {openModal === 'refund' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-orange-50 px-6 py-4 flex justify-between items-center border-b">
              <h2 className="text-2xl font-bold text-orange-900">Politique de remboursement</h2>
              <button onClick={() => setOpenModal(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-gray-700">
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Période de remboursement</h3>
                <p>Vous avez 14 jours à compter de la date de votre achat pour demander un remboursement complet, sans questions posées.</p>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Conditions de remboursement</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Le remboursement s'applique uniquement aux nouveaux abonnements</li>
                  <li>Les renouvellements ne sont pas remboursables</li>
                  <li>Les services déjà utilisés ne sont pas remboursables au prorata</li>
                </ul>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Comment demander un remboursement</h3>
                <p>Contactez notre support avec votre numéro de commande : refunds@example.com</p>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Délai de traitement</h3>
                <p>Les remboursements sont traités sous 5 à 10 jours ouvrables après approbation.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {openModal === 'license' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-purple-50 px-6 py-4 flex justify-between items-center border-b">
              <h2 className="text-2xl font-bold text-purple-900">Licence d'utilisation</h2>
              <button onClick={() => setOpenModal(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-gray-700">
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Licence d'utilisation</h3>
                <p>Cette licence vous accorde le droit d'utiliser l'application pour les besoins de votre assemblée locale uniquement.</p>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Limitations</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Vous ne pouvez pas vendre ou transférer la licence</li>
                  <li>Vous ne pouvez pas modifier ou désassembler l'application</li>
                  <li>Vous ne pouvez pas utiliser l'application à des fins commerciales</li>
                  <li>Vous ne pouvez pas créer des œuvres dérivées</li>
                </ul>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Propriété intellectuelle</h3>
                <p>Tous les contenus, le code source et la conception de l'application sont la propriété intellectuelle de nos auteurs.</p>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Révocation</h3>
                <p>Nous nous réservons le droit de révoquer votre licence si vous violez les conditions de cette licence.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {openModal === 'privacy' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="sticky top-0 bg-green-50 px-6 py-4 flex justify-between items-center border-b">
              <h2 className="text-2xl font-bold text-green-900">Politique de confidentialité</h2>
              <button onClick={() => setOpenModal(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6 text-gray-700">
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Collecte de données</h3>
                <p>Nous collectons les données essentielles au fonctionnement de l'application, notamment les informations de votre assemblée et les données des utilisateurs.</p>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Utilisation des données</h3>
                <p>Vos données sont utilisées uniquement pour fournir les services de l'application. Nous ne les partageons pas avec des tiers sans votre consentement.</p>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Sécurité des données</h3>
                <p>Nous utilisons le chiffrement et les protocoles de sécurité modernes pour protéger vos données contre les accès non autorisés.</p>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Vos droits</h3>
                <ul className="list-disc list-inside space-y-2">
                  <li>Droit d'accès à vos données</li>
                  <li>Droit de rectification de vos données</li>
                  <li>Droit à l'oubli (suppression)</li>
                  <li>Droit de portabilité des données</li>
                </ul>
              </section>
              <section>
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Nous contacter</h3>
                <p>Pour toute question concernant vos données : privacy@example.com</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
