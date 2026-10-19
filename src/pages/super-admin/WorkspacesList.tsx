import { LoadingState } from "../../components/feedback/LoadingState";
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { useGetWorkspacesQuery, useUpdateWorkspaceMutation, useCreateWorkspaceMutation, useDeleteWorkspaceMutation } from "../../store/api";
import { useToast } from "../../components/ui/ToastContext";
import { useAlert } from "../../components/ui/AlertContext";
import { Building2, Plus, Info, Check, Eye, Trash2, Calendar, ArrowUpDown, Search, Filter, RefreshCw, Ban } from "lucide-react";

export default function WorkspacesList() {
  const navigate = useNavigate();
  const { data: workspaces = [], isLoading, error, refetch } = useGetWorkspacesQuery({});
  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateWorkspaceMutation();
  const [createWorkspace, { isLoading: isCreating }] = useCreateWorkspaceMutation();
  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteWorkspaceMutation();
  const { showToast } = useToast();
  const { showAlert } = useAlert();

  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "date_desc" | "date_asc" | "expiry_asc" | "expiry_desc">("date_desc");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled" | "trial" | "paid" | "expired">("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);

  // Form state for creating workspace
  const [formData, setFormData] = useState({
    name: "",
    subdomain: "",
    address: "",
    pincode: "",
    ownerName: "",
    ownerEmail: "",
    ownerPassword: "",
    ownerMobile: "",
  });

  const handleOpenAddModal = () => {
    setFormData({
      name: "",
      subdomain: `ws-${Date.now()}`,
      address: "",
      pincode: "",
      ownerName: "",
      ownerEmail: "",
      ownerPassword: "",
      ownerMobile: "",
    });
    setIsAddModalOpen(true);
  };

  const handleAddWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const autoSub = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || `ws-${Date.now()}`;

      await createWorkspace({
        ...formData,
        subdomain: autoSub
      }).unwrap();
      showToast("Workspace and owner account created successfully!", "success");
      setIsAddModalOpen(false);
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to create workspace manually.", "error");
    }
  };

  const handleToggleAccess = async (workspace: any) => {
    try {
      await updateWorkspace({
        id: workspace.id,
        isActive: !workspace.isActive
      }).unwrap();
      showToast(
        `Workspace "${workspace.name}" has been ${!workspace.isActive ? "enabled" : "disabled"} successfully.`,
        "success"
      );
      if (selectedWorkspace?.id === workspace.id) {
        setSelectedWorkspace({ ...workspace, isActive: !workspace.isActive });
      }
    } catch (err) {
      showToast("Failed to update workspace status.", "error");
    }
  };

  const handleDeleteWorkspace = async (workspace: any) => {
    const confirmed = await showAlert(
      `Are you sure you want to permanently delete "${workspace.name}"? All branch, room, seat, and student data associated with this library workspace will be permanently removed. This action cannot be undone.`,
      {
        title: "Delete Workspace",
        confirmText: "Delete Permanently",
        cancelText: "Cancel",
        type: "danger",
      }
    );
    if (!confirmed) return;
    try {
      await deleteWorkspace(workspace.id).unwrap();
      showToast(`Workspace "${workspace.name}" deleted successfully.`, "success");
    } catch (err: any) {
      showToast(err?.data?.message || "Failed to delete workspace.", "error");
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const baseSubdomain = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    setFormData(prev => ({
      ...prev,
      name,
      subdomain: baseSubdomain || `ws-${Date.now()}`
    }));
  };

  // Filter and sort workspaces
  const processedWorkspaces = useMemo(() => {
    return workspaces
      .filter((w: any) => !w.deletedAt)
      .filter((w: any) => {
        // Search Filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase().trim();
          const matchesName = w.name?.toLowerCase().includes(term);
          const matchesSubdomain = w.subdomain?.toLowerCase().includes(term);
          const owner = w.users && w.users[0];
          const matchesOwner = owner?.name?.toLowerCase().includes(term) || owner?.email?.toLowerCase().includes(term);
          const matchesPlan = w.subscription?.saasPlan?.name?.toLowerCase().includes(term);
          if (!matchesName && !matchesSubdomain && !matchesOwner && !matchesPlan) {
            return false;
          }
        }

        // Status Filter
        if (statusFilter === "active" && !w.isActive) return false;
        if (statusFilter === "disabled" && w.isActive) return false;
        if (statusFilter === "trial" && w.subscription?.status !== "TRIAL") return false;
        if (statusFilter === "paid" && (!w.subscription || w.subscription?.status === "TRIAL")) return false;
        if (statusFilter === "expired") {
          const expiry = w.subscription?.currentPeriodEnd || w.subscription?.trialEndDate;
          const isExpired = w.subscription?.status === "EXPIRED" || (expiry && new Date(expiry).getTime() < Date.now());
          if (!isExpired) return false;
        }

        return true;
      })
      .sort((a: any, b: any) => {
        // Sort by Name
        if (sortBy === "name_asc") {
          return (a.name || "").localeCompare(b.name || "");
        }
        if (sortBy === "name_desc") {
          return (b.name || "").localeCompare(a.name || "");
        }

        // Sort by Date Added
        if (sortBy === "date_desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortBy === "date_asc") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }

        // Sort by Subscription Expiry Days
        const aExpiry = a.subscription?.currentPeriodEnd || a.subscription?.trialEndDate;
        const bExpiry = b.subscription?.currentPeriodEnd || b.subscription?.trialEndDate;

        if (sortBy === "expiry_asc") {
          if (!aExpiry && !bExpiry) return 0;
          if (!aExpiry) return 1; // Put without expiry at bottom
          if (!bExpiry) return -1;
          return new Date(aExpiry).getTime() - new Date(bExpiry).getTime();
        }
        if (sortBy === "expiry_desc") {
          if (!aExpiry && !bExpiry) return 0;
          if (!aExpiry) return 1;
          if (!bExpiry) return -1;
          return new Date(bExpiry).getTime() - new Date(aExpiry).getTime();
        }

        return 0;
      });
  }, [workspaces, searchTerm, statusFilter, sortBy]);

  if (isLoading) {
    return (
      <LoadingState label="Loading workspaces..." />
    );
  }

  if (error) {
    return (
      <div style={{ padding: "2rem", background: "#fee2e2", color: "#991b1b", borderRadius: "8px", border: "1px solid #fca5a5" }}>
        Failed to load workspaces. Please try again.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Page Header */}
      <div style={{ 
        background: "#ffffff", 
        borderRadius: "16px", 
        padding: "24px", 
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h2 style={{ margin: 0, color: "#0f172a", fontSize: "1.35rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
              Managed Workspaces
            </h2>
            <span style={{ 
              background: "#f1f5f9", 
              color: "#475569", 
              padding: "2px 8px", 
              borderRadius: "999px", 
              fontSize: "0.75rem", 
              fontWeight: 700 
            }}>
              {processedWorkspaces.length} of {workspaces.filter((w: any) => !w.deletedAt).length}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
            Monitor library workspaces, track SaaS subscription periods &amp; expiry dates, and manage account access.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Button 
            variant="outline" 
            onClick={() => refetch()} 
            style={{ display: "flex", alignItems: "center", gap: "6px", borderRadius: "10px", padding: "10px 14px" }}
            title="Refresh workspaces list"
          >
            <RefreshCw size={15} />
          </Button>
          <Button 
            variant="primary" 
            onClick={handleOpenAddModal} 
            style={{ display: "flex", alignItems: "center", gap: "6px", borderRadius: "10px", padding: "10px 18px", fontWeight: 700 }}
          >
            <Plus size={16} /> Add Workspace Manually
          </Button>
        </div>
      </div>

      {/* Filter & Sort Toolbar */}
      <div style={{
        background: "#ffffff",
        borderRadius: "16px",
        padding: "16px 20px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "14px"
      }}>
        {/* Left: Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 280px", maxWidth: "420px", position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search by library name or owner email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px 9px 36px",
              borderRadius: "10px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem",
              outline: "none",
              color: "#1e293b",
              backgroundColor: "#f8fafc"
            }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{
                position: "absolute",
                right: "10px",
                border: "none",
                background: "transparent",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "0.8rem",
                fontWeight: 700
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Right: Sort By & Status Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={15} style={{ color: "#64748b" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#475569" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "0.825rem",
                fontWeight: 600,
                color: "#1e293b",
                backgroundColor: "#ffffff",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="all">All Workspaces</option>
              <option value="active">Active Access Only</option>
              <option value="disabled">Disabled Access Only</option>
              <option value="trial">Trial Subscriptions</option>
              <option value="paid">Paid Subscriptions</option>
              <option value="expired">Expired Subscriptions</option>
            </select>
          </div>

          {/* Sort By Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ArrowUpDown size={15} style={{ color: "#2563eb" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b" }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #2563eb",
                fontSize: "0.825rem",
                fontWeight: 700,
                color: "#1d4ed8",
                backgroundColor: "rgba(37, 99, 235, 0.04)",
                outline: "none",
                cursor: "pointer"
              }}
            >
              <option value="name_asc">Name (A → Z)</option>
              <option value="name_desc">Name (Z → A)</option>
              <option value="date_desc">Date Added (Newest first)</option>
              <option value="date_asc">Date Added (Oldest first)</option>
              <option value="expiry_asc">Subscription Expiry (Expiring Soonest)</option>
              <option value="expiry_desc">Subscription Expiry (Furthest away)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div style={{ background: "#ffffff", borderRadius: "16px", padding: "8px 20px 20px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", overflowX: "auto" }}>
        {processedWorkspaces.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>No workspaces match your search or filter criteria.</p>
            {(searchTerm || statusFilter !== "all") && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setSearchTerm(""); setStatusFilter("all"); setSortBy("date_desc"); }}
                style={{ marginTop: "1rem", borderRadius: "8px" }}
              >
                Reset All Filters
              </Button>
            )}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #e2e8f0", textAlign: "left", color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                <th 
                  onClick={() => setSortBy(sortBy === "name_asc" ? "name_desc" : "name_asc")}
                  style={{ padding: "14px 12px", cursor: "pointer", userSelect: "none" }}
                  title="Click to sort by Name"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>Workspace / Library</span>
                    <ArrowUpDown size={13} style={{ color: sortBy.startsWith("name") ? "#2563eb" : "#94a3b8" }} />
                  </div>
                </th>
                <th style={{ padding: "14px 12px" }}>Owner Contact</th>
                <th 
                  onClick={() => setSortBy(sortBy === "expiry_asc" ? "expiry_desc" : "expiry_asc")}
                  style={{ padding: "14px 12px", cursor: "pointer", userSelect: "none" }}
                  title="Click to sort by Subscription Expiry Days"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>SaaS Plan &amp; Expiry</span>
                    <ArrowUpDown size={13} style={{ color: sortBy.startsWith("expiry") ? "#2563eb" : "#94a3b8" }} />
                  </div>
                </th>
                <th 
                  onClick={() => setSortBy(sortBy === "date_desc" ? "date_asc" : "date_desc")}
                  style={{ padding: "14px 12px", cursor: "pointer", userSelect: "none" }}
                  title="Click to sort by Date Added"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>Date Added</span>
                    <ArrowUpDown size={13} style={{ color: sortBy.startsWith("date") ? "#2563eb" : "#94a3b8" }} />
                  </div>
                </th>
                <th style={{ padding: "14px 12px" }}>Access</th>
                <th style={{ padding: "14px 12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {processedWorkspaces.map((row: any) => {
                const owner = row.users && row.users[0];
                const planName = row.subscription?.saasPlan?.name || (row.subscription ? `Trial (${row.subscription.status})` : "No Plan");
                const isActive = row.isActive;
                
                // Subscription expiry calculations
                const expiryDate = row.subscription?.currentPeriodEnd || row.subscription?.trialEndDate;
                let daysRemaining: number | null = null;
                let formattedExpiry = "";
                let isExpired = false;

                if (expiryDate) {
                  const expiryTime = new Date(expiryDate).getTime();
                  const now = Date.now();
                  daysRemaining = Math.ceil((expiryTime - now) / (1000 * 60 * 60 * 24));
                  formattedExpiry = new Date(expiryDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  });
                  isExpired = daysRemaining < 0 || row.subscription?.status === "EXPIRED";
                }

                // Date Added
                const formattedDateAdded = row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                }) : "N/A";

                return (
                  <tr 
                    key={row.id} 
                    style={{ 
                      borderBottom: "1px solid #f1f5f9", 
                      opacity: isActive ? 1 : 0.65,
                      transition: "background-color 0.15s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    {/* Workspace Name & Subtitle */}
                    <td 
                      onClick={() => navigate(`/super-admin/workspaces/${row.id}`)}
                      style={{ padding: "14px 12px", cursor: "pointer" }}
                    >
                      <div style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.925rem" }}>
                        {row.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                        {row.address ? row.address.slice(0, 32) + (row.address.length > 32 ? "..." : "") : "No address specified"}
                      </div>
                    </td>

                    {/* Owner Info */}
                    <td style={{ padding: "14px 12px", color: "#475569" }}>
                      {owner ? (
                        <div>
                          <div style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.85rem" }}>{owner.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{owner.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>No Owner</span>
                      )}
                    </td>

                    {/* SaaS Plan & End Date in Small */}
                    <td style={{ padding: "14px 12px" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{planName}</span>
                        {row.subscription?.status === "TRIAL" && (
                          <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "0.68rem", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            TRIAL
                          </span>
                        )}
                      </div>
                      
                      {/* Subscription End Date in Small */}
                      {expiryDate ? (
                        <div style={{ 
                          fontSize: "0.75rem", 
                          marginTop: "4px", 
                          display: "flex", 
                          alignItems: "center", 
                          flexWrap: "wrap",
                          gap: "5px" 
                        }}>
                          <span style={{ color: "#64748b", display: "inline-flex", alignItems: "center", gap: "3px" }}>
                            <Calendar size={12} style={{ color: "#94a3b8" }} />
                            <span>Expires: <strong>{formattedExpiry}</strong></span>
                          </span>
                          
                          {/* Expiry days pill badge */}
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            background: isExpired 
                              ? "#fee2e2" 
                              : (daysRemaining! <= 7 ? "#fef3c7" : "#dcfce7"),
                            color: isExpired 
                              ? "#991b1b" 
                              : (daysRemaining! <= 7 ? "#92400e" : "#166534"),
                            border: `1px solid ${isExpired ? "#fca5a5" : (daysRemaining! <= 7 ? "#fde68a" : "#bbf7d0")}`
                          }}>
                            {isExpired 
                              ? (daysRemaining !== null && daysRemaining < 0 ? `${Math.abs(daysRemaining)}d expired` : "Expired")
                              : daysRemaining === 0 
                              ? "Expires today" 
                              : `${daysRemaining}d left`}
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.725rem", color: "#94a3b8", marginTop: "3px", fontStyle: "italic" }}>
                          No expiry date
                        </div>
                      )}
                    </td>

                    {/* Date Added */}
                    <td style={{ padding: "14px 12px", color: "#475569", fontSize: "0.825rem", whiteSpace: "nowrap" }}>
                      {formattedDateAdded}
                    </td>

                    {/* Access Status Badge */}
                    <td style={{ padding: "14px 12px" }}>
                      <span style={{ 
                        background: isActive ? "#dcfce7" : "#fee2e2", 
                        color: isActive ? "#166534" : "#991b1b", 
                        padding: "4px 8px", 
                        borderRadius: "6px", 
                        fontSize: "0.75rem", 
                        fontWeight: 700 
                      }}>
                        {isActive ? "Active" : "Disabled"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 12px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => navigate(`/super-admin/workspaces/${row.id}`)}
                          title="View Workspace Details"
                          style={{ 
                            borderRadius: "8px", 
                            borderColor: "#bfdbfe",
                            color: "#2563eb",
                            backgroundColor: "#eff6ff",
                            padding: "6px 8px",
                            display: "inline-flex", 
                            alignItems: "center", 
                            justifyContent: "center" 
                          }}
                        >
                          <Eye size={13} />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleAccess(row)}
                          disabled={isUpdating || isDeleting}
                          title={isActive ? "Disable Workspace Access" : "Enable Workspace Access"}
                          style={{ 
                            borderRadius: "8px",
                            borderColor: isActive ? "#fed7aa" : "#bbf7d0", 
                            color: isActive ? "#ea580c" : "#16a34a",
                            backgroundColor: isActive ? "#fff7ed" : "#f0fdf4",
                            padding: "6px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          {isActive ? <Ban size={13} /> : <Check size={13} />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteWorkspace(row)}
                          disabled={isDeleting || isUpdating}
                          title="Permanently Delete Workspace"
                          style={{ 
                            borderRadius: "8px",
                            borderColor: "#fee2e2", 
                            color: "#ef4444",
                            backgroundColor: "#fef2f2",
                            padding: "6px 8px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 1. ADD WORKSPACE MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Workspace Manually"
        maxWidth="md"
      >
        <form onSubmit={handleAddWorkspaceSubmit}>
          <div style={{ padding: "0.5rem 0" }}>
            <h4 style={{ margin: "0 0 1rem 0", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem", fontSize: "1rem" }}>Workspace Information</h4>
            
            <div style={{ marginBottom: "1.5rem" }}>
              <Input
                label="Workspace / Library Name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g. Royal Library"
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <Input
                label="Physical Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. 1st Floor, Sector 15, Noida"
                required
              />
              <Input
                label="Pincode"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="e.g. 201301"
              />
            </div>

            <h4 style={{ margin: "1.5rem 0 1rem 0", color: "#1e293b", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem", fontSize: "1rem" }}>Owner Account Credentials</h4>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <Input
                label="Owner Full Name"
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                required
              />
              <Input
                label="Owner Mobile Number"
                value={formData.ownerMobile}
                onChange={(e) => setFormData({ ...formData, ownerMobile: e.target.value })}
                placeholder="e.g. 9876543210"
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <Input
                label="Owner Email Address"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value.toLowerCase() })}
                placeholder="e.g. rajesh@email.com"
                required
              />
              <Input
                label="Owner Password"
                type="password"
                value={formData.ownerPassword}
                onChange={(e) => setFormData({ ...formData, ownerPassword: e.target.value })}
                placeholder="Password (min 6 characters)"
                required
                minLength={6}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "2rem" }}>
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button type="submit" variant="primary" disabled={isCreating}>
                {isCreating ? "Creating Workspace..." : "Create Workspace"}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
