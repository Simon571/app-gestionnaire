
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight, RotateCcw, Plus, Trash2, Edit3 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePeople } from '@/context/people-context';

interface Location {
  id: string;
  name: string;
}

interface WeeklySlot {
  id: string;
  day: string;
  period: 'AM' | 'PM';
  location: string;
  speaker: string;
  notes: string;
}

const daysOfWeek = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const getMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const getWeekRange = (date: Date) => {
  const monday = getMonday(date);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return { monday, sunday };
};

function PlanningTab() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 3));
  const [slots, setSlots] = useState<WeeklySlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<WeeklySlot | null>(null);
  const [formData, setFormData] = useState({
    location: '',
    speaker: '',
    notes: '',
  });

  const { monday, sunday } = getWeekRange(currentDate);
  const weekLabel = `${String(monday.getDate()).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
  const monthName = monday.toLocaleString('fr-FR', { month: 'long' });

  const previousWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
  };

  const nextWeek = () => {
    setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
  };

  const getSlot = (day: string, period: 'AM' | 'PM'): WeeklySlot | undefined => {
    return slots.find(s => s.day === day && s.period === period);
  };

  const handleSlotClick = (day: string, period: 'AM' | 'PM') => {
    const slot = getSlot(day, period);
    if (slot) {
      setSelectedSlot(slot);
      setFormData({
        location: slot.location,
        speaker: slot.speaker,
        notes: slot.notes,
      });
    } else {
      setSelectedSlot({ id: Date.now().toString(), day, period, location: '', speaker: '', notes: '' });
      setFormData({ location: '', speaker: '', notes: '' });
    }
  };

  const handleSave = () => {
    if (!selectedSlot) return;

    const existingIndex = slots.findIndex(
      s => s.day === selectedSlot.day && s.period === selectedSlot.period
    );

    const updatedSlot = {
      ...selectedSlot,
      ...formData,
    };

    if (existingIndex >= 0) {
      const newSlots = [...slots];
      newSlots[existingIndex] = updatedSlot;
      setSlots(newSlots);
    } else {
      setSlots([...slots, updatedSlot]);
    }

    setSelectedSlot(null);
    setFormData({ location: '', speaker: '', notes: '' });
  };

  const handleDelete = () => {
    if (!selectedSlot) return;
    setSlots(slots.filter(s => !(s.day === selectedSlot.day && s.period === selectedSlot.period)));
    setSelectedSlot(null);
    setFormData({ location: '', speaker: '', notes: '' });
  };

  const handleReset = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar - Form */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-red-600">Aucune date sélectionnée</h3>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Lieux de témoignage public</Label>
                <div className="bg-gray-50 rounded p-3 border border-gray-200 min-h-[60px]">
                  {selectedSlot ? (
                    <p className="text-sm text-gray-700">
                      {daysOfWeek[monday.getDay() - 1 === -1 ? 6 : monday.getDay() - 1]} ({selectedSlot.period})
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Sélectionner un créneau</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Lieu de témoignage public</Label>
              <Input 
                id="location"
                placeholder="Nom du lieu"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>

            {/* Créneau */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Créneau</Label>
              <div className="bg-gray-50 rounded p-2 border border-gray-200">
                <p className="text-sm text-gray-600">
                  {selectedSlot ? `${selectedSlot.day.toUpperCase()} - ${selectedSlot.period}` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Speaker */}
            <div className="space-y-2">
              <Label htmlFor="speaker">Orateur</Label>
              <Input 
                id="speaker"
                placeholder="Nom de l'orateur"
                value={formData.speaker}
                onChange={(e) => setFormData({...formData, speaker: e.target.value})}
              />
            </div>

            {/* Postes */}
            <div className="space-y-2">
              <Label htmlFor="positions">Postes</Label>
              <Input 
                id="positions"
                placeholder="Postes ou responsabilités"
              />
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

            {/* Model */}
            <div className="space-y-2">
              <Label htmlFor="model">Modèle de semaine</Label>
              <div className="flex gap-2">
                <Select>
                  <SelectTrigger id="model" className="flex-1">
                    <SelectValue placeholder="Sélectionner un modèle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="model1">Modèle 1</SelectItem>
                    <SelectItem value="model2">Modèle 2</SelectItem>
                  </SelectContent>
                </Select>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="outline">+</Button>
                  </TooltipTrigger>
                  <TooltipContent>Ajouter modèle</TooltipContent>
                </Tooltip>
              </div>
              <Input 
                placeholder="Nom du modèle"
                className="text-sm"
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="outline" className="w-full">📋</Button>
                </TooltipTrigger>
                <TooltipContent>Appliquer modèle</TooltipContent>
              </Tooltip>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button 
                className="flex-1"
                onClick={handleSave}
                disabled={!selectedSlot}
              >
                Enregistrer
              </Button>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon"
                    variant="outline"
                    onClick={handleDelete}
                    disabled={!selectedSlot}
                  >
                    🗑️
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Supprimer</TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Content - Weekly Schedule */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-blue-600">Planning du témoignage public</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={handleReset}>
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Réinitialiser</TooltipContent>
              </Tooltip>
              <Button size="sm" variant="ghost" onClick={previousWeek}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-lg font-bold text-red-600 min-w-[120px] text-center">
                {monthName} {weekLabel}
              </h2>
              <Button size="sm" variant="ghost" onClick={nextWeek}>
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
            <div className="grid grid-cols-8 gap-px mb-2 bg-cyan-500">
              <div className="bg-white"></div>
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center font-semibold text-sm py-2 bg-white border-b-2 border-cyan-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Schedule Grid */}
            <div className="border-2 border-cyan-500">
              {/* AM Section */}
              <div className="grid grid-cols-8 gap-px bg-cyan-500">
                <div className="bg-white font-semibold text-center py-12 border-r-2 border-cyan-500">
                  AM
                </div>
                {daysOfWeek.map((day) => {
                  const slot = getSlot(day, 'AM');
                  return (
                    <div
                      key={`${day}-AM`}
                      onClick={() => handleSlotClick(day, 'AM')}
                      className={`p-3 cursor-pointer border-2 border-cyan-500 min-h-[120px] ${
                        selectedSlot?.day === day && selectedSlot?.period === 'AM'
                          ? 'bg-cyan-100'
                          : 'bg-white hover:bg-cyan-50'
                      }`}
                    >
                      {slot && (
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-gray-700">{slot.location}</p>
                          <p className="text-gray-600">{slot.speaker}</p>
                          {slot.notes && <p className="text-gray-500 italic">{slot.notes}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* PM Section */}
              <div className="grid grid-cols-8 gap-px bg-cyan-500">
                <div className="bg-white font-semibold text-center py-12 border-r-2 border-cyan-500">
                  PM
                </div>
                {daysOfWeek.map((day) => {
                  const slot = getSlot(day, 'PM');
                  return (
                    <div
                      key={`${day}-PM`}
                      onClick={() => handleSlotClick(day, 'PM')}
                      className={`p-3 cursor-pointer border-2 border-cyan-500 min-h-[120px] ${
                        selectedSlot?.day === day && selectedSlot?.period === 'PM'
                          ? 'bg-cyan-100'
                          : 'bg-white hover:bg-cyan-50'
                      }`}
                    >
                      {slot && (
                        <div className="space-y-1 text-xs">
                          <p className="font-semibold text-gray-700">{slot.location}</p>
                          <p className="text-gray-600">{slot.speaker}</p>
                          {slot.notes && <p className="text-gray-500 italic">{slot.notes}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LieuxTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  const handleAddLocation = () => {
    if (!formData.name.trim()) return;

    const newLocation: Location = {
      id: Date.now().toString(),
      name: formData.name,
    };

    setLocations([...locations, newLocation]);
    setFormData({ name: '' });
    setSelectedLocation(null);
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setFormData({ name: location.name });
  };

  const handleSaveLocation = () => {
    if (!selectedLocation || !formData.name.trim()) return;

    setLocations(locations.map(l => 
      l.id === selectedLocation.id 
        ? { ...l, name: formData.name }
        : l
    ));
    setFormData({ name: '' });
    setSelectedLocation(null);
  };

  const handleDeleteLocation = (id: string) => {
    setLocations(locations.filter(l => l.id !== id));
    if (selectedLocation?.id === id) {
      setFormData({ name: '' });
      setSelectedLocation(null);
    }
  };

  const handleCancel = () => {
    setFormData({ name: '' });
    setSelectedLocation(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left Sidebar - Form */}
      <div className="lg:col-span-1">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg text-blue-600">Lieux de témoignage public</h3>
              <div className="space-y-2">
                <Label htmlFor="location-name">Nom du lieu</Label>
                <Input 
                  id="location-name"
                  placeholder="Entrez le nom du lieu"
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {selectedLocation ? (
                <>
                  <Button 
                    className="flex-1"
                    onClick={handleSaveLocation}
                  >
                    Mettre à jour
                  </Button>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon"
                        variant="outline"
                        onClick={() => handleDeleteLocation(selectedLocation.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer</TooltipContent>
                  </Tooltip>
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                </>
              ) : (
                <Button 
                  className="w-full"
                  onClick={handleAddLocation}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Content - Locations List */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Liste des lieux de témoignage public</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-2">
              {locations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucun lieu enregistré</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {locations.map((location) => (
                    <div
                      key={location.id}
                      className={`flex items-center justify-between p-3 rounded border cursor-pointer transition ${
                        selectedLocation?.id === location.id
                          ? 'bg-blue-100 border-blue-500'
                          : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handleEditLocation(location)}
                    >
                      <span className="font-medium">{location.name}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLocation(location);
                            }}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Modifier</TooltipContent>
                      </Tooltip>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function TemoignagePublicPage() {
  const { isLoaded } = usePeople();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Chargement des données...</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Tabs defaultValue="planning" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="planning">Planning du témoignage public</TabsTrigger>
            <TabsTrigger value="lieux">Lieux de témoignage public</TabsTrigger>
          </TabsList>
          
          <TabsContent value="planning" className="mt-6">
            <PlanningTab />
          </TabsContent>
          
          <TabsContent value="lieux" className="mt-6">
            <LieuxTab />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
