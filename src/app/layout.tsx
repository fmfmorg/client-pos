import React from 'react'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Roboto_Mono, Roboto } from 'next/font/google';
import './global.css'
import { ThemeProvider } from '@mui/material/styles';
import theme from 'src/misc/theme';

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '700', '900'],
  variable: '--font-roboto',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-roboto-mono',
})



export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en" className={`${roboto.variable} ${robotoMono.variable}`}>
        <body>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
            {children}
            </ThemeProvider>
          </AppRouterCacheProvider>
        </body>
      </html>
    )
  }