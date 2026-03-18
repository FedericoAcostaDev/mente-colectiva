import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function HomePage() {
  const [userInfo, setUserInfo] = useState();
  const [hasToken, setHasToken] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("userDetails");
    console.log("User Data from localStorage:", userData);

    if (userData) {
      setUserInfo(JSON.parse(userData));
    }
    if (token) {
      setHasToken(!!token);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setHasToken(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col" style={{ padding: "20px" }}>
      
      {/* Navbar */}
      <nav
        className="flex justify-between items-center bg-slate-900 shadow-md rounded-xl"
        style={{ padding: "15px 25px", marginBottom: "20px" }}
      >
        <h1 className="text-2xl font-bold">MyWebsite</h1>

        <div className="flex gap-6 text-sm font-medium">
          {!hasToken ? (
            <>
              <Link to="/auth/login" className="hover:text-blue-400 transition">
                Login
              </Link>
              <Link to="/auth/signup" className="hover:text-blue-400 transition">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <span className="capitalize">{userInfo?.name}</span>

              {/* ✅ History Button Added */}
              <Link
                to="/history"
                className="hover:text-blue-400 transition"
              >
                History
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-400 hover:text-red-500 transition font-semibold"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <header
        className="flex flex-col items-center justify-center text-center flex-1 bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl shadow-lg"
        style={{ padding: "60px 20px", marginBottom: "30px" }}
      >
        <h2 className="text-4xl md:text-6xl font-extrabold mb-4">
          Welcome to <span className="text-blue-500">Your Next App</span>
        </h2>

        <p className="max-w-xl text-slate-300 text-lg md:text-xl mb-6">
          A modern platform built for speed, performance, and beautiful user experience.
        </p>

        <div className="flex gap-4" style={{ margin: "20px" }}>
          <Link
            to="/joinRoom"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
            style={{ padding: "10px", margin: "10px" }}
          >
            Join Room
          </Link>

          <Link
            to="/demo"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
            style={{ padding: "10px", margin: "10px" }}
          >
            Demo
          </Link>
        </div>
      </header>

      {/* Features Section */}
      <section
        id="features"
        className="text-center bg-slate-900/70 rounded-xl shadow-md"
        style={{ padding: "10px 30px" }}
      >
        <h3 className="text-3xl font-bold mb-10">Features</h3>

        <div className="flex justify-center mx-auto flex-wrap gap-8" style={{ padding: "10px" }}>
          <div className="p-6 bg-slate-800 rounded-2xl shadow hover:shadow-lg transition" style={{ padding: "10px" }}>
            <h4 className="text-xl font-semibold mb-2">Fast</h4>
            <p className="text-slate-400">Optimized for top-tier performance and responsiveness.</p>
          </div>

          <div className="p-6 bg-slate-800 rounded-2xl shadow hover:shadow-lg transition" style={{ padding: "10px" }}>
            <h4 className="text-xl font-semibold mb-2">Secure</h4>
            <p className="text-slate-400">Built with modern security best practices.</p>
          </div>

          <div className="p-6 bg-slate-800 rounded-2xl shadow hover:shadow-lg transition" style={{ padding: "10px" }}>
            <h4 className="text-xl font-semibold mb-2">Beautiful</h4>
            <p className="text-slate-400">Crafted with stunning UI and smooth interactions.</p>
          </div>

          <div className="p-6 bg-slate-800 rounded-2xl shadow hover:shadow-lg transition" style={{ padding: "10px" }}>
            <h4 className="text-xl font-semibold mb-2">Collaborative</h4>
            <p className="text-slate-400">Real-time collaboration tools built for teams.</p>
          </div>

          <div className="p-6 bg-slate-800 rounded-2xl shadow hover:shadow-lg transition" style={{ padding: "10px" }}>
            <h4 className="text-xl font-semibold mb-2">Customizable</h4>
            <p className="text-slate-400">Tailor the experience with flexible UI options.</p>
          </div>

          <div className="p-6 bg-slate-800 rounded-2xl shadow hover:shadow-lg transition" style={{ padding: "10px" }}>
            <h4 className="text-xl font-semibold mb-2">Cloud Ready</h4>
            <p className="text-slate-400">Fully optimized for cloud deployment and scaling.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="contact"
        className="text-center bg-slate-900 text-slate-500 text-sm rounded-xl"
        style={{ padding: "20px", marginTop: "20px" }}
      >
        © {new Date().getFullYear()} MyWebsite — All Rights Reserved.
      </footer>
    </div>
  );
}
