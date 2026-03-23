import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import AdminLayout from "./layouts/AdminLayout";

// Pastikan komponen Toast di-import!
import Toast from "./components/ui/Toast";

import Login from "./pages/admin/Login.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";
import PostList from "./pages/admin/Posts/PostList.jsx";
import PostEditor from "./pages/admin/Posts/PostEditor.jsx";
import MediaList from "./pages/admin/Media/MediaList.jsx";
import PageList from "./pages/admin/Pages/PageList.jsx";
import PageEditor from "./pages/admin/Pages/PageEditor.jsx";
import AgendaList from "./pages/admin/Agenda/AgendaList.jsx";
import AgendaEditor from "./pages/admin/Agenda/AgendaEditor.jsx";
import AnnouncementList from "./pages/admin/Announcements/AnnouncementList.jsx";
import AnnouncementEditor from "./pages/admin/Announcements/AnnouncementEditor.jsx";
import EkskulList from "./pages/admin/Ekskul/EkskulList.jsx";
import EkskulEditor from "./pages/admin/Ekskul/EkskulEditor.jsx";
import Documents from "./pages/admin/Documents.jsx";
import GuruList from "./pages/admin/Guru/GuruList.jsx";
import GuruEditor from "./pages/admin/Guru/GuruEditor.jsx";
import Facilities from "./pages/admin/Facilities.jsx";
import SchoolabKit from "./pages/admin/SchoolabKit.jsx";
import UserList from "./pages/admin/Users/UserList.jsx";
import UserEditor from "./pages/admin/Users/UserEditor.jsx";
import CommentList from "./pages/admin/Comments/CommentList.jsx";
import ModuleList from "./pages/admin/Modules/ModuleList.jsx";
import ModuleEditor from "./pages/admin/Modules/ModuleEditor.jsx";
import ModuleEntries from "./pages/admin/Modules/ModuleEntries.jsx";

import Home from "./pages/Public/Home";
import DaftarPengumuman from "./components/public/DaftarPengumuman.jsx";
import DetailPengumuman from "./components/public/DetailPengumuman.jsx";
import DaftarAgenda from "./components/public/DaftarAgenda.jsx";
import DetailAgenda from "./components/public/DetailAgenda.jsx";
import DaftarBerita from "./components/public/DaftarBerita.jsx";
import DetailBerita from "./components/public/DetailBerita.jsx";
import DaftarEkstrakulikuler from "./components/public/DaftarEkstrakulikuler.jsx";
import GenericPage from "./components/public/GenericPage.jsx";
import {
  addActivityLog,
  clearAuthSession,
  getAuthSession,
  registerFailedLogin,
  resetFailedLogin,
  saveAuthSession,
} from "./utils/auth";
import { sanitizePlainText } from "./utils/security";
import { safeJson } from "./utils/http";
import {
  getEditorMenuAccessFromStorage,
  isEditorPathAllowed,
  RBAC_EDITOR_STORAGE_KEY,
  saveEditorMenuAccessToStorage,
} from "./utils/rbac";
import { clearReadOnlyDemoStore, handleReadOnlyDemoRequest } from "./utils/demoModeApi";

