import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";

const Home: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">EduMentor</h1>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Welcome to EduMentor
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              Your AI-powered educational assistant. Upload PDFs and get instant answers to your questions.
            </p>
            
            <div className="mt-8 flex justify-center">
              {user ? (
                <Link to="/dashboard">
                  <Button size="lg" className="px-8">
                    Go to Your Dashboard
                  </Button>
                </Link>
              ) : (
                <div className="space-x-4">
                  <Link to="/register">
                    <Button size="lg" className="px-8">
                      Get Started
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="px-8">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900">PDF Analysis</h3>
                <p className="mt-2 text-gray-500">
                  Upload your study materials and get AI-powered insights and answers.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900">Interactive Learning</h3>
                <p className="mt-2 text-gray-500">
                  Ask questions in natural language and receive instant, helpful responses.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900">Study Smarter</h3>
                <p className="mt-2 text-gray-500">
                  Save time with AI that understands your documents and helps you learn faster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; 2025 EduMentor. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;