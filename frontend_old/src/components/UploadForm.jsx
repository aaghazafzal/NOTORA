import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, CheckCircle, Loader, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UploadForm = () => {
  const [bookFile, setBookFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const handleBookChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBookFile(e.target.files[0]);
    }
  };

  const handleCoverChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!bookFile || !coverFile || !title || !author) {
      return alert("Please fill all required fields and select both files (Book & Cover).");
    }

    const formData = new FormData();
    formData.append('book', bookFile);
    formData.append('cover', coverFile);
    formData.append('title', title);
    formData.append('author', author);
    formData.append('description', description);

    setUploading(true);
    try {
      await axios.post('http://localhost:9090/api/upload', formData, {
        onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
        }
      });
      setUploading(false);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please check the server connection.");
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-surface p-8 sm:p-10 rounded-2xl shadow-2xl shadow-black/50 border border-slate-700">
      <h2 className="text-3xl font-bold mb-8 flex items-center gap-3 text-white">
        <div className="bg-primary/20 p-3 rounded-xl text-primary">
            <UploadCloud size={32} />
        </div>
        Publish a New Book
      </h2>
      <form onSubmit={handleUpload} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Book Title *</label>
              <input 
                type="text" 
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-4 text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500"
                placeholder="e.g., The Great Gatsby"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Author *</label>
              <input 
                type="text" 
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-4 text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-500"
                placeholder="e.g., F. Scott Fitzgerald"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Description</label>
              <textarea 
                className="w-full bg-slate-800/50 border border-slate-600 rounded-xl p-4 text-textPrimary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all h-36 resize-none placeholder:text-slate-500"
                placeholder="A brief summary of the book..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Book Cover Image *</label>
              <div className="border-2 border-dashed border-slate-600 rounded-xl h-52 flex items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden bg-slate-800/30 group">
                 <input 
                   type="file" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                   onChange={handleCoverChange}
                   required
                   accept="image/*"
                 />
                 {coverPreview ? (
                   <img src={coverPreview} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500" />
                 ) : (
                   <div className="flex flex-col items-center gap-3 text-slate-400 p-4">
                      <div className="bg-slate-700/50 p-4 rounded-full group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                          <ImageIcon size={32} />
                      </div>
                      <span className="font-medium">Upload Cover Art</span>
                      <span className="text-xs text-slate-500">JPG, PNG, WebP</span>
                   </div>
                 )}
                 {coverPreview && (
                   <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none backdrop-blur-sm">
                     <span className="text-white font-semibold tracking-wide">Change Cover</span>
                   </div>
                 )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Book File (PDF/EPUB/MOBI) *</label>
              <div className="border-2 border-dashed border-slate-600 rounded-xl p-6 h-36 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer relative overflow-hidden bg-slate-800/30 group">
                 <input 
                   type="file" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                   onChange={handleBookChange}
                   required
                   accept=".pdf,.epub,.mobi,.zip,.rar"
                 />
                 {bookFile ? (
                   <div className="flex flex-col items-center gap-2">
                      <CheckCircle className="text-green-400" size={32} />
                      <span className="font-medium text-primary line-clamp-1 px-4">{bookFile.name}</span>
                      <span className="text-sm font-semibold text-slate-400">{(bookFile.size / (1024 * 1024)).toFixed(2)} MB</span>
                   </div>
                 ) : (
                   <div className="flex flex-col items-center gap-2 text-slate-400">
                      <UploadCloud size={32} className="group-hover:text-primary transition-colors" />
                      <span className="font-medium">Upload Book File</span>
                      <span className="text-xs text-slate-500">Max size: 300MB</span>
                   </div>
                 )}
              </div>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={uploading}
          className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white font-bold py-4 px-4 rounded-xl transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-lg shadow-lg shadow-primary/25"
        >
          {uploading ? (
            <>
               <Loader className="animate-spin" size={24} />
               Securely Uploading... {progress}%
            </>
          ) : (
            'Publish Book'
          )}
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
