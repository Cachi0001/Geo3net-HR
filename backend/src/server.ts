import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { testConnection } from './config/database'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'HR Management System API is running',
    timestamp: new Date().toISOString()
  })
})

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`)
  await testConnection()
})

export default app