import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Download, User, Calendar, Loader, FileText } from 'lucide-react';

const BookList = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:9090/api/books')
      .then(res => {
        setBooks(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleDownload = (id, filename) => {
    window.open(`http://localhost:9090/api/download/${id}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-4xl font-extrabold mb-10 text-white tracking-tight flex items-center gap-3">
        Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Books</span>
      </h2>
      
      {books.length === 0 ? (
        <div className="text-center text-textSecondary bg-surface p-16 rounded-2xl border border-slate-700 shadow-xl">
          <FileText size={64} className="mx-auto mb-6 text-slate-500 opacity-50" />
          <p className="text-2xl font-medium text-slate-300">No books found in the library.</p>
          <p className="mt-3 text-lg">Be the first to share an amazing book with the world!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {books.map(book => (
            <div key={book._id} className="bg-surface rounded-2xl overflow-hidden shadow-xl border border-slate-700 hover:border-primary hover:shadow-primary/20 transition-all duration-300 group flex flex-col h-full relative">
              
              <div className="relative h-72 w-full bg-slate-800 overflow-hidden">
                <img 
                  src={book.coverUrl} 
                  alt={book.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-in-out"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x600?text=No+Cover';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent opacity-100"></div>
              </div>

              <div className="p-6 flex flex-col flex-grow relative -mt-16 z-10">
                <div className="bg-slate-800/90 backdrop-blur-md px-3 py-1.5 rounded-full w-max text-xs font-bold text-primary mb-4 border border-slate-700 shadow-sm">
                  {(book.size / (1024 * 1024)).toFixed(1)} MB
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {book.title}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-slate-300 mb-4 font-medium">
                  <User size={14} className="text-primary" />
                  <span>{book.author}</span>
                </div>
                
                {book.description && (
                  <p className="text-slate-400 text-sm line-clamp-3 mb-6 flex-grow leading-relaxed">
                    {book.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-700/50">
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Calendar size={12} />
                    {new Date(book.uploadDate).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handleDownload(book._id, book.filename)}
                    className="bg-primary hover:bg-primaryHover text-white font-medium py-2 px-4 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-95"
                  >
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookList;
