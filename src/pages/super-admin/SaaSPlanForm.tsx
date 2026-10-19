import { LoadingState } from "../../components/feedback/LoadingState";
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  useGetSaaSPlansQuery, 
  useCreateSaaSPlanMutation, 
  useUpdateSaaSPlanMutation 
} from "../../store/api";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useToast } from "../../components/ui/ToastContext";
import { ArrowLeft, Save, Zap, Check, Info } from "lucide-react";

export default function SaaSPlanForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEditMode = Boolean(id);

  const { data: plans = [], isLoading: isPlansLoading } = useGetSaaSPlansQuery({});
  const [createPlan, { isLoading: isCreating }] = useCreateSaaSPlanMutation();
  const [updatePlan, { isLoading: isUpdating }] = useUpdateSaaSPlanMutation();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    annualPrice: "",
    description: "",
    maxSeats: "",
    maxRooms: "",
    maxBranches: "1",
    maxStaff: "1",
    allowWhatsApp: false,
    isPopular: false,
    isHighlighted: false,
    features: "",
  });

  // Load editing plan details if in edit mode
  useEffect(() => {
    if (isEditMode && plans.length > 0) {
      const plan = plans.find((p: any) => p.id === id);
      if (plan) {
        setFormData({
          name: plan.name || "",
          price: plan.price ? plan.price.toString() : "",
          annualPrice: plan.annualPrice ? plan.annualPrice.toString() : "",
          description: plan.description || "",
          maxSeats: (plan.maxSeats === -1 || plan.maxSeats === null || plan.maxSeats === undefined) ? "" : plan.maxSeats.toString(),
          maxRooms: (plan.maxRooms === -1 || plan.maxRooms === null || plan.maxRooms === undefined) ? "" : plan.maxRooms.toString(),
          maxBranches: (plan.maxBranches === -1 || plan.maxBranches === null || plan.maxBranches === undefined) ? "" : plan.maxBranches.toString(),
          maxStaff: (plan.maxStaff === -1 || plan.maxStaff === null || plan.maxStaff === undefined) ? "" : plan.maxStaff.toString(),
          allowWhatsApp: Boolean(plan.allowWhatsApp),
          isPopular: Boolean(plan.isPopular),
          isHighlighted: Boolean(plan.isHighlighted),
          features: plan.features ? plan.features.join("\n") : "",
        });
      } else {
        showToast("Requested plan tier not found.", "error");
        navigate("/super-admin/plans");
      }
    }
  }, [id, isEditMode, plans, navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      price: parseFloat(formData.price),
      annualPrice: formData.annualPrice ? parseFloat(formData.annualPrice) : null,
      description: formData.description,
      maxSeats: formData.maxSeats ? parseInt(formData.maxSeats) : -1,
      maxRooms: formData.maxRooms ? parseInt(formData.maxRooms) : -1,
      maxBranches: formData.maxBranches ? parseInt(formData.maxBranches) : 1,
      maxStaff: formData.maxStaff ? parseInt(formData.maxStaff) : 1,
      allowWhatsApp: formData.allowWhatsApp,
      isPopular: formData.isPopular,
      isHighlighted: formData.isHighlighted,
      features: formData.features.split("\n").filter(f => f.trim()),
    };

    try {
      if (isEditMode) {
        await updatePlan({ id: id!, ...payload }).unwrap();
        showToast("Plan tier updated successfully.", "success");
      } else {
        await createPlan(payload).unwrap();
        showToast("New SaaS plan tier created successfully.", "success");
      }
      navigate("/super-admin/plans");
    } catch (err) {
      showToast("Error saving plan parameters. Please try again.", "error");
    }
  };

  if (isEditMode && isPlansLoading) {
    return (
      <LoadingState label="Loading plan parameters..." />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      
      {/* Back button */}
      <div>
        <Button 
          variant="outline" 
          onClick={() => navigate("/super-admin/plans")}
          style={{ display: "flex", alignItems: "center", gap: "6px", borderRadius: "10px" }}
        >
          <ArrowLeft size={16} /> Back to Pricing Plans
        </Button>
      </div>

      {/* Main editor structure */}
      <div style={{
        background: "#ffffff",
        border: "1px solid rgba(15, 23, 42, 0.05)",
        borderRadius: "20px",
        padding: "32px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.02)",
        display: "flex",
        flexDirection: "column",
        gap: "28px"
      }}>
        
        {/* Title and Intro */}
        <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "10px",
            background: "rgba(37, 99, 235, 0.08)",
            color: "#2563eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Zap size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>
              {isEditMode ? "Modify SaaS Plan Tier" : "Define New Subscription Tier"}
            </h2>
            <p style={{ margin: "2px 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
              Set subscription pricing (monthly & annual), seat limits, room caps, branch allowances, and custom feature matrix.
            </p>
          </div>
        </div>

        {/* Editor Form */}
        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
          
          {/* Left Column: Properties & Pricing */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Plan Properties & Pricing
            </h3>

            <Input
              label="Plan Name / Identifier"
              placeholder="e.g. Starter / Basic, Growth / Pro, Business"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Input
                label="Monthly Pricing (INR)"
                type="number"
                placeholder="e.g. 599"
                required
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <Input
                label="Annual Pricing (INR)"
                type="number"
                placeholder="e.g. 5990 (2 mo free)"
                min="0"
                value={formData.annualPrice}
                onChange={(e) => setFormData({ ...formData, annualPrice: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Input
                label="Maximum Physical Seats"
                type="number"
                placeholder="Leave blank for unlimited"
                min="1"
                value={formData.maxSeats}
                onChange={(e) => setFormData({ ...formData, maxSeats: e.target.value })}
              />
              <Input
                label="Maximum Rooms / Floors"
                type="number"
                placeholder="Leave blank for unlimited"
                min="1"
                value={formData.maxRooms}
                onChange={(e) => setFormData({ ...formData, maxRooms: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <Input
                label="Maximum Branches Cap"
                type="number"
                placeholder="e.g. 1, 2, 5 (blank for unlim)"
                min="1"
                value={formData.maxBranches}
                onChange={(e) => setFormData({ ...formData, maxBranches: e.target.value })}
              />
              <Input
                label="Max Staff Accounts (Excl. Owner)"
                type="number"
                placeholder="e.g. 1, 2, 4, 8, 15"
                min="1"
                value={formData.maxStaff}
                onChange={(e) => setFormData({ ...formData, maxStaff: e.target.value })}
              />
            </div>

            {/* Feature Access Flags */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>Options & Access Flags</span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  cursor: "pointer", 
                  fontSize: "0.85rem", 
                  color: "#1e293b", 
                  fontWeight: 600,
                  border: "1px solid #cbd5e1",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  backgroundColor: "#f8fafc"
                }}>
                  <input 
                    type="checkbox"
                    checked={formData.allowWhatsApp}
                    onChange={(e) => setFormData({ ...formData, allowWhatsApp: e.target.checked })}
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "4px",
                      accentColor: "#2563eb",
                      cursor: "pointer"
                    }}
                  />
                  WhatsApp Broadcast Access (Message credits separate)
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    cursor: "pointer", 
                    fontSize: "0.825rem", 
                    color: "#1e293b", 
                    fontWeight: 600,
                    border: "1px solid #cbd5e1",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc"
                  }}>
                    <input 
                      type="checkbox"
                      checked={formData.isPopular}
                      onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        accentColor: "#f59e0b",
                        cursor: "pointer"
                      }}
                    />
                    ⭐ Most Popular Badge
                  </label>

                  <label style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px", 
                    cursor: "pointer", 
                    fontSize: "0.825rem", 
                    color: "#1e293b", 
                    fontWeight: 600,
                    border: "1px solid #cbd5e1",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    backgroundColor: "#f8fafc"
                  }}>
                    <input 
                      type="checkbox"
                      checked={formData.isHighlighted}
                      onChange={(e) => setFormData({ ...formData, isHighlighted: e.target.checked })}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        accentColor: "#2563eb",
                        cursor: "pointer"
                      }}
                    />
                    Highlight on Sales Page
                  </label>
                </div>
              </div>
            </div>

            <Input
              label="Short Pitch / Subtitle"
              placeholder="e.g. Automate renewals and manage your growing library with less daily effort."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {/* Info notice box */}
            <div style={{
              background: "rgba(59, 130, 246, 0.04)",
              border: "1px solid rgba(59, 130, 246, 0.15)",
              borderRadius: "12px",
              padding: "14px",
              fontSize: "0.8rem",
              color: "#3b82f6",
              lineHeight: 1.5,
              display: "flex",
              gap: "10px",
              alignItems: "flex-start"
            }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Defined Allowances:</strong> Leaving Seat/Room/Branch limits blank will enable <strong>Unlimited</strong> allocations on the client library workspace. Backend services strictly enforce seat desks, room caps, branch limits, and staff accounts.
              </div>
            </div>
          </div>

          {/* Right Column: Features List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h3 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Feature Checklist
            </h3>

            <div>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
                Bullet Features (One item per line)
              </label>
              <textarea
                placeholder="Single library branch with up to 50 physical seats&#10;Up to 2 rooms or floors&#10;Owner access plus 1 staff account&#10;Automated WhatsApp fee reminders"
                rows={10}
                style={{ 
                  width: "100%", 
                  padding: "12px 14px", 
                  borderRadius: "10px", 
                  border: "1px solid #cbd5e1", 
                  fontFamily: "inherit", 
                  fontSize: "0.85rem",
                  resize: "vertical",
                  outline: "none",
                  lineHeight: 1.6
                }}
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              />
            </div>

            {/* Preview visual check box */}
            <div style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Preview feature Checklist
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {formData.features.split("\n").filter(f => f.trim()).map((feat, index) => (
                  <div key={index} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.825rem", color: "#334155" }}>
                    <Check size={14} style={{ color: "#2563eb" }} />
                    <span>{feat}</span>
                  </div>
                ))}
                {!formData.features.trim() && (
                  <span style={{ color: "#94a3b8", fontSize: "0.8rem", fontStyle: "italic" }}>Start typing features to see preview...</span>
                )}
              </div>
            </div>

            {/* Actions button row */}
            <div style={{ 
              display: "flex", 
              justifyContent: "flex-end", 
              gap: "12px", 
              marginTop: "16px", 
              borderTop: "1px solid #f1f5f9", 
              paddingTop: "20px" 
            }}>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate("/super-admin/plans")}
                style={{ borderRadius: "10px" }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary" 
                disabled={isCreating || isUpdating}
                style={{ borderRadius: "10px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Save size={16} />
                {isCreating || isUpdating ? "Saving tier parameters..." : "Save Plan Settings"}
              </Button>
            </div>

          </div>

        </form>

      </div>

    </div>
  );
}
