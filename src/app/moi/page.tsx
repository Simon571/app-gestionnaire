'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { navItems } from '@/lib/nav-data';

const MoiPage = () => {
    const nav = navItems.find(item => item.id === 'moi');
    const subItems = nav?.subItems || [];

    return (
        <div>
            <h1 className="text-3xl font-bold">Moi</h1>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subItems.map((item) => {
                const Icon = item.icon;
                return (
                    <Link href={item.href || '#'} key={item.id} className="group">
                        <Card className="h-full hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                            <CardHeader className="flex flex-col items-center justify-center text-center p-6">
                                <Icon className="h-10 w-10 mb-4 text-primary group-hover:text-accent-foreground" />
                                <CardTitle className="text-lg">{item.label}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                );
            })}
            </div>
        </div>
    );
};

export default MoiPage;