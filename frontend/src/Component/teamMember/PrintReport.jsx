// src/components/PrintReport.jsx
import React from 'react';

const PrintReport = ({ reportData, weeklyPerformance, projects, timePeriod }) => {
  const timeRange = timePeriod === 'week' ? 'Last 7 Days' : timePeriod === 'month' ? 'Last 30 Days' : 'Last 12 Months';
  const currentDate = new Date().toLocaleDateString();

  return (
    <html>
      <head>
        <title>Task Performance Report</title>
        <style>
          {`
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1 {
              color: #4DA5AD;
              font-size: 28px;
              margin: 0 0 10px 0;
            }
            h2 {
              color: #2D4A6B;
              font-size: 20px;
              margin: 25px 0 15px 0;
              border-bottom: 2px solid #4DA5AD;
              padding-bottom: 8px;
            }
            .header {
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #eee;
            }
            .header p {
              color: #666;
              margin: 5px 0;
              font-size: 14px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin: 20px 0;
            }
            .stat-card {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
              border: 1px solid #dee2e6;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              color: #4DA5AD;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 14px;
            }
            th {
              background: #4DA5AD;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #dee2e6;
            }
            tr:nth-child(even) {
              background: #f8f9fa;
            }
            .badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .badge-green {
              background: #d4edda;
              color: #155724;
            }
            .badge-yellow {
              background: #fff3cd;
              color: #856404;
            }
            .badge-red {
              background: #f8d7da;
              color: #721c24;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #dee2e6;
              text-align: center;
              color: #999;
              font-size: 12px;
            }
            @media print {
              body { padding: 20px; }
            }
          `}
        </style>
      </head>
      <body>
        <div className="header">
          <h1>📊 Task Performance Report</h1>
          <p><strong>Generated:</strong> {currentDate}</p>
          <p><strong>Time Period:</strong> {timeRange}</p>
          <p><strong>Total Tasks Analyzed:</strong> {reportData.totalTasks}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{reportData.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#28a745' }}>{reportData.completedCount}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ffc107' }}>{reportData.inProgressCount}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#dc3545' }}>{reportData.overdueCount}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>

        <h2>📈 Key Performance Metrics</h2>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Target</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Task Completion Rate</td>
              <td><strong>{reportData.efficiency}%</strong></td>
              <td>80%</td>
              <td>
                <span className={`badge ${reportData.efficiency >= 80 ? 'badge-green' : 'badge-yellow'}`}>
                  {reportData.efficiency >= 80 ? 'On Track' : 'Behind'}
                </span>
              </td>
            </tr>
            <tr>
              <td>On-time Delivery</td>
              <td><strong>{reportData.onTimeDelivery}%</strong></td>
              <td>90%</td>
              <td>
                <span className={`badge ${reportData.onTimeDelivery >= 90 ? 'badge-green' : 'badge-yellow'}`}>
                  {reportData.onTimeDelivery >= 90 ? 'Excellent' : 'Needs Work'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Hours Utilization</td>
              <td><strong>{reportData.utilization}%</strong></td>
              <td>80%</td>
              <td>
                <span className={`badge ${reportData.utilization >= 80 ? 'badge-green' : 'badge-yellow'}`}>
                  {reportData.utilization >= 80 ? 'Good' : 'Low'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Average Time/Task</td>
              <td><strong>{reportData.avgTime}h</strong></td>
              <td>8h</td>
              <td>
                <span className={`badge ${parseFloat(reportData.avgTime) <= 8 ? 'badge-green' : 'badge-yellow'}`}>
                  {parseFloat(reportData.avgTime) <= 8 ? 'Good' : 'High'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <h2>📅 Weekly Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Tasks</th>
              <th>Completed</th>
              <th>Hours</th>
              <th>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {weeklyPerformance.map((w, i) => (
              <tr key={i}>
                <td><strong>{w.week}</strong></td>
                <td>{w.tasks}</td>
                <td>{w.completed}</td>
                <td>{w.hours}h</td>
                <td>{w.efficiency}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>📁 Project Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Total</th>
              <th>Completed</th>
              <th>In Progress</th>
              <th>Pending</th>
              <th>Hours</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {projects.slice(0, 5).map((p, i) => (
              <tr key={i}>
                <td><strong>{p.name}</strong></td>
                <td>{p.total}</td>
                <td>{p.completed}</td>
                <td>{p.inProgress || 0}</td>
                <td>{p.pending || 0}</td>
                <td>{p.hours}h</td>
                <td><strong>{p.rate}%</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="footer">
          <p>Report generated from TaskFlow • {currentDate}</p>
        </div>
      </body>
    </html>
  );
};

export default PrintReport;