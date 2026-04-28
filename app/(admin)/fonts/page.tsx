/**
 * Fonts index page
 * Mirrors: FontController::index() + resources/views/admin/font/index.blade.php
 */

import { createClient } from '@/lib/supabase/server'
import FontsClient from './FontsClient'

export default async function FontsPage() {
  const supabase = await createClient()
  const { data: fonts } = await supabase.from('fonts').select('*').order('created_at', { ascending: false })

  return <FontsClient fonts={fonts ?? []} />
}
