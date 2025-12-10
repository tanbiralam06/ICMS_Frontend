"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function AttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();

  const { data: todayAttendance, isLoading: isLoadingToday } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: async () => {
      const res = await api.get("/attendance/me/today");
      return res.data;
    },
  });

  const { data: monthlyReport } = useQuery({
    queryKey: ["attendance", "monthly", date?.getMonth(), date?.getFullYear()],
    queryFn: async () => {
      if (!date) return null;
      const res = await api.get(
        `/attendance/me/monthly?month=${
          date.getMonth() + 1
        }&year=${date.getFullYear()}`
      );
      return res.data;
    },
    enabled: !!date,
  });

  const punchMutation = useMutation({
    mutationFn: async () => {
      return await api.post("/attendance/punch");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(data.data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to punch");
    },
  });

  const isPunchedIn =
    !!todayAttendance?.data && !todayAttendance?.data?.punchOut;

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Action</CardTitle>
            <CardDescription>Mark your attendance for today.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="text-4xl font-mono font-bold">
              {format(new Date(), "HH:mm:ss")}
            </div>
            <div className="text-muted-foreground">
              {format(new Date(), "EEEE, MMMM do, yyyy")}
            </div>

            {todayAttendance?.data?.punchOut ? (
              <div className="flex flex-col items-center text-green-500">
                <CheckCircle2 className="h-12 w-12 mb-2" />
                <span className="font-medium">
                  Attendance Completed for Today
                </span>
                <span className="text-sm text-muted-foreground mt-1">
                  Total Hours: {todayAttendance.data.totalHours} hrs
                </span>
              </div>
            ) : (
              <Button
                size="lg"
                className={cn(
                  "w-40 h-40 rounded-full text-xl font-bold shadow-lg transition-all hover:scale-105",
                  isPunchedIn
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-green-500 hover:bg-green-600"
                )}
                onClick={() => punchMutation.mutate()}
                disabled={punchMutation.isPending}
              >
                {punchMutation.isPending
                  ? "Processing..."
                  : isPunchedIn
                  ? "Punch Out"
                  : "Punch In"}
              </Button>
            )}

            {todayAttendance?.data && (
              <div className="grid grid-cols-2 gap-8 mt-4 w-full text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Punch In</div>
                  <div className="font-medium">
                    {todayAttendance.data.punchIn
                      ? format(
                          new Date(todayAttendance.data.punchIn),
                          "hh:mm a"
                        )
                      : "--:--"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Punch Out</div>
                  <div className="font-medium">
                    {todayAttendance.data.punchOut
                      ? format(
                          new Date(todayAttendance.data.punchOut),
                          "hh:mm a"
                        )
                      : "--:--"}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Report</CardTitle>
            <CardDescription>View your attendance history.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? (
                      format(date, "MMMM yyyy")
                    ) : (
                      <span>Pick a month</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {monthlyReport?.data?.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No records found for this month.
                </div>
              ) : (
                monthlyReport?.data?.map((record: any) => (
                  <div
                    key={record._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center">
                      <div
                        className={cn(
                          "w-2 h-12 rounded-full mr-3",
                          record.status === "Present"
                            ? "bg-green-500"
                            : record.status === "Half-day"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        )}
                      />
                      <div>
                        <div className="font-medium">
                          {format(new Date(record.date), "EEE, MMM do")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {record.status}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{record.totalHours} hrs</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(record.punchIn), "HH:mm")} -{" "}
                        {record.punchOut
                          ? format(new Date(record.punchOut), "HH:mm")
                          : "Active"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
