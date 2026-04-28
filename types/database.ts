// Auto-typed from Supabase schema
// Field names preserved 1:1 from Laravel migrations

export interface Profile {
  id: string
  name: string
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: number
  name: string
  email: string
  uuid: string       // national ID or passport
  phone: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Group {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface TemplateTextField {
  content?: string
  color?: string
  font_size?: number | string
  font_family: string
  text_align?: 'left' | 'center' | 'right'
  position_pixel_x: number
  position_pixel_y: number
  position_percent_x?: number
  position_percent_y?: number
}

export interface TemplateOptions {
  width?: number
  height?: number
  student?: TemplateTextField
  course?: TemplateTextField
  date?: TemplateTextField & { content?: string }
  qr_code?: {
    content?: string
    position_pixel_x: number
    position_pixel_y: number
    position_percent_x?: number
    position_percent_y?: number
  }
  texts?: TemplateTextField[]
  signatures?: {
    content: string
    position_pixel_x: number
    position_pixel_y: number
    position_percent_x?: number
    position_percent_y?: number
  }[]
}

export interface Template {
  id: number
  name: string
  image: string        // Supabase Storage path
  options: TemplateOptions
  created_at: string
  updated_at: string
}

export interface Font {
  id: number
  name: string
  path: string         // Supabase Storage path
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: number
  student_id: number
  path: string
  student_name: string | null
  course_id: number | null
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: number
  group_id: number
  student_id: number
  course_id: number
  student_name: string
  created_at: string
  updated_at: string
}

export interface EnrollmentTemplate {
  id: number
  template_id: number
  group_id: number
  created_at: string
  updated_at: string
}

// ── Supabase Database type (for typed client) ─────────────────

export interface Database {
  public: {
    Tables: {
      profiles:             { Row: Profile;            Insert: Omit<Profile, 'created_at'|'updated_at'>;            Update: Partial<Profile> }
      students:             { Row: Student;            Insert: Omit<Student, 'id'|'created_at'|'updated_at'>;       Update: Partial<Student> }
      courses:              { Row: Course;             Insert: Omit<Course, 'id'|'created_at'|'updated_at'>;        Update: Partial<Course> }
      groups:               { Row: Group;              Insert: Omit<Group, 'id'|'created_at'|'updated_at'>;         Update: Partial<Group> }
      templates:            { Row: Template;           Insert: Omit<Template, 'id'|'created_at'|'updated_at'>;      Update: Partial<Template> }
      fonts:                { Row: Font;               Insert: Omit<Font, 'id'|'created_at'|'updated_at'>;          Update: Partial<Font> }
      attachments:          { Row: Attachment;         Insert: Omit<Attachment, 'id'|'created_at'|'updated_at'>;    Update: Partial<Attachment> }
      enrollments:          { Row: Enrollment;         Insert: Omit<Enrollment, 'id'|'created_at'|'updated_at'>;    Update: Partial<Enrollment> }
      enrollment_templates: { Row: EnrollmentTemplate; Insert: Omit<EnrollmentTemplate, 'id'|'created_at'|'updated_at'>; Update: Partial<EnrollmentTemplate> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
