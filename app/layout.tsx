import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'EEIC',
  description: 'EEIC, Certificate, Lms',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="description" content="EEIC, Certificate, Lms" />
        <meta name="keywords" content="EEIC, Certificate, Lms" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        {/* Exact same CSS as Laravel head.blade.php */}
        <link rel="shortcut icon" href="/assets/media/logos/icon.png" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Cairo:wght@300;400;500;600;700&display=swap" />
        <link href="/assets/plugins/custom/fullcalendar/fullcalendar.bundle.css" rel="stylesheet" type="text/css" />
        <link href="/assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
        <link href="/assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
        <link href="https://cdn.datatables.net/v/dt/dt-2.0.8/datatables.min.css" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>
        {children}
        {/* Exact same scripts as Laravel scripts.blade.php */}
        <script dangerouslySetInnerHTML={{ __html: 'var hostUrl = "assets/";' }} />
        <script src="/assets/plugins/global/plugins.bundle.js" />
        <script src="/assets/js/scripts.bundle.js" />
        <script src="https://cdn.datatables.net/v/dt/dt-2.0.8/datatables.min.js" />
        <script src="https://code.jquery.com/jquery-3.7.1.js" />
        <script src="https://code.jquery.com/ui/1.13.3/jquery-ui.js" />
      </body>
    </html>
  )
}
