'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { navItems } from '@/lib/nav-data';
import { publisherSyncFetch } from '@/lib/publisher-sync-client';

const PublisherAppPage = () => {
    const nav = navItems.find(item => item.id === 'publisherApp');
    const subItems = nav?.subItems || [];

    const [pendingIncoming, setPendingIncoming] = React.useState(0);
    const [pendingOutgoing, setPendingOutgoing] = React.useState(0);

    React.useEffect(() => {
        let isMounted = true;
        const refresh = async () => {
            try {
                const [incomingRes, outgoingRes] = await Promise.all([
                    publisherSyncFetch('/api/publisher-app/incoming?status=pending'),
                    publisherSyncFetch('/api/publisher-app/queue?direction=desktop_to_mobile&status=pending'),
                ]);

                const incomingData = incomingRes.ok ? await incomingRes.json() : null;
                const outgoingData = outgoingRes.ok ? await outgoingRes.json() : null;

                const incomingPending = Array.isArray(incomingData?.jobs)
                    ? incomingData.jobs.length
                    : 0;
                const outgoingPending = Array.isArray(outgoingData?.jobs)
                    ? outgoingData.jobs.length
                    : 0;

                if (isMounted) {
                    setPendingIncoming(incomingPending);
                    setPendingOutgoing(outgoingPending);
                }
            } catch (error) {
                console.error('publisher-app landing badge error', error);
            }
        };

        refresh();
        const interval = setInterval(refresh, 30000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold">Publisher App</h1>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subItems.map((item) => {
                const Icon = item.icon;
                const showBadge = (item.id === 'send-data' && pendingOutgoing > 0) || (item.id === 'receive-data' && pendingIncoming > 0);
                return (
                    <Link href={item.href || '#'} key={item.id} className="group">
                        <Card className="relative h-full hover:bg-accent hover:text-accent-foreground transition-colors duration-200">
                            {showBadge && (
                                <div className="absolute right-3 top-3">
                                    <span className="flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                </div>
                            )}
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

export default PublisherAppPage;