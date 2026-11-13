import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, homePath, useAuth } from './lib/auth'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import CoursesPage from './pages/CoursesPage'
import CourseDetailsPage from './pages/CourseDetailsPage'
import MyRegistrationsPage from './pages/MyRegistrationsPage'
import InstructorStudentsPage from './pages/InstructorStudentsPage'
import AdminCoursesPage from './pages/admin/AdminCoursesPage'
import AdminRegistrationsPage from './pages/admin/AdminRegistrationsPage'
import AdminInstructorsPage from './pages/admin/AdminInstructorsPage'
import AdminPoolsPage from './pages/admin/AdminPoolsPage'
import './styles.css'
import './app.css'

function Home() {
  const { user } = useAuth()
  return <Navigate to={user ? homePath(user.role) : '/login'} replace/>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user ? <Navigate to={homePath(user.role)} replace/> : <>{children}</>
}

function App() {
  return <BrowserRouter>
    <Routes>
      <Route path="/login" element={<GuestOnly><LoginPage mode="login"/></GuestOnly>}/>
      <Route path="/register" element={<GuestOnly><LoginPage mode="register"/></GuestOnly>}/>

      <Route element={<ProtectedRoute><AppLayout/></ProtectedRoute>}>
        {/* Student */}
        <Route path="/courses" element={<ProtectedRoute roles={['Student']}><CoursesPage/></ProtectedRoute>}/>
        <Route path="/courses/:id" element={<ProtectedRoute roles={['Student']}><CourseDetailsPage/></ProtectedRoute>}/>
        <Route path="/my-registrations" element={<ProtectedRoute roles={['Student']}><MyRegistrationsPage/></ProtectedRoute>}/>
        {/* Instructor */}
        <Route path="/instructor/students" element={<ProtectedRoute roles={['Instructor']}><InstructorStudentsPage/></ProtectedRoute>}/>
        {/* Admin */}
        <Route path="/admin/courses" element={<ProtectedRoute roles={['Admin']}><AdminCoursesPage/></ProtectedRoute>}/>
        <Route path="/admin/registrations" element={<ProtectedRoute roles={['Admin']}><AdminRegistrationsPage/></ProtectedRoute>}/>
        <Route path="/admin/instructors" element={<ProtectedRoute roles={['Admin']}><AdminInstructorsPage/></ProtectedRoute>}/>
        <Route path="/admin/pools" element={<ProtectedRoute roles={['Admin']}><AdminPoolsPage/></ProtectedRoute>}/>
      </Route>

      <Route path="*" element={<Home/>}/>
    </Routes>
  </BrowserRouter>
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AuthProvider><App/></AuthProvider></React.StrictMode>
)
