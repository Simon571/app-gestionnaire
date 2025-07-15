
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { User, Calendar, MapPin } from "lucide-react"

const territoriesData = {
  assigned: [] as Territory[],
  pending: [] as Territory[],
  completed: [] as Territory[],
}

type Territory = {
  id: string;
  name: string;
  assignedTo: string | null;
  date: string | null;
  progress: number;
}

const TerritoryCard = ({ territory }: { territory: Territory }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{territory.name}</span>
          <span className="text-sm font-normal text-muted-foreground">{territory.id}</span>
        </CardTitle>
        <CardDescription className="flex items-center gap-2 pt-2">
          <MapPin className="h-4 w-4" /> Territoire disponible
        </CardDescription>
      </CardHeader>
      <CardContent>
        {territory.assignedTo && (
          <div className="text-sm text-muted-foreground space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" /> Attribué à {territory.assignedTo}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Le {territory.date}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2">
        <Progress value={territory.progress} className="w-full" />
        <p className="text-xs text-muted-foreground">{territory.progress}% parcouru</p>
      </CardFooter>
    </Card>
  )
}

export default function TerritoriesPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="assigned" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assigned">Assignés ({territoriesData.assigned.length})</TabsTrigger>
          <TabsTrigger value="pending">En attente ({territoriesData.pending.length})</TabsTrigger>
          <TabsTrigger value="completed">Terminés ({territoriesData.completed.length})</TabsTrigger>
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
