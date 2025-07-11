"use client";

import { createContext } from "react";

type FolderContextProps = {
  handleCreateFolder: (name: string) => void;
  handleEditFolder: ({ name, id }: { name: string; id: string }) => void;
  handleDeleteFolder: (id: string) => void;
  handleOpenModal: () => void;
  handleCloseModal: () => void;
  modal: boolean;
};

export const FolderContext = createContext<FolderContextProps>({
  handleCreateFolder: () => {},
  handleEditFolder: () => {},
  handleDeleteFolder: () => {},
  handleOpenModal: () => {},
  handleCloseModal: () => {},
  modal: false,
}); 