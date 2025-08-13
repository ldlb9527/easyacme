import { API_BASE_URL } from '../config';
import i18n from '../i18n';

/**
 * 从localStorage获取语言设置
 * @returns {string} 语言代码，如zh或en
 */
export const getStoredLanguage = (): string => {
  return localStorage.getItem('language') || '';
};

/**
 * 将语言设置存储到localStorage
 * @param {string} lang 语言代码，如zh或en
 */
export const storeLanguage = (lang: string): void => {
  localStorage.setItem('language', lang);
};



/**
 * 从服务器获取语言设置
 * @returns {Promise<string>} 语言代码，如zh或en
 */
export const fetchLanguageFromServer = async (): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/language`, {
      credentials: 'include', // 携带cookies
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch language');
    }
    
    const data = await response.json();
    return data.language || 'zh-CN';
  } catch (error) {
    console.error('Error fetching language from server:', error);
    return 'zh-CN'; // 默认返回中文
  }
};

/**
 * 初始化应用语言设置
 * 优先使用localStorage中的语言设置，如果没有则从服务器获取
 */
export const initializeLanguage = async (): Promise<void> => {
  let language = getStoredLanguage();
  
  if (!language) {
    language = await fetchLanguageFromServer();
    storeLanguage(language);
  }
  
  // 根据获取到的语言设置i18n
  if (language) {
    i18n.changeLanguage(language);
  }
};

/**
 * 切换语言
 * @param {string} newLang 新的语言代码，如zh-CN或en-US
 */
export const changeLanguage = async (newLang: string): Promise<void> => {
  try {
    // 先调用后端接口更新用户语言设置
    const response = await fetch(`${API_BASE_URL}/language`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // 携带cookies
      body: JSON.stringify({ language: newLang })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '更新语言设置失败');
    }
    
    // 接口调用成功后，再更新本地存储和 i18n 设置
    storeLanguage(newLang);
    i18n.changeLanguage(newLang);
    
    console.log('语言已切换为:', newLang);
  } catch (error) {
    console.error('切换语言失败:', error);
  }
};