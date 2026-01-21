'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  getDay,
  format,
  addDays,
  getYear,
  setYear,
  setMonth,
  getMonth
} from 'date-fns';
import { fr } from 'date-fns/locale';

type AttendanceData = {
  midweek: {
    present: (number | null)[];
    online: (number | null)[];
  };
  weekend: {
    present: (number | null)[];
    online: (number | null)[];
  };
};

const getWeeksForMonth = (date: Date) => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const weeks = eachWeekOfInterval({ start, end });
  
  return weeks.map(weekStart => {
    const midweekDate = getDay(weekStart) <= 3 ? addDays(weekStart, 3 - getDay(weekStart)) : addDays(weekStart, 10 - getDay(weekStart));
    const weekendDate = getDay(weekStart) <= 0 ? addDays(weekStart, 0 - getDay(weekStart)) : addDays(weekStart, 7 - getDay(weekStart));
    
    return {
      midweek: getMonth(midweekDate) === getMonth(date) ? midweekDate : null,
      weekend: getMonth(weekendDate) === getMonth(date) ? weekendDate : null
    }
  });
};

export default function ReportsPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [weeks, setWeeks] = React.useState(getWeeksForMonth(currentDate));
  const [attendance, setAttendance] = React.useState<AttendanceData>(() => ({
    midweek: { present: Array(weeks.length).fill(null), online: Array(weeks.length).fill(null) },
    weekend: { present: Array(weeks.length).fill(null), online: Array(weeks.length).fill(null) },
  }));
  const [showWarning, setShowWarning] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const getStorageKey = (date: Date) => `attendance-${format(date, 'yyyy-MM')}`;

  // Load and Save data from/to localStorage
  React.useEffect(() => {
    const newWeeks = getWeeksForMonth(currentDate);
    setWeeks(newWeeks);

    const storageKey = getStorageKey(currentDate);
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
      setAttendance(JSON.parse(savedData));
    } else {
      setAttendance({
        midweek: { present: Array(newWeeks.length).fill(null), online: Array(newWeeks.length).fill(null) },
        weekend: { present: Array(newWeeks.length).fill(null), online: Array(newWeeks.length).fill(null) },
      });
    }
    setIsLoaded(true);
  }, [currentDate]);

  React.useEffect(() => {
    if (isLoaded) {
      const storageKey = getStorageKey(currentDate);
      localStorage.setItem(storageKey, JSON.stringify(attendance));
    }
  }, [attendance, currentDate, isLoaded]);


  const handleYearChange = (year: string) => {
    setIsLoaded(false);
    setCurrentDate(prev => setYear(prev, parseInt(year)));
  };

  const handleMonthChange = (month: string) => {
    setIsLoaded(false);
    setCurrentDate(prev => setMonth(prev, parseInt(month)));
  };

  const handleAttendanceChange = (
    type: 'midweek' | 'weekend',
    field: 'present' | 'online',
    weekIndex: number,
    value: string
  ) => {
    const newValue = value === '' ? null : Number(value);
    const newAttendance = { ...attendance };
    newAttendance[type][field][weekIndex] = newValue;
    setAttendance(newAttendance);

    const isMidweekEmpty = newAttendance.midweek.present[weekIndex] === null || newAttendance.midweek.online[weekIndex] === null;
    const isWeekendEmpty = newAttendance.weekend.present[weekIndex] === null || newAttendance.weekend.online[weekIndex] === null;
    setShowWarning(isMidweekEmpty || isWeekendEmpty);
  };
  
  const calculateTotals = (data: (number | null)[]) => {
    const total = data.reduce<number>((sum, val) => sum + (val ?? 0), 0);
    const count = data.filter(val => val !== null).length;
    const average = count > 0 ? Math.round(total / count) : 0;
    return { total, average };
  };

  const midweekPresentTotals = calculateTotals(attendance.midweek.present);
  const midweekOnlineTotals = calculateTotals(attendance.midweek.online);
  const midweekGrandTotals = calculateTotals(
    weeks.map((_, i) => (attendance.midweek.present[i] || 0) + (attendance.midweek.online[i] || 0))
  );

  const weekendPresentTotals = calculateTotals(attendance.weekend.present);
  const weekendOnlineTotals = calculateTotals(attendance.weekend.online);
  const weekendGrandTotals = calculateTotals(
    weeks.map((_, i) => (attendance.weekend.present[i] || 0) + (attendance.weekend.online[i] || 0))
  );

  const years = Array.from({ length: 10 }, (_, i) => getYear(new Date()) - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: format(setMonth(new Date(), i), 'MMMM', { locale: fr })
  }));

  const weekTotals = weeks.map((_, i) => ({
      midweek: (attendance.midweek.present[i] || 0) + (attendance.midweek.online[i] || 0),
      weekend: (attendance.weekend.present[i] || 0) + (attendance.weekend.online[i] || 0),
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
               <div>
                  <Label htmlFor="year">Année</Label>
                  <Select value={getYear(currentDate).toString()} onValueChange={handleYearChange}>
                    <SelectTrigger id="year" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
               </div>
               <div>
                  <Label htmlFor="month">Mois</Label>
                   <Select value={getMonth(currentDate).toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger id="month" className="w-36 capitalize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m.value} value={m.value} className="capitalize">{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
               </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center space-x-2">
                    <Checkbox id="show-dates" defaultChecked />
                    <Label htmlFor="show-dates" className="font-normal">Afficher les dates de réunion</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="show-online" defaultChecked />
                    <Label htmlFor="show-online" className="font-normal">Afficher la participation en ligne</Label>
                </div>
                 <div className="flex items-center space-x-2">
                    <Checkbox id="show-custom" />
                    <Label htmlFor="show-custom" className="font-normal">Afficher la participation personnalisée</Label>
                </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="grid gap-x-2" style={{ gridTemplateColumns: `150px repeat(${weeks.length}, 1fr) 1fr 1fr`}}>
                {/* Header */}
                <div />
                {weeks.map((week, index) => (
                    <div key={index} className="text-center font-bold">
                        <p>Semaine {index + 1}</p>
                    </div>
                ))}
                <div className="text-center font-bold">Total</div>
                <div className="text-center font-bold">Moyenne</div>

                {/* Midweek Dates */}
                 <div />
                {weeks.map((week, index) => (
                    <div key={index} className="text-center text-xs text-muted-foreground pt-1">
                        {week.midweek && format(week.midweek, 'yyyy/MM/dd')}
                    </div>
                ))}
                <div /><div />
                
                {/* Midweek Section */}
                <div className="row-span-3 flex items-center font-bold text-primary">Réunion de semaine</div>
                {weeks.map((_, i) => <Input key={i} type="number" className="text-center" value={attendance.midweek.present[i] ?? ''} onChange={e => handleAttendanceChange('midweek', 'present', i, e.target.value)} />)}
                <div className="flex items-center justify-center font-semibold">{midweekPresentTotals.total}</div>
                <div className="flex items-center justify-center font-semibold">{midweekPresentTotals.average}</div>
                
                <div className="self-end pb-2 text-sm text-right pr-2">En présentiel</div>

                {weeks.map((_, i) => <Input key={i} type="number" className="text-center" value={attendance.midweek.online[i] ?? ''} onChange={e => handleAttendanceChange('midweek', 'online', i, e.target.value)} />)}
                <div className="flex items-center justify-center font-semibold">{midweekOnlineTotals.total}</div>
                <div className="flex items-center justify-center font-semibold">{midweekOnlineTotals.average}</div>
                
                <div className="self-end pb-2 text-sm text-right pr-2">En ligne</div>
                
                {weekTotals.map((total, i) => <div key={i} className="flex items-center justify-center font-bold">{total.midweek || ''}</div>)}
                <div className="flex items-center justify-center font-bold">{midweekGrandTotals.total}</div>
                <div className="flex items-center justify-center font-bold">{midweekGrandTotals.average}</div>
                
                <div className="self-end pb-2 text-sm text-right pr-2 font-bold">Total</div>
                
                 {/* Spacer */}
                <div className="col-span-full h-4" />

                 {/* Weekend Dates */}
                 <div />
                {weeks.map((week, index) => (
                    <div key={index} className="text-center text-xs text-muted-foreground pt-1">
                        {week.weekend && format(week.weekend, 'yyyy/MM/dd')}
                    </div>
                ))}
                <div /><div />

                 {/* Weekend Section */}
                <div className="row-span-3 flex items-center font-bold text-orange-600">Réunion de week-end</div>
                {weeks.map((_, i) => <Input key={i} type="number" className="text-center" value={attendance.weekend.present[i] ?? ''} onChange={e => handleAttendanceChange('weekend', 'present', i, e.target.value)} />)}
                <div className="flex items-center justify-center font-semibold">{weekendPresentTotals.total}</div>
                <div className="flex items-center justify-center font-semibold">{weekendPresentTotals.average}</div>
                
                <div className="self-end pb-2 text-sm text-right pr-2">En présentiel</div>

                {weeks.map((_, i) => <Input key={i} type="number" className="text-center" value={attendance.weekend.online[i] ?? ''} onChange={e => handleAttendanceChange('weekend', 'online', i, e.target.value)} />)}
                <div className="flex items-center justify-center font-semibold">{weekendOnlineTotals.total}</div>
                <div className="flex items-center justify-center font-semibold">{weekendOnlineTotals.average}</div>

                <div className="self-end pb-2 text-sm text-right pr-2">En ligne</div>
                
                {weekTotals.map((total, i) => <div key={i} className="flex items-center justify-center font-bold">{total.weekend || ''}</div>)}
                <div className="flex items-center justify-center font-bold">{weekendGrandTotals.total}</div>
                <div className="flex items-center justify-center font-bold">{weekendGrandTotals.average}</div>
                
                <div className="self-end pb-2 text-sm text-right pr-2 font-bold">Total</div>

            </div>
          </div>

          {showWarning && (
            <Alert variant="destructive" className="mt-4">
                <AlertDescription>Avertissement: Une réunion a eu lieu, mais certaines cellules sont vides. Veuille saisir la présence (ou 0) pour toutes les semaines pendant lesquelles une réunion a eu lieu.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
