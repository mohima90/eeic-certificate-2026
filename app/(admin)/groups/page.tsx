/**
 * Groups index page
 * Mirrors: GroupController::index() + resources/views/admin/group/index.blade.php
 */

import { createClient } from '@/lib/supabase/server'
import GroupsClient from './GroupsClient'

export default async function GroupsPage() {
  const supabase = await createClient()
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false })

  return <GroupsClient groups={groups ?? []} />
}
