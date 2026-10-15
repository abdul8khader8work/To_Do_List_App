import { useState, useEffect, useRef } from "react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

type FilterType = "all" | "active" | "completed";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadTodos(): Todo[] {
  try {
    const stored = localStorage.getItem("todos");
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Failed to load todos:", e);
  }
  return [];
}

function saveTodos(todos: Todo[]) {
  try {
    localStorage.setItem("todos", JSON.stringify(todos));
  } catch (e) {
    console.error("Failed to save todos:", e);
  }
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>(() => loadTodos());
  const [inputValue, setInputValue] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const addTodo = () => {
    const text = inputValue.trim();
    if (!text) return;

    const newTodo: Todo = {
      id: generateId(),
      text,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos((prev) => [newTodo, ...prev]);
    setInputValue("");
    inputRef.current?.focus();
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    if (editingId && editText.trim()) {
      setTodos((prev) =>
        prev.map((todo) =>
          todo.id === editingId ? { ...todo, text: editText.trim() } : todo
        )
      );
    }
    setEditingId(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const clearCompleted = () => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  };

  const toggleAll = () => {
    const allCompleted = todos.every((todo) => todo.completed);
    setTodos((prev) =>
      prev.map((todo) => ({ ...todo, completed: !allCompleted }))
    );
  };

  const filteredTodos = todos.filter((todo) => {
    if (filter === "active") return !todo.completed;
    if (filter === "completed") return todo.completed;
    return true;
  });

  const activeCount = todos.filter((todo) => !todo.completed).length;
  const completedCount = todos.filter((todo) => todo.completed).length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTodo();
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      saveEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">✨ Todo List</h1>
          <p className="text-gray-500">Stay organized, get things done</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-400 focus:outline-none transition-colors text-gray-700 placeholder-gray-400"
            />
            <button
              onClick={addTodo}
              disabled={!inputValue.trim()}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
            >
              Add
            </button>
          </div>
        </div>

        {/* Todo List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          {/* Toggle All & Filter Bar */}
          {todos.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50">
              <button
                onClick={toggleAll}
                className={`text-xl transition-colors ${
                  todos.every((t) => t.completed) && todos.length > 0
                    ? "text-indigo-500"
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
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filter === f
                        ? "bg-indigo-500 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Todo Items */}
          <div className="divide-y divide-gray-100">
            {filteredTodos.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-5xl mb-3">
                  {todos.length === 0 ? "📝" : "🎉"}
                </div>
                <p className="text-gray-400 text-lg">
                  {todos.length === 0
                    ? "No todos yet. Add one above!"
                    : "No matching todos"}
                </p>
              </div>
            ) : (
              filteredTodos.map((todo) => (
                <div
                  key={todo.id}
                  className={`group flex items-center gap-3 px-6 py-4 transition-all duration-200 hover:bg-gray-50 ${
                    todo.completed ? "opacity-60" : ""
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      todo.completed
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-gray-300 hover:border-indigo-400"
                    }`}
                  >
                    {todo.completed && (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Text */}
                  {editingId === todo.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                      onBlur={saveEdit}
                      className="flex-1 px-3 py-1 rounded-lg border-2 border-indigo-400 focus:outline-none text-gray-700"
                    />
                  ) : (
                    <span
                      onDoubleClick={() => startEditing(todo)}
                      className={`flex-1 cursor-pointer select-none ${
                        todo.completed
                          ? "line-through text-gray-400"
                          : "text-gray-700"
                      }`}
                      title="Double-click to edit"
                    >
                      {todo.text}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => startEditing(todo)}
                      className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors rounded-lg hover:bg-indigo-50"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {todos.length > 0 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
              <span>
                {activeCount} item{activeCount !== 1 ? "s" : ""} left
              </span>
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-gray-400 hover:text-red-500 transition-colors font-medium"
                >
                  Clear completed ({completedCount})
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="text-center text-sm text-gray-400">
          <p>💡 Double-click a todo to edit it</p>
        </div>
      </div>
    </div>
  );
}
