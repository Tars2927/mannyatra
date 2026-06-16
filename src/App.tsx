import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Invites from './pages/Invites'
import Explore from './pages/Explore'
import Accomplished from './pages/Accomplished'
import Settings from './pages/Settings'
import Login from "./pages/Login"
import Invite from "./pages/Invite"
import AdminLogin from "./pages/AdminLogin"
import AdminEmail from "./pages/AdminEmail"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/invites" element={<Invites />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/accomplished" element={<Accomplished />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/login" element={<Login />} />
      <Route path="/invite/:code" element={<Invite />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/email" element={<AdminEmail />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
