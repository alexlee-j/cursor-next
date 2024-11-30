export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  
  // 检查密码长度
  if (password.length < 8) {
    errors.push("密码长度至少需要8个字符");
  }
  
  // 检查是否包含大写字母
  if (!/[A-Z]/.test(password)) {
    errors.push("密码需要包含至少一个大写字母");
  }
  
  // 检查是否包含小写字母
  if (!/[a-z]/.test(password)) {
    errors.push("密码需要包含至少一个小写字母");
  }
  
  // 检查是否包含数字
  if (!/\d/.test(password)) {
    errors.push("密码需要包含至少一个数字");
  }
  
  // 检查是否包含特殊字符
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("密码需要包含至少一个特殊字符");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
