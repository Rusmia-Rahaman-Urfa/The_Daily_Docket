import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from 'uuid';

// --- Filter Definitions (Unchanged) ---
const FILTERS = {
  ALL: 'all',
  PENDING: 'pending',
  COMPLETED: 'completed',
};

// --- Helper Components (Updated Button to accept className for custom styles) ---

const Title = ({ children }) => (
  <h1 className="title-style">
    {children}
  </h1>
);

const Button = ({ onClick, children, isPrimary, isDisabled = false, isActive = false, className = '' }) => (
  <button
    onClick={onClick}
    className={`button-base ${isPrimary ? 'button-primary' : 'button-secondary'} ${isActive ? 'button-active' : ''} ${className}`}
    disabled={isDisabled}
  >
    {children}
  </button>
);

const InputField = ({ value, onChange, placeholder, onKeyDown, className = '' }) => (
  <input
    type="text"
    value={value}
    onChange={onChange}
    onKeyDown={onKeyDown}
    className={`input-field ${className}`}
    placeholder={placeholder}
  />
);

// Memoized Helper Components
const MemorizedTitle = memo(Title);
const MemorizedButton = memo(Button);

// --- Task Item Component (MAJOR CHANGES HERE) ---

const TaskItem = memo(({ task, onToggle, onDelete, onEdit }) => {
  // NEW STATE: Manage edit mode and temporary text input for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);

  // Focus the input when entering edit mode (Extra Feature/Pattern Following)
  const inputRef = useRef(null); 
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  // Handler to enter edit mode
  const handleStartEdit = useCallback(() => {
    setIsEditing(true);
    setEditText(task.text); // Reset text just in case
  }, [task.text]);

  // Handler for text input change during editing
  const handleEditChange = useCallback((e) => {
    setEditText(e.target.value);
  }, []);

  // Handler to save the edited task
  const handleSaveEdit = useCallback(() => {
    const trimmedText = editText.trim();
    if (trimmedText === "" || trimmedText === task.text) {
      setIsEditing(false); // Cancel if text is empty or unchanged
      return;
    }
    onEdit(task.id, trimmedText); // Call parent update function
    setIsEditing(false);
  }, [editText, task.id, onEdit, task.text]);
  
  // Handler to save the edited task on Enter key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    }
  }, [handleSaveEdit]);


  // Handler to toggle completion (Unchanged)
  const handleToggle = useCallback(() => {
    // Only allow toggling if not editing
    if (!isEditing) {
      onToggle(task.id);
    }
  }, [onToggle, task.id, isEditing]);

  // Handler to delete (Unchanged)
  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [onDelete, task.id]);


  if (isEditing) {
    return (
      <li className="task-item-base task-item-editing">
        <InputField
          ref={inputRef}
          value={editText}
          onChange={handleEditChange}
          onKeyDown={handleKeyDown}
          placeholder="Edit task..."
          className="edit-input-field"
        />
        <MemorizedButton 
          onClick={handleSaveEdit} 
          isPrimary={true}
          className="save-edit-button"
        >
          Save
        </MemorizedButton>
        <MemorizedButton 
          onClick={() => setIsEditing(false)} 
          isPrimary={false}
          className="cancel-edit-button"
        >
          ✕
        </MemorizedButton>
      </li>
    );
  }

  return (
    <li className={`task-item-base ${task.completed ? 'task-item-completed' : 'task-item-pending'}`}>
      <span className="task-text-container" onClick={handleToggle}>
        <span className={`task-checkbox ${task.completed ? 'checked' : ''}`}>
          {task.completed ? '✓' : ''}
        </span>
        <span className={`task-text ${task.completed ? 'line-through' : ''}`}>
          {task.text}
        </span>
      </span>
      
      {/* NEW: Edit Button */}
      <MemorizedButton 
        onClick={handleStartEdit} 
        isPrimary={false}
        className="edit-button"
      >
        ✏️
      </MemorizedButton>
      
      {/* Delete Button (Moved to end) */}
      <MemorizedButton 
        onClick={handleDelete} 
        isPrimary={false}
        className="delete-button"
      >
        🗑️
      </MemorizedButton>
    </li>
  );
});

// --- To-Do Application Logic (Updated) ---

