import React from 'react'
import { LucideIcon } from 'lucide-react'

interface InfoCardProps {
  icon: LucideIcon
  title: string
  description: string
  primaryColor?: string
}

export const InfoCard: React.FC<InfoCardProps> = ({
  icon: Icon,
  title,
  description,
  primaryColor = '#6366f1',
}) => {
  return (
    <div className="info-card">
      <div className="info-icon" style={{ background: `${primaryColor}15` }}>
        <Icon size={24} style={{ color: primaryColor }} />
      </div>
      <div className="info-content">
        <h4 className="info-title">{title}</h4>
        <p className="info-description">{description}</p>
      </div>

      <style>{`
        .info-card {
          display: flex;
          align-items: flex-start;
          gap: var(--omnily-spacing-4);
          padding: var(--omnily-spacing-6);
          background: linear-gradient(135deg, var(--omnily-gray-50) 0%, white 100%);
          border: 1px solid var(--omnily-border-color);
          border-radius: var(--omnily-border-radius-xl);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .info-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, var(--omnily-primary), var(--omnily-secondary));
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
          border-color: var(--omnily-primary);
        }

        .info-card:hover::before {
          opacity: 1;
        }

        .info-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--omnily-border-radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.3s ease;
        }

        .info-card:hover .info-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .info-content {
          flex: 1;
        }

        .info-title {
          font-size: var(--omnily-font-size-lg);
          font-weight: 700;
          color: var(--omnily-gray-900);
          margin: 0 0 var(--omnily-spacing-2) 0;
        }

        .info-description {
          font-size: var(--omnily-font-size-sm);
          color: var(--omnily-gray-600);
          line-height: 1.6;
          margin: 0;
        }

        @media (max-width: 768px) {
          .info-card {
            padding: var(--omnily-spacing-4);
          }

          .info-icon {
            width: 40px;
            height: 40px;
          }

          .info-title {
            font-size: var(--omnily-font-size-base);
          }

          .info-description {
            font-size: var(--omnily-font-size-xs);
          }
        }
      `}</style>
    </div>
  )
}
