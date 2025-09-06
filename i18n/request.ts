import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({locale}) => {
  return {
    locales: ['en', 'ru'],
    defaultLocale: 'ru',
    messages: (await import(`../messages/${locale}.json`)).default
  };
});


