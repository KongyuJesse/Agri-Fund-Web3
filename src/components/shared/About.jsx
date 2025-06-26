const teamMembers = [
  {
    name: 'Fongang Tonny',
    title: 'Scrum Master',
    image: '/team/tonny.jpg',
  },
  {
    name: 'Kongyu Jesse',
    title: 'Product Owner',
    image: '/team/jesse.jpg',
  },
  {
    name: 'Kuwan Randy',
    title: 'Development Team',
    image: '/team/randy.jpg',
  },
  {
    name: 'Forbah Grista',
    title: 'Development Team',
    image: '/team/grista.jpg',
  },
  {
    name: 'Timah Chelsie',
    title: 'Development Team',
    image: '/team/chelsie.jpg',
  },
  {
    name: 'Bongmoyong Daryl',
    title: 'Development Team',
    image: '/team/daryl.jpg',
  },
];

export default function About() {
  return (
    <section id="about" className="py-20 px-6 bg-gray-900 text-center">
      <h2 className="text-3xl md:text-4xl font-bold mb-6 text-blue-400">About Us</h2>
      <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-12">
        Meet the passionate team behind Agri-Fund. We bridge NGOs and farmers through secure blockchain innovation.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-xl p-6 shadow-lg text-white flex flex-col items-center border border-blue-700 hover:border-blue-500 transition-colors"
          >
            <img
              src={member.image}
              alt={member.name}
              className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-blue-600 shadow-md"
            />
            <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
            <p className="text-sm text-blue-400">{member.title}</p>
          </div>
        ))}
      </div>
    </section>
  );
}