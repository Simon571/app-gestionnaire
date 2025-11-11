
'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2, Archive, Edit3 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeople } from '@/context/people-context';

interface Visit {
  id: string;
  date: Date;
  time: string;
  responsible: string;
  location: string;
  topic: string;
  participants: string[];
  notes: string;
  recurrent: boolean;
}

export default function VisiteResponsableCirconscriptionPage() {
  const { preachingGroups, isLoaded } = usePeople();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 5)); // November 5, 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('all-groups');
  const [formData, setFormData] = useState({
    time: '12:00',
    responsible: '',
    location: '',
    topic: '',
    participants: [] as string[],
    notes: '',
    recurrent: false,
  });

  const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const monthNames = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleAddVisit = () => {
    if (!selectedDate) return;
    
    const newVisit: Visit = {
      id: Date.now().toString(),
      date: selectedDate,
      ...formData,
    };
    
    setVisits([...visits, newVisit]);
    setFormData({
      time: '12:00',
      responsible: '',
      location: '',
      topic: '',
      participants: [],
      notes: '',
      recurrent: false,
    });
    setSelectedDate(null);
  };

  const handleDeleteVisit = (id: string) => {
    setVisits(visits.filter(v => v.id !== id));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Adjust for Monday start (firstDay: 1 = Monday in JS Date.getDay())
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const emptyDays = Array.from({ length: adjustedFirstDay }, (_, i) => null);

  const getVisitsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return visits.filter(v => 
      v.date.toDateString() === date.toDateString()
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Chargement des données...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Visite du responsable de circonscription</h3>
                <div className="bg-cyan-100 rounded p-4 min-h-[80px] border border-cyan-300">
                  {selectedDate ? (
                    <p className="text-sm">{selectedDate.toLocaleDateString('fr-FR')}</p>
                  ) : (
                    <p className="text-sm text-gray-500">Aucune date sélectionnée</p>
                  )}
                </div>
              </div>

              {/* Action Buttons with Tooltips */}
              <div className="flex gap-2 flex-wrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1"><Plus className="w-4 h-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Ajouter</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1"><Copy className="w-4 h-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Copier</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1"><Trash2 className="w-4 h-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Supprimer</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1"><Archive className="w-4 h-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Archiver</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="flex-1"><Edit3 className="w-4 h-4" /></Button>
                  </TooltipTrigger>
                  <TooltipContent>Modifier</TooltipContent>
                </Tooltip>
              </div>

              {/* Time Selection */}
              <div className="space-y-2">
                <Label htmlFor="time">Heure</Label>
                <Select value={formData.time} onValueChange={(value) => setFormData({...formData, time: value})}>
                  <SelectTrigger id="time">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = String(i).padStart(2, '0');
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Responsible Person */}
              <div className="space-y-2">
                <Label htmlFor="responsible">Responsable</Label>
                <Input 
                  id="responsible"
                  placeholder="Nom du responsable"
                  value={formData.responsible}
                  onChange={(e) => setFormData({...formData, responsible: e.target.value})}
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                <Input 
                  id="location"
                  placeholder="Lieu de la visite"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>

              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic">Sujet de la visite</Label>
                <Select value={formData.topic} onValueChange={(value) => setFormData({...formData, topic: value})}>
                  <SelectTrigger id="topic">
                    <SelectValue placeholder="Sélectionner un sujet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inspectionGenerale">Inspection générale</SelectItem>
                    <SelectItem value="reunion">Réunion administrative</SelectItem>
                    <SelectItem value="encouragement">Encouragement à la congégation</SelectItem>
                    <SelectItem value="formation">Formation des anciens</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Participants */}
              <div className="space-y-2">
                <Label>Participants</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="part1" />
                    <Label htmlFor="part1" className="font-normal text-sm cursor-pointer">Ancien 1</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="part2" />
                    <Label htmlFor="part2" className="font-normal text-sm cursor-pointer">Ancien 2</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="part3" />
                    <Label htmlFor="part3" className="font-normal text-sm cursor-pointer">Pionnier(ère)</Label>
                  </div>
                </div>
              </div>

              {/* Recurrent */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="recurrent"
                  checked={formData.recurrent}
                  onCheckedChange={(checked) => setFormData({...formData, recurrent: checked as boolean})}
                />
                <Label htmlFor="recurrent" className="font-normal cursor-pointer">Récurrent</Label>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea 
                  id="notes"
                  className="w-full min-h-[80px] rounded border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Ajouter des notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
              </div>

              {/* Link */}
              <div className="space-y-2">
                <Label htmlFor="link">Lien</Label>
                <Input 
                  id="link"
                  placeholder="Ajouter un lien"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={handleAddVisit}
                  disabled={!selectedDate}
                >
                  Ajouter
                </Button>
                <Button variant="outline" className="flex-1">Annuler</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-red-600">
                  Aucune date sélectionnée
                </CardTitle>
                <p className="text-sm text-gray-600">Voir mensuelle</p>
              </div>
              <div className="flex items-center gap-4">
                <Button size="sm" variant="ghost" onClick={previousMonth}>
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <h2 className="text-2xl font-bold text-red-600 min-w-[120px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <Button size="sm" variant="ghost" onClick={nextMonth}>
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost">🖨️</Button>
                  </TooltipTrigger>
                  <TooltipContent>Imprimer</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost">❓</Button>
                  </TooltipTrigger>
                  <TooltipContent>Aide</TooltipContent>
                </Tooltip>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-px mb-2">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-center font-semibold text-sm py-2 border-b-2 border-cyan-500">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-px bg-cyan-500 p-px">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="bg-gray-50 min-h-[120px]"></div>
                ))}
                
                {calendarDays.map((day) => {
                  const dayVisits = getVisitsForDate(day);
                  const isSelected = selectedDate && selectedDate.getDate() === day && 
                                     selectedDate.getMonth() === currentDate.getMonth() &&
                                     selectedDate.getFullYear() === currentDate.getFullYear();
                  
                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      className={`min-h-[120px] p-2 cursor-pointer border-2 ${
                        isSelected ? 'bg-cyan-100 border-cyan-500' : 'bg-white border-cyan-500'
                      } hover:bg-cyan-50`}
                    >
                      <div className="font-bold text-lg mb-2">{day}</div>
                      <div className="space-y-1 text-xs">
                        {dayVisits.map((visit) => (
                          <div key={visit.id} className="bg-purple-100 p-1 rounded truncate">
                            {visit.time}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
