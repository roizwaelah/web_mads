export const RBAC_EDITOR_STORAGE_KEY = "rbac_editor_menu_access_v1";

export const EDITOR_MENU_LIST = [
  "Dashboard",
  "Laman",
  "Media",
  "Artikel",
  "Agenda",
  "Pengumuman",
  "Ekskul",
  "Guru & Staff",
  "Fasilitas",
  "Dokumen",
  "Menu Khusus",
];

export function getDefaultEditorMenuAccess() {
  return Object.fromEntries(EDITOR_MENU_LIST.map((menu) => [menu, true]));
}

export function getEditorMenuAccessFromStorage() {
  try {
    const raw = localStorage.getItem(RBAC_EDITOR_STORAGE_KEY);
    if (!raw) return getDefaultEditorMenuAccess();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return getDefaultEditorMenuAccess();
    return { ...getDefaultEditorMenuAccess(), ...parsed };
  } catch {
    return getDefaultEditorMenuAccess();
  }
}

export function saveEditorMenuAccessToStorage(access) {
  localStorage.setItem(RBAC_EDITOR_STORAGE_KEY, JSON.stringify(access));
}

export function getEditorMenuByPath(pathname) {
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/pages")) return "Laman";
  if (pathname.startsWith("/admin/media")) return "Media";
  if (pathname.startsWith("/admin/posts")) return "Artikel";
  if (pathname.startsWith("/admin/agenda")) return "Agenda";
  if (pathname.startsWith("/admin/announcements")) return "Pengumuman";
  if (pathname.startsWith("/admin/ekskul")) return "Ekskul";
  if (pathname.startsWith("/admin/gurus")) return "Guru & Staff";
  if (pathname.startsWith("/admin/facilities")) return "Fasilitas";
  if (pathname.startsWith("/admin/files")) return "Dokumen";
  if (pathname.startsWith("/admin/modules")) return "Menu Khusus";
  return null;
}

export function isEditorPathAllowed(pathname, editorMenuAccess) {
  const menuName = getEditorMenuByPath(pathname);
  if (!menuName) return true;
  return Boolean(editorMenuAccess?.[menuName]);
}
