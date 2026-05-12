import { createContext, useContext } from "react";

export const Modal = createContext();

export const useModal = () => useContext(Modal);
