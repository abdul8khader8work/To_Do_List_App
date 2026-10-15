import { useState, useEffect, useRef, useCallback } from "react";

// ==================== TYPES ====================
type Priority = "low" | "medium" | "high";
type FilterType = "all" | "active" | "completed";
type SortType = "newest" | "oldest" | "priority" | "dueDate" | "alphabetical";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  priority: Priority;
  dueDate: string | null;
  category: string;
  order: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  todoId: string | null;
}

interface UndoAction {
  type: "delete" | "complete";
  todo: Todo;
  previousIndex: number;
}

// ==================== UTILITIES ====================
const generateId = (): string =>
  Date.now().toString(36) + Math.random().toString(36).substr(2);

const loadTodos = (): Todo[] => {
  try {
    const stored = localStorage.getItem("todos-v2");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveTodos = (todos: Todo[]) => {
  try {
    localStorage.setItem("todos-v2", JSON.stringify(todos));
  } catch (e) {
    console.error("Failed to save:", e);
  }
};

const loadTheme = (): "light" | "dark" => {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
};

const CATEGORIES = ["Personal", "Work", "Shopping", "Health", "Other"];

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-blue-500", textColor: "text-blue-500", dot: "bg-blue-400" },
  medium: { label: "Medium", color: "bg-yellow-500", textColor: "text-yellow-500", dot: "bg-yellow-400" },
  high: { label: "High", color: "bg-red-500", textColor: "text-red-500", dot: "bg-red-400" },
};

// ==================== ICONS ====================
const Icons = {
  Sun: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Moon: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  ),
  Search: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  Edit: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  Trash: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Undo: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  Download: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  Upload: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Calendar: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  MoreVertical: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01" />
    </svg>
  ),
  X: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  GripVertical: () => (
    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
  ),
};

