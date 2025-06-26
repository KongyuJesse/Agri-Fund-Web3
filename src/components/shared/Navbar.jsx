import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full bg-gray-900 bg-opacity-95 z-50 shadow-md border-b border-blue-700">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-extrabold text-white">
          <span className="text-blue-400">🌾</span> AGRI-FUND
        </div>
        <nav>
          <ul className="flex space-x-6 text-sm md:text-base font-medium items-center text-white">
            <li><a href="/#home" className="hover:text-blue-400 transition-colors">Home</a></li>
            <li><a href="/#about" className="hover:text-blue-400 transition-colors">About Us</a></li>
            <li><a href="/#testimonials" className="hover:text-blue-400 transition-colors">Testimonials</a></li>
            <li>
              <button
                onClick={() => navigate('/login')}
                className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-full shadow text-white transition border border-blue-700"
              >
                Sign In
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate('/register')}
                className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-full shadow text-white transition"
              >
                Sign Up
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}