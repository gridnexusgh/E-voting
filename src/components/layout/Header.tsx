import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Vote, LogIn, UserPlus, User, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/how-it-works", label: "How It Works" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
  ];

  const getDashboardLink = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin";
      case "election_officer":
        return "/election-officer/dashboard";
      case "auditor":
        return "/auditor/dashboard";
      case "student":
        return "/student/dashboard";
      default:
        return "/";
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isLandingPage
          ? "border-b border-white/10 bg-slate-950/80 text-white shadow-lg shadow-slate-950/20 backdrop-blur-xl"
          : "border-b border-slate-200/80 bg-white/90 text-slate-900 shadow-sm backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-lg sm:h-12 sm:w-12 ${isLandingPage ? "bg-blue-600" : "bg-slate-900"}`}>
            <Vote className="h-5 w-5 text-white sm:h-6 sm:w-6" />
          </div>
          <div className="hidden sm:block">
            <span className={`text-lg font-bold sm:text-xl ${isLandingPage ? "text-white" : "text-slate-900"}`}>
              HTU E-VOTING SYSTEM
            </span>
            <p className={`-mt-1 text-xs ${isLandingPage ? "text-slate-300" : "text-slate-500"}`}>
              Electronic Voting System
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`rounded-full px-4 py-2 font-medium transition-colors ${
                  isActive
                    ? isLandingPage
                      ? "bg-white/10 text-white"
                      : "bg-blue-50 text-blue-600"
                    : isLandingPage
                      ? "text-slate-300 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <Link
                to={getDashboardLink()}
                className={`flex items-center gap-2 rounded-full px-4 py-2 font-medium transition-colors ${
                  isLandingPage ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <button
                onClick={logout}
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 font-medium transition-colors ${
                  isLandingPage ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`flex items-center gap-2 rounded-full px-4 py-2.5 font-medium transition-colors ${
                  isLandingPage ? "text-slate-300 hover:bg-white/10 hover:text-white" : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <LogIn className="h-4 w-4" />
                <span>Login</span>
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 font-medium text-white shadow-md shadow-blue-950/20 transition-colors hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4" />
                <span>Register</span>
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`rounded-full p-2 transition-colors lg:hidden ${isLandingPage ? "hover:bg-white/10" : "hover:bg-slate-100"}`}
          aria-label="Toggle navigation"
        >
          {isMenuOpen ? (
            <X className={`h-6 w-6 ${isLandingPage ? "text-white" : "text-slate-700"}`} />
          ) : (
            <Menu className={`h-6 w-6 ${isLandingPage ? "text-white" : "text-slate-700"}`} />
          )}
        </button>
      </div>

      {isMenuOpen && (
        <div className={`border-t lg:hidden ${isLandingPage ? "border-white/10 bg-slate-950/95" : "border-slate-200 bg-white/95"}`}>
          <nav className="mx-auto max-w-7xl space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className={`block rounded-2xl px-4 py-3 font-medium transition-colors ${
                  location.pathname === link.to
                    ? isLandingPage
                      ? "bg-white/10 text-white"
                      : "bg-blue-50 text-blue-600"
                    : isLandingPage
                      ? "text-slate-300 hover:bg-white/10 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className={`space-y-2 border-t pt-3 ${isLandingPage ? "border-white/10" : "border-slate-200"}`}>
              {isAuthenticated ? (
                <>
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-2xl px-4 py-3 font-medium ${isLandingPage ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    <User className="h-5 w-5" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-2xl px-4 py-3 font-medium ${isLandingPage ? "text-red-300 hover:bg-white/10" : "text-red-600 hover:bg-red-50"}`}
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className={`block rounded-2xl px-4 py-3 text-center font-medium ${isLandingPage ? "text-slate-200 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"}`}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block rounded-2xl bg-blue-600 px-4 py-3 text-center font-medium text-white"
                  >
                    Register Now
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
