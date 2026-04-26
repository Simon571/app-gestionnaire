
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, AlertCircle, HelpCircle } from 'lucide-react';
import { usePeople } from '@/context/people-context';
import { syncToFlutter } from '@/lib/sync-to-flutter';
import { getApiBase } from '@/lib/api-base';

type TacheStatus = 'todo' | 'in_progress' | 'done';

interface UserTask {
  id: string;
  title: string;
  description: string;
  assignedToPersonIds: string[];
  dueDate: string;
  frequency?: string;
  roles?: string;
  assignedBy?: string;
  status?: TacheStatus;
  createdAt?: string;
  updatedAt?: string;

  // compat: certains anciens payloads peuvent encore envoyer des noms
  assignedTo?: string | string[];
}

interface AutomaticTask {
  title: string;
  month: string;
  frequency: string;
}

export default function TachesPage() {
  const [activeTab, setActiveTab] = useState<'user' | 'automatic'>('user');
  const { people, isLoaded } = usePeople();
  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Tâches utilisateur
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedToPersonId: '',
    dueDate: '',
    assignedBy: '',
  });

  // Charger les tâches depuis l'API (persistant)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${getApiBase()}/api/taches`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const taches = Array.isArray(data.taches) ? (data.taches as UserTask[]) : [];
        if (!cancelled) setUserTasks(taches);
      } catch (e) {
        console.error('Failed to load taches', e);
        if (!cancelled) setUserTasks([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Migration légère: si une tâche contient encore un nom, tenter de le convertir en personId
  useEffect(() => {
    if (!isLoaded) return;
    setUserTasks((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        const ids = Array.isArray(t.assignedToPersonIds) ? t.assignedToPersonIds : [];
        if (ids.length > 0) return { ...t, assignedToPersonIds: ids };

        const legacy = t.assignedTo;
        const legacyNames = Array.isArray(legacy)
          ? legacy
          : typeof legacy === 'string' && legacy.trim() !== ''
            ? [legacy]
            : [];

        if (legacyNames.length === 0) return { ...t, assignedToPersonIds: [] };

        const resolved: string[] = [];
        for (const name of legacyNames) {
          const normalized = name.trim().toLowerCase();
          const match = people.find((p) => p.displayName?.trim().toLowerCase() === normalized);
          if (match) resolved.push(match.id);
        }

        if (resolved.length === 0) return { ...t, assignedToPersonIds: [] };
        changed = true;
        return { ...t, assignedToPersonIds: resolved };
      });
      return changed ? next : prev;
    });
  }, [isLoaded, people]);

  const saveAll = async (nextTasks: UserTask[]) => {
    try {
      setIsSaving(true);
      await fetch(`${getApiBase()}/api/taches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taches: nextTasks }),
      });

      await syncToFlutter('taches', {
        updatedAt: new Date().toISOString(),
        taches: nextTasks,
      });
    } catch (e) {
      console.error('Failed to save/sync taches', e);
    } finally {
      setIsSaving(false);
    }
  };

  // Tâches automatiques
  const [automaticTasks] = useState<AutomaticTask[]>([
    {
      title: 'Informer le coordinateur du collège des anciens qu\'un proclamateur a été ba',
      month: '',
      frequency: '',
    },
    {
      title: 'Organiser une visite entre deux anciens et un proclamateur baptisé.',
      month: '',
      frequency: '',
    },
    {
      title: 'Fournir des cartes DPA et les articles associés aux proclamateurs nouvellement',
      month: '',
      frequency: '',
    },
    {
      title: 'Visiter un autre groupe de prédication',
      month: 'janvier',
      frequency: '1 mois',
    },
    {
      title: 'Organiser l\'audit',
      month: 'mars',
      frequency: '3 mois',
    },
    {
      title: 'Bilan des activités des pionniers permanents – Bilan intermédiaire',
      month: 'mars',
      frequency: '12 mois',
    },
    {
      title: 'Revoir avec l\'assistant l\'activité des membres du groupe',
      month: 'avril',
      frequency: '6 mois',
    },
    {
      title: 'Bilan des activités des pionniers permanents – Fin d\'année',
      month: 'septembre',
      frequency: '12 mois',
    },
    {
      title: 'Examiner les dispositions locales de préparation aux catastrophes',
      month: 'septembre',
      frequency: '12 mois',
    },
  ]);

  // Handlers pour tâches utilisateur
  const handleAddUserTask = () => {
    if (formData.title.trim()) {
      const nowIso = new Date().toISOString();
      const newTask: UserTask = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        assignedToPersonIds: formData.assignedToPersonId ? [formData.assignedToPersonId] : [],
        dueDate: formData.dueDate,
        assignedBy: formData.assignedBy,
        status: 'todo',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      const nextTasks = [...userTasks, newTask];
      setUserTasks(nextTasks);
      saveAll(nextTasks);
      setFormData({ title: '', description: '', assignedToPersonId: '', dueDate: '', assignedBy: '' });
    }
  };

  const handleDeleteUserTask = (id: string) => {
    const nextTasks = userTasks.filter(task => task.id !== id);
    setUserTasks(nextTasks);
    saveAll(nextTasks);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'user'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>👤</span>
          Tâches utilisateur
        </button>
        <button
          onClick={() => setActiveTab('automatic')}
          className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'automatic'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>⚙️</span>
          Tâches automatiques
        </button>
      </div>

      {/* TAB 1: Tâches utilisateur */}
      {activeTab === 'user' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Nouvelle tâche</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tâche</label>
                <Input
                  name="title"
                  placeholder="Titre de la tâche"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <Textarea
                  name="description"
                  placeholder="Description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="text-sm min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Personnes</label>
                <Select value={formData.assignedToPersonId} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedToPersonId: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {people
                      .filter((p) => p.displayName && p.displayName.trim() !== '')
                      .slice()
                      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'fr'))
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.displayName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date d'échéance</label>
                <Input
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigné par</label>
                <Input
                  name="assignedBy"
                  placeholder="Nom de la personne"
                  value={formData.assignedBy}
                  onChange={handleInputChange}
                  className="text-sm"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddUserTask}
                  size="sm"
                  className="flex-1"
                  disabled={isSaving}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {isSaving ? 'Sauvegarde...' : 'Ajouter'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Liste des tâches */}
          <div className="lg:col-span-2">
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full">
                <thead className="bg-blue-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tâche</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Attribué à</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date d'échéance</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Assigné par</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        Chargement des tâches...
                      </td>
                    </tr>
                  ) : userTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        Aucune tâche utilisateur
                      </td>
                    </tr>
                  ) : (
                    userTasks.map((task, index) => (
                      <tr key={task.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} >
                        <td className="px-4 py-3 text-sm text-gray-800 border-b">{task.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b">
                          {(task.assignedToPersonIds || [])
                            .map((id) => peopleById.get(id)?.displayName)
                            .filter(Boolean)
                            .join(', ') || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b">{task.dueDate || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b">{task.assignedBy || '-'}</td>
                        <td className="px-4 py-3 text-center border-b">
                          <button
                            onClick={() => handleDeleteUserTask(task.id)}
                            className="inline-flex p-1 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Tâches automatiques */}
      {activeTab === 'automatic' && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Tâche automatique</h2>
          
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full">
              <thead className="bg-blue-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/2">Tâche automatique</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/4">Mois</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-1/4">Répéter tous les</th>
                </tr>
              </thead>
              <tbody>
                {automaticTasks.map((task, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm text-gray-800 border-b">{task.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">{task.month || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-b">{task.frequency || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulaire système task en bas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">System Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tâche</label>
                <Input
                  placeholder="Saisir la tâche"
                  className="text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <Textarea
                  placeholder="Description"
                  className="text-sm min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
                  <Select>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="janvier">janvier</SelectItem>
                      <SelectItem value="février">février</SelectItem>
                      <SelectItem value="mars">mars</SelectItem>
                      <SelectItem value="avril">avril</SelectItem>
                      <SelectItem value="mai">mai</SelectItem>
                      <SelectItem value="juin">juin</SelectItem>
                      <SelectItem value="juillet">juillet</SelectItem>
                      <SelectItem value="août">août</SelectItem>
                      <SelectItem value="septembre">septembre</SelectItem>
                      <SelectItem value="octobre">octobre</SelectItem>
                      <SelectItem value="novembre">novembre</SelectItem>
                      <SelectItem value="décembre">décembre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Répéter tous les</label>
                  <Select>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1 mois">1 mois</SelectItem>
                      <SelectItem value="3 mois">3 mois</SelectItem>
                      <SelectItem value="6 mois">6 mois</SelectItem>
                      <SelectItem value="12 mois">12 mois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" size="sm" className="flex-1">
                  Désactiver
                </Button>
                <Button size="sm" className="flex-1">
                  Enregistrer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
