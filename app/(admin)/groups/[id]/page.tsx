/**
 * Exact match: resources/views/admin/group/show.blade.php
 *
 * Columns: ID | Name | Email | NotionalID OR Passport | Phone | Course (badge)
 * DataTable initialized on table id="group"
 */

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import DataTableInit from '@/components/admin/DataTableInit'

interface Props {
  params: Promise<{ id: string }>
}

export default async function GroupShowPage({ params }: Props) {
  const { id } = await params
  const groupId = parseInt(id)
  if (isNaN(groupId)) notFound()

  const supabase = await createClient()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (!group) notFound()

  // Fetch enrollments with student + course (mirrors GroupController::show)
  const enrollmentsRes = await supabase
    .from('enrollments')
    .select('id, student_name, students(id, name, email, uuid, phone), courses(name)')
    .eq('group_id', groupId)
  const enrollments = enrollmentsRes.data as any[] | null

  // Build flat $students array identical to what GroupController passes
  const students = (enrollments ?? []).map(e => {
    const student = e.students as any
    const course  = e.courses  as any
    return {
      id:          student?.id,
      name:        e.student_name || student?.name,
      email:       student?.email,
      uuid:        student?.uuid,
      phone:       student?.phone,
      course_name: course?.name,
    }
  })

  return (
    <div className="row gy-5 g-xl-8">
      <div className="col-xl-12">
        <div className="card card-xl-stretch mb-5 mb-xl-8">
          <div className="card-header border-0 pt-5">
            <h3 className="card-title align-items-start flex-column">
              <span className="card-label fw-bolder fs-3 mb-1">Students</span>
              <span className="text-muted mt-1 fw-bold fs-7">Over {students.length}</span>
            </h3>
          </div>

          <div className="card-body py-3">
            <div className="table-responsive">
              <table
                id="group"
                className="table table-row-dashed table-row-gray-300 align-middle gs-0 gy-4"
              >
                <thead>
                  <tr className="fw-bolder text-muted">
                    <th className="w-25px">ID</th>
                    <th className="min-w-150px">Name</th>
                    <th className="min-w-150px">Email</th>
                    <th className="min-w-150px">NotionalID OR Passport</th>
                    <th className="min-w-150px">Phone</th>
                    <th className="min-w-150px">Course</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td>{student.id}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.uuid}</td>
                      <td>{student.phone}</td>
                      <td>
                        <span className="badge badge-light-danger">{student.course_name}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* new DataTable('#group') — mirrors @push('script') */}
      <DataTableInit tableId="group" />
    </div>
  )
}
