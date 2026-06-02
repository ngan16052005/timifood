import React, { createContext, useState, useContext } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [shipperInfo, setShipperInfo] = useState(null);
  
  // Shared state that needs to be accessed globally for socket/order context
  const [isOnline, setIsOnline] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

  const login = (userData, token) => {
    setShipperInfo({ ...userData, token });
    setIsLoggedIn(true);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setShipperInfo(null);
    setIsOnline(false);
    setCurrentOrder(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        shipperInfo,
        login,
        logout,
        isOnline,
        setIsOnline,
        currentOrder,
        setCurrentOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
