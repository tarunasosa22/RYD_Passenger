import { createContext, useContext, useEffect, useState } from "react";
import { getAsyncStorageData } from "../utils/HelperFunctions";
import { AppStrings } from "../utils/AppStrings";

const LanguageContex = createContext({
    locale: false,
    langLoading: false,
    langCode: 'en',
    setLangCode: (langCode: string) => '',
})

export const LanguageContexProvider = ({ children }: React.PropsWithChildren) => {

    const [locale, setLocale] = useState<boolean>(false)
    const [langCode, setLangCode] = useState<string>('en')
    const [langLoading, setLangLoading] = useState<boolean>(false)

    const getDef = async () => {
        setLangLoading(true)
        getAsyncStorageData(AppStrings.selected_language).then(res => {
            if (res) {
                setLangCode(res)
                if (res === "ar") {
                    setLocale(true)
                } else {
                    setLocale(false)
                }
            }
            setLangLoading(false)
        }).catch(() => {
        })
    }

    useEffect(() => {
        getDef();
    }, [])

    return <LanguageContex.Provider value={{ locale, langLoading, langCode, setLangCode }}>
        {children}
    </LanguageContex.Provider>
}

export const useLanguage = () => useContext(LanguageContex)
