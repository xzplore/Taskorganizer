import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority } from './types';
import TaskInput from './components/TaskInput';
import TaskList from './components/TaskList';
import ProductivityTracker from './components/ProductivityTracker';
import Notification from './components/Notification';

const App: React.FC = () => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const savedTasks = localStorage.getItem('tasks');
      return savedTasks ? JSON.parse(savedTasks) : [];
    } catch (error)
      {
      console.error("Could not parse tasks from localStorage", error);
      return [];
    }
  });

  const [notification, setNotification] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute to check for overdue tasks
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000); // Auto-dismiss after 4 seconds
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  const addTask = (text: string, priority: TaskPriority, dueDate?: string) => {
    const trimmedText = text.trim();
    if (trimmedText === '') return;
    
    const commandText = trimmedText.toLowerCase();

    if (commandText === 'admin') {
      setIsAdmin(true);
      setNotification('وضع المسؤول مفعل!');
      return;
    }
    if (commandText === 'unadmin') {
      setIsAdmin(false);
      setNotification('تم إلغاء تفعيل وضع المسؤول.');
      return;
    }

    if (tasks.some(task => task.text.trim().toLowerCase() === trimmedText.toLowerCase())) {
      setNotification('هذه المهمة موجودة بالفعل!');
      return;
    }

    const newTask: Task = {
      id: crypto.randomUUID(),
      text: trimmedText,
      completed: false,
      createdAt: Date.now(),
      priority,
      dueDate: dueDate || undefined,
    };
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };

  const toggleTask = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };

  const sortedTasks = useMemo(() => {
    const priorityOrder: { [key in TaskPriority]: number } = { high: 1, medium: 2, low: 3 };
    return [...tasks].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.createdAt - a.createdAt; // Keep newest first for same priority
    });
  }, [tasks]);

  const { todayTasks, overdueTasks } = useMemo(() => {
    const todayTasksList: Task[] = [];
    const overdueTasksList: Task[] = [];

    sortedTasks.forEach(task => {
      const isOverdue = !task.completed && task.dueDate && new Date(task.dueDate) < currentTime;

      if (isOverdue) {
        overdueTasksList.push(task);
      } else {
        todayTasksList.push(task);
      }
    });
    
    const priorityOrder: { [key in TaskPriority]: number } = { high: 1, medium: 2, low: 3 };
    overdueTasksList.sort((a, b) => {
       const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime();
    });

    return { todayTasks: todayTasksList, overdueTasks: overdueTasksList };
  }, [sortedTasks, currentTime]);

  const productivityPercentage = useMemo(() => {
    const allTasks = [...todayTasks, ...overdueTasks];
    if (allTasks.length === 0) return 100;

    const completedTasks = todayTasks.filter(task => task.completed).length;

    return Math.round((completedTasks / allTasks.length) * 100);
  }, [todayTasks, overdueTasks]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className={`p-4 md:p-6 backdrop-blur-sm border-b sticky top-0 z-10 transition-colors duration-300 ${isAdmin ? 'bg-amber-400/50 dark:bg-amber-800/50 border-amber-500 dark:border-amber-700' : 'bg-slate-200/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700'}`}>
        <div className="max-w-3xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600 dark:text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <h1 className="text-3xl font-bold text-cyan-600 dark:text-cyan-400">منظم المهام</h1>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500" aria-label="Toggle theme">
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
        </div>
      </header>

      <Notification message={notification} onClose={() => setNotification(null)} />
      
      <main className="flex-grow p-4 md:p-6 pb-60">
        <div className="max-w-3xl mx-auto">
          <ProductivityTracker percentage={productivityPercentage} theme={theme} />
          
           {overdueTasks.length > 0 && (
            <TaskList
              title="مهام متأخرة"
              tasks={overdueTasks}
              onToggle={toggleTask}
              onDelete={deleteTask}
              isOverdue={true}
              isAdmin={isAdmin}
            />
          )}

          <TaskList
            title="المهام القادمة"
            tasks={todayTasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            isAdmin={isAdmin}
          />

          <footer className="text-center p-4 text-xs text-slate-500 dark:text-slate-600 mt-8">
            حقوق الطبع محفوظة لمشروع مادة مهارات الدراسة © {new Date().getFullYear()}
          </footer>
        </div>
      </main>

      <TaskInput onAddTask={addTask} />
    </div>
  );
};

export default App;