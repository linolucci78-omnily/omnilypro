import { MessageCircle } from 'lucide-react'

interface ChatButtonProps {
  onClick?: () => void
}

export default function ChatButton({ onClick }: ChatButtonProps) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    } else {
      // Default: apri Tawk.to o altro servizio di chat
      // Per ora mostriamo un alert
      alert('Chat in arrivo! Qui si integrerà Tawk.to o Intercom.')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-24 right-6 w-16 h-16 bg-gray-800 hover:bg-gray-700 rounded-full shadow-2xl flex items-center justify-center z-50 transition-colors"
    >
      <MessageCircle className="w-7 h-7 text-white" fill="white" />
      {/* Green dot - online indicator */}
      <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
    </button>
  )
}
