
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Copy, BookOpen, Printer, HelpCircle, Edit3, Upload, Download } from 'lucide-react';
import { usePeople } from '@/context/people-context';

interface MaintenanceTask {
  id: string;
  name: string;
  link: string;
  description: string;
  completed: boolean;
  assignments: Record<string, string>; // month-col -> person ID
}

const MONTHS = [
  'novembre 2025',
  'décembre 2025',
  'janvier 2026',
  'février 2026',
  'mars 2026',
  'avril 2026',
  'mai 2026',
  'juin 2026',
  'juillet 2026',
  'août 2026',
  'septembre 2026',
  'octobre 2026'
];

export default function MaintenancePage() {
  const { people } = usePeople();
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPersonDialog, setOpenPersonDialog] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [activeWeekMonth, setActiveWeekMonth] = useState<number>(0);
  const [formData, setFormData] = useState({
    name: '',
    link: '',
    description: ''
  });

  const handleAddTask = () => {
    setFormData({ name: '', link: '', description: '' });
    setSelectedTask(null);
    setOpenDialog(true);
  };

  const handleSaveTask = () => {
    if (!formData.name.trim()) return;

    if (selectedTask) {
      setTasks(tasks.map(t => 
        t.id === selectedTask.id 
          ? { ...t, name: formData.name, link: formData.link, description: formData.description }
          : t
      ));
    } else {
      const newTask: MaintenanceTask = {
        id: Date.now().toString(),
        name: formData.name,
        link: formData.link,
        description: formData.description,
        completed: false,
        assignments: {}
      };
      setTasks([...tasks, newTask]);
    }
    setOpenDialog(false);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
    }
  };

  const handleAssignPerson = (monthIdx: number, col: number, personId: string) => {
    if (!selectedTask) return;

    const key = `${monthIdx}-${col}`;
    setTasks(tasks.map(t => {
      if (t.id === selectedTask.id) {
        const updated = { ...t };
        if (updated.assignments[key] === personId) {
          delete updated.assignments[key];
        } else {
          updated.assignments[key] = personId;
        }
        setSelectedTask(updated);
        return updated;
      }
      return t;
    }));
  };

  const getPersonName = (personId: string) => {
    return people.find(p => p.id === personId)?.displayName || '';
  };

  const getAssignedPersonId = (monthIdx: number, col: number) => {
    if (!selectedTask) return null;
    return selectedTask.assignments[`${monthIdx}-${col}`] || null;
  };

  const getMaintenancePeople = () => {
    return people.filter(p => p.id && (p.assignments?.services?.maintenance || false));
  };

  return (
    <div className="flex h-screen bg-white border border-gray-300">
      {/* LEFT SIDEBAR */}
      <div className="w-80 border-r border-gray-300 p-4 flex flex-col gap-2 overflow-y-auto">
        <div className="mb-2">
          <Select defaultValue="">
            <SelectTrigger className="border-2 border-gray-400 bg-white">
              <SelectValue placeholder="<Catégorie>" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="batiment">Bâtiment</SelectItem>
              <SelectItem value="exterieur">Extérieur</SelectItem>
              <SelectItem value="equipement">Équipement</SelectItem>
              <SelectItem value="nettoyage">Nettoyage</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1 mb-3">
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 h-8 w-8"
            title="Editer"
          >
            <Edit3 className="w-5 h-5" />
          </Button>
          <Button 
            onClick={handleAddTask} 
            className="bg-blue-500 hover:bg-blue-600 text-white p-2 h-8 w-8"
            title="Nouveau"
          >
            <Plus className="w-5 h-5" />
          </Button>
          <Button 
            className="bg-gray-400 hover:bg-gray-500 text-white p-2 h-8 w-8"
            title="Supprimer"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button 
            className="bg-gray-400 hover:bg-gray-500 text-white p-2 h-8 w-8"
            title="Importer"
          >
            <Upload className="w-5 h-5" />
          </Button>
          <Button 
            className="bg-gray-400 hover:bg-gray-500 text-white p-2 h-8 w-8"
            title="Exporter"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>

        {/* Tasks List */}
        <div className="flex flex-col gap-1">
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className={`w-full text-left px-2 py-1 text-sm font-medium rounded ${
                selectedTask?.id === task.id 
                  ? 'bg-yellow-300 text-black' 
                  : 'bg-white border border-yellow-300 text-black'
              }`}
            >
              {task.name || '<Nom>'}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT - FLEX COLUMN */}
      <div className="flex-1 flex flex-col">
        {/* HEADER SECTION - MINIMAL */}
        <div className="p-3 border-b border-gray-300 flex-shrink-0">
          <h2 className="text-sm font-bold mb-2">Tâche de maintenance</h2>

          <div className="flex gap-3">
            {/* LEFT FORM - COMPACT */}
            <div className="flex-1 space-y-1">
              <div>
                <label className="text-xs font-bold text-gray-700">Nom</label>
                <Input
                  value={selectedTask?.name || ''}
                  readOnly
                  className="text-xs bg-yellow-100 border border-gray-400 h-6"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Lien</label>
                <Input
                  value={selectedTask?.link || ''}
                  readOnly
                  className="text-xs border border-gray-400 h-6"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700">Description</label>
                <textarea
                  value={selectedTask?.description || ''}
                  readOnly
                  className="w-full p-1 text-xs border border-gray-400 rounded resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-2 items-center text-xs">
                <div className="flex items-center gap-1">
                  <span className="font-bold">Terminé</span>
                  <Button className="bg-gray-400 text-white px-1 py-0 text-xs h-5">→</Button>
                  <span className="font-bold text-red-600">Non</span>
                </div>

                <span className="font-bold">Attribué à</span>
                {[0, 1, 2, 3].map(i => {
                  const isType = i < 2; // First 2 are type selector (yellow)
                  return (
                    <Select key={i} defaultValue="">
                      <SelectTrigger className={`w-40 border border-gray-400 rounded px-1 py-0 text-xs h-5 ${isType ? 'bg-yellow-100' : 'bg-white'}`}>
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        {isType ? (
                          <>
                            <SelectItem value="personne">Personne</SelectItem>
                            <SelectItem value="groupe-predication">Groupe de prédication</SelectItem>
                            <SelectItem value="autre-groupe">Autre groupe</SelectItem>
                            <SelectItem value="assemblee-voisine">Assemblée voisine</SelectItem>
                            <SelectItem value="mon-assemblee">Mon assemblée</SelectItem>
                          </>
                        ) : (
                          <>
                            {getMaintenancePeople().length > 0 ? (
                              getMaintenancePeople().map(person => 
                                person.id ? (
                                  <SelectItem key={person.id} value={person.id}>
                                    {person.displayName}
                                  </SelectItem>
                                ) : null
                              )
                            ) : (
                              <div className="p-2 text-xs text-gray-500">Aucune personne</div>
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  );
                })}
              </div>
            </div>

            {/* RIGHT SIDEBAR - COMPACT */}
            <div className="w-40 space-y-1">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-0.5">Catégorie</label>
                <Select defaultValue="">
                  <SelectTrigger className="border-2 border-gray-400 text-xs h-6">
                    <SelectValue placeholder="<Catégorie>" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="batiment">Bâtiment</SelectItem>
                    <SelectItem value="exterieur">Extérieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-1">
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-0.5 h-6 text-xs">
                  <Printer className="w-3 h-3" />
                </Button>
                <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white p-0.5 h-6 text-xs">
                  <HelpCircle className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE SECTION - FILLS REMAINING SPACE */}
        <div className="flex-1 overflow-auto border-t border-gray-300">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-cyan-500 sticky top-0">
                <th className="border-r border-cyan-500 p-1 bg-white text-left w-6 sticky left-0">
                  <Checkbox checked={false} />
                </th>
                <th className="border-r border-cyan-500 p-1 bg-cyan-100 text-left font-bold min-w-32 sticky left-6">Mois</th>
                {[1, 2, 3, 4].map(i => (
                  <th key={i} className="border-r border-cyan-500 p-1 bg-cyan-100 text-center font-bold w-20">
                    {i}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((month, monthIdx) => (
                <tr key={monthIdx} className={activeWeekMonth === monthIdx ? 'bg-yellow-300' : monthIdx % 2 === 0 ? 'bg-white' : 'bg-cyan-50'}>
                  <td className="border-r border-cyan-500 p-1 text-center sticky left-0 z-10 bg-inherit">
                    <input 
                      type="radio" 
                      name="activeMonth" 
                      value={monthIdx}
                      className="cursor-pointer"
                      checked={activeWeekMonth === monthIdx}
                      onChange={(e) => setActiveWeekMonth(parseInt(e.target.value))}
                    />
                  </td>
                  <td className="border-r border-cyan-500 p-1 font-bold text-center sticky left-6 z-10 bg-inherit">
                    {month}
                  </td>
                  {[1, 2, 3, 4].map(col => {
                    const personId = selectedTask ? getAssignedPersonId(monthIdx, col) : null;
                    const personName = personId ? getPersonName(personId) : '';
                    
                    return (
                      <td key={`${monthIdx}-${col}`} className="border-r border-cyan-500 p-0">
                        <button
                          onClick={() => {
                            if (selectedTask) {
                              setSelectedMonth(monthIdx);
                              setSelectedColumn(col);
                              setOpenPersonDialog(true);
                            }
                          }}
                          disabled={!selectedTask}
                          className={`w-full h-6 px-1 text-xs border-none ${
                            selectedTask 
                              ? 'bg-yellow-100 hover:bg-yellow-200 cursor-pointer' 
                              : 'bg-gray-100 cursor-not-allowed'
                          }`}
                        >
                          {personName}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT DIALOG */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">{selectedTask ? 'Modifier' : 'Nouvelle'} tâche</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Nom</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="text-xs"
                placeholder="Nom"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Lien</label>
              <Input
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="text-xs"
                placeholder="Lien"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-1 text-xs border rounded resize-none"
                rows={4}
                placeholder="Description"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSaveTask}
                className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs h-8"
              >
                Enregistrer
              </Button>
              <Button
                onClick={() => setOpenDialog(false)}
                variant="outline"
                className="flex-1 text-xs h-8"
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PERSON DIALOG */}
      <Dialog open={openPersonDialog} onOpenChange={setOpenPersonDialog}>
        <DialogContent className="max-w-2xl max-h-96">
          <DialogHeader>
            <DialogTitle className="text-sm">Assigner une personne</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-64">
            <table className="w-full text-xs">
              <tbody>
                {people.map(person => {
                  const isAssigned = selectedMonth !== null && selectedColumn !== null ?
                    getAssignedPersonId(selectedMonth, selectedColumn) === person.id
                    : false;
                  
                  return (
                    <tr key={person.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 flex items-center gap-2">
                        <Checkbox
                          checked={isAssigned}
                          onCheckedChange={() => {
                            if (selectedMonth !== null && selectedColumn !== null) {
                              handleAssignPerson(selectedMonth, selectedColumn, person.id);
                            }
                          }}
                        />
                        <span>{person.displayName}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setOpenPersonDialog(false)}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white text-xs h-8"
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
