import React, { useState, useEffect } from 'react'
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  MapPin,
  Globe,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  MessageSquare,
  Upload,
  Plus,
  Edit2,
  Trash2,
  Phone as PhoneIcon,
  Send,
  Video,
  Users
} from 'lucide-react'
import type { CRMLead } from '../../services/crmLeadsService'
import {
  crmActivitiesService,
  crmTasksService,
  crmAppointmentsService,
  crmNotesService,
  type CRMActivity,
  type CRMTask,
  type CRMAppointment,
  type CRMNote
} from '../../services/crmActivitiesService'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import './LeadDetailModal.css'

interface LeadDetailModalProps {
  lead: CRMLead
  onClose: () => void
  onUpdate: () => void
}

type TabType = 'overview' | 'activities' | 'tasks' | 'appointments' | 'notes' | 'timeline'

const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ lead, onClose, onUpdate }) => {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)  // True initially to show loading on mount
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Data states
  const [activities, setActivities] = useState<CRMActivity[]>([])
  const [tasks, setTasks] = useState<CRMTask[]>([])
  const [appointments, setAppointments] = useState<CRMAppointment[]>([])
  const [notes, setNotes] = useState<CRMNote[]>([])

  // Form states
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showNoteForm, setShowNoteForm] = useState(false)

  // Get current user and organization
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)

        // Get organization
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (userData) {
          setOrganizationId(userData.organization_id)
        }
      }
    }
    getCurrentUser()
  }, [])

  // Load ALL data once on mount for smooth tab switching
  useEffect(() => {
    loadAllData()
  }, [lead.id])

  const loadAllData = async () => {
    try {
      setLoading(true)

      // Load all data in parallel for instant tab switching
      const [
        activitiesData,
        tasksData,
        appointmentsData,
        notesData
      ] = await Promise.all([
        crmActivitiesService.getActivitiesByLead(lead.id).catch(() => []),
        crmTasksService.getTasksByLead(lead.id).catch(() => []),
        crmAppointmentsService.getAppointmentsByLead(lead.id).catch(() => []),
        crmNotesService.getNotesByLead(lead.id).catch(() => [])
      ])

      setActivities(activitiesData)
      setTasks(tasksData)
      setAppointments(appointmentsData)
      setNotes(notesData)

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Reload data helper (chiamato dopo create/update)
  const loadTabData = async () => {
    await loadAllData()
  }

  // Activity handlers
  const handleCreateActivity = async (data: any) => {
    if (!currentUserId) return
    try {
      await crmActivitiesService.createActivity({
        lead_id: lead.id,
        ...data
      }, currentUserId)
      setShowActivityForm(false)
      loadTabData()
    } catch (error) {
      console.error('Error creating activity:', error)
      toast.showError('Errore', 'Impossibile creare l\'attività')
    }
  }

  // Task handlers
  const handleCreateTask = async (data: any) => {
    if (!currentUserId) return
    try {
      await crmTasksService.createTask({
        lead_id: lead.id,
        assigned_to: currentUserId,
        ...data
      }, currentUserId)
      setShowTaskForm(false)
      loadTabData()
    } catch (error) {
      console.error('Error creating task:', error)
      toast.showError('Errore', 'Impossibile creare il task')
    }
  }

  const handleCompleteTask = async (taskId: string) => {
    try {
      await crmTasksService.completeTask(taskId)
      loadTabData()
    } catch (error) {
      console.error('Error completing task:', error)
    }
  }

  // Appointment handlers
  const handleCreateAppointment = async (data: any) => {
    if (!currentUserId) return
    try {
      await crmAppointmentsService.createAppointment({
        lead_id: lead.id,
        assigned_to: currentUserId,
        ...data
      }, currentUserId)
      setShowAppointmentForm(false)
      loadTabData()
    } catch (error) {
      console.error('Error creating appointment:', error)
      toast.showError('Errore', 'Impossibile creare l\'appuntamento')
    }
  }

  // Note handlers
  const handleCreateNote = async (content: string) => {
    if (!currentUserId) return
    try {
      await crmNotesService.createNote({
        lead_id: lead.id,
        content
      }, currentUserId)
      setShowNoteForm(false)
      loadTabData()
    } catch (error) {
      console.error('Error creating note:', error)
      toast.showError('Errore', 'Impossibile creare la nota')
    }
  }


  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStageColor = (stage: string) => {
    const colors: { [key: string]: string } = {
      'lead': '#94a3b8',
      'contacted': '#60a5fa',
      'demo_scheduled': '#3b82f6',
      'demo_completed': '#8b5cf6',
      'proposal_sent': '#a855f7',
      'negotiation': '#ec4899',
      'contract_ready': '#f59e0b',
      'sign_contract': '#16a34a',
      'won': '#10b981',
      'lost': '#ef4444'
    }
    return colors[stage] || '#94a3b8'
  }

  const getStageLabel = (stage: string) => {
    const labels: { [key: string]: string } = {
      'lead': 'Lead',
      'contacted': 'Contattato',
      'demo_scheduled': 'Demo Fissata',
      'demo_completed': 'Demo Completata',
      'proposal_sent': 'Proposta Inviata',
      'negotiation': 'Negoziazione',
      'contract_ready': 'Contratto Pronto',
      'sign_contract': 'Firma Contratto',
      'won': 'Vinto',
      'lost': 'Perso'
    }
    return labels[stage] || stage
  }

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#f97316',
      'urgent': '#ef4444'
    }
    return colors[priority] || '#94a3b8'
  }

  return (
    <div className="lead-detail-modal-overlay" onClick={onClose}>
      <div className="lead-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <Building2 size={24} className="modal-icon" />
            <div>
              <h2>{lead.company_name}</h2>
              <p className="modal-subtitle">{lead.contact_name}</p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Stage Badge */}
        <div className="lead-stage-badge" style={{ background: getStageColor(lead.stage) }}>
          {getStageLabel(lead.stage)}
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Building2 size={16} />
            Overview
          </button>
          <button
            className={`modal-tab ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            <PhoneIcon size={16} />
            Attività
          </button>
          <button
            className={`modal-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            <CheckCircle size={16} />
            Task
            {tasks.filter(t => t.status !== 'completed').length > 0 && (
              <span className="tab-badge">{tasks.filter(t => t.status !== 'completed').length}</span>
            )}
          </button>
          <button
            className={`modal-tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <Calendar size={16} />
            Appuntamenti
          </button>
          <button
            className={`modal-tab ${activeTab === 'notes' ? 'active' : ''}`}
            onClick={() => setActiveTab('notes')}
          >
            <MessageSquare size={16} />
            Note
          </button>
          <button
            className={`modal-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Clock size={16} />
            Timeline
          </button>
        </div>

        {/* Tab Content */}
        <div className="modal-content">
          {loading ? (
            <div className="modal-loading">Caricamento...</div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="tab-overview">
                  <div className="overview-grid">
                    {/* Contact Info */}
                    <div className="overview-section">
                      <h3 className="section-title">Informazioni Contatto</h3>
                      <div className="info-list">
                        {lead.contact_name && (
                          <div className="info-item">
                            <User size={16} />
                            <span>{lead.contact_name}</span>
                          </div>
                        )}
                        {lead.email && (
                          <div className="info-item">
                            <Mail size={16} />
                            <a href={`mailto:${lead.email}`}>{lead.email}</a>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="info-item">
                            <Phone size={16} />
                            <a href={`tel:${lead.phone}`}>{lead.phone}</a>
                          </div>
                        )}
                        {lead.address && (
                          <div className="info-item">
                            <MapPin size={16} />
                            <span>{lead.address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Deal Info */}
                    <div className="overview-section">
                      <h3 className="section-title">Informazioni Deal</h3>
                      <div className="info-list">
                        <div className="info-item">
                          <DollarSign size={16} />
                          <span>Valore Mensile Stimato: {formatCurrency(lead.estimated_monthly_value || 0)}</span>
                        </div>
                        <div className="info-item">
                          <Calendar size={16} />
                          <span>Creato: {formatDate(lead.created_at)}</span>
                        </div>
                        {lead.last_contact_date && (
                          <div className="info-item">
                            <Clock size={16} />
                            <span>Ultimo contatto: {formatDate(lead.last_contact_date)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {lead.notes && (
                    <div className="overview-section" style={{ marginTop: '1.5rem' }}>
                      <h3 className="section-title">Note</h3>
                      <p className="lead-description">{lead.notes}</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="quick-actions">
                    <button className="btn-action btn-primary" onClick={() => setActiveTab('activities')}>
                      <PhoneIcon size={16} />
                      Registra Chiamata
                    </button>
                    <button className="btn-action btn-secondary" onClick={() => setActiveTab('tasks')}>
                      <CheckCircle size={16} />
                      Crea Task
                    </button>
                    <button className="btn-action btn-secondary" onClick={() => setActiveTab('appointments')}>
                      <Calendar size={16} />
                      Fissa Appuntamento
                    </button>
                  </div>
                </div>
              )}

              {/* ACTIVITIES TAB */}
              {activeTab === 'activities' && (
                <div className="tab-activities">
                  <div className="tab-header">
                    <h3>Attività</h3>
                    <button className="btn-add" onClick={() => setShowActivityForm(true)}>
                      <Plus size={16} />
                      Nuova Attività
                    </button>
                  </div>

                  {showActivityForm && (
                    <QuickActivityForm
                      onSave={handleCreateActivity}
                      onCancel={() => setShowActivityForm(false)}
                    />
                  )}

                  <div className="activities-list">
                    {activities.length === 0 ? (
                      <div className="empty-state">
                        <PhoneIcon size={48} />
                        <p>Nessuna attività registrata</p>
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TASKS TAB */}
              {activeTab === 'tasks' && (
                <div className="tab-tasks">
                  <div className="tab-header">
                    <h3>Task</h3>
                    <button className="btn-add" onClick={() => setShowTaskForm(true)}>
                      <Plus size={16} />
                      Nuovo Task
                    </button>
                  </div>

                  {showTaskForm && (
                    <QuickTaskForm
                      onSave={handleCreateTask}
                      onCancel={() => setShowTaskForm(false)}
                    />
                  )}

                  <div className="tasks-list">
                    {tasks.length === 0 ? (
                      <div className="empty-state">
                        <CheckCircle size={48} />
                        <p>Nessun task creato</p>
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onComplete={() => handleCompleteTask(task.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* APPOINTMENTS TAB */}
              {activeTab === 'appointments' && (
                <div className="tab-appointments">
                  <div className="tab-header">
                    <h3>Appuntamenti</h3>
                    <button className="btn-add" onClick={() => setShowAppointmentForm(true)}>
                      <Plus size={16} />
                      Nuovo Appuntamento
                    </button>
                  </div>

                  {showAppointmentForm && (
                    <QuickAppointmentForm
                      onSave={handleCreateAppointment}
                      onCancel={() => setShowAppointmentForm(false)}
                    />
                  )}

                  <div className="appointments-list">
                    {appointments.length === 0 ? (
                      <div className="empty-state">
                        <Calendar size={48} />
                        <p>Nessun appuntamento fissato</p>
                      </div>
                    ) : (
                      appointments.map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* NOTES TAB */}
              {activeTab === 'notes' && (
                <div className="tab-notes">
                  <div className="tab-header">
                    <h3>Note</h3>
                    <button className="btn-add" onClick={() => setShowNoteForm(true)}>
                      <Plus size={16} />
                      Nuova Nota
                    </button>
                  </div>

                  {showNoteForm && (
                    <QuickNoteForm
                      onSave={handleCreateNote}
                      onCancel={() => setShowNoteForm(false)}
                    />
                  )}

                  <div className="notes-list">
                    {notes.length === 0 ? (
                      <div className="empty-state">
                        <MessageSquare size={48} />
                        <p>Nessuna nota</p>
                      </div>
                    ) : (
                      notes.map((note) => (
                        <NoteCard key={note.id} note={note} />
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TIMELINE TAB */}
              {activeTab === 'timeline' && (
                <div className="tab-timeline">
                  <h3>Timeline Completa</h3>
                  <TimelineView
                    activities={activities}
                    tasks={tasks}
                    appointments={appointments}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

// Activity Card
const ActivityCard: React.FC<{ activity: CRMActivity }> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'call': return <PhoneIcon size={16} />
      case 'email': return <Send size={16} />
      case 'meeting': return <Users size={16} />
      case 'demo': return <Video size={16} />
      default: return <FileText size={16} />
    }
  }

  return (
    <div className="activity-card">
      <div className="activity-icon">{getActivityIcon()}</div>
      <div className="activity-content">
        <h4>{activity.subject}</h4>
        {activity.description && <p>{activity.description}</p>}
        <div className="activity-meta">
          <span>{activity.user_name || 'Utente'}</span>
          <span>•</span>
          <span>{new Date(activity.activity_date).toLocaleString('it-IT')}</span>
          {activity.duration_minutes && <span>• {activity.duration_minutes} min</span>}
        </div>
      </div>
    </div>
  )
}

// Task Card
const TaskCard: React.FC<{ task: CRMTask; onComplete: () => void }> = ({ task, onComplete }) => {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed'

  return (
    <div className={`task-card ${task.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={onComplete}
          disabled={task.status === 'completed'}
        />
      </div>
      <div className="task-content">
        <h4>{task.title}</h4>
        {task.description && <p>{task.description}</p>}
        <div className="task-meta">
          <span className="task-priority" style={{ background: getPriorityColor(task.priority) }}>
            {task.priority}
          </span>
          {task.due_date && (
            <span className={isOverdue ? 'text-danger' : ''}>
              <Clock size={12} />
              {new Date(task.due_date).toLocaleDateString('it-IT')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const getPriorityColor = (priority: string) => {
  const colors: { [key: string]: string } = {
    'low': '#10b981',
    'medium': '#f59e0b',
    'high': '#f97316',
    'urgent': '#ef4444'
  }
  return colors[priority] || '#94a3b8'
}

// Appointment Card
const AppointmentCard: React.FC<{ appointment: CRMAppointment }> = ({ appointment }) => {
  return (
    <div className="appointment-card">
      <div className="appointment-date">
        <div className="date-day">{new Date(appointment.start_time).getDate()}</div>
        <div className="date-month">
          {new Date(appointment.start_time).toLocaleDateString('it-IT', { month: 'short' })}
        </div>
      </div>
      <div className="appointment-content">
        <h4>{appointment.title}</h4>
        {appointment.description && <p>{appointment.description}</p>}
        <div className="appointment-meta">
          <span>
            {new Date(appointment.start_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
            {' - '}
            {new Date(appointment.end_time).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {appointment.location && (
            <>
              <span>•</span>
              <span>{appointment.location}</span>
            </>
          )}
        </div>
      </div>
      <div className={`appointment-status status-${appointment.status}`}>
        {appointment.status}
      </div>
    </div>
  )
}

// Note Card
const NoteCard: React.FC<{ note: CRMNote }> = ({ note }) => {
  return (
    <div className={`note-card ${note.is_pinned ? 'pinned' : ''}`}>
      <div className="note-content">
        <p>{note.content}</p>
      </div>
      <div className="note-meta">
        <span>{note.user_name || 'Utente'}</span>
        <span>•</span>
        <span>{new Date(note.created_at).toLocaleString('it-IT')}</span>
      </div>
    </div>
  )
}

// Timeline View
const TimelineView: React.FC<{
  activities: CRMActivity[]
  tasks: CRMTask[]
  appointments: CRMAppointment[]
}> = ({ activities, tasks, appointments }) => {
  // Combine all events
  const events = [
    ...activities.map(a => ({ type: 'activity', date: a.activity_date, data: a })),
    ...tasks.map(t => ({ type: 'task', date: t.created_at, data: t })),
    ...appointments.map(a => ({ type: 'appointment', date: a.start_time, data: a }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="timeline">
      {events.map((event, index) => (
        <div key={index} className="timeline-item">
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            {event.type === 'activity' && <ActivityCard activity={event.data as CRMActivity} />}
            {event.type === 'task' && <TaskCard task={event.data as CRMTask} onComplete={() => {}} />}
            {event.type === 'appointment' && <AppointmentCard appointment={event.data as CRMAppointment} />}
          </div>
        </div>
      ))}
    </div>
  )
}

// Quick Forms (simplified for now - you can enhance these later)
const QuickActivityForm: React.FC<{ onSave: (data: any) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    activity_type: 'call',
    subject: '',
    description: '',
    outcome: 'successful'
  })

  return (
    <div className="quick-form">
      <select
        value={formData.activity_type}
        onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
      >
        <option value="call">Chiamata</option>
        <option value="email">Email</option>
        <option value="meeting">Meeting</option>
        <option value="demo">Demo</option>
      </select>
      <input
        type="text"
        placeholder="Oggetto"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
      />
      <textarea
        placeholder="Descrizione"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <div className="form-actions">
        <button onClick={() => onSave(formData)} className="btn-save">Salva</button>
        <button onClick={onCancel} className="btn-cancel">Annulla</button>
      </div>
    </div>
  )
}

const QuickTaskForm: React.FC<{ onSave: (data: any) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    task_type: 'call',
    priority: 'medium',
    due_date: ''
  })

  return (
    <div className="quick-form">
      <input
        type="text"
        placeholder="Titolo task"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <textarea
        placeholder="Descrizione"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
      <select
        value={formData.priority}
        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
      >
        <option value="low">Bassa</option>
        <option value="medium">Media</option>
        <option value="high">Alta</option>
        <option value="urgent">Urgente</option>
      </select>
      <input
        type="datetime-local"
        value={formData.due_date}
        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
      />
      <div className="form-actions">
        <button onClick={() => onSave(formData)} className="btn-save">Salva</button>
        <button onClick={onCancel} className="btn-cancel">Annulla</button>
      </div>
    </div>
  )
}

const QuickAppointmentForm: React.FC<{ onSave: (data: any) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    appointment_type: 'demo',
    location: '',
    start_time: '',
    end_time: ''
  })

  return (
    <div className="quick-form">
      <input
        type="text"
        placeholder="Titolo appuntamento"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
      />
      <select
        value={formData.appointment_type}
        onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
      >
        <option value="demo">Demo</option>
        <option value="meeting">Meeting</option>
        <option value="call">Chiamata</option>
        <option value="presentation">Presentazione</option>
      </select>
      <input
        type="text"
        placeholder="Luogo o link Zoom"
        value={formData.location}
        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
      />
      <input
        type="datetime-local"
        placeholder="Inizio"
        value={formData.start_time}
        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
      />
      <input
        type="datetime-local"
        placeholder="Fine"
        value={formData.end_time}
        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
      />
      <div className="form-actions">
        <button onClick={() => onSave(formData)} className="btn-save">Salva</button>
        <button onClick={onCancel} className="btn-cancel">Annulla</button>
      </div>
    </div>
  )
}

const QuickNoteForm: React.FC<{ onSave: (content: string) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const [content, setContent] = useState('')

  return (
    <div className="quick-form">
      <textarea
        placeholder="Scrivi una nota..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
      />
      <div className="form-actions">
        <button onClick={() => onSave(content)} className="btn-save">Salva</button>
        <button onClick={onCancel} className="btn-cancel">Annulla</button>
      </div>
    </div>
  )
}


export default LeadDetailModal
