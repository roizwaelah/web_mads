import { useState, useEffect } from 'react';
import { Check, ImageIcon, FileText, Plus, Pin, X } from "lucide-react";
import { normalizeMediaUrl, safeJson } from '../../utils/http';

const MediaModal = ({ isOpen, onClose, mediaItems = [], onInsert, onUploadSuccess }) => {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [isUploading, setIsUploading] = useState(false);
  const [libraryItems, setLibraryItems] = useState([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [libraryError, setLibraryError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedItem(null);
      setActiveTab('library');
      setLibraryError("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const loadLibrary = async () => {
      setIsLoadingLibrary(true);
      setLibraryError("");
      try {
        const res = await fetch(`/api/media.php?limit=200&ts=${Date.now()}`, { cache: "no-store" });
        const data = await safeJson(res);
        if (!active) return;
        if (data?.status === "success" && Array.isArray(data.data)) {
          setLibraryItems(data.data);
        } else {
          setLibraryItems([]);
          setLibraryError(data?.message || "Gagal memuat pustaka media.");
        }
      } catch (err) {
        if (!active) return;
        setLibraryItems([]);
        setLibraryError("Gagal memuat pustaka media.");
      } finally {
        if (active) setIsLoadingLibrary(false);
      }
    };

    loadLibrary();
    return () => {
      active = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (mediaItems?.length) {
      setLibraryItems(mediaItems);
    }
  }, [mediaItems]);

  if (!isOpen) return null;

  const displayedItems = libraryItems.length ? libraryItems : mediaItems || [];

  const handleInsert = () => {
    if (selectedItem) {
      const nextItem = selectedItem.url
        ? { ...selectedItem, url: normalizeMediaUrl(selectedItem.url) }
        : selectedItem;
      onInsert(nextItem);
      onClose();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Validasi Ukuran (Max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file terlalu besar! Maksimal 2MB.");
      return;
    }

    setIsUploading(true);

    // 2. Gunakan FormData untuk mengirim file
    const formData = new FormData();
    formData.append('file', file); // 'file' harus sama dengan $_FILES['file'] di PHP

    try {
      const response = await fetch('/api/media.php', {
        method: 'POST',
        body: formData,
      });

      const result = await safeJson(response);

      if (result.status === 'success') {
        // 3. Kirim data yang dikembalikan PHP (id, url, name, type) ke Parent
        if (onUploadSuccess) {
          onUploadSuccess(result.data);
        }
        setLibraryItems((prev) => [result.data, ...(prev || [])]);
        
        setActiveTab('library'); 
        setSelectedItem(result.data);
      } else {
        alert(result.message || "Gagal mengunggah file.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Terjadi kesalahan koneksi ke server.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-0 sm:p-4 animate-[fadeIn_0.2s_ease-in]">
      
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="bg-white w-full max-w-5xl h-full sm:h-[90vh] flex flex-col shadow-2xl relative rounded-sm overflow-hidden z-10">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-white">
          <h2 className="text-xl font-normal text-[#1d2327]">Sisipkan Media</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition p-1">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Tab Navigasi */}
        <div className="flex gap-4 px-4 pt-4 border-b border-gray-200 text-sm font-semibold text-gray-500 bg-white">
          <button 
            onClick={() => setActiveTab('upload')}
            className={`pb-3 transition-colors ${activeTab === 'upload' ? 'text-[#1d2327] border-b-4 border-[#2271b1] -mb-px' : 'hover:text-[#2271b1]'}`}
          >
            Unggah Berkas
          </button>
          <button 
            onClick={() => setActiveTab('library')}
            className={`pb-3 transition-colors ${activeTab === 'library' ? 'text-[#1d2327] border-b-4 border-[#2271b1] -mb-px' : 'hover:text-[#2271b1]'}`}
          >
            Pustaka Media
          </button>
        </div>
        
        {/* Konten Utama */}
        <div className="flex-1 p-4 bg-gray-50 overflow-y-auto">
          {activeTab === 'library' ? (
            displayedItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 content-start">
                {displayedItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedItem(item)}
                    className={`aspect-square bg-white relative cursor-pointer shadow-sm flex flex-col items-center justify-center box-border transition-all group ${
                      selectedItem?.id === item.id ? 'ring-4 ring-[#2271b1] ring-inset' : 'border border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {item.type === 'image' || item.url?.match(/\.(jpeg|jpg|gif|png|webp)$/) ? (
                      <img src={normalizeMediaUrl(item.url)} className="w-full h-full object-cover" alt={item.name} loading="lazy" />
                    ) : (
                      <div className="flex flex-col items-center p-2">
                        <FileText className="w-10 h-10 text-gray-400 mb-2 group-hover:text-red-500 transition-colors" />
                        <span className="text-[10px] text-gray-500 truncate w-full text-center px-1">{item.name}</span>
                      </div>
                    )}

                    {selectedItem?.id === item.id && (
                      <div className="absolute top-0 right-0 bg-[#2271b1] text-white w-6 h-6 flex items-center justify-center shadow-sm">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon className="w-16 h-16 mb-2 opacity-20" />
                {isLoadingLibrary ? (
                  <p>Memuat pustaka media...</p>
                ) : libraryError ? (
                  <p>{libraryError}</p>
                ) : (
                  <p>Tidak ada media ditemukan di pustaka.</p>
                )}
              </div>
            )
          ) : (
            /* Area Unggah Berkas */
            <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-gray-200 rounded-lg p-10 text-center">
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2271b1] mb-4"></div>
                  <p className="text-gray-600 font-medium">Sedang mengunggah...</p>
                </div>
              ) : (
                <>
                  <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="file-upload"
                    className="bg-white border-2 border-[#2271b1] text-[#2271b1] px-8 py-3 rounded-md font-bold hover:bg-blue-50 transition cursor-pointer shadow-sm active:scale-95"
                  >
                    Pilih Berkas
                  </label>
                  <p className="text-sm text-gray-400 mt-6">
                    Lepaskan berkas untuk mengunggah atau klik tombol di atas. <br />
                    Maksimal ukuran berkas: 2 MB.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Footer Modal */}
        <div className="p-4 border-t border-gray-200 flex justify-between items-center bg-white">
          <div className="flex flex-col">
            <span className="text-sm font-bold text-gray-700">
              {selectedItem ? '1 item dipilih' : '0 item dipilih'}
            </span>
            {selectedItem && (
              <span className="text-[11px] text-gray-400 truncate max-w-[200px]">
                {selectedItem.name}
              </span>
            )}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 font-medium"
            >
              Batal
            </button>
            <button 
              onClick={handleInsert}
              disabled={!selectedItem}
              className="bg-[#2271b1] text-white px-6 py-2 rounded-sm font-medium hover:bg-[#135e96] shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sisipkan ke Postingan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaModal;




