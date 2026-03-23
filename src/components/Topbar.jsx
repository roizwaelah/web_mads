
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Menu, BrainCog, LogOut } from 'lucide-react';
import { useModal } from '../context/ModalContext';

const Topbar = ({ toggleSidebar, onLogout, currentUser }) => {
  const { openModal } = useModal();
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    openModal({
      title: "Konfirmasi Keluar",
      content: "Apakah Anda yakin ingin keluar dari panel admin MA Darussalam?",
      confirmText: "Ya, Keluar",
      cancelText: "Batal",
      isDanger: true,
      onConfirm: () => {
        if (onLogout) onLogout();
        navigate('/');
      }
    });
  };
  
  const displayName = currentUser?.fullname || currentUser?.username || "User";

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#1d2327] text-green-500 h-8 flex items-center justify-between px-2 sm:px-4 z-50 shrink-0 text-[13px] italic border-b border-black/20">
      <div className="flex items-center space-x-2 sm:space-x-4 h-full">
        {/* Toggle Sidebar */}
        <button onClick={() => toggleSidebar?.()} className="lg:hidden text-gray-300 hover:text-white h-full px-2 flex items-center justify-center">
          <Menu className="w-5 h-5" />
        </button>
        
        <Link to="/admin" className="hover:bg-[#2c3338] h-full flex items-center px-2 gap-2 transition no-underline">
          <img src="/dp.png" alt="DP" className="w-21 h-7 object-contain" />
        </Link>
      </div>

      <div className="flex items-center h-full">
        <div className="hover:bg-[#2c3338] h-full flex items-center px-3 gap-2 transition cursor-default">
          <span className="hidden sm:inline">Halo, <span className="font-semibold text-white">{displayName}</span></span>
          <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2271b1&color=fff&rounded=true`} alt={displayName} className="w-5 h-5 rounded-full" />
        </div>

        <button onClick={handleLogoutClick} className="hover:bg-[#2c3338] h-full px-3 transition flex items-center gap-1 text-gray-400 hover:text-red-400">
          <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
};

export default Topbar;
