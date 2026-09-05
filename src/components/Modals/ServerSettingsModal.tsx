import React, { useState, useRef } from 'react';
import {
  Settings,
  Shield,
  Users,
  Trash2,
  X,
  Plus,
  Check,
  Search,
  Upload,
  ChevronRight,
  AlertTriangle,
  Lock,
  Crown,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Role, User } from '../../types';

const DISCORD_ROLE_COLORS = [
  { name: 'Predeterminado', value: '#99AAB5' },
  { name: 'Blurple', value: '#5865F2' },
  { name: 'Verde Neón', value: '#57F287' },
  { name: 'Amarillo', value: '#FEE75C' },
  { name: 'Fucsia', value: '#EB459E' },
  { name: 'Rojo', value: '#ED4245' },
  { name: 'Esmeralda', value: '#00D166' },
  { name: 'Naranja', value: '#E67E22' },
  { name: 'Púrpura', value: '#9B59B6' },
  { name: 'Cian', value: '#00B0F4' },
  { name: 'Oro', value: '#FFB800' },
  { name: 'Turquesa', value: '#1ABC9C' },
];

interface PermissionDef {
  key: string;
  name: string;
  desc: string;
  category: 'general' | 'membership' | 'text' | 'voice';
}

const ALL_PERMISSIONS: PermissionDef[] = [
  // General
  {
    key: 'ADMINISTRATOR',
    name: 'Administrador',
    desc: 'Los miembros con este permiso tienen todos los permisos y omiten restricciones.',
    category: 'general',
  },
  {
    key: 'MANAGE_SERVER',
    name: 'Gestionar Servidor',
    desc: 'Permite cambiar el nombre del servidor, icono y descripción.',
    category: 'general',
  },
  {
    key: 'MANAGE_ROLES',
    name: 'Gestionar Roles',
    desc: 'Permite crear nuevos roles y editar o eliminar roles inferiores a este.',
    category: 'general',
  },
  {
    key: 'MANAGE_CHANNELS',
    name: 'Gestionar Canales',
    desc: 'Permite crear, editar o eliminar canales y categorías.',
    category: 'general',
  },
  // Membership
  {
    key: 'KICK_MEMBERS',
    name: 'Expulsar Miembros',
    desc: 'Permite expulsar a miembros del servidor.',
    category: 'membership',
  },
  {
    key: 'BAN_MEMBERS',
    name: 'Banear Miembros',
    desc: 'Permite banear a miembros de forma permanente.',
    category: 'membership',
  },
  // Text
  {
    key: 'SEND_MESSAGES',
    name: 'Enviar Mensajes',
    desc: 'Permite a los miembros enviar mensajes en los canales de texto.',
    category: 'text',
  },
  {
    key: 'EMBED_LINKS',
    name: 'Insertar Enlaces',
    desc: 'Permite que los enlaces enviados tengan previsualización enriquecida.',
    category: 'text',
  },
  {
    key: 'ATTACH_FILES',
    name: 'Adjuntar Archivos',
    desc: 'Permite subir imágenes, audios y documentos en los mensajes.',
    category: 'text',
  },
  {
    key: 'ADD_REACTIONS',
    name: 'Añadir Reacciones',
    desc: 'Permite reaccionar a mensajes con emojis del servidor y universales.',
    category: 'text',
  },
  // Voice
  {
    key: 'CONNECT_VOICE',
    name: 'Conectarse a Voz',
    desc: 'Permite unirse y escuchar en las salas de voz HD.',
    category: 'voice',
  },
  {
    key: 'SPEAK_VOICE',
    name: 'Hablar en Voz',
    desc: 'Permite transmitir audio desde el micrófono en canales de voz.',
    category: 'voice',
  },
];

