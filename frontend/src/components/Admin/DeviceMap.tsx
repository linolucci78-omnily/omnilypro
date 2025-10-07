import React, { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Battery, Wifi, Clock, MapPin } from 'lucide-react'

// Fix per icone Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Device {
  id: string
  name: string
  android_id: string
  device_model: string
  organization_id: string
  store_location: string
  status: 'online' | 'offline' | 'setup' | 'maintenance'
  last_seen: string
  wifi_ssid: string
  battery_level: number
  kiosk_mode_active: boolean
  current_app_package: string
  latitude: number
  longitude: number
  language: string
  created_at: string
  organization?: {
    name: string
  }
}

interface DeviceMapProps {
  devices: Device[]
  onDeviceSelect?: (device: Device) => void
}

// Componente per centrare la mappa sui dispositivi
const MapBounds: React.FC<{ devices: Device[] }> = ({ devices }) => {
  const map = useMap()

  useEffect(() => {
    const devicesWithCoords = devices.filter(d => d.latitude && d.longitude)

    if (devicesWithCoords.length === 0) {
      // Default: Italia centrale
      map.setView([41.9028, 12.4964], 6)
    } else if (devicesWithCoords.length === 1) {
      const device = devicesWithCoords[0]
      map.setView([device.latitude, device.longitude], 13)
    } else {
      const bounds = L.latLngBounds(
        devicesWithCoords.map(d => [d.latitude, d.longitude])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [devices, map])

  return null
}

// Crea icone personalizzate in base allo status
const createCustomIcon = (status: string, kioskActive: boolean) => {
  let color = '#6b7280' // default gray

  switch (status) {
    case 'online':
      color = kioskActive ? '#3b82f6' : '#10b981' // blue if kiosk, green if normal
      break
    case 'offline':
      color = '#ef4444' // red
      break
    case 'setup':
      color = '#f59e0b' // orange
      break
    case 'maintenance':
      color = '#8b5cf6' // purple
      break
  }

  const iconHtml = `
    <div style="
      background: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <span style="
        transform: rotate(45deg);
        color: white;
        font-size: 16px;
        font-weight: bold;
      ">${kioskActive ? '🔒' : '📍'}</span>
    </div>
  `

  return L.divIcon({
    html: iconHtml,
    className: 'custom-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

const getTimeSince = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Ora'
  if (diffMins < 60) return `${diffMins}m fa`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h fa`
  return `${Math.floor(diffMins / 1440)}g fa`
}

const DeviceMap: React.FC<DeviceMapProps> = ({ devices, onDeviceSelect }) => {
  const devicesWithLocation = devices.filter(d => d.latitude && d.longitude)

  return (
    <div style={{ height: '600px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
      <MapContainer
        center={[41.9028, 12.4964]}
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds devices={devicesWithLocation} />

        {devicesWithLocation.map(device => (
          <Marker
            key={device.id}
            position={[device.latitude, device.longitude]}
            icon={createCustomIcon(device.status, device.kiosk_mode_active)}
            eventHandlers={{
              click: () => {
                if (onDeviceSelect) {
                  onDeviceSelect(device)
                }
              }
            }}
          >
            <Popup>
              <div style={{ minWidth: '200px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600 }}>
                  {device.name}
                </h3>

                <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#6b7280' }}>
                  <strong>{device.organization?.name}</strong>
                </p>

                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} />
                  {device.store_location}
                </p>

                <div style={{
                  background: '#f9fafb',
                  padding: '8px',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Battery size={14} />
                    <span>{device.battery_level || 0}%</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Wifi size={14} />
                    <span>{device.wifi_ssid || 'N/A'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} />
                    <span>{getTimeSince(device.last_seen)}</span>
                  </div>
                </div>

                <div style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  background: device.status === 'online' ? '#d1fae5' : '#fee2e2',
                  color: device.status === 'online' ? '#065f46' : '#991b1b'
                }}>
                  {device.status}
                </div>

                {device.kiosk_mode_active && (
                  <div style={{
                    marginTop: '6px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#dbeafe',
                    color: '#1e40af',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    🔒 Kiosk Mode Attivo
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {devicesWithLocation.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <MapPin size={48} color="#6b7280" />
          <h3 style={{ margin: '12px 0 4px 0', fontSize: '16px', fontWeight: 600 }}>
            Nessun dispositivo con posizione
          </h3>
          <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
            I dispositivi devono inviare le coordinate GPS
          </p>
        </div>
      )}
    </div>
  )
}

export default DeviceMap
