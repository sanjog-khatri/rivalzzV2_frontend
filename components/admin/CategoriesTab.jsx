"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Section, Table, Tr, Td, Empty, Modal, StatCard } from "./AdminUI";
import { Plus, Pencil, Trash2, Upload } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;
const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

const EMPTY_FORM = { name: "", description: "", image: null };

export default function CategoriesTab({ onCountChange }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [preview, setPreview]       = useState(null);
  const [delModal, setDelModal]     = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/admin/categories`, { headers: authHeader() });
      const data = await res.json();
      setCategories(data);
      onCountChange?.(data.length);
    } catch {/* handle */} finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setPreview(null); setModal(true); };
  const openEdit   = (c)  => {
    setEditing(c);
    setForm({ name: c.name, description: c.description, image: null });
    setPreview(c.image ? `${API}${c.image}` : null);
    setModal(true);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((f) => ({ ...f, image: file }));
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description);
    if (form.image) fd.append("categoryImage", form.image);

    if (editing) {
      await fetch(`${API}/api/admin/categories/${editing._id}`, { method: "PUT",  headers: authHeader(), body: fd });
    } else {
      await fetch(`${API}/api/admin/categories`,                { method: "POST", headers: authHeader(), body: fd });
    }
    setModal(false);
    load();
  };

  const handleDelete = async () => {
    const res  = await fetch(`${API}/api/admin/categories/${delModal._id}`, { method: "DELETE", headers: authHeader() });
    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    setDelModal(null);
    load();
  };

  return (
    <Section
      title="Categories"
      subtitle="Category Management"
      action={
        <Button size="sm" className="rounded-none text-xs gap-2" onClick={openCreate}>
          <Plus size={12} /> New Category
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Total Categories" value={categories.length} />
        <StatCard label="Last Added" value={categories[0]?.name ?? "—"} />
      </div>

      {categories.length === 0 && !loading ? (
        <Empty message="No categories yet" />
      ) : (
        <Table cols={["Image", "Name", "Description", "Created By", "Actions"]} loading={loading}>
          {categories.map((c) => (
            <Tr key={c._id}>
              <Td>
                {c.image ? (
                  <img src={`${API}${c.image}`} className="h-8 w-8 object-cover" alt="" />
                ) : (
                  <div className="h-8 w-8 bg-foreground/10" />
                )}
              </Td>
              <Td className="font-bold">{c.name}</Td>
              <Td className="text-muted-foreground max-w-xs truncate">{c.description || "—"}</Td>
              <Td className="text-muted-foreground">{c.createdBy?.username ?? "—"}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(c)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDelModal(c)} className="text-destructive/50 hover:text-destructive transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </Table>
      )}

      {/* Create / Edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Category" : "New Category"}>
        <div className="flex flex-col gap-4">
          {/* Image upload */}
          <label className="group relative flex h-24 w-full cursor-pointer items-center justify-center border border-dashed border-border/60 hover:border-foreground transition-colors overflow-hidden">
            {preview ? (
              <img src={preview} className="h-full w-full object-cover" alt="" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors">
                <Upload size={14} />
                <span className="text-[10px] uppercase tracking-widest">Category Image</span>
              </div>
            )}
            <input type="file" accept="image/*" className="sr-only" onChange={handleFile} />
          </label>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-none bg-transparent border-border/60 text-xs h-9"
              placeholder="Category name"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="rounded-none bg-transparent border-border/60 text-xs min-h-20"
              placeholder="Category description"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" className="rounded-none text-xs" onClick={() => setModal(false)}>Cancel</Button>
            <Button size="sm" className="rounded-none text-xs" onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={!!delModal} onClose={() => setDelModal(null)} title="Confirm Delete">
        <p className="text-xs text-muted-foreground mb-5">
          Delete category <span className="text-foreground font-bold">{delModal?.name}</span>?{" "}
          Cannot delete if challenges are using it.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" className="rounded-none text-xs" onClick={() => setDelModal(null)}>Cancel</Button>
          <Button variant="destructive" size="sm" className="rounded-none text-xs" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </Section>
  );
}