import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section
      id="home"
      className="h-screen flex items-center justify-center text-center px-4 pt-24 bg-cover bg-center"
      style={{ backgroundImage: "url('/introduction1.png')" }}
    >
      <div className="bg-gray-900 bg-opacity-80 p-6 md:p-10 rounded-lg max-w-3xl border border-blue-700">
        <h2 className="text-4xl md:text-5xl font-bold mb-4 text-blue-400">WELCOME TO AGRI-FUND</h2>
        <p className="text-lg text-gray-300 mb-6 leading-relaxed">
          Agri-Fund is a groundbreaking decentralized Web3 platform designed to revolutionize agricultural funding. We connect NGOs directly with farmers using smart contracts, ensuring transparency, speed, and accountability. Powered by the Polygon blockchain and secure document storage via IPFS, we eliminate middlemen and empower local communities by enabling direct sponsorship, smart contract-based agreements, and real-time fund disbursement. Whether you're an NGO, donor, or farmer, Agri-Fund brings clarity and trust to agricultural finance. Our mission is to create a sustainable ecosystem where donations, grants, and contracts are traceable, immutable, and impactful.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-full text-white font-semibold text-lg shadow transition-colors"
        >
          Get Started
        </button>
      </div>
    </section>
  );
}