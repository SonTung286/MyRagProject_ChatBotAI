/**
 * LOGIN COMPONENT
 * Quản lý 3 trạng thái giao diện:
 * 1. 'login': Form đăng nhập thường
 * 2. 'register': Form đăng ký (Nhập user, pass, email)
 * 3. 'otp': Form nhập mã xác thực sau khi đăng ký thành công
 */

import { useState } from 'react';
import axios from 'axios';
import { KeyRound, User, LogIn, Mail, ShieldCheck } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
  // State quản lý màn hình hiện tại
  const [view, setView] = useState('login'); // 'login' | 'register' | 'otp'
  
  // State form data chung cho cả 3 màn hình
  const [formData, setFormData] = useState({ username: '', password: '', email: '', otp: '' });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // --- TRƯỜNG HỢP 1: ĐĂNG NHẬP ---
      if (view === 'login') {
        const res = await axios.post('http://localhost:5000/api/login', { 
            username: formData.username, 
            password: formData.password 
        });
        // Gọi callback để báo cho App.jsx biết đã login thành công
        onLoginSuccess(res.data.token, res.data.username, res.data.role);
      } 
      
      // --- TRƯỜNG HỢP 2: ĐĂNG KÝ ---
      else if (view === 'register') {
        // Chỉ gửi thông tin cần thiết (tránh lỗi Validation otp not allowed)
        await axios.post('http://localhost:5000/api/register', { 
            username: formData.username, 
            password: formData.password, 
            email: formData.email 
        });
        alert("Đã gửi mã OTP về email: " + formData.email);
        setView('otp'); // Chuyển sang màn hình nhập OTP
      } 
      
      // --- TRƯỜNG HỢP 3: XÁC THỰC OTP ---
      else if (view === 'otp') {
        await axios.post('http://localhost:5000/api/verify-otp', { 
            email: formData.email, 
            otp: formData.otp 
        });
        alert("Xác thực thành công! Hãy đăng nhập.");
        setView('login'); // Quay về màn hình đăng nhập
      }

    } catch (err) {
      // Hiển thị lỗi từ Backend trả về
      setError(err.response?.data?.error || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {view === 'login' ? "Đăng Nhập" : view === 'register' ? "Đăng Ký Tài Khoản" : "Xác Thực OTP"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Chỉ hiện Username/Password nếu không phải màn hình OTP */}
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

              {/* Chỉ hiện Email khi Đăng Ký */}
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <div className="relative mt-1">
                   <KeyRound className="absolute left-3 top-2.5 text-gray-400" size={18} />
                   <input type="password" required className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
            </>
          )}

          {/* Chỉ hiện Input OTP khi ở màn hình OTP */}
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

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-all">
            {loading ? "Đang xử lý..." : (view === 'login' ? "Đăng Nhập" : view === 'register' ? "Gửi Mã OTP" : "Xác Nhận")}
          </button>
        </form>

        {/* Footer chuyển đổi giữa Login và Register */}
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