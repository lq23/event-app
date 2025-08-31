// src/Components/LoginContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Role, Roles } from "./roles";

interface LoginFlow {
  brotherVisible: boolean;
  showBrotherQuestion: boolean;
  isBrother: boolean;
  isSister: boolean;
  sisterPasswordVisible: boolean;
  isLoggedIn: boolean;

  name: string;
  setName: (v: string) => void;
  brotherNumber: string;
  setBrotherNumber: (v: string) => void;
  sorority: string;
  setSorority: (v: string) => void;
  sisterName: string;
  setSisterName: (v: string) => void;
  sisterPassword: string;
  setSisterPassword: (v: string) => void;

  currentUser: { id: string; name: string; role: Role } | null;
  setCurrentUser: (
    u: { id: string; name: string; role: Role } | null
  ) => void;

  handleYesClick: () => void;
  handleNoClick: () => void;
  handleNextClick: () => void;
  handleBrotherLogin: () => Promise<void>;
  handleSisterLogin: () => void;
  logout: () => void;
}

// 1) Provide a *complete* default so that context consumers never get undefined
const defaultFlow: LoginFlow = {
  brotherVisible: true,
  showBrotherQuestion: false,
  isBrother: false,
  isSister: false,
  sisterPasswordVisible: false,
  isLoggedIn: false,

  name: "",
  setName: () => {},
  brotherNumber: "",
  setBrotherNumber: () => {},
  sorority: "",
  setSorority: () => {},
  sisterName: "",
  setSisterName: () => {},
  sisterPassword: "",
  setSisterPassword: () => {},

  currentUser: null,
  setCurrentUser: () => {},

  handleYesClick: () => {},
  handleNoClick: () => {},
  handleNextClick: () => {},
  handleBrotherLogin: async () => {},
  handleSisterLogin: () => {},
  logout: () => {},
};

const LoginContext = createContext<LoginFlow>(defaultFlow);

export const LoginProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [brotherVisible, setBrotherVisible] = useState(true);
  const [showBrotherQuestion, setShowBrotherQuestion] = useState(false);
  const [isBrother, setIsBrother] = useState(false);
  const [isSister, setIsSister] = useState(false);
  const [sisterPasswordVisible, setSisterPasswordVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [name, setName] = useState("");
  const [brotherNumber, setBrotherNumber] = useState("");
  const [sorority, setSorority] = useState("");
  const [sisterName, setSisterName] = useState("");
  const [sisterPassword, setSisterPassword] = useState("");

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
    role: Role;
  } | null>(null);

  // 2) Re-play the “show the brother question” animation on mount
  useEffect(() => {
    const t = setTimeout(() => setShowBrotherQuestion(true), 1600);
    return () => clearTimeout(t);
  }, []);

  const handleYesClick = () => {
    setBrotherVisible(false);
    setShowBrotherQuestion(false);
    setIsBrother(true);
  };
  const handleNoClick = () => {
    setBrotherVisible(false);
    setIsSister(true);
  };
  const handleNextClick = () => {
    setIsSister(false);
    setSisterPasswordVisible(true);
  };

  const handleBrotherLogin = async () => {
    // …your supabase lookup here…
    // on success:
    setCurrentUser({ id: "…", name, role: Roles.BROTHER });
    setIsLoggedIn(true);
  };
  const handleSisterLogin = () => {
    // …sister logic…
    setCurrentUser({ id: "…", name: sisterName, role: Roles.SDT_SISTER });
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setBrotherVisible(true);
    setShowBrotherQuestion(true);
    setIsBrother(false);
    setIsSister(false);
    setSisterPasswordVisible(false);
    setName("");
    setBrotherNumber("");
    setSorority("");
    setSisterName("");
    setSisterPassword("");
  };

  return (
    <LoginContext.Provider
      value={{
        brotherVisible,
        showBrotherQuestion,
        isBrother,
        isSister,
        sisterPasswordVisible,
        isLoggedIn,

        name,
        setName,
        brotherNumber,
        setBrotherNumber,
        sorority,
        setSorority,
        sisterName,
        setSisterName,
        sisterPassword,
        setSisterPassword,

        currentUser,
        setCurrentUser,

        handleYesClick,
        handleNoClick,
        handleNextClick,
        handleBrotherLogin,
        handleSisterLogin,
        logout,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
};

export function useLogin() {
  return useContext(LoginContext);
}
