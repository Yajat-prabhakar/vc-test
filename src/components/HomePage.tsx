import React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Users, Video, Shield } from 'lucide-react';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Stethoscope className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TeleHealth Connect
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Secure, high-quality video consultations connecting patients with healthcare professionals
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Link to="/patient" className="group">
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group-hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Patient Portal</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Schedule and join video consultations with your healthcare provider from the comfort of your home.
              </p>
              <div className="flex items-center text-blue-600 font-medium">
                Join as Patient
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/doctor" className="group">
            <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 group-hover:scale-105">
              <div className="flex items-center mb-6">
                <div className="bg-teal-100 p-3 rounded-full mr-4">
                  <Stethoscope className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Doctor Portal</h2>
              </div>
              <p className="text-gray-600 mb-6">
                Conduct secure video consultations with your patients and manage appointments efficiently.
              </p>
              <div className="flex items-center text-teal-600 font-medium">
                Join as Doctor
                <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        <div className="bg-white/70 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Why Choose TeleHealth Connect?</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure & Private</h4>
              <p className="text-gray-600 text-sm">End-to-end encrypted video calls ensuring your privacy and compliance with healthcare standards.</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Video className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">HD Video Quality</h4>
              <p className="text-gray-600 text-sm">Crystal clear video and audio quality for effective medical consultations.</p>
            </div>
            <div className="text-center">
              <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                <Users className="w-8 h-8 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Easy to Use</h4>
              <p className="text-gray-600 text-sm">Intuitive interface designed for users of all technical skill levels.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;