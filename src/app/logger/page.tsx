
'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, Send, User, Bot } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { askAssistant } from "@/ai/flows/assistant-flow"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

type Message = {
    role: 'user' | 'assistant';
    content: string;
}

const initialMessage: Message = {
    role: 'assistant',
    content: "Bonjour ! Je suis votre assistant IA. Je suis là pour vous aider à naviguer et à comprendre comment utiliser cette application. N'hésitez pas à me poser des questions sur les différents modules comme 'Assemblée', 'Personnes', 'Programme', ou sur des tâches spécifiques. Comment puis-je vous aider aujourd'hui ?"
};


export default function AssistantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([initialMessage]);
  const [userInput, setUserInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }
  }, [messages]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: userInput };
    setMessages(prev => [...prev, userMessage]);
    setUserInput("");
    setIsLoading(true);

    try {
        const history = messages.map(m => ({role: m.role, text: m.content}));
        const response = await askAssistant(userInput, history);
        const assistantMessage: Message = { role: 'assistant', content: response };
        setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
        console.error("Error calling assistant:", error);
        const errorMessage: Message = { role: 'assistant', content: "Désolé, une erreur est survenue. Veuillez réessayer." };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-[80vh] flex flex-col">
            <CardHeader>
              <CardTitle>Assistant IA</CardTitle>
              <CardDescription>
                Posez des questions sur l'application et obtenez de l'aide pour utiliser les fonctionnalités.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden flex flex-col">
               <ScrollArea className="flex-grow h-0 pr-4" ref={scrollAreaRef}>
                 <div className="space-y-4">
                    {messages.map((message, index) => (
                        <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? 'justify-end' : 'justify-start')}>
                             {message.role === 'assistant' && (
                                <div className="bg-primary text-primary-foreground rounded-full p-2">
                                    <Bot className="h-5 w-5" />
                                </div>
                             )}
                             <div className={cn("p-3 rounded-lg max-w-lg", 
                                message.role === 'user' ? 'bg-muted' : 'bg-background border'
                             )}>
                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                             </div>
                             {message.role === 'user' && (
                                <div className="bg-muted rounded-full p-2">
                                    <User className="h-5 w-5" />
                                </div>
                             )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-start gap-3 justify-start">
                             <div className="bg-primary text-primary-foreground rounded-full p-2">
                                <Bot className="h-5 w-5" />
                             </div>
                            <div className="p-3 rounded-lg bg-background border">
                                 <Skeleton className="h-4 w-24" />
                            </div>
                        </div>
                    )}
                 </div>
               </ScrollArea>
               <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 pt-4 border-t">
                    <Input 
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Posez votre question ici..."
                        disabled={isLoading}
                        className="flex-grow"
                    />
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Wand2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {isLoading ? "Analyse..." : "Envoyer"}
                    </Button>
                </form>
            </CardContent>
        </Card>
        <Card className="h-[80vh] flex flex-col">
            <CardHeader>
                <CardTitle>Description de l'application</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
                <div className="prose prose-sm max-w-none">
                    <h4>VUE D'ENSEMBLE DE L'APPLICATION</h4>
                    <p>L'application "Local Assembly Manager" est un outil complet pour la gestion d'une assemblée (congrégation) chrétienne. Elle permet de gérer les informations des membres, de planifier les réunions, de suivre l'activité de prédication, de communiquer des annonces et bien plus encore.</p>
                    
                    <h4>STRUCTURE DÉTAILLÉE DES MODULES</h4>
                    
                    <h5>1. Tableau de bord</h5>
                    <ul>
                        <li><strong>Objectif:</strong> Fournit une vue d'ensemble rapide et visuelle des statistiques clés de l'assemblée.</li>
                        <li><strong>Contenu:</strong> Affiche des cartes avec des indicateurs comme le nombre de proclamateurs actifs, l'assistance moyenne aux réunions, l'état des territoires et le pourcentage de rapports d'activité reçus pour le mois en cours.</li>
                    </ul>

                    <h5>2. Assemblée</h5>
                    <ul>
                        <li><strong>Objectif:</strong> Regroupe toutes les fonctionnalités liées à la gestion administrative et organisationnelle.</li>
                        <li><strong>Sous-menus:</strong>
                            <ul>
                                <li><strong>Information de l’assemblée:</strong> Gérer les détails fondamentaux (nom, ID, adresse, etc.).</li>
                                <li><strong>Partage de l’assemblée:</strong> Configurer les informations de connexion pour le partage de données.</li>
                                <li><strong>Tableau d’affichage:</strong> Publier les communications officielles.</li>
                                <li><strong>Evénements de l’assemblée:</strong> Gérer les événements spéciaux.</li>
                                <li><strong>Activité de prédication (S-1):</strong> Suivre le rapport mensuel d'activité.</li>
                                <li><strong>Groupes et familles:</strong> Organiser les proclamateurs en groupes.</li>
                                <li><strong>Circonscriptions & Orateurs:</strong> Gérer la liste des orateurs publics.</li>
                                <li><strong>Assistance aux réunions:</strong> Saisir l'assistance hebdomadaire.</li>
                                <li><strong>Responsabilités:</strong> Attribuer des rôles spécifiques.</li>
                            </ul>
                        </li>
                    </ul>

                     <h5>3. Personnes</h5>
                    <ul>
                        <li><strong>Objectif:</strong> Gérer de manière centralisée les fiches de chaque membre.</li>
                        <li><strong>Sous-menus:</strong>
                            <ul>
                                <li><strong>Ajouter une personne:</strong> Écran principal pour lister, créer ou modifier les fiches des membres, avec des onglets pour les informations personnelles, spirituelles, les attributions, l'activité et les contacts d'urgence.</li>
                            </ul>
                        </li>
                    </ul>
                    
                    <h5>4. Programme</h5>
                     <ul>
                        <li><strong>Objectif:</strong> Planifier toutes les réunions et activités.</li>
                        <li><strong>Sous-menus:</strong>
                            <ul>
                                <li><strong>Réunion Vie et ministère:</strong> Planifier les parties de la réunion de semaine.</li>
                                <li><strong>Besoins de l’assemblée:</strong> Gérer les discours sur les besoins locaux.</li>
                                <li><strong>Discours publics - Local:</strong> Établir le programme des discours publics du week-end.</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>5. Publisher App</h5>
                     <ul>
                        <li><strong>Objectif:</strong> Gérer l'interaction avec l'application mobile.</li>
                        <li><strong>Sous-menus:</strong>
                            <ul>
                                <li><strong>Envoyer/Recevoir les données:</strong> Outils de synchronisation.</li>
                                <li><strong>Utilisateurs & Appareils:</strong> Gérer les accès à l'application mobile.</li>
                            </ul>
                        </li>
                    </ul>

                    <h5>6. Moi</h5>
                    <ul>
                        <li><strong>Objectif:</strong> Section personnelle pour l'administrateur connecté.</li>
                         <li><strong>Sous-menus:</strong>
                            <ul>
                                <li><strong>Tâches:</strong> Gérer une liste de tâches personnelles.</li>
                                <li><strong>Abonnement, Alertes, Paramètres, Mises à jour:</strong> Gérer le compte admin.</li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
