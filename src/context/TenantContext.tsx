'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface TenantInfo {
    subdomain: string | null;
    isPublicTenant: boolean;
}

interface TenantContextType {
    tenant: TenantInfo;
    isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
    const [tenant, setTenant] = useState<TenantInfo>({ subdomain: null, isPublicTenant: true });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const detectTenant = () => {
            if (typeof window === 'undefined') return;

            const host = window.location.host;
            const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'localhost:3000';

            // Check if we're on main domain (public tenant)
            if (host === mainDomain || host.startsWith('www.')) {
                setTenant({ subdomain: null, isPublicTenant: true });
            } else {
                // Extract subdomain
                const subdomain = host.split('.')[0];
                setTenant({ subdomain, isPublicTenant: false });
            }

            setIsLoading(false);
        };

        detectTenant();
    }, []);

    return (
        <TenantContext.Provider value={{ tenant, isLoading }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
