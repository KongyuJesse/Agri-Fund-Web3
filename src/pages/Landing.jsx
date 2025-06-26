import Navbar from '../components/shared/Navbar.jsx';
import Hero from '../components/shared/Hero.jsx';
import About from '../components/shared/About.jsx';
import Testimonials from '../components/shared/Testimonials.jsx';
import Footer from '../components/shared/Footer.jsx';

export default function Landing() {
  return (
    <div className="font-sans bg-gradient-to-b from-blue-900 to-blue-950 text-white">
      <Navbar />
      <Hero />
      <About />
      <Testimonials />
      <Footer />
    </div>
  );
}