const ProtectedRoute = ({ isAuthenticated, children }) => {
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const RoleRoute = ({
  isAuthenticated,
  userRole,
  editorDeniedPaths,
  editorMenuAccess,
  children,
}) => {
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (userRole === "Read-Only" || userRole === "Demo") return children;
  if (userRole === "Admin") return children;
  const deniedByRole = editorDeniedPaths.some((p) => location.pathname.startsWith(p));
  if (deniedByRole) return <Navigate to="/admin" replace />;
  const allowedByEditorMenu = isEditorPathAllowed(location.pathname, editorMenuAccess);
  if (allowedByEditorMenu) return children;
  return <Navigate to="/admin" replace />;
};

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [authSession, setAuthSession] = useState(null);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const [posts, setPosts] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [pages, setPages] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [ekskul, setEkskul] = useState([]);
  const [gurus, setGurus] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [prestasi, setPrestasi] = useState([]);
  const [comments, setComments] = useState([]);
  const [modules, setModules] = useState([]);

  // State untuk menampung pos mana yang sedang diedit
  const [editingPost, setEditingPost] = useState(null);
  const [editingPage, setEditingPage] = useState(null);
  const [editingAgenda, setEditingAgenda] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingEkskul, setEditingEkskul] = useState(null);
  const [editingGuru, setEditingGuru] = useState(null);

  const [themeSettings, setThemeSettings] = useState({
    logoUrl: "",
    sambutanKepala: "",
    sambutanLinkSlug: "",
    sambutanFoto: "",
    schoolName: "",
    schoolDescription: "",
    phone: "",
    email: "",
    address: "",
    social: { facebook: "", twitter: "", instagram: "", youtube: "" },
    sliders: [],
    primaryColor: "#008e49",
    accentColor: "#e09d00",
    fontFamily: "Poppins",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [editorMenuAccess, setEditorMenuAccess] = useState({});
  const isAuthenticated = Boolean(authSession?.token && authSession?.user);
  const currentUser = authSession?.user || null;
  const userRole = currentUser?.role || "Editor";
  const isReadOnlyUser = userRole === "Read-Only" || userRole === "Demo";

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });

    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 3000);
  };

  const logout = (reason = "Anda telah keluar.") => {
    fetch("/api/auth.php?action=logout", {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    clearReadOnlyDemoStore();
    clearAuthSession();
    setAuthSession(null);
    addActivityLog("logout", reason);
    showToast(reason, "success");
    navigate("/login");
  };

  const handleLoginRequest = async ({ username, password, rememberMe }) => {
    const cleanedUsername = sanitizePlainText(username);
    const cleanedPassword = (password || "").toString();
    try {
      const res = await fetch("/api/auth.php?action=login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: cleanedUsername,
          password: cleanedPassword,
        }),
      });
      const rawBody = await res.text();
      const body = rawBody.replace(/^\uFEFF/, "").trim();
      const result = body ? JSON.parse(body) : null;
      if (result?.status !== "success" || !result?.token || !result?.user) {
        registerFailedLogin();
        addActivityLog("login_failed", `username:${cleanedUsername}`);
        return {
          ok: false,
          message: result?.message || "Login gagal.",
        };
      }
      const session = {
        token: result.token,
        user: result.user,
      };
      saveAuthSession(session, rememberMe);
      resetFailedLogin();
      setAuthSession(session);
      addActivityLog("login_success", `username:${cleanedUsername}`);
      return { ok: true };
    } catch {
      registerFailedLogin();
      return { ok: false, message: "Koneksi server gagal." };
    }
  };

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const parseJson = async (res) => {
          const contentType = res.headers.get("content-type") || "";
          const rawBody = await res.text();
          const body = rawBody.replace(/^\uFEFF/, "").trim();

          if (!body) {
            throw new Error(`Invalid JSON from ${res.url}: no body`);
          }

          try {
            return JSON.parse(body);
          } catch {
            const preview = body.slice(0, 200);
            if (!contentType.includes("application/json")) {
              throw new Error(`Non-JSON response from ${res.url}: ${preview}`);
            }
            throw new Error(`Invalid JSON from ${res.url}: ${preview}`);
          }
        };

        const settingsUrl = `/api/settings.php?ts=${Date.now()}`;
        const [
          resSettings,
          resPosts,
          resMedia,
          resPages,
          resAgendas,
          resAnnouncements,
          resEkskul,
          resGurus,
          resFacilities,
          resComments,
          resModules,
        ] = await Promise.all([
          fetch(settingsUrl, { cache: "no-store" }),
          fetch("/api/posts.php"),
          fetch("/api/media.php"),
          fetch(`/api/pages.php?ts=${Date.now()}`, { cache: "no-store" }),
          fetch("/api/agenda.php"),
          fetch("/api/announcements.php"),
          fetch("/api/ekskul.php"),
          fetch("/api/gurus.php"),
          fetch("/api/facilities.php"),
          fetch("/api/comments.php"),
          fetch("/api/modules.php"),
        ]);

        const settings = await parseJson(resSettings);
        const posts = await parseJson(resPosts);
        const media = await parseJson(resMedia);
        const pages = await parseJson(resPages);
        const agendas = await parseJson(resAgendas);
        const announcements = await parseJson(resAnnouncements);
        const ekskul = await parseJson(resEkskul);
        const gurus = await parseJson(resGurus);
        const facilities = await parseJson(resFacilities);
        const comments = await parseJson(resComments);
        const modules = await parseJson(resModules);

        if (settings.status === "success" && settings.data)
          setThemeSettings(settings.data);
        if (posts.status === "success") setPosts(posts.data);
        if (media.status === "success") setMediaItems(media.data);
        if (pages.status === "success") setPages(pages.data);
        if (agendas.status === "success") setAgendas(agendas.data);
        if (announcements.status === "success")
          setAnnouncements(announcements.data);
        if (ekskul.status === "success") setEkskul(ekskul.data);
        if (gurus.status === "success") setGurus(gurus.data);
        if (facilities.status === "success") setFacilities(facilities.data);
        if (comments.status === "success") setComments(comments.data);
        if (modules.status === "success") setModules(modules.data);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("Koneksi ke API gagal:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const saved = getAuthSession();
    if (saved) setAuthSession(saved);
  }, []);

  useEffect(() => {
    setEditorMenuAccess(getEditorMenuAccessFromStorage());
  }, []);

  useEffect(() => {
    const refreshPages = async () => {
      try {
        const res = await fetch(`/api/pages.php?ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (data.status === "success") {
          setPages(data.data || []);
        }
      } catch {
        // ignore
      }
    };

    const onPagesUpdated = () => refreshPages();
    const onStorage = (event) => {
      if (event.key === "pages-updated-at") refreshPages();
    };

    window.addEventListener("pages-updated", onPagesUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("pages-updated", onPagesUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const syncFromStorage = () => setEditorMenuAccess(getEditorMenuAccessFromStorage());
    const onStorage = (event) => {
      if (event.key === RBAC_EDITOR_STORAGE_KEY) syncFromStorage();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("rbac-editor-menu-updated", syncFromStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("rbac-editor-menu-updated", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const idleLimitMs = 15 * 60 * 1000;
    let idleTimer = null;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        logout("Sesi berakhir otomatis karena tidak aktif.");
      }, idleLimitMs);
    };

    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((name) => window.addEventListener(name, resetIdleTimer, { passive: true }));
    resetIdleTimer();
    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach((name) => window.removeEventListener(name, resetIdleTimer));
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !location.pathname.startsWith("/admin")) return;
    addActivityLog("route_visit", location.pathname);
  }, [isAuthenticated, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || !authSession?.token) return;

    const originalFetch = window.fetch.bind(window);
    let demoNoticeShown = false;
    window.fetch = async (input, init = {}) => {
      const requestUrl = typeof input === "string" ? input : input?.url || "";
      const origin = window.location.origin;
      const isApiRequest =
        requestUrl.startsWith("/api/") ||
        requestUrl.startsWith(`${origin}/api/`);
      const method = (init?.method || "GET").toUpperCase();
      const isWriteMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

      if (isReadOnlyUser && isApiRequest) {
        const demoResponse = await handleReadOnlyDemoRequest({
          url: requestUrl,
          init,
          originalFetch,
          authToken: authSession.token,
        });
        if (demoResponse) {
          if (isWriteMethod && !demoNoticeShown) {
            demoNoticeShown = true;
            showToast("Mode demo aktif: perubahan Read-Only hanya tersimpan lokal per sesi browser.");
          }
          return demoResponse;
        }
      }

      if (!isApiRequest) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers || {});
      headers.set("Authorization", `Bearer ${authSession.token}`);
      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isAuthenticated, isReadOnlyUser, authSession?.token]);

  const editorDeniedPaths = useMemo(() => ["/admin/schoolab", "/admin/users"], []);

  const handleEditorMenuAccessChange = (nextAccess) => {
    setEditorMenuAccess(nextAccess);
    saveEditorMenuAccessToStorage(nextAccess);
    window.dispatchEvent(new Event("rbac-editor-menu-updated"));
  };

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  return (
    <>
      <Routes>
        {/* AREA PUBLIK */}
        <Route
          path="/"
          element={<PublicLayout themeSettings={themeSettings} />}
        >
          <Route
            index
            element={
              <Home
                posts={posts}
                announcements={announcements}
                agendas={agendas}
                gurus={gurus}
                fasilitas={facilities}
                ekskul={ekskul}
                themeSettings={themeSettings}
              />
            }
          />
          <Route path="berita" element={<DaftarBerita posts={posts} />} />
          <Route path="berita/:id" element={<DetailBerita posts={posts} />} />
          <Route path="agenda" element={<DaftarAgenda agenda={agendas} />} />
          <Route path="agenda/:id" element={<DetailAgenda agenda={agendas} />} />
          <Route
            path="pengumuman"
            element={<DaftarPengumuman announcements={announcements} />}
          />
          <Route
            path="pengumuman/:id"
            element={<DetailPengumuman announcements={announcements} />}
          />
          <Route path="/ekskul" element={<DaftarEkstrakulikuler ekskul={ekskul} />} />
          <Route
            path="page/:slug"
            element={<GenericPage pages={pages} />}
          />
        </Route>

        {/* AREA LOGIN */}
        <Route
          path="/login"
          element={
            <Login
              onLoginRequest={handleLoginRequest}
              showToast={showToast}
              themeSettings={themeSettings}
            />
          }
        />

        {/* PAGE EDITOR STANDALONE */}
        <Route
          path="/admin/pages/editor/:id?"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RoleRoute
                isAuthenticated={isAuthenticated}
                userRole={userRole}
                editorDeniedPaths={editorDeniedPaths}
                editorMenuAccess={editorMenuAccess}
              >
                <div className="min-h-screen bg-gray-100 p-6">
                  <PageEditor
                    pages={pages}
                    setPages={setPages}
                    mediaItems={mediaItems}
                    showToast={showToast}
                    modules={modules}
                  />
                </div>
              </RoleRoute>
            </ProtectedRoute>
          }
        />

        {/* AREA ADMIN */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <RoleRoute
                isAuthenticated={isAuthenticated}
                userRole={userRole}
                editorDeniedPaths={editorDeniedPaths}
                editorMenuAccess={editorMenuAccess}
              >
                <AdminLayout
                  onLogout={logout}
                  currentUser={currentUser}
                  editorMenuAccess={editorMenuAccess}
                  showToast={showToast}
                />
              </RoleRoute>
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Dashboard
                showToast={showToast}
                themeSettings={themeSettings}
                pages={pages}
                posts={posts}
                setPosts={setPosts}
                gurus={gurus}
                announcements={announcements}
                agendas={agendas}
              />
            }
          />
          <Route
            path="posts"
            element={
              <PostList
                posts={posts}
                setPosts={setPosts}
                showToast={showToast}
              />
            }
          />
          <Route
            path="posts/edit/:id?"
            element={
              <PostEditor
                posts={posts}
                setPosts={setPosts}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="pages"
            element={
              <PageList
                pages={pages}
                setPages={setPages}
                showToast={showToast}
              />
            }
          />
          <Route
            path="pages/edit/:id?"
            element={
              <PageEditor
                pages={pages}
                setPages={setPages}
                mediaItems={mediaItems}
                showToast={showToast}
                modules={modules}
              />
            }
          />
          <Route
            path="agenda"
            element={
              <AgendaList
                agendas={agendas}
                setAgendas={setAgendas}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="agenda/edit/:id?"
            element={
              <AgendaEditor
                agendas={agendas}
                setAgendas={setAgendas}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="announcements"
            element={
              <AnnouncementList
                announcements={announcements}
                setAnnouncements={setAnnouncements}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="announcements/edit/:id?"
            element={
              <AnnouncementEditor
                announcements={announcements}
                setAnnouncements={setAnnouncements}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="gurus"
            element={
              <GuruList
                gurus={gurus}
                setGurus={setGurus}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="gurus/edit/:id?"
            element={
              <GuruEditor
                gurus={gurus}
                setGurus={setGurus}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="ekskul"
            element={
              <EkskulList
                ekskul={ekskul}
                setEkskul={setEkskul}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="ekskul/edit/:id?"
            element={
              <EkskulEditor
                ekskul={ekskul}
                setEkskul={setEkskul}
                mediaItems={mediaItems}
                showToast={showToast}
              />
            }
          />
          <Route
            path="media"
            element={
              <MediaList
                mediaItems={mediaItems}
                setMediaItems={setMediaItems}
                showToast={showToast}
              />
            }
          />
          <Route 
            path="facilities" 
            element={
              <Facilities 
                facilities={facilities}
                setFacilities={setFacilities}
                mediaItems={mediaItems}
                showToast={showToast} 
              />
            } 
          />
          <Route
            path="files"
            element={
              <Documents
                showToast={showToast}
              />
            }
          />
          <Route
            path="schoolab"
            element={
              <SchoolabKit
                themeSettings={themeSettings}
                setThemeSettings={setThemeSettings}
                showToast={showToast}
                mediaItems={mediaItems}
                pages={pages}
              />
            }
          />
          <Route
            path="users"
            element={
              <UserList
                showToast={showToast}
                currentUser={currentUser}
                editorMenuAccess={editorMenuAccess}
                onEditorMenuAccessChange={handleEditorMenuAccessChange}
              />
            }
          />
          <Route
            path="users/edit/:id?"
            element={
              <UserEditor showToast={showToast} />
            }
          />
          <Route
            path="comments"
            element={
              <CommentList
                showToast={showToast}
                comments={comments}
                setComments={setComments}
              />
            }
          />
          <Route
            path="modules"
            element={
              <ModuleList
                modules={modules}
                setModules={setModules}
                showToast={showToast}
              />
            }
          />
          <Route
            path="modules/edit/:id?"
            element={
              <ModuleEditor
                modules={modules}
                setModules={setModules}
                showToast={showToast}
              />
            }
          />
          <Route
            path="modules/:id"
            element={
              <ModuleEntries
                modules={modules}
                showToast={showToast}
              />
            }
          />
        </Route>
      </Routes>

      {/* TOAST DITEMPATKAN DI LUAR ROUTES */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}
    </>
  );
}

