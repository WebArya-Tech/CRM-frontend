import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Loader, GraduationCap, Eye, EyeOff, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { publicServiceAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface PublicService {
  _id: string;
  title: string;
  description: string;
  subjects: string[];
  features: string[];
  price: string;
  icon: string;
  isActive: boolean;
  order: number;
}

export default function ServicesManagement() {
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjects: "",
    features: "",
    price: "",
    icon: "GraduationCap",
    isActive: true,
    order: 0
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await publicServiceAPI.getAdminAll();
      setServices(response.data || []);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast({ title: "Error", description: "Failed to load public services", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      subjects: "",
      features: "",
      price: "",
      icon: "GraduationCap",
      isActive: true,
      order: services.length
    });
    setEditingId(null);
  };

  const handleEdit = (service: PublicService) => {
    setEditingId(service._id);
    setFormData({
      title: service.title,
      description: service.description,
      subjects: service.subjects.join(", "),
      features: service.features.join("\n"),
      price: service.price,
      icon: service.icon || "GraduationCap",
      isActive: service.isActive,
      order: service.order || 0
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    const preparedData = {
      ...formData,
      subjects: formData.subjects.split(",").map(s => s.trim()).filter(Boolean),
      features: formData.features.split("\n").map(f => f.trim()).filter(Boolean)
    };

    try {
      if (editingId) {
        await publicServiceAPI.update(editingId, preparedData);
        toast({ title: "Success", description: "Service updated successfully" });
      } else {
        await publicServiceAPI.create(preparedData);
        toast({ title: "Success", description: "Service created successfully" });
      }
      fetchServices();
      setOpen(false);
    } catch (error) {
      console.error("Save error:", error);
      toast({ title: "Error", description: "Failed to save service", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this service? It will disappear from the public website.")) {
      try {
        await publicServiceAPI.delete(id);
        toast({ title: "Deleted", description: "Service removed successfully" });
        fetchServices();
      } catch (error) {
        toast({ title: "Error", description: "Failed to delete service", variant: "destructive" });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Public Website Content</h1>
          <p className="text-muted-foreground">Manage courses displayed on your public "Our Services" page</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Course
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full py-12 text-center">
            <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading services...</p>
          </div>
        ) : services.map((service) => (
          <div key={service._id} className="rounded-xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex gap-1">
                <Badge variant={service.isActive ? "default" : "secondary"}>
                  {service.isActive ? "Live" : "Draft"}
                </Badge>
              </div>
            </div>
            
            <h3 className="text-lg font-bold mb-2">{service.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{service.description}</p>
            
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/40">
              <span className="font-bold text-primary">{service.price}</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(service)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(service._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {!loading && services.length === 0 && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-border rounded-xl">
            <p className="text-muted-foreground text-lg">No public courses created yet.</p>
            <Button variant="link" onClick={() => { resetForm(); setOpen(true); }}>Create your first course</Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Course" : "Add Public Course"}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Course Title *</Label>
                <Input 
                  id="title" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g., NEET Preparation" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Pricing Tag *</Label>
                <Input 
                  id="price" 
                  value={formData.price} 
                  onChange={e => setFormData({...formData, price: e.target.value})} 
                  placeholder="e.g., ₹15,000/month" 
                  required 
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="description">Short Description *</Label>
                <Textarea 
                  id="description" 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Enter a brief overview of the course..." 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subjects">Subjects (comma separated)</Label>
                <Input 
                  id="subjects" 
                  value={formData.subjects} 
                  onChange={e => setFormData({...formData, subjects: e.target.value})} 
                  placeholder="Physics, Chemistry, Biology" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input 
                  id="order" 
                  type="number" 
                  value={formData.order} 
                  onChange={e => setFormData({...formData, order: parseInt(e.target.value) || 0})} 
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="features">Key Features (one per line)</Label>
                <Textarea 
                  id="features" 
                  value={formData.features} 
                  onChange={e => setFormData({...formData, features: e.target.value})} 
                  placeholder="Weekly mock tests\nDoubt clearing sessions\nPersonalized mentorship" 
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive" 
                  checked={formData.isActive} 
                  onChange={e => setFormData({...formData, isActive: e.target.checked})} 
                />
                <Label htmlFor="isActive" className="cursor-pointer font-medium">Make this course live on website</Label>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {editingId ? "Update Course" : "Save Course"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
