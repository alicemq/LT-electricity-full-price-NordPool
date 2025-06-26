<template>
  <div class="status-view">
    <h1>System Status</h1>
    <div v-if="loading" class="status-loading">Loading status...</div>
    <div v-else-if="error" class="status-error">Error: {{ error }}</div>
    <div v-else>
      <section class="status-section">
        <h2>System</h2>
        <ul>
          <li><b>Node Version:</b> {{ status.system.nodeVersion }}</li>
          <li><b>Platform:</b> {{ status.system.platform }}</li>
          <li><b>Uptime:</b> {{ status.system.uptime }}</li>
        </ul>
      </section>
      <section class="status-section">
        <h2>Database</h2>
        <ul>
          <li><b>Connected:</b> {{ status.database.connected ? 'Yes' : 'No' }}</li>
          <li><b>Uptime:</b> {{ status.database.uptime && status.database.uptime.minutes !== undefined ? status.database.uptime.minutes + ' min' : status.database.uptime }}</li>
          <li><b>Active Connections:</b> {{ status.database.activeConnections }}</li>
          <li><b>Total Records:</b> {{ status.database.stats.totalRecords }}</li>
          <li><b>Database Size:</b> {{ status.database.stats.databaseSize.size }}</li>
        </ul>
        <h3>Records by Country</h3>
        <table class="status-table">
          <thead>
            <tr><th>Country</th><th>Total Records</th><th>Earliest</th><th>Latest</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in status.database.stats.countries" :key="c.country">
              <td>{{ c.country.toUpperCase() }}</td>
              <td>{{ c.total_records }}</td>
              <td>{{ formatTimestamp(c.earliest_timestamp) }}</td>
              <td>{{ formatTimestamp(c.latest_timestamp) }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="status-section">
        <h2>Sync</h2>
        <ul>
          <li><b>Initial Sync Complete:</b> {{ status.sync.initialSync.isComplete ? 'Yes' : 'No' }}</li>
          <li><b>Initial Sync Date:</b> {{ status.sync.initialSync.completedDate }}</li>
          <li><b>Initial Sync Records:</b> {{ status.sync.initialSync.recordsCount }}</li>
          <li><b>Last Sync Type:</b> {{ status.sync.lastSync.sync_type }}</li>
          <li><b>Last Sync Status:</b> {{ status.sync.lastSync.status }}</li>
          <li><b>Last Sync Completed At:</b> {{ status.sync.lastSync.completed_at }}</li>
        </ul>
        <h3>Data Freshness</h3>
        <table class="status-table">
          <thead>
            <tr><th>Country</th><th>Latest Timestamp</th><th>Is Recent</th><th>Hours Old</th></tr>
          </thead>
          <tbody>
            <tr v-for="c in status.sync.dataFreshness" :key="c.country">
              <td>{{ c.country.toUpperCase() }}</td>
              <td>{{ formatTimestamp(c.latestTimestamp) }}</td>
              <td>{{ c.isRecent ? 'Yes' : 'No' }}</td>
              <td>{{ c.hoursOld }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="status-section">
        <h2>Scheduled Jobs</h2>
        <table class="status-table">
          <thead>
            <tr><th>Name</th><th>Schedule</th><th>Description</th><th>Next Run</th><th>Is Running</th></tr>
          </thead>
          <tbody>
            <tr v-for="job in status.scheduledJobs" :key="job.name">
              <td>{{ job.name }}</td>
              <td>{{ job.schedule }}</td>
              <td>{{ job.description }}</td>
              <td>{{ job.nextRun }}</td>
              <td>{{ job.isRunning ? 'Yes' : 'No' }}</td>
            </tr>
          </tbody>
        </table>
      </section>
      <section class="status-section" v-if="status.issues && status.issues.length">
        <h2>Issues</h2>
        <ul>
          <li v-for="issue in status.issues" :key="issue">⚠️ {{ issue }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const status = ref(null)
const loading = ref(true)
const error = ref(null)

function formatTimestamp(ts) {
  if (!ts) return '-';
  // If it's a string, try to parse as date
  if (typeof ts === 'string' && ts.length > 10) {
    const d = new Date(Number(ts) * 1000)
    if (!isNaN(d)) return d.toISOString().replace('T', ' ').substring(0, 19)
    return ts
  }
  // If it's a number (unix timestamp)
  if (!isNaN(Number(ts))) {
    const d = new Date(Number(ts) * 1000)
    if (!isNaN(d)) return d.toISOString().replace('T', ' ').substring(0, 19)
  }
  return ts
}

async function fetchStatus() {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/v1/health')
    if (!res.ok) throw new Error('Failed to fetch status')
    const data = await res.json()
    status.value = data
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(fetchStatus)
</script>

<style scoped>
.status-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}
.status-section {
  margin-bottom: 2rem;
  background: #f9f9f9;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}
.status-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
}
.status-table th, .status-table td {
  border: 1px solid #ddd;
  padding: 0.5rem 0.75rem;
  text-align: left;
}
.status-table th {
  background: #f0f0f0;
}
.status-loading, .status-error {
  font-size: 1.2rem;
  color: #888;
  margin: 2rem 0;
}
.status-error {
  color: #c00;
}
</style> 