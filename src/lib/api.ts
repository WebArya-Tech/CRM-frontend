// ============= API SERVICE =============
// Handles all API calls to the backend


const VITE_API_URL = import.meta.env.VITE_API_URL || "https://api.assuredexperts.com/api";

// ============= AUTHENTICATION HELPERS =============
const getAuthToken = () => localStorage.getItem('authToken');
const setAuthToken = (token: string) => localStorage.setItem('authToken', token);
const clearAuthToken = () => localStorage.removeItem('authToken');
const getAuthHeader = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

import { LoginData, UpdateData } from '../types/types';

// ============= ERROR HANDLING =============
class APIError extends Error {
  constructor(
    public status: number,
    public data: any,
    message: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

async function handleResponse(response: Response) {
  const data = await response.json();

  if (!response.ok) {
    throw new APIError(
      response.status,
      data,
      data.message || `API Error: ${response.status}`
    );
  }

  return data;
}

// ============= AUTH ENDPOINTS =============
export const authAPI = {
  // Register user
  async register(formData: { name: string; email: string; password: string; confirmPassword: string; role?: string }) {
    const response = await fetch(`${VITE_API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await handleResponse(response);
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  // Login user
  async login(email?: string, password?: string, phone?: string) {
    const loginData: LoginData = { password };
    if (email) loginData.email = email;
    if (phone) loginData.phone = phone;

    const response = await fetch(`${VITE_API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });
    const data = await handleResponse(response);
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  // Get current user
  async getMe() {
    const response = await fetch(`${VITE_API_URL}/auth/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Update profile
  async updateProfile(updateData: UpdateData) {
    const response = await fetch(`${VITE_API_URL}/auth/update-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  // Change password
  async changePassword(passwords: { currentPassword: string; newPassword: string; confirmPassword: string }) {
    const response = await fetch(`${VITE_API_URL}/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(passwords),
    });
    return handleResponse(response);
  },

  // Forgot password
  async forgotPassword(email: string) {
    const response = await fetch(`${VITE_API_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Reset password with OTP
  async resetPassword(data: { email: string; otp: string; newPassword: string; confirmPassword: string }) {
    const response = await fetch(`${VITE_API_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Logout
  async logout() {
    try {
      const token = getAuthToken();
      if (token) {
        // Call backend logout endpoint
        const response = await fetch(`${VITE_API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeader(),
          },
        });
        await handleResponse(response);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear token locally, even if backend call fails
      clearAuthToken();
    }
    return Promise.resolve({ success: true, message: 'Logout successful' });
  },

  // Get pending user approvals (Admin only)
  async getPendingApprovals() {
    const response = await fetch(`${VITE_API_URL}/auth/admin/pending-approvals`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Approve a user (Admin only)
  async approveUser(userId: string) {
    const response = await fetch(`${VITE_API_URL}/auth/admin/approve/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Reject a user (Admin only)
  async rejectUser(userId: string) {
    const response = await fetch(`${VITE_API_URL}/auth/admin/reject/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Check if user is logged in
  isAuthenticated() {
    return !!getAuthToken();
  },
};

// ============= PAYMENT ENDPOINTS =============
export const paymentAPI = {
  // Create payment intent
  async createPaymentIntent(courseId?: string, amount?: number, description?: string) {
    const response = await fetch(`${VITE_API_URL}/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ courseId, amount, description }),
    });
    return handleResponse(response);
  },

  // Process payment
  async processPayment(paymentData: { courseId?: string; amount: number; paymentIntentId?: string; paymentMethod?: string; description: string; transactionId?: string }) {
    const response = await fetch(`${VITE_API_URL}/payments/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  // Get my payments
  async getMyPayments(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`${VITE_API_URL}/payments/my-payments?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get payment by ID
  async getPayment(paymentId: string) {
    const response = await fetch(`${VITE_API_URL}/payments/${paymentId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get all payments (admin)
  async getAllPayments(page = 1, limit = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${VITE_API_URL}/payments?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Refund payment (admin)
  async refundPayment(paymentId: string, reason?: string) {
    const response = await fetch(`${VITE_API_URL}/payments/${paymentId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  // Get payment stats (admin)
  async getPaymentStats() {
    const response = await fetch(`${VITE_API_URL}/payments/stats`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },
};


// ============= STUDENT ENDPOINTS =============
export const studentAPI = {
  // Get all students
  async getAll(page = 1, limit = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${VITE_API_URL}/students?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get student by ID
  async getById(studentId: string) {
    const response = await fetch(`${VITE_API_URL}/students/${studentId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Create student
  async create(studentData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(studentData),
    });
    return handleResponse(response);
  },

  // Update student
  async update(studentId: string, updateData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  // Delete student
  async delete(studentId: string, deleteData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/students/${studentId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(deleteData),
    });
    return handleResponse(response);
  },

  // Get student statistics
  async getStats() {
    const response = await fetch(`${VITE_API_URL}/students/stats/overview`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get students for teacher
  async getStudentsForTeacher() {
    const response = await fetch(`${VITE_API_URL}/students/teacher`, { headers: getAuthHeader() });
    return handleResponse(response);
  },
};

// ============= TEACHER ENDPOINTS =============
export const teacherAPI = {
  // Get my teacher profile (logged-in teacher)
  async getMyProfile() {
    const response = await fetch(`${VITE_API_URL}/teachers/me/profile`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get all teachers
  async getAll(page = 1, limit = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${VITE_API_URL}/teachers?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get teacher by ID
  async getById(teacherId: string) {
    const response = await fetch(`${VITE_API_URL}/teachers/${teacherId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Create teacher
  async create(teacherData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/teachers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(teacherData),
    });
    return handleResponse(response);
  },

  // Update teacher
  async update(teacherId: string, updateData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/teachers/${teacherId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  // Delete teacher
  async delete(teacherId: string, deleteData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/teachers/${teacherId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(deleteData),
    });
    return handleResponse(response);
  },

  // Get teacher statistics
  async getStats() {
    const response = await fetch(`${VITE_API_URL}/teachers/stats/overview`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },
};

// ============= COURSE ENDPOINTS =============
export const courseAPI = {
  // Get all courses
  async getAll(page = 1, limit = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${VITE_API_URL}/courses?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get course by ID
  async getById(courseId: string) {
    const response = await fetch(`${VITE_API_URL}/courses/${courseId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Create course
  async create(courseData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(courseData),
    });
    return handleResponse(response);
  },

  // Create batch courses (group classes — one course per student)
  async createBatch(batchData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/courses/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(batchData),
    });
    return handleResponse(response);
  },

  // Update course
  async update(courseId: string, updateData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  // Update fee status
  async updateFeeStatus(courseId: string, feeStatus: string) {
    const response = await fetch(`${VITE_API_URL}/courses/${courseId}/fee-status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ feeStatus }),
    });
    return handleResponse(response);
  },

  // Delete course
  async delete(courseId: string, deleteData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/courses/${courseId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(deleteData),
    });
    return handleResponse(response);
  },

  // Get course statistics
  async getStats() {
    const response = await fetch(`${VITE_API_URL}/courses/stats/overview`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get courses for teacher
  async getCoursesForTeacher() {
    const response = await fetch(`${VITE_API_URL}/courses/teacher`, { headers: getAuthHeader() });
    return handleResponse(response);
  },

  // Get courses for student
  async getCoursesForStudent() {
    const response = await fetch(`${VITE_API_URL}/courses/student`, { headers: getAuthHeader() });
    return handleResponse(response);
  },
};

// ============= CLASS ENDPOINTS =============
export const classAPI = {
  // Get all classes
  async getAll(page = 1, limit = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${VITE_API_URL}/classes?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get class by ID
  async getById(classId: string) {
    const response = await fetch(`${VITE_API_URL}/classes/${classId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Create class
  async create(classData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(classData),
    });
    return handleResponse(response);
  },

  // Update class
  async update(classId: string, updateData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/classes/${classId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(updateData),
    });
    return handleResponse(response);
  },

  // Mark class as completed
  async complete(classId: string) {
    const response = await fetch(`${VITE_API_URL}/classes/${classId}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({}),
    });
    return handleResponse(response);
  },

  // Cancel class
  async cancel(classId: string, reason: string) {
    const response = await fetch(`${VITE_API_URL}/classes/${classId}/cancel`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ reason }),
    });
    return handleResponse(response);
  },

  // Update class status (supports 1-minute teacher edit window)
  async updateStatus(classId: string, status: string, reason?: string) {
    const response = await fetch(`${VITE_API_URL}/classes/${classId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ status, reason }),
    });
    return handleResponse(response);
  },

  // Delete class
  async delete(classId: string, deleteData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/classes/${classId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(deleteData),
    });
    return handleResponse(response);
  },

  // Get class statistics
  async getStats() {
    const response = await fetch(`${VITE_API_URL}/classes/stats/overview`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get classes for teacher
  async getClassesForTeacher() {
    const response = await fetch(`${VITE_API_URL}/classes/teacher`, { headers: getAuthHeader() });
    return handleResponse(response);
  },

  // Get classes for student
  async getClassesForStudent() {
    const response = await fetch(`${VITE_API_URL}/classes/student`, { headers: getAuthHeader() });
    return handleResponse(response);
  },
};

// ============= NOTIFICATION ENDPOINTS =============
export const notificationAPI = {
  // Get all notifications
  async getAll(page = 1, limit = 10, filters?: Record<string, any>) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${VITE_API_URL}/notifications?${params}`);
    return handleResponse(response);
  },

  // Get notification by ID
  async getById(notificationId: string) {
    const response = await fetch(`${VITE_API_URL}/notifications/${notificationId}`);
    return handleResponse(response);
  },

  // Create notification
  async create(notificationData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/notifications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notificationData),
    });
    return handleResponse(response);
  },

  // Update notification status
  async updateStatus(notificationId: string, status: string) {
    const response = await fetch(
      `${VITE_API_URL}/notifications/${notificationId}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }
    );
    return handleResponse(response);
  },

  // Mark multiple as read
  async markMultipleAsRead(notificationIds: string[]) {
    const response = await fetch(`${VITE_API_URL}/notifications/bulk/read`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationIds }),
    });
    return handleResponse(response);
  },

  // Get unread count
  async getUnreadCount(recipientId: string) {
    const response = await fetch(
      `${VITE_API_URL}/notifications/count/unread?recipientId=${recipientId}`
    );
    return handleResponse(response);
  },

  // Delete notification
  async delete(notificationId: string) {
    const response = await fetch(`${VITE_API_URL}/notifications/${notificationId}`, {
      method: "DELETE",
    });
    return handleResponse(response);
  },

  // Clear old notifications
  async clearOld(daysOld: number) {
    const response = await fetch(`${VITE_API_URL}/notifications/bulk/old`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ daysOld }),
    });
    return handleResponse(response);
  },
};

// ============= LOG ENDPOINTS =============
export const logAPI = {
  // Get all logs
  async getAll(page = 1, limit = 20, filters?: Record<string, any>) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    });
    const response = await fetch(`${VITE_API_URL}/logs?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get log by ID
  async getById(logId: string) {
    const response = await fetch(`${VITE_API_URL}/logs/${logId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get audit trail
  async getAuditTrail(objectId: string, objectType: string) {
    const params = new URLSearchParams({
      objectId,
      objectType,
    });
    const response = await fetch(`${VITE_API_URL}/logs/audit/trail?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get logs by actor
  async getByActor(actorId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`${VITE_API_URL}/logs/actor/${actorId}?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get logs by object
  async getByObject(objectId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`${VITE_API_URL}/logs/object/${objectId}?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get log statistics
  async getStats() {
    const response = await fetch(`${VITE_API_URL}/logs/stats/overview`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Export logs
  async export(filters?: Record<string, any>) {
    const params = new URLSearchParams(filters || {});
    const response = await fetch(`${VITE_API_URL}/logs/export/json?${params}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Delete old logs
  async deleteOld(daysOld: number) {
    const response = await fetch(`${VITE_API_URL}/logs/cleanup`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ daysOld }),
    });
    return handleResponse(response);
  },
};

// ============= CLASS SESSIONS ENDPOINTS =============
export const classSessionAPI = {
  // Create a new class
  async createClass(classData: any) {
    const response = await fetch(`${VITE_API_URL}/class-sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(classData),
    });
    return handleResponse(response);
  },

  // Get my classes
  async getMyClasses() {
    const response = await fetch(`${VITE_API_URL}/class-sessions`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get single class details
  async getClass(classId: string) {
    const response = await fetch(`${VITE_API_URL}/class-sessions/${classId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Enroll student in class
  async enrollClass(classId: string) {
    const response = await fetch(`${VITE_API_URL}/class-sessions/${classId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Record attendance
  async recordAttendance(classId: string, attendanceData: any[]) {
    const response = await fetch(`${VITE_API_URL}/class-sessions/${classId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ attendanceData }),
    });
    return handleResponse(response);
  },

  // Mark class as completed
  async completeClass(classId: string) {
    const response = await fetch(`${VITE_API_URL}/class-sessions/${classId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Update hourly rate
  async updateHourlyRate(hourlyRate: number) {
    const response = await fetch(`${VITE_API_URL}/class-sessions/teacher/hourly-rate`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ hourlyRate }),
    });
    return handleResponse(response);
  },
};

// ============= PAYROLL ENDPOINTS =============
export const payrollAPI = {
  // Generate monthly payroll
  async generateMonthlyPayroll(billingMonth: string) {
    const response = await fetch(`${VITE_API_URL}/payroll/generate-monthly`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ billingMonth }),
    });
    return handleResponse(response);
  },

  // Get pending payrolls
  async getPendingPayrolls() {
    const response = await fetch(`${VITE_API_URL}/payroll/pending`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Approve payroll
  async approvePayroll(payrollId: string, deductions: number = 0) {
    const response = await fetch(`${VITE_API_URL}/payroll/${payrollId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ deductions }),
    });
    return handleResponse(response);
  },

  // Mark payroll as paid
  async markPayrollAsPaid(payrollId: string, paymentData: any) {
    const response = await fetch(`${VITE_API_URL}/payroll/${payrollId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },

  // Get teacher payroll history
  async getTeacherPayroll(teacherId?: string) {
    const url = teacherId 
      ? `${VITE_API_URL}/payroll/teacher/${teacherId}`
      : `${VITE_API_URL}/payroll/teacher`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },
};

// ============= INVOICE ENDPOINTS =============
export const invoiceAPI = {
  // Generate monthly invoices
  async generateMonthlyInvoices(billingMonth: string) {
    const response = await fetch(`${VITE_API_URL}/invoices/generate-monthly`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify({ billingMonth }),
    });
    return handleResponse(response);
  },

  // Get my invoices
  async getMyInvoices() {
    const response = await fetch(`${VITE_API_URL}/invoices/my-invoices`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get pending invoices (Admin)
  async getPendingInvoices() {
    const response = await fetch(`${VITE_API_URL}/invoices/pending`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Get invoice details
  async getInvoice(invoiceId: string) {
    const response = await fetch(`${VITE_API_URL}/invoices/${invoiceId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Pay invoice
  async payInvoice(invoiceId: string, paymentData: any) {
    const response = await fetch(`${VITE_API_URL}/invoices/${invoiceId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(paymentData),
    });
    return handleResponse(response);
  },
};

// ============= PUBLIC SERVICE ENDPOINTS =============
export const publicServiceAPI = {
  // Get all active services for public site
  async getAll() {
    const response = await fetch(`${VITE_API_URL}/public-services`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },

  // Get all services (including inactive) for admin
  async getAdminAll() {
    const response = await fetch(`${VITE_API_URL}/public-services/admin`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },

  // Create public service
  async create(serviceData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/public-services`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(serviceData),
    });
    return handleResponse(response);
  },

  // Update public service
  async update(serviceId: string, serviceData: Record<string, any>) {
    const response = await fetch(`${VITE_API_URL}/public-services/${serviceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
      body: JSON.stringify(serviceData),
    });
    return handleResponse(response);
  },

  // Delete public service
  async delete(serviceId: string) {
    const response = await fetch(`${VITE_API_URL}/public-services/${serviceId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...getAuthHeader() },
    });
    return handleResponse(response);
  },
};

// ============= CONTACT ENDPOINTS =============
export const contactAPI = {
  // Submit contact inquiry
  async submitInquiry(data: { name: string; email: string; phone?: string; message: string }) {
    const response = await fetch(`${VITE_API_URL}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

export { APIError };
