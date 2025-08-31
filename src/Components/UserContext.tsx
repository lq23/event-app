import React, { createContext, ReactNode, useContext, useState } from "react";
import { Role } from "./roles";
import { Roles } from "./roles";
import { User } from "./message";

interface UserContextValue {
  currentUser: User | null;
  setCurrentUser: (u: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue>({
  currentUser: null,
  setCurrentUser: () => {},
  logout: () => {},
  
});

export const UserProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const logout = () => {
    setCurrentUser(null);

  };
  return (
    <UserContext.Provider value={{ currentUser, setCurrentUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);