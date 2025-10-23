import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const STATUS_OPTIONS = ['To Do', 'In Progress', 'Review', 'Published'];

export default function MarketingTasks() {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ task_name: '', project: '', deadline: '', assigned_member: '', status: 'To Do', description: '' });

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API}/marketing`);
      setTasks(res.data);
    } catch (error) {
      toast.error('Error loading tasks');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/marketing`, formData);
      toast.success('Task created');
      fetchTasks();
      setShowModal(false);
      setFormData({ task_name: '', project: '', deadline: '', assigned_member: '', status: 'To Do', description: '' });
    } catch (error) {
      toast.error('Error saving task');
    }
  };

  const groupedTasks = STATUS_OPTIONS.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {});

  return (
    <div data-testid="marketing-tasks-page">
      <div className="page-header">
        <div><h2>Marketing Tasks</h2><p>Trello-style task management</p></div>
        <button className="btn-primary" onClick={() => setShowModal(true)} data-testid="add-marketing-task-btn"><Plus size={20} /><span>Add Task</span></button>
      </div>

      <div className="kanban-board" data-testid="kanban-board">
        {STATUS_OPTIONS.map(status => (
          <div key={status} className="kanban-column" data-testid={`kanban-column-${status}`}>
            <div className="kanban-header"><h3>{status}</h3><span className="task-count">{groupedTasks[status]?.length || 0}</span></div>
            <div className="kanban-cards">
              {groupedTasks[status]?.map(task => (
                <div key={task.id} className="kanban-card" data-testid={`task-card-${task.id}`}>
                  <h4>{task.task_name}</h4>
                  <p className="task-project">{task.project}</p>
                  <p className="task-description">{task.description}</p>
                  <div className="task-meta">
                    <span className="task-member">{task.assigned_member}</span>
                    <span className="task-deadline">{task.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay"><div className="modal-content">
          <div className="modal-header"><h3>New Marketing Task</h3><button onClick={() => setShowModal(false)} className="close-btn">&times;</button></div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>Task Name</label><input type="text" value={formData.task_name} onChange={(e) => setFormData({...formData, task_name: e.target.value})} required data-testid="input-task-name" /></div>
            <div className="form-group"><label>Project</label><input type="text" value={formData.project} onChange={(e) => setFormData({...formData, project: e.target.value})} required /></div>
            <div className="form-group"><label>Deadline</label><input type="date" value={formData.deadline} onChange={(e) => setFormData({...formData, deadline: e.target.value})} required /></div>
            <div className="form-group"><label>Assigned Member</label><input type="text" value={formData.assigned_member} onChange={(e) => setFormData({...formData, assigned_member: e.target.value})} required /></div>
            <div className="form-group"><label>Description</label><textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} /></div>
            <div className="form-group"><label>Status</label><select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>{STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}</select></div>
            <div className="modal-actions"><button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button><button type="submit" className="btn-primary" data-testid="submit-marketing-task">Create</button></div>
          </form>
        </div></div>
      )}

      <style jsx>{`
        .page-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
        .page-header button { display: flex; align-items: center; gap: 8px; }
        .kanban-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; overflow-x: auto; }
        .kanban-column { background: white; border-radius: 12px; padding: 16px; min-width: 250px; }
        .kanban-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
        .kanban-header h3 { font-size: 16px; font-weight: 600; color: #2d3748; }
        .task-count { background: #667eea; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
        .kanban-cards { display: flex; flex-direction: column; gap: 12px; }
        .kanban-card { background: #f7fafc; border-radius: 8px; padding: 16px; transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
        .kanban-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
        .kanban-card h4 { font-size: 14px; color: #2d3748; margin-bottom: 8px; }
        .task-project { font-size: 12px; color: #667eea; font-weight: 600; margin-bottom: 8px; }
        .task-description { font-size: 13px; color: #718096; margin-bottom: 12px; }
        .task-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; }
        .task-member { color: #4a5568; font-weight: 500; }
        .task-deadline { color: #718096; }
        @media (max-width: 1024px) { .kanban-board { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .kanban-board { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
