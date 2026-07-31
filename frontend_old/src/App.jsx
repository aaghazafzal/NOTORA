import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { BookOpen, Upload } from 'lucide-react';
import BookList from './components/BookList';
import UploadForm from './components/UploadForm';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-textPrimary">
        <nav className="bg-surface shadow-md p-4 sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <Link to="/" className="text-2xl font-bold flex items-center gap-2 text-primary">
              <BookOpen size={28} />
              Notora Books
            </Link>
            <div className="flex gap-4">
              <Link to="/" className="hover:text-primary transition-colors">Library</Link>
              <Link to="/upload" className="flex items-center gap-1 bg-primary text-white px-4 py-2 rounded-md hover:bg-primaryHover transition-colors">
                <Upload size={18} />
                Upload Book
              </Link>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto p-4 py-8">
          <Routes>
            <Route path="/" element={<BookList />} />
            <Route path="/upload" element={<UploadForm />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
