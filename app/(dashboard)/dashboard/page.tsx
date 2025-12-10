"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  CalendarCheck,
  Briefcase,
  ClipboardList,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const COLORS = {
  primary: "#3B82F6",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  purple: "#8B5CF6",
  indigo: "#6366F1",
};

const CHART_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#6366F1",
];

export default function DashboardPage() {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  const { overview, charts, recent } = dashboardData || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Overview Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active employees in system
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CalendarCheck className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview?.presentToday || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview?.attendancePercentage || 0}% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Leaves
            </CardTitle>
            <Briefcase className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview?.pendingLeaves || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <ClipboardList className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {overview?.activeTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In progress or pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Last 7 days attendance overview</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={charts?.attendanceTrend || []}>
                <defs>
                  <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.success}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.success}
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.danger}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.danger}
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke={COLORS.success}
                  fillOpacity={1}
                  fill="url(#colorPresent)"
                  name="Present"
                />
                <Area
                  type="monotone"
                  dataKey="absent"
                  stroke={COLORS.danger}
                  fillOpacity={1}
                  fill="url(#colorAbsent)"
                  name="Absent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Task Status Overview</CardTitle>
            <CardDescription>Tasks by current status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts?.taskDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={COLORS.purple} name="Tasks" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave Distribution Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Status Distribution</CardTitle>
            <CardDescription>Breakdown by approval status</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts?.leaveDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => {
                    const { status, percent } = props;
                    return `${status}: ${
                      percent ? (percent * 100).toFixed(0) : 0
                    }%`;
                  }}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {(charts?.leaveDistribution || []).map(
                    (entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    )
                  )}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Department Distribution</CardTitle>
            <CardDescription>Employees by department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={charts?.departmentDistribution || []}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={COLORS.primary} name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Leave Requests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Leave Requests
            </CardTitle>
            <CardDescription>Latest 5 leave applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent?.leaves?.length > 0 ? (
                recent.leaves.map((leave: any) => (
                  <div
                    key={leave._id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {leave.userId?.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {leave.type} • {leave.days} day(s)
                      </p>
                    </div>
                    <Badge
                      variant={
                        leave.status === "Approved"
                          ? "default"
                          : leave.status === "Pending"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {leave.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent leave requests
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
            <CardDescription>Due soon or in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recent?.tasks?.length > 0 ? (
                recent.tasks.map((task: any) => (
                  <div
                    key={task._id}
                    className="flex items-start justify-between border-b pb-2 last:border-0"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due:{" "}
                        {task.dueDate
                          ? format(new Date(task.dueDate), "MMM dd")
                          : "No date"}
                      </p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {task.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming tasks
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
