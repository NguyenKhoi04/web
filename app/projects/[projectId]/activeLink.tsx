'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';  

interface Prop{
    href: string;
    children: React.ReactNode;
}

export default function ActiveLink({href, children}:Prop) { 
    const pathname = usePathname();
    const isActive = pathname === href;

    const activeClass = "px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105";
    const inactiveClass = "px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 border border-transparent hover:border-blue-200 hover:shadow-sm";
    return (
        <Link href={href} className={isActive ? activeClass : inactiveClass}>
            {children}
        </Link>
    );
}