import React from 'react'
import EmailEditor from './components/Admin/EmailEditor'

const TestEmailEditor: React.FC = () => {
  const handleChange = (html: string) => {
    console.log('Email HTML changed:', html)
  }

  const testVariables = ['nome_cliente', 'email_cliente', 'data_ordine', 'totale']

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Email Editor Studio SDK</h1>
      <EmailEditor 
        onChange={handleChange}
        variables={testVariables}
      />
    </div>
  )
}

export default TestEmailEditor