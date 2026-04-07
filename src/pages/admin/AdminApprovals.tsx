import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Mail, Phone, User, AlertCircle, Loader, Eye, GraduationCap, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { authAPI } from '@/lib/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface PendingUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'teacher' | 'student';
  createdAt: string;
  // Student specific fields from registration
  fatherName?: string;
  motherName?: string;
  parentContact?: string;
  parentEmailId?: string;
  grade?: string;
  courseName?: string;
  preferredTeacherId?: string;
  address?: string;
  monthlyFeeAmount?: number;
}

import { APIError } from '@/lib/api';

const AdminApprovals: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getPendingApprovals();
      setPendingUsers(response.data || []);
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.data?.message || 'Failed to fetch pending approvals');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      setApproving(userId);
      await authAPI.approveUser(userId);
      
      // Remove from pending list
      setPendingUsers(pendingUsers.filter(u => u._id !== userId));
      toast.success('User approved successfully');
      setError('');
      setIsDetailsOpen(false);
    } catch (err) {
      if (err instanceof APIError) {
        const msg = err.data?.message || 'Failed to approve user';
        setError(msg);
        toast.error(msg);
      } else {
        setError('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!window.confirm('Are you sure you want to reject this registration?')) return;
    
    try {
      setRejecting(userId);
      await authAPI.rejectUser(userId);
      
      // Remove from pending list
      setPendingUsers(pendingUsers.filter(u => u._id !== userId));
      toast.success('User rejected and removed');
      setError('');
      setIsDetailsOpen(false);
    } catch (err) {
      if (err instanceof APIError) {
        const msg = err.data?.message || 'Failed to reject user';
        setError(msg);
        toast.error(msg);
      } else {
        setError('An unexpected error occurred. Please try again.');
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setRejecting(null);
    }
  };

  const openDetails = (user: PendingUser) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  };

  // Check if user is admin
  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Access Denied</h2>
          <p className="text-gray-600 mt-2">Only admin can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pending approvals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Approvals</h1>
        <p className="text-muted-foreground mt-1">Manage pending teacher and student registrations</p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Users List */}
      {pendingUsers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border/50 shadow-soft p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-semibold text-foreground">No Pending Approvals</h3>
          <p className="text-muted-foreground mt-2">All registrations have been processed!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingUsers.map((pendingUser) => (
            <div key={pendingUser._id} className="bg-card rounded-xl border border-border/50 shadow-soft hover:shadow-md transition-all p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Name & Role */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</p>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${pendingUser.role === 'teacher' ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'}`}>
                        {pendingUser.role === 'teacher' ? <User className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-foreground leading-tight">{pendingUser.name}</p>
                        <p className="text-xs font-medium capitalize text-muted-foreground">{pendingUser.role}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-foreground">
                        <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                        {pendingUser.email}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                        {pendingUser.phone || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Details (Student only preview) */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</p>
                    {pendingUser.role === 'student' ? (
                      <div className="text-sm">
                        <p className="font-medium">Grade: <span className="text-primary">{pendingUser.grade || 'N/A'}</span></p>
                        <p className="text-muted-foreground text-xs truncate">Course: {pendingUser.courseName || 'N/A'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No extra details</p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered On</p>
                    <div className="flex items-center text-sm text-foreground">
                      <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                      {new Date(pendingUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 md:border-l border-border md:pl-6">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openDetails(pendingUser)}
                    className="gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Profile
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {selectedUser?.role === 'teacher' ? <User className="w-6 h-6 text-purple-600" /> : <GraduationCap className="w-6 h-6 text-blue-600" />}
              {selectedUser?.name}'s Profile Profile
            </DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase text-muted-foreground border-b pb-2">Account Details</h4>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Email</Label>
                      <p className="text-foreground font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Mobile</Label>
                      <p className="text-foreground font-medium">{selectedUser.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase">Role</Label>
                      <p className="text-foreground font-medium capitalize">{selectedUser.role}</p>
                    </div>
                  </div>
                </div>

                {/* Student Specific Details */}
                {selectedUser.role === 'student' && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold uppercase text-muted-foreground border-b pb-2">Academic Profile</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Grade</Label>
                        <p className="text-foreground font-bold text-lg">{selectedUser.grade || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Course Preference</Label>
                        <p className="text-foreground font-medium">{selectedUser.courseName || 'N/A'}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Address
                      </Label>
                      <p className="text-foreground text-sm">{selectedUser.address || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedUser.role === 'student' && (
                <div className="space-y-4 bg-muted/30 p-4 rounded-lg border">
                  <h4 className="text-sm font-bold uppercase text-muted-foreground border-b border-border/50 pb-2">Parent & Guardian Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Father's Name</Label>
                        <p className="text-foreground font-medium">{selectedUser.fatherName || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Mother's Name</Label>
                        <p className="text-foreground font-medium">{selectedUser.motherName || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Parent Contact</Label>
                        <p className="text-foreground font-medium">{selectedUser.parentContact || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase">Parent Email</Label>
                        <p className="text-foreground font-medium">{selectedUser.parentEmailId || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="pt-6 border-t mt-6 gap-3">
                <Button
                  onClick={() => handleReject(selectedUser._id)}
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50 h-11 px-6"
                  disabled={rejecting === selectedUser._id || approving === selectedUser._id}
                >
                  {rejecting === selectedUser._id ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  Reject Profile
                </Button>
                <Button
                  onClick={() => handleApprove(selectedUser._id)}
                  className="bg-green-600 hover:bg-green-700 text-white h-11 px-8 shadow-lg shadow-green-500/20"
                  disabled={rejecting === selectedUser._id || approving === selectedUser._id}
                >
                  {approving === selectedUser._id ? (
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Review & Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminApprovals;
