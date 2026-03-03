'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'NEXT_LOCALE';
const defaultLocale = 'en';

export async function getUserLocale() {
    const cookieStore = cookies();
    return cookieStore.get(COOKIE_NAME)?.value || defaultLocale;
}

export async function setUserLocale(locale: string) {
    const cookieStore = cookies();
    cookieStore.set(COOKIE_NAME, locale, {
        path: '/',
        maxAge: 31536000 // 1 year
    });
}
