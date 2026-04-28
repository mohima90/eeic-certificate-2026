/**
 * Auth layout — exact body from auth/login.blade.php
 * body class: bg-body  (Metronic class, no split panel in original)
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{
        __html: `document.body.id='kt_body'; document.body.className='bg-body';`
      }} />
      {children}
    </>
  )
}
