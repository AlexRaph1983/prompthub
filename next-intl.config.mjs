import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => ({
  locales: ['en', 'ru'],
  defaultLocale: 'en',
  messages: (await import(`./messages/${locale}.json`)).default
}));