const ToDoApp = () => {
  // Primary State: List of all tasks (Unchanged)
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('react-todo-tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  
  // Secondary States (Unchanged)
  const [newTaskText, setNewTaskText] = useState("");
  const [filterState, setFilterState] = useState(FILTERS.ALL);

  // ... (useRef and useEffect for local storage unchanged) ...
  const totalTasksRef = useRef(tasks.length); 
  
  useEffect(() => {
    localStorage.setItem('react-todo-tasks', JSON.stringify(tasks));
    totalTasksRef.current = tasks.length;
  }, [tasks]);

  // ... (handleNewTaskTextChange, handleAddTask, handleKeyDown, handleDeleteTask, handleToggleTask, handleClearCompleted, handleFilterChange - Unchanged) ...
  const handleNewTaskTextChange = useCallback((e) => {
    setNewTaskText(e.target.value);
  }, []);

  const handleAddTask = useCallback(() => {
    if (newTaskText.trim() === "") return;

    const newTask = {
      id: uuidv4(),
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks(prevTasks => [newTask, ...prevTasks]);
    setNewTaskText("");
  }, [newTaskText]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  }, [handleAddTask]);

  const handleDeleteTask = useCallback((id) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  }, []);

  const handleToggleTask = useCallback((id) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  }, []);
  
  const handleClearCompleted = useCallback(() => {
    setTasks(prevTasks => prevTasks.filter(task => !task.completed));
  }, []);
  
  const handleFilterChange = useCallback((filter) => {
    setFilterState(filter);
  }, []);
  
  // NEW: Handler to edit a task's text
  const handleEditTask = useCallback((id, newText) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, text: newText } : task
      )
    );
  }, []);


  // useMemo for filtering (Unchanged)
  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending = tasks.filter(task => !task.completed);
    const completed = tasks.filter(task => task.completed);
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    switch (filterState) {
      case FILTERS.PENDING:
        return pendingTasks;
      case FILTERS.COMPLETED:
        return completedTasks;
      case FILTERS.ALL:
      default:
        return tasks;
    }
  }, [tasks, filterState, pendingTasks, completedTasks]);


  // Helper component for task list rendering (Updated to pass onEdit)
  const TaskList = ({ tasks, title }) => (
    <div className="task-list-section">
      <h2 className="task-list-title">{title} ({tasks.length})</h2>
      {tasks.length === 0 ? (
        <p className="tasks-empty-message">
          {filterState === FILTERS.ALL 
            ? "No tasks here! Add one above. 🎉"
            : `No ${filterState} tasks to show.`
          }
        </p>
      ) : (
        <ul className="task-list">
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggleTask}
              onDelete={handleDeleteTask}
              onEdit={handleEditTask} // NEW PROP
            />
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="app-container">
      <MemorizedTitle>My Productivity To-Do List 🚀</MemorizedTitle>

      {/* Task Input Section (Unchanged) */}
      <div className="task-input-section">
        <InputField
          value={newTaskText}
          onChange={handleNewTaskTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Add a new task..."
        />
        <MemorizedButton 
          onClick={handleAddTask} 
          isPrimary={true}
          isDisabled={newTaskText.trim() === ""}
        >
          Add
        </MemorizedButton>
      </div>

      {/* Stats/Extra Info Box (Unchanged) */}
      <div className="stats-box">
        <p className="stats-text">Total Tasks: <span className="stats-number">{tasks.length}</span></p>
        <p className="stats-text">Completed: <span className="stats-number completed">{completedTasks.length}</span></p>
        <p className="stats-text">Pending: <span className="stats-number pending">{pendingTasks.length}</span></p>
      </div>

      {/* Filter Bar (Unchanged) */}
      <div className="filter-bar">
        {Object.values(FILTERS).map((filter) => (
          <MemorizedButton
            key={filter}
            onClick={() => handleFilterChange(filter)}
            isPrimary={false}
            isActive={filterState === filter}
            className="filter-button"
          >
            {filter.charAt(0).toUpperCase() + filter.slice(1)}
          </MemorizedButton>
        ))}
        {completedTasks.length > 0 && (
          <MemorizedButton 
            onClick={handleClearCompleted} 
            isPrimary={true}
            className="clear-button"
          >
            Clear ({completedTasks.length})
          </MemorizedButton>
        )}
      </div>
      
      <hr className="divider" />

      {/* Task List (Unchanged content, but now uses TaskItem with edit logic) */}
      <div className="task-lists-container">
        <TaskList 
            tasks={filteredTasks} 
            title={
                filterState === FILTERS.ALL 
                ? "All Tasks" 
                : `${filterState.charAt(0).toUpperCase() + filterState.slice(1)} Tasks`
            }
        />
      </div>
    </div>
  );
};

export default ToDoApp;