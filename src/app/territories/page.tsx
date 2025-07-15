import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { User, Calendar, MapPin } from "lucide-react"
import { getTranslations } from "next-intl/server"

const territoriesData = {
  assigned: [
    { id: "T001", name: "Centre-ville Est", assignedTo: "Jean Dupont", date: "2024-05-01", progress: 25 },
    { id: "T002", name: "Quartier Nord", assignedTo: "Marie Curie", date: "2024-05-10", progress: 60 },
  ],
  pending: [
    { id: "T003", name: "Les Rives", assignedTo: null, date: null, progress: 0 },
    { id: "T004", name: "Parc Industriel", assignedTo: null, date: null, progress: 0 },
  ],
  completed: [
    { id: "T005", name: "Sud-Ouest", assignedTo: "Pierre Martin", date: "2024-04-15", progress: 100 },
  ],
}

type Territory = {
  id: string;
  name: string;
  assignedTo: string | null;
  date: string | null;
  progress: number;
}

const TerritoryCard = async ({ territory }: { territory: Territory }) => {
  const t = await getTranslations('TerritoriesPage');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{territory.name}</span>
          <span className="text-sm font-normal text-muted-foreground">{territory.id}</span>
        </CardTitle>
        <CardDescription className="flex items-center gap-2 pt-2">
          <MapPin className="h-4 w-4" /> {t('card_available')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {territory.assignedTo && (
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" /> {t('assigned_to', { name: territory.assignedTo })}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {t('assigned_on', { date: territory.date })}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <Progress value={territory.progress} className="w-full" />
        <p className="text-xs text-muted-foreground">{t('progress', { progress: territory.progress })}</p>
      </CardFooter>
    </Card>
  )
}

export default async function TerritoriesPage() {
  const t = await getTranslations('TerritoriesPage');
  return (
    <div className="space-y-6">
      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assigned">{t('assigned', { count: territoriesData.assigned.length })}</TabsTrigger>
          <TabsTrigger value="pending">{t('pending', { count: territoriesData.pending.length })}</TabsTrigger>
          <TabsTrigger value="completed">{t('completed', { count: territoriesData.completed.length })}</TabsTrigger>
        </TabsList>
        <TabsContent value="assigned" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {territoriesData.assigned.map(t => <TerritoryCard key={t.id} territory={t} />)}
          </div>
        </TabsContent>
        <TabsContent value="pending" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {territoriesData.pending.map(t => <TerritoryCard key={t.id} territory={t} />)}
          </div>
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {territoriesData.completed.map(t => <TerritoryCard key={t.id} territory={t} />)}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
