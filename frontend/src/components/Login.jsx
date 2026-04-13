import { useState } from 'react';
import { KeyRound, User, LogIn, Mail, ShieldCheck, Eye, EyeOff } from 'lucide-react'; // Import Eye, EyeOff
import { Link } from 'react-router-dom';
import API from '../utils/api';

const Login = ({ onLoginSuccess }) => {
  const [view, setView] = useState('login'); 
  const [formData, setFormData] = useState({ username: '', password: '', email: '', otp: '' });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (view === 'login') {
        const res = await API.post('/login', { 
            username: formData.username, 
            password: formData.password 
        });
        onLoginSuccess(res.data.token, res.data.username, res.data.role);
      } else if (view === 'register') {
        await API.post('/register', { 
            username: formData.username, 
            password: formData.password, 
            email: formData.email 
        });
        alert("Đã gửi mã OTP về email: " + formData.email);
        setView('otp');
      } else if (view === 'otp') {
        await API.post('/verify-otp', { 
            email: formData.email, 
            otp: formData.otp 
        });
        alert("Xác thực thành công! Hãy đăng nhập.");
        setView('login');
      }
    } catch (err) {
      setError(err.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {view === 'login' ? "Đăng Nhập" : view === 'register' ? "Đăng Ký Tài Khoản" : "Xác Thực OTP"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {view !== 'otp' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tài khoản</label>
                <div className="relative mt-1">
                   <User className="absolute left-3 top-2.5 text-gray-400" size={18} />
                   <input type="text" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                </div>
              </div>

              {view === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email (để nhận OTP)</label>
                  <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                      <input type="email" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                         value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                </div>
              )}

              {/* Ô MẬT KHẨU CÓ ICON MẮT */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <div className="relative mt-1">
                   <KeyRound className="absolute left-3 top-2.5 text-gray-400" size={18} />
                   <input 
                      type={showPassword ? "text" : "password"} // Logic ẩn hiện
                      required 
                      className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                   />
                   <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                   >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                   </button>
                </div>
                
                {view === 'login' && (
                  <div className="text-right mt-1">
                    <Link to="/forgot-password" class="text-xs text-blue-600 hover:underline">Quên mật khẩu?</Link>
                  </div>
                )}
              </div>
            </>
          )}

          {view === 'otp' && (
            <div>
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-4">
                 Đã gửi mã 6 số đến <b>{formData.email}</b>. Vui lòng kiểm tra hộp thư (cả mục Spam).
              </div>
              <label className="block text-sm font-medium text-gray-700">Nhập mã OTP</label>
              <div className="relative mt-1">
                 <ShieldCheck className="absolute left-3 top-2.5 text-gray-400" size={18} />
                 <input type="text" required maxLength={6} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold tracking-widest" 
                    placeholder="123456"
                    value={formData.otp} onChange={e => setFormData({...formData, otp: e.target.value})} />
              </div>
            </div>
          )}

          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md">
            {loading ? "Đang xử lý..." : (view === 'login' ? "Đăng Nhập" : view === 'register' ? "Gửi Mã OTP" : "Xác Nhận")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          {view === 'login' ? (
             <p>Chưa có tài khoản? <button onClick={() => setView('register')} className="text-blue-600 font-bold hover:underline">Đăng ký ngay</button></p>
          ) : view === 'register' ? (
             <p>Đã có tài khoản? <button onClick={() => setView('login')} className="text-blue-600 font-bold hover:underline">Đăng nhập</button></p>
          ) : (
            <p><button onClick={() => setView('register')} className="text-blue-600 hover:underline">Gửi lại mã?</button> hoặc <button onClick={() => setView('login')} className="text-blue-600 font-bold hover:underline">Quay về đăng nhập</button></p>
          )}
        </div>
      </div>
    </div>
  );
};
export default Login;