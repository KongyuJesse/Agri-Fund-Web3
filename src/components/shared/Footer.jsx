export default function Footer() {
  return (
    <footer className="bg-gray-900 text-center text-gray-400 py-6 text-sm border-t border-blue-700">
      © {new Date().getFullYear()} Agri-Fund. All rights reserved.
    </footer>
  );
}