
'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

// Helper function to get the weeks of a month
const getWeeksOfMonth = (year: number, month: number) => {
  const weeks = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const numDays = lastDay.getDate();

  let start = 1;
  let end;
  // Adjust for Monday start of the week (getDay returns 0 for Sunday)
  const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  end = 7 - startDayOfWeek;
  
  weeks.push({ start, end: Math.min(end, numDays) });
  start = end + 1;

  while (start <= numDays) {
    end = start + 6;
    weeks.push({ start, end: Math.min(end, numDays) });
    start = end + 1;
  }
  
  while (weeks.length < 5) {
      weeks.push({ start: null, end: null });
  }

  return weeks.slice(0, 5); // Ensure exactly 5 weeks
};

type AttendanceData = {
  [key: string]: number | '';
};

export default function MeetingAttendancePage() {
  const currentDate = new Date();
  const [year, setYear] = React.useState(currentDate.getFullYear());
  const [month, setMonth] = React.useState(currentDate.getMonth());
  const [attendance, setAttendance] = React.useState<AttendanceData>({});

  const monthName = new Date(year, month).toLocaleString('fr-FR', { month: 'long' });
  const weeks = getWeeksOfMonth(year, month);

  const years = Array.from({ length: 10 }, (_, i) => currentDate.getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: new Date(2000, i).toLocaleString('fr-FR', { month: 'long' }),
  }));

  const handleAttendanceChange = (weekIndex: number, meetingType: 'semaine' | 'weekend', attendanceType: 'presentiel' | 'enligne', value: string) => {
    const key = `${meetingType}-w${weekIndex}-${attendanceType}`;
    const numValue = value === '' ? '' : parseInt(value, 10);
    if (!isNaN(numValue as number) || value === '') {
      setAttendance(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const calculateRow = (meetingType: 'semaine' | 'weekend', attendanceType: 'presentiel' | 'enligne') => {
    let total = 0;
    let count = 0;
    for (let i = 0; i < 5; i++) {
      if (weeks[i].start) {
        const key = `${meetingType}-w${i}-${attendanceType}`;
        const value = attendance[key];
        if (typeof value === 'number') {
          total += value;
          count++;
        }
      }
    }
    const average = count > 0 ? Math.round(total / count) : 0;
    return { total, average };
  };

  const getGrandTotal = (meetingType: 'semaine' | 'weekend', weekIndex: number) => {
    const presentielKey = `${meetingType}-w${weekIndex}-presentiel`;
    const enLigneKey = `${meetingType}-w${weekIndex}-enligne`;
    const presentiel = typeof attendance[presentielKey] === 'number' ? attendance[presentielKey] as number : 0;
    const enLigne = typeof attendance[enLigneKey] === 'number' ? attendance[enLigneKey] as number : 0;
    return presentiel + enLigne;
  };

  const calculateGrandTotalAllWeeks = (meetingType: 'semaine' | 'weekend') => {
    let total = 0;
    for (let i = 0; i < 5; i++) {
        if(weeks[i].start) {
            total += getGrandTotal(meetingType, i);
        }
    }
    return total;
  }

  const calculateAverageAllWeeks = (meetingType: 'semaine' | 'weekend') => {
      const total = calculateGrandTotalAllWeeks(meetingType);
      const weekCount = weeks.filter(w => w.start !== null).length;
      return weekCount > 0 ? Math.round(total / weekCount) : 0;
  }

  const renderAttendanceRows = (meetingType: 'semaine' | 'weekend') => {
    const presentielData = calculateRow(meetingType, 'presentiel');
    const enLigneData = calculateRow(meetingType, 'enligne');
    const grandTotal = calculateGrandTotalAllWeeks(meetingType);
    const grandAverage = calculateAverageAllWeeks(meetingType);

    return (
      <>
        <TableRow>
          <TableCell>En présentiel</TableCell>
          {weeks.map((week, index) => (
            <TableCell key={index} className="p-1">
              <Input
                type="number"
                className="h-8 w-20 text-center mx-auto"
                disabled={!week.start}
                value={attendance[`${meetingType}-w${index}-presentiel`] || ''}
                onChange={(e) => handleAttendanceChange(index, meetingType, 'presentiel', e.target.value)}
              />
            </TableCell>
          ))}
          <TableCell className="text-center font-medium">{presentielData.total > 0 ? presentielData.total : ''}</TableCell>
          <TableCell className="text-center font-medium">{presentielData.average > 0 ? presentielData.average : ''}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>En ligne</TableCell>
          {weeks.map((week, index) => (
            <TableCell key={index} className="p-1">
              <Input
                type="number"
                className="h-8 w-20 text-center mx-auto"
                disabled={!week.start}
                value={attendance[`${meetingType}-w${index}-enligne`] || ''}
                onChange={(e) => handleAttendanceChange(index, meetingType, 'enligne', e.target.value)}
              />
            </TableCell>
          ))}
          <TableCell className="text-center font-medium">{enLigneData.total > 0 ? enLigneData.total : ''}</TableCell>
          <TableCell className="text-center font-medium">{enLigneData.average > 0 ? enLigneData.average : ''}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium">Total</TableCell>
          {weeks.map((week, index) => (
            <TableCell key={index} className="text-center font-medium">
              {week.start ? (getGrandTotal(meetingType, index) > 0 ? getGrandTotal(meetingType, index) : '') : ''}
            </TableCell>
          ))}
          <TableCell className="text-center font-bold">{grandTotal > 0 ? grandTotal : ''}</TableCell>
          <TableCell className="text-center font-bold">{grandAverage > 0 ? grandAverage : ''}</TableCell>
        </TableRow>
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assistance aux réunions</CardTitle>
        <CardDescription>
          Sélectionnez une année et un mois pour afficher ou saisir l'assistance.
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="year-select">Année</Label>
                <Select
                    value={String(year)}
                    onValueChange={(value) => setYear(Number(value))}
                >
                    <SelectTrigger id="year-select">
                        <SelectValue placeholder="Année" />
                    </SelectTrigger>
                    <SelectContent>
                        {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="month-select">Mois</Label>
                <Select
                    value={String(month)}
                    onValueChange={(value) => setMonth(Number(value))}
                >
                    <SelectTrigger id="month-select">
                        <SelectValue placeholder="Mois" />
                    </SelectTrigger>
                    <SelectContent>
                        {months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label.charAt(0).toUpperCase() + m.label.slice(1)}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-semibold text-center text-lg mb-4">
            {`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]"></TableHead>
              {weeks.map((week, index) => (
                <TableHead key={index} className="text-center">
                  Semaine {index + 1}
                  {week.start && <div className="text-xs font-normal text-muted-foreground">{`${week.start} - ${week.end}`}</div>}
                </TableHead>
              ))}
              <TableHead className="text-center">Total</TableHead>
              <TableHead className="text-center">Moyenne</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Réunion de semaine */}
            <TableRow className="bg-muted/20">
              <TableCell colSpan={8} className="font-semibold">Réunion de semaine</TableCell>
            </TableRow>
            {renderAttendanceRows('semaine')}

            {/* Réunion de week-end */}
            <TableRow className="bg-muted/20">
              <TableCell colSpan={8} className="font-semibold">Réunion de week-end</TableCell>
            </TableRow>
            {renderAttendanceRows('weekend')}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
