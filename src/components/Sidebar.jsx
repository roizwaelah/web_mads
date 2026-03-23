import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Pin, Image as ImageIcon, FileText, MessageSquare, 
  CalendarDays, Megaphone, Medal, Users, Building, File, 
  Wand2, Database
} from 'lucide-react';

const Sidebar = ({ isOpen, setOpen, currentUser, editorMenuAccess = {} }) => {
  const role = currentUser?.role || "Editor";
  // 1. Definisikan path rute yang sesuai dengan App.jsx
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Dashboard' },
    { divider: true, label: 'Web'  },
    { id: 'pages', label: 'Laman', icon: FileText, path: '/admin/pages', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Laman' },
    { id: 'media', label: 'Media', icon: ImageIcon, path: '/admin/media', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Media' },
    { id: 'comments', label: 'Komentar', icon: MessageSquare, path: '/admin/comments', roles: ['Admin', 'Read-Only', 'Demo'] },
    { divider: true, label: 'Pages' },
    { id: 'posts', label: 'Artikel', icon: Pin, path: '/admin/posts', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Artikel' },
    { id: 'agenda', label: 'Agenda', icon: CalendarDays, path: '/admin/agenda', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Agenda' },
    { id: 'announcements', label: 'Pengumuman', icon: Megaphone, path: '/admin/announcements', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Pengumuman' },
    { id: 'extracurricular', label: 'Ekskul', icon: Medal, path: '/admin/ekskul', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Ekskul' },
    { id: 'gurus', label: 'Guru & Staff', icon: Users, path: '/admin/gurus', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Guru & Staff' },
    { id: 'facilities', label: 'Fasilitas', icon: Building, path: '/admin/facilities', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Fasilitas' },
    { id: 'files', label: 'Dokumen', icon: File, path: '/admin/files', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Dokumen' },
    { divider: true, label: 'Menu Khusus' },
    { id: 'modules', label: 'Module', icon: Database, path: '/admin/modules', roles: ['Admin', 'Editor', 'Read-Only', 'Demo'], editorKey: 'Menu Khusus' },
    { divider: true, label: 'Tools'  },
    { id: 'schoolab', label: 'Schoolab Kit', icon: Wand2, isSpecial: true, path: '/admin/schoolab', roles: ['Admin', 'Read-Only', 'Demo'] },
    { id: 'users', label: 'Pengguna', icon: Users, path: '/admin/users', roles: ['Admin', 'Read-Only', 'Demo'] },
  ];

  const visibleMenuItems = menuItems.filter((item) => {
    if (item.divider) return true;
    if (item.roles && !item.roles.includes(role)) return false;
    if (role === "Editor" && item.editorKey) {
      return Boolean(editorMenuAccess[item.editorKey]);
    }
    return true;
  });

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`
          fixed left-0 z-40 w-[14.4rem] bg-[#1d2327] text-gray-300 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          /* POSISI DI BAWAH TOPBAR */
          top-8 
          /* TINGGI SISA LAYAR (100vh - 32px tinggi topbar) */
          h-[calc(100vh-2rem)] 
          overflow-y-auto
          border-r border-black/20
        `}
      >
        <nav className="py-3.5 flex flex-col h-full">
          {visibleMenuItems.map((item, index) => {
            if (item.divider) {
              return (
                <React.Fragment key={`div-${index}`}>
                  {item.label && (
                    <>
                      <div className="px-3.5 pt-3.5 pb-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        {item.label}
                      </div>
                    </>
                  )}
                  <div className="my-1 border-t border-gray-700/50"></div>
                </React.Fragment>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setOpen(false)}
                className={({ isActive }) => `
                  w-full flex items-center px-3.5 py-1.5 transition group text-[0.875rem]
                  ${isActive ? 'bg-[#2271b1] text-white font-semibold' : 'hover:bg-[#2c3338] hover:text-[#2271b1]'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4.5 h-4.5 mr-2.5 shrink-0 ${
                      isActive ? 'text-white' : item.isSpecial ? 'text-[#fbbf24]' : 'text-gray-400 group-hover:text-[#2271b1]'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
