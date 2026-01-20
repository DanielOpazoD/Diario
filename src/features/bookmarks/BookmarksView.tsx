import React from 'react';
import { useBookmarksManager } from '@features/bookmarks/hooks/useBookmarksManager';
import {
  BookmarksHeader,
  BookmarksListLayout,
  BookmarksGridLayout,
  BookmarksSidebar,
} from './components';

interface BookmarksViewProps {
  onAdd: () => void;
  onEdit: (bookmarkId: string) => void;
}

const BookmarksView: React.FC<BookmarksViewProps> = ({ onAdd, onEdit }) => {
  const {
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    viewMode,
    setViewMode,
    filteredBookmarks,
    resolveCategory,
    handleRenameCategory,
    handleDeleteCategory,
    handleExport,
    handleImportFile,
    importInputRef,
    showBookmarkBar,
    setShowBookmarkBar,
    bookmarkCategories,
    updateBookmark,
    deleteBookmark,
    addBookmarkCategory,
  } = useBookmarksManager();

  const handleToggleFavorite = (id: string, isFavorite: boolean) => {
    updateBookmark(id, { isFavorite });
  };

  const onAddCategory = () => {
    const name = prompt('Nombre de la nueva categoría');
    if (name) addBookmarkCategory({ name });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="flex-1 space-y-4">
          <BookmarksHeader
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showBookmarkBar={showBookmarkBar}
            setShowBookmarkBar={setShowBookmarkBar}
            bookmarkCategories={bookmarkCategories}
            onAdd={onAdd}
            onExport={handleExport}
            onImportClick={() => importInputRef.current?.click()}
            importInputRef={importInputRef}
            handleImportFile={handleImportFile}
          />

          {viewMode === 'list' ? (
            <BookmarksListLayout
              bookmarks={filteredBookmarks}
              onEdit={onEdit}
              onDelete={deleteBookmark}
              onToggleFavorite={handleToggleFavorite}
              resolveCategory={resolveCategory}
            />
          ) : (
            <BookmarksGridLayout
              bookmarks={filteredBookmarks}
              onEdit={onEdit}
              onDelete={deleteBookmark}
              onToggleFavorite={handleToggleFavorite}
              resolveCategory={resolveCategory}
            />
          )}
        </div>

        <BookmarksSidebar
          bookmarkCategories={bookmarkCategories}
          onAddCategory={onAddCategory}
          onRenameCategory={handleRenameCategory}
          onDeleteCategory={handleDeleteCategory}
        />
      </div>
    </div>
  );
};

export default BookmarksView;
