import React, { useEffect, useState, useRef } from "react";
import { Bell, Camera, CheckCircle, Clock, Edit3, Heart, Key, Loader2, Lock, Mail, Music, Plus, Search, ShieldCheck, Target, Trash2, Unlock, Users, Zap, BadgeCheck, Download, X } from "lucide-react";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import MainLayout from "../components/MainLayout";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE_URL, resolveUrl } from "../utils/constants";
import verifiedBadge from "../assets/verified.png";
import vibeLogo from "../assets/vibe-logo.png";
const UserManagement = ({ users, loading, removeUser, approveDeletion, loadUsers, currentUser }) => {
  const { activeAdminTab: currentTab } = useSidebar();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const handleToggleBlock = async (id, currentStatus) => {
    if (!window.confirm(`Security Protocol: ${currentStatus ? "Unblock" : "Restrict"} this user?`)) return;
    try {
      await api.put(`/auth/users/block/${id}`);
      alert(`User access ${currentStatus ? "restored" : "restricted"}.`);
      if (loadUsers) loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed.");
    }
  };
  const handleUpdateName = async (id, currentName) => {
    const newName = window.prompt("Enter new identity label (Full Name):", currentName);
    if (!newName || newName === currentName) return;
    try {
      await api.put(`/auth/users/update/${id}`, { name: newName });
      alert("Identity label updated successfully.");
      if (loadUsers) loadUsers();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to update identity label.";
      alert(errorMsg);
    }
  };
  const handleResetPassword = async (id) => {
    const newPassword = window.prompt("Enter new security key for this account:");
    if (!newPassword) return;
    const targetUser = users.find((u) => u._id === id);
    const requiredLen = targetUser?.email.endsWith("@vibecom") ? 10 : 6;
    if (newPassword.length !== requiredLen) {
      alert(`Security key for this account must be exactly ${requiredLen} characters.`);
      return;
    }
    try {
      await api.put(`/auth/reset-password/${id}`, { newPassword });
      alert("Security key synchronized successfully.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reset security key.");
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [adminForm, setAdminForm] = useState({ name: "", email: "", password: "" });
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const filteredUsers = users.filter(
    (u) => u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const adminUsers = filteredUsers.filter((u) => (u.role === "admin" || u.role === "superadmin") && u.email !== currentUser?.email);
  const regularUsers = filteredUsers.filter((u) => u.role === "user" || !u.role);
  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreatingAdmin(true);
    setAdminError("");
    setAdminSuccess("");
    const cleanEmail = adminForm.email.trim().toLowerCase();
    const isVibecom = cleanEmail.endsWith("@vibecom");
    const requiredLen = isVibecom ? 10 : 6;
    if (adminForm.password.length !== requiredLen) {
      setAdminError(`Access key for ${isVibecom ? "System Account (@vibecom)" : "Curator Account"} must be exactly ${requiredLen} characters.`);
      setCreatingAdmin(false);
      return;
    }
    try {
      await api.post("/auth/create-admin", adminForm);
      setAdminSuccess("Admin Account created successfully.");
      setAdminForm({ name: "", email: "", password: "" });
      if (loadUsers) loadUsers();
    } catch (err) {
      setAdminError(err.response?.data?.message || "Failed to create admin.");
    } finally {
      setCreatingAdmin(false);
    }
  };
  const [visibleCount, setVisibleCount] = useState(40);
  const [loadingMore, setLoadingMore] = useState(false);
  const UserTable = ({ data, title }) => /* @__PURE__ */ React.createElement("div", { className: "mb-12 glass-card p-4 sm:p-10 border border-white/5 shadow-2xl relative" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-4 w-12 h-1 bg-vibe-primary/40 rounded-full" }), /* @__PURE__ */ React.createElement("h3", { className: "text-2xl font-black text-white mb-10 tracking-tighter flex items-center gap-3" }, title, /* @__PURE__ */ React.createElement("span", { className: "text-[11px] bg-vibe-primary/20 text-vibe-primary border border-vibe-primary/20 px-3 py-1 rounded-lg uppercase tracking-widest font-black" }, data.length, " Online")), /* @__PURE__ */ React.createElement("div", { className: "hidden md:block overflow-x-auto" }, /* @__PURE__ */ React.createElement("table", { className: "w-full text-left border-separate border-spacing-y-4" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", { className: "text-muted text-[11px] font-black uppercase tracking-[0.3em] opacity-40" }, /* @__PURE__ */ React.createElement("th", { className: "pb-4 px-6 border-b border-white/5" }, "Metadata & ID"), /* @__PURE__ */ React.createElement("th", { className: "pb-4 px-6 border-b border-white/5" }, "Credentials"), /* @__PURE__ */ React.createElement("th", { className: "pb-4 px-6 border-b border-white/5" }, "Activity"), /* @__PURE__ */ React.createElement("th", { className: "pb-4 px-6 border-b border-white/5" }, "Status & Role"), /* @__PURE__ */ React.createElement("th", { className: "pb-4 px-6 border-b border-white/5 text-right" }, "Operations"))), /* @__PURE__ */ React.createElement("tbody", null, data.slice(0, visibleCount).map((u) => /* @__PURE__ */ React.createElement("tr", { key: u._id, className: `group/row transition-colors duration-300 ${u.deletionRequested ? "bg-red-500/5" : ""}` }, /* @__PURE__ */ React.createElement("td", { className: "py-6 px-6 first:rounded-l-[24px] bg-white/[0.02] border-y border-l border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "font-bold text-white text-base group-hover/row:text-vibe-primary transition-colors tracking-tight mb-0.5" }, u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim())), /* @__PURE__ */ React.createElement("td", { className: "py-6 px-6 bg-white/[0.02] border-y border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "text-[13px] text-hdr font-bold flex items-center gap-2 tracking-tight" }, /* @__PURE__ */ React.createElement(Mail, { size: 14, className: "text-vibe-primary" }), " ", u.email)), /* @__PURE__ */ React.createElement("td", { className: "py-6 px-6 bg-white/[0.02] border-y border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300" }, /* @__PURE__ */ React.createElement("span", { className: "text-vibe-primary font-black text-[11px] flex items-center gap-1.5 uppercase tracking-widest border border-vibe-primary/20 bg-vibe-primary/5 w-fit px-3 py-1 rounded-lg" }, /* @__PURE__ */ React.createElement(Heart, { size: 11, fill: "currentColor", strokeWidth: 0 }), " ", u.likedSongs?.length || 0, " Liked Music")), /* @__PURE__ */ React.createElement("td", { className: "py-6 px-6 bg-white/[0.02] border-y border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col gap-1.5" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: `w-fit px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all duration-500 shadow-xl ${u.role === "superadmin" || u.role === "admin" ? "bg-vibe-primary/10 text-vibe-primary border-vibe-primary/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10"}` }, u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "Curator Admin" : "User"), u.isVerified && /* @__PURE__ */ React.createElement(BadgeCheck, { size: 18, className: "text-[#1D9BF0]", fill: "currentColor", stroke: "white", strokeWidth: 1.5 })))), /* @__PURE__ */ React.createElement("td", { className: "py-6 px-6 text-right last:rounded-r-[24px] bg-white/[0.02] border-y border-r border-white/5 group-hover/row:border-vibe-primary/30 transition-colors duration-300" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-end gap-3" }, /* @__PURE__ */ React.createElement("button", { onClick: () => handleToggleBlock(u._id, u.isBlocked), className: `p-3.5 rounded-2xl transition-all ${u.isBlocked ? "bg-orange-500/20 text-orange-500" : "bg-white/5 text-slate-400"}` }, u.isBlocked ? /* @__PURE__ */ React.createElement(Lock, { size: 18, fill: "currentColor" }) : /* @__PURE__ */ React.createElement(Unlock, { size: 18 })), /* @__PURE__ */ React.createElement("button", { onClick: () => handleUpdateName(u._id, u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim()), className: "p-3.5 rounded-2xl bg-white/5 text-slate-400" }, /* @__PURE__ */ React.createElement(Edit3, { size: 18 })), /* @__PURE__ */ React.createElement("button", { onClick: () => handleResetPassword(u._id), className: "p-3.5 rounded-2xl bg-vibe-primary/10 text-vibe-primary" }, /* @__PURE__ */ React.createElement(Key, { size: 18 })), /* @__PURE__ */ React.createElement("button", { onClick: () => removeUser(u._id), className: `p-3.5 rounded-2xl transition-all ${currentUser?.role === "superadmin" ? "bg-red-500/10 text-red-500" : "bg-white/5 opacity-50"}` }, /* @__PURE__ */ React.createElement(Trash2, { size: 18 }))))))))), /* @__PURE__ */ React.createElement("div", { className: "md:hidden space-y-4" }, data.slice(0, visibleCount).map((u) => /* @__PURE__ */ React.createElement("div", { key: u._id, className: `panel-soft p-6 border transition-all ${u.deletionRequested ? "border-red-500/30 bg-red-500/5" : "border-white/5"} space-y-6 rounded-[32px]` }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between" }, /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-white text-base tracking-tight truncate mb-1" }, u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim()), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("p", { className: `text-[10px] font-black tracking-widest uppercase ${u.role === "admin" || u.role === "superadmin" ? "text-vibe-primary" : "text-emerald-400"}` }, u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "Curator Admin" : "User"), u.isVerified && /* @__PURE__ */ React.createElement(BadgeCheck, { size: 14, className: "text-[#1D9BF0]", fill: "currentColor", stroke: "white", strokeWidth: 1 })))), /* @__PURE__ */ React.createElement("div", { className: "p-4 bg-white/5 rounded-2xl border border-white/5" }, /* @__PURE__ */ React.createElement("p", { className: "text-[13px] text-slate-300 flex items-center gap-3 font-medium truncate" }, /* @__PURE__ */ React.createElement(Mail, { size: 14, className: "text-vibe-primary" }), " ", u.email)), /* @__PURE__ */ React.createElement("div", { className: "flex flex-wrap gap-2" }, /* @__PURE__ */ React.createElement("button", { onClick: () => handleUpdateName(u._id, u.name || `${u.firstName || ""} ${u.lastName || ""}`.trim()), className: "flex-1 py-3 bg-white/5 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5" }, "Edit"), /* @__PURE__ */ React.createElement("button", { onClick: () => handleResetPassword(u._id), className: "flex-1 py-3 bg-vibe-primary/10 text-vibe-primary rounded-xl text-[10px] font-black uppercase tracking-widest border border-vibe-primary/20" }, "Key"), /* @__PURE__ */ React.createElement("button", { onClick: () => removeUser(u._id), className: `w-full py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border ${currentUser?.role === "superadmin" ? "bg-red-500/10 text-red-500" : "bg-white/5 opacity-50"}` }, "Delete"))))), data.length > visibleCount && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center mt-12 gap-5" }, loadingMore ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-vibe-primary", size: 40, strokeWidth: 2 }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-vibe-primary uppercase tracking-[0.4em] animate-pulse text-center" }, "Expanding Network Cluster...")) : /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((v) => v + 40);
          setLoadingMore(false);
        }, 3e3);
      },
      className: "px-12 py-5 rounded-full border border-vibe-primary/30 bg-vibe-primary/5 text-vibe-primary hover:bg-vibe-primary hover:text-white transition-all font-black text-[11px] uppercase tracking-[0.25em] active:scale-95 shadow-2xl backdrop-blur-md"
    },
    "Sync Next 40 Accounts"
  )));
  return /* @__PURE__ */ React.createElement("div", { className: "animate-in fade-in duration-700 space-y-8" }, (currentTab === "admins" || currentTab === "users") && /* @__PURE__ */ React.createElement("div", { className: "relative mb-8 z-20" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3 ml-2" }, /* @__PURE__ */ React.createElement(Search, { className: "text-vibe-primary", size: 14 }), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-vibe-primary uppercase tracking-[0.3em]" }, "Search")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search...",
      value: searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-muted/40 focus:outline-none focus:border-vibe-primary/40 focus:ring-1 focus:ring-vibe-primary/40 transition-all font-bold text-sm shadow-xl"
    }
  )), currentTab === "admins" && currentUser?.role === "superadmin" && /* @__PURE__ */ React.createElement("form", { onSubmit: handleCreateAdmin, className: "glass-card p-8 border-vibe-primary/20 bg-vibe-900 mb-10" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-hdr uppercase tracking-tighter flex items-center gap-3 mb-6" }, /* @__PURE__ */ React.createElement(ShieldCheck, { className: "text-vibe-primary", size: 24 }), "Create Admin Account"), adminError && /* @__PURE__ */ React.createElement("div", { className: "text-red-400 text-xs font-bold mb-4 bg-red-500/10 p-3 rounded-xl" }, adminError), adminSuccess && /* @__PURE__ */ React.createElement("div", { className: "text-vibe-primary text-xs font-bold mb-4 bg-vibe-primary/10 p-3 rounded-xl" }, adminSuccess), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-4 gap-4 items-end" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-1" }, "Curator Name"), /* @__PURE__ */ React.createElement("input", { required: true, placeholder: "Admin Name", value: adminForm.name, onChange: (e) => setAdminForm({ ...adminForm, name: e.target.value }), className: "w-full panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold text-sm" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-1" }, "Admin Email"), /* @__PURE__ */ React.createElement("input", { required: true, type: "email", placeholder: "admin@terminal.sys", value: adminForm.email, onChange: (e) => setAdminForm({ ...adminForm, email: e.target.value }), className: "w-full panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold text-sm" })), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-1" }, "Security Key"), /* @__PURE__ */ React.createElement("input", { required: true, type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: adminForm.password, onChange: (e) => setAdminForm({ ...adminForm, password: e.target.value }), className: "w-full panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold text-sm" })), /* @__PURE__ */ React.createElement("button", { disabled: creatingAdmin, className: "btn-hdr-orange py-3 px-6 h-[46px] w-full flex items-center justify-center text-xs uppercase tracking-widest shadow-xl" }, creatingAdmin ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 18 }) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Plus, { size: 16, className: "mr-2" }), " Initialize")))), loading ? /* @__PURE__ */ React.createElement("div", { className: "py-20 flex justify-center" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-vibe-primary", size: 40 })) : /* @__PURE__ */ React.createElement(React.Fragment, null, currentTab === "admins" && currentUser?.role === "superadmin" && /* @__PURE__ */ React.createElement(UserTable, { data: adminUsers, title: "admins" }), currentTab === "users" && /* @__PURE__ */ React.createElement(UserTable, { data: regularUsers, title: "user" })));
};
const SongManagement = ({ songs, loadingSongs, savingSong, songError, form, setForm, addSong, removeSong, audioFile, setAudioFile, coverFile, setCoverFile, currentUser, loadSongs }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(40);
  const [loadingMore, setLoadingMore] = useState(false);
  const [uploadMode, setUploadMode] = useState("single");
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null);
  const [batchDone, setBatchDone] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const parseName = (filename) => {
    const base = filename.replace(/\.[^/.]+$/, "");
    if (base.includes(" - ")) {
      const [a, t] = base.split(" - ");
      return { artist: a.trim(), title: t.trim() };
    }
    if (base.includes(" -")) {
      const [a, t] = base.split(" -");
      return { artist: a.trim(), title: t.trim() };
    }
    if (base.includes("-")) {
      const [a, t] = base.split("-");
      return { artist: a.trim(), title: t.trim() };
    }
    return { artist: "", title: base };
  };
  const readFileMeta = (file) => new Promise((resolve) => {
    const { artist: fnArtist, title: fnTitle } = parseName(file.name);
    let meta = { title: fnTitle, artist: fnArtist, album: "Single", duration: "", coverBlob: null };
    const audioEl = new Audio();
    audioEl.src = URL.createObjectURL(file);
    audioEl.onloadedmetadata = () => {
      const m = Math.floor(audioEl.duration / 60);
      const s = Math.floor(audioEl.duration % 60).toString().padStart(2, "0");
      meta.duration = `${m}:${s}`;
      URL.revokeObjectURL(audioEl.src);
    };
    if (window.jsmediatags) {
      window.jsmediatags.read(file, {
        onSuccess: (tag) => {
          const { title, artist, album, picture } = tag.tags;
          if (title) meta.title = title;
          if (artist) meta.artist = artist;
          if (album) meta.album = album;
          if (picture) {
            const { data, format } = picture;
            let b64 = "";
            for (let i = 0; i < data.length; i++) b64 += String.fromCharCode(data[i]);
            fetch(`data:${format};base64,${window.btoa(b64)}`).then((r) => r.blob()).then((blob) => {
              meta.coverBlob = new File([blob], "cover.jpg", { type: format });
              resolve({ ...meta });
            });
          } else {
            resolve({ ...meta });
          }
        },
        onError: () => resolve({ ...meta })
      });
    } else {
      resolve({ ...meta });
    }
  });
  const handleBatchSelect = async (e) => {
    const files = Array.from(e.target.files);
    setBatchDone(false);
    setBatchProgress(null);
    const preliminary = files.map((file, idx) => {
      const { artist, title } = parseName(file.name);
      return { id: idx, file, title, artist, album: "Single", duration: "", coverBlob: null, status: "pending" };
    });
    setBatchFiles(preliminary);
    const enriched = await Promise.all(
      files.map(async (file, idx) => {
        const meta = await readFileMeta(file);
        return { id: idx, file, ...meta, status: "pending" };
      })
    );
    setBatchFiles(enriched);
  };
  const updateBatchItem = (id, field, value) => {
    setBatchFiles((prev) => prev.map((item) => item.id === id ? { ...item, [field]: value } : item));
  };
  const removeBatchItem = (id) => {
    setBatchFiles((prev) => prev.filter((item) => item.id !== id));
  };
  const handleBatchUpload = async () => {
    if (batchFiles.length === 0) return;
    const total = batchFiles.length;
    const statusArr = batchFiles.map(() => "pending");
    setBatchProgress({ current: 0, total, statuses: statusArr });
    setBatchDone(false);
    for (let i = 0; i < batchFiles.length; i++) {
      const item = batchFiles[i];
      try {
        const fd = new FormData();
        fd.append("title", item.title || item.file.name);
        fd.append("artist", item.artist || "Unknown");
        fd.append("album", item.album || "Single");
        fd.append("duration", item.duration || "");
        fd.append("audio", item.file);
        if (item.coverBlob) fd.append("cover", item.coverBlob);
        await api.post("/songs", fd, { headers: { "Content-Type": "multipart/form-data" } });
        statusArr[i] = "success";
      } catch (err) {
        statusArr[i] = err.response?.data?.message || "Failed";
      }
      setBatchProgress({ current: i + 1, total, statuses: [...statusArr] });
    }
    setBatchDone(true);
    if (loadSongs) await loadSongs();
    setTimeout(() => {
      setBatchFiles([]);
      setBatchProgress(null);
      setBatchDone(false);
    }, 3e3);
  };
  const toggleSelection = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const selectAllVisible = () => {
    const visibleIds = visibleSongs.map((s) => s._id || s.id);
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => [.../* @__PURE__ */ new Set([...prev, ...visibleIds])]);
    }
  };
  const handleBulkDelete = async () => {
    if (!window.confirm(`AUTHORIZED PROTOCOL: Confirm permanent termination of ${selectedIds.length} tracks?`)) return;
    setIsBulkDeleting(true);
    try {
      await api.delete("/songs/bulk", { data: { ids: selectedIds } });
      setSelectedIds([]);
      if (loadSongs) await loadSongs();
    } catch (err) {
      alert(err.response?.data?.message || "Bulk deletion failed.");
    } finally {
      setIsBulkDeleting(false);
    }
  };
  const handleBulkDownload = async () => {
    const selectedSongs = songs.filter((s) => selectedIds.includes(s._id || s.id));
    for (const song of selectedSongs) {
      try {
        const url = song.fileUrl?.startsWith("/uploads") ? `${API_BASE_URL}${song.fileUrl}` : song.fileUrl;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Network response was not ok");
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        const filename = `${song.title} - ${song.artist}`.replace(/[/\\?%*:|"<>]/g, "");
        link.download = filename.toLowerCase().endsWith(".mp3") ? filename : `${filename}.mp3`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        await new Promise((r) => setTimeout(r, 300));
      } catch (err) {
        console.error(`Download failed for song ${song.title}:`, err);
      }
    }
    setSelectedIds([]);
  };
  let filteredSongs = songs.filter(
    (s) => s.title?.toLowerCase().includes(searchTerm.toLowerCase()) || s.artist?.toLowerCase().includes(searchTerm.toLowerCase()) || s.album?.toLowerCase().includes(searchTerm.toLowerCase()) || (searchTerm === "||no-dupes||" ? false : s.duration === searchTerm)
  );
  const visibleSongs = filteredSongs.slice(0, visibleCount);
  return /* @__PURE__ */ React.createElement("div", { className: "space-y-8 animate-in fade-in slide-in-from-bottom duration-700" }, (currentUser?.role === "superadmin" || currentUser?.role === "admin") && /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 sm:p-8 space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col md:flex-row md:items-center gap-4 py-6 border-b border-white/5" }, /* @__PURE__ */ React.createElement("div", { className: "flex-1" }, /* @__PURE__ */ React.createElement("h3", { className: "text-xl font-bold text-hdr uppercase tracking-tighter flex items-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-6 bg-vibe-primary rounded-full" }), "Audio Repository"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 ml-4.5" }, "Manage and organize your synchronized tracks")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        const duplicates = songs.filter(
          (song, index, self) => self.findIndex((s) => s.duration === song.duration && s._id !== song._id) !== -1
        );
        setSearchTerm(duplicates.length > 0 ? duplicates[0].duration : "||no-dupes||");
        if (duplicates.length === 0) alert("No matching track timings found in repository.");
      },
      className: "flex items-center gap-2 px-5 py-2.5 rounded-xl border border-vibe-primary/20 bg-vibe-primary/5 text-vibe-primary hover:bg-vibe-primary hover:text-white transition-all font-black text-[10px] uppercase tracking-widest active:scale-95"
    },
    /* @__PURE__ */ React.createElement(Target, { size: 14 }),
    " Detect Duplicates"
  ), /* @__PURE__ */ React.createElement("div", { className: "w-px h-8 bg-white/5" }), /* @__PURE__ */ React.createElement("div", { className: "relative group min-w-[240px]" }, /* @__PURE__ */ React.createElement(Search, { className: "absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-vibe-primary transition-colors", size: 14 }), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Filter repository...",
      value: searchTerm === "||no-dupes||" ? "" : searchTerm,
      onChange: (e) => setSearchTerm(e.target.value),
      className: "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-vibe-primary/30 transition-all"
    }
  )))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-6 bg-vibe-primary rounded-full shadow-xl" }), /* @__PURE__ */ React.createElement("h3", { className: "text-lg md:text-xl font-bold text-hdr uppercase tracking-tighter flex-1" }, "Add New track"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center bg-white/5 rounded-xl p-1 border border-white/10" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setUploadMode("single"),
      className: `px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${uploadMode === "single" ? "bg-vibe-primary text-white shadow-lg" : "text-slate-400 hover:text-white"}`
    },
    "Single"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setUploadMode("batch"),
      className: `px-4 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${uploadMode === "batch" ? "bg-vibe-primary text-white shadow-lg" : "text-slate-400 hover:text-white"}`
    },
    "Batch"
  ))), uploadMode === "single" && /* @__PURE__ */ React.createElement("form", { onSubmit: addSong, className: "grid md:grid-cols-2 gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-1" }, "Metadata"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("input", { required: true, placeholder: "Title", value: form.title, onChange: (e) => setForm((f) => ({ ...f, title: e.target.value })), className: "panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" }), /* @__PURE__ */ React.createElement("input", { required: true, placeholder: "Artist", value: form.artist, onChange: (e) => setForm((f) => ({ ...f, artist: e.target.value })), className: "panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-1" }, "Album / Tempo"), /* @__PURE__ */ React.createElement("div", { className: "grid grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("input", { placeholder: "Album", value: form.album, onChange: (e) => setForm((f) => ({ ...f, album: e.target.value })), className: "panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" }), /* @__PURE__ */ React.createElement("input", { placeholder: "Duration (e.g. 3:45)", value: form.duration, onChange: (e) => setForm((f) => ({ ...f, duration: e.target.value })), className: "panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 md:col-span-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-1" }, "Audio Master"), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "relative group" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      accept: "audio/*",
      onChange: (e) => {
        const file = e.target.files[0];
        if (file) {
          setAudioFile(file);
          const audio = new Audio();
          audio.src = URL.createObjectURL(file);
          audio.onloadedmetadata = () => {
            const m = Math.floor(audio.duration / 60);
            const s = Math.floor(audio.duration % 60).toString().padStart(2, "0");
            setForm((f) => ({ ...f, duration: `${m}:${s}` }));
            URL.revokeObjectURL(audio.src);
          };
          const cleanName = file.name.replace(/\.[^/.]+$/, "");
          if (cleanName.includes(" - ")) {
            const [art, tit] = cleanName.split(" - ");
            setForm((f) => ({ ...f, artist: art.trim(), title: tit.trim() }));
          } else if (cleanName.includes("-")) {
            const [art, tit] = cleanName.split("-");
            setForm((f) => ({ ...f, artist: art.trim(), title: tit.trim() }));
          } else {
            setForm((f) => ({ ...f, title: cleanName }));
          }
          if (window.jsmediatags) {
            window.jsmediatags.read(file, {
              onSuccess: (tag) => {
                const { title, artist, album, picture } = tag.tags;
                setForm((f) => ({ ...f, title: title || f.title, artist: artist || f.artist, album: album || f.album }));
                if (picture) {
                  const { data, format } = picture;
                  let base64String = "";
                  for (let i = 0; i < data.length; i++) {
                    base64String += String.fromCharCode(data[i]);
                  }
                  const base64 = `data:${format};base64,${window.btoa(base64String)}`;
                  fetch(base64).then((res) => res.blob()).then((blob) => {
                    setCoverFile(new File([blob], "embedded-cover.jpg", { type: format }));
                  });
                }
              }
            });
          }
        }
      },
      className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: `panel-soft border border-dashed ${audioFile ? "border-vibe-primary bg-vibe-primary/5" : "border-white/20"} rounded-xl px-4 py-3 text-center transition-all group-hover:border-vibe-primary/60` }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-400 group-hover:text-vibe-primary" }, audioFile ? `\u2713 ${audioFile.name}` : "Local File Upload (+)"))), /* @__PURE__ */ React.createElement("input", { placeholder: "...or Global Audio Link", value: form.fileUrl, onChange: (e) => setForm((f) => ({ ...f, fileUrl: e.target.value })), className: "panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-3 md:col-span-2" }, /* @__PURE__ */ React.createElement("label", { className: "text-[10px] font-bold text-muted uppercase tracking-widest px-1" }, "Visual Cover"), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "relative group" }, /* @__PURE__ */ React.createElement("input", { type: "file", accept: "image/*", onChange: (e) => setCoverFile(e.target.files[0]), className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" }), /* @__PURE__ */ React.createElement("div", { className: `panel-soft border border-dashed ${coverFile ? "border-vibe-primary bg-vibe-primary/5" : "border-white/20"} rounded-xl px-4 py-3 text-center transition-all group-hover:border-vibe-primary/60` }, /* @__PURE__ */ React.createElement("span", { className: "text-sm font-bold text-slate-400 group-hover:text-vibe-primary" }, coverFile ? `\u2713 ${coverFile.name}` : "Local Image Upload (+)"))), /* @__PURE__ */ React.createElement("input", { placeholder: "...or Cover Image URL", value: form.coverImageUrl, onChange: (e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value })), className: "panel-soft border border-white/10 rounded-xl px-4 py-3 placeholder:text-slate-600 focus:ring-2 focus:ring-vibe-primary/40 outline-none transition-all font-bold" }))), /* @__PURE__ */ React.createElement("div", { className: "md:col-span-2 flex justify-center pt-2" }, /* @__PURE__ */ React.createElement("button", { disabled: savingSong, className: "btn-hdr-orange px-10 py-4 shadow-xl" }, savingSong ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 18 }) : /* @__PURE__ */ React.createElement(Plus, { size: 18, strokeWidth: 3 }), /* @__PURE__ */ React.createElement("span", { className: "font-black text-xs" }, "Sync To Library"))), songError && /* @__PURE__ */ React.createElement("p", { className: "text-red-400 text-xs font-bold md:col-span-2 animate-pulse" }, songError)), uploadMode === "batch" && /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "relative group" }, /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "file",
      accept: "audio/*",
      multiple: true,
      onChange: handleBatchSelect,
      className: "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
    }
  ), /* @__PURE__ */ React.createElement("div", { className: "border-2 border-dashed border-vibe-primary/30 hover:border-vibe-primary/70 bg-vibe-primary/5 rounded-2xl py-12 text-center transition-all group-hover:bg-vibe-primary/10" }, /* @__PURE__ */ React.createElement("div", { className: "text-4xl mb-3" }, "\u{1F3B5}"), /* @__PURE__ */ React.createElement("p", { className: "text-vibe-primary font-black text-sm uppercase tracking-widest" }, "Drop Multiple Songs Here"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-500 text-xs mt-1" }, "Click to select \u2014 All audio formats supported"))), batchFiles.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "space-y-3 max-h-[420px] overflow-y-auto pr-1" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-vibe-primary uppercase tracking-widest" }, batchFiles.length, " Songs Queued"), !batchProgress && /* @__PURE__ */ React.createElement("button", { onClick: () => setBatchFiles([]), className: "text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-widest" }, "Clear All")), batchFiles.map((item) => {
    const st = batchProgress?.statuses?.[item.id];
    return /* @__PURE__ */ React.createElement("div", { key: item.id, className: `panel-soft border rounded-xl p-3 flex items-center gap-3 transition-all ${st === "success" ? "border-emerald-500/30 bg-emerald-500/5" : st && st !== "pending" ? "border-red-500/30 bg-red-500/5" : "border-white/10"}` }, /* @__PURE__ */ React.createElement("div", { className: "w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg bg-white/5" }, !st || st === "pending" ? /* @__PURE__ */ React.createElement(Music, { size: 13, className: "text-vibe-primary" }) : st === "success" ? /* @__PURE__ */ React.createElement(CheckCircle, { size: 13, className: "text-emerald-400" }) : /* @__PURE__ */ React.createElement("span", { className: "text-red-400 text-[10px]" }, "\u2717")), /* @__PURE__ */ React.createElement("div", { className: "flex-1 grid grid-cols-3 gap-2 min-w-0" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value: item.title,
        onChange: (e) => updateBatchItem(item.id, "title", e.target.value),
        disabled: !!batchProgress,
        placeholder: "Title",
        className: "bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-vibe-primary/50 disabled:opacity-50"
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: item.artist,
        onChange: (e) => updateBatchItem(item.id, "artist", e.target.value),
        disabled: !!batchProgress,
        placeholder: "Artist",
        className: "bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-vibe-primary/50 disabled:opacity-50"
      }
    ), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: item.album,
        onChange: (e) => updateBatchItem(item.id, "album", e.target.value),
        disabled: !!batchProgress,
        placeholder: "Album",
        className: "bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-vibe-primary/50 disabled:opacity-50"
      }
    )), st && st !== "pending" && st !== "success" && /* @__PURE__ */ React.createElement("span", { className: "text-[8px] text-red-400 font-bold max-w-[80px] truncate", title: st }, st), !batchProgress && /* @__PURE__ */ React.createElement("button", { onClick: () => removeBatchItem(item.id), className: "w-6 h-6 flex items-center justify-center text-red-500 hover:text-red-300 flex-shrink-0" }, /* @__PURE__ */ React.createElement(Trash2, { size: 12 })));
  })), batchProgress && /* @__PURE__ */ React.createElement("div", { className: "space-y-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex justify-between text-[10px] font-bold text-muted" }, /* @__PURE__ */ React.createElement("span", { className: "uppercase tracking-widest" }, "Uploading..."), /* @__PURE__ */ React.createElement("span", { className: "text-vibe-primary" }, batchProgress.current, " / ", batchProgress.total)), /* @__PURE__ */ React.createElement("div", { className: "w-full h-2 bg-white/10 rounded-full overflow-hidden" }, /* @__PURE__ */ React.createElement(
    "div",
    {
      className: "h-full bg-vibe-primary rounded-full transition-all duration-500",
      style: { width: `${batchProgress.current / batchProgress.total * 100}%` }
    }
  ))), batchDone && batchProgress && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl" }, /* @__PURE__ */ React.createElement(CheckCircle, { size: 20, className: "text-emerald-400 flex-shrink-0" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-emerald-400 font-black text-sm" }, "Batch Upload Complete!"), /* @__PURE__ */ React.createElement("p", { className: "text-slate-400 text-[11px]" }, batchProgress.statuses.filter((s) => s === "success").length, " succeeded \xB7", " ", batchProgress.statuses.filter((s) => s !== "success" && s !== "pending").length, " failed")), /* @__PURE__ */ React.createElement("button", { onClick: () => {
    setBatchFiles([]);
    setBatchProgress(null);
    setBatchDone(false);
  }, className: "ml-auto text-[10px] text-vibe-primary font-black uppercase tracking-widest hover:underline" }, "Reset")), batchFiles.length > 0 && !batchDone && /* @__PURE__ */ React.createElement("div", { className: "flex justify-center" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleBatchUpload,
      disabled: !!batchProgress,
      className: "flex items-center gap-3 btn-hdr-orange px-10 py-4 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
    },
    batchProgress ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 18 }) : /* @__PURE__ */ React.createElement(Zap, { size: 18, strokeWidth: 3 }),
    /* @__PURE__ */ React.createElement("span", { className: "font-black text-xs" }, "Upload ", batchFiles.length, " Songs")
  )))), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-3 sm:p-10" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center justify-between mb-12 flex-wrap gap-6" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 flex-wrap" }, /* @__PURE__ */ React.createElement("h3", { className: "text-3xl font-bold text-hdr tracking-tight uppercase" }, "System Library"), /* @__PURE__ */ React.createElement("span", { className: "text-sm bg-vibe-primary/10 text-vibe-primary px-4 py-1.5 rounded-xl font-bold" }, filteredSongs.length, " Tracks"), (() => {
    const parseDur = (d) => {
      if (!d) return 0;
      if (typeof d === "number") return d;
      const parts = String(d).split(":").map(Number);
      if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
      if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
      return parseFloat(d) || 0;
    };
    const totalBytes = songs.reduce((acc, s) => {
      if (s.fileSize > 0) return acc + s.fileSize;
      return acc + parseDur(s.duration) * (128 * 1e3 / 8);
    }, 0);
    const trackedCount = songs.filter((s) => s.fileSize > 0).length;
    const totalGB = totalBytes / 1024 ** 3;
    const totalMB = totalBytes / 1024 ** 2;
    const display = totalGB >= 1 ? `${totalGB.toFixed(2)} GB` : totalMB >= 1 ? `${totalMB.toFixed(1)} MB` : `${(totalBytes / 1024).toFixed(0)} KB`;
    const tooltipText = trackedCount === songs.length ? `Exact size for all ${songs.length} tracks` : `${trackedCount} exact \xB7 ${songs.length - trackedCount} estimated @128kbps`;
    return /* @__PURE__ */ React.createElement("span", { className: "text-sm bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5", title: tooltipText }, /* @__PURE__ */ React.createElement("span", { className: "text-[9px] opacity-60 uppercase tracking-widest" }, "Storage Use"), " ", display);
  })()), /* @__PURE__ */ React.createElement("div", { className: "relative group w-full md:w-80" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2 mb-3 ml-2" }, /* @__PURE__ */ React.createElement(Search, { className: "text-vibe-primary", size: 14 }), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-vibe-primary uppercase tracking-[0.3em]" }, "Search Library")), /* @__PURE__ */ React.createElement(
    "input",
    {
      type: "text",
      placeholder: "Search...",
      value: searchTerm,
      onChange: (e) => handleSearch(e.target.value),
      className: "w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm text-hdr focus:outline-none focus:ring-2 focus:ring-vibe-primary/40 font-bold tracking-tight shadow-inner hover:bg-white/10 transition-all"
    }
  ))), loadingSongs ? /* @__PURE__ */ React.createElement("div", { className: "py-20 flex justify-center" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-vibe-primary", size: 40 })) : filteredSongs.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 bg-white/5 rounded-full flex items-center justify-center opacity-20" }, /* @__PURE__ */ React.createElement(Search, { size: 32 })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("p", { className: "text-muted font-bold uppercase tracking-widest opacity-50" }, "No matching tracks found"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-600 uppercase tracking-widest mt-2" }, "The system is currently synchronized."))) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-6 ml-2" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: selectAllVisible,
      className: "text-[10px] font-black text-vibe-primary uppercase tracking-widest border border-vibe-primary/20 px-4 py-2 rounded-xl bg-vibe-primary/5 hover:bg-vibe-primary hover:text-white transition-all transition-all active:scale-95"
    },
    visibleSongs.every((s) => selectedIds.includes(s._id || s.id)) ? "Deselect All" : "Select All Visible"
  )), /* @__PURE__ */ React.createElement("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-6" }, visibleSongs.map((song) => {
    const songId = song._id || song.id;
    const isSelected = selectedIds.includes(songId);
    const fullCoverUrl = song.coverImageUrl?.startsWith("/uploads") ? `${API_BASE_URL}${song.coverImageUrl}` : song.coverImageUrl || "https://via.placeholder.com/300";
    return /* @__PURE__ */ React.createElement("div", { key: songId, className: `panel-soft border ${isSelected ? "border-vibe-primary bg-vibe-primary/5" : "border-white/5"} rounded-2xl p-2 sm:p-4 grid grid-cols-[30px_48px_1fr_40px] items-center gap-2 sm:gap-4 group hover:border-vibe-primary/40 transition-all shadow-md overflow-hidden w-full relative` }, /* @__PURE__ */ React.createElement(
      "div",
      {
        onClick: () => toggleSelection(songId),
        className: `w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-all ${isSelected ? "bg-vibe-primary border-vibe-primary shadow-[0_0_10px_rgba(0,229,255,0.4)]" : "bg-white/5 border-white/20 hover:border-vibe-primary/60"}`
      },
      isSelected && /* @__PURE__ */ React.createElement(CheckCircle, { size: 12, className: "text-white" })
    ), /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 sm:w-14 sm:h-14 bg-vibe-950 rounded-xl flex-shrink-0 bg-cover bg-center shadow-lg border border-white/5", style: { backgroundImage: `url(${fullCoverUrl})` } }), /* @__PURE__ */ React.createElement("div", { className: "min-w-0 flex flex-col justify-center" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-hdr text-xs sm:text-[15px] truncate tracking-tight" }, song.title), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] sm:text-[10px] font-bold text-muted uppercase tracking-[0.2em] opacity-40 truncate" }, song.artist)), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => removeSong(songId),
        className: "w-10 h-10 flex items-center justify-center bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 border border-red-500/10 group-hover:bg-red-500 group-hover:text-white",
        title: "Remove Track"
      },
      /* @__PURE__ */ React.createElement(Trash2, { size: 14 })
    ));
  }))), selectedIds.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom flex items-center gap-4 bg-vibe-950/90 backdrop-blur-2xl border border-vibe-primary/30 px-6 py-4 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-b-vibe-primary" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 pr-4 border-r border-white/10 text-white" }, /* @__PURE__ */ React.createElement("span", { className: "text-lg font-black italic" }, selectedIds.length), /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black uppercase tracking-widest text-slate-400" }, "Tracks Targeted")), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, (currentUser?.role === "superadmin" || currentUser?.email === "user@vibecom") && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleBulkDownload,
      className: "flex items-center gap-2 px-6 py-2.5 bg-white/5 text-white hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all active:scale-95 group"
    },
    /* @__PURE__ */ React.createElement(Download, { size: 14, className: "group-hover:translate-y-0.5 transition-transform" }),
    " Download"
  ), (currentUser?.role === "admin" || currentUser?.role === "superadmin") && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleBulkDelete,
      disabled: isBulkDeleting,
      className: "flex items-center gap-2 px-6 py-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-500/10 transition-all active:scale-95 disabled:opacity-50"
    },
    isBulkDeleting ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin", size: 14 }) : /* @__PURE__ */ React.createElement(Trash2, { size: 14 }),
    " Terminal Wipe"
  ), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setSelectedIds([]),
      className: "p-2.5 text-slate-500 hover:text-white transition-all"
    },
    /* @__PURE__ */ React.createElement(X, { size: 20 })
  ))), filteredSongs.length > visibleCount && /* @__PURE__ */ React.createElement("div", { className: "flex flex-col items-center justify-center mt-12 gap-4" }, loadingMore ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-vibe-primary", size: 40, strokeWidth: 2 }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-vibe-primary uppercase tracking-[0.4em] animate-pulse text-center" }, "Expanding Library Cluster...")) : /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        setLoadingMore(true);
        setTimeout(() => {
          setVisibleCount((v) => v + 40);
          setLoadingMore(false);
        }, 3e3);
      },
      className: "flex items-center gap-2 px-10 py-4 rounded-full border border-vibe-primary/30 bg-vibe-primary/5 text-vibe-primary hover:bg-vibe-primary hover:text-white transition-all font-black text-[11px] uppercase tracking-[0.2em] active:scale-95 shadow-2xl"
    },
    /* @__PURE__ */ React.createElement(Plus, { size: 16 }),
    " Load Next 40 Tracks (",
    filteredSongs.length - visibleCount,
    " remaining)"
  )), filteredSongs.length > 40 && visibleCount >= filteredSongs.length && /* @__PURE__ */ React.createElement("div", { className: "flex justify-center mt-10" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em] bg-white/5 px-4 py-2 rounded-full border border-white/5" }, "All ", filteredSongs.length, " tracks synchronized \u2713"))));
};
const AdminDashboard = () => {
  const navigate = useNavigate();
  const { activeAdminTab: activeTab, setActiveAdminTab: setActiveTab } = useSidebar();
  const { user, logout, historyTracks, updateUserProfile, loading: authLoading } = useAuth();
  const [visitorCount, setVisitorCount] = useState(0);
  const fetchVisitorCount = async () => {
    try {
      const { data } = await api.get("/counter/visitor");
      setVisitorCount(data.count);
    } catch (err) {
      console.error("Failed to fetch visitor count:", err);
    }
  };
  useEffect(() => {
    fetchVisitorCount();
  }, []);
  const location = useLocation();
  const [songs, setSongs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [savingSong, setSavingSong] = useState(false);
  const [songError, setSongError] = useState("");
  const [form, setForm] = useState({
    title: "",
    artist: "",
    album: "",
    duration: "",
    fileUrl: "",
    coverImageUrl: ""
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const profileInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const handleProfileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append(type, file);
    try {
      await updateUserProfile(formData);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };
  const [visibleSongsCount, setVisibleSongsCount] = useState(40);
  const [loadingMoreActivity, setLoadingMoreActivity] = useState(false);
  const activitySentinelRef = useRef(null);
  useEffect(() => {
    if (activeTab !== "activity") return;
    const el = activitySentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMoreActivity && songs.length > visibleSongsCount) {
          setLoadingMoreActivity(true);
          setTimeout(() => {
            setVisibleSongsCount((prev) => prev + 40);
            setLoadingMoreActivity(false);
          }, 3e3);
        }
      },
      { threshold: 1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [songs, visibleSongsCount, loadingMoreActivity, activeTab]);
  const handleProfileRemove = async (type) => {
    if (!window.confirm(`Clear your ${type === "profileImg" ? "Identity Icon" : "Network Banner"}?`)) return;
    setUploading(true);
    const formData = new FormData();
    if (type === "profileImg") formData.append("removeProfileImg", "true");
    else formData.append("removeBannerImg", "true");
    try {
      await updateUserProfile(formData);
    } catch (err) {
      console.error("Removal failed", err);
    } finally {
      setUploading(false);
    }
  };
  const convertToSeconds = (timeStr) => {
    if (!timeStr) return 0;
    if (typeof timeStr === "number") return timeStr;
    if (!timeStr.includes(":")) return parseInt(timeStr) || 0;
    const [mins, secs] = timeStr.split(":").map(Number);
    return mins * 60 + (secs || 0);
  };
  const loadSongs = async () => {
    setLoadingSongs(true);
    try {
      const { data } = await api.get("/songs");
      setSongs(Array.isArray(data) ? data : []);
      setTimeout(() => setLoadingSongs(false), 3e3);
    } catch {
      setSongs([]);
      setLoadingSongs(false);
    }
  };
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await api.get("/auth/users");
      setUsers(Array.isArray(data) ? data : []);
      setTimeout(() => setLoadingUsers(false), 3e3);
    } catch {
      setUsers([]);
      setLoadingUsers(false);
    }
  };
  const handleClearActivity = async () => {
    if (!window.confirm("CRITICAL PROTOCOL: Clear all admin upload activity? This will permanently delete all songs from the library.")) return;
    if (window.prompt("Type 'CONFIRM' to execute library wipe:") !== "CONFIRM") return;
    try {
      await api.delete("/songs/clear-all");
      alert("Activity logs cleared and library wiped.");
      loadSongs();
    } catch (err) {
      alert(err.response?.data?.message || "Operation failed.");
    }
  };
  const searchParams = new URLSearchParams(location.search);
  const urlTab = searchParams.get("tab");
  useEffect(() => {
    loadSongs();
    loadUsers();
  }, []);
  useEffect(() => {
    if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, setActiveTab]);
  const addSong = async (e) => {
    e.preventDefault();
    setSongError("");
    setSavingSong(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("artist", form.artist);
      formData.append("album", form.album);
      formData.append("duration", convertToSeconds(form.duration));
      if (audioFile) formData.append("audio", audioFile);
      else formData.append("fileUrl", form.fileUrl);
      if (coverFile) formData.append("cover", coverFile);
      else formData.append("coverImageUrl", form.coverImageUrl);
      await api.post("/songs", formData);
      setForm({ title: "", artist: "", album: "", duration: "", fileUrl: "", coverImageUrl: "" });
      setAudioFile(null);
      setCoverFile(null);
      await loadSongs();
    } catch (err) {
      setSongError(err.response?.data?.message || "Unable to add song.");
    } finally {
      setSavingSong(false);
    }
  };
  const removeSong = async (id) => {
    if (window.confirm("Remove this song from the library?")) {
      try {
        await api.delete(`/songs/${id}`);
        setSongs((prev) => prev.filter((song) => (song._id || song.id) !== id));
      } catch (err) {
        alert(err.response?.data?.message || "Unable to delete song.");
      }
    }
  };
  const removeUser = async (id) => {
    const targetUser = users.find((u) => u._id === id);
    if (user?.role !== "superadmin" && user?.email !== "user@vibecom") {
      alert("Terminal Authorization Denied: Only the Super Admin can execute account termination.");
      return;
    }
    if (window.confirm(`Are you sure you want to permanently terminate this account (${targetUser?.email})?`)) {
      try {
        await api.delete(`/auth/users/${id}`);
        setUsers((prev) => prev.filter((user2) => user2._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || "Failed to remove user");
      }
    }
  };
  const approveDeletion = async (id) => {
    if (user?.role !== "superadmin" && user?.email !== "user@vibecom") {
      alert("Authorization Required: Super Admin clearance needed.");
      return;
    }
    if (window.confirm("Approve account deletion? This will permanently remove the user.")) {
      try {
        await api.post(`/auth/approve-deletion/${id}`);
        setUsers((prev) => prev.filter((u) => u._id !== id));
      } catch (err) {
        alert(err.response?.data?.message || "Failed to approve deletion");
      }
    }
  };
  const getGreeting = () => {
    const hours = (/* @__PURE__ */ new Date()).getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 17) return "Good Afternoon";
    return "Good Evening";
  };
  const greeting = getGreeting();
  return /* @__PURE__ */ React.createElement(MainLayout, null, /* @__PURE__ */ React.createElement("div", { className: "animate-in fade-in duration-700" }, activeTab === "analytics" && /* @__PURE__ */ React.createElement("header", { className: "relative h-auto min-h-[220px] md:h-[220px] bg-gradient-to-br from-vibe-950 via-vibe-900 to-black overflow-hidden border border-white/5 rounded-3xl md:rounded-[40px] mb-10 shadow-2xl group/banner transition-all hover:border-vibe-primary/20" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05] pointer-events-none" }), /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 right-0 w-[400px] h-[400px] bg-vibe-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 animate-pulse" }), /* @__PURE__ */ React.createElement("div", { className: "relative md:absolute md:inset-0 p-6 md:p-8 md:px-12 flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 md:gap-12 py-10 md:py-0" }, /* @__PURE__ */ React.createElement("div", { className: "relative group/avatar flex-shrink-0" }, /* @__PURE__ */ React.createElement("div", { className: "w-24 h-24 md:w-32 md:h-32 rounded-full bg-vibe-950 border-4 border-white/5 shadow-2xl relative overflow-hidden group-hover:border-vibe-primary/40 transition-all duration-700 p-1" }, /* @__PURE__ */ React.createElement("div", { className: "w-full h-full rounded-full bg-vibe-primary flex items-center justify-center text-white text-4xl md:text-5xl font-black uppercase shadow-inner relative not-italic" }, user?.profileImg ? /* @__PURE__ */ React.createElement(
    "img",
    {
      src: resolveUrl(user.profileImg),
      className: "w-full h-full object-cover",
      alt: "Admin Profile"
    }
  ) : user?.name?.[0] || user?.firstName?.[0] || "A"))), /* @__PURE__ */ React.createElement("div", { className: "flex-1 space-y-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-center md:text-left" }, /* @__PURE__ */ React.createElement("h1", { className: "text-xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight flex flex-col items-center md:items-start p-2" }, /* @__PURE__ */ React.createElement("span", { className: "block opacity-90" }, greeting, ", ", /* @__PURE__ */ React.createElement("span", { className: "text-vibe-primary block md:inline" }, authLoading ? /* @__PURE__ */ React.createElement(Loader2, { className: "inline animate-spin text-vibe-primary", size: 24 }) : user?.name || user?.firstName || "Admin"))))))), /* @__PURE__ */ React.createElement("div", { className: "z-10 mt-6 sm:mt-0" }, ["users", "admins", "songs"].includes(activeTab) && /* @__PURE__ */ React.createElement("div", { className: "mt-8 flex flex-wrap items-center justify-between gap-6 py-4 px-2 border-b border-white/5 pb-10 relative" }, ["users", "admins"].includes(activeTab) && /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "relative group" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowNotifications(!showNotifications),
      className: `p-2.5 rounded-[18px] transition-all duration-500 border ${users.filter((u) => u.deletionRequested).length > 0 ? "bg-red-500/10 border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse" : "bg-white/5 border-white/5 text-slate-500 opacity-40 hover:opacity-100 hover:text-white"}`
    },
    /* @__PURE__ */ React.createElement(Bell, { size: 18, strokeWidth: 2.5 }),
    users.filter((u) => u.deletionRequested).length > 0 && /* @__PURE__ */ React.createElement("span", { className: "absolute -top-0.5 -right-0.5 flex h-4 w-4" }, /* @__PURE__ */ React.createElement("span", { className: "animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" }), /* @__PURE__ */ React.createElement("span", { className: "relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] font-black text-white shadow-lg" }, users.filter((u) => u.deletionRequested).length))
  ), showNotifications && /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: "fixed inset-0 z-[60] bg-black/80 backdrop-blur-md transition-all duration-500", onClick: () => setShowNotifications(false) }), /* @__PURE__ */ React.createElement("div", { className: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-32px)] sm:w-[500px] z-[70] animate-in zoom-in-95 fade-in duration-500" }, /* @__PURE__ */ React.createElement("div", { className: "bg-[#0C0C0E]/95 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,1)] backdrop-blur-3xl rounded-[40px] overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "p-10 border-b border-white/5 bg-gradient-to-b from-red-500/10 to-transparent flex flex-col items-center text-center relative" }, /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setShowNotifications(false),
      className: "absolute top-6 right-6 w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-muted hover:text-white transition-all group/close"
    },
    /* @__PURE__ */ React.createElement(Plus, { className: "rotate-45 group-hover:scale-110 transition-transform", size: 24 })
  ), /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 bg-red-500/20 rounded-[22px] flex items-center justify-center text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] mb-6 animate-pulse" }, /* @__PURE__ */ React.createElement(Trash2, { size: 32 })), /* @__PURE__ */ React.createElement("h4", { className: "text-2xl font-black text-white uppercase tracking-tighter mb-1" }, "Deletion Requests"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-red-500/60 uppercase tracking-[0.4em]" }, "System Deletion Sequences")), /* @__PURE__ */ React.createElement("div", { className: "p-4 sm:p-8" }, users.filter((u) => u.deletionRequested).length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-12 flex flex-col items-center justify-center text-center" }, /* @__PURE__ */ React.createElement("div", { className: "w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 opacity-20" }, /* @__PURE__ */ React.createElement(ShieldCheck, { size: 32 })), /* @__PURE__ */ React.createElement("p", { className: "text-xs font-black text-slate-500 uppercase tracking-[0.2em] italic" }, "All system status synchronized.")) : /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, users.filter((u) => u.deletionRequested).map((reqUser) => /* @__PURE__ */ React.createElement("div", { key: reqUser._id, className: "group/req relative bg-white/[0.03] hover:bg-white/[0.05] rounded-[32px] p-6 sm:p-8 border border-white/5 hover:border-red-500/30 transition-all duration-500 flex flex-col items-center text-center" }, /* @__PURE__ */ React.createElement("div", { className: "space-y-1 mb-6 mt-4" }, /* @__PURE__ */ React.createElement("h5", { className: "text-lg font-black text-white uppercase italic tracking-tight" }, reqUser.firstName ? `${reqUser.firstName} ${reqUser.lastName}` : reqUser.name || "Unknown Identity"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-bold text-muted opacity-40 uppercase tracking-widest" }, reqUser.email)), /* @__PURE__ */ React.createElement("div", { className: "bg-red-500/5 rounded-[20px] p-5 border border-red-500/10 mb-6 w-full relative overflow-hidden group-hover/req:bg-red-500/10 transition-colors" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-red-500/20 rounded-full" }), /* @__PURE__ */ React.createElement("p", { className: "text-[8px] font-black text-red-500/60 uppercase tracking-[0.3em] mb-2" }, "Security Justification"), /* @__PURE__ */ React.createElement("p", { className: "text-[12px] font-medium text-slate-300 leading-relaxed italic px-2 font-mono" }, `"${reqUser.deletionReason || "No terminal justification provided."}"`)), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => {
        approveDeletion(reqUser._id);
        setShowNotifications(false);
      },
      className: "w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(239,68,68,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
    },
    /* @__PURE__ */ React.createElement(CheckCircle, { size: 16, className: "group-hover/btn:scale-125 transition-transform" }),
    "Authorize Revocation"
  ))))), users.filter((u) => u.deletionRequested).length > 0 && /* @__PURE__ */ React.createElement("div", { className: "p-6 bg-red-500/5 border-t border-white/5 flex items-center justify-center gap-3" }, /* @__PURE__ */ React.createElement("div", { className: "relative" }, /* @__PURE__ */ React.createElement("div", { className: "w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute inset-0" }), /* @__PURE__ */ React.createElement("div", { className: "w-2.5 h-2.5 rounded-full bg-red-500 relative" })), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] font-black text-red-100 uppercase tracking-[0.15em] italic" }, "Critical Operation: Level 7 Authorization Required"))))))), activeTab === "songs" && /* @__PURE__ */ React.createElement("div", { className: "space-y-1" }, /* @__PURE__ */ React.createElement("p", { className: "text-slate-600 text-[10px] font-black uppercase tracking-widest" }, "Sync Library"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3" }, /* @__PURE__ */ React.createElement("p", { className: "text-4xl font-black text-white italic" }, songs.length), /* @__PURE__ */ React.createElement("div", { className: "px-2 py-1 bg-white/5 rounded text-[9px] font-black text-slate-400 uppercase tracking-widest" }, "Tracks"))))), /* @__PURE__ */ React.createElement("div", { className: "z-10" }, ["users", "admins"].includes(activeTab) && /* @__PURE__ */ React.createElement("div", { className: "flex flex-row md:flex-row gap-4 mb-6 animate-in slide-in-from-top-4 duration-500" }, /* @__PURE__ */ React.createElement("div", { className: "glass-card bg-white/[0.02] border border-white/5 rounded-[32px] p-6 flex-1 flex flex-col justify-center shadow-xl relative overflow-hidden hover:border-vibe-primary/20 transition-all group" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 right-0 w-24 h-24 bg-vibe-primary/5 rounded-full blur-2xl -mr-12 -mt-12" }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] items-center gap-2 font-black text-vibe-primary uppercase tracking-[0.3em] mb-2 opacity-50 flex overflow-hidden whitespace-nowrap" }, /* @__PURE__ */ React.createElement(Users, { size: 12 }), " Users"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-4xl font-black text-white tracking-tighter italic" }, users.filter((u) => u.role === "user" || !u.role).length), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 bg-vibe-primary/10 text-vibe-primary text-[8px] font-black rounded uppercase tracking-widest border border-vibe-primary/20" }, "Active"))), /* @__PURE__ */ React.createElement("div", { className: "glass-card bg-white/[0.02] border border-white/5 rounded-[32px] p-6 flex-1 flex flex-col justify-center shadow-xl relative overflow-hidden hover:border-vibe-accent/20 transition-all group" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 right-0 w-24 h-24 bg-vibe-accent/5 rounded-full blur-2xl -mr-12 -mt-12" }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] items-center gap-2 font-black text-vibe-accent uppercase tracking-[0.3em] mb-2 opacity-50 flex overflow-hidden whitespace-nowrap" }, /* @__PURE__ */ React.createElement(ShieldCheck, { size: 12 }), " Admin"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-2" }, /* @__PURE__ */ React.createElement("span", { className: "text-4xl font-black text-white tracking-tighter italic" }, users.filter((u) => u.role === "admin" || u.role === "superadmin").length), /* @__PURE__ */ React.createElement("span", { className: "px-2 py-0.5 bg-vibe-accent/10 text-vibe-accent text-[8px] font-black rounded uppercase tracking-widest border border-vibe-accent/20" }, "Verified")))), ["users", "admins"].includes(activeTab) ? /* @__PURE__ */ React.createElement(
    UserManagement,
    {
      users,
      loading: loadingUsers,
      removeUser,
      approveDeletion,
      loadUsers,
      currentUser: { ...user, role: user?.email === "user@vibecom" ? "superadmin" : user?.role }
    }
  ) : activeTab === "analytics" ? /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 sm:p-10 animate-in fade-in slide-in-from-bottom duration-700" }, /* @__PURE__ */ React.createElement("div", { className: "grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12" }, /* @__PURE__ */ React.createElement("div", { className: "panel-soft p-8 relative overflow-hidden group border border-vibe-primary/20" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 right-0 w-24 h-24 bg-vibe-primary/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-vibe-primary uppercase tracking-[0.4em] mb-4" }, "Visitor Signals"), /* @__PURE__ */ React.createElement("div", { className: "flex items-end gap-3" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-black text-white tracking-tighter" }, visitorCount.toLocaleString()), /* @__PURE__ */ React.createElement("div", { className: "mb-1.5 px-2 py-0.5 bg-vibe-primary/10 text-vibe-primary text-[8px] font-black rounded border border-vibe-primary/20 animate-pulse" }, "LIVE"))), /* @__PURE__ */ React.createElement("div", { className: "panel-soft p-8 relative overflow-hidden group border border-vibe-accent/20" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 right-0 w-24 h-24 bg-vibe-accent/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-vibe-accent uppercase tracking-[0.4em] mb-4" }, "Users Listened"), /* @__PURE__ */ React.createElement("div", { className: "flex items-end gap-3" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-black text-white tracking-tighter" }, users.length), /* @__PURE__ */ React.createElement("div", { className: "mb-1.5 px-2 py-0.5 bg-vibe-accent/10 text-vibe-accent text-[8px] font-black rounded border border-vibe-accent/20" }, "SYNCED"))), /* @__PURE__ */ React.createElement("div", { className: "panel-soft p-8 relative overflow-hidden group border border-white/10" }, /* @__PURE__ */ React.createElement("div", { className: "absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-1000" }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4" }, "Media Objects"), /* @__PURE__ */ React.createElement("div", { className: "flex items-end gap-3" }, /* @__PURE__ */ React.createElement("h2", { className: "text-4xl font-black text-white tracking-tighter" }, songs.length), /* @__PURE__ */ React.createElement("div", { className: "mb-1.5 px-2 py-0.5 bg-white/10 text-slate-400 text-[8px] font-black rounded border border-white/20" }, "CLOUDINARY")))), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 mb-10 pl-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-10 bg-vibe-primary rounded-full shadow-xl" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-3xl font-bold tracking-tight text-hdr uppercase flex items-center gap-4" }, "Global Consumption Metrics"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mt-2 italic" }, "Real-time synchronization depth and playback volume across system members."))), /* @__PURE__ */ React.createElement("div", { className: "grid lg:grid-cols-[1fr_350px] gap-10" }, /* @__PURE__ */ React.createElement("div", { className: "bg-vibe-950/40 rounded-[32px] border border-white/5 p-5 sm:p-10 relative overflow-hidden group/graph" }, /* @__PURE__ */ React.createElement("div", { className: "absolute inset-0 grid grid-cols-8 pointer-events-none opacity-[0.03]" }, [...Array(8)].map((_, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "border-r border-vibe-primary" }))), /* @__PURE__ */ React.createElement("div", { className: "relative space-y-10" }, songs.length === 0 ? /* @__PURE__ */ React.createElement("div", { className: "py-20 text-center opacity-40 uppercase font-black tracking-widest text-xs italic" }, "Awaiting synchronization data...") : [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0)).slice(0, 10).map((song, i) => {
    const maxPlays = Math.max(...songs.map((s) => s.playCount || 0), 1);
    const percentage = (song.playCount || 0) / maxPlays * 100;
    return /* @__PURE__ */ React.createElement("div", { key: song._id, className: "group/bar relative" }, /* @__PURE__ */ React.createElement("div", { className: "flex flex-col sm:flex-row sm:items-end justify-between mb-3 px-1 gap-2" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "text-[9px] sm:text-[10px] font-black text-vibe-primary bg-vibe-primary/10 w-6 h-6 rounded flex-shrink-0 flex items-center justify-center italic" }, "#", i + 1), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] sm:text-[11px] font-black text-white uppercase italic tracking-widest truncate max-w-full" }, song.title)), /* @__PURE__ */ React.createElement("p", { className: "text-[8px] sm:text-[9px] font-black text-muted uppercase tracking-widest whitespace-nowrap" }, /* @__PURE__ */ React.createElement("span", { className: "text-vibe-primary" }, song.playCount || 0), " Global Syncs")), /* @__PURE__ */ React.createElement("div", { className: "h-4 sm:h-5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px] sm:p-[3px]" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "h-full bg-gradient-to-r from-vibe-primary via-vibe-accent to-vibe-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,229,255,0.4)] group-hover/graph:opacity-80",
        style: { width: `${Math.max(percentage, 3)}%` }
      }
    )));
  }))), /* @__PURE__ */ React.createElement("div", { className: "space-y-6" }, /* @__PURE__ */ React.createElement("div", { className: "glass-card p-6 sm:p-10 border-vibe-primary/20 bg-vibe-primary/5 hover:bg-vibe-primary/10 transition-colors group/stat" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-vibe-primary uppercase tracking-[0.3em] mb-4" }, "Total Playback Cluster"), /* @__PURE__ */ React.createElement("h4", { className: "text-6xl font-black text-white italic drop-shadow-[0_0_20px_rgba(0,229,255,0.3)]" }, songs.reduce((acc, curr) => acc + (curr.playCount || 0), 0)), /* @__PURE__ */ React.createElement("div", { className: "mt-4 w-12 h-[1px] bg-vibe-primary group-hover:w-full transition-all duration-700 opacity-40" })), /* @__PURE__ */ React.createElement("div", { className: "glass-card p-6 sm:p-10 border-white/10 bg-white/5 hover:border-vibe-accent/20 transition-all" }, /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4" }, "Prime Track"), /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4" }, /* @__PURE__ */ React.createElement("div", { className: "w-10 h-10 rounded-lg bg-vibe-accent/20 flex items-center justify-center text-vibe-accent" }, /* @__PURE__ */ React.createElement(Music, { size: 20 })), /* @__PURE__ */ React.createElement("div", { className: "min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "text-[14px] font-black text-white uppercase italic truncate" }, [...songs].sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0]?.title || "Standby"), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] font-bold text-muted uppercase tracking-widest opacity-40" }, "Leaderboard Active")))), /* @__PURE__ */ React.createElement("div", { className: "p-8 bg-vibe-accent/10 border border-vibe-accent/20 rounded-[32px] relative overflow-hidden" }, /* @__PURE__ */ React.createElement(Zap, { size: 48, className: "absolute -right-4 -bottom-4 text-vibe-accent/10 -rotate-12" }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-vibe-accent uppercase tracking-widest relative z-10" }, "Sync Efficiency"), /* @__PURE__ */ React.createElement("p", { className: "text-white text-lg font-bold mt-2 relative z-10 italic" }, "99.8% Core Uptime"))))) : activeTab === "recents" ? /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 sm:p-10 animate-in fade-in slide-in-from-bottom duration-700" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-4 mb-10 pl-2" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-10 bg-vibe-primary rounded-full shadow-xl" }), /* @__PURE__ */ React.createElement("h3", { className: "text-3xl font-bold tracking-tight text-hdr uppercase" }, "Global Sync History ", /* @__PURE__ */ React.createElement("span", { className: "text-sm bg-vibe-primary/10 text-vibe-primary px-3 py-1 rounded-lg ml-2 font-bold" }, loadingSongs ? /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin inline-block ml-2", size: 14 }) : songs.length))), /* @__PURE__ */ React.createElement("div", { className: "bg-white/3 rounded-2xl border border-white/5 overflow-hidden divide-y divide-white/5" }, [...songs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((song, i) => /* @__PURE__ */ React.createElement("div", { key: song._id || i, className: "panel-soft border border-white/10 p-4 sm:p-6 flex items-center justify-between group hover:border-vibe-primary/40 transition-all shadow-lg hover:bg-white/5" }, /* @__PURE__ */ React.createElement("div", { className: "flex gap-4 sm:gap-6 items-center overflow-hidden" }, /* @__PURE__ */ React.createElement("div", { className: "w-12 h-12 sm:w-14 sm:h-14 bg-vibe-900 rounded-xl flex-shrink-0 bg-cover bg-center shadow-lg border border-white/5", style: { backgroundImage: `url(${song.coverImageUrl?.startsWith("/uploads") ? API_BASE_URL + song.coverImageUrl : song.coverImageUrl || "https://via.placeholder.com/300"})` } }), /* @__PURE__ */ React.createElement("div", { className: "overflow-hidden" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-hdr text-base sm:text-lg truncate tracking-tight uppercase italic" }, song.title), /* @__PURE__ */ React.createElement("p", { className: "text-[9px] sm:text-[10px] font-black text-vibe-primary/60 uppercase tracking-widest mt-1 truncate" }, "Added By: ", /* @__PURE__ */ React.createElement("span", { className: "text-white italic" }, song.createdBy?.name || "VIBE Core")))), /* @__PURE__ */ React.createElement("div", { className: "text-right flex flex-col items-end gap-1" }, /* @__PURE__ */ React.createElement("div", { className: "text-[10px] font-black text-muted uppercase tracking-widest opacity-80 flex items-center gap-2" }, /* @__PURE__ */ React.createElement(Clock, { size: 12, className: "text-vibe-primary" }), " ", new Date(song.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })), /* @__PURE__ */ React.createElement("div", { className: "text-[9px] font-bold text-slate-600 uppercase tracking-widest" }, new Date(song.createdAt).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }))))))) : activeTab === "activity" ? /* @__PURE__ */ React.createElement("div", { className: "glass-card p-4 sm:p-10 animate-in fade-in slide-in-from-bottom duration-700" }, /* @__PURE__ */ React.createElement("div", { className: "flex items-center gap-3 mb-8" }, /* @__PURE__ */ React.createElement("div", { className: "w-1.5 h-8 bg-vibe-primary rounded-full shadow-xl" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h3", { className: "text-2xl font-black text-white tracking-tighter" }, "Admin Activity Log"), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5" }, "Kaun sa song \u2014 kaun se admin ne add kiya")), /* @__PURE__ */ React.createElement("div", { className: "ml-auto flex items-center gap-3" }, (user?.role === "superadmin" || user?.email === "user@vibecom") && /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: handleClearActivity,
      className: "text-[10px] font-black text-red-500 border border-red-500/20 bg-red-500/5 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-95 uppercase tracking-widest"
    },
    "Clear Activity"
  ), /* @__PURE__ */ React.createElement("span", { className: "text-xs bg-vibe-primary/10 text-vibe-primary border border-vibe-primary/20 px-3 py-1.5 rounded-xl font-bold" }, songs.length, " Total Songs"))), loadingSongs ? /* @__PURE__ */ React.createElement("div", { className: "py-20 flex justify-center" }, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-vibe-primary", size: 40 })) : /* @__PURE__ */ React.createElement("div", { className: "space-y-3" }, [...songs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, visibleSongsCount).map((song, i) => {
    const coverUrl = song.coverImageUrl?.startsWith("/uploads") ? `${API_BASE_URL}${song.coverImageUrl}` : song.coverImageUrl || null;
    const addedBy = song.createdBy?.name || "VIBE Core";
    const addedAt = new Date(song.createdAt);
    const dateStr = addedAt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = addedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return /* @__PURE__ */ React.createElement("div", { key: song._id || i, className: "flex items-center gap-3 sm:gap-5 panel-soft border border-white/5 rounded-2xl p-3 sm:p-4 hover:border-vibe-primary/30 transition-all group" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] text-slate-600 font-mono w-6 text-center flex-shrink-0" }, i + 1), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 bg-vibe-900 bg-cover bg-center border border-white/5 shadow",
        style: { backgroundImage: coverUrl ? `url(${coverUrl})` : "none" }
      },
      !coverUrl && /* @__PURE__ */ React.createElement("div", { className: "w-full h-full flex items-center justify-center rounded-xl" }, /* @__PURE__ */ React.createElement(Music, { size: 14, className: "text-vibe-primary/40" }))
    ), /* @__PURE__ */ React.createElement("div", { className: "flex-1 min-w-0" }, /* @__PURE__ */ React.createElement("p", { className: "font-bold text-white text-[13px] sm:text-sm truncate" }, song.title), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] text-slate-500 truncate" }, song.artist)), /* @__PURE__ */ React.createElement("div", { className: "flex-shrink-0 flex flex-col items-end gap-1" }, /* @__PURE__ */ React.createElement("span", { className: "text-[10px] font-black text-vibe-primary bg-vibe-primary/10 border border-vibe-primary/20 px-2.5 py-1 rounded-lg uppercase tracking-wide" }, addedBy), /* @__PURE__ */ React.createElement("span", { className: "text-[9px] text-slate-600 font-mono" }, timeStr, " \xB7 ", dateStr)));
  }), songs.length > visibleSongsCount && /* @__PURE__ */ React.createElement("div", { ref: activitySentinelRef, className: "py-12 flex flex-col items-center justify-center gap-4" }, loadingMoreActivity ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(Loader2, { className: "animate-spin text-vibe-primary", size: 40, strokeWidth: 2 }), /* @__PURE__ */ React.createElement("p", { className: "text-[10px] font-black text-vibe-primary uppercase tracking-[0.4em] animate-pulse text-center" }, "Expanding History Cluster...")) : /* @__PURE__ */ React.createElement("div", { className: "h-10" })))) : /* @__PURE__ */ React.createElement(
    SongManagement,
    {
      songs,
      loadingSongs,
      savingSong,
      songError,
      form,
      setForm,
      addSong,
      removeSong,
      audioFile,
      setAudioFile,
      coverFile,
      setCoverFile,
      currentUser: user,
      loadSongs
    }
  ))), /* @__PURE__ */ React.createElement("div", { className: "h-24" }));
};
export default AdminDashboard;
