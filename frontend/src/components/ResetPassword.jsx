import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react'; // Import icon

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // State ẩn/hiện
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { resetToken } = useParams();
  const navigate = useNavigate();

  // Đổi port về 5000 (Backend chạy local)
  const API_URL = `http://localhost:5000/api/auth/reset-password/${resetToken}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError("Mật khẩu nhập lại không khớp!");
    }
    setLoading(true);
    try {
      const res = await axios.put(API_URL, { password });
      setMessage(res.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-sans">
      <div className="p-8 bg-white rounded-2xl shadow-xl w-96 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Đặt Lại Mật Khẩu</h2>

        {message && <div className="mb-4 text-green-700 bg-green-100 p-3 rounded text-sm text-center font-medium">{message}</div>}
        {error && <div className="mb-4 text-red-600 bg-red-100 p-3 rounded text-sm text-center font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Mật khẩu mới */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Mật khẩu mới</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"} // Logic ẩn hiện
                required
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Nhập lại mật khẩu */}
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Nhập lại mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-2.5 text-white font-semibold rounded-lg transition-all shadow-md ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:shadow-lg'}`}
          >
            {loading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;