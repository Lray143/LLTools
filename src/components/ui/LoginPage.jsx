// src/components/LoginPage.jsx

// This component is responsible for ONLY the login screen.
// It receives onLogin as a prop — a function from App.jsx
// that gets called when the user clicks Log In.

function LoginPage({ onLogin }) {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-80">
        <img
          src="/Logo.png"
          alt="Logo"
          className="w-32 mx-auto mb-6 object-contain"
        />
        <h1 className="text-xl font-bold text-center mb-6">Login</h1>
        <button
          onClick={onLogin}
          className="w-full bg-orange-500 text-white py-2 rounded-md text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Log In
        </button>
      </div>
    </div>
  )
}

export default LoginPage