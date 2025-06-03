"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ErrorBoundary } from "@/components/wrappers/error-boundary";
import { useCreateFolderMutation, useDeleteFolderMutation, useEditFolderMutation, useFetchAllFoldersQuery } from "@/store/slices/xray";
import { createContext, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [modal, updateModal] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolder, setEditingFolder] = useState<string | null>(null);

  const [createFolder, { isLoading: isCreating, error: createError }] = useCreateFolderMutation();
  const { data } = useFetchAllFoldersQuery();
  const [editFolder, { isLoading: isEditing, error: editError }] = useEditFolderMutation();
  const [deleteFolder, { isLoading: isDeleting, error: deleteError }] = useDeleteFolderMutation();

  const handleCreateFolder = (name: string) => {
    createFolder(name).then(() => {
      // setFolders([...folders, { id: Date.now().toString(), name }]);
      setNewFolderName("");
    });
  };

  const handleEditFolder = ({ name, id }: { name: string; id: string }) => {
    editFolder({ name, id }).then(() => {
      setFolders(folders.map((folder) => (folder.id === id ? { ...folder, name } : folder)));
      setEditingFolder(null);
    });
  };

  const handleDeleteFolder = (id: string) => {
    deleteFolder({ id }).then(() => {
      setFolders(folders.filter((folder) => folder.id !== id));
    });
  };

  const handleOpenModal = () => {
    updateModal(true);
  };

  const handleCloseModal = () => {
    updateModal(false);
    setEditingFolder(null);
    setNewFolderName("");
  };

  const value = {
    handleCreateFolder,
    handleEditFolder,
    handleDeleteFolder,
    handleOpenModal,
    handleCloseModal,
    modal,
  };

  useEffect(() => {
    if (data) {
      setFolders(data);
    }
  }, [data]);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <FolderContext.Provider value={value}>
        <Sidebar />
        <ErrorBoundary>{children}</ErrorBoundary>
      </FolderContext.Provider>

      <Dialog open={modal} onOpenChange={updateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Folders</DialogTitle>
            <DialogDescription>Create, edit, or delete folders.</DialogDescription>
          </DialogHeader>
          <motion.div
            className="mt-4 p-2 space-y-4 max-h-[350px] overflow-x-scroll"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <AnimatePresence>
              {folders.map((folder) => (
                <motion.div
                  key={folder.id}
                  className="flex items-center justify-between"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {editingFolder === folder.id ? (
                    <Input
                      value={folder.name}
                      onChange={(e) => {
                        const updatedFolders = folders.map((f) => (f.id === folder.id ? { ...f, name: e.target.value } : f));
                        setFolders(updatedFolders);
                      }}
                      className="flex-grow mr-2"
                      autoFocus
                    />
                  ) : (
                    <span>{folder.name}</span>
                  )}
                  <div className="flex space-x-2">
                    <AnimatePresence mode="wait">
                      {editingFolder === folder.id ? (
                        <>
                          <motion.div
                            key="edit-actions"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Button size="icon" variant="ghost" onClick={() => handleEditFolder({ id: folder.id, name: folder.name })}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setEditingFolder(null)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </motion.div>
                        </>
                      ) : (
                        <motion.div
                          key="normal-actions"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Button size="icon" variant="ghost" onClick={() => setEditingFolder(folder.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteFolder(folder.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <motion.div
              className="flex items-center space-x-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Input placeholder="New folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="flex-grow" />
              <Button onClick={() => handleCreateFolder(newFolderName)} disabled={!newFolderName}>
                Add
              </Button>
            </motion.div>
          </motion.div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
