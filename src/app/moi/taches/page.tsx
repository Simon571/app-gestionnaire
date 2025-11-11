
'use client';

import React, { useState } from 'react';
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

interface UserTask {
  id: string;
  title: string;
  description: string;
  assignedTo?: string;
  dueDate: string;
  frequency?: string;
  roles?: string;
  assignedBy?: string;
}

interface AutomaticTask {
  title: string;
  month: string;
  frequency: string;
}

export default function TachesPage() {
  const [activeTab, setActiveTab] = useState<'user' | 'automatic'>('user');
  
  // Tâches utilisateur
  const [userTasks, setUserTasks] = useState<UserTask[]>([
    {
      id: '1',
      title: 'Revoir avec l\'assistant l\'activité des membres du groupe',
      description: 'Examiner les activités et les progrès',
      assignedTo: 'Jean Dupont',
      dueDate: '2025/11/01',
      assignedBy: 'Tâche automatique',
    },
    {
      id: '2',
      title: 'Armand MURHIMALIKA: Organiser une visite',
      description: 'Coordonner une visite',
      assignedTo: 'Armand MURHIMALIKA',
      dueDate: '2025/11/07',
      assignedBy: 'Tâche automatique',
    },
    {
      id: '3',
      title: 'Kertys MWIKA: Organiser une visite',
      description: 'Coordonner une visite',
      assignedTo: 'Kertys MWIKA',
      dueDate: '2025/11/07',
      assignedBy: 'Tâche automatique',
    },
  ]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    assignedBy: '',
  });

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
      const newTask: UserTask = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        assignedBy: formData.assignedBy,
      };
      setUserTasks([...userTasks, newTask]);
      setFormData({ title: '', description: '', assignedTo: '', dueDate: '', assignedBy: '' });
    }
  };

  const handleDeleteUserTask = (id: string) => {
    setUserTasks(userTasks.filter(task => task.id !== id));
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
                <Select value={formData.assignedTo} onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
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
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
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
                  {userTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                        Aucune tâche utilisateur
                      </td>
                    </tr>
                  ) : (
                    userTasks.map((task, index) => (
                      <tr key={task.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} >
                        <td className="px-4 py-3 text-sm text-gray-800 border-b">{task.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 border-b">{task.assignedTo || '-'}</td>
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