export const ServerSettingsModal: React.FC = () => {
  const {
    isServerSettingsOpen,
    setIsServerSettingsOpen,
    serverSettingsTab,
    setServerSettingsTab,
    activeServer,
    currentUser,
    createRole,
    updateRole,
    deleteRole,
    toggleMemberRole,
    updateServerDetails,
    deleteServer,
  } = useApp();

  // Active role selected for editing
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [roleSubTab, setRoleSubTab] = useState<'display' | 'permissions' | 'members'>('display');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Overview form state
  const [serverName, setServerName] = useState(activeServer?.name || '');
  const [serverDescription, setServerDescription] = useState(activeServer?.description || '');
  const [serverIcon, setServerIcon] = useState(activeServer?.icon || '');
  const [serverBanner, setServerBanner] = useState(activeServer?.banner || '');
  const iconInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // Sync overview state when activeServer changes
  React.useEffect(() => {
    if (activeServer) {
      setServerName(activeServer.name);
      setServerDescription(activeServer.description || '');
      setServerIcon(activeServer.icon || '');
      setServerBanner(activeServer.banner || '');
      if (activeServer.roles?.length > 0 && !selectedRoleId) {
        setSelectedRoleId(activeServer.roles[0].id);
      }
    }
  }, [activeServer]);

  if (!isServerSettingsOpen || !activeServer) return null;

  const roles = activeServer.roles || [];
  const members = activeServer.members || [currentUser];

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const filteredRoles = roles.filter((r) =>
    r.name.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  const filteredMembers = members.filter((m) =>
    (m.displayName || m.username).toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  // Handle Role Creation
  const handleCreateNewRole = () => {
    const newRole = createRole(activeServer.id, {
      name: 'nuevo rol',
      color: '#5865F2',
      hoist: true,
      permissions: ['SEND_MESSAGES', 'CONNECT_VOICE', 'SPEAK_VOICE'],
    });
    setSelectedRoleId(newRole.id);
  };

  // Handle Role Color Pick
  const handleColorChange = (color: string) => {
    if (!selectedRole) return;
    updateRole(activeServer.id, selectedRole.id, { color });
  };

  // Handle Role Name Change
  const handleRoleNameChange = (name: string) => {
    if (!selectedRole) return;
    updateRole(activeServer.id, selectedRole.id, { name });
  };

  // Handle Role Hoist Toggle
  const handleRoleHoistToggle = () => {
    if (!selectedRole) return;
    updateRole(activeServer.id, selectedRole.id, { hoist: !selectedRole.hoist });
  };

  // Handle Role Mentionable Toggle
  const handleRoleMentionableToggle = () => {
    if (!selectedRole) return;
    updateRole(activeServer.id, selectedRole.id, { mentionable: !selectedRole.mentionable });
  };

  // Handle Permission Toggle
  const handlePermissionToggle = (permKey: string) => {
    if (!selectedRole) return;
    const currentPerms = selectedRole.permissions || [];
    const hasPerm = currentPerms.includes(permKey);
    const updatedPerms = hasPerm
      ? currentPerms.filter((p) => p !== permKey)
      : [...currentPerms, permKey];
    updateRole(activeServer.id, selectedRole.id, { permissions: updatedPerms });
  };

  // Handle Icon file upload
  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setServerIcon(dataUrl);
      updateServerDetails(activeServer.id, { icon: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Handle Banner file upload
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setServerBanner(dataUrl);
      updateServerDetails(activeServer.id, { banner: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Save Overview
  const handleSaveOverview = (e: React.FormEvent) => {
    e.preventDefault();
    updateServerDetails(activeServer.id, {
      name: serverName.trim() || activeServer.name,
      description: serverDescription.trim(),
      icon: serverIcon,
      banner: serverBanner,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150 select-none font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={() => setIsServerSettingsOpen(false)}
    >
      <div
        className="w-full max-w-5xl h-[88vh] rounded-3xl bg-[#11141d] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Navigation Sidebar */}
        <div className="w-full md:w-64 bg-[#0c0e15] border-r border-white/[0.08] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-4">
            {/* Server Identity */}
            <div className="flex items-center gap-3 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              {activeServer.icon ? (
                <img
                  src={activeServer.icon}
                  alt={activeServer.name}
                  className="w-10 h-10 rounded-xl object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold font-['Outfit'] text-sm">
                  {activeServer.acronym}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-white truncate font-['Outfit']">
                  {activeServer.name}
                </h3>
                <span className="text-[10px] text-purple-400 font-mono">Ajustes del Servidor</span>
              </div>
            </div>

            {/* Navigation Options */}
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setServerSettingsTab('overview')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  serverSettingsTab === 'overview'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings size={15} />
                  <span>Vista General</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setServerSettingsTab('roles')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  serverSettingsTab === 'roles'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Shield size={15} />
                  <span>Roles</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                  {roles.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setServerSettingsTab('members')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  serverSettingsTab === 'members'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users size={15} />
                  <span>Gestión de Miembros</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-mono">
                  {members.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Bottom actions: Delete server */}
          <div className="pt-4 border-t border-white/[0.08] space-y-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente el servidor "${activeServer.name}"? Esta acción no se puede deshacer.`)) {
                  setIsServerSettingsOpen(false);
                  deleteServer(activeServer.id);
                }
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/15 transition-all cursor-pointer"
            >
              <Trash2 size={15} />
              <span>Eliminar Servidor</span>
            </button>
          </div>
        </div>

        {/* Right Main Content Area */}
        <div className="flex-1 flex flex-col bg-[#121520] overflow-hidden">
          {/* Header Bar */}
          <div className="h-14 border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0 bg-white/[0.01]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                {serverSettingsTab === 'overview' && 'Vista General'}
                {serverSettingsTab === 'roles' && 'Roles del Servidor'}
                {serverSettingsTab === 'members' && 'Miembros y Asignación de Roles'}
              </span>
            </div>

            {/* Close ESC button (Discord style) */}
            <button
              type="button"
              onClick={() => setIsServerSettingsOpen(false)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-all cursor-pointer text-xs"
              title="Cerrar Ajustes"
            >
              <X size={14} />
              <span className="text-[10px] font-mono border border-white/20 rounded px-1">ESC</span>
            </button>
          </div>

          {/* Content Views */}
          <div className="flex-1 overflow-hidden p-6">
            {/* ======================= TAB: ROLES ======================= */}
            {serverSettingsTab === 'roles' && (
              <div className="h-full flex flex-col gap-4">
                {/* Intro & Create button */}
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 shrink-0">
                  <div>
                    <h2 className="text-sm font-bold text-white font-['Outfit']">Roles del Servidor</h2>
                    <p className="text-xs text-slate-400">
                      Usa los roles para organizar a los miembros, asignarles colores y configurar sus permisos.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateNewRole}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    <Plus size={14} />
                    <span>Crear Rol</span>
                  </button>
                </div>

                {/* Main Split: Roles List on left, Role Editor on right */}
                <div className="flex-1 flex gap-5 overflow-hidden">
                  {/* Left Column: Roles list */}
                  <div className="w-56 flex flex-col gap-2 shrink-0 border-r border-white/[0.08] pr-4">
                    <div className="relative shrink-0">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={roleSearchQuery}
                        onChange={(e) => setRoleSearchQuery(e.target.value)}
                        placeholder="Buscar roles..."
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                      {filteredRoles.map((role) => {
                        const isSelected = selectedRole?.id === role.id;
                        const roleMembersCount = members.filter((m) => (m.roles || []).includes(role.id)).length;
                        return (
                          <div
                            key={role.id}
                            onClick={() => setSelectedRoleId(role.id)}
                            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-600/25 border border-purple-500/50 text-white shadow-sm'
                                : 'text-slate-300 hover:bg-white/[0.05] hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow"
                                style={{ backgroundColor: role.color }}
                              />
                              <span className="truncate font-semibold">{role.name}</span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {roleMembersCount}
                              </span>
                              {role.name !== '@everyone' && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`¿Eliminar el rol "${role.name}"?`)) {
                                      deleteRole(activeServer.id, role.id);
                                      if (selectedRoleId === role.id) {
                                        setSelectedRoleId(roles.find((r) => r.id !== role.id)?.id || '');
                                      }
                                    }
                                  }}
                                  className="p-1 rounded-lg hover:bg-rose-500 text-slate-400 hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                  title="Eliminar rol"
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Selected Role Editor */}
                  {selectedRole ? (
                    <div className="flex-1 flex flex-col overflow-hidden">
                      {/* Sub-tabs */}
                      <div className="flex items-center gap-4 border-b border-white/[0.08] pb-2 shrink-0 mb-4">
                        <button
                          type="button"
                          onClick={() => setRoleSubTab('display')}
                          className={`text-xs font-bold pb-1 cursor-pointer transition-all border-b-2 ${
                            roleSubTab === 'display'
                              ? 'border-purple-500 text-white'
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Visualización
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoleSubTab('permissions')}
                          className={`text-xs font-bold pb-1 cursor-pointer transition-all border-b-2 ${
                            roleSubTab === 'permissions'
                              ? 'border-purple-500 text-white'
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Permisos ({selectedRole.permissions?.length || 0})
                        </button>
                        <button
                          type="button"
                          onClick={() => setRoleSubTab('members')}
                          className={`text-xs font-bold pb-1 cursor-pointer transition-all border-b-2 ${
                            roleSubTab === 'members'
                              ? 'border-purple-500 text-white'
                              : 'border-transparent text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Gestionar Miembros (
                          {members.filter((m) => (m.roles || []).includes(selectedRole.id)).length}
                          )
                        </button>
                      </div>

                      {/* Sub-Tab 1: DISPLAY */}
                      {roleSubTab === 'display' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-2">
                          {/* Role Name */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300">NOMBRE DEL ROL</label>
                            <input
                              type="text"
                              value={selectedRole.name}
                              disabled={selectedRole.name === '@everyone'}
                              onChange={(e) => handleRoleNameChange(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-['Outfit'] disabled:opacity-50"
                            />
                            {selectedRole.name === '@everyone' && (
                              <p className="text-[11px] text-slate-400">
                                El rol @everyone se aplica a todos los miembros y no se puede renombrar.
                              </p>
                            )}
                          </div>

                          {/* Role Color */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-300">COLOR DEL ROL</label>
                            <p className="text-[11px] text-slate-400">
                              Los miembros usarán el color de su rol más alto en la lista de miembros y en el chat.
                            </p>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {DISCORD_ROLE_COLORS.map((col) => (
                                <button
                                  key={col.value}
                                  type="button"
                                  onClick={() => handleColorChange(col.value)}
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-sm ${
                                    selectedRole.color.toLowerCase() === col.value.toLowerCase()
                                      ? 'ring-2 ring-white scale-110'
                                      : 'hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: col.value }}
                                  title={col.name}
                                >
                                  {selectedRole.color.toLowerCase() === col.value.toLowerCase() && (
                                    <Check size={14} className="text-white drop-shadow" />
                                  )}
                                </button>
                              ))}

                              {/* Custom Hex Color Picker */}
                              <div className="flex items-center gap-2 pl-2">
                                <input
                                  type="color"
                                  value={selectedRole.color}
                                  onChange={(e) => handleColorChange(e.target.value)}
                                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                                  title="Selector de color personalizado"
                                />
                                <span className="text-xs font-mono text-slate-300 uppercase">
                                  {selectedRole.color}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Hoist Toggle */}
                          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-white">
                                Mostrar miembros por separado
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                Agrupa a los miembros con este rol en una categoría propia en la lista de miembros.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRoleHoistToggle}
                              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                selectedRole.hoist ? 'bg-purple-600' : 'bg-slate-700'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                                  selectedRole.hoist ? 'right-1' : 'left-1'
                                }`}
                              />
                            </button>
                          </div>

                          {/* Mentionable Toggle */}
                          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between gap-4">
                            <div>
                              <h4 className="text-xs font-bold text-white">
                                Permitir a cualquiera mencionar este rol
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                Permite que cualquier usuario mencione @{selectedRole.name} en el chat.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRoleMentionableToggle}
                              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                                selectedRole.mentionable ? 'bg-purple-600' : 'bg-slate-700'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                                  selectedRole.mentionable ? 'right-1' : 'left-1'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Sub-Tab 2: PERMISSIONS */}
                      {roleSubTab === 'permissions' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                          {['general', 'membership', 'text', 'voice'].map((category) => {
                            const catPerms = ALL_PERMISSIONS.filter((p) => p.category === category);
                            const categoryLabels = {
                              general: '🛡️ PERMISOS GENERALES DEL SERVIDOR',
                              membership: '👥 PERMISOS DE MEMBRESÍA',
                              text: '💬 PERMISOS DE CANAL DE TEXTO',
                              voice: '🔊 PERMISOS DE CANAL DE VOZ',
                            };

                            return (
                              <div key={category} className="space-y-2">
                                <h4 className="text-[10px] font-bold text-slate-400 font-mono tracking-wider">
                                  {categoryLabels[category as keyof typeof categoryLabels]}
                                </h4>

                                <div className="space-y-1.5">
                                  {catPerms.map((perm) => {
                                    const hasPerm = (selectedRole.permissions || []).includes(perm.key);
                                    return (
                                      <div
                                        key={perm.key}
                                        onClick={() => handlePermissionToggle(perm.key)}
                                        className="p-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.05] flex items-center justify-between gap-4 cursor-pointer transition-colors"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                                            <span>{perm.name}</span>
                                            {perm.key === 'ADMINISTRATOR' && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                                                Peligroso
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[11px] text-slate-400 mt-0.5">{perm.desc}</p>
                                        </div>

                                        <button
                                          type="button"
                                          className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${
                                            hasPerm ? 'bg-purple-600' : 'bg-slate-700'
                                          }`}
                                        >
                                          <div
                                            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                                              hasPerm ? 'right-1' : 'left-1'
                                            }`}
                                          />
                                        </button>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Sub-Tab 3: MEMBERS OF THIS ROLE */}
                      {roleSubTab === 'members' && (
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                          <p className="text-xs text-slate-400">
                            Haz clic en un miembro para asignarle o removerle el rol{' '}
                            <strong style={{ color: selectedRole.color }}>{selectedRole.name}</strong>.
                          </p>

                          <div className="space-y-1.5">
                            {members.map((member) => {
                              const hasThisRole = (member.roles || []).includes(selectedRole.id);
                              return (
                                <div
                                  key={member.id}
                                  onClick={() => toggleMemberRole(activeServer.id, member.id, selectedRole.id)}
                                  className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                    hasThisRole
                                      ? 'bg-purple-600/15 border-purple-500/40 text-white'
                                      : 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.06] text-slate-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-xl bg-purple-600/30 flex items-center justify-center font-bold text-white overflow-hidden text-xs">
                                      {member.avatar ? (
                                        <img src={member.avatar} alt={member.displayName} className="w-full h-full object-cover" />
                                      ) : (
                                        member.displayName.slice(0, 1)
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-white truncate flex items-center gap-1.5 font-['Outfit']">
                                        <span>{member.displayName}</span>
                                        {member.id === activeServer.ownerId && (
                                          <Crown size={12} className="text-amber-400 fill-amber-400" />
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono">@{member.username}</div>
                                    </div>
                                  </div>

                                  <div
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                                      hasThisRole
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/[0.08] text-transparent hover:text-white/40'
                                    }`}
                                  >
                                    <Check size={14} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-500">
                      Selecciona o crea un rol para comenzar a editarlo.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ======================= TAB: MEMBERS ======================= */}
            {serverSettingsTab === 'members' && (
              <div className="h-full flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 shrink-0">
                  <div>
                    <h2 className="text-sm font-bold text-white font-['Outfit']">Gestión de Miembros</h2>
                    <p className="text-xs text-slate-400">
                      Administra los miembros de tu servidor y asígnales roles directamente.
                    </p>
                  </div>
                  <div className="relative w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Buscar miembros..."
                      className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-['Outfit']"
                    />
                  </div>
                </div>

                {/* Members List Table */}
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {filteredMembers.map((member) => {
                    const memberRoleIds = member.roles || [];
                    const memberRoles = roles.filter((r) => memberRoleIds.includes(r.id));
                    const isOwner = member.id === activeServer.ownerId;

                    return (
                      <div
                        key={member.id}
                        className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-4"
                      >
                        {/* Member Identity */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-2xl bg-purple-600/30 flex items-center justify-center font-bold text-white overflow-hidden text-sm shrink-0">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.displayName} className="w-full h-full object-cover" />
                            ) : (
                              member.displayName.slice(0, 1)
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1.5 font-['Outfit']">
                              <span>{member.displayName}</span>
                              {isOwner && (
                                <span title="Propietario del servidor">
                                  <Crown size={13} className="text-amber-400 fill-amber-400" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              @{member.username}#{member.tag || '0001'}
                            </div>
                          </div>
                        </div>

                        {/* Assigned Roles Pills & Add Role button */}
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {memberRoles.map((role) => (
                            <span
                              key={role.id}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 border"
                              style={{
                                backgroundColor: `${role.color}20`,
                                borderColor: `${role.color}50`,
                                color: role.color,
                              }}
                            >
                              <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: role.color }}
                              />
                              <span>{role.name}</span>
                              <button
                                type="button"
                                onClick={() => toggleMemberRole(activeServer.id, member.id, role.id)}
                                className="hover:text-white cursor-pointer ml-0.5 text-xs opacity-75 hover:opacity-100"
                                title="Remover rol"
                              >
                                ×
                              </button>
                            </span>
                          ))}

                          {/* Quick Role Toggle Selector */}
                          <div className="relative group">
                            <button
                              type="button"
                              className="px-2 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Plus size={12} />
                              <span>Rol</span>
                            </button>

                            {/* Dropdown list */}
                            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl bg-[#181c28] border border-white/15 shadow-xl p-1.5 hidden group-hover:block z-30 space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                              <span className="text-[9px] text-slate-400 uppercase font-mono px-2 py-1 block">
                                Alternar Roles
                              </span>
                              {roles.map((role) => {
                                const hasRole = memberRoleIds.includes(role.id);
                                return (
                                  <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => toggleMemberRole(activeServer.id, member.id, role.id)}
                                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs text-slate-200 hover:bg-white/[0.08] cursor-pointer"
                                  >
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: role.color }}
                                      />
                                      <span className="truncate">{role.name}</span>
                                    </div>
                                    {hasRole && <Check size={12} className="text-purple-400 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ======================= TAB: OVERVIEW ======================= */}
            {serverSettingsTab === 'overview' && (
              <form onSubmit={handleSaveOverview} className="h-full overflow-y-auto custom-scrollbar space-y-5 pr-2">
                <div className="border-b border-white/[0.06] pb-3">
                  <h2 className="text-sm font-bold text-white font-['Outfit']">Vista General del Servidor</h2>
                  <p className="text-xs text-slate-400">Personaliza el nombre, icono, portada y detalles de tu servidor.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left: Icon & Banner */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">ICONO DEL SERVIDOR</label>
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleIconUpload}
                        className="hidden"
                      />
                      <div className="flex items-center gap-4">
                        <div
                          onClick={() => iconInputRef.current?.click()}
                          className="w-20 h-20 rounded-3xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center cursor-pointer overflow-hidden group hover:opacity-90 transition-all shadow-lg"
                        >
                          {serverIcon ? (
                            <img src={serverIcon} alt={serverName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-xl font-bold text-white font-['Outfit'] group-hover:scale-110 transition-transform">
                              {activeServer.acronym}
                            </div>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <button
                            type="button"
                            onClick={() => iconInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer shadow-md transition-all"
                          >
                            Subir imagen
                          </button>
                          {serverIcon && (
                            <button
                              type="button"
                              onClick={() => {
                                setServerIcon('');
                                updateServerDetails(activeServer.id, { icon: '' });
                              }}
                              className="block text-[11px] text-rose-400 hover:underline cursor-pointer"
                            >
                              Eliminar icono
                            </button>
                          )}
                          <p className="text-[10px] text-slate-500">Mínimo recomendado: 512x512 PNG o WEBP</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">BANNER DEL SERVIDOR</label>
                      <input
                        ref={bannerInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        className="hidden"
                      />
                      <div
                        onClick={() => bannerInputRef.current?.click()}
                        className="w-full h-28 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] overflow-hidden cursor-pointer flex items-center justify-center relative group transition-all"
                      >
                        {serverBanner ? (
                          <img src={serverBanner} alt="Banner" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <Upload size={20} className="mx-auto text-purple-400 group-hover:scale-110 transition-transform mb-1" />
                            <span className="text-xs text-slate-400">Subir imagen panorámica</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Server Name & Description */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">NOMBRE DEL SERVIDOR</label>
                      <input
                        type="text"
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 font-['Outfit'] font-bold"
                        maxLength={50}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">DESCRIPCIÓN DEL SERVIDOR</label>
                      <textarea
                        value={serverDescription}
                        onChange={(e) => setServerDescription(e.target.value)}
                        placeholder="Cuéntale a la gente de qué se trata tu servidor..."
                        rows={4}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 custom-scrollbar resize-none font-sans"
                        maxLength={200}
                      />
                      <div className="text-right text-[10px] text-slate-500 font-mono">
                        {serverDescription.length}/200
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.08] flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
