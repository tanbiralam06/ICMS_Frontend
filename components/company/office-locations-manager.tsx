"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Pencil, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface OfficeLocation {
  _id?: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

interface OfficeLocationsManagerProps {
  locations: OfficeLocation[];
  updatedAt?: string;
  onSave: (locations: OfficeLocation[]) => Promise<void>;
}

export default function OfficeLocationsManager({
  locations: initialLocations,
  updatedAt,
  onSave,
}: OfficeLocationsManagerProps) {
  const [locations, setLocations] = useState<OfficeLocation[]>(initialLocations || []);
  const [isManaging, setIsManaging] = useState(false); // Independent edit state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync locations when prop changes
  useEffect(() => {
    setLocations(initialLocations || []);
  }, [initialLocations]);

  // Form state for adding/editing
  const [formData, setFormData] = useState<OfficeLocation>({
    name: "",
    latitude: 0,
    longitude: 0,
    radiusMeters: 50,
  });

  const resetForm = () => {
    setFormData({ name: "", latitude: 0, longitude: 0, radiusMeters: 50 });
    setIsAdding(false);
    setEditingIndex(null);
  };

  const handleStopManaging = () => {
    resetForm();
    setIsManaging(false);
  };

  const handleAdd = () => {
    setIsAdding(true);
    setEditingIndex(null);
    setFormData({ name: "", latitude: 0, longitude: 0, radiusMeters: 50 });
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsAdding(false);
    setFormData({ ...locations[index] });
  };

  const handleSaveRow = async () => {
    if (!formData.name.trim()) {
      toast.error("Location name is required");
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      toast.error("Latitude and Longitude are required");
      return;
    }

    setSaving(true);
    try {
      let newLocations: OfficeLocation[];

      if (isAdding) {
        newLocations = [...locations, formData];
      } else if (editingIndex !== null) {
        newLocations = locations.map((loc, i) =>
          i === editingIndex ? formData : loc
        );
      } else {
        return;
      }

      await onSave(newLocations);
      setLocations(newLocations);
      resetForm();
      toast.success(isAdding ? "Location added" : "Location updated");
    } catch (error) {
      toast.error("Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    setSaving(true);
    try {
      const newLocations = locations.filter((_, i) => i !== index);
      await onSave(newLocations);
      setLocations(newLocations);
      toast.success("Location deleted");
    } catch (error) {
      toast.error("Failed to delete location");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Office Locations</CardTitle>
            <CardDescription>
              Manage locations for attendance geofencing
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {updatedAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Updated: {formatDate(updatedAt)}</span>
            </div>
          )}
          {!isManaging ? (
            <Button onClick={() => setIsManaging(true)} size="sm" variant="outline">
              <Pencil className="h-4 w-4 mr-1" />
              Manage Locations
            </Button>
          ) : (
            <div className="flex gap-2">
              {!isAdding && editingIndex === null && (
                <Button onClick={handleAdd} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
              <Button onClick={handleStopManaging} size="sm" variant="ghost">
                <X className="h-4 w-4 mr-1" />
                Done
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {locations.length === 0 && !isAdding ? (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No office locations configured</p>
            <p className="text-sm mt-1">
              {isManaging
                ? "Click 'Add' to add your first office location"
                : "Click 'Manage Locations' to add office locations"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Latitude</TableHead>
                <TableHead>Longitude</TableHead>
                <TableHead>Radius (m)</TableHead>
                {isManaging && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((loc, index) => (
                <TableRow key={loc._id || index}>
                  {editingIndex === index ? (
                    <>
                      <TableCell>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder="Office name"
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              latitude: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              longitude: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="h-8 w-28"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={formData.radiusMeters}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              radiusMeters: parseInt(e.target.value) || 50,
                            })
                          }
                          className="h-8 w-20"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={handleSaveRow}
                            disabled={saving}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={resetForm}
                            disabled={saving}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{loc.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {loc.latitude}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {loc.longitude}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{loc.radiusMeters}m</Badge>
                      </TableCell>
                      {isManaging && (
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleEdit(index)}
                              disabled={saving || isAdding}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  disabled={saving || isAdding}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Location?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{loc.name}"?
                                    Employees will no longer be able to punch in
                                    from this location.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(index)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      )}
                    </>
                  )}
                </TableRow>
              ))}
              {isAdding && (
                <TableRow>
                  <TableCell>
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g. Head Office"
                      className="h-8"
                      autoFocus
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="any"
                      value={formData.latitude || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          latitude: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="26.7198"
                      className="h-8 w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="any"
                      value={formData.longitude || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          longitude: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="88.3905"
                      className="h-8 w-28"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={formData.radiusMeters}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          radiusMeters: parseInt(e.target.value) || 50,
                        })
                      }
                      className="h-8 w-20"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleSaveRow}
                        disabled={saving}
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={resetForm}
                        disabled={saving}
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
