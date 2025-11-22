export interface TicketData {
  id: string;
  customerName: string;
  eventName: string;
  eventDate: string;
  ticketNumber: string;
  fortune: string;
  price: number;
  isGenerated: boolean;
}

export interface GeminiResponse {
  luckyNumber: string;
  fortune: string;
}
