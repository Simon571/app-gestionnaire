
'use client';

import { useState, useMemo } from 'react';
import LinkToPublisher from '@/components/publisher/link-to-publisher';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2, Archive, Edit3, Send, Loader2 } from 'lucide-react';
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
import { useSyncToFlutter } from '@/hooks/use-sync-to-flutter';

interface Meeting {
  id: string;
  date: Date;
  time: string;
  conductor: string;
  recurrent: boolean;
  location: string;
  territories: string[];
  notes: string;
}

export default function PredicationPage() {
  const { preachingGroups, isLoaded } = usePeople();
  const { syncPredication, isSyncing } = useSyncToFlutter();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 5)); // November 5, 2025
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('all-groups');
  const [formData, setFormData] = useState({
    time: '12:00',
    conductor: '',
    recurrent: false,
    location: '',
    territories: [] as string[],
    notes: '',
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

  const handleAddMeeting = async () => {
    if (!selectedDate) return;
    
    const newMeeting: Meeting = {
      id: Date.now().toString(),
      date: selectedDate,
      ...formData,
    };
    
    const updatedMeetings = [...meetings, newMeeting];
    setMeetings(updatedMeetings);
    
    // Sync to Flutter
    await syncPredication({
      date: selectedDate.toISOString(),
      time: formData.time,
      location: formData.location,
      groups: formData.territories,
      assignments: updatedMeetings.map(m => ({
        id: m.id,
        date: m.date.toISOString(),
        time: m.time,
        conductor: m.conductor,
        location: m.location,
        territories: m.territories,
      })),
    });
    
    setFormData({
      time: '12:00',
      conductor: '',
      recurrent: false,
      location: '',
      territories: [],
      notes: '',
    });
    setSelectedDate(null);
  };

  const handleDeleteMeeting = async (id: string) => {
    const updatedMeetings = meetings.filter(m => m.id !== id);
    setMeetings(updatedMeetings);
    
    // Sync deletion to Flutter
    await syncPredication({
      date: new Date().toISOString(),
      assignments: updatedMeetings.map(m => ({
        id: m.id,
        date: m.date.toISOString(),
        time: m.time,
        conductor: m.conductor,
        location: m.location,
        territories: m.territories,
      })),
    });
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  // Adjust for Monday start (firstDay: 1 = Monday in JS Date.getDay())
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
  const emptyDays = Array.from({ length: adjustedFirstDay }, (_, i) => null);

  const getMeetingsForDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return meetings.filter(m => 
      m.date.toDateString() === date.toDateString()
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
                <h3 className="font-semibold text-lg">Réunions pour la prédication</h3>
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
                <div className="w-full mt-2">
                  <LinkToPublisher
                    type={'predication'}
                    getPayload={() => ({ generatedAt: new Date().toISOString(), meetings })}
                    save={() => {
                      try {
                        localStorage.setItem('programme-predication', JSON.stringify({ meetings, savedAt: new Date().toISOString() }));
                      } catch (e) {
                        // ignore
                      }
                    }}
                  />
                </div>
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

              {/* Groups Selection - Dynamically loaded */}
              <div className="space-y-2">
                <Label htmlFor="groups">Groupes ({preachingGroups.length})</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger id="groups">
                    <SelectValue placeholder="Tous les groupes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-groups">Tous les groupes</SelectItem>
                    {preachingGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Conductor */}
              <div className="space-y-2">
                <Label htmlFor="conductor">Conducteur</Label>
                <Input 
                  id="conductor"
                  placeholder="Nom du conducteur"
                  value={formData.conductor}
                  onChange={(e) => setFormData({...formData, conductor: e.target.value})}
                />
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

              {/* Replacement Conductor */}
              <div className="space-y-2">
                <Label htmlFor="replacement">Conducteur remplaçant</Label>
                <Input 
                  id="replacement"
                  placeholder="Nom du remplaçant"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Lieu</Label>
                <Select>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Sélectionner un lieu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local1">Lieu 1</SelectItem>
                    <SelectItem value="local2">Lieu 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Territories */}
              <div className="space-y-2">
                <Label htmlFor="territories">Territoires</Label>
                <div className="space-y-2">
                  <Checkbox id="terr1" />
                  <Label htmlFor="terr1" className="font-normal text-sm cursor-pointer">Territoire 1</Label>
                </div>
                <div className="space-y-2">
                  <Checkbox id="terr2" />
                  <Label htmlFor="terr2" className="font-normal text-sm cursor-pointer">Territoire 2</Label>
                </div>
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

              {/* Model */}
              <div className="space-y-2">
                <Label htmlFor="model">Modèle</Label>
                <Select>
                  <SelectTrigger id="model">
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="model1">Modèle 1</SelectItem>
                    <SelectItem value="model2">Modèle 2</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="w-full">Ajouter modèle</Button>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  className="flex-1"
                  onClick={handleAddMeeting}
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
                  const dayMeetings = getMeetingsForDate(day);
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
                        {dayMeetings.map((meeting) => (
                          <div key={meeting.id} className="bg-blue-100 p-1 rounded truncate">
                            {meeting.time}
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
