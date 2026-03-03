import { getRequestConfig } from 'next-intl/server';
import { getUserLocale } from '../services/locale';

export default getRequestConfig(async () => {
    // Provide a static locale, fetch it from the user, or from a cookie
    const locale = await getUserLocale();

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default
    };
});
