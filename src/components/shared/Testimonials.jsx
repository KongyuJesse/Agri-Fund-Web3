export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 px-6 bg-gray-900 text-center border-t border-b border-blue-700">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-blue-400">Testimonials</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto text-gray-300">
        <div className="bg-blue-800 p-6 rounded-lg shadow-lg">
          <p>"Agri-Fund helped us reach farmers transparently and quickly. The system is efficient, intuitive, and reliable. It's revolutionizing how we interact with small-scale farmers."</p>
          <h4 className="mt-4 font-semibold">— GreenEarth NGO</h4>
        </div>
        <div className="bg-blue-800 p-6 rounded-lg shadow-lg">
          <p>"Smart contracts gave us peace of mind. Every transaction is traceable and secure. We've cut down manual paperwork and delays by more than 70%."</p>
          <h4 className="mt-4 font-semibold">— Farmer, Jos</h4>
        </div>
        <div className="bg-blue-800 p-6 rounded-lg shadow-lg">
          <p>"IPFS documents made our partnership legal and organized. We love the transparency and reliability that Agri-Fund offers."</p>
          <h4 className="mt-4 font-semibold">— AgroAid Foundation</h4>
        </div>
        <div className="bg-blue-800 p-6 rounded-lg shadow-lg">
          <p>"Thanks to Agri-Fund, we've reached communities that were previously beyond our funding scope. Everything from onboarding to impact reporting is simplified."</p>
          <h4 className="mt-4 font-semibold">— RuralRoots Initiative</h4>
        </div>
        <div className="bg-blue-800 p-6 rounded-lg shadow-lg">
          <p>"Agri-Fund restored trust in the donation process. We now have full visibility into where our funds go and how they're being used."</p>
          <h4 className="mt-4 font-semibold">— Donor Circle</h4>
        </div>
        <div className="bg-blue-800 p-6 rounded-lg shadow-lg">
          <p>"Implementing Agri-Fund has elevated our program's credibility. It's a must-have for any NGO seeking transparency and efficiency."</p>
          <h4 className="mt-4 font-semibold">— HarvestPlus Alliance</h4>
        </div>
      </div>
    </section>
  );
}
