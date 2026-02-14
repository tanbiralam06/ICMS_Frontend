"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Plus,
  Trash2,
  Smartphone,
  Monitor,
  MapPin,
} from "lucide-react";

import {
  AttendanceService,
  HolidayService,
} from "@/lib/services/attendance.service";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AttendancePage() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [adminDate, setAdminDate] = useState<Date | undefined>(new Date());
  const [role, setRole] = useState<string | null>(null);
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayRange, setNewHolidayRange] = useState<
    DateRange | undefined
  >();

  // Get role from localStorage
  if (typeof window !== "undefined" && !role) {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setRole(user.roles ? user.roles[0] : null);
      } catch (e) {}
    }
  }

  const queryClient = useQueryClient();

  // ===== Queries =====
  const { data: todayAttendance, isLoading: isLoadingToday } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: AttendanceService.getTodayAttendance,
  });

  const { data: monthlyReport } = useQuery({
    queryKey: ["attendance", "monthly", date?.getMonth(), date?.getFullYear()],
    queryFn: () => {
      if (!date) return null;
      return AttendanceService.getMonthlyReport(
        date.getMonth() + 1,
        date.getFullYear(),
      );
    },
    enabled: !!date,
  });

  const { data: dailyAttendance } = useQuery({
    queryKey: ["attendance", "daily", adminDate],
    queryFn: () => {
      if (!adminDate) return null;
      return AttendanceService.getDailyAttendance(format(adminDate, "yyyy-MM-dd"));
    },
    enabled: !!adminDate && role !== "Employee",
  });

  const { data: holidays, refetch: refetchHolidays } = useQuery({
    queryKey: ["holidays"],
    queryFn: HolidayService.getAll,
  });

  // ===== Mutations =====
  const addHolidayMutation = useMutation({
    mutationFn: () => {
      if (!newHolidayName || !newHolidayRange?.from) {
        return Promise.reject(new Error("Missing holiday data"));
      }
      return HolidayService.add(
        newHolidayName,
        newHolidayRange.from,
        newHolidayRange.to || newHolidayRange.from,
      );
    },
    onSuccess: () => {
      toast.success("Holiday added successfully");
      setNewHolidayName("");
      setNewHolidayRange(undefined);
      refetchHolidays();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to add holiday");
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: HolidayService.delete,
    onSuccess: () => {
      toast.success("Holiday deleted successfully");
      refetchHolidays();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to delete holiday");
    },
  });

  const punchMutation = useMutation({
    mutationFn: AttendanceService.punch,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(data.message);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || error.message || "Failed to punch";
      toast.error(message);
    },
  });

  const isPunchedIn =
    !!todayAttendance?.data && !todayAttendance?.data?.punchOut;

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Attendance</h2>
      <Tabs defaultValue="my-attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-attendance">My Attendance</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          {role !== "Employee" && (
            <TabsTrigger value="admin-view">Admin View</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="my-attendance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Today's Action</CardTitle>
                <CardDescription>
                  Mark your attendance for today.
                </CardDescription>
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
                        : "bg-green-500 hover:bg-green-600",
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
                      <div className="text-sm text-muted-foreground">
                        Punch In
                      </div>
                      <div className="font-medium">
                        {todayAttendance.data.punchIn
                          ? format(
                              new Date(todayAttendance.data.punchIn),
                              "hh:mm a",
                            )
                          : "--:--"}
                      </div>
                      {todayAttendance.data.punchInLocation && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {todayAttendance.data.punchInLocation}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">
                        Punch Out
                      </div>
                      <div className="font-medium">
                        {todayAttendance.data.punchOut
                          ? format(
                              new Date(todayAttendance.data.punchOut),
                              "hh:mm a",
                            )
                          : "--:--"}
                      </div>
                      {todayAttendance.data.punchOutLocation && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {todayAttendance.data.punchOutLocation}
                          </span>
                        </div>
                      )}
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
                          !date && "text-muted-foreground",
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
                                  : "bg-red-500",
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
                          <div className="font-medium">
                            {record.totalHours} hrs
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.punchIn), "HH:mm")} -{" "}
                            {record.punchOut
                              ? format(new Date(record.punchOut), "HH:mm")
                              : "Active"}
                          </div>
                          {record.punchInLocation && (
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {record.punchInLocation}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Holidays</CardTitle>
              <CardDescription>
                List of holidays for the current year. Sundays are Weekly Off by
                default.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {role !== "Employee" && (
                <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="holiday-name">Holiday Name</Label>
                    <Input
                      id="holiday-name"
                      placeholder="e.g. New Year"
                      value={newHolidayName}
                      onChange={(e) => setNewHolidayName(e.target.value)}
                    />
                  </div>
                  <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full md:w-[240px] justify-start text-left font-normal",
                            !newHolidayRange && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newHolidayRange?.from ? (
                            newHolidayRange.to ? (
                              isSameDay(
                                newHolidayRange.from,
                                newHolidayRange.to,
                              ) ? (
                                format(newHolidayRange.from, "PPP")
                              ) : (
                                `${format(
                                  newHolidayRange.from,
                                  "LLL dd",
                                )} - ${format(newHolidayRange.to, "LLL dd, y")}`
                              )
                            ) : (
                              format(newHolidayRange.from, "PPP")
                            )
                          ) : (
                            <span>Pick a date range</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="range"
                          selected={newHolidayRange}
                          onSelect={setNewHolidayRange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <Button
                    className="w-full md:w-auto"
                    onClick={() => addHolidayMutation.mutate()}
                    disabled={
                      addHolidayMutation.isPending ||
                      !newHolidayName ||
                      !newHolidayRange?.from
                    }
                  >
                    {addHolidayMutation.isPending ? (
                      "Adding..."
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" /> Add Holiday
                      </>
                    )}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {holidays?.data?.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No holidays declared yet.
                  </div>
                ) : (
                  holidays?.data?.map((holiday: any) => {
                    const hStart = holiday.startDate || holiday.date;
                    const hEnd =
                      holiday.endDate || holiday.date || holiday.startDate;

                    if (!hStart) return null;

                    const holidayStartDate = new Date(hStart);
                    const holidayEndDate = new Date(hEnd);

                    return (
                      <div
                        key={holiday._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center justify-center w-20 h-14 bg-primary/10 rounded-lg text-primary px-2">
                            <span className="text-[10px] font-bold uppercase">
                              {format(holidayStartDate, "MMM")}
                            </span>
                            <span className="text-sm font-bold truncate w-full text-center">
                              {isSameDay(holidayStartDate, holidayEndDate)
                                ? format(holidayStartDate, "dd")
                                : `${format(holidayStartDate, "dd")}-${format(
                                    holidayEndDate,
                                    "dd",
                                  )}`}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-semibold">{holiday.name}</h4>
                            <span className="text-xs text-muted-foreground italic">
                              {isSameDay(holidayStartDate, holidayEndDate)
                                ? format(holidayStartDate, "EEEE")
                                : `${format(
                                    holidayStartDate,
                                    "EEE",
                                  )} to ${format(holidayEndDate, "EEE")}`}
                            </span>
                          </div>
                        </div>
                        {role !== "Employee" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() =>
                              deleteHolidayMutation.mutate(holiday._id)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {role !== "Employee" && (
          <TabsContent value="admin-view" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>Daily Attendance Report</CardTitle>
                    <CardDescription>
                      View attendance status for all employees.
                    </CardDescription>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full md:w-[240px] justify-start text-left font-normal",
                          !adminDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {adminDate ? (
                          format(adminDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={adminDate}
                        onSelect={setAdminDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Punch In</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Punch Out</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Total Hours</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyAttendance?.data?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-24 text-center">
                          No records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyAttendance?.data?.map((record: any) => (
                        <TableRow key={record.userId}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={record.profilePicture} />
                                <AvatarFallback>
                                  {record.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {record.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {record.employeeId}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === "Present"
                                  ? "default"
                                  : record.status === "Absent"
                                    ? "destructive"
                                    : "outline"
                              }
                              className={
                                record.status === "Present"
                                  ? "bg-green-500 hover:bg-green-600 border-transparent text-white"
                                  : record.status === "Half-day"
                                    ? "bg-yellow-500 hover:bg-yellow-600 border-transparent text-white"
                                    : record.status === "Absent"
                                      ? "bg-red-500 hover:bg-red-600 border-transparent text-white"
                                      : ""
                              }
                            >
                              {record.status === "On Leave" && record.leaveType
                                ? `${record.status} (${record.leaveType})`
                                : record.status === "Holiday" &&
                                    record.holidayName
                                  ? `${record.status}: ${record.holidayName}`
                                  : record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {record.punchIn
                              ? format(new Date(record.punchIn), "hh:mm a")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {record.punchInDevice ? (
                              <div className="flex items-center gap-1">
                                {record.punchInDevice === "Mobile" ? (
                                  <Smartphone className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Monitor className="h-4 w-4 text-green-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {record.punchInDevice}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {record.punchInLocation ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-orange-500" />
                                <span className="text-xs text-muted-foreground">
                                  {record.punchInLocation}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {record.punchOut
                              ? format(new Date(record.punchOut), "hh:mm a")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {record.punchOutDevice ? (
                              <div className="flex items-center gap-1">
                                {record.punchOutDevice === "Mobile" ? (
                                  <Smartphone className="h-4 w-4 text-blue-500" />
                                ) : (
                                  <Monitor className="h-4 w-4 text-green-500" />
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {record.punchOutDevice}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {record.punchOutLocation ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4 text-orange-500" />
                                <span className="text-xs text-muted-foreground">
                                  {record.punchOutLocation}
                                </span>
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {record.totalHours > 0
                              ? record.totalHours + " hrs"
                              : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
