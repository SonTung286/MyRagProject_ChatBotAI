import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Send, Bot, Loader2, UploadCloud, MessageSquare, FileText, LogOut, Plus, Trash2, FolderOpen, ShieldCheck } from 'lucide-react';
import Login from './components/Login';
import API from './utils/api'; // Import file cấu hình API mới tối ưu

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('username'));
  const [role, setRole] = useState(localStorage.getItem('role'));

  const [activeTab, setActiveTab] = useState('chat'); 
  const [question, setQuestion] = useState("");
  
  // State cho Sidebar & Chat
  const [conversations, setConversations] = useState([]); 
  const [currentConvId, setCurrentConvId] = useState(null); 
  const [messages, setMessages] = useState([]); 
  
  // State cho Admin
  const [adminFiles, setAdminFiles] = useState([]);

  // Loading States
  const [chatLoading, setChatLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // --- 1. CÁC HÀM GỌI API (Đã tối ưu dùng API Instance) ---

  const fetchConversations = async () => {
    if (!token) return;
    try {
      // Không cần truyền header hay url dài dòng nữa
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
    } catch (error) { console.error("Lỗi tải tin nhắn:", error); }
    finally { setChatLoading(false); }
  };

  const fetchAdminFiles = async () => {
    if (role !== 'admin') return;
    try {
      const res = await API.get('/admin/files');
      setAdminFiles(res.data);
    } catch (error) { console.error("Lỗi tải file admin:", error); }
  };

  // --- 2. XỬ LÝ SỰ KIỆN (DELETE, UPLOAD, CHAT) ---

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation(); 
    if (!window.confirm("Bạn chắc chắn muốn xóa cuộc trò chuyện này?")) return;

    try {
      await API.delete(`/conversations/${convId}`);
      fetchConversations(); // Load lại list
      
      // Nếu đang mở hội thoại bị xóa -> Reset về màn hình trắng
      if (currentConvId === convId) startNewChat();
      
    } catch (error) { alert("Lỗi xóa hội thoại"); }
  };

  const handleDeleteFile = async (fileName) => {
    if (!window.confirm(`Bạn muốn xóa tài liệu "${fileName}"?`)) return;
    try {
      await API.delete(`/admin/files/${fileName}`);
      alert("Đã xóa file thành công!");
      fetchAdminFiles();
    } catch (error) { alert("Lỗi xóa file"); }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Upload file cần override Content-Type thành multipart/form-data
      await API.post('/ingest-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus("✅ Upload thành công!");
      setFile(null);
      fetchAdminFiles();
    } catch (error) {
      setUploadStatus("❌ Lỗi: " + (error.response?.data?.error || "Lỗi upload"));
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSend = async () => {
    if (!question.trim()) return;
    
    // Optimistic Update (Hiện tin nhắn user ngay để cảm giác nhanh hơn)
    const tempUserMsg = { role: "user", content: question };
    setMessages(prev => [...prev, tempUserMsg]);
    setQuestion("");
    setChatLoading(true);

    try {
      const res = await API.post('/chat', { 
        question, 
        conversationId: currentConvId 
      });
      
      const botMsg = { 
        role: "bot", 
        content: res.data.answer, 
        sources: res.data.sources 
      };
      setMessages(prev => [...prev, botMsg]);

      // Nếu là chat mới -> Cập nhật ID và Sidebar ngay lập tức
      if (!currentConvId) {
        setCurrentConvId(res.data.conversationId);
        fetchConversations();
      }

    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", content: "Lỗi kết nối hoặc phiên đăng nhập hết hạn." }]);
    } finally {
      setChatLoading(false);
    }
  };

  // --- 3. CÁC HÀM TIỆN ÍCH ---

  const startNewChat = () => {
    setCurrentConvId(null);
    setMessages([{ role: "bot", content: "Xin chào! Tôi là trợ lý ảo Tech-Demo. Bạn cần giúp gì?" }]);
  };

  const handleLogout = () => {
    localStorage.clear(); // Xóa sạch token, role, user
    setToken(null); 
    setCurrentUser(null); 
    setRole(null);
    setMessages([]); 
    setConversations([]);
    setActiveTab('chat');
  };

  // Effect: Chạy 1 lần khi login
  useEffect(() => {
    if (token) {
      fetchConversations();
      if (role === 'admin') fetchAdminFiles();
    }
  }, [token]);

  useEffect(() => {
    if (role !== 'admin') {
      setActiveTab('chat');
    }
  }, [role]);

  // Effect: Tự động cuộn xuống cuối
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

// Force Re-deploy
  // --- 4. GIAO DIỆN (RENDER) ---

  if (!token) {
    return <Login onLoginSuccess={(tk, user, r) => {
      // 1. Lưu vào LocalStorage TRƯỚC (Quan trọng nhất)
      localStorage.setItem('token', tk);
      localStorage.setItem('username', user);
      localStorage.setItem('role', r);

      // 2. Sau đó mới cập nhật State để React render lại giao diện
      setToken(tk);
      setCurrentUser(user);
      setRole(r);
    }} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      
      {/* === SIDEBAR === */}
      <div className="w-72 bg-slate-900 text-white flex flex-col shadow-xl border-r border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xl mb-6">
            <Bot /> TECH-DEMO AI
          </div>
          <button onClick={startNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-lg hover:shadow-blue-500/30">
            <Plus size={18} /> Cuộc hội thoại mới
          </button>
        </div>

        {/* Danh sách Sessions (Có nút xóa) */}
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
               <button 
                  onClick={(e) => handleDeleteConversation(e, conv._id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-700 rounded-md opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110"
                  title="Xóa cuộc trò chuyện này"
               >
                  <Trash2 size={14}/>
               </button>
             </div>
           ))}
        </div>

        {/* User Info & Tabs */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          {role === 'admin' && (
            <button onClick={() => setActiveTab(activeTab === 'chat' ? 'admin' : 'chat')} className="w-full mb-4 flex items-center gap-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm">
               {activeTab === 'chat' ? <><UploadCloud size={18}/> Quản lý tài liệu</> : <><MessageSquare size={18}/> Quay lại Chat</>}
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
             <button onClick={handleLogout} className="text-slate-500 hover:text-red-400" title="Đăng xuất"><LogOut size={18}/></button>
          </div>
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        
        {/* VIEW 1: CHAT SCREEN */}
        {activeTab === 'chat' && (
          <>
            <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm z-10">
              <span className="font-bold text-gray-800 text-lg flex items-center gap-2">
                Hỗ trợ trực tuyến
              </span>
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
                    
                    {/* Hiển thị Nguồn (Fix lỗi trắng màn hình) */}
                    {msg.role === 'bot' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-gray-200/50">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1"><FileText size={12} /> Nguồn tham khảo:</div>
                        <div className="flex flex-wrap gap-2">
                          {[...new Set(msg.sources.map(s => typeof s === 'object' ? s.source : s))].map((src, idx) => (
                             <span key={idx} className="text-xs px-2 py-1 rounded bg-gray-100 border border-gray-200 text-gray-600 font-medium hover:bg-blue-50 transition-colors cursor-default">
                               📄 {src}
                             </span>
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

        {/* VIEW 2: ADMIN DASHBOARD */}
        {activeTab === 'admin' && (
          <div className="p-8 h-full overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-8">
              
              {/* Box Upload */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><UploadCloud className="text-blue-600"/> Nạp Kiến Thức Mới</h2>
                <div className="flex gap-4 items-center">
                   <label className="flex-1 cursor-pointer bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl h-32 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-400 transition-all group">
                      <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFile(e.target.files[0])} />
                      <FileText className="text-gray-400 mb-2 group-hover:text-blue-500"/>
                      <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600">{file ? file.name : "Chọn file PDF từ máy tính"}</span>
                   </label>
                   <button onClick={handleUpload} disabled={uploadLoading || !file} className="h-32 px-8 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:bg-gray-300 transition-all shadow-md">
                      {uploadLoading ? <Loader2 className="animate-spin"/> : "Upload"}
                   </button>
                </div>
                {uploadStatus && <div className={`mt-4 text-sm font-medium ${uploadStatus.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>{uploadStatus}</div>}
              </div>

              {/* Danh sách File đã có */}
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                 <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><FolderOpen className="text-orange-500"/> Tài Liệu Đã Nạp ({adminFiles.length})</h2>
                 <div className="grid grid-cols-1 gap-2">
                    {adminFiles.map((f, idx) => (
                       <div key={idx} className="p-4 border border-gray-100 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-500"><FileText size={20}/></div>
                             <div>
                                <div className="font-medium text-gray-700">{f.name}</div>
                                <div className="text-xs text-gray-400">Đã xử lý {f.chunks} phân đoạn dữ liệu</div>
                             </div>
                          </div>
                          <div className="flex items-center gap-3">
                             <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">Đã Index</span>
                             <button 
                                onClick={() => handleDeleteFile(f.name)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Xóa tài liệu này"
                             >
                                <Trash2 size={16}/>
                             </button>
                          </div>
                       </div>
                    ))}
                    {adminFiles.length === 0 && <div className="text-center text-gray-400 py-8 italic">Chưa có tài liệu nào.</div>}
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;