import React, { useState, useEffect } from 'react'
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Phone,
  Target,
  TrendingUp,
  ListTodo,
  Mail,
  ArrowRight
} from 'lucide-react'
import { crmLeadsService, type CRMLead } from '../../services/crmLeadsService'
import { crmTasksService, crmAppointmentsService, type CRMTask, type CRMAppointment } from '../../services/crmActivitiesService'
import { supabase } from '../../lib/supabase'
import './AgentDashboard.css'

interface AgentStats {
  my_active_leads: number
  tasks_today: number
  tasks_overdue: number
  appointments_today: number
  calls_to_make: number
  emails_to_send: number
}

const AgentDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AgentStats | null>(null)
  const [myLeads, setMyLeads] = useState<CRMLead[]>([])
  const [tasksToday, setTasksToday] = useState<CRMTask[]>([])
  const [overdueTask, setOverdueTasks] = useState<CRMTask[]>([])
  const [appointmentsToday, setAppointmentsToday] = useState<CRMAppointment[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        await loadAgentData(user.id)
      }
    }
    init()
  }, [])

  const loadAgentData = async (userId: string) => {
    try {
      setLoading(true)

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Load all data in parallel
      const [leads, tasks, appointments] = await Promise.all([
        crmLeadsService.getLeads({ agent_id: userId }),
        crmTasksService.getMyTasks(userId),
        crmAppointmentsService.getMyUpcomingAppointments(userId)
      ])

      // Filter my leads
      const myActiveLeads = leads.filter((l: any) => l.stage !== 'won' && l.stage !== 'lost')
      setMyLeads(myActiveLeads.slice(0, 5)) // Top 5

      // Filter tasks for today
      const today_tasks = tasks.filter((t: any) => {
        if (!t.due_date) return false
        const dueDate = new Date(t.due_date)
        return dueDate >= today && dueDate < tomorrow && t.status !== 'completed'
      })
      setTasksToday(today_tasks)

      // Filter overdue tasks
      const overdue_tasks = tasks.filter((t: any) => {
        if (!t.due_date || t.status === 'completed') return false
        const dueDate = new Date(t.due_date)
        return dueDate < today
      })
      setOverdueTasks(overdue_tasks)

      // Filter appointments for today
      const today_appts = appointments.filter((a: any) => {
        const apptDate = new Date(a.start_time)
        return apptDate >= today && apptDate < tomorrow
      })
      setAppointmentsToday(today_appts)

      // Calculate stats
      const callTasks = tasks.filter((t: any) => t.task_type === 'call' && t.status !== 'completed')
      const emailTasks = tasks.filter((t: any) => t.task_type === 'email' && t.status !== 'completed')

      setStats({
        my_active_leads: myActiveLeads.length,
        tasks_today: today_tasks.length,
        tasks_overdue: overdue_tasks.length,
        appointments_today: today_appts.length,
        calls_to_make: callTasks.length,
        emails_to_send: emailTasks.length
      })

    } catch (error) {
      console.error('Error loading agent data:', error)
    } finally {
      setLoading(false)
    }
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

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="agent-dashboard-loading">
        <Clock size={48} className="spinner" />
        <p>Caricamento dashboard...</p>
      </div>
    )
  }

  return (
    <div className="agent-dashboard">
      {/* Welcome Section */}
      <div className="dashboard-welcome">
        <div>
          <h1>La Tua Dashboard</h1>
          <p>Ecco cosa devi fare oggi</p>
        </div>
        <div className="current-time">
          {new Date().toLocaleDateString('it-IT', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="dashboard-stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.my_active_leads || 0}</div>
            <div className="stat-label">Lead Attivi</div>
          </div>
        </div>

        <div className="stat-card urgent">
          <div className="stat-icon">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.tasks_overdue || 0}</div>
            <div className="stat-label">Task Scaduti</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.tasks_today || 0}</div>
            <div className="stat-label">Task Oggi</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.appointments_today || 0}</div>
            <div className="stat-label">Appuntamenti Oggi</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <Phone size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.calls_to_make || 0}</div>
            <div className="stat-label">Chiamate da Fare</div>
          </div>
        </div>

        <div className="stat-card secondary">
          <div className="stat-icon">
            <Mail size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats?.emails_to_send || 0}</div>
            <div className="stat-label">Email da Inviare</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="dashboard-content-grid">
        {/* Tasks Overdue */}
        {overdueTask.length > 0 && (
          <div className="dashboard-card urgent-card">
            <div className="card-header">
              <h3>
                <AlertCircle size={20} />
                Task Scaduti
              </h3>
              <span className="badge urgent">{overdueTask.length}</span>
            </div>
            <div className="task-list">
              {overdueTask.slice(0, 3).map(task => (
                <div key={task.id} className="task-item urgent">
                  <div className="task-priority" style={{ background: getPriorityColor(task.priority) }} />
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <Clock size={14} />
                      Scaduto il {new Date(task.due_date!).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                  <button className="task-action">
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks Today */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <ListTodo size={20} />
              Task di Oggi
            </h3>
            <span className="badge">{tasksToday.length}</span>
          </div>
          <div className="task-list">
            {tasksToday.length === 0 ? (
              <div className="empty-state">
                <CheckCircle size={48} />
                <p>Nessun task per oggi!</p>
              </div>
            ) : (
              tasksToday.slice(0, 5).map(task => (
                <div key={task.id} className="task-item">
                  <div className="task-priority" style={{ background: getPriorityColor(task.priority) }} />
                  <div className="task-info">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      <Clock size={14} />
                      Scadenza: {formatTime(task.due_date!)}
                    </div>
                  </div>
                  <button className="task-action">
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Appointments Today */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <Calendar size={20} />
              Appuntamenti Oggi
            </h3>
            <span className="badge">{appointmentsToday.length}</span>
          </div>
          <div className="appointment-list">
            {appointmentsToday.length === 0 ? (
              <div className="empty-state">
                <Calendar size={48} />
                <p>Nessun appuntamento oggi</p>
              </div>
            ) : (
              appointmentsToday.map(appt => (
                <div key={appt.id} className="appointment-item">
                  <div className="appointment-time">
                    {formatTime(appt.start_time)}
                  </div>
                  <div className="appointment-info">
                    <div className="appointment-title">{appt.title}</div>
                    <div className="appointment-meta">
                      {appt.location && (
                        <span>{appt.location}</span>
                      )}
                    </div>
                  </div>
                  <button className="appointment-action">
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Top Leads */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>
              <Target size={20} />
              I Miei Lead Principali
            </h3>
            <span className="badge">{myLeads.length}</span>
          </div>
          <div className="leads-list">
            {myLeads.map(lead => (
              <div key={lead.id} className="lead-item">
                <div className="lead-info">
                  <div className="lead-company">{lead.company_name}</div>
                  <div className="lead-contact">{lead.contact_name}</div>
                </div>
                <div className="lead-stage">
                  <span className="stage-badge" style={{
                    background: getStageColor(lead.stage),
                    color: 'white'
                  }}>
                    {getStageLabel(lead.stage)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper functions
const getStageColor = (stage: string) => {
  const colors: { [key: string]: string } = {
    'lead': '#94a3b8',
    'contacted': '#60a5fa',
    'demo_scheduled': '#3b82f6',
    'demo_completed': '#8b5cf6',
    'proposal_sent': '#a855f7',
    'negotiation': '#ec4899',
    'contract_ready': '#f59e0b',
    'won': '#10b981',
    'lost': '#ef4444'
  }
  return colors[stage] || '#94a3b8'
}

const getStageLabel = (stage: string) => {
  const labels: { [key: string]: string } = {
    'lead': 'Lead',
    'contacted': 'Contattato',
    'demo_scheduled': 'Demo',
    'demo_completed': 'Demo OK',
    'proposal_sent': 'Proposta',
    'negotiation': 'Negoziazione',
    'contract_ready': 'Contratto',
    'won': 'Vinto',
    'lost': 'Perso'
  }
  return labels[stage] || stage
}

export default AgentDashboard
