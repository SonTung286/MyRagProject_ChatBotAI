import { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Đổi URL này thành URL Render của bạn khi deploy
  //const API_URL = "https://myragproject-chatbotai.onrender.com/api/auth/forgot-password"; 
  const API_URL = "http://localhost:5000/api/auth/forgot-password";
  // Hoặc dùng: "http://localhost:5000/api/auth/forgot-password" nếu test local

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post(API_URL, { email });
      setMessage(res.data.message); // "Email xác nhận đã được gửi!"
    } catch (err) {
      setError(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Quên Mật Khẩu</h2>
        
        {message && <div className="mb-4 text-green-600 bg-green-100 p-2 rounded text-sm text-center">{message}</div>}
        {error && <div className="mb-4 text-red-600 bg-red-100 p-2 rounded text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Email đăng ký</label>
            <input
              type="email"
              required
              className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 text-white bg-blue-600 rounded hover:bg-blue-700 transition duration-200 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Đang gửi...' : 'Gửi Link Đặt Lại Mật Khẩu'}
          </button>
        </form>
        
        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm text-gray-500 hover:text-blue-600">Quay lại Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;