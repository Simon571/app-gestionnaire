'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wand2, X } from 'lucide-react';

export type RoleConfig = {
  id: string;
  label: string;
  maxCount: number;
  defaultCount: number;
};

export type AutoAssignConfig = {
  roles: RoleConfig[];
  selectedRoles: Record<string, number>; // roleId -> count
  weeksCount: number;
  sortCriteria: 'last_assignment' | 'alphabetical' | 'random';
};

type AutoAssignDialogProps = {
  title?: string;
  roles: RoleConfig[];
  onConfirm: (config: AutoAssignConfig) => void;
  buttonVariant?: 'default' | 'outline' | 'ghost';
  buttonClassName?: string;
};

export function AutoAssignDialog({
  title = 'Paramètres de la saisie automatique',
  roles,
  onConfirm,
  buttonVariant = 'default',
  buttonClassName = 'bg-purple-600 hover:bg-purple-700',
}: AutoAssignDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedRoles, setSelectedRoles] = React.useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    roles.forEach((role) => {
      initial[role.id] = 0;
    });
    return initial;
  });
  const [weeksCount, setWeeksCount] = React.useState<number>(4);
  const [sortCriteria, setSortCriteria] = React.useState<'last_assignment' | 'alphabetical' | 'random'>('last_assignment');

  const handleRoleCountChange = (roleId: string, count: number) => {
    setSelectedRoles((prev) => ({
      ...prev,
      [roleId]: count,
    }));
  };

  const handleConfirm = () => {
    onConfirm({
      roles,
      selectedRoles,
      weeksCount,
      sortCriteria,
    });
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  // Reset quand on ouvre le dialog
  React.useEffect(() => {
    if (open) {
      const initial: Record<string, number> = {};
      roles.forEach((role) => {
        initial[role.id] = role.defaultCount;
      });
      setSelectedRoles(initial);
    }
  }, [open, roles]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={buttonVariant} className={buttonClassName}>
          <Wand2 className="h-4 w-4 mr-2" />
          Saisie automatique
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Choisir les rôles et le nombre de personnes
          </p>
          
          <div className="space-y-3">
            {roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between">
                <Label htmlFor={role.id} className="flex-1">
                  {role.label}
                </Label>
                <div className="flex items-center gap-2">
                  {Array.from({ length: role.maxCount }, (_, i) => i + 1).map((count) => (
                    <label key={count} className="flex items-center gap-1 cursor-pointer">
                      <Checkbox
                        checked={selectedRoles[role.id] >= count}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleRoleCountChange(role.id, count);
                          } else {
                            handleRoleCountChange(role.id, count - 1);
                          }
                        }}
                        className="border-sky-400 data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                      />
                      <span className="text-sm">{count}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="weeks">Semaines pour l&apos;attribution</Label>
              <Select value={weeksCount.toString()} onValueChange={(v) => setWeeksCount(parseInt(v))}>
                <SelectTrigger id="weeks">
                  <SelectValue placeholder="Nombre de semaines" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 52].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} semaine{n > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="criteria">Commandé par</Label>
              <Select value={sortCriteria} onValueChange={(v) => setSortCriteria(v as typeof sortCriteria)}>
                <SelectTrigger id="criteria">
                  <SelectValue placeholder="Critère d'attribution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_assignment">Dernière attribution</SelectItem>
                  <SelectItem value="alphabetical">Alphabétique</SelectItem>
                  <SelectItem value="random">Aléatoire</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleCancel} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <X className="h-4 w-4 mr-1" />
            Annuler
          </Button>
          <Button onClick={handleConfirm} className="bg-sky-500 hover:bg-sky-600">
            Saisie automatique
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AutoAssignDialog;
