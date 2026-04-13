import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { 
  Send, Bot, Loader2, UploadCloud, MessageSquare, FileText, LogOut, Plus, Trash2, 
  FolderOpen, ShieldCheck, LayoutDashboard, Database, Users, Activity, Cpu, 
  CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';

import Login from './components/Login';
import API from './utils/api';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';

// --- COMPONENT DASHBOARD ---
function Dashboard({ token, currentUser, role, onLogout }) {
  const [activeTab, setActiveTab] = useState('chat');
  const [question, setQuestion] = useState("");

  // --- STATE CHO CHAT ---
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  // --- STATE CHO ADMIN DASHBOARD ---
  const [dashboardData, setDashboardData] = useState({
    stats: { totalDocs: 0, totalChunks: 0, totalUsers: 0, totalConvs: 0 },
    systemStatus: { aiModel: 'DeepSeek-R1 (Checking...)', status: 'Connecting...' },
    fileList: []
  });
  
  // Tab Admin con: 'files' (Tài liệu) hoặc 'users' (Người dùng)
  const [adminTab, setAdminTab] = useState('files');
  const [users, setUsers] = useState([]); // Danh sách user
  
  // Upload State
  const [file, setFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [adminMsg, setAdminMsg] = useState(null);

  const messagesEndRef = useRef(null);

  // --- 1. API GỌI DỮ LIỆU ---
  
  const fetchConversations = async () => {
    try {
      const res = await API.get('/conversations');
      setConversations(res.data);
    } catch (error) { console.error("Lỗi tải hội thoại:", error); }
  };

  const loadConversation = async (convId) => {
    setChatLoading(true);
    setCurrentConvId(convId);
    try {
      const res = await API.get(`/messages/${convId}`);
      setMessages(res.data);
      if (activeTab !== 'chat') setActiveTab('chat');
    } catch (error) { console.error("Lỗi tải tin nhắn:", error); }
    finally { setChatLoading(false); }
  };

  // API Admin: Lấy thống kê
  const fetchDashboardData = async () => {
    if (role !== 'admin') return;
    try {
      const res = await API.get('/admin/stats');
      setDashboardData(res.data);
    } catch (error) { console.error("Lỗi tải dashboard:", error); }
  };

  // API Admin: Lấy danh sách User
  const fetchUsers = async () => {
    if (role !== 'admin') return;
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data);
    } catch (error) { console.error("Lỗi tải users:", error); }
  };

  // --- 2. XỬ LÝ SỰ KIỆN ---

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm("Bạn chắc chắn muốn xóa cuộc trò chuyện này?")) return;
    try {
      await API.delete(`/conversations/${convId}`);
      fetchConversations();
      if (currentConvId === convId) startNewChat();
    } catch (error) { alert("Lỗi xóa hội thoại"); }
  };

  // Xử lý Upload File
  const handleUpload = async () => {
    if (!file) return;
    setUploadLoading(true);
    setAdminMsg(null);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await API.post('/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setAdminMsg({ type: 'success', text: `✅ Đã học xong kiến thức từ file: ${file.name}` });
      setFile(null);
      fetchDashboardData();
    } catch (error) {
      setAdminMsg({ type: 'error', text: `❌ Lỗi: ${error.response?.data?.error || error.message}` });
    } finally {
      setUploadLoading(false);
    }
  };

  // Xử lý Xóa File
  const handleDeleteFile = async (fileName) => {
    if (!window.confirm(`CẢNH BÁO: Bạn có chắc muốn xóa kiến thức từ file "${fileName}"?\nAI sẽ quên toàn bộ nội dung trong file này.`)) return;
    try {
      await API.delete(`/admin/file/${fileName}`);
      setAdminMsg({ type: 'success', text: `🗑️ Đã xóa file: ${fileName}` });
      fetchDashboardData();
    } catch (error) { alert("Lỗi xóa file"); }
  };

  // Xử lý Xóa User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("CẢNH BÁO: Xóa người dùng này vĩnh viễn?")) return;
    try {
      await API.delete(`/admin/users/${userId}`);
      alert("Đã xóa người dùng!");
      fetchUsers(); // Refresh danh sách
      fetchDashboardData(); // Refresh thống kê
    } catch (error) { alert("Lỗi xóa user"); }
  };

  // Chat Bot
  const handleSend = async () => {
    if (!question.trim()) return;
    const tempUserMsg = { role: "user", content: question };
    setMessages(prev => [...prev, tempUserMsg]);
    setQuestion("");
    setChatLoading(true);

    try {
      const res = await API.post('/chat', { question, conversationId: currentConvId });
      const botMsg = { role: "bot", content: res.data.answer, sources: res.data.sources };
      setMessages(prev => [...prev, botMsg]);
      if (!currentConvId) {
        setCurrentConvId(res.data.conversationId);
        fetchConversations();
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", content: "Lỗi kết nối hoặc phiên đăng nhập hết hạn." }]);
    } finally { setChatLoading(false); }
  };

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([{ role: "bot", content: "Xin chào! Tôi là trợ lý ảo Tech-Demo. Bạn cần giúp gì?" }]);
  };

  // --- 3. EFFECTS ---
  useEffect(() => {
    if (token) {
      fetchConversations();
      if (role === 'admin') {
        fetchDashboardData();
        fetchUsers();
      }
    }
  }, [token, role]);

  useEffect(() => {
    if (role !== 'admin') setActiveTab('chat');
  }, [role]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- 4. RENDER GIAO DIỆN ---
  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* --- SIDEBAR TRÁI --- */}
      <div className="w-72 bg-slate-900 text-white flex flex-col shadow-xl border-r border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xl mb-6">
            <Bot /> TECH-DEMO AI
          </div>
          <button onClick={startNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg hover:shadow-blue-500/30">
            <Plus size={18} /> Cuộc hội thoại mới
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
           <div className="text-xs font-bold text-slate-500 uppercase px-2 mb-2">Lịch sử chat</div>
           {conversations.map(conv => (
             <div key={conv._id} className="group relative flex items-center pr-2 rounded-lg hover:bg-slate-800/30 transition-colors">
               <button
                 onClick={() => loadConversation(conv._id)}
                 className={`flex-1 text-left p-3 rounded-lg text-sm truncate flex items-center gap-3 transition-colors ${currentConvId === conv._id ? 'bg-slate-800 text-white font-medium shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
               >
                 <MessageSquare size={16} /> <span className="truncate w-36">{conv.title}</span>
               </button>
               <button onClick={(e) => handleDeleteConversation(e, conv._id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110">
                  <Trash2 size={14}/>
               </button>
             </div>
           ))}
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800">
          {role === 'admin' && (
            <button 
              onClick={() => {
                if (activeTab === 'chat') { fetchDashboardData(); fetchUsers(); }
                setActiveTab(activeTab === 'chat' ? 'admin' : 'chat');
              }} 
              className={`w-full mb-4 flex items-center gap-3 p-3 rounded-lg transition-all text-sm font-bold ${activeTab === 'admin' ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            >
               {activeTab === 'chat' ? <><LayoutDashboard size={18}/> Vào trang Quản Trị</> : <><MessageSquare size={18}/> Quay lại Chat</>}
            </button>
          )}
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-xs font-bold ring-2 ring-blue-500/30">
                {currentUser?.substring(0,2).toUpperCase()}
             </div>
             <div className="flex-1 overflow-hidden">
                <div className="font-medium text-sm truncate">{currentUser}</div>
                <div className="text-xs text-slate-500 capitalize flex items-center gap-1">
                   {role === 'admin' ? <ShieldCheck size={10} className="text-yellow-500"/> : null} {role}
                </div>
             </div>
             <button onClick={onLogout} className="text-slate-500 hover:text-red-400" title="Đăng xuất"><LogOut size={18}/></button>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* --- TAB: CHAT --- */}
        {activeTab === 'chat' && (
          <>
            <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
              <span className="font-bold text-gray-800 text-lg flex items-center gap-2">Hỗ trợ trực tuyến</span>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Hệ thống sẵn sàng
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-gray-50">
              {messages.length === 0 && (
                 <div className="text-center text-gray-400 mt-20">
                    <Bot size={64} className="mx-auto mb-4 opacity-20"/>
                    <p>Bắt đầu cuộc trò chuyện mới với Tech-Demo AI</p>
                 </div>
              )}
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm border ${msg.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-200'}`}>
                    <div className="leading-relaxed prose text-sm break-words"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                    {msg.role === 'bot' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200/50">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><FileText size={12} /> Nguồn tham khảo:</div>
                        <div className="flex flex-wrap gap-2">
                          {[...new Set(msg.sources.map(s => typeof s === 'object' ? s.source : s))].map((src, idx) => (
                             <span key={idx} className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-200 text-gray-600 font-medium hover:bg-blue-50 transition-colors cursor-default">📄 {src}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && <div className="text-center text-sm text-gray-500 py-4 flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin text-blue-500"/> Đang soạn tin...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t">
              <div className="max-w-4xl mx-auto flex gap-2">
                <input type="text" className="flex-1 border border-gray-300 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-all"
                  placeholder="Nhập câu hỏi của bạn..."
                  value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={chatLoading} className="bg-blue-600 text-white px-6 rounded-xl hover:bg-blue-700 shadow-lg disabled:opacity-50 transition-all">
                   <Send size={20} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- TAB: ADMIN DASHBOARD --- */}
        {activeTab === 'admin' && (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 font-sans">
             <div className="max-w-6xl mx-auto space-y-6">
                
                {/* HEADER */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><LayoutDashboard className="text-blue-600"/> Trung Tâm Quản Trị AI</h1>
                    <p className="text-slate-500 text-sm mt-1">Giám sát hệ thống & Quản lý dữ liệu</p>
                  </div>
                  <div className="flex gap-2">
                     <button onClick={() => setAdminTab('files')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'files' ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}>Tài Liệu</button>
                     <button onClick={() => setAdminTab('users')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'users' ? 'bg-orange-100 text-orange-700' : 'text-slate-500 hover:bg-slate-100'}`}>Người Dùng</button>
                     <button onClick={() => { fetchDashboardData(); fetchUsers(); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-full transition ml-2" title="Làm mới"><RefreshCw size={20}/></button>
                  </div>
                </div>

                {/* STATS CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <StatCard icon={<FileText/>} label="Tài liệu gốc" value={dashboardData.stats.totalDocs} color="text-blue-600 bg-blue-50" />
                   <StatCard icon={<Database/>} label="Vectors (Chunks)" value={dashboardData.stats.totalChunks} color="text-purple-600 bg-purple-50" />
                   <StatCard icon={<Users/>} label="Người dùng" value={users.length} color="text-orange-600 bg-orange-50" />
                   <StatCard icon={<MessageSquare/>} label="Hội thoại" value={dashboardData.stats.totalConvs} color="text-pink-600 bg-pink-50" />
                </div>

                {/* --- CONTENT: TAB FILES --- */}
                {adminTab === 'files' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                     <div className="lg:col-span-2 space-y-6">
                        {/* Upload */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                           <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><UploadCloud className="text-blue-500"/> Nạp Kiến Thức Mới</h3>
                           <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative group">
                              <input type="file" accept=".pdf" className="hidden" id="fileUpload" onChange={(e) => setFile(e.target.files[0])} />
                              <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-3 w-full h-full">
                                 <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${uploadLoading ? 'bg-slate-100' : 'bg-blue-100 text-blue-600 group-hover:scale-110'}`}>
                                    {uploadLoading ? <RefreshCw className="animate-spin text-slate-400"/> : <FileText size={24}/>}
                                 </div>
                                 <span className="text-slate-600 font-medium text-lg">{file ? file.name : "Chọn file PDF từ máy tính"}</span>
                              </label>
                           </div>
                           
                           {adminMsg && (
                              <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-fade-in ${adminMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                 {adminMsg.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                                 {adminMsg.text}
                              </div>
                           )}

                           <button onClick={handleUpload} disabled={!file || uploadLoading} className={`mt-4 w-full py-3 rounded-xl font-bold text-white transition-all shadow-md ${!file || uploadLoading ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
                              {uploadLoading ? "Đang xử lý..." : "Upload & Train AI Ngay"}
                           </button>
                        </div>

                        {/* File List */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                           <div className="p-4 border-b border-slate-100 font-bold text-slate-700">Kho Tài Liệu ({dashboardData.fileList.length})</div>
                           <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left">
                                 <thead className="text-slate-500 bg-slate-50 uppercase text-xs">
                                    <tr><th className="p-4">Tên File</th><th className="p-4">Dung lượng</th><th className="p-4">Ngày nạp</th><th className="p-4 text-right">Hành động</th></tr>
                                 </thead>
                                 <tbody className="divide-y divide-slate-100">
                                    {dashboardData.fileList.map((doc, idx) => (
                                       <tr key={idx} className="hover:bg-slate-50">
                                          <td className="p-4 font-medium text-slate-700 flex items-center gap-2"><FileText size={16} className="text-slate-400"/> <span className="truncate max-w-[180px]" title={doc.name}>{doc.name}</span></td>
                                          <td className="p-4"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">{doc.chunks} vectors</span></td>
                                          <td className="p-4 text-slate-500 text-xs">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString('vi-VN') : '-'}</td>
                                          <td className="p-4 text-right"><button onClick={() => handleDeleteFile(doc.name)} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={18}/></button></td>
                                       </tr>
                                    ))}
                                    {dashboardData.fileList.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400">Chưa có dữ liệu.</td></tr>}
                                 </tbody>
                              </table>
                           </div>
                        </div>
                     </div>
                     
                     <div className="space-y-6">
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-800 p-6 rounded-2xl text-white shadow-xl">
                           <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Cpu className="text-indigo-400"/> AI Core Status</h3>
                           <div className="space-y-4 text-sm">
                              <InfoRow label="Chat Model" value={dashboardData.systemStatus.aiModel} />
                              <InfoRow label="Embedding" value={dashboardData.systemStatus.embedding || "Snowflake Arctic"} />
                              <InfoRow label="Status" value={dashboardData.systemStatus.status} highlight />
                           </div>
                        </div>
                     </div>
                  </div>
                )}

                {/* --- CONTENT: TAB USERS --- */}
                {adminTab === 'users' && (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
                     <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <span className="font-bold text-slate-800 text-lg flex items-center gap-2"><Users className="text-orange-500"/> Danh sách người dùng ({users.length})</span>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                           <thead className="text-slate-500 bg-slate-50 uppercase text-xs">
                              <tr><th className="p-4">Người dùng</th><th className="p-4">Email</th><th className="p-4">Vai trò</th><th className="p-4">Ngày tham gia</th><th className="p-4 text-right">Hành động</th></tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                              {users.map((u, idx) => (
                                 <tr key={idx} className="hover:bg-slate-50">
                                    <td className="p-4">
                                       <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">{u.username.substring(0,2).toUpperCase()}</div>
                                          <span className="font-medium text-slate-700">{u.username}</span>
                                       </div>
                                    </td>
                                    <td className="p-4 text-slate-600">{u.email}</td>
                                    <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>{u.role}</span></td>
                                    <td className="p-4 text-slate-500">{new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                                    <td className="p-4 text-right">
                                       {u.role !== 'admin' && <button onClick={() => handleDeleteUser(u._id)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg"><Trash2 size={18}/></button>}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wide">{label}</p>
      <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${color} shadow-sm`}><div className="w-6 h-6 flex items-center justify-center">{icon}</div></div>
  </div>
);

const InfoRow = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center border-b border-white/10 pb-2 last:border-0">
    <span className="text-slate-400">{label}</span>
    <span className={`font-mono font-bold ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</span>
  </div>
);

// --- COMPONENT APP (Main) ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('username'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const handleLoginSuccess = (tk, user, r) => {
    localStorage.setItem('token', tk);
    localStorage.setItem('username', user);
    localStorage.setItem('role', r);
    setToken(tk);
    setCurrentUser(user);
    setRole(r);
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken(null);
    setCurrentUser(null);
    setRole(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!token ? <Login onLoginSuccess={handleLoginSuccess} /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!token ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/reset-password/:resetToken" element={!token ? <ResetPassword /> : <Navigate to="/" />} />
        <Route path="/" element={token ? <Dashboard token={token} currentUser={currentUser} role={role} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;