/**
 * Mock authentication service for OMNILY PRO development
 * This provides a fake user for testing the wizard
 */

export const mockUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'admin@test.com',
  name: 'Admin Test',
  created_at: new Date().toISOString()
}

export const getMockUser = () => {
  return mockUser
}