import api from "@/lib/api";

export interface AttendanceRecord {
  _id: string;
  date: string;
  punchIn: string | null;
  punchOut: string | null;
  totalHours: number;
  status: "Present" | "Absent" | "Half-day" | "On Leave" | "Holiday";
  punchInDevice?: string;
  punchInLocation?: string;
  punchOutDevice?: string;
  punchOutLocation?: string;
  leaveType?: string;
  holidayName?: string;
}

export interface Holiday {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  date?: string;
}

/**
 * Get high-accuracy geolocation from the browser.
 * Returns a promise that resolves with { latitude, longitude }.
 */
export const getHighAccuracyLocation = (): Promise<{
  latitude: number;
  longitude: number;
}> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = "Failed to get location";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location permission denied. Please allow location access to mark attendance.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "The request to get user location timed out.";
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      },
    );
  });
};

export const AttendanceService = {
  /**
   * Punch in/out with geolocation.
   */
  punch: async () => {
    const { latitude, longitude } = await getHighAccuracyLocation();
    const { data } = await api.post("/attendance/punch", {
      latitude,
      longitude,
    });
    return data;
  },

  /**
   * Get today's attendance for the current user.
   */
  getTodayAttendance: async () => {
    const { data } = await api.get("/attendance/me/today");
    return data;
  },

  /**
   * Get monthly report for the current user.
   */
  getMonthlyReport: async (month: number, year: number) => {
    const { data } = await api.get(
      `/attendance/me/monthly?month=${month}&year=${year}`,
    );
    return data;
  },

  /**
   * Get daily attendance for all employees (admin view).
   */
  getDailyAttendance: async (date: string) => {
    const { data } = await api.get(`/attendance/daily?date=${date}`);
    return data;
  },
};

export const HolidayService = {
  /**
   * Get all holidays.
   */
  getAll: async () => {
    const { data } = await api.get("/holidays");
    return data;
  },

  /**
   * Add a new holiday.
   */
  add: async (name: string, startDate: Date, endDate: Date) => {
    const { data } = await api.post("/holidays", {
      name,
      startDate,
      endDate,
    });
    return data;
  },

  /**
   * Delete a holiday by ID.
   */
  delete: async (id: string) => {
    const { data } = await api.delete(`/holidays/${id}`);
    return data;
  },
};
