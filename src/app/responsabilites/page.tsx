
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCog, ClipboardList, DoorOpen, MessageSquare, Home, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type Responsibility = {
  id: string;
  label: string;
  icon: LucideIcon;
  href: "/responsabilites/coordinateur" | "/responsabilites/reunions" | "/responsabilites/secretaire" | "/responsabilites/salle-du-royaume" | "/responsabilites/responsable-predication" | "/responsabilites/personnalise";
};

const responsibilities: Responsibility[] = [
  { id: "coordinator", label: "Coordinateur du collège des anciens", icon: UserCog, href: "/responsabilites/coordinateur" },
  { id: "meetings", label: "Réunions", icon: MessageSquare, href: "/responsabilites/reunions" },
  { id: "secretary", label: "Secrétaire", icon: ClipboardList, href: "/responsabilites/secretaire" },
  { id: "kingdom_hall", label: "Salle du Royaume", icon: Home, href: "/responsabilites/salle-du-royaume" },
  { id: "preaching_overseer", label: "Responsable de la prédication", icon: DoorOpen, href: "/responsabilites/responsable-predication" },
  { id: "custom", label: "Personnalisé", icon: SlidersHorizontal, href: "/responsabilites/personnalise" },
];

export default function ResponsibilitiesPage() {
  return (
    <Card>
        <CardHeader>
            <CardTitle>Responsabilités dans l'assemblée</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {responsibilities.map((resp) => (
                    <Button key={resp.id} variant="ghost" className="h-auto justify-start p-4 text-base" asChild>
                       <Link href={resp.href}>
                            <resp.icon className="h-6 w-6 mr-4 text-primary" />
                            {resp.label}
                       </Link>
                    </Button>
                ))}
            </div>
        </CardContent>
    </Card>
  );
}
