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
import { getTranslations } from "next-intl/server"

const publishers: { id: number; name: string; status: string; group: string; baptismDate: string }[] = []

export default async function PublishersPage() {
  const t = await getTranslations('PublishersPage');

  const getStatusKey = (status: string) => {
    switch (status) {
      case "Actif": return "status_active";
      case "Inactif": return "status_inactive";
      case "Irrégulier": return "status_irregular";
      default: return "status_active";
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t('title')}</CardTitle>
            <CardDescription>
              {t('description')}
            </CardDescription>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('add_publisher')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('status')}</TableHead>
              <TableHead>{t('group')}</TableHead>
              <TableHead>{t('baptism_date')}</TableHead>
              <TableHead className="text-right">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {publishers.map((publisher) => (
              <TableRow key={publisher.id}>
                <TableCell className="font-medium">{publisher.name}</TableCell>
                <TableCell>
                  <Badge variant={publisher.status === "Actif" ? "default" : publisher.status === "Inactif" ? "destructive" : "secondary"}>
                    {t(getStatusKey(publisher.status))}
                  </Badge>
                </TableCell>
                <TableCell>{publisher.group}</TableCell>
                <TableCell>{publisher.baptismDate}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    {t('view')}
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
