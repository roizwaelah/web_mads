import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function AdminLayout({ onLogout, currentUser, editorMenuAccess }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      <Sidebar 
        isOpen={sidebarOpen}
        setOpen={setSidebarOpen}
        currentUser={currentUser}
        editorMenuAccess={editorMenuAccess}
      />

      <div className="flex-1 flex flex-col">
        <Topbar toggleSidebar={toggleSidebar} onLogout={onLogout} currentUser={currentUser} />

        <main className="p-6 lg:ml-[14.4rem] mt-6">
          <Outlet />
        </main>
      </div>

    </div>
  );
}