// ==================== MAIN APP ====================
export default function App() {
  // Core state
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [theme, setTheme] = useState<"light" | "dark">(loadTheme);
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("newest");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // UI state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false, x: 0, y: 0, todoId: null,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean; title: string; message: string; onConfirm: () => void;
  }>({ visible: false, title: "", message: "", onConfirm: () => {} });
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // New todo form state
  const [newText, setNewText] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newCategory, setNewCategory] = useState("Personal");

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ==================== EFFECTS ====================
  // Save todos
  useEffect(() => { saveTodos(todos); }, [todos]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Focus edit input
  useEffect(() => {
    if (editingId && editInputRef.current) editInputRef.current.focus();
  }, [editingId]);

  // Auto-dismiss undo toast
  useEffect(() => {
    if (undoAction) {
      undoTimer.current = setTimeout(() => setUndoAction(null), 5000);
      return () => { if (undoTimer.current) clearTimeout(undoTimer.current); };
    }
  }, [undoAction]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu((prev) => ({ ...prev, visible: false }));
    if (contextMenu.visible) {
      document.addEventListener("click", handler);
      document.addEventListener("touchstart", handler);
      return () => {
        document.removeEventListener("click", handler);
        document.removeEventListener("touchstart", handler);
      };
    }
  }, [contextMenu.visible]);

  // ==================== ELECTRON IPC LISTENER ====================
  useEffect(() => {
    // Listen for menu actions from Electron
    const handleElectronAction = (_event: unknown, action: string) => {
      switch (action) {
        case "new-todo":
          setShowAddForm(true);
          setTimeout(() => inputRef.current?.focus(), 100);
          break;
        case "search":
          setShowSearch(true);
          break;
        case "toggle-theme":
          setTheme((t) => (t === "light" ? "dark" : "light"));
          break;
        case "filter-all":
          setFilter("all");
          break;
        case "filter-active":
          setFilter("active");
          break;
        case "filter-completed":
          setFilter("completed");
          break;
        case "toggle-all":
          toggleAll();
          break;
        case "clear-completed":
          clearCompleted();
          break;
        case "export":
          exportData();
          break;
      }
    };

    // Check if running in Electron
    if (typeof window !== "undefined" && (window as any).electronAPI) {
      (window as any).electronAPI.onMenuAction(handleElectronAction);
    }

    // Also listen via window.electronAPI if exposed by preload
    if (typeof window !== "undefined" && (window as any).ipcRenderer) {
      const ipc = (window as any).ipcRenderer;
      ipc.on("menu-action", handleElectronAction);
      return () => ipc.removeListener("menu-action", handleElectronAction);
    }
  }, [todos]);

  // ==================== KEYBOARD SHORTCUTS ====================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        setShowAddForm(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        setTheme((t) => (t === "light" ? "dark" : "light"));
      }
      if (e.key === "Escape") {
        setShowAddForm(false);
        setShowSearch(false);
        setEditingId(null);
        setContextMenu((prev) => ({ ...prev, visible: false }));
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && undoAction) {
        e.preventDefault();
        performUndo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undoAction]);

  // ==================== TODO OPERATIONS ====================
  const addTodo = () => {
    const text = newText.trim();
    if (!text) return;
    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
      priority: newPriority,
      dueDate: newDueDate || null,
      category: newCategory,
      order: todos.length,
    };
    setTodos((prev) => [newTodo, ...prev]);
    setNewText("");
    setNewPriority("medium");
    setNewDueDate("");
    setNewCategory("Personal");
    setShowAddForm(false);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const requestDelete = (id: string) => {
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    setConfirmDialog({
      visible: true,
      title: "Delete Todo",
      message: `Are you sure you want to delete "${todo.text}"?`,
      onConfirm: () => {
        const index = todos.findIndex((t) => t.id === id);
        setTodos((prev) => prev.filter((t) => t.id !== id));
        setUndoAction({ type: "delete", todo, previousIndex: index });
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const performUndo = () => {
    if (!undoAction) return;
    if (undoAction.type === "delete") {
      setTodos((prev) => {
        const newTodos = [...prev];
        newTodos.splice(undoAction.previousIndex, 0, undoAction.todo);
        return newTodos;
      });
    }
    setUndoAction(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      setTodos((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, text: editText.trim() } : t))
      );
    }
    setEditingId(null);
    setEditText("");
  };

  const clearCompleted = () => {
    const completed = todos.filter((t) => t.completed);
    if (completed.length === 0) return;
    setConfirmDialog({
      visible: true,
      title: "Clear Completed",
      message: `Remove ${completed.length} completed todo${completed.length > 1 ? "s" : ""}?`,
      onConfirm: () => {
        setTodos((prev) => prev.filter((t) => !t.completed));
        setConfirmDialog((prev) => ({ ...prev, visible: false }));
      },
    });
  };

  const toggleAll = () => {
    const allCompleted = todos.every((t) => t.completed);
    setTodos((prev) => prev.map((t) => ({ ...t, completed: !allCompleted })));
  };

  // ==================== DRAG & DROP ====================
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null);
      setDragOverId(null);
      return;
    }
    setTodos((prev) => {
      const items = [...prev];
      const dragIdx = items.findIndex((t) => t.id === draggedId);
      const dropIdx = items.findIndex((t) => t.id === targetId);
      const [dragged] = items.splice(dragIdx, 1);
      items.splice(dropIdx, 0, dragged);
      return items;
    });
    setDraggedId(null);
    setDragOverId(null);
  };

  // ==================== LONG PRESS (MOBILE) ====================
  const handleTouchStart = (todoId: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    longPressTimer.current = setTimeout(() => {
      setContextMenu({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        todoId,
      });
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ==================== EXPORT / IMPORT ====================
  const exportData = () => {
    const data = JSON.stringify(todos, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `todos-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setConfirmDialog({
            visible: true,
            title: "Import Data",
            message: `Import ${imported.length} todos? This will replace your current list.`,
            onConfirm: () => {
              setTodos(imported);
              setConfirmDialog((prev) => ({ ...prev, visible: false }));
            },
          });
        }
      } catch {
        alert("Invalid file format");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // ==================== FILTERING & SORTING ====================
  const filteredTodos = todos
    .filter((t) => {
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    })
    .filter((t) =>
      searchQuery
        ? t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.category.toLowerCase().includes(searchQuery.toLowerCase())
        : true
    )
    .sort((a, b) => {
      switch (sort) {
        case "oldest": return a.createdAt - b.createdAt;
        case "priority": {
          const p = { high: 0, medium: 1, low: 2 };
          return p[a.priority] - p[b.priority];
        }
        case "dueDate":
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case "alphabetical": return a.text.localeCompare(b.text);
        default: return b.createdAt - a.createdAt;
      }
    });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;
  const completionPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  // ==================== HELPERS ====================
  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date(new Date().toDateString());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.getTime() === today.getTime()) return "Today";
    if (date.getTime() === tomorrow.getTime()) return "Tomorrow";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const isDark = theme === "dark";

  // ==================== RENDER ====================
  return (
    <div
      className="min-h-screen py-4 px-4 pb-8 transition-colors duration-300"
      style={{
        paddingTop: `max(1rem, var(--sat))`,
        paddingBottom: `max(2rem, var(--sab))`,
        paddingLeft: `max(1rem, var(--sal))`,
        paddingRight: `max(1rem, var(--sar))`,
      }}
    >
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>
              ✨ Todo List
            </h1>
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              {activeCount} task{activeCount !== 1 ? "s" : ""} remaining
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`p-2.5 rounded-xl transition-all ${
                showSearch
                  ? "bg-indigo-500 text-white"
                  : isDark
                  ? "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              } shadow-md`}
              aria-label="Search"
              title="Search (Ctrl+F)"
            >
              <Icons.Search />
            </button>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`p-2.5 rounded-xl transition-all shadow-md ${
                isDark
                  ? "bg-slate-700 text-yellow-400 hover:bg-slate-600"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              aria-label="Toggle theme"
              title="Toggle theme (Ctrl+D)"
            >
              {isDark ? <Icons.Sun /> : <Icons.Moon />}
            </button>
          </div>
        </header>

        {/* Search Bar */}
        {showSearch && (
          <div className="animate-fade-in mb-4">
            <div className={`flex items-center gap-3 rounded-2xl shadow-lg p-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
              <Icons.Search />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search todos..."
                autoFocus
                className={`flex-1 bg-transparent outline-none text-base ${isDark ? "text-white placeholder-slate-400" : "text-gray-700 placeholder-gray-400"}`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-1">
                  <Icons.X />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {todos.length > 0 && (
          <div className={`rounded-2xl shadow-lg p-4 mb-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${isDark ? "text-slate-300" : "text-gray-600"}`}>
                Progress
              </span>
              <span className={`text-sm font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                {completionPercent}%
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Add Todo Button / Form */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full mb-4 p-4 rounded-2xl shadow-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium flex items-center justify-center gap-2 hover:from-indigo-600 hover:to-purple-600 active:scale-[0.98] transition-all"
            title="Add new todo (Ctrl+N)"
          >
            <Icons.Plus />
            <span>Add New Todo</span>
          </button>
        ) : (
          <div className={`animate-scale-in rounded-2xl shadow-lg p-5 mb-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`font-semibold ${isDark ? "text-white" : "text-gray-800"}`}>New Todo</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className={`p-1.5 rounded-lg ${isDark ? "hover:bg-slate-700" : "hover:bg-gray-100"}`}
              >
                <Icons.X />
              </button>
            </div>

            <input
              ref={inputRef}
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              placeholder="What needs to be done?"
              autoFocus
              className={`w-full px-4 py-3 rounded-xl border-2 mb-3 outline-none transition-colors ${
                isDark
                  ? "bg-slate-900 border-slate-600 text-white placeholder-slate-400 focus:border-indigo-400"
                  : "bg-white border-gray-200 text-gray-700 placeholder-gray-400 focus:border-indigo-400"
              }`}
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              {/* Priority */}
              <div>
                <label className={`text-xs font-medium mb-1 block ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  Priority
                </label>
                <div className="flex gap-1">
                  {(["low", "medium", "high"] as Priority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewPriority(p)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                        newPriority === p
                          ? `${PRIORITY_CONFIG[p].color} text-white shadow-sm`
                          : isDark
                          ? "bg-slate-700 text-slate-300"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {PRIORITY_CONFIG[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className={`text-xs font-medium mb-1 block ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className={`w-full py-2 px-3 rounded-lg text-sm outline-none ${
                    isDark
                      ? "bg-slate-700 text-white border-slate-600"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Due Date */}
            <div className="mb-4">
              <label className={`text-xs font-medium mb-1 block ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                Due Date (optional)
              </label>
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className={`w-full px-3 py-2 rounded-lg text-sm outline-none ${
                  isDark
                    ? "bg-slate-700 text-white border-slate-600"
                    : "bg-gray-100 text-gray-700 border-gray-200"
                }`}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(false)}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={addTodo}
                disabled={!newText.trim()}
                className="flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-500 to-purple-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-purple-600 active:scale-[0.98] transition-all shadow-md"
              >
                Add Todo
              </button>
            </div>
          </div>
        )}

        {/* Filter & Sort Bar */}
        {todos.length > 0 && (
          <div className={`rounded-2xl shadow-lg p-3 mb-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={toggleAll}
                className={`p-2 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
                  todos.every((t) => t.completed)
                    ? "text-indigo-500"
                    : isDark
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Toggle all"
              >
                ✓
              </button>
              <div className="flex gap-1">
                {(["all", "active", "completed"] as FilterType[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                      filter === f
                        ? "bg-indigo-500 text-white shadow-sm"
                        : isDark
                        ? "text-slate-400 hover:bg-slate-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"}`}>Sort:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortType)}
                className={`text-xs py-1 px-2 rounded-lg outline-none ${
                  isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-600"
                }`}
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="priority">Priority</option>
                <option value="dueDate">Due Date</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>
        )}

        {/* Todo List */}
        <div className={`rounded-2xl shadow-lg overflow-hidden mb-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
          <div className={`divide-y ${isDark ? "divide-slate-700" : "divide-gray-100"}`}>
            {filteredTodos.length === 0 ? (
              <div className="py-16 text-center">
                <div className="text-6xl mb-4">
                  {todos.length === 0 ? "📝" : searchQuery ? "🔍" : "🎉"}
                </div>
                <p className={`text-lg ${isDark ? "text-slate-400" : "text-gray-400"}`}>
                  {todos.length === 0
                    ? "No todos yet. Add one above!"
                    : searchQuery
                    ? "No matching todos"
                    : "All done! Great job!"}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={() => handleDragStart(todo.id)}
                  onDragOver={(e) => handleDragOver(e, todo.id)}
                  onDrop={() => handleDrop(todo.id)}
                  onDragEnd={() => { setDraggedId(null); setDragOverId(null); }}
                  onTouchStart={(e) => handleTouchStart(todo.id, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  className={`flex items-center gap-3 px-4 py-4 transition-all duration-200 no-select ${
                    todo.completed ? "opacity-50" : ""
                  } ${draggedId === todo.id ? "opacity-30" : ""} ${
                    dragOverId === todo.id && draggedId !== todo.id
                      ? isDark ? "bg-slate-700" : "bg-indigo-50"
                      : ""
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing p-1 hidden sm:block">
                    <Icons.GripVertical />
                  </div>

                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      todo.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : isDark
                        ? "border-slate-500 hover:border-indigo-400"
                        : "border-gray-300 hover:border-indigo-400"
                    }`}
                    aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
                  >
                    {todo.completed && <Icons.Check />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === todo.id ? (
                      <input
                        ref={editInputRef}
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") { setEditingId(null); setEditText(""); }
                        }}
                        onBlur={saveEdit}
                        className={`w-full px-3 py-2 rounded-lg border-2 outline-none ${
                          isDark
                            ? "bg-slate-900 border-indigo-400 text-white"
                            : "bg-white border-indigo-400 text-gray-700"
                        }`}
                      />
                    ) : (
                      <>
                        <p
                          className={`font-medium truncate ${
                            todo.completed
                              ? "line-through text-gray-400"
                              : isDark ? "text-white" : "text-gray-700"
                          }`}
                        >
                          {todo.text}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {/* Priority dot */}
                          <span className={`inline-flex items-center gap-1 text-xs ${PRIORITY_CONFIG[todo.priority].textColor}`}>
                            <span className={`w-2 h-2 rounded-full ${PRIORITY_CONFIG[todo.priority].dot}`} />
                            {PRIORITY_CONFIG[todo.priority].label}
                          </span>
                          {/* Category */}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isDark ? "bg-slate-700 text-slate-300" : "bg-gray-100 text-gray-500"
                          }`}>
                            {todo.category}
                          </span>
                          {/* Due date */}
                          {todo.dueDate && (
                            <span className={`inline-flex items-center gap-1 text-xs ${
                              isOverdue(todo.dueDate) && !todo.completed
                                ? "text-red-500 font-medium"
                                : isDark ? "text-slate-400" : "text-gray-400"
                            }`}>
                              <Icons.Calendar />
                              {formatDate(todo.dueDate)}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Action Buttons (visible on hover for desktop, always via long-press for mobile) */}
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                    style={{ opacity: undefined }}
                  >
                    <button
                      onClick={() => startEditing(todo)}
                      className={`p-2.5 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        isDark ? "text-slate-400 hover:text-indigo-400 hover:bg-slate-700" : "text-gray-400 hover:text-indigo-500 hover:bg-indigo-50"
                      }`}
                      aria-label="Edit"
                    >
                      <Icons.Edit />
                    </button>
                    <button
                      onClick={() => requestDelete(todo.id)}
                      className={`p-2.5 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center ${
                        isDark ? "text-slate-400 hover:text-red-400 hover:bg-slate-700" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                      }`}
                      aria-label="Delete"
                    >
                      <Icons.Trash />
                    </button>
                    {/* Mobile menu button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setContextMenu({
                          visible: true,
                          x: rect.left,
                          y: rect.bottom + 4,
                          todoId: todo.id,
                        });
                      }}
                      className={`p-2.5 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center sm:hidden ${
                        isDark ? "text-slate-400 hover:bg-slate-700" : "text-gray-400 hover:bg-gray-100"
                      }`}
                      aria-label="More options"
                    >
                      <Icons.MoreVertical />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {todos.length > 0 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? "border-slate-700" : "border-gray-100"}`}>
              <span className={`text-sm ${isDark ? "text-slate-400" : "text-gray-500"}`}>
                {activeCount} item{activeCount !== 1 ? "s" : ""} left
              </span>
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className={`text-sm font-medium px-3 py-2 rounded-lg transition-all min-h-[44px] ${
                    isDark ? "text-slate-400 hover:text-red-400 hover:bg-slate-700" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                  }`}
                >
                  Clear completed ({completedCount})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Export/Import & Tips */}
        <div className={`rounded-2xl shadow-lg p-4 mb-4 ${isDark ? "bg-slate-800" : "bg-white"}`}>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icons.Download />
                <span className="hidden sm:inline">Export</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px] ${
                  isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icons.Upload />
                <span className="hidden sm:inline">Import</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </div>
            <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-400"} hidden sm:block`}>
              💡 Long-press on mobile • Drag to reorder • Ctrl+N to add
            </p>
          </div>
        </div>

        {/* Keyboard shortcuts help */}
        <div className={`text-center text-xs ${isDark ? "text-slate-500" : "text-gray-400"} space-y-1`}>
          <p className="hidden sm:block">
            <kbd className={`px-1.5 py-0.5 rounded ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>Ctrl+N</kbd> New •{" "}
            <kbd className={`px-1.5 py-0.5 rounded ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>Ctrl+F</kbd> Search •{" "}
            <kbd className={`px-1.5 py-0.5 rounded ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>Ctrl+D</kbd> Theme •{" "}
            <kbd className={`px-1.5 py-0.5 rounded ${isDark ? "bg-slate-700" : "bg-gray-200"}`}>Ctrl+Z</kbd> Undo
          </p>
          <p className="sm:hidden">Long-press a todo for options</p>
        </div>
      </div>

      {/* ==================== OVERLAYS ==================== */}

      {/* Context Menu (Mobile long-press / Desktop menu button) */}
      {contextMenu.visible && contextMenu.todoId && (
        <div
          className="fixed z-50 animate-scale-in"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 180),
            top: Math.min(contextMenu.y, window.innerHeight - 150),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`rounded-xl shadow-2xl overflow-hidden border ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
            <button
              onClick={() => {
                const todo = todos.find((t) => t.id === contextMenu.todoId);
                if (todo) startEditing(todo);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left min-h-[48px] ${
                isDark ? "text-slate-200 hover:bg-slate-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icons.Edit />
              <span className="text-sm font-medium">Edit</span>
            </button>
            <button
              onClick={() => {
                const todo = todos.find((t) => t.id === contextMenu.todoId);
                if (todo) toggleTodo(todo.id);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left min-h-[48px] ${
                isDark ? "text-slate-200 hover:bg-slate-700" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icons.Check />
              <span className="text-sm font-medium">
                {todos.find((t) => t.id === contextMenu.todoId)?.completed ? "Mark Incomplete" : "Mark Complete"}
              </span>
            </button>
            <button
              onClick={() => {
                requestDelete(contextMenu.todoId!);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 min-h-[48px]"
            >
              <Icons.Trash />
              <span className="text-sm font-medium">Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog.visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-scale-in ${isDark ? "bg-slate-800" : "bg-white"}`}>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? "text-white" : "text-gray-800"}`}>
              {confirmDialog.title}
            </h3>
            <p className={`mb-6 ${isDark ? "text-slate-300" : "text-gray-600"}`}>
              {confirmDialog.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, visible: false }))}
                className={`flex-1 py-3 rounded-xl font-medium transition-all min-h-[48px] ${
                  isDark ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all min-h-[48px] shadow-md"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Toast */}
      {undoAction && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
          <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl ${isDark ? "bg-slate-700" : "bg-gray-800"} text-white`}>
            <span className="text-sm">
              {undoAction.type === "delete" ? "Todo deleted" : "Todo updated"}
            </span>
            <button
              onClick={performUndo}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-sm font-medium min-h-[36px]"
            >
              <Icons.Undo />
              Undo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
