import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Phone, ChevronDown, Menu, X } from 'lucide-react';
import { normalizeMediaUrl } from '../../utils/http';

export default function Header({ themeSettings }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState(null);
  
  const settings = themeSettings || {
    headerStyle: 'classic',
    stickyHeader: true,
    logoUrl: '/logo.png',
    navigationMenu: []
  };

  const isSticky = settings.stickyHeader !== false;
  const headerStyle = settings.headerStyle || 'classic';
  const logoUrl = settings.logoUrl || '/logo.png';
  const logoSrc = normalizeMediaUrl(logoUrl);

  const decodeHtml = (value) => {
    if (!value) return "";
    return value
      .toString()
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'");
  };

  const toTitle = (value) => {
    if (!value) return "";
    return value
      .toString()
      .trim()
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  };

  const getLabel = (item) => {
    const raw =
      item?.label ||
      item?.title ||
      item?.name ||
      toTitle(item?.slug) ||
      "Menu";
    return decodeHtml(raw);
  };

  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return Object.values(value);
  };

  const navItems = settings.navigationMenu && toArray(settings.navigationMenu).length > 0 
    ? toArray(settings.navigationMenu) 
    : [{ id: 1, label: 'Beranda', type: 'home', path: '/' }];
  const schoolName = settings.schoolName || 'MA Darussalam Cilongok';

  const getPath = (item) => {
    if (item.type === 'custom') return item.url || '#';
    if (item.path) return item.path;
    if (item.type === 'home') return '/';
    if (item.type === 'articles') return '/berita';
    if (item.type === 'agenda') return '/agenda';
    if (item.type === 'announcements') return '/pengumuman';
    if (item.type === 'ekskul') return '/ekskul';
    if (item.type === 'default') return '/page/default';

    if (item.type === 'page') return `/page/${item.slug || item.label?.toLowerCase()}`;
    return '/';
  };

  const goToFooter = () => {
    const footer = document.getElementById('site-footer');
    if (footer) {
      footer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  const DesktopNavLinks = ({ extraClass = "" }) => (
    <nav
      aria-label="Navigasi utama"
      className={`hidden lg:flex items-center h-full gap-4 font-semibold text-sm justify-end flex-1 ${extraClass}`}
    >
      {navItems.map((item) => {
        if (item.type === 'dropdown') {
          return (
            <div key={item.id} className="relative group h-full flex items-center">
              <button
                type="button"
                aria-haspopup="true"
                aria-expanded="false"
                className="text-white hover:text-yellow-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 flex items-center gap-1 transition mt-1"
              >
                {getLabel(item)} <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
              </button>
              <div className="absolute left-0 top-full w-52 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                <div className="bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden py-2 flex flex-col">
                  {toArray(item.children).map(child => (
                    <NavLink 
                      key={child.id} 
                       to={getPath(child)}
                      className={({ isActive }) => `text-left px-5 py-2.5 text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-700 ${isActive ? 'bg-green-50 text-green-700 font-bold border-l-4 border-green-600' : 'text-gray-700 hover:bg-green-50 hover:text-green-700'}`}
                    >
                      {getLabel(child)}
                    </NavLink>
                  ))}
                </div>
              </div>
            </div>
          );
        }

        // Jika tipe custom eksternal, gunakan tag <a> biasa
        if (item.type === 'custom') {
           return (
             <a 
               key={item.id} 
               href={getPath(item)}
               target="_blank"
               rel="noopener noreferrer"
               className="text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 flex items-center mt-1 border-b-2 h-20 border-transparent hover:text-yellow-400"
             >
               {getLabel(item)}
             </a>
           );
        }

        return (
          <NavLink 
            key={item.id} 
            to={getPath(item)}
            end={item.type === 'home'}
            className={({ isActive }) => `text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 flex items-center mt-1 border-b-2 h-20 ${isActive ? 'border-yellow-400 text-yellow-400 font-bold' : 'border-transparent hover:text-yellow-400'}`}
          >
            {getLabel(item)}
          </NavLink>
        );
      })}
    </nav>
  );

  const LogoBlock = () => (
    <Link to="/" aria-label={`Kembali ke beranda ${schoolName}`} className="flex items-center gap-3 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300" onClick={() => setIsMobileMenuOpen(false)}>
      <img src={logoSrc} alt={`Logo ${schoolName}`} className="w-12 h-12 object-contain" />
      <span className="font-bold text-2xl hidden sm:block text-(--bg-site) uppercase tracking-tight">
        {schoolName}
      </span>
    </Link>
  );

  const ActionBlock = ({ forceHamburger = false }) => (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={goToFooter}
        className="hidden sm:flex bg-(--accent,#e09d00) hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 text-(--bg-site) px-5 py-2 rounded-full font-bold text-sm shadow-md transition items-center gap-2 cursor-pointer"
      >
        <Phone className="w-4 h-4" /> Hubungi
      </button>

      <button
        type="button"
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-navigation"
        aria-label={isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        className={`${forceHamburger ? '' : 'lg:hidden '}p-2 text-(--bg-site) transition cursor-pointer`}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
      </button>
    </div>
  );

  return (
    <header className={`${isSticky ? 'fixed top-0 left-0 right-0' : 'relative'} z-50 bg-(--primary,#008e49) shadow-md text-white transition-all duration-300`}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:px-4 focus:py-2 focus:bg-white focus:text-green-800 focus:rounded-md focus:z-[70]"
      >
        Lewati ke konten utama
      </a>
      {headerStyle === 'centered' ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <LogoBlock />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DesktopNavLinks extraClass="pr-6 lg:pr-10" />
            </div>
            <ActionBlock />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <LogoBlock />

          {headerStyle === 'hamburger' ? null : <DesktopNavLinks extraClass="pr-2 lg:pr-3" />}

          <ActionBlock forceHamburger={headerStyle === 'hamburger'} />
        </div>
      )}

      {isMobileMenuOpen && (
        <div id="mobile-navigation" className={`${headerStyle === 'hamburger' ? '' : 'lg:hidden '}absolute left-0 w-full bg-(--primary,#008e49) border-t border-white/10 shadow-2xl pb-8 px-4 flex flex-col gap-1 overflow-y-auto max-h-[85vh] animate-in slide-in-from-top duration-300`}>
          <nav aria-label="Navigasi seluler" className="py-4">
            {navItems.map((item) => {
              if (item.type === 'dropdown') {
                const isOpen = activeMobileDropdown === item.id;
                return (
                  <div key={item.id} className="mb-1">
                    <button 
                      onClick={() => setActiveMobileDropdown(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-(--bg-site) font-bold rounded-lg bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                    >
                      {getLabel(item)} <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <div className="flex flex-col mt-1 ml-4 border-l border-white/20 pl-4 gap-1">
                        {toArray(item.children).map(child => (
                          <NavLink key={child.id} to={getPath(child)} onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) => `px-4 py-2 text-sm rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 ${isActive ? 'bg-yellow-400 text-green-900 font-bold' : 'text-white/80'}`}>
                            {getLabel(child)}
                          </NavLink>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              if (item.type === 'custom') {
                 return (
                   <a 
                     key={item.id} 
                     href={getPath(item)}
                     target="_blank"
                     rel="noopener noreferrer"
                     onClick={() => setIsMobileMenuOpen(false)}
                     className="block px-4 py-3 text-base rounded-lg font-semibold transition text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
                   >
                     {getLabel(item)}
                   </a>
                 );
              }

              return (
                <NavLink 
                  key={item.id} 
                  to={getPath(item)} 
                  end={item.type === 'home'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) => `block px-4 py-3 text-base rounded-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300 ${isActive ? 'bg-yellow-400 text-green-900 shadow-inner' : 'text-white hover:bg-white/10'}`}
                >
                  {getLabel(item)}
                </NavLink>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={goToFooter}
            className="bg-(--accent,#e09d00) text-white p-4 rounded-xl font-bold flex items-center justify-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
          >
            <Phone className="w-5 h-5" /> Hubungi Kami
          </button>
        </div>
      )}
    </header>
  );
}
