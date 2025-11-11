import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameWeek,
  isSameMonth,
  isMonday,
  addDays,
  subDays
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import VcmImportService from '@/lib/vcm-import-service';

interface WeekSelectorProps {
  selectedWeek: Date | null;
  onWeekSelect: (date: Date) => void;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function WeekSelector({ 
  selectedWeek, 
  onWeekSelect, 
  currentMonth, 
  onMonthChange 
}: WeekSelectorProps) {
  const importService = VcmImportService.getInstance();

  // Obtenir le statut d'une semaine
  const getWeekStatus = (weekStart: Date) => {
    const vcmData = importService.loadVcmWeek(weekStart);
    const assignmentsKey = `vcm-assignments-${weekStart.toISOString().split('T')[0]}`;
    const assignments = localStorage.getItem(assignmentsKey);
    const assignmentData = assignments ? JSON.parse(assignments) : {};
    
    if (!vcmData) {
      return { status: 'no-program', label: 'Pas de programme', color: 'bg-gray-100 text-gray-600' };
    }
    
    const totalParts = Object.values(vcmData.sections).reduce((total, section) => total + section.parts.length, 0);
    const assignedParts = Object.keys(assignmentData).length;
    const completionRate = totalParts > 0 ? (assignedParts / totalParts) * 100 : 0;
    
    if (completionRate === 100) {
      return { status: 'complete', label: 'Complet', color: 'bg-green-100 text-green-700' };
    } else if (completionRate > 0) {
      return { status: 'partial', label: `${Math.round(completionRate)}%`, color: 'bg-yellow-100 text-yellow-700' };
    } else {
      return { status: 'imported', label: 'Programme importé', color: 'bg-blue-100 text-blue-700' };
    }
  };

  // Obtenir toutes les semaines du mois (en commençant par lundi)
  const getWeeksInMonth = (month: Date) => {
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    
    // Trouver le premier lundi du mois ou le lundi précédent
    let startDate = firstDay;
    while (!isMonday(startDate)) {
      startDate = subDays(startDate, 1);
    }
    
    // Trouver le dernier dimanche du mois ou le dimanche suivant
    let endDate = lastDay;
    while (endDate.getDay() !== 0) { // 0 = dimanche
      endDate = addDays(endDate, 1);
    }
    
    const weeks: Date[] = [];
    let currentWeek = startDate;
    
    while (currentWeek <= endDate) {
      weeks.push(new Date(currentWeek));
      currentWeek = addDays(currentWeek, 7);
    }
    
    return weeks;
  };

  const weeks = getWeeksInMonth(currentMonth);

  const previousMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 }); // Semaine commence lundi
    return `${format(weekStart, 'd', { locale: fr })}-${format(weekEnd, 'd MMM', { locale: fr })}`;
  };

  return (
    <Card>
      <CardContent className="p-4">
        {/* En-tête du calendrier */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Sélectionner une semaine
          </h3>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="font-medium min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
            
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Légende */}
        <div className="flex flex-wrap gap-2 mb-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <span>Pas de programme</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-100 rounded"></div>
            <span>Importé</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-100 rounded"></div>
            <span>En cours</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 rounded"></div>
            <span>Complet</span>
          </div>
        </div>

        {/* Liste des semaines */}
        <div className="space-y-2">
          {weeks.map((weekStart) => {
            const isSelected = selectedWeek && isSameWeek(weekStart, selectedWeek, { weekStartsOn: 1 });
            const isCurrentMonth = isSameMonth(weekStart, currentMonth);
            const status = getWeekStatus(weekStart);
            
            return (
              <div
                key={weekStart.toISOString()}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-all",
                  "hover:border-primary hover:shadow-sm",
                  isSelected && "border-primary bg-primary/5 shadow-sm",
                  !isCurrentMonth && "opacity-50"
                )}
                onClick={() => onWeekSelect(weekStart)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[60px]">
                      <div className="font-medium text-sm">
                        {formatWeekRange(weekStart)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(weekStart, 'yyyy', { locale: fr })}
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">
                        Semaine du {format(weekStart, 'd MMMM', { locale: fr })}
                      </div>
                      
                      <Badge 
                        variant="secondary" 
                        className={cn("text-xs", status.color)}
                      >
                        {status.status === 'complete' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                        {status.status === 'partial' && <Clock className="h-3 w-3 mr-1" />}
                        {status.status === 'no-program' && <AlertCircle className="h-3 w-3 mr-1" />}
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions rapides */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const today = new Date();
                const monday = startOfWeek(today, { weekStartsOn: 1 });
                onWeekSelect(monday);
              }}
            >
              Cette semaine
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextWeek = addDays(new Date(), 7);
                const monday = startOfWeek(nextWeek, { weekStartsOn: 1 });
                onWeekSelect(monday);
              }}
            >
              Semaine prochaine
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default WeekSelector;