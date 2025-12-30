import { Link } from 'react-router-dom';
import { Camera, Map, Sparkles, Layout } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Infinite Arch</h1>
            <p className="text-xl mb-8 text-primary-100">
              Beyond the Daydream
            </p>
            <Link to="/login" className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Map className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Mission-Based</h3>
            <p className="text-gray-600">
              Organize photos by trips and missions with separate galleries for public viewing
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Sparkles className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Dream Exploration</h3>
            <p className="text-gray-600">
              Discover the world beyond your daydreams through captivating photography
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Layout className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Customizable Layouts</h3>
            <p className="text-gray-600">
              Create diptychs, triptychs, and custom layouts for your galleries
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <Camera className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Infinite Perspectives</h3>
            <p className="text-gray-600">
              Capture moments that transcend ordinary reality and explore infinite possibilities
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to go beyond the daydream?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Start creating your photographic journeys with Infinite Arch
          </p>
          <Link to="/login" className="btn-primary text-lg px-8 py-3">
            Sign In with Google
          </Link>
        </div>
      </div>
    </div>
  );
}
