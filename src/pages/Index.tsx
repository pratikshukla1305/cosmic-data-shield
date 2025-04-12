
import { Lock, Shield, Globe } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A237E] via-[#37474F] to-[#263238] text-white flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl text-center space-y-6">
        <Shield className="mx-auto text-white w-24 h-24 mb-6" strokeWidth={1} />
        <h1 className="text-5xl font-bold mb-4 tracking-tight">Cosmic Data Shield</h1>
        <p className="text-xl text-gray-300 mb-8">
          Protecting your digital frontier with advanced, comprehensive security solutions
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<Lock className="w-12 h-12 text-blue-300" />}
            title="Data Protection"
            description="Robust encryption and secure data handling"
          />
          <FeatureCard 
            icon={<Globe className="w-12 h-12 text-green-300" />}
            title="Global Coverage"
            description="Comprehensive security across digital landscapes"
          />
          <FeatureCard 
            icon={<Shield className="w-12 h-12 text-purple-300" />}
            title="Proactive Defense"
            description="Continuous monitoring and threat prevention"
          />
        </div>
        
        <button className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
          Get Started
        </button>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 text-center hover:bg-white/20 transition-all">
    <div className="flex justify-center mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-300 text-sm">{description}</p>
  </div>
);

export default Index;
