
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export default function PublisherAppPage() {
  return (
    <Card className="flex items-center justify-center h-96">
      <CardHeader className="text-center">
        <ArrowLeft className="h-12 w-12 mx-auto text-muted-foreground" />
        <CardTitle className="mt-4">Publisher App</CardTitle>
        <CardDescription>
          Veuillez sélectionner une section dans le menu de gauche.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
