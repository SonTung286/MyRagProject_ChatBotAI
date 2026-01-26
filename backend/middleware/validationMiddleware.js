const Joi = require('joi');

/**
 * Hàm middleware chung để validate dữ liệu
 * Nếu dữ liệu sai luật -> Trả về lỗi 400 ngay lập tức
 * Nếu đúng -> Cho đi tiếp (next)
 */
const validate = (schema) => {
  return (req, res, next) => {
    // abortEarly: false giúp trả về tất cả lỗi sai cùng lúc thay vì chỉ lỗi đầu tiên
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      // Lấy danh sách thông báo lỗi
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ error: errorMessage });
    }
    next();
  };
};

// --- ĐỊNH NGHĨA CÁC LUẬT (SCHEMAS) ---
const schemas = {
  // 1. Luật đăng ký
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required().messages({
      'string.alphanum': 'Tài khoản chỉ được chứa chữ và số',
      'string.min': 'Tài khoản phải có ít nhất 3 ký tự',
      'any.required': 'Vui lòng nhập tài khoản'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'any.required': 'Vui lòng nhập mật khẩu'
    }),
    email: Joi.string().email().required().messages({
      'string.email': 'Email không hợp lệ',
      'any.required': 'Vui lòng nhập email'
    })
  }),

  // 2. Luật đăng nhập
  login: Joi.object({
    username: Joi.string().required().messages({'any.required': 'Thiếu tài khoản'}),
    password: Joi.string().required().messages({'any.required': 'Thiếu mật khẩu'})
  }),

  // 3. Luật xác thực OTP
  verifyOTP: Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).required().messages({
      'string.length': 'Mã OTP phải đúng 6 ký tự',
      'string.pattern.base': 'Mã OTP chỉ được chứa số'
    })
  }),

  // 4. Luật Chat
  chat: Joi.object({
    question: Joi.string().min(1).required().messages({'any.required': 'Câu hỏi không được để trống'}),
    conversationId: Joi.string().allow(null, '') // Cho phép null hoặc rỗng nếu là chat mới
  })
};

module.exports = { validate, schemas };