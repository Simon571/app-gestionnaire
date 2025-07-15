
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Church } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <Church className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Connexion Super Admin</CardTitle>
            <CardDescription>
                Entrez vos identifiants pour accéder au tableau de bord.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Mot de passe</Label>
              </div>
              <Input id="password" type="password" required />
            </div>
            <Button type="submit" className="w-full">
              Connexion
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
