import { PageHeader } from '../components/PageHeader'
import { StudentsByCourse } from '../components/StudentsByCourse'
import { useAuth } from '../lib/auth'

// המדריך רואה רק את התלמידים שלו: ה-id נלקח מהמשתמש המחובר, והשרת מחזיר 403 לכל id אחר
export default function InstructorStudentsPage() {
  const { user } = useAuth()
  if (!user) return null
  return <main className="page-main">
    <PageHeader eyebrow="MY STUDENTS" title={`שלום, ${user.fullName}`} subtitle="התלמידים הרשומים לקורסים שלך, לפי קורס."/>
    <StudentsByCourse instructorId={user.id}/>
  </main>
}
