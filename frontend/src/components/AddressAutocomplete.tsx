import React, { useState, useEffect, useRef } from 'react'
import { MapPin } from 'lucide-react'

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string) => void
  placeholder?: string
  disabled?: boolean
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Via Roma 123, Milano',
  disabled = false
}) => {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // Chiudi suggestions quando clicchi fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      // OpenStreetMap Nominatim API - GRATUITO e senza API key
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: query,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'it', // Solo indirizzi italiani
        }),
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'OmnilyPro/1.0' // Required by Nominatim
          }
        }
      )

      if (response.ok) {
        const data: NominatimResult[] = await response.json()
        setSuggestions(data)
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error('Errore ricerca indirizzo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)

    // Debounce per evitare troppe richieste
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      searchAddress(newValue)
    }, 500) // Aspetta 500ms dopo che l'utente smette di digitare
  }

  const handleSelectSuggestion = (suggestion: NominatimResult) => {
    onChange(suggestion.display_name)
    setShowSuggestions(false)
    setSuggestions([])
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          outline: 'none',
          backgroundColor: disabled ? '#f3f4f6' : 'white'
        }}
      />

      {isLoading && (
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#6b7280',
          fontSize: '0.875rem'
        }}>
          Ricerca...
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxHeight: '300px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.place_id}
              onClick={() => handleSelectSuggestion(suggestion)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                borderBottom: '1px solid #f3f4f6',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <MapPin size={16} style={{ color: '#6b7280', marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.875rem', color: '#111827' }}>
                  {suggestion.display_name}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <small style={{
        display: 'block',
        marginTop: '0.25rem',
        fontSize: '0.75rem',
        color: '#10b981'
      }}>
        🌍 Autocomplete indirizzo powered by OpenStreetMap (gratuito)
      </small>
    </div>
  )
}

export default AddressAutocomplete
