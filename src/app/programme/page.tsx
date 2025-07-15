
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

const ProgrammePage = () => {
    return (
        <Card className="flex items-center justify-center h-96">
            <CardHeader className="text-center">
                <ArrowLeft className="h-12 w-12 mx-auto text-muted-foreground" />
                <CardTitle className="mt-4">Programme des réunions</CardTitle>
                <CardDescription>
                    Veuillez sélectionner une section du programme dans le menu de gauche.
                </CardDescription>
            </CardHeader>
        </Card>
    );
};

export default ProgrammePage;
