'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function SystemHealth() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>API Status</span>
            <Badge variant="success">Online</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Database</span>
            <Badge variant="success">Connected</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Redis Cache</span>
            <Badge variant="success">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span>Background Jobs</span>
            <Badge variant="secondary">Running</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}