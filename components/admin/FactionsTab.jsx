"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Section, Table, Tr, Td, Empty, Modal, StatCard } from "./AdminUI";
import { Plus, Pencil, Trash2, Upload, Shield } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

const EMPTY_FORM = { 
  name: "", 
  description: "", 
  imageFile: null 
};

export default function FactionsTab({ onCountChange }) {
  const [factions, setFactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [preview, setPreview] = useState(null);
  const [delModal, setDelModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/factions`, { headers: authHeader() });
      const data = await res.json();
      setFactions(Array.isArray(data) ? data : []);
      onCountChange?.(data.length);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPreview(null);
    setModal(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({ 
      name: f.name, 
      description: f.description || "", 
      imageFile: null 
    });
    setPreview(f.image ? `${API}${f.image}` : null);
    setModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setForm((prev) => ({ ...prev, imageFile: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    const fd = new FormData();
    fd.append("name", form.name.trim());
    fd.append("description", form.description.trim() || "");

    if (form.imageFile) {
      fd.append("factionImage", form.imageFile);
    }

    try {
      if (editing) {
        await fetch(`${API}/api/admin/factions/${editing._id}`, {
          method: "PUT",
          headers: { Authorization: authHeader().Authorization },
          body: fd,
        });
      } else {
        await fetch(`${API}/api/admin/factions`, {
          method: "POST",
          headers: { Authorization: authHeader().Authorization },
          body: fd,
        });
      }

      setModal(false);
      setPreview(null);
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to save faction. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!delModal) return;
    try {
      await fetch(`${API}/api/admin/factions/${delModal._id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      setDelModal(null);
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete faction");
    }
  };

  return (
    <Section
      title="Factions"
      subtitle="Faction Management"
      action={
        <Button size="sm" className="rounded-none text-xs gap-2" onClick={openCreate}>
          <Plus size={12} /> New Faction
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Factions" value={factions.length} />
        <StatCard label="Total Rating Pool" value={factions.reduce((sum, f) => sum + (f.totalRating || 0), 0)} />
      </div>

      {factions.length === 0 && !loading ? (
        <Empty message="No factions yet" />
      ) : (
        <Table cols={["Image", "Name", "Description", "Total Rating", "Created By", "Actions"]} loading={loading}>
          {factions.map((f) => (
            <Tr key={f._id}>
              <Td>
                {f.image ? (
                  <img 
                    src={`${API}${f.image}`} 
                    alt={f.name} 
                    className="h-10 w-10 object-cover rounded-md border border-border/50" 
                  />
                ) : (
                  <div className="h-10 w-10 bg-muted flex items-center justify-center rounded-md">
                    <Shield size={18} className="text-muted-foreground/50" />
                  </div>
                )}
              </Td>
              <Td className="font-bold">{f.name}</Td>
              <Td className="text-muted-foreground max-w-xs truncate">{f.description || "—"}</Td>
              <Td className="font-mono text-sm">{f.totalRating?.toLocaleString() ?? 0}</Td>
              <Td className="text-muted-foreground">{f.createdBy?.username ?? "—"}</Td>
              <Td>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => openEdit(f)} 
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => setDelModal(f)} 
                    className="text-destructive/60 hover:text-destructive transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Create / Edit Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Faction" : "New Faction"}>
        <div className="flex flex-col gap-5">
          {/* Image Upload */}
          <div>
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 block">
              Faction Image (Optional)
            </Label>
            <label className="group relative flex h-32 w-full cursor-pointer items-center justify-center border border-dashed border-border/60 hover:border-foreground transition-colors overflow-hidden rounded-lg">
              {preview ? (
                <img src={preview} className="h-full w-full object-cover" alt="Preview" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-foreground transition-colors">
                  <Upload size={24} />
                  <span className="text-xs uppercase tracking-widest">Upload Image</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                className="sr-only" 
                onChange={handleFileChange} 
              />
            </label>
            {preview && (
              <p className="text-[10px] text-muted-foreground mt-1 text-center">Click image to change</p>
            )}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Faction Name *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-none bg-transparent border-border/60 text-sm h-10"
              placeholder="Enter faction name"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-none bg-transparent border-border/60 text-sm min-h-24"
              placeholder="Describe this faction..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-none text-xs" 
              onClick={() => setModal(false)}
            >
              Cancel
            </Button>
            <Button 
              size="sm" 
              className="rounded-none text-xs" 
              onClick={handleSave} 
              disabled={!form.name.trim()}
            >
              {editing ? "Save Changes" : "Create Faction"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!delModal} onClose={() => setDelModal(null)} title="Confirm Delete">
        <p className="text-sm text-muted-foreground mb-6">
          Are you sure you want to delete the faction{" "}
          <span className="font-bold text-foreground">"{delModal?.name}"</span>?
          <br />This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" className="rounded-none text-xs" onClick={() => setDelModal(null)}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" className="rounded-none text-xs" onClick={handleDelete}>
            Delete Faction
          </Button>
        </div>
      </Modal>
    </Section>
  );
}