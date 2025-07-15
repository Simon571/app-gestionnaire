
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const publishers: any[] = []

export default function PublishersPage() {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Actif": return "Actif";
      case "Inactif": return "Inactif";
      case "Irrégulier": return "Irrégulier";
      default: return "Actif";
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Annuaire des proclamateurs</CardTitle>
            <CardDescription>
              Gérez les informations des proclamateurs de l'assemblée.
            </CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Ajouter un proclamateur
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Groupe</TableHead>
              <TableHead>Date de baptême</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publishers.map((publisher) => (
              <TableRow key={publisher.id}>
                <TableCell className="font-medium">{publisher.name}</TableCell>
                <TableCell>
                  <Badge variant={publisher.status === "Actif" ? "default" : publisher.status === "Inactif" ? "destructive" : "secondary"}>
                    {getStatusLabel(publisher.status)}
                  </Badge>
                </TableCell>
                <TableCell>{publisher.group}</TableCell>
                <TableCell>{publisher.baptismDate}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Voir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
