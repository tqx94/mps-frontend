
import { AuthForm } from "@/components/AuthForm"

function LoginPage() {
  return (
    <div className="h-screen bg-gray-50 overflow-hidden m-0 p-0">
      <div className="grid grid-cols-1 lg:grid-cols-2 h-screen m-0 p-0">
        <div className="hidden lg:block bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-12 overflow-hidden">
          <div className="text-white text-left max-w-md h-full flex flex-col justify-center">
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-4">Welcome Back</h1>
              <p className="text-xl text-orange-100 leading-relaxed">
                Sign in to your CoWork@mps-Kovan account and continue your productive journey
              </p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">⚡</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Quick Access</h3>
                  <p className="text-orange-100 text-sm">Get instant access to your workspace and continue where you left off</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
                  <p className="text-orange-100 text-sm">Monitor your productivity and manage your bookings efficiently</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🔒</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Secure & Private</h3>
                  <p className="text-orange-100 text-sm">Your data is protected with enterprise-grade security measures</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <p className="text-sm text-orange-100">
                "Success is not final, failure is not fatal: it is the courage to continue that counts. Keep pushing forward!"
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white h-screen overflow-y-auto">
          <div className="p-3 lg:p-4">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-3">
                <h2 className="text-base font-bold text-gray-900 mb-1">Sign In</h2>
                <p className="text-xs text-gray-600">Enter your credentials to access your account</p>
              </div>
              <AuthForm type="login" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage