"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const authHeader = () => ({
  Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
});

export default function CreateTab() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch categories
  useEffect(() => {
    fetch(`${API}/api/user/categories`, {
      headers: authHeader(),
    })
      .then((r) => r.json())
      .then((d) => setCategories(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!selectedCategory || !title.trim() || !file) {
      setError("Please fill title, select a category, and upload an image");
      return;
    }

    setError("");
    setLoading(true);

    const fd = new FormData();
    fd.append("title", title.trim());
    fd.append("description", description.trim());
    fd.append("category", selectedCategory);
    fd.append("challengerImage", file);

    try {
      const res = await fetch(`${API}/api/user/challenges`, {
        method: "POST",
        headers: authHeader(),
        body: fd,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to create challenge");

      setSuccess(true);
      // Reset form
      setTitle("");
      setDescription("");
      setFile(null);
      setPreview(null);
      setSelectedCategory(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Challenge Posted Successfully!</h2>
        <p className="text-muted-foreground mb-6">
          Waiting for someone to accept your challenge.
        </p>
        <Button onClick={() => setSuccess(false)} className="gap-2">
          Post Another Challenge
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <Label htmlFor="title">Challenge Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Best Nature Photography"
          className="mt-2"
          maxLength={100}
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your challenge... (max 500 characters)"
          className="mt-2 h-24"
          maxLength={500}
        />
      </div>

      {/* Category Selection */}
      <div>
        <Label>Select Category *</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCategory(c._id)}
              className={`flex items-center gap-3 p-4 border rounded-xl text-left transition-all ${
                selectedCategory === c._id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-foreground/50 hover:bg-muted"
              }`}
            >
              {c.image && (
                <img
                  src={`${API}${c.image}`}
                  alt={c.name}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div>
                <p className="font-medium">{c.name}</p>
                {c.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {c.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload */}
      <div>
        <Label>Your Challenge Image *</Label>
        <div className="mt-3 border-2 border-dashed border-border rounded-2xl p-8 text-center">
          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-80 rounded-xl object-contain"
              />
              <Button variant="outline" onClick={() => document.getElementById("fileInput").click()}>
                Change Image
              </Button>
            </div>
          ) : (
            <label
              htmlFor="fileInput"
              className="cursor-pointer flex flex-col items-center gap-3 py-6"
            >
              <Upload className="w-10 h-10 text-muted-foreground" />
              <div>
                <p className="font-medium">Upload Challenge Image</p>
                <p className="text-sm text-muted-foreground mt-1">
                  JPG, PNG, WEBP (Max 5MB)
                </p>
              </div>
            </label>
          )}
          <input
            id="fileInput"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2">
          ⚠️ {error}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={loading || !selectedCategory || !title.trim() || !file}
        className="w-full py-6 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Posting Challenge...
          </>
        ) : (
          <>
            Post Challenge
            <ArrowRight className="w-5 h-5 ml-2" />
          </>
        )}
      </Button>
    </div>
  );
}