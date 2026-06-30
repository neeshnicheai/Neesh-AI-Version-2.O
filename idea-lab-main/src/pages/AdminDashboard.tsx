import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  getAdminUsers,
  getAdminRoles,
  getAdminCoupons,
  createAdminRole,
  deleteAdminRole,
  createAdminCoupon,
  deleteAdminCoupon,
  type AdminUser,
  type AdminRoleDTO,
  type CouponDTO,
} from "@/lib/adminApi";
import { toast } from "sonner";
import {
  Users,
  ShieldCheck,
  Ticket,
  LogOut,
  Plus,
  Trash2,
  Copy,
  Loader2,
  Crown,
  Calendar,
  Mail,
  Briefcase,
  FolderOpen,
  Clock,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  DollarSign,
  ChevronDown,
} from "lucide-react";

// ─── Helpers ───
function daysSince(dateStr: string | null): number {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}
function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Tab type ───
type Tab = "users" | "roles" | "coupons";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, adminName, adminLogout, loading: authLoading } = useAdminAuth();

  // Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<AdminRoleDTO[]>([]);
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>("users");

  // Role form
  const [roleUsername, setRoleUsername] = useState("");
  const [rolePassword, setRolePassword] = useState("");
  const [roleDisplayName, setRoleDisplayName] = useState("");
  const [showRolePassword, setShowRolePassword] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);

  // Coupon form
  const [couponCode, setCouponCode] = useState("");
  const [couponName, setCouponName] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("");
  const [couponExpiry, setCouponExpiry] = useState("");
  const [couponMaxUses, setCouponMaxUses] = useState("");
  const [creatingCoupon, setCreatingCoupon] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/login");
    }
  }, [authLoading, isAdmin, navigate]);

  // Load data
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [u, r, c] = await Promise.all([
        getAdminUsers(),
        getAdminRoles(),
        getAdminCoupons(),
      ]);
      setUsers(u);
      setRoles(r);
      setCoupons(c);
    } catch (err) {
      console.error("Failed to load admin data:", err);
      toast.error("Failed to load admin data");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  // Handlers
  const handleLogout = () => {
    adminLogout();
    navigate("/login");
  };

  const handleCreateRole = async () => {
    if (!roleUsername || !rolePassword) {
      toast.error("Username and password are required");
      return;
    }
    setCreatingRole(true);
    try {
      await createAdminRole(roleUsername, rolePassword, roleDisplayName || roleUsername);
      toast.success("Admin role created!");
      setRoleUsername("");
      setRolePassword("");
      setRoleDisplayName("");
      const r = await getAdminRoles();
      setRoles(r);
    } catch (err: any) {
      toast.error(err.message || "Failed to create role");
    } finally {
      setCreatingRole(false);
    }
  };

  const handleDeleteRole = async (id: string) => {
    try {
      await deleteAdminRole(id);
      toast.success("Role deleted");
      setRoles((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete role");
    }
  };

  const handleCreateCoupon = async () => {
    if (!couponCode || !couponName || !couponDiscount) {
      toast.error("Code, name, and discount are required");
      return;
    }
    setCreatingCoupon(true);
    try {
      await createAdminCoupon({
        code: couponCode.toUpperCase(),
        name: couponName,
        discountPercentage: parseInt(couponDiscount),
        expiryDate: couponExpiry ? new Date(couponExpiry).toISOString() : null,
        maxUses: parseInt(couponMaxUses) || 9999,
      });
      toast.success("Coupon created!");
      setCouponCode("");
      setCouponName("");
      setCouponDiscount("");
      setCouponExpiry("");
      setCouponMaxUses("");
      const c = await getAdminCoupons();
      setCoupons(c);
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon");
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await deleteAdminCoupon(id);
      toast.success("Coupon deleted");
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon");
    }
  };

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Coupon code "${code}" copied to clipboard!`);
  };

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => daysSince(u.updatedAt) <= 7).length;
  const inactiveUsers = users.filter((u) => daysSince(u.updatedAt) > 7).length;

  if (authLoading || !isAdmin) {
    return (
      <div className="admin-bg min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <>
      {/* Inline styles for the futuristic dark theme */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;900&family=Inter:wght@300;400;500;600;700&display=swap');

        .admin-bg {
          background: #05070a;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
          font-family: 'Inter', sans-serif;
        }

        .admin-bg::before {
          content: '';
          position: fixed;
          inset: 0;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(0, 255, 255, 0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, rgba(120, 0, 255, 0.05) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 90%, rgba(0, 200, 255, 0.03) 0%, transparent 60%);
          pointer-events: none;
          z-index: 0;
        }

        /* Animated grid background */
        .admin-bg::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image:
            linear-gradient(rgba(0, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: gridMove 20s linear infinite;
          pointer-events: none;
          z-index: 0;
        }

        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(60px); }
        }

        .admin-content {
          position: relative;
          z-index: 1;
        }

        .font-orbitron { font-family: 'Orbitron', monospace; }

        /* Glassmorphism card */
        .glass-card {
          background: rgba(10, 15, 30, 0.7);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 255, 255, 0.1);
          border-radius: 16px;
          transition: all 0.35s cubic-bezier(.4,0,.2,1);
          position: relative;
          overflow: hidden;
        }

        .glass-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.4), transparent);
        }

        .glass-card:hover {
          border-color: rgba(0, 255, 255, 0.25);
          box-shadow: 0 0 30px rgba(0, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        /* User card states */
        .user-card-active {
          border-color: rgba(0, 255, 150, 0.25);
          box-shadow: 0 0 20px rgba(0, 255, 150, 0.06), inset 0 0 40px rgba(0, 255, 150, 0.02);
        }
        .user-card-active::before {
          background: linear-gradient(90deg, transparent, rgba(0, 255, 150, 0.5), transparent);
        }
        .user-card-active:hover {
          border-color: rgba(0, 255, 150, 0.45);
          box-shadow: 0 0 40px rgba(0, 255, 150, 0.12);
        }

        .user-card-inactive {
          border-color: rgba(255, 50, 50, 0.25);
          box-shadow: 0 0 20px rgba(255, 50, 50, 0.06), inset 0 0 40px rgba(255, 50, 50, 0.02);
        }
        .user-card-inactive::before {
          background: linear-gradient(90deg, transparent, rgba(255, 50, 50, 0.5), transparent);
        }
        .user-card-inactive:hover {
          border-color: rgba(255, 50, 50, 0.45);
          box-shadow: 0 0 40px rgba(255, 50, 50, 0.12);
        }

        /* Stats card */
        .stat-card {
          background: rgba(10, 15, 30, 0.6);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 255, 255, 0.12);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: all 0.35s ease;
        }
        .stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--stat-color), transparent);
        }
        .stat-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 8px 32px rgba(0, 255, 255, 0.1);
        }

        /* Tab button */
        .tab-btn {
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          background: rgba(255,255,255,0.03);
          color: rgba(255,255,255,0.5);
        }
        .tab-btn:hover {
          background: rgba(0, 255, 255, 0.06);
          color: rgba(255,255,255,0.8);
        }
        .tab-btn.active {
          background: rgba(0, 255, 255, 0.1);
          border-color: rgba(0, 255, 255, 0.3);
          color: #00ffff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.1);
        }

        /* Form input */
        .admin-input {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #e0e0e0;
          font-size: 14px;
          width: 100%;
          transition: all 0.3s ease;
          outline: none;
          font-family: 'Inter', sans-serif;
        }
        .admin-input:focus {
          border-color: rgba(0, 255, 255, 0.4);
          box-shadow: 0 0 16px rgba(0, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.06);
        }
        .admin-input::placeholder {
          color: rgba(255,255,255,0.25);
        }

        /* Action button */
        .btn-neon {
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.15), rgba(120, 0, 255, 0.15));
          border: 1px solid rgba(0, 255, 255, 0.3);
          color: #00ffff;
          padding: 10px 20px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
        }
        .btn-neon:hover {
          background: linear-gradient(135deg, rgba(0, 255, 255, 0.25), rgba(120, 0, 255, 0.25));
          box-shadow: 0 0 24px rgba(0, 255, 255, 0.15);
          transform: translateY(-1px);
        }
        .btn-neon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .btn-danger {
          background: rgba(255, 50, 50, 0.1);
          border: 1px solid rgba(255, 50, 50, 0.3);
          color: #ff5555;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
        }
        .btn-danger:hover {
          background: rgba(255, 50, 50, 0.2);
          box-shadow: 0 0 16px rgba(255, 50, 50, 0.1);
        }

        .btn-copy {
          background: rgba(0, 200, 255, 0.08);
          border: 1px solid rgba(0, 200, 255, 0.2);
          color: #00c8ff;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
        }
        .btn-copy:hover {
          background: rgba(0, 200, 255, 0.15);
          box-shadow: 0 0 12px rgba(0, 200, 255, 0.1);
        }

        /* Subscription badge */
        .sub-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: linear-gradient(135deg, #f59e0b, #ef4444);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
        }

        .sub-badge.free {
          background: linear-gradient(135deg, rgba(100, 116, 139, 0.6), rgba(71, 85, 105, 0.6));
          box-shadow: none;
        }

        /* Scrollbar */
        .admin-bg ::-webkit-scrollbar {
          width: 6px;
        }
        .admin-bg ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .admin-bg ::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.2);
          border-radius: 3px;
        }

        /* Floating orbs */
        .orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          pointer-events: none;
          z-index: 0;
          animation: orbFloat 12s ease-in-out infinite alternate;
        }
        @keyframes orbFloat {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
          100% { transform: translate(-20px, 15px) scale(0.95); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out forwards;
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.1); }
          50% { box-shadow: 0 0 40px rgba(0, 255, 255, 0.2); }
        }
      `}</style>

      <div className="admin-bg">
        {/* Floating orbs */}
        <div className="orb" style={{ width: 300, height: 300, background: 'rgba(0, 255, 255, 0.08)', top: '10%', left: '5%' }} />
        <div className="orb" style={{ width: 200, height: 200, background: 'rgba(120, 0, 255, 0.08)', top: '60%', right: '10%', animationDelay: '3s' }} />
        <div className="orb" style={{ width: 250, height: 250, background: 'rgba(0, 200, 255, 0.06)', bottom: '10%', left: '40%', animationDelay: '6s' }} />

        <div className="admin-content px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] mx-auto">
          {/* ─── Header ─── */}
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 animate-fade-in-up">
            <div>
              <h1 className="font-orbitron text-2xl sm:text-3xl font-bold text-white tracking-wider">
                <span style={{ color: '#00ffff' }}>NEESH</span> AI
                <span className="block text-sm font-normal text-gray-400 mt-1 tracking-normal" style={{ fontFamily: 'Inter' }}>
                  Admin Control Center
                </span>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'rgba(0,255,255,0.06)', border: '1px solid rgba(0,255,255,0.15)' }}>
                <Crown className="w-4 h-4" style={{ color: '#00ffff' }} />
                <span className="text-sm font-medium text-gray-300">{adminName || "Admin"}</span>
              </div>
              <button onClick={handleLogout} className="btn-danger" title="Logout">
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </header>

          {/* ─── Stats ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="stat-card" style={{ "--stat-color": "#00ffff" } as React.CSSProperties}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-5 h-5" style={{ color: '#00ffff' }} />
                <span className="text-xs uppercase tracking-widest text-gray-400">Total Users</span>
              </div>
              <p className="font-orbitron text-4xl font-bold text-white">{totalUsers}</p>
            </div>
            <div className="stat-card" style={{ "--stat-color": "#00ff96" } as React.CSSProperties}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <UserCheck className="w-5 h-5" style={{ color: '#00ff96' }} />
                <span className="text-xs uppercase tracking-widest text-gray-400">Active Users</span>
              </div>
              <p className="font-orbitron text-4xl font-bold" style={{ color: '#00ff96' }}>{activeUsers}</p>
            </div>
            <div className="stat-card" style={{ "--stat-color": "#ff5555" } as React.CSSProperties}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <UserX className="w-5 h-5" style={{ color: '#ff5555' }} />
                <span className="text-xs uppercase tracking-widest text-gray-400">Inactive (&gt;7 days)</span>
              </div>
              <p className="font-orbitron text-4xl font-bold" style={{ color: '#ff5555' }}>{inactiveUsers}</p>
            </div>
          </div>

          {/* ─── Tabs ─── */}
          <div className="flex gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <button className={`tab-btn ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
              <Users className="w-4 h-4" /> Users
            </button>
            <button className={`tab-btn ${activeTab === "roles" ? "active" : ""}`} onClick={() => setActiveTab("roles")}>
              <ShieldCheck className="w-4 h-4" /> Admin Roles
            </button>
            <button className={`tab-btn ${activeTab === "coupons" ? "active" : ""}`} onClick={() => setActiveTab("coupons")}>
              <Ticket className="w-4 h-4" /> Coupon Codes
            </button>
          </div>

          {/* ─── Content ─── */}
          {loadingData ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#00ffff' }} />
            </div>
          ) : (
            <>
              {/* ═══ Users Tab ═══ */}
              {activeTab === "users" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {users.map((user) => {
                    const inactive = daysSince(user.updatedAt) > 7;
                    const isExpanded = expandedUserId === user.id;
                    return (
                      <div
                        key={user.id}
                        className={`glass-card p-5 relative cursor-pointer ${inactive ? "user-card-inactive" : "user-card-active"}`}
                        onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                      >
                        {/* Subscription badge */}
                        <div className={`sub-badge ${user.subscriptionPlan === "Free" ? "free" : ""}`}>
                          {user.subscriptionPlan}
                        </div>

                        {/* Avatar + Name */}
                        <div className="flex items-center gap-3 mb-4 pr-20">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold shrink-0"
                            style={{
                              background: inactive
                                ? "linear-gradient(135deg, rgba(255,50,50,0.25), rgba(200,0,0,0.15))"
                                : "linear-gradient(135deg, rgba(0,255,150,0.25), rgba(0,200,255,0.15))",
                              border: `1px solid ${inactive ? 'rgba(255,50,50,0.3)' : 'rgba(0,255,150,0.3)'}`,
                            }}
                          >
                            {(user.name || user.email || "?")[0].toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-white font-semibold text-sm truncate">
                              {user.name || "Unnamed User"}
                            </h3>
                            <div className="flex items-center gap-1 text-gray-400 text-xs">
                              <Mail className="w-3 h-3 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: '#00c8ff' }} />
                            <div>
                              <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Joined</span>
                              <span className="text-gray-300">{formatDate(user.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: inactive ? '#ff5555' : '#00ff96' }} />
                            <div>
                              <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Last Active</span>
                              <span style={{ color: inactive ? '#ff5555' : '#00ff96' }}>{formatDate(user.updatedAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <FolderOpen className="w-3.5 h-3.5 shrink-0" style={{ color: '#a78bfa' }} />
                            <div>
                              <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Projects</span>
                              <span className="text-gray-300">{user.projectCount}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: '#fbbf24' }} />
                            <div>
                              <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Occupation</span>
                              <span className="text-gray-300 truncate block max-w-[100px]">{user.occupation || "N/A"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Expand indicator */}
                        <div className="flex items-center justify-center mt-3">
                          <ChevronDown
                            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>

                        {/* ══ Expandable subscription/payment details ══ */}
                        <div
                          className={`overflow-hidden transition-all duration-400 ease-in-out ${isExpanded ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                            <h4 className="font-orbitron text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: '#00c8ff' }}>
                              Subscription & Payment
                            </h4>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Crown className="w-3.5 h-3.5 shrink-0" style={{ color: '#f59e0b' }} />
                                <div>
                                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Plan</span>
                                  <span className="text-gray-300 font-semibold">{user.subscriptionPlan}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <DollarSign className="w-3.5 h-3.5 shrink-0" style={{ color: '#22c55e' }} />
                                <div>
                                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Payment</span>
                                  <span className="text-gray-300">
                                    {user.paymentAmount != null ? `$${user.paymentAmount.toFixed(2)}` : 'N/A'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Ticket className="w-3.5 h-3.5 shrink-0" style={{ color: '#818cf8' }} />
                                <div>
                                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Coupon Used</span>
                                  <span className="text-gray-300">{user.couponUsed || 'None'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-400">
                                <Calendar className="w-3.5 h-3.5 shrink-0" style={{ color: '#06b6d4' }} />
                                <div>
                                  <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Payment Date</span>
                                  <span className="text-gray-300">{user.paymentDate ? formatDate(user.paymentDate) : 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Subscription Expiry Timer */}
                            {user.subscriptionExpiresAt && user.subscriptionPlan !== "Free" && (() => {
                              const expiresAt = new Date(user.subscriptionExpiresAt);
                              const now = new Date();
                              const diffMs = expiresAt.getTime() - now.getTime();
                              const daysLeft = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
                              const timerColor = daysLeft <= 5 ? '#ff5555' : daysLeft <= 10 ? '#fbbf24' : '#00ff96';
                              return (
                                <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                  <Clock className="w-3.5 h-3.5 shrink-0" style={{ color: timerColor }} />
                                  <div>
                                    <span className="block text-gray-500 text-[10px] uppercase tracking-wider">Subscription Timer</span>
                                    <span className="text-xs font-semibold" style={{ color: timerColor }}>
                                      {daysLeft > 0 ? `⏳ Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : '⚠️ Subscription expired'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Promoted Blogs & Tags */}
                            {(user.promotedBlogCount > 0 || (user.promotionTags && user.promotionTags.length > 0)) && (
                              <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-2">
                                  <span style={{ color: '#f472b6' }}>📢</span>
                                  <span className="text-gray-500 text-[10px] uppercase tracking-wider">Advertised Blogs</span>
                                  <span className="text-gray-300 font-semibold">{user.promotedBlogCount}</span>
                                </div>
                                {user.promotionTags && user.promotionTags.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {user.promotionTags.map((tag: string) => (
                                      <span
                                        key={tag}
                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                        style={{
                                          background: 'rgba(0, 255, 255, 0.08)',
                                          border: '1px solid rgba(0, 255, 255, 0.2)',
                                          color: '#00e5ff',
                                        }}
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status indicator bar */}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-[2px]"
                          style={{
                            background: inactive
                              ? "linear-gradient(90deg, transparent, #ff5555, transparent)"
                              : "linear-gradient(90deg, transparent, #00ff96, transparent)",
                          }}
                        />
                      </div>
                    );
                  })}
                  {users.length === 0 && (
                    <div className="col-span-full text-center py-16 text-gray-500">No users found.</div>
                  )}
                </div>
              )}

              {/* ═══ Roles Tab ═══ */}
              {activeTab === "roles" && (
                <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {/* Create role form */}
                  <div className="glass-card p-6 mb-6">
                    <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#00ffff' }}>
                      CREATE NEW ADMIN ROLE
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <input
                        className="admin-input"
                        placeholder="Username (email)"
                        value={roleUsername}
                        onChange={(e) => setRoleUsername(e.target.value)}
                      />
                      <div className="relative">
                        <input
                          className="admin-input pr-10"
                          type={showRolePassword ? "text" : "password"}
                          placeholder="Password"
                          value={rolePassword}
                          onChange={(e) => setRolePassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                          onClick={() => setShowRolePassword(!showRolePassword)}
                        >
                          {showRolePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <input
                        className="admin-input"
                        placeholder="Display Name"
                        value={roleDisplayName}
                        onChange={(e) => setRoleDisplayName(e.target.value)}
                      />
                    </div>
                    <button className="btn-neon" onClick={handleCreateRole} disabled={creatingRole}>
                      {creatingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Create Role
                    </button>
                  </div>

                  {/* Roles list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {roles.map((role) => (
                      <div key={role.id} className="glass-card p-5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="w-4 h-4" style={{ color: '#00ffff' }} />
                            <span className="text-white font-semibold text-sm">{role.displayName}</span>
                          </div>
                          <p className="text-gray-400 text-xs">{role.username}</p>
                          <p className="text-gray-500 text-[10px] mt-1">Created: {formatDate(role.createdAt)}</p>
                        </div>
                        <button className="btn-danger" onClick={() => handleDeleteRole(role.id)} title="Delete role">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {roles.length === 0 && (
                      <div className="col-span-full text-center py-12 text-gray-500">No admin roles created yet.</div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══ Coupons Tab ═══ */}
              {activeTab === "coupons" && (
                <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                  {/* Create coupon form */}
                  <div className="glass-card p-6 mb-6">
                    <h3 className="font-orbitron text-sm font-semibold mb-4" style={{ color: '#00ffff' }}>
                      CREATE NEW COUPON CODE
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                      <input
                        className="admin-input"
                        placeholder="Coupon Code (e.g. LAUNCH50)"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      />
                      <input
                        className="admin-input"
                        placeholder="Occasion / Name"
                        value={couponName}
                        onChange={(e) => setCouponName(e.target.value)}
                      />
                      <input
                        className="admin-input"
                        type="number"
                        placeholder="Discount %"
                        min="1"
                        max="100"
                        value={couponDiscount}
                        onChange={(e) => setCouponDiscount(e.target.value)}
                      />
                      <input
                        className="admin-input"
                        type="datetime-local"
                        placeholder="Expiry Date"
                        value={couponExpiry}
                        onChange={(e) => setCouponExpiry(e.target.value)}
                      />
                      <input
                        className="admin-input"
                        type="number"
                        placeholder="Max Uses"
                        min="1"
                        value={couponMaxUses}
                        onChange={(e) => setCouponMaxUses(e.target.value)}
                      />
                    </div>
                    <button className="btn-neon" onClick={handleCreateCoupon} disabled={creatingCoupon}>
                      {creatingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Create Coupon
                    </button>
                  </div>

                  {/* Coupons list */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {coupons.map((coupon) => (
                      <div key={coupon.id} className="glass-card p-5 relative">
                        {/* Validity indicator */}
                        <div
                          className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          style={{
                            background: coupon.valid ? 'rgba(0,255,150,0.1)' : 'rgba(255,50,50,0.1)',
                            color: coupon.valid ? '#00ff96' : '#ff5555',
                            border: `1px solid ${coupon.valid ? 'rgba(0,255,150,0.3)' : 'rgba(255,50,50,0.3)'}`,
                          }}
                        >
                          {coupon.valid ? "Active" : "Expired"}
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            <Ticket className="w-4 h-4" style={{ color: '#fbbf24' }} />
                            <span className="text-white font-semibold text-sm">{coupon.name}</span>
                          </div>
                          <div
                            className="font-orbitron text-lg font-bold mt-2 px-3 py-2 rounded-lg inline-block"
                            style={{
                              background: 'rgba(0,255,255,0.06)',
                              border: '1px solid rgba(0,255,255,0.15)',
                              color: '#00ffff',
                              letterSpacing: '2px',
                            }}
                          >
                            {coupon.code}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400 mb-4">
                          <div>
                            <span className="text-gray-500 text-[10px] uppercase block">Discount</span>
                            <span className="text-green-400 font-bold">{coupon.discountPercentage}% OFF</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[10px] uppercase block">Uses</span>
                            <span className="text-gray-300">{coupon.usedCount} / {coupon.maxUses}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[10px] uppercase block">Expires</span>
                            <span className="text-gray-300">{coupon.expiryDate ? formatDate(coupon.expiryDate) : "Never"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-[10px] uppercase block">Created</span>
                            <span className="text-gray-300">{formatDate(coupon.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button className="btn-copy" onClick={() => copyCoupon(coupon.code)}>
                            <Copy className="w-3.5 h-3.5" /> Copy Code
                          </button>
                          <button className="btn-danger" onClick={() => handleDeleteCoupon(coupon.id)}>
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {coupons.length === 0 && (
                      <div className="col-span-full text-center py-12 text-gray-500">No coupon codes created yet.</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
