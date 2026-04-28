// Wraps SweetAlert2 (bundled in Metronic's plugins.bundle.js as window.Swal)

export function showToast(type: 'success' | 'error' | 'warning' | 'info', message: string) {
  const Swal = (window as any).Swal
  if (!Swal) return
  Swal.fire({
    toast: true,
    position: 'top-end',
    icon: type,
    title: message,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  })
}

export async function showConfirm(title: string, text?: string): Promise<boolean> {
  const Swal = (window as any).Swal
  if (!Swal) return window.confirm(title + (text ? '\n' + text : ''))
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#f1416c',
    cancelButtonColor: '#7239ea',
  })
  return result.isConfirmed
}
