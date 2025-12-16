import { AuthForm } from "@/components/AuthForm"

function SignUpPage() {
  return (
    <div className="h-screen bg-gray-50 overflow-hidden m-0 p-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen m-0 p-0">
        <div className="hidden lg:block bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-12 overflow-hidden">
          <div className="text-white text-left max-w-md h-full flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-4">Join CoWork@mps-Kovan</h1>
              <p className="text-xl text-orange-100 leading-relaxed">
                Create your account and start your productive journey in our modern workspace
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Flexible Workspace</h3>
                  <p className="text-orange-100 text-sm">Access to modern, well-equipped workspaces designed for productivity</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🎓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Student Discounts</h3>
                  <p className="text-orange-100 text-sm">Special rates for verified students with valid documentation</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Community</h3>
                  <p className="text-orange-100 text-sm">Connect with like-minded professionals and grow your network</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-orange-100">
                "The best investment you can make is in yourself. Join thousands of professionals who have transformed their productivity with us."
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white h-screen overflow-y-auto">
          <div className="p-3 lg:p-4">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-3">
                <h2 className="text-base font-bold text-gray-900 mb-1">Create Account</h2>
                <p className="text-xs text-gray-600">Fill in your details to get started</p>
              </div>
              <AuthForm type="signUp" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage