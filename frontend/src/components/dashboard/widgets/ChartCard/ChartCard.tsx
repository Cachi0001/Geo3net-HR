import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import './ChartCard.css'

interface ChartCardProps {
  title: string
  type?: 'line' | 'bar'
  data: any[]
  dataKeyX: string
  dataKeyY: string | string[]
}

const ChartCard: React.FC<ChartCardProps> = ({ title, type = 'line', data, dataKeyX, dataKeyY }) => {
  const keys = Array.isArray(dataKeyY) ? dataKeyY : [dataKeyY]
  return (
    <div className="chart-card glass">
      <div className="chart-card__header">{title}</div>
      <div className="chart-card__body">
        <ResponsiveContainer width="100%" height={260}>
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKeyX} />
              <YAxis />
              <Tooltip />
              {keys.map((k, idx) => (
                <Line key={k} type="monotone" dataKey={k} stroke={idx === 0 ? '#4f46e5' : '#10b981'} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={dataKeyX} />
              <YAxis />
              <Tooltip />
              {keys.map((k, idx) => (
                <Bar key={k} dataKey={k} fill={idx === 0 ? '#4f46e5' : '#10b981'} radius={[6,6,0,0]} />
              ))}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default ChartCard
