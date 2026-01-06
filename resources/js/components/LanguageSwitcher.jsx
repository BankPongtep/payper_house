import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const toggleLanguage = () => {
        const newLang = i18n.language === 'th' ? 'en' : 'th';
        i18n.changeLanguage(newLang);
    };

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition"
            title="Switch Language"
        >
            <Globe size={14} />
            <span className="uppercase">{i18n.language}</span>
        </button>
    );
};

export default LanguageSwitcher;
