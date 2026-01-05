import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Pencil, Save, AlertTriangle, File, ArrowLeft, Settings, LogOut, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import ImageCropper from '../components/Utils/ImageCropper';

const UserSettings = () => {
  const { user, updateProfile, deleteWorkspace, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Local state for form fields
  const [name, setName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    textModuleFontSize: 16,
    snippetModuleFontSize: 14,
    compilerFontSize: 14,
    snippetModuleHeight: 500
  });

  // Profile Picture State
  const [displayImage, setDisplayImage] = useState("https://via.placeholder.com/150");
  const [imageSrc, setImageSrc] = useState(null);
  const [showCropModal, setShowCropModal] = useState(false);
  // Remove Picture State
  const [showRemovePicConfirm, setShowRemovePicConfirm] = useState(false);

  // Modals state
  const [showDeleteWorkspaceModal, setShowDeleteWorkspaceModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSettings({
        textModuleFontSize: user.settings?.textModuleFontSize || 16,
        snippetModuleFontSize: user.settings?.snippetModuleFontSize || 14,
        compilerFontSize: user.settings?.compilerFontSize || 14,
        snippetModuleHeight: user.settings?.snippetModuleHeight || 500
      });
      // Prioritize custom picture, fallback to Google picture
      setDisplayImage(user.custom_profile_picture || user.picture || "https://via.placeholder.com/150");
    }
  }, [user]);

  const handleSaveName = async () => {
    try {
      await updateProfile({ name });
      setIsEditingName(false);
      toast.success("Username updated!");
    } catch (error) {
      toast.error("Failed to update username");
    }
  };

  const handleSettingChange = (key, value) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    setSettings(prev => ({ ...prev, [key]: numValue }));
  };

  const handleSaveSettings = async (key, value) => {
    try {
      await updateProfile({ settings: { ...settings, [key]: value } });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
    toast.success("Signed out successfully");
  };

  // --- Profile Picture Logic ---

  const handleEditClick = () => {
    fileInputRef.current.click();
  };

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result);
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
      // Reset input so same file selection triggers change again
      e.target.value = null;
    }
  };

  const handleCropSave = async (croppedBlob, cropSettings) => {
    try {
      const formData = new FormData();
      formData.append('image', croppedBlob);
      formData.append('userId', user._id);
      formData.append('cropSettings', JSON.stringify(cropSettings));

      // Optimistic Update
      const objectUrl = URL.createObjectURL(croppedBlob);
      setDisplayImage(objectUrl);
      setShowCropModal(false);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/profile-picture`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      toast.success("Profile picture updated!");

      // Sync with context
      await updateProfile({
        custom_profile_picture: data.url,
        profile_picture_settings: cropSettings
      });

    } catch (error) {
      console.error(error);
      toast.error("Failed to upload image");
      // Revert on failure (optional, but good UX)
      setDisplayImage(user.custom_profile_picture || user.picture || "https://via.placeholder.com/150");
    }
  };

  const handleRemovePicture = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload/profile-picture/${user._id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error("Remove failed");

      toast.success("Profile picture removed");
      setShowRemovePicConfirm(false);

      // Sync with context
      await updateProfile({
        custom_profile_picture: null,
        profile_picture_settings: {}
      });

      // Revert display to default/google pic
      setDisplayImage(user.picture || "https://via.placeholder.com/150");

    } catch (error) {
      console.error(error);
      toast.error("Failed to remove picture");
    }
  };

  // --- Deletion Logic ---

  const handleDeleteWorkspace = async () => {
    if (deleteInput !== 'DELETE-ENTIRE-DATA') {
      setDeleteError('Input dosent match');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteWorkspace();
      toast.success("Workspace deleted successfully");
      setShowDeleteWorkspaceModal(false);
      setDeleteInput('');
      setDeleteError('');
    } catch (error) {
      toast.error("Failed to delete workspace");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const requiredText = `DELETE-${user.name}`;
    if (deleteInput !== requiredText) {
      setDeleteError('Input dosent match');
      return;
    }
    setIsDeleting(true);
    try {
      await deleteAccount();
      toast.success("Account deleted successfully");
      navigate('/login');
    } catch (error) {
      toast.error("Failed to delete account");
      setIsDeleting(false);
    }
  };

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-[#191919] text-text overflow-hidden">
      <header className="h-14 border-b border-white/10 flex items-center justify-between px-6 bg-[#191919] sticky top-0 z-50 shrink-0 shadow-sm">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="text-text-muted hover:text-white transition-colors p-1 rounded hover:bg-white/5"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center space-x-3 group animate-in fade-in duration-300">
            <div className="p-1.5 bg-accent/10 rounded-md text-accent border border-accent/20">
              <Settings size={16} />
            </div>
            <h1 className="text-sm font-semibold text-white tracking-wide">
              Your Profile Settings
            </h1>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Section - Profile Image */}
        <div className="w-[30%] min-w-[300px] px-8 py-12 flex flex-col items-center border-r border-white/5 bg-[#191919]/50">
          <div className="flex flex-col items-center gap-6">
            <img
              src={displayImage}
              alt="Profile"
              className="w-48 h-48 rounded-full object-cover border-4 border-[#252526] shadow-2xl relative z-10"
            />

            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={onFileChange}
              className="hidden"
            />

            <div className="flex items-center gap-3">
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#252526] hover:bg-[#2F2F2F] border border-white/10 hover:border-white/20 rounded-full transition-all text-sm font-medium text-white shadow-lg active:scale-95 group"
              >
                Edit <Pencil size={14} className="text-accent group-hover:scale-110 transition-transform" />
              </button>

              {user.custom_profile_picture && (
                <div className="relative">
                  <button
                    onClick={() => setShowRemovePicConfirm(!showRemovePicConfirm)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-full transition-all text-red-500 hover:text-red-400 shadow-lg active:scale-95 group"
                    title="Remove Picture"
                  >
                    <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                  </button>

                  {showRemovePicConfirm && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowRemovePicConfirm(false)}
                      />
                      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-48 bg-[#252526] border border-red-500/30 rounded-xl shadow-xl p-3 z-50 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                        <p className="text-[10px] text-white/50 text-center font-bold uppercase tracking-widest mb-1">Remove Picture?</p>
                        <button
                          onClick={handleRemovePicture}
                          className="w-full py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded flex items-center justify-center gap-1"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setShowRemovePicConfirm(false)}
                          className="w-full py-1.5 bg-white/5 hover:bg-white/10 text-white/70 text-xs font-medium rounded"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-xl font-bold text-white tracking-wide">{user.name}</h3>
            <p className="text-sm text-text-muted mt-1 opacity-60">{user.email}</p>
          </div>
        </div>

        {/* Right Section - Settings */}
        <div className="flex-1 px-12 py-12 overflow-y-auto custom-scrollbar pb-[100px]">
          <div className="max-w-3xl space-y-12">

            {/* Group 1: Basic Info */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white tracking-tight pl-1">Basic Info</h2>
              <div className="border border-white/10 rounded-xl p-8 space-y-8 bg-[#1e1e1e]/30">
                {/* Username */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Display Name</label>
                  <div className="flex items-center group focus-within:ring-1 focus-within:ring-accent/50 rounded-lg transition-all">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={!isEditingName}
                        className={`w-full bg-[#252526] border ${isEditingName ? 'border-accent text-white' : 'border-border text-gray-300'} rounded-l-lg py-3 px-4 text-sm placeholder-text-muted outline-none transition-all`}
                      />
                    </div>
                    <button
                      onClick={() => isEditingName ? handleSaveName() : setIsEditingName(true)}
                      className={`px-5 py-3 font-medium text-xs border-y border-r rounded-r-lg transition-colors flex items-center gap-2
                                                ${isEditingName
                          ? 'bg-accent border-accent text-white hover:bg-blue-600'
                          : 'bg-[#2F2F2F] border-border text-text hover:bg-[#383838] hover:text-white'}`}
                    >
                      {isEditingName ? <><Save size={14} /> Save</> : <><Pencil size={14} /> Edit</>}
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2 opacity-75">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-widest pl-1">Email Address</label>
                  <div className="w-full bg-[#252526]/50 border border-white/5 rounded-lg py-3 px-4 text-sm text-text-muted flex items-center justify-between cursor-not-allowed">
                    <span>{user.email}</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-text-muted border border-white/5">Google Linked</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Group 2: Customize */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white tracking-tight pl-1">Customize</h2>
              <div className="border border-white/10 rounded-xl p-8 space-y-8 bg-[#1e1e1e]/30">
                <SettingSlider
                  label="Text Module Font Size"
                  value={settings.textModuleFontSize}
                  min={10}
                  max={32}
                  onChange={(val) => handleSettingChange('textModuleFontSize', val)}
                  onCommit={(val) => handleSaveSettings('textModuleFontSize', val)}
                />
                <SettingSlider
                  label="Snippet Editor Font Size"
                  value={settings.snippetModuleFontSize}
                  min={10}
                  max={32}
                  onChange={(val) => handleSettingChange('snippetModuleFontSize', val)}
                  onCommit={(val) => handleSaveSettings('snippetModuleFontSize', val)}
                />
                <SettingSlider
                  label="Compiler Font Size"
                  value={settings.compilerFontSize}
                  min={10}
                  max={32}
                  onChange={(val) => handleSettingChange('compilerFontSize', val)}
                  onCommit={(val) => handleSaveSettings('compilerFontSize', val)}
                />
                <SettingSlider
                  label="Snippet Editor Height (px)"
                  value={settings.snippetModuleHeight}
                  min={200}
                  max={800}
                  onChange={(val) => handleSettingChange('snippetModuleHeight', val)}
                  onCommit={(val) => handleSaveSettings('snippetModuleHeight', val)}
                />
              </div>
            </div>

            {/* Sign Out */}
            <div className="flex justify-end">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all text-sm font-medium text-red-500 hover:text-red-400 shadow-lg active:scale-95"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>

            {/* Group 3: Danger Zone */}
            <div className="border-2 border-red-500/40 rounded-xl p-8 bg-red-500/5 hover:bg-red-500/[0.07] transition-colors">
              <h3 className="text-red-500 font-bold uppercase tracking-wider mb-8 flex items-center gap-2 text-sm border-b border-red-500/20 pb-4">
                <AlertTriangle size={16} /> Danger Zone
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-red-400 text-sm">Delete entire workspace</h4>
                    <p className="text-xs text-red-500/60 mt-1">Permanently remove all files, folders, and snippets</p>
                  </div>
                  <button
                    onClick={() => { setDeleteError(''); setDeleteInput(''); setShowDeleteWorkspaceModal(true); }}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 rounded-lg transition-all font-bold text-xs uppercase tracking-wide"
                  >
                    Delete
                  </button>
                </div>
                <div className="h-px bg-red-500/20" />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-red-400 text-sm">Delete account permanently</h4>
                    <p className="text-xs text-red-500/60 mt-1">Remove your account and all associated data</p>
                  </div>
                  <button
                    onClick={() => { setDeleteError(''); setDeleteInput(''); setShowDeleteAccountModal(true); }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-bold text-xs uppercase tracking-wide shadow-lg shadow-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          onCancel={() => { setShowCropModal(false); setImageSrc(null); if (fileInputRef.current) fileInputRef.current.value = null; }}
          onSave={handleCropSave}
        />
      )}

      {/* Delete Modals */}
      {showDeleteWorkspaceModal && (
        <DeleteModal
          title="Delete entire workspace"
          description="By continuing this your entire data will be deleted and the including files, folders, snippets, and miscellaneous. You are responsible for your own actions"
          confirmationText="DELETE-ENTIRE-DATA"
          inputValue={deleteInput}
          setInputValue={setDeleteInput}
          onClose={() => setShowDeleteWorkspaceModal(false)}
          onConfirm={handleDeleteWorkspace}
          error={deleteError}
          isDeleting={isDeleting}
        />
      )}

      {showDeleteAccountModal && (
        <DeleteModal
          title="Delete Account permanently"
          description="By continuing this your account will be deleted with your entire data including files, folders, snippets, and miscellaneous. You are responsible for your own actions"
          confirmationText={`DELETE-${user.name}`}
          inputValue={deleteInput}
          setInputValue={setDeleteInput}
          onClose={() => setShowDeleteAccountModal(false)}
          onConfirm={handleDeleteAccount}
          error={deleteError}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
};

const SettingSlider = ({ label, value, min, max, onChange, onCommit }) => {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-text-muted uppercase tracking-widest pl-1">{label}</label>
      <div className="flex items-center bg-[#252526] border border-border rounded-lg p-2.5 focus-within:border-accent/50 transition-colors">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            let val = parseInt(e.target.value);
            if (val < min) val = min;
            if (val > max) val = max;
            onChange(val);
          }}
          onBlur={(e) => onCommit(parseInt(e.target.value))}
          className="w-16 bg-transparent border-r border-white/10 text-center text-white font-mono outline-none text-sm py-1"
        />
        <div className="flex-1 px-4 flex items-center gap-3">
          <span className="text-xs text-text-muted font-mono opacity-60">{min}</span>
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onMouseUp={(e) => onCommit(parseInt(e.target.value))}
            className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-blue-400 transition-all"
          />
          <span className="text-xs text-text-muted font-mono opacity-60">{max}</span>
        </div>
      </div>
    </div>
  );
};

const DeleteModal = ({ title, description, confirmationText, inputValue, setInputValue, onClose, onConfirm, error, isDeleting }) => {
  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1e1e1e] border border-red-500/30 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            {description}
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 outline-none focus:border-red-500/50 transition-colors"
                placeholder="Type confirmation phrase..."
                autoFocus
              />
              <p className="text-xs text-text-muted">
                Enter <span className="font-mono text-red-400 bg-red-500/10 px-1 rounded select-all">{confirmationText}</span> in above text field to delete data, case sensitive
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/5 border-t border-white/5 flex items-center justify-end gap-4">
          {error && (
            <span className="text-red-500 text-sm font-medium animate-pulse mr-auto px-2">
              {error}
            </span>
          )}
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-text-muted hover:text-white transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className={`px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-lg shadow-red-900/20 transition-all ${isDeleting ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
